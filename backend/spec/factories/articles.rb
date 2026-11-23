FactoryBot.define do
  # プロフィール登録済みのインターン生が書いた、公開中の記事
  factory :article do
    author { association(:student_profile).user }
    sequence(:title) { |n| "技術記事 #{n}" }
    body { "## はじめに\n\nRails で API を作った話です。\n\n```ruby\nputs \"hello\"\n```\n" }
    status { :published }
    # 企業の記事を公開するときに必要な担当者名（インターン生の記事では保存前に消える）
    contact_name { "担当 太郎" }

    trait :draft do
      status { :draft }
    end

    # 企業が書いた記事
    trait :by_company do
      author { association(:company_profile).user }
    end
  end
end
