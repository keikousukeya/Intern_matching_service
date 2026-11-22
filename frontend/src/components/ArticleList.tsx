"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  articleSearchQuery,
  EMPTY_ARTICLE_SEARCH,
  parseArticleSearch,
  useArticles,
  type ArticleSearchParams,
} from "@/lib/articles";
import type { User } from "@/lib/auth";
import { ArticleCard } from "./ArticleCard";
import { ArticleSearchForm } from "./ArticleSearchForm";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";

/** 技術ブログの記事一覧と検索（ログインユーザー全員。検索条件・ページは URL のクエリで持つ） */
export function ArticleList() {
  return <RequireUser>{(user) => <Search user={user} />}</RequireUser>;
}

function Search({ user }: { user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = parseArticleSearch(searchParams);
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const query = articleSearchQuery(search);

  // 条件を変えたら 1 ページ目から表示する
  function navigate(next: ArticleSearchParams) {
    const nextQuery = articleSearchQuery(next).toString();
    router.push(nextQuery ? `${pathname}?${nextQuery}` : pathname);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href="/mypage/articles"
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-slate-700 hover:bg-slate-50"
        >
          自分の記事
        </Link>
        <Link
          href="/mypage/articles/new"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-700"
        >
          ＋ 記事を書く
        </Link>
      </div>
      {/* URL が変わったら（戻る・クリアなど）フォームを作り直して入力欄を URL の条件にそろえる */}
      <ArticleSearchForm
        key={query.toString()}
        initial={search}
        onSearch={navigate}
        onClear={() => navigate(EMPTY_ARTICLE_SEARCH)}
      />
      {search.authorId && (
        <p className="flex flex-wrap items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/50 px-4 py-2 text-sm text-slate-700">
          特定の人が書いた記事に絞り込んでいます。
          <button
            type="button"
            onClick={() => navigate({ ...search, authorId: "" })}
            className="text-indigo-600 hover:underline"
          >
            絞り込みを解除
          </button>
        </p>
      )}
      <Results search={search} page={page} query={query} user={user} />
    </div>
  );
}

function Results({
  search,
  page,
  query,
  user,
}: {
  search: ArticleSearchParams;
  page: number;
  query: URLSearchParams;
  user: User;
}) {
  const { data, error, isLoading } = useArticles(search, page);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="記事の一覧を読み込めませんでした。" />;

  const { articles, meta } = data;
  const filtered = query.toString() !== "";

  if (meta.total_count === 0) {
    return (
      <p className="py-10 text-center text-slate-500">
        {filtered
          ? "条件に合う記事が見つかりませんでした。条件を減らして検索してみてください。"
          : "まだ公開中の記事はありません。最初の記事を書いてみませんか？"}
      </p>
    );
  }

  return (
    <section aria-label="検索結果" className="flex flex-col gap-4">
      <p className="text-sm text-slate-600" role="status">
        {filtered ? "条件に合う記事" : "公開中の記事"}
        <span className="mx-1 text-base font-bold text-slate-800">{meta.total_count}</span>件（新着順）
      </p>
      {articles.length === 0 ? (
        <p className="py-10 text-center text-slate-500">このページには記事がありません。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} viewer={user} />
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={meta} basePath="/articles" query={query} />
    </section>
  );
}
