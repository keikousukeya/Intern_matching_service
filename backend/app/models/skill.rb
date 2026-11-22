# スキルのマスタ。インターン生が入力したスキル名から自動で作られる（候補つき自由入力）
class Skill < ApplicationRecord
  NAME_MAX_LENGTH = 30

  has_many :student_skills, dependent: :destroy
  has_many :student_profiles, through: :student_skills
  has_many :job_posting_skills, dependent: :destroy

  # 連続する空白を 1 つにまとめ、前後の空白を除く
  normalizes :name, with: ->(name) { name.squish }

  validates :name, presence: true, length: { maximum: NAME_MAX_LENGTH }
  validate :name_unique_ignoring_case

  # 大文字小文字を区別せずに名前で探す
  scope :named, ->(name) { where("lower(name) = ?", name.squish.downcase) }

  # 名前の部分一致（入力候補の表示用）。% や _ はワイルドカードとして扱わない
  scope :search, ->(query) { where("name ILIKE ?", "%#{sanitize_sql_like(query.squish)}%") }

  # 使っているインターン生が多い順（入力候補の表示用）
  scope :popular, lambda {
    left_joins(:student_skills).group(:id).order(Arel.sql("COUNT(student_skills.id) DESC"), :name)
  }

  # 名前の一覧から Skill を探し、無ければ作る。
  # 表記は最初に登録された形（例: 「React」）を使い、「react」と入力されても同じスキルにまとめる。
  def self.find_or_create_all_by_names(names)
    names.map do |name|
      # セーブポイントを張る（一意制約違反でも呼び出し元のトランザクション全体を壊さないため）
      named(name).first || transaction(requires_new: true) { create!(name: name) }
    rescue ActiveRecord::RecordNotUnique
      # 同時に同じスキルが作られた場合は、作られた方を使う
      named(name).first!
    end
  end

  private

  def name_unique_ignoring_case
    return if name.blank?
    return unless self.class.named(name).where.not(id: id).exists?

    errors.add(:name, :taken)
  end
end
