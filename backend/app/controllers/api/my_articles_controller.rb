module Api
  # 自分の記事の一覧（GET /api/me/articles）。記事管理の画面で使う。
  # 下書きも含めて、更新日時の新しい順に返す。インターン生・企業のどちらも使える。
  class MyArticlesController < ApplicationController
    before_action :require_login!

    def index
      articles, meta = paginate(
        current_user.articles.includes(*ArticleSerializer::INCLUDES).order(updated_at: :desc, id: :desc)
      )

      render json: { articles: articles.map { |article| ArticleSerializer.summary(article) }, meta: meta }
    end
  end
end
