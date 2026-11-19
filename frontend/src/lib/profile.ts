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
  contact_name: string;
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
  contact_name: string;
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
