# メッセージの JSON 表現。誰が送ったかは sender_id で判別する（自分の ID と比べて表示を分ける）。
# sender_name は企業が送ったメッセージの担当者名（インターン生のメッセージでは null）。
# job_posting は募集に紐づけたスカウトのときだけ入る（includes(:job_posting) 済みのものを使う）
class MessageSerializer
  ATTRIBUTES = %i[id conversation_id sender_id sender_name body created_at].freeze

  def self.call(message)
    message.slice(*ATTRIBUTES).merge("job_posting" => JobPostingSerializer.summary(message.job_posting))
  end
end
