# インターン生プロフィールの JSON 表現。
# 企業にも公開するため、メールアドレスなどの連絡先は含めない（ここに無い項目は返らない）。
# スキルは includes(:skills) 済みのものを使う（一覧での N+1 を避ける）。
class StudentProfileSerializer
  ATTRIBUTES = %i[
    user_id name university faculty graduation_year desired_role bio
    portfolio_url github_url available_from available_to created_at updated_at
  ].freeze

  def self.call(profile)
    return nil if profile.nil?

    profile.slice(*ATTRIBUTES).merge("skills" => profile.skills.map(&:name))
  end
end
