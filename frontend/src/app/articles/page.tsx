import type { Metadata } from "next";
import { Suspense } from "react";
import { ArticleList } from "@/components/ArticleList";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "技術ブログ | Intern Scout" };

export default function ArticlesPage() {
  return (
    <PageContainer
      title="技術ブログ"
      description="インターン生と企業が、学んだことや技術への取り組みを発信しています。"
    >
      {/* 検索条件・ページ番号は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <ArticleList />
      </Suspense>
    </PageContainer>
  );
}
