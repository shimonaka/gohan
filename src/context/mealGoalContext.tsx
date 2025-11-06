import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MEAL_GOAL_IDS, type MealGoalId, isMealGoalId } from '../data/mealGoals';
import { fetchMealGoal, persistMealGoal } from '../utils/mealGoalStorage';

interface MealGoalContextValue {
  goal: MealGoalId | null;
  isLoading: boolean;
  updateGoal: (next: MealGoalId | null) => Promise<void>;
}

const MealGoalContext = createContext<MealGoalContextValue | undefined>(undefined);

interface MealGoalProviderProps {
  children: React.ReactNode;
}

export function MealGoalProvider({ children }: MealGoalProviderProps) {
  const [goal, setGoal] = useState<MealGoalId | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function bootstrap() {
      setIsLoading(true);
      try {
        const stored = await fetchMealGoal();
        if (isMounted) {
          setGoal(stored);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void bootstrap();
    return () => {
      isMounted = false;
    };
  }, []);

  const updateGoal = async (next: MealGoalId | null) => {
    if (next && !MEAL_GOAL_IDS.includes(next)) return;
    setGoal(next);
    await persistMealGoal(next);
  };

  const value = useMemo<MealGoalContextValue>(() => ({ goal, isLoading, updateGoal }), [goal, isLoading]);

  return <MealGoalContext.Provider value={value}>{children}</MealGoalContext.Provider>;
}

export function useMealGoal() {
  const context = useContext(MealGoalContext);
  if (!context) {
    throw new Error('useMealGoal must be used within a MealGoalProvider');
  }
  return context;
}

export function ensureValidGoal(goal: unknown, fallback: MealGoalId | null = null): MealGoalId | null {
  if (isMealGoalId(goal)) {
    return goal;
  }
  return fallback;
}
