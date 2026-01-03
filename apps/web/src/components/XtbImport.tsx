import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type XtbPreviewItem = {
  filename: string;
  file_hash: string;
  account_type: string;
  category: string;
  current_value: number;
  cash_value: number;
  invested: number;
  profit_value: number | null;
  profit_percent: number | null;
};

type XtbImportEntry = {
  id: number;
  account_type: string;
  category: string;
  current_value: number;
  cash_value: number;
  invested: number;
  profit_value: number | null;
  profit_percent: number | null;
  source_file: string;
  imported_at: string;
};

type XtbHoldingItem = {
  source_file: string;
  ticker: string;
  name?: string | null;
  shares: number;
  open_price: number;
  purchase_value?: number | null;
  current_price?: number | null;
  category?: string | null;
};

type XtbOperationItem = {
  source_file: string;
  ticker?: string | null;
  operation_type: string;
  operation_kind?: string | null;
  description?: string | null;
  amount?: number | null;
  trade_date?: string | null;
  currency?: string | null;
};

type XtbImportProps = {
  portfolioId: number;
  token: string;
  currency: string;
  categories: string[];
  t: Translation;
  onRefresh: () => void;
};

const API_BASE = "http://127.0.0.1:8000";

function XtbImport({
  portfolioId,
  token,
  currency,
  categories,
  t,
  onRefresh
}: XtbImportProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previewItems, setPreviewItems] = useState<XtbPreviewItem[]>([]);
  const [previewHoldings, setPreviewHoldings] = useState<XtbHoldingItem[]>([]);
  const [previewOperations, setPreviewOperations] = useState<XtbOperationItem[]>([]);
  const [entries, setEntries] = useState<XtbImportEntry[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
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
      const response = await fetch(`${API_BASE}/portfolios/${portfolioId}/imports/xtb`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.xtb.loadError);
        return;
      }
      setEntries(data.items || []);
    } catch (err) {
      setError(t.imports.xtb.loadError);
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

  const handlePreview = async (selectedFiles: File[]) => {
    if (!selectedFiles.length) {
      setError(t.imports.xtb.noFile);
      return;
    }
    setLoadingPreview(true);
    setError("");
    setMessage("");
    setWarnings([]);
    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/xtb/preview`,
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
        setError(data?.detail || t.imports.xtb.previewError);
        return;
      }
      const items = (data.items || []).map((item: XtbPreviewItem) => ({
        ...item,
        current_value: Number(item.current_value) || 0,
        cash_value: Number(item.cash_value) || 0,
        invested: Number(item.invested) || 0,
        profit_value:
          item.profit_value === null || item.profit_value === undefined
            ? null
            : Number(item.profit_value) || 0,
        profit_percent:
          item.profit_percent === null || item.profit_percent === undefined
            ? null
            : Number(item.profit_percent) || 0,
        category: item.category || "Stocks"
      }));
      const holdings = (data.holdings || []).map((item: XtbHoldingItem) => ({
        ...item,
        shares: Number(item.shares) || 0,
        open_price: Number(item.open_price) || 0,
        purchase_value:
          item.purchase_value === null || item.purchase_value === undefined
            ? null
            : Number(item.purchase_value) || 0,
        current_price:
          item.current_price === null || item.current_price === undefined
          ? null
          : Number(item.current_price) || 0,
        category: item.category || "Stocks"
      }));
      const operations = (data.operations || []).map((item: XtbOperationItem) => ({
        ...item,
        amount:
          item.amount === null || item.amount === undefined
            ? null
            : Number(item.amount) || 0
      }));
      const warningList: string[] = [];
      (data.warnings || []).forEach((warning: { filename: string; warnings: string[] }) => {
        warning.warnings.forEach((entry) =>
          warningList.push(`${warning.filename}: ${entry}`)
        );
      });
      setWarnings(warningList);
      setPreviewItems(items);
      setPreviewHoldings(holdings);
      setPreviewOperations(operations);
    } catch (err) {
      setError(t.imports.xtb.previewError);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!previewItems.length) {
      setError(t.imports.xtb.noPreview);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/xtb/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            items: previewItems,
            holdings: previewHoldings,
            operations: previewOperations
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.xtb.saveError);
        return;
      }
      setMessage(t.imports.xtb.saveSuccess);
      setPreviewItems([]);
      setPreviewHoldings([]);
      setPreviewOperations([]);
      setFiles([]);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.xtb.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (importId: number) => {
    const confirmed = window.confirm(t.imports.xtb.deleteConfirm);
    if (!confirmed) {
      return;
    }
    setDeletingId(importId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/xtb/${importId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.xtb.deleteError);
        return;
      }
      setMessage(t.imports.xtb.deleteSuccess);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.xtb.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-head">
        <div>
          <h4>{t.imports.xtb.title}</h4>
          <p>{t.imports.xtb.hint}</p>
        </div>
        <div className="import-actions">
          <label className="file-btn">
            <input
              type="file"
              multiple
              accept=".xlsx,.xls"
              onChange={(event) => {
                const nextFiles = Array.from(event.target.files || []);
                setFiles(nextFiles);
                setPreviewItems([]);
                setPreviewHoldings([]);
                setWarnings([]);
                setError("");
                setMessage("");
                if (nextFiles.length) {
                  handlePreview(nextFiles);
                }
              }}
            />
            {t.imports.xtb.chooseFiles}
          </label>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handlePreview(files)}
            disabled={loadingPreview}
          >
            {loadingPreview ? t.imports.xtb.previewing : t.imports.xtb.preview}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleSave}
            disabled={saving || previewItems.length === 0}
          >
            {saving ? t.imports.xtb.saving : t.imports.xtb.save}
          </button>
        </div>
      </div>
      {files.length ? (
        <p className="import-file">
          {t.imports.xtb.selected} {files.map((file) => file.name).join(", ")}
        </p>
      ) : null}
      {error ? <p className="login-error">{error}</p> : null}
      {message ? <div className="login-banner">{message}</div> : null}
      {warnings.length ? (
        <div className="warning-box">
          <strong>{t.imports.xtb.warnings}</strong>
          <ul>
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {previewItems.length ? (
        <div className="import-preview">
          <div className="preview-head">
            <span>{t.imports.xtb.previewTitle}</span>
            <span>{previewItems.length}</span>
          </div>
          <div className="preview-table xtb">
            <div className="row head">
              <span>{t.imports.xtb.columns.file}</span>
              <span>{t.imports.xtb.columns.currentValue}</span>
              <span>{t.imports.xtb.columns.cash}</span>
              <span>{t.imports.xtb.columns.invested}</span>
              <span>{t.imports.xtb.columns.profit}</span>
              <span>{t.imports.xtb.columns.category}</span>
            </div>
            {previewItems.map((item) => {
              const profitClass =
                item.profit_value === null || item.profit_value === undefined
                  ? ""
                  : item.profit_value >= 0
                  ? "pos"
                  : "neg";
              return (
                <div className="row" key={item.file_hash}>
                  <span>{item.filename}</span>
                  <span>{formatter.format(item.current_value)}</span>
                  <span>{formatter.format(item.cash_value)}</span>
                  <span>{formatter.format(item.invested)}</span>
                  <span className={profitClass}>
                    {item.profit_value === null
                      ? "?"
                      : formatter.format(item.profit_value)}
                  </span>
                  <select
                    value={item.category}
                    onChange={(event) => {
                      const nextCategory = event.target.value;
                      const next = previewItems.map((row) =>
                        row.file_hash === item.file_hash
                          ? { ...row, category: nextCategory }
                          : row
                      );
                      setPreviewItems(next);
                      setPreviewHoldings((current) =>
                        current.map((holding) =>
                          holding.source_file === item.filename
                            ? { ...holding, category: nextCategory }
                            : holding
                        )
                      );
                    }}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="manual-history">
        <div className="preview-head">
          <span>{t.imports.xtb.history}</span>
          <span>{entries.length}</span>
        </div>
        {loadingEntries ? (
          <div className="loading-banner">{t.imports.xtb.loading}</div>
        ) : null}
        {entries.length ? (
          <div className="manual-table">
            <div className="row head">
              <span>{t.imports.xtb.columns.date}</span>
              <span>{t.imports.xtb.columns.currentValue}</span>
              <span>{t.imports.xtb.columns.invested}</span>
              <span>{t.imports.xtb.columns.profit}</span>
              <span>{t.imports.xtb.columns.category}</span>
              <span>{t.imports.xtb.columns.actions}</span>
            </div>
            {entries.map((entry) => {
              const profitClass =
                entry.profit_value === null || entry.profit_value === undefined
                  ? ""
                  : entry.profit_value >= 0
                  ? "pos"
                  : "neg";
              return (
                <div className="row" key={entry.id}>
                  <span>{new Date(entry.imported_at).toLocaleDateString()}</span>
                  <span>{formatter.format(entry.current_value)}</span>
                  <span>{formatter.format(entry.invested)}</span>
                  <span className={profitClass}>
                    {entry.profit_value === null
                      ? "?"
                      : formatter.format(entry.profit_value)}
                  </span>
                  <span>{entry.category}</span>
                  <span>
                    <button
                      className="ghost-btn danger-btn"
                      type="button"
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                    >
                      {deletingId === entry.id
                        ? t.imports.xtb.deleting
                        : t.imports.xtb.delete}
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="chart-sub">{t.imports.xtb.noEntries}</p>
        )}
      </div>
    </div>
  );
}

export default XtbImport;
