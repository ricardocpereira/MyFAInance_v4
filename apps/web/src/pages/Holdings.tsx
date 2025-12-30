import { useEffect, useMemo, useState } from "react";
import type { Translation } from "../content/translations";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
  categories: string[];
};

type HoldingItem = {
  ticker: string;
  name?: string | null;
  institution?: string | null;
  category?: string | null;
  shares: number;
  avg_price: number;
  cost_basis: number;
  current_price: number;
  current_value: number;
  profit_value: number;
  profit_percent: number | null;
  share_percent: number;
  sector?: string | null;
  industry?: string | null;
  country?: string | null;
  asset_type?: string | null;
  portfolio_id?: number;
  portfolio_name?: string;
};

type HoldingMetaDraft = {
  ticker: string;
  portfolio_id?: number | null;
  sector: string;
  industry: string;
  country: string;
  asset_type: string;
};

type HoldingsProps = {
  t: Translation;
  token: string;
  portfolio?: Portfolio;
  portfolios: Portfolio[];
};

const API_BASE = "http://127.0.0.1:8000";

function Holdings({ t, token, portfolio, portfolios }: HoldingsProps) {
  const [viewMode, setViewMode] = useState<"overall" | "portfolio">("portfolio");
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(
    portfolio?.id ?? null
  );
  const [categoryFilter, setCategoryFilter] = useState("");
  const [institutionFilter, setInstitutionFilter] = useState("");
  const [tickerFilter, setTickerFilter] = useState("");
  const [chartGroup, setChartGroup] = useState<
    "ticker" | "sector" | "industry" | "country" | "asset"
  >("ticker");
  const [chartMetric, setChartMetric] = useState<"gain" | "gain_pct" | "price_pct">(
    "gain"
  );
  const [chartRange, setChartRange] = useState<
    "1d" | "1w" | "1m" | "3m" | "6m" | "ytd" | "1y" | "all"
  >("1d");
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [totalValue, setTotalValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [infoOpen, setInfoOpen] = useState<string | null>(null);
  const [metaDraft, setMetaDraft] = useState<HoldingMetaDraft | null>(null);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaError, setMetaError] = useState("");
  const [metaMessage, setMetaMessage] = useState("");

  const [txTicker, setTxTicker] = useState("");
  const [txCompany, setTxCompany] = useState("");
  const [txOperation, setTxOperation] = useState<"buy" | "sell">("buy");
  const [txDate, setTxDate] = useState("");
  const [txShares, setTxShares] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txFee, setTxFee] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txCategory, setTxCategory] = useState("Stocks");
  const [txInstitution, setTxInstitution] = useState("");
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState("");
  const [txMessage, setTxMessage] = useState("");

  const activePortfolio = useMemo(
    () =>
      portfolios.find((item) => item.id === selectedPortfolioId) ||
      portfolio ||
      null,
    [portfolios, portfolio, selectedPortfolioId]
  );

  useEffect(() => {
    if (portfolio?.id && !selectedPortfolioId) {
      setSelectedPortfolioId(portfolio.id);
    }
  }, [portfolio?.id, selectedPortfolioId]);

  useEffect(() => {
    if (activePortfolio?.categories?.length) {
      setTxCategory(activePortfolio.categories[0] || "Stocks");
    } else {
      setTxCategory("Stocks");
    }
  }, [activePortfolio?.id]);

  const currencyLabel = activePortfolio?.currency || portfolio?.currency || "EUR";
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
    return `${sign}${currencyFormatter.format(Math.abs(value))}`;
  };
  const formatSignedPercent = (value: number) => {
    const sign = value < 0 ? "-" : "+";
    return `${sign}${Math.abs(value).toFixed(2)}%`;
  };

  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    portfolios.forEach((item) => item.categories?.forEach((cat) => set.add(cat)));
    if (set.size === 0 && portfolio?.categories) {
      portfolio.categories.forEach((cat) => set.add(cat));
    }
    if (set.size === 0) {
      set.add("Stocks");
    }
    return Array.from(set);
  }, [portfolios, portfolio?.categories]);

  const institutionOptions = useMemo(() => {
    const set = new Set<string>();
    holdings.forEach((item) => {
      if (item.institution) {
        set.add(item.institution);
      }
    });
    return Array.from(set);
  }, [holdings]);

  const sortedHoldings = useMemo(
    () =>
      [...holdings].sort(
        (a, b) => Number(b.current_value || 0) - Number(a.current_value || 0)
      ),
    [holdings]
  );

  const filteredHoldings = useMemo(() => {
    const query = tickerFilter.trim().toLowerCase();
    if (!query) {
      return sortedHoldings;
    }
    return sortedHoldings.filter((item) => {
      const ticker = item.ticker.toLowerCase();
      const name = (item.name || "").toLowerCase();
      return ticker.includes(query) || name.includes(query);
    });
  }, [sortedHoldings, tickerFilter]);

  const tickerOptions = useMemo(() => {
    const set = new Set<string>();
    sortedHoldings.forEach((item) => set.add(item.ticker));
    return Array.from(set);
  }, [sortedHoldings]);

  const getAssetType = (category?: string | null) => {
    const value = (category || "").toLowerCase();
    if (value.includes("retirement") || value.includes("ppr")) {
      return "Retirement Plans";
    }
    if (value.includes("etf")) {
      return "ETFs";
    }
    if (value.includes("fund")) {
      return "Funds";
    }
    if (value.includes("stock")) {
      return "Stocks";
    }
    return "Others";
  };

  const assetTypeOptions = ["Stocks", "ETFs", "Funds", "Retirement Plans", "Others"];

  const chartItems = useMemo(() => {
    const grouped = new Map<
      string,
      {
        label: string;
        costBasis: number;
        currentValue: number;
        profitValue: number;
        shares: number;
        priceTotal: number;
        avgPriceTotal: number;
      }
    >();
    filteredHoldings.forEach((item) => {
      const assetType = item.asset_type || getAssetType(item.category);
      const label =
        chartGroup === "ticker"
          ? item.ticker
          : chartGroup === "sector"
          ? item.sector || "Other"
          : chartGroup === "industry"
          ? item.industry || "Other"
          : chartGroup === "country"
          ? item.country || "Other"
          : chartGroup === "asset"
          ? assetType
          : "Other";
      const entry = grouped.get(label) || {
        label,
        costBasis: 0,
        currentValue: 0,
        profitValue: 0,
        shares: 0,
        priceTotal: 0,
        avgPriceTotal: 0
      };
      entry.costBasis += Number(item.cost_basis || 0);
      entry.currentValue += Number(item.current_value || 0);
      entry.profitValue += Number(item.profit_value || 0);
      entry.shares += Number(item.shares || 0);
      entry.priceTotal += Number(item.current_price || 0) * Number(item.shares || 0);
      entry.avgPriceTotal += Number(item.avg_price || 0) * Number(item.shares || 0);
      grouped.set(label, entry);
    });
    const items = Array.from(grouped.values()).map((entry) => {
      const profitPercent = entry.costBasis
        ? (entry.profitValue / entry.costBasis) * 100
        : 0;
      const pricePercent = entry.avgPriceTotal
        ? ((entry.priceTotal - entry.avgPriceTotal) / entry.avgPriceTotal) * 100
        : 0;
      const value =
        chartMetric === "gain"
          ? entry.profitValue
          : chartMetric === "gain_pct"
          ? profitPercent
          : pricePercent;
      return {
        label: entry.label,
        value,
        profitValue: entry.profitValue,
        profitPercent,
        pricePercent
      };
    });
    items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return items;
  }, [filteredHoldings, chartGroup, chartMetric]);

  const maxChartValue = useMemo(() => {
    if (!chartItems.length) {
      return 1;
    }
    return Math.max(...chartItems.map((item) => Math.abs(item.value)), 1);
  }, [chartItems]);

  const loadHoldings = async () => {
    if (!token) {
      return;
    }
    if (viewMode === "portfolio" && !activePortfolio) {
      setHoldings([]);
      setTotalValue(0);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (categoryFilter) {
        params.set("category", categoryFilter);
      }
      if (institutionFilter) {
        params.set("institution", institutionFilter);
      }
      const basePath =
        viewMode === "overall"
          ? "/holdings"
          : `/portfolios/${activePortfolio?.id}/holdings`;
      const url = params.toString()
        ? `${API_BASE}${basePath}?${params}`
        : `${API_BASE}${basePath}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.loadError);
      }
      setHoldings(data.items || []);
      setTotalValue(Number(data.total_value) || 0);
    } catch (err) {
      setError(t.holdings.loadError);
    } finally {
      setLoading(false);
    }
  };

  const openMetaEditor = (item: HoldingItem) => {
    setMetaError("");
    setMetaMessage("");
    setMetaDraft({
      ticker: item.ticker,
      portfolio_id: item.portfolio_id ?? activePortfolio?.id ?? null,
      sector: item.sector || "",
      industry: item.industry || "",
      country: item.country || "",
      asset_type: item.asset_type || getAssetType(item.category)
    });
  };

  const closeMetaEditor = () => {
    setMetaDraft(null);
  };

  const updateMetaDraft = (field: keyof HoldingMetaDraft, value: string) => {
    setMetaDraft((current) => (current ? { ...current, [field]: value } : current));
  };

  const handleMetaSave = async () => {
    if (!metaDraft) {
      return;
    }
    const portfolioId = metaDraft.portfolio_id ?? activePortfolio?.id ?? null;
    if (!portfolioId) {
      setMetaError(t.holdings.meta.noPortfolio);
      return;
    }
    setMetaSaving(true);
    setMetaError("");
    setMetaMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${portfolioId}/holdings/metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ticker: metaDraft.ticker,
            sector: metaDraft.sector,
            industry: metaDraft.industry,
            country: metaDraft.country,
            asset_type: metaDraft.asset_type
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.meta.saveError);
      }
      setMetaMessage(t.holdings.meta.saveSuccess);
      closeMetaEditor();
      loadHoldings();
    } catch (err) {
      setMetaError(t.holdings.meta.saveError);
    } finally {
      setMetaSaving(false);
    }
  };

  useEffect(() => {
    loadHoldings();
  }, [
    token,
    viewMode,
    activePortfolio?.id,
    categoryFilter,
    institutionFilter
  ]);

  const handleRefreshPrices = async () => {
    if (!token) {
      return;
    }
    setRefreshing(true);
    setMessage("");
    setError("");
    try {
      const path =
        viewMode === "overall"
          ? "/holdings/refresh-prices"
          : `/portfolios/${activePortfolio?.id}/holdings/refresh-prices`;
      const response = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ force: true })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.refreshError);
      }
      const errorItem = (data.items || []).find((item: any) => item.status === "error");
      if (errorItem) {
        const errorText = String(errorItem.error || "");
        if (errorText.toLowerCase().includes("price unavailable")) {
          setError(`${t.holdings.tickerUnsupported} ${errorItem.ticker}`);
        } else {
          setError(t.holdings.refreshError);
        }
      } else {
        setMessage(t.holdings.refreshSuccess);
      }
      await loadHoldings();
    } catch (err) {
      setError(t.holdings.refreshError);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveTransaction = async (keepValues: boolean) => {
    if (!activePortfolio?.id) {
      setTxError(t.holdings.transaction.noPortfolio);
      return;
    }
    if (!txTicker.trim()) {
      setTxError(t.holdings.validation.ticker);
      return;
    }
    if (!txDate) {
      setTxError(t.holdings.validation.date);
      return;
    }
    if (Number(txShares) <= 0) {
      setTxError(t.holdings.validation.shares);
      return;
    }
    if (Number(txPrice) <= 0) {
      setTxError(t.holdings.validation.price);
      return;
    }
    setTxSaving(true);
    setTxError("");
    setTxMessage("");
    try {
      const response = await fetch(
        `${API_BASE}/portfolios/${activePortfolio.id}/holdings/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ticker: txTicker.trim().toUpperCase(),
            name: txCompany.trim() || null,
            operation: txOperation,
            trade_date: txDate,
            shares: Number(txShares),
            price: Number(txPrice),
            fee: txFee ? Number(txFee) : null,
            note: txNote.trim() || null,
            category: txCategory || "Stocks",
            institution: txInstitution.trim() || null
          })
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || t.holdings.transaction.saveError);
      }
      setTxMessage(t.holdings.transaction.saveSuccess);
      if (keepValues) {
        setTxShares("");
        setTxPrice("");
        setTxFee("");
        setTxNote("");
      } else {
        setTxTicker("");
        setTxCompany("");
        setTxOperation("buy");
        setTxDate("");
        setTxShares("");
        setTxPrice("");
        setTxFee("");
        setTxNote("");
        setTxCategory("Stocks");
        setTxInstitution("");
      }
      await loadHoldings();
    } catch (err) {
      setTxError(t.holdings.transaction.saveError);
    } finally {
      setTxSaving(false);
    }
  };

  const tooltipText = t.holdings.tooltips;
  const showPortfolioColumn = viewMode === "overall";

  return (
    <div className="holdings-page">
      <section className="holdings-header">
        <div>
          <h2>{t.holdings.title}</h2>
          <p>{t.holdings.subtitle}</p>
        </div>
        <div className="holdings-meta">
          <div className="holdings-total">
            <span>{t.holdings.totalLabel}</span>
            <strong>{formatCurrency(totalValue)}</strong>
          </div>
          <button
            className="ghost-btn"
            type="button"
            onClick={handleRefreshPrices}
            disabled={refreshing}
          >
            {refreshing ? t.holdings.updating : t.holdings.updateAll}
          </button>
        </div>
      </section>

      <section className="holdings-filters">
        <div className="filter-group">
          <span>{t.holdings.filters.view}</span>
          <div className="filter-tabs">
            <button
              type="button"
              className={viewMode === "portfolio" ? "active" : ""}
              onClick={() => setViewMode("portfolio")}
            >
              {t.holdings.viewPortfolio}
            </button>
            <button
              type="button"
              className={viewMode === "overall" ? "active" : ""}
              onClick={() => setViewMode("overall")}
            >
              {t.holdings.viewOverall}
            </button>
          </div>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.portfolio}</label>
          <select
            value={activePortfolio?.id || ""}
            onChange={(event) => setSelectedPortfolioId(Number(event.target.value))}
            disabled={viewMode === "overall"}
          >
            {(portfolios.length ? portfolios : portfolio ? [portfolio] : []).map(
              (item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              )
            )}
          </select>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.category}</label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
          >
            <option value="">{t.holdings.filters.all}</option>
            {categoryOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.institution}</label>
          <select
            value={institutionFilter}
            onChange={(event) => setInstitutionFilter(event.target.value)}
          >
            <option value="">{t.holdings.filters.all}</option>
            {institutionOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label>{t.holdings.filters.ticker}</label>
          <input
            type="text"
            value={tickerFilter}
            onChange={(event) => setTickerFilter(event.target.value)}
            placeholder={t.holdings.filters.tickerPlaceholder}
            list="ticker-options"
          />
          <datalist id="ticker-options">
            {tickerOptions.map((option) => (
              <option key={option} value={option} />
            ))}
          </datalist>
        </div>
      </section>

      {message ? <div className="login-banner">{message}</div> : null}
      {error ? <p className="login-error">{error}</p> : null}
      {metaMessage ? <div className="login-banner">{metaMessage}</div> : null}
      {metaError ? <p className="login-error">{metaError}</p> : null}

      <section className="holdings-chart">
        <div className="holdings-chart-header">
          <h3>{t.holdings.chart.title}</h3>
          <div className="holdings-chart-toggle">
            <span>{t.holdings.chart.groupLabel}</span>
            <div className="holdings-chip-row">
              {(
                [
                  ["ticker", t.holdings.chart.groups.ticker],
                  ["sector", t.holdings.chart.groups.sector],
                  ["industry", t.holdings.chart.groups.industry],
                  ["country", t.holdings.chart.groups.country],
                  ["asset", t.holdings.chart.groups.asset]
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`holdings-chip${chartGroup === value ? " active" : ""}`}
                  onClick={() => setChartGroup(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="holdings-chart-controls">
          <div className="holdings-chart-toggle">
            <span>{t.holdings.chart.metricLabel}</span>
            <div className="holdings-chip-row">
              {(
                [
                  ["gain", t.holdings.chart.metrics.gainValue],
                  ["gain_pct", t.holdings.chart.metrics.gainPercent],
                  ["price_pct", t.holdings.chart.metrics.pricePercent]
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`holdings-chip${chartMetric === value ? " active" : ""}`}
                  onClick={() => setChartMetric(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="holdings-chart-toggle">
            <span>{t.holdings.chart.rangeLabel}</span>
            <div className="holdings-chip-row">
              {(
                [
                  ["1d", "1d"],
                  ["1w", "1w"],
                  ["1m", "1m"],
                  ["3m", "3m"],
                  ["6m", "6m"],
                  ["ytd", "ytd"],
                  ["1y", "1y"],
                  ["all", "All"]
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={`holdings-chip${chartRange === value ? " active" : ""}`}
                  onClick={() => setChartRange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="holdings-chart-body">
          {chartItems.length === 0 ? (
            <p className="chart-sub">{t.holdings.chart.empty}</p>
          ) : (
            <div className="holdings-chart-bars">
              {chartItems.map((item) => {
                const height = (Math.abs(item.value) / maxChartValue) * 100;
                const isPositive = item.value >= 0;
                return (
                  <div className="holdings-chart-bar" key={item.label}>
                    <div className="holdings-chart-bar-stack">
                      <div className="holdings-chart-bar-pos">
                        {isPositive ? (
                          <span
                            className="holdings-chart-bar-fill pos"
                            style={{ height: `${height}%` }}
                          />
                        ) : null}
                      </div>
                      <div className="holdings-chart-bar-neg">
                        {!isPositive ? (
                          <span
                            className="holdings-chart-bar-fill neg"
                            style={{ height: `${height}%` }}
                          />
                        ) : null}
                      </div>
                    </div>
                    <span className="holdings-chart-label" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="holdings-table-wrap">
        {loading ? <div className="loading-banner">{t.portfolio.loading}</div> : null}
        {!loading && filteredHoldings.length === 0 ? (
          <p className="chart-sub">{t.holdings.empty}</p>
        ) : null}
        {filteredHoldings.length ? (
          <div className={`table holdings-table${showPortfolioColumn ? " overall" : ""}`}>
            <div className="row head">
              <span>{t.holdings.columns.holding}</span>
              {showPortfolioColumn ? <span>{t.holdings.columns.portfolio}</span> : null}
              <span>{t.holdings.columns.shares}</span>
              <span className="holding-header">
                {t.holdings.columns.costBasis}
                <button
                  type="button"
                  className="info-btn"
                  onClick={() =>
                    setInfoOpen(infoOpen === "costBasis" ? null : "costBasis")
                  }
                >
                  ?
                </button>
                {infoOpen === "costBasis" ? (
                  <div className="holdings-tooltip">{tooltipText.costBasis}</div>
                ) : null}
              </span>
              <span className="holding-header">
                {t.holdings.columns.currentValue}
                <button
                  type="button"
                  className="info-btn"
                  onClick={() =>
                    setInfoOpen(infoOpen === "currentValue" ? null : "currentValue")
                  }
                >
                  ?
                </button>
                {infoOpen === "currentValue" ? (
                  <div className="holdings-tooltip">{tooltipText.currentValue}</div>
                ) : null}
              </span>
              <span className="holding-header">
                {t.holdings.columns.totalProfit}
                <button
                  type="button"
                  className="info-btn"
                  onClick={() =>
                    setInfoOpen(infoOpen === "totalProfit" ? null : "totalProfit")
                  }
                >
                  ?
                </button>
                {infoOpen === "totalProfit" ? (
                  <div className="holdings-tooltip">{tooltipText.totalProfit}</div>
                ) : null}
              </span>
              <span className="holding-header">
                {t.holdings.columns.share}
                <button
                  type="button"
                  className="info-btn"
                  onClick={() =>
                    setInfoOpen(infoOpen === "share" ? null : "share")
                  }
                >
                  ?
                </button>
                {infoOpen === "share" ? (
                  <div className="holdings-tooltip">{tooltipText.share}</div>
                ) : null}
              </span>
            </div>
            {filteredHoldings.map((item) => (
              <div className="row" key={`${item.ticker}-${item.portfolio_id || ""}`}>
                <span className="holding-name">
                  <strong>{item.ticker}</strong>
                  <small>{item.name || item.institution || "-"}</small>
                  <button
                    type="button"
                    className="holding-meta-btn"
                    onClick={() => openMetaEditor(item)}
                  >
                    {t.holdings.meta.edit}
                  </button>
                </span>
                {showPortfolioColumn ? (
                  <span>{item.portfolio_name || "--"}</span>
                ) : null}
                <span>{Number(item.shares || 0).toFixed(4)}</span>
                <span>{formatCurrency(item.cost_basis || 0)}</span>
                <span>{formatCurrency(item.current_value || 0)}</span>
                <span className={item.profit_value >= 0 ? "pos" : "neg"}>
                  {formatSignedCurrency(item.profit_value || 0)}
                  {item.profit_percent !== null && item.profit_percent !== undefined
                    ? ` (${formatSignedPercent(item.profit_percent)})`
                    : ""}
                </span>
                <span>{Number(item.share_percent || 0).toFixed(2)}%</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {metaDraft ? (
        <div className="holding-meta-modal" onClick={closeMetaEditor}>
          <div className="holding-meta-card" onClick={(event) => event.stopPropagation()}>
            <div className="holding-meta-header">
              <div>
                <h4>{t.holdings.meta.title}</h4>
                <p className="chart-sub">
                  {metaDraft.ticker} · {t.holdings.meta.subtitle}
                </p>
              </div>
              <button
                type="button"
                className="ghost-btn"
                onClick={closeMetaEditor}
              >
                {t.holdings.meta.cancel}
              </button>
            </div>
            <div className="holding-meta-grid">
              <label>
                <span>{t.holdings.meta.sector}</span>
                <input
                  type="text"
                  value={metaDraft.sector}
                  onChange={(event) => updateMetaDraft("sector", event.target.value)}
                />
              </label>
              <label>
                <span>{t.holdings.meta.industry}</span>
                <input
                  type="text"
                  value={metaDraft.industry}
                  onChange={(event) => updateMetaDraft("industry", event.target.value)}
                />
              </label>
              <label>
                <span>{t.holdings.meta.country}</span>
                <input
                  type="text"
                  value={metaDraft.country}
                  onChange={(event) => updateMetaDraft("country", event.target.value)}
                />
              </label>
              <label>
                <span>{t.holdings.meta.assetType}</span>
                <select
                  value={metaDraft.asset_type}
                  onChange={(event) => updateMetaDraft("asset_type", event.target.value)}
                >
                  {assetTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="holding-meta-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={handleMetaSave}
                disabled={metaSaving}
              >
                {metaSaving ? t.holdings.meta.saving : t.holdings.meta.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="holdings-form">
        <div className="section-head">
          <h3>{t.holdings.transaction.title}</h3>
          <span className="chart-sub">{t.holdings.transaction.subtitle}</span>
        </div>
        {txMessage ? <div className="login-banner">{txMessage}</div> : null}
        {txError ? <p className="login-error">{txError}</p> : null}
        <div className="form-grid">
          <div className="field">
            <label>{t.holdings.transaction.ticker}</label>
            <input
              type="text"
              value={txTicker}
              onChange={(event) => setTxTicker(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.company}</label>
            <input
              type="text"
              value={txCompany}
              onChange={(event) => setTxCompany(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.operation}</label>
            <select
              value={txOperation}
              onChange={(event) =>
                setTxOperation(event.target.value === "sell" ? "sell" : "buy")
              }
            >
              <option value="buy">{t.holdings.transaction.buy}</option>
              <option value="sell">{t.holdings.transaction.sell}</option>
            </select>
          </div>
          <div className="field">
            <label>{t.holdings.transaction.date}</label>
            <input
              type="date"
              value={txDate}
              onChange={(event) => setTxDate(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.shares}</label>
            <input
              type="number"
              value={txShares}
              onChange={(event) => setTxShares(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.price}</label>
            <input
              type="number"
              value={txPrice}
              onChange={(event) => setTxPrice(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.fee}</label>
            <input
              type="number"
              value={txFee}
              onChange={(event) => setTxFee(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.note}</label>
            <input
              type="text"
              value={txNote}
              onChange={(event) => setTxNote(event.target.value)}
            />
          </div>
          <div className="field">
            <label>{t.holdings.transaction.category}</label>
            <select
              value={txCategory}
              onChange={(event) => setTxCategory(event.target.value)}
            >
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>{t.holdings.transaction.institution}</label>
            <input
              type="text"
              value={txInstitution}
              onChange={(event) => setTxInstitution(event.target.value)}
            />
          </div>
        </div>
        <div className="form-actions">
          <button
            className="ghost-btn"
            type="button"
            onClick={() => handleSaveTransaction(true)}
            disabled={txSaving}
          >
            {txSaving ? t.holdings.transaction.saving : t.holdings.transaction.saveMore}
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={() => handleSaveTransaction(false)}
            disabled={txSaving}
          >
            {txSaving ? t.holdings.transaction.saving : t.holdings.transaction.save}
          </button>
        </div>
      </section>
    </div>
  );
}

export default Holdings;
