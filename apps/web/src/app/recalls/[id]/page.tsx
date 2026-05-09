import { notFound } from 'next/navigation';
import Link from 'next/link';
import SubscriptionBanner from './SubscriptionBanner';
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

export default async function RecallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recall = await fetchRecall(id);

  if (!recall) notFound();

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
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">{recall.productName}</h1>
              <p className="text-gray-500 text-sm">{recall.company}</p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-medium rounded-full shrink-0">
              리콜
            </span>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
              회수 사유
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{recall.reason}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                발표일
              </p>
              <p className="text-sm text-gray-700">
                {new Date(recall.announcedAt).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            {recall.createdAt && (
              <div>
                <p className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  등록일
                </p>
                <p className="text-sm text-gray-700">
                  {new Date(recall.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          <div>
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
