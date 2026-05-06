import { Module } from '@nestjs/common';
import { EmailConsumer } from './email.consumer';
import { EmailService } from './email.service';

@Module({
  providers: [EmailConsumer, EmailService],
})
export class EmailModule {}
