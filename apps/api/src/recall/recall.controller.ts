import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RecallService } from './recall.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('recalls')
@Controller('recalls')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get()
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('keyword') keyword?: string,
  ) {
    return this.recallService.findAll({ page: +page, limit: +limit, keyword });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recallService.findOne(id);
  }
}
