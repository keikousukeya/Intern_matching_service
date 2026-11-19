"use client";

import Link from "next/link";
import { ROLE_LABELS, useCurrentUser } from "@/lib/auth";

/** トップページの案内。ログイン状態で表示を切り替える */
export function Welcome() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return <div className="h-12" aria-hidden />;

  if (user) {
    return (
      <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-800">
        {ROLE_LABELS[user.role]}アカウント（{user.email}）でログイン中です。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        href="/signup"
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-indigo-700"
      >
        無料で登録する
      </Link>
      <Link
        href="/login"
        className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center font-medium text-slate-700 hover:bg-slate-50"
      >
        ログイン
      </Link>
    </div>
  );
}
