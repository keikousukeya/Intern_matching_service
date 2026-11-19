"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_LABELS, useCurrentUser } from "@/lib/auth";

/** ログイン状態に応じてリンクを切り替えるヘッダー */
export function Header() {
  const router = useRouter();
  const { user, isLoading, logOut } = useCurrentUser();

  async function handleLogOut() {
    await logOut();
    router.push("/");
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          Intern Scout
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          {isLoading ? null : user ? (
            <>
              <span className="hidden text-slate-600 sm:inline">
                <span className="mr-2 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {ROLE_LABELS[user.role]}
                </span>
                {user.email}
              </span>
              <button
                type="button"
                onClick={handleLogOut}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
              >
                ログアウト
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-2 py-1.5 text-slate-700 hover:text-indigo-600">
                ログイン
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
              >
                新規登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
