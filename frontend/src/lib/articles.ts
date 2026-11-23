"use client";

import useSWR, { useSWRConfig } from "swr";
import { apiFetch, fetcher } from "./api";
import type { Role } from "./auth";
import type { PageMeta, SkillMatch } from "./students";

export type ArticleStatus = "draft" | "published";

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  published: "公開中",
  draft: "下書き",
};

/** 書いた人（表示名とロールだけ。メールアドレスなどは返らない） */
export type ArticleAuthor = { user_id: number; role: Role; name: string | null };

type ArticleBase = {
  id: number;
  title: string;
  status: ArticleStatus;
  published_at: string | null;
  skills: string[];
  author: ArticleAuthor;
  created_at: string;
  updated_at: string;
};

/** 一覧用（本文の代わりに抜粋） */
export type ArticleSummary = ArticleBase & { excerpt: string };

/** 詳細用（本文は Markdown） */
export type Article = ArticleBase & { body: string };

export type ArticleInput = {
  title: string;
  body: string;
  status: ArticleStatus;
  skill_names: string[];
};

/** 記事一覧の検索条件。空文字は「指定なし」 */
export type ArticleSearchParams = {
  q: string;
  skills: string[];
  skillMatch: SkillMatch;
  authorRole: Role | "";
  /** 書いた人のユーザー ID（インターン生・企業の詳細画面の「すべての記事を見る」から指定する） */
  authorId: string;
};

export const EMPTY_ARTICLE_SEARCH: ArticleSearchParams = {
  q: "",
  skills: [],
  skillMatch: "all",
  authorRole: "",
  authorId: "",
};

/** 画面の URL（/articles?q=...&skills=Ruby）から検索条件を読み取る */
export function parseArticleSearch(params: URLSearchParams): ArticleSearchParams {
  const authorRole = params.get("author_role");
  return {
    q: params.get("q") ?? "",
    skills: params.getAll("skills").filter(Boolean),
    skillMatch: params.get("skill_match") === "any" ? "any" : "all",
    authorRole: authorRole === "student" || authorRole === "company" ? authorRole : "",
    authorId: /^\d+$/.test(params.get("author_id") ?? "") ? params.get("author_id")! : "",
  };
}

/** 検索条件をクエリ文字列にする（skillsKey は画面の URL では "skills"、Rails に送るときは "skills[]"） */
function toQuery(search: ArticleSearchParams, skillsKey: string): URLSearchParams {
  const query = new URLSearchParams();
  if (search.q.trim()) query.set("q", search.q.trim());
  search.skills.forEach((skill) => query.append(skillsKey, skill));
  if (search.skills.length > 1 && search.skillMatch === "any") query.set("skill_match", "any");
  if (search.authorRole) query.set("author_role", search.authorRole);
  if (search.authorId) query.set("author_id", search.authorId);
  return query;
}

/** 画面の URL 用のクエリ（ページ番号は含めない） */
export function articleSearchQuery(search: ArticleSearchParams): URLSearchParams {
  return toQuery(search, "skills");
}

type ListResponse = { articles: ArticleSummary[]; meta: PageMeta };

const articleKey = (id: number | string) => `/articles/${encodeURIComponent(String(id))}`;
const MY_LIST_PREFIX = "/me/articles";
// 一覧（公開・自分の記事）のキャッシュ。作成・更新・削除したらまとめて取り直す
const isListKey = (key: unknown) =>
  typeof key === "string" && (key.startsWith("/articles?") || key.startsWith(MY_LIST_PREFIX));

/** 公開中の記事の一覧（新着順・20 件ずつ）。enabled が false なら取得しない */
export function useArticles(search: ArticleSearchParams, page: number, enabled = true) {
  const query = toQuery(search, "skills[]");
  query.set("page", String(page));
  return useSWR<ListResponse>(enabled ? `/articles?${query}` : null, fetcher, { keepPreviousData: true });
}

/** ある人が書いた公開中の記事（インターン生・企業の詳細画面用。最初の 20 件） */
export function useAuthorArticles(authorId: string | number) {
  return useSWR<ListResponse>(`/articles?${toQuery({ ...EMPTY_ARTICLE_SEARCH, authorId: String(authorId) }, "skills[]")}`, fetcher);
}

/** 記事の詳細（公開中のもの、または自分のもの） */
export function useArticle(id: string) {
  return useSWR<{ article: Article }>(articleKey(id), fetcher);
}

/** 自分の記事（下書きも含む。更新日時の新しい順） */
export function useMyArticles(page: number) {
  return useSWR<ListResponse>(`${MY_LIST_PREFIX}?page=${page}`, fetcher, { keepPreviousData: true });
}

/** 記事の作成・更新・削除。成功したら一覧のキャッシュも取り直す */
export function useArticleActions() {
  const { mutate } = useSWRConfig();

  return {
    async create(input: ArticleInput) {
      const { article } = await apiFetch<{ article: Article }>("/articles", {
        method: "POST",
        body: { article: input },
      });
      await mutate(isListKey);
      return article;
    },

    /** 一部の項目だけ（例: 公開状態）を送ることもできる */
    async update(id: number, input: Partial<ArticleInput>) {
      const { article } = await apiFetch<{ article: Article }>(articleKey(id), {
        method: "PUT",
        body: { article: input },
      });
      await Promise.all([mutate(articleKey(id), { article }, { revalidate: false }), mutate(isListKey)]);
      return article;
    },

    async remove(id: number) {
      await apiFetch<void>(articleKey(id), { method: "DELETE" });
      await Promise.all([mutate(articleKey(id), undefined, { revalidate: false }), mutate(isListKey)]);
    },
  };
}
