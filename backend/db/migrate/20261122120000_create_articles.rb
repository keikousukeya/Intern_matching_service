# 技術ブログ（インターン生・企業の両方が記事を書ける）のテーブル。
# タグはインターン生・募集と同じ skills マスタを使い、スキル名の表記をそろえる（プロフィールや募集と結びつけやすくするため）。
class CreateArticles < ActiveRecord::Migration[8.1]
  def change
    create_table :articles do |t|
      # 書いた人（インターン生・企業のどちらも書けるため users を参照する）
      t.references :author, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      # 本文は Markdown（表示時にフロントエンドで HTML にする。生の HTML は許可しない）
      t.text :body, null: false
      t.integer :status, null: false, default: 0
      # 一覧の新着順に使う（下書き→公開にした日時。作成日時では下書きの期間が含まれてしまうため）
      t.datetime :published_at

      t.timestamps
    end
    # 公開中の記事を新着順に取り出すため
    add_index :articles, %i[status published_at]

    create_table :article_skills do |t|
      t.references :article, null: false, foreign_key: true, index: false
      t.references :skill, null: false, foreign_key: true

      t.timestamps
    end
    add_index :article_skills, %i[article_id skill_id], unique: true
  end
end
