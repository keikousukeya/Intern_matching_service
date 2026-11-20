import type { Metadata } from "next";
import { Suspense } from "react";
import { ConversationList } from "@/components/ConversationList";
import { Loading } from "@/components/Loading";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "メッセージ | Intern Scout" };

export default function MessagesPage() {
  return (
    <PageContainer title="メッセージ" description="企業とインターン生のやり取りの一覧です。新しいメッセージがある順に表示します。" width="narrow">
      {/* ページ番号（?page=）は URL から読むため、その部分だけ Suspense で囲む */}
      <Suspense fallback={<Loading />}>
        <ConversationList />
      </Suspense>
    </PageContainer>
  );
}
