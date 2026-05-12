import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotifyController } from './notify.controller';
import { NotifyService } from './notify.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'RABBITMQ_SERVICE',
        useFactory: () => ({
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
            queue: 'recall.email.queue',
            queueOptions: {
              durable: true,
              arguments: { 'x-dead-letter-exchange': 'dlx.exchange' },
            },
            exchange: 'recall.exchange',
            exchangeType: 'direct',
          },
        }),
      },
    ]),
  ],
  controllers: [NotifyController],
  providers: [NotifyService],
  exports: [NotifyService],
})
export class NotifyModule {}
