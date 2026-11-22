# 募集一覧の絞り込み（F-03）。公開中で締切前の募集だけを対象にする。
#
#   JobPostingSearch.new(q: "Rails", skills: ["Ruby"], work_style: "remote", sort: "deadline").results
#
# 条件はすべて任意で、指定したものどうしは AND で組み合わせる（インターン生検索 StudentSearch と同じ考え方）。
class JobPostingSearch
  SORTS = %w[newest deadline].freeze
  SKILL_MATCHES = %w[all any].freeze

  MAX_KEYWORDS = 5
  MAX_KEYWORD_LENGTH = 50
  MAX_SKILLS = 10

  # キーワードの検索対象（部分一致）。企業名・スキル名も別途対象にする
  KEYWORD_COLUMNS = %w[title description compensation].freeze

  attr_reader :keywords, :skills, :skill_match, :work_style, :company_id, :sort

  def initialize(q: nil, skills: nil, skill_match: nil, work_style: nil, company_id: nil, sort: nil)
    # 全角スペースでも区切れるよう [[:space:]] で分割する
    @keywords = q.to_s.split(/[[:space:]]+/).compact_blank.map { |word| word.first(MAX_KEYWORD_LENGTH) }
                 .uniq.first(MAX_KEYWORDS)
    @skills = Array(skills).map { |name| name.to_s.squish.downcase }.compact_blank.uniq.first(MAX_SKILLS)
    # 不正な値は既定値（すべて含む・新着順・指定なし）として扱う
    @skill_match = SKILL_MATCHES.include?(skill_match) ? skill_match : "all"
    @work_style = JobPosting.work_styles.key?(work_style) ? work_style : nil
    @company_id = Integer(company_id.to_s, 10, exception: false)
    @sort = SORTS.include?(sort) ? sort : "newest"
  end

  def results
    scope = JobPosting.accepting
    scope = filter_by_keywords(scope)
    scope = filter_by_skills(scope)
    scope = scope.where(work_style: work_style) if work_style
    scope = scope.where(company_id: company_id) if company_id
    order(scope)
  end

  private

  # 部分一致の LIKE パターン。% や _ はワイルドカードとして扱わない
  def like(text)
    "%#{ActiveRecord::Base.sanitize_sql_like(text)}%"
  end

  # 複数のキーワードは AND。1 語ごとに「いずれかの項目・企業名・スキル名に部分一致」を作る（Arel の matches は ILIKE）
  def filter_by_keywords(scope)
    table = JobPosting.arel_table
    keywords.reduce(scope) do |result, keyword|
      pattern = like(keyword)
      with_skill = JobPostingSkill.joins(:skill).where(Skill.arel_table[:name].matches(pattern)).select(:job_posting_id)
      by_company = CompanyProfile.where(CompanyProfile.arel_table[:company_name].matches(pattern)).select(:user_id)
      condition = KEYWORD_COLUMNS.map { |column| table[column].matches(pattern) }.reduce(:or)
      result.where(condition.or(table[:id].in(with_skill.arel)).or(table[:company_id].in(by_company.arel)))
    end
  end

  # スキル名は大文字小文字を区別せず完全一致。all: すべて必要とする募集 / any: いずれかを必要とする募集
  def filter_by_skills(scope)
    return scope if skills.empty?

    matched = JobPostingSkill.joins(:skill).where("lower(skills.name) IN (?)", skills)
    if skill_match == "all"
      matched = matched.group(:job_posting_id).having("COUNT(DISTINCT job_posting_skills.skill_id) = ?", skills.size)
    end
    scope.where(id: matched.select(:job_posting_id))
  end

  # newest: 公開日時の新しい順 / deadline: 締切が近い順（締切なしは最後）。同順位は ID の大きい方を先に
  def order(scope)
    if sort == "deadline"
      scope.order(Arel.sql("job_postings.deadline ASC NULLS LAST"), id: :desc)
    else
      scope.order(published_at: :desc, id: :desc)
    end
  end
end
