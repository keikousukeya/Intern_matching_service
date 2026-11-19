require "rails_helper"

RSpec.describe Skill, type: :model do
  it "大文字小文字だけが違う名前は重複として扱う" do
    create(:skill, name: "TypeScript")
    expect(build(:skill, name: "typescript")).not_to be_valid
  end

  it "前後・連続する空白を整えて保存する" do
    expect(create(:skill, name: "  Next.js   App  ").name).to eq("Next.js App")
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
