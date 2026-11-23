FactoryBot.define do
  factory :company_profile do
    user factory: %i[user company]
    sequence(:company_name) { |n| "株式会社サンプル#{n}" }
    description { "業務管理 SaaS を開発しています。" }
    website { "https://sample.example.com" }
  end
end
