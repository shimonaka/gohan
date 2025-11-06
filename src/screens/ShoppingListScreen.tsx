import { useState, useEffect } from 'react';
import { getAllIngredients } from '../data/menuData';

export default function ShoppingListScreen() {
  const [shoppingList, setShoppingList] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isGenerated, setIsGenerated] = useState(false);

  // ローカルストレージから買い物リストを読み込む
  useEffect(() => {
    const savedList = localStorage.getItem('shoppingList');
    if (savedList) {
      setShoppingList(JSON.parse(savedList));
      setIsGenerated(true);
    }
  }, []);

  // 買い物リストが変更されたらローカルストレージに保存
  useEffect(() => {
    if (shoppingList.length > 0 || localStorage.getItem('shoppingList')) {
      localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    }
  }, [shoppingList]);

  // 買い物リストを自動生成
  const generateShoppingList = () => {
    // 献立に必要な全ての食材を取得
    const allIngredients = getAllIngredients();

    // 冷蔵庫にある食材を取得
    const refrigeratorItems = JSON.parse(localStorage.getItem('refrigeratorItems') || '[]');

    // 冷蔵庫にない食材だけをフィルタリング
    const needed = allIngredients.filter(
      ingredient => !refrigeratorItems.includes(ingredient)
    );

    setShoppingList(needed);
    setIsGenerated(true);
  };

  // 手動で食材を追加
  const handleAdd = () => {
    if (inputValue.trim() === '') return;

    setShoppingList([...shoppingList, inputValue.trim()]);
    setInputValue('');
  };

  // 食材を削除
  const handleDelete = (index: number) => {
    setShoppingList(shoppingList.filter((_, i) => i !== index));
  };

  // Enterキーで追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  // リストをリセット
  const handleReset = () => {
    setShoppingList([]);
    setIsGenerated(false);
    localStorage.removeItem('shoppingList');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🛒 買い物リスト
        </h1>
        <p className="text-gray-600 mb-8">
          献立に必要な食材のうち、冷蔵庫にないものを自動でリストアップします。
        </p>

        {/* 買い物リスト生成ボタン */}
        {!isGenerated ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center mb-8">
            <div className="mb-6">
              <svg className="w-16 h-16 mx-auto text-blue-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p className="text-gray-600">
                今週の献立に必要な食材と、冷蔵庫の中身を比較して、<br />
                買うべき食材のリストを自動生成します。
              </p>
            </div>
            <button
              onClick={generateShoppingList}
              className="px-8 py-4 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-bold text-lg shadow-lg hover:shadow-xl"
            >
              買い物リストを作成
            </button>
          </div>
        ) : (
          <>
            {/* 買い物リスト */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  買うべき食材 ({shoppingList.length}個)
                </h2>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  リストをリセット
                </button>
              </div>

              {shoppingList.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-green-600 font-semibold text-lg mb-2">
                    🎉 すべての食材が揃っています！
                  </p>
                  <p className="text-gray-500 text-sm">
                    買い物に行く必要はありません
                  </p>
                </div>
              ) : (
                <ul className="space-y-2 mb-6">
                  {shoppingList.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{item}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(index)}
                        className="px-4 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium"
                      >
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 手動追加フォーム */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                手動で材料を追加
              </h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="追加する食材名を入力"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAdd}
                  className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors font-medium"
                >
                  追加
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                リストに載っていない食材も、ここから自由に追加できます
              </p>
            </div>
          </>
        )}

        {/* ヒント */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            💡 ヒント: 「冷蔵庫の登録」画面で食材を登録すると、買い物リストから自動的に除外されます！
          </p>
        </div>
      </div>
    </div>
  );
}
