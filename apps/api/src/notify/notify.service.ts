import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { prisma } from '@safe-eats/database';
import { RecallNotifyEvent } from '@safe-eats/dto';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';

@Injectable()
export class NotifyService {
  constructor(@Inject('RABBITMQ_SERVICE') private readonly client: ClientProxy) {}

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

  async publishRecallEvents(events: RecallNotifyEvent[]) {
    for (const event of events) {
      for (const channel of event.channels) {
        this.client.emit(`recall.${channel}`, event);
      }
    }
  }
}
