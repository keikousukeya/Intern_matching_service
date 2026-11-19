"use client";

import useSWR from "swr";
import { ApiError, apiFetch } from "./api";

export type Role = "student" | "company";

export type User = {
  id: number;
  email: string;
  role: Role;
  created_at: string;
};

export const ROLE_LABELS: Record<Role, string> = {
  student: "インターン生",
  company: "企業",
};

type UserResponse = { user: User };

const ME_KEY = "/me";

// 未ログイン（401）はエラーではなく「ユーザーなし」として扱う
async function fetchCurrentUser(): Promise<User | null> {
  try {
    const { user } = await apiFetch<UserResponse>(ME_KEY);
    return user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

/** ログイン中のユーザーを取得する。ログイン・ログアウト時はキャッシュを更新して画面に反映する */
export function useCurrentUser() {
  const { data, error, isLoading, mutate } = useSWR(ME_KEY, fetchCurrentUser, {
    revalidateOnFocus: false,
  });

  return {
    user: data ?? null,
    isLoading,
    error,
    async signUp(params: { email: string; password: string; password_confirmation: string; role: Role }) {
      const { user } = await apiFetch<UserResponse>("/registration", { method: "POST", body: { user: params } });
      await mutate(user, { revalidate: false });
      return user;
    },
    async logIn(params: { email: string; password: string }) {
      const { user } = await apiFetch<UserResponse>("/session", { method: "POST", body: { session: params } });
      await mutate(user, { revalidate: false });
      return user;
    },
    async logOut() {
      await apiFetch<void>("/session", { method: "DELETE" });
      await mutate(null, { revalidate: false });
    },
  };
}
