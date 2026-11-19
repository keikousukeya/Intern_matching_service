"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError } from "@/lib/api";
import { useCurrentUser } from "@/lib/auth";
import { FormAlert } from "./FormAlert";
import { FormField } from "./FormField";

export function LoginForm() {
  const router = useRouter();
  const { user, logIn } = useCurrentUser();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ログイン済みならトップへ
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setFormError(null);

    try {
      await logIn({ email: String(form.get("email")), password: String(form.get("password")) });
      router.push("/");
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "ログインに失敗しました。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <FormAlert message={formError} />

      <FormField label="メールアドレス" name="email" type="email" autoComplete="email" required />
      <FormField label="パスワード" name="password" type="password" autoComplete="current-password" required />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? "ログイン中…" : "ログイン"}
      </button>

      <p className="text-center text-sm text-slate-600">
        アカウントをお持ちでない方は
        <Link href="/signup" className="ml-1 text-indigo-600 hover:underline">
          新規登録
        </Link>
      </p>
    </form>
  );
}
