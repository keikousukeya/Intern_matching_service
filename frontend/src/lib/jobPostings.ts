"use client";

import useSWR, { useSWRConfig } from "swr";
import { apiFetch, fetcher } from "./api";
import type { PageMeta, SkillMatch } from "./students";

export type WorkStyle = "onsite" | "remote" | "hybrid";
export type JobPostingStatus = "draft" | "published";

export const WORK_STYLE_LABELS: Record<WorkStyle, string> = {
  remote: "リモート",
  hybrid: "ハイブリッド",
  onsite: "出社",
};

export const STATUS_LABELS: Record<JobPostingStatus, string> = {
  published: "公開中",
  draft: "非公開",
};

/** 募集（F-03） */
export type JobPosting = {
  id: number;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  starts_on: string | null;
  ends_on: string | null;
  work_style: WorkStyle;
  compensation: string | null;
  headcount: number | null;
  deadline: string | null;
  status: JobPostingStatus;
  published_at: string | null;
  /** 締切を過ぎているか */
  closed: boolean;
  skills: string[];
  company: { user_id: number; company_name: string | null };
  created_at: string;
  updated_at: string;
};

/** メッセージに添える募集の要約（スカウトのカード表示用） */
export type JobPostingSummary = Pick<JobPosting, "id" | "title" | "work_style" | "deadline" | "status" | "closed">;

/** 保存時に送る値。日付や数値もフォームの文字列のまま送り、Rails 側で型変換する */
export type JobPostingInput = {
  title: string;
  description: string;
  starts_on: string;
  ends_on: string;
  work_style: string;
  compensation: string;
  headcount: string;
  deadline: string;
  status: JobPostingStatus;
  skill_names: string[];
};

export type JobPostingSort = "newest" | "deadline";

/** 募集一覧の検索条件。空文字は「指定なし」 */
export type JobPostingSearchParams = {
  q: string;
  skills: string[];
  skillMatch: SkillMatch;
  workStyle: WorkStyle | "";
  sort: JobPostingSort;
};

export const EMPTY_JOB_SEARCH: JobPostingSearchParams = {
  q: "",
  skills: [],
  skillMatch: "all",
  workStyle: "",
  sort: "newest",
};

function isWorkStyle(value: string | null): value is WorkStyle {
  return value !== null && value in WORK_STYLE_LABELS;
}

/** 画面の URL（/job_postings?q=...&skills=Ruby）から検索条件を読み取る */
export function parseJobPostingSearch(params: URLSearchParams): JobPostingSearchParams {
  const workStyle = params.get("work_style");
  return {
    q: params.get("q") ?? "",
    skills: params.getAll("skills").filter(Boolean),
    skillMatch: params.get("skill_match") === "any" ? "any" : "all",
    workStyle: isWorkStyle(workStyle) ? workStyle : "",
    sort: params.get("sort") === "deadline" ? "deadline" : "newest",
  };
}

/** 検索条件をクエリ文字列にする（skillsKey は画面の URL では "skills"、Rails に送るときは "skills[]"） */
function toQuery(search: JobPostingSearchParams, skillsKey: string): URLSearchParams {
  const query = new URLSearchParams();
  if (search.q.trim()) query.set("q", search.q.trim());
  search.skills.forEach((skill) => query.append(skillsKey, skill));
  if (search.skills.length > 1 && search.skillMatch === "any") query.set("skill_match", "any");
  if (search.workStyle) query.set("work_style", search.workStyle);
  if (search.sort !== "newest") query.set("sort", search.sort);
  return query;
}

/** 画面の URL 用のクエリ（ページ番号は含めない） */
export function jobPostingSearchQuery(search: JobPostingSearchParams): URLSearchParams {
  return toQuery(search, "skills");
}

/** 並び順以外の絞り込み条件が 1 つでも指定されているか */
export function hasJobPostingFilters(search: JobPostingSearchParams): boolean {
  return toQuery({ ...search, sort: "newest" }, "skills").toString() !== "";
}

type ListResponse = { job_postings: JobPosting[]; meta: PageMeta };

const postingKey = (id: number | string) => `/job_postings/${encodeURIComponent(String(id))}`;
const MY_LIST_PREFIX = "/me/job_postings";
// 一覧（公開・自社）のキャッシュ。作成・更新・削除したらまとめて取り直す
const isListKey = (key: unknown) =>
  typeof key === "string" && (key.startsWith("/job_postings?") || key.startsWith(MY_LIST_PREFIX));

/** 公開中で締切前の募集の一覧（20 件ずつ）。enabled が false なら取得しない */
export function useJobPostings(search: JobPostingSearchParams, page: number, enabled = true) {
  const query = toQuery(search, "skills[]");
  query.set("page", String(page));
  return useSWR<ListResponse>(enabled ? `/job_postings?${query}` : null, fetcher, { keepPreviousData: true });
}

/** ある企業の公開中の募集（企業詳細の画面用。最初の 20 件） */
export function useCompanyJobPostings(companyId: string) {
  return useSWR<ListResponse>(`/job_postings?company_id=${encodeURIComponent(companyId)}`, fetcher);
}

/** 募集の詳細（公開中のもの、または自社のもの） */
export function useJobPosting(id: string) {
  return useSWR<{ job_posting: JobPosting }>(postingKey(id), fetcher);
}

/** 企業: 自社の募集（非公開・締切済みも含む。更新日時の新しい順）。enabled が false なら取得しない */
export function useMyJobPostings(page: number, enabled = true) {
  return useSWR<ListResponse>(enabled ? `${MY_LIST_PREFIX}?page=${page}` : null, fetcher, { keepPreviousData: true });
}

/** 企業: 募集の作成・更新・削除。成功したら一覧のキャッシュも取り直す */
export function useJobPostingActions() {
  const { mutate } = useSWRConfig();

  return {
    async create(input: JobPostingInput) {
      const { job_posting } = await apiFetch<{ job_posting: JobPosting }>("/job_postings", {
        method: "POST",
        body: { job_posting: input },
      });
      await mutate(isListKey);
      return job_posting;
    },

    /** 一部の項目だけ（例: 公開状態）を送ることもできる */
    async update(id: number, input: Partial<JobPostingInput>) {
      const { job_posting } = await apiFetch<{ job_posting: JobPosting }>(postingKey(id), {
        method: "PUT",
        body: { job_posting: input },
      });
      await Promise.all([mutate(postingKey(id), { job_posting }, { revalidate: false }), mutate(isListKey)]);
      return job_posting;
    },

    async remove(id: number) {
      await apiFetch<void>(postingKey(id), { method: "DELETE" });
      await Promise.all([mutate(postingKey(id), undefined, { revalidate: false }), mutate(isListKey)]);
    },
  };
}
