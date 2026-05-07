import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';

@Injectable()
export class PushService {
  constructor(private readonly config: ConfigService) {
    webpush.setVapidDetails(
      'mailto:' + (this.config.get('SMTP_USER') || 'admin@safeeats.com'),
      this.config.getOrThrow('VAPID_PUBLIC_KEY'),
      this.config.getOrThrow('VAPID_PRIVATE_KEY'),
    );
  }
  async sendPushNotification(
    subscription: { endpoint: string; p256dh: string; auth: string },
    recall: { productName: string; company: string; reason: string },
  ) {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      },
      JSON.stringify({
        title: `[SafeEats] 리콜: ${recall.productName}`,
        body: `${recall.company} - ${recall.reason}`,
      }),
    );
  }
}
