"use client";

import { useState } from "react";
import type { ArticleSearchParams } from "@/lib/articles";
import type { Role } from "@/lib/auth";
import type { SkillMatch } from "@/lib/students";
import { SelectField } from "./FormField";
import { SearchPanel, type FilterChip } from "./SearchPanel";
import { SkillInput } from "./SkillInput";
import { SkillMatchField } from "./SkillMatchField";

const MAX_SEARCH_TAGS = 10;

const AUTHOR_ROLE_LABELS: Record<Role, string> = { student: "インターン生", company: "企業" };

type Props = {
  /** URL から読み取った現在の検索条件（フォームの初期値） */
  initial: ArticleSearchParams;
  onSearch: (search: ArticleSearchParams) => void;
  onClear: () => void;
};

/** 記事の検索フォーム。入力中は画面内だけで保持し、「検索」で URL に反映する */
export function ArticleSearchForm({ initial, onSearch, onClear }: Props) {
  const [skills, setSkills] = useState(initial.skills);
  const [skillMatch, setSkillMatch] = useState<SkillMatch>(initial.skillMatch);

  function handleSubmit(form: FormData) {
    onSearch({
      q: String(form.get("q") ?? ""),
      skills,
      skillMatch,
      authorRole: String(form.get("author_role") ?? "") as Role | "",
      // 書いた人の絞り込みはフォームに入力欄が無いため、そのまま引き継ぐ（「条件をクリア」で解除する）
      authorId: initial.authorId,
    });
  }

  // 適用中の詳細条件（書いた人の絞り込み authorId は一覧側のお知らせで表示・解除するので含めない）
  const chips: FilterChip[] = [
    ...initial.skills.map((tag) => ({
      key: `tag-${tag}`,
      label: `タグ: ${tag}`,
      onRemove: () => onSearch({ ...initial, skills: initial.skills.filter((s) => s !== tag) }),
    })),
    ...(initial.authorRole
      ? [
          {
            key: "author_role",
            label: `書いた人: ${AUTHOR_ROLE_LABELS[initial.authorRole]}`,
            onRemove: () => onSearch({ ...initial, authorRole: "" }),
          },
        ]
      : []),
  ];

  return (
    <SearchPanel
      ariaLabel="記事の検索"
      keyword={{
        defaultValue: initial.q,
        placeholder: "キーワードで探す（例: Rails 設計）",
        hint: "タイトル・本文・タグ・書いた人の名前から探します。スペースで区切るとすべてを含む記事に絞り込みます。",
      }}
      chips={chips}
      hasFilters={initial.q !== "" || chips.length > 0}
      onSubmit={handleSubmit}
      onClear={onClear}
    >
      <div className="flex flex-col gap-3">
        <SkillInput value={skills} onChange={setSkills} label="タグ" max={MAX_SEARCH_TAGS} hint={`${MAX_SEARCH_TAGS}個まで指定できます。`} />
        <SkillMatchField
          value={skillMatch}
          onChange={setSkillMatch}
          skillCount={skills.length}
          labels={{ all: "すべてのタグを含む記事", any: "いずれかのタグを含む記事" }}
        />
      </div>
      <div className="sm:w-1/3">
        <SelectField label="書いた人" name="author_role" defaultValue={initial.authorRole}>
          <option value="">指定しない</option>
          {Object.entries(AUTHOR_ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
      </div>
    </SearchPanel>
  );
}
