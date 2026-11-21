# インターン生のプロフィール。企業ユーザーにのみ公開する（メールアドレスは含めない）
class StudentProfile < ApplicationRecord
  MAX_SKILLS = 20

  belongs_to :user
  # 入力した順に並べる
  has_many :student_skills, -> { order(:id) }, dependent: :destroy
  has_many :skills, through: :student_skills

  validates :name, presence: true, length: { maximum: 50 }
  validates :university, presence: true, length: { maximum: 100 }
  validates :faculty, length: { maximum: 100 }
  # 卒業予定年として受け付ける範囲（前年〜6 年後まで）。年をまたいでも正しく判定できるよう毎回計算する
  validates :graduation_year, presence: true,
                              numericality: { only_integer: true, allow_blank: true,
                                              greater_than_or_equal_to: ->(_) { Time.current.year - 1 },
                                              less_than_or_equal_to: ->(_) { Time.current.year + 6 } }
  validates :desired_role, length: { maximum: 50 }
  validates :bio, length: { maximum: 2000 }
  validates :portfolio_url, :github_url, length: { maximum: 255 }, http_url: true
  validates :user_id, uniqueness: true
  validate :user_must_be_student
  validate :available_period_order
  validate :skill_names_format

  # 文字列項目の前後の空白を除き、空文字は nil にそろえる
  normalizes :name, :university, :faculty, :desired_role, :portfolio_url, :github_url,
             with: ->(value) { value.strip.presence }

  after_save :sync_skills

  # スキル名の配列で登録する。保存時にマスタと突き合わせ、無いスキルは作る。
  # 前後の空白を除き、大文字小文字だけが違う重複はまとめる。
  def skill_names=(names)
    @skill_names = Array(names).map { |name| name.to_s.squish }.compact_blank.uniq(&:downcase)
  end

  def skill_names
    @skill_names || skills.map(&:name)
  end

  private

  def user_must_be_student
    errors.add(:user, :must_be_student) if user && !user.student?
  end

  def available_period_order
    return if available_from.blank? || available_to.blank?

    errors.add(:available_to, :after_available_from) if available_to < available_from
  end

  def skill_names_format
    return if @skill_names.nil?

    errors.add(:skill_names, :too_many, count: MAX_SKILLS) if @skill_names.size > MAX_SKILLS
    if @skill_names.any? { |name| name.length > Skill::NAME_MAX_LENGTH }
      errors.add(:skill_names, :name_too_long, count: Skill::NAME_MAX_LENGTH)
    end
  end

  def sync_skills
    return if @skill_names.nil?

    self.skills = Skill.find_or_create_all_by_names(@skill_names)
    @skill_names = nil
  end
end
