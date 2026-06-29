import { useCallback, useEffect, useState } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof Notification === "undefined") return "denied";
    if (Notification.permission === "granted") return "granted";
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback(
    (title: string, body: string, opts?: { image?: string; tag?: string }) => {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      try {
        new Notification(title, {
          body,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          tag: opts?.tag,
          silent: false,
        });
      } catch {}
    },
    []
  );

  return { permission, requestPermission, notify };
}
