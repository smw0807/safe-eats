'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { useAuth } from '../../../contexts/auth-context';

interface Recall {
  id: string;
  productName: string;
  company: string;
  reason: string;
  announcedAt: string;
  sourceUrl: string;
  createdAt: string;
}

interface Subscription {
  id: string;
  keyword: string;
  type: 'PRODUCT' | 'BRAND';
}

export default function RecallDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [recall, setRecall] = useState<Recall | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [recallRes] = await Promise.all([api.get<Recall>(`/recalls/${params.id}`)]);
        setRecall(recallRes);

        if (token) {
          const subs = await api.get<Subscription[]>('/subscriptions', token);
          setSubscriptions(subs);
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id, token]);

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      </main>
    );
  }

  if (notFound || !recall) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8 text-center">
        <p className="text-gray-500 mb-4">리콜 정보를 찾을 수 없습니다.</p>
        <button onClick={() => router.back()} className="text-green-600 hover:underline text-sm">
          ← 돌아가기
        </button>
      </main>
    );
  }

  // 구독 키워드 매칭 (로그인한 경우)
  const matched = subscriptions.filter(
    (sub) => recall.productName.includes(sub.keyword) || recall.company.includes(sub.keyword),
  );

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1"
      >
        ← 목록으로
      </button>

      {/* 내 구독 키워드 매칭 배너 */}
      {matched.length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <p className="text-sm text-orange-700 font-medium">
            ⚠️ 내 구독 키워드와 일치합니다: {matched.map((m) => m.keyword).join(', ')}
          </p>
        </div>
      )}

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

      {/* 로그인 유도 (미로그인 시) */}
      {!token && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-center text-green-700">
          <Link href="/login" className="font-medium hover:underline">
            로그인
          </Link>
          하면 이 제품이 내 구독 키워드와 일치하는지 확인할 수 있습니다.
        </div>
      )}
    </main>
  );
}
