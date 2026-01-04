import { useState } from "react";
import type { Translation } from "../content/translations";

type RealEstateProps = {
  t: Translation;
  token: string;
  portfolio: any;
};

function RealEstate({ t, token, portfolio }: RealEstateProps) {
  const [view, setView] = useState<"overall" | "reits" | "rental">("overall");
  
  // WIP: Hardcoded values
  const reitsMonthlyIncome = 200;
  const rentalMonthlyIncome = 800;
  const totalMonthlyIncome = reitsMonthlyIncome + rentalMonthlyIncome;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: portfolio?.currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="holdings-page">
      <section className="holdings-actions">
        <button
          className={`action-tab${view === "overall" ? " active" : ""}`}
          type="button"
          onClick={() => setView("overall")}
        >
          📊 Overall
        </button>
        <button
          className={`action-tab${view === "reits" ? " active" : ""}`}
          type="button"
          onClick={() => setView("reits")}
        >
          🏢 REITs
        </button>
        <button
          className={`action-tab${view === "rental" ? " active" : ""}`}
          type="button"
          onClick={() => setView("rental")}
        >
          🏠 Rental Properties
        </button>
      </section>

      {view === "overall" && (
        <section className="real-estate-overall">
          <div className="summary-card">
            <h3>Monthly Average Income (Overall)</h3>
            <div className="big-number">{formatCurrency(totalMonthlyIncome)}</div>
            <div className="breakdown">
              <div className="breakdown-item">
                <span>REITs</span>
                <span>{formatCurrency(reitsMonthlyIncome)}</span>
              </div>
              <div className="breakdown-item">
                <span>Rental Properties</span>
                <span>{formatCurrency(rentalMonthlyIncome)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "reits" && (
        <section className="real-estate-reits">
          <div className="summary-grid">
            <div className="summary-card">
              <h4>Total REITs</h4>
              <div className="big-number">0</div>
              <span className="chart-sub">Number of REIT tickers</span>
            </div>
            <div className="summary-card">
              <h4>Total Amount Received YTD</h4>
              <div className="big-number">WIP</div>
              <span className="chart-sub">Dividends from REITs</span>
            </div>
            <div className="summary-card">
              <h4>Monthly Average Income</h4>
              <div className="big-number">{formatCurrency(reitsMonthlyIncome)}</div>
              <span className="chart-sub">Fixed value (WIP)</span>
            </div>
          </div>
        </section>
      )}

      {view === "rental" && (
        <section className="real-estate-rental">
          <div className="wip-card">
            <img 
              src="/home rent 2.PNG" 
              alt="Rental Properties" 
              style={{ width: "100px", height: "100px", objectFit: "contain" }}
            />
            <h3>Rental Properties</h3>
            <div className="big-number">{formatCurrency(rentalMonthlyIncome)}</div>
            <p className="chart-sub">Work in Progress</p>
          </div>
        </section>
      )}
    </div>
  );
}

export default RealEstate;
