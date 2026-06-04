import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { useRevenueData } from './useRevenueData';
import { BEFORE_PROJECTS, BEFORE_TOTAL_COST, BEFORE_PROFITS, AFTER_PROJECTS, AFTER_TOTAL_COST, AFTER_PROFITS } from './pieChartData';

const DATA = {
  1: {
    title: "1 Universe of Projects",
    items: [
      "VTrans needs",
      "Comprehensive plans",
      "Multimodal studies",
      "Unselected projects (smart scale, STBG/CMAQ, TAP)",
      "Unimplemented PLAN2045 projects",
      "Staff Input"
    ],
    colors: ["#9C27B0", "#673AB7", "#03A9F4", "#FFC107", "#8BC34A", "#FF6B6B"],
    nodeColor: "#3B43A8"
  },
  2: {
    title: "2 Regionally Significant",
    items: [
      "Travel Lane AFI",
      "New arterial",
      "New freeway interchange",
      "Fixed guideway or heavy rail"
    ],
    colors: ["#E91E63", "#00BCD4", "#4CAF50", "#FF9800"],
    nodeColor: "#5B9B4C"
  },
  3: {
    title: "3 Non-Regionally Significant",
    items: [
      "Everything not RS"
    ],
    colors: ["#3F51B5"],
    nodeColor: "#82268C"
  },
  4: {
    title: "4 Scored (Project Scoring)",
    items: [
      "STBG/CMAQ scoring",
      "PLAN2045",
      "SMART SCALE"
    ],
    colors: ["#009688", "#E91E63", "#FFC107"],
    nodeColor: "#3B43A8"
  },
  5: {
    title: "5 Fiscally Constrained",
    items: [
      "Scored projects",
      "Revenue forecast",
      "SYIP",
    ],
    colors: ["#8BC34A", "#03A9F4"],
    nodeColor: "#5B9B4C"
  },
  6: {
    title: "Unfunded RS Projects",
    items: [
      "No specific constraints listed"
    ],
    colors: ["#9E9E9E"],
    nodeColor: "#555"
  },
  7: {
    title: "6 Vision",
    items: [
      "Regionally Significant",
      "Non-Regionally Significant"
    ],
    colors: ["#F44336", "#9C27B0"],
    nodeColor: "#CA2C44"
  }
};

const NODE_GLOW_COLORS = {
  1: 'rgba(80,90,200,0.7)',
  2: 'rgba(100,180,80,0.7)',
  3: 'rgba(160,50,170,0.7)',
  4: 'rgba(80,90,200,0.7)',
  5: 'rgba(100,180,80,0.7)',
  6: 'rgba(120,120,130,0.7)',
  7: 'rgba(220,60,80,0.7)',
};

const STEP_LABELS = {
  1: 'STEP 01', 2: 'STEP 02', 3: 'STEP 03',
  4: 'STEP 04', 5: 'STEP 05', 6: '', 7: 'STEP 06',
};

const NODE_COLOR_CLASS = {
  1: 'color-blue', 2: 'color-green', 3: 'color-purple',
  4: 'color-blue', 5: 'color-green', 6: 'color-gray', 7: 'color-red',
};

/* ============================================================
   DetailsInfographic – hub + fanning branch curves + cards
   ============================================================ */
