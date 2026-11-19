Rails.application.routes.draw do
  # ロードバランサ等の死活監視用（Rails 標準）
  get "up" => "rails/health#show", as: :rails_health_check

  # JSON API はすべて /api 配下に置く（Next.js から /api/* を中継する）
  namespace :api do
    get "health", to: "health#show"
  end
end
