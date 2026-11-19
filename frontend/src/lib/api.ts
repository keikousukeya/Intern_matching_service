// Rails API を呼び出す共通処理。
// /api/* は Next.js の rewrites で Rails に中継されるため、同一オリジンとしてアクセスできる。

/** Rails が返すバリデーションエラー: { 項目名: ["日本語のメッセージ", ...] } */
export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: FieldErrors = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function apiFetch<T>(path: string, { method = "GET", body }: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      // 同一オリジンなのでセッション Cookie は自動で送られる
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "サーバーに接続できませんでした。時間をおいて再度お試しください。");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      response.status,
      data.message ?? "エラーが発生しました。時間をおいて再度お試しください。",
      data.errors ?? {},
    );
  }
  return data as T;
}

/** SWR 用の取得関数（キーに API のパスを使う） */
export function fetcher<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}
