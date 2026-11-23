"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMyArticles } from "@/lib/articles";
import { ROLE_LABELS, type User } from "@/lib/auth";
import { formatShortDateTime } from "@/lib/format";
import { useMyJobPostings } from "@/lib/jobPostings";
import { partnerOf, useConversations, useUnreadCount } from "@/lib/messages";
import {
  profileChecklist,
  useMyProfile,
  type CompanyProfile,
  type ProfileCheckItem,
  type StudentProfile,
} from "@/lib/profile";
import { ArticleStatusBadge } from "./ArticleParts";
import { FormAlert } from "./FormAlert";
import { StatusBadge } from "./JobPostingParts";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";
import { SkillTag } from "./SkillTag";

/** マイページの各欄に出す件数（API は 20 件ずつ返すため、その先頭だけを表示する） */
const RECENT_LIMIT = 5;

const PRIMARY_BUTTON = "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700";
const SECONDARY_BUTTON =
  "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

/**
 * マイページ。プロフィールの概要と入力状況・未読のメッセージ・自分の記事・自社の募集（企業のみ）を 1 画面にまとめる。
 * それぞれの欄は既存の API を個別に呼び、1 つが読み込めなくても他の欄は表示する。
 */
export function MyPage() {
  return (
    <RequireUser>
      {(user) => (
        <div className="flex flex-col gap-6">
          <ProfileSection user={user} />
          <div className="grid gap-6 md:grid-cols-2">
            <MessagesSection user={user} />
            {user.role === "company" && <JobPostingsSection hasProfile={user.has_profile} />}
            <ArticlesSection hasProfile={user.has_profile} />
          </div>
        </div>
      )}
    </RequireUser>
  );
}

/** 各欄の共通の枠（見出し・右上の操作・本文・下部のリンク） */
function Section({
  title,
  headingId,
  action,
  footer,
  children,
}: {
  title: string;
  headingId: string;
  action?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={headingId} className="text-lg font-bold">
          {title}
        </h2>
        {action}
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      {footer && <div className="border-t border-slate-100 pt-3 text-sm">{footer}</div>}
    </section>
  );
}

function FooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-indigo-600 hover:underline">
      {children} →
    </Link>
  );
}

