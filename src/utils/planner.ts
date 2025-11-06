import { DAYS_OF_WEEK, MENU_LIBRARY } from '../data/menuData';
import type { MenuItem } from '../data/menuData';
import type { MealGoalId } from '../data/mealGoals';
import { getGoalFilteredMenus } from './goalRules';

const PLAN_STORAGE_KEY = 'weeklyMealPlan';
const SHOPPING_STORAGE_KEY = 'shoppingListState';
const FRIDGE_STORAGE_KEY = 'refrigeratorItems';

const API_BASE = 'https://backend.youware.com';

export type MenuCategory = MenuItem['category'];

export interface StoredPlanDay {
  day: string;
  mainId: string | null;
  sideIds: string[];
}

export interface StoredPlan {
  goalCategory: string | null;
  days: StoredPlanDay[];
  generatedAt: string;
  fridgeSnapshot: string[];
}

export interface PlanViewDay {
  day: string;
  main: MenuItem | null;
  sides: MenuItem[];
  missingIngredients: string[];
  haveIngredients: string[];
  coverage: number;
  traits?: string[];
  score?: number;
}

export interface ShoppingState {
  auto: string[];
  manual: string[];
  generatedAt?: string | null;
}

const normalizeList = (items: string[]): string[] =>
  items
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .sort((a, b) => a.localeCompare(b));

const listsAreEqual = (a: string[], b: string[]): boolean => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const fetchJSON = async <T>(input: RequestInfo, init?: RequestInit, timeout: number = 5000): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

const withFallback = async <T>(fn: () => Promise<T>, fallback: () => T): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    console.warn('Backend request failed, falling back to local storage', error);
    return fallback();
  }
};

export const loadFridgeItems = async (): Promise<string[]> => {
  return withFallback(async () => {
    const data = await fetchJSON<{ items: string[] }>(`${API_BASE}/fridge`, {
      credentials: 'include',
    });
    localStorage.setItem(FRIDGE_STORAGE_KEY, JSON.stringify(data.items));
    return data.items;
  }, () => {
    try {
      const raw = localStorage.getItem(FRIDGE_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
};

export const replaceFridgeItems = async (items: string[]): Promise<void> => {
  localStorage.setItem(FRIDGE_STORAGE_KEY, JSON.stringify(items));
  await withFallback(
    () =>
      fetchJSON(`${API_BASE}/fridge`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      }),
    () => items
  );
};

export const loadStoredPlan = async (): Promise<StoredPlan | null> => {
  return withFallback(async () => {
    const data = await fetchJSON<{ plan: StoredPlan | null }>(`${API_BASE}/plan`, {
      credentials: 'include',
    });
    if (data.plan) {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(data.plan));
    }
    return data.plan;
  }, () => {
    try {
      const localGoalRaw = localStorage.getItem('mealGoalPreference');
      const localGoal = localGoalRaw ? (JSON.parse(localGoalRaw) as string | null) : null;
      const raw = localStorage.getItem(PLAN_STORAGE_KEY);
      if (!raw) {
        return localGoal
          ? {
              goalCategory: localGoal,
              days: [],
              generatedAt: new Date().toISOString(),
              fridgeSnapshot: [],
            }
          : null;
      }
      const plan = JSON.parse(raw) as StoredPlan;
      plan.goalCategory = plan.goalCategory ?? localGoal ?? null;
      if (!plan.days || !Array.isArray(plan.days)) return null;
      return plan;
    } catch {
      return null;
    }
  });
};

const saveStoredPlanLocal = (plan: StoredPlan) => {
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
};

const saveStoredPlan = async (plan: StoredPlan) => {
  saveStoredPlanLocal(plan);
  await withFallback(
    () =>
      fetchJSON(`${API_BASE}/plan`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalCategory: plan.goalCategory,
          days: plan.days,
          generatedAt: plan.generatedAt,
          fridgeSnapshot: plan.fridgeSnapshot,
        }),
      }),
    () => plan
  );
};

interface RankedMenu {
  item: MenuItem;
  missing: string[];
  coverage: number;
  score: number;
}

const computeScore = (
  item: MenuItem,
  missingCount: number,
  goal: MealGoalId | null
): number => {
  let score = 100 - missingCount * 8;

  if (goal) {
    if (goal === 'hearty' && item.calories) score += Math.min(item.calories / 10, 30);
    if (goal === 'balanced' && item.traits?.includes('veg_forward')) score += 20;
    if (goal === 'quick' && (item.prepTime ?? 99) <= 20) score += 25;
    if (goal === 'budget' && item.costRank === 'low') score += 20;
    if (goal === 'recovery' && item.traits?.includes('stamina')) score += 20;
    if (goal === 'lowCarb' && item.traits?.includes('low_carb')) score += 25;
    if (goal === 'kids' && item.traits?.includes('kid_friendly')) score += 25;
  }

  const timePenalty = Math.max((item.prepTime ?? 30) - 20, 0);
  score -= timePenalty;

  return score;
};

