import { Injectable, Logger } from '@nestjs/common';
import { RecallItemData } from '../recall/recall.service';

const MFDS_API_BASE = 'http://openapi.foodsafetykorea.go.kr/api';

@Injectable()
export class MfdsApiService {
  private readonly logger = new Logger(MfdsApiService.name);

  async fetchRecallsByDate(date: string): Promise<RecallItemData[]> {
    const apiKey = process.env.MFDS_API_KEY;
    if (!apiKey) {
      this.logger.warn('[MFDS] MFDS_API_KEY가 설정되지 않았습니다.');
      return [];
    }

    const url = `${MFDS_API_BASE}/${apiKey}/I0490/json/1/500/CRET_DTM=${date}`;
    this.logger.log(`[MFDS] API 요청 (날짜: ${date})`);

    const response = await fetch(url);
    this.logger.log(`[MFDS] HTTP 상태: ${response.status} ${response.statusText}`);

    const rawText = await response.text();
    if (!response.ok || rawText.trimStart().startsWith('<')) {
      this.logger.error(`[MFDS] API 오류 응답:\n${rawText.slice(0, 500)}`);
      return [];
    }

    const data = JSON.parse(rawText) as { I0490?: { row?: Record<string, string>[] } };
    const items = data?.I0490?.row ?? [];
    this.logger.log(`[MFDS] API 응답 ${items.length}건`);

    return items.map((item) => this.mapItem(item));
  }

  private mapItem(item: Record<string, string>): RecallItemData {
    return {
      externalId: item.RTRVLDSUSE_SEQ || item.PRDLST_REPORT_NO || item.PRDTNM + item.CRET_DTM,
      productName: item.PRDTNM || '',
      company: item.BSSHNM || '',
      reason: item.RTRVLPRVNS || '',
      announcedAt: item.CRET_DTM ? new Date(item.CRET_DTM.replace(' ', 'T')) : new Date(),
      sourceUrl: 'https://www.foodsafetykorea.go.kr',
      rawData: item,
      address: item.ADDR || null,
      telNo: item.TELNO || null,
      barcodeNo: item.BRCDNO || null,
      packagingUnit: item.FRMLCUNIT || null,
      manufacturedAt: item.MNFDT !== '데이터없음' ? item.MNFDT || null : null,
      recallMethod: item.RTRVLPLANDOC_RTRVLMTHD || null,
      expiryDate: item.DISTBTMLMT || null,
      productType: item.PRDLST_TYPE || null,
      productTypeName: item.PRDLST_CD_NM || null,
      imageUrls: item.IMG_FILE_PATH
        ? item.IMG_FILE_PATH.split(',').map((u) => u.trim()).filter(Boolean)
        : [],
      recallGrade: item.RTRVL_GRDCD_NM || null,
      productReportNo: item.PRDLST_REPORT_NO || null,
      licenseNo: item.LCNS_NO || null,
    };
  }
}
