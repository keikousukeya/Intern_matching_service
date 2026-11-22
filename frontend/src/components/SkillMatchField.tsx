"use client";

import type { SkillMatch } from "@/lib/students";

type Props = {
  value: SkillMatch;
  onChange: (value: SkillMatch) => void;
  /** 指定中のスキルの数。2 つ未満では結果が変わらないため選べなくする */
  skillCount: number;
  /** 選択肢の文言（例: 「すべてのスキルを持つ人」） */
  labels: Record<SkillMatch, string>;
};

/** 複数のスキルの組み合わせ方（すべて含む AND／いずれかを含む OR）の選択。検索フォームで共通 */
export function SkillMatchField({ value, onChange, skillCount, labels }: Props) {
  const disabled = skillCount < 2;

  return (
    <fieldset className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm" disabled={disabled}>
      <legend className="sr-only">複数のスキルの組み合わせ方</legend>
      {(["all", "any"] as const).map((option) => (
        <label key={option} className="flex items-center gap-2 text-slate-700 has-disabled:text-slate-400">
          <input
            type="radio"
            name="skill_match"
            value={option}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-indigo-600"
          />
          {labels[option]}
        </label>
      ))}
      {disabled && <span className="text-xs text-slate-400">（スキルを 2 つ以上指定すると選べます）</span>}
    </fieldset>
  );
}
