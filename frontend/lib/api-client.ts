// lib/api-client.ts
// Typed fetch wrapper for the FastAPI backend.
// Auth: JWT bearer token issued by POST /api/v1/auth/google.

import type {
  AuthResponse,
  ExpenseCreate,
  ExpensePublic,
  ExpenseSummary,
  UserPublic,
} from "./types";
import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BASE_URL = API_URL ? `${API_URL}/api/v1` : "/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Session expired / invalid — clear so the auth gate sends us to /login
      const { clearAuth } = await import("./auth");
      clearAuth();
    }
    let message = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        message = typeof errorData.detail === "string"
          ? errorData.detail
          : JSON.stringify(errorData.detail);
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth
export const authApi = {
  google: (credential: string): Promise<AuthResponse> =>
    request<AuthResponse>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    }),
};

// Users
export const usersApi = {
  getMe: (): Promise<UserPublic> => request<UserPublic>("/users/me"),
};

// Expenses (personal — owned by the signed-in user)
export const expensesApi = {
  create: (data: ExpenseCreate): Promise<ExpensePublic> =>
    request<ExpensePublic>("/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  list: (month?: string): Promise<ExpensePublic[]> => {
    const query = month ? `?month=${month}` : "";
    return request<ExpensePublic[]>(`/expenses${query}`);
  },

  summary: (month: string): Promise<ExpenseSummary> =>
    request<ExpenseSummary>(`/expenses/summary?month=${month}`),

  update: (
    expenseId: string,
    updates: Partial<Pick<ExpensePublic, "description" | "amount" | "category">>
  ): Promise<ExpensePublic> =>
    request<ExpensePublic>(`/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  delete: (expenseId: string): Promise<void> =>
    request<void>(`/expenses/${expenseId}`, { method: "DELETE" }),
};

export { ApiError };
