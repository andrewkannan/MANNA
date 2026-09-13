self.addEventListener('push', function (event) {
  let data = { title: 'Notification', body: '' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch(e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
