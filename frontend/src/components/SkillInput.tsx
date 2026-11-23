"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { SkillTag } from "./SkillTag";

export const MAX_SKILLS = 20;
const MAX_SKILL_LENGTH = 30;

/** スキルの分類（Rails の Skill.category と同じ値） */
type SkillCategory = "language" | "framework" | "infrastructure" | "design" | "other";

/** 「よく使われているスキル」を分けて表示する順番と見出し */
const CATEGORIES: { key: SkillCategory; label: string }[] = [
  { key: "language", label: "言語" },
  { key: "framework", label: "フレームワーク" },
  { key: "infrastructure", label: "インフラ・ツール" },
  { key: "design", label: "デザイン" },
  { key: "other", label: "その他" },
];

type Props = {
  value: string[];
  onChange: (skills: string[]) => void;
  errors?: string[];
  /** 検索フォームなど、プロフィール編集以外で使うときに表示を変える */
  label?: string;
  hint?: string;
  max?: number;
};

/** 候補リストの 1 行。既存のスキルか、候補に無いスキルを新しく追加する行 */
type Option = { kind: "existing" | "new"; name: string };

type SkillsResponse = { skills: { name: string; category: SkillCategory }[] };

const SWR_OPTIONS = { keepPreviousData: true, revalidateOnFocus: false };

/** 入力が止まってから値を反映する（1 文字ごとに API を呼ばないため） */
function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** 空白をまとめて前後を削り、長さを制限する（サーバー側の正規化に合わせる） */
function normalize(raw: string) {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_SKILL_LENGTH);
}

/**
 * スキルの入力（候補つき自由入力）。
 * - 入力中は、文字に部分一致するスキルを入力欄の下の候補リストに出す（矢印キー・Enter で選択、Esc で閉じる）
 * - 候補に無いスキルは、リストの最後の「新しく追加」から登録できる
 * - よく使われているスキル（上位 20 個）を分類ごとに並べ、クリックで追加・もう一度押すと解除できる
 * 大文字小文字だけが違うものは重複として追加しない（サーバー側でも同じ扱い）。
 *
 * ブラウザ標準の <datalist> は見た目を変えられず、表示もブラウザごとに違うため、
 * WAI-ARIA の combobox パターンで独自に作っている。
 */
