"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export const LEAVE_CONFIRM_MESSAGE = "保存していない変更があります。このページを離れると入力した内容は失われます。移動しますか？";

/**
 * 保存していない変更があるときに、ページを離れる前に確認を出す。
 *
 * - 再読み込み・タブを閉じる・URL の直接入力: beforeunload（ブラウザ標準の確認。文言は変えられない）
 * - 画面内のリンク（next/link を含む）: クリックを先に受け取り、確認してから移動する
 * - ブラウザの「戻る」: Next.js には画面移動を止める仕組みが無いため、変更が入った時点で
 *   同じページの履歴を 1 つ足しておき、「戻る」でその分だけ戻ったところで確認する。
 *   「移動する」なら本当に戻り、「キャンセル」なら履歴を足し直して元の状態にする。
 *
 * 足した履歴が残らないよう、このフック経由の移動（leave・リンク）は足した分を置き換える（router.replace）。
 */
export function useLeaveGuard(dirty: boolean) {
  const router = useRouter();
  // 最新の値をイベントの処理から読むための ref
  const dirtyRef = useRef(dirty);
  // 保存後の移動など、確認を出さずに離れてよい状態
  const allowedRef = useRef(false);
  // 「戻る」を受け取るための履歴を足しているか
  const extraEntryRef = useRef(false);

  useEffect(() => {
    dirtyRef.current = dirty;
    if (dirty && !extraEntryRef.current) {
      // URL を変えずに同じページの履歴を足す（Next.js が自分の履歴の情報を引き継ぐ）
      window.history.pushState(null, "");
      extraEntryRef.current = true;
    }
  }, [dirty]);

  const shouldConfirm = useCallback(() => dirtyRef.current && !allowedRef.current, []);

  /** 確認を出さずに href へ移動する。足した履歴があれば置き換えて、「戻る」で余分に止まらないようにする */
  const leave = useCallback(
    (href: string) => {
      allowedRef.current = true;
      if (extraEntryRef.current) {
        extraEntryRef.current = false;
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [router],
  );

  // 再読み込み・タブを閉じる
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (!shouldConfirm()) return;
      event.preventDefault();
      // 古いブラウザ向け（値を入れないと確認が出ないものがある）
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [shouldConfirm]);

  // 画面内のリンク。next/link のクリック処理より先に受け取るため、window の capture で登録する
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      // 新しいタブで開く操作はこのページを離れないので対象外
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // 同じページ内の移動（# だけ違う）は入力が消えないので対象外
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      if (!shouldConfirm() && !extraEntryRef.current) return;

      event.preventDefault();
      event.stopPropagation();
      if (shouldConfirm() && !window.confirm(LEAVE_CONFIRM_MESSAGE)) return;
      leave(url.pathname + url.search + url.hash);
    }
    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, [shouldConfirm, leave]);

  // ブラウザの「戻る」
  useEffect(() => {
    function handlePopState() {
      if (!extraEntryRef.current) return;
      // 足した履歴の分だけ戻った（画面は同じページのまま）
      extraEntryRef.current = false;
      if (shouldConfirm() && !window.confirm(LEAVE_CONFIRM_MESSAGE)) {
        // キャンセル: 履歴を足し直して、次の「戻る」もまた受け取れるようにする
        window.history.pushState(null, "");
        extraEntryRef.current = true;
        return;
      }
      allowedRef.current = true;
      window.history.back();
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [shouldConfirm]);

  return { leave };
}

/**
 * name の付いた入力欄（defaultValue で値を持つフォーム）が最初の値から変わったかを調べる。
 * name の無い値（スキルなど state で持つもの）は extra に渡す。
 * 保存したら markSaved を呼ぶと、その時点の値が新しい基準になる。
 */
export function useFormChanges(extra: unknown) {
  const extraKey = JSON.stringify(extra ?? null);
  const [baselineExtra, setBaselineExtra] = useState(extraKey);
  const [fieldsChanged, setFieldsChanged] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const baselineRef = useRef<string | null>(null);
  const extraKeyRef = useRef(extraKey);

  useEffect(() => {
    extraKeyRef.current = extraKey;
  }, [extraKey]);

  /** form の ref に渡す。最初に表示された時点の値を基準として覚える */
  const attachForm = useCallback((node: HTMLFormElement | null) => {
    formRef.current = node;
    if (node && baselineRef.current === null) baselineRef.current = serializeForm(node);
  }, []);

  /** form の onChange に渡す */
  const handleChange = useCallback(() => {
    if (!formRef.current) return;
    setFieldsChanged(serializeForm(formRef.current) !== baselineRef.current);
  }, []);

  const markSaved = useCallback(() => {
    if (formRef.current) baselineRef.current = serializeForm(formRef.current);
    setFieldsChanged(false);
    setBaselineExtra(extraKeyRef.current);
  }, []);

  return { dirty: fieldsChanged || extraKey !== baselineExtra, attachForm, handleChange, markSaved };
}

function serializeForm(form: HTMLFormElement) {
  return JSON.stringify(Array.from(new FormData(form).entries(), ([name, value]) => [name, String(value)]));
}
