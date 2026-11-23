"use client";

import { useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";
import type { CompanyProfile, CompanyProfileInput } from "@/lib/profile";
import { useFormChanges, useLeaveGuard } from "@/lib/leaveGuard";
import { FormAlert } from "./FormAlert";
import { FormField, TextAreaField } from "./FormField";
import { FormSection, SubmitRow } from "./FormSection";

type Props = {
  profile: CompanyProfile | null;
  onSave: (input: CompanyProfileInput) => Promise<unknown>;
};

/** 企業プロフィールの登録・編集フォーム */
export function CompanyProfileForm({ profile, onSave }: Props) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 保存していない変更があれば、ページを離れる前に確認する
  const { dirty, attachForm, handleChange, markSaved } = useFormChanges(null);
  useLeaveGuard(dirty);

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
        company_name: text("company_name"),
        contact_name: text("contact_name"),
        description: text("description"),
        website: text("website"),
      });
      markSaved();
      setNotice("企業プロフィールを保存しました。");
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

      <FormSection title="企業情報">
        <FormField
          label="企業名"
          name="company_name"
          defaultValue={profile?.company_name}
          autoComplete="organization"
          maxLength={100}
          required
          requiredMark
          errors={fieldErrors.company_name}
        />
        <FormField
          label="担当者名"
          name="contact_name"
          defaultValue={profile?.contact_name}
          autoComplete="name"
          maxLength={50}
          required
          requiredMark
          hint="スカウトの送信者としてインターン生に表示されます"
          errors={fieldErrors.contact_name}
        />
        <TextAreaField
          label="企業概要"
          name="description"
          defaultValue={profile?.description ?? ""}
          maxLength={2000}
          hint="事業内容や、インターンで経験できることなど（2000文字まで）"
          errors={fieldErrors.description}
        />
        <FormField
          label="Web サイト"
          name="website"
          type="url"
          defaultValue={profile?.website ?? ""}
          placeholder="https://"
          errors={fieldErrors.website}
        />
      </FormSection>

      <SubmitRow submitting={submitting} notice={notice} />
    </form>
  );
}
