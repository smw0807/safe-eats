import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Recall } from '@safe-eats/database';
import { v4 as uuidv4 } from 'uuid';
import { RecallService } from '../recall/recall.service';
import { SubscribeService } from '../subscribe/subscribe.service';
import { NotifyService } from '../notify/notify.service';
import { MfdsApiService } from './mfds-api.service';

@Injectable()
export class MfdsScheduler {
  private readonly logger = new Logger(MfdsScheduler.name);

  constructor(
    private readonly recallService: RecallService,
    private readonly subscribeService: SubscribeService,
    private readonly notifyService: NotifyService,
    private readonly mfdsApiService: MfdsApiService,
  ) {}

  @Cron(CronExpression.EVERY_6_HOURS)
  async pollRecalls() {
    const startedAt = Date.now();
    this.logger.log('[POLL] 식약처 리콜 폴링 시작');

    try {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const recalls = await this.mfdsApiService.fetchRecallsByDate(today);

      if (recalls.length === 0) {
        this.logger.warn('[POLL] 수신된 리콜 데이터가 없습니다.');
        return;
      }

      const results = await this.recallService.saveRecalls(recalls);
      const failed = results.filter((r) => r.status === 'rejected');
      const saved = results
        .filter((r): r is PromiseFulfilledResult<Recall> => r.status === 'fulfilled')
        .map((r) => r.value);

      const pollStartedAt = new Date(startedAt);
      const newRecalls = saved.filter((r) => new Date(r.createdAt) >= pollStartedAt);

      this.logger.log(
        `[POLL] 저장 완료 — 성공: ${saved.length}건, 실패: ${failed.length}건, 신규: ${newRecalls.length}건`,
      );
      failed.forEach((r) =>
        this.logger.warn(`[POLL] 저장 실패: ${(r as PromiseRejectedResult).reason}`),
      );

      let totalNotified = 0;
      for (const recall of newRecalls) {
        const subs = await this.subscribeService.findMatchingUsers(
          recall.productName,
          recall.company,
        );

        const events = subs
          .filter((s) => s.user.notificationSettings)
          .map((s) => {
            const settings = s.user.notificationSettings!;
            const channels: ('email' | 'push' | 'kakao')[] = [];
            if (settings.emailEnabled) channels.push('email');
            if (settings.pushEnabled) channels.push('push');
            if (settings.kakaoEnabled) channels.push('kakao');

            return {
              eventId: uuidv4(),
              userId: s.userId,
              channels,
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
          this.logger.log(`[POLL] "${recall.productName}" — 알림 발행 ${events.length}명`);
          totalNotified += events.length;
        }
      }

      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      this.logger.log(`[POLL] 완료 — 총 알림 발행: ${totalNotified}건, 소요 시간: ${elapsed}s`);
    } catch (error) {
      this.logger.error('[POLL] 폴링 중 오류 발생', error);
    }
  }
}
