"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { articleSearchQuery, EMPTY_ARTICLE_SEARCH, useArticles, type ArticleSummary } from "@/lib/articles";
import type { User } from "@/lib/auth";
import { EMPTY_JOB_SEARCH, jobPostingSearchQuery, useJobPostings, useMyJobPostings, type JobPosting } from "@/lib/jobPostings";
import { useMyProfile, type StudentProfile } from "@/lib/profile";
import {
  buildRecommendations,
  normalizeSkills,
  RECOMMENDATION_LIMIT,
  type Recommendation,
} from "@/lib/recommendations";
import { EMPTY_SEARCH, studentSearchQuery, useStudents } from "@/lib/students";
import { ArticleCard } from "./ArticleCard";
import { FormAlert } from "./FormAlert";
import { JobPostingCard } from "./JobPostingCard";
import { Loading } from "./Loading";
import { StudentCard } from "./StudentCard";

/** 説明文に並べるスキルの数（多いと読みにくいため、残りは「ほか n 件」にする） */
const SKILLS_IN_TEXT = 5;

/**
 * ログイン後のトップページのおすすめ（A-3）。
 * インターン生: 自分のスキルを含む新着の募集・記事
 * 企業:         自社の募集の必要スキルに合う新着のインターン生・記事
 * 合うものが足りないときは新着順で埋める。
 */
export function Recommendations({ user }: { user: User }) {
  return user.role === "student" ? <StudentRecommendations user={user} /> : <CompanyRecommendations user={user} />;
}

/** おすすめの元になるスキル。ready が false の間はまだ決まっていない（取得中） */
type SkillSource = { skills: string[]; ready: boolean; emptyHint: ReactNode };

function StudentRecommendations({ user }: { user: User }) {
  const { profile, isLoading } = useMyProfile<"student">(user.has_profile);
  const skills = normalizeSkills((profile as StudentProfile | null)?.skills ?? []);
  const source: SkillSource = {
    skills,
    // 読み込みに失敗したときはスキルなしとして新着を出す（おすすめが出ないよりよいため）
    ready: !user.has_profile || !isLoading,
    emptyHint: (
      <>
        {user.has_profile ? "プロフィールにスキルを登録すると" : "プロフィールを登録してスキルを入力すると"}
        、スキルに合うものが表示されます。今は新着順に表示しています。{" "}
        <HintLink href="/mypage/profile">{user.has_profile ? "スキルを登録する" : "プロフィールを登録する"}</HintLink>
      </>
    ),
  };

  return (
    <>
      <JobPostingRecommendations source={source} />
      <ArticleRecommendations user={user} source={source} title="あなたのスキルに関連する記事" />
    </>
  );
}

function CompanyRecommendations({ user }: { user: User }) {
  // 自社の募集（更新順の最初の 20 件）の必要スキルを集める。公開中で締切前の募集のスキルを優先する
  const { data, isLoading } = useMyJobPostings(1);
  const postings = data?.job_postings ?? [];
  const isActive = (posting: JobPosting) => posting.status === "published" && !posting.closed;
  const ordered = [...postings.filter(isActive), ...postings.filter((posting) => !isActive(posting))];
  const source: SkillSource = {
    skills: normalizeSkills(ordered.flatMap((posting) => posting.skills)),
    ready: !isLoading,
    emptyHint: (
      <>
        募集に必要スキルを設定すると、スキルに合うものが表示されます。今は新着順に表示しています。{" "}
        <HintLink href="/mypage/job_postings">募集を管理する</HintLink>
      </>
    ),
  };

  return (
    <>
      <StudentRecommendationsForCompany source={source} />
      <ArticleRecommendations user={user} source={source} title="自社の募集に関連する記事" />
    </>
  );
}

// ---------------------------------------------------------------------------
// 種類ごとの欄

/**
 * 新着で埋める一覧が必要か。スキルが無ければ新着だけを出す。
 * スキルで取得した結果が出せる件数に届いていれば、新着は取得しない（余分な API 呼び出しを避ける）
 */
function needsLatest(source: SkillSource, matchedCount: number | undefined) {
  if (!source.ready) return false;
  if (source.skills.length === 0) return true;
  return matchedCount !== undefined && matchedCount < RECOMMENDATION_LIMIT;
}

function JobPostingRecommendations({ source }: { source: SkillSource }) {
  const search = { ...EMPTY_JOB_SEARCH, skills: source.skills, skillMatch: "any" as const };
  const matched = useJobPostings(search, 1, source.ready && source.skills.length > 0);
  const latest = useJobPostings(EMPTY_JOB_SEARCH, 1, needsLatest(source, matched.data?.job_postings.length));
  const items = buildRecommendations({
    matched: matched.data?.job_postings ?? [],
    latest: latest.data?.job_postings ?? [],
    mySkills: source.skills,
    getId: (posting) => posting.id,
    getSkills: (posting) => posting.skills,
  });

  return (
    <RecommendationSection
      headingId="recommend-job-postings"
      title="あなたのスキルに合う募集"
      source={source}
      state={{ matched, latest }}
      items={items}
      emptyText="公開中の募集はまだありません。"
      searchHref={`/job_postings?${jobPostingSearchQuery(search)}`}
      allHref="/job_postings"
      allLabel="募集をすべて見る"
      render={(posting) => <JobPostingCard posting={posting} headingLevel="h3" />}
    />
  );
}

