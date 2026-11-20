require "rails_helper"

RSpec.describe Conversation, type: :model do
  let(:company) { create(:user, :company) }
  let(:student) { create(:user) }

  it "企業とインターン生の組み合わせなら有効" do
    expect(build(:conversation, company: company, student: student)).to be_valid
  end

  it "ロールが逆なら日本語のエラーになる" do
    conversation = build(:conversation, company: student, student: company)

    expect(conversation).not_to be_valid
    expect(conversation.errors.full_messages).to include(
      "企業は企業アカウントである必要があります", "インターン生はインターン生アカウントである必要があります"
    )
  end

  it "同じ企業×インターン生の会話は 2 件作れない" do
    create(:conversation, company: company, student: student)

    expect(build(:conversation, company: company, student: student)).not_to be_valid
  end

  describe ".find_or_start!" do
    it "無ければ両者を参加者として作る" do
      conversation = described_class.find_or_start!(company: company, student: student)

      expect(conversation).to be_persisted
      expect(conversation.participants.map(&:user)).to contain_exactly(company, student)
    end

    it "既にあれば同じ会話を返す" do
      existing = create(:conversation, company: company, student: student)

      expect { described_class.find_or_start!(company: company, student: student) }.not_to change(described_class, :count)
      expect(described_class.find_or_start!(company: company, student: student)).to eq(existing)
    end
  end

  describe "未読の管理" do
    let(:conversation) { create(:conversation, company: company, student: student) }

    it "相手のメッセージは未読、自分のメッセージは未読に数えない" do
      create(:message, conversation: conversation, sender: company)
      create(:message, conversation: conversation, sender: company)

      expect(described_class.unread_counts_for(student)).to eq(conversation.id => 2)
      expect(described_class.unread_counts_for(company)).to eq({})
    end

    it "既読にすると未読が 0 になり、その後に届いたものだけ未読になる" do
      create(:message, conversation: conversation, sender: company)
      conversation.mark_as_read!(student)
      expect(described_class.unread_counts_for(student)).to eq({})

      travel 1.minute do
        create(:message, conversation: conversation, sender: company)
      end
      expect(described_class.unread_counts_for(student)).to eq(conversation.id => 1)
    end

    it "返信すると、それまでの相手のメッセージは既読になる" do
      create(:message, conversation: conversation, sender: company)
      travel 1.minute do
        create(:message, conversation: conversation, sender: student)
      end

      expect(described_class.unread_counts_for(student)).to eq({})
      expect(described_class.unread_counts_for(company)).to eq(conversation.id => 1)
    end
  end

  describe ".recent_first" do
    it "最後のメッセージが新しい順に並び、メッセージの無い会話は最後になる" do
      empty = create(:conversation)
      older = create(:conversation)
      newer = create(:conversation)
      travel_to(2.hours.ago) { create(:message, conversation: older) }
      travel_to(1.hour.ago) { create(:message, conversation: newer) }

      expect(described_class.recent_first.to_a).to eq([ newer, older, empty ])
    end
  end

  describe ".last_messages_for" do
    it "会話ごとの最新メッセージを返す" do
      conversation = create(:conversation)
      create(:message, conversation: conversation, body: "1 通目")
      last = create(:message, conversation: conversation, body: "2 通目")

      expect(described_class.last_messages_for([ conversation.id ])).to eq(conversation.id => last)
    end
  end
end
