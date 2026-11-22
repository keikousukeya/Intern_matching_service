"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_JOB_SEARCH,
  hasJobPostingFilters,
  jobPostingSearchQuery,
  parseJobPostingSearch,
  useJobPostings,
  type JobPostingSearchParams,
  type JobPostingSort,
} from "@/lib/jobPostings";
import { FormAlert } from "./FormAlert";
import { JobPostingCard } from "./JobPostingCard";
import { JobPostingSearchForm } from "./JobPostingSearchForm";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";

const SORT_LABELS: Record<JobPostingSort, string> = { newest: "新着順", deadline: "締切が近い順" };

/** 募集の一覧と検索（ログインユーザー全員。検索条件・並び順・ページは URL のクエリで持つ） */
export function JobPostingList() {
  return <RequireUser>{() => <Search />}</RequireUser>;
}

function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = parseJobPostingSearch(searchParams);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const query = jobPostingSearchQuery(search);

  // 条件を変えたら 1 ページ目から表示する
  function navigate(next: JobPostingSearchParams) {
    const nextQuery = jobPostingSearchQuery(next).toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* URL が変わったら（戻る・クリアなど）フォームを作り直して入力欄を URL の条件にそろえる */}
      <JobPostingSearchForm
        key={query.toString()}
        initial={search}
        onSearch={navigate}
        onClear={() => navigate({ ...EMPTY_JOB_SEARCH, sort: search.sort })}
      />
      <Results search={search} page={page} query={query} onSortChange={(sort) => navigate({ ...search, sort })} />
    </div>
  );
}

type ResultsProps = {
  search: JobPostingSearchParams;
  page: number;
  query: URLSearchParams;
  onSortChange: (sort: JobPostingSort) => void;
};

function Results({ search, page, query, onSortChange }: ResultsProps) {
  const { data, error, isLoading } = useJobPostings(search, page);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="募集の一覧を読み込めませんでした。" />;

  const { job_postings: postings, meta } = data;
  const filtered = hasJobPostingFilters(search);

  if (meta.total_count === 0) {
    return (
      <p className="py-10 text-center text-slate-500">
        {filtered
          ? "条件に合う募集が見つかりませんでした。条件を減らして検索してみてください。"
          : "現在、公開中の募集はありません。"}
      </p>
    );
  }

  return (
    <section aria-label="検索結果" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600" role="status">
          {filtered ? "条件に合う募集" : "公開中の募集"}
          <span className="mx-1 text-base font-bold text-slate-800">{meta.total_count}</span>件
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          並び順
          <select
            value={search.sort}
            onChange={(event) => onSortChange(event.target.value as JobPostingSort)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {postings.length === 0 ? (
        <p className="py-10 text-center text-slate-500">このページには募集がありません。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {postings.map((posting) => (
            <li key={posting.id}>
              <JobPostingCard posting={posting} />
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={meta} basePath="/job_postings" query={query} />
    </section>
  );
}
