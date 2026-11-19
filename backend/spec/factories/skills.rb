FactoryBot.define do
  factory :skill do
    sequence(:name) { |n| "スキル#{n}" }
  end
end
