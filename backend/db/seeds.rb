# 開発用のダミーデータ。
#   docker compose exec backend bin/rails db:seed
#
# - 何度実行しても同じ結果になる（メールアドレスで探し、あれば更新する）
# - 乱数のシードを固定しているため、毎回同じ内容になる
# - 企業名・大学名はすべて架空のもの
# - ログイン用パスワードはすべて password123

abort "本番環境ではシードデータを投入しません" if Rails.env.production?

PASSWORD = "password123".freeze
STUDENT_COUNT = 30

Faker::Config.locale = :ja
Faker::Config.random = Random.new(20261119)
random = Random.new(20261119)

SKILL_NAMES = %w[
  Ruby Rails Python Django Go Java Kotlin Swift TypeScript JavaScript
  React Next.js Vue.js Node.js PHP Laravel C# Unity C++ Rust
  SQL PostgreSQL MySQL AWS GCP Docker Kubernetes Git Linux Figma
  機械学習 データ分析 UI/UX デザイン 英語
].freeze

UNIVERSITIES = [
  [ "東都大学", %w[工学部情報工学科 理学部数学科 経済学部] ],
  [ "北陵大学", %w[情報科学部 工学部電気電子工学科] ],
  [ "西海大学", %w[理工学部 デザイン学部 商学部] ],
  [ "南央工業大学", %w[工学部機械工学科 情報工学部] ],
  [ "中京学院大学", %w[経営学部 総合政策学部 文学部] ],
  [ "湖南情報大学", %w[情報メディア学部 データサイエンス学部] ]
].freeze

DESIRED_ROLES = %w[
  バックエンドエンジニア フロントエンドエンジニア フルスタックエンジニア
  モバイルアプリエンジニア インフラエンジニア データサイエンティスト
  機械学習エンジニア UI/UXデザイナー プロダクトマネージャー ゲームエンジニア
].freeze

# contact_name はプロフィールには保存せず、その企業の記事・メッセージの担当者名として使う
COMPANIES = [
  { company_name: "株式会社ネクストブリッジ", contact_name: "佐藤 美咲",
    description: "中小企業向けの業務管理 SaaS を開発しています。Rails と React を中心に、少人数のチームで企画から運用まで一貫して担当します。",
    website: "https://nextbridge.example.com" },
  { company_name: "ミライラボ株式会社", contact_name: "高橋 健",
    description: "画像認識を使った検品システムを製造業向けに提供しています。Python・機械学習に興味のある学生を歓迎します。",
    website: "https://mirai-lab.example.com" },
  { company_name: "株式会社アオバデザイン", contact_name: "鈴木 彩",
    description: "Web サービスの UI/UX デザインと受託開発を行う制作会社です。デザイナーとエンジニアが近い距離で働いています。",
    website: "https://aoba-design.example.com" },
  { company_name: "クラウドフィールド株式会社", contact_name: "田中 翔太",
    description: "物流向けのクラウド基盤を運用しています。AWS・Kubernetes を使ったインフラ構築を実務で経験できます。",
    website: "https://cloudfield.example.com" },
  { company_name: "株式会社ハルモニア", contact_name: "伊藤 結衣",
    description: "学習アプリ（iOS / Android）を開発するスタートアップです。週 2 日からのリモートインターンも可能です。",
    website: "https://harmonia.example.com" }
].freeze

BIO_TEMPLATES = [
  "大学では%{faculty}で学んでいます。個人開発で Web アプリを作っており、実務でのチーム開発を経験したいと考えています。",
  "%{role}を目指しています。授業の演習やハッカソンで開発経験を積んできました。長期インターンで力を伸ばしたいです。",
  "プログラミングを始めて 2 年ほどです。%{skills}を使った開発が得意です。ユーザーの役に立つサービスづくりに関わりたいです。",
  "研究室で%{skills}を使ったデータ処理に取り組んでいます。研究で身につけた知識を実務に生かせる場を探しています。"
].freeze

