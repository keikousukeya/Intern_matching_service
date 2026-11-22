module Api
  # 企業向け: 自社の募集の一覧（GET /api/me/job_postings）。募集管理の画面で使う。
  # 非公開・締切済みも含めて、更新日時の新しい順に返す。スカウト送信時の募集の選択肢にも使う。
  class MyJobPostingsController < ApplicationController
    before_action :require_login!
    before_action -> { require_role!(:company) }

    def index
      postings, meta = paginate(
        current_user.job_postings.includes(:skills, company: :company_profile).order(updated_at: :desc, id: :desc)
      )

      render json: { job_postings: postings.map { |posting| JobPostingSerializer.call(posting) }, meta: meta }
    end
  end
end
