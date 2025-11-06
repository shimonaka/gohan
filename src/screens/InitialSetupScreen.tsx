import { Link, useNavigate } from 'react-router-dom';
import { MEAL_GOALS, type MealGoalDefinition } from '../data/mealGoals';
import { useMealGoal } from '../context/mealGoalContext';

const steps = [
  {
    number: '1',
    title: '献立の目的を選ぶ',
    description: '1週間のプラン方針を決めて栄養バランスを調整',
    to: '/#meal-goal',
    cta: '目的を決める',
  },
  {
    number: '2',
    title: '冷蔵庫の中身を登録',
    description: '手元にある食材をシンプルに登録',
    to: '/refrigerator',
    cta: '食材を登録',
  },
  {
    number: '3',
    title: '献立をチェック',
    description: '目的に沿った献立で1週間をプランニング',
    to: '/menu',
    cta: '献立を見る',
  },
  {
    number: '4',
    title: '買い物リストを作成',
    description: '足りない食材だけをスマートに抽出',
    to: '/shopping',
    cta: 'リストを作成',
  },
];

export default function InitialSetupScreen() {
  const { goal, isLoading, updateGoal } = useMealGoal();
  const navigate = useNavigate();

  const handleGoalClick = async (goalDefinition: MealGoalDefinition) => {
    await updateGoal(goalDefinition.id);
    // 献立方針を選択したら冷蔵庫画面へ自動遷移
    navigate('/refrigerator');
  };

  return (
    <div className="page page-initial">
      <div className="page-body">
        <section className="hero" id="meal-goal">
          <span className="hero-tag">毎日の献立づくりをもっとラクに</span>
          <h1 className="hero-title">🍚 今日のゴハン、何にする？</h1>
          <p className="hero-subtitle">
            1週間の献立計画から買い物リスト作成まで。暮らしに寄り添うフードアシスタントで、毎日の「悩む時間」を「楽しむ時間」へ。
          </p>
        </section>

        <section className="panel panel-hero" aria-labelledby="goal-section-title">
          {isLoading ? (
            <div className="panel-callout" role="status" aria-live="polite">
              <span className="panel-icon">⏳</span>
              <div>
                <p className="panel-title">献立の目的を読み込み中</p>
                <p className="panel-description">まもなく現在の設定が反映されます。</p>
              </div>
            </div>
          ) : goal ? (
            <div className="panel-callout goal-current" role="note">
              <span className="panel-icon">📌</span>
              <div>
                <p className="panel-title">現在の献立方針</p>
                <p className="panel-description">{MEAL_GOALS.find((g) => g.id === goal)?.name ?? '未選択'}</p>
              </div>
            </div>
          ) : null}
          <div className="panel-callout" aria-hidden="true">
            <span className="panel-icon">🎯</span>
            <div>
              <p className="panel-title">献立生成の目的設定</p>
              <p className="panel-description">フードアシスタントが栄養知識を活かして、目的別のプランを提案します。</p>
            </div>
          </div>
          <div>
            <h2 className="panel-heading" id="goal-section-title">献立の方針を選びましょう</h2>
            <p className="panel-meta">目的を選ぶと、冷蔵庫登録画面に進みます。後から変更も可能です。</p>
          </div>
          <div className="goal-grid" role="list">
            {MEAL_GOALS.map((goalDefinition) => {
              const isActive = goalDefinition.id === goal;
              return (
                <article
                  key={goalDefinition.id}
                  className={`goal-card ${isActive ? 'active' : ''}`}
                  data-goal-id={goalDefinition.id}
                  role="listitem"
                  aria-pressed={isActive}
                >
                  <div className="goal-card-header">
                    <span className="goal-icon" aria-hidden>
                      {goalDefinition.icon}
                    </span>
                    <div>
                      <h3 className="goal-title">{goalDefinition.name}</h3>
                      <p className="goal-headline">{goalDefinition.headline}</p>
                    </div>
                  </div>
                  <p className="goal-description">{goalDefinition.description}</p>
                  <ul className="goal-bullet-list">
                    {goalDefinition.bulletPoints.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <p className="goal-note">{goalDefinition.note}</p>
                  <button
                    type="button"
                    className={`primary-pill goal-select-button ${isActive ? 'selected' : ''}`}
                    onClick={() => void handleGoalClick(goalDefinition)}
                    aria-pressed={isActive}
                    aria-label={`${goalDefinition.name} を選択して次へ`}
                  >
                    {isActive ? '選択中の方針' : 'この方針で次へ進む'}
                    <span aria-hidden>→</span>
                  </button>
                </article>
              );
            })}
          </div>
          <footer className="panel-footer">
            <p className="panel-caption">※ 選択した目的は後から変更できます。食材登録や献立作成に活用されます。</p>
          </footer>
        </section>

        <section className="step-card">
          <div className="step-header">
            <div>
              <h2 className="step-title">さっそく始めましょう</h2>
              <p className="step-caption">3つのステップで、献立と買い物をスムーズに。気になるところから始めてもOKです。</p>
            </div>
            <Link to="/menu" className="primary-pill">
              今週の献立を見る
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="step-list">
            {steps.map((step) => (
              <article key={step.number} className="step-item">
                <span className="step-number">{step.number}</span>
                <div className="step-copy">
                  <h3 className="step-item-title">{step.title}</h3>
                  <p className="step-item-caption">{step.description}</p>
                </div>
                <Link to={step.to} className="secondary-pill">
                  {step.cta}
                  <span aria-hidden>→</span>
                </Link>
              </article>
            ))}
          </div>
        </section>

        <footer className="page-footer">
          <p>続けやすさを大切に、毎日の献立決めをもっと自由に。</p>
        </footer>
      </div>
    </div>
  );
}
