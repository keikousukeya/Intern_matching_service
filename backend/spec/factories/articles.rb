FactoryBot.define do
  # プロフィール登録済みのインターン生が書いた、公開中の記事
  factory :article do
    author { association(:student_profile).user }
    sequence(:title) { |n| "技術記事 #{n}" }
    body { "## はじめに\n\nRails で API を作った話です。\n\n```ruby\nputs \"hello\"\n```\n" }
    status { :published }

    trait :draft do
      status { :draft }
    end

    # 企業が書いた記事
    trait :by_company do
      author { association(:company_profile).user }
    end
  end
end
