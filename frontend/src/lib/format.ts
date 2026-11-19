/** "2027-04-01" → "2027年4月1日"（タイムゾーンの影響を受けないよう文字列のまま変換する） */
export function formatDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}

/** 希望インターン期間の表示。どちらも未入力なら null */
export function formatPeriod(from: string | null, to: string | null): string | null {
  if (!from && !to) return null;
  return `${formatDate(from) ?? ""}〜${formatDate(to) ?? ""}`;
}

/**
 * リンクとして表示してよい URL か（http / https のみ）。
 * サーバー側でも検証しているが、javascript: などのリンクを描画しないよう表示側でも確認する。
 */
export function isSafeUrl(value: string | null): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}
