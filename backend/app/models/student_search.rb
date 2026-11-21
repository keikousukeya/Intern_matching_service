# 企業向けのインターン生検索（F-04）。
# 検索条件を受け取り、StudentProfile の絞り込み・並び替え済みのスコープを返す。
#
#   StudentSearch.new(q: "Rails 個人開発", skills: ["Ruby", "React"], skill_match: "any").results
#
# 条件はすべて任意で、指定したものどうしは AND で組み合わせる。
# 結合（JOIN）ではなくサブクエリで絞り込むため、1 人が重複して返ることはなく、件数もそのまま数えられる。
class StudentSearch
  SORTS = %w[newest updated].freeze
  SKILL_MATCHES = %w[all any].freeze

  # 極端に長い条件で重い SQL にならないよう上限を設ける
  MAX_KEYWORDS = 5
  MAX_KEYWORD_LENGTH = 50
  MAX_SKILLS = 10
  MAX_TEXT_LENGTH = 100

  # キーワードの検索対象（部分一致）。スキル名も別途対象にする
  KEYWORD_COLUMNS = %w[name university faculty desired_role bio].freeze

  attr_reader :keywords, :skills, :skill_match, :university, :graduation_year, :desired_role, :sort

  def initialize(q: nil, skills: nil, skill_match: nil, university: nil, graduation_year: nil,
                 desired_role: nil, sort: nil)
    # 全角スペースでも区切れるよう [[:space:]] で分割する
    @keywords = q.to_s.split(/[[:space:]]+/).compact_blank.map { |word| word.first(MAX_KEYWORD_LENGTH) }
                 .uniq.first(MAX_KEYWORDS)
    @skills = Array(skills).map { |name| name.to_s.squish.downcase }.compact_blank.uniq.first(MAX_SKILLS)
    # 不正な値は既定値（すべて含む・新着順）として扱う
    @skill_match = SKILL_MATCHES.include?(skill_match) ? skill_match : "all"
    @university = normalize_text(university)
    @graduation_year = Integer(graduation_year.to_s, 10, exception: false)
    @desired_role = normalize_text(desired_role)
    @sort = SORTS.include?(sort) ? sort : "newest"
  end

  def results
    scope = StudentProfile.all
    scope = filter_by_keywords(scope)
    scope = filter_by_skills(scope)
    scope = scope.where("student_profiles.university ILIKE ?", like(university)) if university
    scope = scope.where("student_profiles.desired_role ILIKE ?", like(desired_role)) if desired_role
    scope = scope.where(graduation_year: graduation_year) if graduation_year
    order(scope)
  end

  private

  def normalize_text(value)
    value.to_s.squish.first(MAX_TEXT_LENGTH).presence
  end

  # 部分一致の LIKE パターン。% や _ はワイルドカードとして扱わない
  def like(text)
    "%#{ActiveRecord::Base.sanitize_sql_like(text)}%"
  end

  # 複数のキーワードは AND（すべての語がどこかの項目に含まれる人）。
  # 1 語ごとに「いずれかの項目に部分一致 OR その語を含むスキルを持つ」を作る（Arel の matches は ILIKE になる）
  def filter_by_keywords(scope)
    table = StudentProfile.arel_table
    keywords.reduce(scope) do |result, keyword|
      pattern = like(keyword)
      with_skill = StudentSkill.joins(:skill).where(Skill.arel_table[:name].matches(pattern)).select(:student_profile_id)
      condition = KEYWORD_COLUMNS.map { |column| table[column].matches(pattern) }.reduce(:or)
      result.where(condition.or(table[:id].in(with_skill.arel)))
    end
  end

  # スキル名は大文字小文字を区別せず完全一致で比べる（登録時の重複判定と同じ扱い）。
  #   all: 指定したスキルをすべて持つ人
  #   any: 指定したスキルのいずれかを持つ人
  def filter_by_skills(scope)
    return scope if skills.empty?

    matched = StudentSkill.joins(:skill).where("lower(skills.name) IN (?)", skills)
    if skill_match == "all"
      matched = matched.group(:student_profile_id).having("COUNT(DISTINCT student_skills.skill_id) = ?", skills.size)
    end
    scope.where(id: matched.select(:student_profile_id))
  end

  # 同時刻は ID の大きい方を先にして、ページをまたいでも順序が変わらないようにする
  def order(scope)
    column = sort == "updated" ? :updated_at : :created_at
    scope.order(column => :desc, id: :desc)
  end
end
