import Link from "next/link";
import type { PageMeta } from "@/lib/students";

/** 前へ / 次へ のページ送り（?page=n のリンク） */
export function Pagination({ meta, basePath }: { meta: PageMeta; basePath: string }) {
  if (meta.total_pages <= 1) return null;

  const linkClass = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50";
  const disabledClass = "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-300";

  return (
    <nav aria-label="ページ送り" className="flex items-center justify-between gap-4">
      {meta.page > 1 ? (
        <Link href={`${basePath}?page=${meta.page - 1}`} className={linkClass}>
          ← 前へ
        </Link>
      ) : (
        <span className={disabledClass}>← 前へ</span>
      )}
      <span className="text-sm text-slate-600">
        {meta.page} / {meta.total_pages} ページ
      </span>
      {meta.page < meta.total_pages ? (
        <Link href={`${basePath}?page=${meta.page + 1}`} className={linkClass}>
          次へ →
        </Link>
      ) : (
        <span className={disabledClass}>次へ →</span>
      )}
    </nav>
  );
}