const selectUniqueByTrait = (ranked: RankedMenu[], maxPerTrait = 2): RankedMenu[] => {
  const usedTraits = new Map<string, number>();
  const result: RankedMenu[] = [];
  for (const candidate of ranked) {
    const traits = candidate.item.traits ?? [];
    if (traits.some((trait) => (usedTraits.get(trait) ?? 0) >= maxPerTrait)) {
      continue;
    }
    traits.forEach((trait) => {
      usedTraits.set(trait, (usedTraits.get(trait) ?? 0) + 1);
    });
    result.push(candidate);
  }
  return result.length > 0 ? result : ranked;
};

const rankMenusByFit = (menus: MenuItem[], fridgeSet: Set<string>, goal: MealGoalId | null): RankedMenu[] =>
  menus
    .map((item) => {
      const missing = item.ingredients.filter((ingredient) => !fridgeSet.has(ingredient));
      const coverage = item.ingredients.length === 0 ? 1 : (item.ingredients.length - missing.length) / item.ingredients.length;
      const score = computeScore(item, missing.length, goal);
      return { item, missing, coverage, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.missing.length !== b.missing.length) return a.missing.length - b.missing.length;
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      return a.item.name.localeCompare(b.item.name);
    });

const generatePlanDays = (fridgeItems: string[], goal: MealGoalId | null): StoredPlanDay[] => {
  const fridgeSet = new Set(fridgeItems);
  const { mains: goalFilteredMains, sides: goalFilteredSides } = getGoalFilteredMenus(goal);
  const mainCandidates = goalFilteredMains.length > 0 ? goalFilteredMains : MENU_LIBRARY.filter((menu) => menu.category === 'main');
  const sideCandidates = goalFilteredSides.length > 0 ? goalFilteredSides : MENU_LIBRARY.filter((menu) => menu.category === 'side');

  const rankedMains = selectUniqueByTrait(rankMenusByFit(mainCandidates, fridgeSet, goal));
  const rankedSides = selectUniqueByTrait(rankMenusByFit(sideCandidates, fridgeSet, goal), 3);

  const usedMainIds = new Set<string>();
  const usedSideIds = new Set<string>();

  const pickNext = (ranked: RankedMenu[], used: Set<string>, fallback: MenuItem[]) => {
    for (const candidate of ranked) {
      if (!candidate.item.id || used.has(candidate.item.id)) continue;
      used.add(candidate.item.id);
      return candidate.item;
    }
    const fallbackItem = fallback.find((item) => !used.has(item.id));
    if (fallbackItem) {
      used.add(fallbackItem.id);
      return fallbackItem;
    }
    return fallback[0] ?? null;
  };

  const days = DAYS_OF_WEEK.map((day) => {
    const main = pickNext(rankedMains, usedMainIds, mainCandidates);
    const side = pickNext(rankedSides, usedSideIds, sideCandidates);

    return {
      day,
      mainId: main ? main.id : null,
      sideIds: side ? [side.id] : [],
    };
  });

  return days;
};

