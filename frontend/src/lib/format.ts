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

// 日時は利用者の端末の設定に関係なく JST で表示する（仕様: タイムゾーンは JST 固定）
const TIME_ZONE = "Asia/Tokyo";

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const TIME_FORMAT = new Intl.DateTimeFormat("ja-JP", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" });
const MONTH_DAY_FORMAT = new Intl.DateTimeFormat("ja-JP", { timeZone: TIME_ZONE, month: "numeric", day: "numeric" });
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

/** "2026-11-20T14:05:00+09:00" → "2026年11月20日 14:05" */
export function formatDateTime(value: string): string {
  return DATE_TIME_FORMAT.format(new Date(value));
}

/** 一覧用の短い表示。今日なら "14:05"、それ以外は "11/20" */
export function formatShortDateTime(value: string, now: Date = new Date()): string {
  const date = new Date(value);
  return DAY_KEY_FORMAT.format(date) === DAY_KEY_FORMAT.format(now)
    ? TIME_FORMAT.format(date)
    : MONTH_DAY_FORMAT.format(date);
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

/** JST での今日の日付（"2026-11-22"）。日付入力の min などに使う */
export function todayInJst(now: Date = new Date()): string {
  return DAY_KEY_FORMAT.format(now);
}
