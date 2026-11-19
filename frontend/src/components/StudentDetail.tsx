"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { formatPeriod, isSafeUrl } from "@/lib/format";
import { useStudent } from "@/lib/students";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { RequireUser } from "./RequireUser";
import { SkillTag } from "./SkillTag";

/** 企業向け: インターン生プロフィールの詳細 */
export function StudentDetail({ id }: { id: string }) {
  return <RequireUser role="company">{() => <Detail id={id} />}</RequireUser>;
}

function Detail({ id }: { id: string }) {
  const { data, error, isLoading } = useStudent(id);

  if (isLoading) return <Loading />;
  if (error instanceof ApiError && error.status === 404) {
    return <FormAlert message="このインターン生のプロフィールは見つかりませんでした。" />;
  }
  if (error || !data) return <FormAlert message="プロフィールを読み込めませんでした。" />;

  const { student } = data;
  const period = formatPeriod(student.available_from, student.available_to);
  const links = [
    { label: "ポートフォリオ", url: student.portfolio_url },
    { label: "GitHub", url: student.github_url },
  ].filter((link): link is { label: string; url: string } => isSafeUrl(link.url));

  return (
    <article className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
      <header className="flex flex-col gap-1 border-b border-slate-100 pb-5">
        <h1 className="text-2xl font-bold">{student.name}</h1>
        <p className="text-slate-600">
          {student.university}
          {student.faculty && ` ${student.faculty}`}・{student.graduation_year}年卒業予定
        </p>
      </header>

      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-[8rem_1fr]">
        <Item label="志望職種">{student.desired_role ?? <Empty />}</Item>
        <Item label="希望期間">{period ?? <Empty />}</Item>
        <Item label="スキル">
          {student.skills.length > 0 ? (
            <ul className="flex flex-wrap gap-1.5">
              {student.skills.map((skill) => (
                <li key={skill}>
                  <SkillTag>{skill}</SkillTag>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Item>
        <Item label="自己紹介">
          {/* React が文字列をエスケープするため、入力内容をそのまま表示しても HTML として解釈されない */}
          {student.bio ? <p className="whitespace-pre-wrap leading-relaxed">{student.bio}</p> : <Empty />}
        </Item>
        <Item label="リンク">
          {links.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {links.map((link) => (
                <li key={link.label}>
                  <span className="mr-2 text-sm text-slate-500">{link.label}</span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="break-all text-indigo-600 hover:underline"
                  >
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <Empty />
          )}
        </Item>
      </dl>

      <Link href="/students" className="self-start text-sm text-indigo-600 hover:underline">
        ← インターン生一覧へ戻る
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
