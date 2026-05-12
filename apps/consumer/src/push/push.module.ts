import { Module } from '@nestjs/common';
import { PushConsumer } from './push.consumer';
import { PushService } from './push.service';

@Module({
  controllers: [PushConsumer],
  providers: [PushService],
})
export class PushModule {}
