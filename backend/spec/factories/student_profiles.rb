FactoryBot.define do
  factory :student_profile do
    user
    sequence(:name) { |n| "学生 #{n}" }
    university { "東都大学" }
    faculty { "工学部" }
    graduation_year { Time.current.year + 2 }
    desired_role { "バックエンドエンジニア" }
    bio { "Web アプリを個人開発しています。" }
  end
end
