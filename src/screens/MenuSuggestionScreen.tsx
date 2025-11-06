import { weeklyMenus, menuIngredients } from '../data/menuData';

export default function MenuSuggestionScreen() {
  // クックパッドで検索
  const handleCookpadSearch = (menuName: string) => {
    const searchUrl = `https://cookpad.com/search/${encodeURIComponent(menuName)}`;
    window.open(searchUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          📅 今週の献立提案
        </h1>
        <p className="text-gray-600 mb-8">
          1週間分の献立をご提案します。レシピはクックパッドで検索できます！
        </p>

        {/* 献立リスト */}
        <div className="space-y-4">
          {weeklyMenus.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {item.day}
                    </span>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {item.menu}
                    </h2>
                  </div>

                  {/* 必要な食材リスト */}
                  <div className="ml-2">
                    <p className="text-sm text-gray-500 mb-2">必要な食材:</p>
                    <div className="flex flex-wrap gap-2">
                      {menuIngredients[item.menu]?.map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* クックパッド検索ボタン */}
                <button
                  onClick={() => handleCookpadSearch(item.menu)}
                  className="ml-4 px-6 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  クックパッドで検索
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 注意事項 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 ヒント: 「買い物リスト」画面で、これらの献立に必要な食材のうち、冷蔵庫にないものだけをリストアップできます！
          </p>
        </div>
      </div>
    </div>
  );
}
