# 🍚 今日のゴハン、何にする？

毎日の献立を考える手間と、それに伴う買い物の手間を削減するWebアプリです。

## 🎯 アプリの特徴

- **1週間分の献立提案**: 毎週の献立を自動提案
- **クックパッド連携**: 各メニューのレシピをワンクリックで検索
- **賢い買い物リスト**: 冷蔵庫の中身を考慮した買い物リストを自動生成
- **冷蔵庫管理**: 家にある食材を簡単に管理

## 🛠 技術スタック

- **React 18** - UIライブラリ
- **TypeScript** - 型安全な開発
- **Vite** - 高速ビルドツール
- **React Router v6** - ページ遷移
- **TailwindCSS** - モダンなスタイリング
- **localStorage** - データの永続化

## 🚀 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

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
