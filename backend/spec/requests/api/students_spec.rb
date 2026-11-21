require "rails_helper"

RSpec.describe "Api::Students", type: :request do
  let(:company) { create(:user, :company) }

  describe "GET /api/students" do
    it "未ログインなら 401" do
      get "/api/students"
      expect(response).to have_http_status(:unauthorized)
    end

    it "インターン生は閲覧できない（403）" do
      log_in_as(create(:user))
      get "/api/students"

      expect(response).to have_http_status(:forbidden)
    end

    it "企業は新着順の一覧を取得できる（メールアドレスは含まない）" do
      older = create(:student_profile, created_at: 2.days.ago, skill_names: [ "Ruby" ])
      newer = create(:student_profile, created_at: 1.day.ago)
      log_in_as(company)

      get "/api/students"

      expect(response).to have_http_status(:ok)
      students = response.parsed_body["students"]
      expect(students.pluck("user_id")).to eq([ newer.user_id, older.user_id ])
      expect(students.last["skills"]).to eq([ "Ruby" ])
      expect(response.body).not_to include(older.user.email)
    end

    it "20 件ずつページ分けして返す" do
      create_list(:student_profile, 21)
      log_in_as(company)

      get "/api/students", params: { page: 2 }

      expect(response.parsed_body["students"].size).to eq(1)
      expect(response.parsed_body["meta"]).to eq(
        "page" => 2, "per_page" => 20, "total_count" => 21, "total_pages" => 2
      )
    end

    it "検索条件で絞り込み、件数とページ情報も絞り込み後の値になる" do
      target = create(:student_profile, university: "東都大学", skill_names: [ "Ruby", "React" ])
      create(:student_profile, university: "東都大学", skill_names: [ "Ruby" ])
      create(:student_profile, university: "西京大学", skill_names: [ "Ruby", "React" ])
      log_in_as(company)

      get "/api/students", params: { university: "東都", skills: [ "ruby", "react" ], skill_match: "all" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["students"].pluck("user_id")).to eq([ target.user_id ])
      expect(response.parsed_body["meta"]).to include("total_count" => 1, "total_pages" => 1)
    end

    it "skill_match=any ならいずれかのスキルを持つ人を返す" do
      create(:student_profile, skill_names: [ "Ruby" ])
      create(:student_profile, skill_names: [ "Go" ])
      create(:student_profile, skill_names: [ "PHP" ])
      log_in_as(company)

      get "/api/students", params: { skills: [ "Ruby", "Go" ], skill_match: "any" }

      expect(response.parsed_body["meta"]["total_count"]).to eq(2)
    end

    it "sort=updated なら更新順で返す" do
      updated = create(:student_profile, created_at: 2.days.ago, updated_at: 1.minute.ago)
      newer = create(:student_profile, created_at: 1.day.ago, updated_at: 1.day.ago)
      log_in_as(company)

      get "/api/students", params: { sort: "updated" }

      expect(response.parsed_body["students"].pluck("user_id")).to eq([ updated.user_id, newer.user_id ])
    end

    it "型が違う検索条件（q に配列、skills に文字列）は無視する" do
      create(:student_profile)
      log_in_as(company)

      get "/api/students", params: { q: [ "a" ], skills: "Ruby" }

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["meta"]["total_count"]).to eq(1)
    end

    it "不正なページ番号は 1 ページ目として扱う" do
      log_in_as(company)
      get "/api/students", params: { page: "abc" }

      expect(response.parsed_body["meta"]).to include("page" => 1, "total_pages" => 1)
    end
  end

  describe "GET /api/students/:id" do
    let(:profile) { create(:student_profile, skill_names: [ "Go" ]) }

    it "企業はユーザー ID で詳細を取得できる" do
      log_in_as(company)
      get "/api/students/#{profile.user_id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["student"]).to include("name" => profile.name, "skills" => [ "Go" ])
      expect(response.parsed_body["student"]).not_to have_key("email")
    end

    it "このインターン生との会話があれば conversation_id を返す（無ければ nil）" do
      log_in_as(company)
      get "/api/students/#{profile.user_id}"
      expect(response.parsed_body["conversation_id"]).to be_nil

      conversation = create(:conversation, company: company, student: profile.user)
      get "/api/students/#{profile.user_id}"
      expect(response.parsed_body["conversation_id"]).to eq(conversation.id)
    end

    it "インターン生は他の学生の詳細を閲覧できない（403）" do
      log_in_as(create(:user))
      get "/api/students/#{profile.user_id}"

      expect(response).to have_http_status(:forbidden)
    end

    it "プロフィール未登録・存在しない ID なら 404" do
      log_in_as(company)

      get "/api/students/#{create(:user).id}"
      expect(response).to have_http_status(:not_found)

      get "/api/students/0"
      expect(response).to have_http_status(:not_found)
    end
  end
end
