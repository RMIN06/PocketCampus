// tailwind.config.ts
// ── "Warm Craft" palette — strict 60-30-10 rule ─────────────────────────
//   60%  Warm Beige  #F5E6CC (+tints)   → dominant: background & surfaces
//   30%  Forest Green #2D4F1E (+shades) → secondary: headings, nav, filled panels
//   10%  Terracotta  #E27D60 (+shades)  → accent: CTAs, FAB, active states
//   Slate Grey #4A4A4A                  → neutral ink for body/metadata
// Never hardcode hex in components — use these tokens.
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── 60% dominant: warm beige family ──
        "bg-base": "#F5E6CC",
        "bg-surface": "#FBF3E1",
        "bg-surface-elevated": "#FFF9EC",
        "border-subtle": "#E3D2B4",
        // ── 30% secondary: forest green family ──
        "forest": {
          DEFAULT: "#2D4F1E",
          dark: "#223B15",
          light: "#41652E",
          tint: "#E7EFDA",
        },
        // ── 10% accent: terracotta family ──
        "terracotta": {
          DEFAULT: "#E27D60",
          dark: "#C4593D",
          tint: "#F8DFD3",
        },
        // ── neutral ink ──
        "ink": "#4A4A4A",
        "ink-soft": "#6E6A61",
        // Legacy aliases (mapped onto the new palette so existing class
        // names keep rendering correctly during migration)
        "text-primary": "#2D4F1E",
        "text-secondary": "#6E6A61",
        "accent-primary": "#E27D60",
        "accent-success": "#2D4F1E",
        "accent-danger": "#C4593D",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
