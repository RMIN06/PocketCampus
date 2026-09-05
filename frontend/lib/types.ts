// lib/types.ts
// Mirrors backend Pydantic schemas exactly (same field names) to avoid mapping drift.

export type ExpenseCategory =
  | "food"
  | "groceries"
  | "books"
  | "transport"
  | "rent"
  | "utilities"
  | "other";

export interface UserPublic {
  id: string;
  full_name: string;
  email: string;
  avatar_color: string;
  picture?: string | null;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserPublic;
}

export interface ExpenseBase {
  description: string;
  amount: number;
  category: ExpenseCategory;
  currency: string;
}

export interface ExpenseCreate extends ExpenseBase {}

export interface ExpensePublic extends ExpenseBase {
  id: string;
  user_id: string;
  created_at: string;
  updated_at?: string | null;
}

export interface ExpenseSummary {
  month: string;
  total: number;
  count: number;
  by_category: Partial<Record<ExpenseCategory, number>>;
}

// ── Nearby places (OpenStreetMap / Overpass) ────────────────────────────────
export type PlaceKind = "food" | "books";

export interface PlaceResult {
  id: string;
  name: string;
  kind: PlaceKind;
  detail?: string; // cuisine / opening hours etc.
  lat: number;
  lon: number;
  distanceMeters: number;
}

export interface LatLng {
  lat: number;
  lon: number;
}