"use client";

import { useState } from "react";
import { WORK_STYLE_LABELS, type JobPostingSearchParams, type WorkStyle } from "@/lib/jobPostings";
import type { SkillMatch } from "@/lib/students";
import { SelectField } from "./FormField";
import { SearchPanel, type FilterChip } from "./SearchPanel";
import { SkillInput } from "./SkillInput";
import { SkillMatchField } from "./SkillMatchField";

const MAX_SEARCH_SKILLS = 10;

type Props = {
  /** URL から読み取った現在の検索条件（フォームの初期値） */
  initial: JobPostingSearchParams;
  onSearch: (search: JobPostingSearchParams) => void;
  onClear: () => void;
};

/** 募集の検索フォーム。入力中は画面内だけで保持し、「検索」で URL に反映する */
export function JobPostingSearchForm({ initial, onSearch, onClear }: Props) {
  const [skills, setSkills] = useState(initial.skills);
  const [skillMatch, setSkillMatch] = useState<SkillMatch>(initial.skillMatch);

  function handleSubmit(form: FormData) {
    onSearch({
      q: String(form.get("q") ?? ""),
      skills,
      skillMatch,
      workStyle: String(form.get("work_style") ?? "") as WorkStyle | "",
      sort: initial.sort,
    });
  }

  // 適用中の詳細条件（URL の条件から作る。× でその条件だけ外して検索し直す）
  const chips: FilterChip[] = [
    ...initial.skills.map((skill) => ({
      key: `skill-${skill}`,
      label: `スキル: ${skill}`,
      onRemove: () => onSearch({ ...initial, skills: initial.skills.filter((s) => s !== skill) }),
    })),
    ...(initial.workStyle
      ? [
          {
            key: "work_style",
            label: `勤務形態: ${WORK_STYLE_LABELS[initial.workStyle]}`,
            onRemove: () => onSearch({ ...initial, workStyle: "" }),
          },
        ]
      : []),
  ];

  return (
    <SearchPanel
      ariaLabel="募集の検索"
      keyword={{
        defaultValue: initial.q,
        placeholder: "キーワードで探す（例: Rails 時給）",
        hint: "タイトル・業務内容・報酬・企業名・スキルから探します。スペースで区切るとすべてを含む募集に絞り込みます。",
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
      <div className="sm:w-1/3">
        <SelectField label="勤務形態" name="work_style" defaultValue={initial.workStyle}>
          <option value="">指定しない</option>
          {Object.entries(WORK_STYLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
    </SearchPanel>
  );
}
