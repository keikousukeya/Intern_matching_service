"use client";

import useSWR from "swr";
import { apiFetch, fetcher } from "./api";
import type { Role } from "./auth";

/** インターン生プロフィール（企業にも公開される。メールアドレスは含まない） */
export type StudentProfile = {
  user_id: number;
  name: string;
  university: string;
  faculty: string | null;
  graduation_year: number;
  desired_role: string | null;
  bio: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  /** YYYY-MM-DD */
  available_from: string | null;
  available_to: string | null;
  skills: string[];
  created_at: string;
  updated_at: string;
};

export type CompanyProfile = {
  user_id: number;
  company_name: string;
  description: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

/** 保存時に送る値。日付や数値もフォームの文字列のまま送り、Rails 側で型変換する */
export type StudentProfileInput = {
  name: string;
  university: string;
  faculty: string;
  graduation_year: string;
  desired_role: string;
  bio: string;
  portfolio_url: string;
  github_url: string;
  available_from: string;
  available_to: string;
  skill_names: string[];
};

export type CompanyProfileInput = {
  company_name: string;
  description: string;
  website: string;
};

type ProfileByRole = { student: StudentProfile; company: CompanyProfile };
type InputByRole = { student: StudentProfileInput; company: CompanyProfileInput };

const MY_PROFILE_KEY = "/me/profile";

/** ログイン中のユーザー自身のプロフィール（未登録なら null） */
export function useMyProfile<R extends Role>(enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<{ profile: ProfileByRole[R] | null }>(
    enabled ? MY_PROFILE_KEY : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    profile: data?.profile ?? null,
    error,
    isLoading,
    /** 作成・更新して、キャッシュを保存後の内容に置き換える */
    async save(input: InputByRole[R]) {
      const result = await apiFetch<{ profile: ProfileByRole[R] }>(MY_PROFILE_KEY, {
        method: "PUT",
        body: { profile: input },
      });
      await mutate(result, { revalidate: false });
      return result.profile;
    },
  };
}

/** マイページの入力状況の 1 項目 */
export type ProfileCheckItem = { label: string; filled: boolean };

const present = (value: string | null) => Boolean(value?.trim());

/**
 * プロフィールの入力状況（マイページで未入力の項目を案内するため）。
 * 必須の項目は登録済みなら必ず埋まっているが、全体の割合が分かるよう一緒に数える。
 */
export function profileChecklist(
  ...args: [role: "student", profile: StudentProfile] | [role: "company", profile: CompanyProfile]
): ProfileCheckItem[] {
  if (args[0] === "student") {
    const p = args[1];
    return [
      { label: "氏名", filled: present(p.name) },
      { label: "大学", filled: present(p.university) },
      { label: "卒業予定年", filled: Boolean(p.graduation_year) },
      { label: "学部・学科", filled: present(p.faculty) },
      { label: "志望職種", filled: present(p.desired_role) },
      { label: "希望インターン期間", filled: present(p.available_from) || present(p.available_to) },
      { label: "スキル", filled: p.skills.length > 0 },
      { label: "自己紹介", filled: present(p.bio) },
      { label: "ポートフォリオ・GitHub", filled: present(p.portfolio_url) || present(p.github_url) },
    ];
  }
  const p = args[1];
  return [
    { label: "企業名", filled: present(p.company_name) },
    { label: "企業概要", filled: present(p.description) },
    { label: "Web サイト", filled: present(p.website) },
  ];
}
