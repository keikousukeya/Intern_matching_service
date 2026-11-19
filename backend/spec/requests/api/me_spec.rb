require "rails_helper"

RSpec.describe "Api::Me", type: :request do
  describe "GET /api/me" do
    it "未ログインなら 401" do
      get "/api/me"

      expect(response).to have_http_status(:unauthorized)
    end

    it "ログイン中なら自分の情報を返す" do
      user = create(:user, :company)
      log_in_as(user)

      get "/api/me"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["user"]).to include("id" => user.id, "email" => user.email, "role" => "company")
    end
  end
end
