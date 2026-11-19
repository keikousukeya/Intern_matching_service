class ApplicationController < ActionController::API
  # セッション Cookie 認証のため、API モードでも Cookie を扱えるようにする
  include ActionController::Cookies
end
