import Link from "next/link";
import { formatPeriod } from "@/lib/format";
import type { StudentProfile } from "@/lib/profile";
import { SkillTag } from "./SkillTag";

/** インターン生一覧の 1 件。企業が「スキル・期間・志望職種」を一目で比べられるようにする */
export function StudentCard({
  student,
  headingLevel = "h2",
}: {
  student: StudentProfile;
  /** 氏名の見出しレベル（見出しの下に並べるときは h3） */
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const period = formatPeriod(student.available_from, student.available_to);

  return (
    <article className="relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow">
      <div className="flex flex-col gap-1">
        <Heading className="text-lg font-bold">
          {/* カード全体をクリックできるようにする */}
          <Link href={`/students/${student.user_id}`} className="after:absolute after:inset-0 hover:text-indigo-600">
            {student.name}
          </Link>
        </Heading>
        <p className="text-sm text-slate-600">
          {student.university}
          {student.faculty && ` ${student.faculty}`}・{student.graduation_year}年卒業予定
        </p>
      </div>

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="text-slate-500">志望職種</dt>
        <dd>{student.desired_role ?? "未入力"}</dd>
        <dt className="text-slate-500">希望期間</dt>
        <dd>{period ?? "未入力"}</dd>
      </dl>

      {student.skills.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="スキル">
          {student.skills.map((skill) => (
            <li key={skill}>
              <SkillTag>{skill}</SkillTag>
            </li>
          ))}
        </ul>
      )}

      {student.bio && <p className="line-clamp-2 text-sm text-slate-600">{student.bio}</p>}
    </article>
  );
}
