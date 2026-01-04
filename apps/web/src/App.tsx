import { useEffect, useMemo, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate
} from "react-router-dom";
import "./App.css";
import Portfolios from "./pages/Portfolios";
import WipPage from "./pages/WipPage";
import Login from "./pages/Login";
import Holdings from "./pages/Holdings";
import BankingTransactions from "./pages/BankingTransactions";
import CockpitOverview from "./pages/CockpitOverview";
import Debts from "./pages/Debts";
import MyGoals from "./pages/MyGoals";
import AdminBackoffice from "./pages/AdminBackoffice";
import { type Language, translations } from "./content/translations";
import PortfolioModal from "./components/PortfolioModal";

type Portfolio = {
  id: number;
  name: string;
  currency: string;
  categories: string[];
  created_at: string;
  has_data: boolean;
};

function App() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem("mf_lang");
    return stored === "pt" || stored === "es" ? stored : "en";
  });
  const [langOpen, setLangOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem("mf_token") || ""
  );
  const [authMode, setAuthMode] = useState<"signin" | "register" | "recover">("signin");
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);
  const [portfolioView, setPortfolioView] = useState<
    "overview" | "management" | "categories"
  >("overview");
  const [createOpen, setCreateOpen] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const t = translations[language];
  const location = useLocation();
  const isLoginRoute = location.pathname === "/" || location.pathname === "/login";
  const showChrome = !isLoginRoute && isAuthenticated;
  const API_BASE = "http://127.0.0.1:8000";

  useEffect(() => {
    localStorage.setItem("mf_lang", language);
  }, [language]);

  useEffect(() => {
    if (!authToken) {
      setIsAuthenticated(false);
      setPortfolios([]);
      setSelectedPortfolioId(null);
      return;
    }
    let active = true;
    fetch(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("invalid");
        }
        return response.json();
      })
      .then(() => {
        if (active) {
          setIsAuthenticated(true);
        }
      })
      .catch(() => {
        if (active) {
          setIsAuthenticated(false);
          setAuthToken("");
          setPortfolios([]);
          setSelectedPortfolioId(null);
          localStorage.removeItem("mf_token");
        }
      });
    return () => {
      active = false;
    };
  }, [API_BASE, authToken]);

  const loadPortfolios = async (token: string) => {
    setPortfolioLoading(true);
    setPortfolioError("");
    try {
      const response = await fetch(`${API_BASE}/portfolios`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const items = (data.items || []) as Portfolio[];
      setPortfolios(items);
      const hasSelected = selectedPortfolioId
        ? items.some((item) => item.id === selectedPortfolioId)
        : false;
      if (items.length && !hasSelected) {
        setSelectedPortfolioId(items[0].id);
      }
      if (!items.length) {
        setSelectedPortfolioId(null);
      }
    } catch (err) {
      setPortfolioError(t.portfolio.loadError);
    } finally {
      setPortfolioLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && authToken) {
      loadPortfolios(authToken);
    }
  }, [authToken, isAuthenticated]);

  const navItems = useMemo(
    () => [
      { path: "/cockpit", label: t.nav.cockpit },
      { path: "/portfolios", label: t.nav.portfolios },
      { path: "/holdings", label: t.nav.stocks, requiresPortfolio: true },
      { path: "/transactions", label: t.nav.transactions, requiresPortfolio: true },
      { path: "/mygoals", label: t.nav.goals },
      { path: "/debts", label: t.nav.debts, requiresPortfolio: true },
      { path: "/admin", label: "Admin", requiresAdmin: true }
    ],
    [t]
  );

  const languageOptions = useMemo(
    () => [
      { code: "en" as Language, label: t.language.english, flag: "flag-en" },
      { code: "pt" as Language, label: t.language.portuguese, flag: "flag-pt" },
      { code: "es" as Language, label: t.language.spanish, flag: "flag-es" }
    ],
    [t]
  );

  const renderLanguagePicker = () => (
    <div className="lang-picker">
      <button
        className="lang-btn"
        type="button"
        onClick={() => setLangOpen((open) => !open)}
      >
        <span className={`flag flag-${language}`} />
        <span className="lang-label">{language.toUpperCase()}</span>
        <span className="chevron">v</span>
      </button>
      {langOpen ? (
        <div className="lang-menu">
          {languageOptions.map((option) => (
            <button
              key={option.code}
              type="button"
              className={`lang-option${option.code === language ? " active" : ""}`}
              onClick={() => {
                setLanguage(option.code);
                setLangOpen(false);
              }}
            >
              <span className={`flag ${option.flag}`} />
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );

  const handleLogin = (token: string) => {
    setAuthToken(token);
    setIsAuthenticated(true);
    localStorage.setItem("mf_token", token);
    loadPortfolios(token);
  };

  const handleLogout = async () => {
    const token = authToken;
    setAuthToken("");
    setIsAuthenticated(false);
    localStorage.removeItem("mf_token");
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // ignore logout errors
      }
    }
    navigate("/");
  };

  const handleCreatePortfolio = async (payload: {
    name: string;
    currency: string;
    customCategories: string[];
  }) => {
    if (!authToken) {
      return;
    }
    setPortfolioLoading(true);
    setPortfolioError("");
    try {
      const response = await fetch(`${API_BASE}/portfolios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({
          name: payload.name,
          currency: payload.currency,
          custom_categories: payload.customCategories
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed");
      }
      const portfolio = data.portfolio as Portfolio;
      const next = [...portfolios, portfolio];
      setPortfolios(next);
      setSelectedPortfolioId(portfolio.id);
      setCreateOpen(false);
    } catch (err) {
      setPortfolioError(t.portfolio.saveError);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!authToken) return;
    
    // Prompt for date with today as default
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dateInput = prompt(`Enter snapshot date (YYYY-MM-DD):`, today);
    
    if (!dateInput) {
      return; // User cancelled
    }
    
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateInput)) {
      alert("Invalid date format. Please use YYYY-MM-DD format.");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/portfolios/aggregated/snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ snapshot_date: dateInput })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.detail || "Failed to create snapshot");
      }
      alert(`Snapshot created successfully!\nDate: ${data.snapshot_date}\nTotal: ${data.total_value}`);
    } catch (err) {
      alert(`Error creating snapshot: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  const activePortfolio =
    selectedPortfolioId === -1
      ? { id: -1, name: "Aggregated Portfolio", currency: "EUR", categories: [] }
      : portfolios.find((item) => item.id === selectedPortfolioId) || portfolios[0];

  return (
    <div className="app">
      {isLoginRoute ? (
        <header className="login-topbar">
          <div className="login-brand">
            <img src="/fainance-logo.png" alt="FAInance" />
            <span>PortfolioTracker</span>
          </div>
          <div className="login-actions">
              <button
                className="ghost-btn"
                type="button"
                onClick={() => setAuthMode("signin")}
              >
                {t.auth.signIn}
              </button>
            <button
              className="primary-btn"
              type="button"
              onClick={() => setAuthMode("register")}
            >
              {t.auth.register}
            </button>
            {renderLanguagePicker()}
          </div>
        </header>
      ) : null}
      {showChrome ? (
        <>
          <header className="top-bar">
            <div className="brand">
              <img src="/fainance-logo.png" alt="MyFAInance" />
              <span>MyFAInance v2</span>
            </div>
            <nav className="nav">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/portfolios"}
                  className={({ isActive }) =>
                    `nav-item${isActive ? " active" : ""}${
                      item.requiresPortfolio && portfolios.length === 0
                        ? " disabled"
                        : ""
                    }`
                  }
                  onClick={(event) => {
                    if (item.requiresPortfolio && portfolios.length === 0) {
                      event.preventDefault();
                      window.alert(t.nav.disabledHint);
                    }
                  }}
                  title={
                    item.requiresPortfolio && portfolios.length === 0
                      ? t.nav.disabledHint
                      : undefined
                  }
                >
                  {item.label} {item.wip ? <span className="wip">WIP</span> : null}
                </NavLink>
              ))}
            </nav>
            <div className="actions">
              <button className="add-btn" type="button" onClick={() => setCreateOpen(true)}>
                + {t.actions.add}
              </button>
              <div className="portfolio-pill">
                {activePortfolio ? activePortfolio.name : t.portfolio.emptyLabel}
                <span className="chevron">v</span>
              </div>
              <div className="currency-pill">
                {activePortfolio ? activePortfolio.currency : "EUR"}
                <span className="chevron">v</span>
              </div>
              {renderLanguagePicker()}
              <button className="ghost-btn logout-btn" type="button" onClick={handleLogout}>
                {t.auth.logout}
              </button>
              <NavLink to="/" className="avatar">RC</NavLink>
            </div>
          </header>

          {location.pathname === "/portfolios" ? (
            <section className="portfolio-strip">
              <div className="portfolio-row">
                <button
                  className={`portfolio-chip aggregated${
                    selectedPortfolioId === -1 ? " active" : ""
                  }`}
                  type="button"
                  onClick={() => setSelectedPortfolioId(-1)}
                >
                  📊 Aggregated Portfolio
                </button>
                <div className="portfolio-chips">
                  {portfolios.length === 0 ? (
                    <span className="portfolio-empty">{t.portfolio.emptyMessage}</span>
                  ) : (
                    portfolios.map((portfolio) => (
                      <button
                        key={portfolio.id}
                        className={`portfolio-chip${
                          portfolio.id === activePortfolio?.id ? " active" : ""
                        }`}
                        type="button"
                        onClick={() => setSelectedPortfolioId(portfolio.id)}
                      >
                        {portfolio.name}
                      </button>
                    ))
                  )}
                </div>
                {selectedPortfolioId === -1 && (
                  <button
                    className="portfolio-chip create-snapshot"
                    type="button"
                    onClick={handleCreateSnapshot}
                  >
                    📸 Create Snapshot
                  </button>
                )}
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      <main className={`content${isLoginRoute ? " login-layout" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/cockpit" replace />
              ) : (
                <Login
                  t={t}
                  onLogin={handleLogin}
                  mode={authMode}
                  onModeChange={setAuthMode}
                />
              )
            }
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/cockpit"
            element={
              isAuthenticated ? (
                <CockpitOverview
                  t={t}
                  token={authToken}
                  portfolio={activePortfolio}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/portfolios"
            element={
              isAuthenticated ? (
                <Portfolios
                  t={t}
                  portfolio={activePortfolio}
                  loading={portfolioLoading}
                  token={authToken}
                  view={portfolioView}
                  onViewChange={setPortfolioView}
                  onRefresh={() => loadPortfolios(authToken)}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/holdings"
            element={
              isAuthenticated ? (
                <Holdings
                  t={t}
                  token={authToken}
                  portfolio={activePortfolio}
                  portfolios={portfolios}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route path="/stocks" element={<Navigate to="/holdings" replace />} />
          <Route
            path="/transactions"
            element={
              isAuthenticated ? (
                <BankingTransactions
                  t={t}
                  token={authToken}
                  portfolio={activePortfolio}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/mygoals"
            element={
              isAuthenticated ? (
                <MyGoals t={t} token={authToken} portfolio={activePortfolio} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/debts"
            element={
              isAuthenticated ? (
                <Debts t={t} token={authToken} portfolio={activePortfolio} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/admin"
            element={
              isAuthenticated ? (
                <AdminBackoffice t={t} token={authToken} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/portfolio-management"
            element={
              isAuthenticated ? (
                <WipPage title={t.nav.management} label={t.wip.label} message={t.wip.message} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </main>
      <PortfolioModal
        open={createOpen}
        loading={portfolioLoading}
        error={portfolioError}
        t={t}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreatePortfolio}
      />
    </div>
  );
}

export default App;
