# 記事とタグ（スキル）の中間テーブル
class ArticleSkill < ApplicationRecord
  belongs_to :article
  belongs_to :skill
end
