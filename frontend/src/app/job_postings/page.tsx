import type { Metadata } from "next";
import { Suspense } from "react";
import { JobPostingList } from "@/components/JobPostingList";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "募集を探す | Intern Scout" };

export default function JobPostingsPage() {
  return (
    <PageContainer title="募集を探す" description="業務内容・期間・報酬・働き方を比べて、気になるインターンの募集を探せます。">
      {/* 検索条件・ページ番号は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <JobPostingList />
      </Suspense>
    </PageContainer>
  );
}
