# Intern Scout

インターン生と企業をつなぐスカウトサービスのプロトタイプです。
インターン生がプロフィールを登録し、企業がインターン生を探して直接メッセージ（スカウト）を送れます。

## 技術構成

| 領域 | 採用技術 |
|---|---|
| バックエンド | Ruby 3.4 / Rails 8.1（API モード） |
| フロントエンド | Next.js 16（App Router）/ TypeScript / Tailwind CSS |
| データベース | PostgreSQL 17 |
| 認証 | セッション Cookie（HttpOnly・SameSite=Lax） |
| テスト | RSpec / FactoryBot |
| CI | GitHub Actions（Brakeman・bundler-audit・RuboCop・RSpec・ESLint・型チェック・ビルド） |
| 開発環境 | Docker Compose |

```
ブラウザ ──▶ Next.js (localhost:3000)
               │  /api/* を rewrites で中継
               ▼
            Rails API (backend:3000 / ホストからは localhost:3001)
               │
               ▼
            PostgreSQL (db:5432)
```

## セットアップ

前提: Docker Desktop（Docker Compose v2 以上）がインストール・起動済みであること。
Ruby や Node.js をローカルにインストールする必要はありません。

```bash
# 1. ビルドして起動（初回は DB 作成も自動で行われる）
docker compose up -d --build

# 2. 動作確認
#    フロントエンド: http://localhost:3000
#    API 疎通確認:   http://localhost:3000/api/health  → {"status":"ok", ...}
```

停止は `docker compose down`、DB も含めて初期化する場合は `docker compose down -v` を実行します。

### シードデータ（開発用のダミーデータ）

```bash
docker compose exec backend bin/rails db:seed
```

インターン生 30 人・企業 5 社・スキル 35 種類を登録します。何度実行しても同じ内容になります（企業名・大学名はすべて架空のものです）。

| アカウント | メールアドレス | パスワード |
|---|---|---|
| インターン生 | `student1@example.com` 〜 `student30@example.com` | `password123` |
| 企業 | `company1@example.com` 〜 `company5@example.com` | `password123` |

### よく使うコマンド

```bash
# Rails コンソール / マイグレーション / シード
docker compose exec backend bin/rails console
docker compose exec backend bin/rails db:migrate
docker compose exec backend bin/rails db:seed

# テスト・lint（バックエンド）
docker compose exec -e RAILS_ENV=test backend bin/rails db:prepare
docker compose exec -e RAILS_ENV=test backend bundle exec rspec
docker compose exec backend bin/rubocop

# lint・型チェック（フロントエンド）
docker compose exec frontend npm run lint
docker compose exec frontend npm run typecheck

# gem / npm パッケージを追加したとき
docker compose exec backend bundle install
docker compose exec frontend npm install
```

## ディレクトリ構成

```
.
├── backend/            Rails API（/api 配下に JSON API を実装）
├── frontend/           Next.js（App Router）
├── compose.yaml        開発環境の一括起動
└── .github/workflows/  CI
```

## 設計方針

### 同一オリジン化によるセッション Cookie 認証

ブラウザは Next.js（localhost:3000）の `/api/*` にだけアクセスし、Next.js の rewrites が Rails へ中継します。
ブラウザから見ると API が同一オリジンになるため、次の利点があります。

- CORS 設定が不要で、Cookie を `SameSite=Lax` のまま送れる
- セッション Cookie を `HttpOnly` にでき、JavaScript からトークンを読めない（XSS によるトークン窃取を防ぐ）
- JWT をフロント側で保存・更新する仕組みが不要

### 認証とセキュリティ

| 対策 | 内容 |
|---|---|
| パスワード | `has_secure_password`（bcrypt）でハッシュ化して保存。8〜72文字 |
| セッション固定攻撃 | ログイン・登録のたびに `reset_session` でセッション ID を作り直す |
| CSRF | ① Cookie を `SameSite=Lax` にし、他サイトからの POST に Cookie が付かないようにする ② 状態を変更するリクエスト（POST/PATCH/DELETE）は `Origin` ヘッダーが許可したオリジンと一致するものだけ受け付ける（`OriginVerification`） |
| 総当たり攻撃 | ログイン API に Rails 8 の `rate_limit` を設定（同一 IP から 3 分間に 10 回まで） |
| アカウントの列挙 | ログイン失敗時は「メールアドレスかパスワードのどちらが誤りか」を伝えない |
| メールアドレス | 小文字に正規化して保存し、大文字小文字違いの重複登録を防ぐ |

