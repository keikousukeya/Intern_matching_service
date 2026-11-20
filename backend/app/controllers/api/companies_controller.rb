module Api
  # 企業プロフィールの詳細（GET /api/companies/:id）。
  # スカウトを受け取ったインターン生が送信元の企業を確認するためのもの。ログインしていれば閲覧できる。
  # :id は企業のユーザー ID（会話の company.user_id と同じ ID で扱えるようにするため）。
  class CompaniesController < ApplicationController
    before_action :require_login!

    def show
      profile = CompanyProfile.find_by!(user_id: params[:id])

      render json: { company: CompanyProfileSerializer.call(profile) }
    end
  end
end
