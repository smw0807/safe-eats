import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { MfdsScheduler } from '../scheduler/mfds.scheduler';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly mfdsScheduler: MfdsScheduler,
  ) {}

  @Get('dlq')
  getDlq() {
    return this.adminService.getDlqMessages();
  }

  @Post('dlq/retry')
  retryDlq(@Body() dto: { messageId: string }) {
    return this.adminService.retryDlqMessage(dto.messageId);
  }

  @Post('scheduler/poll')
  @HttpCode(202)
  triggerPoll() {
    this.mfdsScheduler.pollRecalls();
    return { message: '식약처 리콜 폴링을 시작했습니다.' };
  }
}
