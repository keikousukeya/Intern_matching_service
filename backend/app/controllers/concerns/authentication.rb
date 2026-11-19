# セッション Cookie によるログイン状態の管理
module Authentication
  extend ActiveSupport::Concern

  private

  def current_user
    return @current_user if defined?(@current_user)

    @current_user = session[:user_id] && User.find_by(id: session[:user_id])
  end

  def logged_in?
    current_user.present?
  end

  # ログイン必須のアクションで before_action として使う
  def require_login!
    return if logged_in?

    render json: { message: "ログインしてください" }, status: :unauthorized
  end

  # セッション固定攻撃を防ぐため、ログイン時は必ずセッション ID を作り直す
  def log_in(user)
    reset_session
    session[:user_id] = user.id
    @current_user = user
  end

  def log_out
    reset_session
    @current_user = nil
  end
end
