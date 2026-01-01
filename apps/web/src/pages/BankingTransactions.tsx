import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
};

type PreviewRow = {
  cells: Array<string | number | null>;
  include: boolean;
};

type PreviewPayload = {
  source_file: string;
  file_hash: string;
  columns: string[];
  rows: PreviewRow[];
  mapping: Record<string, number | null>;
  warnings: string[];
};

type BankingTransaction = {
  id: number;
  tx_date: string;
  description: string;
  amount: number;
  balance: number | null;
  currency: string;
  category: string;
  subcategory: string;
  institution: string;
};

type BankingBudget = {
  id: number;
  category: string;
  month: string;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
};

type CategoryGroup = {
  name: string;
  subcategories: string[];
};

type BankingTransactionsProps = {
  t: Translation;
  token: string;
  portfolio?: Portfolio;
};

const API_BASE = "http://127.0.0.1:8000";
const CUSTOM_INSTITUTION_VALUE = "custom";
const DEFAULT_CATEGORY = "Sem categoria";
const DEFAULT_SUBCATEGORY = "Sem subcategoria";

const mappingOptions = [
  { value: "ignore", label: "Ignore" },
  { value: "date", label: "Date" },
  { value: "description", label: "Description" },
  { value: "amount", label: "Amount" },
  { value: "debit", label: "Debit" },
  { value: "credit", label: "Credit" },
  { value: "balance", label: "Balance" },
  { value: "currency", label: "Currency" }
];

