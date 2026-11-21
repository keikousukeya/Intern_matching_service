import Link from "next/link";
import type { PageMeta } from "@/lib/students";

type Props = {
  meta: PageMeta;
  basePath: string;
  /** ページを移動しても引き継ぐクエリ（検索条件など）。page は含めない */
  query?: URLSearchParams;
};

/** 前へ / 次へ のページ送り（?page=n のリンク） */
export function Pagination({ meta, basePath, query }: Props) {
  if (meta.total_pages <= 1) return null;

  const linkClass = "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50";
  const disabledClass = "rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-300";

  function href(page: number) {
    const params = new URLSearchParams(query);
    params.set("page", String(page));
    return `${basePath}?${params}`;
  }

  return (
    <nav aria-label="ページ送り" className="flex items-center justify-between gap-4">
      {meta.page > 1 ? (
        <Link href={href(meta.page - 1)} className={linkClass}>
          ← 前へ
        </Link>
      ) : (
        <span className={disabledClass}>← 前へ</span>
      )}
      <span className="text-sm text-slate-600">
        {meta.page} / {meta.total_pages} ページ
      </span>
      {meta.page < meta.total_pages ? (
        <Link href={href(meta.page + 1)} className={linkClass}>
          次へ →
        </Link>
      ) : (
        <span className={disabledClass}>次へ →</span>
      )}
    </nav>
  );
}
