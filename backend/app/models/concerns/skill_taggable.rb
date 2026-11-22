# スキル名の配列で skills を登録できるようにする（インターン生プロフィール・募集で共通）。
#
#   class StudentProfile < ApplicationRecord
#     include SkillTaggable
#     has_many :student_skills, -> { order(:id) }, dependent: :destroy
#     has_many :skills, through: :student_skills
#     skill_taggable max: 20
#   end
#
# 保存時にマスタと突き合わせ、無いスキルは作る。
# 前後の空白を除き、大文字小文字だけが違う重複はまとめる。
module SkillTaggable
  extend ActiveSupport::Concern

  included do
    class_attribute :max_skills, instance_writer: false, default: 20
    validate :skill_names_format
    after_save :sync_skills
  end

  class_methods do
    def skill_taggable(max:)
      self.max_skills = max
    end
  end

  def skill_names=(names)
    @skill_names = Array(names).map { |name| name.to_s.squish }.compact_blank.uniq(&:downcase)
  end

  def skill_names
    @skill_names || skills.map(&:name)
  end

  private

  def skill_names_format
    return if @skill_names.nil?

    errors.add(:skill_names, :too_many, count: max_skills) if @skill_names.size > max_skills
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
