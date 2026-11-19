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
docker compose exec frontend npx tsc --noEmit

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

<!-- 以下は実装の進行に合わせて追記する -->

## 実装状況

| ID | 機能 | 状態 |
|---|---|---|
| F-01 | インターン生登録・プロフィール | 未着手 |
| F-02 | 企業からのメッセージ送信 | 未着手 |
| F-03 | 募集掲載 | 未着手 |
| F-04 | インターン生検索 | 未着手 |
| F-05 | 予定調整 | 未着手 |
| F-06 | グループチャット | 未着手 |

## 未実装事項と今後の展望

（実装の進行に合わせて記載）
