import { Module } from '@nestjs/common';
import { EmailConsumer } from './email.consumer';
import { EmailService } from './email.service';

@Module({
  controllers: [EmailConsumer],
  providers: [EmailService],
})
export class EmailModule {}
