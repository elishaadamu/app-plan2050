import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const DATA = {
  1: {
    title: "1 Universe of Projects",
    items: [
      "VTrans needs",
      "Comprehensive plans and SYIP",
      "Multimodal studies",
      "Unselected SMART SCALE, STBG/CMAQ, and TAP projects",
      "Unimplemented PLAN2045 projects"
    ],
    colors: ["#9C27B0", "#673AB7", "#03A9F4", "#FFC107", "#8BC34A"],
    nodeColor: "#3B43A8"
  },
  2: {
    title: "2 Regionally Significant",
    items: [
      "Add a travel lane both ways to an arterial, freeway, or interstate",
      "Construct a new arterial",
      "Construct a new freeway interchange",
      "Construct a fixed guideway or heavy rail project"
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
      "Revenue forecast"
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
            <div className="spine-dot" style={{ color, backgroundColor: color }} />
            <div className="bullet-num">{index + 1}</div>
            <div className="bullet-pill" style={{ '--pill-color': color }}>{item}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   App – Flowchart with proper T-junction wiring
   ============================================================ */
function App() {
  const [activeNode, setActiveNode] = useState(null);
  const [lines, setLines] = useState([]);
  const containerRef = useRef(null);
  const nodeRefs = useRef({});

  const setNodeRef = (id, el) => { nodeRefs.current[id] = el; };

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

    // ── 3 → 7: bypass right side ──
    // Exits node 3 right side, goes far right, drops all the way down, enters Vision right side
    if (n3 && n7) {
      const clearX = Math.max(
        n3.right,
        n4 ? n4.right : 0,
        n6 ? n6.right : 0,
        n7.right
      ) + 32;
      newLines.push({
        id: '3-7',
        d: `M ${n3.right} ${n3.cy} L ${clearX} ${n3.cy} L ${clearX} ${n7.cy} L ${n7.right} ${n7.cy}`,
        nodes: [3, 7],
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
      </nav>
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
    </div>
  );
}

export default App;
