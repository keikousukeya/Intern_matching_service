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

def upsert_user!(email, role)
  User.find_or_initialize_by(email: email).tap do |user|
    user.update!(password: PASSWORD, role: role)
  end
end

ActiveRecord::Base.transaction do
  Skill.find_or_create_all_by_names(SKILL_NAMES)

  # 企業: company1@example.com 〜 company5@example.com
  COMPANIES.each.with_index(1) do |attributes, index|
    user = upsert_user!("company#{index}@example.com", :company)
    user.profile_or_build.update!(attributes)
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
end

puts "シードデータを投入しました: 企業 #{CompanyProfile.count} 件 / インターン生 #{StudentProfile.count} 件 / スキル #{Skill.count} 件"
puts "ログイン例: student1@example.com / company1@example.com（パスワードは #{PASSWORD}）"
