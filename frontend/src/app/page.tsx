import { Welcome } from "@/components/Welcome";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8 sm:py-12">
      {/* 未ログインなら紹介、ログイン後はホーム（おすすめ）。表示の切り替えは Welcome で行う */}
      <Welcome />
    </main>
  );
}
