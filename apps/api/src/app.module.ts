import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { RecallModule } from './recall/recall.module';
import { SubscribeModule } from './subscribe/subscribe.module';
import { NotifyModule } from './notify/notify.module';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    RecallModule,
    SubscribeModule,
    NotifyModule,
    SchedulerModule,
  ],
})
export class AppModule {}
