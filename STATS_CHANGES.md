# Infographic Stats Implementation Guide

This document outlines the additions and modifications made to add the "Project Stats" dropdown button and tables to the flowchart Infographic. You can use this guide to apply the exact same features to `app-plan2050 2` or other similar projects.

## 1. Add the UI Components (`src/App.jsx`)

In the `DetailsInfographic` component, we added dynamic stats containers that render specifically when the "Universe of Projects" or "Fiscally Constrained" nodes are active.

**Step 1:** Add a state variable to manage the table visibility dropdown inside the `DetailsInfographic` component:
```jsx
// Inside DetailsInfographic function
const [showStatsTable, setShowStatsTable] = useState(false);
```

**Step 2:** Insert the stat containers right below the `<div className="hub-circle">...</div>` element in the `return` statement:

```jsx
      {data.title.includes("Universe of Projects") && (
        <div className="project-stats-container">
          <button 
            className={`project-stats-btn ${showStatsTable ? 'active' : ''}`} 
            onClick={() => setShowStatsTable(!showStatsTable)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stats-btn-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="stats-btn-text">143 all projects</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`stats-btn-chevron ${showStatsTable ? 'open' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {showStatsTable && (
            <div className="project-stats-table-wrapper">
              <table className="project-stats-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th className="align-right">Projects</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="mode-row-hmm">
                    <td>
                      <span className="mode-dot dot-hmm"></span>
                      HMM
                    </td>
                    <td className="mode-count count-hmm align-right">116</td>
                  </tr>
                  <tr className="mode-row-transit">
                    <td>
                      <span className="mode-dot dot-transit"></span>
                      Transit
                    </td>
                    <td className="mode-count count-transit align-right">27</td>
                  </tr>
                  <tr className="mode-row-total">
                    <td className="mode-total-label">Total</td>
                    <td className="mode-count count-total align-right">143</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {data.title.includes("Fiscally Constrained") && (
        <div className="project-stats-container">
          <button 
            className={`project-stats-btn ${showStatsTable ? 'active' : ''}`} 
            onClick={() => setShowStatsTable(!showStatsTable)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stats-btn-icon">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span className="stats-btn-text">68 fc</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`stats-btn-chevron ${showStatsTable ? 'open' : ''}`}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>
          {showStatsTable && (
            <div className="project-stats-table-wrapper">
              <table className="project-stats-table">
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th className="align-right">Projects</th>
                    <th className="align-right">Cost</th>
                    <th className="align-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="mode-row-hmm">
                    <td>
                      <span className="mode-dot dot-hmm"></span>
                      HMM
                    </td>
                    <td className="mode-count count-hmm align-right">66</td>
                    <td className="mode-cost align-right">$710</td>
                    <td className="mode-revenue align-right">$1,152</td>
                  </tr>
                  <tr className="mode-row-transit">
                    <td>
                      <span className="mode-dot dot-transit"></span>
                      Transit
                    </td>
                    <td className="mode-count count-transit align-right">2</td>
                    <td className="mode-cost align-right">$9</td>
                    <td className="mode-revenue align-right">$151</td>
                  </tr>
                  <tr className="mode-row-total">
                    <td className="mode-total-label">Total</td>
                    <td className="mode-count count-total align-right">68</td>
                    <td className="mode-cost align-right font-total-val">$719</td>
                    <td className="mode-revenue align-right font-total-val">$1,303</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
```


## 2. Append CSS Styles (`src/App.css`)

Add the following styling to your CSS file. This handles the absolute positioning under the infographic hub, the glassmorphism effects for the button and table, the chevron micro-animations, and the responsive scaling on mobile.

```css
/* ---- Project Stats Button & Table ---- */
.project-stats-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: absolute;
  left: 20px; /* Align with hub-circle left edge */
  top: calc(50% + 115px);
  z-index: 15;
}

.project-stats-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: rgba(30, 41, 59, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-main);
  padding: 10px 22px;
  font-family: 'Outfit', sans-serif;
  font-size: 14px;
  font-weight: 600;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  white-space: nowrap;
  outline: none;
}

.project-stats-btn:hover {
  background: rgba(96, 165, 250, 0.15);
  border-color: rgba(96, 165, 250, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: white;
}

.project-stats-btn:active {
  transform: translateY(0) scale(0.98);
  background: rgba(96, 165, 250, 0.25);
}

.project-stats-btn.active {
  background: rgba(96, 165, 250, 0.2);
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.stats-btn-icon {
  opacity: 0.8;
  transition: transform 0.3s ease;
  color: var(--accent-blue, #60a5fa);
}

.project-stats-btn:hover .stats-btn-icon {
  transform: rotate(15deg) scale(1.1);
  opacity: 1;
}

.stats-btn-text {
  letter-spacing: 0.3px;
}

.stats-btn-chevron {
  opacity: 0.6;
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
}

.project-stats-btn:hover .stats-btn-chevron {
  opacity: 1;
}

.stats-btn-chevron.open {
  transform: rotate(180deg);
}

/* Dropdown Wrapper */
.project-stats-table-wrapper {
  margin-top: 8px;
  background: rgba(18, 20, 28, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.04);
  z-index: 20;
  animation: statsDropdownReveal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  transform-origin: top left;
}

.align-right {
  text-align: right !important;
}

@keyframes statsDropdownReveal {
  from {
    opacity: 0;
    transform: scaleY(0.85) translateY(-6px);
  }
  to {
    opacity: 1;
    transform: scaleY(1) translateY(0);
  }
}

/* Table Design */
.project-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Outfit', sans-serif;
}

.project-stats-table th {
  background: rgba(255, 255, 255, 0.025);
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 1px;
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.project-stats-table td {
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text-main);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}

.project-stats-table tbody tr {
  transition: background-color 0.2s ease;
}

.project-stats-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* Dots */
.mode-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.dot-hmm {
  background-color: var(--accent-blue, #60a5fa);
}

.dot-transit {
  background-color: var(--accent-green, #34d399);
}

/* Count values */
.mode-count {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
}

.count-hmm { color: var(--accent-blue, #60a5fa); }
.count-transit { color: var(--accent-green, #34d399); }

/* Cost & Revenue columns */
.mode-cost,
.mode-revenue {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  color: var(--text-muted);
}

.font-total-val {
  color: #fff !important;
  font-weight: 700;
}

/* Total Row */
.mode-row-total {
  background: rgba(255, 255, 255, 0.015);
}

.mode-row-total td {
  border-top: 1px dashed rgba(255, 255, 255, 0.08);
  border-bottom: none;
  font-weight: 700;
}

.mode-total-label {
  color: var(--text-muted);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
}

.count-total {
  color: #fff;
  font-size: 14px;
}

/* Mobile Overrides */
@media (max-width: 1024px) {
  .project-stats-container {
    position: static;
    width: 100%;
    margin: 15px 0 25px 0;
    align-items: stretch;
    transform: none;
  }

  .project-stats-btn {
    width: 100%;
    justify-content: center;
    border-radius: 12px;
    padding: 14px;
    font-size: 15px;
    white-space: normal;
  }

  .project-stats-table-wrapper {
    width: 100%;
    margin-top: 8px;
    border-radius: 12px;
  }
}
```
