import { useState, useEffect, useCallback } from 'react';
import { loadFridgeItems, replaceFridgeItems } from '../utils/planner';
import { analyzeFridgeImage } from '../utils/fridgeVision';

interface DetectionItem {
  id: string;
  name: string;
}

export default function RefrigeratorScreen() {
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detected, setDetected] = useState<DetectionItem[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    loadFridgeItems().then(setItems);
  }, []);

  useEffect(() => {
    if (items.length > 0 || localStorage.getItem('refrigeratorItems')) {
      localStorage.setItem('refrigeratorItems', JSON.stringify(items));
    }
  }, [items]);

  const persistItems = useCallback(
    async (nextItems: string[]) => {
      setItems(nextItems);
      setIsSaving(true);
      try {
        await replaceFridgeItems(nextItems);
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const handleAdd = useCallback(async () => {
    if (inputValue.trim() === '') return;
    await persistItems([...items, inputValue.trim()]);
    setInputValue('');
  }, [inputValue, items, persistItems]);

  const handleDelete = useCallback(
    async (index: number) => {
      const next = items.filter((_, i) => i !== index);
      await persistItems(next);
    },
    [items, persistItems]
  );

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      void handleAdd();
    }
  };

  const applyDetectedItems = useCallback(async () => {
    const names = detected.map((item) => item.name);
    if (names.length === 0) return;
    const merged = Array.from(new Set([...items, ...names]));
    await persistItems(merged);
    setDetected([]);
    setUploadPreview(null);
  }, [detected, items, persistItems]);

  const handleFileSelection = useCallback(
    async (file: File) => {
      setAnalysisError(null);
      setIsAnalyzing(true);
      setUploadPreview(URL.createObjectURL(file));
      try {
        const ingredientNames = await analyzeFridgeImage(file);
        setDetected(
          ingredientNames.map((name, index) => ({
            id: `${name}-${index}-${Date.now()}`,
            name,
          }))
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'API Error - 解析に失敗しました。';
        setAnalysisError(message);
        setDetected([]);
      } finally {
        setIsAnalyzing(false);
      }
    },
    []
  );

  const onFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      await handleFileSelection(file);
    },
    [handleFileSelection]
  );

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (!file) return;
      await handleFileSelection(file);
    },
    [handleFileSelection]
  );

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => {
    setDragging(false);
  };

  const updateDetectedName = useCallback((id: string, nextName: string) => {
    setDetected((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              name: nextName,
            }
          : item
      )
    );
  }, []);

  const removeDetectedItem = useCallback((id: string) => {
    setDetected((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <div className="page page-refrigerator">
      <div className="page-body">
        <header className="page-header">
          <span className="page-tag">STEP 1</span>
          <h1 className="page-title">冷蔵庫の中身を整える</h1>
          <p className="page-caption">
            家にある食材をリストアップし、献立の組み立てや買い物リストの自動生成に活用しましょう。
          </p>
        </header>

        <section className="panel panel-input">
          <div className="panel-row" role="form" aria-label="冷蔵庫への食材手動登録フォーム" tabIndex={-1}>
            <div className="panel-callout" aria-hidden="true">
              <span className="panel-icon">🥬</span>
              <div>
                <p className="panel-title">食材を登録</p>
                <p className="panel-description">にんじん・豚肉・玉ねぎなど自由に追加できます</p>
              </div>
            </div>
            <div className="panel-form">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="食材名を入力"
                className="surface-input"
                aria-label="食材名"
                inputMode="text"
              />
              <button
                onClick={handleAdd}
                className="primary-button"
                disabled={isSaving}
                aria-live="polite"
                type="button"
              >
                {isSaving ? '保存中…' : '追加'}
              </button>
            </div>
          </div>
        </section>

        <section className="panel panel-input" aria-label="冷蔵庫写真解析">
          <div className="panel-row" style={{ flexDirection: 'column', gap: '24px' }}>
            <div className="panel-callout" aria-hidden="true">
              <span className="panel-icon">📸</span>
              <div>
                <p className="panel-title">冷蔵庫の写真を解析</p>
                <p className="panel-description">写真から自動的に食材を検出してリストに追加します</p>
              </div>
            </div>
            <label
              className={`upload-dropzone${dragging ? ' dragging' : ''}`}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              role="button"
              tabIndex={0}
              aria-label="冷蔵庫写真をアップロードして解析する"
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  const input = event.currentTarget.querySelector<HTMLInputElement>('input[type="file"]');
                  input?.click();
                }
              }}
            >
              <input
                type="file"
                accept="image/*"
                onChange={onFileInputChange}
                className="surface-file-input"
                style={{ display: 'none' }}
                aria-hidden
                tabIndex={-1}
              />
              <span className="upload-icon">🖼️</span>
              <p className="upload-title">画像ファイルをドラッグ＆ドロップ、またはクリックして選択</p>
              <p className="upload-caption">JPEG / PNG / HEIC などに対応しています</p>
            </label>
            {uploadPreview && (
              <div className="upload-preview">
                <img src={uploadPreview} alt="アップロードされた冷蔵庫写真のプレビュー" aria-live="polite" />
              </div>
            )}
            {analysisError && (
              <div className="page-hint" style={{ color: '#c0392b' }} role="alert">
                {analysisError}
              </div>
            )}
            {isAnalyzing && (
              <div className="page-hint" role="status" aria-live="polite">
                画像を解析中です…少々お待ちください。
              </div>
            )}
            {detected.length > 0 && (
              <div className="result-card" role="region" aria-live="polite" aria-label="検出された食材の編集リスト">
                <div>
                  <p className="result-title">検出された食材</p>
                  <p className="result-description">必要に応じて編集・削除してから反映できます。</p>
                </div>
                <div className="result-list" role="list" aria-label="検出された食材一覧">
                  {detected.map((item) => (
                    <div key={item.id} className="result-item" role="listitem">
                      <label className="sr-only" htmlFor={`detected-${item.id}`}>
                        {item.name} を編集
                      </label>
                      <input
                        id={`detected-${item.id}`}
                        type="text"
                        value={item.name}
                        onChange={(e) => updateDetectedName(item.id, e.target.value)}
                        inputMode="text"
                      />
                      <button
                        className="chip-action"
                        onClick={() => removeDetectedItem(item.id)}
                        aria-label={`${item.name} を削除`}
                        type="button"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
                <div className="result-actions">
                  <button className="ghost-button" onClick={() => setDetected([])} aria-label="検出結果をすべて削除" type="button">
                    すべて削除
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => void applyDetectedItems()}
                    disabled={isSaving}
                    aria-live="polite"
                    type="button"
                  >
                    リストに反映
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="panel panel-list" aria-label="登録済みの食材一覧" aria-describedby="registered-items-heading">
          <div className="panel-header">
            <div>
              <h2 className="panel-heading" id="registered-items-heading">登録済みの食材</h2>
              <p className="panel-meta">
                登録件数 <span>{items.length} 件</span>
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={() => {
                  void persistItems([]);
                }}
                className="ghost-button"
                type="button"
                aria-label="食材リストを全てクリア"
              >
                すべてクリア
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="empty-state" role="status" aria-live="polite">
              <span className="empty-icon">🗂️</span>
              <p className="empty-title">まだ食材が登録されていません</p>
              <p className="empty-caption">冷蔵庫にある食材を追加すると、買い物リストから自動で除外されます。</p>
            </div>
          ) : (
            <ul className="chip-list" aria-labelledby="registered-items-heading" role="list">
              {items.map((item, index) => (
                <li key={`${item}-${index}`} className="chip-item" role="listitem">
                  <div className="chip-content">
                    <span className="chip-count" aria-hidden>{index + 1}</span>
                    <span className="chip-label">{item}</span>
                  </div>
                  <button
                    onClick={() => void handleDelete(index)}
                    className="chip-action"
                    type="button"
                    aria-label={`${item} を削除`}
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
