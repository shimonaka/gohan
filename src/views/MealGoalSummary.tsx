import type { MealGoalId } from '../data/mealGoals';
import { MEAL_GOALS, COMMON_MEAL_GOAL_RULES } from '../data/mealGoals';

interface MealGoalSummaryProps {
  goal: MealGoalId | null;
}

export function MealGoalSummary({ goal }: MealGoalSummaryProps) {
  if (!goal) {
    return (
      <div className="goal-summary">
        <h3 className="goal-summary-title">献立の目的が未設定です</h3>
        <p className="goal-summary-description">初期設定画面から目的を選択すると、献立の提案が目的に沿って調整されます。</p>
        <ul className="goal-summary-rules">
          {COMMON_MEAL_GOAL_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    );
  }

  const definition = MEAL_GOALS.find((item) => item.id === goal);
  if (!definition) {
    return null;
  }

  return (
    <div className="goal-summary">
      <div className="goal-summary-header">
        <span className="goal-summary-icon" aria-hidden>
          {definition.icon}
        </span>
        <div>
          <h3 className="goal-summary-title">現在の献立方針：{definition.name}</h3>
          <p className="goal-summary-description">{definition.headline}</p>
        </div>
      </div>
      <div className="goal-summary-body">
        <p className="goal-summary-description">{definition.description}</p>
        <ul className="goal-summary-list">
          {definition.bulletPoints.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>
      <footer className="goal-summary-footer">
        <p>献立共通ルール</p>
        <ul className="goal-summary-rules">
          {COMMON_MEAL_GOAL_RULES.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </footer>
    </div>
  );
}
