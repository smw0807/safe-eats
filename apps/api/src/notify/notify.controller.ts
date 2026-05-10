import { Body, Controller, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotifyService } from './notify.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateNotificationSettingDto } from './dto/update-notification-setting.dto';
import { CreatePushSubscriptionDto } from './dto/create-push-subscription.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class NotifyController {
  constructor(private readonly notifyService: NotifyService) {}

  @Get('notifications/settings')
  getSettings(@CurrentUser() user: { id: string }) {
    return this.notifyService.getSettings(user.id);
  }

  @Patch('notifications/settings')
  updateSettings(@CurrentUser() user: { id: string }, @Body() dto: UpdateNotificationSettingDto) {
    return this.notifyService.updateSettings(user.id, dto);
  }

  @Post('push/subscribe')
  subscribePush(@CurrentUser() user: { id: string }, @Body() dto: CreatePushSubscriptionDto) {
    return this.notifyService.subscribePush(user.id, dto);
  }

  @Get('push/status')
  @ApiOperation({ summary: '웹 푸시 구독 상태 확인' })
  getPushStatus(@CurrentUser() user: { id: string }) {
    return this.notifyService.getPushStatus(user.id);
  }

  @Post('push/test')
  @HttpCode(200)
  @ApiOperation({ summary: '웹 푸시 테스트 알림 발송' })
  sendTestPush(@CurrentUser() user: { id: string }) {
    return this.notifyService.sendTestPush(user.id);
  }

  @Post('email/test')
  @HttpCode(200)
  @ApiOperation({ summary: '이메일 테스트 발송' })
  sendTestEmail(@CurrentUser() user: { id: string }) {
    return this.notifyService.sendTestEmail(user.id);
  }

  @Post('kakao/test')
  @HttpCode(200)
  @ApiOperation({ summary: '카카오 알림톡 테스트 발송' })
  sendTestKakao(@CurrentUser() user: { id: string }) {
    return this.notifyService.sendTestKakao(user.id);
  }
}
