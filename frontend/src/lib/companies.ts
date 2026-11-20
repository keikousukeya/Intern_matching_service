"use client";

import useSWR from "swr";
import { fetcher } from "./api";
import type { CompanyProfile } from "./profile";

/** 企業プロフィールの詳細（id は企業のユーザー ID） */
export function useCompany(id: string) {
  return useSWR<{ company: CompanyProfile }>(`/companies/${encodeURIComponent(id)}`, fetcher);
}
