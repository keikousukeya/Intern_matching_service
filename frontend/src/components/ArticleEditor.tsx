"use client";

import Link from "next/link";
import { ApiError } from "@/lib/api";
import { useArticle, useArticleActions, type ArticleInput } from "@/lib/articles";
import type { User } from "@/lib/auth";
import { ArticleForm } from "./ArticleForm";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";

/** 記事の作成（id なし）・編集（id あり）画面。インターン生・企業のどちらも使える。保存したら記事の詳細へ移動する（移動はフォームが行う） */
export function ArticleEditor({ id }: { id?: string }) {
  return (
    <RequireUser>
      {(user) => (!user.has_profile ? <ProfileRequired /> : id ? <Edit id={id} user={user} /> : <Create />)}
    </RequireUser>
  );
}

function Create() {
  const { create } = useArticleActions();

  async function handleSave(input: ArticleInput) {
    const article = await create(input);
    return `/articles/${article.id}`;
  }

  return <ArticleForm article={null} onSave={handleSave} />;
}

function Edit({ id, user }: { id: string; user: User }) {
  const { data, error, isLoading } = useArticle(id);
  const { update } = useArticleActions();

  if (isLoading) return <Loading />;
  // 他人の記事は編集できない（公開中の記事は取得できてしまうため、ここでも書いた人を確認する。実際の権限は Rails 側で確認している）
  if ((error instanceof ApiError && error.status === 404) || (data && data.article.author.user_id !== user.id)) {
    return <FormAlert message="この記事は見つかりませんでした。" />;
  }
  if (error || !data) return <FormAlert message="記事を読み込めませんでした。" />;

  async function handleSave(input: ArticleInput) {
    await update(Number(id), input);
    return `/articles/${id}`;
  }

  return <ArticleForm article={data.article} onSave={handleSave} />;
}

function ProfileRequired() {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      記事の書き手として名前を表示するため、先に
      <Link href="/mypage/profile" className="mx-1 text-indigo-600 hover:underline">
        プロフィール
      </Link>
      を登録してください。
    </p>
  );
}
