export interface Recall {
  id: string;
  productName: string;
  company: string;
  reason: string;
  announcedAt: string;
  sourceUrl: string;
  createdAt?: string;
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
