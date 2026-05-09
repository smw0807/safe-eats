self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'SafeEats 리콜 알림';
  const options = {
    body: data.body || '새로운 식품 리콜 알림이 있습니다.',
    icon: '/favicon.ico',
    data: { url: data.url || '/recalls' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/recalls'));
});
