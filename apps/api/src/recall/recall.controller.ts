import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RecallService } from './recall.service';
import { GetRecallsQueryDto } from './dto/get-recalls-query.dto';

@ApiTags('recalls')
@Controller('recalls')
export class RecallController {
  constructor(private readonly recallService: RecallService) {}

  @Get()
  findAll(@Query() query: GetRecallsQueryDto) {
    return this.recallService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.recallService.findOne(id);
  }
}
