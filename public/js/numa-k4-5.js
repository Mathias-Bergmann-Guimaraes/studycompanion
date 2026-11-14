// NuMa chapters 4 and 5, from the Skript and the lectures VL07–VL09 (Kapitel 4: Polynom-,
// Tschebyscheff- und Spline-Interpolation) and VL10–VL11 (Kapitel 5: Quadratur). The drawings:
// polynomial interpolation with equidistant or Chebyshev nodes and its Lebesgue function, the table
// of divided differences step by step, the node polynomial w_{N+1} for both kinds of nodes, cubic
// splines with three kinds of boundary conditions, a quadrature rule's area, a rule's weights and
// order from its nodes, and the error of summed rules as h shrinks.

/* ================================================================ Kapitel 4 */

// Interpolation in Lagrange form, evaluated directly (N ≤ 25).
const nmLagr = (xs, n, x) => xs.reduce((p, xm, m) => (m === n ? p : (p * (x - xm)) / (xs[n] - xm)), 1);
const nmInterp = (xs, fs) => (x) => fs.reduce((s, f, n) => s + f * nmLagr(xs, n, x), 0);
const nmNodes = (N, kind, a = -1, b = 1) => Array.from({ length: N + 1 }, (_, n) =>
  kind === "cheb" ? (a + b) / 2 + ((b - a) / 2) * Math.cos(((2 * n + 1) / (2 * N + 2)) * Math.PI) : a + ((b - a) * n) / N);

const NM_IP_FNS = {
  runge: { name: "1/(1 + 25x²)", f: (x) => 1 / (1 + 25 * x * x), y: [-0.6, 1.6] },
  sin: { name: "sin(πx)", f: (x) => Math.sin(Math.PI * x), y: [-1.6, 1.6] },
  abs: { name: "|x|", f: Math.abs, y: [-0.4, 1.4] },
};

/* ---------------------------------------------------------------- 4.1 Polynominterpolation */

