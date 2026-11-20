"use client";

import Link from "next/link";
import { ROLE_LABELS, useCurrentUser } from "@/lib/auth";

const PRIMARY_LINK = "rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-indigo-700";
const SECONDARY_LINK =
  "rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center font-medium text-slate-700 hover:bg-slate-50";

/** トップページの案内。ログイン状態・プロフィールの登録状況で表示を切り替える */
export function Welcome() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return <div className="h-12" aria-hidden />;

  if (!user) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/signup" className={PRIMARY_LINK}>
          無料で登録する
        </Link>
        <Link href="/login" className={SECONDARY_LINK}>
          ログイン
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-indigo-800">
        {ROLE_LABELS[user.role]}アカウント（{user.email}）でログイン中です。
        {!user.has_profile &&
          (user.role === "student"
            ? "プロフィールを登録して、企業からのスカウトを受け取りましょう。"
            : "まずは企業プロフィールを登録しましょう。")}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {user.role === "company" && (
          <Link href="/students" className={user.has_profile ? PRIMARY_LINK : SECONDARY_LINK}>
            インターン生を探す
          </Link>
        )}
        <Link href="/messages" className={user.role === "student" && user.has_profile ? PRIMARY_LINK : SECONDARY_LINK}>
          {user.role === "student" ? "届いたメッセージを見る" : "メッセージ一覧"}
        </Link>
        <Link href="/mypage/profile" className={user.has_profile ? SECONDARY_LINK : PRIMARY_LINK}>
          {user.has_profile ? "プロフィールを編集する" : "プロフィールを登録する"}
        </Link>
      </div>
    </div>
  );
}
