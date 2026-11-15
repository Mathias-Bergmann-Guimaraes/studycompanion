// GKI chapter 2: Lineare Modelle (VL 2, 02.11.2026, Gerhard Neumann) — the data matrix, least
// squares and the normal equation, R², basis functions and overfitting, ridge regression,
// probabilities and Bayes, expectation, Monte Carlo and the Gaussian, and maximum likelihood.
// Exercise sheet 2 (tasks 1 and 2) is worked through in 2.2, 2.6 and 2.8.

/* ---------------------------------------------------------------- 2.1 Formen */

function gkWShapes(root) {
  const { w, fig, read } = ppW(root, "shapes");
  const st = { N: 100, D: 4, dep: 0 };
  const draw = () => {
    lenOut(w, "N", st.N);
    lenOut(w, "D", st.D);
    const cw = 16, hN = 40 + Math.min(st.N, 200) * 0.6, top = 18;
    const blk = (x, cols, rows, h, label, dims, cls, first = false) => `
      <rect x="${x}" y="${top}" width="${cols * cw}" height="${h}" rx="4" class="gk-blk ${cls}"/>
      ${first ? `<rect x="${x}" y="${top}" width="${cw}" height="${h}" rx="4" class="gk-blk gk-ones"/><text x="${x + cw / 2}" y="${top + h / 2 + 4}" text-anchor="middle" class="tick-t">1</text>` : ""}
      ${Array.from({ length: cols - 1 }, (_, j) => `<line x1="${x + (j + 1) * cw}" y1="${top}" x2="${x + (j + 1) * cw}" y2="${top + h}" class="gk-blk-l"/>`).join("")}
      <text x="${x + (cols * cw) / 2}" y="${top + h + 18}" text-anchor="middle" class="gk-box-t">${label}</text>
      <text x="${x + (cols * cw) / 2}" y="${top + h + 34}" text-anchor="middle" class="tick-t">${dims}</text>`;
    const xw = 30, ww = xw + (st.D + 1) * cw + 30, yw = ww + cw + 60;
    const wh = (st.D + 1) * 14;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 ${top + Math.max(hN, wh) + 46}" role="img" aria-label="Formen der Matrizen">
      ${blk(xw, st.D + 1, st.N, hN, "X̃", `${st.N} × ${st.D + 1}`, "", true)}
      <text x="${ww - 15}" y="${top + 30}" text-anchor="middle" class="gk-op">·</text>
      <rect x="${ww}" y="${top}" width="${cw}" height="${wh}" rx="4" class="gk-blk gk-w"/>
      <text x="${ww + cw / 2}" y="${top + wh + 18}" text-anchor="middle" class="gk-box-t">w̃</text>
      <text x="${ww + cw / 2}" y="${top + wh + 34}" text-anchor="middle" class="tick-t">${st.D + 1} × 1</text>
      <text x="${yw - 30}" y="${top + 30}" text-anchor="middle" class="gk-op">=</text>
      ${blk(yw, 1, st.N, hN, "ŷ", `${st.N} × 1`, "gk-yhat")}
      <rect x="${yw + 90}" y="${top}" width="${(st.D + 1) * 14}" height="${(st.D + 1) * 14}" rx="4" class="gk-blk ${st.dep ? "gk-bad" : ""}"/>
      <text x="${yw + 90 + ((st.D + 1) * 14) / 2}" y="${top + (st.D + 1) * 14 + 18}" text-anchor="middle" class="gk-box-t">X̃ᵀX̃</text>
      <text x="${yw + 90 + ((st.D + 1) * 14) / 2}" y="${top + (st.D + 1) * 14 + 34}" text-anchor="middle" class="tick-t">${st.D + 1} × ${st.D + 1}</text>
    </svg>`;
    read.innerHTML = `<div class="lw-vals"><span>$\\tilde X$</span><b>$${st.N} \\times ${st.D + 1}$</b><span>$\\tilde w$</span><b>$${st.D + 1} \\times 1$</b>
      <span>$\\tilde X\\tilde w = \\hat y$</span><b>$${st.N} \\times 1$</b><span>$\\tilde X^\\top\\tilde X$</span><b>$${st.D + 1} \\times ${st.D + 1}$, symmetrisch</b></div>
      <p class="small">${st.dep ? `<b class="nm-err">Zwei Merkmale linear abhängig</b> (z. B. Fläche in m² und in ft²): $\\tilde X$ hat keinen vollen Spaltenrang, $\\tilde X^\\top\\tilde X$ ist singulär — die Normalgleichung hat unendlich viele Lösungen. Ridge (${"2.5"}) hilft.`
        : st.N < st.D + 1 ? `<b class="nm-err">Weniger Beispiele als Parameter</b> ($N < D + 1$): der Rang ist höchstens $N$, $\\tilde X^\\top\\tilde X$ ist singulär.` : "Innere Dimensionen passen: $(N \\times (D+1)) \\cdot ((D+1) \\times 1)$."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.2 Kleinste Quadrate */

const GK_FIT_SETS = {
  vl: { name: "Vorlesung", pts: [[0, 1], [1, 2], [2, 4]] },
  ueb: { name: "Übung 2", pts: [[1, 1], [2, 3], [4, 3], [5, 5]] },
  out: { name: "Ausreißer", pts: [[0.5, 1], [1.5, 1.5], [2.5, 2.5], [3.5, 3], [4.5, 4], [5, 0.5]] },
};
// The least-squares line through points, exactly when the coordinates are multiples of ½.
function gkFitLine(pts) {
  const q = (v) => nmQ(Math.round(v * 2), 2);
  const N = pts.length;
  const sx = pts.reduce((s, [x]) => s.add(q(x)), nmQ(0)), sy = pts.reduce((s, [, y]) => s.add(q(y)), nmQ(0));
  const sxx = pts.reduce((s, [x]) => s.add(q(x).mul(q(x))), nmQ(0)), sxy = pts.reduce((s, [x, y]) => s.add(q(x).mul(q(y))), nmQ(0));
  const det = sxx.mul(N).sub(sx.mul(sx));
  if (det.zero) return null;
  const w = sxy.mul(N).sub(sx.mul(sy)).div(det), b = sy.sub(w.mul(sx)).div(N);
  return { N, sx, sy, sxx, sxy, w, b };
}

function gkWFit(root) {
  const { w, fig, read } = ppW(root, "fit");
  const st = { set: "vl", mean: 0, pts: GK_FIT_SETS.vl.pts.map((p) => [...p]) };
  const P = nmFrame(520, 300, [-0.3, 6], [-0.5, 6]);
  let drag = -1;
  // One SVG for the whole life of the drawing, so a drag keeps its pointer capture while it redraws.
  fig.innerHTML = `<svg class="lw-svg gk-drag" viewBox="0 0 520 300" role="img" aria-label="Ausgleichsgerade"></svg>`;
  const svgEl = $("svg", fig);
  svgEl.onpointerdown = (e) => {
    const p = gkSvgPt(svgEl, e);
    let best = -1, bd = 600;
    st.pts.forEach(([x, y], i) => { const d = (P.X(x) - p.x) ** 2 + (P.Y(y) - p.y) ** 2; if (d < bd) { bd = d; best = i; } });
    if (best < 0) return;
    e.preventDefault();
    drag = best;
    svgEl.setPointerCapture(e.pointerId);
    draw();
  };
  svgEl.onpointermove = (e) => {
    if (drag < 0) return;
    const p = gkSvgPt(svgEl, e);
    const fx = (x) => -0.3 + ((x - 34) / (520 - 34 - 12)) * 6.3, fy = (y) => -0.5 + ((300 - 26 - y) / (300 - 12 - 26)) * 6.5;
    const nx = Math.max(0, Math.min(5.5, Math.round(fx(p.x) * 2) / 2)), ny = Math.max(0, Math.min(5.5, Math.round(fy(p.y) * 2) / 2));
    if (nx === st.pts[drag][0] && ny === st.pts[drag][1]) return;
    st.pts[drag] = [nx, ny];
    draw();
  };
  svgEl.onpointerup = svgEl.onpointercancel = () => { if (drag >= 0) { drag = -1; draw(); } };
  const draw = () => {
    const f = gkFitLine(st.pts);
    const ybar = st.pts.reduce((s, p) => s + p[1], 0) / st.pts.length;
    let svg = P.axes({ xl: "x", yl: "y" });
    if (st.mean) svg += `<line x1="${P.X(-0.3)}" y1="${P.Y(ybar)}" x2="${P.X(6)}" y2="${P.Y(ybar)}" class="gk-mean"/>` + st.pts.map(([x, y]) => `<line x1="${P.X(x) + 4}" y1="${P.Y(y)}" x2="${P.X(x) + 4}" y2="${P.Y(ybar)}" class="gk-dev"/>`).join("");
    if (f) {
      const yh = (x) => +f.b + +f.w * x;
      svg += `<defs><clipPath id="gkFitClip"><rect x="34" y="12" width="474" height="262"/></clipPath></defs>
        <line x1="${P.X(-0.3)}" y1="${P.Y(yh(-0.3))}" x2="${P.X(6)}" y2="${P.Y(yh(6))}" class="curve nm-approx-c gk-fitline" clip-path="url(#gkFitClip)"/>`;
      svg += st.pts.map(([x, y]) => `<line x1="${P.X(x)}" y1="${P.Y(y)}" x2="${P.X(x)}" y2="${P.Y(yh(x))}" class="nm-resid"/>`).join("");
    }
    svg += st.pts.map(([x, y], i) => `<circle cx="${P.X(x)}" cy="${P.Y(y)}" r="7" class="pt gk-data ${i === drag ? "on" : ""}"/>`).join("");
    svgEl.innerHTML = svg;
    if (!f) { read.innerHTML = `<p class="nm-err small">Alle Punkte haben dasselbe $x$: $\\tilde X$ hat keinen vollen Spaltenrang, die Gerade ist nicht eindeutig.</p>`; return; }
    const sse = st.pts.reduce((s, [x, y]) => s + (y - (+f.b + +f.w * x)) ** 2, 0), sst = st.pts.reduce((s, [, y]) => s + (y - ybar) ** 2, 0);
    const N = st.pts.length;
    read.innerHTML = `
      <div class="nm-tex">$$${tmx([[N, f.sx], [f.sx, f.sxx]])}\\tilde w = ${tcv([f.sy, f.sxy])}\\ \\Rightarrow\\ \\tilde w^\\star = ${tcv([f.b, f.w])}$$</div>
      <div class="lw-vals"><span>Gerade</span><b>$\\hat y = ${f.b.tex()} ${f.w.n < 0 ? "-" : "+"} ${f.w.abs().tex()}\\,x$</b>
        <span>SSE · MSE · L</span><b class="nm-err">${nmD(sse, 3)} · ${nmD(sse / N, 3)} · ${nmD(sse / (2 * N), 4)}</b>
        <span>R²</span><b>${sst > 1e-12 ? nmD(1 - sse / sst, 3) : "—"}</b>
        <span>Σ Residuen</span><b>${nmD(st.pts.reduce((s, [x, y]) => s + y - (+f.b + +f.w * x), 0), 6)}</b></div>
      <p class="small">Zieh die Punkte. Rot: die Residuen $e_i = y_i - \\hat y_i$ — senkrecht, nicht der Abstand zur Geraden.${st.mean ? " Gestrichelt: das Mittelwert-Modell $\\bar y$ und seine Abweichungen (der Nenner von R²)." : ""}</p>`;
  };
  $$('[data-seg="set"] button', w).forEach((b) => (b.onclick = () => { st.set = b.dataset.v; st.pts = GK_FIT_SETS[st.set].pts.map((p) => [...p]); lenSetSeg(b.parentElement, b.dataset.v); draw(); }));
  $$('[data-seg="mean"] button', w).forEach((b) => (b.onclick = () => { st.mean = +b.dataset.v; lenSetSeg(b.parentElement, b.dataset.v); draw(); }));
  w.querySelector('[data-a="add"]').onclick = () => { if (st.pts.length < 9) st.pts.push([rint(0, 11) / 2, rint(0, 11) / 2]); draw(); };
  w.querySelector('[data-a="del"]').onclick = () => { if (st.pts.length > 2) st.pts.pop(); draw(); };
  draw();
}

/* ---------------------------------------------------------------- 2.3 Anscombe */

const GK_ANSCOMBE = (() => {
  const x = [10, 8, 13, 9, 11, 14, 6, 4, 12, 7, 5];
  return [
    [x, [8.04, 6.95, 7.58, 8.81, 8.33, 9.96, 7.24, 4.26, 10.84, 4.82, 5.68], "I: linear mit Rauschen"],
    [x, [9.14, 8.14, 8.74, 8.77, 9.26, 8.1, 6.13, 3.1, 9.13, 7.26, 4.74], "II: gekrümmt"],
    [x, [7.46, 6.77, 12.74, 7.11, 7.81, 8.84, 6.08, 5.39, 8.15, 6.42, 5.73], "III: ein Ausreißer"],
    [[8, 8, 8, 8, 8, 8, 8, 19, 8, 8, 8], [6.58, 5.76, 7.71, 8.84, 8.47, 7.04, 5.25, 12.5, 5.56, 7.91, 6.89], "IV: ein Hebelpunkt"],
  ];
})();
function gkAnscombeSVG() {
  return `<div class="gk-ans">${GK_ANSCOMBE.map(([xs, ys, name]) => {
    const P = nmFrame(240, 170, [2, 20], [2, 14], { l: 26, r: 8, t: 8, b: 22 });
    const n = xs.length, mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
    const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const wv = sxy / sxx, bv = my - wv * mx;
    const sse = xs.reduce((s, x, i) => s + (ys[i] - bv - wv * x) ** 2, 0), sst = ys.reduce((s, y) => s + (y - my) ** 2, 0);
    return `<figure><svg class="lw-svg" viewBox="0 0 240 170" role="img" aria-label="${name}">${P.axes({ xt: [5, 10, 15], yt: [4, 8, 12] })}
      <line x1="${P.X(2)}" y1="${P.Y(bv + wv * 2)}" x2="${P.X(20)}" y2="${P.Y(bv + wv * 20)}" class="curve nm-approx-c" stroke-width="2"/>
      ${xs.map((x, i) => `<circle cx="${P.X(x)}" cy="${P.Y(ys[i])}" r="3.5" class="pt gk-data"/>`).join("")}</svg>
      <figcaption class="small"><b>${name}</b><br>ŷ = ${nmD(bv, 2)} + ${nmD(wv, 3)}x · R² = ${nmD(1 - sse / sst, 2)}</figcaption></figure>`;
  }).join("")}</div>`;
}

/* ---------------------------------------------------------------- 2.4 / 2.5 Basisfunktionen, Ridge */

// Ten noisy points of sin(2πx) for training, a hundred for validation — the same every visit.
const GK_SIN = (() => {
  const rnd = gkRng(7), f = (x) => Math.sin(2 * Math.PI * x);
  const tr = Array.from({ length: 10 }, (_, i) => [i / 9, f(i / 9) + 0.25 * gkGauss(rnd)]);
  const va = Array.from({ length: 100 }, () => { const x = rnd(); return [x, f(x) + 0.25 * gkGauss(rnd)]; });
  return { tr, va, f };
})();
function gkBasis(kind, M) {
  if (kind === "poly") return (x) => Array.from({ length: M + 1 }, (_, j) => x ** j);
  // Bias + M Gaussian bells, evenly over [0, 1], s = 0,18 as in the lecture's picture.
  return (x) => [1, ...Array.from({ length: M }, (_, j) => Math.exp(-((x - (M === 1 ? 0.5 : j / (M - 1))) ** 2) / (2 * 0.18 ** 2)))];
}
function gkPolyFit(kind, M, lam) {
  const phi = gkBasis(kind, M);
  const N = GK_SIN.tr.length;
  const wv = gkLstsq(GK_SIN.tr.map(([x]) => phi(x)), GK_SIN.tr.map(([, y]) => y), N * lam);
  const f = (x) => nmDot(phi(x), wv);
  const rms = (set) => Math.sqrt(set.reduce((s, [x, y]) => s + (f(x) - y) ** 2, 0) / set.length);
  return { w: wv, f, tr: rms(GK_SIN.tr), va: rms(GK_SIN.va) };
}

function gkWPoly(root, key, ridge) {
  const { w, fig, read } = ppW(root, key);
  const st = ridge ? { kind: "poly", M: 9, ll: -18 } : { kind: "poly", M: 3, ll: -99 };
  const P = nmFrame(330, 240, [-0.02, 1.02], [-1.6, 1.6], { l: 30, r: 8, t: 10, b: 24 });
  const C = nmFrame(180, 240, ridge ? [-35, 2] : [0, 9], [0, 1.2], { l: 30, r: 8, t: 10, b: 24 });
  const lamOf = (ll) => (ll <= -35 ? 0 : Math.exp(ll));
  const draw = () => {
    if (ridge) lenOut(w, "ll", st.ll <= -35 ? "−∞" : String(st.ll));
    else lenOut(w, "M", st.M);
    const r = gkPolyFit(st.kind, st.M, lamOf(st.ll));
    const curve = ridge ? Array.from({ length: 38 }, (_, i) => -35 + i).map((ll) => [ll, gkPolyFit(st.kind, st.M, lamOf(ll))])
      : Array.from({ length: 10 }, (_, m) => [m, gkPolyFit(st.kind, m, 0)]);
    const line = (k) => curve.map(([x, q], i) => `${i ? "L" : "M"}${C.X(x).toFixed(1)},${C.Y(Math.min(q[k], 1.2)).toFixed(1)}`).join("");
    const cur = ridge ? st.ll : st.M;
    fig.innerHTML = `<div class="gk-two"><svg class="lw-svg" viewBox="0 0 330 240" role="img" aria-label="Angepasste Kurve">
        <defs><clipPath id="gkClip${key}"><rect x="30" y="10" width="292" height="206"/></clipPath></defs>
        ${P.axes({ xl: "x", xt: [0, 0.5, 1], yt: [-1, 0, 1] })}
        <g clip-path="url(#gkClip${key})"><path d="${P.path(GK_SIN.f, 200)}" class="curve nm-exact-c gk-thin"/><path d="${P.path(r.f, 400)}" class="curve nm-approx-c"/></g>
        ${GK_SIN.tr.map(([x, y]) => `<circle cx="${P.X(x)}" cy="${P.Y(y)}" r="5" class="pt gk-data"/>`).join("")}
      </svg><svg class="lw-svg" viewBox="0 0 180 240" role="img" aria-label="RMS-Fehler">
        ${C.axes({ xl: ridge ? "ln λ" : "M", xt: ridge ? [-30, -20, -10, 0] : [0, 3, 6, 9], yt: [0, 0.5, 1] })}
        <path d="${line("tr")}" class="curve gk-tr"/><path d="${line("va")}" class="curve nm-err-c"/>
        <line x1="${C.X(Math.max(cur, ridge ? -35 : 0))}" y1="10" x2="${C.X(Math.max(cur, ridge ? -35 : 0))}" y2="216" class="guide"/>
        <text x="174" y="24" text-anchor="end" class="tick-t gk-va-t">Validierung</text><text x="174" y="38" text-anchor="end" class="tick-t gk-tr-t">Training</text>
      </svg></div>`;
    const big = Math.max(...r.w.slice(1).map(Math.abs));
    read.innerHTML = `<div class="lw-vals"><span>RMS Training</span><b>${nmD(r.tr, 3)}</b><span>RMS Validierung</span><b class="nm-err">${nmD(r.va, 3)}</b>
      <span>größtes |w<sub>j</sub>| (ohne w₀)</span><b>${big > 1e4 ? nmSci(big, 2) : nmD(big, 2)}</b></div>
      <p class="small">${ridge ? (st.ll <= -35 ? "λ = 0: die Kurve geht durch alle zehn Punkte, die Gewichte explodieren — Überanpassung." : st.ll > -2 ? "λ groß: die Gewichte werden gegen null gedrückt — Unteranpassung." : "Mit wachsendem λ schrumpfen die Gewichte um Größenordnungen, die Kurve wird glatter.")
        : st.M <= 1 ? "Zu unflexibel: Trainings- und Validierungsfehler groß — Unteranpassung." : st.M >= 8 ? "Fast so viele Parameter wie Punkte: Trainingsfehler ≈ 0, Validierungsfehler groß — <b>Überanpassung</b>." : "Grün die wahre Funktion sin(2πx), blau der Fit. Den Grad wählt man auf den Validierungsdaten."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.6 Gemeinsame Verteilung, Bayes */

const GK_JOINT = {
  wetter: { name: "Temperatur & Wetter", r: ["warm", "kalt"], c: ["Sonne", "Regen"], R: "T", Cn: "W", p: [[0.4, 0.1], [0.2, 0.3]] },
  frost: { name: "Frostsensor (Übung 2)", r: ["M", "¬M"], c: ["F", "¬F"], R: "Meldung", Cn: "Frost", p: [[0.2, 0.15], [0.05, 0.6]] },
  spam: { name: "Spam & Schlüsselwort (VL 3)", r: ["S", "¬S"], c: ["K", "¬K"], R: "Spam", Cn: "Wort", p: [[0.08, 0.02], [0.18, 0.72]] },
};
function gkWJoint(root) {
  const { w, fig, read } = ppW(root, "joint");
  const st = { set: "wetter", order: "rows", cond: -1 };
  const q = (x) => nmQ(Math.round(x * 100), 100);
  const draw = () => {
    const J = GK_JOINT[st.set], p = J.p.map((r) => r.map(q));
    const pr = p.map((r) => r[0].add(r[1])), pc = [p[0][0].add(p[1][0]), p[0][1].add(p[1][1])];
    const S = 230, x0 = 40, y0 = 20;
    let svg = "";
    if (st.order === "rows") {
      let y = y0;
      p.forEach((r, i) => {
        const h = +pr[i] * S;
        let x = x0;
        r.forEach((v, j) => {
          const wdt = (+v / +pr[i]) * S;
          svg += `<rect x="${x}" y="${y}" width="${wdt}" height="${h}" class="gk-cell gk-cell-${j} ${st.cond === i ? "on" : st.cond >= 0 ? "dim" : ""}"/>
            <text x="${x + wdt / 2}" y="${y + h / 2 + 4}" text-anchor="middle" class="gk-cell-t">${nmD(+v, 2)}</text>`;
          x += wdt;
        });
        svg += `<g class="click" data-c="${i}"><text x="${x0 - 8}" y="${y + h / 2 + 4}" text-anchor="end" class="gk-box-t">${J.r[i]}</text><rect x="0" y="${y}" width="${x0}" height="${h}" class="hit-r"/></g>`;
        y += h;
      });
      svg += J.c.map((c, j) => `<text x="${x0 + (j ? S - 20 : 20)}" y="${y0 + S + 18}" text-anchor="middle" class="tick-t gk-cell-${j}-t">${c}</text>`).join("");
    } else {
      let x = x0;
      p[0].forEach((_, j) => {
        const wdt = +pc[j] * S;
        let y = y0;
        [0, 1].forEach((i) => {
          const h = (+p[i][j] / +pc[j]) * S;
          svg += `<rect x="${x}" y="${y}" width="${wdt}" height="${h}" class="gk-cell gk-cell-${j} ${st.cond === j ? "on" : st.cond >= 0 ? "dim" : ""}"/>
            <text x="${x + wdt / 2}" y="${y + h / 2 + 4}" text-anchor="middle" class="gk-cell-t">${nmD(+p[i][j], 2)}</text>`;
          y += h;
        });
        svg += `<g class="click" data-c="${j}"><text x="${x + wdt / 2}" y="${y0 + S + 18}" text-anchor="middle" class="gk-box-t">${J.c[j]}</text><rect x="${x}" y="${y0 + S}" width="${wdt}" height="26" class="hit-r"/></g>`;
        x += wdt;
      });
      svg += J.r.map((r, i) => `<text x="${x0 - 8}" y="${y0 + (i ? S - 20 : 20)}" text-anchor="end" class="tick-t">${r}</text>`).join("");
    }
    // The conditional distribution, renormalised, as two bars on the right.
    if (st.cond >= 0) {
      const vals = st.order === "rows" ? p[st.cond].map((v) => v.div(pr[st.cond])) : [0, 1].map((i) => p[i][st.cond].div(pc[st.cond]));
      const labels = st.order === "rows" ? J.c : J.r;
      vals.forEach((v, k) => {
        const hgt = +v * 180;
        svg += `<rect x="${340 + k * 70}" y="${y0 + 200 - hgt}" width="50" height="${hgt}" rx="4" class="gk-bar ${st.order === "rows" ? `gk-cell-${k}` : "gk-cell-c"}"/>
          <text x="${365 + k * 70}" y="${y0 + 195 - hgt}" text-anchor="middle" class="gk-cell-t">${v.d === 1 ? v.n : nmD(+v, 3)}</text>
          <text x="${365 + k * 70}" y="${y0 + 218}" text-anchor="middle" class="tick-t">${labels[k]}</text>`;
      });
      svg += `<text x="400" y="${y0 + 240}" text-anchor="middle" class="tick-t">neu normiert: Summe 1</text>`;
    }
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 280" role="img" aria-label="Gemeinsame Verteilung als Fläche">${svg}</svg>`;
    $$("[data-c]", fig).forEach((g) => (g.onclick = () => { st.cond = st.cond === +g.dataset.c ? -1 : +g.dataset.c; draw(); }));
    const cell = (i, j) => p[i][j].tex();
    // Names as upright text inside the formulas.
    const tn = (s) => `\\text{${s}}`, Rn = J.r.map(tn), Cn = J.c.map(tn);
    let formula = "";
    if (st.cond >= 0 && st.order === "rows") {
      const i = st.cond, j = 0;
      const back = p[i][j].div(pc[j]);
      formula = `<p>Bedingt auf <b>${J.r[i]}</b>: $P(${Cn[j]} \\mid ${Rn[i]}) = \\frac{P(${Rn[i]}, ${Cn[j]})}{P(${Rn[i]})} = \\frac{${gt(+p[i][j], 2)}}{${gt(+pr[i], 2)}} = ${gt(+p[i][j].div(pr[i]), 3)}$.</p>
        <p class="small">Bayes dreht es um: $P(${Rn[i]} \\mid ${Cn[j]}) = \\frac{P(${Cn[j]} \\mid ${Rn[i]})\\,P(${Rn[i]})}{P(${Cn[j]})} = \\frac{${gt(+p[i][j].div(pr[i]), 3)} \\cdot ${gt(+pr[i], 2)}}{${gt(+pc[j], 2)}} = ${back.d < 30 ? back.tex() + " \\approx " : ""}${gt(+back, 3)}$ — schalte auf „erst Spalten“ und klick auf ${J.c[j]}.</p>`;
    } else if (st.cond >= 0) {
      const j = st.cond, i = 0;
      const v = p[i][j].div(pc[j]);
      formula = `<p>Bedingt auf <b>${J.c[j]}</b>: $P(${Rn[i]} \\mid ${Cn[j]}) = \\frac{P(${Rn[i]}, ${Cn[j]})}{P(${Cn[j]})} = \\frac{${gt(+p[i][j], 2)}}{${gt(+pc[j], 2)}} = ${v.d < 30 ? v.tex() + " \\approx " : ""}${gt(+v, 3)}$.</p>`;
    } else formula = `<p class="small">Klick auf eine ${st.order === "rows" ? "Zeile (links)" : "Spalte (unten)"}, um darauf zu bedingen. Die Fläche jedes Felds ist die gemeinsame Wahrscheinlichkeit — in beiden Aufteilungen gleich: $P(x \\mid y)P(y) = P(x, y) = P(y \\mid x)P(x)$.</p>`;
    read.innerHTML = `<table class="len-terms nm-tab gk-jt"><thead><tr><th></th>${J.c.map((c) => `<th>${c}</th>`).join("")}<th>$P(\\text{${J.R}})$</th></tr></thead><tbody>
      ${J.r.map((r, i) => `<tr><th>${r}</th><td>$${cell(i, 0)}$</td><td>$${cell(i, 1)}$</td><td><b>$${pr[i].tex()}$</b></td></tr>`).join("")}
      <tr><th>$P(\\text{${J.Cn}})$</th><td><b>$${pc[0].tex()}$</b></td><td><b>$${pc[1].tex()}$</b></td><td>1</td></tr></tbody></table>${formula}`;
  };
  $$('[data-seg="set"] button', w).forEach((b) => (b.onclick = () => { st.set = b.dataset.v; st.cond = -1; lenSetSeg(b.parentElement, b.dataset.v); draw(); }));
  $$('[data-seg="order"] button', w).forEach((b) => (b.onclick = () => { st.order = b.dataset.v; st.cond = -1; lenSetSeg(b.parentElement, b.dataset.v); draw(); }));
  draw();
}

/* ---------------------------------------------------------------- 2.7 Monte Carlo, Gauß */

function gkWMC(root) {
  const { w, fig, read } = ppW(root, "mc");
  const st = { pts: [] };
  const draw = () => {
    const M = st.pts.length, k = st.pts.filter(([x, y]) => x * x + y * y <= 1).length;
    const S = 220, c = 120, X = (x) => c + x * (S / 2), Y = (y) => c - y * (S / 2);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 240" role="img" aria-label="Monte-Carlo-Schätzung von π">
      <rect x="${X(-1)}" y="${Y(1)}" width="${S}" height="${S}" class="gk-sq"/><circle cx="${c}" cy="${c}" r="${S / 2}" class="gk-circ"/>
      ${st.pts.slice(-3000).map(([x, y]) => `<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="${M > 500 ? 1.4 : 2.4}" class="${x * x + y * y <= 1 ? "gk-in" : "gk-outp"}"/>`).join("")}
      <text x="250" y="40" class="gk-box-t">π̂ = 4 · ${k} / ${M || "M"}</text>
      <text x="250" y="70" class="gk-big">${M ? nmD((4 * k) / M, 4) : "?"}</text>
      <text x="250" y="100" class="tick-t">π = 3,1416</text>
      ${M ? `<text x="250" y="130" class="tick-t">Fehler: ${nmD(Math.abs((4 * k) / M - Math.PI), 4)}</text><text x="250" y="150" class="tick-t">typisch ~ 1/√M = ${nmD(1 / Math.sqrt(M), 4)}</text>` : ""}
    </svg>`;
    read.innerHTML = `<p class="small">Punkte gleichverteilt im Quadrat $[-1, 1]^2$: der Anteil im Kreis schätzt $\\frac{\\pi}{4}$ — ein Erwartungswert $\\mathbb E[f(x)]$ mit $f = \\mathbb 1[x_1^2 + x_2^2 \\le 1]$. Hundertmal so viele Stichproben machen den Fehler etwa zehnmal kleiner.</p>`;
  };
  const add = (n) => { for (let i = 0; i < n; i++) st.pts.push([Math.random() * 2 - 1, Math.random() * 2 - 1]); draw(); };
  w.querySelector('[data-a="a10"]').onclick = () => add(10);
  w.querySelector('[data-a="a100"]').onclick = () => add(100);
  w.querySelector('[data-a="a1000"]').onclick = () => add(1000);
  w.querySelector('[data-a="reset"]').onclick = () => { st.pts = []; draw(); };
  draw();
}

function gkWGauss(root) {
  const { w, fig, read } = ppW(root, "gauss");
  const st = { mu: 0, s: 1 };
  const P = nmFrame(520, 220, [-5, 5], [0, 2.2]);
  const draw = () => {
    lenOut(w, "mu", nmD(st.mu, 1));
    lenOut(w, "s", nmD(st.s, 2));
    const f = (x) => Math.exp(-((x - st.mu) ** 2) / (2 * st.s ** 2)) / Math.sqrt(2 * Math.PI * st.s ** 2);
    const band = (k) => {
      const a = st.mu - k * st.s, b = st.mu + k * st.s;
      let d = `M${P.X(Math.max(a, -5))},${P.Y(0)}`;
      for (let i = 0; i <= 80; i++) { const x = Math.max(-5, Math.min(5, a + ((b - a) * i) / 80)); d += `L${P.X(x).toFixed(1)},${P.Y(Math.min(f(x), 2.2)).toFixed(1)}`; }
      return d + `L${P.X(Math.min(b, 5))},${P.Y(0)}Z`;
    };
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 220" role="img" aria-label="Gauß-Dichte">
      <defs><clipPath id="gkGClip"><rect x="34" y="12" width="474" height="182"/></clipPath></defs>${P.axes({ xl: "x" })}
      <g clip-path="url(#gkGClip)"><path d="${band(2)}" class="gk-band2"/><path d="${band(1)}" class="gk-band1"/><path d="${P.path(f, 400)}" class="curve nm-approx-c"/></g>
      <line x1="${P.X(-5)}" y1="${P.Y(1)}" x2="${P.X(5)}" y2="${P.Y(1)}" class="guide"/><text x="${P.X(5)}" y="${P.Y(1) - 4}" text-anchor="end" class="tick-t">p = 1</text>
    </svg>`;
    const top = 1 / Math.sqrt(2 * Math.PI * st.s ** 2);
    read.innerHTML = `<div class="lw-vals"><span>Maximum der Dichte</span><b>${nmD(top, 3)}</b><span>±1σ · ±2σ</span><b>≈ 68 % · ≈ 95 %</b></div>
      <p class="small">${top > 1 ? "<b>Die Dichte ist größer als 1</b> — erlaubt: nur Flächen sind Wahrscheinlichkeiten, die Gesamtfläche bleibt 1." : "Die Bänder zeigen ±1σ und ±2σ; die Gesamtfläche ist immer 1."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.8 Maximum Likelihood */

function gkWLik(root) {
  const { w, fig, read } = ppW(root, "lik");
  const st = { mode: "coin", N: 10, k: 7, log: 0, mu: 3, v: 2 };
  const draw = () => {
    const coin = st.mode === "coin";
    $$(".gk-coin", w).forEach((e) => (e.hidden = !coin));
    $$(".gk-gau", w).forEach((e) => (e.hidden = coin));
    if (coin) {
      if (st.k > st.N) st.k = st.N;
      const kin = $('input[data-k="k"]', w);
      kin.max = st.N; kin.value = st.k;
      lenOut(w, "N", st.N); lenOut(w, "k", st.k);
      const pih = st.k / st.N;
      const lik = (p) => p ** st.k * (1 - p) ** (st.N - st.k);
      const ll = (p) => st.k * Math.log(p) + (st.N - st.k) * Math.log(1 - p);
      const top = lik(pih) || 1, llTop = isFinite(ll(pih)) ? ll(pih) : 0;
      const P = nmFrame(520, 230, [0, 1], st.log ? [llTop - 12, llTop + 1] : [0, 1.08]);
      const f = st.log ? ll : (p) => lik(p) / top;
      fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 230" role="img" aria-label="Likelihood der Münze">
        <defs><clipPath id="gkLClip"><rect x="34" y="12" width="474" height="192"/></clipPath></defs>
        ${P.axes({ xl: "π", xt: [0, 0.25, 0.5, 0.75, 1] })}<g clip-path="url(#gkLClip)"><path d="${P.path(f, 400, 0.001, 0.999)}" class="curve nm-approx-c"/></g>
        <line x1="${P.X(pih)}" y1="12" x2="${P.X(pih)}" y2="204" class="guide"/><circle cx="${P.X(pih)}" cy="${P.Y(st.log ? Math.max(llTop, llTop - 12) : 1)}" r="6" class="pt nm-piv-pt"/>
        <text x="${Math.min(P.X(pih) + 8, 460)}" y="28" class="gk-box-t">π̂ = ${st.k}/${st.N}</text></svg>`;
      read.innerHTML = `<div class="nm-tex">$$\\mathrm{Lik}(\\pi) = \\pi^{${st.k}}(1 - \\pi)^{${st.N - st.k}},\\qquad \\log\\mathrm{Lik}(\\pi) = ${st.k}\\log\\pi + ${st.N - st.k}\\log(1 - \\pi)$$</div>
        <p class="small">Die Daten stehen fest, $\\pi$ wird variiert. ${st.log ? "Der Logarithmus ist streng monoton: derselbe Maximierer." : "Kurve skaliert auf Maximum 1."}
        ${st.k === st.N || st.k === 0 ? ` <b>$\\hat\\pi = ${st.k / st.N}$</b> — nach ${st.N} Würfen sagt die ML-Schätzung, ${st.k ? "Zahl" : "Kopf"} sei unmöglich. Bei wenig Daten überanpasst (Übung 2).` : ""}</p>`;
    } else {
      lenOut(w, "mu", nmD(st.mu, 1)); lenOut(w, "v", nmD(st.v, 2));
      const xs = [2, 4, 6];
      const P = nmFrame(520, 230, [-1, 9], [0, 0.45]);
      const dens = (x) => Math.exp(-((x - st.mu) ** 2) / (2 * st.v)) / Math.sqrt(2 * Math.PI * st.v);
      const ll = xs.reduce((s, x) => s + Math.log(dens(x)), 0);
      const best = xs.reduce((s, x) => s + Math.log(Math.exp(-((x - 4) ** 2) / (2 * 8 / 3)) / Math.sqrt(2 * Math.PI * 8 / 3)), 0);
      fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 230" role="img" aria-label="Gauß-Likelihood">
        <defs><clipPath id="gkLClip2"><rect x="34" y="12" width="474" height="192"/></clipPath></defs>
        ${P.axes({ xl: "x" })}<g clip-path="url(#gkLClip2)"><path d="${P.path(dens, 400)}" class="curve nm-approx-c"/></g>
        ${xs.map((x) => `<line x1="${P.X(x)}" y1="${P.Y(0)}" x2="${P.X(x)}" y2="${P.Y(dens(x))}" class="gk-likbar"/><circle cx="${P.X(x)}" cy="${P.Y(0)}" r="6" class="pt gk-data"/>`).join("")}</svg>`;
      read.innerHTML = `<div class="lw-vals"><span>log Lik(μ, σ²)</span><b>${nmD(ll, 3)}</b><span>Maximum bei μ̂ = 4, σ̂² = 8/3</span><b>${nmD(best, 3)}</b></div>
        <p class="small">Die gelben Striche sind die Dichten $p(x_i)$ — die Likelihood ist ihr Produkt. Verschieb $\\mu$ und $\\sigma^2$, bis es am größten ist: $\\hat\\mu = 4$ (Mittelwert), $\\hat\\sigma^2 = \\frac13(4 + 0 + 4) = \\frac83$.</p>`;
    }
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

GKI_CHAPTERS.push({
  n: 2, vl: "VL 2", lectures: [2], title: "Lineare Modelle", next: "Klassifikation",
  headline: "Lineare Modelle und ihre <span class=\"accent\">Grundlagen</span>",
  intro: "Daten und lineare Vorhersagen in Matrixform, die Normalgleichung Schritt für Schritt, Überanpassung und Ridge, bedingte Verteilungen und der Satz von Bayes — und warum Fehlerquadrate minimieren dasselbe ist wie die Likelihood maximieren, wenn das Rauschen gaußverteilt ist.",
  sections: [
    {
      id: "2.1", title: "Vektoren, Matrizen und die Datenmatrix", short: "Datenmatrix", about: "Skalarprodukt, Norm, Transponierte, Rang, X̃ und der Bias-Trick",
      html: () => `
        ${nmGist([
          "Ein Vektor ist ein <b>Spaltenvektor</b>. Skalarprodukt $a^\\top b = \\sum_i a_ib_i$ (eine Zahl; null heißt orthogonal), Norm $\\|a\\| = \\sqrt{a^\\top a}$.",
          "$AB$ ist nur definiert, wenn die inneren Dimensionen passen. $(AB)^\\top = B^\\top A^\\top$. <b>Voller Spaltenrang</b>: keine Spalte ist Linearkombination der anderen.",
          "Die <b>Datenmatrix</b> $X \\in \\R^{N\\times D}$: eine Zeile pro Beispiel, eine Spalte pro Merkmal; die Zielwerte stehen in $y$. Mit dem <b>Bias-Trick</b> kommt vorn eine Einsenspalte dazu: $\\hat y_i = b + w^\\top x_i = \\tilde w^\\top\\tilde x_i$.",
        ])}
        <div class="card">
          <h3>Beispiele aus der Vorlesung</h3>
          <p>$a = 2$, $b = \\begin{pmatrix}1\\\\2\\end{pmatrix}$, $C = \\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}$: $(1, 2)\\begin{pmatrix}3\\\\-1\\end{pmatrix} = 3 - 2 = 1$ und $\\Big\\|\\begin{pmatrix}1\\\\2\\end{pmatrix}\\Big\\| = \\sqrt5$.</p>
          <h3>Hauspreise: $N = 3$ Beispiele, $D = 3$ Merkmale</h3>
          <table class="len-terms nm-tab nm-data-tab"><thead><tr><th></th><th>Fläche (m²)</th><th>Zimmer</th><th>Baujahr</th><th class="nm-exact">Preis $y_i$ (Tsd. €)</th></tr></thead><tbody>
            <tr><th>Haus 1</th><td>120</td><td>4</td><td>1995</td><td class="nm-exact">390</td></tr>
            <tr><th>Haus 2</th><td>85</td><td>3</td><td>2010</td><td class="nm-exact">310</td></tr>
            <tr><th>Haus 3</th><td>60</td><td>2</td><td>1978</td><td class="nm-exact">190</td></tr></tbody></table>
          ${tx(`\\hat y_i = b + \\sum_{j=1}^D w_jx_{i,j} = b + w^\\top x_i = \\tilde w^\\top\\tilde x_i,\\qquad \\tilde x_i = \\begin{pmatrix}1\\\\x_i\\end{pmatrix},\\quad \\tilde w = \\begin{pmatrix}b\\\\w\\end{pmatrix},\\quad \\tilde X = (\\mathbf 1, X)`)}
          <p>Das Modell ist <b>affin in $x$, linear in den Parametern</b> $b$ und $w$. Der Bias ist ein Parameter, kein gemessener Datenwert. Alle $N$ Vorhersagen auf einmal: $\\hat y = \\tilde X\\tilde w$.</p>
        </div>
        ${pw("shapes", `${pslider("N", "Beispiele N", 1, 200, 1, 100)}${pslider("D", "Merkmale D", 1, 6, 1, 4)}${pseg("dep", [[0, "Merkmale unabhängig"], [1, "zwei linear abhängig"]], 0)}`, { wide: true })}
        ${gkSelf([
          ["$X$ hat 100 Zeilen und vier Merkmale. Welche Form haben $\\tilde X$, $\\tilde w$ und $\\tilde X\\tilde w$?", "$\\tilde X$: $100 \\times 5$, $\\tilde w$: $5 \\times 1$, $\\tilde X\\tilde w$: $100 \\times 1$."],
          ["Zwei Merkmale sind linear abhängig. Was erwarten Sie für die Invertierbarkeit von $\\tilde X^\\top\\tilde X$?", "Kein voller Spaltenrang ⇒ $\\tilde X^\\top\\tilde X$ ist singulär, die Normalgleichung hat keine eindeutige Lösung."],
        ])}
        ${nmTraps([
          "Die Matrix $X$ enthält noch <b>keine</b> Einsenspalte — erst $\\tilde X$. Und $\\tilde w$ hat den Bias vorn.",
          "Dimensionen prüfen, bevor man multipliziert: $\\tilde X^\\top\\tilde X$ ist $(D+1)\\times(D+1)$, nicht $N \\times N$.",
        ])}`,
      setup: (root) => gkWShapes(root),
      check: [
        { q: "$X$ hat 100 Zeilen und 4 Merkmale. Welche Form hat $\\tilde X$?", opts: ["$100 \\times 5$", "$100 \\times 4$", "$5 \\times 100$", "$4 \\times 4$"], why: "Eine Einsenspalte kommt dazu." },
        { q: "Welche Form hat $\\tilde X^\\top\\tilde X$ bei $D$ Merkmalen?", opts: ["$(D+1) \\times (D+1)$", "$N \\times N$", "$N \\times (D+1)$", "$D \\times D$"], why: "Innere Dimension $N$ fällt weg." },
        { q: "$(1, 2)\\begin{pmatrix}3\\\\-1\\end{pmatrix}$ = ?", opts: ["$1$", "$5$", "$(3, -2)$", "$-1$"], why: "$3 - 2 = 1$: das Skalarprodukt ist eine Zahl." },
        { q: "Was gilt für $(\\tilde X\\tilde w)^\\top$?", opts: ["$\\tilde w^\\top\\tilde X^\\top$", "$\\tilde X^\\top\\tilde w^\\top$", "$\\tilde X\\tilde w$", "$\\tilde w\\tilde X$"], why: "Transponieren dreht die Reihenfolge um." },
        { q: "Das Modell $\\hat y = b + w^\\top x$ ist …", opts: ["affin in $x$, linear in den Parametern", "linear in $x$ und nichtlinear in $w$", "quadratisch in $w$", "nichtlinear in $b$"], why: "Deshalb gilt die Normalgleichung — auch später mit Basisfunktionen." },
      ],
    },
    {
      id: "2.2", title: "Kleinste Quadrate und die Normalgleichung", short: "Normalgleichung", about: "Residuen, SSE, MSE, Loss, Gradient null, zwei Ableitungsregeln",
      html: () => `
        ${nmGist([
          "<b>Residuen</b> $e_i = y_i - \\hat y_i$ (vertikal). Damit sich positive und negative Fehler nicht aufheben, wird quadriert: $\\text{SSE} = \\sum e_i^2 = e^\\top e$, $\\text{MSE} = \\frac1N\\text{SSE}$, unser Loss $L = \\frac{1}{2N}\\text{SSE}$ — <b>alle drei haben denselben Minimierer</b>.",
          "Im Minimum ist der <b>Gradient null</b>. Der Loss ist quadratisch und konvex (eine Schüssel): jeder Punkt mit Gradient null ist ein globales Minimum.",
          "Ausmultiplizieren, mit zwei Regeln ableiten, null setzen: die <b>Normalgleichung</b> $\\tilde X^\\top\\tilde X\\,\\tilde w = \\tilde X^\\top y$, also $\\tilde w^\\star = (\\tilde X^\\top\\tilde X)^{-1}\\tilde X^\\top y$ bei vollem Spaltenrang.",
        ])}
        ${pw("fit", `${pseg("set", Object.entries(GK_FIT_SETS).map(([k, v]) => [k, v.name]), "vl")}${pseg("mean", [[0, "nur Fit"], [1, "Mittelwert zeigen"]], 0)}
          <div class="lw-btns">${pbtn("add", "+ Punkt")}${pbtn("del", "− Punkt")}</div>`, { wide: true })}
        <div class="card">
          <h3>Die Herleitung</h3>
          ${ppFacts([
            ["Regeln", "Regel 1: $\\nabla_w\\,a^\\top w = \\nabla_w\\,w^\\top a = a$. Regel 2: $\\nabla_w\\,w^\\top Aw = (A + A^\\top)w$, für symmetrisches $A$ also $2Aw$ — wie $(aw)' = a$ und $(aw^2)' = 2aw$."],
            ["1. Ausmultiplizieren", "$L = \\frac{1}{2N}(y - \\tilde X\\tilde w)^\\top(y - \\tilde X\\tilde w) = \\frac{1}{2N}\\big(\\tilde w^\\top\\tilde X^\\top\\tilde X\\tilde w - 2\\tilde w^\\top\\tilde X^\\top y + y^\\top y\\big)$. Die Mischterme sind gleich: $y^\\top\\tilde X\\tilde w$ ist ein Skalar, also gleich seiner Transponierten."],
            ["2. Ableiten", "$\\nabla L = \\frac{1}{2N}\\big(2\\tilde X^\\top\\tilde X\\tilde w - 2\\tilde X^\\top y\\big) = \\frac1N\\tilde X^\\top(\\tilde X\\tilde w - y)$ — Regel 2 mit $A = \\tilde X^\\top\\tilde X$ (symmetrisch), Regel 1 mit $a = \\tilde X^\\top y$, $y^\\top y$ fällt weg."],
            ["3. Null setzen", "$\\tilde X^\\top\\tilde X\\,\\tilde w = \\tilde X^\\top y$. Die Inverse existiert nur bei vollem Spaltenrang; sonst ist die Lösung nicht eindeutig."],
          ])}
          <h3>Rechenbeispiel der Vorlesung: $(0, 1), (1, 2), (2, 4)$</h3>
          ${tx(`\\tilde X = \\begin{pmatrix}1&0\\\\1&1\\\\1&2\\end{pmatrix},\\ y = \\begin{pmatrix}1\\\\2\\\\4\\end{pmatrix}:\\quad \\begin{pmatrix}3&3\\\\3&5\\end{pmatrix}\\tilde w = \\begin{pmatrix}7\\\\10\\end{pmatrix}\\ \\Rightarrow\\ \\tilde w^\\star = \\begin{pmatrix}5/6\\\\3/2\\end{pmatrix}`)}
          <p>Gerade $\\hat y = \\frac56 + \\frac32x$; Vorhersagen $\\frac56, \\frac73, \\frac{23}{6}$, Residuen $\\frac16, -\\frac13, \\frac16$ (sie summieren sich zu null). SSE $= \\frac16$, MSE $= \\frac{1}{18}$, $L = \\frac{1}{36}$.</p>
          <h3>Übung 2, Aufgabe 1: $(1, 1), (2, 3), (4, 3), (5, 5)$</h3>
          ${tx(`\\begin{pmatrix}4&12\\\\12&46\\end{pmatrix}\\tilde w = \\begin{pmatrix}12\\\\44\\end{pmatrix}\\ \\Rightarrow\\ \\tilde w^\\star = \\begin{pmatrix}b\\\\w\\end{pmatrix} = \\begin{pmatrix}3/5\\\\4/5\\end{pmatrix}`)}
          <p class="small">Für $D = 1$ geht es auch kürzer: $w = \\frac{\\sum(x_i - \\bar x)(y_i - \\bar y)}{\\sum(x_i - \\bar x)^2} = \\frac{8}{10}$, $b = \\bar y - w\\bar x = 3 - \\frac45\\cdot3 = \\frac35$.</p>
        </div>
        ${nmTraps([
          "Die Faktoren $\\frac1N$ und $\\frac12$ ändern den Minimierer nicht — nur den Wert des Loss. $\\frac1N$ macht Datensätze vergleichbar, $\\frac12$ kürzt sich beim Ableiten.",
          "Residuen sind <b>vertikale</b> Abstände, nicht der senkrechte Abstand zur Geraden.",
          `Warum quadratisch? Glatt differenzierbar, große Fehler zählen stärker (Ausreißer ziehen die Gerade!) — und es passt zu Gauß-Rauschen (${gkSee("2.8")}).`,
        ])}`,
      setup: (root) => gkWFit(root),
      check: [
        { q: "Was liefert die Normalgleichung?", opts: ["$\\tilde X^\\top\\tilde X\\,\\tilde w = \\tilde X^\\top y$", "$\\tilde X\\tilde w = y$ exakt", "$\\tilde X\\tilde X^\\top\\tilde w = y$", "$\\tilde w = \\tilde X^\\top y$"], why: "Gradient $\\frac1N\\tilde X^\\top(\\tilde X\\tilde w - y) = 0$." },
        { q: "SSE, MSE und $L = \\frac{1}{2N}$SSE: welche Gewichte minimieren sie?", opts: ["Alle dieselben", "Nur SSE die richtigen", "MSE kleinere Gewichte", "$L$ halb so große Gewichte"], why: "Positive Konstanten ändern den Minimierer nicht." },
        { q: "Warum ist jeder Punkt mit Gradient null ein globales Minimum?", opts: ["Der Loss ist quadratisch und konvex", "Weil $N$ groß ist", "Weil der Bias null ist", "Das stimmt nicht"], why: "Eine Schüssel hat nur ein Minimum." },
        { q: "Punkte $(0,1), (1,2), (2,4)$: was ist die Steigung $w$?", opts: ["$\\frac32$", "$\\frac56$", "$2$", "$1$"], why: "$\\tilde w^\\star = (5/6, 3/2)^\\top$." },
        { q: "$\\nabla_w\\,w^\\top Aw$ für symmetrisches $A$ ist …", opts: ["$2Aw$", "$Aw$", "$A^\\top$", "$w^\\top A$"], why: "Allgemein $(A + A^\\top)w$." },
        { q: "Die Residuen einer Kleinste-Quadrate-Geraden mit Bias summieren sich zu …", opts: ["null", "SSE", "eins", "dem Mittelwert von y"], why: "Die erste Zeile der Normalgleichung (Einsenspalte) ist $\\sum e_i = 0$." },
      ],
    },
    {
      id: "2.3", title: "Wie gut ist der Fit? R² und Anscombe", short: "R² & Anscombe", about: "Vergleich mit dem Mittelwert, negative R² auf Testdaten, Bilder ansehen",
      html: () => `
        ${nmGist([
          "Ist $L = \\frac{1}{36}$ gut? Der Wert hängt von Einheit und Skala ab. Idee: mit dem einfachsten Modell vergleichen, das immer den Mittelwert $\\bar y$ vorhersagt.",
          "$R^2 = 1 - \\frac{\\sum(y_i - \\hat y_i)^2}{\\sum(y_i - \\bar y)^2}$: $R^2 = 1$ perfekter Fit, $R^2 = 0$ nicht besser als der Mittelwert. Auf Testdaten kann $R^2$ <b>negativ</b> werden.",
          "<b>Anscombe</b>: vier Datensätze mit fast derselben Geraden und demselben $R^2$ — Nichtlinearität, Ausreißer und Hebelpunkte sieht man erst im Bild.",
        ])}
        <div class="card">
          <h3>Das Beispiel der Vorlesung</h3>
          ${tx(`R^2 = 1 - \\frac{1/6}{14/3} = \\frac{27}{28} \\approx 0{,}96,\\qquad \\bar y = \\tfrac73:\\ \\textstyle\\sum(y_i - \\bar y)^2 = \\tfrac{16}{9} + \\tfrac19 + \\tfrac{25}{9} = \\tfrac{14}{3}`)}
          <p>$R^2$ ist der Anteil der erklärten Variation von $y$. Probier es oben in ${gkSee("2.2")} mit „Mittelwert zeigen“: der Nenner ist die Summe der gestrichelten Abweichungen.</p>
          <p class="small"><b>SS 26, 2-2</b>: ein Modell <b>ohne Bias</b>, $\\hat y_i = w x_i$ mit vorgegebenem $w$. Dann kann $R^2$ auch auf den Trainingsdaten negativ werden — nur die Kleinste-Quadrate-Gerade mit Bias ist garantiert mindestens so gut wie der Mittelwert.</p>
        </div>
        <div class="card"><h3>Anscombes Quartett</h3>${gkAnscombeSVG()}<p class="small muted">Anscombe, The American Statistician 27 (1973). Alle vier: Mittelwerte, Varianzen, Gerade $\\hat y \\approx 3 + 0{,}5x$ und $R^2 \\approx 0{,}67$ fast gleich.</p></div>
        ${nmTraps([
          "$R^2$ allein beweist kein gutes Modell — erst ins Bild schauen (Anscombe).",
          "$R^2 < 0$ heißt: schlechter als der Mittelwert. Auf Trainingsdaten mit Bias unmöglich, auf Testdaten oder ohne Bias möglich.",
        ])}`,
      check: [
        { q: "Was bedeutet $R^2 = 0$?", opts: ["Das Modell ist nicht besser als der Mittelwert", "Ein perfekter Fit", "Alle Residuen sind null", "Die Gerade ist waagerecht und falsch"], why: "$\\text{SSE}_{\\text{Modell}} = \\text{SSE}_{\\text{Mittelwert}}$." },
        { q: "Kann $R^2$ negativ sein?", opts: ["Ja, z. B. auf Testdaten: dann ist das Modell schlechter als der Mittelwert", "Nein, nie", "Nur bei $N = 1$", "Nur bei Ridge"], why: "Der Zähler kann größer werden als der Nenner." },
        { q: "Was zeigt Anscombes Quartett?", opts: ["Gleiche Kennzahlen, ganz verschiedene Daten — man muss sie ansehen", "Dass $R^2$ immer 1 ist", "Dass Ausreißer keine Rolle spielen", "Dass lineare Regression immer passt"], why: "Nichtlinearität, Ausreißer, Hebelpunkte." },
        { q: "$R^2$ für $(0,1),(1,2),(2,4)$ mit der Kleinste-Quadrate-Geraden?", opts: ["$\\frac{27}{28}$", "$\\frac{1}{36}$", "$1$", "$\\frac{14}{3}$"], why: "$1 - \\frac{1/6}{14/3}$." },
      ],
    },
    {
      id: "2.4", title: "Basisfunktionen und Überanpassung", short: "Basisfunktionen", about: "φ(x), Designmatrix Φ, Polynomgrad, Training/Validierung/Test",
      html: () => `
        ${nmGist([
          "Gekrümmte Zusammenhänge: die Eingabe mit festen <b>Basisfunktionen</b> transformieren, $\\hat y = w^\\top\\phi(x)$, z. B. $\\phi(x) = (1, x, \\dots, x^M)^\\top$. <b>Nichtlinear in $x$, linear in $w$</b>: die Normalgleichung gilt unverändert, mit der Designmatrix $\\Phi$ statt $\\tilde X$.",
          "Der Grad $M$ bestimmt die Flexibilität. Zu klein: Unteranpassung. Zu groß: <b>Überanpassung</b> — Trainingsfehler null, die Gewichte explodieren, neue Daten werden schlecht vorhergesagt.",
          "Drei Datenrollen: <b>Training</b> (Parameter anpassen), <b>Validierung</b> (Grad oder $\\lambda$ wählen), <b>Test</b> (finale Leistung — nicht zum wiederholten Auswählen).",
        ])}
        ${tx(`\\hat y(x) = \\sum_{j=0}^M w_j\\phi_j(x) = w^\\top\\phi(x),\\qquad \\Phi = \\begin{pmatrix}\\phi_0(x_1)&\\cdots&\\phi_M(x_1)\\\\\\vdots&\\ddots&\\vdots\\\\\\phi_0(x_N)&\\cdots&\\phi_M(x_N)\\end{pmatrix},\\qquad w^\\star = (\\Phi^\\top\\Phi)^{-1}\\Phi^\\top y`)}
        ${pw("poly", `${pseg("kind", [["poly", "Polynom"], ["gauss", "Gauß-Glocken"]], "poly")}${pslider("M", "Grad M", 0, 9, 1, 3)}`, { wide: true })}
        <div class="card">
          <h3>Typische Basisfunktionen</h3>
          ${ppFacts([
            ["Polynom", "$\\phi_j(x) = x^j$ — ändert die Kurve überall."],
            ["Gauß-Glocke", "$\\phi_j(x) = \\exp\\big(-\\frac{(x - \\mu_j)^2}{2s^2}\\big)$ — wirkt nur in der Nähe von $\\mu_j$."],
            ["Sigmoid", "$\\phi_j(x) = \\sigma\\big(\\frac{x - \\mu_j}{s}\\big)$ mit $\\sigma(a) = \\frac{1}{1 + e^{-a}}$ — ebenfalls lokal."],
            ["Zwei Eingaben", "$\\phi(x) = (1, x_1, x_2)^\\top$ gibt eine Ebene, $(1, x_1, x_2, x_1^2, x_1x_2, x_2^2)^\\top$ eine gekrümmte Fläche; der Mischterm $x_1x_2$ erfasst Wechselwirkungen. Multiple lineare Regression ist der Spezialfall $\\phi(x) = \\tilde x$."],
          ])}
          <p>$\\phi_0(x) = 1$ übernimmt den Bias. $\\mu_j$ und $s$ legen wir vorher fest — gelernt werden nur die Gewichte $w$. Das ist auch der Unterschied zu neuronalen Netzen (SS 25, 3-4): dort werden die Merkmale selbst gelernt, und das Modell ist nichtlinear in den Parametern.</p>
          <h3>Die Gewichte explodieren (Bishop, Tab. 1.1)</h3>
          <table class="len-terms nm-tab"><thead><tr><th></th><th>M = 0</th><th>M = 1</th><th>M = 3</th><th>M = 9</th></tr></thead><tbody>
            <tr><th>$w_0^\\star$</th><td>0,19</td><td>0,82</td><td>0,31</td><td>0,35</td></tr>
            <tr><th>$w_1^\\star$</th><td></td><td>−1,27</td><td>7,99</td><td>232,37</td></tr>
            <tr><th>$w_3^\\star$</th><td></td><td></td><td>17,37</td><td class="nm-err">48 568,31</td></tr>
            <tr><th>$w_6^\\star$</th><td></td><td></td><td></td><td class="nm-err">−1 061 800,52</td></tr></tbody></table>
          <p class="small">Für $M = 9$ wachsen die Gewichte auf Hunderttausende, mit wechselnden Vorzeichen. Idee: große Gewichte im Loss bestrafen (${gkSee("2.5")}).</p>
        </div>
        ${nmTraps([
          "Den Grad (allgemein: jeden Hyperparameter) auf den <b>Validierungsdaten</b> wählen, nicht auf den Trainings- und nicht auf den Testdaten. Wer auf dem Test auswählt, schätzt die Leistung zu optimistisch (WS 23/24, WS 25/26: „Schummeln“).",
          "Polynomregression ist lineare Regression: linear in den Parametern, mit fester Merkmalsabbildung.",
          "Großer Validierungsfehler bei kleinem Trainingsfehler: hohe Varianz, kleiner Bias — Überanpassung (SS 25, 3-2).",
        ])}`,
      setup: (root) => gkWPoly(root, "poly", false),
      check: [
        { q: "Ein Polynom vom Grad $M$ als Basis: ist das Modell linear?", opts: ["Linear in $w$, nichtlinear in $x$", "Nichtlinear in $w$", "Linear in $x$", "Weder noch"], why: "Deshalb gilt die Normalgleichung mit $\\Phi$." },
        { q: "Trainingsfehler fast 0, Validierungsfehler groß. Was liegt vor?", opts: ["Überanpassung (hohe Varianz)", "Unteranpassung", "Ein Fehler in den Daten", "Ein zu kleiner Grad"], why: "Das Modell folgt dem Rauschen." },
        { q: "Worauf wählt man den Polynomgrad $M$?", opts: ["Auf den Validierungsdaten", "Auf den Trainingsdaten", "Auf den Testdaten", "Immer $M = N - 1$"], why: "Der Test bleibt für die finale Bewertung." },
        { q: "Was wird bei Gauß-Basisfunktionen gelernt?", opts: ["Nur die Gewichte $w$", "Die Zentren $\\mu_j$", "Die Breite $s$", "Alles"], why: "$\\mu_j$ und $s$ werden vorher festgelegt." },
        { q: "Welchen Effekt hat der Mischterm $x_1x_2$ in $\\phi(x)$?", opts: ["Er erfasst Wechselwirkungen zwischen den Eingaben", "Er ist der Bias", "Er regularisiert", "Er macht das Modell nichtlinear in $w$"], why: "Gekrümmte Fläche statt Ebene." },
      ],
    },
    {
      id: "2.5", title: "Ridge-Regression", short: "Ridge", about: "L2-Strafterm, λ, R = diag(0, 1, …, 1), geschlossene Lösung",
      html: () => `
        ${nmGist([
          "Große Gewichte im Loss bestrafen: $L_\\lambda(\\tilde w) = \\frac{1}{2N}\\|y - \\tilde X\\tilde w\\|^2 + \\frac\\lambda2\\tilde w^\\top R\\tilde w$ — Datenterm (guter Fit) plus Strafterm (kleine Gewichte).",
          "$\\lambda$ steuert den Kompromiss: $\\lambda = 0$ ist Least Squares, großes $\\lambda$ drückt $w$ gegen null. $R = \\diag(0, 1, \\dots, 1)$ nimmt den Bias von der Strafe aus.",
          "Lösung: $\\tilde w^\\star_{\\text{ridge}} = (\\tilde X^\\top\\tilde X + N\\lambda R)^{-1}\\tilde X^\\top y$ — für $\\lambda > 0$ immer invertierbar. $\\lambda$ ist ein Hyperparameter und wird auf den Validierungsdaten gewählt.",
        ])}
        ${pw("ridge", `${pslider("ll", "ln λ", -35, 2, 1, -18)}`, { wide: true })}
        <div class="card">
          <h3>Herleitung</h3>
          <p>Wie in ${gkSee("2.2")}: der Strafterm $\\frac\\lambda2\\tilde w^\\top R\\tilde w$ liefert nach Regel 2 den Zusatzterm $\\lambda R\\tilde w$ ($R$ ist symmetrisch):</p>
          ${tx(`\\nabla L_\\lambda = \\frac1N\\tilde X^\\top(\\tilde X\\tilde w - y) + \\lambda R\\tilde w \\overset!= 0\\quad\\Rightarrow\\quad (\\tilde X^\\top\\tilde X + N\\lambda R)\\,\\tilde w = \\tilde X^\\top y`)}
          <p>Mit $N$ multipliziert steht daher $N\\lambda R$ in der Lösung. Mit Basisfunktionen ersetzt $\\Phi$ einfach $\\tilde X$. Bishops $\\lambda$ entspricht $N\\lambda$ in unserem gemittelten Loss.</p>
          ${ppFacts([
            ["Namen", "L2-Regularisierung heißt in der Statistik Ridge-Regression, bei neuronalen Netzen <b>weight decay</b>."],
            ["L1 statt L2 (WS 24/25, WS 25/26)", "Strafterm $\\lambda\\sum_j|w_j|$ (Lasso) statt $\\frac\\lambda2\\sum_jw_j^2$. L1 drückt viele Gewichte <b>exakt auf null</b> — Merkmalsauswahl, eine sparse Lösung. L2 macht alle Gewichte klein, aber selten genau null; eine sparse Lösung bekäme man dort z. B. durch Abschneiden kleiner Gewichte (Schwelle)."],
          ])}
        </div>
        ${nmTraps([
          "Der Bias wird nicht bestraft — die Null oben links in $R$. Sonst hinge das Ergebnis davon ab, wo der Nullpunkt von $y$ liegt.",
          "Zu großes $\\lambda$: Unteranpassung. $\\lambda$ wählt man wie den Grad auf den Validierungsdaten.",
          "In der Lösung steht $N\\lambda R$, nicht $\\lambda R$ — wegen des $\\frac{1}{2N}$ im Datenterm.",
        ])}`,
      setup: (root) => gkWPoly(root, "ridge", true),
      check: [
        { q: "Wie lautet die Ridge-Lösung (mit unserem gemittelten Loss)?", opts: ["$(\\tilde X^\\top\\tilde X + N\\lambda R)^{-1}\\tilde X^\\top y$", "$(\\tilde X^\\top\\tilde X)^{-1}\\tilde X^\\top y + \\lambda$", "$(\\tilde X^\\top\\tilde X - \\lambda I)^{-1}\\tilde X^\\top y$", "$\\lambda\\tilde X^\\top y$"], why: "Gradient null setzen und mit $N$ multiplizieren." },
        { q: "Wozu steht in $R = \\diag(0, 1, \\dots, 1)$ die Null?", opts: ["Der Bias wird nicht bestraft", "Damit $R$ invertierbar ist", "Für das erste Merkmal", "Sie ist ein Tippfehler"], why: "Nur die Gewichte $w_1, \\dots, w_D$ werden klein gehalten." },
        { q: "Was passiert für sehr großes $\\lambda$?", opts: ["Die Gewichte gehen gegen null — Unteranpassung", "Überanpassung", "Nichts", "Der Bias wird null"], why: "Der Strafterm dominiert." },
        { q: "Welche Regularisierung führt direkt zu Gewichten, die exakt null sind?", opts: ["L1", "L2", "Beide gleich", "Keine"], why: "L1 (Lasso) ergibt sparse Lösungen — Merkmalsauswahl." },
        { q: "Warum ist $\\tilde X^\\top\\tilde X + N\\lambda R$ für $\\lambda > 0$ invertierbar (bei Einsenspalte)?", opts: ["Der Strafterm macht die Matrix positiv definit", "Weil $N > D$", "Weil $R$ diagonal ist", "Sie ist es nicht"], why: "Auch bei linear abhängigen Merkmalen gibt es eine eindeutige Lösung." },
      ],
    },
    {
      id: "2.6", title: "Wahrscheinlichkeiten und der Satz von Bayes", short: "Bayes", about: "Masse und Dichte, Randverteilung, Bedingen, Bayes, i.i.d.",
      html: () => `
        ${nmGist([
          "Bisher die Optimierungssicht: wir haben den quadratischen Fehler gewählt. Jetzt die probabilistische Sicht: <b>Daten = Modell + zufälliges Rauschen</b>, $y = \\tilde w^\\top\\tilde x + \\varepsilon$, $\\varepsilon \\sim \\mathcal N(0, \\sigma^2)$.",
          "<b>Marginalisieren</b>: über die andere Variable summieren (die Ränder der Tabelle). <b>Konditionieren</b>: auf eine Zeile einschränken und neu normieren. Produktregel $p(x, y) = p(y \\mid x)p(x)$.",
          "<b>Bayes</b> kehrt die Bedingung um: $p(x \\mid y) = \\frac{p(y \\mid x)\\,p(x)}{p(y)}$ — Prior $p(x)$ und Beobachtungsmodell $p(y \\mid x)$ ergeben den Posterior; der Nenner $p(y) = \\sum_{x'}p(y \\mid x')p(x')$ normiert.",
        ])}
        ${pw("joint", `${pseg("set", Object.entries(GK_JOINT).map(([k, v]) => [k, v.name]), "wetter")}${pseg("order", [["rows", "erst Zeilen"], ["cols", "erst Spalten"]], "rows")}`, { wide: true })}
        <div class="card">
          <h3>Masse und Dichte</h3>
          <p>Diskret: $p(x) = P(X = x)$, die Balken addieren sich zu 1. Stetig: eine <b>Dichte</b> $p(x)$, Wahrscheinlichkeit = Fläche, $P(a \\le X \\le b) = \\int_a^b p(x)\\,dx$, $\\int_{-\\infty}^\\infty p(x)\\,dx = 1$. Eine Dichte ist keine Punktwahrscheinlichkeit und darf größer als 1 sein: Gleichverteilung auf $[0; 0{,}5]$ hat Dichte 2, das Intervall $[0; 0{,}25]$ Wahrscheinlichkeit 0,5.</p>
          <h3>Das Beispiel der Vorlesung</h3>
          ${tx(`P(\\text{warm} \\mid \\text{Sonne}) = \\frac{P(\\text{Sonne} \\mid \\text{warm})\\,P(\\text{warm})}{P(\\text{Sonne})} = \\frac{0{,}8 \\cdot 0{,}5}{0{,}6} = \\frac23`)}
          <p class="small">Kontrolle in der Tabelle: $P(\\text{warm}, \\text{Sonne}) = 0{,}4$ und $0{,}4 / 0{,}6 = \\frac23$.</p>
          <h3>Übung 2, Aufgabe 2(a): der Frostsensor</h3>
          <p>$P(F) = 0{,}20 + 0{,}05 = 0{,}25$, $P(M) = 0{,}20 + 0{,}15 = 0{,}35$. $P(M \\mid F) = \\frac{0{,}20}{0{,}25} = 0{,}8$, aber $P(F \\mid M) = \\frac{0{,}20}{0{,}35} = \\frac47 \\approx 0{,}57$.
            Warum so viel kleiner? Frost ist selten (Prior 0,25), und der Sensor meldet auch ohne Frost oft (0,15) — viele Meldungen sind Fehlalarme. Dasselbe wie bei der Prävalenz (${gkSee("3.2")}).</p>
          <h3>Zwei Beobachtungen (SS 23, Aufgabe 2)</h3>
          <p>Sind die Beobachtungen <b>gegeben dem Zustand unabhängig</b>, $p(y_2 \\mid x, y_1) = p(y_2 \\mid x)$, dann wird der Posterior nach $y_1$ zum Prior für $y_2$: $p(x \\mid y_1, y_2) \\propto p(y_2 \\mid x)\\,p(y_1 \\mid x)\\,p(x)$. Das ist die Grundidee des Filterns (VL 13).</p>
          <h3>Unabhängig und identisch verteilt: i.i.d.</h3>
          <p>Unabhängig: die gemeinsame Verteilung faktorisiert, $p(x, y) = p(x)p(y)$ bzw. $p(x_1, \\dots, x_N) = \\prod_i p(x_i)$. Identisch verteilt: dieselbe Datenverteilung für alle Beispiele. Zeitliche Abhängigkeit oder Verteilungsverschiebung erfordern andere Annahmen.</p>
        </div>
        ${nmTraps([
          "$P(F \\mid M) \\neq P(M \\mid F)$. Der Satz von Bayes braucht den Prior — bei seltenen Ereignissen ist der Posterior oft überraschend klein.",
          "Konditionieren heißt <b>neu normieren</b>: die eingeschränkte Zeile durch ihre Summe teilen.",
          "$p(y)$ im Nenner mit der totalen Wahrscheinlichkeit: $p(y) = \\sum_x p(y \\mid x)p(x)$ (SS 23, 2.2).",
        ])}`,
      setup: (root) => gkWJoint(root),
      check: [
        { q: "Tabelle: warm/Sonne 0,4, warm/Regen 0,1, kalt/Sonne 0,2, kalt/Regen 0,3. Was ist $P(\\text{Sonne})$?", opts: ["$0{,}6$", "$0{,}4$", "$0{,}5$", "$0{,}8$"], why: "Spalte summieren: $0{,}4 + 0{,}2$." },
        { q: "Dieselbe Tabelle: $P(\\text{Sonne} \\mid \\text{warm})$?", opts: ["$0{,}8$", "$0{,}4$", "$\\frac23$", "$0{,}5$"], why: "$0{,}4 / 0{,}5$." },
        { q: "Frostsensor: $P(M, F) = 0{,}2$, $P(M) = 0{,}35$. Was ist $P(F \\mid M)$?", opts: ["$\\frac47$", "$0{,}8$", "$0{,}2$", "$0{,}35$"], why: "$0{,}2 / 0{,}35$." },
        { q: "Wie heißt $p(x)$ im Satz von Bayes $p(x \\mid y) = \\frac{p(y \\mid x)p(x)}{p(y)}$?", opts: ["Prior", "Posterior", "Likelihood", "Evidenz"], why: "Vor der Beobachtung. $p(y \\mid x)$ ist das Beobachtungsmodell (Likelihood), $p(y)$ die Evidenz." },
        { q: "Eine Dichte hat an einer Stelle den Wert 2. Ist das erlaubt?", opts: ["Ja — nur Flächen müssen Wahrscheinlichkeiten sein", "Nein, Wahrscheinlichkeiten sind höchstens 1", "Nur bei diskreten Variablen", "Nur bei der Gauß-Verteilung"], why: "Gleichverteilung auf $[0; 0{,}5]$ hat überall Dichte 2." },
      ],
    },
    {
      id: "2.7", title: "Erwartungswert, Monte Carlo und die Gauß-Verteilung", short: "E, Monte Carlo, Gauß", about: "Erwartungswert, Varianz, Stichproben mitteln, μ und σ²",
      html: () => `
        ${nmGist([
          "<b>Erwartungswert</b> $\\mathbb E[x] = \\sum_x x\\,p(x)$: der langfristige Mittelwert, der Schwerpunkt. <b>Varianz</b> $\\mathrm{Var}[x] = \\mathbb E[(x - \\mathbb E[x])^2]$: mittlere quadratische Abweichung. Fairer Würfel: $3{,}5$ und $\\frac{35}{12} \\approx 2{,}917$.",
          "<b>Monte Carlo</b>: statt ein schwieriges Integral auszurechnen, Stichproben ziehen und mitteln, $\\mathbb E[f(x)] \\approx \\frac1M\\sum_m f(x_m)$. Der Fehler sinkt typischerweise wie $1/\\sqrt M$.",
          "<b>Gauß</b>: Mittelwert $\\mu$, Varianz $\\sigma^2$ — eine Dichte über reellen Zahlen, ein konkretes Rauschmodell (keine notwendige Annahme jeder Regression).",
        ])}
        ${pw("mc", `<div class="lw-btns">${pbtn("a10", "+10")}${pbtn("a100", "+100", "primary")}${pbtn("a1000", "+1000")}${pbtn("reset", "neu")}</div>`, { wide: true })}
        ${tx(`\\mathcal N(x \\mid \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\exp\\!\\Big(-\\frac{(x - \\mu)^2}{2\\sigma^2}\\Big)`)}
        ${pw("gauss", `${pslider("mu", "μ", -3, 3, 0.1, 0)}${pslider("s", "σ", 0.15, 2.5, 0.05, 1)}`, { wide: true })}
        <div class="card">
          <h3>Rechnen mit Erwartungswerten</h3>
          <p>Erwartungswerte sind <b>linear</b>: $\\mathbb E[ax + by] = a\\mathbb E[x] + b\\mathbb E[y]$, immer. Varianzen addieren sich nur unter passenden Bedingungen (unkorreliert): dann $\\mathrm{Var}[x + y] = \\mathrm{Var}[x] + \\mathrm{Var}[y]$ und $\\mathrm{Var}[ax] = a^2\\mathrm{Var}[x]$.
            Daraus folgt später die Ensemble-Formel (VL 6, WS 23/24): der Mittelwert von $m$ <b>unabhängigen</b> Vorhersagen mit Varianz $\\sigma^2$ hat Varianz $\\frac{\\sigma^2}{m}$.</p>
          <p>Monte Carlo ist ein Werkzeug für latente Modelle und Reinforcement Learning (SS 23, 8.1: Monte-Carlo-Methoden schätzen dort den Wert einer Policy aus ganzen Episoden).</p>
        </div>
        ${nmTraps([
          `Die Gauß-Verteilung ist eine Dichte über reellen Zahlen, keine Klassenverteilung — für Labels 0/1 nimmt man Bernoulli (${gkSee("3.4")}).`,
          "Doppelt so viele Stichproben halbieren den Fehler nicht: $1/\\sqrt M$ — für halben Fehler braucht man viermal so viele.",
        ])}`,
      setup: (root) => { gkWMC(root); gkWGauss(root); },
      check: [
        { q: "Erwartungswert eines fairen Würfels?", opts: ["$3{,}5$", "$3$", "$\\frac{35}{12}$", "$6$"], why: "$\\frac{1 + \\dots + 6}{6}$; die Varianz ist $\\frac{35}{12}$." },
        { q: "Wie sinkt der Monte-Carlo-Fehler typischerweise mit der Zahl $M$ der Stichproben?", opts: ["Wie $1/\\sqrt M$", "Wie $1/M$", "Wie $1/M^2$", "Gar nicht"], why: "Hundertmal so viele Stichproben, zehnmal kleinerer Fehler." },
        { q: "Punkte gleichverteilt in $[-1, 1]^2$: was schätzt der Anteil im Einheitskreis?", opts: ["$\\pi/4$", "$\\pi$", "$1/\\pi$", "$\\pi/2$"], why: "Kreisfläche $\\pi$ durch Quadratfläche 4." },
        { q: "Welche Parameter hat die Gauß-Verteilung?", opts: ["Mittelwert $\\mu$ und Varianz $\\sigma^2$", "Nur $\\mu$", "$\\pi$ und $k$", "Gewichte $w$"], why: "Lage und Streuung." },
        { q: "Was gilt immer?", opts: ["$\\mathbb E[x + y] = \\mathbb E[x] + \\mathbb E[y]$", "$\\mathrm{Var}[x + y] = \\mathrm{Var}[x] + \\mathrm{Var}[y]$", "$\\mathbb E[xy] = \\mathbb E[x]\\mathbb E[y]$", "$\\mathrm{Var}[2x] = 2\\mathrm{Var}[x]$"], why: "Linearität des Erwartungswerts. Die Varianz-Summe braucht Unkorreliertheit, und $\\mathrm{Var}[2x] = 4\\mathrm{Var}[x]$." },
      ],
    },
    {
      id: "2.8", title: "Maximum Likelihood", short: "Maximum Likelihood", about: "Münze, Log-Likelihood, Gauß-MLE, kleinste Quadrate = Gauß-MLE",
      html: () => `
        ${nmGist([
          "Welche Parameter machen die beobachteten Daten am wahrscheinlichsten? Die <b>Likelihood</b> $\\mathrm{Lik}(\\theta) = \\prod_i p_\\theta(y_i \\mid x_i)$ — die Daten stehen fest, $\\theta$ wird variiert.",
          "Man maximiert die <b>Log-Likelihood</b> (streng monoton: derselbe Maximierer, aus dem Produkt wird eine Summe) bzw. minimiert die negative. Division durch $N$ ändert den Minimierer nicht.",
          "Lineares Gauß-Modell: $-\\log\\mathrm{Lik}(\\tilde w) = c + \\frac{N}{\\sigma^2}L(\\tilde w)$. Bei fester $\\sigma^2$ hängen nur die Fehlerquadrate von $\\tilde w$ ab: <b>kleinste Quadrate = Gauß-MLE</b>. Die Ziele sind nicht identisch, ihre Minimierer stimmen überein.",
        ])}
        ${pw("lik", `${pseg("mode", [["coin", "Münze"], ["gau", "Gauß (2, 4, 6)"]], "coin")}
          <div class="gk-coin">${pslider("N", "Würfe N", 1, 30, 1, 10)}${pslider("k", "Kopf k", 0, 10, 1, 7)}${pseg("log", [[0, "Lik"], [1, "log Lik"]], 0)}</div>
          <div class="gk-gau" hidden>${pslider("mu", "μ", 0, 8, 0.1, 3)}${pslider("v", "σ²", 0.5, 10, 0.1, 2)}</div>`, { wide: true })}
        <div class="card">
          <h3>Übung 2, Aufgabe 2(b): die Münze</h3>
          ${tx(`\\mathrm{Lik}(\\pi) = \\pi^k(1 - \\pi)^{N-k},\\quad \\log\\mathrm{Lik}(\\pi) = k\\log\\pi + (N - k)\\log(1 - \\pi),\\quad \\frac{k}{\\pi} - \\frac{N - k}{1 - \\pi} \\overset!= 0\\ \\Rightarrow\\ \\hat\\pi = \\frac kN`)}
          <p>Siebenmal Kopf, dreimal Zahl: $\\hat\\pi = 0{,}7$. <b>Drei Würfe, dreimal Kopf</b>: $\\hat\\pi = 1$ — Zahl wäre „unmöglich“. Zur Vorhersage des nächsten Wurfs taugt das nicht: bei wenig Daten überanpasst die ML-Schätzung. (Ein Prior hilft, etwa $\\frac{k+1}{N+2}$ — das kommt später.)</p>
          <h3>Gauß-MLE</h3>
          ${tx(`\\hat\\mu = \\frac1N\\sum_i x_i,\\qquad \\hat\\sigma^2 = \\frac1N\\sum_i (x_i - \\hat\\mu)^2;\\qquad x = (2, 4, 6):\\ \\hat\\mu = 4,\\ \\hat\\sigma^2 = \\tfrac83`)}
          <p class="small">MLE und unverzerrte Stichprobenvarianz ($\\frac{1}{N-1}$) sind verschiedene Schätzer.</p>
          <h3>Übung 2, Aufgabe 2(c) und SS 26, 2-1: kleinste Quadrate = Gauß-Likelihood</h3>
          ${tx(`p(y_i \\mid x_i; \\tilde w, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\exp\\!\\Big(-\\frac{(y_i - \\tilde w^\\top\\tilde x_i)^2}{2\\sigma^2}\\Big)`)}
          ${tx(`-\\log\\mathrm{Lik}(\\tilde w) = -\\sum_{i=1}^N\\log p(y_i \\mid x_i) = \\frac N2\\log(2\\pi\\sigma^2) + \\frac{1}{2\\sigma^2}\\sum_{i=1}^N(y_i - \\tilde w^\\top\\tilde x_i)^2`)}
          <p>Der erste Summand hängt nicht von $\\tilde w$ ab, der zweite ist $\\frac{1}{2\\sigma^2}\\text{SSE} = \\frac{N}{2\\sigma^2}\\text{MSE}$ — ein positives Vielfaches. Also hat Maximieren der Likelihood denselben Minimierer wie Minimieren von SSE oder MSE.
            Annahmen: unabhängige Fehler mit gleicher Varianz — eine konkrete Modellannahme. Bonus: die Verteilung sagt, wie (un)sicher eine Vorhersage ist.</p>
          <table class="len-terms"><thead><tr><th>Optimierungssicht</th><th>Probabilistische Sicht</th></tr></thead><tbody>
            <tr><td>Lineares Modell + quadratischer Fehler</td><td>Gauß-Modell + Maximum Likelihood</td></tr>
            <tr><td>Gewichte aus der Normalgleichung</td><td>Parameter mit maximaler bedingter Likelihood</td></tr>
            <tr><td>Nächste VL: Kreuzentropie</td><td>Nächste VL: Bernoulli-/kategoriale Likelihood</td></tr></tbody></table>
        </div>
        ${gkSelf([
          ["Drei Würfe, dreimal Kopf: was liefert die ML-Schätzung für $\\pi$? Würden Sie damit den nächsten Wurf vorhersagen?", "$\\hat\\pi = 1$. Nein — drei Würfe sind zu wenig, Zahl ist sicher nicht unmöglich."],
          ["Warum liefern Gauß-MLE und quadratischer Fehler dieselben Regressionsgewichte?", "$-\\log\\mathrm{Lik} = \\text{Konstante} + \\frac{1}{2\\sigma^2}\\text{SSE}$: bei fester Varianz ein positives Vielfaches plus Konstante — gleicher Minimierer."],
        ])}
        ${nmTraps([
          "Die Likelihood ist keine Wahrscheinlichkeitsverteilung über $\\theta$ — sie muss über $\\theta$ nicht zu 1 integrieren.",
          "Beim Zeigen „MLE = SSE“: die Konstante $\\frac N2\\log(2\\pi\\sigma^2)$ ausdrücklich als unabhängig von $\\tilde w$ benennen, und das Vorzeichen (maximieren ↔ minimieren) sauber umdrehen.",
        ])}`,
      setup: (root) => gkWLik(root),
      check: [
        { q: "Sieben Kopf, drei Zahl. Was ist die ML-Schätzung $\\hat\\pi$?", opts: ["$0{,}7$", "$0{,}5$", "$0{,}3$", "$7$"], why: "$\\hat\\pi = k/N$." },
        { q: "Warum darf man die Log-Likelihood statt der Likelihood maximieren?", opts: ["log ist streng monoton: derselbe Maximierer", "Weil sie immer positiv ist", "Weil sie kleiner ist", "Darf man nicht"], why: "Und aus dem Produkt wird eine Summe." },
        { q: "Daten $2, 4, 6$: was ist $\\hat\\sigma^2$ (MLE)?", opts: ["$\\frac83$", "$4$", "$\\frac{8}{2}$", "$2$"], why: "$\\frac13(4 + 0 + 4)$ — mit $\\frac1N$, nicht $\\frac{1}{N-1}$." },
        { q: "Unter welcher Annahme ist Maximum Likelihood dasselbe wie kleinste Quadrate?", opts: ["Unabhängiges Gauß-Rauschen mit fester Varianz", "Bernoulli-Labels", "Gleichverteiltes Rauschen", "Immer"], why: "$-\\log\\mathrm{Lik} = c + \\frac{1}{2\\sigma^2}\\text{SSE}$." },
        { q: "Drei Würfe, dreimal Kopf: $\\hat\\pi = 1$. Was ist das Problem?", opts: ["Bei wenig Daten überanpasst die ML-Schätzung", "Die Rechnung ist falsch", "Die Likelihood ist null", "Nichts"], why: "Zahl wäre unmöglich." },
      ],
    },
  ],
});
