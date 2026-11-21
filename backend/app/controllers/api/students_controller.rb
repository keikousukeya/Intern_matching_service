module Api
  # 企業向け: インターン生プロフィールの一覧・詳細。
  # プロフィールは企業ユーザーにのみ公開する（インターン生同士や未ログインでは見られない）。
  # :id はインターン生のユーザー ID（スカウトの宛先と同じ ID で扱えるようにするため）。
  class StudentsController < ApplicationController
    before_action :require_login!
    before_action -> { require_role!(:company) }

    # GET /api/students  インターン生の検索（F-04）。条件はすべて任意
    #   q               キーワード（スペース区切りで AND。氏名・大学・学部・志望職種・自己紹介・スキル名の部分一致）
    #   skills[]        スキル名（大文字小文字を区別しない完全一致）
    #   skill_match     all（すべて含む・既定）/ any（いずれかを含む）
    #   university      大学名（部分一致）
    #   graduation_year 卒業予定年（完全一致）
    #   desired_role    志望職種（部分一致）
    #   sort            newest（新着順・既定）/ updated（更新順）
    #   page            ページ番号（20 件ずつ）
    def index
      profiles, meta = paginate(StudentSearch.new(**search_params).results.includes(:skills))

      render json: { students: profiles.map { |profile| StudentProfileSerializer.call(profile) }, meta: meta }
    end

    # GET /api/students/:id
    # conversation_id: このインターン生との会話が既にあればその ID（画面で「送信」か「会話を開く」かを切り替える）
    def show
      profile = StudentProfile.includes(:skills).find_by!(user_id: params[:id])
      conversation = Conversation.find_by(company: current_user, student_id: profile.user_id)

      render json: { student: StudentProfileSerializer.call(profile), conversation_id: conversation&.id }
    end

    private

    # 検索条件。型が違う値（例: q に配列、skills に文字列）は permit で落とす
    def search_params
      params.permit(:q, :skill_match, :university, :graduation_year, :desired_role, :sort, skills: [])
            .to_h.symbolize_keys
    end
  end
end
