# 技術ブログの記事一覧の絞り込み。公開中の記事だけを対象にする。
#
#   ArticleSearch.new(q: "Rails", skills: ["Ruby"], author_role: "student").results
#
# 条件はすべて任意で、指定したものどうしは AND で組み合わせる（募集検索 JobPostingSearch と同じ考え方）。
class ArticleSearch
  SKILL_MATCHES = %w[all any].freeze

  MAX_KEYWORDS = 5
  MAX_KEYWORD_LENGTH = 50
  MAX_SKILLS = 10

  # キーワードの検索対象（部分一致）。書いた人の名前・タグ名も別途対象にする
  KEYWORD_COLUMNS = %w[title body].freeze

  attr_reader :keywords, :skills, :skill_match, :author_role, :author_id

  def initialize(q: nil, skills: nil, skill_match: nil, author_role: nil, author_id: nil)
    # 全角スペースでも区切れるよう [[:space:]] で分割する
    @keywords = q.to_s.split(/[[:space:]]+/).compact_blank.map { |word| word.first(MAX_KEYWORD_LENGTH) }
                 .uniq.first(MAX_KEYWORDS)
    @skills = Array(skills).map { |name| name.to_s.squish.downcase }.compact_blank.uniq.first(MAX_SKILLS)
    # 不正な値は既定値（すべて含む・指定なし）として扱う
    @skill_match = SKILL_MATCHES.include?(skill_match) ? skill_match : "all"
    @author_role = User.roles.key?(author_role) ? author_role : nil
    @author_id = Integer(author_id.to_s, 10, exception: false)
  end

  def results
    scope = Article.published
    scope = filter_by_keywords(scope)
    scope = filter_by_skills(scope)
    scope = scope.where(author_id: User.where(role: author_role).select(:id)) if author_role
    scope = scope.where(author_id: author_id) if author_id
    scope.order(published_at: :desc, id: :desc)
  end

  private

  # 部分一致の LIKE パターン。% や _ はワイルドカードとして扱わない
  def like(text)
    "%#{ActiveRecord::Base.sanitize_sql_like(text)}%"
  end

  # 複数のキーワードは AND。1 語ごとに「タイトル・本文・タグ名・書いた人の名前のいずれかに部分一致」を作る
  def filter_by_keywords(scope)
    table = Article.arel_table
    keywords.reduce(scope) do |result, keyword|
      pattern = like(keyword)
      with_skill = ArticleSkill.joins(:skill).where(Skill.arel_table[:name].matches(pattern)).select(:article_id)
      by_student = StudentProfile.where(StudentProfile.arel_table[:name].matches(pattern)).select(:user_id)
      by_company = CompanyProfile.where(CompanyProfile.arel_table[:company_name].matches(pattern)).select(:user_id)
      condition = KEYWORD_COLUMNS.map { |column| table[column].matches(pattern) }.reduce(:or)
      result.where(
        condition.or(table[:id].in(with_skill.arel))
                 .or(table[:author_id].in(by_student.arel))
                 .or(table[:author_id].in(by_company.arel))
      )
    end
  end

  # タグは大文字小文字を区別せず完全一致。all: すべてのタグを持つ記事 / any: いずれかのタグを持つ記事
  def filter_by_skills(scope)
    return scope if skills.empty?

    matched = ArticleSkill.joins(:skill).where("lower(skills.name) IN (?)", skills)
    if skill_match == "all"
      matched = matched.group(:article_id).having("COUNT(DISTINCT article_skills.skill_id) = ?", skills.size)
    end
    scope.where(id: matched.select(:article_id))
  end
end
