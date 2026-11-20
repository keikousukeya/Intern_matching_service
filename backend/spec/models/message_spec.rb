require "rails_helper"

RSpec.describe Message, type: :model do
  let(:conversation) { create(:conversation) }

  it "参加者が本文を入力していれば有効" do
    expect(build(:message, conversation: conversation, sender: conversation.student)).to be_valid
  end

  it "本文が空白だけなら日本語のエラーになる" do
    message = build(:message, conversation: conversation, body: " \n ")

    expect(message).not_to be_valid
    expect(message.errors.full_messages).to include("本文を入力してください")
  end

  it "本文は 2000 文字まで" do
    expect(build(:message, conversation: conversation, body: "あ" * 2000)).to be_valid
    expect(build(:message, conversation: conversation, body: "あ" * 2001)).not_to be_valid
  end

  it "前後の空白は除き、本文中の改行は残す" do
    message = create(:message, conversation: conversation, body: "  1 行目\n2 行目\n ")

    expect(message.body).to eq("1 行目\n2 行目")
  end

  it "参加者以外は送信できない" do
    message = build(:message, conversation: conversation, sender: create(:user, :company))

    expect(message).not_to be_valid
    expect(message.errors.full_messages).to include("送信者はこの会話の参加者である必要があります")
  end

  it "送信すると会話の最終メッセージ日時が更新される" do
    message = create(:message, conversation: conversation)

    expect(conversation.reload.last_message_at).to eq(message.created_at)
  end
end
