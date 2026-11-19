# CSRF 対策: 状態を変更するリクエストは、許可したオリジン（自サービスのフロント）からのものだけ受け付ける。
#
# - Cookie は SameSite=Lax のため、他サイトからの POST には基本的に Cookie が付かない（一次防御）
# - 加えて Origin ヘッダーを検証する（二次防御）。ブラウザは POST/PATCH/DELETE に必ず Origin を付け、
#   JavaScript から書き換えられない
# - Origin が無いリクエスト（ブラウザ以外）も拒否する
module OriginVerification
  extend ActiveSupport::Concern

  SAFE_METHODS = %w[GET HEAD OPTIONS].freeze

  included do
    before_action :verify_request_origin!
  end

  private

  def verify_request_origin!
    return if SAFE_METHODS.include?(request.method)
    return if Rails.configuration.x.allowed_origins.include?(request.origin)

    render json: { message: "不正なリクエストです" }, status: :forbidden
  end
end
