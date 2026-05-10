self.addEventListener('push', (event) => {
  console.log('[SW] push 이벤트 수신', event);
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch (e) {
    console.error('[SW] push 데이터 파싱 실패', e);
  }

  const title = data.title || 'SafeEats 리콜 알림';
  const body = data.body || '새로운 식품 리콜 알림이 있습니다.';
  const url = data.url || '/recalls';

  // 열린 탭에 인앱 토스트용 메시지 전달
  const notifyClients = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clientList) => {
      clientList.forEach((client) => {
        client.postMessage({ type: 'PUSH_NOTIFICATION', title, body, url });
      });
    });

  console.log('[SW] showNotification:', title, { body });
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body,
        icon: '/favicon.ico',
        data: { url },
      }),
      notifyClients,
    ]),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/recalls'));
});
