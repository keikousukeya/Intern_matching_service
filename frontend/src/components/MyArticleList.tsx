"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { useArticleActions, useMyArticles, type ArticleSummary } from "@/lib/articles";
import { formatShortDateTime } from "@/lib/format";
import { ArticleStatusBadge } from "./ArticleParts";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";

/** 自分の記事の管理（作成・編集・公開/下書きの切り替え・削除）。インターン生・企業のどちらも使える */
export function MyArticleList() {
  return <RequireUser>{(user) => <List hasProfile={user.has_profile} />}</RequireUser>;
}

function List({ hasProfile }: { hasProfile: boolean }) {
  const searchParams = useSearchParams();
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const { data, error, isLoading } = useMyArticles(page);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="記事を読み込めませんでした。" />;

  const { articles, meta } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          自分の記事 <span className="mx-1 text-base font-bold text-slate-800">{meta.total_count}</span>件
        </p>
        {hasProfile ? (
          <Link
            href="/mypage/articles/new"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            ＋ 記事を書く
          </Link>
        ) : (
          <p className="text-sm text-amber-700">
            記事を書くには
            <Link href="/mypage/profile" className="mx-1 text-indigo-600 hover:underline">
              プロフィール
            </Link>
            を登録してください。
          </p>
        )}
      </div>

      <FormAlert message={actionError} />

      {articles.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
          {meta.total_count === 0 ? "まだ記事はありません。" : "このページには記事がありません。"}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {articles.map((article) => (
            <li key={article.id}>
              <Row article={article} onError={setActionError} />
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={meta} basePath="/mypage/articles" />

      <Link href="/articles" className="self-start text-sm text-indigo-600 hover:underline">
        公開中の記事一覧を見る →
      </Link>
    </div>
  );
}

function Row({ article, onError }: { article: ArticleSummary; onError: (message: string | null) => void }) {
  const { update, remove } = useArticleActions();
  const [busy, setBusy] = useState(false);
  const published = article.status === "published";

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    onError(null);
    try {
      await action();
    } catch (error) {
      onError(error instanceof ApiError ? error.message : "操作に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setBusy(false);
    }
  }

  function toggleStatus() {
    void run(() => update(article.id, { status: published ? "draft" : "published" }));
  }

  function handleDelete() {
    if (!window.confirm(`「${article.title}」を削除しますか？\nこの操作は取り消せません。`)) return;
    void run(() => remove(article.id));
  }

  const buttonClass = "rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <ArticleStatusBadge status={article.status} showPublished />
        </div>
        <h2 className="truncate font-bold">
          <Link href={`/articles/${article.id}`} className="hover:text-indigo-600 hover:underline">
            {article.title}
          </Link>
        </h2>
        <p className="text-xs text-slate-500">更新: {formatShortDateTime(article.updated_at)}</p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/mypage/articles/${article.id}/edit`}
          className={`${buttonClass} border-slate-300 text-slate-700 hover:bg-slate-50`}
        >
          編集
        </Link>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={busy}
          className={`${buttonClass} border-indigo-300 text-indigo-700 hover:bg-indigo-50`}
        >
          {published ? "下書きに戻す" : "公開する"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          className={`${buttonClass} border-rose-300 text-rose-700 hover:bg-rose-50`}
        >
          削除
        </button>
      </div>
    </article>
  );
}
