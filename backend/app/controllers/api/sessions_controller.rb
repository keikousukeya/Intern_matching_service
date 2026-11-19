module Api
  # ログイン・ログアウト
  class SessionsController < ApplicationController
    # 総当たり攻撃対策（同一 IP から 3 分間に 10 回まで）
    rate_limit to: 10, within: 3.minutes, only: :create,
               with: -> { render json: { message: "しばらく時間をおいてから再度お試しください" }, status: :too_many_requests }

    def create
      user = User.authenticate_by(email: session_params[:email].to_s.strip.downcase,
                                  password: session_params[:password].to_s)

      if user
        log_in(user)
        render json: { user: user_json(user) }
      else
        # どちらが誤っているかは伝えない（登録済みメールアドレスの推測を防ぐ）
        render json: { message: "メールアドレスまたはパスワードが正しくありません" }, status: :unauthorized
      end
    end

    def destroy
      log_out
      head :no_content
    end

    private

    def session_params
      params.expect(session: %i[email password])
    end
  end
end
