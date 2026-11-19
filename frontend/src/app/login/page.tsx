import type { Metadata } from "next";
import { AuthCard } from "@/components/AuthCard";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = { title: "ログイン | Intern Scout" };

export default function LoginPage() {
  return (
    <AuthCard title="ログイン">
      <LoginForm />
    </AuthCard>
  );
}
