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
    { month: string; total: number; invested?: number; profit?: number }[]
  >([]);
  const [historyError, setHistoryError] = useState("");
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    month: string;
    total: number;
    invested?: number;
    profit?: number;
  } | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionRow[]>([]);
  const [institutionsError, setInstitutionsError] = useState("");
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [budgetsError, setBudgetsError] = useState("");
  const [debts, setDebts] = useState<DebtRow[]>([]);
  const [debtsError, setDebtsError] = useState("");
  const [fireMetrics, setFireMetrics] = useState<{
    years_elapsed: number;
    years_remaining: number;
    coast_years?: number | null;
    coast_status?: string | null;
    fire_years?: number | null;
    fire_status?: string | null;
  } | null>(null);
  const [fireError, setFireError] = useState("");

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
    setFireError("");

    const fetchJson = (path: string) =>
      fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }).then((response) => response.json().then((data) => ({ ok: response.ok, data })));

    // Use aggregated endpoint if portfolio ID is -1
    const summaryPath = portfolio.id === -1 
      ? `/portfolios/aggregated/summary`
      : `/portfolios/${portfolio.id}/summary`;
    
    fetchJson(summaryPath)
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

    // Skip history for aggregated portfolio (ID -1)
    if (portfolio.id !== -1) {
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
    } else {
      // For aggregated portfolio, load snapshots instead of monthly history
      fetchJson(`/portfolios/aggregated/snapshots`)
        .then(({ ok, data }) => {
          if (!active) {
            return;
          }
          if (!ok) {
            throw new Error("snapshots");
          }
          // Convert snapshots to monthly history format with all data
          const items = (data.items || []).map((item: any) => {
            return {
              month: item.snapshot_date, // Use full date for snapshots
              total: Number(item.total_value) || 0,
              invested: Number(item.total_invested) || 0,
              profit: Number(item.total_profit) || 0
            };
          });
          // Sort by date
          items.sort((a: any, b: any) => a.month.localeCompare(b.month));
          setHistoryMonthly(items);
        })
        .catch(() => {
          if (active) {
            setHistoryError(t.charts.noHistory);
          }
        });
    }

    // Skip institutions for aggregated portfolio (ID -1)
    if (portfolio.id !== -1) {
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
    } else {
      // For aggregated portfolio, clear institutions
      setInstitutions([]);
    }

    // Skip banking budgets for aggregated portfolio (ID -1)
    if (portfolio.id !== -1) {
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
    } else {
      // For aggregated portfolio, clear budgets
      setBudgets([]);
    }

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

    fetchJson(`/goals`)
      .then(({ ok, data }) => {
        if (!active) {
          return;
        }
        if (!ok) {
          throw new Error("goals");
        }
        const goals = data.items || [];
        const defaultGoal = goals.find((item: any) => item.is_default) || goals[0];
        if (!defaultGoal) {
          throw new Error("no-goal");
        }
        return fetchJson(
          `/goals/${defaultGoal.id}?portfolio_id=${portfolio.id}`
        );
      })
      .then((result) => {
        if (!active || !result) {
          return;
        }
        if (!result.ok) {
          throw new Error("goal");
        }
        const metrics =
          result.data?.portfolio_fire?.metrics ||
          result.data?.simulation_fire?.metrics ||
          null;
        if (!metrics) {
          throw new Error("no-metrics");
        }
        setFireMetrics({
          years_elapsed: Number(metrics.years_elapsed) || 0,
          years_remaining: Number(metrics.years_remaining) || 0,
          coast_years:
            metrics.coast_years === null || metrics.coast_years === undefined
              ? null
              : Number(metrics.coast_years) || 0,
          coast_status: metrics.coast_status ?? null,
          fire_years:
            metrics.fire_years === null || metrics.fire_years === undefined
              ? null
              : Number(metrics.fire_years) || 0,
          fire_status: metrics.fire_status ?? null
        });
      })
      .catch(() => {
        if (active) {
          setFireError(t.cockpit.fireEmpty);
          setFireMetrics(null);
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
  const primaryDebt = useMemo(() => {
    if (!debts.length) {
      return null;
    }
    return [...debts].sort((a, b) => b.current_balance - a.current_balance)[0];
  }, [debts]);

  const historySeries = useMemo(() => {
    return [...historyMonthly].sort((a, b) => a.month.localeCompare(b.month));
  }, [historyMonthly]);
  const chartSeries = useMemo(() => {
    if (historySeries.length) {
      return historySeries;
    }
    if (summary) {
      return [
        { month: "start", total: summary.total },
        { month: "current", total: summary.total }
      ];
    }
    return [];
  }, [historySeries, summary]);
  const historyRange = useMemo(() => {
    if (!chartSeries.length) {
      return { min: 0, max: 0 };
    }
    const totals = chartSeries.map((item) => item.total);
    return { min: Math.min(...totals), max: Math.max(...totals) };
  }, [chartSeries]);
  const historyPath = useMemo(() => {
    if (chartSeries.length < 2) {
      return "";
    }
    const width = 340;
    const height = 120;
    const padding = 12;
    const range = historyRange.max - historyRange.min || 1;
    const step = width / (chartSeries.length - 1);
    return chartSeries
      .map((item, index) => {
        const x = padding + index * step;
        const y = padding + (height - ((item.total - historyRange.min) / range) * height);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartSeries, historyRange.max, historyRange.min]);
  const historyAreaPath = useMemo(() => {
    if (chartSeries.length < 2) {
      return "";
    }
    const width = 340;
    const height = 120;
    const padding = 12;
    const range = historyRange.max - historyRange.min || 1;
    const step = width / (chartSeries.length - 1);
    const points = chartSeries.map((item, index) => {
      const x = padding + index * step;
      const y = padding + (height - ((item.total - historyRange.min) / range) * height);
      return { x, y };
    });
    const topPath = points
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
    const bottomY = padding + height;
    return `${topPath} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;
  }, [chartSeries, historyRange.max, historyRange.min]);

  const investedPath = useMemo(() => {
    if (chartSeries.length < 2 || !chartSeries[0].invested) {
      return "";
    }
    const width = 340;
    const height = 120;
    const padding = 12;
    const range = historyRange.max - historyRange.min || 1;
    const step = width / (chartSeries.length - 1);
    return chartSeries
      .map((item, index) => {
        const x = padding + index * step;
        const invested = item.invested || 0;
        const y = padding + (height - ((invested - historyRange.min) / range) * height);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartSeries, historyRange.max, historyRange.min]);

  const profitPath = useMemo(() => {
    if (chartSeries.length < 2 || !chartSeries[0].profit) {
      return "";
    }
    const width = 340;
    const height = 120;
    const padding = 12;
    const range = historyRange.max - historyRange.min || 1;
    const step = width / (chartSeries.length - 1);
    return chartSeries
      .map((item, index) => {
        const x = padding + index * step;
        const profit = item.profit || 0;
        const y = padding + (height - ((profit - historyRange.min) / range) * height);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [chartSeries, historyRange.max, historyRange.min]);

  const performanceDelta = useMemo(() => {
    if (chartSeries.length < 2) {
      return { value: 0, percent: 0 };
    }
    const first = chartSeries[0];
    const last = chartSeries[chartSeries.length - 1];
    const delta = last.total - first.total;
    const percent = first.total ? (delta / first.total) * 100 : 0;
    return { value: delta, percent };
  }, [chartSeries]);

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

  const fireProgress = useMemo(() => {
    if (!fireMetrics) {
      return null;
    }
    const totalYears = fireMetrics.years_elapsed + fireMetrics.years_remaining;
    if (!totalYears) {
      return null;
    }
    const coastYears =
      fireMetrics.coast_status === "achieved"
        ? fireMetrics.years_elapsed
        : typeof fireMetrics.coast_years === "number"
        ? fireMetrics.coast_years
        : null;
    const fireYears =
      fireMetrics.fire_status === "ok" && typeof fireMetrics.fire_years === "number"
        ? fireMetrics.fire_years
        : null;
    const coastPercent =
      coastYears !== null ? Math.min(100, Math.max(0, (coastYears / totalYears) * 100)) : 0;
    const firePercent =
      fireYears !== null ? Math.min(100, Math.max(0, (fireYears / totalYears) * 100)) : 0;
    return {
      totalYears,
      coastYears,
      fireYears,
      coastPercent,
      firePercent,
      fireStatus: fireMetrics.fire_status,
      coastStatus: fireMetrics.coast_status
    };
  }, [fireMetrics]);

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
          {historyPath ? (
            <div style={{ position: "relative" }}>
              <svg 
                className="cockpit-chart" 
                viewBox="0 0 360 170" 
                preserveAspectRatio="none"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width) * 360;
                  const index = Math.round((x - 12) / (340 / (chartSeries.length - 1)));
                  if (index >= 0 && index < chartSeries.length) {
                    const item = chartSeries[index];
                    setTooltipData({
                      x: e.clientX - rect.left,
                      y: e.clientY - rect.top,
                      month: item.month,
                      total: item.total,
                      invested: item.invested,
                      profit: item.profit
                    });
                  }
                }}
                onMouseLeave={() => setTooltipData(null)}
              >
                <path className="chart-area" d={historyAreaPath} />
                <path
                  className="chart-line-path"
                  d={historyPath}
                  stroke="#2ad68d"
                  strokeWidth="3"
                  fill="none"
                />
                {investedPath && (
                  <path
                    className="chart-line-path"
                    d={investedPath}
                    stroke="#4dabf7"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                )}
                {profitPath && (
                  <path
                    className="chart-line-path"
                    d={profitPath}
                    stroke="#ffd43b"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="3,3"
                  />
                )}
                
                {/* Eixo Y - valores */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const value = historyRange.min + (historyRange.max - historyRange.min) * ratio;
                  const y = 132 - ratio * 120;
                  return (
                    <g key={ratio}>
                      <line x1="8" y1={y} x2="12" y2={y} stroke="#666" strokeWidth="1" />
                      <text x="6" y={y + 3} fontSize="8" fill="#999" textAnchor="end">
                        {Math.round(value / 1000)}k€
                      </text>
                    </g>
                  );
                })}
                
                {/* Eixo X - datas */}
                {chartSeries.map((item, index) => {
                  if (chartSeries.length > 12 && index % 3 !== 0) return null;
                  const x = 12 + index * (340 / (chartSeries.length - 1));
                  const label = item.month.includes('-') 
                    ? item.month.split('-').slice(1).reverse().join('/') 
                    : item.month.substring(5).replace('-', '/');
                  return (
                    <g key={index}>
                      <line x1={x} y1="132" x2={x} y2="136" stroke="#666" strokeWidth="1" />
                      <text x={x} y="145" fontSize="8" fill="#999" textAnchor="middle">
                        {label}
                      </text>
                    </g>
                  );
                })}
              </svg>
              {tooltipData && (
                <div
                  style={{
                    position: "absolute",
                    left: tooltipData.x + 10,
                    top: tooltipData.y - 10,
                    background: "rgba(0, 0, 0, 0.9)",
                    color: "white",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    pointerEvents: "none",
                    zIndex: 1000,
                    whiteSpace: "nowrap"
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{tooltipData.month}</div>
                  <div style={{ color: "#2ad68d" }}>Total: {formatCurrency(tooltipData.total)}</div>
                  {tooltipData.invested !== undefined && (
                    <div style={{ color: "#4dabf7" }}>Invested: {formatCurrency(tooltipData.invested)}</div>
                  )}
                  {tooltipData.profit !== undefined && (
                    <div style={{ color: "#ffd43b" }}>Profit: {formatCurrency(tooltipData.profit)}</div>
                  )}
                </div>
              )}
            </div>
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
          <div className="cockpit-income-box">
            <span className="chart-sub">{t.cockpit.realEstateSubtitle}</span>
            <strong>{formatCurrency(0)}</strong>
          </div>
          <div className="cockpit-list">
            <div className="cockpit-list-row">
              <div className="cockpit-item-title">
                <span className="cockpit-icon rental-icon" aria-hidden />
                <div>
                  <strong>Rental Properties</strong>
                  <span>0 units</span>
                </div>
              </div>
              <div className="cockpit-list-metric">
                <span className="pos">{formatCurrency(0)}</span>
              </div>
            </div>
            <div className="cockpit-list-row">
              <div className="cockpit-item-title">
                <span className="cockpit-icon reit-icon" aria-hidden />
                <div>
                  <strong>REITs</strong>
                  <span>0 holdings</span>
                </div>
              </div>
              <div className="cockpit-list-metric">
                <span className="pos">{formatCurrency(0)}</span>
              </div>
            </div>
          </div>
          <p className="chart-sub">{t.cockpit.realEstateEmpty}</p>
        </article>

        <article className="cockpit-card cockpit-debt">
          <header>
            <h3>{t.cockpit.debtTitle}</h3>
          </header>
          {debts.length && primaryDebt ? (
            <div className="cockpit-debt-card">
              <div className="debt-header">
                <div>
                  <strong>{primaryDebt.name}</strong>
                  <span className="chart-sub">{t.debts.table.debt}</span>
                </div>
              </div>
              <div className="debt-metrics">
                <div className="debt-metric">
                  <span>{t.debts.table.balance}</span>
                  <strong>{formatCurrency(primaryDebt.current_balance)}</strong>
                </div>
                <div className="debt-metric">
                  <span>{t.debts.table.monthly}</span>
                  <strong>{formatCurrency(primaryDebt.monthly_payment)}</strong>
                </div>
              </div>
              <div className="cockpit-progress debt-progress">
                <div className="bar-track">
                  <div
                    className="bar-fill ok"
                    style={{ width: `${Math.min(100, primaryDebt.percent_paid)}%` }}
                  />
                </div>
                <div className="debt-meta">
                  <span>
                    {primaryDebt.percent_paid.toFixed(1)}% {t.debts.percentPaid}
                  </span>
                  <span>
                    {t.debts.table.debt}: {debts.length}
                  </span>
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
          {fireProgress ? (
            <div className="cockpit-fire-progress">
              <div className="bar-track fire-track">
                <span
                  className="bar-fill fire-coast"
                  style={{ width: `${fireProgress.coastPercent}%` }}
                />
                <span
                  className="bar-fill fire-target"
                  style={{
                    left: `${fireProgress.coastPercent}%`,
                    width: `${Math.max(
                      0,
                      fireProgress.firePercent - fireProgress.coastPercent
                    )}%`
                  }}
                />
              </div>
              <div className="fire-meta">
                <span>
                  Coast FIRE:{" "}
                  {fireProgress.coastYears === null
                    ? "N/A"
                    : `${fireProgress.coastYears.toFixed(1)} yrs`}
                </span>
                <span>
                  FIRE:{" "}
                  {fireProgress.fireYears === null
                    ? fireProgress.fireStatus === "impossible"
                      ? "Impossible"
                      : "N/A"
                    : `${fireProgress.fireYears.toFixed(1)} yrs`}
                </span>
              </div>
            </div>
          ) : (
            <p className="chart-sub">{fireError || t.cockpit.fireEmpty}</p>
          )}
        </article>
      </section>
    </div>
  );
}

export default CockpitOverview;
