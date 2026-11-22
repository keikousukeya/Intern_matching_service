import Link from "next/link";
import { ARTICLE_STATUS_LABELS, type ArticleAuthor, type ArticleStatus } from "@/lib/articles";
import { ROLE_LABELS, type User } from "@/lib/auth";

// 技術ブログの画面で共通に使う小さな部品

/** 書いた人の区分（インターン生・企業）のラベル */
export function AuthorRoleBadge({ author }: { author: ArticleAuthor }) {
  const className =
    author.role === "company" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{ROLE_LABELS[author.role]}</span>
  );
}

/**
 * 書いた人の名前。プロフィールを見られる場合だけリンクにする。
 *   - 企業: 企業詳細はログインユーザー全員が見られる
 *   - インターン生: プロフィールは企業にだけ公開しているため、閲覧者が企業のときだけリンクにする
 */
export function AuthorName({ author, viewer, className = "" }: { author: ArticleAuthor; viewer: User; className?: string }) {
  const name = author.name ?? "（名前未登録）";
  const href =
    author.role === "company" ? `/companies/${author.user_id}` : viewer.role === "company" ? `/students/${author.user_id}` : null;

  if (!href) return <span className={className}>{name}</span>;
  return (
    <Link href={href} className={`relative z-10 hover:text-indigo-600 hover:underline ${className}`}>
      {name}
    </Link>
  );
}

/** 公開状態のラベル（下書きのときだけ出す。showPublished で「公開中」も出す） */
export function ArticleStatusBadge({ status, showPublished = false }: { status: ArticleStatus; showPublished?: boolean }) {
  if (status === "draft") {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        {ARTICLE_STATUS_LABELS.draft}
      </span>
    );
  }
  if (!showPublished) return null;
  return (
    <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
      {ARTICLE_STATUS_LABELS.published}
    </span>
  );
}
