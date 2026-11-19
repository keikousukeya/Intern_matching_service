# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_19_110200) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "company_profiles", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "company_name", null: false
    t.string "contact_name", null: false
    t.text "description"
    t.string "website"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_company_profiles_on_user_id", unique: true
  end

  create_table "skills", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index "lower((name)::text)", name: "index_skills_on_lower_name", unique: true
  end

  create_table "student_profiles", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "university", null: false
    t.string "faculty"
    t.integer "graduation_year", null: false
    t.string "desired_role"
    t.text "bio"
    t.string "portfolio_url"
    t.string "github_url"
    t.date "available_from"
    t.date "available_to"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_at"], name: "index_student_profiles_on_created_at"
    t.index ["updated_at"], name: "index_student_profiles_on_updated_at"
    t.index ["user_id"], name: "index_student_profiles_on_user_id", unique: true
  end

  create_table "student_skills", force: :cascade do |t|
    t.bigint "student_profile_id", null: false
    t.bigint "skill_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["skill_id"], name: "index_student_skills_on_skill_id"
    t.index ["student_profile_id", "skill_id"], name: "index_student_skills_on_student_profile_id_and_skill_id", unique: true
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.integer "role", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "company_profiles", "users"
  add_foreign_key "student_profiles", "users"
  add_foreign_key "student_skills", "skills"
  add_foreign_key "student_skills", "student_profiles"
end
