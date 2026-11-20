module Api
  # 企業向け: インターン生プロフィールの一覧・詳細。
  # プロフィールは企業ユーザーにのみ公開する（インターン生同士や未ログインでは見られない）。
  # :id はインターン生のユーザー ID（スカウトの宛先と同じ ID で扱えるようにするため）。
  class StudentsController < ApplicationController
    before_action :require_login!
    before_action -> { require_role!(:company) }

    # GET /api/students?page=1  新着順
    def index
      profiles, meta = paginate(StudentProfile.includes(:skills).newest_first)

      render json: { students: profiles.map { |profile| StudentProfileSerializer.call(profile) }, meta: meta }
    end

    # GET /api/students/:id
    # conversation_id: このインターン生との会話が既にあればその ID（画面で「送信」か「会話を開く」かを切り替える）
    def show
      profile = StudentProfile.includes(:skills).find_by!(user_id: params[:id])
      conversation = Conversation.find_by(company: current_user, student_id: profile.user_id)

      render json: { student: StudentProfileSerializer.call(profile), conversation_id: conversation&.id }
    end
  end
end
