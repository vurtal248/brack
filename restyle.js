const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace fonts and styles
const styleStart = html.indexOf('<link rel="preconnect" href="https://fonts.googleapis.com"');
const styleEnd = html.indexOf('</style>') + 8;

if (styleStart === -1 || styleEnd === 7) {
  console.log("Could not find style block");
  process.exit(1);
}

const newStyles = `<link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Chivo+Mono:wght@300;400;500;700&family=Chivo:ital,wght@0,400;0,500;0,600;0,700;0,900;1,400;1,500&display=swap" rel="stylesheet" />
  <style>
    /* ============================================================
       MINIMALIST DESIGN TOKENS
    ============================================================ */
    :root {
      color-scheme: light dark;
      --bg: light-dark(oklch(0.98 0 0), oklch(0.1 0 0));
      --bg-2: light-dark(oklch(1 0 0), oklch(0.13 0 0));
      --bg-3: light-dark(oklch(0.95 0 0), oklch(0.18 0 0));
      --border: light-dark(oklch(0.85 0 0), oklch(0.25 0 0));
      --border-hi: light-dark(oklch(0.7 0 0), oklch(0.35 0 0));
      --text: light-dark(oklch(0.2 0 0), oklch(0.9 0 0));
      --text-dim: light-dark(oklch(0.45 0 0), oklch(0.6 0 0));
      --accent: light-dark(oklch(0.4 0.1 260), oklch(0.7 0.1 260));
      --accent-dim: light-dark(oklch(0.95 0.02 260), oklch(0.2 0.05 260));
      --win: light-dark(oklch(0.5 0.1 150), oklch(0.85 0.1 150));
      --win-glow: light-dark(oklch(0.94 0.05 150), oklch(0.18 0.05 150));
      --elim-text: var(--text-dim);
      --danger: light-dark(oklch(0.5 0.15 25), oklch(0.7 0.15 25));
      --danger-dim: light-dark(oklch(0.95 0.05 25), oklch(0.2 0.05 25));
      --radius: 2px;
      --radius-lg: 4px;
      --font-display: 'Chivo', sans-serif;
      --font-mono: 'Chivo Mono', monospace;
      --transition: 0.1s linear;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; scroll-behavior: smooth; }
    body { background: var(--bg); color: var(--text); font-family: var(--font-mono); font-size: 0.875rem; line-height: 1.6; min-height: 100dvh; overflow-x: hidden; }
    button { cursor: pointer; font-family: var(--font-display); border: none; background: none; }
    input, select, textarea { font-family: var(--font-mono); font-size: 0.875rem; background: var(--bg-2); color: var(--text); border: 1px solid var(--border); border-radius: var(--radius); padding: 0.5rem 0.75rem; width: 100%; outline: none; transition: border-color var(--transition); }
    input:focus, select:focus { border-color: var(--text); }
    select option { background: var(--bg-2); }
    .page { display: none; }
    .page.active { display: block; }

    /* LAYOUT & HEADER */
    .app-header { position: sticky; top: 0; z-index: 100; background: var(--bg); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; padding: 0 2rem; height: 50px; }
    .logo { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text); display: flex; align-items: center; gap: 0.5rem; }
    .logo-bracket { color: var(--text-dim); }
    .logo-dot { display: none; }

    /* BUTTONS */
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.4rem 1rem; border-radius: var(--radius); font-weight: 600; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; transition: all var(--transition); white-space: nowrap; border: 1px solid transparent; }
    .btn-primary { background: var(--text); color: var(--bg); }
    .btn-primary:hover { opacity: 0.85; }
    .btn-ghost { color: var(--text); border: 1px solid var(--border); background: var(--bg-2); }
    .btn-ghost:hover { border-color: var(--text); }
    .btn-danger { color: var(--danger); border: 1px solid transparent; background: transparent; padding: 0.4rem 0.75rem; font-size: 0.8rem; }
    .btn-danger:hover { background: var(--danger-dim); border-color: var(--danger); }
    .btn-icon { padding: 0.4rem; border-radius: var(--radius); display: inline-flex; align-items: center; justify-content: center; }
    .btn-icon:hover { background: var(--bg-3); }

    /* HOME */
    .home-wrap { max-width: 1000px; margin: 0 auto; padding: 3rem 2rem; }
    .home-hero { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2.5rem; gap: 1rem; flex-wrap: wrap; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
    .home-hero-title { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.5rem, 3vw, 2.5rem); text-transform: uppercase; line-height: 1; letter-spacing: 0.02em; }
    .home-hero-title em { font-style: normal; color: var(--text-dim); }
    .home-hero-sub { color: var(--text-dim); font-size: 0.75rem; margin-top: 0.5rem; text-transform: uppercase; }

    .brackets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .bracket-card { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; cursor: pointer; transition: border-color var(--transition); position: relative; }
    .bracket-card:hover { border-color: var(--text); }
    .card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
    .card-name { font-family: var(--font-display); font-weight: 600; font-size: 1rem; text-transform: uppercase; letter-spacing: 0.02em; line-height: 1.2; flex: 1; }
    .card-actions { display: flex; gap: 0.25rem; position: relative; z-index: 1; }
    .card-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    
    .tag-pill, .status-pill { font-size: 0.65rem; font-family: var(--font-mono); font-weight: 700; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: var(--radius); border: 1px solid var(--border); }
    .status-pill.seeding { background: var(--bg-3); color: var(--text); }
    .status-pill.active { background: var(--accent-dim); color: var(--accent); border-color: var(--accent); }
    .status-pill.complete { background: var(--win-glow); color: var(--win); border-color: var(--win); }

    .card-info { display: flex; gap: 1rem; font-size: 0.75rem; color: var(--text-dim); }
    .card-info span { display: flex; align-items: center; gap: 0.3rem; }

    .empty-state { grid-column: 1 / -1; display: flex; flex-direction: column; align-items: flex-start; padding: 3rem 0; gap: 1rem; }
    .empty-icon { display: none; }
    .empty-state h2 { font-family: var(--font-display); font-weight: 600; font-size: 1.2rem; text-transform: uppercase; }
    .empty-state p { color: var(--text-dim); font-size: 0.85rem; max-width: 400px; }

    /* MODAL */
    .modal-backdrop { display: none; position: fixed; inset: 0; background: var(--bg); z-index: 200; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.1s ease; }
    .modal-backdrop.open { display: flex; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem; width: 100%; max-width: 420px; }
    .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.75rem; }
    .modal-title { font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; text-transform: uppercase; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.4rem; }
    .participant-select-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; }
    .count-btn { padding: 0.5rem; border-radius: var(--radius); border: 1px solid var(--border); background: var(--bg-3); color: var(--text-dim); font-weight: 600; font-size: 0.9rem; transition: all var(--transition); }
    .count-btn:hover { border-color: var(--text); color: var(--text); }
    .count-btn.selected { border-color: var(--text); background: var(--text); color: var(--bg); }
    .modal-footer { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem; }

    /* EDITOR */
    .editor-wrap { display: flex; flex-direction: column; min-height: calc(100dvh - 50px); }
    .editor-bar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 2rem; border-bottom: 1px solid var(--border); background: var(--bg); flex-wrap: wrap; gap: 1rem; }
    .editor-bar-left { display: flex; align-items: center; gap: 1rem; }
    .editor-title { font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; text-transform: uppercase; }
    .editor-tag { font-family: var(--font-mono); font-size: 0.65rem; color: var(--text-dim); border: 1px solid var(--border); padding: 0.15rem 0.4rem; border-radius: var(--radius); text-transform: uppercase; }
    .editor-bar-right { display: flex; align-items: center; gap: 0.75rem; }

    .phase-track { display: flex; align-items: center; gap: 0.5rem; }
    .phase-step { font-weight: 700; font-size: 0.65rem; text-transform: uppercase; color: var(--text-dim); }
    .phase-step.active { color: var(--text); text-decoration: underline; text-underline-offset: 4px; }
    .phase-step.done { color: var(--text-dim); text-decoration: line-through; }

    /* CANVAS */
    .bracket-canvas-wrap { flex: 1; overflow: auto; padding: 2rem; display: flex; align-items: flex-start; }
    .bracket-canvas { display: flex; align-items: stretch; gap: 0; min-width: max-content; }
    .round-col { display: flex; flex-direction: column; position: relative; }
    .round-header { font-family: var(--font-display); font-weight: 700; font-size: 0.65rem; text-transform: uppercase; color: var(--text-dim); text-align: left; padding: 0 0.5rem 0.5rem; border-bottom: 1px solid var(--border); margin: 0 0.5rem 1rem; }
    .round-matches { display: flex; flex-direction: column; flex: 1; justify-content: space-around; }
    .round-connector { width: 30px; display: flex; flex-direction: column; justify-content: space-around; flex-shrink: 0; padding-top: 1.8rem; }

    /* MATCH CARD */
    .match-card { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); width: 180px; margin: 0 0.5rem; flex-shrink: 0; }
    .match-slot { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.5rem; cursor: default; min-height: 32px; border-bottom: 1px solid transparent; }
    .match-slot:first-child { border-bottom: 1px solid var(--border); }
    .match-slot.can-pick { cursor: pointer; }
    .match-slot.can-pick:hover { background: var(--bg-2); }
    .match-slot.winner { background: var(--bg-2); border-left: 3px solid var(--win); margin-left: -1px; padding-left: calc(0.5rem - 2px); }
    .match-slot.winner .slot-name { color: var(--win); font-weight: 700; }
    .match-slot.winner .slot-seed { color: var(--win); opacity: 1; }
    .match-slot.eliminated .slot-name { color: var(--text-dim); text-decoration: line-through; }
    .match-slot.empty { opacity: 0.3; }
    
    .slot-seed { font-size: 0.6rem; font-weight: 700; color: var(--text-dim); min-width: 14px; text-align: right; flex-shrink: 0; }
    .slot-name { font-size: 0.75rem; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text); }
    .slot-win-icon { display: none; }

    .seed-input { background: transparent; border: none; font-size: 0.75rem; padding: 0; border-radius: 0; }
    .seed-input:focus { color: var(--text); background: var(--bg-3); padding-left: 0.25rem; }

    /* CHAMPION */
    .champion-col { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 1.5rem; min-width: 160px; }
    .champion-label { font-weight: 700; font-size: 0.65rem; text-transform: uppercase; color: var(--text-dim); margin-bottom: 0.5rem; border-bottom: 1px solid var(--border); padding-bottom: 0.25rem; width: 100%; text-align: center; }
    .champion-card { background: var(--bg); border: 2px solid var(--win); border-radius: var(--radius); padding: 1rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.25rem; min-width: 140px; }
    .champion-trophy { display: none; }
    .champion-name { font-family: var(--font-display); font-weight: 700; font-size: 1rem; text-transform: uppercase; color: var(--win); word-break: break-word; }
    .champion-sub { font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; }

    /* SEEDING BOTTOM BAR */
    .seeding-hint { background: var(--bg); border-top: 1px solid var(--border); padding: 0.75rem 2rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .seeding-hint-text { font-size: 0.75rem; color: var(--text-dim); }
    .seeding-actions { display: flex; gap: 0.5rem; align-items: center; }
    
    .seed-progress-wrap { flex: 1; max-width: 150px; }
    .seed-progress-label { display: flex; justify-content: space-between; font-size: 0.65rem; margin-bottom: 0.2rem; }
    .seed-progress-bar { height: 2px; background: var(--border); }
    .seed-progress-fill { height: 100%; background: var(--text); transition: width 0.2s; }

    /* COMPLETE BANNER */
    .complete-banner { display: none; background: var(--bg-2); border-bottom: 1px solid var(--win); padding: 0.5rem 2rem; align-items: center; justify-content: space-between; }
    .complete-banner.visible { display: flex; }
    .complete-banner-text { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: var(--win); }
    .complete-banner-actions { display: flex; gap: 0.5rem; }

    /* SVG CONNECTORS */
    .bracket-svg-layer { position: absolute; inset: 0; pointer-events: none; overflow: visible; }
    .connector-line { fill: none; stroke: var(--border); stroke-width: 1px; }
    .connector-line.active-path { stroke: var(--win); stroke-width: 1px; }

    /* CONFIRM DIALOG */
    .confirm-dialog { max-width: 380px; }
    .confirm-dialog p { font-size: 0.8rem; margin: 0.5rem 0 1rem; }

    /* SCROLLBAR */
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--border-hi); }
    ::-webkit-scrollbar-thumb:hover { background: var(--text-dim); }

    .hidden { display: none !important; }
    
    @media (max-width: 640px) {
      .app-header { padding: 0 1rem; }
      .home-wrap { padding: 1.5rem 1rem; }
      .editor-bar { padding: 0.5rem 1rem; }
      .bracket-canvas-wrap { padding: 1rem; }
      .seeding-hint { padding: 0.5rem 1rem; }
      .complete-banner { padding: 0.5rem 1rem; }
    }
  </style>`;

html = html.slice(0, styleStart) + newStyles + html.slice(styleEnd);

// Modify JS connector rendering styles
html = html.replace(/const glow =[^;]+;/, "const glow = 'none';");
html = html.replace(/const sw =[^;]+;/, "const sw = topWon || btmWon ? '1.5' : '1';");
html = html.replace(/path\.setAttribute\('stroke-linecap', 'round'\);/, "path.setAttribute('stroke-linecap', 'square');");

// Strip the crownPop animation if present
html = html.replace(/animation:\s*crownPop[^;]+;\s*/, "");

fs.writeFileSync('index.html', html);
console.log('Styles replaced successfully');
