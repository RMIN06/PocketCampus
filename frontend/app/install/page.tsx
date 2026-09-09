"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{outcome: "accepted" | "dismissed"}>;
}

export default function InstallPage() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches || !!(navigator as Navigator & {standalone?: boolean}).standalone);
    const capture = (e: Event) => {e.preventDefault(); setPrompt(e as InstallPrompt);};
    const done = () => {setInstalled(true); setPrompt(null);};
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", done);
    return () => {window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", done);};
  }, []);
  async function install() {
    if (!prompt) return;
    try { await prompt.prompt(); await prompt.userChoice; } finally {setPrompt(null);}
  }
  return <main className="mx-auto max-w-xl px-5 pb-12 pt-12">
    <img src="/icons/icon-192-v2.png" width={80} height={80} alt="Pocket Campus logo" className="mb-6 rounded-3xl" />
    <p className="text-xs font-bold uppercase tracking-widest text-ink-soft">PocketCampus · Made for your phone</p>
    <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest">Your pocket.<br />Your budget.</h1>
    <p className="mt-4 text-lg">Track expenses in rupees, watch your monthly budget, and add an expense with “Hey Pocket.”</p>
    <div className="my-7 flex flex-wrap items-center gap-3">
      {prompt && !installed && <Button onClick={install}>Install PocketCampus</Button>}
      <Link href="/dashboard/" className="inline-flex min-h-11 items-center rounded-full bg-forest px-6 py-3 font-semibold text-white">{installed ? "Open PocketCampus" : "Open the app"}</Link>
    </div>
    {installed && <p role="status" className="mb-4 font-semibold text-forest">You're using the installed app.</p>}
    <section className="space-y-5 rounded-2xl border border-border-subtle bg-bg-surface p-5">
      <div><h2 className="text-xl font-bold text-forest">On Android</h2><p className="mt-2">Open this link in Chrome. Tap <strong>Install PocketCampus</strong> if shown, or open Chrome's <strong>⋮ menu → Add to Home screen → Install</strong>.</p></div>
      <div><h2 className="text-xl font-bold text-forest">On iPhone or iPad</h2><p className="mt-2">Open this link in Safari. Tap <strong>Share → Add to Home Screen → Add</strong>. If offered, leave <strong>Open as Web App</strong> enabled.</p></div>
    </section>
    <section className="mt-7 space-y-3 text-sm text-ink-soft">
      <h2 className="text-lg font-bold text-forest">Always connected to your latest app</h2>
      <p>No store account or APK is needed. Open PocketCampus from its Home Screen icon. New versions load when you reopen or reload it; if it is already open, an update notice appears.</p>
      <p>Sign in with Google to keep your ledger and budgets synced. Internet is required to sign in and save. Budget alerts appear inside the app.</p>
      <p>For voice entry, tap Listen and allow the microphone, then say your expense in English. Review the details before saving. Availability depends on your phone and browser.</p>
      <a href="https://github.com/RMIN06/PocketCampus" className="inline-flex min-h-11 items-center font-semibold text-forest underline">View PocketCampus on GitHub</a>
    </section>
  </main>;
}
