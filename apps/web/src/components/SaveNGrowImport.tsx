import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type SaveNGrowItem = {
  name: string;
  invested: number | null;
  current_value: number;
  profit_value: number | null;
  profit_percent: number | null;
  category: string;
};

type SaveNGrowPreview = {
  filename: string;
  file_hash: string;
  snapshot_date: string | null;
  items: SaveNGrowItem[];
};

type SaveNGrowImportEntry = {
  id: number;
  invested_total: number;
  current_value_total: number;
  profit_value_total: number | null;
  profit_percent_total: number | null;
  source_file: string;
  snapshot_date: string | null;
  created_at: string;
};

type SaveNGrowImportProps = {
  portfolioId: number;
  token: string;
  currency: string;
  categories: string[];
  t: Translation;
  onRefresh: () => void;
  refreshKey?: number;
};

const API_BASE = "http://127.0.0.1:8000";

function SaveNGrowImport({
  portfolioId,
  token,
  currency,
  categories,
  t,
  onRefresh,
  refreshKey
}: SaveNGrowImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<SaveNGrowPreview | null>(null);
  const [entries, setEntries] = useState<SaveNGrowImportEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        currencyDisplay: "code"
      }),
    [currency]
  );

  const categoryOptions = useMemo(() => categories, [categories]);

  const loadEntries = async () => {
    setLoadingEntries(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/save-n-grow`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.saveNGrow.loadError);
        return;
      }
      setEntries(data.items || []);
    } catch (err) {
      setError(t.imports.saveNGrow.loadError);
    } finally {
      setLoadingEntries(false);
    }
  };

  useEffect(() => {
    if (!portfolioId) {
      return;
    }
    loadEntries();
  }, [portfolioId]);

  useEffect(() => {
    if (!portfolioId) {
      return;
    }
    setPreview(null);
    setFile(null);
    loadEntries();
  }, [portfolioId, refreshKey]);

  const handlePreview = async (nextFile?: File | null) => {
    const targetFile = nextFile ?? file;
    if (!targetFile) {
      setError(t.imports.saveNGrow.noFile);
      return;
    }
    setLoadingPreview(true);
    setError("");
    setMessage("");
    setPreview(null);
    try {
      const formData = new FormData();
      formData.append("file", targetFile);
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/save-n-grow/preview`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.saveNGrow.previewError);
        return;
      }
      const items = (data.items || []).map((item: SaveNGrowItem) => ({
        name: item.name,
        invested:
          item.invested === null || item.invested === undefined
            ? null
            : Number(item.invested) || 0,
        current_value: Number(item.current_value) || 0,
        profit_value:
          item.profit_value === null || item.profit_value === undefined
            ? null
            : Number(item.profit_value) || 0,
        profit_percent:
          item.profit_percent === null || item.profit_percent === undefined
            ? null
            : Number(item.profit_percent) || 0,
        category: item.category || "Retirement Plans"
      }));
      setPreview({
        filename: data.filename,
        file_hash: data.file_hash,
        snapshot_date: data.snapshot_date || null,
        items
      });
    } catch (err) {
      setError(t.imports.saveNGrow.previewError);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!preview) {
      setError(t.imports.saveNGrow.noPreview);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/save-n-grow/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(preview)
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.saveNGrow.saveError);
        return;
      }
      setMessage(t.imports.saveNGrow.saveSuccess);
      setPreview(null);
      setFile(null);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.saveNGrow.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-head">
        <div>
          <h4>{t.imports.saveNGrow.title}</h4>
          <p>{t.imports.saveNGrow.hint}</p>
        </div>
        <div className="import-actions">
          <label className="file-btn">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;
                setFile(nextFile);
                setPreview(null);
                setError("");
                setMessage("");
                if (nextFile) {
                  handlePreview(nextFile);
                }
              }}
            />
            {t.imports.saveNGrow.chooseFile}
          </label>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handlePreview()}
            disabled={loadingPreview}
          >
            {loadingPreview
              ? t.imports.saveNGrow.previewing
              : t.imports.saveNGrow.preview}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleSave}
            disabled={saving || !preview}
          >
            {saving ? t.imports.saveNGrow.saving : t.imports.saveNGrow.save}
          </button>
        </div>
      </div>
      {file ? (
        <p className="import-file">
          {t.imports.saveNGrow.selected} {file.name}
        </p>
      ) : null}
      {error ? <p className="login-error">{error}</p> : null}
      {message ? <div className="login-banner">{message}</div> : null}
      {preview ? (
        <div className="import-preview">
          <div className="preview-head">
            <span>{t.imports.saveNGrow.previewTitle}</span>
            <span>{preview.items.length}</span>
          </div>
          <div className="preview-table save-ngrow">
            <div className="row head">
              <span>{t.imports.saveNGrow.columns.name}</span>
              <span>{t.imports.saveNGrow.columns.invested}</span>
              <span>{t.imports.saveNGrow.columns.currentValue}</span>
              <span>{t.imports.saveNGrow.columns.profit}</span>
              <span>{t.imports.saveNGrow.columns.profitPercent}</span>
              <span>{t.imports.saveNGrow.columns.category}</span>
            </div>
            {preview.items.map((item, index) => (
              <div className="row" key={`${item.name}-${index}`}>
                <span>{item.name}</span>
                <span>
                  {item.invested === null ? "?" : formatter.format(item.invested)}
                </span>
                <span>{formatter.format(item.current_value)}</span>
                <span>
                  {item.profit_value === null
                    ? "?"
                    : formatter.format(item.profit_value)}
                </span>
                <span>
                  {item.profit_percent === null
                    ? "?"
                    : `${item.profit_percent.toFixed(2)}%`}
                </span>
                <select
                  value={item.category}
                  onChange={(event) => {
                    const next = [...preview.items];
                    next[index] = { ...item, category: event.target.value };
                    setPreview({ ...preview, items: next });
                  }}
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="manual-history">
        <div className="preview-head">
          <span>{t.imports.saveNGrow.history}</span>
          <span>{entries.length}</span>
        </div>
        {loadingEntries ? (
          <div className="loading-banner">{t.imports.saveNGrow.loading}</div>
        ) : null}
        {entries.length ? (
          <div className="manual-table">
            <div className="row head">
              <span>{t.imports.saveNGrow.columns.date}</span>
              <span>{t.imports.saveNGrow.columns.currentValue}</span>
              <span>{t.imports.saveNGrow.columns.invested}</span>
              <span>{t.imports.saveNGrow.columns.profit}</span>
            </div>
            {entries.map((entry) => (
              <div className="row" key={entry.id}>
                <span>
                  {entry.snapshot_date || new Date(entry.created_at).toLocaleDateString()}
                </span>
                <span>{formatter.format(entry.current_value_total)}</span>
                <span>{formatter.format(entry.invested_total)}</span>
                <span>
                  {entry.profit_value_total === null
                    ? "?"
                    : formatter.format(entry.profit_value_total)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="chart-sub">{t.imports.saveNGrow.noEntries}</p>
        )}
      </div>
    </div>
  );
}

export default SaveNGrowImport;
