import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@safe-eats/database';
import { NotifyService } from '../notify/notify.service';
import { v4 as uuidv4 } from 'uuid';

const channelMap: Record<string, 'email' | 'push' | 'kakao'> = {
  EMAIL: 'email',
  PUSH: 'push',
  KAKAO: 'kakao',
};

@Injectable()
export class AdminService {
  constructor(private readonly notifyService: NotifyService) {}

  async getDlqMessages() {
    return prisma.notificationLog.findMany({
      where: { status: 'FAILED' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async retryDlqMessage(messageId: string) {
    const log = await prisma.notificationLog.findUnique({ where: { id: messageId } });
    if (!log) throw new NotFoundException('메시지를 찾을 수 없습니다.');

    const recall = await prisma.recall.findUnique({ where: { id: log.recallId } });
    if (!recall) throw new NotFoundException('리콜 정보를 찾을 수 없습니다.');

    const channel = channelMap[log.channel];
    if (!channel) throw new NotFoundException('알 수 없는 채널입니다.');

    await this.notifyService.publishRecallEvents([
      {
        eventId: uuidv4(),
        userId: log.userId,
        channels: [channel],
        recall: {
          id: recall.id,
          productName: recall.productName,
          company: recall.company,
          reason: recall.reason,
          announcedAt: recall.announcedAt.toISOString(),
          sourceUrl: recall.sourceUrl,
        },
        retryCount: 0,
      },
    ]);

    await prisma.notificationLog.update({
      where: { id: messageId },
      data: { status: 'PENDING', errorMsg: null },
    });

    return { success: true };
  }
}
