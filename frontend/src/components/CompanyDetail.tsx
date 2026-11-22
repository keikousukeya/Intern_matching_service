"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { useCompany } from "@/lib/companies";
import { isSafeUrl } from "@/lib/format";
import { useCompanyJobPostings } from "@/lib/jobPostings";
import { FormAlert } from "./FormAlert";
import { JobPostingCard } from "./JobPostingCard";
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

      <CompanyJobPostings companyId={id} />

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link href="/messages" className="text-indigo-600 hover:underline">
          ← メッセージ一覧へ戻る
        </Link>
        <Link href="/job_postings" className="text-indigo-600 hover:underline">
          ← 募集一覧へ戻る
        </Link>
      </div>
    </article>
  );
}

/** この企業の公開中で締切前の募集（インターン生が「どんな業務を経験できるか」を確認できるようにする） */
function CompanyJobPostings({ companyId }: { companyId: string }) {
  const { data, error } = useCompanyJobPostings(companyId);

  return (
    <section className="flex flex-col gap-3 border-t border-slate-100 pt-5">
      <h2 className="font-bold">
        募集中のインターン
        {data && <span className="ml-2 text-sm font-normal text-slate-500">{data.meta.total_count}件</span>}
      </h2>
      {error ? (
        <FormAlert message="募集を読み込めませんでした。" />
      ) : !data ? (
        <Loading />
      ) : data.job_postings.length === 0 ? (
        <p className="text-sm text-slate-500">現在、公開中の募集はありません。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.job_postings.map((posting) => (
            <li key={posting.id}>
              <JobPostingCard posting={posting} showCompany={false} />
            </li>
          ))}
        </ul>
      )}
    </section>
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
