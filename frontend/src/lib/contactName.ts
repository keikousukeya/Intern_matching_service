// 企業の担当者名の入力補助。
// 担当者名はスカウト・メッセージの送信や記事の公開のたびに入力するため、最後に使った名前をこのブラウザに覚えておき、次の入力欄に最初から入れておく。
// 保存できない環境（プライベートブラウズなど）でも入力はできるよう、失敗しても無視する。

export const CONTACT_NAME_MAX_LENGTH = 50;

const storageKey = (userId: number) => `intern-scout:contact-name:${userId}`;

/** 最後に使った担当者名（無ければ空文字） */
export function loadContactName(userId: number): string {
  try {
    return window.localStorage.getItem(storageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

/** 使った担当者名を覚える */
export function saveContactName(userId: number, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    window.localStorage.setItem(storageKey(userId), trimmed);
  } catch {
    // 保存できなくても次回の入力が少し手間になるだけなので無視する
  }
}
