"use client";

import { useEffect, useState } from "react";

export function MobileApp() {
  const [offline, setOffline] = useState(false);
  const [updated, setUpdated] = useState(false);
  useEffect(() => {
    let mounted = true;
    let version: string | undefined;
    const connection = () => setOffline(!navigator.onLine);
    connection();
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/pocket-sw.js", {scope: "/", updateViaCache: "none"}).catch(() => {});
    }
    const check = async () => {
      if (document.hidden || !navigator.onLine) return;
      try {
        const response = await fetch("/version.json", {cache: "no-store"});
        if (!response.ok) return;
        const data = await response.json();
        if (mounted && version && data.version !== version) setUpdated(true);
        version = data.version;
      } catch { /* Next foreground check retries. */ }
    };
    void check();
    const interval = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    return () => { mounted = false; clearInterval(interval); document.removeEventListener("visibilitychange", check); window.removeEventListener("online", connection); window.removeEventListener("offline", connection); };
  }, []);
  if (!offline && !updated) return null;
  return <div role="status" className="sticky top-0 z-40 bg-forest px-4 py-3 text-center text-sm text-white">
    {offline ? "You're offline. Reconnect before saving expenses." : <>An update is ready. Finish any expense before <button className="min-h-11 font-bold underline" onClick={() => window.location.reload()}>reloading the app</button>.</>}
  </div>;
}
