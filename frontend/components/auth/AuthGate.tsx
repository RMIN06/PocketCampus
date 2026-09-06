// components/auth/AuthGate.tsx
// Client-side session gate: redirects to /login when there is no JWT.
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkSession = () => {
      if (!getToken()) {
        setChecked(false);
        router.replace("/login");
      } else {
        setChecked(true);
      }
    };
    checkSession();
    window.addEventListener("pc-auth-changed", checkSession);
    window.addEventListener("storage", checkSession);
    return () => {
      window.removeEventListener("pc-auth-changed", checkSession);
      window.removeEventListener("storage", checkSession);
    };
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-terracotta border-t-transparent" />
        <p className="mt-4 text-sm text-ink-soft">Checking your session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
