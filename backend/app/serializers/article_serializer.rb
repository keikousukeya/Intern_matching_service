# 技術ブログの記事の JSON 表現。
# 一覧（summary）は本文の代わりに抜粋を返し、詳細（call）は本文（Markdown）を返す。
# タグ・書いた人のプロフィールは includes(:skills, author: %i[student_profile company_profile]) 済みのものを使う（N+1 を避ける）。
# 書いた人の情報は表示名とロール（企業の記事は担当者名も）だけにし、メールアドレスなどは含めない。
class ArticleSerializer
  ATTRIBUTES = %i[id title status published_at created_at updated_at].freeze
  INCLUDES = [ :skills, { author: %i[student_profile company_profile] } ].freeze

  def self.summary(article)
    return nil if article.nil?

    base(article).merge("excerpt" => article.excerpt)
  end

  def self.call(article)
    return nil if article.nil?

    base(article).merge("body" => article.body)
  end

  def self.base(article)
    article.slice(*ATTRIBUTES).merge(
      "skills" => article.skills.map(&:name),
      "author" => {
        "user_id" => article.author_id,
        "role" => article.author.role,
        "name" => article.author_name,
        "contact_name" => article.contact_name
      }
    )
  end
  private_class_method :base
end
