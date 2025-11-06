# ゴハンアプリ - バックエンド

Cloudflare WorkersとD1データベースを使用したバックエンドAPI

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Cloudflareにログイン

```bash
npx wrangler login
```

ブラウザが開き、Cloudflareアカウントでの認証を求められます。

### 3. D1データベースの作成

```bash
npx wrangler d1 create gohan-db
```

このコマンドは以下のような出力を返します：

```
✅ Successfully created DB 'gohan-db' in region APAC
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "gohan-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 4. wrangler.tomlの更新

`wrangler.toml` ファイルを開き、`database_id` を上記の出力からコピーした実際のIDに更新します：

```toml
[[d1_databases]]
binding = "DB"
database_name = "gohan-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ここを実際のIDに更新
```

### 5. データベーススキーマの適用

```bash
# 本番環境に適用
npx wrangler d1 execute gohan-db --file=./schema.sql

# ローカル環境に適用（開発用）
npx wrangler d1 execute gohan-db --local --file=./schema.sql
```

### 6. ローカル開発サーバーの起動

```bash
npm run dev
```

これでローカルの `http://localhost:8787` でバックエンドが動作します。

### 7. 本番環境へのデプロイ

```bash
npm run deploy
```

デプロイが完了すると、WorkerのURLが表示されます（例: `https://gohan-backend.your-subdomain.workers.dev`）

## 📡 APIエンドポイント

すべてのエンドポイントは `X-Encrypted-Yw-ID` ヘッダーでユーザー認証が必要です。

### 冷蔵庫管理

- `GET /fridge` - 冷蔵庫の食材一覧を取得
- `PUT /fridge` - 冷蔵庫の食材を更新

### 献立管理

- `GET /plan` - 週間献立を取得
- `PUT /plan` - 週間献立を保存

### 買い物リスト

- `GET /shopping` - 買い物リストを取得
- `PUT /shopping` - 買い物リストを更新

### 目的管理

- `GET /goal` - 献立の目的を取得
- `PUT /goal` - 献立の目的を保存

## 🔧 トラブルシューティング

### データベースが見つからない

```bash
# データベースの一覧を確認
npx wrangler d1 list

# データベースの情報を確認
npx wrangler d1 info gohan-db
```

### ローカルデータベースのリセット

```bash
# ローカルのD1データベースを削除
rm -rf .wrangler/state

# スキーマを再適用
npx wrangler d1 execute gohan-db --local --file=./schema.sql
```

### デプロイエラー

```bash
# 認証状態を確認
npx wrangler whoami

# 再度ログイン
npx wrangler login
```

## 📝 開発メモ

- ローカル開発時は `.wrangler/state` ディレクトリにローカルD1データベースが作成されます
- 本番環境とローカル環境のデータベースは独立しています
- CORS設定により、すべてのオリジンからのリクエストを許可しています（本番環境では制限を推奨）
