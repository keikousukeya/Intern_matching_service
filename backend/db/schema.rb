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

ActiveRecord::Schema[8.1].define(version: 2026_11_22_100000) do
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

  create_table "conversation_participants", force: :cascade do |t|
    t.bigint "conversation_id", null: false
    t.bigint "user_id", null: false
    t.datetime "last_read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["conversation_id", "user_id"], name: "index_conversation_participants_on_conversation_id_and_user_id", unique: true
    t.index ["user_id"], name: "index_conversation_participants_on_user_id"
  end

  create_table "conversations", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.bigint "student_id", null: false
    t.datetime "last_message_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id", "student_id"], name: "index_conversations_on_company_id_and_student_id", unique: true
    t.index ["last_message_at"], name: "index_conversations_on_last_message_at"
    t.index ["student_id"], name: "index_conversations_on_student_id"
  end

  create_table "job_posting_skills", force: :cascade do |t|
    t.bigint "job_posting_id", null: false
    t.bigint "skill_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["job_posting_id", "skill_id"], name: "index_job_posting_skills_on_job_posting_id_and_skill_id", unique: true
    t.index ["skill_id"], name: "index_job_posting_skills_on_skill_id"
  end

  create_table "job_postings", force: :cascade do |t|
    t.bigint "company_id", null: false
    t.string "title", null: false
    t.text "description", null: false
    t.date "starts_on"
    t.date "ends_on"
    t.integer "work_style", null: false
    t.string "compensation"
    t.integer "headcount"
    t.date "deadline"
    t.integer "status", default: 0, null: false
    t.datetime "published_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_job_postings_on_company_id"
    t.index ["status", "deadline"], name: "index_job_postings_on_status_and_deadline"
    t.index ["status", "published_at"], name: "index_job_postings_on_status_and_published_at"
  end

  create_table "messages", force: :cascade do |t|
    t.bigint "conversation_id", null: false
    t.bigint "sender_id", null: false
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "job_posting_id"
    t.index ["conversation_id", "created_at"], name: "index_messages_on_conversation_id_and_created_at"
    t.index ["job_posting_id"], name: "index_messages_on_job_posting_id"
    t.index ["sender_id"], name: "index_messages_on_sender_id"
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
  add_foreign_key "conversation_participants", "conversations"
  add_foreign_key "conversation_participants", "users"
  add_foreign_key "conversations", "users", column: "company_id"
  add_foreign_key "conversations", "users", column: "student_id"
  add_foreign_key "job_posting_skills", "job_postings"
  add_foreign_key "job_posting_skills", "skills"
  add_foreign_key "job_postings", "users", column: "company_id"
  add_foreign_key "messages", "conversations"
  add_foreign_key "messages", "job_postings", on_delete: :nullify
  add_foreign_key "messages", "users", column: "sender_id"
  add_foreign_key "student_profiles", "users"
  add_foreign_key "student_skills", "skills"
  add_foreign_key "student_skills", "student_profiles"
end
