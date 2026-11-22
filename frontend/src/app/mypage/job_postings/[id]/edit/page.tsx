import type { Metadata } from "next";
import { Suspense } from "react";
import { JobPostingEditor } from "@/components/JobPostingEditor";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "募集を編集 | Intern Scout" };

export default function EditJobPostingPage({ params }: PageProps<"/mypage/job_postings/[id]/edit">) {
  return (
    <PageContainer title="募集を編集" width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <JobPostingEditor id={id} />)}</Suspense>
    </PageContainer>
  );
}
