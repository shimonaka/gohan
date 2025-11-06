# 🍚 今日のゴハン、何にする？

毎日の献立を考える手間と、それに伴う買い物の手間を削減するWebアプリです。

## 🎯 アプリの特徴

- **1週間分の献立提案**: 毎週の献立を自動提案
- **クックパッド連携**: 各メニューのレシピをワンクリックで検索
- **賢い買い物リスト**: 冷蔵庫の中身を考慮した買い物リストを自動生成
- **冷蔵庫管理**: 家にある食材を簡単に管理

## 🛠 技術スタック

### フロントエンド
- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **React Router v6** - ページ遷移
- **TailwindCSS** - モダンなスタイリング

### バックエンド
- **Cloudflare Workers** - サーバーレス実行環境
- **Cloudflare D1** - SQLiteベースのデータベース
- **Zod** - スキーマバリデーション

## 🚀 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm または yarn
- Cloudflareアカウント（バックエンドのデプロイに必要）

### フロントエンドのセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

### バックエンドのセットアップ

```bash
# バックエンドディレクトリに移動
cd backend

# 依存関係のインストール
npm install

# Cloudflareにログイン
npx wrangler login

# D1データベースを作成
npx wrangler d1 create gohan-db

# 上記コマンドの出力からdatabase_idをコピーし、wrangler.tomlのdatabase_idを更新

# データベースのスキーマを適用
npx wrangler d1 execute gohan-db --file=./schema.sql

# ローカル開発サーバーの起動
npm run dev

# 本番環境へのデプロイ
npm run deploy
```

### バックエンドのデプロイ後

1. デプロイされたWorkerのURLを確認
2. フロントエンドの以下のファイルでAPI_BASEを更新：
   - `src/utils/planner.ts`
   - `src/utils/mealGoalStorage.ts`
3. 例: `const API_BASE = 'https://gohan-backend.your-subdomain.workers.dev';`

## 📁 プロジェクト構成

```
src/
├── screens/              # 画面コンポーネント
│   ├── InitialSetupScreen.tsx      # ホーム画面
│   ├── RefrigeratorScreen.tsx      # 冷蔵庫管理
│   ├── MenuSuggestionScreen.tsx    # 献立提案
│   └── ShoppingListScreen.tsx      # 買い物リスト
├── components/           # 共通コンポーネント
│   └── Navigation.tsx              # ナビゲーション
├── data/                # データ定義
│   └── menuData.ts                 # 献立データ
├── App.tsx              # ルーティング
└── main.tsx             # エントリーポイント
```

## 💡 使い方

1. **冷蔵庫の中身を登録**: 家にある食材を登録
2. **献立を確認**: 今週のおすすめ献立をチェック
3. **買い物リストを作成**: 必要な食材を自動でリストアップ

## 🔮 今後の予定

- AI（Claude API）を使った献立の自動生成
- 家族構成・アレルギー情報の管理
- 栄養バランスの分析
- カロリー計算機能
- レシピのお気に入り登録

## 📝 ライセンス

MIT License