function StudentRecommendationsForCompany({ source }: { source: SkillSource }) {
  const search = { ...EMPTY_SEARCH, skills: source.skills, skillMatch: "any" as const };
  const matched = useStudents(search, 1, source.ready && source.skills.length > 0);
  const latest = useStudents(EMPTY_SEARCH, 1, needsLatest(source, matched.data?.students.length));
  const items = buildRecommendations({
    matched: matched.data?.students ?? [],
    latest: latest.data?.students ?? [],
    mySkills: source.skills,
    getId: (student) => student.user_id,
    getSkills: (student) => student.skills,
  });

  return (
    <RecommendationSection
      headingId="recommend-students"
      title="自社の募集に合うインターン生"
      source={source}
      state={{ matched, latest }}
      items={items}
      emptyText="プロフィールを登録したインターン生はまだいません。"
      searchHref={`/students?${studentSearchQuery(search)}`}
      allHref="/students"
      allLabel="インターン生をすべて見る"
      render={(student) => <StudentCard student={student} headingLevel="h3" />}
    />
  );
}

function ArticleRecommendations({ user, source, title }: { user: User; source: SkillSource; title: string }) {
  const search = { ...EMPTY_ARTICLE_SEARCH, skills: source.skills, skillMatch: "any" as const };
  // 自分の記事はおすすめに出さない
  const isMine = (article: ArticleSummary) => article.author.user_id === user.id;
  const matched = useArticles(search, 1, source.ready && source.skills.length > 0);
  const matchedCount = matched.data?.articles.filter((article) => !isMine(article)).length;
  const latest = useArticles(EMPTY_ARTICLE_SEARCH, 1, needsLatest(source, matchedCount));
  const items = buildRecommendations({
    matched: matched.data?.articles ?? [],
    latest: latest.data?.articles ?? [],
    mySkills: source.skills,
    getId: (article) => article.id,
    getSkills: (article) => article.skills,
    exclude: isMine,
  });

  return (
    <RecommendationSection
      headingId="recommend-articles"
      title={title}
      source={source}
      state={{ matched, latest }}
      items={items}
      emptyText="公開中の記事はまだありません。"
      searchHref={`/articles?${articleSearchQuery(search)}`}
      allHref="/articles"
      allLabel="記事をすべて見る"
      render={(article) => <ArticleCard article={article} viewer={user} headingLevel="h3" />}
    />
  );
}

// ---------------------------------------------------------------------------
// 共通の枠

type QueryState = { isLoading: boolean; error?: unknown };

function RecommendationSection<T>({
  headingId,
  title,
  source,
  state,
  items,
  emptyText,
  searchHref,
  allHref,
  allLabel,
  render,
}: {
  headingId: string;
  title: string;
  source: SkillSource;
  state: { matched: QueryState; latest: QueryState };
  items: Recommendation<T>[];
  emptyText: string;
  /** スキルで絞り込んだ一覧の URL */
  searchHref: string;
  allHref: string;
  allLabel: string;
  render: (item: T) => ReactNode;
}) {
  const hasSkills = source.skills.length > 0;
  const isLoading = !source.ready || state.matched.isLoading || state.latest.isLoading;
  const failed = Boolean(state.matched.error || state.latest.error);
  // スキルがあるのに一致しないものが混ざっている = 新着で埋めた
  const filled = hasSkills && items.some((recommendation) => recommendation.matchedSkills.length === 0);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={headingId} className="text-xl font-bold">
          {title}
        </h2>
        <p className="text-sm text-slate-600">
          {!source.ready ? (
            " "
          ) : hasSkills ? (
            <>
              スキル（{skillsText(source.skills)}）のいずれかを含むものを新着順に表示しています。
              {filled && "合うものが少ないため、新着も表示しています。"}
            </>
          ) : (
            source.emptyHint
          )}
        </p>
      </div>

      {isLoading && items.length === 0 ? (
        <Loading />
      ) : failed && items.length === 0 ? (
        <FormAlert message="おすすめを読み込めませんでした。時間をおいて再度お試しください。" />
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          {emptyText}
        </p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {items.map((recommendation) => (
            <li key={recommendation.id} className="flex flex-col gap-1.5">
              <MatchLabel skills={recommendation.matchedSkills} />
              <div className="flex-1">{render(recommendation.item)}</div>
            </li>
          ))}
        </ul>
      )}

      <p className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {hasSkills && (
          <Link href={searchHref} className="text-indigo-600 hover:underline">
            スキルで絞り込んだ一覧を見る →
          </Link>
        )}
        <Link href={allHref} className="text-indigo-600 hover:underline">
          {allLabel} →
        </Link>
      </p>
    </section>
  );
}

/** カードの上に出す「一致したスキル」または「新着」のラベル */
function MatchLabel({ skills }: { skills: string[] }) {
  if (skills.length === 0) {
    return <p className="text-xs font-medium text-slate-500">新着</p>;
  }
  return (
    <p className="text-xs font-medium text-emerald-700">
      <span aria-hidden>✓ </span>
      スキルが一致: {skills.join("・")}
    </p>
  );
}

function HintLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-indigo-600 hover:underline">
      {children} →
    </Link>
  );
}

function skillsText(skills: string[]) {
  const shown = skills.slice(0, SKILLS_IN_TEXT).join("・");
  return skills.length > SKILLS_IN_TEXT ? `${shown} ほか ${skills.length - SKILLS_IN_TEXT} 件` : shown;
}
