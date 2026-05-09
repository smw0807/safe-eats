import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma, Recall } from '@safe-eats/database';

interface FindAllOptions {
  page: number;
  limit: number;
  keyword?: string;
}

interface FindAllResult {
  recalls: Recall[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class RecallService {
  async findAll({ page, limit, keyword }: FindAllOptions): Promise<FindAllResult> {
    const skip = (page - 1) * limit;
    const where = keyword
      ? {
        OR: [
          { productName: { contains: keyword, mode: 'insensitive' as const } },
          { company: { contains: keyword, mode: 'insensitive' as const } },
          { reason: { contains: keyword, mode: 'insensitive' as const } },
        ],
      }
      : {};

    const [recalls, total] = await Promise.all([
      prisma.recall.findMany({ where, skip, take: limit, orderBy: { announcedAt: 'desc' } }),
      prisma.recall.count({ where }),
    ]);

    return { recalls, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Recall> {
    const recall = await prisma.recall.findUnique({ where: { id } });
    if (!recall) throw new NotFoundException('리콜 정보를 찾을 수 없습니다.');
    return recall;
  }

  async saveRecalls(
    data: Array<{
      externalId: string;
      productName: string;
      company: string;
      reason: string;
      announcedAt: Date;
      sourceUrl: string;
      rawData: object;
    }>,
  ): Promise<PromiseSettledResult<Recall>[]> {
    const results = await Promise.allSettled(
      data.map((item) =>
        prisma.recall.upsert({
          where: { externalId: item.externalId },
          update: {},
          create: item,
        }),
      ),
    );
    return results;
  }
}
