import type { Metadata } from "next";
import { Suspense } from "react";
import { ArticleDetail } from "@/components/ArticleDetail";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "記事 | Intern Scout" };

export default function ArticlePage({ params }: PageProps<"/articles/[id]">) {
  return (
    <PageContainer width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <ArticleDetail id={id} />)}</Suspense>
    </PageContainer>
  );
}
