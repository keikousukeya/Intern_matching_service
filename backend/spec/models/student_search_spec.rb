require "rails_helper"

RSpec.describe StudentSearch, type: :model do
  def search(**conditions)
    described_class.new(**conditions).results.to_a
  end

  describe "キーワード" do
    let!(:alice) do
      create(:student_profile, name: "山田 花子", university: "東都大学", faculty: "情報学部",
                               desired_role: "フロントエンド", bio: "個人開発をしています", skill_names: [ "TypeScript" ])
    end
    let!(:bob) do
      create(:student_profile, name: "佐藤 太郎", university: "西京大学", faculty: "経済学部",
                               desired_role: "データ分析", bio: "統計を研究しています", skill_names: [ "Python" ])
    end

    it "氏名・大学・学部・志望職種・自己紹介・スキル名のいずれかに部分一致する人を返す" do
      expect(search(q: "花子")).to eq([ alice ])
      expect(search(q: "西京")).to eq([ bob ])
      expect(search(q: "情報")).to eq([ alice ])
      expect(search(q: "データ")).to eq([ bob ])
      expect(search(q: "統計")).to eq([ bob ])
      expect(search(q: "typescript")).to eq([ alice ])
    end

    it "スペース（全角を含む）で区切った複数の語はすべて含む人だけを返す" do
      expect(search(q: "東都 個人開発")).to eq([ alice ])
      expect(search(q: "東都　統計")).to be_empty
    end

    it "% や _ はワイルドカードとして扱わない" do
      expect(search(q: "%")).to be_empty
      expect(search(q: "_")).to be_empty
    end

    it "空なら絞り込まない" do
      expect(search(q: "  ")).to contain_exactly(alice, bob)
    end
  end

  describe "スキル" do
    let!(:ruby_react) { create(:student_profile, skill_names: [ "Ruby", "React" ]) }
    let!(:ruby_only) { create(:student_profile, skill_names: [ "Ruby" ]) }
    let!(:go_only) { create(:student_profile, skill_names: [ "Go" ]) }

    it "既定（all）は指定したスキルをすべて持つ人だけを返す" do
      expect(search(skills: [ "Ruby", "React" ])).to eq([ ruby_react ])
    end

    it "any は指定したスキルのいずれかを持つ人を返す（重複しない）" do
      expect(search(skills: [ "Ruby", "React", "Go" ], skill_match: "any"))
        .to contain_exactly(ruby_react, ruby_only, go_only)
    end

    it "大文字小文字を区別せず、部分一致ではなく完全一致で比べる" do
      expect(search(skills: [ "ruby" ])).to contain_exactly(ruby_react, ruby_only)
      expect(search(skills: [ "Rub" ])).to be_empty
    end

    it "登録されていないスキルを all で含めると誰もヒットしない" do
      expect(search(skills: [ "Ruby", "Rust" ])).to be_empty
      expect(search(skills: [ "Ruby", "Rust" ], skill_match: "any")).to contain_exactly(ruby_react, ruby_only)
    end

    it "不正な skill_match は all として扱う" do
      expect(search(skills: [ "Ruby", "React" ], skill_match: "xxx")).to eq([ ruby_react ])
    end
  end

  describe "大学・卒業予定年・志望職種" do
    let(:year) { Time.current.year + 1 }
    let!(:target) { create(:student_profile, university: "東都工業大学", desired_role: "バックエンドエンジニア", graduation_year: year) }
    let!(:other) { create(:student_profile, university: "西京大学", desired_role: "デザイナー", graduation_year: year + 1) }

    it "大学・志望職種は部分一致、卒業予定年は完全一致で絞り込む" do
      expect(search(university: "東都")).to eq([ target ])
      expect(search(desired_role: "エンジニア")).to eq([ target ])
      expect(search(graduation_year: year.to_s)).to eq([ target ])
    end

    it "条件を組み合わせると AND になる" do
      expect(search(university: "大学", desired_role: "デザイナー")).to eq([ other ])
      expect(search(university: "東都", graduation_year: (year + 1).to_s)).to be_empty
    end

    it "数値でない卒業予定年は無視する" do
      expect(search(graduation_year: "abc")).to contain_exactly(target, other)
    end
  end

  describe "並び順" do
    let!(:old_but_updated) { create(:student_profile, created_at: 3.days.ago, updated_at: 1.hour.ago) }
    let!(:new_not_updated) { create(:student_profile, created_at: 1.day.ago, updated_at: 1.day.ago) }

    it "既定は新着順" do
      expect(search).to eq([ new_not_updated, old_but_updated ])
    end

    it "updated は更新順" do
      expect(search(sort: "updated")).to eq([ old_but_updated, new_not_updated ])
    end

    it "不正な値は新着順として扱う" do
      expect(search(sort: "name")).to eq([ new_not_updated, old_but_updated ])
    end
  end
end
