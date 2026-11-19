class ApplicationController < ActionController::API
  # セッション Cookie 認証のため、API モードでも Cookie を扱えるようにする
  include ActionController::Cookies
  include OriginVerification
  include Authentication

  private

  # バリデーションエラーを { errors: { 項目名: ["日本語のメッセージ"] } } 形式で返す
  def render_validation_errors(record)
    render json: { message: "入力内容を確認してください", errors: record.errors.to_hash(true) },
           status: :unprocessable_content
  end

  # レスポンスに含めるユーザー情報。メールアドレスは本人向けの API でのみ返す
  def user_json(user)
    user.as_json(only: %i[id email role created_at])
  end
end
