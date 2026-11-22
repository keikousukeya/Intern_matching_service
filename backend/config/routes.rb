Rails.application.routes.draw do
  # ロードバランサ等の死活監視用（Rails 標準）
  get "up" => "rails/health#show", as: :rails_health_check

  # JSON API はすべて /api 配下に置く（Next.js から /api/* を中継する）
  namespace :api do
    get "health", to: "health#show"

    resource :registration, only: :create   # POST   /api/registration  新規登録
    resource :session, only: %i[create destroy] # POST/DELETE /api/session ログイン/ログアウト
    resource :me, only: :show, controller: :me  # GET    /api/me        ログイン中のユーザー

    # GET/PUT /api/me/profile  自分のプロフィール（ロールに応じて学生 / 企業）
    resource :profile, path: "me/profile", only: %i[show update], controller: :my_profiles

    resources :students, only: %i[index show] # 企業向け: インターン生の一覧・詳細
    resources :skills, only: :index           # スキル入力の候補
    resources :companies, only: :show         # 企業プロフィールの詳細（スカウトの送信元の確認用）

    # 募集（F-03）。一覧・詳細はログインユーザー全員、作成・更新・削除は企業が自社の募集にだけ行える
    resources :job_postings, only: %i[index show create update destroy]
    # GET /api/me/job_postings  自社の募集（非公開・締切済みも含む）
    resources :my_job_postings, path: "me/job_postings", only: :index

    # 技術ブログ。一覧・詳細はログインユーザー全員、作成・更新・削除は書いた本人だけが行える
    resources :articles, only: %i[index show create update destroy]
    # GET /api/me/articles  自分の記事（下書きも含む）
    resources :my_articles, path: "me/articles", only: :index

    # メッセージ（F-02）。会話は企業×インターン生で 1 件
    resources :conversations, only: %i[index show create] do
      get :unread_count, on: :collection # GET /api/conversations/unread_count  未読の合計
      put :read, on: :member             # PUT /api/conversations/:id/read     既読にする
      resources :messages, only: :create # POST /api/conversations/:id/messages 返信・追加の送信
    end
  end
end
