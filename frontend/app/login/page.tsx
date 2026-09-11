// app/login/page.tsx
// Google Sign-In via Google Identity Services (GIS).
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { authApi } from "@/lib/api-client";
import { setAuth, getToken } from "@/lib/auth";
import { Reveal } from "@/components/motion";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>
          ) => void;
        };
      };
    };
  }
}

// Google web client IDs are public by design. Keep a production fallback so
// a missing Vercel env variable never exposes developer setup instructions.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "678031996418-ad1uljs84rbub3tevums7ahdchufj1k3.apps.googleusercontent.com";

export default function LoginPage() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Already signed in → straight to the ledger
  useEffect(() => {
    if (getToken()) router.replace("/dashboard");
  }, [router]);

  const handleCredential = async (credential: string) => {
    setSigningIn(true);
    setError(null);
    try {
      const { access_token, user } = await authApi.google(credential);
      setAuth(access_token, user);
      router.replace("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Sign-in failed. Please try again."
      );
    } finally {
      setSigningIn(false);
    }
  };

  const initGoogleButton = () => {
    if (!window.google || !CLIENT_ID || !buttonRef.current) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => handleCredential(response.credential),
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 280,
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      {CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onReady={initGoogleButton}
          onError={() => setError("Google Sign-In could not load. Check your connection and reload this page.")}
          strategy="afterInteractive"
        />
      )}

      <Reveal className="w-full max-w-sm text-center">
        <img src="/icons/icon-192-v2.png" width={88} height={88} alt="Pocket Campus logo" className="mx-auto mb-5 rounded-2xl" />
        {/* Wordmark */}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
          PocketCampus
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-forest">
          Your money.
          <br />
          Your campus.
        </h1>
        <span
          aria-hidden="true"
          className="mx-auto mt-4 block h-1.5 w-16 rounded-full bg-terracotta"
        />
        <p className="mt-5 text-base text-ink">
          Track personal expenses in Pakistani Rupees and find bookshops and
          eating spots around you.
        </p>

        {/* Google button / setup instructions */}
        <div className="mt-8 flex min-h-14 items-center justify-center">
          {CLIENT_ID ? (
            <div>
              <div ref={buttonRef} className={signingIn ? "hidden" : ""} />
              {signingIn && (
                <p role="status" className="text-sm text-ink-soft">Signing you in…</p>
              )}
            </div>
          ) : <p role="status" className="text-sm text-ink-soft">Google Sign-In is loading…</p>}
        </div>

        <Link href="/install/" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-forest underline">Install on Android or iPhone</Link>
        {error && (
          <p className="mt-4 rounded-xl bg-terracotta-tint p-3 text-sm text-terracotta-dark">
            {error}
          </p>
        )}
      </Reveal>
    </div>
  );
}