function BankingTransactions({ t, token, portfolio }: BankingTransactionsProps) {
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryGroup[]>([]);
  const [institutionInput, setInstitutionInput] = useState("");
  const [institutionSelect, setInstitutionSelect] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [columnMapping, setColumnMapping] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [transactions, setTransactions] = useState<BankingTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [updatingTxId, setUpdatingTxId] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<BankingBudget[]>([]);
  const [budgetsLoading, setBudgetsLoading] = useState(false);
  const [budgetsError, setBudgetsError] = useState("");
  const [budgetCategory, setBudgetCategory] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetMonth, setBudgetMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const activePortfolio = portfolio;

  const subcategoryOptions = useMemo(() => {
    if (!categoryFilter) {
      return [];
    }
    const entry = categories.find((item) => item.name === categoryFilter);
    if (entry?.subcategories?.length) {
      return entry.subcategories;
    }
    return [categoryFilter];
  }, [categories, categoryFilter]);

  const bankingSummary = useMemo(() => {
    let income = 0;
    let expenses = 0;
    const byCategory: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.amount >= 0) {
        income += tx.amount;
      } else {
        const spend = Math.abs(tx.amount);
        expenses += spend;
        const categoryKey = tx.category || DEFAULT_CATEGORY;
        byCategory[categoryKey] = (byCategory[categoryKey] || 0) + spend;
      }
    });
    const net = income - expenses;
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return {
      income,
      expenses,
      net,
      topCategory: topCategory ? topCategory[0] : "--"
    };
  }, [transactions]);

  const expenseByCategory = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.amount < 0) {
        const key = tx.category || DEFAULT_CATEGORY;
        totals[key] = (totals[key] || 0) + Math.abs(tx.amount);
      }
    });
    return Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions]);

  const monthlyNet = useMemo(() => {
    const totals: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((tx) => {
      const month = tx.tx_date ? tx.tx_date.slice(0, 7) : "Unknown";
      if (!totals[month]) {
        totals[month] = { income: 0, expenses: 0 };
      }
      if (tx.amount >= 0) {
        totals[month].income += tx.amount;
      } else {
        totals[month].expenses += Math.abs(tx.amount);
      }
    });
    return Object.entries(totals)
      .map(([month, entry]) => ({
        month,
        net: entry.income - entry.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  const resolveInstitution = () => {
    if (institutionSelect && institutionSelect !== CUSTOM_INSTITUTION_VALUE) {
      return institutionSelect;
    }
    return institutionInput;
  };

  useEffect(() => {
    if (!institutionInput) {
      return;
    }
    if (institutions.includes(institutionInput)) {
      setInstitutionSelect(institutionInput);
    }
  }, [institutions, institutionInput]);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const loadCategories = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/categories`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setCategories(data.items || []);
      }
    } catch (err) {
      // ignore
    }
  };

  const loadInstitutions = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/institutions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        const names = (data.items || [])
          .map((item: any) => item?.institution || item?.name)
          .filter(Boolean);
        setInstitutions(Array.from(new Set(names)));
      }
    } catch (err) {
      // ignore
    }
  };

  const loadTransactions = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    setTransactionsLoading(true);
    resetFeedback();
    try {
      const params = new URLSearchParams();
      if (monthFilter) {
        params.set("month", monthFilter);
      }
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }
      if (subcategoryFilter) {
        params.set("subcategory", subcategoryFilter);
      }
      if (institutionFilter) {
        params.set("institution", institutionFilter);
      }
      const url = params.toString()
        ? `${API_BASE}/portfolios/${activePortfolio.id}/banking/transactions?${params}`
        : `${API_BASE}/portfolios/${activePortfolio.id}/banking/transactions`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to load transactions.");
      }
      setTransactions(data.items || []);
    } catch (err) {
      setError(t.bankings?.loadError || "Unable to load transactions.");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadBudgets = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    setBudgetsLoading(true);
    setBudgetsError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/budgets?month=${budgetMonth}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to load budgets.");
      }
      setBudgets(data.items || []);
    } catch (err: any) {
      setBudgetsError(err?.message || "Unable to load budgets.");
    } finally {
      setBudgetsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
    loadInstitutions();
  }, [activePortfolio?.id, token]);

  useEffect(() => {
    loadTransactions();
  }, [
    activePortfolio?.id,
    token,
    monthFilter,
    categoryFilter,
    subcategoryFilter,
    institutionFilter
  ]);

  useEffect(() => {
    loadBudgets();
  }, [activePortfolio?.id, token, budgetMonth]);

  const deriveMapping = (mapping: Record<string, number | null>, columns: string[]) => {
    const result = new Array(columns.length).fill("ignore");
    Object.entries(mapping).forEach(([key, value]) => {
      if (value !== null && value >= 0 && value < columns.length) {
        result[value] = key;
      }
    });
    return result;
  };

  const handlePreview = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    if (!file && !pasteText.trim()) {
      setError(t.bankings?.noFile || "Select a file or paste data first.");
      return;
    }
    setPreviewLoading(true);
    resetFeedback();
    try {
      const formData = new FormData();
      if (file) {
        formData.append("file", file);
      }
      if (pasteText.trim()) {
        formData.append("text", pasteText.trim());
      }
      const institutionName = resolveInstitution();
      if (institutionName.trim()) {
        formData.append("institution", institutionName.trim());
      }
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/preview`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );
      const data = (await response.json()) as PreviewPayload;
      if (!response.ok) {
        throw new Error(data?.warnings?.[0] || "Unable to preview file.");
      }
      setPreview(data);
      setColumnMapping(deriveMapping(data.mapping, data.columns));
    } catch (err: any) {
      setError(err?.message || "Unable to preview file.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleMappingChange = (index: number, value: string) => {
    setColumnMapping((current) => {
      const next = [...current];
      if (value !== "ignore") {
        next.forEach((item, idx) => {
          if (idx !== index && item === value) {
            next[idx] = "ignore";
          }
        });
      }
      next[index] = value;
      return next;
    });
  };

  const handleRowToggle = (index: number) => {
    if (!preview) {
      return;
    }
    const nextRows = preview.rows.map((row, idx) =>
      idx === index ? { ...row, include: !row.include } : row
    );
    setPreview({ ...preview, rows: nextRows });
  };

  const buildMappingPayload = () => {
    const mapping: Record<string, number | null> = {
      date: null,
      description: null,
      amount: null,
      balance: null,
      currency: null,
      debit: null,
      credit: null
    };
    columnMapping.forEach((value, index) => {
      if (value !== "ignore") {
        mapping[value] = index;
      }
    });
    return mapping;
  };

  const handleCommit = async () => {
    if (!activePortfolio || !token || !preview) {
      return;
    }
    const institutionName = resolveInstitution();
    if (!institutionName.trim()) {
      setError(t.bankings?.institutionRequired || "Institution is required.");
      return;
    }
    if (
      preview.warnings?.length &&
      preview.rows?.length &&
      preview.warnings.length >= preview.rows.length
    ) {
      setError("No valid rows found. Check the column detection.");
      return;
    }
    setCommitLoading(true);
    resetFeedback();
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            source_file: preview.source_file,
            file_hash: preview.file_hash,
            institution: institutionName.trim(),
            columns: preview.columns,
            mapping: buildMappingPayload(),
            rows: preview.rows
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        const detail = data?.detail || "Unable to import transactions.";
        if (String(detail).toLowerCase().includes("no valid rows")) {
          throw new Error("No valid rows found. Check the column detection.");
        }
        throw new Error(detail);
      }
      setMessage(t.bankings?.importSuccess || "Transactions imported.");
      setPreview(null);
      setFile(null);
      setPasteText("");
      setShowMapping(false);
      setShowWarnings(false);
      await loadInstitutions();
      await loadTransactions();
      await loadBudgets();
    } catch (err: any) {
      setError(err?.message || "Unable to import transactions.");
    } finally {
      setCommitLoading(false);
    }
  };

  const handleClear = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    const confirmMessage =
      t.bankings?.clearConfirm ||
      "Clear all imported banking transactions? This cannot be undone.";
    if (!window.confirm(confirmMessage)) {
      return;
    }
    setClearing(true);
    resetFeedback();
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/clear`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to clear transactions.");
      }
      setMessage(t.bankings?.clearSuccess || "Banking transactions cleared.");
      setPreview(null);
      setFile(null);
      setPasteText("");
      setShowMapping(false);
      setShowWarnings(false);
      await loadInstitutions();
      await loadTransactions();
      await loadBudgets();
    } catch (err: any) {
      setError(err?.message || "Unable to clear transactions.");
    } finally {
      setClearing(false);
    }
  };

  const handleBudgetSave = async () => {
    if (!activePortfolio || !token) {
      return;
    }
    if (!budgetCategory.trim()) {
      setBudgetsError("Category is required.");
      return;
    }
    const amountValue = Number(budgetAmount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setBudgetsError("Amount must be greater than 0.");
      return;
    }
    setBudgetsLoading(true);
    setBudgetsError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/budgets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            category: budgetCategory.trim(),
            amount: amountValue,
            month: budgetMonth
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to save budget.");
      }
      setBudgetAmount("");
      await loadBudgets();
      await loadCategories();
    } catch (err: any) {
      setBudgetsError(err?.message || "Unable to save budget.");
    } finally {
      setBudgetsLoading(false);
    }
  };

  const handleBudgetDelete = async (budgetId: number) => {
    if (!activePortfolio || !token) {
      return;
    }
    if (!window.confirm("Delete this budget?")) {
      return;
    }
    setBudgetsLoading(true);
    setBudgetsError("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/budgets/${budgetId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to delete budget.");
      }
      await loadBudgets();
    } catch (err: any) {
      setBudgetsError(err?.message || "Unable to delete budget.");
    } finally {
      setBudgetsLoading(false);
    }
  };

  const handleUpdateTransactionCategory = async (
    txId: number,
    category: string,
    subcategory: string | null
  ) => {
    if (!activePortfolio || !token) {
      return;
    }
    setUpdatingTxId(txId);
    resetFeedback();
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/banking/transactions/${txId}/category`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            category,
            subcategory: subcategory || null
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Unable to update category.");
      }
      const updated = data.transaction;
      setTransactions((current) =>
        current.map((tx) =>
          tx.id === txId
            ? {
                ...tx,
                category: updated.category,
                subcategory: updated.subcategory
              }
            : tx
        )
      );
      await loadCategories();
      await loadBudgets();
    } catch (err: any) {
      setError(err?.message || "Unable to update category.");
    } finally {
      setUpdatingTxId(null);
    }
  };

  return (
    <div className="banking-page">
      <section className="banking-header">
        <div>
          <h2>{t.bankings?.title || t.nav.transactions}</h2>
          <p>{t.bankings?.subtitle || "Import and classify transactions."}</p>
        </div>
      </section>

      <section className="banking-import-card">
        <div className="banking-import-form">
          <div className="banking-import-block">
            <label>
              <span>{t.bankings?.institution || "Institution"}</span>
              <select
                value={institutionSelect}
                onChange={(event) => {
                  const next = event.target.value;
                  setInstitutionSelect(next);
                  if (next && next !== CUSTOM_INSTITUTION_VALUE) {
                    setInstitutionInput(next);
                  } else if (next === CUSTOM_INSTITUTION_VALUE) {
                    setInstitutionInput("");
                  } else {
                    setInstitutionInput("");
                  }
                }}
              >
                <option value="">{t.bankings?.selectInstitution || "Select..."}</option>
                {institutions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
                <option value={CUSTOM_INSTITUTION_VALUE}>
                  {t.bankings?.customInstitution || "Other..."}
                </option>
              </select>
            </label>
            {institutionSelect === CUSTOM_INSTITUTION_VALUE ? (
              <label>
                <span>{t.bankings?.customInstitutionLabel || "Custom institution"}</span>
                <input
                  type="text"
                  value={institutionInput}
                  onChange={(event) => setInstitutionInput(event.target.value)}
                  placeholder="Type institution..."
                />
              </label>
            ) : null}
            <label>
              <span>{t.bankings?.fileLabel || "Choose file"}</span>
              <input
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div className="banking-import-block">
            <label>
              <span>{t.bankings?.pasteLabel || "Paste data"}</span>
              <textarea
                value={pasteText}
                onChange={(event) => setPasteText(event.target.value)}
                placeholder="Ctrl+V..."
              />
            </label>
          </div>
        </div>
        <div className="banking-actions">
          <button
            className="ghost-btn"
            type="button"
            onClick={handlePreview}
            disabled={previewLoading}
          >
            {previewLoading ? t.bankings?.previewing || "Previewing..." : t.bankings?.preview || "Preview"}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleCommit}
            disabled={commitLoading || !preview}
          >
            {commitLoading ? t.bankings?.importing || "Importing..." : t.bankings?.commit || "Import"}
          </button>
          <button
            className="danger-btn"
            type="button"
            onClick={handleClear}
            disabled={clearing}
          >
            {clearing
              ? t.bankings?.clearing || "Clearing..."
              : t.bankings?.clear || "Clear transactions"}
          </button>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        {message ? <p className="form-success">{message}</p> : null}
      </section>

      {preview ? (
      <section className="banking-preview">
          <header>
            <h3>{t.bankings?.previewTitle || "Preview"}</h3>
            <p>{preview.source_file}</p>
          </header>
          {preview.warnings?.length ? (
            <div className="banking-warnings">
              <p>
                {`Rows: ${preview.rows.length} - Valid: ${
                  preview.rows.length - preview.warnings.length
                } - Skipped: ${preview.warnings.length}`}
              </p>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowWarnings((value) => !value)}
              >
                {showWarnings ? "Hide details" : "Show details"}
              </button>
              {showWarnings ? (
                <div className="banking-warning-list">
                  {preview.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="banking-preview-table">
            <div className="row header">
              <span />
              {preview.columns.map((column, index) => (
                <span key={column || index}>
                  <div>{column || `Column ${index + 1}`}</div>
                  {showMapping ? (
                    <select
                      value={columnMapping[index] || "ignore"}
                      onChange={(event) =>
                        handleMappingChange(index, event.target.value)
                      }
                    >
                      {mappingOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : null}
                </span>
              ))}
            </div>
            <div className="row preview-controls">
              <span />
              <span className="preview-toggle">
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setShowMapping((value) => !value)}
                >
                  {showMapping ? "Hide mapping" : "Edit mapping"}
                </button>
              </span>
            </div>
            {preview.rows.slice(0, 50).map((row, rowIndex) => (
              <div className="row" key={`${rowIndex}`}>
                <span>
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={() => handleRowToggle(rowIndex)}
                  />
                </span>
                {row.cells.map((cell, cellIndex) => (
                  <span key={`${rowIndex}-${cellIndex}`}>
                    {cell === null || cell === undefined ? "" : String(cell)}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="banking-summary">
        <div className="banking-summary-card">
          <span>{t.bankings?.summary?.income || "Income"}</span>
          <strong>
            {(activePortfolio?.currency || "EUR")} {bankingSummary.income.toFixed(2)}
          </strong>
        </div>
        <div className="banking-summary-card">
          <span>{t.bankings?.summary?.expenses || "Expenses"}</span>
          <strong>
            {(activePortfolio?.currency || "EUR")} {bankingSummary.expenses.toFixed(2)}
          </strong>
        </div>
        <div className="banking-summary-card">
          <span>{t.bankings?.summary?.net || "Net"}</span>
          <strong>
            {(activePortfolio?.currency || "EUR")} {bankingSummary.net.toFixed(2)}
          </strong>
        </div>
        <div className="banking-summary-card">
          <span>{t.bankings?.summary?.topCategory || "Top category"}</span>
          <strong>{bankingSummary.topCategory}</strong>
        </div>
      </section>

      <section className="charts-grid">
        <article className="chart-card">
          <header>
            <h3>
              {t.bankings?.charts?.spendByCategory || "Spending by category"}
            </h3>
            <span className="chart-sub">
              {t.bankings?.charts?.spendSubtitle || "Based on expenses only"}
            </span>
          </header>
          {expenseByCategory.length ? (
            <div className="bar-chart">
              {expenseByCategory.map((item) => {
                const maxValue =
                  expenseByCategory[0]?.value || item.value || 1;
                const width = Math.max(
                  6,
                  Math.round((item.value / maxValue) * 100)
                );
                return (
                  <div className="bar-row" key={item.label}>
                    <span>{item.label}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${width}%`,
                          background: "#2ad68d"
                        }}
                      />
                    </div>
                    <span className="bar-value">
                      {(activePortfolio?.currency || "EUR")} {item.value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="chart-sub">
              {t.bankings?.charts?.empty || "No chart data yet."}
            </p>
          )}
        </article>
        <article className="chart-card">
          <header>
            <h3>{t.bankings?.charts?.monthlyNet || "Monthly net"}</h3>
            <span className="chart-sub">
              {t.bankings?.charts?.monthlySubtitle || "Income minus expenses"}
            </span>
          </header>
          {monthlyNet.length ? (
            <div className="bar-chart">
              {monthlyNet.map((item) => {
                const maxValue = Math.max(
                  ...monthlyNet.map((entry) => Math.abs(entry.net)),
                  1
                );
                const width = Math.max(
                  6,
                  Math.round((Math.abs(item.net) / maxValue) * 100)
                );
                return (
                  <div className="bar-row" key={item.month}>
                    <span>{item.month}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${width}%`,
                          background: item.net >= 0 ? "#2ad68d" : "#ff9c9c"
                        }}
                      />
                    </div>
                    <span className="bar-value">
                      {(activePortfolio?.currency || "EUR")} {item.net.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="chart-sub">
              {t.bankings?.charts?.empty || "No chart data yet."}
            </p>
          )}
        </article>
      </section>

      <section className="banking-budgets">
        <div className="banking-budgets-header">
          <h3>{t.bankings?.budgets?.title || "Budgets"}</h3>
          <span className="chart-sub">
            {t.bankings?.budgets?.subtitle || "Set monthly limits per category."}
          </span>
        </div>
        <div className="banking-budget-form">
          <label>
            <span>{t.bankings?.budgets?.month || "Month"}</span>
            <input
              type="month"
              value={budgetMonth}
              onChange={(event) => setBudgetMonth(event.target.value)}
            />
          </label>
          <label>
            <span>{t.bankings?.budgets?.category || "Category"}</span>
            <input
              type="text"
              value={budgetCategory}
              list="banking-category-list"
              onChange={(event) => setBudgetCategory(event.target.value)}
              placeholder={t.bankings?.budgets?.categoryPlaceholder || "Select..."}
            />
            <datalist id="banking-category-list">
              {categories.map((item) => (
                <option key={item.name} value={item.name} />
              ))}
            </datalist>
          </label>
          <label>
            <span>{t.bankings?.budgets?.amount || "Amount"}</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budgetAmount}
              onChange={(event) => setBudgetAmount(event.target.value)}
              placeholder="0.00"
            />
          </label>
          <button
            className="primary-btn"
            type="button"
            onClick={handleBudgetSave}
            disabled={budgetsLoading}
          >
            {t.bankings?.budgets?.save || "Save budget"}
          </button>
        </div>
        {budgetsError ? <p className="chart-sub">{budgetsError}</p> : null}
        {budgetsLoading ? (
          <p className="chart-sub">{t.bankings?.loading || "Loading..."}</p>
        ) : budgets.length ? (
          <div className="banking-budget-list">
            {budgets.map((budget) => {
              const percentValue = Number.isFinite(budget.percent)
                ? budget.percent
                : 0;
              const percent = Math.min(100, percentValue);
              const statusClass =
                percentValue >= 100
                  ? "danger"
                  : percentValue >= 90
                  ? "warn"
                  : percentValue >= 70
                  ? "caution"
                  : "ok";
              return (
                <div className="banking-budget-row" key={budget.id}>
                  <div>
                    <strong>{budget.category}</strong>
                    <span className="chart-sub">
                      {t.bankings?.budgets?.spent || "Spent"}:{" "}
                      {(activePortfolio?.currency || "EUR")}{" "}
                      {budget.spent.toFixed(2)}
                    </span>
                    <span className="chart-sub">
                      {t.bankings?.budgets?.remaining || "Remaining"}:{" "}
                      {(activePortfolio?.currency || "EUR")}{" "}
                      {budget.remaining.toFixed(2)}
                    </span>
                  </div>
                  <div className="banking-budget-progress">
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${statusClass}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="chart-sub">
                      {percentValue.toFixed(2)}% -{" "}
                      {(activePortfolio?.currency || "EUR")}{" "}
                      {budget.amount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="danger-btn"
                    type="button"
                    onClick={() => handleBudgetDelete(budget.id)}
                  >
                    {t.bankings?.budgets?.delete || "Delete"}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="chart-sub">{t.bankings?.budgets?.empty || "No budgets yet."}</p>
        )}
      </section>

      <section className="banking-transactions">
        <div className="banking-filters">
          <label>
            <span>{t.bankings?.filters?.month || "Month"}</span>
            <input
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            />
          </label>
          <label>
            <span>{t.bankings?.filters?.category || "Category"}</span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setSubcategoryFilter("");
              }}
            >
              <option value="">{t.bankings?.filters?.all || "All"}</option>
              {categories.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.bankings?.filters?.subcategory || "Subcategory"}</span>
            <select
              value={subcategoryFilter}
              onChange={(event) => setSubcategoryFilter(event.target.value)}
              disabled={!subcategoryOptions.length}
            >
              <option value="">{t.bankings?.filters?.all || "All"}</option>
              {subcategoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{t.bankings?.filters?.institution || "Institution"}</span>
            <select
              value={institutionFilter}
              onChange={(event) => setInstitutionFilter(event.target.value)}
            >
              <option value="">{t.bankings?.filters?.all || "All"}</option>
              {institutions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="banking-table">
          <div className="row header">
            <span>{t.bankings?.columns?.date || "Date"}</span>
            <span>{t.bankings?.columns?.description || "Description"}</span>
            <span>{t.bankings?.columns?.amount || "Amount"}</span>
            <span>{t.bankings?.columns?.balance || "Balance"}</span>
            <span>{t.bankings?.columns?.category || "Category"}</span>
            <span>{t.bankings?.columns?.institution || "Institution"}</span>
          </div>
          {transactionsLoading ? (
            <p className="empty">{t.bankings?.loading || "Loading..."}</p>
          ) : transactions.length === 0 ? (
            <p className="empty">{t.bankings?.empty || "No transactions yet."}</p>
          ) : (
            transactions.map((tx) => {
              const categoryEntry = categories.find(
                (item) => item.name === tx.category
              );
              const normalizedSubcategory =
                tx.subcategory === DEFAULT_SUBCATEGORY ? "" : tx.subcategory;
              const rowSubcategories = categoryEntry?.subcategories?.length
                ? categoryEntry.subcategories
                : [categoryEntry?.name || tx.category || DEFAULT_CATEGORY];
              const rowSubcategoryOptions =
                normalizedSubcategory &&
                !rowSubcategories.includes(normalizedSubcategory)
                  ? [normalizedSubcategory, ...rowSubcategories]
                  : rowSubcategories;
              const rowGroups = categories.some((item) => item.name === tx.category)
                ? categories
                : [
                    {
                      name: tx.category,
                      subcategories: rowSubcategoryOptions
                    },
                    ...categories
                  ];
              const selectedValue = `${tx.category || DEFAULT_CATEGORY}|||${
                normalizedSubcategory || rowSubcategoryOptions[0]
              }`;
              const isUpdating = updatingTxId === tx.id;
              return (
                <div className="row" key={tx.id}>
                  <span>{tx.tx_date}</span>
                  <span>{tx.description}</span>
                  <span className={tx.amount < 0 ? "neg" : "pos"}>
                    {tx.currency} {tx.amount.toFixed(2)}
                  </span>
                  <span>
                    {tx.balance !== null
                      ? `${tx.currency} ${tx.balance.toFixed(2)}`
                      : "--"}
                  </span>
                  <span className="banking-category-cell">
                    <select
                      value={selectedValue}
                      onChange={(event) => {
                        if (isUpdating) {
                          return;
                        }
                        const [nextCategory, nextSubcategory] =
                          event.target.value.split("|||");
                        handleUpdateTransactionCategory(
                          tx.id,
                          nextCategory,
                          nextSubcategory || DEFAULT_SUBCATEGORY
                        );
                      }}
                      disabled={isUpdating}
                    >
                      {rowGroups.map((group) => (
                        <optgroup key={group.name} label={group.name}>
                          {(group.subcategories?.length
                            ? group.subcategories
                            : [group.name]
                          ).map((sub) => (
                            <option
                              key={`${group.name}-${sub}`}
                              value={`${group.name}|||${sub}`}
                            >
                              {sub}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </span>
                  <span>{tx.institution}</span>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

export default BankingTransactions;