export function SkillInput({ value, onChange, errors = [], label = "スキル", hint, max = MAX_SKILLS }: Props) {
  // 1 つの画面に複数置いても ID が重ならないようにする
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const hintId = `${baseId}-hint`;
  const errorId = `${baseId}-error`;
  const optionId = (index: number) => `${baseId}-option-${index}`;

  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  // キーボードで選んでいる候補の位置（-1 は未選択）
  const [activeIndex, setActiveIndex] = useState(-1);

  const name = normalize(text);
  const query = useDebounced(name);
  // 入力前に並べる人気のスキル（q なしで人気順が返る）
  const { data: popularData } = useSWR<SkillsResponse>("/skills?q=", fetcher, SWR_OPTIONS);
  // 入力中の候補（入力が空のときは取得しない）
  const { data: searchData } = useSWR<SkillsResponse>(
    query ? `/skills?q=${encodeURIComponent(query)}` : null,
    fetcher,
    SWR_OPTIONS,
  );

  const lowerValue = value.map((skill) => skill.toLowerCase());
  const isSelected = (skill: string) => lowerValue.includes(skill.toLowerCase());
  const isFull = value.length >= max;
  const lowerName = name.toLowerCase();

  // 前回の入力の結果が残っていることがあるため、今の入力に一致するものだけに絞る
  const matches = name
    ? (searchData?.skills ?? [])
        .map((skill) => skill.name)
        .filter((skill) => skill.toLowerCase().includes(lowerName) && !isSelected(skill))
    : [];
  const hasExactMatch = matches.some((skill) => skill.toLowerCase() === lowerName);
  const alreadyAdded = name !== "" && isSelected(name);
  const options: Option[] = [
    ...matches.map((skill): Option => ({ kind: "existing", name: skill })),
    ...(name && !hasExactMatch && !alreadyAdded ? [{ kind: "new" as const, name }] : []),
  ];
  const showList = isOpen && !isFull && name !== "" && (options.length > 0 || alreadyAdded);
  // 候補が減ったときに範囲外を指さないようにする
  const current = activeIndex < options.length ? activeIndex : -1;

  // よく使われているスキルを分類ごとにまとめる（分類の中は人気順のまま）。スキルが無い分類は出さない
  const popularGroups = CATEGORIES.map((category) => ({
    ...category,
    skills: (popularData?.skills ?? []).filter((skill) => skill.category === category.key).map((skill) => skill.name),
  })).filter((group) => group.skills.length > 0);

  /** よく使われているスキルのボタン: 未選択なら追加、選択中なら解除する */
  function toggle(skill: string) {
    const selected = value.find((item) => item.toLowerCase() === skill.toLowerCase());
    if (selected) remove(selected);
    else add(skill);
  }

  function add(raw: string) {
    const skill = normalize(raw);
    if (!skill || isFull) return;
    if (!isSelected(skill)) onChange([...value, skill]);
    setText("");
    setActiveIndex(-1);
  }

  function remove(skill: string) {
    onChange(value.filter((item) => item !== skill));
  }

  /** キーボードで選んだ候補へ移動し、リストの外に出ていればスクロールして見せる */
  function moveTo(index: number) {
    setActiveIndex(index);
    document.getElementById(optionId(index))?.scrollIntoView({ block: "nearest" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 日本語入力の変換確定の Enter では追加しない
    if (event.nativeEvent.isComposing) return;

    switch (event.key) {
      case "ArrowDown":
        if (options.length === 0) return;
        event.preventDefault();
        setIsOpen(true);
        moveTo(current + 1 >= options.length ? 0 : current + 1);
        break;
      case "ArrowUp":
        if (options.length === 0) return;
        event.preventDefault();
        setIsOpen(true);
        moveTo(current <= 0 ? options.length - 1 : current - 1);
        break;
      case "Enter":
      case ",":
        // フォームが送信されないようにする
        event.preventDefault();
        add(showList && current >= 0 ? options[current].name : text);
        break;
      case "Escape":
        if (!showList) return;
        // モーダルなどの外側の Esc 処理に伝えず、候補だけを閉じる
        event.preventDefault();
        event.stopPropagation();
        setIsOpen(false);
        setActiveIndex(-1);
        break;
      case "Backspace":
        if (text === "" && value.length > 0) remove(value[value.length - 1]);
        break;
    }
  }

  const describedBy = errors.length > 0 ? errorId : hintId;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
        {value.length > 0 && (
          <span className="ml-2 text-xs font-normal text-slate-500">
            {value.length} / {max}
          </span>
        )}
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={`選択中の${label}`}>
          {value.map((skill) => (
            <li key={skill}>
              <SkillTag>
                {skill}
                <button
                  type="button"
                  onClick={() => remove(skill)}
                  aria-label={`${skill} を削除`}
                  className="-mr-1 rounded-full px-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500"
                >
                  ×
                </button>
              </SkillTag>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-activedescendant={showList && current >= 0 ? optionId(current) : undefined}
            autoComplete="off"
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setIsOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            onKeyDown={handleKeyDown}
            disabled={isFull}
            maxLength={MAX_SKILL_LENGTH}
            placeholder={isFull ? `${max}個まで指定できます` : "例: Ruby、React、Figma"}
            aria-invalid={errors.length > 0}
            aria-describedby={describedBy}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-rose-500 disabled:bg-slate-100"
          />

          {/* 候補リスト。入力欄の真下に重ねて表示する */}
          <ul
            id={listboxId}
            role="listbox"
            aria-label={`${label}の候補`}
            hidden={!showList}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {options.map((option, index) => (
              <li
                key={`${option.kind}-${option.name}`}
                id={optionId(index)}
                role="option"
                aria-selected={index === current}
                // 入力欄からフォーカスが外れて候補が閉じる前にクリックを受け取る
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => add(option.name)}
                onMouseMove={() => index !== current && setActiveIndex(index)}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-slate-700 aria-selected:bg-indigo-50 aria-selected:text-indigo-800"
              >
                {option.kind === "new" ? (
                  <>
                    <span aria-hidden className="text-indigo-500">
                      ＋
                    </span>
                    <span>
                      「<span className="font-semibold">{option.name}</span>」を新しく追加
                    </span>
                  </>
                ) : (
                  <HighlightMatch text={option.name} query={name} />
                )}
              </li>
            ))}
            {alreadyAdded && <li className="px-3 py-2 text-sm text-slate-500">「{name}」は追加済みです</li>}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => add(text)}
          disabled={isFull || name === ""}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          追加
        </button>
      </div>

      {/* 入力しなくても選べるよう、よく使われているスキルを分類ごとに並べる */}
      {popularGroups.length > 0 && (
        <section
          aria-labelledby={`${baseId}-popular`}
          className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4"
        >
          <p id={`${baseId}-popular`} className="text-xs font-medium text-slate-600">
            よく使われている{label}
            <span className="ml-1 font-normal text-slate-500">
              {isFull ? `（${max}個まで選べます。選んだものを押すと外せます）` : "（クリックで追加、もう一度押すと外せます）"}
            </span>
          </p>
          <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-[8rem_1fr]">
            {popularGroups.map((group) => (
              <div key={group.key} className="contents">
                <dt className="text-xs font-medium text-slate-500 sm:pt-1.5">{group.label}</dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {group.skills.map((skill) => {
                      const selected = isSelected(skill);
                      return (
                        <li key={skill}>
                          <button
                            type="button"
                            onClick={() => toggle(skill)}
                            aria-pressed={selected}
                            // 上限に達したら、選んでいないものは押せなくする（選んだものは外せる）
                            disabled={isFull && !selected}
                            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700 aria-pressed:border-indigo-600 aria-pressed:bg-indigo-600 aria-pressed:text-white aria-pressed:hover:bg-indigo-700 aria-pressed:hover:text-white"
                          >
                            <span aria-hidden className="text-xs">
                              {selected ? "✓" : "＋"}
                            </span>
                            {skill}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {errors.length > 0 ? (
        <ul id={errorId} className="text-sm text-rose-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        <p id={hintId} className="text-xs text-slate-500">
          {hint ?? `候補から選ぶか、入力して Enter（または「追加」）で登録できます。${max}個まで。`}
        </p>
      )}
    </div>
  );
}

/** 候補の中で、入力した文字に一致する部分を太字にする */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  const start = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (start < 0) return <span>{text}</span>;

  const end = start + query.length;
  return (
    <span>
      {text.slice(0, start)}
      <span className="font-semibold text-indigo-700">{text.slice(start, end)}</span>
      {text.slice(end)}
    </span>
  );
}
