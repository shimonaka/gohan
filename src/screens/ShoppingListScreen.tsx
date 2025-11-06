import { useEffect, useMemo, useState } from 'react';
import {
  addManualShoppingItem,
  clearShoppingState,
  loadFridgeItems,
  loadShoppingState,
  preparePlan,
  removeShoppingItem,
} from '../utils/planner';
import type { ShoppingState } from '../utils/planner';

const SHOPPING_AUTO_LABEL = '献立からの自動追加';
const SHOPPING_MANUAL_LABEL = '手動で追加した食材';

const formatDateTime = (iso: string | null) => {
  if (!iso) return '未生成';
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

export default function ShoppingListScreen() {
  const [state, setState] = useState<ShoppingState>({ auto: [], manual: [] });
  const [inputValue, setInputValue] = useState('');
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadShoppingLists = async (options?: { force?: boolean }) => {
    setIsLoading(true);
    try {
      const fridgeItems = await loadFridgeItems();
      const { plan } = await preparePlan(fridgeItems, { forceRegenerate: options?.force ?? false });
      const updatedState = await loadShoppingState();
      setGeneratedAt(plan.generatedAt);
      setState(updatedState);
      setIsGenerated(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadShoppingLists();
  }, []);

  const autoCount = state.auto.length;
  const manualCount = state.manual.length;
  const totalCount = autoCount + manualCount;

  const autoList = useMemo(() => state.auto.sort((a, b) => a.localeCompare(b)), [state.auto]);
  const manualList = useMemo(() => state.manual.sort((a, b) => a.localeCompare(b)), [state.manual]);

  const handleManualAdd = async () => {
    const next = await addManualShoppingItem(inputValue, state);
    setState(next);
    setInputValue('');
    setIsGenerated(true);
  };

  const handleDelete = async (item: string, source: 'auto' | 'manual') => {
    const next = await removeShoppingItem(item, source, state);
    setState(next);
  };

  const handleReset = async () => {
    const cleared = await clearShoppingState();
    setState(cleared);
    setInputValue('');
    setIsGenerated(false);
  };

  if (isLoading) {
    return (
      <div className="page page-shopping">
        <div className="page-body">
          <header className="page-header">
            <span className="page-tag success">STEP 3</span>
            <h1 className="page-title">買い物リストを準備中…</h1>
            <p className="page-caption">献立と冷蔵庫の中身を照合して買い物リストを作成しています。</p>
          </header>
          <section className="plan-empty-state">
            <span className="hero-emoji" aria-hidden>
              🧾
            </span>
            <p>必要な食材を整理しています…</p>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="page page-shopping">
      <div className="page-body">
        <header className="page-header">
          <span className="page-tag success">STEP 3</span>
          <h1 className="page-title">献立と連動した買い物リスト</h1>
          <p className="page-caption">
            献立に必要な食材のうち、冷蔵庫にないものを自動でピックアップ。手動での追加・削除も柔軟に行えます。
          </p>
        </header>

        <section className="shopping-summary">
          <div className="shopping-card">
            <strong>{totalCount}</strong>
            <span>買う予定の食材数</span>
          </div>
          <div className="shopping-card">
            <strong>{autoCount}</strong>
            <span>献立から自動追加された食材</span>
          </div>
          <div className="shopping-card">
            <strong>{manualCount}</strong>
            <span>手動で追加した食材</span>
          </div>
        </section>

        <div className="plan-actions">
          <button type="button" className="accent-pill" onClick={() => void loadShoppingLists({ force: true })}>
            献立を再計算して更新
          </button>
          <button type="button" className="ghost-button" onClick={() => void handleReset()}>
            リストをリセット
          </button>
          <span className="plan-meta">
            最終更新: <time>{formatDateTime(generatedAt)}</time>
          </span>
        </div>

        {!isGenerated && (
          <section className="plan-empty-state">
            <span className="hero-emoji" aria-hidden>
              🛍️
            </span>
            <p>献立の生成後、必要な食材がこちらに表示されます。</p>
          </section>
        )}

        {isGenerated && (
          <section className="shopping-lists">
            <div className="list-section">
              <div className="list-header">
                <h2 className="plan-meal-title">{SHOPPING_AUTO_LABEL}</h2>
                <span className="list-subtitle">献立更新時に自動で同期されます</span>
              </div>
              {autoList.length === 0 ? (
                <div className="empty-state success">
                  <span className="empty-icon">🎉</span>
                  <p className="empty-title">買い足しは不要です</p>
                  <p className="empty-caption">冷蔵庫だけで献立が完結します。</p>
                </div>
              ) : (
                <ul className="checklist">
                  {autoList.map((item) => (
                    <li key={`auto-${item}`} className="checklist-item">
                      <span className="checklist-content">
                        <span className="tag warning">{item}</span>
                      </span>
                      <button onClick={() => void handleDelete(item, 'auto')} className="checklist-action">
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="list-section">
              <div className="list-header">
                <h2 className="plan-meal-title">{SHOPPING_MANUAL_LABEL}</h2>
                <span className="list-subtitle">自由にメモしてカスタマイズできます</span>
              </div>
              <div className="panel-form">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void handleManualAdd();
                    }
                  }}
                  placeholder="追加する食材を入力"
                  className="surface-input"
                />
                <button type="button" onClick={() => void handleManualAdd()} className="success-pill">
                  追加
                  <span aria-hidden>→</span>
                </button>
              </div>
              {manualList.length === 0 ? (
                <p className="plan-missing-message">追加された手動食材はまだありません。</p>
              ) : (
                <ul className="mini-plan-grid">
                  {manualList.map((item) => (
                    <li key={`manual-${item}`} className="mini-plan-card">
                      <strong>{item}</strong>
                      <button onClick={() => void handleDelete(item, 'manual')} className="checklist-action">
                        削除
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
