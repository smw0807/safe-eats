'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { api } from '../../lib/api';
import type { Recall, Subscription, NotificationSettings } from '../../types';

export default function DashboardPage() {
  const { token, user, isLoading } = useRequireAuth();

  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const [recallsRes, subsRes, settingsRes] = await Promise.all([
          api.get<{ recalls: Recall[] }>('/recalls?limit=3'),
          api.get<Subscription[]>('/subscriptions', token),
          api.get<NotificationSettings>('/notifications/settings', token),
        ]);
        setRecalls(recallsRes.recalls);
        setSubscriptions(subsRes);
        setSettings(settingsRes);
      } catch {
        // ignore load errors
      } finally {
        setDataLoading(false);
      }
    };

    load();
  }, [token]);

  if (isLoading || dataLoading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-gray-400 text-center py-20">불러오는 중...</div>
      </main>
    );
  }

  if (!user) return null;

  const activeChannels = settings
    ? [
        settings.emailEnabled && '이메일',
        settings.pushEnabled && '웹 푸시',
        settings.kakaoEnabled && '카카오 알림톡',
      ].filter(Boolean)
    : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-gray-500 mt-1">안녕하세요, {user.email}님</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">구독 키워드</p>
          <p className="text-3xl font-bold text-green-600">{subscriptions.length}</p>
          <Link href="/subscribe" className="text-xs text-green-600 hover:underline mt-1 block">
            관리하기 →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">활성 알림 채널</p>
          <p className="text-3xl font-bold text-blue-600">{activeChannels.length}</p>
          <Link
            href="/settings/notifications"
            className="text-xs text-blue-600 hover:underline mt-1 block"
          >
            설정하기 →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm text-gray-500 mb-1">최신 리콜</p>
          <p className="text-3xl font-bold text-orange-500">{recalls.length}</p>
          <Link href="/recalls" className="text-xs text-orange-500 hover:underline mt-1 block">
            전체 보기 →
          </Link>
        </div>
      </div>

      {/* 활성 알림 채널 */}
      {settings && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <h2 className="font-semibold mb-3">알림 채널 상태</h2>
          <div className="flex gap-3">
            {[
              { label: '이메일', enabled: settings.emailEnabled },
              { label: '웹 푸시', enabled: settings.pushEnabled },
              { label: '카카오 알림톡', enabled: settings.kakaoEnabled },
            ].map(({ label, enabled }) => (
              <span
                key={label}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                }`}
              >
                {enabled ? '✓ ' : ''}
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 내 구독 키워드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">내 구독 키워드</h2>
          <Link href="/subscribe" className="text-sm text-green-600 hover:underline">
            + 추가
          </Link>
        </div>
        {subscriptions.length === 0 ? (
          <p className="text-gray-400 text-sm">
            아직 구독 키워드가 없습니다.{' '}
            <Link href="/subscribe" className="text-green-600 hover:underline">
              등록하러 가기
            </Link>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => (
              <span
                key={sub.id}
                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700"
              >
                {sub.keyword}
                <span className="ml-1 text-xs text-gray-400">
                  {sub.type === 'PRODUCT' ? '식품' : '브랜드'}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 최신 리콜 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">최신 리콜 현황</h2>
          <Link href="/recalls" className="text-sm text-green-600 hover:underline">
            전체 보기
          </Link>
        </div>
        {recalls.length === 0 ? (
          <p className="text-gray-400 text-sm">리콜 정보가 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recalls.map((recall) => (
              <Link
                key={recall.id}
                href={`/recalls/${recall.id}`}
                className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-100 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{recall.productName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{recall.company}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{recall.reason}</p>
                </div>
                <span className="text-xs text-gray-400 ml-3 shrink-0">
                  {new Date(recall.announcedAt).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