# 募集（F-03）: [企業番号, 属性]。締切・期間はシード実行日からの相対日数（何日後か）で指定する
JOB_POSTINGS = [
  [ 1, { title: "Rails × React で業務管理 SaaS を開発する長期インターン", work_style: :hybrid,
         description: "中小企業向け業務管理 SaaS の新機能開発を担当していただきます。\n\n" \
                      "・Rails での API 開発\n・React での画面実装\n・コードレビューを通じたチーム開発\n\n" \
                      "週 3 日以上、3 か月以上参加できる方を歓迎します。",
         compensation: "時給 1,500 円（経験に応じて昇給）", headcount: 2, starts_in: 30, months: 6, deadline_in: 45,
         skills: %w[Ruby Rails React Git] } ],
  [ 1, { title: "フロントエンド（Next.js）開発インターン", work_style: :remote,
         description: "管理画面のリニューアルに伴い、Next.js と TypeScript でのフロントエンド開発をお任せします。フルリモートで参加できます。",
         compensation: "時給 1,400 円", headcount: 1, starts_in: 14, months: 3, deadline_in: 20,
         skills: %w[TypeScript React Next.js] } ],
  [ 1, { title: "【準備中】インフラ改善インターン", work_style: :onsite, status: :draft,
         description: "AWS 上のインフラの監視・自動化に取り組んでいただく予定です（募集内容を準備中）。",
         compensation: nil, headcount: nil, starts_in: nil, months: nil, deadline_in: nil, skills: %w[AWS Docker] } ],
  [ 2, { title: "画像認識モデルの開発・検証インターン", work_style: :hybrid,
         description: "製造業向け検品システムで使う画像認識モデルの学習・評価を担当していただきます。研究で機械学習に取り組んでいる方を歓迎します。",
         compensation: "時給 1,800 円", headcount: 2, starts_in: 30, months: 6, deadline_in: 60,
         skills: %w[Python 機械学習 データ分析] } ],
  [ 3, { title: "UI/UX デザイナーインターン（Figma）", work_style: :onsite,
         description: "受託案件の Web サービスについて、ワイヤーフレーム作成から UI デザインまでをデザイナーと一緒に進めていただきます。",
         compensation: "日給 10,000 円", headcount: 1, starts_in: 21, months: 3, deadline_in: 10,
         skills: %w[Figma UI/UX デザイン] } ],
  [ 4, { title: "Kubernetes を使ったクラウド基盤の構築インターン", work_style: :remote,
         description: "物流向けクラウド基盤の構築・運用を、SRE チームと一緒に経験していただきます。Linux の基本操作ができる方を歓迎します。",
         compensation: "月 12 万円（週 4 日）", headcount: 1, starts_in: 45, months: 6, deadline_in: nil,
         skills: %w[AWS Kubernetes Docker Linux] } ],
  [ 5, { title: "学習アプリ（iOS / Android）開発インターン", work_style: :remote,
         description: "Swift・Kotlin を使った学習アプリの機能開発を担当していただきます。週 2 日から、リモートで参加できます。",
         compensation: "時給 1,300 円", headcount: 3, starts_in: 14, months: 4, deadline_in: 30,
         skills: %w[Swift Kotlin Git] } ]
].freeze

