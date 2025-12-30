import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type PortfolioModalProps = {
  open: boolean;
  loading: boolean;
  error: string;
  t: Translation;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    currency: string;
    customCategories: string[];
  }) => void;
};

const defaultCurrencies = ["EUR", "USD", "GBP"];
const defaultCategories = ["Cash", "Emergency Funds", "Retirement Plans", "Stocks"];

function PortfolioModal({
  open,
  loading,
  error,
  t,
  onClose,
  onSave
}: PortfolioModalProps) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [custom, setCustom] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setCurrency("EUR");
      setCustom("");
    }
  }, [open]);

  const parsedCustom = useMemo(
    () =>
      custom
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    [custom]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <header>
          <h2>{t.portfolio.createTitle}</h2>
          <button className="ghost-btn" type="button" onClick={onClose}>
            {t.portfolio.cancel}
          </button>
        </header>
        <div className="modal-grid">
          <label className="field">
            <span>{t.portfolio.nameLabel}</span>
            <input
              type="text"
              placeholder={t.portfolio.namePlaceholder}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="field">
            <span>{t.portfolio.currencyLabel}</span>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
            >
              {defaultCurrencies.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span>{t.portfolio.defaults}</span>
            <div className="chip-list">
              {defaultCategories.map((item) => (
                <span key={item} className="chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
          <label className="field">
            <span>{t.portfolio.customLabel}</span>
            <input
              type="text"
              placeholder={t.portfolio.customHint}
              value={custom}
              onChange={(event) => setCustom(event.target.value)}
            />
            {parsedCustom.length ? (
              <div className="chip-list">
                {parsedCustom.map((item) => (
                  <span key={item} className="chip outline">
                    {item}
                  </span>
                ))}
              </div>
            ) : null}
          </label>
        </div>
        {error ? <p className="login-error">{error}</p> : null}
        <div className="modal-actions">
          <button className="ghost-btn" type="button" onClick={onClose}>
            {t.portfolio.cancel}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() =>
              onSave({
                name,
                currency,
                customCategories: parsedCustom
              })
            }
            disabled={loading || !name.trim()}
          >
            {loading ? t.portfolio.saving : t.portfolio.save}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PortfolioModal;
