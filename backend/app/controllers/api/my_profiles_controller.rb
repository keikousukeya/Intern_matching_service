module Api
  # ログイン中のユーザー自身のプロフィール（GET /api/me/profile・PUT /api/me/profile）。
  # ロールに応じてインターン生プロフィール / 企業プロフィールを扱う。
  # 本人のものしか操作できないよう、ID は受け取らず current_user から決める。
  class MyProfilesController < ApplicationController
    before_action :require_login!

    STUDENT_PARAMS = [
      :name, :university, :faculty, :graduation_year, :desired_role, :bio,
      :portfolio_url, :github_url, :available_from, :available_to, { skill_names: [] }
    ].freeze
    COMPANY_PARAMS = %i[company_name description website].freeze

    def show
      render json: { profile: serialize(current_user.profile) }
    end

    # 未登録なら作成、登録済みなら更新する
    def update
      profile = current_user.profile_or_build
      profile.assign_attributes(profile_params)

      if profile.save
        render json: { profile: serialize(profile) }
      else
        render_validation_errors(profile)
      end
    end

    private

    def profile_params
      params.expect(profile: current_user.student? ? STUDENT_PARAMS : COMPANY_PARAMS)
    end

    def serialize(profile)
      current_user.student? ? StudentProfileSerializer.call(profile) : CompanyProfileSerializer.call(profile)
    end
  end
end
