import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecallService } from '../recall/recall.service';
import { SubscribeService } from '../subscribe/subscribe.service';
import { NotifyService } from '../notify/notify.service';
import { v4 as uuidv4 } from 'uuid';

const MFDS_API_BASE = 'http://openapi.foodsafetykorea.go.kr/api';

@Injectable()
export class MfdsScheduler {
  private readonly logger = new Logger(MfdsScheduler.name);

  constructor(
    private readonly recallService: RecallService,
    private readonly subscribeService: SubscribeService,
    private readonly notifyService: NotifyService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async pollRecalls() {
    const startedAt = Date.now();
    this.logger.log('[POLL] 식약처 리콜 폴링 시작');

    try {
      const apiKey = process.env.MFDS_API_KEY;
      if (!apiKey) {
        this.logger.warn('[POLL] MFDS_API_KEY가 설정되지 않았습니다. 폴링을 건너뜁니다.');
        return;
      }

      const url = `${MFDS_API_BASE}/${apiKey}/I0490/json/1/100`;
      this.logger.log(`[POLL] 식약처 API 요청: ${MFDS_API_BASE}/[KEY]/I0490/json/1/100`);

      const response = await fetch(url);
      this.logger.log(`[POLL] HTTP 상태: ${response.status} ${response.statusText}`);

      const rawText = await response.text();
      if (!response.ok || rawText.trimStart().startsWith('<')) {
        this.logger.error(`[POLL] 식약처 API 오류 응답:\n${rawText.slice(0, 500)}`);
        return;
      }

      const data = JSON.parse(rawText);

      const items: Record<string, string>[] = data?.RECALL_BGYO_INFO?.row ?? [];
      this.logger.log(`[POLL] API 응답 ${items.length}건`);

      if (items.length === 0) {
        this.logger.warn('[POLL] 수신된 리콜 데이터가 없습니다.');
        return;
      }

      const recalls = items.map((item) => ({
        externalId: item.RECALL_CODE || item.PRDT_NM + item.RECALL_DE,
        productName: item.PRDT_NM || '',
        company: item.BSSH_NM || '',
        reason: item.RECALL_RESN || '',
        announcedAt: new Date(item.RECALL_DE || Date.now()),
        sourceUrl: `https://www.foodsafetykorea.go.kr`,
        rawData: item,
      }));

      const results = await this.recallService.saveRecalls(recalls);
      const failed = results.filter((r) => r.status === 'rejected');
      const saved = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      this.logger.log(`[POLL] 저장 완료 — 성공: ${saved.length}건, 실패: ${failed.length}건`);
      if (failed.length > 0) {
        failed.forEach((r) =>
          this.logger.warn(`[POLL] 저장 실패: ${(r as PromiseRejectedResult).reason}`),
        );
      }

      let totalNotified = 0;
      for (const recall of saved) {
        const subs = await this.subscribeService.findMatchingUsers(
          recall.productName,
          recall.company,
        );

        const events = subs
          .filter((s) => s.user.notificationSettings)
          .map((s) => {
            const settings = s.user.notificationSettings!;
            const channels: string[] = [];
            if (settings.emailEnabled) channels.push('email');
            if (settings.pushEnabled) channels.push('push');
            if (settings.kakaoEnabled) channels.push('kakao');

            return {
              eventId: uuidv4(),
              userId: s.userId,
              channels: channels as ('email' | 'push' | 'kakao')[],
              recall: {
                id: recall.id,
                productName: recall.productName,
                company: recall.company,
                reason: recall.reason,
                announcedAt: recall.announcedAt.toISOString(),
                sourceUrl: recall.sourceUrl,
              },
              retryCount: 0,
            };
          });

        if (events.length > 0) {
          await this.notifyService.publishRecallEvents(events);
          this.logger.log(
            `[POLL] "${recall.productName}" — 알림 발행 ${events.length}명`,
          );
          totalNotified += events.length;
        }
      }

      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      this.logger.log(
        `[POLL] 완료 — 총 알림 발행: ${totalNotified}건, 소요 시간: ${elapsed}s`,
      );
    } catch (error) {
      this.logger.error('[POLL] 폴링 중 오류 발생', error);
    }
  }
}
