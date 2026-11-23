# 企業のプロフィール。スカウトの送信者としてインターン生に表示する
class CompanyProfile < ApplicationRecord
  # 担当者名はメッセージ（sender_name）・記事（contact_name）ごとに入力する形に移した。
  # 列とデータは残しているが、モデルからは使わない
  self.ignored_columns += [ "contact_name" ]

  belongs_to :user

  validates :company_name, presence: true, length: { maximum: 100 }
  validates :description, length: { maximum: 2000 }
  validates :website, length: { maximum: 255 }, http_url: true
  validates :user_id, uniqueness: true
  validate :user_must_be_company

  # 文字列項目の前後の空白を除き、空文字は nil にそろえる
  normalizes :company_name, :website, with: ->(value) { value.strip.presence }

  private

  def user_must_be_company
    errors.add(:user, :must_be_company) if user && !user.company?
  end
end
