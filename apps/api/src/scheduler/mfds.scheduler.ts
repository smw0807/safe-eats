import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RecallService } from '../recall/recall.service';
import { SubscribeService } from '../subscribe/subscribe.service';
import { NotifyService } from '../notify/notify.service';
import { v4 as uuidv4 } from 'uuid';

const MFDS_API_BASE = 'https://openapi.foodsafetykorea.go.kr/api';

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
    this.logger.log('식약처 리콜 데이터 폴링 시작');
    try {
      const apiKey = process.env.MFDS_API_KEY;
      if (!apiKey) {
        this.logger.warn('MFDS_API_KEY가 설정되지 않았습니다.');
        return;
      }

      const url = `${MFDS_API_BASE}/${apiKey}/RECALL_BGYO_INFO/json/1/100`;
      const response = await fetch(url);
      const data = await response.json();

      const items = data?.RECALL_BGYO_INFO?.row ?? [];
      if (items.length === 0) return;

      const recalls = items.map((item: Record<string, string>) => ({
        externalId: item.RECALL_CODE || item.PRDT_NM + item.RECALL_DE,
        productName: item.PRDT_NM || '',
        company: item.BSSH_NM || '',
        reason: item.RECALL_RESN || '',
        announcedAt: new Date(item.RECALL_DE || Date.now()),
        sourceUrl: `https://www.foodsafetykorea.go.kr`,
        rawData: item,
      }));

      const results = await this.recallService.saveRecalls(recalls);
      const newRecalls = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      this.logger.log(`${newRecalls.length}개 신규 리콜 저장`);

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

        await this.notifyService.publishRecallEvents(events);
      }
    } catch (error) {
      this.logger.error('폴링 실패', error);
    }
  }
}
