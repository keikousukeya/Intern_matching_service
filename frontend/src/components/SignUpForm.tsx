"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ApiError, type FieldErrors } from "@/lib/api";
import { ROLE_LABELS, useCurrentUser, type Role } from "@/lib/auth";
import { FormAlert } from "./FormAlert";
import { FormField } from "./FormField";

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  student: "プロフィールを登録して企業からスカウトを受け取る",
  company: "インターン生を探してスカウトを送る",
};

const ROLES: Role[] = ["student", "company"];

export function SignUpForm() {
  const router = useRouter();
  const { user, signUp } = useCurrentUser();
  const [role, setRole] = useState<Role>("student");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 登録処理の直後かどうか（登録後はプロフィール入力へ移動するため、下のトップへの移動と競合させない）
  const signedUpRef = useRef(false);

  // すでにログイン済みでこの画面を開いた場合はトップへ
  useEffect(() => {
    if (user && !signedUpRef.current) router.replace("/");
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    try {
      signedUpRef.current = true;
      await signUp({
        email: String(form.get("email")),
        password: String(form.get("password")),
        password_confirmation: String(form.get("password_confirmation")),
        role,
      });
      // 登録直後はプロフィール入力へ案内する（登録時の入力を最小限にし、詳細は後から入力してもらう）
      router.push("/mypage/profile");
    } catch (error) {
      signedUpRef.current = false;
      if (error instanceof ApiError) {
        setFieldErrors(error.errors);
        setFormError(error.message);
      } else {
        setFormError("登録に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <FormAlert message={formError} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-slate-700">登録区分</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ROLES.map((value) => (
            <label
              key={value}
              className="flex cursor-pointer flex-col gap-0.5 rounded-lg border border-slate-300 bg-white p-3 has-checked:border-indigo-500 has-checked:bg-indigo-50 has-checked:ring-2 has-checked:ring-indigo-200"
            >
              <span className="flex items-center gap-2 font-medium">
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                  className="accent-indigo-600"
                />
                {ROLE_LABELS[value]}
              </span>
              <span className="text-xs text-slate-500">{ROLE_DESCRIPTIONS[value]}</span>
            </label>
          ))}
        </div>
        {fieldErrors.role && <p className="text-sm text-rose-600">{fieldErrors.role.join(" ")}</p>}
      </fieldset>

      <FormField
        label="メールアドレス"
        name="email"
        type="email"
        autoComplete="email"
        required
        errors={fieldErrors.email}
      />
      <FormField
        label="パスワード"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        hint="8文字以上"
        errors={fieldErrors.password}
      />
      <FormField
        label="パスワード（確認）"
        name="password_confirmation"
        type="password"
        autoComplete="new-password"
        required
        errors={fieldErrors.password_confirmation}
      />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "登録中…" : "登録する"}
      </button>

      <p className="text-center text-sm text-slate-600">
        登録済みの方は
        <Link href="/login" className="ml-1 text-indigo-600 hover:underline">
          ログイン
        </Link>
      </p>
    </form>
  );
}
