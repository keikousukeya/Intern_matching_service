require "rails_helper"

RSpec.describe "Api::Registrations", type: :request do
  let(:valid_params) do
    { user: { email: "student@example.com", password: "password123",
              password_confirmation: "password123", role: "student" } }
  end

  describe "POST /api/registration" do
    it "学生として登録でき、そのままログイン状態になる" do
      expect { json_post "/api/registration", valid_params }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("user", "role")).to eq("student")

      get "/api/me"
      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "email")).to eq("student@example.com")
    end

    it "企業として登録できる" do
      json_post "/api/registration", valid_params.deep_merge(user: { role: "company" })

      expect(response).to have_http_status(:created)
      expect(response.parsed_body.dig("user", "role")).to eq("company")
    end

    it "レスポンスにパスワードのハッシュを含めない" do
      json_post "/api/registration", valid_params

      expect(response.body).not_to include("password_digest")
    end

    it "入力が不正なら 422 と日本語のエラーを返す" do
      json_post "/api/registration", { user: { email: "bad", password: "short",
                                               password_confirmation: "short", role: "student" } }

      expect(response).to have_http_status(:unprocessable_content)
      errors = response.parsed_body["errors"]
      expect(errors["email"]).to include("メールアドレスは不正な値です")
      expect(errors["password"].first).to include("8文字以上")
    end

    it "登録済みのメールアドレスでは登録できない" do
      create(:user, email: "student@example.com")

      expect { json_post "/api/registration", valid_params }.not_to change(User, :count)
      expect(response).to have_http_status(:unprocessable_content)
    end

    it "admin など未定義のロールでは登録できない" do
      json_post "/api/registration", valid_params.deep_merge(user: { role: "admin" })

      expect(response).to have_http_status(:unprocessable_content)
    end

    it "許可していないオリジンからのリクエストは 403" do
      expect {
        json_post "/api/registration", valid_params, origin: "https://evil.example.com"
      }.not_to change(User, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it "Origin ヘッダーが無いリクエストは 403" do
      post "/api/registration", params: valid_params.to_json,
                                headers: { "Content-Type" => "application/json" }

      expect(response).to have_http_status(:forbidden)
    end
  end
end