const ensurePlanForFridge = (fridgeItems: string[], force = false, goal: MealGoalId | null = null): StoredPlan => {
  const normalized = normalizeList(fridgeItems);
  const existing = (() => {
    try {
      const raw = localStorage.getItem(PLAN_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as StoredPlan;
      if (goal !== null && parsed.goalCategory !== goal) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  })();

  if (
    !force &&
    existing &&
    existing.days.length === DAYS_OF_WEEK.length &&
    listsAreEqual(existing.fridgeSnapshot, normalized)
  ) {
    return existing;
  }

  const generatedDays = generatePlanDays(normalized, goal);
  let newPlan: StoredPlan = {
    goalCategory: goal,
    days: generatedDays,
    generatedAt: new Date().toISOString(),
    fridgeSnapshot: normalized,
  };

  newPlan = adjustForDiversity(newPlan, goal);

  saveStoredPlan(newPlan);
  return newPlan;
};

export const planToView = (plan: StoredPlan, fridgeItems: string[]): PlanViewDay[] => {
  const fridgeSet = new Set(fridgeItems);

  return plan.days.map((dayPlan) => {
    const main = dayPlan.mainId ? MENU_LIBRARY.find((menu) => menu.id === dayPlan.mainId) ?? null : null;
    const sides = dayPlan.sideIds
      .map((id) => MENU_LIBRARY.find((menu) => menu.id === id))
      .filter((menu): menu is MenuItem => Boolean(menu));

    const allIngredients = [
      ...(main?.ingredients ?? []),
      ...sides.flatMap((side) => side.ingredients),
    ];
    const traitHighlights = Array.from(
      new Set([
        ...(main?.traits ?? []),
        ...sides.flatMap((side) => side.traits ?? []),
      ])
    ).slice(0, 4);
    const uniqueIngredients = Array.from(new Set(allIngredients));

    const haveIngredients = uniqueIngredients.filter((ingredient) => fridgeSet.has(ingredient));
    const missingIngredients = uniqueIngredients.filter((ingredient) => !fridgeSet.has(ingredient));

    const coverage = uniqueIngredients.length === 0
      ? 1
      : haveIngredients.length / uniqueIngredients.length;

    const missingCount = missingIngredients.length;
    const baseScore = main
      ? computeScore(main, missingCount, plan.goalCategory as MealGoalId | null) - (missingCount > 2 ? missingCount * 5 : 0)
      : 0;

    return {
      day: dayPlan.day,
      main,
      sides,
      missingIngredients,
      haveIngredients,
      coverage,
      traits: traitHighlights,
      score: Math.max(baseScore, 0),
    };
  });
};

export const collectMissingIngredients = (planView: PlanViewDay[]): string[] => {
  const missing = new Set<string>();
  planView.forEach((day) => {
    day.missingIngredients.forEach((ingredient) => missing.add(ingredient));
  });
  return Array.from(missing);
};

export const preparePlan = async (
  fridgeItems: string[],
  options?: { forceRegenerate?: boolean; goal?: MealGoalId | null }
) => {
  if (options?.goal !== undefined) {
    if (options.goal) {
      localStorage.setItem('mealGoalPreference', JSON.stringify(options.goal));
    } else {
      localStorage.removeItem('mealGoalPreference');
    }
  }

  let plan = ensurePlanForFridge(fridgeItems, options?.forceRegenerate ?? false, options?.goal ?? null);
  if (options?.forceRegenerate || options?.goal !== undefined) {
    await saveStoredPlan(plan);
    await withFallback(
      () =>
        fetchJSON(`${API_BASE}/goal`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: plan.goalCategory }),
        }),
      () => ({ success: true })
    );
  }
  let view = planToView(plan, fridgeItems);
  view = view.map((day) => {
    if (!day.main) return day;
    const missingCount = day.missingIngredients.length;
    const goalContext = (options?.goal ?? plan.goalCategory) as MealGoalId | null;
    const baseScore = computeScore(day.main, missingCount, goalContext) -
      (missingCount > 2 ? missingCount * 5 : 0);
    return {
      ...day,
      score: Math.max(baseScore, 0),
    };
  });
  const missing = collectMissingIngredients(view);

  const scoreAverage = view.length === 0 ? 0 : view.reduce((acc, day) => acc + (day.score ?? 0), 0) / view.length;

  const localShopping = loadShoppingStateLocal();
  if (missing.length > 0 || localShopping.manual.length > 0) {
    await withFallback(
      () =>
        fetchJSON(`${API_BASE}/shopping`, {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auto: missing,
            manual: localShopping.manual,
            generatedAt: plan.generatedAt,
          }),
        }),
      () => ({ auto: missing })
    );
  }

  return {
    plan,
    view,
    missing,
    metadata: {
      scoreAverage,
    },
  };
};

const DISTRIBUTION_RULES: Record<MealGoalId, { maxSimilarTrait?: string; minProteinDiversity?: number }> = {
  hearty: { maxSimilarTrait: 'protein', minProteinDiversity: 2 },
  balanced: { maxSimilarTrait: 'veg_forward', minProteinDiversity: 2 },
  quick: { maxSimilarTrait: 'quick', minProteinDiversity: 1 },
  budget: { maxSimilarTrait: 'budget', minProteinDiversity: 1 },
  recovery: { maxSimilarTrait: 'stamina', minProteinDiversity: 2 },
  lowCarb: { maxSimilarTrait: 'low_carb', minProteinDiversity: 2 },
  kids: { maxSimilarTrait: 'kid_friendly', minProteinDiversity: 1 },
};

