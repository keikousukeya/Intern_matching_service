module Api
  # 会話（スレッド）の一覧・詳細・作成・既読化。
  # 会話は必ず current_user.conversations から探すため、参加者以外は存在の有無も分からない（404）。
  class ConversationsController < ApplicationController
    # 詳細で返すメッセージの上限（古いものは省略し has_older で知らせる）
    MESSAGES_LIMIT = 100

    before_action :require_login!
    # 新しい会話を始められるのは企業だけ（インターン生は届いた会話への返信のみ）
    before_action -> { require_role!(:company) }, only: :create
    before_action :require_company_profile!, only: :create

    # GET /api/conversations?page=1  新しいメッセージがある順
    def index
      conversations, meta = paginate(
        current_user.conversations.includes(company: :company_profile, student: :student_profile).recent_first
      )
      ids = conversations.map(&:id)
      unread_counts = Conversation.unread_counts_for(current_user, ids)
      last_messages = Conversation.last_messages_for(ids)

      render json: {
        conversations: conversations.map do |conversation|
          ConversationSerializer.call(conversation, unread_count: unread_counts.fetch(conversation.id, 0),
                                                    last_message: last_messages[conversation.id])
        end,
        meta: meta
      }
    end

    # GET /api/conversations/unread_count  ヘッダーのバッジ表示用（未読メッセージの合計）
    def unread_count
      render json: { unread_count: Message.unread_for(current_user).count }
    end

    # GET /api/conversations/:id  会話とメッセージ（古い順）。既読にはしない（PUT /read で行う）
    def show
      conversation = find_conversation
      latest = conversation.messages.includes(:job_posting).order(created_at: :desc, id: :desc)
                           .limit(MESSAGES_LIMIT + 1).to_a
      has_older = latest.size > MESSAGES_LIMIT

      render json: {
        conversation: serialize(conversation),
        messages: latest.first(MESSAGES_LIMIT).reverse.map { |message| MessageSerializer.call(message) },
        has_older: has_older
      }
    end

    # POST /api/conversations  企業がインターン生にメッセージを送る。
    # 同じインターン生との会話が既にあれば、その会話にメッセージを追加する（企業×インターン生で 1 スレッド）。
    # job_posting_id を指定すると、自社の公開中の募集を紐づけたスカウトになる（任意）。
    # sender_name（担当者名）は必須。
    def create
      student = StudentProfile.find_by!(user_id: conversation_params[:student_id]).user
      message = nil

      ActiveRecord::Base.transaction do
        conversation = Conversation.find_or_start!(company: current_user, student: student)
        message = conversation.messages.build(sender: current_user, body: conversation_params[:body],
                                              sender_name: conversation_params[:sender_name],
                                              job_posting_id: conversation_params[:job_posting_id].presence)
        # 本文が不正なら、作ったばかりの会話も残さない
        raise ActiveRecord::Rollback unless message.save
      end

      if message.persisted?
        render json: { conversation: serialize(message.conversation), message: MessageSerializer.call(message) },
               status: :created
      else
        render_validation_errors(message)
      end
    end

    # PUT /api/conversations/:id/read  自分の既読位置を現在時刻にする
    def read
      find_conversation.mark_as_read!(current_user)
      head :no_content
    end

    private

    def find_conversation
      current_user.conversations.includes(company: :company_profile, student: :student_profile).find(params[:id])
    end

    def serialize(conversation)
      unread_count = Conversation.unread_counts_for(current_user, [ conversation.id ]).fetch(conversation.id, 0)
      ConversationSerializer.call(conversation, unread_count: unread_count)
    end

    def conversation_params
      params.expect(conversation: %i[student_id body sender_name job_posting_id])
    end

    # 送信者としてインターン生に企業名を表示するため、企業プロフィールの登録を必須にする
    def require_company_profile!
      return if current_user.company_profile.present?

      render json: { message: "企業プロフィールを登録してからメッセージを送ってください" }, status: :forbidden
    end
  end
end