function DetailsInfographic({ data }) {
  const svgRef = useRef(null);
  const count = data.items.length;

  // Hub is fully visible, no clipping
  const hubLeft = 24;
  const hubSize = 160;
  const hubEdgeX = hubLeft + hubSize + 8; // right edge of hub circle

  // Calculate item positions (vertical fan with subtle crescent)
  const getPositions = () => {
    const positions = [];
    const centerY = 50;

    if (count === 1) {
      positions.push({ dotX: 300, y: 50 });
    } else {
      const spreadY = Math.min(72, (count - 1) * 16);
      const startY = centerY - spreadY / 2;
      const stepY = spreadY / (count - 1);
      const baseX = 270;
      const curveDepth = 40;

      for (let i = 0; i < count; i++) {
        const y = startY + i * stepY;
        const mid = (count - 1) / 2;
        const norm = mid === 0 ? 0 : (i - mid) / mid;
        const stagger = Math.cos(norm * Math.PI / 3) * curveDepth;
        positions.push({ dotX: baseX + stagger, y });
      }
    }
    return positions;
  };

  const positions = getPositions();

  // Build individual cubic-bezier branch curves from hub to each dot
  const buildBranches = (containerW, containerH) => {
    const startX = hubEdgeX;
    const startY = containerH / 2;
    return positions.map(pos => {
      const dotX = pos.dotX;
      const dotY = (pos.y / 100) * containerH;
      // cp1: exit hub horizontally to the right
      const cp1X = startX + (dotX - startX) * 0.5;
      const cp1Y = startY;
      // cp2: arrive at dot horizontally from the left
      const cp2X = startX + (dotX - startX) * 0.5;
      const cp2Y = dotY;
      return `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${dotX} ${dotY}`;
    });
  };

  // Update branches when container resizes
  useEffect(() => {
    const updateBranches = () => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const branches = buildBranches(rect.width, rect.height);
      const pathEls = svg.querySelectorAll('.branch-path');
      branches.forEach((d, i) => {
        if (pathEls[i]) pathEls[i].setAttribute('d', d);
      });
    };
    updateBranches();
    const observer = new ResizeObserver(updateBranches);
    if (svgRef.current) observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, []);

  // Arc segments around hub
  const arcColors = data.colors.slice(0, Math.min(6, data.colors.length));
  const arcSegments = arcColors.map((color, i) => {
    const total = arcColors.length;
    const arcSpan = 180;
    const gap = total > 1 ? 6 : 0;
    const segAngle = (arcSpan - gap * (total - 1)) / total;
    const startAngle = -90 + i * (segAngle + gap);
    const endAngle = startAngle + segAngle;
    const r = 86;
    const cx = 92, cy = 92;
    const x1 = cx + r * Math.cos((startAngle * Math.PI) / 180);
    const y1 = cy + r * Math.sin((startAngle * Math.PI) / 180);
    const x2 = cx + r * Math.cos((endAngle * Math.PI) / 180);
    const y2 = cy + r * Math.sin((endAngle * Math.PI) / 180);
    const largeArc = segAngle > 180 ? 1 : 0;
    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
        stroke={color}
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
    );
  });

  return (
    <div className="infographic-container">
      {/* Orbital rings */}
      <div className="orbital-ring orbital-ring-1" />
      <div className="orbital-ring orbital-ring-2" />

      {/* Hub */}
      <div className="hub-circle">
        <span className="hub-title">{data.title.replace(/^\d+\s*/, '').toUpperCase()}</span>
      </div>

      {/* Colored arcs */}
      <svg className="hub-arcs" viewBox="0 0 184 184">{arcSegments}</svg>

      {/* Branch curves SVG */}
      <svg className="spine-svg" ref={svgRef}>
        {positions.map((_, i) => (
          <path key={i} className="branch-path" d="" />
        ))}
      </svg>

      {/* Bullet cards */}
      {data.items.map((item, index) => {
        const color = data.colors[index % data.colors.length];
        const pos = positions[index];
        return (
          <div
            key={index}
            className="bullet-row"
            style={{
              top: `${pos.y}%`,
              left: `${pos.dotX - 5}px`,
              animationDelay: `${index * 0.1}s`,
            }}
          >
            {data.title !== "6 Vision" && (
              <div className="spine-dot" style={{ color, backgroundColor: color }} />
            )}
            <div className="bullet-num">{index + 1}</div>
            <div className="bullet-pill" style={{ '--pill-color': color }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   GaugeChart – SVG arc speedometer dial
   ============================================================ */
function GaugeChart({ pct = 0, value = '', sublabel = '', label = '', color = '#6c8ef5', isPieChartDial = false, count = 0 }) {
  const arcRef  = useRef(null);
  const dotRef  = useRef(null);
  const pctTextRef = useRef(null);
  const raf     = useRef(null);

  const cx = 80, cy = 80, r = 58;
  const startAngle = 150;   // degrees — bottom-left
  const sweepAngle = 240;   // total gauge span

  const toRad     = (deg) => (deg * Math.PI) / 180;
  const arcPoint  = (angle) => ({
    x: cx + r  * Math.cos(toRad(angle)),
    y: cy + r  * Math.sin(toRad(angle)),
  });

  const safePct   = Math.min(Math.max(pct, 0), 100);
  const fillAngle = startAngle + (sweepAngle * safePct) / 100;
  const fillArcLen = r * toRad(sweepAngle * safePct / 100);

  const describeArc = (fromDeg, toDeg) => {
    const s = arcPoint(fromDeg);
    const e = arcPoint(toDeg);
    const large = (toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const ri = 48;
  const describeRingArc = (fromDeg, toDeg) => {
    const s = { x: cx + ri * Math.cos(toRad(fromDeg)), y: cy + ri * Math.sin(toRad(fromDeg)) };
    const e = { x: cx + ri * Math.cos(toRad(toDeg)),   y: cy + ri * Math.sin(toRad(toDeg)) };
    const large = (toDeg - fromDeg) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${ri} ${ri} 0 ${large} 1 ${e.x} ${e.y}`;
  };

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
      <path
        d={describeArc(startAngle, startAngle + sweepAngle)}
        fill="none"
        stroke="var(--gauge-track, rgba(255,255,255,0.08))"
        strokeWidth="10"
        strokeLinecap="round"
      />

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

      <path
        d={describeRingArc(startAngle, startAngle + sweepAngle)}
        fill="none"
        stroke="var(--gauge-ring, rgba(255,255,255,0.03))"
        strokeWidth="2"
        strokeLinecap="round"
      />

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

      {isPieChartDial ? (
        <>
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

  const BEFORE_COLORS = ['#60a5fa', '#60a5fa', '#60a5fa', '#60a5fa', '#60a5fa'];
  const AFTER_COLORS  = ['#34d399', '#34d399', '#34d399', '#34d399', '#34d399'];

  return (
    <>
      <div className="pie-tab-layout">
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

        <div className="pie-content">
          {activeSubTab === 'before' ? (
            <section className="pie-section before-section">
              <div className="pie-section-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="section-meta-pill">Total Cost: ${fmt(BEFORE_TOTAL_COST)}M</div>
                    <div className="section-meta-pill" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>Projects: {BEFORE_PROFITS}</div>
                  </div>
                </div>
              </div>

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
            <section className="pie-section after-section">
              <div className="pie-section-header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="section-meta-pill">Total Cost: ${fmt(AFTER_TOTAL_COST)}M</div>
                    <div className="section-meta-pill" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>Projects: {AFTER_PROFITS}</div>
                  </div>
                </div>
              </div>

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

      <section className="key-changes-section">
        <h3 className="key-changes-title">Key Changes</h3>
        
        <div className="key-changes-grid">
          {/* Left: Metrics Table */}
          <div className="key-changes-card metrics-card">
            <h4 className="card-subtitle">Metric Comparison</h4>
            <div className="metrics-table-wrapper">
              <table className="metrics-comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Before</th>
                    <th>After</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric-name">Total Cost</td>
                    <td>$1,241</td>
                    <td>$710</td>
                    <td className="metric-change negative">-$532</td>
                  </tr>
                  <tr>
                    <td className="metric-name">Total # of Projects</td>
                    <td>116</td>
                    <td>66</td>
                    <td className="metric-change negative">-43%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Shifts Categories */}
          <div className="shifts-card-container">
            <div className="shift-category-card dropped-card">
              <div className="shift-header">
                <span className="shift-badge badge-dropped">Dropped</span>
              </div>
              <ul className="shift-list">
                <li>Shared Use Path</li>
                <li>BikePed improvements</li>
              </ul>
            </div>

            <div className="shift-category-card maintained-card">
              <div className="shift-header">
                <span className="shift-badge badge-maintained">Maintained</span>
              </div>
              <ul className="shift-list">
                <li>Interchange Modification</li>
                <li>Road Widening</li>
                <li>Multimodal improvements</li>
              </ul>
            </div>

            <div className="shift-category-card emerging-card">
              <div className="shift-header">
                <span className="shift-badge badge-emerging">Emerging</span>
              </div>
              <ul className="shift-list">
                <li>Operational & Safety Improvements</li>
                <li>Replacement/Rehabilitation</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================================================
   ReportTab – Excel Forecast Dropdown Selector + Speedometer + Table
   ============================================================ */
function ReportTab() {
  const { sources, rows, totals, loading, error } = useRevenueData();
  const [selectedRevenue, setSelectedRevenue] = useState('');

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
        <div className="report-section-header">
          <span className="report-section-badge">DYNAMIC REPORTS</span>
          <div className="util-header-row">
            <h2 className="report-section-title">Revenue Source</h2>
            <div className="dropdown-wrapper">
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
              value: `${totalVals[3].toFixed(1)}%`,
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

        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th className="col-year">Year</th>
                <th>Original</th>
                <th>90% Cap</th>
                <th>Programmed</th>
                <th>Utilization</th>
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
                    <td className="data-cell">
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
              <tr className="row-total">
                <td className="col-year-cell total-label">TOTAL</td>
                <td className="data-cell total-cell">{fmt(totalVals[0])}</td>
                <td className="data-cell total-cell">{fmt(totalVals[1])}</td>
                <td className="data-cell total-cell">{fmt(totalVals[2])}</td>
                <td className="data-cell total-cell">
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
   App – Flowchart with proper T-junction wiring
   ============================================================ */
function App() {
  const [activeNode, setActiveNode] = useState(null);
  const [lines, setLines] = useState([]);
  const [activeBottomTab, setActiveBottomTab] = useState('pie');
  const containerRef = useRef(null);
  const nodeRefs = useRef({});
  const scrollContainerRef = useRef(null);

  const setNodeRef = (id, el) => { nodeRefs.current[id] = el; };

  const handleTabClick = (tabName) => {
    setActiveBottomTab(tabName);
    if (scrollContainerRef.current) {
      const flowchartEl = scrollContainerRef.current.querySelector('.app-container');
      if (flowchartEl) {
        scrollContainerRef.current.scrollTo({
          top: flowchartEl.offsetHeight,
          behavior: 'smooth'
        });
      }
    }
  };

  const calculateLines = useCallback(() => {
    const cr = containerRef.current;
    if (!cr) return;
    // Use the SVG overlay's bounding rect as the coordinate space for paths.
    // This is more robust when the container is scaled or transformed on mobile.
    const svgEl = cr.querySelector('.lines-svg');
    const cRect = svgEl ? svgEl.getBoundingClientRect() : cr.getBoundingClientRect();
    const newLines = [];

    // Helper: get node bounding rect relative to container
    const nr = (id) => {
      const el = nodeRefs.current[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        cx: r.left + r.width / 2 - cRect.left,
        top: r.top - cRect.top,
        bottom: r.bottom - cRect.top,
        left: r.left - cRect.left,
        right: r.right - cRect.left,
        cy: r.top + r.height / 2 - cRect.top,
      };
    };

    const n1 = nr(1), n2 = nr(2), n3 = nr(3), n4 = nr(4);
    const n5 = nr(5), n6 = nr(6), n7 = nr(7);

    // ── 1 → {2, 3}: T-junction ──
    // Vertical stem from 1's bottom, horizontal crossbar, vertical drops into 2 and 3
    if (n1 && n2 && n3) {
      const midY = (n1.bottom + n2.top) / 2;
      // Shared vertical stem
      newLines.push({
        id: '1-stem',
        d: `M ${n1.cx} ${n1.bottom} L ${n1.cx} ${midY}`,
        nodes: [1, 2, 3],
      });
      // Left branch → node 2
      newLines.push({
        id: '1-2',
        d: `M ${n1.cx} ${midY} L ${n2.cx} ${midY} L ${n2.cx} ${n2.top}`,
        nodes: [1, 2],
      });
      // Right branch → node 3
      newLines.push({
        id: '1-3',
        d: `M ${n1.cx} ${midY} L ${n3.cx} ${midY} L ${n3.cx} ${n3.top}`,
        nodes: [1, 3],
      });
    }

    // ── 2 → 4: straight vertical ──
    if (n2 && n4) {
      newLines.push({
        id: '2-4',
        d: `M ${n2.cx} ${n2.bottom} L ${n2.cx} ${n4.top}`,
        nodes: [2, 4],
      });
    }

    // ── 3 → 4: straight vertical ──
    if (n3 && n4) {
      newLines.push({
        id: '3-4',
        d: `M ${n3.cx} ${n3.bottom} L ${n3.cx} ${n4.top}`,
        nodes: [3, 4],
      });
    }

    // ── 4 → {5, 6}: T-junction ──
    if (n4 && n5 && n6) {
      const midY = (n4.bottom + n5.top) / 2;
      newLines.push({
        id: '4-stem',
        d: `M ${n4.cx} ${n4.bottom} L ${n4.cx} ${midY}`,
        nodes: [4, 5, 6],
      });
      newLines.push({
        id: '4-5',
        d: `M ${n4.cx} ${midY} L ${n5.cx} ${midY} L ${n5.cx} ${n5.top}`,
        nodes: [4, 5],
      });
      newLines.push({
        id: '4-6',
        d: `M ${n4.cx} ${midY} L ${n6.cx} ${midY} L ${n6.cx} ${n6.top}`,
        nodes: [4, 6],
      });
    }

    // ── 6 → 7: straight vertical (NFC → Vision) ──
    if (n6 && n7) {
      newLines.push({
        id: '6-7',
        d: `M ${n6.cx} ${n6.bottom} L ${n7.cx} ${n7.top}`,
        nodes: [6, 7],
      });
    }

    setLines(newLines);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(() => calculateLines());
    observer.observe(containerRef.current);
    Object.values(nodeRefs.current).forEach(n => { if (n) observer.observe(n); });
    calculateLines();
    const timer = setTimeout(calculateLines, 150);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, [activeNode, calculateLines]);

  const activeData = activeNode ? DATA[activeNode] : null;
  const glowColor = activeNode ? NODE_GLOW_COLORS[activeNode] : null;

  // Manual text for clean line breaks
  const nodeTexts = {
    1: <>Universe of<br />Projects</>,
    2: <>Regionally<br />Significant</>,
    3: <>Non-Regionally<br />Significant</>,
    4: <>Scored</>,
    5: <>Fiscally<br />Constrained</>,
    6: <>Not-Fiscally<br />Constrained</>,
    7: <>Vision</>,
  };

  const renderNode = (id) => {
    const colorClass = NODE_COLOR_CLASS[id];
    return (
      <button
        ref={(el) => setNodeRef(id, el)}
        className={`node ${colorClass} ${id === 4 ? 'node-wide' : ''} ${activeNode === id ? 'active' : ''}`}
        onClick={() => setActiveNode(activeNode === id ? null : id)}
      >
        <span className="node-text">{nodeTexts[id]}</span>
      </button>
    );
  };

  return (
    <div className="app-layout">
      <nav className="app-navbar">
        <div className="navbar-brand">
          PLAN2050 <span>PROJECT DEVELOPMENT PROCESS</span>
        </div>
        <div className="navbar-actions">
          <a
            href="https://tac-clrp-2050.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="external-link"
          >
            <span>view external CLRP-2050 Summary Report</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="external-link-icon">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>
      </nav>
      
      <div className="app-content-scrollable" ref={scrollContainerRef}>
        <main className="app-container">
          {/* ── Left Pane: Flowchart ── */}
          <section className="flowchart-pane">
            <div className="flowchart-container" ref={containerRef}>
              <div className="row">{renderNode(1)}</div>
              <div className="row">{renderNode(2)}{renderNode(3)}</div>
              <div className="row">{renderNode(4)}</div>
              <div className="row">{renderNode(5)}{renderNode(6)}</div>
              {/* Spacer positions Vision directly under NFC */}
              <div className="row">
                <div className="spacer-node" />
                {renderNode(7)}
              </div>
              {/* SVG connector lines */}
              <svg className="lines-svg">
                {lines.map(line => {
                    const isActive = activeNode != null && line.nodes.includes(activeNode);
                    return (
                      <path
                        key={line.id}
                        d={line.d}
                      className={`svg-line ${isActive ? 'active-line' : ''}`}
                      style={isActive ? { '--line-color': glowColor } : undefined}
                      />
                    );
                })}
              </svg>
            </div>
          </section>

          {/* ── Right Pane: Details ── */}
          <section className="details-pane">
            {!activeData && (
              <div className="details-empty">
                <div className="hint-icon">👆</div>
                <h2>Select a node</h2>
                <p>Click any box in the flowchart to explore its details.</p>
              </div>
            )}
            {activeData && (
              <DetailsInfographic key={activeNode} data={activeData} />
            )}
          </section>
        </main>

        {/* ── Bottom Section: Tabs (Pie Chart and Reports) ── */}
        <section className="tabs-section">
          <h2 className="tabs-section-main-title">CLRP-2050 Summary Report</h2>
          <div className="tabs-header-container">
            <div className="tabs-navigation">
              <button
                className={`tab-btn ${activeBottomTab === 'pie' ? 'tab-btn-active' : ''}`}
                onClick={() => handleTabClick('pie')}
              >
                PieChart
              </button>
              <button
                className={`tab-btn ${activeBottomTab === 'report' ? 'tab-btn-active' : ''}`}
                onClick={() => handleTabClick('report')}
              >
                Report
              </button>
            </div>
          </div>
          <div className="tabs-content-container">
            {activeBottomTab === 'pie' && <PieChartTab />}
            {activeBottomTab === 'report' && <ReportTab />}
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
