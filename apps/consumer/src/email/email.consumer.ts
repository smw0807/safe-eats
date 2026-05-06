import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RecallNotifyEvent } from '@safe-eats/dto';
import { EmailService } from './email.service';
import { prisma } from '@safe-eats/database';

@Controller()
export class EmailConsumer {
  private readonly logger = new Logger(EmailConsumer.name);

  constructor(private readonly emailService: EmailService) {}

  @EventPattern('recall.email')
  async handleRecallEmail(@Payload() event: RecallNotifyEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      const user = await prisma.user.findUnique({ where: { id: event.userId } });
      if (!user?.email) {
        channel.ack(message);
        return;
      }

      await this.emailService.sendRecallAlert(user.email, event.recall);

      await prisma.notificationLog.create({
        data: {
          userId: event.userId,
          recallId: event.recall.id,
          channel: 'EMAIL',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      channel.ack(message);
      this.logger.log(`이메일 발송 완료: ${user.email}`);
    } catch (error) {
      this.logger.error('이메일 발송 실패', error);

      await prisma.notificationLog.create({
        data: {
          userId: event.userId,
          recallId: event.recall.id,
          channel: 'EMAIL',
          status: 'FAILED',
          errorMsg: String(error),
        },
      });

      channel.nack(message, false, event.retryCount < 3);
    }
  }
}