| 認可 | ロールの確認（学生一覧・詳細は企業のみ）は Rails 側で必ず行う。画面側の出し分けは表示のためだけに使う |
| プロフィールの公開範囲 | インターン生のプロフィールは企業ユーザーにのみ返す。JSON はシリアライザーで返す項目を決めており、メールアドレスは含めない |
| 他人のデータの書き換え | 自分のプロフィールの API（`/api/me/profile`）は ID を受け取らず、ログイン中のユーザーから対象を決める |
| URL による XSS | プロフィールの URL は `http` / `https` のみ受け付ける（`javascript:` URL を防ぐ）。画面側でもリンクにする前に確認する |

許可するオリジンは環境変数 `FRONTEND_ORIGINS`（カンマ区切り、既定値 `http://localhost:3000`）で設定します。

### プロフィールの設計

- **登録時の入力は最小限**: 新規登録はメール・パスワード・区分だけにし、登録後にプロフィール入力画面へ案内する。途中で離脱されにくくするため。
- **企業が重視する項目で比べられる一覧**: 一覧カードにはスキル・希望期間・志望職種を表示し、企業が一目で比べられるようにした。
- **スキルは候補つき自由入力**: スキルはマスタ（`skills`）と中間テーブル（`student_skills`）で管理する。入力中は既存のスキルを候補に出し、候補に無いスキルもそのまま登録できる。
  `React` と `react` は同じスキルとして扱い（小文字化した値に一意インデックス）、表記ゆれで検索（F-04）しにくくなるのを防ぐ。
- **N+1 の回避とページネーション**: 一覧は `includes(:skills)` でスキルをまとめて読み込み、20 件ずつ返す。

## API 一覧

| メソッド | パス | 内容 | 認証 |
|---|---|---|---|
| POST | `/api/registration` | 新規登録（`role`: `student` / `company`）。成功するとログイン状態になる | 不要 |
| POST | `/api/session` | ログイン | 不要 |
| DELETE | `/api/session` | ログアウト | 不要 |
| GET | `/api/me` | ログイン中のユーザー（未ログインなら 401） | 必要 |
| GET | `/api/me/profile` | 自分のプロフィール（ロールに応じて学生 / 企業。未登録なら `null`） | 必要 |
| PUT | `/api/me/profile` | 自分のプロフィールを作成・更新 | 必要 |
| GET | `/api/students?page=1` | インターン生一覧（新着順・20 件ずつ） | 企業のみ |
| GET | `/api/students/:id` | インターン生の詳細（`:id` はユーザー ID） | 企業のみ |
| GET | `/api/skills?q=…` | スキル入力の候補（`q` が無ければよく使われている順） | 必要 |
| GET | `/api/health` | 疎通確認 | 不要 |

エラー時は `{ "message": "…", "errors": { "項目名": ["日本語のメッセージ"] } }` の形で返します。
未ログインは 401、ロールが違う場合は 403、存在しないデータは 404 を返します。

<!-- 以下は実装の進行に合わせて追記する -->

## 実装状況

| ID | 機能 | 状態 |
|---|---|---|
| F-01 | インターン生登録・プロフィール | 実装済み（登録・ログイン・ログアウト、プロフィール編集、企業向けの一覧・詳細） |
| F-02 | 企業からのメッセージ送信 | 企業プロフィールは実装済み。メッセージは未着手 |
| F-03 | 募集掲載 | 未着手 |
| F-04 | インターン生検索 | 未着手 |
| F-05 | 予定調整 | 未着手 |
| F-06 | グループチャット | 未着手 |

## 未実装事項と今後の展望

（実装の進行に合わせて記載）
