import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { MyArticleList } from "@/components/MyArticleList";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "記事管理 | Intern Scout" };

export default function MyArticlesPage() {
  return (
    <PageContainer title="記事管理" description="自分の記事の作成・編集・公開／下書きの切り替え・削除ができます。">
      {/* ページ番号（?page=）は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <MyArticleList />
      </Suspense>
    </PageContainer>
  );
}
