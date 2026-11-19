# 企業プロフィールの JSON 表現（メールアドレスは含めない）
class CompanyProfileSerializer
  ATTRIBUTES = %i[user_id company_name contact_name description website created_at updated_at].freeze

  def self.call(profile)
    return nil if profile.nil?

    profile.slice(*ATTRIBUTES)
  end
end
