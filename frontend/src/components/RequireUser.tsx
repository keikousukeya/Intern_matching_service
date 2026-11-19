"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ROLE_LABELS, useCurrentUser, type Role, type User } from "@/lib/auth";
import { Loading } from "./Loading";

type Props = {
  /** 指定したロールのユーザーだけに表示する */
  role?: Role;
  children: (user: User) => ReactNode;
};

/**
 * ログインが必要な画面の中身を囲む。未ログインならログイン画面へ移動し、ロールが違えばその旨を表示する。
 * 画面の出し分けのためのもので、実際の権限チェックは Rails 側で必ず行っている。
 */
export function RequireUser({ role, children }: Props) {
  const router = useRouter();
  const { user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) return <Loading />;

  if (role && user.role !== role) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        <p>このページは{ROLE_LABELS[role]}アカウントでのみ利用できます。</p>
        <Link href="/" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return children(user);
}
