import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { NotifyModule } from '../notify/notify.module';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [NotifyModule, SchedulerModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
