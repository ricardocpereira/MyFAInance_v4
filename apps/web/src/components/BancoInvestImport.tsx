import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type BancoInvestItem = {
  holder: string;
  invested: number | null;
  current_value: number;
  gains: number | null;
  category: string;
};

type BancoInvestPreview = {
  filename: string;
  file_hash: string;
  snapshot_date: string | null;
  items: BancoInvestItem[];
};

type BancoInvestImportEntry = {
  id: number;
  source_file: string;
  snapshot_date: string | null;
  imported_at: string;
  total_value: number;
  items: BancoInvestItem[];
};

type BancoInvestImportProps = {
  portfolioId: number;
  token: string;
  currency: string;
  categories: string[];
  t: Translation;
  onRefresh: () => void;
};

const API_BASE = "http://127.0.0.1:8000";

function BancoInvestImport({
  portfolioId,
  token,
  currency,
  categories,
  t,
  onRefresh
}: BancoInvestImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<BancoInvestPreview | null>(null);
  const [entries, setEntries] = useState<BancoInvestImportEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
        `${API_BASE}/portfolios/${portfolioId}/imports/bancoinvest`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.bancoinvest.loadError);
        return;
      }
      setEntries(data.items || []);
    } catch (err) {
      setError(t.imports.bancoinvest.loadError);
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

  const handlePreview = async (nextFile?: File | null) => {
    const targetFile = nextFile ?? file;
    if (!targetFile) {
      setError(t.imports.bancoinvest.noFile);
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
        `${API_BASE}/portfolios/${portfolioId}/imports/bancoinvest/preview`,
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
        setError(data?.detail || t.imports.bancoinvest.previewError);
        return;
      }
      const items = (data.items || []).map((item: BancoInvestItem) => ({
        holder: item.holder,
        invested:
          item.invested === null || item.invested === undefined
            ? null
            : Number(item.invested) || 0,
        current_value: Number(item.current_value) || 0,
        gains:
          item.gains === null || item.gains === undefined
            ? null
            : Number(item.gains) || 0,
        category: item.category || "Retirement Plans"
      }));
      setPreview({
        filename: data.filename,
        file_hash: data.file_hash,
        snapshot_date: data.snapshot_date || null,
        items
      });
    } catch (err) {
      setError(t.imports.bancoinvest.previewError);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!preview) {
      setError(t.imports.bancoinvest.noPreview);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/bancoinvest/commit`,
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
        setError(data?.detail || t.imports.bancoinvest.saveError);
        return;
      }
      setMessage(t.imports.bancoinvest.saveSuccess);
      setPreview(null);
      setFile(null);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.bancoinvest.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (importId: number) => {
    const confirmed = window.confirm(t.imports.bancoinvest.deleteConfirm);
    if (!confirmed) {
      return;
    }
    setDeletingId(importId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/bancoinvest/${importId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.bancoinvest.deleteError);
        return;
      }
      setMessage(t.imports.bancoinvest.deleteSuccess);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.bancoinvest.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-head">
        <div>
          <h4>{t.imports.bancoinvest.title}</h4>
          <p>{t.imports.bancoinvest.hint}</p>
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
            {t.imports.bancoinvest.chooseFile}
          </label>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handlePreview()}
            disabled={loadingPreview}
          >
            {loadingPreview
              ? t.imports.bancoinvest.previewing
              : t.imports.bancoinvest.preview}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleSave}
            disabled={saving || !preview}
          >
            {saving ? t.imports.bancoinvest.saving : t.imports.bancoinvest.save}
          </button>
        </div>
      </div>
      {file ? (
        <p className="import-file">
          {t.imports.bancoinvest.selected} {file.name}
        </p>
      ) : null}
      {error ? <p className="login-error">{error}</p> : null}
      {message ? <div className="login-banner">{message}</div> : null}
      {preview ? (
        <div className="import-preview">
          <div className="preview-head">
            <span>{t.imports.bancoinvest.previewTitle}</span>
            <span>{preview.items.length}</span>
          </div>
          <div className="preview-table">
            <div className="row head">
              <span>{t.imports.bancoinvest.columns.holder}</span>
              <span>{t.imports.bancoinvest.columns.currentValue}</span>
              <span>{t.imports.bancoinvest.columns.invested}</span>
              <span>{t.imports.bancoinvest.columns.gains}</span>
              <span>{t.imports.bancoinvest.columns.category}</span>
            </div>
            {preview.items.map((item, index) => (
              <div className="row" key={`${item.holder}-${index}`}>
                <span>{item.holder}</span>
                <span>{formatter.format(item.current_value)}</span>
                <span>
                  {item.invested === null ? "?" : formatter.format(item.invested)}
                </span>
                <span
                  className={
                    item.gains === null || item.gains === undefined
                      ? ""
                      : item.gains >= 0
                      ? "pos"
                      : "neg"
                  }
                >
                  {item.gains === null ? "?" : formatter.format(item.gains)}
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
          <span>{t.imports.bancoinvest.history}</span>
          <span>{entries.length}</span>
        </div>
        {loadingEntries ? (
          <div className="loading-banner">{t.imports.bancoinvest.loading}</div>
        ) : null}
        {entries.length ? (
          <div className="manual-table">
            <div className="row head with-actions">
              <span>{t.imports.bancoinvest.columns.date}</span>
              <span>{t.imports.bancoinvest.columns.file}</span>
              <span>{t.imports.bancoinvest.columns.totalValue}</span>
              <span>{t.imports.bancoinvest.columns.actions}</span>
            </div>
            {entries.map((entry) => (
              <div className="import-block" key={entry.id}>
                <div className="row with-actions">
                  <span>
                    {entry.snapshot_date ||
                      new Date(entry.imported_at).toLocaleDateString()}
                  </span>
                  <span>{entry.source_file}</span>
                  <span>{formatter.format(entry.total_value)}</span>
                  <span>
                    <button
                      className="ghost-btn danger-btn"
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id
                        ? t.imports.bancoinvest.deleting
                        : t.imports.bancoinvest.delete}
                    </button>
                  </span>
                </div>
                {entry.items?.length ? (
                  <div className="import-lines">
                    <div className="row head">
                      <span>{t.imports.bancoinvest.columns.holder}</span>
                      <span>{t.imports.bancoinvest.columns.currentValue}</span>
                      <span>{t.imports.bancoinvest.columns.invested}</span>
                      <span>{t.imports.bancoinvest.columns.gains}</span>
                      <span>{t.imports.bancoinvest.columns.category}</span>
                    </div>
                    {entry.items.map((item, index) => (
                      <div className="row" key={`${entry.id}-${index}`}>
                        <span>{item.holder}</span>
                        <span>{formatter.format(item.current_value)}</span>
                        <span>
                          {item.invested === null
                            ? "?"
                            : formatter.format(item.invested)}
                        </span>
                        <span
                          className={
                            item.gains === null || item.gains === undefined
                              ? ""
                              : item.gains >= 0
                              ? "pos"
                              : "neg"
                          }
                        >
                          {item.gains === null ? "?" : formatter.format(item.gains)}
                        </span>
                        <span>{item.category}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="chart-sub">{t.imports.bancoinvest.noEntries}</p>
        )}
      </div>
    </div>
  );
}

export default BancoInvestImport;
