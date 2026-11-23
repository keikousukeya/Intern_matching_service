require "rails_helper"

RSpec.describe "Api::Messages", type: :request do
  let(:conversation) { create(:conversation) }
  let(:path) { "/api/conversations/#{conversation.id}/messages" }

  before { create(:message, conversation: conversation, body: "スカウトです") }

  describe "POST /api/conversations/:conversation_id/messages" do
    it "インターン生は受け取った会話に返信できる" do
      log_in_as(conversation.student)

      expect { json_post path, { message: { body: "ありがとうございます！" } } }.to change(Message, :count).by(1)
      expect(response).to have_http_status(:created)
      expect(response.parsed_body["message"]).to include("sender_id" => conversation.student_id,
                                                         "body" => "ありがとうございます！")
    end

    it "企業も担当者名をつけて、同じ会話に続けて送れる" do
      log_in_as(conversation.company)
      json_post path, { message: { body: "ご都合はいかがでしょうか", sender_name: "高橋 健" } }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["message"]).to include("sender_name" => "高橋 健")
    end

    it "企業が担当者名なしで送ると 422" do
      log_in_as(conversation.company)
      json_post path, { message: { body: "ご都合はいかがでしょうか" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to eq("sender_name" => [ "担当者名を入力してください" ])
    end

    it "本文が空なら 422" do
      log_in_as(conversation.student)
      json_post path, { message: { body: "  " } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to eq("body" => [ "本文を入力してください" ])
    end

    it "当事者以外は送れない（404）" do
      log_in_as(create(:user))
      json_post path, { message: { body: "割り込み" } }
      expect(response).to have_http_status(:not_found)

      log_in_as(create(:user, :company))
      json_post path, { message: { body: "割り込み" } }
      expect(response).to have_http_status(:not_found)
    end

    it "未ログインなら 401" do
      json_post path, { message: { body: "こんにちは" } }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "募集の紐づけ（F-03）" do
    let(:posting) { create(:job_posting, company: conversation.company) }

    it "企業は既存の会話でも自社の募集を紐づけて送れる" do
      log_in_as(conversation.company)
      json_post path, { message: { body: "こちらの募集もご覧ください", sender_name: "高橋 健", job_posting_id: posting.id } }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["message"]["job_posting"]).to include("id" => posting.id)
    end

    it "インターン生は募集を紐づけられない（422）" do
      log_in_as(conversation.student)
      json_post path, { message: { body: "返信です", job_posting_id: posting.id } }

      expect(response).to have_http_status(:unprocessable_content)
    end
  end
end
