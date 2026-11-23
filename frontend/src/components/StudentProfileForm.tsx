"use client";

import { useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";
import type { StudentProfile, StudentProfileInput } from "@/lib/profile";
import { useFormChanges, useLeaveGuard } from "@/lib/leaveGuard";
import { FormAlert } from "./FormAlert";
import { FormField, SelectField, TextAreaField } from "./FormField";
import { FormSection, SubmitRow } from "./FormSection";
import { SkillInput } from "./SkillInput";

type Props = {
  profile: StudentProfile | null;
  onSave: (input: StudentProfileInput) => Promise<unknown>;
};

/** インターン生プロフィールの登録・編集フォーム */
export function StudentProfileForm({ profile, onSave }: Props) {
  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 保存していない変更があれば、ページを離れる前に確認する（スキルは state で持つので別に比べる）
  const { dirty, attachForm, handleChange, markSaved } = useFormChanges({ skills });
  useLeaveGuard(dirty);

  // 卒業予定年の選択肢（サーバーの許可範囲と同じ: 前年〜6 年後）
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => thisYear - 1 + i);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    setNotice(null);

    try {
      await onSave({
        name: text("name"),
        university: text("university"),
        faculty: text("faculty"),
        graduation_year: text("graduation_year"),
        desired_role: text("desired_role"),
        bio: text("bio"),
        portfolio_url: text("portfolio_url"),
        github_url: text("github_url"),
        available_from: text("available_from"),
        available_to: text("available_to"),
        skill_names: skills,
      });
      markSaved();
      setNotice("プロフィールを保存しました。");
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.errors);
        setFormError(error.message);
      } else {
        setFormError("保存に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form ref={attachForm} onSubmit={handleSubmit} onChange={handleChange} className="flex flex-col gap-6" noValidate>
      <FormAlert message={formError} />

      <FormSection title="基本情報">
        <FormField
          label="氏名（表示名）"
          name="name"
          defaultValue={profile?.name}
          autoComplete="name"
          maxLength={50}
          required
          requiredMark
          errors={fieldErrors.name}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="大学"
            name="university"
            defaultValue={profile?.university}
            maxLength={100}
            required
            requiredMark
            errors={fieldErrors.university}
          />
          <FormField
            label="学部・学科"
            name="faculty"
            defaultValue={profile?.faculty ?? ""}
            maxLength={100}
            errors={fieldErrors.faculty}
          />
        </div>
        <SelectField
          label="卒業予定年"
          name="graduation_year"
          defaultValue={profile?.graduation_year ?? ""}
          required
          requiredMark
          errors={fieldErrors.graduation_year}
        >
          <option value="">選択してください</option>
          {years.map((year) => (
            <option key={year} value={year}>
              {year}年
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title="スキル・志望">
        <SkillInput value={skills} onChange={setSkills} errors={fieldErrors.skill_names} />
        <FormField
          label="志望職種"
          name="desired_role"
          defaultValue={profile?.desired_role ?? ""}
          placeholder="例: バックエンドエンジニア"
          maxLength={50}
          errors={fieldErrors.desired_role}
        />
        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-medium text-slate-700">希望インターン期間</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              label="開始"
              name="available_from"
              type="date"
              defaultValue={profile?.available_from ?? ""}
              errors={fieldErrors.available_from}
            />
            <FormField
              label="終了"
              name="available_to"
              type="date"
              defaultValue={profile?.available_to ?? ""}
              errors={fieldErrors.available_to}
            />
          </div>
        </fieldset>
        <TextAreaField
          label="自己紹介"
          name="bio"
          defaultValue={profile?.bio ?? ""}
          maxLength={2000}
          hint="学んでいること、作ったもの、インターンで挑戦したいことなど（2000文字まで）"
          errors={fieldErrors.bio}
        />
      </FormSection>

      <FormSection title="リンク">
        <FormField
          label="ポートフォリオ URL"
          name="portfolio_url"
          type="url"
          defaultValue={profile?.portfolio_url ?? ""}
          placeholder="https://"
          errors={fieldErrors.portfolio_url}
        />
        <FormField
          label="GitHub URL"
          name="github_url"
          type="url"
          defaultValue={profile?.github_url ?? ""}
          placeholder="https://github.com/"
          errors={fieldErrors.github_url}
        />
      </FormSection>

      <SubmitRow submitting={submitting} notice={notice} />
    </form>
  );
}

