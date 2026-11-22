"use client";

import Link from "next/link";
import { useAuthorArticles } from "@/lib/articles";
import type { User } from "@/lib/auth";
import { ArticleCard } from "./ArticleCard";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";

/**
 * ある人（インターン生・企業）が書いた公開中の記事。詳細画面に並べる。
 * 企業はインターン生の技術力を、インターン生は企業の技術への取り組みを知る材料にできる。
 */
export function AuthorArticles({ authorId, viewer }: { authorId: string | number; viewer: User }) {
  const { data, error } = useAuthorArticles(authorId);

  return (
    <section className="flex flex-col gap-3 border-t border-slate-100 pt-5">
      <h2 className="font-bold">
        技術ブログ
        {data && <span className="ml-2 text-sm font-normal text-slate-500">{data.meta.total_count}件</span>}
      </h2>
      {error ? (
        <FormAlert message="記事を読み込めませんでした。" />
      ) : !data ? (
        <Loading />
      ) : data.articles.length === 0 ? (
        <p className="text-sm text-slate-500">まだ公開中の記事はありません。</p>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {data.articles.slice(0, 4).map((article) => (
              <li key={article.id}>
                <ArticleCard article={article} viewer={viewer} showAuthor={false} />
              </li>
            ))}
          </ul>
          {data.meta.total_count > 4 && (
            <Link href={`/articles?author_id=${authorId}`} className="self-start text-sm text-indigo-600 hover:underline">
              すべての記事を見る（{data.meta.total_count}件）→
            </Link>
          )}
        </>
      )}
    </section>
  );
}
