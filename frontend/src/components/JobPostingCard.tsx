import Link from "next/link";
import { formatPeriod } from "@/lib/format";
import type { JobPosting } from "@/lib/jobPostings";
import { deadlineText, StatusBadge, WorkStyleBadge } from "./JobPostingParts";
import { SkillTag } from "./SkillTag";

/** 募集一覧の 1 件。インターン生が「業務内容・期間・報酬・働き方」を一目で比べられるようにする */
export function JobPostingCard({
  posting,
  showCompany = true,
  headingLevel = "h2",
}: {
  posting: JobPosting;
  showCompany?: boolean;
  /** タイトルの見出しレベル（見出しの下に並べるときは h3） */
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const period = formatPeriod(posting.starts_on, posting.ends_on);

  return (
    <article className="relative flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <WorkStyleBadge workStyle={posting.work_style} />
          <StatusBadge posting={posting} />
        </div>
        <Heading className="text-lg font-bold">
          {/* カード全体をクリックできるようにする */}
          <Link href={`/job_postings/${posting.id}`} className="after:absolute after:inset-0 hover:text-indigo-600">
            {posting.title}
          </Link>
        </Heading>
        {showCompany && <p className="text-sm text-slate-600">{posting.company.company_name ?? "（企業名未登録）"}</p>}
      </div>

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-slate-500">期間</dt>
        <dd>{period ?? "応相談"}</dd>
        <dt className="text-slate-500">報酬</dt>
        <dd>{posting.compensation ?? "応相談"}</dd>
        <dt className="text-slate-500">締切</dt>
        <dd>{deadlineText(posting.deadline)}</dd>
      </dl>

      {posting.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="必要スキル">
          {posting.skills.map((skill) => (
            <li key={skill}>
              <SkillTag>{skill}</SkillTag>
            </li>
          ))}
        </ul>
      )}

      <p className="line-clamp-2 text-sm text-slate-600">{posting.description}</p>
    </article>
  );
}
