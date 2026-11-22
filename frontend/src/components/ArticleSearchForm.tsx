"use client";

import { useState, type FormEvent } from "react";
import type { ArticleSearchParams } from "@/lib/articles";
import type { Role } from "@/lib/auth";
import type { SkillMatch } from "@/lib/students";
import { FormField, SelectField } from "./FormField";
import { SkillInput } from "./SkillInput";
import { SkillMatchField } from "./SkillMatchField";

const MAX_SEARCH_TAGS = 10;

type Props = {
  /** URL から読み取った現在の検索条件（フォームの初期値） */
  initial: ArticleSearchParams;
  onSearch: (search: ArticleSearchParams) => void;
  onClear: () => void;
};

/** 記事の検索フォーム。入力中は画面内だけで保持し、「検索する」で URL に反映する */
export function ArticleSearchForm({ initial, onSearch, onClear }: Props) {
  const [skills, setSkills] = useState(initial.skills);
  const [skillMatch, setSkillMatch] = useState<SkillMatch>(initial.skillMatch);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSearch({
      q: String(form.get("q") ?? ""),
      skills,
      skillMatch,
      authorRole: String(form.get("author_role") ?? "") as Role | "",
      // 書いた人の絞り込みはフォームに入力欄が無いため、そのまま引き継ぐ（「条件をクリア」で解除する）
      authorId: initial.authorId,
    });
  }

  return (
    <form
      role="search"
      aria-label="記事の検索"
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
          placeholder="例: Rails 設計"
          hint="タイトル・本文・タグ・書いた人の名前から探します。スペースで区切るとすべてを含む記事に絞り込みます。"
        />
        <SelectField label="書いた人" name="author_role" defaultValue={initial.authorRole}>
          <option value="">指定しない</option>
          <option value="student">インターン生</option>
          <option value="company">企業</option>
        </SelectField>
      </div>

      <div className="flex flex-col gap-3">
        <SkillInput value={skills} onChange={setSkills} label="タグ" max={MAX_SEARCH_TAGS} hint={`${MAX_SEARCH_TAGS}個まで指定できます。`} />
        <SkillMatchField
          value={skillMatch}
          onChange={setSkillMatch}
          skillCount={skills.length}
          labels={{ all: "すべてのタグを含む記事", any: "いずれかのタグを含む記事" }}
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
