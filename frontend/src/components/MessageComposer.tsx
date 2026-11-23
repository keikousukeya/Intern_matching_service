"use client";

import { useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { CONTACT_NAME_MAX_LENGTH } from "@/lib/contactName";
import { FormAlert } from "./FormAlert";

const BODY_MAX_LENGTH = 2000;

type Props = {
  /** 送信処理。senderName は担当者名の入力欄を出したときだけ入る（それ以外は null）。失敗したら例外を投げる（入力内容は消さずに残す） */
  onSend: (body: string, senderName: string | null) => Promise<unknown>;
  /**
   * 担当者名の入力欄の初期値。指定すると入力欄を出し、空のままでは送れないようにする（企業が送るとき）。
   * インターン生の返信では指定しない
   */
  initialSenderName?: string;
  placeholder?: string;
  submitLabel?: string;
  /** 本文の下に置く追加の入力（例: スカウトに紐づける募集の選択） */
  accessory?: ReactNode;
};

/** メッセージの入力欄と送信ボタン。Ctrl（Mac は ⌘）+ Enter でも送信できる */
export function MessageComposer({
  onSend,
  initialSenderName,
  placeholder = "メッセージを入力",
  submitLabel = "送信する",
  accessory,
}: Props) {
  const askSenderName = initialSenderName !== undefined;
  const [body, setBody] = useState("");
  const [senderName, setSenderName] = useState(initialSenderName ?? "");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const missingSenderName = askSenderName && senderName.trim().length === 0;
  const canSend = body.trim().length > 0 && !missingSenderName && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await onSend(body, askSenderName ? senderName : null);
      // 担当者名は続けて送るときも同じことが多いため残し、本文だけ消す
      setBody("");
    } catch (e) {
      if (e instanceof ApiError) {
        // 項目のエラーは「本文を入力してください」のような完全な文で返る
        setError(e.errors.sender_name?.[0] ?? e.errors.body?.[0] ?? e.message);
      } else {
        setError("送信に失敗しました。時間をおいて再度お試しください。");
      }
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // 日本語入力の変換確定中の Enter では送らない
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <FormAlert message={error} />
      {askSenderName && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="message-sender-name" className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-700">
            担当者名
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs text-rose-600">必須</span>
          </label>
          <input
            id="message-sender-name"
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            maxLength={CONTACT_NAME_MAX_LENGTH}
            autoComplete="name"
            placeholder="例: 佐藤 美咲"
            aria-describedby="message-sender-name-hint"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 sm:max-w-xs"
          />
          <span id="message-sender-name-hint" className="text-xs text-slate-500">
            送信者としてインターン生に表示されます
          </span>
        </div>
      )}
      <label htmlFor="message-body" className="sr-only">
        メッセージ本文
      </label>
      <textarea
        id="message-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={BODY_MAX_LENGTH}
        rows={3}
        className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      />
      {accessory}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {missingSenderName ? (
            <span className="text-rose-600">担当者名を入力してください</span>
          ) : (
            <>
              {body.length} / {BODY_MAX_LENGTH}文字
              <span className="hidden sm:inline">・Ctrl + Enter で送信</span>
            </>
          )}
        </span>
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          {sending ? "送信中…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
