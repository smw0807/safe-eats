'use client';

import { useEffect, useState } from 'react';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { api } from '../../../lib/api';
import Alert from '../../../components/ui/Alert';
import type { NotificationSettings } from '../../../types';

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationSettingsPage() {
  const { token, user, isLoading } = useRequireAuth();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [kakaoPhone, setKakaoPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushError, setPushError] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testMessage, setTestMessage] = useState('');
  const [testOk, setTestOk] = useState<boolean | null>(null);
  const [subCount, setSubCount] = useState<number | null>(null);
  const [emailTestSending, setEmailTestSending] = useState(false);
  const [emailTestMessage, setEmailTestMessage] = useState('');
  const [emailTestOk, setEmailTestOk] = useState<boolean | null>(null);
  const [kakaoTestSending, setKakaoTestSending] = useState(false);
  const [kakaoTestMessage, setKakaoTestMessage] = useState('');
  const [kakaoTestOk, setKakaoTestOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token) return;
    api
      .get<NotificationSettings>('/notifications/settings', token)
      .then((s) => {
        setSettings(s);
        setKakaoPhone(s.kakaoPhone ? formatPhone(s.kakaoPhone) : '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  // 구독 상태 확인
  useEffect(() => {
    if (!token || !settings?.pushEnabled) return;
    api
      .get<{ count: number }>('/push/status', token)
      .then((r) => setSubCount(r.count))
      .catch(() => setSubCount(0));
  }, [token, settings?.pushEnabled]);

  const registerAndSubscribePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      throw new Error('이 브라우저는 웹 푸시를 지원하지 않습니다.');
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해 주세요.');
    }

    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) throw new Error('VAPID 키가 설정되지 않았습니다.');

    // 기존 구독이 있으면 해제 후 재구독 (키 변경 대응)
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();

    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
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
    setSubCount(1);
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

  const sendTestPush = async () => {
    if (!token) return;
    setTestSending(true);
    setTestMessage('');
    setTestOk(null);
    try {
      await api.post('/push/test', {}, token);
      setTestOk(true);
      setTestMessage('발송 성공!');
      window.dispatchEvent(
        new CustomEvent('safeeats:push', {
          detail: {
            title: '[SafeEats] 테스트 알림',
            body: '웹 푸시 알림이 정상적으로 작동합니다!',
            url: '/recalls',
          },
        }),
      );
    } catch (err) {
      setTestOk(false);
      setTestMessage(err instanceof Error ? err.message : '발송 실패');
    } finally {
      setTestSending(false);
      setTimeout(() => setTestOk(null), 6000);
    }
  };

  const sendTestEmail = async () => {
    if (!token) return;
    setEmailTestSending(true);
    setEmailTestMessage('');
    setEmailTestOk(null);
    try {
      const res = await api.post<{ to: string }>('/email/test', {}, token);
      setEmailTestOk(true);
      setEmailTestMessage(`${res.to} 로 발송됐습니다.`);
    } catch (err) {
      setEmailTestOk(false);
      setEmailTestMessage(err instanceof Error ? err.message : '발송 실패');
    } finally {
      setEmailTestSending(false);
      setTimeout(() => setEmailTestOk(null), 6000);
    }
  };

  const sendTestKakao = async () => {
    if (!token) return;
    setKakaoTestSending(true);
    setKakaoTestMessage('');
    setKakaoTestOk(null);
    try {
      const res = await api.post<{ to: string }>('/kakao/test', {}, token);
      setKakaoTestOk(true);
      setKakaoTestMessage(`${res.to} 로 발송됐습니다.`);
    } catch (err) {
      setKakaoTestOk(false);
      setKakaoTestMessage(err instanceof Error ? err.message : '발송 실패');
    } finally {
      setKakaoTestSending(false);
      setTimeout(() => setKakaoTestOk(null), 6000);
    }
  };

  const saveKakaoPhone = async () => {
    if (!token || !settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await api.patch<NotificationSettings>(
        '/notifications/settings',
        { kakaoPhone: kakaoPhone.replace(/-/g, '') || null },
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

      {pushError && <Alert type="error" message={pushError} className="mb-4" />}

      {/* 웹 푸시 테스트 */}
      {settings.pushEnabled && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-semibold text-sm">웹 푸시 테스트</h2>
            {subCount !== null && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  subCount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                }`}
              >
                {subCount > 0 ? `구독 ${subCount}개 등록됨` : '구독 없음'}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mb-3">
            실제 푸시 알림이 정상적으로 수신되는지 확인합니다.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={sendTestPush}
              disabled={testSending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {testSending ? '발송 중...' : '테스트 알림 보내기'}
            </button>
            {testOk === true && <span className="text-sm text-green-600">{testMessage}</span>}
            {testOk === false && <span className="text-sm text-red-500">{testMessage}</span>}
          </div>
          {subCount === 0 && (
            <p className="text-xs text-orange-500 mt-2">
              구독 정보가 없습니다. 웹 푸시 알림을 OFF 후 다시 ON 해주세요.
            </p>
          )}
        </div>
      )}

      {/* 이메일 테스트 */}
      {settings.emailEnabled && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold mb-1 text-sm">이메일 테스트</h2>
          <p className="text-xs text-gray-400 mb-3">가입한 이메일로 테스트 알림을 발송합니다.</p>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={sendTestEmail}
              disabled={emailTestSending}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {emailTestSending ? '발송 중...' : '테스트 이메일 보내기'}
            </button>
            {emailTestOk === true && (
              <span className="text-sm text-green-600">{emailTestMessage}</span>
            )}
            {emailTestOk === false && (
              <span className="text-sm text-red-500">{emailTestMessage}</span>
            )}
          </div>
        </div>
      )}

      {/* 카카오 전화번호 */}
      {settings.kakaoEnabled && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold mb-1 text-sm">카카오 알림톡 수신 번호</h2>
          <p className="text-xs text-gray-400 mb-3">
            카카오 비즈메시지를 수신할 휴대폰 번호를 입력하세요.
          </p>
          <div className="flex gap-2 mb-4">
            <input
              type="tel"
              value={kakaoPhone}
              onChange={(e) => setKakaoPhone(formatPhone(e.target.value))}
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
          {settings.kakaoPhone && (
            <>
              <h2 className="font-semibold mb-1 text-sm">카카오 알림톡 테스트</h2>
              <p className="text-xs text-gray-400 mb-3">등록된 번호로 테스트 알림을 발송합니다.</p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={sendTestKakao}
                  disabled={kakaoTestSending}
                  className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 disabled:opacity-50 text-sm font-medium transition"
                >
                  {kakaoTestSending ? '발송 중...' : '테스트 알림톡 보내기'}
                </button>
                {kakaoTestOk === true && (
                  <span className="text-sm text-green-600">{kakaoTestMessage}</span>
                )}
                {kakaoTestOk === false && (
                  <span className="text-sm text-red-500">{kakaoTestMessage}</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {!settings.emailEnabled && !settings.pushEnabled && !settings.kakaoEnabled && (
        <Alert
          type="warning"
          message="⚠️ 모든 알림 채널이 비활성화되어 있습니다. 리콜 알림을 받으려면 하나 이상의 채널을 켜주세요."
          className="mt-4"
        />
      )}
    </main>
  );
}
