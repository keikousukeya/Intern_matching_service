# リクエストスペック共通のヘルパー
module RequestHelpers
  # ブラウザ（Next.js 経由）からの JSON リクエストを模したヘッダー
  def json_headers(origin: "http://localhost:3000")
    { "Origin" => origin, "Content-Type" => "application/json", "Accept" => "application/json" }
  end

  def json_post(path, params = {}, **options)
    post path, params: params.to_json, headers: json_headers(**options)
  end

  def log_in_as(user, password: "password123")
    json_post "/api/session", { session: { email: user.email, password: password } }
  end
end

RSpec.configure do |config|
  config.include RequestHelpers, type: :request
end
