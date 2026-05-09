'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { api } from '../../../lib/api';
import Alert from '../../../components/ui/Alert';

interface DlqMessage {
  id: string;
  userId: string;
  recallId: string;
  channel: string;
  errorMsg: string | null;
  createdAt: string;
}

export default function AdminDlqPage() {
  const { token, isLoading } = useRequireAuth();
  const [messages, setMessages] = useState<DlqMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [pollResult, setPollResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    api
      .get<DlqMessage[]>('/admin/dlq', token)
      .then(setMessages)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handlePoll = async () => {
    if (!token) return;
    setPolling(true);
    setPollResult(null);
    try {
      await api.post('/admin/scheduler/poll', {}, token);
      setPollResult({ type: 'success', message: '폴링을 시작했습니다. 서버 로그를 확인하세요.' });
    } catch (err) {
      setPollResult({
        type: 'error',
        message: err instanceof Error ? err.message : '폴링 요청 실패',
      });
    } finally {
      setPolling(false);
    }
  };

  const handleRetry = async (id: string) => {
    if (!token) return;
    setRetrying(id);
    try {
      await api.post(`/admin/dlq/retry`, { messageId: id }, token);
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '재시도 실패');
    } finally {
      setRetrying(null);
    }
  };

  const channelLabel: Record<string, string> = {
    EMAIL: '이메일',
    PUSH: '웹 푸시',
    KAKAO: '카카오',
  };

  if (isLoading || loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">DLQ 관리</h1>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
              관리자
            </span>
          </div>
          <button
            onClick={handlePoll}
            disabled={polling}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition"
          >
            {polling ? '폴링 중...' : '식약처 수동 폴링'}
          </button>
        </div>
        <p className="text-gray-500 text-sm">발송에 실패한 알림 메시지를 확인하고 재시도합니다.</p>
      </div>

      {pollResult && (
        <Alert
          type={pollResult.type === 'success' ? 'success' : 'error'}
          message={pollResult.message}
          className="mb-4"
        />
      )}

      {error && <Alert type="error" message={error} className="mb-4" />}

      {messages.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
          DLQ에 처리 대기 중인 메시지가 없습니다. 🎉
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">
              미처리 메시지 ({messages.length}건)
            </span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left">
                <th className="px-5 py-3 text-xs text-gray-400 font-medium">채널</th>
                <th className="px-5 py-3 text-xs text-gray-400 font-medium">사용자 ID</th>
                <th className="px-5 py-3 text-xs text-gray-400 font-medium">리콜 ID</th>
                <th className="px-5 py-3 text-xs text-gray-400 font-medium">오류 메시지</th>
                <th className="px-5 py-3 text-xs text-gray-400 font-medium">발생일</th>
                <th className="px-5 py-3 text-xs text-gray-400 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {messages.map((msg, i) => (
                <tr
                  key={msg.id}
                  className={`${i !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50`}
                >
                  <td className="px-5 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {channelLabel[msg.channel] ?? msg.channel}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                    {msg.userId}
                  </td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs truncate max-w-[120px]">
                    {msg.recallId}
                  </td>
                  <td className="px-5 py-3 text-red-500 text-xs max-w-[200px] truncate">
                    {msg.errorMsg ?? '-'}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(msg.createdAt).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleRetry(msg.id)}
                      disabled={retrying === msg.id}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 transition"
                    >
                      {retrying === msg.id ? '재시도 중...' : '재시도'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
