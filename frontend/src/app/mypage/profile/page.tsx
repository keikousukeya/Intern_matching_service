import type { Metadata } from "next";
import { PageContainer } from "@/components/PageContainer";
import { ProfileEditor } from "@/components/ProfileEditor";

export const metadata: Metadata = { title: "プロフィール編集 | Intern Scout" };

export default function MyProfilePage() {
  return (
    <PageContainer title="プロフィール編集" description="登録した内容は企業ユーザーにのみ公開されます。メールアドレスは公開されません。" width="narrow">
      <ProfileEditor />
    </PageContainer>
  );
}
