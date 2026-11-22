"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ApiError } from "@/lib/api";
import { formatShortDateTime } from "@/lib/format";
import { useJobPostingActions, useMyJobPostings, type JobPosting } from "@/lib/jobPostings";
import { FormAlert } from "./FormAlert";
import { deadlineText, StatusBadge, WorkStyleBadge } from "./JobPostingParts";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";

/** 企業向け: 自社の募集の管理（作成・編集・公開/非公開の切り替え・削除） */
export function MyJobPostingList() {
  return <RequireUser role="company">{(user) => <List hasProfile={user.has_profile} />}</RequireUser>;
}

function List({ hasProfile }: { hasProfile: boolean }) {
  const searchParams = useSearchParams();
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const { data, error, isLoading } = useMyJobPostings(page);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="募集を読み込めませんでした。" />;

  const { job_postings: postings, meta } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          自社の募集 <span className="mx-1 text-base font-bold text-slate-800">{meta.total_count}</span>件
        </p>
        {hasProfile ? (
          <Link
            href="/mypage/job_postings/new"
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
          >
            ＋ 新しい募集を作成
          </Link>
        ) : (
          <p className="text-sm text-amber-700">
            募集を作成するには
            <Link href="/mypage/profile" className="mx-1 text-indigo-600 hover:underline">
              企業プロフィール
            </Link>
            を登録してください。
          </p>
        )}
      </div>

      <FormAlert message={actionError} />

      {postings.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
          {meta.total_count === 0 ? "まだ募集はありません。" : "このページには募集がありません。"}
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {postings.map((posting) => (
            <li key={posting.id}>
              <Row posting={posting} onError={setActionError} />
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={meta} basePath="/mypage/job_postings" />

      <Link href="/job_postings" className="self-start text-sm text-indigo-600 hover:underline">
        公開中の募集一覧（他社の募集を含む）を見る →
      </Link>
    </div>
  );
}

function Row({ posting, onError }: { posting: JobPosting; onError: (message: string | null) => void }) {
  const { update, remove } = useJobPostingActions();
  const [busy, setBusy] = useState(false);
  const published = posting.status === "published";

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
    void run(() => update(posting.id, { status: published ? "draft" : "published" }));
  }

  function handleDelete() {
    if (!window.confirm(`「${posting.title}」を削除しますか？\nこの操作は取り消せません（送信済みのスカウトのメッセージは残ります）。`)) return;
    void run(() => remove(posting.id));
  }

  const buttonClass =
    "rounded-lg border px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge posting={posting} showPublished />
          <WorkStyleBadge workStyle={posting.work_style} />
        </div>
        <h2 className="truncate font-bold">
          <Link href={`/job_postings/${posting.id}`} className="hover:text-indigo-600 hover:underline">
            {posting.title}
          </Link>
        </h2>
        <p className="text-xs text-slate-500">
          締切: {deadlineText(posting.deadline)}・更新: {formatShortDateTime(posting.updated_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href={`/mypage/job_postings/${posting.id}/edit`}
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
          {published ? "非公開にする" : "公開する"}
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
