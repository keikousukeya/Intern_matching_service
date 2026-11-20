import type { Metadata } from "next";
import { Suspense } from "react";
import { ConversationView } from "@/components/ConversationView";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "メッセージ | Intern Scout" };

export default function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  return (
    <PageContainer width="narrow">
      {/* params はリクエスト時にしか決まらないため、読み取る部分だけ Suspense で囲む（Cache Components の要件） */}
      <Suspense fallback={<Loading />}>{params.then(({ id }) => <ConversationView id={id} />)}</Suspense>
    </PageContainer>
  );
}
