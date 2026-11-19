require "rails_helper"

RSpec.describe User, type: :model do
  describe "バリデーション" do
    it "メール・パスワード・ロールがあれば有効" do
      expect(build(:user)).to be_valid
    end

    it "メールアドレスが空なら無効" do
      user = build(:user, email: "")
      expect(user).not_to be_valid
      expect(user.errors[:email]).to be_present
    end

    it "メールアドレスの形式が不正なら無効" do
      expect(build(:user, email: "not-an-email")).not_to be_valid
    end

    it "大文字小文字が違うだけのメールアドレスは重複として扱う" do
      create(:user, email: "taro@example.com")
      expect(build(:user, email: "TARO@example.com")).not_to be_valid
    end

    it "パスワードが 8 文字未満なら無効" do
      expect(build(:user, password: "short")).not_to be_valid
    end

    it "パスワード（確認）が一致しなければ無効" do
      expect(build(:user, password_confirmation: "different123")).not_to be_valid
    end

    it "未定義のロールは無効" do
      expect(build(:user, role: "admin")).not_to be_valid
    end

    it "エラーメッセージが日本語になる" do
      user = build(:user, email: "")
      user.valid?
      expect(user.errors.full_messages).to include("メールアドレスを入力してください")
    end
  end

  describe "メールアドレスの正規化" do
    it "前後の空白を除き小文字で保存する" do
      user = create(:user, email: "  Taro@Example.COM ")
      expect(user.email).to eq("taro@example.com")
    end
  end

  describe "パスワード" do
    it "平文ではなくハッシュ化して保存する" do
      user = create(:user, password: "password123")
      expect(user.password_digest).not_to include("password123")
      expect(user.authenticate("password123")).to eq(user)
    end
  end
end
