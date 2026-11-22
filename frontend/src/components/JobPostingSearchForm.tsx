"use client";

import { useState, type FormEvent } from "react";
import { WORK_STYLE_LABELS, type JobPostingSearchParams, type WorkStyle } from "@/lib/jobPostings";
import type { SkillMatch } from "@/lib/students";
import { FormField, SelectField } from "./FormField";
import { SkillInput } from "./SkillInput";
import { SkillMatchField } from "./SkillMatchField";

const MAX_SEARCH_SKILLS = 10;

type Props = {
  /** URL から読み取った現在の検索条件（フォームの初期値） */
  initial: JobPostingSearchParams;
  onSearch: (search: JobPostingSearchParams) => void;
  onClear: () => void;
};

/** 募集の検索フォーム。入力中は画面内だけで保持し、「検索する」で URL に反映する */
export function JobPostingSearchForm({ initial, onSearch, onClear }: Props) {
  const [skills, setSkills] = useState(initial.skills);
  const [skillMatch, setSkillMatch] = useState<SkillMatch>(initial.skillMatch);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSearch({
      q: String(form.get("q") ?? ""),
      skills,
      skillMatch,
      workStyle: String(form.get("work_style") ?? "") as WorkStyle | "",
      sort: initial.sort,
    });
  }

  return (
    <form
      role="search"
      aria-label="募集の検索"
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="grid gap-5 sm:grid-cols-[2fr_1fr]">
        <FormField
          label="キーワード"
          name="q"
          type="search"
          defaultValue={initial.q}
          maxLength={100}
          placeholder="例: Rails 時給"
          hint="タイトル・業務内容・報酬・企業名・スキルから探します。スペースで区切るとすべてを含む募集に絞り込みます。"
        />
        <SelectField label="勤務形態" name="work_style" defaultValue={initial.workStyle}>
          <option value="">指定しない</option>
          {Object.entries(WORK_STYLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex flex-col gap-3">
        <SkillInput
          value={skills}
          onChange={setSkills}
          label="必要スキル"
          max={MAX_SEARCH_SKILLS}
          hint={`自分のスキルを指定すると、それを活かせる募集を探せます。${MAX_SEARCH_SKILLS}個まで。`}
        />
        <SkillMatchField
          value={skillMatch}
          onChange={setSkillMatch}
          skillCount={skills.length}
          labels={{ all: "すべてのスキルを必要とする募集", any: "いずれかのスキルを必要とする募集" }}
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
