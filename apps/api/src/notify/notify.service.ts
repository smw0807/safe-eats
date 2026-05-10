import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as webpush from 'web-push';
import { prisma } from '@safe-eats/database';
import { RecallNotifyEvent } from '@safe-eats/dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';

@Injectable()
export class NotifyService implements OnModuleInit {
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
    return prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: { p256dh: dto.p256dh, auth: dto.auth },
      create: { userId, ...dto },
    });
  }

  async sendTestPush(userId: string) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) {
      throw new NotFoundException(
        '등록된 웹 푸시 구독이 없습니다. 먼저 웹 푸시 알림을 활성화해주세요.',
      );
    }

    await Promise.all(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: '[SafeEats] 테스트 알림',
            body: '웹 푸시 알림이 정상적으로 작동합니다!',
            url: '/recalls',
          }),
        ),
      ),
    );

    return { success: true, count: subs.length };
  }

  async publishRecallEvents(events: RecallNotifyEvent[]) {
    for (const event of events) {
      for (const channel of event.channels) {
        this.client.emit(`recall.${channel}`, event);
      }
    }
  }
}
