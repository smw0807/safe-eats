'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api';

interface NotificationSettings {
  id: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  kakaoEnabled: boolean;
  kakaoPhone: string | null;
}

export default function NotificationSettingsPage() {
  const { token, user, isLoading } = useAuth();
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [kakaoPhone, setKakaoPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushError, setPushError] = useState('');

  useEffect(() => {
    if (!isLoading && !token) {
      router.push('/login');
    }
  }, [token, isLoading, router]);

  useEffect(() => {
    if (!token) return;
    api
      .get<NotificationSettings>('/notifications/settings', token)
      .then((s) => {
        setSettings(s);
        setKakaoPhone(s.kakaoPhone || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  const registerAndSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('이 브라우저는 웹 푸시를 지원하지 않습니다.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.');
    }

    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('VAPID 키가 설정되지 않았습니다.');

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });

    const subJson = sub.toJSON();
    await api.post(
      '/push/subscribe',
      {
        endpoint: sub.endpoint,
        p256dh: subJson.keys?.p256dh ?? '',
        auth: subJson.keys?.auth ?? '',
      },
      token!,
    );
  };

  const toggle = async (field: 'emailEnabled' | 'pushEnabled' | 'kakaoEnabled') => {
    if (!token || !settings) return;
    const newValue = !settings[field];

    if (field === 'pushEnabled' && newValue) {
      setPushError('');
      try {
        await registerAndSubscribePush();
      } catch (err) {
        setPushError(err instanceof Error ? err.message : '웹 푸시 구독에 실패했습니다.');
        return;
      }
    }

    const updated = { ...settings, [field]: newValue };
    setSettings(updated);
    try {
      const res = await api.patch<NotificationSettings>(
        '/notifications/settings',
        { [field]: newValue },
        token,
      );
      setSettings(res);
    } catch {
      setSettings(settings);
    }
  };

  const saveKakaoPhone = async () => {
    if (!token || !settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.patch<NotificationSettings>(
        '/notifications/settings',
        { kakaoPhone: kakaoPhone.trim() || null },
        token,
      );
      setSettings(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center py-20 text-gray-400">불러오는 중...</div>
      </main>
    );
  }

  if (!settings) return null;

  const channels = [
    {
      key: 'emailEnabled' as const,
      label: '이메일 알림',
      description: user?.email ?? '',
      icon: '📧',
    },
    {
      key: 'pushEnabled' as const,
      label: '웹 푸시 알림',
      description: '브라우저 푸시 알림으로 즉시 수신',
      icon: '🔔',
    },
    {
      key: 'kakaoEnabled' as const,
      label: '카카오 알림톡',
      description: '카카오톡으로 알림 수신',
      icon: '💬',
    },
  ];

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">알림 설정</h1>
        <p className="text-gray-500 text-sm">리콜 알림을 받을 채널을 선택하세요.</p>
      </div>

      {/* 채널 토글 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
        {channels.map(({ key, label, description, icon }, i) => (
          <div
            key={key}
            className={`flex items-center justify-between px-5 py-4 ${
              i !== 0 ? 'border-t border-gray-100' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{icon}</span>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-gray-400">{description}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                settings[key] ? 'bg-green-500' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={settings[key]}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  settings[key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* 웹 푸시 에러 */}
      {pushError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          {pushError}
        </div>
      )}

      {/* 카카오 전화번호 */}
      {settings.kakaoEnabled && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold mb-1 text-sm">카카오 알림톡 수신 번호</h2>
          <p className="text-xs text-gray-400 mb-3">
            카카오 비즈메시지를 수신할 휴대폰 번호를 입력하세요.
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={kakaoPhone}
              onChange={(e) => setKakaoPhone(e.target.value)}
              placeholder="010-0000-0000"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={saveKakaoPhone}
              disabled={saving}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {saving ? '저장 중...' : saved ? '저장됨 ✓' : '저장'}
            </button>
          </div>
        </div>
      )}

      {/* 알림 없음 경고 */}
      {!settings.emailEnabled && !settings.pushEnabled && !settings.kakaoEnabled && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
          ⚠️ 모든 알림 채널이 비활성화되어 있습니다. 리콜 알림을 받으려면 하나 이상의 채널을
          켜주세요.
        </div>
      )}
    </main>
  );
}
