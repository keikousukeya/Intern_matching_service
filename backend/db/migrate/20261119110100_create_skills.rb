class CreateSkills < ActiveRecord::Migration[8.1]
  def change
    create_table :skills do |t|
      t.string :name, null: false

      t.timestamps
    end
    # 「React」と「react」を同じスキルとして扱うため、小文字化した値で一意にする
    add_index :skills, "lower(name)", unique: true, name: "index_skills_on_lower_name"

    create_table :student_skills do |t|
      t.references :student_profile, null: false, foreign_key: true, index: false
      t.references :skill, null: false, foreign_key: true

      t.timestamps
    end
    # 同じスキルの二重登録を防ぐ（先頭列が student_profile_id なのでプロフィール側の検索にも使える）
    add_index :student_skills, %i[student_profile_id skill_id], unique: true
  end
end
