import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  updateSettings(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateNotificationSettingDto,
  ) {
    return this.notifyService.updateSettings(user.id, dto);
  }

  @Post('push/subscribe')
  subscribePush(
    @CurrentUser() user: { id: string },
    @Body() dto: CreatePushSubscriptionDto,
  ) {
    return this.notifyService.subscribePush(user.id, dto);
  }
}
