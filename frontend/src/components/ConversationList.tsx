"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { User } from "@/lib/auth";
import { formatShortDateTime } from "@/lib/format";
import { partnerOf, useConversations, type Conversation } from "@/lib/messages";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";

/** メッセージ一覧（企業: 送ったスカウト / インターン生: 受信したスカウト）。新しいメッセージがある順 */
export function ConversationList() {
  return <RequireUser>{(user) => <List user={user} />}</RequireUser>;
}

function List({ user }: { user: User }) {
  const searchParams = useSearchParams();
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const { data, error, isLoading } = useConversations(page);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="メッセージの一覧を読み込めませんでした。" />;

  const { conversations, meta } = data;

  if (meta.total_count === 0) return <EmptyState user={user} />;

  return (
    <div className="flex flex-col gap-4">
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationRow conversation={conversation} user={user} />
          </li>
        ))}
      </ul>
      <Pagination meta={meta} basePath="/messages" />
    </div>
  );
}

function ConversationRow({ conversation, user }: { conversation: Conversation; user: User }) {
  const partner = partnerOf(conversation, user);
  const last = conversation.last_message;
  const unread = conversation.unread_count > 0;

  return (
    <Link
      href={`/messages/${conversation.id}`}
      className="flex gap-3 px-4 py-4 transition hover:bg-slate-50 sm:px-5"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className={`truncate ${unread ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>
            {partner.name}
            {partner.sub && <span className="ml-2 text-sm font-normal text-slate-500">{partner.sub}</span>}
          </p>
          {conversation.last_message_at && (
            <time dateTime={conversation.last_message_at} className="shrink-0 text-xs text-slate-500">
              {formatShortDateTime(conversation.last_message_at)}
            </time>
          )}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className={`truncate text-sm ${unread ? "text-slate-800" : "text-slate-500"}`}>
            {last ? `${last.sender_id === user.id ? "あなた: " : ""}${last.body}` : "メッセージはありません"}
          </p>
          {unread && (
            <span
              className="shrink-0 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white"
              aria-label={`未読 ${conversation.unread_count} 件`}
            >
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ user }: { user: User }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 text-center text-slate-500">
      {user.role === "company" ? (
        <>
          <p>まだメッセージを送っていません。</p>
          <Link href="/students" className="text-indigo-600 hover:underline">
            インターン生を探してスカウトを送る
          </Link>
        </>
      ) : (
        <>
          <p>まだ企業からのメッセージはありません。</p>
          <Link href="/mypage/profile" className="text-indigo-600 hover:underline">
            プロフィールを充実させてスカウトを待つ
          </Link>
        </>
      )}
    </div>
  );
}
