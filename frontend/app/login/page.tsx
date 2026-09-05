// app/login/page.tsx
// Google Sign-In via Google Identity Services (GIS).
// Requires NEXT_PUBLIC_GOOGLE_CLIENT_ID in frontend/.env.local
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
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

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

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
          onLoad={initGoogleButton}
          strategy="afterInteractive"
        />
      )}

      <Reveal className="w-full max-w-sm text-center">
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
          {signingIn ? (
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracotta border-t-transparent" />
          ) : CLIENT_ID ? (
            <div ref={buttonRef} />
          ) : (
            <div className="w-full rounded-2xl border border-border-subtle bg-bg-surface p-4 text-left">
              <p className="text-sm font-semibold text-forest-dark">
                Google Sign-In setup needed
              </p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-ink-soft">
                <li>
                  Create an OAuth 2.0 Client ID at{" "}
                  <span className="font-medium">console.cloud.google.com → APIs &amp; Credentials</span>
                </li>
                <li>
                  Add <code className="font-mono">http://localhost:3001</code> to
                  &ldquo;Authorized JavaScript origins&rdquo;
                </li>
                <li>
                  Put it in <code className="font-mono">frontend/.env.local</code> as{" "}
                  <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> and in{" "}
                  <code className="font-mono">backend/.env</code> as{" "}
                  <code className="font-mono">GOOGLE_CLIENT_ID</code>
                </li>
                <li>Restart both servers</li>
              </ol>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-terracotta-tint p-3 text-sm text-terracotta-dark">
            {error}
          </p>
        )}
      </Reveal>
    </div>
  );
}