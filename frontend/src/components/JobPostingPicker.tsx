"use client";

import Link from "next/link";
import { useMyJobPostings } from "@/lib/jobPostings";

type Props = {
  value: number | null;
  onChange: (id: number | null) => void;
  /** 同じ画面に複数置いたときに id が重ならないようにする */
  id?: string;
};

/**
 * 企業向け: スカウトに紐づける募集の選択（任意）。
 * 選べるのは自社の公開中で締切前の募集だけ（サーバー側でも同じ条件で検証している）。
 * 選択肢は更新日時の新しい 20 件から選ぶ（プロトタイプのため、それより古い募集は選択肢に出ない）。
 */
export function JobPostingPicker({ value, onChange, id = "scout-job-posting" }: Props) {
  const { data } = useMyJobPostings(1);
  const options = (data?.job_postings ?? []).filter((posting) => posting.status === "published" && !posting.closed);

  if (!data) return null;

  if (options.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        公開中の募集を
        <Link href="/mypage/job_postings" className="mx-1 text-indigo-600 hover:underline">
          募集管理
        </Link>
        で作成すると、スカウトに紐づけて送れます。
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
      <label htmlFor={id} className="shrink-0 text-sm text-slate-600">
        紐づける募集
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
      >
        <option value="">紐づけない</option>
        {options.map((posting) => (
          <option key={posting.id} value={posting.id}>
            {posting.title}
          </option>
        ))}
      </select>
    </div>
  );
}
