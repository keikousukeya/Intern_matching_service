"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import type { User } from "@/lib/auth";
import { loadContactName, saveContactName } from "@/lib/contactName";
import { formatDateTime } from "@/lib/format";
import { partnerOf, useConversation, useMessageActions, type Message } from "@/lib/messages";
import { FormAlert } from "./FormAlert";
import { JobPostingPicker } from "./JobPostingPicker";
import { JobPostingAttachment } from "./JobPostingParts";
import { Loading } from "./Loading";
import { MessageComposer } from "./MessageComposer";
import { RequireUser } from "./RequireUser";

/** 会話（スレッド）の画面。企業・インターン生で共通。新着はポーリングで取得する */
export function ConversationView({ id }: { id: string }) {
  return <RequireUser>{(user) => <View id={id} user={user} />}</RequireUser>;
}

function View({ id, user }: { id: string; user: User }) {
  const { data, error, isLoading } = useConversation(id);
  const { sendMessage, markAsRead } = useMessageActions();
  const scrollRef = useRef<HTMLDivElement>(null);
  // 企業: 次に送るメッセージに紐づける募集（送信したら解除する）
  const [jobPostingId, setJobPostingId] = useState<number | null>(null);
  const lastMarkedId = useRef<number | null>(null);

  const messages = data?.messages ?? [];
  const latestId = messages.at(-1)?.id ?? null;
  const conversationId = data?.conversation.id;
  const unreadCount = data?.conversation.unread_count ?? 0;

  // 新しいメッセージが表示されたら一番下までスクロールする
  useEffect(() => {
    const box = scrollRef.current;
    if (box) box.scrollTop = box.scrollHeight;
  }, [latestId]);

  // 未読があれば既読にする（同じメッセージに対して何度も送らないよう、最後に既読化した位置を覚えておく）
  useEffect(() => {
    if (!conversationId || unreadCount === 0 || lastMarkedId.current === latestId) return;
    lastMarkedId.current = latestId;
    markAsRead(conversationId).catch(() => {
      // 既読化に失敗しても閲覧は続けられるため、次回の取得時に再試行する
      lastMarkedId.current = null;
    });
  }, [conversationId, unreadCount, latestId, markAsRead]);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) {
    return <FormAlert message="この会話は見つかりませんでした。" />;
  }
  if (error || !data) return <FormAlert message="メッセージを読み込めませんでした。" />;

  const partner = partnerOf(data.conversation, user);
  // 企業: 担当者名の初期値は、この会話で自社が最後に使った名前 → このブラウザで最後に使った名前 の順
  const lastOwnSenderName = messages.findLast((message) => message.sender_id === user.id && message.sender_name)?.sender_name;
  const initialSenderName = user.role === "company" ? (lastOwnSenderName ?? loadContactName(user.id)) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <Link href="/messages" className="self-start text-sm text-indigo-600 hover:underline">
        ← メッセージ一覧へ戻る
      </Link>

      <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-4 py-3 sm:px-6">
          <h1 className="text-lg font-bold">
            {partner.name}
            {partner.sub && <span className="ml-2 text-sm font-normal text-slate-500">{partner.sub}</span>}
          </h1>
          <Link href={partner.href} className="text-sm text-indigo-600 hover:underline">
            {user.role === "company" ? "プロフィールを見る" : "企業情報を見る"}
          </Link>
        </header>

        <div ref={scrollRef} className="flex max-h-[60vh] min-h-48 flex-col gap-4 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-6">
          {data.has_older && (
            <p className="text-center text-xs text-slate-500">これより前のメッセージは省略しています（最新 100 件を表示）</p>
          )}
          {messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">まだメッセージはありません。</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {messages.map((message) => (
                <li key={message.id}>
                  <MessageBubble message={message} mine={message.sender_id === user.id} />
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
          <MessageComposer
            initialSenderName={initialSenderName}
            onSend={async (body, senderName) => {
              await sendMessage(data.conversation.id, body, senderName, jobPostingId);
              if (senderName) saveContactName(user.id, senderName);
              setJobPostingId(null);
            }}
            placeholder={user.role === "student" ? "返信を入力" : "メッセージを入力"}
            submitLabel={user.role === "student" ? "返信する" : "送信する"}
            accessory={
              user.role === "company" && <JobPostingPicker value={jobPostingId} onChange={setJobPostingId} />
            }
          />
        </div>
      </section>
    </div>
  );
}

function MessageBubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <div className={`flex flex-col gap-1 ${mine ? "items-end" : "items-start"}`}>
      {/* React が文字列をエスケープするため、本文をそのまま表示しても HTML として解釈されない */}
      <p
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 leading-relaxed sm:max-w-[75%] ${
          mine ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
        }`}
      >
        {message.body}
      </p>
      {message.job_posting && (
        <div className="w-full max-w-[85%] sm:max-w-[75%]">
          <JobPostingAttachment posting={message.job_posting} />
        </div>
      )}
      <p className="text-xs text-slate-500">
        {mine && "あなた・"}
        {/* 企業のメッセージは担当者名を出す（1 社で複数の担当者が送ることもあるため） */}
        {message.sender_name && `担当: ${message.sender_name}・`}
        <time dateTime={message.created_at}>{formatDateTime(message.created_at)}</time>
      </p>
    </div>
  );
}
