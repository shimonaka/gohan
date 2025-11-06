import { fetchJSONWithFallback } from './network';
import { isMealGoalId, type MealGoalId } from '../data/mealGoals';

const GOAL_STORAGE_KEY = 'mealGoalPreference';
const API_BASE = 'https://backend.youware.com';

export async function fetchMealGoal(): Promise<MealGoalId | null> {
  const localGoal = loadGoalFromLocalStorage();
  return fetchJSONWithFallback<{ goal: MealGoalId | null }>(
    `${API_BASE}/goal`,
    { credentials: 'include' },
    () => ({ goal: localGoal })
  )
    .then((data) => {
      if (isMealGoalId(data.goal)) {
        persistGoalLocally(data.goal);
        return data.goal;
      }
      return localGoal;
    })
    .catch(() => localGoal);
}

export async function persistMealGoal(goal: MealGoalId | null): Promise<void> {
  if (goal) {
    persistGoalLocally(goal);
  } else {
    clearGoalLocal();
  }
  try {
    await fetch(`${API_BASE}/goal`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goal }),
    });
  } catch (error) {
    console.warn('Failed to persist meal goal to backend, using local storage only', error);
  }
}

function loadGoalFromLocalStorage(): MealGoalId | null {
  try {
    const raw = localStorage.getItem(GOAL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isMealGoalId(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistGoalLocally(goal: MealGoalId) {
  localStorage.setItem(GOAL_STORAGE_KEY, JSON.stringify(goal));
}

function clearGoalLocal() {
  localStorage.removeItem(GOAL_STORAGE_KEY);
}
