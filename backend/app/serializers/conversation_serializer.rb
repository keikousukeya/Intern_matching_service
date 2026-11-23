# 会話の JSON 表現（一覧・詳細で共通）。
# 相手の表示に必要な最小限の項目だけを返し、メールアドレスは含めない。
# company.company_profile / student.student_profile は includes 済みのものを使う（N+1 を避ける）。
class ConversationSerializer
  PREVIEW_LENGTH = 100

  # unread_count: 閲覧者にとっての未読件数 / last_message: 一覧で表示する最新メッセージ
  def self.call(conversation, unread_count:, last_message: nil)
    company_profile = conversation.company.company_profile
    student_profile = conversation.student.student_profile

    {
      "id" => conversation.id,
      "last_message_at" => conversation.last_message_at,
      "unread_count" => unread_count,
      # プロフィールが無い場合も画面が壊れないよう、ユーザー ID だけは返す
      "company" => {
        "user_id" => conversation.company_id,
        "company_name" => company_profile&.company_name
      },
      "student" => {
        "user_id" => conversation.student_id,
        "name" => student_profile&.name,
        "university" => student_profile&.university
      },
      "last_message" => last_message && MessageSerializer.call(last_message).merge(
        "body" => last_message.body.truncate(PREVIEW_LENGTH)
      )
    }
  end
end
