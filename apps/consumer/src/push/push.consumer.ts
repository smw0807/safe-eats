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

      let successCount = 0;
      for (const sub of pushSubs) {
        try {
          await this.pushService.sendPushNotification(sub, event.recall);
          successCount++;
        } catch (err) {
          const e = err as { statusCode?: number };
          this.logger.warn(`[PUSH] 발송 실패: statusCode=${e.statusCode}, endpoint=${sub.endpoint.slice(0, 60)}...`);
          // 만료되거나 해제된 구독 자동 삭제
          if (e.statusCode === 410 || e.statusCode === 404) {
            await prisma.pushSubscription.deleteMany({ where: { endpoint: sub.endpoint } });
            this.logger.log(`[PUSH] 만료 구독 삭제: ${sub.endpoint.slice(0, 60)}...`);
          }
        }
      }

      await prisma.notificationLog.create({
        data: {
          userId: event.userId,
          recallId: event.recall.id,
          channel: 'PUSH',
          status: successCount > 0 ? 'SENT' : 'FAILED',
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
