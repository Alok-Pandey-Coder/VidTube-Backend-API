import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationApi, authApi, API_BASE_URL } from '../api/client';

export default function useNotifications(enabled) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const seenRef = useRef(new Set());

  const load = useCallback(async () => {
    try {
      const res = await notificationApi.list();
      const list = res.data?.items || [];
      seenRef.current = new Set(list.map((n) => n._id));
      setItems(list);
      setUnread(res.data?.unreadCount || 0);
    } catch {
      // ignore, bell just stays empty
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setUnread(0);
      return;
    }

    let es;
    let timer;
    let attempt = 0;
    let stopped = false;

    const connect = () => {
      es = new EventSource(`${API_BASE_URL}/notifications/stream`, { withCredentials: true });

      es.onopen = () => {
        attempt = 0;
      };

      es.addEventListener('notification', (e) => {
        try {
          const n = JSON.parse(e.data);
          if (seenRef.current.has(n._id)) return;
          seenRef.current.add(n._id);
          setItems((prev) => [n, ...prev].slice(0, 20));
          setUnread((c) => c + 1);
        } catch {
          // malformed event, skip
        }
      });

      es.onerror = () => {
        if (es.readyState !== EventSource.CLOSED) return;   // browser khud retry kar raha hai
        es.close();
        if (stopped) return;

        const delay = Math.min(30000, 2000 * 2 ** attempt++);
        timer = setTimeout(async () => {
          try {
            await authApi.getCurrentUser();   // token expire hua ho to interceptor refresh kar dega
          } catch {
            // refresh fail: interceptor logout event bhej dega
          }
          if (stopped) return;
          await load();                        // disconnect ke dauran miss hui notifications
          connect();
        }, delay);
      };
    };

    load();
    connect();

    return () => {
      stopped = true;
      clearTimeout(timer);
      es?.close();
    };
  }, [enabled, load]);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      // next load() server ki state se sync kar dega
    }
  }, []);

  return { items, unread, markAllRead };
}