"use client";

import Link from "next/link";
import { ROLE_LABELS, useCurrentUser, type User } from "@/lib/auth";
import { useUnreadCount } from "@/lib/messages";
import { Recommendations } from "./Recommendations";

const PRIMARY_LINK = "rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-indigo-700";
const SECONDARY_LINK =
  "rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-center font-medium text-slate-700 hover:bg-slate-50";

/**
 * トップページ。未ログインならサービスの紹介と登録・ログインの導線、
 * ログイン後はホーム（プロフィール・未読の案内とおすすめ）を出す。
 */
export function Welcome() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) return <div className="h-40" aria-hidden />;
  return user ? <Home user={user} /> : <Intro />;
}

function Intro() {
  return (
    <div className="flex flex-col gap-8 py-4 sm:py-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          インターン生と企業を、
          <br className="sm:hidden" />
          スカウトでつなぐ。
        </h1>
        <p className="max-w-2xl text-slate-600">
          インターン生はプロフィールを登録して、企業からのスカウトを受け取れます。
          企業はスキルや稼働できる期間からインターン生を探し、直接メッセージを送れます。
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/signup" className={PRIMARY_LINK}>
          無料で登録する
        </Link>
        <Link href="/login" className={SECONDARY_LINK}>
          ログイン
        </Link>
      </div>
    </div>
  );
}

function Home({ user }: { user: User }) {
  const unread = useUnreadCount(true);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold">ホーム</h1>
          <p className="text-sm text-slate-600">
            {ROLE_LABELS[user.role]}アカウント（<span className="break-all">{user.email}</span>）でログイン中です。
          </p>
        </div>

        {!user.has_profile && (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {user.role === "student"
                ? "プロフィールを登録して、企業からのスカウトを受け取りましょう。スキルを入力すると、合う募集が表示されます。"
                : "まずは企業プロフィールを登録しましょう。登録すると、スカウト・募集の作成・記事の投稿ができるようになります。"}
            </p>
            <Link href="/mypage/profile" className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700">
              プロフィールを登録する
            </Link>
          </div>
        )}

        {unread > 0 && (
          <Link
            href="/messages"
            className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 hover:bg-rose-100"
          >
            <span>
              未読のメッセージが <span className="font-bold">{unread}</span> 件あります。
            </span>
            <span className="shrink-0 font-medium">メッセージを見る →</span>
          </Link>
        )}
      </div>

      <Recommendations user={user} />
    </div>
  );
}
