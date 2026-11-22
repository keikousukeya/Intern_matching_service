"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import type { User } from "@/lib/auth";
import { useJobPosting, useJobPostingActions, type JobPostingInput } from "@/lib/jobPostings";
import { FormAlert } from "./FormAlert";
import { JobPostingForm } from "./JobPostingForm";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";

/** 企業向け: 募集の作成（id なし）・編集（id あり）画面。保存したら募集管理へ戻る */
export function JobPostingEditor({ id }: { id?: string }) {
  return (
    <RequireUser role="company">
      {(user) => (!user.has_profile ? <ProfileRequired /> : id ? <Edit id={id} user={user} /> : <Create />)}
    </RequireUser>
  );
}

function Create() {
  const router = useRouter();
  const { create } = useJobPostingActions();

  async function handleSave(input: JobPostingInput) {
    await create(input);
    router.push("/mypage/job_postings");
  }

  return <JobPostingForm posting={null} onSave={handleSave} />;
}

function Edit({ id, user }: { id: string; user: User }) {
  const router = useRouter();
  const { data, error, isLoading } = useJobPosting(id);
  const { update } = useJobPostingActions();

  if (isLoading) return <Loading />;
  // 他社の募集は編集できない（公開中の他社の募集は取得できてしまうため、ここでも作成者を確認する。実際の権限は Rails 側で確認している）
  if ((error instanceof ApiError && error.status === 404) || (data && data.job_posting.company.user_id !== user.id)) {
    return <FormAlert message="この募集は見つかりませんでした。" />;
  }
  if (error || !data) return <FormAlert message="募集を読み込めませんでした。" />;

  async function handleSave(input: JobPostingInput) {
    await update(Number(id), input);
    router.push("/mypage/job_postings");
  }

  return <JobPostingForm posting={data.job_posting} onSave={handleSave} />;
}

function ProfileRequired() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      募集の掲載者として企業名を表示するため、先に
      <Link href="/mypage/profile" className="mx-1 text-indigo-600 hover:underline">
        企業プロフィール
      </Link>
      を登録してください。
    </p>
  );
}
