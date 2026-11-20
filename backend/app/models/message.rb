# 会話の中の 1 通のメッセージ
class Message < ApplicationRecord
  BODY_MAX_LENGTH = 2000

  belongs_to :conversation
  belongs_to :sender, class_name: "User"

  # 前後の空白・改行だけを除く（本文中の改行はそのまま残す）
  normalizes :body, with: ->(body) { body.strip }

  validates :body, presence: true, length: { maximum: BODY_MAX_LENGTH }
  validate :sender_must_be_participant

  # 古い順（同時刻は ID 順）
  scope :chronological, -> { order(:created_at, :id) }

  # user が参加している会話のうち、user にとって未読のメッセージ
  # （相手が送ったもので、user の既読位置より後のもの）
  scope :unread_for, lambda { |user|
    joins(conversation: :participants)
      .where(conversation_participants: { user_id: user.id })
      .where.not(sender_id: user.id)
      .where("conversation_participants.last_read_at IS NULL OR messages.created_at > conversation_participants.last_read_at")
  }

  # 送信したら、会話の並び順を更新し、送信者自身は既読にする
  after_create :touch_conversation

  private

  def sender_must_be_participant
    return if conversation.nil? || sender.nil?

    errors.add(:sender, :must_be_participant) unless conversation.participant?(sender)
  end

  def touch_conversation
    conversation.update_columns(last_message_at: created_at, updated_at: created_at)
    conversation.participants.where(user_id: sender_id).update_all(last_read_at: created_at, updated_at: created_at)
  end
end
