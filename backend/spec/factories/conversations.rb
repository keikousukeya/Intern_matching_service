FactoryBot.define do
  # 参加者（企業・インターン生）も一緒に作る
  factory :conversation do
    company factory: %i[user company]
    student factory: :user

    after(:build) do |conversation|
      if conversation.participants.empty?
        conversation.participants.build(user: conversation.company)
        conversation.participants.build(user: conversation.student)
      end
    end

    # 画面表示に使うプロフィールも登録済みにする（未登録のユーザーだけ作る）
    after(:create) do |conversation|
      create(:company_profile, user: conversation.company) unless CompanyProfile.exists?(user: conversation.company)
      create(:student_profile, user: conversation.student) unless StudentProfile.exists?(user: conversation.student)
      conversation.company.reload
      conversation.student.reload
    end
  end

  factory :message do
    conversation
    sender { conversation.company }
    sequence(:body) { |n| "メッセージ本文 #{n}" }
  end
end
