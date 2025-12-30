import { useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type SantanderItem = {
  section: string;
  account: string;
  description?: string | null;
  balance: number;
  category: string;
  ignore?: boolean;
};

type SantanderImportProps = {
  portfolioId: number;
  categories: string[];
  token: string;
  currency: string;
  t: Translation;
  onRefresh: () => void;
  embedded?: boolean;
};

const API_BASE = "http://127.0.0.1:8000";
function SantanderImport({
  portfolioId,
  categories,
  token,
  currency,
  t,
  onRefresh,
  embedded = false
}: SantanderImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<SantanderItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingCommit, setLoadingCommit] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  const formatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency
      }),
    [currency]
  );

  const categoryOptions = useMemo(() => [...categories, "Unknown"], [categories]);

  const handlePreview = async (nextFile?: File | null) => {
    const targetFile = nextFile ?? file;
    if (!targetFile) {
      setError(t.imports.santander.noFile);
      return;
    }
    setError("");
    setCommitMessage("");
    setLoadingPreview(true);
    try {
      const formData = new FormData();
      formData.append("file", targetFile);
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/santander/preview`,
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
            ? t.imports.santander.invalidFile
            : typeof data?.detail === "string"
            ? data.detail
            : t.imports.santander.previewError;
        setError(detail);
        return;
      }
      const nextItems = (data.items || []).map((item: SantanderItem) => ({
        ...item,
        ignore: item.ignore ?? false
      }));
      setItems(nextItems);
      setWarnings(data.warnings || []);
    } catch (err) {
      setError(t.imports.santander.previewError);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleCommit = async () => {
    if (!items.length || !file) {
      setError(t.imports.santander.noItems);
      return;
    }
    setError("");
    setCommitMessage("");
    setLoadingCommit(true);
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/imports/santander/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            filename: file.name,
            items
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        const detail =
          Array.isArray(data?.detail)
            ? t.imports.santander.commitError
            : typeof data?.detail === "string"
            ? data.detail
            : t.imports.santander.commitError;
        setError(detail);
        return;
      }
      setCommitMessage(
        `${t.imports.santander.commitSuccess} (#${data.import_id})`
      );
      onRefresh();
    } catch (err) {
      setError(t.imports.santander.commitError);
    } finally {
      setLoadingCommit(false);
    }
  };

  const card = (
    <div className="import-card">
        <div className="import-card-head">
          <div>
            <h4>{t.imports.santander.title}</h4>
            <p>{t.imports.santander.hint}</p>
          </div>
          <div className="import-actions">
            <label className="file-btn">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] || null;
                  setFile(nextFile);
                  setItems([]);
                  setWarnings([]);
                  setCommitMessage("");
                  setError("");
                  if (nextFile) {
                    handlePreview(nextFile);
                  }
                }}
              />
              {t.imports.santander.chooseFile}
            </label>
            <button
              className="ghost-btn"
              type="button"
              onClick={handlePreview}
              disabled={loadingPreview}
            >
              {loadingPreview ? t.imports.santander.previewing : t.imports.santander.preview}
            </button>
            <button
              className="primary-btn"
              type="button"
              onClick={handleCommit}
              disabled={loadingCommit || items.length === 0}
            >
              {loadingCommit ? t.imports.santander.saving : t.imports.santander.save}
            </button>
          </div>
        </div>
        {file ? (
          <p className="import-file">
            {t.imports.santander.selected} {file.name}
          </p>
        ) : null}
        {error ? <p className="login-error">{error}</p> : null}
        {commitMessage ? <div className="login-banner">{commitMessage}</div> : null}
        {warnings.length ? (
          <div className="warning-box">
            <strong>{t.imports.santander.warnings}</strong>
            <ul>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {items.length ? (
          <div className="import-preview">
            <div className="preview-head">
              <span>{t.imports.santander.previewTitle}</span>
              <span>{items.length} {t.imports.santander.items}</span>
            </div>
            <div className="preview-table">
              <div className="row head">
                <span>{t.imports.santander.columns.section}</span>
                <span>{t.imports.santander.columns.account}</span>
                <span>{t.imports.santander.columns.description}</span>
                <span>{t.imports.santander.columns.balance}</span>
                <span>{t.imports.santander.columns.category}</span>
                <span>{t.imports.santander.columns.include}</span>
              </div>
              {items.map((item, index) => (
                <div className="row" key={`${item.account}-${index}`}>
                  <span>{item.section}</span>
                  <span>{item.account}</span>
                  <span>{item.description || "-"}</span>
                  <span>{formatter.format(item.balance)}</span>
                  <select
                    value={item.category}
                    onChange={(event) => {
                      const next = [...items];
                      const nextCategory = event.target.value;
                      next[index] = { ...item, category: nextCategory, ignore: false };
                      setItems(next);
                    }}
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {item.category === "Unknown" ? (
                    <label className="include-toggle">
                      <input
                        type="checkbox"
                        checked={!item.ignore}
                        onChange={(event) => {
                          const next = [...items];
                          next[index] = { ...item, ignore: !event.target.checked };
                          setItems(next);
                        }}
                      />
                      {t.imports.santander.include}
                    </label>
                  ) : (
                    <span className="include-static">-</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
  );

  if (embedded) {
    return card;
  }

  return (
    <section className="import-section">
      <div className="import-header">
        <div>
          <h3>{t.imports.title}</h3>
          <p>{t.imports.subtitle}</p>
        </div>
      </div>
      {card}
    </section>
  );
}

export default SantanderImport;
