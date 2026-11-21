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

export type SkillMatch = "all" | "any";
export type StudentSort = "newest" | "updated";

/** インターン生の検索条件（F-04）。空文字は「指定なし」 */
export type StudentSearchParams = {
  q: string;
  skills: string[];
  skillMatch: SkillMatch;
  university: string;
  graduationYear: string;
  desiredRole: string;
  sort: StudentSort;
};

export const EMPTY_SEARCH: StudentSearchParams = {
  q: "",
  skills: [],
  skillMatch: "all",
  university: "",
  graduationYear: "",
  desiredRole: "",
  sort: "newest",
};

/** 画面の URL（/students?q=...&skills=Ruby&skills=React）から検索条件を読み取る */
export function parseStudentSearch(params: URLSearchParams): StudentSearchParams {
  return {
    q: params.get("q") ?? "",
    skills: params.getAll("skills").filter(Boolean),
    skillMatch: params.get("skill_match") === "any" ? "any" : "all",
    university: params.get("university") ?? "",
    graduationYear: params.get("graduation_year") ?? "",
    desiredRole: params.get("desired_role") ?? "",
    sort: params.get("sort") === "updated" ? "updated" : "newest",
  };
}

/**
 * 検索条件をクエリ文字列にする（指定のない項目と既定値は省き、URL を短く保つ）。
 * skillsKey は画面の URL では "skills"、Rails に送るときは配列として受け取れる "skills[]" にする。
 */
function toQuery(search: StudentSearchParams, skillsKey: string): URLSearchParams {
  const query = new URLSearchParams();
  if (search.q.trim()) query.set("q", search.q.trim());
  search.skills.forEach((skill) => query.append(skillsKey, skill));
  if (search.skills.length > 1 && search.skillMatch === "any") query.set("skill_match", "any");
  if (search.university.trim()) query.set("university", search.university.trim());
  if (search.graduationYear) query.set("graduation_year", search.graduationYear);
  if (search.desiredRole.trim()) query.set("desired_role", search.desiredRole.trim());
  if (search.sort !== "newest") query.set("sort", search.sort);
  return query;
}

/** 画面の URL 用のクエリ（ページ番号は含めない） */
export function studentSearchQuery(search: StudentSearchParams): URLSearchParams {
  return toQuery(search, "skills");
}

/** 並び順以外の絞り込み条件が 1 つでも指定されているか */
export function hasStudentFilters(search: StudentSearchParams): boolean {
  return toQuery({ ...search, sort: "newest" }, "skills").toString() !== "";
}

/** 企業向け: インターン生の検索結果（20 件ずつ） */
export function useStudents(search: StudentSearchParams, page: number) {
  const query = toQuery(search, "skills[]");
  query.set("page", String(page));
  return useSWR<{ students: StudentProfile[]; meta: PageMeta }>(`/students?${query}`, fetcher, {
    // 条件やページを切り替えている間も前の結果を表示したままにする（画面のちらつき防止）
    keepPreviousData: true,
  });
}

/**
 * 企業向け: インターン生の詳細（id はユーザー ID）。
 * conversation_id は、このインターン生との会話が既にあればその ID（無ければ null）
 */
export function useStudent(id: string) {
  return useSWR<{ student: StudentProfile; conversation_id: number | null }>(
    `/students/${encodeURIComponent(id)}`,
    fetcher,
  );
}
