"use client";

import { useState, type FormEvent } from "react";
import type { SkillMatch, StudentSearchParams } from "@/lib/students";
import { FormField, SelectField } from "./FormField";
import { SkillInput } from "./SkillInput";
import { SkillMatchField } from "./SkillMatchField";

const MAX_SEARCH_SKILLS = 10;

type Props = {
  /** URL から読み取った現在の検索条件（フォームの初期値） */
  initial: StudentSearchParams;
  onSearch: (search: StudentSearchParams) => void;
  onClear: () => void;
};

/**
 * 企業向け: インターン生の検索フォーム（F-04）。
 * 入力中は画面内だけで保持し、「検索する」で URL に反映する（1 文字ごとに API を呼ばないため）。
 */
export function StudentSearchForm({ initial, onSearch, onClear }: Props) {
  const [skills, setSkills] = useState(initial.skills);
  const [skillMatch, setSkillMatch] = useState<SkillMatch>(initial.skillMatch);

  // 卒業予定年の選択肢（プロフィール登録で選べる範囲と同じ: 前年〜6 年後）
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => thisYear - 1 + i);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    onSearch({
      q: text("q"),
      skills,
      skillMatch,
      university: text("university"),
      graduationYear: text("graduation_year"),
      desiredRole: text("desired_role"),
      sort: initial.sort,
    });
  }

  return (
    <form
      role="search"
      aria-label="インターン生の検索"
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <FormField
        label="キーワード"
        name="q"
        type="search"
        defaultValue={initial.q}
        maxLength={100}
        placeholder="例: 個人開発 Rails"
        hint="氏名・大学・学部・志望職種・自己紹介・スキルから探します。スペースで区切るとすべてを含む人に絞り込みます。"
      />

      <div className="flex flex-col gap-3">
        <SkillInput
          value={skills}
          onChange={setSkills}
          max={MAX_SEARCH_SKILLS}
          hint={`候補から選ぶか、入力して Enter（または「追加」）で指定できます。${MAX_SEARCH_SKILLS}個まで。`}
        />
        <SkillMatchField
          value={skillMatch}
          onChange={setSkillMatch}
          skillCount={skills.length}
          labels={{ all: "すべてのスキルを持つ人", any: "いずれかのスキルを持つ人" }}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField label="大学" name="university" defaultValue={initial.university} maxLength={100} placeholder="例: 東都" />
        <SelectField label="卒業予定年" name="graduation_year" defaultValue={initial.graduationYear}>
          <option value="">指定しない</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}年
            </option>
          ))}
        </SelectField>
        <FormField
          label="志望職種"
          name="desired_role"
          defaultValue={initial.desiredRole}
          maxLength={100}
          placeholder="例: エンジニア"
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-slate-300 px-6 py-2.5 text-slate-700 hover:bg-slate-50"
        >
          条件をクリア
        </button>
        <button type="submit" className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700">
          検索する
        </button>
      </div>
    </form>
  );
}
