"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { SkillTag } from "./SkillTag";

export const MAX_SKILLS = 20;
const MAX_SKILL_LENGTH = 30;

type Props = {
  value: string[];
  onChange: (skills: string[]) => void;
  errors?: string[];
  /** 検索フォームなど、プロフィール編集以外で使うときに表示を変える */
  label?: string;
  hint?: string;
  max?: number;
};

/** 入力が止まってから値を反映する（1 文字ごとに API を呼ばないため） */
function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * スキルの入力（候補つき自由入力）。
 * 入力中の文字に部分一致するスキルを候補（datalist）に出し、候補に無いスキルもそのまま追加できる。
 * 大文字小文字だけが違うものは重複として追加しない（サーバー側でも同じ扱い）。
 */
export function SkillInput({ value, onChange, errors = [], label = "スキル", hint, max = MAX_SKILLS }: Props) {
  const [text, setText] = useState("");
  const query = useDebounced(text.trim());
  const { data } = useSWR<{ skills: string[] }>(`/skills?q=${encodeURIComponent(query)}`, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const lowerValue = value.map((skill) => skill.toLowerCase());
  const suggestions = (data?.skills ?? []).filter((skill) => !lowerValue.includes(skill.toLowerCase()));
  const isFull = value.length >= max;

  function add(raw: string) {
    const name = raw.replace(/\s+/g, " ").trim().slice(0, MAX_SKILL_LENGTH);
    if (!name || isFull) return;
    if (!lowerValue.includes(name.toLowerCase())) onChange([...value, name]);
    setText("");
  }

  function remove(name: string) {
    onChange(value.filter((skill) => skill !== name));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    // 日本語入力の変換確定の Enter では追加しない
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter" || event.key === ",") {
      // フォームが送信されないようにする
      event.preventDefault();
      add(text);
    } else if (event.key === "Backspace" && text === "" && value.length > 0) {
      remove(value[value.length - 1]);
    }
  }

  const describedBy = errors.length > 0 ? "field-skills-error" : "field-skills-hint";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="field-skills" className="text-sm font-medium text-slate-700">
        {label}
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
                  className="-mr-1 rounded-full px-1 text-indigo-400 hover:bg-indigo-100 hover:text-indigo-700"
                >
                  ×
                </button>
              </SkillTag>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          id="field-skills"
          list="skill-suggestions"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isFull}
          maxLength={MAX_SKILL_LENGTH}
          placeholder={isFull ? `${max}個まで指定できます` : "例: Ruby、React、Figma"}
          aria-invalid={errors.length > 0}
          aria-describedby={describedBy}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-rose-500 disabled:bg-slate-100"
        />
        <button
          type="button"
          onClick={() => add(text)}
          disabled={isFull || text.trim() === ""}
          className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          追加
        </button>
      </div>
      <datalist id="skill-suggestions">
        {suggestions.map((skill) => (
          <option key={skill} value={skill} />
        ))}
      </datalist>

      {errors.length > 0 ? (
        <ul id="field-skills-error" className="text-sm text-rose-600">
          {errors.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        <p id="field-skills-hint" className="text-xs text-slate-500">
          {hint ?? `候補から選ぶか、入力して Enter（または「追加」）で登録できます。${max}個まで。`}
        </p>
      )}
    </div>
  );
}
