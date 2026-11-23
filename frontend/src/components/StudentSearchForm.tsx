"use client";

import { useState } from "react";
import type { SkillMatch, StudentSearchParams } from "@/lib/students";
import { FormField, SelectField } from "./FormField";
import { SearchPanel, type FilterChip } from "./SearchPanel";
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
 * 入力中は画面内だけで保持し、「検索」で URL に反映する（1 文字ごとに API を呼ばないため）。
 */
export function StudentSearchForm({ initial, onSearch, onClear }: Props) {
  const [skills, setSkills] = useState(initial.skills);
  const [skillMatch, setSkillMatch] = useState<SkillMatch>(initial.skillMatch);

  // 卒業予定年の選択肢（プロフィール登録で選べる範囲と同じ: 前年〜6 年後）
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => thisYear - 1 + i);

  function handleSubmit(form: FormData) {
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

  // 適用中の詳細条件（URL の条件から作る。× でその条件だけ外して検索し直す）
  const textChips: { key: "university" | "graduationYear" | "desiredRole"; label: string }[] = [
    { key: "university", label: `大学: ${initial.university}` },
    { key: "graduationYear", label: `卒業予定: ${initial.graduationYear}年` },
    { key: "desiredRole", label: `志望職種: ${initial.desiredRole}` },
  ];
  const chips: FilterChip[] = [
    ...initial.skills.map((skill) => ({
      key: `skill-${skill}`,
      label: `スキル: ${skill}`,
      onRemove: () => onSearch({ ...initial, skills: initial.skills.filter((s) => s !== skill) }),
    })),
    ...textChips
      .filter(({ key }) => initial[key] !== "")
      .map(({ key, label }) => ({ key, label, onRemove: () => onSearch({ ...initial, [key]: "" }) })),
  ];

  return (
    <SearchPanel
      ariaLabel="インターン生の検索"
      keyword={{
        defaultValue: initial.q,
        placeholder: "キーワードで探す（例: 個人開発 Rails）",
        hint: "氏名・大学・学部・志望職種・自己紹介・スキルから探します。スペースで区切るとすべてを含む人に絞り込みます。",
      }}
      chips={chips}
      hasFilters={initial.q !== "" || chips.length > 0}
      onSubmit={handleSubmit}
      onClear={onClear}
    >
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
    </SearchPanel>
  );
}
