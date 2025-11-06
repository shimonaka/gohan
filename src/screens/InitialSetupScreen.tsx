import { Link } from 'react-router-dom';

export default function InitialSetupScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🍚 今日のゴハン、何にする？
          </h1>
          <p className="text-xl text-gray-600">
            毎日の献立と買い物を楽にする、あなたのアシスタント
          </p>
        </div>

        {/* アプリの説明 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            このアプリでできること
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <span className="text-3xl">📅</span>
              <div>
                <h3 className="font-bold text-lg text-gray-900">1週間分の献立提案</h3>
                <p className="text-gray-600">
                  毎週の献立をご提案。各料理のレシピはクックパッドで簡単に検索できます。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-3xl">🛒</span>
              <div>
                <h3 className="font-bold text-lg text-gray-900">賢い買い物リスト</h3>
                <p className="text-gray-600">
                  献立に必要な食材から、冷蔵庫にあるものを自動で引き算。買うべきものだけをリストアップします。
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-3xl">❄️</span>
              <div>
                <h3 className="font-bold text-lg text-gray-900">冷蔵庫管理</h3>
                <p className="text-gray-600">
                  家にある食材を登録して、無駄な買い物を防ぎます。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* クイックスタートガイド */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            さっそく始めましょう！
          </h2>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <div className="bg-blue-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">冷蔵庫の中身を登録</h3>
                <p className="text-sm text-gray-600">家にある食材を登録してください</p>
              </div>
              <Link
                to="/refrigerator"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
              >
                登録する
              </Link>
            </div>

            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
              <div className="bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">献立を確認</h3>
                <p className="text-sm text-gray-600">今週のおすすめ献立をチェック</p>
              </div>
              <Link
                to="/menu"
                className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium"
              >
                確認する
              </Link>
            </div>

            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
              <div className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900">買い物リストを作成</h3>
                <p className="text-sm text-gray-600">必要な食材を自動でリストアップ</p>
              </div>
              <Link
                to="/shopping"
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
              >
                作成する
              </Link>
            </div>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>毎日の献立決めから解放されましょう 🎉</p>
        </div>
      </div>
    </div>
  );
}
