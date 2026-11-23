require "rails_helper"

RSpec.describe Article, type: :model do
  describe "バリデーション" do
    it "インターン生・企業のどちらも記事を書ける" do
      expect(build(:article)).to be_valid
      expect(build(:article, :by_company)).to be_valid
    end

    it "タイトル・本文が空なら日本語のエラーになる" do
      article = build(:article, title: " ", body: "\n\n")

      expect(article).not_to be_valid
      expect(article.errors.full_messages).to include("タイトルを入力してください", "本文を入力してください")
    end

    it "タイトルは 100 文字・本文は 20000 文字まで" do
      expect(build(:article, title: "あ" * 101)).not_to be_valid
      expect(build(:article, body: "あ" * 20_001)).not_to be_valid
      expect(build(:article, title: "あ" * 100, body: "あ" * 20_000)).to be_valid
    end

    it "公開状態が一覧にない値なら無効（例外にしない）" do
      expect(build(:article, status: "archived")).not_to be_valid
    end

    it "プロフィール未登録のユーザーは書けない" do
      article = build(:article, author: create(:user))

      expect(article).not_to be_valid
      expect(article.errors.full_messages).to include("プロフィールを登録してから記事を書いてください")
    end

    it "企業の記事は、公開するときだけ担当者名が必要（下書きは空でもよい）" do
      published = build(:article, :by_company, contact_name: " ")

      expect(published).not_to be_valid
      expect(published.errors.full_messages).to include("担当者名を入力してください")
      expect(build(:article, :by_company, :draft, contact_name: nil)).to be_valid
      expect(build(:article, :by_company, contact_name: "あ" * 51)).not_to be_valid
    end

    it "インターン生の記事は担当者名が不要で、送っても保存しない" do
      expect(build(:article, contact_name: nil)).to be_valid
      expect(create(:article, contact_name: "なりすまし").contact_name).to be_nil
    end

    it "タグは 5 個まで" do
      expect(build(:article, skill_names: (1..6).map { |i| "タグ#{i}" })).not_to be_valid
      expect(build(:article, skill_names: (1..5).map { |i| "タグ#{i}" })).to be_valid
    end
  end

  describe "正規化" do
    it "本文の先頭のインデント（コードブロック）は残し、末尾の空白だけ除く" do
      article = create(:article, body: "    indented code\n\n")
      expect(article.body).to eq("    indented code")
    end
  end

  describe "タグ" do
    it "スキルのマスタと共通で、大文字小文字の違いはまとめる" do
      skill = create(:skill, name: "React")
      article = create(:article, skill_names: %w[react Docker])

      expect(article.skills.map(&:name)).to eq(%w[React Docker])
      expect(article.skills.first).to eq(skill)
    end
  end

  describe "公開日時" do
    it "公開したときに記録し、下書きのままなら記録しない" do
      article = create(:article, :draft)
      expect(article.published_at).to be_nil

      article.update!(status: :published)
      expect(article.published_at).to be_present
    end
  end

  describe ".visible_to" do
    it "公開中の記事と自分の下書きだけを返す" do
      own_draft = create(:article, :draft)
      published = create(:article)
      create(:article, :draft)

      expect(described_class.visible_to(own_draft.author)).to contain_exactly(own_draft, published)
    end
  end

  describe "#author_name" do
    it "インターン生は氏名、企業は企業名" do
      student_article = create(:article)
      company_article = create(:article, :by_company)

      expect(student_article.author_name).to eq(student_article.author.student_profile.name)
      expect(company_article.author_name).to eq(company_article.author.company_profile.company_name)
    end
  end

  describe "#excerpt" do
    it "Markdown の記号・コードブロック・画像を除き、リンクは文字だけ残す" do
      body = <<~MARKDOWN
        # 見出し

        **太字** と [リンク](https://example.com) と ![画像](https://example.com/a.png)

        ```ruby
        secret_code = 1
        ```

        - 箇条書き
      MARKDOWN
      article = build(:article, body: body)

      expect(article.excerpt).to eq("見出し 太字 と リンク と 箇条書き")
    end

    it "長い本文は 120 文字で切る" do
      expect(build(:article, body: "あ" * 300).excerpt.length).to eq(120)
    end
  end
end
