# 募集の JSON 表現（一覧・詳細・管理画面で共通）。
# スキル・企業プロフィールは includes(:skills, company: :company_profile) 済みのものを使う（一覧での N+1 を避ける）。
class JobPostingSerializer
  ATTRIBUTES = %i[
    id title description starts_on ends_on work_style compensation headcount deadline status
    published_at created_at updated_at
  ].freeze

  def self.call(posting)
    return nil if posting.nil?

    posting.slice(*ATTRIBUTES).merge(
      "closed" => posting.closed?,
      "skills" => posting.skills.map(&:name),
      "company" => {
        "user_id" => posting.company_id,
        "company_name" => posting.company.company_profile&.company_name
      }
    )
  end

  # メッセージに添える募集の要約（スカウトのカード表示用）
  def self.summary(posting)
    return nil if posting.nil?

    posting.slice(:id, :title, :work_style, :deadline, :status).merge("closed" => posting.closed?)
  end
end
