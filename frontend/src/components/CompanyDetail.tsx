"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { useCompany } from "@/lib/companies";
import { isSafeUrl } from "@/lib/format";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";

/** 企業プロフィールの詳細。スカウトを受け取ったインターン生が送信元の企業を確認するための画面 */
export function CompanyDetail({ id }: { id: string }) {
  return <RequireUser>{() => <Detail id={id} />}</RequireUser>;
}

function Detail({ id }: { id: string }) {
  const { data, error, isLoading } = useCompany(id);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) {
    return <FormAlert message="この企業のプロフィールは見つかりませんでした。" />;
  }
  if (error || !data) return <FormAlert message="企業情報を読み込めませんでした。" />;

  const { company } = data;

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <header className="flex flex-col gap-1 border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-bold">{company.company_name}</h1>
        <p className="text-slate-600">担当: {company.contact_name}</p>
      </header>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[8rem_1fr]">
        <Item label="企業概要">
          {company.description ? (
            <p className="whitespace-pre-wrap leading-relaxed">{company.description}</p>
          ) : (
            <Empty />
          )}
        </Item>
        <Item label="Web サイト">
          {isSafeUrl(company.website) ? (
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="break-all text-indigo-600 hover:underline"
            >
              {company.website}
            </a>
          ) : (
            <Empty />
          )}
        </Item>
      </dl>

      <Link href="/messages" className="self-start text-sm text-indigo-600 hover:underline">
        ← メッセージ一覧へ戻る
      </Link>
    </article>
  );
}

function Item({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function Empty() {
  return <span className="text-slate-400">未入力</span>;
}
