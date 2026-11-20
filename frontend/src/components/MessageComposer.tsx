"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { ApiError } from "@/lib/api";
import { FormAlert } from "./FormAlert";

const BODY_MAX_LENGTH = 2000;

type Props = {
  /** 送信処理。失敗したら例外を投げる（入力内容は消さずに残す） */
  onSend: (body: string) => Promise<unknown>;
  placeholder?: string;
  submitLabel?: string;
};

/** メッセージの入力欄と送信ボタン。Ctrl（Mac は ⌘）+ Enter でも送信できる */
export function MessageComposer({ onSend, placeholder = "メッセージを入力", submitLabel = "送信する" }: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const canSend = body.trim().length > 0 && !sending;

  async function send() {
    if (!canSend) return;
    setSending(true);
    setError(null);
    try {
      await onSend(body);
      setBody("");
    } catch (e) {
      if (e instanceof ApiError) {
        // 本文のエラーは「本文を入力してください」のような完全な文で返る
        setError(e.errors.body?.[0] ?? e.message);
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
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {body.length} / {BODY_MAX_LENGTH}文字
          <span className="hidden sm:inline">・Ctrl + Enter で送信</span>
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
