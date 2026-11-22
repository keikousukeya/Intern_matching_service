import type { Metadata } from "next";
import { JobPostingEditor } from "@/components/JobPostingEditor";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "募集を作成 | Intern Scout" };

export default function NewJobPostingPage() {
  return (
    <PageContainer title="募集を作成" width="narrow">
      <JobPostingEditor />
    </PageContainer>
  );
}
