import type { MealGoalId } from '../data/mealGoals';
import { MENU_LIBRARY, type MenuItem } from '../data/menuData';

interface GoalRule {
  filter: (menu: MenuItem[], fridgeSet: Set<string>) => MenuItem[];
  diversity?: {
    traits?: string[];
    maxPerTrait?: number;
  };
  calorieTarget?: {
    min: number;
    max: number;
  };
  prefer?: string[];
  avoid?: string[];
}

const pickByTrait = (items: MenuItem[], traits: string[]): MenuItem[] => {
  if (!traits.length) return items;
  return items.filter((item) => item.traits?.some((trait) => traits.includes(trait)));
};

const filterByTraits = (include: string[], exclude: string[]) => {
  return (items: MenuItem[]) =>
    items.filter((item) => {
      const hasInclude = include.length === 0 || item.traits?.some((trait) => include.includes(trait));
      const hasExclude = item.traits?.some((trait) => exclude.includes(trait));
      return hasInclude && !hasExclude;
    });
};

const filterByCalories = (min: number, max: number) => (items: MenuItem[]) =>
  items.filter((item) => {
    if (item.calories == null) return true;
    return item.calories >= min && item.calories <= max;
  });

const filterByCostRank = (allowed: string[]) => (items: MenuItem[]) =>
  items.filter((item) => (item.costRank ? allowed.includes(item.costRank) : true));

const GOAL_RULES: Record<MealGoalId, GoalRule> = {
  hearty: {
    filter: (menus) => filterByTraits(['hearty', 'protein_beef', 'protein_pork', 'fried'], ['light'])(menus),
    calorieTarget: { min: 600, max: 850 },
    prefer: ['hearty', 'starch_heavy'],
  },
  balanced: {
    filter: (menus) => filterByTraits(['balanced', 'veg_forward', 'low_carb'], ['fried', 'starch_heavy'])(menus),
    calorieTarget: { min: 400, max: 600 },
    prefer: ['veg_forward', 'immune_support'],
  },
  quick: {
    filter: (menus) => menus.filter((item) => (item.prepTime ?? 999) <= 20 && !item.traits?.includes('complex')),
    prefer: ['quick'],
  },
  budget: {
    filter: (menus) => filterByCostRank(['low'])(menus),
    prefer: ['budget'],
  },
  recovery: {
    filter: (menus) => filterByTraits(['stamina', 'protein_pork', 'immune_support'], ['fried'])(menus),
    prefer: ['stamina', 'protein_pork'],
  },
  lowCarb: {
    filter: (menus) => filterByTraits(['low_carb', 'protein_fish', 'protein_plant'], ['starch_heavy'])(menus),
    calorieTarget: { min: 300, max: 550 },
    prefer: ['low_carb'],
  },
  kids: {
    filter: (menus) => filterByTraits(['kid_friendly', 'sweet_savory'], ['spicy'])(menus),
    prefer: ['kid_friendly'],
  },
};

const applyGoalRule = (
  menus: MenuItem[],
  fridgeSet: Set<string>,
  goal: MealGoalId | null
): MenuItem[] => {
  if (!goal) return menus;
  const rule = GOAL_RULES[goal];
  if (!rule) return menus;

  let filtered = rule.filter ? rule.filter(menus, fridgeSet) : menus;

  if (rule.calorieTarget) {
    filtered = filterByCalories(rule.calorieTarget.min, rule.calorieTarget.max)(filtered);
    if (filtered.length === 0) {
      filtered = menus;
    }
  }

  if (rule.prefer && rule.prefer.length > 0) {
    const preferred = pickByTrait(filtered, rule.prefer);
    if (preferred.length > 0) {
      filtered = preferred;
    }
  }

  return filtered.length > 0 ? filtered : menus;
};

export function getGoalFilteredMenus(goal: MealGoalId | null): { mains: MenuItem[]; sides: MenuItem[] } {
  const mains = MENU_LIBRARY.filter((item) => item.category === 'main');
  const sides = MENU_LIBRARY.filter((item) => item.category === 'side');

  if (!goal) {
    return { mains, sides };
  }

  const fridgeSet = new Set<string>();
  const rule = GOAL_RULES[goal];
  if (!rule) {
    return { mains, sides };
  }

  const filteredMains = applyGoalRule(mains, fridgeSet, goal);
  const filteredSides = applyGoalRule(sides, fridgeSet, goal);

  return {
    mains: filteredMains.length > 0 ? filteredMains : mains,
    sides: filteredSides.length > 0 ? filteredSides : sides,
  };
}
