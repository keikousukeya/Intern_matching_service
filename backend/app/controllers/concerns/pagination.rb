# 一覧 API のページネーション（?page=2 のように指定）。
# 件数が少ないプロトタイプのため gem は使わず、LIMIT / OFFSET で実装している。
module Pagination
  extend ActiveSupport::Concern

  DEFAULT_PER_PAGE = 20

  private

  # [そのページのレコード, ページ情報] を返す
  def paginate(scope, per_page: DEFAULT_PER_PAGE)
    total_count = scope.count
    total_pages = [ (total_count.to_f / per_page).ceil, 1 ].max
    # 不正な値（0・負数・文字列）は 1 ページ目として扱う
    page = [ params[:page].to_i, 1 ].max

    records = scope.limit(per_page).offset((page - 1) * per_page)
    meta = { page: page, per_page: per_page, total_count: total_count, total_pages: total_pages }
    [ records, meta ]
  end
end
