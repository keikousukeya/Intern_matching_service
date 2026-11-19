class CreateStudentProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :student_profiles do |t|
      # 1 ユーザーにつき 1 プロフィール
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :name, null: false
      t.string :university, null: false
      t.string :faculty
      t.integer :graduation_year, null: false
      t.string :desired_role
      t.text :bio
      t.string :portfolio_url
      t.string :github_url
      # 希望インターン期間
      t.date :available_from
      t.date :available_to

      t.timestamps
    end
    # 一覧の新着順・更新順の並び替え用
    add_index :student_profiles, :created_at
    add_index :student_profiles, :updated_at
  end
end
