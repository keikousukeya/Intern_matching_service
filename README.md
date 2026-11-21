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

インターン生 30 人・企業 5 社・スキル 35 種類と、企業 1・2 から学生 1〜3 へのメッセージ（返信あり・未読ありの会話 4 件）を登録します。何度実行しても同じ内容になります（企業名・大学名はすべて架空のものです）。
メッセージ機能を試すときは `student1@example.com`（未読のスカウトあり）と `company1@example.com` でログインしてください。

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
| メッセージの閲覧・送信 | 会話は必ず `current_user.conversations` から探すため、当事者以外は閲覧・送信・既読化ができない。存在の有無も分からないよう 403 ではなく 404 を返す |
| 新規スカウト | 新しい会話を始められるのは企業だけ（インターン生は届いた会話への返信のみ）。送信者として企業名を表示するため、企業プロフィールの登録を必須にする |

許可するオリジンは環境変数 `FRONTEND_ORIGINS`（カンマ区切り、既定値 `http://localhost:3000`）で設定します。

### プロフィールの設計

- **登録時の入力は最小限**: 新規登録はメール・パスワード・区分だけにし、登録後にプロフィール入力画面へ案内する。途中で離脱されにくくするため。
- **企業が重視する項目で比べられる一覧**: 一覧カードにはスキル・希望期間・志望職種を表示し、企業が一目で比べられるようにした。
- **スキルは候補つき自由入力**: スキルはマスタ（`skills`）と中間テーブル（`student_skills`）で管理する。入力中は既存のスキルを候補に出し、候補に無いスキルもそのまま登録できる。
  `React` と `react` は同じスキルとして扱い（小文字化した値に一意インデックス）、表記ゆれで検索（F-04）しにくくなるのを防ぐ。
- **N+1 の回避とページネーション**: 一覧は `includes(:skills)` でスキルをまとめて読み込み、20 件ずつ返す。

### インターン生検索の設計（F-04）

- **絞り込み条件**: キーワード・スキル・大学・卒業予定年・志望職種。指定した条件どうしは AND で組み合わせる。
  - キーワード: 氏名・大学・学部・志望職種・自己紹介・スキル名の部分一致。スペース（全角も可）で区切った複数の語は、すべてを含む人に絞り込む
  - スキル: 大文字小文字を区別しない完全一致。「すべて持つ（AND）」と「いずれかを持つ（OR）」を切り替えられる
  - 大学・志望職種は部分一致（「東都」で「東都大学」がヒット）、卒業予定年は完全一致
- **並び順**: 新着順（登録日時）／更新順（プロフィールの更新日時）。
- **重複と件数**: 結合（JOIN）ではなくサブクエリで絞り込むため、同じ人が重複して返らず、ページネーションの件数もそのまま正しく数えられる。
- **SQL インジェクション対策**: 値はプレースホルダーまたは Arel で渡す。`%` や `_` はワイルドカードとして扱わないようエスケープする。
- **重い検索の防止**: キーワードは 5 語・各 50 文字、スキルは 10 個まで。不正な値（数値でない年・未知の並び順など）は無視して既定値で検索する。
- **検索条件は URL に持つ**: `/students?q=…&skills=Ruby&skills=React&skill_match=any` のように URL に反映するため、再読み込み・ブラウザの戻る・URL の共有でも同じ結果になる。
  入力中は API を呼ばず、「検索する」を押したときに反映する。

### メッセージの設計

- **テーブル**: `conversations`（会話）・`conversation_participants`（参加者と既読位置）・`messages`。
  仕様書の `threads` は Ruby 組み込みの `Thread` クラスと名前が衝突するため `conversations` とした。
- **企業×インターン生で 1 スレッド**: `conversations` に `company_id`・`student_id` を持たせ、組み合わせに一意インデックスを張って DB でも保証する。
  同じインターン生に 2 通目を送ると既存の会話に追加される。同時に作成された場合も一意制約で検知し、先にできた会話を使う。
- **参加者テーブル方式**: 参加者を多対多にしておき、グループチャット（F-06）に拡張できるようにした。
- **未読／既読**: 参加者ごとに `last_read_at` を持ち、それより後に届いた相手のメッセージを未読とする。
  閲覧（GET）は副作用を持たせず、画面が `PUT /read` を呼んで既読にする。自分が送信したときは自分の既読位置も進める。
