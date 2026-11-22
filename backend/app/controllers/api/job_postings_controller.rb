module Api
  # 募集（F-03）の一覧・詳細・作成・更新・削除。
  # 閲覧はログインユーザー全員（公開中のもの）。作成・更新・削除は企業が自社の募集にだけ行える。
  class JobPostingsController < ApplicationController
    PERMITTED_PARAMS = [
      :title, :description, :starts_on, :ends_on, :work_style, :compensation, :headcount, :deadline, :status,
      { skill_names: [] }
    ].freeze

    before_action :require_login!
    before_action -> { require_role!(:company) }, only: %i[create update destroy]

    # GET /api/job_postings  公開中で締切前の募集（20 件ずつ）。条件はすべて任意
    #   q           キーワード（スペース区切りで AND。タイトル・業務内容・報酬・企業名・スキル名の部分一致）
    #   skills[]    必要スキル（大文字小文字を区別しない完全一致）
    #   skill_match all（すべて含む・既定）/ any（いずれかを含む）
    #   work_style  onsite / remote / hybrid
    #   company_id  企業（企業詳細の画面で、その企業の募集を出すため）
    #   sort        newest（新着順・既定）/ deadline（締切が近い順）
    def index
      postings, meta = paginate(JobPostingSearch.new(**search_params).results.includes(:skills, company: :company_profile))

      render json: { job_postings: postings.map { |posting| JobPostingSerializer.call(posting) }, meta: meta }
    end

    # GET /api/job_postings/:id  公開中の募集、または自社の募集（非公開の他社の募集は存在も分からないよう 404）
    def show
      posting = JobPosting.visible_to(current_user).includes(:skills, company: :company_profile).find(params[:id])

      render json: { job_posting: JobPostingSerializer.call(posting) }
    end

    # POST /api/job_postings  企業プロフィールの登録が必要（モデルで検証して 422 を返す）
    def create
      posting = current_user.job_postings.build(job_posting_params)

      if posting.save
        render json: { job_posting: JobPostingSerializer.call(posting) }, status: :created
      else
        render_validation_errors(posting)
      end
    end

    # PUT /api/job_postings/:id  公開・非公開の切り替えも status でここから行う
    def update
      posting = find_own_posting

      if posting.update(job_posting_params)
        render json: { job_posting: JobPostingSerializer.call(posting) }
      else
        render_validation_errors(posting)
      end
    end

    # DELETE /api/job_postings/:id  紐づけたスカウトのメッセージは残る（紐づけだけ外れる）
    def destroy
      find_own_posting.destroy!
      head :no_content
    end

    private

    # 他社の募集は存在も分からないよう 404 にする
    def find_own_posting
      current_user.job_postings.find(params[:id])
    end

    def job_posting_params
      params.expect(job_posting: PERMITTED_PARAMS)
    end

    # 型が違う値（例: q に配列、skills に文字列）は permit で落とす
    def search_params
      params.permit(:q, :skill_match, :work_style, :company_id, :sort, skills: []).to_h.symbolize_keys
    end
  end
end
