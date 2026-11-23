module Api
  # 既存の会話へのメッセージ送信（POST /api/conversations/:conversation_id/messages）。
  # 企業・インターン生のどちらも、参加している会話にだけ送れる（インターン生はこれが「返信」になる）。
  # 企業は job_posting_id で自社の公開中の募集を紐づけられる（インターン生が指定すると 422）。
  # 企業は sender_name（担当者名）が必須。インターン生が送っても保存しない。
  class MessagesController < ApplicationController
    before_action :require_login!

    def create
      conversation = current_user.conversations.find(params[:conversation_id])
      attributes = params.expect(message: %i[body sender_name job_posting_id])
      message = conversation.messages.build(sender: current_user, body: attributes[:body], sender_name: attributes[:sender_name],
                                            job_posting_id: attributes[:job_posting_id].presence)

      if message.save
        render json: { message: MessageSerializer.call(message) }, status: :created
      else
        render_validation_errors(message)
      end
    end
  end
end
