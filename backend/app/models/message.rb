# 会話の中の 1 通のメッセージ
class Message < ApplicationRecord
  BODY_MAX_LENGTH = 2000

  belongs_to :conversation
  belongs_to :sender, class_name: "User"
  # 募集に紐づけたスカウト（任意）
  belongs_to :job_posting, optional: true

  # 前後の空白・改行だけを除く（本文中の改行はそのまま残す）
  normalizes :body, with: ->(body) { body.strip }

  validates :body, presence: true, length: { maximum: BODY_MAX_LENGTH }
  validate :sender_must_be_participant
  validate :job_posting_must_be_senders_published

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

  # 紐づけられるのは、送信者（企業）自身の公開中で締切前の募集だけ（インターン生や他社の募集は不可）。
  # 新しく紐づけるときだけ確認する（後で募集を非公開にしても、過去のメッセージは無効にしない）
  def job_posting_must_be_senders_published
    # 存在しない ID が指定された場合（job_posting は nil になる）もエラーにする
    return if job_posting_id.nil? || !will_save_change_to_job_posting_id?

    posting = job_posting
    return if posting && posting.company_id == sender_id && posting.published? && !posting.closed?

    errors.add(:job_posting, :not_available)
  end

  def touch_conversation
    conversation.update_columns(last_message_at: created_at, updated_at: created_at)
    conversation.participants.where(user_id: sender_id).update_all(last_read_at: created_at, updated_at: created_at)
  end
end
