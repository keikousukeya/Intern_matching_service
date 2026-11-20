# 会話の参加者。last_read_at より後に届いた相手のメッセージを未読として扱う
class ConversationParticipant < ApplicationRecord
  belongs_to :conversation
  belongs_to :user

  validates :user_id, uniqueness: { scope: :conversation_id }
end
