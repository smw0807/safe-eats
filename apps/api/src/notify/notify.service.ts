import { Inject, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as webpush from 'web-push';
import { prisma } from '@safe-eats/database';
import { RecallNotifyEvent } from '@safe-eats/dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';

interface WebPushError {
  statusCode?: number;
  body?: string;
  message?: string;
}

@Injectable()
export class NotifyService implements OnModuleInit {
  private readonly logger = new Logger(NotifyService.name);

  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

  onModuleInit() {
    webpush.setVapidDetails(
      'mailto:' + (process.env.SMTP_USER || 'admin@safeeats.com'),
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  }

  async getSettings(userId: string) {
    return prisma.notificationSetting.findUnique({ where: { userId } });
  }

  async updateSettings(userId: string, dto: UpdateNotificationSettingDto) {
    return prisma.notificationSetting.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  async subscribePush(userId: string, dto: CreatePushSubscriptionDto) {
    const result = await prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { p256dh: dto.p256dh, auth: dto.auth },
      create: { userId, ...dto },
    });
    this.logger.log(`[PUSH] 구독 저장 완료: userId=${userId}`);
    return result;
  }

  async getPushStatus(userId: string) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    return { count: subs.length, endpoints: subs.map((s) => s.endpoint.slice(0, 60) + '...') };
  }

  async sendTestPush(userId: string) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    this.logger.log(`[PUSH TEST] userId=${userId}, 구독 수=${subs.length}`);

    if (subs.length === 0) {
      throw new NotFoundException(
        '등록된 웹 푸시 구독이 없습니다. 먼저 웹 푸시 알림을 활성화해주세요.',
      );
    }

    let successCount = 0;
    for (const sub of subs) {
      try {
        const res = await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: '[SafeEats] 테스트 알림',
            body: '웹 푸시 알림이 정상적으로 작동합니다!',
            url: '/recalls',
          }),
        );
        this.logger.log(`[PUSH TEST] 발송 성공: statusCode=${res.statusCode}`);
        successCount++;
      } catch (err) {
        const e = err as WebPushError;
        this.logger.error(`[PUSH TEST] 발송 실패: statusCode=${e.statusCode}, body=${e.body ?? e.message}`);
        // 만료되거나 해제된 구독은 DB에서 삭제
        if (e.statusCode === 410 || e.statusCode === 404) {
          await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
          this.logger.log(`[PUSH TEST] 만료 구독 삭제: ${sub.endpoint.slice(0, 60)}...`);
        }
      }
    }

    if (successCount === 0) {
      throw new Error('유효한 구독이 없습니다. 웹 푸시를 OFF 후 다시 ON 해주세요.');
    }

    return { success: true, count: successCount };
  }

  async publishRecallEvents(events: RecallNotifyEvent[]) {
    for (const event of events) {
      for (const channel of event.channels) {
        this.client.emit(`recall.${channel}`, event);
      }
    }
  }
}
