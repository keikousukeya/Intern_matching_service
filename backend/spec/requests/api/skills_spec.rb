require "rails_helper"

RSpec.describe "Api::Skills", type: :request do
  it "未ログインなら 401" do
    get "/api/skills"
    expect(response).to have_http_status(:unauthorized)
  end

  it "q を指定すると部分一致する候補を返す" do
    %w[React Redux Ruby].each { |name| create(:skill, name: name) }
    log_in_as(create(:user))

    get "/api/skills", params: { q: "re" }

    expect(response.parsed_body["skills"]).to eq(%w[React Redux])
  end

  it "q が無ければよく使われているスキルから返す" do
    create(:student_profile, skill_names: [ "Go" ])
    create(:skill, name: "Ada")
    log_in_as(create(:user))

    get "/api/skills"

    expect(response.parsed_body["skills"]).to eq(%w[Go Ada])
  end
end
