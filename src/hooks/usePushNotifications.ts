import { useState, useEffect } from 'react';

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (typeof Notification === 'undefined') return 'denied';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  };

  const notify = (title: string, options?: NotificationOptions) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          ...options,
        });
      } catch (err) {
        console.warn('Could not display native notification:', err);
      }
    }
  };

  return {
    permission,
    isSupported: typeof Notification !== 'undefined',
    isGranted: permission === 'granted',
    requestPermission,
    notify,
  };
}
