import Link from "next/link";
import type { ArticleSummary } from "@/lib/articles";
import type { User } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { ArticleStatusBadge, AuthorName, AuthorRoleBadge } from "./ArticleParts";
import { SkillTag } from "./SkillTag";

/** 記事一覧の 1 件。showAuthor が false なら書いた人を出さない（その人の詳細画面に並べるとき） */
export function ArticleCard({
  article,
  viewer,
  showAuthor = true,
}: {
  article: ArticleSummary;
  viewer: User;
  showAuthor?: boolean;
}) {
  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow">
      <div className="flex flex-col gap-1">
        {showAuthor && (
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <AuthorRoleBadge author={article.author} />
            <AuthorName author={article.author} viewer={viewer} />
          </div>
        )}
        <h2 className="text-lg font-bold">
          {/* カード全体をクリックできるようにする（書いた人のリンクは z-10 で上に出す） */}
          <Link href={`/articles/${article.id}`} className="after:absolute after:inset-0 hover:text-indigo-600">
            {article.title}
          </Link>
        </h2>
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <ArticleStatusBadge status={article.status} />
          {article.published_at && <time dateTime={article.published_at}>{formatDateTime(article.published_at)}</time>}
        </p>
      </div>

      {article.excerpt && <p className="line-clamp-3 text-sm text-slate-600">{article.excerpt}</p>}

      {article.skills.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1.5" aria-label="タグ">
          {article.skills.map((skill) => (
            <li key={skill}>
              <SkillTag>{skill}</SkillTag>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
