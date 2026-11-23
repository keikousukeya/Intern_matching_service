# スキルに分類（言語・フレームワークなど）を追加する。
# 入力欄の「よく使われているスキル」を分類ごとに分けて表示するため。
class AddCategoryToSkills < ActiveRecord::Migration[8.1]
  # 既存のスキルに付ける分類（この時点の対応表を写したもの）。
  # モデルの対応表は今後変わりうるため、マイグレーションからは参照しない。
  CATEGORY_NAMES = {
    "language" => %w[ruby python go java kotlin swift typescript javascript php c# c++ c rust sql elixir dart scala html css],
    "framework" => %w[rails django react next.js vue.js node.js laravel unity flutter angular spring express svelte],
    "infrastructure" => %w[postgresql mysql aws gcp azure docker kubernetes git github linux firebase redis mongodb terraform],
    "design" => %w[figma ui/ux デザイン photoshop illustrator]
  }.freeze

  def up
    add_column :skills, :category, :string, null: false, default: "other"

    CATEGORY_NAMES.each do |category, names|
      execute ActiveRecord::Base.sanitize_sql_array(
        [ "UPDATE skills SET category = ? WHERE lower(name) IN (?)", category, names ]
      )
    end
  end

  def down
    remove_column :skills, :category
  end
end
