module Api
  # スキル入力の候補（GET /api/skills?q=rea）。
  # q があれば部分一致、無ければよく使われているスキルを返す。
  # 入力欄で分類ごとに分けて表示するため、名前と分類（category）を返す。
  class SkillsController < ApplicationController
    LIMIT = 20

    before_action :require_login!

    def index
      skills = params[:q].present? ? Skill.search(params[:q]).order(:name) : Skill.popular

      render json: {
        skills: skills.limit(LIMIT).pluck(:name, :category).map { |name, category| { name: name, category: category } }
      }
    end
  end
end
