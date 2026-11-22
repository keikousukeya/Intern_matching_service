import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { isSafeUrl } from "@/lib/format";

/*
 * 記事本文（Markdown）の表示。
 * XSS 対策:
 *   - skipHtml で Markdown 中の生の HTML（<script> など）を描画しない
 *   - react-markdown は文字列を React の要素として組み立てるため、dangerouslySetInnerHTML を使わない
 *   - リンクは http / https のものだけを <a> にする（javascript: などは文字だけ表示する）
 *   - 画像は外部のサーバーへ閲覧者の情報が送られないよう読み込まず、リンクとして表示する
 */
const COMPONENTS: Components = {
  h1: ({ children }) => <h2 className="mt-8 mb-3 border-b border-slate-200 pb-1 text-2xl font-bold">{children}</h2>,
  h2: ({ children }) => <h2 className="mt-8 mb-3 border-b border-slate-200 pb-1 text-xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-6 mb-2 text-lg font-bold">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-5 mb-2 font-bold">{children}</h4>,
  h5: ({ children }) => <h5 className="mt-4 mb-2 font-bold">{children}</h5>,
  h6: ({ children }) => <h6 className="mt-4 mb-2 font-bold text-slate-600">{children}</h6>,
  p: ({ children }) => <p className="my-4 leading-relaxed">{children}</p>,
  ul: ({ children, className }) => (
    // タスクリスト（- [ ]）は記号を出さない
    <ul className={`my-4 pl-6 ${className?.includes("contains-task-list") ? "list-none pl-1" : "list-disc"}`}>{children}</ul>
  ),
  ol: ({ children }) => <ol className="my-4 list-decimal pl-6">{children}</ol>,
  li: ({ children }) => <li className="my-1 leading-relaxed">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-slate-300 pl-4 text-slate-600">{children}</blockquote>
  ),
  hr: () => <hr className="my-8 border-slate-200" />,
  a: ({ href, children }) =>
    isSafeUrl(href ?? null) ? (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-indigo-600 underline hover:text-indigo-800">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  img: ({ src, alt }) =>
    typeof src === "string" && isSafeUrl(src) ? (
      <a href={src} target="_blank" rel="noopener noreferrer nofollow" className="text-indigo-600 underline hover:text-indigo-800">
        🖼 {alt || "画像"}
      </a>
    ) : (
      <span>{alt}</span>
    ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-slate-900 p-4 text-sm leading-relaxed text-slate-100 [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-inherit">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-rose-700">{children}</code>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="border border-slate-300 bg-slate-50 px-3 py-2 text-left font-bold">{children}</th>,
  td: ({ children }) => <td className="border border-slate-300 px-3 py-2">{children}</td>,
  input: ({ checked }) => (
    // タスクリストのチェックボックス（表示のみ）
    <input type="checkbox" checked={checked ?? false} disabled readOnly className="mr-2 accent-indigo-600" />
  ),
};

export function MarkdownBody({ children }: { children: string }) {
  return (
    <div className="min-w-0 break-words text-slate-800">
      <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
