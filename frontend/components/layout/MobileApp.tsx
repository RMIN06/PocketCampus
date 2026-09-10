"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { AppUpdater } from "@/lib/app-updater";

export function MobileApp() {
  const [offline, setOffline] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [nativeUpdate, setNativeUpdate] = useState<{ tag: string; downloadUrl: string } | null>(null);
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
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      void AppUpdater.checkLatest().then((release) => {
        if (release.updateAvailable && release.downloadUrl) setNativeUpdate(release);
      }).catch(() => {});
    }
    void check();
    const interval = setInterval(check, 60000);
    document.addEventListener("visibilitychange", check);
    return () => { mounted = false; clearInterval(interval); document.removeEventListener("visibilitychange", check); window.removeEventListener("online", connection); window.removeEventListener("offline", connection); };
  }, []);
  if (offline) {
    return <div role="status" className="sticky top-0 z-40 bg-forest px-4 py-3 text-center text-sm text-white">
      You&apos;re offline. Reconnect before saving expenses.
    </div>;
  }

  if (nativeUpdate) {
    return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-forest/50 p-4 backdrop-blur-sm sm:items-center" role="presentation">
      <section aria-labelledby="native-update-title" aria-modal="true" className="w-full max-w-md rounded-[2rem] border border-beige-border bg-beige-elevated p-6 shadow-2xl sm:p-8" role="dialog">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-dark">New Android build available</p>
        <h2 id="native-update-title" className="mt-2 text-3xl font-extrabold tracking-tight text-forest">Update PocketCampus</h2>
        <p className="mt-3 text-base leading-7 text-ink">Download the latest version from GitHub. Android will ask you to confirm the installation.</p>
        <button className="mt-7 min-h-12 w-full rounded-2xl bg-terracotta px-5 py-3 font-bold text-white" onClick={() => { void AppUpdater.downloadLatest({ downloadUrl: nativeUpdate.downloadUrl }); setNativeUpdate(null); }}>Download update</button>
        <button className="mt-3 min-h-11 w-full rounded-2xl px-5 py-3 text-sm font-bold text-ink-soft" onClick={() => setNativeUpdate(null)}>Later</button>
      </section>
    </div>;
  }

  if (!updated) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-forest/50 p-4 backdrop-blur-sm sm:items-center" role="presentation">
      <section aria-describedby="update-description" aria-labelledby="update-title" aria-modal="true" className="w-full max-w-md rounded-[2rem] border border-beige-border bg-beige-elevated p-6 shadow-2xl sm:p-8" role="dialog">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest text-2xl text-white" aria-hidden="true">↻</div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta-dark">A better PocketCampus is ready</p>
        <h2 id="update-title" className="mt-2 text-3xl font-extrabold tracking-tight text-forest">Update needed</h2>
        <p id="update-description" className="mt-3 text-base leading-7 text-ink">We&apos;ve made improvements to keep your ledger fast and reliable. Tap continue to load the latest version.</p>
        <button className="mt-7 min-h-12 w-full rounded-2xl bg-terracotta px-5 py-3 font-bold text-white shadow-sm transition hover:bg-terracotta-dark active:scale-[0.98]" onClick={() => window.location.reload()}>Continue to update</button>
        <p className="mt-3 text-center text-xs text-ink-soft">Your saved account data stays with you.</p>
      </section>
    </div>
  );
}
