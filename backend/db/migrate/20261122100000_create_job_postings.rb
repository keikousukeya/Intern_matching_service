# 募集掲載（F-03）のテーブル。
# 必要スキルはインターン生と同じ skills マスタを使い、スキル名の表記をそろえる（検索・比較しやすくするため）。
class CreateJobPostings < ActiveRecord::Migration[8.1]
  def change
    create_table :job_postings do |t|
      t.references :company, null: false, foreign_key: { to_table: :users }
      t.string :title, null: false
      t.text :description, null: false
      # 期間はインターン生の希望期間と同じく日付で持ち、比べやすくする
      t.date :starts_on
      t.date :ends_on
      t.integer :work_style, null: false
      # 報酬は「時給 1,500 円」「月 10 万円」など形態がさまざまなため自由記述
      t.string :compensation
      t.integer :headcount
      t.date :deadline
      t.integer :status, null: false, default: 0
      # 一覧の新着順に使う（非公開→公開にした日時。作成日時では下書きの期間が含まれてしまうため）
      t.datetime :published_at

      t.timestamps
    end
    # 公開中の募集を新着順・締切順に取り出すため
    add_index :job_postings, %i[status published_at]
    add_index :job_postings, %i[status deadline]

    create_table :job_posting_skills do |t|
      t.references :job_posting, null: false, foreign_key: true, index: false
      t.references :skill, null: false, foreign_key: true

      t.timestamps
    end
    add_index :job_posting_skills, %i[job_posting_id skill_id], unique: true

    # 募集に紐づけたスカウト（任意）。募集を削除してもメッセージは残し、紐づけだけを外す
    add_reference :messages, :job_posting, foreign_key: { on_delete: :nullify }
  end
end
