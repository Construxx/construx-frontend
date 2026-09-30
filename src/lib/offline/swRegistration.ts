// Service Worker Registration for CONSTRUX Site PWA
export function registerServiceWorker(onSyncTrigger?: () => void) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('[PWA] Service Worker registered with scope:', registration.scope);

      // Listen for message from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'TRIGGER_OUTBOX_SYNC') {
          if (onSyncTrigger) onSyncTrigger();
        }
      });
    } catch (error) {
      console.warn('[PWA] Service Worker registration failed:', error);
    }
  });
}

// Request Background Sync if supported (Chromium / Android)
export async function requestBackgroundSync() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('sync' in reg) {
      // @ts-ignore - background sync API
      await reg.sync.register('construx-outbox-sync');
      return true;
    }
  } catch (err) {
    console.debug('[PWA] Background sync registration ignored or unsupported:', err);
  }
  return false;
}
