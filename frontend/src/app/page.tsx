import { Welcome } from "@/components/Welcome";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-12 sm:py-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
          インターン生と企業を、
          <br className="sm:hidden" />
          スカウトでつなぐ。
        </h1>
        <p className="max-w-2xl text-slate-600">
          インターン生はプロフィールを登録して、企業からのスカウトを受け取れます。
          企業はスキルや稼働できる期間からインターン生を探し、直接メッセージを送れます。
        </p>
      </div>
      <Welcome />
    </main>
  );
}
