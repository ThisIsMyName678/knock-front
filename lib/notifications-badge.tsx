import React, { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { listNotifications } from '@/lib/api/notifications';
import { toLocalDateKey } from '@/lib/mocks/dashboard';

const LAST_SEEN_KEY = 'notifications.lastSeenAt';

type NotificationsBadgeContextValue = {
  count: number;
  refresh: () => Promise<void>;
  markSeen: () => Promise<void>;
};

const NotificationsBadgeContext = createContext<NotificationsBadgeContextValue | null>(null);

export function NotificationsBadgeProvider({ children }: PropsWithChildren) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const lastSeenAt = localStorage.getItem(LAST_SEEN_KEY);
    const now = new Date();
    const since = lastSeenAt ?? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    try {
      const res = await listNotifications({ date: toLocalDateKey(now), since });
      setCount(res.newItemsCount);
      if (!lastSeenAt) {
        localStorage.setItem(LAST_SEEN_KEY, now.toISOString());
      }
    } catch {
      // ignore — keep previous count, retried on next refresh
    }
  }, []);

  const markSeen = useCallback(async () => {
    localStorage.setItem(LAST_SEEN_KEY, new Date().toISOString());
    setCount(0);
  }, []);

  useEffect(() => {
    void refresh();
    const intervalId = setInterval(() => {
      void refresh();
    }, 60000);
    return () => clearInterval(intervalId);
  }, [refresh]);

  return (
    <NotificationsBadgeContext.Provider value={{ count, refresh, markSeen }}>
      {children}
    </NotificationsBadgeContext.Provider>
  );
}

export function useNotificationsBadge() {
  const context = useContext(NotificationsBadgeContext);

  if (!context) {
    throw new Error('useNotificationsBadge must be used inside NotificationsBadgeProvider.');
  }

  return context;
}
