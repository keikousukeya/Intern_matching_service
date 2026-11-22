require "rails_helper"

RSpec.describe JobPostingSearch, type: :model do
  def search(**conditions)
    described_class.new(**conditions).results.to_a
  end

  it "公開中で締切前の募集だけを対象にする（非公開・締切済みは出さない）" do
    accepting = create(:job_posting)
    create(:job_posting, :draft)
    create(:job_posting, :closed)

    expect(search).to eq([ accepting ])
  end

  describe "キーワード" do
    let!(:rails_posting) do
      create(:job_posting, title: "Rails 開発インターン", description: "API を開発します", compensation: "時給 1,500 円",
                           skill_names: [ "Ruby" ], company: create(:company_profile, company_name: "株式会社ネクスト").user)
    end
    let!(:design_posting) do
      create(:job_posting, title: "デザイナー募集", description: "UI を設計します", compensation: "日給 1 万円",
                           skill_names: [ "Figma" ])
    end

    it "タイトル・業務内容・報酬・企業名・スキル名のいずれかに部分一致する募集を返す" do
      expect(search(q: "rails")).to eq([ rails_posting ])
      expect(search(q: "UI")).to eq([ design_posting ])
      expect(search(q: "日給")).to eq([ design_posting ])
      expect(search(q: "ネクスト")).to eq([ rails_posting ])
      expect(search(q: "fig")).to eq([ design_posting ])
    end

    it "スペース（全角を含む）で区切った複数の語はすべて含む募集だけを返す" do
      expect(search(q: "Rails　時給")).to eq([ rails_posting ])
      expect(search(q: "Rails 日給")).to be_empty
    end

    it "% や _ はワイルドカードとして扱わない" do
      expect(search(q: "%")).to be_empty
    end
  end

  describe "必要スキル" do
    let!(:ruby_react) { create(:job_posting, skill_names: [ "Ruby", "React" ]) }
    let!(:ruby_only) { create(:job_posting, skill_names: [ "Ruby" ]) }
    let!(:go_only) { create(:job_posting, skill_names: [ "Go" ]) }

    it "既定（all）は指定したスキルをすべて必要とする募集" do
      expect(search(skills: [ "ruby", "REACT" ])).to eq([ ruby_react ])
    end

    it "any は指定したスキルのいずれかを必要とする募集（重複しない）" do
      expect(search(skills: [ "Ruby", "Go" ], skill_match: "any")).to contain_exactly(ruby_react, ruby_only, go_only)
    end
  end

  describe "勤務形態・企業" do
    let!(:remote) { create(:job_posting, work_style: :remote) }
    let!(:onsite) { create(:job_posting, work_style: :onsite) }

    it "勤務形態で絞り込み、不正な値は無視する" do
      expect(search(work_style: "onsite")).to eq([ onsite ])
      expect(search(work_style: "space")).to contain_exactly(remote, onsite)
    end

    it "企業で絞り込める" do
      expect(search(company_id: remote.company_id.to_s)).to eq([ remote ])
    end
  end

  describe "並び順" do
    let!(:old_near) { create(:job_posting, deadline: 3.days.from_now.to_date, published_at: nil) }
    let!(:new_far) { create(:job_posting, deadline: 30.days.from_now.to_date) }
    let!(:no_deadline) { create(:job_posting, deadline: nil) }

    before do
      old_near.update_columns(published_at: 2.days.ago)
      new_far.update_columns(published_at: 1.day.ago)
      no_deadline.update_columns(published_at: 3.days.ago)
    end

    it "既定は公開日時の新しい順" do
      expect(search).to eq([ new_far, old_near, no_deadline ])
    end

    it "deadline は締切が近い順で、締切なしは最後" do
      expect(search(sort: "deadline")).to eq([ old_near, new_far, no_deadline ])
    end
  end
end
