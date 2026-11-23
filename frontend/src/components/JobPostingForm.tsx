"use client";

import { useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";
import { todayInJst } from "@/lib/format";
import { useFormChanges, useLeaveGuard } from "@/lib/leaveGuard";
import { WORK_STYLE_LABELS, type JobPosting, type JobPostingInput, type JobPostingStatus } from "@/lib/jobPostings";
import { FormAlert } from "./FormAlert";
import { FormField, SelectField, TextAreaField } from "./FormField";
import { FormSection } from "./FormSection";
import { SkillInput } from "./SkillInput";

const MAX_POSTING_SKILLS = 10;

type Props = {
  /** 編集時は既存の募集、新規作成時は null */
  posting: JobPosting | null;
  /** 保存して、移動先のパスを返す */
  onSave: (input: JobPostingInput) => Promise<string>;
};

/** 企業向け: 募集の作成・編集フォーム */
export function JobPostingForm({ posting, onSave }: Props) {
  const [skills, setSkills] = useState<string[]>(posting?.skills ?? []);
  const [status, setStatus] = useState<JobPostingStatus>(posting?.status ?? "published");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 保存していない変更があれば、ページを離れる前に確認する（スキル・公開状態は state で持つので別に比べる）
  const { dirty, attachForm, handleChange } = useFormChanges({ skills, status });
  const { leave } = useLeaveGuard(dirty);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      const href = await onSave({
        title: text("title"),
        description: text("description"),
        starts_on: text("starts_on"),
        ends_on: text("ends_on"),
        work_style: text("work_style"),
        compensation: text("compensation"),
        headcount: text("headcount"),
        deadline: text("deadline"),
        status,
        skill_names: skills,
      });
      leave(href);
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.errors);
        // 入力欄に対応しないエラー（企業プロフィール未登録など）はフォームの上にまとめて出す
        const general = error.errors.company ?? [];
        setFormError([error.message, ...general].join(" "));
      } else {
        setFormError("保存に失敗しました。時間をおいて再度お試しください。");
      }
      setSubmitting(false);
    }
  }

  return (
    <form ref={attachForm} onSubmit={handleSubmit} onChange={handleChange} className="flex flex-col gap-6" noValidate>
      <FormAlert message={formError} />

      <FormSection title="募集内容">
        <FormField
          label="タイトル"
          name="title"
          requiredMark
          defaultValue={posting?.title}
          maxLength={100}
          placeholder="例: Rails × React で業務管理 SaaS を開発する長期インターン"
          errors={fieldErrors.title}
        />
        <TextAreaField
          label="業務内容"
          name="description"
          requiredMark
          defaultValue={posting?.description}
          maxLength={5000}
          rows={8}
          placeholder="担当する業務、チームの体制、求める人物像など"
          hint="インターン生が「何を経験できるか」をイメージできるように書くと応募につながりやすくなります。"
          errors={fieldErrors.description}
        />
        <SkillInput
          label="必要スキル"
          value={skills}
          onChange={setSkills}
          max={MAX_POSTING_SKILLS}
          hint={`候補から選ぶか、入力して Enter（または「追加」）で登録できます。${MAX_POSTING_SKILLS}個まで。`}
          errors={fieldErrors.skill_names}
        />
      </FormSection>

      <FormSection title="条件">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="期間（開始）" name="starts_on" type="date" defaultValue={posting?.starts_on ?? ""} errors={fieldErrors.starts_on} />
          <FormField label="期間（終了）" name="ends_on" type="date" defaultValue={posting?.ends_on ?? ""} errors={fieldErrors.ends_on} />
          <SelectField
            label="勤務形態"
            name="work_style"
            requiredMark
            defaultValue={posting?.work_style ?? "remote"}
            errors={fieldErrors.work_style}
          >
            {Object.entries(WORK_STYLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>
          <FormField
            label="報酬"
            name="compensation"
            defaultValue={posting?.compensation ?? ""}
            maxLength={100}
            placeholder="例: 時給 1,500 円"
            errors={fieldErrors.compensation}
          />
          <FormField
            label="募集人数"
            name="headcount"
            type="number"
            min={1}
            max={1000}
            defaultValue={posting?.headcount ?? ""}
            placeholder="例: 2"
            errors={fieldErrors.headcount}
          />
          <FormField
            label="締切"
            name="deadline"
            type="date"
            min={todayInJst()}
            defaultValue={posting?.deadline ?? ""}
            hint="空欄なら締切なし（随時募集）。締切の翌日から一覧に表示されなくなります。"
            errors={fieldErrors.deadline}
          />
        </div>
      </FormSection>

      <FormSection title="公開設定">
        <fieldset className="flex flex-col gap-3">
          <legend className="sr-only">公開状態</legend>
          {(
            [
              ["published", "公開する", "インターン生の募集一覧に表示され、スカウトに紐づけられます。"],
              ["draft", "非公開で保存する", "自社だけが見られます。内容を準備してから公開できます。"],
            ] as const
          ).map(([value, label, description]) => (
            <label key={value} className="flex items-start gap-3">
              <input
                type="radio"
                name="status"
                value={value}
                checked={status === value}
                onChange={() => setStatus(value)}
                className="mt-1 accent-indigo-600"
              />
              <span className="flex flex-col">
                <span className="font-medium text-slate-800">{label}</span>
                <span className="text-sm text-slate-500">{description}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </FormSection>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? "保存中…" : posting ? "変更を保存する" : "募集を作成する"}
        </button>
      </div>
    </form>
  );
}
