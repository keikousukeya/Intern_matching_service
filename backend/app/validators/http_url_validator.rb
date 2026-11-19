# http / https の URL だけを許可するバリデーター。
#
# プロフィールの URL は他のユーザーの画面にリンクとして表示するため、
# 「javascript:alert(1)」のような URL を登録されると XSS につながる。スキームを限定して防ぐ。
#
#   validates :website, http_url: true
class HttpUrlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return if value.blank?

    uri = URI.parse(value)
    return if uri.is_a?(URI::HTTP) && uri.host.present?

    record.errors.add(attribute, :invalid_url)
  rescue URI::InvalidURIError
    record.errors.add(attribute, :invalid_url)
  end
end
