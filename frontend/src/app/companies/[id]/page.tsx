import type { Metadata } from "next";
import { Suspense } from "react";
import { CompanyDetail } from "@/components/CompanyDetail";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "企業情報 | Intern Scout" };

export default function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  return (
    <PageContainer width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <CompanyDetail id={id} />)}</Suspense>
    </PageContainer>
  );
}
