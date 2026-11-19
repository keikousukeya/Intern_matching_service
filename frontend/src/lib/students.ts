"use client";

import useSWR from "swr";
import { fetcher } from "./api";
import type { StudentProfile } from "./profile";

export type PageMeta = {
  page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
};

/** 企業向け: インターン生一覧（新着順） */
export function useStudents(page: number) {
  return useSWR<{ students: StudentProfile[]; meta: PageMeta }>(`/students?page=${page}`, fetcher, {
    // ページを切り替えている間も前のページを表示したままにする（画面のちらつき防止）
    keepPreviousData: true,
  });
}

/** 企業向け: インターン生の詳細（id はユーザー ID） */
export function useStudent(id: string) {
  return useSWR<{ student: StudentProfile }>(`/students/${encodeURIComponent(id)}`, fetcher);
}
