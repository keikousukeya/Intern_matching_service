module Api
  # 新規登録。登録に成功したらそのままログイン状態にする
  class RegistrationsController < ApplicationController
    def create
      user = User.new(registration_params)

      if user.save
        log_in(user)
        render json: { user: user_json(user) }, status: :created
      else
        render_validation_errors(user)
      end
    end

    private

    def registration_params
      params.expect(user: %i[email password password_confirmation role])
    end
  end
end
