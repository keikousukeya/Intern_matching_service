# 企業の募集（F-03）。
# 公開中（published）の募集はログインユーザー全員が閲覧でき、非公開（draft）は作成した企業だけが見られる。
class JobPosting < ApplicationRecord
  include SkillTaggable

  TITLE_MAX_LENGTH = 100
  DESCRIPTION_MAX_LENGTH = 5000
  HEADCOUNT_RANGE = (1..1000)

  belongs_to :company, class_name: "User"
  # 入力した順に並べる
  has_many :job_posting_skills, -> { order(:id) }, dependent: :destroy
  has_many :skills, through: :job_posting_skills
  # 削除してもスカウトのメッセージは残す（紐づけだけを外す。DB の外部キーも on_delete: :nullify）
  has_many :messages, dependent: :nullify
  skill_taggable max: 10

  enum :work_style, { onsite: 0, remote: 1, hybrid: 2 }, validate: true
  enum :status, { draft: 0, published: 1 }, validate: true

  # 文字列項目の前後の空白を除き、空文字は nil にそろえる（本文は改行を残し前後だけ除く）
  normalizes :title, :compensation, with: ->(value) { value.strip.presence }
  normalizes :description, with: ->(value) { value.strip.presence }

  validates :title, presence: true, length: { maximum: TITLE_MAX_LENGTH }
  validates :description, presence: true, length: { maximum: DESCRIPTION_MAX_LENGTH }
  validates :compensation, length: { maximum: 100 }
  validates :headcount, numericality: { only_integer: true, in: HEADCOUNT_RANGE, allow_nil: true }
  validate :company_must_have_profile
  validate :period_order
  validate :deadline_not_past

  before_save :set_published_at

  # 一覧に出す募集（公開中で、締切を過ぎていないもの。締切は当日まで有効）
  scope :accepting, -> { published.where("deadline IS NULL OR deadline >= ?", Time.zone.today) }

  # 閲覧できる募集（公開中のもの＋自社の募集）。締切を過ぎた募集も、スカウトのリンクなどから詳細は見られるようにする
  scope :visible_to, ->(user) { published.or(where(company_id: user.id)) }

  # 締切を過ぎているか
  def closed?
    deadline.present? && deadline < Time.zone.today
  end

  private

  # 募集の掲載者として企業名を表示するため、企業プロフィールの登録を必須にする
  def company_must_have_profile
    return if company.nil?

    if !company.company?
      errors.add(:company, :must_be_company)
    elsif company.company_profile.nil?
      errors.add(:company, :profile_required)
    end
  end

  def period_order
    return if starts_on.blank? || ends_on.blank?

    errors.add(:ends_on, :after_starts_on) if ends_on < starts_on
  end

  # 締切を新しく設定・変更するときは、過去の日付を受け付けない（既存の募集の他の項目を直すときは問わない）
  def deadline_not_past
    return unless deadline.present? && will_save_change_to_deadline?

    errors.add(:deadline, :not_past) if deadline < Time.zone.today
  end

  # 非公開→公開にした日時を記録する（新着順の基準）
  def set_published_at
    self.published_at = Time.current if published? && (published_at.nil? || will_save_change_to_status?)
  end
end
