import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { RecallNotifyEvent } from '@safe-eats/dto';
import { KakaoService } from './kakao.service';
import { prisma } from '@safe-eats/database';

@Controller()
export class KakaoConsumer {
  private readonly logger = new Logger(KakaoConsumer.name);

  constructor(private readonly kakaoService: KakaoService) {}

  @EventPattern('recall.kakao')
  async handleRecallKakao(@Payload() event: RecallNotifyEvent, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const message = context.getMessage();

    try {
      const settings = await prisma.notificationSetting.findUnique({
        where: { userId: event.userId },
      });

      if (!settings?.kakaoPhone) {
        channel.ack(message);
        return;
      }

      await this.kakaoService.sendAlimtalk(settings.kakaoPhone, event.recall);

      await prisma.notificationLog.create({
        data: {
          userId: event.userId,
          recallId: event.recall.id,
          channel: 'KAKAO',
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      channel.ack(message);
    } catch (error) {
      this.logger.error('카카오 알림톡 발송 실패', error);
      channel.nack(message, false, event.retryCount < 3);
    }
  }
}
