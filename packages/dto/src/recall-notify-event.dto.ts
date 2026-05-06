export interface RecallNotifyEvent {
  eventId: string;
  userId: string;
  channels: ('email' | 'push' | 'kakao')[];
  recall: {
    id: string;
    productName: string;
    company: string;
    reason: string;
    announcedAt: string;
    sourceUrl: string;
  };
  retryCount: number;
}
