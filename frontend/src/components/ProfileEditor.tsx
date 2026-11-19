"use client";

import type { ReactNode } from "react";
import { useCurrentUser, type User } from "@/lib/auth";
import { useMyProfile } from "@/lib/profile";
import { CompanyProfileForm } from "./CompanyProfileForm";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";
import { StudentProfileForm } from "./StudentProfileForm";

/** マイページのプロフィール編集。ロールに応じて学生 / 企業のフォームを出し分ける */
export function ProfileEditor() {
  return (
    <RequireUser>
      {(user) => (user.role === "student" ? <StudentEditor user={user} /> : <CompanyEditor user={user} />)}
    </RequireUser>
  );
}

function StudentEditor({ user }: { user: User }) {
  const { profile, isLoading, error, save } = useMyProfile<"student">(true);
  const onSaved = useRefreshAfterFirstSave(user);

  return (
    <EditorState isLoading={isLoading} error={error}>
      {!profile && <Intro>プロフィールを登録すると、企業があなたを見つけてスカウトを送れるようになります。</Intro>}
      <StudentProfileForm profile={profile} onSave={async (input) => onSaved(await save(input))} />
    </EditorState>
  );
}

function CompanyEditor({ user }: { user: User }) {
  const { profile, isLoading, error, save } = useMyProfile<"company">(true);
  const onSaved = useRefreshAfterFirstSave(user);

  return (
    <EditorState isLoading={isLoading} error={error}>
      {!profile && <Intro>企業名と担当者名を登録すると、インターン生を探してスカウトを送れるようになります。</Intro>}
      <CompanyProfileForm profile={profile} onSave={async (input) => onSaved(await save(input))} />
    </EditorState>
  );
}

/** 初回登録後は has_profile（ヘッダーやトップの案内に使う）が変わるため、ユーザー情報を取り直す */
function useRefreshAfterFirstSave(user: User) {
  const { refresh } = useCurrentUser();
  return async (saved: unknown) => {
    if (!user.has_profile) await refresh();
    return saved;
  };
}

function EditorState({ isLoading, error, children }: { isLoading: boolean; error: unknown; children: ReactNode }) {
  if (isLoading) return <Loading />;
  if (error) return <FormAlert message="プロフィールを読み込めませんでした。時間をおいて再度お試しください。" />;
  return <>{children}</>;
}

function Intro({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">{children}</p>
  );
}
