import { useState, useEffect } from 'react';

export default function RefrigeratorScreen() {
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  // ローカルストレージから食材リストを読み込む
  useEffect(() => {
    const savedItems = localStorage.getItem('refrigeratorItems');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  // 食材リストが変更されたらローカルストレージに保存
  useEffect(() => {
    if (items.length > 0 || localStorage.getItem('refrigeratorItems')) {
      localStorage.setItem('refrigeratorItems', JSON.stringify(items));
    }
  }, [items]);

  // 食材を追加
  const handleAdd = () => {
    if (inputValue.trim() === '') return;

    setItems([...items, inputValue.trim()]);
    setInputValue('');
  };

  // 食材を削除
  const handleDelete = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Enterキーで追加
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          冷蔵庫の登録
        </h1>
        <p className="text-gray-600 mb-8">
          家にある食材を登録してください。
        </p>

        {/* 入力フォーム */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="食材名を入力（例：にんじん）"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAdd}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
              追加
            </button>
          </div>
        </div>

        {/* 食材リスト */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            登録されている食材 ({items.length}個)
          </h2>

          {items.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだ食材が登録されていません
            </p>
          ) : (
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-900">{item}</span>
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
      </div>
    </div>
  );
}
