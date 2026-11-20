module Api
  # 既存の会話へのメッセージ送信（POST /api/conversations/:conversation_id/messages）。
  # 企業・インターン生のどちらも、参加している会話にだけ送れる（インターン生はこれが「返信」になる）。
  class MessagesController < ApplicationController
    before_action :require_login!

    def create
      conversation = current_user.conversations.find(params[:conversation_id])
      message = conversation.messages.build(sender: current_user, body: params.expect(message: [ :body ])[:body])

      if message.save
        render json: { message: MessageSerializer.call(message) }, status: :created
      else
        render_validation_errors(message)
      end
    end
  end
end
