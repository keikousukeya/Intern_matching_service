import type { Metadata } from "next";
import { Suspense } from "react";
import { ArticleEditor } from "@/components/ArticleEditor";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "記事を編集 | Intern Scout" };

export default function EditArticlePage({ params }: PageProps<"/mypage/articles/[id]/edit">) {
  return (
    <PageContainer title="記事を編集" width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <ArticleEditor id={id} />)}</Suspense>
    </PageContainer>
  );
}
