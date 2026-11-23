"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import type { User } from "@/lib/auth";
import { loadContactName, saveContactName } from "@/lib/contactName";
import { formatPeriod, isSafeUrl } from "@/lib/format";
import { useMessageActions } from "@/lib/messages";
import { useStudent } from "@/lib/students";
import { AuthorArticles } from "./AuthorArticles";
import { FormAlert } from "./FormAlert";
import { JobPostingPicker } from "./JobPostingPicker";
import { Loading } from "./Loading";
import { MessageComposer } from "./MessageComposer";
import { RequireUser } from "./RequireUser";
import { SkillTag } from "./SkillTag";

/** 企業向け: インターン生プロフィールの詳細。ここからスカウト（メッセージ）を送る */
export function StudentDetail({ id }: { id: string }) {
  return <RequireUser role="company">{(user) => <Detail id={id} user={user} />}</RequireUser>;
}

function Detail({ id, user }: { id: string; user: User }) {
  const { data, error, isLoading, mutate } = useStudent(id);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) {
    return <FormAlert message="このインターン生のプロフィールは見つかりませんでした。" />;
  }
  if (error || !data) return <FormAlert message="プロフィールを読み込めませんでした。" />;

  const { student } = data;
  const period = formatPeriod(student.available_from, student.available_to);
  const links = [
    { label: "ポートフォリオ", url: student.portfolio_url },
    { label: "GitHub", url: student.github_url },
  ].filter((link): link is { label: string; url: string } => isSafeUrl(link.url));

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <header className="flex flex-col gap-1 border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-slate-600">
          {student.university}
          {student.faculty && ` ${student.faculty}`}・{student.graduation_year}年卒業予定
        </p>
      </header>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[8rem_1fr]">
        <Item label="志望職種">{student.desired_role ?? <Empty />}</Item>
        <Item label="希望期間">{period ?? <Empty />}</Item>
        <Item label="スキル">
          {student.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {student.skills.map((skill) => (
                <li key={skill}>
                  <SkillTag>{skill}</SkillTag>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Item>
        <Item label="自己紹介">
          {/* React が文字列をエスケープするため、入力内容をそのまま表示しても HTML として解釈されない */}
          {student.bio ? <p className="whitespace-pre-wrap leading-relaxed">{student.bio}</p> : <Empty />}
        </Item>
        <Item label="リンク">
          {links.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.label}>
                  <span className="mr-2 text-sm text-slate-500">{link.label}</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="break-all text-indigo-600 hover:underline"
                  >
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Item>
      </dl>

      {/* 書いた記事から、プロフィールだけでは分かりにくい技術力や関心を確認できる */}
      <AuthorArticles authorId={student.user_id} viewer={user} />

      <ScoutSection
        userId={user.id}
        studentId={student.user_id}
        studentName={student.name}
        conversationId={data.conversation_id}
        hasCompanyProfile={user.has_profile}
        onStarted={(conversationId) => mutate({ ...data, conversation_id: conversationId }, { revalidate: false })}
      />

      <Link href="/students" className="self-start text-sm text-indigo-600 hover:underline">
        ← インターン生一覧へ戻る
      </Link>
    </article>
  );
}

/**
 * スカウトの送信欄。会話が既にあれば（企業×インターン生で 1 スレッド）その会話へのリンクを出し、
 * 無ければ最初のメッセージを書いて送る。送信後は会話の画面へ移動する
 */
function ScoutSection({
  userId,
  studentId,
  studentName,
  conversationId,
  hasCompanyProfile,
  onStarted,
}: {
  /** ログイン中の企業ユーザー（最後に使った担当者名を読み書きするため） */
  userId: number;
  studentId: number;
  studentName: string;
  conversationId: number | null;
  hasCompanyProfile: boolean;
  /** 送信後、詳細のキャッシュに会話 ID を反映する（戻ったときに「メッセージを開く」と表示するため） */
  onStarted: (conversationId: number) => unknown;
}) {
  const router = useRouter();
  const { startConversation } = useMessageActions();
  const [jobPostingId, setJobPostingId] = useState<number | null>(null);

  async function handleSend(body: string, senderName: string | null) {
    const id = await startConversation(studentId, body, senderName ?? "", jobPostingId);
    saveContactName(userId, senderName ?? "");
    await onStarted(id);
    router.push(`/messages/${id}`);
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 sm:p-5">
      <h2 className="font-bold">スカウトを送る</h2>
      {conversationId ? (
        <>
          <p className="text-sm text-slate-600">{studentName}さんとは、すでにメッセージのやり取りがあります。</p>
          <Link
            href={`/messages/${conversationId}`}
            className="self-start rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700"
          >
            メッセージを開く
          </Link>
        </>
      ) : hasCompanyProfile ? (
        <>
          <p className="text-sm text-slate-600">
            プロフィールのどこに魅力を感じたか、インターンで任せたい業務などを伝えると返信につながりやすくなります。
          </p>
          <MessageComposer
            onSend={handleSend}
            initialSenderName={loadContactName(userId)}
            placeholder={`${studentName}さんへのメッセージ`}
            accessory={<JobPostingPicker value={jobPostingId} onChange={setJobPostingId} />}
          />
        </>
      ) : (
        <p className="text-sm text-slate-600">
          スカウトの送信者として企業名を表示するため、先に
          <Link href="/mypage/profile" className="mx-1 text-indigo-600 hover:underline">
            企業プロフィール
          </Link>
          を登録してください。
        </p>
      )}
    </section>
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

function Empty() {
  return <span className="text-slate-400">未入力</span>;
}
