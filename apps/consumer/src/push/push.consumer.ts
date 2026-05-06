import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RecallNotifyEvent } from '@safe-eats/dto';
import { PushService } from './push.service';
import { prisma } from '@safe-eats/database';

@Controller()
export class PushConsumer {
  private readonly logger = new Logger(PushConsumer.name);

  constructor(private readonly pushService: PushService) {}

  @EventPattern('recall.push')
  async handleRecallPush(@Payload() event: RecallNotifyEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      const pushSubs = await prisma.pushSubscription.findMany({
        where: { userId: event.userId },
      });

      await Promise.all(
        pushSubs.map((sub) => this.pushService.sendPushNotification(sub, event.recall)),
      );

      await prisma.notificationLog.create({
        data: {
          userId: event.userId,
          recallId: event.recall.id,
          channel: 'PUSH',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      channel.ack(message);
    } catch (error) {
      this.logger.error('웹 푸시 발송 실패', error);
      channel.nack(message, false, event.retryCount < 3);
    }
  }
}
