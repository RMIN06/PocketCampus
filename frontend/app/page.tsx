// app/page.tsx
// Root redirect: the PWA start_url is /dashboard (per frontend_spec.md),
// but visiting plain http://localhost:3001 should land there too.
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
