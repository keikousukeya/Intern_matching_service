"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useId, useState } from "react";
import { ROLE_LABELS, useCurrentUser, type Role } from "@/lib/auth";
import { useUnreadCount } from "@/lib/messages";

const MESSAGES_HREF = "/messages";

/**
 * ロールごとのメニュー。プロフィール・募集管理・記事管理はマイページ（/mypage 配下）にまとめ、リンクを 4 つに絞った。
 * リンク先またはその配下のページ（例: /mypage/profile）を表示中のとき、そのリンクを強調する。
 */
const NAV_LINKS: Record<Role, { href: string; label: string }[]> = {
  student: [
    { href: "/job_postings", label: "募集を探す" },
    { href: "/articles", label: "技術ブログ" },
    { href: MESSAGES_HREF, label: "メッセージ" },
    { href: "/mypage", label: "マイページ" },
  ],
  company: [
    { href: "/students", label: "インターン生を探す" },
    { href: "/articles", label: "技術ブログ" },
    { href: MESSAGES_HREF, label: "メッセージ" },
    { href: "/mypage", label: "マイページ" },
  ],
};

/** 未読数のバッジ */
function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      className="rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-bold leading-none text-white"
      aria-label={`未読 ${count} 件`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** ログイン状態に応じてリンクを切り替えるヘッダー。スマホ幅ではメニューを開閉式にする */
export function Header() {
  const router = useRouter();
  const { user, isLoading, logOut } = useCurrentUser();
  // 未読メッセージ数（ログイン中のみ定期的に取得する）
  const unreadCount = useUnreadCount(user !== null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  // Esc でメニューを閉じる
  useEffect(() => {
    if (!menuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  async function handleLogOut() {
    setMenuOpen(false);
    await logOut();
    router.push("/");
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" onClick={closeMenu} className="text-lg font-bold text-indigo-600">
          Intern Scout
        </Link>

        {isLoading ? null : user ? (
          <>
            {/* スマホ幅だけに出すメニューの開閉ボタン。閉じていても未読があることは分かるようにする */}
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls={menuId}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 md:hidden"
            >
              <MenuIcon open={menuOpen} />
              {menuOpen ? "閉じる" : "メニュー"}
              {!menuOpen && <UnreadBadge count={unreadCount} />}
            </button>

            <nav
              id={menuId}
              aria-label="メインメニュー"
              className={`${menuOpen ? "flex" : "hidden"} w-full flex-col gap-1 border-t border-slate-100 pt-2 text-sm md:flex md:w-auto md:flex-row md:items-center md:gap-3 md:border-0 md:pt-0`}
            >
              {/* 現在のページの判定（usePathname）は URL に依存するため Suspense で囲む（Cache Components の要件） */}
              <Suspense fallback={null}>
                <NavLinks role={user.role} unreadCount={unreadCount} onNavigate={closeMenu} />
              </Suspense>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-3 md:mt-0 md:border-0 md:p-0">
                <span className="min-w-0 truncate text-slate-600 md:hidden lg:inline">
                  <span className="mr-2 rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                    {ROLE_LABELS[user.role]}
                  </span>
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogOut}
                  className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  ログアウト
                </button>
              </div>
            </nav>
          </>
        ) : (
          <nav aria-label="メインメニュー" className="flex items-center gap-3 text-sm">
            <Link href="/login" className="px-2 py-1.5 text-slate-700 hover:text-indigo-600">
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700"
            >
              新規登録
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

/** ロールごとのメニュー。表示中のページのリンクを強調し、メッセージには未読数のバッジを付ける */
function NavLinks({ role, unreadCount, onNavigate }: { role: Role; unreadCount: number; onNavigate: () => void }) {
  const pathname = usePathname();

  return NAV_LINKS[role].map((link) => (
    <Link
      key={link.href}
      href={link.href}
      onClick={onNavigate}
      aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 aria-[current=page]:font-medium aria-[current=page]:text-indigo-600 md:py-1.5 md:hover:bg-transparent"
    >
      {link.label}
      {link.href === MESSAGES_HREF && <UnreadBadge count={unreadCount} />}
    </Link>
  ));
}

/** メニューの開閉アイコン（三本線 / ×） */
function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      {open ? (
        <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
      ) : (
        <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
      )}
    </svg>
  );
}
