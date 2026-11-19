require "rails_helper"

RSpec.describe StudentProfile, type: :model do
  describe "バリデーション" do
    it "必須項目（氏名・大学・卒業予定年）があれば有効" do
      profile = build(:student_profile, faculty: nil, desired_role: nil, bio: nil)
      expect(profile).to be_valid
    end

    it "氏名・大学・卒業予定年が空なら日本語のエラーになる" do
      profile = build(:student_profile, name: "", university: " ", graduation_year: nil)

      expect(profile).not_to be_valid
      expect(profile.errors.full_messages).to include(
        "氏名を入力してください", "大学を入力してください", "卒業予定年を入力してください"
      )
    end

    it "卒業予定年が範囲外なら無効" do
      expect(build(:student_profile, graduation_year: Time.current.year - 2)).not_to be_valid
      expect(build(:student_profile, graduation_year: Time.current.year + 7)).not_to be_valid
    end

    it "希望期間の終了が開始より前なら無効" do
      profile = build(:student_profile, available_from: Date.new(2027, 4, 1), available_to: Date.new(2027, 3, 31))

      expect(profile).not_to be_valid
      expect(profile.errors.full_messages).to include("希望期間（終了）は開始日以降の日付にしてください")
    end

    it "http / https 以外の URL は無効（javascript: スキームによる XSS を防ぐ）" do
      profile = build(:student_profile, portfolio_url: "javascript:alert(1)", github_url: "ftp://example.com")

      expect(profile).not_to be_valid
      expect(profile.errors[:portfolio_url]).to be_present
      expect(profile.errors[:github_url]).to be_present
    end

    it "https の URL は有効" do
      expect(build(:student_profile, portfolio_url: "https://example.com/me")).to be_valid
    end

    it "企業ユーザーには作成できない" do
      profile = build(:student_profile, user: create(:user, :company))

      expect(profile).not_to be_valid
      expect(profile.errors[:user]).to be_present
    end

    it "同じユーザーに 2 つ目は作成できない" do
      existing = create(:student_profile)
      expect(build(:student_profile, user: existing.user)).not_to be_valid
    end
  end

  describe "スキル" do
    it "スキル名で登録でき、マスタに無いスキルは作られる" do
      create(:skill, name: "Ruby")
      profile = create(:student_profile, skill_names: [ "Ruby", "Rust" ])

      expect(profile.reload.skills.map(&:name)).to eq([ "Ruby", "Rust" ])
      expect(Skill.count).to eq(2)
    end

    it "大文字小文字だけが違うスキルは、既存の表記にまとめる" do
      create(:skill, name: "React")
      profile = create(:student_profile, skill_names: [ "react", " REACT ", "" ])

      expect(profile.reload.skills.map(&:name)).to eq([ "React" ])
      expect(Skill.count).to eq(1)
    end

    it "スキルを入れ替えると、外したスキルの紐付けは消える（マスタは残る）" do
      profile = create(:student_profile, skill_names: [ "Go", "Python" ])
      profile.update!(skill_names: [ "Python" ])

      expect(profile.reload.skills.map(&:name)).to eq([ "Python" ])
      expect(Skill.pluck(:name)).to contain_exactly("Go", "Python")
    end

    it "skill_names を渡さなければスキルは変わらない" do
      profile = create(:student_profile, skill_names: [ "Go" ])
      StudentProfile.find(profile.id).update!(bio: "更新")

      expect(profile.reload.skills.map(&:name)).to eq([ "Go" ])
    end

    it "スキルが多すぎる・長すぎると無効で、マスタも作られない" do
      too_many = build(:student_profile, skill_names: (1..21).map { |i| "skill#{i}" })
      too_long = build(:student_profile, skill_names: [ "a" * 31 ])

      expect(too_many).not_to be_valid
      expect(too_many.errors.full_messages).to include("スキルは20個まで登録できます")
      expect(too_long).not_to be_valid
      expect(too_long.save).to be(false)
      expect(Skill.count).to eq(0)
    end
  end
end
