"use client";

import { useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";
import type { Article, ArticleInput, ArticleStatus } from "@/lib/articles";
import type { User } from "@/lib/auth";
import { CONTACT_NAME_MAX_LENGTH, loadContactName, saveContactName } from "@/lib/contactName";
import { useLeaveGuard } from "@/lib/leaveGuard";
import { FormAlert } from "./FormAlert";
import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { MarkdownTextArea } from "./MarkdownTextArea";
import { SkillInput } from "./SkillInput";

const MAX_TAGS = 5;
const BODY_MAX_LENGTH = 20000;

type Props = {
  /** 編集時は既存の記事、新規作成時は null */
  article: Article | null;
  /** 書いている人（企業なら担当者名の入力欄を出す） */
  user: User;
  /** 保存して、移動先のパスを返す */
  onSave: (input: ArticleInput) => Promise<string>;
};

/** 記事の作成・編集フォーム。本文は Markdown で、「プレビュー」で表示を確認できる */
export function ArticleForm({ article, user, onSave }: Props) {
  const isCompany = user.role === "company";
  // 企業の担当者名。新しい記事では、このブラウザで最後に使った名前を最初から入れておく
  const initialContactName = article ? (article.author.contact_name ?? "") : isCompany ? loadContactName(user.id) : "";
  const [title, setTitle] = useState(article?.title ?? "");
  const [contactName, setContactName] = useState(initialContactName);
  const [body, setBody] = useState(article?.body ?? "");
  const [skills, setSkills] = useState<string[]>(article?.skills ?? []);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 保存していない変更（最初の値との違い）があれば、ページを離れる前に確認する
  const dirty =
    title !== (article?.title ?? "") ||
    body !== (article?.body ?? "") ||
    contactName !== initialContactName ||
    JSON.stringify(skills) !== JSON.stringify(article?.skills ?? []);
  const { leave } = useLeaveGuard(dirty);

  async function save(status: ArticleStatus) {
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const path = await onSave({ title, body, status, skill_names: skills, ...(isCompany && { contact_name: contactName }) });
      if (isCompany) saveContactName(user.id, contactName);
      leave(path);
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

        {isCompany && (
          <FormField
            label="担当者名"
            name="contact_name"
            value={contactName}
            onChange={(event) => setContactName(event.target.value)}
            maxLength={CONTACT_NAME_MAX_LENGTH}
            autoComplete="name"
            placeholder="例: 佐藤 美咲"
            hint="公開するときに必要です（下書きは空でも保存できます）。記事には「企業名（担当: ○○）」と表示されます"
            errors={fieldErrors.contact_name}
          />
        )}

        <MarkdownTextArea
          label="本文"
          name="body"
          requiredMark
          value={body}
          onChange={setBody}
          maxLength={BODY_MAX_LENGTH}
          rows={20}
          placeholder={"## はじめに\n\nこの記事では…\n\n```ruby\nputs \"Hello\"\n```"}
          hint="コードブロック（```）やチェックリストも使えます。"
          emptyText="本文がまだありません。"
          errors={fieldErrors.body}
        />

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
