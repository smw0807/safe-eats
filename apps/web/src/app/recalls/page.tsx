'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface Recall {
  id: string;
  productName: string;
  company: string;
  reason: string;
  announcedAt: string;
  sourceUrl: string;
}

interface RecallsResponse {
  recalls: Recall[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const LIMIT = 20;

export default function RecallsPage() {
  const [recalls, setRecalls] = useState<Recall[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: number, kw: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (kw) params.set('keyword', kw);
      const res = await api.get<RecallsResponse>(`/recalls?${params}`);
      setRecalls(res.recalls);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch {
      setRecalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(page, search);
  }, [page, search, load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(keyword);
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">리콜 목록</h1>
        <p className="text-gray-500 text-sm">식약처 식품 회수·판매중지 정보를 확인하세요.</p>
      </div>

      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="식품명, 제조사, 회수 사유 검색..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition"
        >
          검색
        </button>
        {search && (
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setSearch('');
              setPage(1);
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            초기화
          </button>
        )}
      </form>

      {/* 결과 수 */}
      <p className="text-sm text-gray-500 mb-4">
        {search ? `"${search}" 검색 결과 ` : ''}총 {total.toLocaleString()}건
      </p>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      ) : recalls.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          {search ? '검색 결과가 없습니다.' : '리콜 정보가 없습니다.'}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {recalls.map((recall, i) => (
            <Link
              key={recall.id}
              href={`/recalls/${recall.id}`}
              className={`flex items-start justify-between p-4 hover:bg-gray-50 transition ${
                i !== 0 ? 'border-t border-gray-100' : ''
              }`}
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{recall.productName}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {recall.company}
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{recall.reason}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-gray-400">
                  {new Date(recall.announcedAt).toLocaleDateString('ko-KR')}
                </p>
                <p className="text-xs text-green-600 mt-1">상세 보기 →</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            이전
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, totalPages - 4));
            const p = start + i;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1.5 text-sm border rounded-lg transition ${
                  p === page
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            다음
          </button>
        </div>
      )}
    </main>
  );
}
