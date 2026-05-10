import { Module } from '@nestjs/common';
import { RecallModule } from '../recall/recall.module';
import { SubscribeModule } from '../subscribe/subscribe.module';
import { NotifyModule } from '../notify/notify.module';
import { MfdsScheduler } from './mfds.scheduler';
import { MfdsApiService } from './mfds-api.service';

@Module({
  imports: [RecallModule, SubscribeModule, NotifyModule],
  providers: [MfdsScheduler, MfdsApiService],
  exports: [MfdsScheduler],
})
export class SchedulerModule {}
