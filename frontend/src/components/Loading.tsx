/** 読み込み中の表示 */
export function Loading({ label = "読み込み中…" }: { label?: string }) {
  return (
    <p role="status" className="py-10 text-center text-sm text-slate-500">
      {label}
    </p>
  );
}
