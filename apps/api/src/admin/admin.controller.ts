import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dlq')
  getDlq() {
    return this.adminService.getDlqMessages();
  }

  @Post('dlq/retry')
  retryDlq(@Body() dto: { messageId: string }) {
    return this.adminService.retryDlqMessage(dto.messageId);
  }
}
