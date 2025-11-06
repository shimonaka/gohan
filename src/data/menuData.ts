// 献立データの型定義
export interface MenuItem {
  day: string;
  menu: string;
}

// 1週間分のダミー献立データ
export const weeklyMenus: MenuItem[] = [
  { day: '月曜日', menu: 'カレーライス' },
  { day: '火曜日', menu: '豚の生姜焼き' },
  { day: '水曜日', menu: '肉じゃが' },
  { day: '木曜日', menu: 'ハンバーグ' },
  { day: '金曜日', menu: '麻婆豆腐' },
  { day: '土曜日', menu: 'チキンソテー' },
  { day: '日曜日', menu: 'パスタカルボナーラ' },
];

// 各献立に必要な食材のマッピング
export const menuIngredients: { [key: string]: string[] } = {
  'カレーライス': ['豚肉', 'じゃがいも', 'にんじん', '玉ねぎ', 'カレールー'],
  '豚の生姜焼き': ['豚肉', '玉ねぎ', 'しょうが', 'しょうゆ', 'みりん'],
  '肉じゃが': ['牛肉', 'じゃがいも', 'にんじん', '玉ねぎ', 'しらたき', 'しょうゆ', 'みりん'],
  'ハンバーグ': ['合いびき肉', '玉ねぎ', 'パン粉', '卵', 'ケチャップ', 'ウスターソース'],
  '麻婆豆腐': ['豚ひき肉', '豆腐', 'ねぎ', 'にんにく', 'しょうが', '豆板醤', 'しょうゆ'],
  'チキンソテー': ['鶏もも肉', 'じゃがいも', 'ブロッコリー', 'バター', 'レモン'],
  'パスタカルボナーラ': ['パスタ', 'ベーコン', '卵', '生クリーム', 'パルメザンチーズ', '黒こしょう'],
};

// すべての献立に必要な食材を重複なく取得
export const getAllIngredients = (): string[] => {
  const ingredients = new Set<string>();
  weeklyMenus.forEach(item => {
    const itemIngredients = menuIngredients[item.menu] || [];
    itemIngredients.forEach(ing => ingredients.add(ing));
  });
  return Array.from(ingredients);
};
