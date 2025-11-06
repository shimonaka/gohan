export type MealGoalId =
  | 'hearty'
  | 'balanced'
  | 'quick'
  | 'budget'
  | 'recovery'
  | 'lowCarb'
  | 'kids';

export const MEAL_GOAL_IDS: MealGoalId[] = ['hearty', 'balanced', 'quick', 'budget', 'recovery', 'lowCarb', 'kids'];

export interface MealGoalDefinition {
  id: MealGoalId;
  name: string;
  icon: string;
  headline: string;
  description: string;
  bulletPoints: string[];
  note: string;
}

export const MEAL_GOALS: MealGoalDefinition[] = [
  {
    id: 'hearty',
    name: 'がっつり満足',
    icon: '🍖',
    headline: '肉料理でボリューム満点の献立',
    description:
      '豚肉・牛肉・鶏もも肉を中心に、揚げ物や炒め物など満足感のある調理法を採用。1食600〜800kcalで大満足。',
    bulletPoints: ['主菜はしっかり肉料理', 'ご飯は普通〜大盛り推奨', '副菜もボリューム重視'],
    note: '週内で肉の種類や調理法を変えて飽きずに続けられるようにします。',
  },
  {
    id: 'balanced',
    name: 'ヘルシーバランス',
    icon: '🥗',
    headline: '彩り豊かな野菜で栄養バランス◎',
    description:
      '野菜150g以上を目安に、蒸す・煮る・焼くを中心に脂質を抑えた献立。きのこ・海藻・豆類も積極的に活用。',
    bulletPoints: ['野菜は150g以上', '脂質控えめの調理法', '彩り豊かな副菜で栄養バランス◎'],
    note: '蒸し野菜やサラダを組み合わせて、見た目にも華やかな食卓を演出します。',
  },
  {
    id: 'quick',
    name: '時短・簡単',
    icon: '⏱️',
    headline: '15〜20分で完成、工程もシンプル',
    description:
      '工程3ステップ以内で、下処理の少ない食材や作り置き・冷凍食材を活用。包丁いらずレシピも積極的に採用。',
    bulletPoints: ['調理時間15〜20分以内', '工程3ステップ以内', '冷凍・作り置き食材の活用OK'],
    note: 'レンジ調理やワンパン調理を活用して、忙しい日の夕食を素早く仕上げます。',
  },
  {
    id: 'budget',
    name: '節約・経済的',
    icon: '💴',
    headline: '1食あたり200〜300円、賢く節約',
    description:
      '旬野菜や鶏むね肉、豆腐、もやしなど価格安定な食材を使い回し。豆腐や厚揚げ、きのこでかさ増しして満足感をキープ。',
    bulletPoints: ['旬食材＆定番節約食材を活用', '豆腐・厚揚げ・きのこでかさ増し', '食材の使い回しでムダなし'],
    note: '味付けのバリエーションを工夫し、同じ食材でも飽きずに続けられる構成にします。',
  },
  {
    id: 'recovery',
    name: '疲労回復',
    icon: '💪',
    headline: 'スタミナ食材でしっかりチャージ',
    description:
      '豚肉・うなぎ・玄米などビタミンB群、梅やレモンなどクエン酸、にんにく・しょうがなどスタミナ食材を組み合わせ。',
    bulletPoints: ['ビタミンB群豊富な食材を主菜に', 'クエン酸で疲労物質をケア', 'にんにく・しょうがで体を温める'],
    note: '消化に優しい調理法も織り交ぜ、疲れた身体に優しい献立を目指します。',
  },
  {
    id: 'lowCarb',
    name: '低糖質・ゆる糖質オフ',
    icon: '🥒',
    headline: '主食控えめでも満足できるボリューム',
    description:
      '主食は控えめに、カリフラワーライスなどの代替や葉物野菜・きのこ・海藻でボリュームアップ。糖質の高い野菜は控えめに。',
    bulletPoints: ['主食少なめまたは代替主食', 'たんぱく質＋野菜で満腹感', '糖質の多い野菜は控えめ'],
    note: '糖質40g以下を目安に、香辛料やハーブで味にメリハリを付けて満足度を高めます。',
  },
  {
    id: 'kids',
    name: '子どもよろこぶ',
    icon: '🎈',
    headline: '人気の味付けでパクパク食べやすく',
    description:
      'カレー・ケチャップ・甘辛など子どもが好きな味付けを中心に。一口サイズや彩りの工夫で食べやすさと栄養バランスを両立。',
    bulletPoints: ['一口サイズで食べやすく', '人気の味付けで楽しく', '栄養バランスもキープ'],
    note: '苦手な野菜は細かく刻んで混ぜ込み、見た目もカラフルになるよう意識します。',
  },
];

export const COMMON_MEAL_GOAL_RULES = [
  '主食・主菜・副菜のバランスを基本に',
  '旬の食材を取り入れて季節感を演出',
  '調理法や味付けは同じものが続かないように',
  'スーパーで手に入りやすい食材で再現可能に',
  '家庭で作りやすい手順と調味料を採用',
];

export function isMealGoalId(value: unknown): value is MealGoalId {
  return typeof value === 'string' && MEAL_GOAL_IDS.includes(value as MealGoalId);
}
