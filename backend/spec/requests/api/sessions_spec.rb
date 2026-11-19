require "rails_helper"

RSpec.describe "Api::Sessions", type: :request do
  let!(:user) { create(:user, email: "taro@example.com", password: "password123") }

  describe "POST /api/session" do
    it "正しいメールアドレスとパスワードでログインできる" do
      log_in_as(user)

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body.dig("user", "id")).to eq(user.id)
    end

    it "メールアドレスの大文字小文字・前後の空白は区別しない" do
      json_post "/api/session", { session: { email: " TARO@example.com ", password: "password123" } }

      expect(response).to have_http_status(:ok)
    end

    it "パスワードが誤っていれば 401" do
      log_in_as(user, password: "wrong-password")

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["message"]).to eq("メールアドレスまたはパスワードが正しくありません")
    end

    it "存在しないメールアドレスでも同じメッセージを返す（登録有無を推測させない）" do
      json_post "/api/session", { session: { email: "nobody@example.com", password: "password123" } }

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["message"]).to eq("メールアドレスまたはパスワードが正しくありません")
    end

    it "ログインのたびにセッション Cookie を作り直す（セッション固定攻撃対策）" do
      get "/api/health"
      log_in_as(user)
      first_cookie = cookies["_intern_scout_session"]

      log_in_as(user)
      expect(cookies["_intern_scout_session"]).not_to eq(first_cookie)
    end

    it "許可していないオリジンからはログインできない" do
      json_post "/api/session", { session: { email: user.email, password: "password123" } },
                origin: "https://evil.example.com"

      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "DELETE /api/session" do
    it "ログアウトするとログイン中ユーザーを取得できなくなる" do
      log_in_as(user)
      delete "/api/session", headers: json_headers

      expect(response).to have_http_status(:no_content)

      get "/api/me"
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
