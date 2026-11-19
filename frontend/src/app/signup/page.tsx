import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { SignUpForm } from "@/components/SignUpForm";

export const metadata: Metadata = { title: "新規登録 | Intern Scout" };

export default function SignUpPage() {
  return (
    <AuthCard title="新規登録">
      <SignUpForm />
    </AuthCard>
  );
}
