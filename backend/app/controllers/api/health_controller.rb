module Api
  # フロントエンド（Next.js の rewrites）経由の疎通確認用エンドポイント
  class HealthController < ApplicationController
    def show
      render json: { status: "ok", time: Time.current.iso8601 }
    end
  end
end
