import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class KakaoService {
  private readonly logger = new Logger(KakaoService.name);

  async sendAlimtalk(
    phone: string,
    recall: { productName: string; company: string; reason: string; sourceUrl: string },
  ) {
    const apiKey = process.env.KAKAO_API_KEY;
    if (!apiKey) {
      this.logger.warn('KAKAO_API_KEY가 설정되지 않았습니다.');
      return;
    }

    // 카카오 비즈메시지 API 연동 (템플릿 코드는 카카오 비즈 콘솔에서 발급)
    const response = await fetch('https://bizmessage.kakao.com/v2/api/talk/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `KakaoAK ${apiKey}`,
      },
      body: JSON.stringify({
        receiver_uids: [phone],
        template_code: 'RECALL_ALERT',
        template_args: {
          product_name: recall.productName,
          company: recall.company,
          reason: recall.reason,
          source_url: recall.sourceUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`카카오 API 오류: ${response.status}`);
    }
  }
}
