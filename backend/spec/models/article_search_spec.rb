require "rails_helper"

RSpec.describe ArticleSearch, type: :model do
  def search(**params)
    described_class.new(**params).results
  end

  it "条件なしなら公開中の記事を新着順で返す（下書きは含めない）" do
    older = create(:article)
    newer = create(:article)
    create(:article, :draft)
    older.update_columns(published_at: 2.days.ago)

    expect(search).to eq([ newer, older ])
  end

  describe "キーワード" do
    it "タイトル・本文・タグ名・書いた人の名前（氏名・企業名）の部分一致で探せる" do
      by_title = create(:article, title: "Hotwire 入門")
      by_body = create(:article, body: "Hotwire を試した")
      by_tag = create(:article, skill_names: [ "Hotwire" ])
      company = create(:company_profile, company_name: "株式会社ホットワイヤ").user
      by_company = create(:article, author: company)
      create(:article)

      expect(search(q: "hotwire")).to contain_exactly(by_title, by_body, by_tag)
      expect(search(q: "ホットワイヤ")).to eq([ by_company ])
    end

    it "スペース（全角も可）で区切った語はすべてを含む記事に絞り込む" do
      both = create(:article, title: "Rails と React")
      create(:article, title: "Rails だけ")

      expect(search(q: "Rails　React")).to eq([ both ])
    end

    it "% や _ はワイルドカードとして扱わない" do
      percent = create(:article, title: "カバレッジ 100%")
      create(:article, title: "カバレッジ 100")

      expect(search(q: "100%")).to eq([ percent ])
    end
  end

  describe "タグ" do
    let!(:both) { create(:article, skill_names: %w[Ruby Docker]) }
    let!(:ruby_only) { create(:article, skill_names: %w[Ruby]) }

    before { create(:article, skill_names: %w[Go]) }

    it "all（既定）はすべてのタグを持つ記事、any はいずれかを持つ記事" do
      expect(search(skills: %w[ruby docker])).to eq([ both ])
      expect(search(skills: %w[ruby docker], skill_match: "any")).to contain_exactly(both, ruby_only)
    end
  end

  describe "書いた人" do
    it "区分（インターン生・企業）と書いた人で絞り込める" do
      student_article = create(:article)
      company_article = create(:article, :by_company)

      expect(search(author_role: "student")).to eq([ student_article ])
      expect(search(author_role: "company")).to eq([ company_article ])
      expect(search(author_id: company_article.author_id.to_s)).to eq([ company_article ])
    end

    it "不正な区分・ID は指定なしとして扱う" do
      create(:article)

      expect(search(author_role: "admin", author_id: "abc").size).to eq(1)
    end
  end
end