# 技術ブログの記事: [書いた人のメールアドレス, 何日前に公開, 属性]（status: :draft は下書き）
ARTICLES = [
  [ "student1@example.com", 6, {
    title: "個人開発で Rails API と Next.js を分けて作ってみた",
    skills: %w[Rails Next.js TypeScript],
    body: <<~MARKDOWN
      ## なぜ分けたのか

      フロントエンドとバックエンドの役割をはっきりさせたかったためです。

      - Rails は JSON を返すことに集中する
      - Next.js は画面と操作に集中する

      ## ハマったところ

      Cookie を使った認証で CORS の設定に悩みました。最終的に Next.js の `rewrites` で同一オリジンにまとめました。

      ```js
      // next.config.ts
      async rewrites() {
        return [{ source: "/api/:path*", destination: "http://backend:3000/api/:path*" }];
      }
      ```

      | 方式 | 良い点 | 気になる点 |
      | --- | --- | --- |
      | JWT | 構成がシンプル | 保存場所に注意が必要 |
      | セッション Cookie | HttpOnly にできる | 同一オリジンにする工夫が必要 |
    MARKDOWN
  } ],
  [ "student3@example.com", 3, {
    title: "React の useEffect を減らしたら見通しが良くなった話",
    skills: %w[React TypeScript],
    body: <<~MARKDOWN
      ## 結論

      **「表示のために計算できる値」は state にしない**、が一番効きました。

      1. props から計算できる値は、描画中にそのまま計算する
      2. イベントで起きることは、イベントハンドラーに書く
      3. 外部との同期だけを `useEffect` に残す

      > useEffect は「外部システムと同期するため」のもの

      ### チェックリスト

      - [x] 派生 state を消した
      - [x] fetch はライブラリ（SWR）に任せた
      - [ ] テストを書く
    MARKDOWN
  } ],
  [ "student5@example.com", 1, {
    title: "pandas で大学の時間割データを分析してみた",
    skills: %w[Python データ分析],
    body: <<~MARKDOWN
      ゼミの課題で、学部の時間割データを集計しました。

      ```python
      import pandas as pd

      df = pd.read_csv("timetable.csv")
      print(df.groupby("weekday")["credits"].sum())
      ```

      水曜日に必修が集中していることが分かりました。
    MARKDOWN
  } ],
  [ "student1@example.com", nil, {
    title: "（下書き）Docker Compose の開発環境メモ",
    skills: %w[Docker],
    status: :draft,
    body: "まだ書きかけです。

- ボリュームの使い分け
- node_modules をどこに置くか"
  } ],
  [ "company1@example.com", 10, {
    title: "当社の開発チームのコードレビューの進め方",
    skills: %w[Git],
    body: <<~MARKDOWN
      ## レビューで大切にしていること

      インターン生の方にもレビューに参加してもらっています。

      - 指摘には **理由** を書く
      - 「必須」と「提案」を書き分ける
      - 小さな PR にする（目安は 300 行まで）

      インターンでは、最初の 1 か月でレビューする側も経験してもらいます。
    MARKDOWN
  } ],
  [ "company2@example.com", 4, {
    title: "データ基盤を AWS に移行したときの振り返り",
    skills: %w[AWS SQL データ分析],
    body: <<~MARKDOWN
      ## 背景

      オンプレミスの集計バッチが夜間に終わらなくなってきたため、移行を決めました。

      ## やったこと

      1. 集計 SQL の棚卸し
      2. 処理ごとの所要時間の計測
      3. 段階的な切り替え

      詳しくは [AWS のドキュメント](https://docs.aws.amazon.com/) も参考にしました。
    MARKDOWN
  } ]
].freeze

def upsert_user!(email, role)
  User.find_or_initialize_by(email: email).tap do |user|
    user.update!(password: PASSWORD, role: role)
  end
end

# 企業ユーザー（company1@example.com など）の担当者名。インターン生なら nil（記事・メッセージでは使わない）
def seed_contact_name(user)
  number = user.email[/\Acompany(\d+)@/, 1]
  number && COMPANIES[number.to_i - 1][:contact_name]
end

ActiveRecord::Base.transaction do
  Skill.find_or_create_all_by_names(SKILL_NAMES)

  # 企業: company1@example.com 〜 company5@example.com
  COMPANIES.each.with_index(1) do |attributes, index|
    user = upsert_user!("company#{index}@example.com", :company)
    user.profile_or_build.update!(attributes.except(:contact_name))
  end

  # インターン生: student1@example.com 〜 student30@example.com
  this_year = Time.current.year
  STUDENT_COUNT.times do |i|
    user = upsert_user!("student#{i + 1}@example.com", :student)

    university, faculties = UNIVERSITIES.sample(random: random)
    faculty = faculties.sample(random: random)
    role = DESIRED_ROLES.sample(random: random)
    skills = SKILL_NAMES.sample(random.rand(2..6), random: random)
    available_from = Date.new(this_year + 1, random.rand(1..6), 1)

    user.profile_or_build.update!(
      name: Faker::Name.name,
      university: university,
      faculty: faculty,
      graduation_year: this_year + random.rand(1..4),
      desired_role: role,
      bio: format(BIO_TEMPLATES.sample(random: random), faculty: faculty, role: role, skills: skills.first(2).join("・")),
      # 一部の学生だけ URL を登録している状態にする
      portfolio_url: (i.even? ? "https://portfolio.example.com/student#{i + 1}" : nil),
      github_url: (i % 3 == 0 ? "https://github.example.com/student#{i + 1}" : nil),
      available_from: available_from,
      available_to: available_from >> random.rand(2..6),
      skill_names: skills
    )
  end

  # 募集: 企業とタイトルで探し、あれば内容を更新する
  today = Time.zone.today
  JOB_POSTINGS.each do |company_number, attributes|
    company = User.find_by!(email: "company#{company_number}@example.com")
    posting = company.job_postings.find_or_initialize_by(title: attributes[:title])
    starts_on = attributes[:starts_in] && today + attributes[:starts_in]
    posting.update!(
      description: attributes[:description],
      work_style: attributes[:work_style],
      compensation: attributes[:compensation],
      headcount: attributes[:headcount],
      starts_on: starts_on,
      ends_on: starts_on && (starts_on >> attributes[:months]),
      deadline: attributes[:deadline_in] && today + attributes[:deadline_in],
      status: attributes.fetch(:status, :published),
      skill_names: attributes[:skills]
    )
  end
  react_posting = JobPosting.find_by!(title: "フロントエンド（Next.js）開発インターン")

  # 技術ブログの記事: 書いた人とタイトルで探し、あれば内容を更新する
  ARTICLES.each do |email, days_ago, attributes|
    author = User.find_by!(email: email)
    article = author.articles.find_or_initialize_by(title: attributes[:title])
    article.update!(body: attributes[:body], status: attributes.fetch(:status, :published),
                    skill_names: attributes[:skills], contact_name: seed_contact_name(author))
    # 新着順が分かりやすいよう、公開日時をずらす（検証は不要なため直接書き換える）
    article.update_columns(published_at: days_ago.days.ago) if days_ago
  end

  # メッセージ: 企業 1・2 から学生 1〜3 へのスカウト（返信あり・未読あり・既読のみ が混ざるようにする）
  # [企業番号, 学生番号, [[送信者, 何時間前, 本文, 紐づける募集（任意）], ...]]
  conversations = [
    [ 1, 1, [
      [ :company, 50, "はじめまして。プロフィールを拝見し、Web アプリの個人開発の経験に惹かれてご連絡しました。弊社の長期インターンについて、一度オンラインでお話ししませんか？" ],
      [ :student, 30, "ご連絡ありがとうございます！ぜひお話を伺いたいです。平日の夕方以降であれば調整可能です。" ],
      [ :company, 5, "ありがとうございます。来週の水曜日 18 時からはいかがでしょうか？" ]
    ] ],
    [ 2, 1, [
      [ :company, 20, "データ分析に関するご経験について、詳しくお聞きしたくご連絡しました。週 2 日からの参加も可能です。" ]
    ] ],
    [ 1, 2, [
      [ :company, 72, "インターン募集のご案内です。ご興味があれば返信をお待ちしています。" ],
      [ :student, 48, "ありがとうございます。業務内容について詳しく教えていただけますか？" ]
    ] ],
    [ 1, 3, [
      [ :company, 10, "React を使ったフロントエンド開発のインターンを募集しています。ご興味はありますか？", react_posting ]
    ] ]
  ]

  conversations.each do |company_number, student_number, messages|
    company = User.find_by!(email: "company#{company_number}@example.com")
    student = User.find_by!(email: "student#{student_number}@example.com")
    conversation = Conversation.find_or_start!(company: company, student: student)
    # 2 回目以降の実行でメッセージが増えないよう、空の会話にだけ投入する
    next if conversation.messages.exists?

    messages.each do |sender, hours_ago, body, job_posting|
      conversation.messages.create!(sender: sender == :company ? company : student, body: body,
                                    sender_name: seed_contact_name(company),
                                    job_posting: job_posting, created_at: hours_ago.hours.ago)
    end
  end
end

puts "シードデータを投入しました: 企業 #{CompanyProfile.count} 件 / インターン生 #{StudentProfile.count} 件 / スキル #{Skill.count} 件 / 募集 #{JobPosting.count} 件 / 記事 #{Article.count} 件 / 会話 #{Conversation.count} 件"
puts "ログイン例: student1@example.com / company1@example.com（パスワードは #{PASSWORD}）"
