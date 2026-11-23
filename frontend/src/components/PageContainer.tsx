import Link from "next/link";
import type { ReactNode } from "react";

/** マイページ配下の画面に付ける「マイページへ戻る」リンク */
export const MYPAGE_BACK = { href: "/mypage", label: "マイページへ戻る" };

/** ログイン後の画面の共通枠（戻るリンク・見出し・説明・本文） */
export function PageContainer({
  title,
  description,
  width = "default",
  back,
  children,
}: {
  title?: string;
  description?: string;
  width?: "default" | "narrow";
  /** 見出しの上に出す戻るリンク（例: マイページ配下の画面からマイページへ） */
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:py-12 ${width === "narrow" ? "max-w-3xl" : "max-w-5xl"}`}
    >
      {back && (
        <Link href={back.href} className="-mb-3 self-start text-sm text-indigo-600 hover:underline">
          ← {back.label}
        </Link>
      )}
      {title && (
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-sm text-slate-600">{description}</p>}
        </div>
      )}
      {children}
    </main>
  );
}