- **N+1 の回避**: 一覧の未読数と最新メッセージは、会話ごとに数えず 1 回の SQL でまとめて取得する。会話の並び順用に `last_message_at` を持つ。
- **リアルタイム性**: SWR のポーリングで取得する（会話画面 5 秒・一覧 15 秒・ヘッダーの未読数 30 秒。タブが非表示の間は止まる）。
- **日時**: 端末の設定に関係なく JST で表示する。

## API 一覧

| メソッド | パス | 内容 | 認証 |
|---|---|---|---|
| POST | `/api/registration` | 新規登録（`role`: `student` / `company`）。成功するとログイン状態になる | 不要 |
| POST | `/api/session` | ログイン | 不要 |
| DELETE | `/api/session` | ログアウト | 不要 |
| GET | `/api/me` | ログイン中のユーザー（未ログインなら 401） | 必要 |
| GET | `/api/me/profile` | 自分のプロフィール（ロールに応じて学生 / 企業。未登録なら `null`） | 必要 |
| PUT | `/api/me/profile` | 自分のプロフィールを作成・更新 | 必要 |
| GET | `/api/students` | インターン生の検索（20 件ずつ）。条件はすべて任意: `q`（キーワード）・`skills[]`・`skill_match`（`all` / `any`）・`university`・`graduation_year`・`desired_role`・`sort`（`newest` / `updated`）・`page` | 企業のみ |
| GET | `/api/students/:id` | インターン生の詳細（`:id` はユーザー ID） | 企業のみ |
| GET | `/api/skills?q=…` | スキル入力の候補（`q` が無ければよく使われている順） | 必要 |
| GET | `/api/companies/:id` | 企業プロフィールの詳細（`:id` はユーザー ID） | 必要 |
| GET | `/api/conversations?page=1` | 自分が参加している会話の一覧（新しいメッセージ順・未読数と最新メッセージつき） | 必要 |
| POST | `/api/conversations` | インターン生にメッセージを送る（`student_id`・`body`。会話が無ければ作る） | 企業のみ |
| GET | `/api/conversations/unread_count` | 未読メッセージの合計 | 必要 |
| GET | `/api/conversations/:id` | 会話とメッセージ（古い順・最新 100 件） | 当事者のみ |
| PUT | `/api/conversations/:id/read` | 会話を既読にする | 当事者のみ |
| POST | `/api/conversations/:id/messages` | 会話にメッセージを送る（インターン生の返信もこれ） | 当事者のみ |
| GET | `/api/health` | 疎通確認 | 不要 |

エラー時は `{ "message": "…", "errors": { "項目名": ["日本語のメッセージ"] } }` の形で返します。
未ログインは 401、ロールが違う場合は 403、存在しないデータは 404 を返します。

<!-- 以下は実装の進行に合わせて追記する -->

## 実装状況

| ID | 機能 | 状態 |
|---|---|---|
| F-01 | インターン生登録・プロフィール | 実装済み（登録・ログイン・ログアウト、プロフィール編集、企業向けの一覧・詳細） |
| F-02 | 企業からのメッセージ送信 | 実装済み（企業プロフィール、スカウト送信、受信一覧・会話画面、未読／既読、インターン生の返信、企業情報の詳細） |
| F-03 | 募集掲載 | 未着手 |
| F-04 | インターン生検索 | 実装済み（キーワード・スキル（AND／OR）・大学・卒業予定年・志望職種での絞り込み、新着順／更新順、ページネーション） |
| F-05 | 予定調整 | 未着手 |
| F-06 | グループチャット | 未着手 |

## 未実装事項と今後の展望

- メッセージ: 会話画面は最新 100 件までの表示で、それより古いメッセージを読み込む機能は無い
- メッセージ: 更新はポーリングのため、最大数秒の遅れがある（今後は Action Cable でリアルタイム化したい）
- メッセージ: 送信の回数制限（スパム対策）は未実装
- 検索: 部分一致（ILIKE）のため、データが大きくなると遅くなる。件数が増えたら pg_trgm のインデックスや全文検索に切り替えたい
- 検索: 希望インターン期間での絞り込みは未実装

（実装の進行に合わせて追記）
