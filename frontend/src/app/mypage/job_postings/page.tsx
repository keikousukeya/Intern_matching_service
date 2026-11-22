import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { MyJobPostingList } from "@/components/MyJobPostingList";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "募集管理 | Intern Scout" };

export default function MyJobPostingsPage() {
  return (
    <PageContainer title="募集管理" description="自社の募集の作成・編集・公開／非公開の切り替え・削除ができます。">
      {/* ページ番号（?page=）は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <MyJobPostingList />
      </Suspense>
    </PageContainer>
  );
}
