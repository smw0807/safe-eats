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

      // 당일 등록 데이터만 조회 (CRET_DTM 필터)
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
      const url = `${MFDS_API_BASE}/${apiKey}/I0490/json/1/500/CRET_DTM=${today}`;
      this.logger.log(`[POLL] 식약처 API 요청 (날짜: ${today})`);

      const response = await fetch(url);
      this.logger.log(`[POLL] HTTP 상태: ${response.status} ${response.statusText}`);

      const rawText = await response.text();
      if (!response.ok || rawText.trimStart().startsWith('<')) {
        this.logger.error(`[POLL] 식약처 API 오류 응답:\n${rawText.slice(0, 500)}`);
        return;
      }

      const data = JSON.parse(rawText);

      const items: Record<string, string>[] = data?.I0490?.row ?? [];
      this.logger.log(`[POLL] API 응답 ${items.length}건`);

      if (items.length === 0) {
        this.logger.warn('[POLL] 수신된 리콜 데이터가 없습니다.');
        return;
      }

      const recalls = items.map((item) => ({
        externalId: item.RTRVLDSUSE_SEQ || item.PRDLST_REPORT_NO || item.PRDTNM + item.CRET_DTM,
        productName: item.PRDTNM || '',
        company: item.BSSHNM || '',
        reason: item.RTRVLPRVNS || '',
        announcedAt: item.CRET_DTM ? new Date(item.CRET_DTM.replace(' ', 'T')) : new Date(),
        sourceUrl: `https://www.foodsafetykorea.go.kr`,
        rawData: item,
        address: item.ADDR || null,
        telNo: item.TELNO || null,
        barcodeNo: item.BRCDNO || null,
        packagingUnit: item.FRMLCUNIT || null,
        manufacturedAt: item.MNFDT !== '데이터없음' ? item.MNFDT || null : null,
        recallMethod: item.RTRVLPLANDOC_RTRVLMTHD || null,
        expiryDate: item.DISTBTMLMT || null,
        productType: item.PRDLST_TYPE || null,
        productTypeName: item.PRDLST_CD_NM || null,
        imageUrls: item.IMG_FILE_PATH
          ? item.IMG_FILE_PATH.split(',').map((u: string) => u.trim()).filter(Boolean)
          : [],
        recallGrade: item.RTRVL_GRDCD_NM || null,
        productReportNo: item.PRDLST_REPORT_NO || null,
        licenseNo: item.LCNS_NO || null,
      }));

      const results = await this.recallService.saveRecalls(recalls);
      const failed = results.filter((r) => r.status === 'rejected');
      const saved = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      // 이번 폴링 시작 이후 신규 저장된 레코드만 알림 대상
      const pollStartedAt = new Date(startedAt);
      const newRecalls = saved.filter((r) => new Date(r.createdAt) >= pollStartedAt);

      this.logger.log(
        `[POLL] 저장 완료 — 성공: ${saved.length}건, 실패: ${failed.length}건, 신규: ${newRecalls.length}건`,
      );
      if (failed.length > 0) {
        failed.forEach((r) =>
          this.logger.warn(`[POLL] 저장 실패: ${(r as PromiseRejectedResult).reason}`),
        );
      }

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
