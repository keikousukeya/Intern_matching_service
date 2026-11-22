"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useArticle } from "@/lib/articles";
import type { User } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { ArticleStatusBadge, AuthorName, AuthorRoleBadge } from "./ArticleParts";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { MarkdownBody } from "./MarkdownBody";
import { RequireUser } from "./RequireUser";
import { SkillTag } from "./SkillTag";

/** 記事の詳細。公開中の記事はログインユーザー全員、下書きは書いた本人だけが見られる */
export function ArticleDetail({ id }: { id: string }) {
  return <RequireUser>{(user) => <Detail id={id} user={user} />}</RequireUser>;
}

function Detail({ id, user }: { id: string; user: User }) {
  const { data, error, isLoading } = useArticle(id);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) {
    return <FormAlert message="この記事は見つかりませんでした（削除されたか、下書きに戻されています）。" />;
  }
  if (error || !data) return <FormAlert message="記事を読み込めませんでした。" />;

  const { article } = data;
  const isOwner = article.author.user_id === user.id;
  // 公開時にも更新日時は少し後になるため、1 分以上あとに更新したときだけ「更新」を出す
  const edited =
    article.published_at !== null && Date.parse(article.updated_at) - Date.parse(article.published_at) > 60_000;

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <header className="flex flex-col gap-3 border-b border-slate-100 pb-5">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <AuthorRoleBadge author={article.author} />
          <AuthorName author={article.author} viewer={user} className="font-medium" />
          <ArticleStatusBadge status={article.status} />
        </div>
        <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{article.title}</h1>
        <p className="text-xs text-slate-500">
          {article.published_at ? (
            <>
              <time dateTime={article.published_at}>{formatDateTime(article.published_at)}</time> に公開
              {edited && <>（{formatDateTime(article.updated_at)} に更新）</>}
            </>
          ) : (
            <>下書き（{formatDateTime(article.updated_at)} に保存）</>
          )}
        </p>
        {article.skills.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="タグ">
            {article.skills.map((skill) => (
              <li key={skill}>
                <Link href={`/articles?skills=${encodeURIComponent(skill)}`}>
                  <SkillTag>{skill}</SkillTag>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </header>

      <MarkdownBody>{article.body}</MarkdownBody>

      {isOwner && (
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <Link
            href={`/mypage/articles/${article.id}/edit`}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 text-center font-medium text-white hover:bg-indigo-700"
          >
            この記事を編集する
          </Link>
          <Link
            href="/mypage/articles"
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-center text-slate-700 hover:bg-slate-50"
          >
            記事管理へ戻る
          </Link>
        </div>
      )}

      <Link href="/articles" className="self-start text-sm text-indigo-600 hover:underline">
        ← 記事一覧へ戻る
      </Link>
    </article>
  );
}
