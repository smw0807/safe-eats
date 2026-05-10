'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

interface Toast {
  id: string;
  title: string;
  body: string;
  url: string;
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

export default function PushToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (payload: PushPayload) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...payload, id }]);
      setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  useEffect(() => {
    // SW postMessage 수신 (실제 push 알림)
    if ('serviceWorker' in navigator) {
      const swHandler = (event: MessageEvent) => {
        if (event.data?.type === 'PUSH_NOTIFICATION') {
          addToast({
            title: event.data.title,
            body: event.data.body,
            url: event.data.url ?? '/recalls',
          });
        }
      };
      navigator.serviceWorker.addEventListener('message', swHandler);
      return () => navigator.serviceWorker.removeEventListener('message', swHandler);
    }
  }, [addToast]);

  useEffect(() => {
    // CustomEvent 수신 (테스트 버튼 직접 트리거)
    const eventHandler = (e: Event) => {
      const { title, body, url } = (e as CustomEvent<PushPayload>).detail;
      addToast({ title, body, url });
    };
    window.addEventListener('safeeats:push', eventHandler);
    return () => window.removeEventListener('safeeats:push', eventHandler);
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-start gap-3 animate-slide-in"
        >
          <div className="text-green-500 text-xl shrink-0">🔔</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{toast.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.body}</p>
            <Link
              href={toast.url}
              className="text-xs text-green-600 hover:underline mt-1 inline-block"
              onClick={() => dismiss(toast.id)}
            >
              자세히 보기 →
            </Link>
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-gray-300 hover:text-gray-500 text-lg leading-none shrink-0"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
