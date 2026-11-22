import type { Metadata } from "next";
import { Suspense } from "react";
import { JobPostingDetail } from "@/components/JobPostingDetail";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "募集の詳細 | Intern Scout" };

export default function JobPostingPage({ params }: PageProps<"/job_postings/[id]">) {
  return (
    <PageContainer width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <JobPostingDetail id={id} />)}</Suspense>
    </PageContainer>
  );
}
