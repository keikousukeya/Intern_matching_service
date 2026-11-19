class User < ApplicationRecord
  # bcrypt の仕様上 72 バイトを超える部分は無視されるため上限を設ける
  PASSWORD_LENGTH = (8..72)

  has_secure_password

  enum :role, { student: 0, company: 1 }, validate: true

  # 前後の空白を除き小文字にそろえる（大文字小文字違いの重複登録を防ぐ）
  normalizes :email, with: ->(email) { email.strip.downcase }

  validates :email, presence: true,
                    format: { with: URI::MailTo::EMAIL_REGEXP, allow_blank: true },
                    uniqueness: true
  validates :password, length: { in: PASSWORD_LENGTH }, allow_nil: true
end
