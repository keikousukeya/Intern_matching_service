"use client";

import { useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";
import type { Article, ArticleInput, ArticleStatus } from "@/lib/articles";
import { useLeaveGuard } from "@/lib/leaveGuard";
import { FormAlert } from "./FormAlert";
import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { MarkdownBody } from "./MarkdownBody";
import { SkillInput } from "./SkillInput";

const MAX_TAGS = 5;
const BODY_MAX_LENGTH = 20000;

type Props = {
  /** 編集時は既存の記事、新規作成時は null */
  article: Article | null;
  /** 保存して、移動先のパスを返す */
  onSave: (input: ArticleInput) => Promise<string>;
};

/** 記事の作成・編集フォーム。本文は Markdown で、「プレビュー」で表示を確認できる */
export function ArticleForm({ article, onSave }: Props) {
  const [title, setTitle] = useState(article?.title ?? "");
  const [body, setBody] = useState(article?.body ?? "");
  const [skills, setSkills] = useState<string[]>(article?.skills ?? []);
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 保存していない変更（最初の値との違い）があれば、ページを離れる前に確認する
  const dirty =
    title !== (article?.title ?? "") ||
    body !== (article?.body ?? "") ||
    JSON.stringify(skills) !== JSON.stringify(article?.skills ?? []);
  const { leave } = useLeaveGuard(dirty);

  async function save(status: ArticleStatus) {
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      leave(await onSave({ title, body, status, skill_names: skills }));
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.errors);
        // 入力欄に対応しないエラー（プロフィール未登録など）はフォームの上にまとめて出す
        setFormError([error.message, ...(error.errors.base ?? [])].join(" "));
      } else {
        setFormError("保存に失敗しました。時間をおいて再度お試しください。");
      }
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void save("published");
  }

  const bodyErrors = fieldErrors.body ?? [];
  const tabClass =
    "rounded-t-lg border border-b-0 px-4 py-1.5 text-sm aria-selected:border-slate-300 aria-selected:bg-white aria-selected:font-medium aria-selected:text-indigo-700 border-transparent text-slate-500 hover:text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      <FormAlert message={formError} />

      <FormSection title="記事">
        <FormField
          label="タイトル"
          name="title"
          requiredMark
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={100}
          placeholder="例: Rails 8 の認証ジェネレーターを読んでみた"
          errors={fieldErrors.title}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-end justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              本文（Markdown）
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-600">必須</span>
            </span>
            <div role="tablist" aria-label="本文の表示切り替え" className="flex gap-1">
              <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")} className={tabClass}>
                書く
              </button>
              <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")} className={tabClass}>
                プレビュー
              </button>
            </div>
          </div>
          {tab === "write" ? (
            <textarea
              id="field-body"
              name="body"
              aria-label="本文（Markdown）"
              aria-invalid={bodyErrors.length > 0}
              aria-describedby="field-body-hint"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={BODY_MAX_LENGTH}
              rows={20}
              placeholder={"## はじめに\n\nこの記事では…\n\n```ruby\nputs \"Hello\"\n```"}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 aria-invalid:border-rose-500"
            />
          ) : (
            <div className="min-h-[20rem] rounded-lg border border-slate-300 bg-white px-4 py-2" aria-live="polite">
              {body.trim() ? <MarkdownBody>{body}</MarkdownBody> : <p className="py-4 text-slate-400">本文がまだありません。</p>}
            </div>
          )}
          {bodyErrors.length > 0 ? (
            <ul className="text-sm text-rose-600">
              {bodyErrors.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            <p id="field-body-hint" className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
              <span>見出し（##）・コードブロック（```）・表・チェックリストが使えます。HTML タグは表示されません。</span>
              <span>
                {body.length.toLocaleString()} / {BODY_MAX_LENGTH.toLocaleString()} 文字
              </span>
            </p>
          )}
        </div>

        <SkillInput
          label="タグ"
          value={skills}
          onChange={setSkills}
          max={MAX_TAGS}
          hint={`記事で扱った技術を${MAX_TAGS}個まで付けられます。プロフィールのスキルと同じ候補から選べます。`}
          errors={fieldErrors.skill_names}
        />
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => void save("draft")}
          disabled={submitting}
          className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {article?.status === "published" ? "下書きに戻して保存" : "下書き保存"}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "保存中…" : article?.status === "published" ? "変更を公開する" : "公開する"}
        </button>
      </div>
    </form>
  );
}
