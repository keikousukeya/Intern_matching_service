"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import { ROLE_LABELS, useCurrentUser, type Role } from "@/lib/auth";

/** ロールごとのメニュー */
const NAV_LINKS: Record<Role, { href: string; label: string }[]> = {
  student: [{ href: "/mypage/profile", label: "プロフィール" }],
  company: [
    { href: "/students", label: "インターン生を探す" },
    { href: "/mypage/profile", label: "企業プロフィール" },
  ],
};

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
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          Intern Scout
        </Link>

        <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {isLoading ? null : user ? (
            <>
              {/* 現在のページの判定（usePathname）は URL に依存するため Suspense で囲む（Cache Components の要件） */}
              <Suspense fallback={null}>
                <NavLinks role={user.role} />
              </Suspense>
              <span className="hidden text-slate-600 md:inline">
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

/** ロールごとのメニュー。表示中のページのリンクを強調する */
function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();

  return NAV_LINKS[role].map((link) => (
    <Link
      key={link.href}
      href={link.href}
      aria-current={pathname.startsWith(link.href) ? "page" : undefined}
      className="px-2 py-1.5 text-slate-700 hover:text-indigo-600 aria-[current=page]:font-medium aria-[current=page]:text-indigo-600"
    >
      {link.label}
    </Link>
  ));
}
