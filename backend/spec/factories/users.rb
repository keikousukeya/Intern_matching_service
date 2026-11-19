FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    password { "password123" }
    role { :student }

    trait :company do
      role { :company }
    end
  end
end
