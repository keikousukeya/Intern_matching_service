class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      # 0: student（インターン生） / 1: company（企業）
      t.integer :role, null: false

      t.timestamps
    end
    # メールアドレスは小文字に正規化して保存するため、通常のユニークインデックスで重複を防げる
    add_index :users, :email, unique: true
  end
end
