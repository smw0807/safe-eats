import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Recall } from '@safe-eats/database';
import { RecallService, FindAllResult } from './recall.service';
import { GetRecallsQueryDto } from './dto/get-recalls-query.dto';

@ApiTags('recalls')
@Controller('recalls')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get()
  findAll(@Query() query: GetRecallsQueryDto): Promise<FindAllResult> {
    return this.recallService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Recall> {
    return this.recallService.findOne(id);
  }
}
