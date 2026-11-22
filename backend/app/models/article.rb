# 技術ブログの記事。インターン生・企業のどちらも書ける。
# 公開中（published）の記事はログインユーザー全員が閲覧でき、下書き（draft）は書いた本人だけが見られる。
class Article < ApplicationRecord
  include SkillTaggable

  TITLE_MAX_LENGTH = 100
  BODY_MAX_LENGTH = 20_000
  EXCERPT_LENGTH = 120

  belongs_to :author, class_name: "User"
  # 入力した順に並べる
  has_many :article_skills, -> { order(:id) }, dependent: :destroy
  has_many :skills, through: :article_skills
  skill_taggable max: 5

  enum :status, { draft: 0, published: 1 }, validate: true

  # タイトルは前後の空白を除く。本文は改行・インデント（コードブロック）を残すため、末尾の空白だけ除く
  normalizes :title, with: ->(value) { value.strip.presence }
  normalizes :body, with: ->(value) { value.rstrip.presence }

  validates :title, presence: true, length: { maximum: TITLE_MAX_LENGTH }
  validates :body, presence: true, length: { maximum: BODY_MAX_LENGTH }
  validate :author_must_have_profile

  before_save :set_published_at

  # 閲覧できる記事（公開中のもの＋自分の記事）
  scope :visible_to, ->(user) { published.or(where(author_id: user.id)) }

  # 書いた人の表示名（インターン生は氏名、企業は企業名）
  def author_name
    profile = author.profile
    author.student? ? profile&.name : profile&.company_name
  end

  # 一覧に出す本文の抜粋。Markdown の記号やコードブロックを除いた先頭部分
  def excerpt
    text = body.to_s
               .gsub(/^(```|~~~).*?^\1/m, " ")       # コードブロック
               .gsub(/!\[([^\]]*)\]\([^)]*\)/, "")    # 画像
               .gsub(/\[([^\]]*)\]\([^)]*\)/, '\1')   # リンクは文字だけ残す
               .gsub(/^\s{0,3}(#+|>|[-*+]|\d+\.)\s+/, "") # 見出し・引用・箇条書きの記号
               .gsub(/[`*_~|]/, "")
               .squish
    text.truncate(EXCERPT_LENGTH)
  end

  private

  # 記事の書き手として氏名・企業名を表示するため、プロフィールの登録を必須にする。
  # 項目名を前に付けない文にするため base に追加する（画面ではフォームの上にまとめて出す）
  def author_must_have_profile
    return if author.nil?

    errors.add(:base, :author_profile_required) if author.profile.nil?
  end

  # 下書き→公開にした日時を記録する（新着順の基準）
  def set_published_at
    self.published_at = Time.current if published? && (published_at.nil? || will_save_change_to_status?)
  end
end
