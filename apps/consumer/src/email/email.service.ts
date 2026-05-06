import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendRecallAlert(
    to: string,
    recall: {
      productName: string;
      company: string;
      reason: string;
      announcedAt: string;
      sourceUrl: string;
    },
  ) {
    await this.transporter.sendMail({
      from: `"SafeEats 알림" <${process.env.SMTP_USER}>`,
      to,
      subject: `[SafeEats] 리콜 알림: ${recall.productName}`,
      html: `
        <h2>식품 리콜 알림</h2>
        <p><strong>제품명:</strong> ${recall.productName}</p>
        <p><strong>제조사:</strong> ${recall.company}</p>
        <p><strong>회수 사유:</strong> ${recall.reason}</p>
        <p><strong>발표일:</strong> ${new Date(recall.announcedAt).toLocaleDateString('ko-KR')}</p>
        <p><a href="${recall.sourceUrl}">식약처 원문 보기</a></p>
        <hr>
        <p style="color:#666;font-size:12px">SafeEats - 식품 안전 리콜 모니터링 서비스</p>
      `,
    });
  }
}
