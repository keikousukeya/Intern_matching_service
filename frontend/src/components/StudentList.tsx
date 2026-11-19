"use client";

import { useSearchParams } from "next/navigation";
import { useStudents } from "@/lib/students";
import { FormAlert } from "./FormAlert";
import { Loading } from "./Loading";
import { Pagination } from "./Pagination";
import { RequireUser } from "./RequireUser";
import { StudentCard } from "./StudentCard";

/** 企業向け: インターン生一覧（新着順・ページ送り） */
export function StudentList() {
  return <RequireUser role="company">{() => <List />}</RequireUser>;
}

function List() {
  const searchParams = useSearchParams();
  const page = Math.max(Number(searchParams.get("page")) || 1, 1);
  const { data, error, isLoading } = useStudents(page);

  if (isLoading) return <Loading />;
  if (error || !data) return <FormAlert message="インターン生の一覧を読み込めませんでした。" />;

  const { students, meta } = data;

  if (meta.total_count === 0) {
    return <p className="py-10 text-center text-slate-500">まだプロフィールを登録したインターン生がいません。</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">{meta.total_count}人のインターン生（新着順）</p>
      {students.length === 0 ? (
        <p className="py-10 text-center text-slate-500">このページにはインターン生がいません。</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {students.map((student) => (
            <li key={student.user_id}>
              <StudentCard student={student} />
            </li>
          ))}
        </ul>
      )}
      <Pagination meta={meta} basePath="/students" />
    </div>
  );
}
