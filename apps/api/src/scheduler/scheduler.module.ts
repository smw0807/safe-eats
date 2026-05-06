import { Module } from '@nestjs/common';
import { RecallModule } from '../recall/recall.module';
import { SubscribeModule } from '../subscribe/subscribe.module';
import { NotifyModule } from '../notify/notify.module';
import { MfdsScheduler } from './mfds.scheduler';

@Module({
  imports: [RecallModule, SubscribeModule, NotifyModule],
  providers: [MfdsScheduler],
})
export class SchedulerModule {}
