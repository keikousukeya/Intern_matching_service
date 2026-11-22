require "rails_helper"

RSpec.describe JobPosting, type: :model do
  describe "バリデーション" do
    it "必須項目（タイトル・業務内容・勤務形態）があれば有効" do
      posting = build(:job_posting, compensation: nil, headcount: nil, starts_on: nil, ends_on: nil, deadline: nil)
      expect(posting).to be_valid
    end

    it "タイトル・業務内容が空なら日本語のエラーになる" do
      posting = build(:job_posting, title: " ", description: "")

      expect(posting).not_to be_valid
      expect(posting.errors.full_messages).to include("タイトルを入力してください", "業務内容を入力してください")
    end

    it "勤務形態・公開状態が一覧にない値なら無効（例外にしない）" do
      expect(build(:job_posting, work_style: "space")).not_to be_valid
      expect(build(:job_posting, status: "archived")).not_to be_valid
    end

    it "募集人数は 1〜1000 の整数" do
      expect(build(:job_posting, headcount: 0)).not_to be_valid
      expect(build(:job_posting, headcount: 1.5)).not_to be_valid
      expect(build(:job_posting, headcount: 1000)).to be_valid
    end

    it "期間の終了が開始より前なら無効" do
      posting = build(:job_posting, starts_on: Date.new(2027, 4, 1), ends_on: Date.new(2027, 3, 31))

      expect(posting).not_to be_valid
      expect(posting.errors.full_messages).to include("期間（終了）は開始日以降の日付にしてください")
    end

    it "締切に過去の日付は設定できないが、今日は設定できる" do
      past = build(:job_posting, deadline: Time.zone.yesterday)

      expect(past).not_to be_valid
      expect(past.errors.full_messages).to include("締切には今日以降の日付を指定してください")
      expect(build(:job_posting, deadline: Time.zone.today)).to be_valid
    end

    it "締切を過ぎた募集でも、締切以外の項目は更新できる" do
      posting = create(:job_posting, :closed)
      expect(posting.update(title: "タイトルを修正")).to be true
    end

    it "企業プロフィール未登録の企業は作成できない" do
      posting = build(:job_posting, company: create(:user, :company))

      expect(posting).not_to be_valid
      expect(posting.errors.full_messages).to include("企業プロフィールを登録してから募集を作成してください")
    end

    it "インターン生は作成できない" do
      expect(build(:job_posting, company: create(:user))).not_to be_valid
    end

    it "必要スキルは 10 個まで" do
      expect(build(:job_posting, skill_names: (1..11).map { |i| "スキル#{i}" })).not_to be_valid
    end
  end

  describe "必要スキル" do
    it "スキル名で登録でき、インターン生と同じスキルのマスタを使う（大文字小文字の違いはまとめる）" do
      create(:student_profile, skill_names: [ "React" ])
      posting = create(:job_posting, skill_names: [ "react", "Ruby", "ruby" ])

      expect(posting.reload.skills.map(&:name)).to eq([ "React", "Ruby" ])
      expect(Skill.named("react").count).to eq(1)
    end
  end

  describe "公開日時" do
    it "公開したときに記録し、非公開→公開にすると更新する" do
      posting = create(:job_posting, :draft)
      expect(posting.published_at).to be_nil

      posting.update!(status: :published)
      first_published_at = posting.published_at
      expect(first_published_at).to be_present

      travel 1.hour do
        posting.update!(status: :draft)
        posting.update!(status: :published)
      end
      expect(posting.published_at).to be > first_published_at
    end

    it "公開中のまま他の項目を更新しても変わらない" do
      posting = create(:job_posting)
      expect { travel(1.hour) { posting.update!(title: "変更") } }.not_to change(posting, :published_at)
    end
  end

  describe "スコープ" do
    let(:company) { create(:company_profile).user }
    let!(:published) { create(:job_posting, company: company) }
    let!(:no_deadline) { create(:job_posting, deadline: nil) }
    let!(:draft) { create(:job_posting, :draft, company: company) }
    let!(:closed) { create(:job_posting, :closed) }

    it "accepting は公開中で締切前（締切なしを含む）の募集" do
      expect(described_class.accepting).to contain_exactly(published, no_deadline)
    end

    it "visible_to は公開中（締切済みを含む）の募集と自社の募集" do
      expect(described_class.visible_to(company)).to contain_exactly(published, no_deadline, draft, closed)
      expect(described_class.visible_to(create(:user))).to contain_exactly(published, no_deadline, closed)
    end
  end

  it "削除してもスカウトのメッセージは残り、紐づけだけが外れる" do
    posting = create(:job_posting)
    conversation = create(:conversation, company: posting.company)
    message = create(:message, conversation: conversation, job_posting: posting)

    posting.destroy!

    expect(message.reload.job_posting_id).to be_nil
  end
end
