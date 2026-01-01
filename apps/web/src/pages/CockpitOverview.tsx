import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
};

type InstitutionRow = {
  institution: string;
  total: number;
  gains: number | null;
  vs_last_month?: number | null;
  profit_percent?: number | null;
};

type BudgetRow = {
  id: number;
  category: string;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
};

type DebtRow = {
  id: number;
  name: string;
  current_balance: number;
  monthly_payment: number;
  percent_paid: number;
};

type CockpitProps = {
  t: Translation;
  token: string;
  portfolio?: Portfolio | null;
};

const API_BASE = "http://127.0.0.1:8000";

function CockpitOverview({ t, token, portfolio }: CockpitProps) {
  const [summary, setSummary] = useState<{
    total: number;
    total_invested: number;
    total_profit: number;
    profit_percent: number;
  } | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [historyMonthly, setHistoryMonthly] = useState<
    { month: string; total: number }[]
  >([]);
  const [historyError, setHistoryError] = useState("");
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [institutionsError, setInstitutionsError] = useState("");
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [budgetsError, setBudgetsError] = useState("");
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [debtsError, setDebtsError] = useState("");

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
  const formatSignedCurrency = (value: number) => {
    const sign = value < 0 ? "-" : "+";
    return `${sign}${formatCurrency(Math.abs(value))}`;
  };
  const formatSignedPercent = (value: number) => {
    const sign = value < 0 ? "-" : "+";
    return `${sign}${Math.abs(value).toFixed(1)}%`;
  };

  useEffect(() => {
    if (!portfolio || !token) {
      setSummary(null);
      setHistoryMonthly([]);
      setInstitutions([]);
      setBudgets([]);
      setDebts([]);
      return;
    }
    let active = true;
    setSummaryError("");
    setHistoryError("");
    setInstitutionsError("");
    setBudgetsError("");
    setDebtsError("");

    const fetchJson = (path: string) =>
      fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));

    fetchJson(`/portfolios/${portfolio.id}/summary`)
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error("summary");
        }
        setSummary({
          total: Number(data.total) || 0,
          total_invested: Number(data.total_invested) || 0,
          total_profit: Number(data.total_profit) || 0,
          profit_percent: Number(data.profit_percent) || 0
        });
      })
      .catch(() => {
        if (active) {
          setSummaryError(t.portfolio.loadError);
        }
      });

    fetchJson(`/portfolios/${portfolio.id}/history/monthly`)
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error("history");
        }
        const items = (data.items || []).map((item: any) => ({
          month: item.month,
          total: Number(item.total) || 0
        }));
        setHistoryMonthly(items);
      })
      .catch(() => {
        if (active) {
          setHistoryError(t.charts.noHistory);
        }
      });

    fetchJson(`/portfolios/${portfolio.id}/institutions`)
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error("institutions");
        }
        const items = (data.items || []).map((item: InstitutionRow) => ({
          institution: item.institution,
          total: Number(item.total) || 0,
          gains:
            item.gains === null || item.gains === undefined
              ? null
              : Number(item.gains) || 0,
          vs_last_month:
            item.vs_last_month === null || item.vs_last_month === undefined
              ? null
              : Number(item.vs_last_month) || 0,
          profit_percent:
            item.profit_percent === null || item.profit_percent === undefined
              ? null
              : Number(item.profit_percent) || 0
        }));
        setInstitutions(items);
      })
      .catch(() => {
        if (active) {
          setInstitutionsError(t.breakdown.noData);
        }
      });

    const currentMonth = new Date().toISOString().slice(0, 7);
    fetchJson(`/portfolios/${portfolio.id}/banking/budgets?month=${currentMonth}`)
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error("budgets");
        }
        const items = (data.items || []).map((item: any) => ({
          id: item.id,
          category: item.category,
          amount: Number(item.amount) || 0,
          spent: Number(item.spent) || 0,
          remaining: Number(item.remaining) || 0,
          percent: Number(item.percent) || 0
        }));
        setBudgets(items);
      })
      .catch(() => {
        if (active) {
          setBudgetsError(t.bankings?.budgets?.empty || "No budgets yet.");
        }
      });

    fetchJson(`/debts`)
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error("debts");
        }
        const items = (data.items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          current_balance: Number(item.current_balance) || 0,
          monthly_payment: Number(item.monthly_payment) || 0,
          percent_paid: Number(item.percent_paid) || 0
        }));
        setDebts(items);
      })
      .catch(() => {
        if (active) {
          setDebtsError(t.debts.loadError);
        }
      });

    return () => {
      active = false;
    };
  }, [portfolio?.id, t, token]);

  const debtTotals = useMemo(() => {
    const totalBalance = debts.reduce(
      (sum, item) => sum + (Number(item.current_balance) || 0),
      0
    );
    const totalMonthly = debts.reduce(
      (sum, item) => sum + (Number(item.monthly_payment) || 0),
      0
    );
    const avgPercent =
      debts.length > 0
        ? debts.reduce((sum, item) => sum + (Number(item.percent_paid) || 0), 0) /
          debts.length
        : 0;
    return { totalBalance, totalMonthly, avgPercent };
  }, [debts]);

  const historySeries = useMemo(() => {
    return [...historyMonthly].sort((a, b) => a.month.localeCompare(b.month));
  }, [historyMonthly]);
  const historyRange = useMemo(() => {
    if (!historySeries.length) {
      return { min: 0, max: 0 };
    }
    const totals = historySeries.map((item) => item.total);
    return { min: Math.min(...totals), max: Math.max(...totals) };
  }, [historySeries]);
  const historyPath = useMemo(() => {
    if (historySeries.length < 2) {
      return "";
    }
    const width = 340;
    const height = 120;
    const padding = 12;
    const range = historyRange.max - historyRange.min || 1;
    const step = width / (historySeries.length - 1);
    return historySeries
      .map((item, index) => {
        const x = padding + index * step;
        const y = padding + (height - ((item.total - historyRange.min) / range) * height);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [historyRange.max, historyRange.min, historySeries]);
  const historyAreaPath = useMemo(() => {
    if (historySeries.length < 2) {
      return "";
    }
    const width = 340;
    const height = 120;
    const padding = 12;
    const range = historyRange.max - historyRange.min || 1;
    const step = width / (historySeries.length - 1);
    const points = historySeries.map((item, index) => {
      const x = padding + index * step;
      const y = padding + (height - ((item.total - historyRange.min) / range) * height);
      return { x, y };
    });
    const topPath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const bottomY = padding + height;
    return `${topPath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [historyRange.max, historyRange.min, historySeries]);

  const performanceDelta = useMemo(() => {
    if (historySeries.length < 2) {
      return { value: 0, percent: 0 };
    }
    const first = historySeries[0];
    const last = historySeries[historySeries.length - 1];
    const delta = last.total - first.total;
    const percent = first.total ? (delta / first.total) * 100 : 0;
    return { value: delta, percent };
  }, [historySeries]);

  const topInstitutions = useMemo(() => {
    return [...institutions]
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [institutions]);

  const budgetTotals = useMemo(() => {
    const total = budgets.reduce((sum, item) => sum + item.amount, 0);
    const spent = budgets.reduce((sum, item) => sum + item.spent, 0);
    const remaining = budgets.reduce((sum, item) => sum + item.remaining, 0);
    const percent = total ? (spent / total) * 100 : 0;
    return { total, spent, remaining, percent };
  }, [budgets]);

  if (!portfolio) {
    return (
      <div className="empty-state">
        <h3>{t.portfolio.emptyTitle}</h3>
        <p>{t.cockpit.empty}</p>
      </div>
    );
  }

  return (
    <div className="cockpit-page">
      <header className="cockpit-header">
        <div>
          <h2>{t.cockpit.title}</h2>
          <p>{t.cockpit.subtitle}</p>
        </div>
        <div className="cockpit-header-meta">
          <span className="tag">{portfolio.name}</span>
          <span className="tag">{portfolio.currency}</span>
        </div>
      </header>

      <section className="cockpit-grid">
        <article className="cockpit-card cockpit-performance">
          <header>
            <div>
              <p className="cockpit-kicker">{t.cockpit.performanceTitle}</p>
              <h3>{formatCurrency(summary?.total || 0)}</h3>
              <p className="cockpit-sub">
                {t.cockpit.performanceValue}
              </p>
            </div>
            <div className="cockpit-delta">
              <span>{t.cockpit.performanceDelta}</span>
              <strong className={performanceDelta.value >= 0 ? "pos" : "neg"}>
                {formatSignedCurrency(performanceDelta.value)}
              </strong>
              <span className={performanceDelta.value >= 0 ? "pos" : "neg"}>
                {formatSignedPercent(performanceDelta.percent)}
              </span>
            </div>
          </header>
          {summaryError ? <p className="login-error">{summaryError}</p> : null}
          {historyError ? <p className="login-error">{historyError}</p> : null}
          {historySeries.length > 1 ? (
            <svg className="cockpit-chart" viewBox="0 0 360 150" preserveAspectRatio="none">
              <path className="chart-area" d={historyAreaPath} />
              <path
                className="chart-line-path"
                d={historyPath}
                stroke="#2ad68d"
                strokeWidth="3"
                fill="none"
              />
            </svg>
          ) : (
            <p className="chart-sub">{t.charts.noHistory}</p>
          )}
          <span className="chart-sub">{t.cockpit.performanceTrend}</span>
        </article>

        <article className="cockpit-card cockpit-subportfolios">
          <header>
            <h3>{t.cockpit.subPortfoliosTitle}</h3>
          </header>
          {institutionsError ? <p className="chart-sub">{institutionsError}</p> : null}
          {topInstitutions.length ? (
            <div className="cockpit-list">
              {topInstitutions.map((item) => {
                const change = item.vs_last_month ?? item.gains ?? 0;
                const changePercent = item.profit_percent ?? 0;
                return (
                  <div className="cockpit-list-row" key={item.institution}>
                    <div>
                      <strong>{item.institution}</strong>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                    <div className="cockpit-list-metric">
                      <span className={change >= 0 ? "pos" : "neg"}>
                        {formatSignedCurrency(change)}
                      </span>
                      <span className={changePercent >= 0 ? "pos" : "neg"}>
                        {formatSignedPercent(changePercent)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="chart-sub">{t.cockpit.subPortfoliosEmpty}</p>
          )}
        </article>

        <article className="cockpit-card cockpit-summary">
          <header>
            <h3>{t.summary.totalProfit}</h3>
          </header>
          <div className="cockpit-metric">
            <span>{t.summary.value}</span>
            <strong>{formatCurrency(summary?.total || 0)}</strong>
          </div>
          <div className="cockpit-metric">
            <span>{t.summary.totalProfit}</span>
            <strong className={(summary?.total_profit || 0) >= 0 ? "pos" : "neg"}>
              {formatSignedCurrency(summary?.total_profit || 0)}
            </strong>
          </div>
          <div className="cockpit-metric">
            <span>{t.summary.investedLabel}</span>
            <strong>{formatCurrency(summary?.total_invested || 0)}</strong>
          </div>
        </article>

        <article className="cockpit-card cockpit-budget">
          <header>
            <h3>{t.cockpit.budgetTitle}</h3>
            <span className="chart-sub">{t.cockpit.budgetStatus}</span>
          </header>
          {budgets.length ? (
            <>
              <div className="cockpit-metric">
                <span>{t.cockpit.budgetSpent}</span>
                <strong>{formatCurrency(budgetTotals.spent)}</strong>
              </div>
              <div className="cockpit-metric">
                <span>{t.cockpit.budgetRemaining}</span>
                <strong>{formatCurrency(budgetTotals.remaining)}</strong>
              </div>
              <div className="cockpit-progress">
                <div className="bar-track">
                  <div
                    className={`bar-fill ${
                      budgetTotals.percent >= 100
                        ? "danger"
                        : budgetTotals.percent >= 90
                        ? "warn"
                        : budgetTotals.percent >= 70
                        ? "caution"
                        : "ok"
                    }`}
                    style={{ width: `${Math.min(100, budgetTotals.percent)}%` }}
                  />
                </div>
                <span className="chart-sub">
                  {budgetTotals.percent.toFixed(1)}% - {formatCurrency(budgetTotals.total)}
                </span>
              </div>
            </>
          ) : (
            <p className="chart-sub">{budgetsError || t.cockpit.budgetEmpty}</p>
          )}
        </article>

        <article className="cockpit-card cockpit-realestate">
          <header>
            <h3>{t.cockpit.realEstateTitle}</h3>
            <span className="chart-sub">{t.cockpit.realEstateSubtitle}</span>
          </header>
          <p className="chart-sub">{t.cockpit.realEstateEmpty}</p>
          <strong>{formatCurrency(0)}</strong>
        </article>

        <article className="cockpit-card cockpit-debt">
          <header>
            <h3>{t.cockpit.debtTitle}</h3>
          </header>
          {debts.length ? (
            <div className="cockpit-list">
              <div className="cockpit-list-row">
                <div>
                  <strong>{t.debts.table.balance}</strong>
                  <span>{formatCurrency(debtTotals.totalBalance)}</span>
                </div>
                <div>
                  <strong>{t.debts.table.monthly}</strong>
                  <span>{formatCurrency(debtTotals.totalMonthly)}</span>
                </div>
              </div>
              <div className="cockpit-list-row">
                <div>
                  <strong>{t.debts.percentPaid}</strong>
                  <span>{debtTotals.avgPercent.toFixed(1)}%</span>
                </div>
                <div>
                  <strong>{t.debts.table.debt}</strong>
                  <span>{debts.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="chart-sub">{debtsError || t.cockpit.debtEmpty}</p>
          )}
        </article>

        <article className="cockpit-card cockpit-fire">
          <header>
            <h3>{t.cockpit.fireTitle}</h3>
            <span className="chart-sub">{t.cockpit.fireSubtitle}</span>
          </header>
          <p className="chart-sub">{t.cockpit.fireEmpty}</p>
          <div className="cockpit-progress">
            <div className="bar-track">
              <div className="bar-fill ok" style={{ width: "12%" }} />
            </div>
            <span className="chart-sub">12% - 16 years</span>
          </div>
        </article>
      </section>
    </div>
  );
}

export default CockpitOverview;
