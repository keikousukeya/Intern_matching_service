require "rails_helper"

RSpec.describe Skill, type: :model do
  it "大文字小文字だけが違う名前は重複として扱う" do
    create(:skill, name: "TypeScript")
    expect(build(:skill, name: "typescript")).not_to be_valid
  end

  it "前後・連続する空白を整えて保存する" do
    expect(create(:skill, name: "  Next.js   App  ").name).to eq("Next.js App")
  end

  describe "分類" do
    it "対応表にある名前は大文字小文字を区別せずに分類する" do
      expect(create(:skill, name: "TypeScript").category).to eq("language")
      expect(create(:skill, name: "react").category).to eq("framework")
      expect(create(:skill, name: "AWS").category).to eq("infrastructure")
      expect(create(:skill, name: "Figma").category).to eq("design")
    end

    it "対応表に無い名前は「その他」にする" do
      expect(create(:skill, name: "量子計算").category).to eq("other")
    end

    it "分類を指定して作った場合はそれを使う" do
      expect(create(:skill, name: "Haskell", category: "language").category).to eq("language")
    end

    it "決められた分類以外は受け付けない" do
      expect(build(:skill, category: "unknown")).not_to be_valid
    end
  end

  describe ".search" do
    it "部分一致で探し、% をワイルドカードとして扱わない" do
      create(:skill, name: "React")
      create(:skill, name: "Ruby")

      expect(Skill.search("ea").pluck(:name)).to eq([ "React" ])
      expect(Skill.search("%")).to be_empty
    end
  end

  describe ".popular" do
    it "使っているインターン生が多い順に並ぶ" do
      create(:student_profile, skill_names: [ "Go" ])
      create(:student_profile, skill_names: [ "Go", "Ruby" ])
      create(:skill, name: "Unused")

      expect(Skill.popular.pluck(:name)).to eq([ "Go", "Ruby", "Unused" ])
    end
  end
end
