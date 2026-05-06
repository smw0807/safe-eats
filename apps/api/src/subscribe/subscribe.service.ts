import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { prisma } from '@safe-eats/database';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscribeService {
  async findAll(userId: string) {
    return prisma.subscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
  }

  async create(userId: string, dto: CreateSubscriptionDto) {
    return prisma.subscription.create({
      data: { userId, keyword: dto.keyword, type: dto.type },
    });
  }

  async remove(userId: string, id: string) {
    const sub = await prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('구독 정보를 찾을 수 없습니다.');
    if (sub.userId !== userId) throw new ForbiddenException();
    return prisma.subscription.delete({ where: { id } });
  }

  async findMatchingUsers(productName: string, company: string) {
    return prisma.subscription.findMany({
      where: {
        OR: [
          { keyword: { contains: productName, mode: 'insensitive' }, type: 'PRODUCT' },
          { keyword: { contains: company, mode: 'insensitive' }, type: 'BRAND' },
        ],
      },
      include: { user: { include: { notificationSettings: true } } },
    });
  }
}
