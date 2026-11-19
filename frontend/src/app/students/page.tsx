import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";
import { StudentList } from "@/components/StudentList";

export const metadata: Metadata = { title: "インターン生を探す | Intern Scout" };

export default function StudentsPage() {
  return (
    <PageContainer title="インターン生を探す" description="スキル・希望期間・志望職種を比べて、気になるインターン生のプロフィールを確認できます。">
      {/* ページ番号（?page=）は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <StudentList />
      </Suspense>
    </PageContainer>
  );
}
