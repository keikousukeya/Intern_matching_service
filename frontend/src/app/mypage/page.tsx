import type { Metadata } from "next";
import { MyPage } from "@/components/MyPage";
import { PageContainer } from "@/components/PageContainer";

export const metadata: Metadata = { title: "マイページ | Intern Scout" };

export default function MyPagePage() {
  return (
    <PageContainer title="マイページ" description="プロフィールの入力状況・未読のメッセージ・自分の記事や募集をまとめて確認できます。">
      <MyPage />
    </PageContainer>
  );
}
