require "rails_helper"

RSpec.describe "Api::Articles", type: :request do
  let(:student) { create(:student_profile).user }
  let(:other_student) { create(:student_profile).user }
  let(:company) { create(:company_profile).user }

  describe "GET /api/articles" do
    it "未ログインなら 401" do
      get "/api/articles"
      expect(response).to have_http_status(:unauthorized)
    end

    it "インターン生・企業の公開中の記事を、抜粋・タグ・書いた人つきで取得できる（本文・メールアドレスは含まない）" do
      student_article = create(:article, author: student, skill_names: [ "Ruby" ])
      company_article = create(:article, author: company)
      create(:article, :draft, author: student)
      log_in_as(other_student)

      get "/api/articles"

      expect(response).to have_http_status(:ok)
      body = response.parsed_body
      expect(body["articles"].pluck("id")).to eq([ company_article.id, student_article.id ])
      expect(body["articles"].last).to include(
        "title" => student_article.title, "skills" => [ "Ruby" ], "excerpt" => student_article.excerpt,
        "author" => { "user_id" => student.id, "role" => "student", "name" => student.student_profile.name }
      )
      expect(body["articles"].last).not_to have_key("body")
      expect(response.body).not_to include(student.email)
      expect(body["meta"]).to include("total_count" => 2)
    end

    it "検索条件で絞り込める" do
      target = create(:article, author: company, skill_names: [ "Go" ])
      create(:article, author: student, skill_names: [ "Go" ])
      log_in_as(student)

      get "/api/articles", params: { author_role: "company", skills: [ "go" ] }

      expect(response.parsed_body["articles"].pluck("id")).to eq([ target.id ])
    end
  end

  describe "GET /api/articles/:id" do
    it "公開中の記事は誰でも本文つきで閲覧できる" do
      article = create(:article, author: student)
      log_in_as(company)

      get "/api/articles/#{article.id}"

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body["article"]).to include("id" => article.id, "body" => article.body)
    end

    it "下書きは書いた本人だけが閲覧でき、他のユーザーには 404" do
      article = create(:article, :draft, author: student)

      log_in_as(student)
      get "/api/articles/#{article.id}"
      expect(response).to have_http_status(:ok)

      log_in_as(other_student)
      get "/api/articles/#{article.id}"
      expect(response).to have_http_status(:not_found)

      log_in_as(company)
      get "/api/articles/#{article.id}"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/articles" do
    let(:params) do
      { article: { title: "Rails 8 の新機能", body: "## 概要\n\n本文", status: "published", skill_names: %w[Rails] } }
    end

    it "インターン生も企業も記事を書ける" do
      [ student, company ].each do |user|
        log_in_as(user)
        expect { json_post "/api/articles", params }.to change(user.articles, :count).by(1)
        expect(response).to have_http_status(:created)
        expect(response.parsed_body["article"]).to include("title" => "Rails 8 の新機能", "skills" => [ "Rails" ])
      end
    end

    it "author_id を送っても、ログイン中のユーザーの記事として作成する" do
      log_in_as(student)

      json_post "/api/articles", { article: params[:article].merge(author_id: company.id) }

      expect(Article.last.author).to eq(student)
    end

    it "不正な入力なら 422 と日本語のエラー" do
      log_in_as(student)

      json_post "/api/articles", { article: { title: "", body: "" } }

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]).to include(
        "title" => [ "タイトルを入力してください" ], "body" => [ "本文を入力してください" ]
      )
    end

    it "プロフィール未登録なら 422" do
      log_in_as(create(:user))

      json_post "/api/articles", params

      expect(response).to have_http_status(:unprocessable_content)
      expect(response.parsed_body["errors"]["base"]).to eq([ "プロフィールを登録してから記事を書いてください" ])
    end

    it "許可していないオリジンからは 403（CSRF 対策）" do
      log_in_as(student)

      expect { json_post "/api/articles", params, origin: "https://evil.example.com" }.not_to change(Article, :count)
      expect(response).to have_http_status(:forbidden)
    end
  end

  describe "PUT /api/articles/:id" do
    it "自分の記事を更新でき、下書き↔公開を切り替えられる" do
      article = create(:article, :draft, author: student)
      log_in_as(student)

      json_put "/api/articles/#{article.id}", { article: { status: "published" } }

      expect(response).to have_http_status(:ok)
      expect(article.reload).to be_published
      expect(article.published_at).to be_present
    end

    it "他人の記事は更新できない（404）" do
      article = create(:article, author: student)
      log_in_as(other_student)

      json_put "/api/articles/#{article.id}", { article: { title: "書き換え" } }

      expect(response).to have_http_status(:not_found)
      expect(article.reload.title).not_to eq("書き換え")
    end
  end

  describe "DELETE /api/articles/:id" do
    it "自分の記事を削除でき、他人の記事は 404" do
      article = create(:article, author: company)

      log_in_as(student)
      delete "/api/articles/#{article.id}", headers: json_headers
      expect(response).to have_http_status(:not_found)

      log_in_as(company)
      expect { delete "/api/articles/#{article.id}", headers: json_headers }.to change(Article, :count).by(-1)
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "GET /api/me/articles" do
    it "自分の記事だけを、下書きも含めて更新日時の新しい順に返す" do
      draft = create(:article, :draft, author: student)
      published = create(:article, author: student)
      create(:article, author: other_student)
      draft.touch
      log_in_as(student)

      get "/api/me/articles"

      expect(response.parsed_body["articles"].pluck("id")).to eq([ draft.id, published.id ])
    end
  end
end
