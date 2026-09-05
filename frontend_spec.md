# frontend_spec.md — PocketCampus PWA (Phase 1: Foundation & Design System)

## 1. Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS
- **State:** React Server Components + minimal client state (Zustand for cart-like ephemeral state, e.g., in-progress expense form)
- **PWA:** `next-pwa` (or manual service worker) + custom manifest + iOS meta tags

---

## 2. PWA Configuration

### 2.1 `public/manifest.json`

```json
{
  "name": "PocketCampus",
  "short_name": "PocketCampus",
  "description": "Split bills. Track expenses. Stay square with your roommates.",
  "start_url": "/dashboard",
  "display": "standalone",
  "background_color": "#0B0B0F",
  "theme_color": "#0B0B0F",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-192.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### 2.2 Root Layout Meta Tags (iOS + Android parity)

```tsx
// app/layout.tsx
export const metadata = {
  title: "PocketCampus",
  manifest: "/manifest.json",
  themeColor: "#0B0B0F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PocketCampus",
  },
  formatDetection: { telephone: false },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",   // required for iOS notch/safe-area support
  },
};
```

```html
<!-- Additional manual tags needed inside <head>, Next.js metadata API covers most, but include explicitly: -->
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### 2.3 Service Worker

- Use `next-pwa` wrapping `next.config.js`:

```js
// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

module.exports = withPWA({
  reactStrictMode: true,
});
```

- Cache strategy: `NetworkFirst` for `/api/*` calls, `CacheFirst` for static assets/icons — configured via `next-pwa`'s `runtimeCaching` array.
- **iOS caveat to document in code comments:** iOS Safari does not support background sync or push notifications for PWAs pre-16.4; service worker scope must remain `/`, and "Add to Home Screen" must be manually triggered by the user (no `beforeinstallprompt` on iOS) — surface an in-app instructional toast for iOS Safari users only (detected via UA sniff).

---

## 3. Design System

### 3.1 Core Palette (Dark Mode Default)

| Token | Value | Usage |
|---|---|---|
| `bg-base` | `#0B0B0F` | App background |
| `bg-surface` | `#16161D` | Card backgrounds |
| `bg-surface-elevated` | `#1E1E27` | Modals, sheets |
| `border-subtle` | `#2A2A34` | Card borders, dividers |
| `text-primary` | `#F5F5F7` | Primary text |
| `text-secondary` | `#8E8E99` | Timestamps, metadata |
| `accent-primary` | `#7C5CFC` | Primary actions, FAB, active tab |
| `accent-success` | `#34D399` | "You are owed" balances |
| `accent-danger` | `#F87171` | "You owe" balances |

### 3.2 Typography

- **Font:** `Inter` (via `next/font`), variable weight.
- **Scale:** strictly limited to 5 sizes to avoid clutter:
  - `text-2xl font-semibold` — Screen titles ("Your Ledger")
  - `text-lg font-medium` — Card primary line (expense description)
  - `text-base` — Body / form inputs
  - `text-sm text-secondary` — Metadata (date, category tag)
  - `text-xs text-secondary uppercase tracking-wide` — Section labels ("THIS WEEK")
- **Rule:** no more than 2 font weights per screen. No italics. No decorative fonts.

### 3.3 Spacing & Layout

- Base unit: 4px (Tailwind default scale, no custom overrides).
- Screen horizontal padding: `px-4` (16px) — consistent across all views.
- Card internal padding: `p-4`.
- Vertical rhythm between cards: `space-y-3` (12px) — tight enough to feel dense/native, not sparse.
- Safe-area handling: `pb-[env(safe-area-inset-bottom)]` on the bottom nav and FAB container.

### 3.4 Navigation Pattern

- **Bottom Tab Bar** (fixed, `bg-surface`, blurred backdrop `backdrop-blur-lg bg-surface/90`):
  - Tabs: `Ledger` | `Groups` | `[FAB gap]` | `Activity` | `Profile`
  - Active tab: icon + label in `accent-primary`; inactive: `text-secondary`, icon-only opacity 0.6.
- **Floating Action Button (Add Expense):**
  - Positioned centered, overlapping the tab bar by ~40% (classic native pattern).
  - `size-14 rounded-full bg-accent-primary shadow-lg shadow-accent-primary/30`
  - Icon: `+`, white, `size-6`.
  - On tap: opens Add Expense as a bottom sheet modal (`vaul` or Radix Dialog with slide-up transition), not a full route navigation — preserves native feel.

### 3.5 Expense Card Component (Data Presentation Standard)

Strict content hierarchy, no more than 3 lines of text per card:

```
[Category Icon]  Description                      $42.50
                 Paid by Sarah · 3 people · Today   
```

- Left: category icon in a `size-10 rounded-full bg-surface-elevated` chip.
- Right-aligned amount: `text-lg font-semibold`, colored `accent-success`/`accent-danger` based on whether the current user is owed or owes.
- Never show more than one metadata line beneath the description.

