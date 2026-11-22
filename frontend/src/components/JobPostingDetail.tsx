"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import type { User } from "@/lib/auth";
import { formatDateTime, formatPeriod } from "@/lib/format";
import { useJobPosting } from "@/lib/jobPostings";
import { FormAlert } from "./FormAlert";
import { deadlineText, StatusBadge, WorkStyleBadge } from "./JobPostingParts";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";
import { SkillTag } from "./SkillTag";

/** 募集の詳細。公開中の募集はログインユーザー全員、非公開の募集は作成した企業だけが見られる */
export function JobPostingDetail({ id }: { id: string }) {
  return <RequireUser>{(user) => <Detail id={id} user={user} />}</RequireUser>;
}

function Detail({ id, user }: { id: string; user: User }) {
  const { data, error, isLoading } = useJobPosting(id);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) {
    return <FormAlert message="この募集は見つかりませんでした（削除されたか、非公開になっています）。" />;
  }
  if (error || !data) return <FormAlert message="募集を読み込めませんでした。" />;

  const posting = data.job_posting;
  const isOwner = posting.company.user_id === user.id;
  const period = formatPeriod(posting.starts_on, posting.ends_on);

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <header className="flex flex-col gap-2 border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <WorkStyleBadge workStyle={posting.work_style} />
          <StatusBadge posting={posting} showPublished={isOwner} />
        </div>
        <h1 className="text-2xl font-bold">{posting.title}</h1>
        <p className="text-slate-600">
          <Link href={`/companies/${posting.company.user_id}`} className="hover:text-indigo-600 hover:underline">
            {posting.company.company_name ?? "（企業名未登録）"}
          </Link>
        </p>
        {posting.closed && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            この募集は締切を過ぎています。
          </p>
        )}
      </header>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[8rem_1fr]">
        <Item label="業務内容">
          {/* React が文字列をエスケープするため、入力内容をそのまま表示しても HTML として解釈されない */}
          <p className="whitespace-pre-wrap leading-relaxed">{posting.description}</p>
        </Item>
        <Item label="必要スキル">
          {posting.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {posting.skills.map((skill) => (
                <li key={skill}>
                  <SkillTag>{skill}</SkillTag>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-slate-400">指定なし</span>
          )}
        </Item>
        <Item label="期間">{period ?? "応相談"}</Item>
        <Item label="勤務形態">
          <WorkStyleBadge workStyle={posting.work_style} />
        </Item>
        <Item label="報酬">{posting.compensation ?? "応相談"}</Item>
        <Item label="募集人数">{posting.headcount ? `${posting.headcount}名` : "未定"}</Item>
        <Item label="締切">{deadlineText(posting.deadline)}</Item>
        {posting.published_at && <Item label="公開日時">{formatDateTime(posting.published_at)}</Item>}
      </dl>

      {isOwner ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/mypage/job_postings/${posting.id}/edit`}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-indigo-700"
          >
            この募集を編集する
          </Link>
          <Link
            href="/mypage/job_postings"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-slate-700 hover:bg-slate-50"
          >
            募集管理へ戻る
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 text-sm text-slate-700 sm:p-5">
          {user.role === "student" ? (
            <p>
              興味がある募集は、プロフィールを充実させておくと企業からスカウトが届きやすくなります。
              <Link href="/mypage/profile" className="ml-1 text-indigo-600 hover:underline">
                プロフィールを編集する
              </Link>
            </p>
          ) : (
            <p>他社の募集です。自社の募集は「募集管理」から作成できます。</p>
          )}
          <Link href={`/companies/${posting.company.user_id}`} className="self-start text-indigo-600 hover:underline">
            企業情報を見る
          </Link>
        </div>
      )}

      <Link href="/job_postings" className="self-start text-sm text-indigo-600 hover:underline">
        ← 募集一覧へ戻る
      </Link>
    </article>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}
