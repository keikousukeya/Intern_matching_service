"use client";

import useSWR, { useSWRConfig } from "swr";
import { apiFetch, fetcher } from "./api";
import type { User } from "./auth";
import type { JobPostingSummary } from "./jobPostings";
import type { PageMeta } from "./students";

export type Message = {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at: string;
  /** 募集に紐づけたスカウトのときだけ入る */
  job_posting: JobPostingSummary | null;
};

/** 会話（企業×インターン生で 1 件）。メールアドレスは含まない */
export type Conversation = {
  id: number;
  last_message_at: string | null;
  /** ログイン中のユーザーにとっての未読件数 */
  unread_count: number;
  /** プロフィール未登録の場合、名前は null になる */
  company: { user_id: number; company_name: string | null; contact_name: string | null };
  student: { user_id: number; name: string | null; university: string | null };
  /** 一覧でのみ返る最新メッセージ（本文は 100 文字まで） */
  last_message?: Message | null;
};

export type ConversationDetail = {
  conversation: Conversation;
  /** 古い順。新しい 100 件まで */
  messages: Message[];
  /** 省略された古いメッセージがあるか */
  has_older: boolean;
};

// メッセージの更新はポーリングで取得する（間隔はミリ秒。タブが非表示の間は SWR が自動で止める）
const POLL_CONVERSATION = 5_000;
const POLL_LIST = 15_000;
const POLL_UNREAD = 30_000;

const UNREAD_COUNT_KEY = "/conversations/unread_count";
const conversationKey = (id: number | string) => `/conversations/${encodeURIComponent(String(id))}`;
const isListKey = (key: unknown) => typeof key === "string" && key.startsWith("/conversations?");

/** 会話の相手の表示（企業から見ればインターン生、インターン生から見れば企業）。href は相手のプロフィール */
export function partnerOf(conversation: Conversation, viewer: User) {
  if (viewer.role === "company") {
    const { user_id, name, university } = conversation.student;
    return { name: name ?? "（プロフィール未登録のインターン生）", sub: university, href: `/students/${user_id}` };
  }
  const { user_id, company_name, contact_name } = conversation.company;
  return {
    name: company_name ?? "（プロフィール未登録の企業）",
    sub: contact_name ? `担当: ${contact_name}` : null,
    href: `/companies/${user_id}`,
  };
}

/** 会話の一覧（新しいメッセージがある順） */
export function useConversations(page: number) {
  return useSWR<{ conversations: Conversation[]; meta: PageMeta }>(`/conversations?page=${page}`, fetcher, {
    keepPreviousData: true,
    refreshInterval: POLL_LIST,
  });
}

/** 会話の詳細とメッセージ */
export function useConversation(id: string) {
  return useSWR<ConversationDetail>(conversationKey(id), fetcher, { refreshInterval: POLL_CONVERSATION });
}

/** 未読メッセージの合計（ヘッダーのバッジ用）。enabled が false なら取得しない */
export function useUnreadCount(enabled: boolean) {
  const { data } = useSWR<{ unread_count: number }>(enabled ? UNREAD_COUNT_KEY : null, fetcher, {
    refreshInterval: POLL_UNREAD,
  });
  return data?.unread_count ?? 0;
}

/** 送信・既読化の操作。成功したら一覧と未読数のキャッシュも取り直す */
export function useMessageActions() {
  const { mutate } = useSWRConfig();

  async function refreshSummaries() {
    await Promise.all([mutate(UNREAD_COUNT_KEY), mutate(isListKey)]);
  }

  return {
    /** 企業: インターン生にメッセージを送る（会話が無ければ作られる）。jobPostingId で自社の募集を紐づけられる。会話の ID を返す */
    async startConversation(studentId: number, body: string, jobPostingId: number | null = null) {
      const result = await apiFetch<{ conversation: Conversation; message: Message }>("/conversations", {
        method: "POST",
        body: { conversation: { student_id: studentId, body, job_posting_id: jobPostingId } },
      });
      await refreshSummaries();
      return result.conversation.id;
    },

    /** 既存の会話に送る（インターン生の返信もこれ）。企業は jobPostingId で自社の募集を紐づけられる */
    async sendMessage(conversationId: number, body: string, jobPostingId: number | null = null) {
      const result = await apiFetch<{ message: Message }>(`${conversationKey(conversationId)}/messages`, {
        method: "POST",
        body: { message: { body, job_posting_id: jobPostingId } },
      });
      await Promise.all([mutate(conversationKey(conversationId)), refreshSummaries()]);
      return result.message;
    },

    /** 会話を既読にする */
    async markAsRead(conversationId: number) {
      await apiFetch<void>(`${conversationKey(conversationId)}/read`, { method: "PUT" });
      await Promise.all([mutate(conversationKey(conversationId)), refreshSummaries()]);
    },
  };
}