function nmWInterp(root) {
  const { w, fig, read } = ppW(root, "ip");
  const st = { fn: "runge", N: 10, kind: "eq", leb: 0 };
  const draw = () => {
    const G = NM_IP_FNS[st.fn], xs = nmNodes(st.N, st.kind), fs = xs.map(G.f), p = nmInterp(xs, fs);
    const lebf = (x) => xs.reduce((s, _, n) => s + Math.abs(nmLagr(xs, n, x)), 0);
    let err = 0, lam = 0;
    for (let i = 0; i <= 2000; i++) { const x = -1 + i / 1000; err = Math.max(err, Math.abs(G.f(x) - p(x))); lam = Math.max(lam, lebf(x)); }
    lenOut(w, "N", st.N);
    const yr = st.leb ? [0, Math.max(3, Math.min(lam * 1.1, 60))] : G.y;
    const P = nmFrame(520, 280, [-1, 1], yr);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 280" role="img" aria-label="Interpolationspolynom">
      <defs><clipPath id="nmIpClip"><rect x="34" y="12" width="474" height="242"/></clipPath></defs>
      ${P.axes({ xl: "x" })}<g clip-path="url(#nmIpClip)">
      ${st.leb ? `<path d="${P.path(lebf, 800)}" class="curve nm-err-c"/><line x1="34" y1="${P.Y(1)}" x2="508" y2="${P.Y(1)}" class="guide"/>`
        : `<path d="${P.path(G.f, 400)}" class="curve nm-exact-c"/><path d="${P.path(p, 800)}" class="curve nm-approx-c"/>`}</g>
      ${st.leb ? xs.map((x) => `<circle cx="${P.X(x)}" cy="${P.Y(1)}" r="3.5" class="pt nm-data-pt"/>`).join("") : xs.map((x, n) => `<circle cx="${P.X(x)}" cy="${P.Y(fs[n])}" r="4" class="pt nm-data-pt"/>`).join("")}</svg>`;
    read.innerHTML = `<div class="lw-vals"><span>Stützstellen</span><b>${st.N + 1}</b><span>Grad ≤</span><b>${st.N}</b>
      <span>max |f − p|</span><b class="nm-err">${nmSci(err)}</b><span>Lebesgue-Konstante Λ<sub>N</sub></span><b>${nmD(lam, 2)}</b></div>
      <p class="small">${st.leb ? `Rot: die Lebesgue-Funktion Σ|L<sub>n</sub>(x)|. Ihr Maximum Λ<sub>N</sub> sagt, wie stark sich Fehler in den Werten f<sub>n</sub> höchstens verstärken. ${st.kind === "eq" ? "Äquidistant explodiert sie am Rand." : "Tschebyscheff: klein und gleichmäßig."}`
        : st.kind === "eq" && st.fn === "runge" && st.N >= 8 ? "Das <b>Runge-Phänomen</b>: mit mehr äquidistanten Stützstellen wird es am Rand schlechter, nicht besser." : st.kind === "cheb" ? "Tschebyscheff-Stützstellen häufen sich am Rand — der Fehler ist gleichmäßig verteilt." : "Grün f, blau das Interpolationspolynom p."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 4.2 Dividierte Differenzen */

const NM_DD_PRESETS = {
  vl: { x: [-1, 0, 1, 3], f: [1, 6, -3, 3], add: [2, 4] },
  ss24: { x: [1, 2, 4, 5], f: [3, 3, 63, 99], add: [0, 59] },
  ws2223: { x: [0, 2, 3, 4], f: [2, 2, 5, 6], add: [1, 3] },
};
function nmDDTable(xs, fs) {
  const T = [fs.map((f) => nmQ(f))];
  for (let k = 1; k < xs.length; k++) T.push(T[k - 1].slice(0, -1).map((_, n) => T[k - 1][n].sub(T[k - 1][n + 1]).div(nmQ(xs[n] - xs[n + k]))));
  return T; // T[k][n] = f_{n, n+k}
}
// Newton form p(x) = f00 + f01 (x − x0) + … as HTML.
function nmNewtonForm(xs, coef) {
  const fac = (k) => xs.slice(0, k).map((x) => `(x ${x < 0 ? "+" : "−"} ${Math.abs(x)})`).join("").replace(/\(x − 0\)/g, "x");
  return coef.map((c, k) => (c.zero && k ? "" : `${k ? (c.n < 0 ? " − " : " + ") : c.n < 0 ? "−" : ""}${k && Math.abs(c.n) === c.d ? "" : nmQ(Math.abs(c.n), c.d).html()}${fac(k)}`)).join("");
}
function nmWDD(root) {
  const { w, fig, read } = ppW(root, "dd");
  const st = { set: "vl", col: 0, added: false, xs: [], fs: [] };
  const load = () => {
    const S = NM_DD_PRESETS[st.set];
    st.xs = [...S.x]; st.fs = [...S.f]; st.added = false; st.col = 0;
  };
  const draw = () => {
    const T = nmDDTable(st.xs, st.fs), N = st.xs.length;
    const rows = st.xs.map((x, n) => `<tr><td>x<sub>${n}</sub> = ${x}</td>${T.map((col, k) => {
      const i = n - k;
      if (i < 0 || k > st.col) return "<td></td>";
      const diag = i === 0;
      return `<td class="${diag ? "nm-piv-cell" : ""} ${k === st.col && k ? "nm-new" : ""}">${col[i].html()}</td>`;
    }).join("")}</tr>`).join("");
    fig.innerHTML = `<div class="nm-scroll"><table class="len-terms nm-dd"><thead><tr><th>x<sub>n</sub></th><th>f<sub>n,n</sub></th>${T.slice(1).map((_, k) => `<th>${"←".repeat(0)}${k + 1}. dividierte Diff.</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
    const k = st.col, ex = k ? T[k][0] : null;
    read.innerHTML = `${k ? `<p class="small">Spalte ${k}: ${F(`f<sub>n,n+${k}</sub> = ${frac(`f<sub>n,n+${k - 1}</sub> − f<sub>n+1,n+${k}</sub>`, `x<sub>n</sub> − x<sub>n+${k}</sub>`)}`, "small-f")}
        z. B. f<sub>0,${k}</sub> = (${T[k - 1][0].html()} − ${T[k - 1][1].html()}) / (${st.xs[0]} − ${st.xs[k]}) = <b>${ex.html()}</b>.</p>` : `<p class="small">Erste Spalte: die Werte f<sub>n,n</sub> = f<sub>n</sub>. Jede weitere Spalte entsteht aus zwei Nachbarn links.</p>`}
      ${k === N - 1 ? `<p class="small">Die <b>Diagonale</b> (gold) liefert die Koeffizienten:</p>${F(`p(x) = ${nmNewtonForm(st.xs, T.map((c) => c[0]))}`, "small-f")}
        ${st.added ? `<p class="small">Mit dem neuen Punkt kommt nur <b>ein</b> Summand dazu: p<sub>0,N</sub> = p<sub>0,N−1</sub> + f<sub>0,N</sub>w<sub>N</sub> — der Rest bleibt.</p>` : ""}` : ""}`;
    $('[data-a="prev"]', w).disabled = st.col === 0;
    $('[data-a="next"]', w).disabled = st.col === N - 1;
    $('[data-a="add"]', w).disabled = st.added || st.col < N - 1;
  };
  const { on } = ppW(root, "dd");
  on("prev", () => { st.col--; draw(); });
  on("next", () => { st.col++; draw(); });
  on("add", () => { const S = NM_DD_PRESETS[st.set]; st.xs.push(S.add[0]); st.fs.push(S.add[1]); st.added = true; st.col = st.xs.length - 1; draw(); });
  $$('[data-seg="set"] button', w).forEach((b) => (b.onclick = () => {
    lenSetSeg($('[data-seg="set"]', w), b.dataset.v);
    if (b.dataset.v === "x") {
      const xs = pmDistinctSorted(4, -2, 5), fs = xs.map(() => rint(-6, 9));
      NM_DD_PRESETS.x = { x: xs, f: fs, add: [[...Array(10).keys()].map((i) => i - 3).find((v) => !xs.includes(v)), rint(-5, 8)] };
    }
    st.set = b.dataset.v;
    load();
    draw();
  }));
  load();
  draw();
}
const pmDistinctSorted = (n, a, b) => { const s = new Set(); while (s.size < n) s.add(rint(a, b)); return [...s].sort((x, y) => x - y); };

/* ---------------------------------------------------------------- 4.3 Tschebyscheff */

function nmWCheb(root) {
  const { w, fig, read } = ppW(root, "cheb");
  const st = { N: 6, show: "w" };
  const draw = () => {
    const N = st.N, eq = nmNodes(N, "eq"), ch = nmNodes(N, "cheb");
    const wf = (xs) => (x) => xs.reduce((p, xn) => p * (x - xn), 1);
    let me = 0, mc = 0;
    for (let i = 0; i <= 2000; i++) { const x = -1 + i / 1000; me = Math.max(me, Math.abs(wf(eq)(x))); mc = Math.max(mc, Math.abs(wf(ch)(x))); }
    lenOut(w, "N", N);
    const T = (n, x) => Math.cos(n * Math.acos(Math.max(-1, Math.min(1, x))));
    const ymax = st.show === "w" ? me * 1.15 : 1.2;
    const P = nmFrame(520, 260, [-1, 1], [-ymax, ymax]);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 260" role="img" aria-label="${st.show === "w" ? "Knotenpolynome" : "Tschebyscheff-Polynom"}">
      ${P.axes({ xl: "x", yt: [] })}
      ${st.show === "w" ? `<path d="${P.path(wf(eq), 600)}" class="curve nm-err-c"/><path d="${P.path(wf(ch), 600)}" class="curve nm-approx-c"/>
        <line x1="34" y1="${P.Y(mc)}" x2="508" y2="${P.Y(mc)}" class="guide"/><line x1="34" y1="${P.Y(-mc)}" x2="508" y2="${P.Y(-mc)}" class="guide"/>
        ${eq.map((x) => `<circle cx="${P.X(x)}" cy="${P.Y(0)}" r="3.5" class="pt nm-err-pt"/>`).join("")}${ch.map((x) => `<circle cx="${P.X(x)}" cy="${P.Y(0) + 8}" r="3.5" class="pt nm-approx-pt"/>`).join("")}`
        : `<path d="${P.path((x) => T(N + 1, x), 800)}" class="curve nm-approx-c"/>${ch.map((x) => `<line x1="${P.X(x)}" y1="${P.Y(1)}" x2="${P.X(x)}" y2="${P.Y(-1)}" class="guide"/><circle cx="${P.X(x)}" cy="${P.Y(0)}" r="4" class="pt nm-exact-pt"/>`).join("")}`}</svg>`;
    read.innerHTML = st.show === "w"
      ? `<div class="lw-vals"><span>max |w<sub>N+1</sub>| äquidistant (rot)</span><b class="nm-err">${nmSci(me, 3)}</b><span>max |w<sub>N+1</sub>| Tschebyscheff (blau)</span><b class="nm-approx">${nmSci(mc, 3)}</b><span>2<sup>−N</sup></span><b>${nmSci(2 ** -N, 3)}</b></div>
        <p class="small">Das Knotenpolynom w<sub>N+1</sub>(x) = ∏(x − x<sub>n</sub>) steht im Restglied. Für Tschebyscheff-Knoten ist w<sub>N+1</sub> = 2<sup>−N</sup>T<sub>N+1</sub> — es pendelt gleichmäßig zwischen ±2<sup>−N</sup>, kleiner geht es nicht.</p>`
      : `<p class="small">T<sub>${N + 1}</sub>(x) = cos(${N + 1} arccos x) pendelt zwischen −1 und 1. Seine ${N + 1} Nullstellen cos((2n + 1)π/(2N + 2)) sind die Tschebyscheff-Stützstellen. Leitkoeffizient 2<sup>${N}</sup>.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 4.4 Splines */

// Moments γ_n = s″(x_n) of the cubic spline through (xs, ys): "clamped" (s′(a) = v0, s′(b) = vN),
// "natural" (s″ = 0 at both ends) or "periodic" (s′, s″ equal at a and b; needs y0 = yN).
function nmSpline(xs, ys, type, v0 = 0, vN = 0) {
  const N = xs.length - 1, h = xs.slice(1).map((x, i) => x - xs[i]), dy = h.map((hn, i) => (ys[i + 1] - ys[i]) / hn);
  const A = Array.from({ length: N + 1 }, () => Array(N + 1).fill(0)), r = Array(N + 1).fill(0);
  for (let n = 1; n < N; n++) { A[n][n - 1] = h[n - 1]; A[n][n] = 2 * (h[n - 1] + h[n]); A[n][n + 1] = h[n]; r[n] = 6 * (dy[n] - dy[n - 1]); }
  if (type === "clamped") { A[0][0] = 2 * h[0]; A[0][1] = h[0]; r[0] = 6 * (dy[0] - v0); A[N][N - 1] = h[N - 1]; A[N][N] = 2 * h[N - 1]; r[N] = 6 * (vN - dy[N - 1]); }
  else if (type === "natural") { A[0][0] = 1; A[N][N] = 1; }
  else { A[0][0] = 1; A[0][N] = -1; A[N][0] = 2 * h[0]; A[N][1] = h[0]; A[N][N - 1] = h[N - 1]; A[N][N] = 2 * h[N - 1]; r[N] = 6 * (dy[0] - dy[N - 1]); }
  const g = nmSolve(A, r);
  const s = (x) => {
    let n = xs.findIndex((xn, i) => i > 0 && x <= xn + 1e-12);
    if (n < 1) n = x < xs[0] ? 1 : N;
    const t = x - xs[n - 1], hn = h[n - 1];
    return ys[n - 1] + (dy[n - 1] - (hn * (2 * g[n - 1] + g[n])) / 6) * t + (g[n - 1] / 2) * t * t + ((g[n] - g[n - 1]) / (6 * hn)) * t ** 3;
  };
  const s2 = (x) => { let n = xs.findIndex((xn, i) => i > 0 && x <= xn + 1e-12); if (n < 1) n = N; return g[n - 1] + ((g[n] - g[n - 1]) * (x - xs[n - 1])) / h[n - 1]; };
  const s1 = (x) => (s(x + 1e-6) - s(x - 1e-6)) / 2e-6;
  return { g, s, s1, s2, A };
}

function nmWSpline(root) {
  const { w, fig, read } = ppW(root, "spl");
  const st = { type: "clamped", v0: 0, vN: 0, pts: 0 };
  const SETS = [{ x: [0, 1, 2, 3], y: [3, 4, 1, -2], name: "Vorlesung" }, { x: [0, 1, 2, 3, 4], y: [1, 3, 0, 2, 1], name: "5 Punkte" }];
  const draw = () => {
    const S = SETS[st.pts], ys = [...S.y];
    if (st.type === "periodic") ys[ys.length - 1] = ys[0];
    const sp = nmSpline(S.x, ys, st.type, st.v0, st.vN), a = S.x[0], b = S.x[S.x.length - 1];
    lenOut(w, "v0", nmD(st.v0, 1)); lenOut(w, "vN", nmD(st.vN, 1));
    $$(".nm-clamp", w).forEach((el) => (el.hidden = st.type !== "clamped"));
    let lo = Infinity, hi = -Infinity, lo2 = Infinity, hi2 = -Infinity;
    for (let i = 0; i <= 300; i++) { const x = a + ((b - a) * i) / 300, y = sp.s(x), y2 = sp.s2(x); lo = Math.min(lo, y); hi = Math.max(hi, y); lo2 = Math.min(lo2, y2); hi2 = Math.max(hi2, y2); }
    const P = nmFrame(520, 220, [a - 0.2, b + 0.2], [lo - 1, hi + 1]);
    const P2 = nmFrame(520, 120, [a - 0.2, b + 0.2], [Math.min(lo2, -1) * 1.1, Math.max(hi2, 1) * 1.1], { l: 34, r: 12, t: 8, b: 18 });
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 220" role="img" aria-label="Kubischer Spline">
      ${P.axes({ xl: "x", yl: "s(x)" })}
      ${S.x.slice(1, -1).map((x) => `<line x1="${P.X(x)}" y1="12" x2="${P.X(x)}" y2="194" class="guide"/>`).join("")}
      <path d="${P.path(sp.s, 600, a, b)}" class="curve nm-approx-c"/>
      ${S.x.map((x, n) => `<circle cx="${P.X(x)}" cy="${P.Y(ys[n])}" r="5" class="pt nm-data-pt"/>`).join("")}</svg>
      <svg class="lw-svg" viewBox="0 0 520 120" role="img" aria-label="Zweite Ableitung des Splines">
      ${P2.axes({ xl: "x", yl: "s″(x)", yt: [] })}
      <path d="${P2.path(sp.s2, 600, a, b)}" class="curve nm-ell-c"/>
      ${S.x.map((x, n) => `<circle cx="${P2.X(x)}" cy="${P2.Y(sp.g[n])}" r="4" class="pt nm-ell-pt"/>`).join("")}</svg>`;
    read.innerHTML = `<div class="lw-vals">${sp.g.map((g, n) => `<span>γ<sub>${n}</sub> = s″(x<sub>${n}</sub>)</span><b>${nmD(g, 3)}</b>`).join("")}
      <span>s′(a), s′(b)</span><b>${nmD(sp.s1(a + 1e-7), 2)}; ${nmD(sp.s1(b - 1e-7), 2)}</b></div>
      <p class="small">${{ clamped: "Eingespannt: die Steigungen am Rand sind vorgegeben.", natural: "Natürlich: s″(a) = s″(b) = 0 — der Spline läuft am Rand gerade aus.", periodic: "Periodisch: s, s′ und s″ stimmen an a und b überein (dafür wurde der letzte Wert auf y₀ gesetzt)." }[st.type]}
        Unten s″: stückweise linear und stetig — die Momente γ<sub>n</sub> sind die Unbekannten des LGS.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

NUMA_CHAPTERS.push({
  n: 4, vl: "VL07–VL09", title: "Interpolation", next: "Numerische Integration",
  headline: "Inter<span class=\"accent\">polation</span>",
  intro: "Eine Funktion durch gegebene Punkte legen: ein Polynom (Lagrange, Newton mit dividierten Differenzen), möglichst mit guten Stützstellen (Tschebyscheff) — oder stückweise mit kubischen Splines, wenn viele Punkte gegeben sind.",
  sections: [
    {
      id: "4.1", title: "Polynominterpolation und Kondition", short: "Polynominterpolation", about: "Existenz, Eindeutigkeit, Lagrange-Polynome, Lebesgue-Konstante, Runge",
      html: () => `
        ${nmGist([
          `Zu $N + 1$ Stützpunkten $(x_n, f_n)$ mit paarweise verschiedenen $x_n$ gibt es <b>genau ein</b> Polynom $p$ vom Grad $\\le N$ mit $p(x_n) = f_n$.`,
          `Existenz über die <b>Lagrange-Polynome</b>: $L_n(x) = \\prod_{m\\neq n}\\frac{x - x_m}{x_n - x_m}$ mit $L_n(x_m) = \\delta_{nm}$, also $p = \\sum f_nL_n$.`,
          `Kondition: $\\max|p - \\tilde p| \\le$ <b>$\\Lambda_N$</b> $\\max|f_n - \\tilde f_n|$ mit der Lebesgue-Konstante $\\Lambda_N = \\max_x \\sum_n |L_n(x)| \\ge 1$.`,
        ])}
        <div class="card">
          <h3>Eindeutigkeit</h3>
          <p>Hätten $p$ und $q$ beide Grad $\\le N$ und dieselben Werte in $N + 1$ Stellen, so hätte $p - q$ (Grad $\\le N$) $N + 1$ Nullstellen — also $p - q = 0$. Das gilt über jedem Körper (Shamir's Secret Sharing über $\\mathbb{Z}_p$: der Schlüssel ist $p(0)$).</p>
          <h3>Basen von $P_N$</h3>
          ${ppFacts([
            ["Monome", "$1, x, \\dots, x^N$ — führt auf die schlecht konditionierte Vandermonde-Matrix."],
            ["Lagrange", "$L_0, \\dots, L_N$: Koeffizienten sind direkt die $f_n$; jeder neue Punkt ändert alle $L_n$."],
            ["Newton", `$w_n(x) = \\prod_{m\\lt n}(x - x_m)$: ein neuer Punkt fügt nur einen Summanden an (${nmSee("4.2")}).`],
          ])}
          <h3>Die Lebesgue-Konstante</h3>
          <p>Sie hängt nur von der relativen Lage der Stützstellen ab (affin-lineare Abbildung $[a, b] \\to [-1, 1]$ ändert sie nicht). Auf $[-1, 1]$:</p>
          <table class="len-terms nm-tab"><thead><tr><th>N</th><th>äquidistant</th><th>Tschebyscheff</th></tr></thead><tbody>
            ${[[5, "≈ 3,10", "≈ 2,1"], [10, "≈ 29,9", "≈ 2,5"], [15, "≈ 512", "≈ 2,7"], [20, "≈ 10 987", "≈ 2,9"]].map((r) => `<tr><td>${r[0]}</td><td class="nm-err">${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>
          <p><b>Bestapproximation</b> (SS 24): für jedes $q \\in P_N$ ist $\\max|f - p| \\le (1 + \\Lambda_N)\\max|f - q|$. Mit Tschebyscheff-Stützstellen ist $p$ für $N \\approx 20$ also höchstens etwa 4-mal schlechter als das beste Polynom; äquidistant kann es $10^4$-mal schlechter sein.</p>
        </div>
        ${pw("ip", `${pseg("fn", Object.entries(NM_IP_FNS).map(([k, v]) => [k, v.name]), "runge")}${pslider("N", "Grad N", 1, 20, 1, 10)}
          ${pseg("kind", [["eq", "äquidistant"], ["cheb", "Tschebyscheff"]], "eq")}${pseg("leb", [[0, "f und p"], [1, "Lebesgue-Funktion"]], 0)}`, { wide: true })}
        ${nmTraps([
          "Vorsicht bei Polynomen hohen Grades mit äquidistanten Stützstellen: $\\Lambda_N$ wächst exponentiell. Abhilfe: Tschebyscheff oder Splines (SS 17).",
          "$\\Lambda_N \\ge 1$, weil $\\sum L_n \\equiv 1$ (die Interpolation der $1$).",
          "Interpolation ist ein Spezialfall der Approximation: dort wird nur $\\|f - p\\|$ klein gemacht, hier $p(x_n) = f_n$ verlangt.",
        ])}`,
      setup: (root) => nmWInterp(root),
      check: [
        { q: "Wie viele Stützstellen legen ein Polynom vom Grad $\\le N$ eindeutig fest?", opts: ["$N + 1$ paarweise verschiedene", "$N$", "$2N$", "$N + 1$ beliebige"], why: "Zwei solche Polynome mit gleichen Werten in $N + 1$ Stellen hätten eine Differenz mit $N + 1$ Nullstellen." },
        { q: "Was gilt für das $n$-te Lagrange-Polynom?", opts: ["$L_n(x_m) = \\delta_{nm}$", "$L_n(x_n) = 0$", "$L_n$ hat Grad $n$", "$\\sum L_n(x) = 0$"], why: "$L_n$ ist $1$ in $x_n$ und $0$ in allen anderen Stützstellen; alle $L_n$ haben Grad $N$ und summieren zu $1$." },
        { q: "Was misst die Lebesgue-Konstante $\\Lambda_N$?", opts: ["Die Kondition der Interpolation bzgl. Fehlern in den Werten $f_n$", "Den Interpolationsfehler $|f - p|$", "Den Grad des Polynoms", "Den Aufwand"], why: "$\\max|p - \\tilde p| \\le \\Lambda_N\\max|f_n - \\tilde f_n|$, und $\\Lambda_N$ ist die kleinste solche Zahl." },
        { q: "Was passiert bei $\\frac{1}{1 + 25x^2}$ mit vielen äquidistanten Stützstellen?", opts: ["Am Rand entstehen große Oszillationen", "Der Fehler geht gleichmäßig gegen $0$", "$p$ ist nicht eindeutig", "$p$ ist konstant"], why: "Runge-Phänomen. Mit Tschebyscheff-Stützstellen konvergiert es." },
      ],
    },
    {
      id: "4.2", title: "Dividierte Differenzen und Newton-Darstellung", short: "Dividierte Differenzen", about: "Lemma von Aitken, Differenzenschema, Newton-Polynome, Horner",
      html: () => `
        ${nmGist([
          `<b>Aitken</b>: das Polynom zu $(x_n, f_n), \\dots, (x_k, f_k)$ setzt sich aus zwei kleineren zusammen: $p_{n,k}(x) = \\dfrac{(x_n - x)\\,p_{n+1,k}(x) - (x_k - x)\\,p_{n,k-1}(x)}{x_n - x_k}$.`,
          `Koeffizientenvergleich gibt die <b>dividierten Differenzen</b> $f_{n,k} = \\dfrac{f_{n,k-1} - f_{n+1,k}}{x_n - x_k}$, $f_{n,n} = f_n$.`,
          `Die oberste Diagonale des Schemas sind die Koeffizienten der <b>Newton-Darstellung</b> $p = f_{0,0} + f_{0,1}w_1 + \\cdots + f_{0,N}w_N$.`,
        ])}
        <div class="card">
          <h3>Warum Newton</h3>
          <p>Aus Aitken folgt $p_{0,N} = p_{0,N-1} + f_{0,N}w_N$: der neue Koeffizient ist der Leitkoeffizient. Ein zusätzlicher Stützpunkt kostet nur eine neue Zeile im Schema — das alte Polynom bleibt (SS 17, SS 24, WS 19/20).</p>
          <p>Aufwand des Schemas: $\\tfrac12 N(N + 1)$ Divisionen und $N(N + 1)$ Additionen.</p>
          <h3>Horner-Schema</h3>
          ${tx(`p(x) = f_{0,0} + (x - x_0)\\Big[f_{0,1} + (x - x_1)\\big[f_{0,2} + \\cdots + (x - x_{N-1})\\,f_{0,N}\\big]\\cdots\\Big]`)}
          <p>Von innen nach außen ausgewertet: $N$ Multiplikationen statt $\\tfrac12 N(N + 1)$.</p>
        </div>
        ${pw("dd", `${pseg("set", [["vl", "Vorlesung"], ["ss24", "SS 24"], ["ws2223", "WS 22/23"], ["x", "Neue Punkte"]], "vl")}
          <div class="lw-btns">${pbtn("prev", "← zurück")}${pbtn("next", "nächste Spalte →", "primary")}${pbtn("add", "Punkt hinzufügen")}</div>`, { wide: true })}
        <p class="small muted">Beispiel der Vorlesung: $(-1, 1)$, $(0, 6)$, $(1, -3)$, $(3, 3)$ ergibt $p(x) = 1 + 5(x + 1) - 7(x + 1)x + \\frac{11}{4}(x + 1)x(x - 1)$.</p>
        ${nmTraps([
          "Nenner immer $x_n - x_k$ der <b>äußeren</b> Stützstellen des Teilstücks, nicht der Nachbarn.",
          "Wird ein Punkt angefügt, der nicht am Ende der $x$-Reihe liegt (z. B. $x_4 = 0$ in SS 24), bleibt das Schema trotzdem gültig — die $x_n$ müssen nicht sortiert sein.",
          "Die Newton-Polynome angeben: $w_1 = (x - x_0)$, $w_2 = (x - x_0)(x - x_1)$, … (WS 20/21 verlangt sie explizit).",
          "Richtige Aitken-Form (WS 22/23): $p(x) = \\dfrac{(x_0 - x)\\,p_{1,N}(x) - (x_N - x)\\,p_{0,N-1}(x)}{x_0 - x_N}$.",
        ])}`,
      setup: (root) => nmWDD(root),
      check: [
        { q: "Stützpunkte $(1, 16)$, $(3, 4)$, $(5, 8)$. Was ist $f_{0,1}$?", opts: ["$-6$", "$6$", "$2$", "$-12$"], why: "$\\frac{16 - 4}{1 - 3} = -6$ (WS 20/21)." },
        { q: "Welche Werte des Differenzenschemas sind die Newton-Koeffizienten?", opts: ["$f_{0,0}, f_{0,1}, \\dots, f_{0,N}$ (die oberste Diagonale)", "die letzte Zeile $f_{n,N}$", "die erste Spalte $f_{n,n}$", "alle Einträge der letzten Spalte"], why: "$p = \\sum f_{0,k}\\,w_k$." },
        { q: "Ein Stützpunkt kommt hinzu. Was muss man neu berechnen?", opts: ["Eine neue Zeile im Schema; $p$ wird um $f_{0,N+1}w_{N+1}$ ergänzt", "Alles", "Nur $f_{0,0}$", "Die Lagrange-Polynome"], why: "$p_{0,N+1} = p_{0,N} + f_{0,N+1}w_{N+1}$." },
        { q: "Wozu dient das Horner-Schema?", opts: ["Zum effizienten Auswerten des Polynoms", "Zum Berechnen der dividierten Differenzen", "Zur Fehlerabschätzung", "Zur Wahl der Stützstellen"], why: "Verschachtelt ausmultipliziert braucht man nur $N$ Multiplikationen." },
      ],
    },
    {
      id: "4.3", title: "Restglied und Tschebyscheff-Interpolation", short: "Restglied & Tschebyscheff", about: "f − p = w_{N+1} f^{(N+1)}(ξ)/(N+1)!, Min-Max-Eigenschaft, Stützstellen",
      html: () => `
        ${nmGist([
          `<b>Restglied</b>: für $f \\in C^{N+1}$ gibt es $\\xi = \\xi(x)$ mit $f(x) - p(x) = w_{N+1}(x)\\,\\dfrac{f^{(N+1)}(\\xi)}{(N + 1)!}$.`,
          `Die Stützstellen beeinflussen nur $\\max|w_{N+1}|$. Am kleinsten ist es für die <b>Tschebyscheff-Stützstellen</b> $x_n = \\cos\\big(\\frac{2n + 1}{2N + 2}\\pi\\big)$: dann ist $\\max|w_{N+1}| = 2^{-N}$.`,
          `Sie sind auch gut konditioniert: $\\Lambda_N \\le 3$ für $N \\le 20$, $\\le 4$ für $N \\le 100$, $\\Lambda_N \\approx \\frac2\\pi\\log N$.`,
        ])}
        <div class="card">
          <h3>Tschebyscheff-Polynome</h3>
          ${tx(`T_0 = 1, \\quad T_1 = x, \\quad T_{N+1}(x) = 2x\\,T_N(x) - T_{N-1}(x), \\qquad T_N(x) = \\cos(N\\arccos x)`)}
          <p>Leitkoeffizient von $T_{N+1}$ ist $2^N$; $T_N$ ist gerade für gerades $N$, sonst ungerade. Die Nullstellen von $T_{N+1}$ sind die Stützstellen, und $w_{N+1} = 2^{-N}T_{N+1}$.</p>
          <p><b>Anderes Intervall</b>: $x \\mapsto \\frac{a + b}{2} + \\frac{b - a}{2}x$ bildet $[-1, 1]$ auf $[a, b]$ ab; Lebesgue-Konstante und Restglied-Faktor bleiben gleich (dann $\\max|w_{N+1}| = 2^{-N}\\big(\\frac{b - a}{2}\\big)^{N+1}$).</p>
          <h3>Wie viele Stützstellen? (WS 20/21, WS 19/20)</h3>
          ${tx(`\\max|f - p| \\le \\frac{2^{-N}}{(N + 1)!}\\,\\max\\big|f^{(N+1)}\\big|`)}
          <p>$f = \\sin$ auf $[-1, 1]$, Fehler $\\le 10^{-2}$: alle Ableitungen $\\le 1$, also $\\frac{2^{-N}}{(N + 1)!} \\le 10^{-2}$. $N = 2$: $\\frac{1}{24} \\approx 0{,}042$ — zu groß; $N = 3$: $\\frac{1}{192} \\approx 0{,}0052$ ✓. Für $\\cos(\\pi x)$ kommt der Faktor $\\pi^{N+1}$ dazu. Weniger Stützstellen braucht man, wenn man Symmetrie ausnutzt oder das Intervall aufteilt.</p>
        </div>
        ${pw("cheb", `${pslider("N", "N", 1, 14, 1, 6)}${pseg("show", [["w", "w<sub>N+1</sub>: beide Knotenarten"], ["T", "T<sub>N+1</sub> und Nullstellen"]], "w")}`, { wide: true })}
        ${nmTraps([
          "Die Formel mit $2N + 2$ im Nenner und $n = 0, \\dots, N$: das sind $N + 1$ Knoten, die Nullstellen von $T_{N+1}$.",
          "Das Restglied ist eine Gleichung mit unbekanntem $\\xi$ — für eine Schranke nimmt man $\\max|f^{(N+1)}|$.",
          "Tschebyscheff ist gut für glatte (analytische) Funktionen mit hoher Genauigkeit; sonst sind Splines besser.",
        ])}`,
      setup: (root) => nmWCheb(root),
      check: [
        { q: "Was ist $T_2(x)$?", opts: ["$2x^2 - 1$", "$x^2$", "$2x^2$", "$x^2 - 1$"], why: "$T_2 = 2x\\,T_1 - T_0 = 2x^2 - 1$." },
        { q: "Was ist $\\max|w_{N+1}|$ auf $[-1, 1]$ für Tschebyscheff-Stützstellen?", opts: ["$2^{-N}$", "$1$", "$2^N$", "$\\frac{1}{(N + 1)!}$"], why: "$w_{N+1} = 2^{-N}T_{N+1}$, und $|T_{N+1}| \\le 1$." },
        { q: "Welche Formel gibt die Tschebyscheff-Stützstellen auf $[-1, 1]$?", opts: ["$x_n = \\cos\\frac{(2n + 1)\\pi}{2N + 2}$, $n = 0, \\dots, N$", "$x_n = -1 + \\frac{2n}{N}$", "$x_n = \\cos\\frac{n\\pi}{N}$", "$x_n = \\sin\\frac{(2n + 1)\\pi}{2N + 2}$"], why: "Die Nullstellen von $T_{N+1}$." },
        { q: "$\\sin$ auf $[-1, 1]$, Tschebyscheff-Interpolation, Fehler $\\le 10^{-2}$. Welches $N$ reicht minimal?", opts: ["$3$", "$2$", "$5$", "$10$"], why: "$\\frac{2^{-N}}{(N + 1)!}$: $N = 2$ gibt $\\frac1{24}$, $N = 3$ gibt $\\frac{1}{192} \\le 10^{-2}$." },
      ],
    },
    {
      id: "4.4", title: "Kubische Splines", short: "Splines", about: "s ∈ C², stückweise kubisch; eingespannt, natürlich, periodisch; Momente, LGS, Fehler",
      html: () => `
        ${nmGist([
          `Ein <b>kubischer interpolierender Spline</b> zu $a = x_0 < \\cdots < x_N = b$ ist eine $C^2$-Funktion mit $s|_{[x_{n-1}, x_n]} \\in P_3$ und $s(x_n) = y_n$.`,
          `Zwei Bedingungen fehlen noch — drei Typen: <b>eingespannt</b> $s'(a) = v_0$, $s'(b) = v_N$; <b>natürlich</b> $s''(a) = s''(b) = 0$; <b>periodisch</b> $s'(a) = s'(b)$, $s''(a) = s''(b)$.`,
          `Splines minimieren die „Biegeenergie“ $\\int|s''|^2$ unter allen $C^2$-Interpolierenden mit denselben Randbedingungen.`,
        ])}
        <div class="card">
          <h3>Warum gerade diese Randbedingungen</h3>
          <p>Variation $s + \\varepsilon h$ mit $h(x_n) = 0$: $\\int|s''|^2 \\le \\int|s'' + \\varepsilon h''|^2$ für alle $\\varepsilon, h$ $\\Leftrightarrow \\int s''h'' = 0$ $\\Leftrightarrow$ (partielle Integration auf jedem Teilintervall, $s'''$ stückweise konstant) <b>$s''(b)h'(b) - s''(a)h'(a) = 0$</b>. Das gilt, wenn $h'$ am Rand verschwindet (eingespannt), $s''$ am Rand verschwindet (natürlich) oder alles periodisch ist.</p>
          <h3>Berechnung über die Momente $\\gamma_n = s''(x_n)$</h3>
          ${tx(`s_n(x) = \\underbrace{y_{n-1} + (x - x_{n-1})\\,y_{n-1,n}}_{\\text{interpolierend}} + \\underbrace{(x - x_{n-1})(x - x_n)\\big[\\alpha_n(x - x_{n-1}) + \\beta_n(x - x_n)\\big]}_{\\text{glättend}}`)}
          <p>Der erste Teil interpoliert ($y_{n-1,n} = \\frac{y_n - y_{n-1}}{h_n}$ ist die Sekantensteigung), der zweite glättet und verschwindet in den Knoten. Die Glattheit $s_n'(x_n) = s_{n+1}'(x_n)$ gibt für $h_n = x_n - x_{n-1}$:</p>
          ${tx(`h_n\\gamma_{n-1} + 2(h_n + h_{n+1})\\,\\gamma_n + h_{n+1}\\gamma_{n+1} = 6\\,(y_{n,n+1} - y_{n-1,n}), \\qquad n = 1, \\dots, N - 1`)}
          <p>Eingespannt kommen $2h_1\\gamma_0 + h_1\\gamma_1 = 6(y_{0,1} - v_0)$ und $h_N\\gamma_{N-1} + 2h_N\\gamma_N = 6(v_N - y_{N-1,N})$ dazu. Die Matrix ist <b>symmetrisch, tridiagonal und strikt diagonaldominant</b> — eindeutig lösbar, Cholesky mit Bandstruktur in $O(N)$, äquidistant gut konditioniert ($\\cond_\\infty \\le 3$; SS 26: $\\le 6$ mit dem Faktor $h/6$).</p>
          ${ppFacts([
            ["Kondition", "Lagrange-Splines $l_n$ (eingespannt mit $l_n' = 0$ am Rand, $l_n(x_m) = \\delta_{nm}$): $s - \\tilde s = \\sum(y_n - \\tilde y_n)\\,l_n$, $\\Lambda_N = \\max\\sum|l_n| \\le 2$ bei äquidistanter Unterteilung."],
            ["Fehler", "$f \\in C^4$, eingespannt mit $s' = f'$ am Rand: $\\max|f - s| \\le \\frac{5}{384}h^4\\max|f^{(4)}|$, $h = \\max h_n$."],
            ["not-a-knot", "$s'''$ stetig in $x_1$ und $x_{N-1}$: die ersten zwei und letzten zwei Stücke sind je ein Polynom (SS 19)."],
            ["Parameter bestimmen", "WS 17/18, SS 20: $s$, $s'$, $s''$ links und rechts von $x_1$ gleichsetzen — drei Gleichungen."],
          ])}
        </div>
        ${pw("spl", `${pseg("type", [["clamped", "eingespannt"], ["natural", "natürlich"], ["periodic", "periodisch"]], "clamped")}
          <div class="nm-clamp">${pslider("v0", "s′(a) = v₀", -90, 90, 1, 0)}${pslider("vN", "s′(b) = v<sub>N</sub>", -90, 90, 1, 0)}</div>
          ${pseg("pts", [[0, "Vorlesung"], [1, "5 Punkte"]], 0)}`, { wide: true })}
        <p class="small muted">Mit $v_0 = 0$ und $v_N = 81$ entsteht der eingespannte Spline der Vorlesung: $3x^3 - 2x^2 + 3$, $-15x^3 + 52x^2 - 54x + 21$, $61x^3 - 404x^2 + 858x - 587$.</p>
        ${nmTraps([
          "Ein Spline ist <b>$C^2$</b>, nicht nur stetig: $s$, $s'$ und $s''$ müssen an den inneren Knoten passen.",
          "Natürlich heißt $s'' = 0$ am Rand — nicht $s' = 0$ (das wäre eingespannt mit $v = 0$).",
          "Erkennen im Bild (SS 19, Übung 5): gerade auslaufend → natürlich; gleiche Steigung an beiden Enden → periodisch; sonst eingespannt.",
          "Ein quadratischer Spline (SS 20, Übung 5) ist nur $C^1$ und braucht nur eine Zusatzbedingung.",
        ])}`,
      setup: (root) => nmWSpline(root),
      check: [
        { q: "Welche Glattheit hat ein kubischer Spline?", opts: ["$C^2$", "$C^1$", "$C^3$", "nur stetig"], why: "Auf jedem Stück kubisch, insgesamt zweimal stetig differenzierbar." },
        { q: "Was fordert ein natürlicher Spline?", opts: ["$s''(a) = s''(b) = 0$", "$s'(a) = s'(b) = 0$", "$s(a) = s(b)$", "$s'''$ stetig"], why: "Die zweite Ableitung verschwindet am Rand." },
        { q: "Welche Struktur hat das LGS für die Momente (eingespannt)?", opts: ["symmetrisch, tridiagonal, strikt diagonaldominant", "voll besetzt", "obere Dreiecksmatrix", "singulär"], why: "Deshalb eindeutig lösbar und in $O(N)$ mit Cholesky." },
        { q: "Wie schnell fällt der Fehler eines eingespannten Splines mit der Gitterweite $h$?", opts: ["wie $h^4$", "wie $h^2$", "wie $h$", "exponentiell"], why: "$\\max|f - s| \\le \\frac{5}{384}h^4\\max|f^{(4)}|$." },
      ],
    },
  ],
});

/* ================================================================ Kapitel 5 */

const NM_Q_FNS = {
  exp: { name: "eˣ", f: Math.exp, F: Math.exp },
  sin: { name: "sin x", f: Math.sin, F: (x) => -Math.cos(x) },
  cub: { name: "x³ − x", f: (x) => x ** 3 - x, F: (x) => x ** 4 / 4 - (x * x) / 2 },
  bell: { name: "1/(1 + x²)", f: (x) => 1 / (1 + x * x), F: Math.atan },
};
// Quadrature rules: weights b and nodes c on [0, 1].
const NM_RULES = {
  rect: { name: "Rechteck", b: [1], c: [0], p: 1 },
  mid: { name: "Mittelpunkt", b: [1], c: [0.5], p: 2 },
  trap: { name: "Trapez", b: [0.5, 0.5], c: [0, 1], p: 2 },
  simp: { name: "Simpson", b: [1 / 6, 4 / 6, 1 / 6], c: [0, 0.5, 1], p: 4 },
  gauss2: { name: "Gauß s = 2", b: [0.5, 0.5], c: [0.5 - Math.sqrt(3) / 6, 0.5 + Math.sqrt(3) / 6], p: 4 },
};
const nmQuad = (rule, f, a, b, N = 1) => {
  const h = (b - a) / N;
  let s = 0;
  for (let n = 0; n < N; n++) rule.b.forEach((bk, k) => (s += h * bk * f(a + n * h + rule.c[k] * h)));
  return s;
};

/* ---------------------------------------------------------------- 5.1 Quadraturformeln */

function nmWQuad(root) {
  const { w, fig, read } = ppW(root, "qf");
  const st = { fn: "exp", rule: "trap", N: 1 };
  const draw = () => {
    const G = NM_Q_FNS[st.fn], R = NM_RULES[st.rule], a = 0, b = 2, N = st.N;
    lenOut(w, "N", N);
    const exact = G.F(b) - G.F(a), q = nmQuad(R, G.f, a, b, N);
    let lo = 0, hi = 0;
    for (let i = 0; i <= 200; i++) { const y = G.f(a + ((b - a) * i) / 200); lo = Math.min(lo, y); hi = Math.max(hi, y); }
    const P = nmFrame(520, 260, [a - 0.1, b + 0.1], [lo - 0.4, hi + 0.6]);
    const h = (b - a) / N;
    let shapes = "";
    for (let n = 0; n < N; n++) {
      const x0 = a + n * h, x1 = x0 + h;
      // The polynomial the rule integrates on this piece (interpolating f in the rule's nodes).
      const xs = R.c.map((c) => x0 + c * h), ys = xs.map(G.f);
      const pp = xs.length === 1 ? () => ys[0] : nmInterp(xs, ys);
      let d = `M${P.X(x0)},${P.Y(0)}`;
      for (let i = 0; i <= 40; i++) { const x = x0 + (h * i) / 40; d += `L${P.X(x).toFixed(1)},${P.Y(pp(x)).toFixed(1)}`; }
      shapes += `<path d="${d}L${P.X(x1)},${P.Y(0)}Z" class="nm-area"/>` + xs.map((x, k) => `<circle cx="${P.X(x)}" cy="${P.Y(ys[k])}" r="3.5" class="pt nm-approx-pt"/>`).join("");
    }
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 260" role="img" aria-label="Quadraturformel als Fläche">
      ${P.axes({ xl: "x" })}${shapes}<path d="${P.path(G.f, 300, a, b)}" class="curve nm-exact-c"/></svg>`;
    read.innerHTML = `${F(`${ig("0", "2")} ${G.name} dx ≈ h ${sumOf("N", "n=1")} ${sumOf("s", "k=1")} b<sub>k</sub> f(x<sub>n−1</sub> + c<sub>k</sub>h)`, "small-f")}
      <div class="lw-vals"><span>Näherung</span><b class="nm-approx">${nmD(q, 8)}</b><span>exakt</span><b class="nm-exact">${nmD(exact, 8)}</b><span>Fehler</span><b class="nm-err">${nmSci(Math.abs(q - exact))}</b>
      <span>Gewichte b, Knoten c</span><b>${R.b.map((x) => nmNice(x)).join(", ")} · ${R.c.map((x) => nmNice(x)).join(", ")}</b><span>Ordnung p</span><b>${R.p}</b></div>
      <p class="small">Die Fläche ist das Integral des Polynoms, das f in den Knoten interpoliert (blau). ${st.rule === "rect" ? "Rechteckregel: exakt nur für Konstanten." : st.rule === "mid" ? "Mittelpunkt: eine Auswertung, trotzdem exakt für Geraden — die Fehler links und rechts heben sich auf." : ""}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 5.2 Ordnung */

const NM_NODE_SETS = {
  trap: { name: "0, 1", c: [[0, 1], [1, 1]] },
  simp: { name: "0, ½, 1", c: [[0, 1], [1, 2], [1, 1]] },
  q14: { name: "¼, ½, ¾", c: [[1, 4], [1, 2], [3, 4]] },
  q15: { name: "⅕, ½, ⅘", c: [[1, 5], [1, 2], [4, 5]] },
  q16: { name: "⅙, ½, ⅚", c: [[1, 6], [1, 2], [5, 6]] },
  q38: { name: "0, ⅓, ⅔, 1", c: [[0, 1], [1, 3], [2, 3], [1, 1]] },
  q13: { name: "⅓, ⅔", c: [[1, 3], [2, 3]] },
  g2: { name: "Gauß s = 2", f: [0.5 - Math.sqrt(3) / 6, 0.5 + Math.sqrt(3) / 6] },
  g3: { name: "Gauß s = 3", f: [0.5 - Math.sqrt(15) / 10, 0.5, 0.5 + Math.sqrt(15) / 10] },
};
// Weights for the nodes (exact for rational nodes) and the order: the first q where Σ b c^{q−1} ≠ 1/q, minus 1.
function nmRuleFromNodes(set) {
  if (set.c) {
    const c = set.c.map(([n, d]) => nmQ(n, d)), s = c.length;
    const V = Array.from({ length: s }, (_, q) => c.map((ck) => Array.from({ length: q }, () => ck).reduce((p, x) => p.mul(x), nmQ(1))));
    const b = nmSolveQ(V, Array.from({ length: s }, (_, q) => nmQ(1, q + 1)));
    const conds = [];
    for (let q = 1; q <= s + 4; q++) {
      const lhs = b.reduce((acc, bk, k) => acc.add(bk.mul(Array.from({ length: q - 1 }, () => c[k]).reduce((p, x) => p.mul(x), nmQ(1)))), nmQ(0));
      conds.push({ q, lhs, ok: lhs.eq(nmQ(1, q)) });
    }
    return { c, b, conds, exact: true };
  }
  const c = set.f, s = c.length, V = Array.from({ length: s }, (_, q) => c.map((x) => x ** q));
  const b = nmSolve(V, Array.from({ length: s }, (_, q) => 1 / (q + 1)));
  const conds = [];
  for (let q = 1; q <= s + 4; q++) { const lhs = b.reduce((acc, bk, k) => acc + bk * c[k] ** (q - 1), 0); conds.push({ q, lhs, ok: Math.abs(lhs - 1 / q) < 1e-12 }); }
  return { c, b, conds, exact: false };
}
function nmWOrder(root) {
  const { w, fig, read } = ppW(root, "ord");
  const st = { set: "q14" };
  const draw = () => {
    const r = nmRuleFromNodes(NM_NODE_SETS[st.set]);
    const p = r.conds.findIndex((x) => !x.ok);
    const show = (x) => (r.exact ? x.html() : nmD(x, 6));
    const sym = r.c.every((ck, k) => Math.abs(+ck + +r.c[r.c.length - 1 - k] - 1) < 1e-12) && r.b.every((bk, k) => Math.abs(+bk - +r.b[r.b.length - 1 - k]) < 1e-12);
    const mono = r.b.every((bk) => +bk >= 0);
    fig.innerHTML = `<table class="len-terms nm-tab"><thead><tr><th>k</th><th>Knoten c<sub>k</sub></th><th>Gewicht b<sub>k</sub> = ∫₀¹ L<sub>k</sub></th></tr></thead>
      <tbody>${r.c.map((ck, k) => `<tr><td>${k + 1}</td><td>${show(ck)}</td><td class="${+r.b[k] < 0 ? "nm-err" : ""}">${show(r.b[k])}</td></tr>`).join("")}</tbody></table>
      <table class="len-terms nm-tab"><thead><tr><th>q</th><th>Σ b<sub>k</sub>c<sub>k</sub><sup>q−1</sup></th><th>1/q</th><th></th></tr></thead>
      <tbody>${r.conds.map((x) => `<tr class="${x.ok ? "" : "nm-bad-row"}"><td>${x.q}</td><td>${show(x.lhs)}</td><td>${frac(1, x.q)}</td><td>${x.ok ? "✓" : "✗"}</td></tr>`).join("")}</tbody></table>`;
    read.innerHTML = `<p>Ordnung <b>p = ${p}</b> bei s = ${r.c.length} Knoten${p === 2 * r.c.length ? " — das Maximum 2s (Gauß)" : p > r.c.length ? ` — mehr als s, weil ${sym ? "die Formel symmetrisch ist (Ordnung gerade)" : "die Knoten günstig liegen"}` : ""}.</p>
      <p class="small">${sym ? "Symmetrisch: c<sub>k</sub> = 1 − c<sub>s+1−k</sub>, b<sub>k</sub> = b<sub>s+1−k</sub>. " : ""}${mono ? "Monoton: alle Gewichte ≥ 0." : "<b class='nm-err'>Nicht monoton</b>: ein negatives Gewicht — schlecht bei Rundungsfehlern und summiert."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 5.4 Summierte Formeln */

function nmWSummed(root) {
  const { w, fig, read } = ppW(root, "sumq");
  const st = { fn: "exp" };
  const draw = () => {
    const G = NM_Q_FNS[st.fn], a = 0, b = st.fn === "exp" ? 5 : 2, exact = G.F(b) - G.F(a);
    const Ns = [1, 2, 4, 8, 16, 32, 64, 128];
    const rules = ["rect", "mid", "trap", "simp"], cls = { rect: "nm-ell-c", mid: "nm-approx-c", trap: "nm-err-c", simp: "nm-exact-c" };
    const E = Object.fromEntries(rules.map((r) => [r, Ns.map((N) => Math.abs(nmQuad(NM_RULES[r], G.f, a, b, N) - exact))]));
    const P = nmFrame(520, 260, [0, 7], [-14, 2]);
    const lg = (x) => Math.log10(Math.max(x, 1e-15));
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 260" role="img" aria-label="Fehler summierter Quadraturformeln">
      ${P.axes({ xl: "N (Teilintervalle)", yl: "log₁₀ Fehler", xt: [], yt: [-12, -8, -4, 0] })}
      ${Ns.map((N, i) => `<text x="${P.X(i)}" y="${P.Y(-14) + 16}" text-anchor="middle" class="tick-t">${N}</text>`).join("")}
      ${rules.map((r) => `<polyline points="${E[r].map((e, i) => `${P.X(i).toFixed(1)},${P.Y(lg(e)).toFixed(1)}`).join(" ")}" class="curve ${cls[r]}"/>`).join("")}
      ${rules.map((r, i) => `<text x="${P.X(7)}" y="${P.Y(lg(E[r][7])) + (r === "trap" ? 12 : r === "mid" ? -4 : 4)}" text-anchor="end" class="cap">${NM_RULES[r].name}</text>`).join("")}</svg>`;
    read.innerHTML = `<table class="len-terms nm-tab"><thead><tr><th>N</th>${rules.map((r) => `<th>${NM_RULES[r].name}</th>`).join("")}</tr></thead><tbody>
      ${Ns.slice(2, 7).map((N, i) => `<tr><td>${N}</td>${rules.map((r) => `<td>${nmSci(E[r][i + 2])}<br><span class="muted small">÷ ${nmD(E[r][i + 1] / E[r][i + 2], 1)}</span></td>`).join("")}</tr>`).join("")}</tbody></table>
      <p class="small">Halbiert man h, fällt der Fehler um den Faktor 2<sup>p</sup>: Rechteck ÷ 2, Mittelpunkt und Trapez ÷ 4, Simpson ÷ 16. Der Mittelpunktfehler ist etwa halb so groß wie der Trapezfehler und hat das andere Vorzeichen (1/24 gegen 1/12).</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

NUMA_CHAPTERS.push({
  n: 5, vl: "VL10–VL11", title: "Numerische Integration", next: "Eigenwertprobleme",
  headline: "Quadratur<span class=\"accent\">formeln</span>",
  intro: "Ein Integral durch ein gewichtetes Mittel von Funktionswerten ersetzen. Wie gut das ist, sagt die Ordnung — sie folgt aus einfachen Bedingungen an Gewichte und Knoten. Gauß erreicht mit s Knoten die Ordnung 2s; summiert fällt der Fehler wie h<sup>p</sup>.",
  sections: [
    {
      id: "5.1", title: "Kondition und Quadraturformeln", short: "Quadraturformeln", about: "cond = I(|f|)/|I(f)|, (bₖ, cₖ), Rechteck, Mittelpunkt, Trapez, Simpson, interpolatorisch",
      html: () => `
        ${nmGist([
          `Eine <b>Quadraturformel</b> $(b_k, c_k)_{k=1,\\dots,s}$: $\\int_a^b f\\,dx \\approx (b - a)\\sum_k b_k\\,f\\big(a + c_k(b - a)\\big)$ mit Gewichten $b_k$ und Knoten $c_k \\in [0, 1]$.`,
          `<b>Interpolatorisch</b>: $f$ durch das Interpolationspolynom in den Knoten ersetzen und dieses exakt integrieren — dann $b_k = \\int_0^1 L_k$.`,
          `<b>Kondition</b>: $\\dfrac{|I(f) - I(\\tilde f)|}{|I(f)|} \\le \\cond_1(f)\\,\\dfrac{\\|f - \\tilde f\\|_1}{\\|f\\|_1}$, $\\cond_1(f) = \\dfrac{I(|f|)}{|I(f)|}$ — schlecht, wenn sich positive und negative Flächen fast aufheben.`,
        ])}
        <div class="card">
          <h3>Die vier Grundformeln</h3>
          <table class="len-terms nm-tab"><thead><tr><th>Regel</th><th>Formel</th><th>s</th><th>$b_k$</th><th>$c_k$</th><th>p</th></tr></thead><tbody>
            <tr><td>Rechteck</td><td>$(b - a)\\,f(a)$</td><td>1</td><td>$1$</td><td>$0$</td><td>1</td></tr>
            <tr><td>Mittelpunkt</td><td>$(b - a)\\,f\\big(\\frac{a + b}{2}\\big)$</td><td>1</td><td>$1$</td><td>$\\frac12$</td><td>2</td></tr>
            <tr><td>Trapez</td><td>$(b - a)\\,\\frac{f(a) + f(b)}{2}$</td><td>2</td><td>$\\frac12, \\frac12$</td><td>$0, 1$</td><td>2</td></tr>
            <tr><td>Simpson</td><td>$\\frac{b - a}{6}\\big(f(a) + 4f\\big(\\frac{a + b}{2}\\big) + f(b)\\big)$</td><td>3</td><td>$\\frac16, \\frac23, \\frac16$</td><td>$0, \\frac12, 1$</td><td>4</td></tr></tbody></table>
          ${ppFacts([
            ["linear und monoton", "Jede QF ist linear in $f$; monoton ($f \\ge g \\Rightarrow$ QF$(f) \\ge$ QF$(g)$) genau dann, wenn alle $b_k \\ge 0$."],
            ["Newton-Cotes", "Interpolatorisch mit äquidistanten Knoten: Mittelpunkt, Trapez, Simpson, 3/8-Regel."],
            ["Herleitung", "$\\int p = \\sum f(x_n)\\int L_n = (b - a)\\sum b_kf(a + c_k(b - a))$ mit $s = N + 1$, $c_k = \\frac{x_{k-1} - a}{b - a}$ (WS 24/25)."],
          ])}
        </div>
        ${pw("qf", `${pseg("fn", Object.entries(NM_Q_FNS).map(([k, v]) => [k, v.name]), "exp")}${pseg("rule", Object.entries(NM_RULES).map(([k, v]) => [k, v.name]), "trap")}${pslider("N", "Teilintervalle N", 1, 8, 1, 1)}`, { wide: true })}
        ${nmTraps([
          "Die Gewichte summieren sich zu $1$ (Ordnung $\\ge 1$) — gute Probe.",
          "Die Knoten $c_k$ beziehen sich auf $[0, 1]$: auf $[a, b]$ wird $a + c_k(b - a)$ ausgewertet und mit $(b - a)$ multipliziert.",
          "Ein großes Intervall wie $[0, 2020]$ (SS 20) teilt man auf: summierte Formel statt einer einzigen mit riesigem $(b - a)^{p+1}$.",
        ])}`,
      setup: (root) => nmWQuad(root),
      check: [
        { q: "Was sind die Gewichte und Knoten der Simpsonregel?", opts: ["$b = (\\frac16, \\frac23, \\frac16)$, $c = (0, \\frac12, 1)$", "$b = (\\frac13, \\frac13, \\frac13)$, $c = (0, \\frac12, 1)$", "$b = (\\frac12, \\frac12)$, $c = (0, 1)$", "$b = (\\frac14, \\frac12, \\frac14)$, $c = (0, \\frac12, 1)$"], why: "$\\frac{b - a}{6}\\big(f(a) + 4f(m) + f(b)\\big)$." },
        { q: "Wann ist eine Quadraturformel monoton?", opts: ["Wenn alle Gewichte $b_k \\ge 0$ sind", "Wenn die Knoten sortiert sind", "Wenn sie symmetrisch ist", "Immer"], why: "Dann folgt aus $f \\ge g$ auch $\\sum b_kf(\\dots) \\ge \\sum b_kg(\\dots)$." },
        { q: "Wann ist die Berechnung von $\\int f$ schlecht konditioniert?", opts: ["Wenn $|I(f)| \\ll I(|f|)$", "Wenn $f$ groß ist", "Wenn das Intervall lang ist", "Wenn $f$ nicht stetig ist"], why: "$\\cond_1(f) = I(|f|)/|I(f)|$: positive und negative Teile heben sich fast auf." },
        { q: "Was ist das Gewicht einer interpolatorischen QF?", opts: ["$b_k = \\int_0^1 L_k(x)\\,dx$", "$b_k = 1/s$", "$b_k = L_k(c_k)$", "$b_k = c_k$"], why: "Das exakte Integral des $k$-ten Lagrange-Polynoms zu den Knoten." },
      ],
    },
    {
      id: "5.2", title: "Ordnung und Symmetrie", short: "Ordnung", about: "Definition, Ordnungsbedingungen, Gewichte aus Knoten, symmetrische Formeln",
      html: () => `
        ${nmGist([
          `Eine QF hat die <b>Ordnung $p$</b>, wenn sie für alle Polynome vom Grad $\\le p - 1$ exakt ist und $p$ maximal ist.`,
          `<b>Ordnungsbedingungen</b>: Ordnung $p \\Leftrightarrow \\sum_k b_kc_k^{q-1} = \\frac1q$ für $q = 1, \\dots, p$, aber nicht für $q = p + 1$.`,
          `Bei gegebenen Knoten: Ordnung $p \\ge s \\Leftrightarrow b_k = \\int_0^1 L_k(x)\\,dx$. Die Gewichte sind dann eindeutig.`,
        ])}
        <div class="card">
          <h3>Warum es reicht, $[0, 1]$ und Monome anzusehen</h3>
          <p>Mit der Substitution $x = a + t(b - a)$ wird $\\int_a^b f = (b - a)\\int_0^1 g$ mit $g(t) = f(a + t(b - a))$, und $g$ ist ein Polynom desselben Grades. Wegen der Linearität reicht es, die Monome $t^{q-1}$ zu prüfen: $\\int_0^1 t^{q-1}\\,dt = \\frac1q$.</p>
          <h3>Symmetrische Formeln</h3>
          <p>$c_k = 1 - c_{s+1-k}$ und $b_k = b_{s+1-k}$: Knoten symmetrisch zu $\\frac12$, Gewichte von oben und unten gleich gelesen.</p>
          ${ppFacts([
            ["Ordnung gerade", "Eine symmetrische QF hat gerade Ordnung — Mittelpunkt und Trapez 2, Simpson 4."],
            ["Gewichte symmetrisch", "Symmetrische Knoten und $p \\ge s$ $\\Rightarrow$ die Gewichte sind ebenfalls symmetrisch (mit $L_{s+1-k}(x) = L_k(1 - x)$, SS 22)."],
            ["ungerade Integranden", "Eine symmetrische QF liefert für punktsymmetrische $f$ auf $[-1, 1]$ den Wert $0$ — wie das Integral (SS 22)."],
          ])}
          <h3>Rechnen in der Klausur (WS 24/25, SS 17, WS 22/23, SS 20)</h3>
          <p>Für $c = (\\frac14, \\frac12, \\frac34)$: $b_1 + b_2 + b_3 = 1$, $\\frac14b_1 + \\frac12b_2 + \\frac34b_3 = \\frac12$, $\\frac1{16}b_1 + \\frac14b_2 + \\frac9{16}b_3 = \\frac13$. Mit Symmetrie $b_1 = b_3$: $2b_1 + b_2 = 1$ und $\\frac58b_1 + \\frac14b_2 = \\frac13$ $\\Rightarrow b = (\\frac23, -\\frac13, \\frac23)$. Dann die nächsten $q$ prüfen: $q = 4$ gilt (symmetrisch!), $q = 5$ nicht $\\Rightarrow p = 4$. Das negative Gewicht macht die Formel nicht monoton.</p>
        </div>
        ${pw("ord", pseg("set", Object.entries(NM_NODE_SETS).map(([k, v]) => [k, v.name]), "q14"), { wide: true })}
        ${nmTraps([
          "Ordnung $p$ heißt exakt bis Grad <b>$p - 1$</b>. Trapez hat Ordnung 2, ist also exakt für Geraden, nicht für Parabeln.",
          "Für interpolatorische QF gilt immer $p \\ge s$.",
          "WS 24/25, 4c: eine QF mit einem negativen Gewicht ist nicht monoton (Auslöschung möglich); liegen die Knoten nicht auf $0$ und $1$, lässt sich summiert keine Auswertung wiederverwenden, anders als bei Simpson. (Nachgerechnet: zu den Knoten $\\frac15, \\frac12, \\frac45$ gehören bei Ordnung $\\ge 3$ die Gewichte $\\frac{25}{54}, \\frac{2}{27}, \\frac{25}{54}$ — die in der Aufgabe angegebenen $\\frac{11}{18}, -\\frac{4}{18}, \\frac{11}{18}$ erfüllen die Bedingung für $q = 3$ nicht.)",
        ])}`,
      setup: (root) => nmWOrder(root),
      check: [
        { q: "Was bedeutet Ordnung $p = 4$?", opts: ["Exakt für alle Polynome vom Grad $\\le 3$", "Exakt für Grad $\\le 4$", "Fehler $\\le h^4$", "4 Knoten"], why: "Ordnung $p$: exakt bis Grad $p - 1$." },
        { q: "Welche Ordnungsbedingung gilt für $q = 2$?", opts: ["$\\sum b_kc_k = \\frac12$", "$\\sum b_k = 1$", "$\\sum b_kc_k^2 = \\frac13$", "$\\sum c_k = \\frac12$"], why: "$\\int_0^1 t\\,dt = \\frac12$." },
        { q: "Eine symmetrische QF erfüllt die Bedingungen für $q = 1, 2, 3$. Was folgt?", opts: ["Auch $q = 4$ gilt: $p \\ge 4$", "$p = 3$", "$p = 6$", "nichts"], why: "Die Ordnung einer symmetrischen QF ist gerade." },
        { q: "Knoten $c = (0, \\frac12, 1)$, Ordnung $\\ge 3$. Welche Gewichte?", opts: ["$(\\frac16, \\frac23, \\frac16)$", "$(\\frac13, \\frac13, \\frac13)$", "$(\\frac14, \\frac12, \\frac14)$", "$(\\frac12, 0, \\frac12)$"], why: "Eindeutig durch die Knoten bestimmt — die Simpsonregel." },
      ],
    },
    {
      id: "5.3", title: "Hohe Ordnung und Gauß-Quadratur", short: "Gauß", about: "Knotenpolynom M(x), Ordnung s + m, maximal 2s, Legendre, Gewichtsfunktionen",
      html: () => `
        ${nmGist([
          `Mit dem <b>Knotenpolynom</b> $M(x) = (x - c_1)\\cdots(x - c_s)$: eine QF mit $p \\ge s$ hat Ordnung <b>$s + m$</b> $\\Leftrightarrow \\int_0^1 M(x)g(x)\\,dx = 0$ für alle $g \\in P_{m-1}$, aber nicht für ein $g$ vom Grad $m$.`,
          `Die <b>maximale Ordnung ist $2s$</b> ($g = M$ ist nie orthogonal zu sich selbst).`,
          `Sie wird genau von der <b>Gauß-Quadratur</b> erreicht: $c_k = \\frac12(1 + \\gamma_k)$ mit den Nullstellen $\\gamma_k$ des Legendre-Polynoms vom Grad $s$.`,
        ])}
        <div class="card">
          <h3>Beweisidee (SS 24)</h3>
          <p>Polynomdivision: $f \\in P_{s+m-1}$ schreibt sich als $f = Mg + r$ mit $g \\in P_{m-1}$, $r \\in P_{s-1}$. Die QF ist für $r$ exakt ($p \\ge s$) und $\\sum b_kM(c_k)g(c_k) = 0$, weil $M(c_k) = 0$. Also ist sie für $f$ genau dann exakt, wenn $\\int Mg = 0$.</p>
          <h3>Gauß-Quadratur</h3>
          ${ppFacts([
            ["s = 1", "Mittelpunktregel, $p = 2$."],
            ["s = 2", `$c = \\frac12 \\mp \\frac{\\sqrt3}{6}$, $b = \\frac12, \\frac12$, $p = 4$ (WS 20/21: Ordnungsbedingungen bis $q = 4$ nachrechnen).`],
            ["s = 3", "$c_1 = \\frac12 - \\frac{\\sqrt{15}}{10}$, $c_2 = \\frac12$, $c_3 = \\frac12 + \\frac{\\sqrt{15}}{10}$; $b = \\frac5{18}, \\frac8{18}, \\frac5{18}$; $p = 6$."],
            ["Eigenschaften", "Gewichte positiv ($b_k = \\int L_k^2 > 0$, weil $L_k^2$ Grad $2s - 2$ hat), symmetrisch, Knoten im Inneren $(0, 1)$."],
          ])}
          <h3>Allgemeinere Integrale</h3>
          <p>$\\int_a^b w(x)f(x)\\,dx \\approx \\sum w_kf(x_k)$ mit einer Gewichtsfunktion $w > 0$: Ordnung $\\ge s$ für $w_k = \\int wL_k$, Ordnung $2s$, wenn $\\int wMg = 0$ — die Knoten sind dann Nullstellen orthogonaler Polynome.</p>
          <table class="len-terms nm-tab"><thead><tr><th>$(a, b)$</th><th>$w(x)$</th><th>Polynome</th></tr></thead><tbody>
            <tr><td>$(-1, 1)$</td><td>$1$</td><td>Legendre</td></tr><tr><td>$(-1, 1)$</td><td>$\\frac{1}{\\sqrt{1 - x^2}}$</td><td>Tschebyscheff</td></tr>
            <tr><td>$(-1, 1)$</td><td>$(1 - x)^\\alpha(1 + x)^\\beta$</td><td>Jacobi</td></tr><tr><td>$(0, \\infty)$</td><td>$x^\\alpha e^{-x}$</td><td>Laguerre</td></tr>
            <tr><td>$(-\\infty, \\infty)$</td><td>$e^{-x^2}$</td><td>Hermite</td></tr></tbody></table>
        </div>
        ${nmTraps([
          "Gauß-Knoten sind nicht äquidistant und enthalten die Intervallenden nicht — summiert lassen sich keine Auswertungen teilen.",
          "Mit $s = 3$ symmetrisch und $c_2 = \\frac12$ hat man einen freien Parameter: Ordnung 4 für fast jedes $c_1$, Ordnung 6 nur für das Gauß-$c_1$ (SS 20).",
        ])}`,
      check: [
        { q: "Was ist die maximale Ordnung einer QF mit $s$ Knoten?", opts: ["$2s$", "$s$", "$s + 1$", "$2s + 1$"], why: "Für $g = M$ wäre $\\int M^2 = 0$ nötig — unmöglich." },
        { q: "Welche Knoten hat die Gauß-Quadratur?", opts: ["Transformierte Nullstellen des Legendre-Polynoms vom Grad $s$", "Äquidistante Knoten", "Tschebyscheff-Stützstellen", "Die Intervallenden"], why: "$c_k = \\frac12(1 + \\gamma_k)$." },
        { q: "Warum sind die Gewichte der Gauß-Quadratur positiv?", opts: ["$b_k = \\int_0^1 L_k^2\\,dx > 0$, weil $L_k^2$ Grad $2s - 2$ hat", "Weil die Knoten positiv sind", "Weil sie symmetrisch ist", "Weil $\\int L_k = 1$"], why: "Die Formel ist für $L_k^2$ exakt und $L_k^2(c_j) = \\delta_{kj}$ (WS 20/21)." },
        { q: "$p \\ge s$ und $\\int_0^1 M(x)g(x)\\,dx = 0$ für alle $g \\in P_1$, aber nicht für $x^2$. Ordnung?", opts: ["$s + 2$", "$s + 1$", "$2s$", "$s$"], why: "Orthogonal zu $P_{m-1}$ mit $m = 2$, nicht zu Grad $m$." },
      ],
    },
    {
      id: "5.4", title: "Quadraturfehler und summierte Formeln", short: "Fehler & summiert", about: "Peano-Kern, Fehlerkonstanten, summierte QF, O(hᵖ), Halbieren der Schrittweite",
      html: () => `
        ${nmGist([
          `Für $g \\in C^p$ und Ordnung $p$ (Peano): $R(g) = \\int_0^1 K_p(t)\\,g^{(p)}(t)\\,dt$ mit dem Peano-Kern $K_p(t) = \\frac{(1 - t)^p}{p!} - \\sum b_k\\frac{(c_k - t)_+^{p-1}}{(p - 1)!}$.`,
          `Damit $|E(f)| \\le (b - a)^{p+1}\\max|f^{(p)}|\\int_0^1|K_p|$: Mittelpunkt <b>$\\frac1{24}$</b>, Trapez <b>$\\frac1{12}$</b>, Simpson <b>$\\frac1{2880}$</b>.`,
          `<b>Summiert</b> auf $N$ Teilintervallen der Länge $h$: Gesamtfehler $\\le (b - a)\\max_n \\mathrm{err}_n =$ <b>$O(h^p)$</b>.`,
        ])}
        <div class="card">
          <h3>Trapezregel genau (SS 26)</h3>
          <p>Die Trapezregel ist interpolatorisch mit der Geraden $p$ durch $(0, f(0))$, $(1, f(1))$; das Restglied $f - p = \\frac12 w_2(x)f''(\\xi)$ mit $|w_2(x)| = x(1 - x)$ gibt</p>
          ${tx(`\\Big|\\int_0^1 f - T(f)\\Big| \\le \\frac12\\max|f''|\\int_0^1 x(1 - x)\\,dx = \\frac{1}{12}\\max|f''|`)}
          <p>Summiert: $\\sum_n \\frac{h^3}{12}\\max|f''| = \\frac{b - a}{12}\\,h^2\\max|f''|$.</p>
          ${tx(`T_N(f) = h\\Big[\\frac{f(x_0) + f(x_N)}{2} + \\sum_{n=1}^{N-1} f(x_n)\\Big], \\qquad T_{2N}(f) = \\frac12T_N(f) + \\frac h2\\sum_{n=1}^{N} f\\Big(\\frac{x_{n-1} + x_n}{2}\\Big)`)}
          <p>Nur die $N$ Mittelpunkte sind neu; $h$ halbiert sich, der Fehler viertelt sich. Die summierte Simpsonregel (SS 17) teilt sich ebenso die Endpunkte: $\\frac h6\\big[f(x_0) + 4\\sum f(m_n) + 2\\sum_{n=1}^{N-1}f(x_n) + f(x_N)\\big]$ — $2N + 1$ Auswertungen.</p>
          ${ppFacts([
            ["Lemma", "$\\int_0^1 K_p = \\frac{1}{p!}\\big(\\frac{1}{p + 1} - \\sum b_kc_k^p\\big) \\neq 0$. Für viele QF ist $\\int|K_p| = |\\int K_p|$."],
            ["Adaptivität", "Die Zerlegung so wählen, dass der Fehler gleich auf die Teilintervalle verteilt ist: wo $f$ stark variiert, kleinere $h$ (SS 19)."],
            ["Tabelle erkennen", "Fehlertabelle (WS 19/20): Faktor 4 je Halbierung → Ordnung 2; Faktor 16 → Simpson; Trapez hat etwa den doppelten Betrag und das andere Vorzeichen des Mittelpunkts."],
            ["Rechteck vs. Trapez", "WS 24/25: summiert kosten beide etwa $N$ Auswertungen, aber Trapez hat Ordnung 2 statt 1 — also Trapez."],
          ])}
        </div>
        ${pw("sumq", pseg("fn", Object.entries(NM_Q_FNS).map(([k, v]) => [k, v.name]), "exp"), { wide: true })}
        <p class="small muted">Für $e^x$ auf $[0, 5]$ ist das die Tabelle aus WS 19/20.</p>
        ${nmTraps([
          "Der Fehler einer einzelnen QF auf einem Teilintervall ist $O(h^{p+1})$, summiert über $N = (b - a)/h$ Stücke $O(h^p)$.",
          "Der Peano-Kern braucht $g \\in C^p$. Für nicht glatte $f$ (wie $|x|$ oder Spitzen) bringt hohe Ordnung wenig.",
        ])}`,
      setup: (root) => nmWSummed(root),
      check: [
        { q: "Fehlerschranke der Trapezregel auf $[a, b]$?", opts: ["$\\frac{(b - a)^3}{12}\\max|f''|$", "$\\frac{(b - a)^3}{24}\\max|f''|$", "$\\frac{(b - a)^5}{2880}\\max|f^{(4)}|$", "$\\frac{(b - a)^2}{12}\\max|f'|$"], why: "$p = 2$, $\\int|K_2| = \\frac1{12}$." },
        { q: "Die Schrittweite der summierten Simpsonregel wird halbiert. Um welchen Faktor fällt der Fehler etwa?", opts: ["$16$", "$4$", "$2$", "$8$"], why: "$O(h^4)$: $(\\frac12)^4 = \\frac1{16}$." },
        { q: "$T_N(f)$ ist bekannt. Wie viele neue Auswertungen braucht $T_{2N}(f)$?", opts: ["$N$ (die Mittelpunkte)", "$2N + 1$", "$N + 1$", "keine"], why: "$T_{2N} = \\frac12T_N + \\frac h2\\sum f(\\text{Mittelpunkte})$ (SS 26)." },
        { q: "Welche Größenordnung hat der Fehler einer summierten QF der Ordnung $p$?", opts: ["$O(h^p)$", "$O(h^{p+1})$", "$O(h)$", "$O(1/N)$"], why: "Pro Teilintervall $h^{p+1}$, mal $N \\approx 1/h$ Teilintervalle." },
      ],
    },
  ],
});
