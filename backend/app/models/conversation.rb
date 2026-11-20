# 会話（スレッド）。企業×インターン生の組み合わせにつき 1 件。
# 閲覧・投稿できるのは参加者（participants）だけで、既読位置も参加者ごとに管理する。
class Conversation < ApplicationRecord
  belongs_to :company, class_name: "User"
  belongs_to :student, class_name: "User"
  has_many :participants, class_name: "ConversationParticipant", dependent: :destroy
  has_many :messages, dependent: :destroy

  validates :student_id, uniqueness: { scope: :company_id }
  validate :roles_must_match

  # 新しいメッセージがある順（メッセージが無いものは最後）
  scope :recent_first, -> { order(Arel.sql("last_message_at DESC NULLS LAST"), id: :desc) }

  # 企業とインターン生の会話を返す。無ければ参加者ごと作る。
  # 同時に作成されて一意制約に引っかかった場合は、先にできた方を返す。
  def self.find_or_start!(company:, student:)
    find_by(company: company, student: student) || transaction(requires_new: true) do
      create!(company: company, student: student) do |conversation|
        conversation.participants.build(user: company)
        conversation.participants.build(user: student)
      end
    end
  rescue ActiveRecord::RecordNotUnique
    find_by!(company: company, student: student)
  end

  # 会話ごとの未読件数 { conversation_id => 件数 }（未読が無い会話は含まない）。
  # 一覧で会話ごとに数えると N+1 になるため、1 回の SQL でまとめて数える。
  def self.unread_counts_for(user, conversation_ids = nil)
    scope = Message.unread_for(user)
    scope = scope.where(conversation_id: conversation_ids) if conversation_ids
    scope.group(:conversation_id).count
  end

  # 会話ごとの最新メッセージ { conversation_id => Message }（1 回の SQL で取得）
  def self.last_messages_for(conversation_ids)
    latest_ids = Message.where(conversation_id: conversation_ids).group(:conversation_id).select("MAX(messages.id)")
    Message.where(id: latest_ids).index_by(&:conversation_id)
  end

  def participant?(user)
    user.present? && participants.exists?(user_id: user.id)
  end

  # 指定したユーザーの既読位置を現在時刻にする
  def mark_as_read!(user)
    participants.find_by!(user: user).update!(last_read_at: Time.current)
  end

  private

  def roles_must_match
    errors.add(:company, :must_be_company) if company && !company.company?
    errors.add(:student, :must_be_student) if student && !student.student?
  end
end
