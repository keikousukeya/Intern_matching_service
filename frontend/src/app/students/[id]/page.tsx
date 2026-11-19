import type { Metadata } from "next";
import { Suspense } from "react";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";
import { StudentDetail } from "@/components/StudentDetail";

export const metadata: Metadata = { title: "インターン生のプロフィール | Intern Scout" };

export default function StudentPage({ params }: PageProps<"/students/[id]">) {
  return (
    <PageContainer width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <StudentDetail id={id} />)}</Suspense>
    </PageContainer>
  );
}
