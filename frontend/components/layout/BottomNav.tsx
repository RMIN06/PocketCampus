// components/layout/BottomNav.tsx
// Forest-green bottom tab bar (30% secondary). The active tab wears a solid
// terracotta tile (10% accent) that glides between tabs with a motion.dev
// layoutId spring — quiet, precise, no bounce or glow.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";

const TABS = [
  {
    name: "Ledger",
    href: "/dashboard",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m4 6v-4m4 4V8M3 21l4-4h4l4 4z" />
      </svg>
    ),
  },
  {
    name: "Explore",
    href: "/explore",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    name: "Activity",
    href: "/activity",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    name: "Profile",
    href: "/profile",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

export const BottomNav = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-forest pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around px-2 pt-2">
        {TABS.map((tab, index) => {
          const active = isActive(tab.href);
          // Center gap for FAB: first two tabs left, last two tabs right
          const isLeft = index < 2;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[56px] max-w-[120px] flex-1 flex-col items-center justify-center gap-1 px-3 py-1.5 ${
                isLeft ? "mr-auto" : index === 2 ? "ml-auto" : ""
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-active-tile"
                  aria-hidden="true"
                  className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-terracotta"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  active ? "text-white" : "text-[#F5E6CC]/60"
                }`}
              >
                {tab.icon}
              </span>
              <span
                className={`relative z-10 text-xs font-semibold ${
                  active ? "text-white" : "text-[#F5E6CC]/60"
                }`}
              >
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};