import type { ReactNode } from "react";

/** スキルのタグ表示 */
export function SkillTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm text-indigo-700">
      {children}
    </span>
  );
}
