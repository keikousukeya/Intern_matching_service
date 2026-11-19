require "rails_helper"

RSpec.describe "Api::MyProfiles", type: :request do
  let(:student_params) do
    {
      name: "山田 花子", university: "東都大学", faculty: "工学部", graduation_year: Time.current.year + 2,
      desired_role: "フロントエンドエンジニア", bio: "React が得意です。",
      portfolio_url: "https://example.com", available_from: "2027-04-01", available_to: "2027-09-30",
      skill_names: [ "React", "TypeScript" ]
    }
  end

  describe "GET /api/me/profile" do
    it "未ログインなら 401" do
      get "/api/me/profile"
      expect(response).to have_http_status(:unauthorized)
    end

    it "未登録なら profile は null" do
      log_in_as(create(:user))
      get "/api/me/profile"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["profile"]).to be_nil
    end

    it "インターン生は自分のプロフィールを取得できる（メールアドレスは含まない）" do
      profile = create(:student_profile, skill_names: [ "Go" ])
      log_in_as(profile.user)
      get "/api/me/profile"

      body = response.parsed_body["profile"]
      expect(body).to include("user_id" => profile.user_id, "name" => profile.name, "skills" => [ "Go" ])
      expect(body).not_to have_key("email")
    end

    it "企業は自分の企業プロフィールを取得できる" do
      profile = create(:company_profile)
      log_in_as(profile.user)
      get "/api/me/profile"

      expect(response.parsed_body["profile"]).to include("company_name" => profile.company_name)
    end
  end

  describe "PUT /api/me/profile" do
    it "未ログインなら 401" do
      json_put "/api/me/profile", { profile: student_params }
      expect(response).to have_http_status(:unauthorized)
    end

    it "許可外のオリジンからは 403" do
      log_in_as(create(:user))
      json_put "/api/me/profile", { profile: student_params }, origin: "https://evil.example.com"

      expect(response).to have_http_status(:forbidden)
    end

    context "インターン生" do
      let(:user) { create(:user) }

      before { log_in_as(user) }

      it "未登録なら作成し、/api/me の has_profile が true になる" do
        expect { json_put "/api/me/profile", { profile: student_params } }.to change(StudentProfile, :count).by(1)

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["profile"]).to include(
          "name" => "山田 花子", "available_from" => "2027-04-01", "skills" => [ "React", "TypeScript" ]
        )
        get "/api/me"
        expect(response.parsed_body["user"]["has_profile"]).to be(true)
      end

      it "登録済みなら更新する（スキルを空にもできる）" do
        create(:student_profile, user: user, skill_names: [ "Go" ])

        expect do
          json_put "/api/me/profile", { profile: student_params.merge(name: "更新後", skill_names: []) }
        end.not_to change(StudentProfile, :count)

        expect(response.parsed_body["profile"]).to include("name" => "更新後", "skills" => [])
      end

      it "入力エラーなら 422 と項目ごとの日本語エラーを返す" do
        json_put "/api/me/profile", { profile: student_params.merge(name: "", portfolio_url: "javascript:alert(1)") }

        expect(response).to have_http_status(:unprocessable_content)
        errors = response.parsed_body["errors"]
        expect(errors["name"]).to eq([ "氏名を入力してください" ])
        expect(errors["portfolio_url"]).to be_present
      end

      it "user_id を送っても他人のプロフィールにはならない" do
        other = create(:user)
        json_put "/api/me/profile", { profile: student_params.merge(user_id: other.id) }

        expect(user.reload.student_profile).to be_present
        expect(other.reload.student_profile).to be_nil
      end
    end

    context "企業" do
      before { log_in_as(create(:user, :company)) }

      it "企業プロフィールを作成できる" do
        json_put "/api/me/profile", { profile: { company_name: "株式会社テスト", contact_name: "担当者" } }

        expect(response).to have_http_status(:ok)
        expect(response.parsed_body["profile"]).to include("company_name" => "株式会社テスト")
      end

      it "学生用の項目は受け付けない（許可した項目が無ければ 400）" do
        json_put "/api/me/profile", { profile: { name: "学生のふり", university: "東都大学" } }

        expect(response).to have_http_status(:bad_request)
        expect(response.parsed_body["message"]).to eq("リクエストの形式が正しくありません")
        expect(StudentProfile.count).to eq(0)
      end

      it "企業名が空なら 422" do
        json_put "/api/me/profile", { profile: { company_name: "", contact_name: "担当者" } }

        expect(response).to have_http_status(:unprocessable_content)
        expect(response.parsed_body["errors"]["company_name"]).to eq([ "企業名を入力してください" ])
      end
    end
  end
end
