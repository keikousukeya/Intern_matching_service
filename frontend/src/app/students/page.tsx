import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";
import { StudentList } from "@/components/StudentList";

export const metadata: Metadata = { title: "インターン生を探す | Intern Scout" };

export default function StudentsPage() {
  return (
    <PageContainer title="インターン生を探す" description="キーワード・スキル・大学・卒業予定年・志望職種で絞り込んで、気になるインターン生のプロフィールを確認できます。">
      {/* 検索条件・ページ番号は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <StudentList />
      </Suspense>
    </PageContainer>
  );
}
