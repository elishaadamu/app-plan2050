import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { useRevenueData } from './useRevenueData';
import { BEFORE_PROJECTS, BEFORE_TOTAL_COST, BEFORE_PROFITS, AFTER_PROJECTS, AFTER_TOTAL_COST, AFTER_PROFITS } from './pieChartData';

/* ============================================================
   GaugeChart – SVG arc speedometer dial
   pct       : 0–100, fill level
   value     : center large text (for dynamic Reports, e.g. "$87.85M" or "99.6%")
   sublabel  : center smaller caption (e.g. "before_count" or "Completed")
   label     : bottom caption (standard dials)
   color     : arc fill colour
   isPieChartDial : boolean (activates count/percentage double stack inside center)
   count     : integer count (for Pie Chart speedometers)
   ============================================================ */
function GaugeChart({ pct = 0, value = '', sublabel = '', label = '', color = '#6c8ef5', isPieChartDial = false, count = 0 }) {
  const arcRef  = useRef(null);
  const dotRef  = useRef(null);
  const pctTextRef = useRef(null);
  const raf     = useRef(null);

  const cx = 80, cy = 80, r = 58;
  const startAngle = 150;   // degrees — bottom-left
  const sweepAngle = 240;   // total gauge span

  // Unique gradient ID per instance to prevent DOM conflicts
  const gradId = `gaugeGrad_${label.replace(/\W/g, '_')}_${isPieChartDial ? 'pie' : 'rep'}`;

  const toRad     = (deg) => (deg * Math.PI) / 180;
  const arcPoint  = (angle) => ({
    x: cx + r  * Math.cos(toRad(angle)),
    y: cy + r  * Math.sin(toRad(angle)),
  });

  const safePct   = Math.min(Math.max(pct, 0), 100);
  const fillAngle = startAngle + (sweepAngle * safePct) / 100;

  // Exact arc length for the filled portion (r × θ_radians)
  const fillArcLen = r * toRad(sweepAngle * safePct / 100);

  const describeArc = (fromDeg, toDeg) => {
    const s = arcPoint(fromDeg);
    const e = arcPoint(toDeg);
    const large = (toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Inner decorative thin ring
  const ri = 48;
  const describeRingArc = (fromDeg, toDeg) => {
    const s = { x: cx + ri * Math.cos(toRad(fromDeg)), y: cy + ri * Math.sin(toRad(fromDeg)) };
    const e = { x: cx + ri * Math.cos(toRad(toDeg)),   y: cy + ri * Math.sin(toRad(toDeg)) };
    const large = (toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${ri} ${ri} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  // Animate arc sweep from 0 → fillArcLen on mount / value update
  useEffect(() => {
    const path = arcRef.current;
    const dot  = dotRef.current;
    if (!path || safePct === 0) return;

    if (raf.current) cancelAnimationFrame(raf.current);

    const duration = 1200; // ms
    const ease     = (t) => 1 - Math.pow(1 - t, 3); // cubic ease-out
    let start      = null;

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const t       = Math.min(elapsed / duration, 1);
      const eased   = ease(t);

      const currentLen = fillArcLen * eased;

      path.style.strokeDasharray  = `${currentLen} ${fillArcLen + 1}`;
      path.style.strokeDashoffset = '0';

      if (dot) {
        const currentAngle = startAngle + (sweepAngle * safePct / 100) * eased;
        const p = arcPoint(currentAngle);
        dot.setAttribute('cx', p.x);
        dot.setAttribute('cy', p.y);
        dot.style.opacity = eased > 0.05 ? '1' : '0';

        if (pctTextRef.current) {
          // Push text outward radially closer to the circle sweep line
          const textDistance = r + 23;
          const tx = cx + textDistance * Math.cos(toRad(currentAngle));
          const ty = cy + textDistance * Math.sin(toRad(currentAngle)) + 3.5;
          pctTextRef.current.setAttribute('x', tx);
          pctTextRef.current.setAttribute('y', ty);
          pctTextRef.current.style.opacity = eased > 0.05 ? '1' : '0';
        }
      }

      if (t < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    };

    // Reset properties before starting animation
    path.style.strokeDasharray  = '0 1000';
    path.style.strokeDashoffset = '0';
    if (dot) {
      dot.setAttribute('cx', arcPoint(startAngle).x);
      dot.setAttribute('cy', arcPoint(startAngle).y);
      dot.style.opacity = '0';
    }
    if (pctTextRef.current) {
      pctTextRef.current.style.opacity = '0';
    }

    raf.current = requestAnimationFrame((ts) => {
      raf.current = requestAnimationFrame((ts2) => animate(ts2));
    });

    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [pct, color]);

  return (
    <svg viewBox="0 0 160 140" className="gauge-svg" aria-label={label}>
      {/* Track (full 240° grey track arc) */}
      <path
        d={describeArc(startAngle, startAngle + sweepAngle)}
        fill="none"
        stroke="var(--gauge-track, rgba(255,255,255,0.08))"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Filled sweep arc — animated via ref */}
      {safePct > 0 && (
        <path
          ref={arcRef}
          d={describeArc(startAngle, fillAngle)}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          style={{ strokeDasharray: '0 1000', strokeDashoffset: '0' }}
        />
      )}

      {/* Inner thin decorative ring */}
      <path
        d={describeRingArc(startAngle, startAngle + sweepAngle)}
        fill="none"
        stroke="var(--gauge-ring, rgba(255,255,255,0.03))"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Travelling glow dot tip */}
      {safePct > 0 && (
        <circle
          ref={dotRef}
          cx={arcPoint(startAngle).x}
          cy={arcPoint(startAngle).y}
          r="6"
          fill={color}
          stroke="#ffffff"
          strokeWidth="2.5"
          style={{ opacity: 0, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
        />
      )}

      {/* Travelling Percentage text floating at the sweep level */}
      {isPieChartDial && safePct > 0 && (
        <text
          ref={pctTextRef}
          x={cx + (r + 15) * Math.cos(toRad(startAngle))}
          y={cy + (r + 15) * Math.sin(toRad(startAngle)) + 3.5}
          textAnchor="middle"
          style={{
            fill: color,
            fontSize: '16px',
            fontWeight: '600',
            opacity: 0,
            fontFamily: "'Outfit', sans-serif"
          }}
        >
          {pct}%
        </text>
      )}

      {/* Center value layout */}
      {isPieChartDial ? (
        <>
          {/* Centered Large Count Number inside circle, sublabel text removed */}
          <text x={cx} y={cy + 6} textAnchor="middle" style={{ fill: 'var(--text-main)', fontSize: '32px', fontWeight: '500', fontFamily: "'Outfit', sans-serif" }}>{count}</text>
        </>
      ) : (
        <>
          <text x={cx} y={cy + 0}  textAnchor="middle" className="gauge-val">{value}</text>
          <text x={cx} y={cy + 22} textAnchor="middle" className="gauge-sub">{sublabel}</text>
        </>
      )}
    </svg>
  );
}

/* ============================================================
   PieChartTab – 10 Circle Dials for Before & After metrics
   ============================================================ */
function PieChartTab() {
  const [activeSubTab, setActiveSubTab] = useState('before');

  const fmt = (v) => {
    if (v === null || v === undefined) return '–';
    return typeof v === 'number' ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : v;
  };

  // Consistent blue for Before, consistent green for After
  const BEFORE_COLORS = ['#60a5fa', '#60a5fa', '#60a5fa', '#60a5fa', '#60a5fa'];
  const AFTER_COLORS  = ['#34d399', '#34d399', '#34d399', '#34d399', '#34d399'];

  return (
    <div className="pie-tab-layout">
      {/* Sidebar on the Left */}
      <aside className="pie-sidebar">
        <div className="sidebar-group-title">Scenario</div>
        <div className="sidebar-buttons">
          <button
            className={`sidebar-btn btn-before ${activeSubTab === 'before' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('before')}
          >
            <span className="btn-indicator before-dot"></span>
            <span className="btn-title">Before</span>
          </button>
          
          <button
            className={`sidebar-btn btn-after ${activeSubTab === 'after' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('after')}
          >
            <span className="btn-indicator after-dot"></span>
            <span className="btn-title">After</span>
          </button>
        </div>
      </aside>

      {/* Main content area on the Right */}
      <div className="pie-content">
        {activeSubTab === 'before' ? (
          /* ── BEFORE STATES PANEL ── */
          <section className="pie-section before-section">
            <div className="pie-section-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="section-meta-pill">Total Cost: ${fmt(BEFORE_TOTAL_COST)}M</div>
                  <div className="section-meta-pill" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>Projects: {BEFORE_PROFITS}</div>
                </div>
              </div>
            </div>

            {/* 5 Speedometers for Before */}
            <div className="pie-grid">
              {BEFORE_PROJECTS.map((item, idx) => {
                const color = BEFORE_COLORS[idx % BEFORE_COLORS.length];
                return (
                  <div key={item.type} className="pie-card before-card" style={{ '--accent-color': color }}>
                    <div className="pie-card-header">
                      <span className="pie-card-title">{item.type}</span>
                    </div>
                    <div className="pie-card-body">
                      <GaugeChart
                        isPieChartDial={true}
                        pct={item.percent}
                        count={item.count}
                        sublabel="before_count"
                        color={color}
                        label={item.type}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : (
          /* ── AFTER STATES PANEL ── */
          <section className="pie-section after-section">
            <div className="pie-section-header">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div className="section-meta-pill">Total Cost: ${fmt(AFTER_TOTAL_COST)}M</div>
                  <div className="section-meta-pill" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>Projects: {AFTER_PROFITS}</div>
                </div>
              </div>
            </div>

            {/* 5 Speedometers for After */}
            <div className="pie-grid">
              {AFTER_PROJECTS.map((item, idx) => {
                const color = AFTER_COLORS[idx % AFTER_COLORS.length];
                return (
                  <div key={item.type} className="pie-card after-card" style={{ '--accent-color': color }}>
                    <div className="pie-card-header">
                      <span className="pie-card-title">{item.type}</span>
                    </div>
                    <div className="pie-card-body">
                      <GaugeChart
                        isPieChartDial={true}
                        pct={item.percent}
                        count={item.count}
                        sublabel="after_count"
                        color={color}
                        label={item.type}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ReportTab – Excel Forecast Dropdown Selector + Speedometer + Table
   ============================================================ */
function ReportTab() {
  const { sources, rows, totals, loading, error } = useRevenueData();
  const [selectedRevenue, setSelectedRevenue] = useState('');

  // Auto-select first dynamic source once dataset completes loading
  useEffect(() => {
    if (sources.length > 0 && !selectedRevenue) {
      setSelectedRevenue(sources[0]);
    }
  }, [sources, selectedRevenue]);

  const fmt = (v) => {
    if (v === null || v === undefined) return '–';
    return typeof v === 'number' ? v.toFixed(2) : v;
  };

  const fmtPct = (v) => {
    if (v === null || v === undefined) return '–';
    return typeof v === 'number' ? v.toFixed(2) + '%' : v;
  };

  const utilClass = (pct) => {
    if (pct >= 100) return 'util-full';
    if (pct >= 50) return 'util-partial';
    return 'util-low';
  };

  if (loading) {
    return (
      <div className="report-loading">
        <div className="report-spinner" />
        <p>Loading revenue_forecast.xlsx dynamically…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-loading">
        <p className="report-error">⚠️ Failed to load revenue spreadsheet: {error.message}</p>
      </div>
    );
  }

  const selectedData = rows.map(row => ({
    year: row.year,
    vals: row[selectedRevenue] || [0, 0, 0, 0],
  }));

  const totalVals = totals[selectedRevenue] || [0, 0, 0, 0];

  return (
    <div className="report-tab">
      <div className="report-section utilization-section">
        {/* Dynamic Controls Header Banner */}
        <div className="report-section-header">
          <span className="report-section-badge util-badge">DYNAMIC REPORTS</span>
          <div className="util-header-row">
            <h2 className="report-section-title">Revenue Source</h2>
            <div className="dropdown-wrapper">
              <label className="dropdown-label" htmlFor="revenue-select"></label>
              <select
                id="revenue-select"
                className="revenue-dropdown"
                value={selectedRevenue}
                onChange={e => setSelectedRevenue(e.target.value)}
              >
                {sources.map(src => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Dynamic speedometer dials for the picked source */}
        <div className="gauge-grid">
          {[
            {
              id: 'orig',
              label: 'Original',
              value: `$${Math.round(totalVals[0])}M`,
              sublabel: '',
              pct: 100,
              color: '#a78bfa',
            },
            {
              id: 'yoe',
              label: '90% Cap',
              value: `$${Math.round(totalVals[1])}M`,
              sublabel: '',
              pct: totalVals[0] > 0 ? (totalVals[1] / totalVals[0]) * 100 : 0,
              color: '#a78bfa',
            },
            {
              id: 'prog',
              label: 'Programmed',
              value: `$${Math.round(totalVals[2])}M`,
              sublabel: '',
              pct: totalVals[0] > 0 ? (totalVals[2] / totalVals[0]) * 100 : 0,
              color: '#a78bfa',
            },
            {
              id: 'util',
              label: 'Utilization',
              value: `${totalVals[3].toFixed(1)}`,
              sublabel: '',
              pct: totalVals[3],
              color: '#a78bfa',
            },
          ].map((g) => (
            <div key={g.id} className="gauge-card">
              <div className="pie-card-header">
                <span className="pie-card-title">{g.label}</span>
              </div>
              <GaugeChart
                pct={g.pct}
                value={g.value}
                sublabel={g.sublabel}
                color={g.color}
              />
            </div>
          ))}
        </div>

        {/* Dynamic Forecast Grid Table */}
        <div className="report-table-wrapper util-table-wrapper">
          <table className="report-table util-table">
            <thead>
              <tr>
                <th className="col-year">Year</th>
                <th className="col-sub">Original</th>
                <th className="col-sub">90% Cap</th>
                <th className="col-sub">Programmed</th>
                <th className="col-sub col-util">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {selectedData.map((row, idx) => {
                const [orig, yoe, prog, util] = row.vals;
                return (
                  <tr key={row.year} className={idx % 2 === 0 ? 'row-even' : 'row-odd'}>
                    <td className="col-year-cell">{row.year}</td>
                    <td className="data-cell">{fmt(orig)}</td>
                    <td className="data-cell">{fmt(yoe)}</td>
                    <td className="data-cell">{fmt(prog)}</td>
                    <td className={`data-cell util-cell`}>
                      <div className="util-gauge-inline">
                        <span className="util-pct-text" style={{ color: '#a78bfa' }}>{fmtPct(util)}</span>
                        <svg viewBox="0 0 100 12" className="util-arc-bar" aria-hidden="true">
                          <rect x="0" y="4" width="100" height="4" rx="2" fill="rgba(255,255,255,0.05)" />
                          <rect
                            x="0" y="4"
                            width={Math.min(util, 100)}
                            height="4" rx="2"
                            fill="#a78bfa"
                          />
                        </svg>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* TOTAL ROW */}
              <tr className="row-total">
                <td className="col-year-cell total-label">TOTAL</td>
                <td className="data-cell total-cell">{fmt(totalVals[0])}</td>
                <td className="data-cell total-cell">{fmt(totalVals[1])}</td>
                <td className="data-cell total-cell">{fmt(totalVals[2])}</td>
                <td className="data-cell total-cell util-cell">
                  <div className="util-gauge-inline">
                    <span className="util-pct-text" style={{ color: '#a78bfa' }}>{fmtPct(totalVals[3])}</span>
                    <svg viewBox="0 0 100 12" className="util-arc-bar" aria-hidden="true">
                      <rect x="0" y="4" width="100" height="4" rx="2" fill="rgba(255,255,255,0.05)" />
                      <rect
                        x="0" y="4"
                        width={Math.min(totalVals[3], 100)}
                        height="4" rx="2"
                        fill="#a78bfa"
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   App – Main layout wrapping Tabs (Pie Chart and Reports)
   ============================================================ */
function App() {
  const [activeTab, setActiveTab] = useState('pie');

  return (
    <div className="app-layout">
      {/* Header Navigation bar */}
      <nav className="app-navbar">
        <div className="navbar-brand">
          CLRP-2050 Summary Report
        </div>
        <div className="nav-tabs">
          <button
            id="tab-pie"
            className={`nav-tab ${activeTab === 'pie' ? 'nav-tab-active' : ''}`}
            onClick={() => setActiveTab('pie')}
          >
            Allocation
          </button>
          <button
            id="tab-report"
            className={`nav-tab ${activeTab === 'report' ? 'nav-tab-active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            Utilization
          </button>
        </div>
      </nav>

      {/* Main Content panes */}
      {activeTab === 'pie' && (
        <main className="app-container pie-container">
          <PieChartTab />
        </main>
      )}

      {activeTab === 'report' && (
        <main className="app-container report-container">
          <ReportTab />
        </main>
      )}
    </div>
  );
}

export default App;
