require "rails_helper"

RSpec.describe CompanyProfile, type: :model do
  it "企業名があれば有効" do
    expect(build(:company_profile, description: nil, website: nil)).to be_valid
  end

  it "企業名が空なら日本語のエラーになる" do
    profile = build(:company_profile, company_name: "")

    expect(profile).not_to be_valid
    expect(profile.errors.full_messages).to include("企業名を入力してください")
  end

  it "http / https 以外の Web サイトは無効" do
    profile = build(:company_profile, website: "javascript:alert(1)")

    expect(profile).not_to be_valid
    expect(profile.errors.full_messages).to include("Web サイトは http:// または https:// から始まる URL を入力してください")
  end

  it "インターン生ユーザーには作成できない" do
    expect(build(:company_profile, user: create(:user))).not_to be_valid
  end
end
