'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/auth-context';
import { api } from '../../lib/api';

interface Subscription {
  id: string;
  keyword: string;
  type: 'PRODUCT' | 'BRAND';
  createdAt: string;
}

export default function SubscribePage() {
  const { token, isLoading } = useAuth();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [keyword, setKeyword] = useState('');
  const [type, setType] = useState<'PRODUCT' | 'BRAND'>('PRODUCT');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get<Subscription[]>('/subscriptions', token)
      .then(setSubscriptions)
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !keyword.trim()) return;
    setAdding(true);
    setError('');
    try {
      const sub = await api.post<Subscription>(
        '/subscriptions',
        { keyword: keyword.trim(), type },
        token,
      );
      setSubscriptions((prev) => [...prev, sub]);
      setKeyword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '등록에 실패했습니다.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    setDeletingId(id);
    try {
      await api.delete(`/subscriptions/${id}`, token);
      setSubscriptions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  const products = subscriptions.filter((s) => s.type === 'PRODUCT');
  const brands = subscriptions.filter((s) => s.type === 'BRAND');

  if (isLoading || loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">구독 관리</h1>
        <p className="text-gray-500 text-sm">
          식품명 또는 브랜드 키워드를 등록하면 리콜 발생 시 즉시 알림을 받을 수 있습니다.
        </p>
      </div>

      {/* 추가 폼 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold mb-4">키워드 추가</h2>
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleAdd} className="flex gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'PRODUCT' | 'BRAND')}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
          >
            <option value="PRODUCT">식품명</option>
            <option value="BRAND">브랜드</option>
          </select>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="키워드 입력 (예: 우유, 롯데)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            disabled={adding || !keyword.trim()}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
          >
            {adding ? '등록 중...' : '등록'}
          </button>
        </form>
      </div>

      {/* 구독 목록 */}
      {subscriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          아직 구독 키워드가 없습니다. 위에서 키워드를 추가하세요.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {[
            { label: '식품명', items: products },
            { label: '브랜드', items: brands },
          ]
            .filter(({ items }) => items.length > 0)
            .map(({ label, items }) => (
              <div
                key={label}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                  <h3 className="text-sm font-semibold text-gray-600">
                    {label} ({items.length})
                  </h3>
                </div>
                <ul>
                  {items.map((sub, i) => (
                    <li
                      key={sub.id}
                      className={`flex items-center justify-between px-5 py-3 ${
                        i !== 0 ? 'border-t border-gray-100' : ''
                      }`}
                    >
                      <div>
                        <span className="text-sm font-medium">{sub.keyword}</span>
                        <span className="ml-2 text-xs text-gray-400">
                          {new Date(sub.createdAt).toLocaleDateString('ko-KR')} 등록
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        disabled={deletingId === sub.id}
                        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-40 px-2 py-1 hover:bg-red-50 rounded transition"
                      >
                        {deletingId === sub.id ? '삭제 중...' : '삭제'}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
