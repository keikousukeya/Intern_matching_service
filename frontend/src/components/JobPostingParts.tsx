import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  STATUS_LABELS,
  WORK_STYLE_LABELS,
  type JobPosting,
  type JobPostingSummary,
  type WorkStyle,
} from "@/lib/jobPostings";

// 募集の画面で共通に使う小さな部品

/** 勤務形態のラベル */
export function WorkStyleBadge({ workStyle }: { workStyle: WorkStyle }) {
  return (
    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      {WORK_STYLE_LABELS[workStyle]}
    </span>
  );
}

/** 公開状態・締切のラベル（公開中で締切前なら何も出さない。showPublished で「公開中」も出す） */
export function StatusBadge({
  posting,
  showPublished = false,
}: {
  posting: Pick<JobPosting, "status" | "closed">;
  showPublished?: boolean;
}) {
  if (posting.status === "draft") {
    return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">{STATUS_LABELS.draft}</span>;
  }
  if (posting.closed) {
    return <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">締切済み</span>;
  }
  if (!showPublished) return null;
  return <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">{STATUS_LABELS.published}</span>;
}

/** 締切の表示。締切なしなら「随時」 */
export function deadlineText(deadline: string | null): string {
  return deadline ? `${formatDate(deadline)}まで` : "随時（締切なし）";
}

/** メッセージに添えた募集のカード（スカウトの吹き出しの下に出す） */
export function JobPostingAttachment({ posting }: { posting: JobPostingSummary }) {
  return (
    <Link
      href={`/job_postings/${posting.id}`}
      className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 transition hover:border-indigo-300"
    >
      <span className="text-xs text-slate-500">紐づけられた募集</span>
      <span className="font-bold">{posting.title}</span>
      <span className="text-xs text-slate-500">
        {WORK_STYLE_LABELS[posting.work_style]}・{deadlineText(posting.deadline)}
        {posting.status === "draft" ? "（非公開）" : posting.closed ? "（締切済み）" : ""}
      </span>
    </Link>
  );
}
