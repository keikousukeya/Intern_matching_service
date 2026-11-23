"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

/** 適用中の条件を 1 つ表す（× で外せる） */
export type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type Props = {
  /** フォーム全体の名前（読み上げ用。例: 「募集の検索」） */
  ariaLabel: string;
  /** キーワード欄 */
  keyword: { defaultValue: string; placeholder: string; hint: string };
  /** 適用中の詳細条件（キーワード以外）。数を「詳細条件」ボタンに表示する */
  chips: FilterChip[];
  /** キーワードを含め、何か条件が指定されているか（「条件をクリア」の表示に使う） */
  hasFilters: boolean;
  onSubmit: (form: FormData) => void;
  onClear: () => void;
  /** 詳細条件の入力欄（折りたたみの中に表示する） */
  children: ReactNode;
};

/**
 * 一覧ページ共通の検索欄。
 * キーワードだけを常に表示し、それ以外の条件は「詳細条件」で開閉する（一覧が画面の下に押し出されないようにするため）。
 * 閉じている間も詳細条件の入力欄は hidden で残すので、キーワードだけで検索しても他の条件は保たれる。
 */
export function SearchPanel({ ariaLabel, keyword, chips, hasFilters, onSubmit, onClear, children }: Props) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const hintId = useId();
  const keywordId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // 検索したら詳細条件を閉じて、結果が見えるようにする
    setOpen(false);
    onSubmit(new FormData(event.currentTarget));
  }

  return (
    <form
      role="search"
      aria-label={ariaLabel}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
    >
      <div className="flex flex-wrap gap-2">
        <label htmlFor={keywordId} className="sr-only">
          キーワード
        </label>
        <div className="relative min-w-0 flex-1 basis-full sm:basis-0">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-400"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.45 4.39l3.08 3.08a.75.75 0 1 1-1.06 1.06l-3.08-3.08A7 7 0 0 1 2 9Z"
              clipRule="evenodd"
            />
          </svg>
          <input
            id={keywordId}
            name="q"
            type="search"
            defaultValue={keyword.defaultValue}
            maxLength={100}
            placeholder={keyword.placeholder}
            aria-describedby={hintId}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-10 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
        </div>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 sm:flex-none"
        >
          検索
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 sm:flex-none"
        >
          詳細条件
          {chips.length > 0 && (
            <span className="rounded-full bg-indigo-600 px-2 text-xs leading-5 font-medium text-white">
              {chips.length}
              <span className="sr-only">件指定中</span>
            </span>
          )}
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`size-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* 閉じている間も入力値を送るため、外さずに hidden で隠す */}
      <div id={panelId} hidden={!open} className="flex flex-col gap-5 border-t border-slate-100 px-1 pt-4 pb-1">
        <p id={hintId} className="text-xs text-slate-500">
          キーワード: {keyword.hint}
        </p>
        {children}
        <div className="flex justify-end">
          <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700">
            この条件で検索
          </button>
        </div>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {chips.length > 0 && <span className="text-slate-500">絞り込み中:</span>}
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="flex items-center gap-1 rounded-full border border-indigo-100 bg-indigo-50 py-0.5 pr-1 pl-3 text-indigo-800"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                aria-label={`「${chip.label}」の条件を外す`}
                className="flex size-5 items-center justify-center rounded-full text-indigo-500 hover:bg-indigo-100 hover:text-indigo-700"
              >
                ×
              </button>
            </span>
          ))}
          <button type="button" onClick={onClear} className="ml-auto text-indigo-600 hover:underline">
            条件をクリア
          </button>
        </div>
      )}
    </form>
  );
}