function EmptyText({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">{children}</p>;
}

// ---------------------------------------------------------------------------
// プロフィール

function ProfileSection({ user }: { user: User }) {
  const { profile, isLoading, error } = useMyProfile(true);

  return (
    <Section
      title="プロフィール"
      headingId="mypage-profile"
      action={
        profile && (
          <Link href="/mypage/profile" className={SECONDARY_BUTTON}>
            編集する
          </Link>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <p className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{ROLE_LABELS[user.role]}</span>
          <span className="break-all">{user.email}</span>
          <span className="text-xs text-slate-500">（メールアドレスは他のユーザーに公開されません）</span>
        </p>

        {isLoading ? (
          <Loading />
        ) : error ? (
          <FormAlert message="プロフィールを読み込めませんでした。時間をおいて再度お試しください。" />
        ) : !profile ? (
          <NoProfile user={user} />
        ) : user.role === "student" ? (
          <StudentSummary profile={profile as StudentProfile} />
        ) : (
          <CompanySummary profile={profile as CompanyProfile} />
        )}
      </div>
    </Section>
  );
}

function NoProfile({ user }: { user: User }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
      <p>
        {user.role === "student"
          ? "プロフィールがまだ登録されていません。登録すると、企業があなたを見つけてスカウトを送れるようになります。"
          : "企業プロフィールがまだ登録されていません。登録すると、インターン生へのスカウト・募集の作成・記事の投稿ができるようになります。"}
      </p>
      <Link href="/mypage/profile" className={PRIMARY_BUTTON}>
        プロフィールを登録する
      </Link>
    </div>
  );
}

function StudentSummary({ profile }: { profile: StudentProfile }) {
  const sub = [profile.university, profile.faculty, `${profile.graduation_year}年卒業予定`].filter(Boolean).join("・");

  return (
    <div className="grid gap-5 md:grid-cols-[1fr_18rem]">
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <p className="text-xl font-bold">{profile.name}</p>
          <p className="text-sm text-slate-600">{sub}</p>
          {profile.desired_role && <p className="mt-1 text-sm text-slate-600">志望職種: {profile.desired_role}</p>}
        </div>
        {profile.skills.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="スキル">
            {profile.skills.map((skill) => (
              <li key={skill}>
                <SkillTag>{skill}</SkillTag>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Completeness items={profileChecklist("student", profile)} />
    </div>
  );
}

function CompanySummary({ profile }: { profile: CompanyProfile }) {
  return (
    <div className="grid gap-5 md:grid-cols-[1fr_18rem]">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xl font-bold">{profile.company_name}</p>
        <p className="text-sm text-slate-600">担当: {profile.contact_name}</p>
        <Link href={`/companies/${profile.user_id}`} className="mt-2 self-start text-sm text-indigo-600 hover:underline">
          インターン生から見える企業ページを確認する →
        </Link>
      </div>
      <Completeness items={profileChecklist("company", profile)} />
    </div>
  );
}

/** 入力状況（割合のバーと未入力の項目） */
function Completeness({ items }: { items: ProfileCheckItem[] }) {
  const filled = items.filter((item) => item.filled).length;
  const missing = items.filter((item) => !item.filled);
  const percent = Math.round((filled / items.length) * 100);

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-slate-50 p-4">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-slate-700">入力状況</span>
        <span className="text-slate-600">
          <span className="text-base font-bold text-slate-800">{filled}</span> / {items.length} 項目
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="プロフィールの入力状況"
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={filled}
        aria-valuetext={`${items.length} 項目中 ${filled} 項目入力済み`}
        className="h-2 overflow-hidden rounded-full bg-slate-200"
      >
        <div
          className={`h-full rounded-full ${missing.length === 0 ? "bg-emerald-500" : "bg-indigo-500"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {missing.length === 0 ? (
        <p className="text-sm text-emerald-700">すべての項目が入力されています。</p>
      ) : (
        <div className="flex flex-col gap-1.5 text-sm">
          <p className="text-slate-600">未入力の項目:</p>
          <ul className="flex flex-wrap gap-1.5">
            {missing.map((item) => (
              <li key={item.label} className="rounded-full border border-amber-200 bg-white px-2.5 py-0.5 text-xs text-amber-800">
                {item.label}
              </li>
            ))}
          </ul>
          <Link href="/mypage/profile" className="mt-1 self-start text-indigo-600 hover:underline">
            入力してプロフィールを充実させる →
          </Link>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// メッセージ（未読がある会話）

function MessagesSection({ user }: { user: User }) {
  const unreadTotal = useUnreadCount(true);
  // 会話は新しいメッセージがある順に返るため、最初のページ（最新 20 件）から未読があるものを拾う
  const { data, error, isLoading } = useConversations(1);
  const unread = data?.conversations.filter((conversation) => conversation.unread_count > 0) ?? [];

  return (
    <Section
      title="未読のメッセージ"
      headingId="mypage-messages"
      action={
        unreadTotal > 0 && (
          <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">未読 {unreadTotal} 件</span>
        )
      }
      footer={<FooterLink href="/messages">すべてのメッセージを見る</FooterLink>}
    >
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <FormAlert message="メッセージを読み込めませんでした。" />
      ) : unread.length === 0 ? (
        <EmptyText>未読のメッセージはありません。</EmptyText>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {unread.slice(0, RECENT_LIMIT).map((conversation) => {
            const partner = partnerOf(conversation, user);
            return (
              <li key={conversation.id}>
                <Link
                  href={`/messages/${conversation.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-bold text-slate-900">{partner.name}</span>
                    <span className="truncate text-sm text-slate-600">{conversation.last_message?.body ?? ""}</span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {conversation.last_message_at && (
                      <time dateTime={conversation.last_message_at} className="text-xs text-slate-500">
                        {formatShortDateTime(conversation.last_message_at)}
                      </time>
                    )}
                    <span
                      className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white"
                      aria-label={`未読 ${conversation.unread_count} 件`}
                    >
                      {conversation.unread_count}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 自社の募集（企業のみ）

function JobPostingsSection({ hasProfile }: { hasProfile: boolean }) {
  const { data, error, isLoading } = useMyJobPostings(1);

  return (
    <Section
      title="自社の募集"
      headingId="mypage-job-postings"
      action={
        hasProfile && (
          <Link href="/mypage/job_postings/new" className={PRIMARY_BUTTON}>
            ＋ 新しい募集
          </Link>
        )
      }
      footer={
        <FooterLink href="/mypage/job_postings">
          募集管理へ{data ? `（全 ${data.meta.total_count} 件）` : ""}
        </FooterLink>
      }
    >
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <FormAlert message="募集を読み込めませんでした。" />
      ) : data.job_postings.length === 0 ? (
        <EmptyText>
          {hasProfile ? "まだ募集はありません。募集を作成すると、インターン生が一覧から見つけられます。" : "募集を作成するには、先にプロフィールを登録してください。"}
        </EmptyText>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {data.job_postings.slice(0, RECENT_LIMIT).map((posting) => (
            <li key={posting.id}>
              <RecentRow
                href={`/job_postings/${posting.id}`}
                editHref={`/mypage/job_postings/${posting.id}/edit`}
                title={posting.title}
                badge={<StatusBadge posting={posting} showPublished />}
                updatedAt={posting.updated_at}
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 自分の記事（下書きを含む）

function ArticlesSection({ hasProfile }: { hasProfile: boolean }) {
  const { data, error, isLoading } = useMyArticles(1);

  return (
    <Section
      title="自分の記事"
      headingId="mypage-articles"
      action={
        hasProfile && (
          <Link href="/mypage/articles/new" className={PRIMARY_BUTTON}>
            ＋ 記事を書く
          </Link>
        )
      }
      footer={
        <FooterLink href="/mypage/articles">記事管理へ{data ? `（全 ${data.meta.total_count} 件）` : ""}</FooterLink>
      }
    >
      {isLoading ? (
        <Loading />
      ) : error || !data ? (
        <FormAlert message="記事を読み込めませんでした。" />
      ) : data.articles.length === 0 ? (
        <EmptyText>
          {hasProfile ? "まだ記事はありません。学んだことや取り組みを発信してみましょう。" : "記事を書くには、先にプロフィールを登録してください。"}
        </EmptyText>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {data.articles.slice(0, RECENT_LIMIT).map((article) => (
            <li key={article.id}>
              <RecentRow
                href={`/articles/${article.id}`}
                editHref={`/mypage/articles/${article.id}/edit`}
                title={article.title}
                badge={<ArticleStatusBadge status={article.status} showPublished />}
                updatedAt={article.updated_at}
              />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

/** 募集・記事の 1 行（状態・タイトル・更新日時と「編集」） */
function RecentRow({
  href,
  editHref,
  title,
  badge,
  updatedAt,
}: {
  href: string;
  editHref: string;
  title: string;
  badge: ReactNode;
  updatedAt: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-slate-50">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          {badge}
          <span className="text-xs text-slate-500">更新: {formatShortDateTime(updatedAt)}</span>
        </div>
        <Link href={href} className="truncate font-medium text-slate-900 hover:text-indigo-600 hover:underline">
          {title}
        </Link>
      </div>
      <Link
        href={editHref}
        className="shrink-0 rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-700 hover:bg-white"
        aria-label={`「${title}」を編集`}
      >
        編集
      </Link>
    </div>
  );
}