---

## 4. Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout, PWA meta, font, providers
│   ├── globals.css                   # Tailwind base + CSS vars for theme tokens
│   ├── manifest.json
│   │
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   │
│   ├── (main)/
│   │   ├── layout.tsx                # Wraps with <BottomNav /> + safe-area shell
│   │   ├── dashboard/
│   │   │   └── page.tsx              # Ledger view (default landing)
│   │   ├── groups/
│   │   │   ├── page.tsx              # Group list
│   │   │   └── [groupId]/page.tsx    # Group detail + balances
│   │   ├── activity/page.tsx
│   │   └── profile/page.tsx
│   │
│   └── api/                          # Next.js route handlers if BFF proxy needed
│
├── components/
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── FabAddExpense.tsx
│   │
│   ├── expenses/
│   │   ├── ExpenseCard.tsx           # Single ledger row (per 3.5 spec)
│   │   ├── ExpenseForm.tsx           # Manual entry form (bottom sheet content)
│   │   ├── SplitMethodSelector.tsx   # Equal / Exact / Percentage toggle
│   │   ├── ParticipantPicker.tsx     # Multi-select avatars for group members
│   │   └── CategoryPicker.tsx
│   │
│   ├── ledger/
│   │   ├── MonthlyLedgerView.tsx     # Groups ExpenseCards by date, monthly total header
│   │   ├── LedgerSummaryHeader.tsx   # "You owe $X" / "You're owed $X" banner
│   │   └── MonthSelector.tsx         # Swipeable month picker
│   │
│   ├── groups/
│   │   ├── BalanceRow.tsx            # Per-member net balance line
│   │   └── InviteCodeCard.tsx
│   │
│   └── ui/                           # Primitive design-system components
│       ├── Sheet.tsx                 # Bottom sheet wrapper (shared by forms/modals)
│       ├── Button.tsx
│       ├── Avatar.tsx
│       └── Chip.tsx
│
├── lib/
│   ├── api-client.ts                 # Typed fetch wrapper for FastAPI backend
│   ├── types.ts                      # Mirrors backend Pydantic schemas
│   └── format.ts                     # Currency/date formatting helpers
│
├── store/
│   └── expenseFormStore.ts           # Zustand store for in-progress expense entry
│
├── public/
│   ├── icons/                        # PWA icon set (192, 512, maskable variants)
│   └── manifest.json
│
├── tailwind.config.ts
├── next.config.js
└── package.json
```

### 4.1 Key Component Contracts

```tsx
// components/expenses/ExpenseForm.tsx
interface ExpenseFormProps {
  groupId: string;
  members: GroupMember[];
  onSuccess: (expense: ExpensePublic) => void;
}
// Renders inside <Sheet>: description input, amount input (numeric keypad on mobile
// via inputMode="decimal"), CategoryPicker, ParticipantPicker, SplitMethodSelector,
// sticky "Save Expense" button pinned above safe-area inset.
```

```tsx
// components/ledger/MonthlyLedgerView.tsx
interface MonthlyLedgerViewProps {
  groupId: string;
  month: string; // "2026-08"
}
// Fetches GET /expenses/group/{groupId}?month=..., groups results by day,
// renders LedgerSummaryHeader + date-sectioned ExpenseCard list.
```

---

## 5. Instructions for Claude Code

This spec defines Phase 1 (Weeks 1-2): Foundation & Design System only. When implementing:

1. Scaffold the app with `create-next-app` (App Router, TypeScript, Tailwind) before touching any custom files.
2. Set up `manifest.json`, `layout.tsx` metadata, and `next-pwa` config first (Section 2) — verify "Add to Home Screen" works on both a local Android Chrome and iOS Safari test before moving on.
3. Add the design tokens from Section 3.1 as Tailwind theme extensions in `tailwind.config.ts` (do not hardcode hex values inline in components).
4. Build primitive `components/ui/` pieces first (`Button`, `Avatar`, `Chip`, `Sheet`), since every feature component depends on them.
5. Build `BottomNav.tsx` and `FabAddExpense.tsx` next, wired into `app/(main)/layout.tsx`.
6. Build `ExpenseCard.tsx` matching the exact content hierarchy in Section 3.5 — this is the most reused component, get it right before building list views.
7. Build `ExpenseForm.tsx` and `MonthlyLedgerView.tsx` last, once primitives and nav shell are in place.
8. Backend is FastAPI + MongoDB (see companion `backend_spec.md`) — `lib/api-client.ts` should point to `NEXT_PUBLIC_API_URL` env var, and `lib/types.ts` should mirror the Pydantic schemas exactly (same field names) to avoid mapping drift.
9. Do not implement settlements/payments, notifications, or recurring expenses yet — out of scope for Phase 1.
