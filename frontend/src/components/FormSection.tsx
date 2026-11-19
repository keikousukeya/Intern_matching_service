import type { ReactNode } from "react";

/** フォーム内の見出しつきまとまり */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      {children}
    </section>
  );
}

/** 保存ボタンと保存完了メッセージ */
export function SubmitRow({ submitting, notice }: { submitting: boolean; notice: string | null }) {
  return (
    <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
      {notice && (
        <p role="status" className="text-sm text-emerald-700">
          {notice}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "保存中…" : "保存する"}
      </button>
    </div>
  );
}
