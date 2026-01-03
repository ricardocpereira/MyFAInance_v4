import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type AforroNetItem = {
  name: string;
  invested: number;
  current_value: number;
  category: string;
};

type AforroNetPreview = {
  filename: string;
  file_hash: string;
  snapshot_date: string | null;
  items: AforroNetItem[];
};

type AforroNetImportEntry = {
  id: number;
  invested_total: number;
  current_value_total: number;
  category: string;
  source_file: string;
  snapshot_date: string | null;
  created_at: string;
};

type AforroNetImportProps = {
  portfolioId: number;
  token: string;
  currency: string;
  categories: string[];
  t: Translation;
  onRefresh: () => void;
};

const API_BASE = "http://127.0.0.1:8000";

function AforroNetImport({
  portfolioId,
  token,
  currency,
  categories,
  t,
  onRefresh
}: AforroNetImportProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<AforroNetPreview[]>([]);
  const [entries, setEntries] = useState<AforroNetImportEntry[]>([]);
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
        `${API_BASE}/portfolios/${portfolioId}/imports/aforronet`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.aforronet.loadError);
        return;
      }
      setEntries(data.items || []);
    } catch (err) {
      setError(t.imports.aforronet.loadError);
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

  const handlePreview = async (nextFiles?: File[]) => {
    const targetFiles = nextFiles ?? files;
    if (!targetFiles.length) {
      setError(t.imports.aforronet.noFile);
      return;
    }
    setLoadingPreview(true);
    setError("");
    setMessage("");
    setPreview([]);
    try {
      const formData = new FormData();
      targetFiles.forEach((targetFile) => formData.append("files", targetFile));
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/aforronet/preview`,
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
        const detail =
          Array.isArray(data?.detail)
            ? t.imports.aforronet.previewError
            : typeof data?.detail === "string"
            ? data.detail
            : t.imports.aforronet.previewError;
        setError(detail);
        return;
      }
      const items = (data.items || []).map((entry: AforroNetPreview) => ({
        filename: entry.filename,
        file_hash: entry.file_hash,
        snapshot_date: entry.snapshot_date || null,
        items: (entry.items || []).map((item: AforroNetItem) => ({
          name: item.name,
          invested: Number(item.invested) || 0,
          current_value: Number(item.current_value) || 0,
          category: item.category || "Emergency Funds"
        }))
      }));
      setPreview(items);
    } catch (err) {
      setError(t.imports.aforronet.previewError);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!preview.length) {
      setError(t.imports.aforronet.noPreview);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/aforronet/commit-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ imports: preview })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.aforronet.saveError);
        return;
      }
      setMessage(t.imports.aforronet.saveSuccess);
      setPreview([]);
      setFiles([]);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.aforronet.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (importId: number) => {
    const confirmed = window.confirm(t.imports.aforronet.deleteConfirm);
    if (!confirmed) {
      return;
    }
    setDeletingId(importId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/aforronet/${importId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.aforronet.deleteError);
        return;
      }
      setMessage(t.imports.aforronet.deleteSuccess);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.aforronet.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-head">
        <div>
          <h4>{t.imports.aforronet.title}</h4>
          <p>{t.imports.aforronet.hint}</p>
        </div>
        <div className="import-actions">
          <label className="file-btn">
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files || []);
                setFiles(nextFiles);
                setPreview([]);
                setMessage("");
                if (nextFiles.length) {
                  handlePreview(nextFiles);
                }
              }}
            />
            {t.imports.aforronet.chooseFile}
          </label>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handlePreview()}
            disabled={loadingPreview}
          >
            {loadingPreview ? t.imports.aforronet.previewing : t.imports.aforronet.preview}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t.imports.aforronet.saving : t.imports.aforronet.save}
          </button>
        </div>
      </div>
      {files.length ? (
        <p className="file-hint">
          {t.imports.aforronet.selected} {files.map((item) => item.name).join(", ")}
        </p>
      ) : null}
      {error ? <p className="login-error">{error}</p> : null}
      {message ? <div className="login-banner">{message}</div> : null}
      {preview.length ? (
        <div className="import-preview">
          <div className="preview-head">
            <span>{t.imports.aforronet.previewTitle}</span>
            <span>{preview.length}</span>
          </div>
          {preview.map((entry, entryIndex) => (
            <div className="preview-table" key={entry.file_hash}>
              <div className="preview-head">
                <span>{entry.filename}</span>
                <span>{entry.snapshot_date || "-"}</span>
              </div>
              <div className="row head">
                <span>{t.imports.aforronet.columns.name}</span>
                <span>{t.imports.aforronet.columns.invested}</span>
                <span>{t.imports.aforronet.columns.currentValue}</span>
                <span>{t.imports.aforronet.columns.profit}</span>
                <span>{t.imports.aforronet.columns.category}</span>
              </div>
              {entry.items.map((item, index) => {
                const profit = item.current_value - item.invested;
                const profitClass = profit >= 0 ? "pos" : "neg";
                return (
                  <div className="row" key={`${entry.filename}-${item.name}-${index}`}>
                    <span>{item.name}</span>
                    <span>{formatter.format(item.invested)}</span>
                    <span>{formatter.format(item.current_value)}</span>
                    <span className={profitClass}>{formatter.format(profit)}</span>
                    <select
                      value={item.category}
                      onChange={(event) => {
                        const nextCategory = event.target.value;
                        setPreview((prev) =>
                          prev.map((row, rowIndex) => {
                            if (rowIndex !== entryIndex) {
                              return row;
                            }
                            const items = row.items.map((inner, innerIndex) =>
                              innerIndex === index
                                ? { ...inner, category: nextCategory }
                                : inner
                            );
                            return { ...row, items };
                          })
                        );
                      }}
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}
      <div className="manual-history">
        <div className="preview-head">
          <span>{t.imports.aforronet.history}</span>
          <span>{entries.length}</span>
        </div>
        {loadingEntries ? (
          <div className="loading-banner">{t.imports.aforronet.loading}</div>
        ) : null}
        {entries.length ? (
          <div className="manual-table">
            <div className="row head">
              <span>{t.imports.aforronet.columns.date}</span>
              <span>{t.imports.aforronet.columns.currentValue}</span>
              <span>{t.imports.aforronet.columns.invested}</span>
              <span>{t.imports.aforronet.columns.profit}</span>
              <span>{t.imports.aforronet.columns.actions}</span>
            </div>
            {entries.map((entry) => {
              const profit = entry.current_value_total - entry.invested_total;
              const profitClass = profit >= 0 ? "pos" : "neg";
              return (
                <div className="row" key={entry.id}>
                  <span>
                    {entry.snapshot_date ||
                      new Date(entry.created_at).toLocaleDateString()}
                  </span>
                  <span>{formatter.format(entry.current_value_total)}</span>
                  <span>{formatter.format(entry.invested_total)}</span>
                  <span className={profitClass}>{formatter.format(profit)}</span>
                  <span>
                    <button
                      className="danger-btn"
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id
                        ? t.imports.aforronet.deleting
                        : t.imports.aforronet.delete}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="chart-sub">{t.imports.aforronet.noEntries}</p>
        )}
      </div>
    </div>
  );
}

export default AforroNetImport;
