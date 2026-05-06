import { Module } from '@nestjs/common';
import { PushConsumer } from './push.consumer';
import { PushService } from './push.service';

@Module({
  providers: [PushConsumer, PushService],
})
export class PushModule {}
