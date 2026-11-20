require "rails_helper"

RSpec.describe "Api::Companies", type: :request do
  let(:profile) { create(:company_profile) }

  describe "GET /api/companies/:id" do
    it "ログインしていれば企業プロフィールを見られる（メールアドレスは含まない）" do
      log_in_as(create(:user))
      get "/api/companies/#{profile.user_id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["company"]).to include("company_name" => profile.company_name)
      expect(response.body).not_to include(profile.user.email)
    end

    it "未ログインなら 401" do
      get "/api/companies/#{profile.user_id}"
      expect(response).to have_http_status(:unauthorized)
    end

    it "プロフィール未登録・存在しない ID なら 404" do
      log_in_as(create(:user))

      get "/api/companies/#{create(:user, :company).id}"
      expect(response).to have_http_status(:not_found)

      get "/api/companies/0"
      expect(response).to have_http_status(:not_found)
    end
  end
end
