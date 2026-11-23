"use client";

import { useState } from "react";
import { MarkdownBody } from "./MarkdownBody";

type Props = {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  rows?: number;
  placeholder?: string;
  requiredMark?: boolean;
  errors?: string[];
  /** 書き方の説明の前に付け足す説明 */
  hint?: string;
  /** プレビューで本文が空のときの表示 */
  emptyText?: string;
};

const TAB_CLASS =
  "rounded-t-lg border border-b-0 px-4 py-1.5 text-sm aria-selected:border-slate-300 aria-selected:bg-white aria-selected:font-medium aria-selected:text-indigo-700 border-transparent text-slate-500 hover:text-slate-700";

/**
 * Markdown の入力欄。「書く」「プレビュー」を切り替えて表示を確認できる。
 * プレビュー中も textarea は hidden で隠すだけにして DOM に残す
 * （FormData で値を読むフォームでも、プレビュー中に保存したとき値が抜けないようにするため）。
 */
export function MarkdownTextArea({
  label,
  name,
  value,
  onChange,
  maxLength,
  rows = 12,
  placeholder,
  requiredMark,
  errors = [],
  hint,
  emptyText = "まだ入力されていません。",
}: Props) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const id = `field-${name}`;
  const invalid = errors.length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end justify-between gap-2">
        <label htmlFor={id} className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {label}（Markdown）
          {requiredMark && <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-600">必須</span>}
        </label>
        <div role="tablist" aria-label={`${label}の表示切り替え`} className="flex gap-1">
          <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")} className={TAB_CLASS}>
            書く
          </button>
          <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={TAB_CLASS}>
            プレビュー
          </button>
        </div>
      </div>
      <textarea
        id={id}
        name={name}
        hidden={tab !== "write"}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : `${id}-hint`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-rose-500"
      />
      {tab === "preview" && (
        <div className="min-h-[10rem] rounded-lg border border-slate-300 bg-white px-4 py-2" aria-live="polite">
          {value.trim() ? <MarkdownBody>{value}</MarkdownBody> : <p className="py-4 text-slate-400">{emptyText}</p>}
        </div>
      )}
      {invalid ? (
        <ul id={`${id}-error`} className="text-sm text-rose-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        <p id={`${id}-hint`} className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
          <span>
            {hint && <>{hint} </>}
            見出し（##）・箇条書き・リンク・表などが使えます。画像はリンクとして表示されます。HTML タグは表示されません。
          </span>
          <span>
            {value.length.toLocaleString()} / {maxLength.toLocaleString()} 文字
          </span>
        </p>
      )}
    </div>
  );
}
