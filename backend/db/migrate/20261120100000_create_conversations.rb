# メッセージ機能（F-02）のテーブル。
# 仕様書の threads は Ruby 組み込みの Thread クラスと名前が衝突するため conversations とした。
class CreateConversations < ActiveRecord::Migration[8.1]
  def change
    # 会話（スレッド）。企業×インターン生の組み合わせにつき 1 件
    create_table :conversations do |t|
      t.references :company, null: false, foreign_key: { to_table: :users }, index: false
      t.references :student, null: false, foreign_key: { to_table: :users }
      # 一覧を新しいメッセージ順に並べるため、最後のメッセージの日時を持っておく
      t.datetime :last_message_at

      t.timestamps
    end
    # 同じ組み合わせの会話が 2 件できないよう DB でも保証する（先頭列が company_id なので企業側の検索にも使える）
    add_index :conversations, %i[company_id student_id], unique: true
    add_index :conversations, :last_message_at

    # 会話の参加者。既読位置（last_read_at）を参加者ごとに持つ。
    # 参加者を多対多にしておくことで、グループチャット（F-06）に拡張できる
    create_table :conversation_participants do |t|
      t.references :conversation, null: false, foreign_key: true, index: false
      t.references :user, null: false, foreign_key: true
      t.datetime :last_read_at

      t.timestamps
    end
    add_index :conversation_participants, %i[conversation_id user_id], unique: true

    create_table :messages do |t|
      t.references :conversation, null: false, foreign_key: true, index: false
      t.references :sender, null: false, foreign_key: { to_table: :users }
      t.text :body, null: false

      t.timestamps
    end
    # 会話ごとに時系列で取り出すため
    add_index :messages, %i[conversation_id created_at]
  end
end
