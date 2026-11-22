require "rails_helper"

RSpec.describe "Api::JobPostings", type: :request do
  let(:company) { create(:company_profile).user }
  let(:other_company) { create(:company_profile).user }
  let(:student) { create(:user) }

  describe "GET /api/job_postings" do
    it "未ログインなら 401" do
      get "/api/job_postings"
      expect(response).to have_http_status(:unauthorized)
    end

    it "インターン生は公開中で締切前の募集を、企業名・必要スキルつきで取得できる" do
      posting = create(:job_posting, company: company, skill_names: [ "Ruby" ])
      create(:job_posting, :draft, company: company)
      create(:job_posting, :closed)
      log_in_as(student)

      get "/api/job_postings"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["job_postings"].pluck("id")).to eq([ posting.id ])
      expect(body["job_postings"].first).to include(
        "title" => posting.title, "work_style" => "remote", "skills" => [ "Ruby" ], "closed" => false,
        "company" => { "user_id" => company.id, "company_name" => company.company_profile.company_name }
      )
      expect(body["meta"]).to include("total_count" => 1)
    end

    it "企業も他社の公開中の募集を閲覧できる" do
      create(:job_posting, company: other_company)
      log_in_as(company)

      get "/api/job_postings"

      expect(response.parsed_body["meta"]["total_count"]).to eq(1)
    end

    it "検索条件で絞り込める" do
      target = create(:job_posting, work_style: :onsite, skill_names: [ "Go" ])
      create(:job_posting, work_style: :remote, skill_names: [ "Go" ])
      log_in_as(student)

      get "/api/job_postings", params: { work_style: "onsite", skills: [ "go" ], sort: "deadline" }

      expect(response.parsed_body["job_postings"].pluck("id")).to eq([ target.id ])
    end
  end

  describe "GET /api/job_postings/:id" do
    it "公開中の募集は誰でも閲覧でき、締切済みなら closed が true" do
      posting = create(:job_posting, :closed)
      log_in_as(student)

      get "/api/job_postings/#{posting.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["job_posting"]).to include("id" => posting.id, "closed" => true)
    end

    it "非公開の募集は作成した企業だけが閲覧でき、他のユーザーには 404" do
      posting = create(:job_posting, :draft, company: company)

      log_in_as(company)
      get "/api/job_postings/#{posting.id}"
      expect(response).to have_http_status(:ok)

      log_in_as(other_company)
      get "/api/job_postings/#{posting.id}"
      expect(response).to have_http_status(:not_found)

      log_in_as(student)
      get "/api/job_postings/#{posting.id}"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/job_postings" do
    let(:params) do
      { job_posting: { title: "Rails インターン", description: "API 開発を担当します", work_style: "hybrid",
                       compensation: "時給 1,500 円", headcount: "2", starts_on: "2027-04-01", ends_on: "2027-09-30",
                       deadline: 1.month.from_now.to_date.to_s, status: "published", skill_names: [ "Ruby", "Rails" ] } }
    end

    it "企業は募集を作成できる" do
      log_in_as(company)

      expect { json_post "/api/job_postings", params }.to change(company.job_postings, :count).by(1)

      expect(response).to have_http_status(:created)
      expect(response.parsed_body["job_posting"]).to include(
        "title" => "Rails インターン", "work_style" => "hybrid", "headcount" => 2, "status" => "published",
        "skills" => [ "Ruby", "Rails" ]
      )
      expect(response.parsed_body["job_posting"]["published_at"]).to be_present
    end

    it "入力が不正なら 422 で日本語のエラーを返す" do
      log_in_as(company)

      json_post "/api/job_postings", { job_posting: { title: "", description: "", work_style: "onsite" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include(
        "title" => [ "タイトルを入力してください" ], "description" => [ "業務内容を入力してください" ]
      )
    end

    it "企業プロフィール未登録なら 422" do
      log_in_as(create(:user, :company))

      json_post "/api/job_postings", params

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]["company"]).to eq([ "企業プロフィールを登録してから募集を作成してください" ])
    end

    it "インターン生は作成できない（403）" do
      log_in_as(create(:student_profile).user)

      expect { json_post "/api/job_postings", params }.not_to change(JobPosting, :count)
      expect(response).to have_http_status(:forbidden)
    end

    it "company_id を送っても、ログイン中の企業の募集として作られる" do
      log_in_as(company)

      json_post "/api/job_postings", { job_posting: params[:job_posting].merge(company_id: other_company.id) }

      expect(JobPosting.last.company).to eq(company)
    end
  end

  describe "PUT /api/job_postings/:id" do
    let(:posting) { create(:job_posting, company: company) }

    it "自社の募集を更新でき、status で公開・非公開を切り替えられる" do
      log_in_as(company)

      json_put "/api/job_postings/#{posting.id}", { job_posting: { title: "新しいタイトル", status: "draft" } }

      expect(response).to have_http_status(:ok)
      expect(posting.reload).to have_attributes(title: "新しいタイトル", status: "draft")
    end

    it "他社の募集は更新できない（404）" do
      log_in_as(other_company)

      json_put "/api/job_postings/#{posting.id}", { job_posting: { title: "乗っ取り" } }

      expect(response).to have_http_status(:not_found)
      expect(posting.reload.title).not_to eq("乗っ取り")
    end
  end

  describe "DELETE /api/job_postings/:id" do
    let!(:posting) { create(:job_posting, company: company) }

    it "自社の募集を削除できる" do
      log_in_as(company)

      expect { delete "/api/job_postings/#{posting.id}", headers: json_headers }.to change(JobPosting, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end

    it "他社の募集は削除できない（404）" do
      log_in_as(other_company)

      expect { delete "/api/job_postings/#{posting.id}", headers: json_headers }.not_to change(JobPosting, :count)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/me/job_postings" do
    it "自社の募集を非公開・締切済みも含めて返し、他社の募集は含めない" do
      mine = [ create(:job_posting, company: company), create(:job_posting, :draft, company: company),
               create(:job_posting, :closed, company: company) ]
      create(:job_posting, company: other_company)
      log_in_as(company)

      get "/api/me/job_postings"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["job_postings"].pluck("id")).to match_array(mine.map(&:id))
    end

    it "インターン生は利用できない（403）" do
      log_in_as(student)
      get "/api/me/job_postings"

      expect(response).to have_http_status(:forbidden)
    end
  end
end
