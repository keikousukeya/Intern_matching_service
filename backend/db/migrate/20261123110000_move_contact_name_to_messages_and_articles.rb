# 企業の担当者名を、プロフィールの項目から「送るとき・公開するときに入力する」項目に移す。
#   - messages.sender_name: 企業が送ったメッセージ（スカウト）の担当者名
#   - articles.contact_name: 企業が書いた記事の担当者名
# 既存のメッセージ・記事には、その時点の企業プロフィールの担当者名を写しておく。
# company_profiles.contact_name は使わなくなるが、データは残す（削除は後で判断する）。NOT NULL だけ外す。
class MoveContactNameToMessagesAndArticles < ActiveRecord::Migration[8.1]
  def up
    add_column :messages, :sender_name, :string
    add_column :articles, :contact_name, :string
    change_column_null :company_profiles, :contact_name, true

    # 企業プロフィールは企業ユーザーにしか無いため、結合できたものが企業の送ったメッセージ・書いた記事になる
    execute <<~SQL.squish
      UPDATE messages SET sender_name = company_profiles.contact_name
      FROM company_profiles WHERE company_profiles.user_id = messages.sender_id
    SQL
    execute <<~SQL.squish
      UPDATE articles SET contact_name = company_profiles.contact_name
      FROM company_profiles WHERE company_profiles.user_id = articles.author_id
    SQL
  end

  def down
    # 新しく登録された企業はプロフィールに担当者名が無いため、戻すときは「未設定」で埋める
    change_column_null :company_profiles, :contact_name, false, "未設定"
    remove_column :articles, :contact_name
    remove_column :messages, :sender_name
  end
end
