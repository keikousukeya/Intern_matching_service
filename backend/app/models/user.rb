class User < ApplicationRecord
  # bcrypt の仕様上 72 バイトを超える部分は無視されるため上限を設ける
  PASSWORD_LENGTH = (8..72)

  has_secure_password

  enum :role, { student: 0, company: 1 }, validate: true

  has_one :student_profile, dependent: :destroy
  has_one :company_profile, dependent: :destroy

  # 参加している会話（メッセージ機能）
  has_many :conversation_participants, dependent: :destroy
  has_many :conversations, through: :conversation_participants

  # 企業が掲載した募集（F-03）
  has_many :job_postings, foreign_key: :company_id, inverse_of: :company, dependent: :destroy

  # 前後の空白を除き小文字にそろえる（大文字小文字違いの重複登録を防ぐ）
  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
                    uniqueness: true
  validates :password, length: { in: PASSWORD_LENGTH }, allow_nil: true

  # ロールに応じたプロフィール（未登録なら nil）
  def profile
    student? ? student_profile : company_profile
  end

  # ロールに応じたプロフィールを、未登録なら新しく組み立てて返す（保存はしない）
  def profile_or_build
    profile || (student? ? build_student_profile : build_company_profile)
  end
end
