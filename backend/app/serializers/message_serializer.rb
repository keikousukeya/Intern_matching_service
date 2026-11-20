# メッセージの JSON 表現。誰が送ったかは sender_id で判別する（自分の ID と比べて表示を分ける）
class MessageSerializer
  ATTRIBUTES = %i[id conversation_id sender_id body created_at].freeze

  def self.call(message)
    message.slice(*ATTRIBUTES)
  end
end
