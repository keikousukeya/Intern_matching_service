import type { Metadata } from "next";
import { ArticleEditor } from "@/components/ArticleEditor";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "記事を書く | Intern Scout" };

export default function NewArticlePage() {
  return (
    <PageContainer title="記事を書く" width="narrow">
      <ArticleEditor />
    </PageContainer>
  );
}
