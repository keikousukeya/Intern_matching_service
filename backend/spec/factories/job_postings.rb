FactoryBot.define do
  # 企業プロフィール登録済みの企業の、公開中の募集
  factory :job_posting do
    company { association(:company_profile).user }
    sequence(:title) { |n| "インターン募集 #{n}" }
    description { "Web アプリの開発を担当していただきます。" }
    work_style { :remote }
    compensation { "時給 1,500 円" }
    headcount { 2 }
    starts_on { 1.month.from_now.to_date }
    ends_on { 4.months.from_now.to_date }
    deadline { 2.weeks.from_now.to_date }
    status { :published }

    trait :draft do
      status { :draft }
    end

    # 締切を過ぎた募集（締切は過去の日付を保存できないため、検証を通さずに書き換える）
    trait :closed do
      after(:create) { |posting| posting.update_columns(deadline: 1.day.ago.to_date) }
    end
  end
end
