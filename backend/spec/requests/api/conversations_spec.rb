require "rails_helper"

RSpec.describe "Api::Conversations", type: :request do
  let(:company) { create(:company_profile).user }
  let(:student) { create(:student_profile).user }
  let(:outsider) { create(:student_profile).user }

  describe "POST /api/conversations" do
    let(:params) { { conversation: { student_id: student.id, body: "はじめまして。ぜひお話ししませんか？" } } }

    it "企業はインターン生にメッセージを送れる（会話と参加者が作られる）" do
      log_in_as(company)

      expect { json_post "/api/conversations", params }
        .to change(Conversation, :count).by(1).and change(Message, :count).by(1)

      expect(response).to have_http_status(:created)
      body = response.parsed_body
      expect(body["message"]).to include("sender_id" => company.id, "body" => "はじめまして。ぜひお話ししませんか？")
      expect(body["conversation"]["student"]).to include("user_id" => student.id, "name" => student.student_profile.name)
      expect(Conversation.last.participants.map(&:user)).to contain_exactly(company, student)
    end

    it "同じインターン生への 2 通目は、既存の会話に追加される（1 スレッド）" do
      log_in_as(company)
      json_post "/api/conversations", params

      expect { json_post "/api/conversations", params }
        .to change(Message, :count).by(1).and not_change(Conversation, :count)
      expect(response).to have_http_status(:created)
    end

    it "本文が空なら 422 で、会話も作られない" do
      log_in_as(company)

      expect { json_post "/api/conversations", { conversation: { student_id: student.id, body: "" } } }
        .not_to change(Conversation, :count)
      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to eq("body" => [ "本文を入力してください" ])
    end

    it "インターン生は新しい会話を始められない（403）" do
      log_in_as(outsider)
      json_post "/api/conversations", params

      expect(response).to have_http_status(:forbidden)
    end

    it "企業プロフィール未登録の企業は送れない（403）" do
      log_in_as(create(:user, :company))
      json_post "/api/conversations", params

      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["message"]).to include("企業プロフィールを登録")
    end

    it "宛先がプロフィール未登録・企業ユーザーなら 404" do
      log_in_as(company)

      json_post "/api/conversations", { conversation: { student_id: create(:user).id, body: "こんにちは" } }
      expect(response).to have_http_status(:not_found)

      json_post "/api/conversations", { conversation: { student_id: company.id, body: "こんにちは" } }
      expect(response).to have_http_status(:not_found)
    end

    it "未ログインなら 401、許可外のオリジンなら 403" do
      json_post "/api/conversations", params
      expect(response).to have_http_status(:unauthorized)

      log_in_as(company)
      json_post "/api/conversations", params, origin: "https://evil.example.com"
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "GET /api/conversations" do
    it "自分が参加している会話だけを、新しいメッセージ順に未読数つきで返す" do
      older = create(:conversation, company: company)
      newer = create(:conversation, company: company)
      create(:conversation) # 他の企業の会話は含まれない
      travel_to(2.hours.ago) { create(:message, conversation: older, body: "古い会話") }
      travel_to(1.hour.ago) do
        create(:message, conversation: newer, sender: newer.student, body: "学生からの返信")
      end
      log_in_as(company)

      get "/api/conversations"

      expect(response).to have_http_status(:ok)
      conversations = response.parsed_body["conversations"]
      expect(conversations.pluck("id")).to eq([ newer.id, older.id ])
      expect(conversations.first["unread_count"]).to eq(1)
      expect(conversations.first["last_message"]).to include("body" => "学生からの返信", "sender_id" => newer.student_id)
      expect(conversations.last["unread_count"]).to eq(0)
      expect(response.parsed_body["meta"]).to include("total_count" => 2)
    end

    it "インターン生は自分宛ての会話を、企業名つきで受信一覧として見られる（メールアドレスは含まない）" do
      conversation = create(:conversation, company: company, student: student)
      create(:message, conversation: conversation)
      log_in_as(student)

      get "/api/conversations"

      received = response.parsed_body["conversations"].sole
      expect(received["company"]).to include("company_name" => company.company_profile.company_name)
      expect(received["unread_count"]).to eq(1)
      expect(response.body).not_to include(company.email, student.email)
    end

    it "未ログインなら 401" do
      get "/api/conversations"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/conversations/unread_count" do
    it "自分宛ての未読メッセージの合計を返す" do
      2.times { create(:message, conversation: create(:conversation, student: student)) }
      log_in_as(student)

      get "/api/conversations/unread_count"

      expect(response.parsed_body).to eq("unread_count" => 2)
    end
  end

  describe "GET /api/conversations/:id" do
    let(:conversation) { create(:conversation, company: company, student: student) }

    before do
      create(:message, conversation: conversation, body: "1 通目")
      travel_to(1.minute.from_now) { create(:message, conversation: conversation, sender: student, body: "2 通目") }
    end

    it "参加者はメッセージを古い順に見られる" do
      log_in_as(student)
      get "/api/conversations/#{conversation.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["messages"].pluck("body")).to eq([ "1 通目", "2 通目" ])
      expect(response.parsed_body["has_older"]).to be(false)
    end

    it "閲覧しただけでは既読にならない（既読化は PUT /read で行う）" do
      log_in_as(company)
      get "/api/conversations/#{conversation.id}"

      expect(response.parsed_body["conversation"]["unread_count"]).to eq(1)
      expect(Conversation.unread_counts_for(company)).to eq(conversation.id => 1)
    end

    it "当事者以外は閲覧できない（存在も分からないよう 404）" do
      log_in_as(outsider)
      get "/api/conversations/#{conversation.id}"
      expect(response).to have_http_status(:not_found)

      log_in_as(create(:company_profile).user)
      get "/api/conversations/#{conversation.id}"
      expect(response).to have_http_status(:not_found)
    end

    it "メッセージが多い場合は新しい 100 件を返し、has_older で知らせる" do
      create_list(:message, 100, conversation: conversation)
      log_in_as(company)

      get "/api/conversations/#{conversation.id}"

      expect(response.parsed_body["messages"].size).to eq(100)
      expect(response.parsed_body["messages"].pluck("body")).not_to include("1 通目")
      expect(response.parsed_body["has_older"]).to be(true)
    end
  end

  describe "PUT /api/conversations/:id/read" do
    let(:conversation) { create(:conversation, company: company, student: student) }

    before { create(:message, conversation: conversation) }

    it "参加者は既読にできる" do
      log_in_as(student)

      expect { json_put "/api/conversations/#{conversation.id}/read" }
        .to change { Conversation.unread_counts_for(student) }.from(conversation.id => 1).to({})
      expect(response).to have_http_status(:no_content)
    end

    it "当事者以外は既読にできない（404）" do
      log_in_as(outsider)
      json_put "/api/conversations/#{conversation.id}/read"

      expect(response).to have_http_status(:not_found)
    end
  end

  describe "募集に紐づけたスカウト（F-03）" do
    let(:posting) { create(:job_posting, company: company, title: "Rails インターン") }
    let(:params) { { conversation: { student_id: student.id, body: "この募集にご興味はありますか？", job_posting_id: posting.id } } }

    it "自社の公開中の募集を紐づけて送ると、メッセージに募集の要約が入る" do
      log_in_as(company)
      json_post "/api/conversations", params

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["message"]["job_posting"]).to include("id" => posting.id, "title" => "Rails インターン")

      log_in_as(student)
      get "/api/conversations/#{Conversation.last.id}"
      expect(response.parsed_body["messages"].last["job_posting"]).to include("id" => posting.id)

      get "/api/conversations"
      expect(response.parsed_body["conversations"].first["last_message"]["job_posting"]).to include("id" => posting.id)
    end

    it "他社・非公開・締切済み・存在しない募集は紐づけられず 422 で、会話も作られない" do
      log_in_as(company)
      [ create(:job_posting), create(:job_posting, :draft, company: company),
        create(:job_posting, :closed, company: company) ].each do |unavailable|
        expect { json_post "/api/conversations", { conversation: params[:conversation].merge(job_posting_id: unavailable.id) } }
          .not_to change(Conversation, :count)
        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]["job_posting"]).to eq([ "紐づける募集は自社の公開中で締切前の募集を選んでください" ])
      end

      json_post "/api/conversations", { conversation: params[:conversation].merge(job_posting_id: 0) }
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "job_posting_id が空なら紐づけなしで送れる" do
      log_in_as(company)
      json_post "/api/conversations", { conversation: params[:conversation].merge(job_posting_id: "") }

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["message"]["job_posting"]).to be_nil
    end
  end
end
