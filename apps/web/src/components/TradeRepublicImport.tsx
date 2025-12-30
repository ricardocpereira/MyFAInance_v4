import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type TradeRepublicPreviewItem = {
  filename: string;
  file_hash: string;
  snapshot_date: string | null;
  available_cash: number;
  interests_received: number;
  invested: number;
  value: number;
  gains: number;
  category: string;
};

type TradeRepublicEntry = {
  id: number;
  available_cash: number;
  interests_received: number;
  invested: number;
  value: number;
  gains: number;
  currency: string;
  category: string | null;
  source: string;
  source_file: string | null;
  snapshot_date: string | null;
  created_at: string;
};

type TradeRepublicImportProps = {
  portfolioId: number;
  token: string;
  currency: string;
  categories: string[];
  t: Translation;
  onRefresh: () => void;
};

const API_BASE = "http://127.0.0.1:8000";

function TradeRepublicImport({
  portfolioId,
  token,
  currency,
  categories,
  t,
  onRefresh
}: TradeRepublicImportProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [preview, setPreview] = useState<TradeRepublicPreviewItem[]>([]);
  const [entries, setEntries] = useState<TradeRepublicEntry[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [manualAvailableCash, setManualAvailableCash] = useState("");
  const [manualInterests, setManualInterests] = useState("");
  const [manualCategory, setManualCategory] = useState("Cash");
  const [manualSaving, setManualSaving] = useState(false);
  const [manualError, setManualError] = useState("");
  const [manualMessage, setManualMessage] = useState("");

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

  useEffect(() => {
    if (!categoryOptions.length) {
      return;
    }
    if (!categoryOptions.includes(manualCategory)) {
      setManualCategory(categoryOptions[0]);
    }
  }, [categoryOptions, manualCategory]);

  const parseNumber = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }
    let value = trimmed.replace(/[^0-9,.-]/g, "");
    if (value.includes(",") && value.includes(".")) {
      if (value.lastIndexOf(",") > value.lastIndexOf(".")) {
        value = value.replace(/\./g, "");
        value = value.replace(",", ".");
      } else {
        value = value.replace(/,/g, "");
      }
    } else if (value.includes(",")) {
      value = value.replace(",", ".");
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const manualAvailableValue = parseNumber(manualAvailableCash);
  const manualInterestsValue = parseNumber(manualInterests);
  const manualInvested =
    manualAvailableValue !== null && manualInterestsValue !== null
      ? manualAvailableValue - manualInterestsValue
      : null;

  const loadEntries = async () => {
    setLoadingEntries(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/trade-republic`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.tradeRepublic.loadError);
        return;
      }
      setEntries(data.items || []);
    } catch (err) {
      setError(t.imports.tradeRepublic.loadError);
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

  const handlePreview = async (selectedFiles?: File[]) => {
    const filesToUse = selectedFiles ?? files;
    if (!filesToUse.length) {
      setError(t.imports.tradeRepublic.noFile);
      return;
    }
    setLoadingPreview(true);
    setError("");
    setMessage("");
    setPreview([]);
    try {
      const formData = new FormData();
      filesToUse.forEach((file) => formData.append("files", file));
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/trade-republic/preview`,
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
        setError(data?.detail || t.imports.tradeRepublic.previewError);
        return;
      }
      setPreview(data.items || []);
    } catch (err) {
      setError(t.imports.tradeRepublic.previewError);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!preview.length) {
      setError(t.imports.tradeRepublic.noPreview);
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/trade-republic/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ items: preview })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.tradeRepublic.saveError);
        return;
      }
      setMessage(t.imports.tradeRepublic.saveSuccess);
      setFiles([]);
      setPreview([]);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.tradeRepublic.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: number) => {
    const confirmed = window.confirm(t.imports.tradeRepublic.deleteConfirm);
    if (!confirmed) {
      return;
    }
    setDeletingId(entryId);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/trade-republic/${entryId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data?.detail || t.imports.tradeRepublic.deleteError);
        return;
      }
      setMessage(t.imports.tradeRepublic.deleteSuccess);
      await loadEntries();
      onRefresh();
    } catch (err) {
      setError(t.imports.tradeRepublic.deleteError);
    } finally {
      setDeletingId(null);
    }
  };

  const handleManualSave = async () => {
    if (manualAvailableValue === null || manualInterestsValue === null) {
      setManualError(t.imports.tradeRepublic.manualRequired);
      return;
    }
    setManualSaving(true);
    setManualError("");
    setManualMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/trade-republic/manual`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            available_cash: manualAvailableCash,
            interests_received: manualInterests,
            currency,
            category: manualCategory
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        setManualError(data?.detail || t.imports.tradeRepublic.manualError);
        return;
      }
      setManualMessage(t.imports.tradeRepublic.manualSuccess);
      setManualAvailableCash("");
      setManualInterests("");
      await loadEntries();
      onRefresh();
    } catch (err) {
      setManualError(t.imports.tradeRepublic.manualError);
    } finally {
      setManualSaving(false);
    }
  };

  return (
    <div className="import-card">
      <div className="import-card-head">
        <div>
          <h4>{t.imports.tradeRepublic.title}</h4>
          <p>{t.imports.tradeRepublic.hint}</p>
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
                setError("");
                setMessage("");
                if (nextFiles.length) {
                  handlePreview(nextFiles);
                }
              }}
            />
            {t.imports.tradeRepublic.chooseFiles}
          </label>
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handlePreview()}
            disabled={loadingPreview}
          >
            {loadingPreview
              ? t.imports.tradeRepublic.previewing
              : t.imports.tradeRepublic.preview}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? t.imports.tradeRepublic.saving : t.imports.tradeRepublic.save}
          </button>
        </div>
      </div>
      <div className="import-block">
        <div className="preview-head">
          <span>{t.imports.tradeRepublic.manualTitle}</span>
        </div>
        <div className="manual-form">
          <label>
            {t.imports.tradeRepublic.manualAvailable}
            <input
              value={manualAvailableCash}
              onChange={(event) => setManualAvailableCash(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            {t.imports.tradeRepublic.manualInterests}
            <input
              value={manualInterests}
              onChange={(event) => setManualInterests(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <label>
            {t.imports.tradeRepublic.columns.category}
            <select
              value={manualCategory}
              onChange={(event) => setManualCategory(event.target.value)}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <button
            className="primary-btn"
            type="button"
            onClick={handleManualSave}
            disabled={manualSaving}
          >
            {manualSaving
              ? t.imports.tradeRepublic.manualSaving
              : t.imports.tradeRepublic.manualSave}
          </button>
        </div>
        {manualError ? <p className="login-error">{manualError}</p> : null}
        {manualMessage ? <div className="login-banner">{manualMessage}</div> : null}
        {manualInvested !== null && manualAvailableValue !== null ? (
          <div className="manual-preview">
            <span>
              {t.imports.tradeRepublic.manualPreviewInvested}{" "}
              <strong>{formatter.format(manualInvested)}</strong>
            </span>
            <span>
              {t.imports.tradeRepublic.manualPreviewProfit}{" "}
              <strong>{formatter.format(manualInterestsValue || 0)}</strong>
            </span>
          </div>
        ) : null}
      </div>
      {files.length ? (
        <p className="import-file">
          {t.imports.tradeRepublic.selected} {files.map((file) => file.name).join(", ")}
        </p>
      ) : null}
      {error ? <p className="login-error">{error}</p> : null}
      {message ? <div className="login-banner">{message}</div> : null}
      {preview.length ? (
        <div className="import-preview">
          <div className="preview-head">
            <span>{t.imports.tradeRepublic.preview}</span>
            <span>{preview.length}</span>
          </div>
          <div className="preview-table">
            <div className="row head">
              <span>{t.imports.tradeRepublic.columns.file}</span>
              <span>{t.imports.tradeRepublic.columns.availableCash}</span>
              <span>{t.imports.tradeRepublic.columns.interestsReceived}</span>
              <span>{t.imports.tradeRepublic.columns.invested}</span>
              <span>{t.imports.tradeRepublic.columns.profit}</span>
              <span>{t.imports.tradeRepublic.columns.category}</span>
            </div>
            {preview.map((item, index) => (
              <div className="row" key={`${item.filename}-${index}`}>
                <span>{item.filename}</span>
                <span>{formatter.format(item.available_cash)}</span>
                <span>{formatter.format(item.interests_received)}</span>
                <span>{formatter.format(item.invested)}</span>
                <span>{formatter.format(item.gains)}</span>
                <select
                  value={item.category}
                  onChange={(event) => {
                    const next = [...preview];
                    next[index] = { ...item, category: event.target.value };
                    setPreview(next);
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
          <span>{t.imports.tradeRepublic.history}</span>
          <span>{entries.length}</span>
        </div>
        {loadingEntries ? (
          <div className="loading-banner">{t.imports.tradeRepublic.loading}</div>
        ) : null}
        {entries.length ? (
          <div className="manual-table">
            <div className="row head">
              <span>{t.imports.tradeRepublic.columns.date}</span>
              <span>{t.imports.tradeRepublic.columns.file}</span>
              <span>{t.imports.tradeRepublic.columns.availableCash}</span>
              <span>{t.imports.tradeRepublic.columns.interestsReceived}</span>
              <span>{t.imports.tradeRepublic.columns.invested}</span>
              <span>{t.imports.tradeRepublic.columns.profit}</span>
              <span>{t.imports.tradeRepublic.columns.category}</span>
              <span>{t.imports.tradeRepublic.columns.actions}</span>
            </div>
            {entries.map((entry) => (
              <div className="row" key={entry.id}>
                <span>
                  {entry.snapshot_date || new Date(entry.created_at).toLocaleDateString()}
                </span>
                <span>{entry.source_file || entry.source}</span>
                <span>{formatter.format(entry.available_cash)}</span>
                <span>{formatter.format(entry.interests_received)}</span>
                <span>{formatter.format(entry.invested)}</span>
                <span>{formatter.format(entry.gains)}</span>
                <span>{entry.category || "Cash"}</span>
                <span>
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                  >
                    {deletingId === entry.id
                      ? t.imports.tradeRepublic.deleting
                      : t.imports.tradeRepublic.delete}
                  </button>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="chart-sub">{t.imports.tradeRepublic.noEntries}</p>
        )}
      </div>
    </div>
  );
}

export default TradeRepublicImport;
