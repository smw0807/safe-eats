export interface Recall {
  id: string;
  productName: string;
  company: string;
  reason: string;
  announcedAt: string;
  sourceUrl: string;
  createdAt?: string;
  address?: string | null;
  telNo?: string | null;
  barcodeNo?: string | null;
  packagingUnit?: string | null;
  manufacturedAt?: string | null;
  recallMethod?: string | null;
  expiryDate?: string | null;
  productType?: string | null;
  productTypeName?: string | null;
  imageUrls?: string[];
  recallGrade?: string | null;
  productReportNo?: string | null;
  licenseNo?: string | null;
}

export interface RecallsResponse {
  recalls: Recall[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Subscription {
  id: string;
  keyword: string;
  type: 'PRODUCT' | 'BRAND';
  createdAt: string;
}

export interface NotificationSettings {
  id?: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  kakaoEnabled: boolean;
  kakaoPhone?: string | null;
}
