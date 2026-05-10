'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import type { Recall, RecallsResponse } from '../../types';

interface Props {
  initialData: RecallsResponse;
  initialKeyword: string;
}

const LIMIT = 20;

export default function RecallsClient({ initialData, initialKeyword }: Props) {
  const router = useRouter();
  const [recalls, setRecalls] = useState<Recall[]>(initialData.recalls);
  const [total, setTotal] = useState(initialData.total);
  const [totalPages, setTotalPages] = useState(initialData.totalPages);
  const [page, setPage] = useState(initialData.page);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [search, setSearch] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);

  const updateUrl = useCallback(
    (p: number, kw: string) => {
      const params = new URLSearchParams();
      if (p > 1) params.set('page', String(p));
      if (kw) params.set('keyword', kw);
      const query = params.toString();
      router.replace(`/recalls${query ? `?${query}` : ''}`, { scroll: false });
    },
    [router],
  );

  const load = useCallback(async (p: number, kw: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (kw) params.set('keyword', kw);
      const data = await api.get<RecallsResponse>(`/recalls?${params}`);
      setRecalls(data.recalls);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch {
      setRecalls([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(keyword);
    updateUrl(1, keyword);
    load(1, keyword);
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    updateUrl(p, search);
    load(p, search);
  };

  const handleReset = () => {
    setKeyword('');
    setSearch('');
    setPage(1);
    updateUrl(1, '');
    load(1, '');
  };

  return (
    <>
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
            onClick={handleReset}
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
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-medium text-sm">{recall.productName}</span>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {recall.company}
                  </span>
                  {recall.productType && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {recall.productType}
                    </span>
                  )}
                  {recall.recallGrade && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {recall.recallGrade}
                    </span>
                  )}
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
            onClick={() => handlePageChange(Math.max(1, page - 1))}
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
                onClick={() => handlePageChange(p)}
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
            onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            다음
          </button>
        </div>
      )}
    </>
  );
}
