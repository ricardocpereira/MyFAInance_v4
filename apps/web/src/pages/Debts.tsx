import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
};

type Debt = {
  id: number;
  name: string;
  original_amount: number;
  current_balance: number;
  monthly_payment: number;
  percent_paid: number;
  months_remaining: number | null;
  payoff_age: number | null;
};

type DebtsProps = {
  t: Translation;
  token: string;
  portfolio?: Portfolio | null;
};

const API_BASE = "http://127.0.0.1:8000";

function Debts({ t, token, portfolio }: DebtsProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [ageInput, setAgeInput] = useState("");
  const [ageSaving, setAgeSaving] = useState(false);
  const [ageMessage, setAgeMessage] = useState("");
  const [ageError, setAgeError] = useState("");

  const [name, setName] = useState("");
  const [originalAmount, setOriginalAmount] = useState("");
  const [currentBalance, setCurrentBalance] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const currencyLabel = portfolio?.currency || "EUR";
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyLabel,
        currencyDisplay: "code"
      }),
    [currencyLabel]
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);

  const parseNumber = (value: string) => {
    if (!value) {
      return null;
    }
    let cleaned = value.trim();
    if (!cleaned) {
      return null;
    }
    cleaned = cleaned.replace(/[^0-9,.-]/g, "");
    if (cleaned.includes(",") && cleaned.includes(".")) {
      if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
        cleaned = cleaned.replace(/\./g, "");
        cleaned = cleaned.replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    } else if (cleaned.includes(",")) {
      cleaned = cleaned.replace(",", ".");
    }
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const resetForm = () => {
    setName("");
    setOriginalAmount("");
    setCurrentBalance("");
    setMonthlyPayment("");
    setEditingId(null);
  };

  const loadProfile = async () => {
    if (!token) {
      return;
    }
    setAgeError("");
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setAgeInput(data.age ? String(data.age) : "");
    } catch (err) {
      setAgeError(t.debts.ageError);
    }
  };

  const loadDebts = async () => {
    if (!token) {
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/debts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setDebts(data.items || []);
    } catch (err) {
      setError(t.debts.loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProfile();
      loadDebts();
    }
  }, [token]);

  const preview = useMemo(() => {
    const original = parseNumber(originalAmount);
    const balance = parseNumber(currentBalance);
    const monthly = parseNumber(monthlyPayment);
    const age = ageInput ? Number.parseInt(ageInput, 10) : null;
    let percentPaid = null;
    let monthsRemaining = null;
    let payoffAge = null;
    if (original && original > 0 && balance !== null) {
      percentPaid = ((original - balance) / original) * 100;
    }
    if (monthly && monthly > 0 && balance !== null) {
      monthsRemaining = Math.ceil(balance / monthly);
    }
    if (age !== null && Number.isFinite(age) && monthsRemaining !== null) {
      payoffAge = age + monthsRemaining / 12;
    }
    return { original, balance, monthly, percentPaid, monthsRemaining, payoffAge };
  }, [originalAmount, currentBalance, monthlyPayment, ageInput]);

  const handleSaveAge = async () => {
    if (!token) {
      return;
    }
    setAgeSaving(true);
    setAgeMessage("");
    setAgeError("");
    const trimmed = ageInput.trim();
    const payload =
      trimmed.length === 0
        ? { age: null }
        : { age: Number.parseInt(trimmed, 10) };
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setAgeInput(data.age ? String(data.age) : "");
      setAgeMessage(t.debts.ageSaved);
    } catch (err) {
      setAgeError(t.debts.ageError);
    } finally {
      setAgeSaving(false);
    }
  };

  const handleSaveDebt = async () => {
    if (!token) {
      return;
    }
    resetFeedback();
    setSaving(true);
    const original = parseNumber(originalAmount);
    const balance = parseNumber(currentBalance);
    const monthly = parseNumber(monthlyPayment);
    if (!name.trim() || original === null || balance === null || monthly === null) {
      setError(t.debts.saveError);
      setSaving(false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/debts${editingId ? `/${editingId}` : ""}`,
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.trim(),
            original_amount: original,
            current_balance: balance,
            monthly_payment: monthly
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const debt = data.debt as Debt;
      setDebts((prev) =>
        editingId
          ? prev.map((item) => (item.id === editingId ? debt : item))
          : [debt, ...prev]
      );
      setMessage(editingId ? t.debts.updateSuccess : t.debts.saveSuccess);
      resetForm();
    } catch (err) {
      setError(t.debts.saveError);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (debt: Debt) => {
    setEditingId(debt.id);
    setName(debt.name);
    setOriginalAmount(String(debt.original_amount));
    setCurrentBalance(String(debt.current_balance));
    setMonthlyPayment(String(debt.monthly_payment));
  };

  const handleDelete = async (debtId: number) => {
    if (!token) {
      return;
    }
    const confirmed = window.confirm(t.debts.deleteConfirm);
    if (!confirmed) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/debts/${debtId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      setDebts((prev) => prev.filter((item) => item.id !== debtId));
      setMessage(t.debts.deleteSuccess);
    } catch (err) {
      setError(t.debts.deleteError);
    }
  };

  const renderValue = (value: number | null | undefined, formatter?: (v: number) => string) => {
    if (value === null || value === undefined) {
      return t.debts.na;
    }
    return formatter ? formatter(value) : String(value);
  };

  return (
    <div className="debt-page">
      <header className="debt-header">
        <div>
          <h2>{t.debts.title}</h2>
          <p>{t.debts.subtitle}</p>
        </div>
      </header>

      <div className="debt-grid">
        <section className="debt-card">
          <header>
            <div>
              <h3>{t.debts.ageTitle}</h3>
              <p>{t.debts.payoffAgeHint}</p>
            </div>
          </header>
          <div className="form-grid">
            <div className="field">
              <label>{t.debts.ageLabel}</label>
              <input
                type="number"
                placeholder={t.debts.agePlaceholder}
                value={ageInput}
                onChange={(event) => setAgeInput(event.target.value)}
              />
            </div>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="button" onClick={handleSaveAge}>
              {ageSaving ? t.debts.ageSaving : t.debts.ageSave}
            </button>
          </div>
          {ageMessage ? <p className="success">{ageMessage}</p> : null}
          {ageError ? <p className="error">{ageError}</p> : null}
        </section>

        <section className="debt-card">
          <header>
            <div>
              <h3>{editingId ? t.debts.formEditTitle : t.debts.formTitle}</h3>
              <p>{t.debts.summaryTitle}</p>
            </div>
          </header>
          <div className="form-grid">
            <div className="field">
              <label>{t.debts.name}</label>
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="field">
              <label>{t.debts.originalAmount}</label>
              <input
                value={originalAmount}
                onChange={(event) => setOriginalAmount(event.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.debts.currentBalance}</label>
              <input
                value={currentBalance}
                onChange={(event) => setCurrentBalance(event.target.value)}
              />
            </div>
            <div className="field">
              <label>{t.debts.monthlyPayment}</label>
              <input
                value={monthlyPayment}
                onChange={(event) => setMonthlyPayment(event.target.value)}
              />
            </div>
          </div>
          <div className="debt-preview">
            <div>
              <span>{t.debts.percentPaid}</span>
              <strong>
                {preview.percentPaid === null
                  ? t.debts.na
                  : `${preview.percentPaid.toFixed(1)}%`}
              </strong>
            </div>
            <div>
              <span>{t.debts.monthsRemaining}</span>
              <strong>
                {preview.monthsRemaining === null
                  ? t.debts.na
                  : preview.monthsRemaining}
              </strong>
            </div>
            <div>
              <span>{t.debts.payoffAge}</span>
              <strong>
                {preview.payoffAge === null
                  ? t.debts.na
                  : preview.payoffAge.toFixed(1)}
              </strong>
            </div>
          </div>
          <div className="form-actions">
            {editingId ? (
              <button className="ghost-btn" type="button" onClick={resetForm}>
                {t.debts.cancel}
              </button>
            ) : null}
            <button className="primary-btn" type="button" onClick={handleSaveDebt}>
              {saving
                ? t.debts.saving
                : editingId
                ? t.debts.update
                : t.debts.save}
            </button>
          </div>
          {message ? <p className="success">{message}</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </section>
      </div>

      <section className="debt-card">
        <header>
          <div>
            <h3>{t.debts.summaryTitle}</h3>
            <p>{loading ? t.portfolio.loading : t.debts.subtitle}</p>
          </div>
        </header>
        {loading ? <p className="muted">{t.portfolio.loading}</p> : null}
        {!loading && debts.length === 0 ? <p className="muted">{t.debts.empty}</p> : null}
        {!loading && debts.length ? (
          <div className="debt-table-wrapper">
            <table className="debt-table">
              <thead>
                <tr>
                  <th>{t.debts.table.debt}</th>
                  <th>{t.debts.table.original}</th>
                  <th>{t.debts.table.balance}</th>
                  <th>{t.debts.table.monthly}</th>
                  <th>{t.debts.table.percent}</th>
                  <th>{t.debts.table.months}</th>
                  <th>{t.debts.table.payoffAge}</th>
                  <th>{t.debts.table.actions}</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id}>
                    <td>{debt.name}</td>
                    <td>{formatCurrency(debt.original_amount)}</td>
                    <td>{formatCurrency(debt.current_balance)}</td>
                    <td>{formatCurrency(debt.monthly_payment)}</td>
                    <td>{debt.percent_paid.toFixed(1)}%</td>
                    <td>{renderValue(debt.months_remaining)}</td>
                    <td>
                      {debt.payoff_age === null
                        ? t.debts.na
                        : debt.payoff_age.toFixed(1)}
                    </td>
                    <td className="debt-actions">
                      <button
                        className="ghost-btn"
                        type="button"
                        onClick={() => handleEdit(debt)}
                      >
                        {t.debts.edit}
                      </button>
                      <button
                        className="danger-btn"
                        type="button"
                        onClick={() => handleDelete(debt.id)}
                      >
                        {t.debts.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Debts;
