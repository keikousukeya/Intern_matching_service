module Api
  # 技術ブログの記事の一覧・詳細・作成・更新・削除。
  # 閲覧はログインユーザー全員（公開中のもの）。作成はインターン生・企業のどちらもでき、更新・削除は自分の記事にだけ行える。
  class ArticlesController < ApplicationController
    # contact_name は企業の記事の担当者名（インターン生が送っても保存しない）
    PERMITTED_PARAMS = [ :title, :body, :status, :contact_name, { skill_names: [] } ].freeze

    before_action :require_login!

    # GET /api/articles  公開中の記事（新着順・20 件ずつ）。条件はすべて任意
    #   q           キーワード（スペース区切りで AND。タイトル・本文・タグ名・書いた人の名前の部分一致）
    #   skills[]    タグ（大文字小文字を区別しない完全一致）
    #   skill_match all（すべて含む・既定）/ any（いずれかを含む）
    #   author_role student / company（書いた人の区分）
    #   author_id   書いた人のユーザー ID（インターン生・企業の詳細画面で、その人の記事を出すため）
    def index
      articles, meta = paginate(ArticleSearch.new(**search_params).results.includes(*ArticleSerializer::INCLUDES))

      render json: { articles: articles.map { |article| ArticleSerializer.summary(article) }, meta: meta }
    end

    # GET /api/articles/:id  公開中の記事、または自分の記事（他人の下書きは存在も分からないよう 404）
    def show
      article = Article.visible_to(current_user).includes(*ArticleSerializer::INCLUDES).find(params[:id])

      render json: { article: ArticleSerializer.call(article) }
    end

    # POST /api/articles  プロフィールの登録が必要（モデルで検証して 422 を返す）
    def create
      article = current_user.articles.build(article_params)

      if article.save
        render json: { article: ArticleSerializer.call(article) }, status: :created
      else
        render_validation_errors(article)
      end
    end

    # PUT /api/articles/:id  公開・下書きの切り替えも status でここから行う
    def update
      article = find_own_article

      if article.update(article_params)
        render json: { article: ArticleSerializer.call(article) }
      else
        render_validation_errors(article)
      end
    end

    # DELETE /api/articles/:id
    def destroy
      find_own_article.destroy!
      head :no_content
    end

    private

    # 他人の記事は存在も分からないよう 404 にする
    def find_own_article
      current_user.articles.find(params[:id])
    end

    def article_params
      params.expect(article: PERMITTED_PARAMS)
    end

    # 型が違う値（例: q に配列、skills に文字列）は permit で落とす
    def search_params
      params.permit(:q, :skill_match, :author_role, :author_id, skills: []).to_h.symbolize_keys
    end
  end
end
