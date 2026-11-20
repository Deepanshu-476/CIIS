// Notification display/click handling only; does not cache application requests.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data?.type !== 'task-reminder' || !event.source?.id) return;
  const { title, options } = event.data;
  event.waitUntil(self.registration.showNotification(title, {
    ...options,
    tag: options.tag ? `${event.source.id}:${options.tag}` : undefined,
    data: { clientId: event.source.id },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = new URL('/ciisUser/task-management', self.location.origin).href;
  event.waitUntil((async () => {
    const clientId = event.notification.data?.clientId;
    const client = clientId ? await self.clients.get(clientId) : null;
    if (client?.type === 'window') {
      const navigated = await client.navigate(url);
      if (navigated) return navigated.focus();
    }
    return self.clients.openWindow(url);
  })());
});
