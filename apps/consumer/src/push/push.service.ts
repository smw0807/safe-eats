import { Injectable } from '@nestjs/common';
import * as webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:' + (process.env.SMTP_USER || 'admin@safeeats.com'),
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || '',
);

@Injectable()
export class PushService {
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
