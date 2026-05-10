import { notFound } from 'next/navigation';
import Link from 'next/link';
import SubscriptionBanner from './SubscriptionBanner';
import ImageGallery from './ImageGallery';
import type { Recall } from '../../../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchRecall(id: string): Promise<Recall | null> {
  try {
    const res = await fetch(`${API_URL}/recalls/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-700">{value}</p>
    </div>
  );
}

const gradeColor: Record<string, string> = {
  '1등급': 'bg-red-100 text-red-700',
  '2등급': 'bg-orange-100 text-orange-700',
  '3등급': 'bg-yellow-100 text-yellow-700',
};

export default async function RecallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recall = await fetchRecall(id);

  if (!recall) notFound();

  const gradeStyle = recall.recallGrade
    ? (gradeColor[recall.recallGrade] ?? 'bg-gray-100 text-gray-600')
    : '';

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/recalls"
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
      >
        ← 목록으로
      </Link>

      <SubscriptionBanner productName={recall.productName} company={recall.company} />

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* 헤더 */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 mb-1">{recall.productName}</h1>
              <p className="text-gray-500 text-sm">{recall.company}</p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                리콜
              </span>
              {recall.recallGrade && (
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${gradeStyle}`}>
                  {recall.recallGrade}
                </span>
              )}
            </div>
          </div>

          {/* 분류 배지 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {recall.productType && (
              <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                {recall.productType}
              </span>
            )}
            {recall.productTypeName && recall.productTypeName !== recall.productType && (
              <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                {recall.productTypeName}
              </span>
            )}
          </div>
        </div>

        {/* 제품 이미지 */}
        {recall.imageUrls && recall.imageUrls.length > 0 && (
          <ImageGallery imageUrls={recall.imageUrls} productName={recall.productName} />
        )}

        {/* 상세 정보 */}
        <div className="p-6 flex flex-col gap-5">
          <InfoRow label="회수 사유" value={recall.reason} />
          <InfoRow label="회수 방법" value={recall.recallMethod} />

          <div className="grid grid-cols-2 gap-4">
            <InfoRow
              label="발표일"
              value={new Date(recall.announcedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
            {recall.createdAt && (
              <InfoRow
                label="등록일"
                value={new Date(recall.createdAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              />
            )}
            <InfoRow label="유통·소비기한" value={recall.expiryDate} />
            <InfoRow label="제조일자" value={recall.manufacturedAt} />
            <InfoRow label="포장단위" value={recall.packagingUnit} />
            <InfoRow label="바코드" value={recall.barcodeNo} />
          </div>

          <div className="border-t border-gray-100 pt-5 flex flex-col gap-4">
            <InfoRow label="업체 주소" value={recall.address} />
            <InfoRow label="전화번호" value={recall.telNo} />
            <InfoRow label="품목제조보고번호" value={recall.productReportNo} />
            <InfoRow label="업체 인허가번호" value={recall.licenseNo} />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              식약처 원문
            </p>
            <a
              href={recall.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-600 hover:underline break-all"
            >
              {recall.sourceUrl} ↗
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
