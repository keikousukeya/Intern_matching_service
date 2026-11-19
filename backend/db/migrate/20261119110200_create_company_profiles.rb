class CreateCompanyProfiles < ActiveRecord::Migration[8.1]
  def change
    create_table :company_profiles do |t|
      # 1 ユーザーにつき 1 プロフィール
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :company_name, null: false
      t.string :contact_name, null: false
      t.text :description
      t.string :website

      t.timestamps
    end
  end
end
