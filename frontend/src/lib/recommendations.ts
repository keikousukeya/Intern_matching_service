// トップページのおすすめ（A-3）の組み立て。
// 既存の検索 API（skills[] + skill_match=any）で「スキルのいずれかを含むもの」を新着順に取り、
// 足りない分を新着順の一覧で埋める。並びは「一致の数が多い順」ではなく新着順になる（API の並び順のまま）。

/** 各欄に出す件数 */
export const RECOMMENDATION_LIMIT = 4;

/** 検索 API が受け付けるスキルの数の上限（Rails 側の MAX_SKILLS と同じ）。超えた分は先頭から使う */
export const MAX_RECOMMENDATION_SKILLS = 10;

export type Recommendation<T> = {
  id: number;
  item: T;
  /** 自分のスキルと一致したスキル（表示用。元の表記のまま） */
  matchedSkills: string[];
};

/** 大文字小文字・前後の空白を無視してスキルの重複を除き、検索に使う上限までに絞る */
export function normalizeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const skill of skills) {
    const key = skill.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(skill.trim());
  }
  return result.slice(0, MAX_RECOMMENDATION_SKILLS);
}

/**
 * スキルが一致したもの（matched）を先に、足りない分を新着（latest）で埋めて limit 件にする。
 * - 同じものが両方にあれば 1 回だけ出す
 * - exclude が true のもの（例: 自分の記事）は出さない
 * - 一致したスキルは取得した結果から画面側で数え直す（新着で埋めたものにも一致があれば表示するため）
 */
export function buildRecommendations<T>({
  matched,
  latest,
  mySkills,
  getId,
  getSkills,
  exclude = () => false,
  limit = RECOMMENDATION_LIMIT,
}: {
  matched: T[];
  latest: T[];
  mySkills: string[];
  getId: (item: T) => number;
  getSkills: (item: T) => string[];
  exclude?: (item: T) => boolean;
  limit?: number;
}): Recommendation<T>[] {
  const mine = new Set(mySkills.map((skill) => skill.toLowerCase()));
  const seen = new Set<number>();
  const result: Recommendation<T>[] = [];

  for (const item of [...matched, ...latest]) {
    if (result.length >= limit) break;
    const id = getId(item);
    if (seen.has(id) || exclude(item)) continue;
    seen.add(id);
    result.push({ id, item, matchedSkills: getSkills(item).filter((skill) => mine.has(skill.toLowerCase())) });
  }
  return result;
}
