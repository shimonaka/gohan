-- Database Schema Template for Youware Backend
-- Copy this file to: backend/schema.sql
-- Update this file whenever you modify database structure

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encrypted_yw_id TEXT NOT NULL UNIQUE,
  display_name TEXT,
  photo_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_users_encrypted_yw_id ON users(encrypted_yw_id);

CREATE TABLE IF NOT EXISTS fridge_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_fridge_items_user_id ON fridge_items(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fridge_items_user_item ON fridge_items(user_id, name);

CREATE TABLE IF NOT EXISTS weekly_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  goal_category TEXT DEFAULT NULL,
  plan_json TEXT NOT NULL,
  fridge_snapshot_json TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE INDEX IF NOT EXISTS idx_weekly_plans_user ON weekly_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_plans_goal ON weekly_plans(goal_category);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  auto_items_json TEXT NOT NULL,
  manual_items_json TEXT NOT NULL,
  generated_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
) STRICT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
