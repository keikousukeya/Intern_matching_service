import type { ReactNode } from "react";

/** ログイン後の画面の共通枠（見出し・説明・本文） */
export function PageContainer({
  title,
  description,
  width = "default",
  children,
}: {
  title?: string;
  description?: string;
  width?: "default" | "narrow";
  children: ReactNode;
}) {
  return (
    <main
      className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-8 sm:py-12 ${width === "narrow" ? "max-w-3xl" : "max-w-5xl"}`}
    >
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
