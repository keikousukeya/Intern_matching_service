Rails.application.routes.draw do
  # ロードバランサ等の死活監視用（Rails 標準）
  get "up" => "rails/health#show", as: :rails_health_check

  # JSON API はすべて /api 配下に置く（Next.js から /api/* を中継する）
  namespace :api do
    get "health", to: "health#show"

    resource :registration, only: :create   # POST   /api/registration  新規登録
    resource :session, only: %i[create destroy] # POST/DELETE /api/session ログイン/ログアウト
    resource :me, only: :show, controller: :me  # GET    /api/me        ログイン中のユーザー
  end
end
