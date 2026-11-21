"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  EMPTY_SEARCH,
  hasStudentFilters,
  parseStudentSearch,
  studentSearchQuery,
  useStudents,
  type StudentSearchParams,
  type StudentSort,
} from "@/lib/students";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";
import { StudentCard } from "./StudentCard";
import { StudentSearchForm } from "./StudentSearchForm";

const SORT_LABELS: Record<StudentSort, string> = { newest: "新着順", updated: "更新順" };

/** 企業向け: インターン生の検索と一覧（検索条件・並び順・ページは URL のクエリで持つ） */
export function StudentList() {
  return <RequireUser role="company">{() => <Search />}</RequireUser>;
}

function Search() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = parseStudentSearch(searchParams);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const query = studentSearchQuery(search);

  // 条件を変えたら 1 ページ目から表示する
  function navigate(next: StudentSearchParams) {
    const nextQuery = studentSearchQuery(next).toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* URL が変わったら（戻る・クリアなど）フォームを作り直して入力欄を URL の条件にそろえる */}
      <StudentSearchForm
        key={query.toString()}
        initial={search}
        onSearch={navigate}
        onClear={() => navigate({ ...EMPTY_SEARCH, sort: search.sort })}
      />
      <Results
        search={search}
        page={page}
        query={query}
        onSortChange={(sort) => navigate({ ...search, sort })}
      />
    </div>
  );
}

type ResultsProps = {
  search: StudentSearchParams;
  page: number;
  query: URLSearchParams;
  onSortChange: (sort: StudentSort) => void;
};

function Results({ search, page, query, onSortChange }: ResultsProps) {
  const { data, error, isLoading } = useStudents(search, page);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="インターン生の一覧を読み込めませんでした。" />;

  const { students, meta } = data;
  const filtered = hasStudentFilters(search);

  if (meta.total_count === 0) {
    return (
      <p className="py-10 text-center text-slate-500">
        {filtered
          ? "条件に合うインターン生が見つかりませんでした。条件を減らして検索してみてください。"
          : "まだプロフィールを登録したインターン生がいません。"}
      </p>
    );
  }

  return (
    <section aria-label="検索結果" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600" role="status">
          {filtered ? "条件に合うインターン生" : "インターン生"}
          <span className="mx-1 text-base font-bold text-slate-800">{meta.total_count}</span>人
        </p>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          並び順
          <select
            value={search.sort}
            onChange={(event) => onSortChange(event.target.value as StudentSort)}
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
      {students.length === 0 ? (
        <p className="py-10 text-center text-slate-500">このページにはインターン生がいません。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {students.map((student) => (
            <li key={student.user_id}>
              <StudentCard student={student} />
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={meta} basePath="/students" query={query} />
    </section>
  );
}