const adjustForDiversity = (plan: StoredPlan, goal: MealGoalId | null): StoredPlan => {
  if (!goal) return plan;
  const rule = DISTRIBUTION_RULES[goal];
  if (!rule) return plan;

  const proteinTypes = new Set<string>();

  const updatedDays = plan.days.map((day) => {
    if (!day.mainId) return day;
    const menu = MENU_LIBRARY.find((item) => item.id === day.mainId);
    if (!menu) return day;

    const traits = menu.traits ?? [];
    const proteinTrait = traits.find((trait) => trait.startsWith('protein_'));
    if (proteinTrait) {
      proteinTypes.add(proteinTrait);
    }

    return day;
  });

  if (proteinTypes.size < (rule.minProteinDiversity ?? 1)) {
    const available = MENU_LIBRARY.filter((item) => item.category === 'main' && item.traits?.some((trait) => trait.startsWith('protein_')));
    const missingProtein = [...new Set(available.map((item) => item.traits?.find((trait) => trait.startsWith('protein_'))).filter(Boolean))];
    if (missingProtein.length > 0) {
      const targetProtein = missingProtein.find((protein) => !proteinTypes.has(protein!));
      if (targetProtein) {
        const replacement = available.find((item) => item.traits?.includes(targetProtein));
        if (replacement) {
          const index = updatedDays.findIndex((day) => {
            const current = MENU_LIBRARY.find((item) => item.id === day.mainId);
            return current && !(current.traits ?? []).includes(targetProtein);
          });
          if (index >= 0) {
            updatedDays[index] = {
              ...updatedDays[index],
              mainId: replacement.id,
            };
          }
        }
      }
    }
  }

  return { ...plan, days: updatedDays };
};

const loadShoppingStateLocal = (): ShoppingState => {
  try {
    const raw = localStorage.getItem(SHOPPING_STORAGE_KEY);
    if (!raw) return { auto: [], manual: [], generatedAt: null };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return { auto: parsed, manual: [], generatedAt: null };
    }
    const { auto, manual, generatedAt } = parsed as ShoppingState & { generatedAt?: string | null };
    return {
      auto: Array.isArray(auto) ? auto : [],
      manual: Array.isArray(manual) ? manual : [],
      generatedAt: generatedAt ?? null,
    };
  } catch {
    return { auto: [], manual: [], generatedAt: null };
  }
};

export const loadShoppingState = async (): Promise<ShoppingState> => {
  return withFallback(async () => {
    const data = await fetchJSON<{ state: ShoppingState }>(`${API_BASE}/shopping`, {
      credentials: 'include',
    });
    localStorage.setItem(SHOPPING_STORAGE_KEY, JSON.stringify(data.state));
    return data.state;
  }, loadShoppingStateLocal);
};

const saveShoppingStateLocal = (state: ShoppingState) => {
  localStorage.setItem(
    SHOPPING_STORAGE_KEY,
    JSON.stringify({
      auto: Array.from(new Set(state.auto)),
      manual: Array.from(new Set(state.manual)),
      generatedAt: state.generatedAt ?? null,
    })
  );
};

export const saveShoppingState = async (state: ShoppingState) => {
  saveShoppingStateLocal(state);
  await withFallback(
    () =>
      fetchJSON(`${API_BASE}/shopping`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auto: state.auto,
          manual: state.manual,
          generatedAt: state.generatedAt ?? null,
        }),
      }),
    () => state
  );
};

export const syncAutoShoppingItems = async (
  autoItems: string[],
  previousState: ShoppingState
): Promise<ShoppingState> => {
  const uniqueAuto = Array.from(new Set(autoItems));
  const manual = previousState.manual.filter((item) => !uniqueAuto.includes(item));
  const nextState: ShoppingState = {
    auto: uniqueAuto,
    manual,
    generatedAt: previousState.generatedAt ?? null,
  };
  await saveShoppingState(nextState);
  return nextState;
};

export const addManualShoppingItem = async (
  item: string,
  state: ShoppingState
): Promise<ShoppingState> => {
  const trimmed = item.trim();
  if (!trimmed) return state;
  if (state.auto.includes(trimmed) || state.manual.includes(trimmed)) return state;
  const nextState: ShoppingState = {
    auto: state.auto,
    manual: [...state.manual, trimmed],
    generatedAt: state.generatedAt ?? null,
  };
  await saveShoppingState(nextState);
  return nextState;
};

export const removeShoppingItem = async (
  item: string,
  source: 'auto' | 'manual',
  state: ShoppingState
): Promise<ShoppingState> => {
  const nextState: ShoppingState = {
    auto: source === 'auto' ? state.auto.filter((name) => name !== item) : state.auto,
    manual: source === 'manual' ? state.manual.filter((name) => name !== item) : state.manual,
    generatedAt: state.generatedAt ?? null,
  };
  await saveShoppingState(nextState);
  return nextState;
};

export const clearShoppingState = async (): Promise<ShoppingState> => {
  const cleared: ShoppingState = { auto: [], manual: [], generatedAt: null };
  await saveShoppingState(cleared);
  return cleared;
};
