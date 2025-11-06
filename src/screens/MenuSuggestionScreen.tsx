import { useEffect, useMemo, useRef, useState } from 'react';
import {
  loadFridgeItems,
  preparePlan,
  loadStoredPlan,
  planToView,
  collectMissingIngredients,
  type StoredPlan,
} from '../utils/planner';
import type { PlanViewDay } from '../utils/planner';
import { useMealGoal } from '../context/mealGoalContext';
import { MEAL_GOALS } from '../data/mealGoals';
import type { MealGoalId } from '../data/mealGoals';
import { MealGoalSummary } from '../views/MealGoalSummary';

interface PlanSummary {
  coverageAverage: number;
  coverageBest: number;
  missingCount: number;
  generatedAt: string;
  metadata?: {
    scoreAverage?: number;
  };
}

const formatPercentage = (value: number) => `${Math.round(value * 100)}%`;

const buildCardTone = (coverage: number) => {
  if (coverage >= 0.8) return 'plan-card good';
  if (coverage >= 0.5) return 'plan-card partial';
  return 'plan-card low';
};

const formatGeneratedAt = (iso: string) => {
  try {
    const date = new Date(iso);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

export default function MenuSuggestionScreen() {
  const [fridgeItems, setFridgeItems] = useState<string[]>([]);
  const [planView, setPlanView] = useState<PlanViewDay[]>([]);
  const [missingIngredients, setMissingIngredients] = useState<string[]>([]);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { goal, isLoading: goalLoading, updateGoal } = useMealGoal();
  const hasInitialLoad = useRef(false);
  const lastSyncedGoal = useRef<MealGoalId | null | undefined>(undefined);

  const regeneratePlan = async (
    latestFridge: string[],
    { forceRegenerate, goalOverride }: { forceRegenerate?: boolean; goalOverride?: MealGoalId | null }
  ) => {
    const result = await preparePlan(latestFridge, {
      forceRegenerate,
      goal: goalOverride,
    });
    return result;
  };

  const loadPlan = async (options?: { forceRegenerate?: boolean; goalOverride?: MealGoalId | null }) => {
    setIsLoading(true);
    try {
      const latestFridge = await loadFridgeItems();
      const storedPlan = await loadStoredPlan();
      const goalToUse = options?.goalOverride ?? goal ?? null;

      let plan: StoredPlan | null = storedPlan;
      let view: PlanViewDay[] = [];
      let missing: string[] = [];

      const needsRegenerate =
        options?.forceRegenerate ||
        options?.goalOverride !== undefined ||
        !plan ||
        plan.goalCategory !== goalToUse;

      let scoreAverage = summary?.metadata?.scoreAverage ?? 0;

      if (needsRegenerate) {
        const { plan: nextPlan, view: nextView, missing: nextMissing, metadata } = await regeneratePlan(latestFridge, {
          forceRegenerate: options?.forceRegenerate,
          goalOverride: goalToUse,
        });
        plan = nextPlan;
        view = nextView;
        missing = nextMissing;
        scoreAverage = metadata?.scoreAverage ?? 0;
      } else if (plan) {
        view = planToView(plan, latestFridge);
        missing = collectMissingIngredients(view);
        scoreAverage = view.length === 0 ? 0 : view.reduce((acc, day) => acc + (day.score ?? 0), 0) / view.length;
      }

      const coverageValues = view.map((day) => day.coverage);
      const coverageAverage =
        coverageValues.length === 0
          ? 0
          : coverageValues.reduce((acc, value) => acc + value, 0) / coverageValues.length;
      const coverageBest = coverageValues.length === 0 ? 0 : Math.max(...coverageValues);

      setFridgeItems(latestFridge);
      setPlanView(view);
      setMissingIngredients(missing);
      setSummary({
        coverageAverage,
        coverageBest,
        missingCount: missing.length,
        generatedAt: plan?.generatedAt ?? new Date().toISOString(),
        metadata: {
          scoreAverage,
        },
      });
    } catch (error) {
      console.error('献立ロード中にエラーが発生しました', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      await loadPlan();
      hasInitialLoad.current = true;
      lastSyncedGoal.current = goal ?? null;
    })();
  }, []);

  useEffect(() => {
    if (!hasInitialLoad.current) return;
    if (goalLoading) return;
    if (lastSyncedGoal.current === goal) return;
    lastSyncedGoal.current = goal ?? null;
    void loadPlan({ goalOverride: goal ?? null });
  }, [goal, goalLoading]);

  const fridgeCoverage = useMemo(() => {
    if (fridgeItems.length === 0) return 0;
    const matched = planView.flatMap((day) => day.haveIngredients);
    const uniqueMatched = new Set(matched);
    return uniqueMatched.size / fridgeItems.length;
  }, [fridgeItems, planView]);

  const handleGoalChange = async (nextGoal: MealGoalId | null) => {
    await updateGoal(nextGoal);
    lastSyncedGoal.current = nextGoal;
    await loadPlan({ forceRegenerate: true, goalOverride: nextGoal });
  };

  const formatScore = (value: number | undefined) => {
    if (value == null) return '0';
    return Math.round(value).toString();
  };

  const renderStatusLabel = (coverage: number) => {
    if (coverage >= 0.8) return <span className="plan-status good">ほぼ冷蔵庫で準備OK</span>;
    if (coverage >= 0.5) return <span className="plan-status partial">一部の買い足しが必要</span>;
    return <span className="plan-status low">買い足し中心のメニュー</span>;
  };

  const renderPlanCard = (day: PlanViewDay) => {
    const className = `${buildCardTone(day.coverage)} plan-card`;
    const scoreLabel = day.score != null ? Math.round(day.score) : null;
    return (
      <article key={day.day} className={className}>
        <div className="plan-card-header">
          <div className="menu-title-block">
            <span className="menu-day">{day.day}</span>
            <h2 className="menu-title">{day.main?.name ?? 'おすすめ料理を提案できませんでした'}</h2>
          </div>
          <div className="plan-card-header-meta">
            {scoreLabel != null && <span className="plan-status info">スコア {scoreLabel}</span>}
            {renderStatusLabel(day.coverage)}
          </div>
        </div>

        <div className="plan-meals">
          {day.main && (
            <div>
              <p className="plan-meal-title">メイン</p>
              <div className="plan-meal-list">
                <span className="tag">{day.main.name}</span>
              </div>
            </div>
          )}
          {day.sides.length > 0 && (
            <div>
              <p className="plan-meal-title">サイド</p>
              <div className="plan-meal-list">
                {day.sides.map((side) => (
                  <span key={side.id} className="tag">
                    {side.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {day.traits && day.traits.length > 0 && (
          <div className="plan-traits">
            <p className="plan-missing-message">特徴タグ</p>
            <div className="plan-ingredient-group">
              {day.traits.map((trait) => (
                <span key={`${day.day}-trait-${trait}`} className="tag info">
                  #{trait}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="plan-ingredients">
          <div>
            <p className="plan-missing-message">冷蔵庫にある食材</p>
            <div className="plan-ingredient-group">
              {day.haveIngredients.length === 0 ? (
                <span className="tag">該当なし</span>
              ) : (
                day.haveIngredients.map((ingredient) => (
                  <span key={`${day.day}-have-${ingredient}`} className="tag success">
                    {ingredient}
                  </span>
                ))
              )}
            </div>
          </div>
          <div>
            <p className="plan-missing-message">買い足しが必要</p>
            <div className="plan-ingredient-group">
              {day.missingIngredients.length === 0 ? (
                <span className="tag success">買い足し不要</span>
              ) : (
                day.missingIngredients.map((ingredient) => (
                  <span key={`${day.day}-missing-${ingredient}`} className="tag warning">
                    {ingredient}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </article>
    );
  };

  if (isLoading || goalLoading) {
    return (
      <div className="page page-menu">
        <div className="page-body">
          <header className="page-header">
            <span className="page-tag accent">STEP 2</span>
            <h1 className="page-title">献立を分析中…</h1>
            <p className="page-caption">冷蔵庫の中身を読み込み、ぴったりの献立を準備しています。</p>
          </header>
          <section className="plan-empty-state">
            <span className="hero-emoji" aria-hidden>
              🧭
            </span>
            <p>冷蔵庫の食材とメニュー候補を照合しています…</p>
          </section>
        </div>
      </div>
    );
  }

  const hasFridgeItems = fridgeItems.length > 0;
  const hasPlan = planView.length > 0 && planView.some((day) => day.main);

  return (
    <div className="page page-menu">
      <div className="page-body">
        <header className="page-header">
          <span className="page-tag accent">STEP 2</span>
          <h1 className="page-title">冷蔵庫の中身から今週の献立を提案</h1>
          <p className="page-caption">
            登録済みの食材を軸に、足りないものだけを買い足せば完成する1週間分の献立プランです。
          </p>
        </header>

        <section className="plan-summary">
          <MealGoalSummary goal={goal ?? null} />
          <div className="plan-summary-grid">
            <div className="plan-stat-card">
              <span className="plan-stat-label">冷蔵庫活用度</span>
              <span className="plan-stat-value">{formatPercentage(fridgeCoverage)}</span>
              <span className="plan-stat-meta">
                冷蔵庫の食材 {fridgeItems.length} 品中 {Math.round(fridgeCoverage * fridgeItems.length)} 品を活用予定
              </span>
            </div>
            <div className="plan-stat-card">
              <span className="plan-stat-label">週全体のフィット感</span>
              <span className="plan-stat-value">{formatPercentage(summary?.coverageAverage ?? 0)}</span>
              <span className="plan-stat-meta">最大 {formatPercentage(summary?.coverageBest ?? 0)} の献立があります</span>
            </div>
            <div className="plan-stat-card">
              <span className="plan-stat-label">買い足し予定</span>
              <span className="plan-stat-value">{missingIngredients.length} 品</span>
              <span className="plan-stat-meta">買い物リストに自動で連携されます</span>
            </div>
          </div>
          <div className="plan-actions">
            <button
              type="button"
              className="accent-pill"
              onClick={() => void loadPlan({ forceRegenerate: true, goalOverride: goal ?? null })}
            >
              献立を再提案する
            </button>
            <button type="button" className="ghost-button" onClick={() => void loadPlan({ goalOverride: goal ?? null })}>
              冷蔵庫の登録内容を再読み込み
            </button>
            <select
              className="goal-select"
              value={goal ?? ''}
              onChange={(event) => void handleGoalChange(event.target.value ? (event.target.value as MealGoalId) : null)}
            >
              <option value="">目的を選択</option>
              {MEAL_GOALS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            {summary && (
              <div className="plan-meta-group">
                <span className="plan-meta">
                  目的スコア平均: {formatScore(summary.metadata?.scoreAverage)} / 100
                </span>
                <span className="plan-meta">
                  最終更新: <time>{formatGeneratedAt(summary.generatedAt)}</time>
                </span>
              </div>
            )}
          </div>
        </section>

        {!hasFridgeItems && (
          <section className="plan-empty-state">
            <span className="hero-emoji" aria-hidden>
              🧊
            </span>
            <p>まずは「冷蔵庫」ページで食材を登録しましょう。登録後に献立を自動生成できます。</p>
          </section>
        )}

        {hasPlan ? (
          <section className="plan-grid">
            {planView.map((day) => renderPlanCard(day))}
          </section>
        ) : (
          <section className="plan-empty-state">
            <span className="hero-emoji" aria-hidden>
              🔍
            </span>
            <p>条件に合う献立を見つけられませんでした。冷蔵庫の記録を更新するか、献立の再提案をお試しください。</p>
          </section>
        )}

        {missingIngredients.length > 0 && (
          <section className="plan-card">
            <h2 className="plan-meal-title">買い物リストへの連携予定</h2>
            <p className="plan-missing-message">以下の食材は自動的に買い物リストに追加されます。</p>
            <div className="plan-missing-list">
              {missingIngredients.map((ingredient) => (
                <span key={`missing-${ingredient}`} className="tag warning">
                  {ingredient}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
