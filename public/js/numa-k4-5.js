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
          `Zu N + 1 Stützpunkten (x<sub>n</sub>, f<sub>n</sub>) mit paarweise verschiedenen x<sub>n</sub> gibt es <b>genau ein</b> Polynom p vom Grad ≤ N mit p(x<sub>n</sub>) = f<sub>n</sub>.`,
          `Existenz über die <b>Lagrange-Polynome</b>: L<sub>n</sub>(x) = ∏<sub>m≠n</sub> (x − x<sub>m</sub>)/(x<sub>n</sub> − x<sub>m</sub>) mit L<sub>n</sub>(x<sub>m</sub>) = δ<sub>nm</sub>, also p = Σ f<sub>n</sub>L<sub>n</sub>.`,
          `Kondition: max|p − p̃| ≤ <b>Λ<sub>N</sub></b> max|f<sub>n</sub> − f̃<sub>n</sub>| mit der Lebesgue-Konstante Λ<sub>N</sub> = max<sub>x</sub> Σ|L<sub>n</sub>(x)| ≥ 1.`,
        ])}
        <div class="card">
          <h3>Eindeutigkeit</h3>
          <p>Hätten p und q beide Grad ≤ N und dieselben Werte in N + 1 Stellen, so hätte p − q (Grad ≤ N) N + 1 Nullstellen — also p − q = 0. Das gilt über jedem Körper (Shamir's Secret Sharing über ℤ<sub>p</sub>: der Schlüssel ist p(0)).</p>
          <h3>Basen von P<sub>N</sub></h3>
          ${ppFacts([
            ["Monome", "1, x, …, x<sup>N</sup> — führt auf die schlecht konditionierte Vandermonde-Matrix."],
            ["Lagrange", "L₀, …, L<sub>N</sub>: Koeffizienten sind direkt die f<sub>n</sub>; jeder neue Punkt ändert alle L<sub>n</sub>."],
            ["Newton", "w<sub>n</sub>(x) = ∏<sub>m&lt;n</sub>(x − x<sub>m</sub>): ein neuer Punkt fügt nur einen Summanden an (" + nmSee("4.2") + ")."],
          ])}
          <h3>Die Lebesgue-Konstante</h3>
          <p>Sie hängt nur von der relativen Lage der Stützstellen ab (affin-lineare Abbildung [a, b] → [−1, 1] ändert sie nicht). Auf [−1, 1]:</p>
          <table class="len-terms nm-tab"><thead><tr><th>N</th><th>äquidistant</th><th>Tschebyscheff</th></tr></thead><tbody>
            ${[[5, "≈ 3,10", "≈ 2,1"], [10, "≈ 29,9", "≈ 2,5"], [15, "≈ 512", "≈ 2,7"], [20, "≈ 10 987", "≈ 2,9"]].map((r) => `<tr><td>${r[0]}</td><td class="nm-err">${r[1]}</td><td>${r[2]}</td></tr>`).join("")}</tbody></table>
          <p><b>Bestapproximation</b> (SS 24): für jedes q ∈ P<sub>N</sub> ist max|f − p| ≤ (1 + Λ<sub>N</sub>) max|f − q|. Mit Tschebyscheff-Stützstellen ist p für N ≈ 20 also höchstens etwa 4-mal schlechter als das beste Polynom; äquidistant kann es 10⁴-mal schlechter sein.</p>
        </div>
        ${pw("ip", `${pseg("fn", Object.entries(NM_IP_FNS).map(([k, v]) => [k, v.name]), "runge")}${pslider("N", "Grad N", 1, 20, 1, 10)}
          ${pseg("kind", [["eq", "äquidistant"], ["cheb", "Tschebyscheff"]], "eq")}${pseg("leb", [[0, "f und p"], [1, "Lebesgue-Funktion"]], 0)}`, { wide: true })}
        ${nmTraps([
          "Vorsicht bei Polynomen hohen Grades mit äquidistanten Stützstellen: Λ<sub>N</sub> wächst exponentiell. Abhilfe: Tschebyscheff oder Splines (SS 17).",
          "Λ<sub>N</sub> ≥ 1, weil Σ L<sub>n</sub> ≡ 1 (die Interpolation der 1).",
          "Interpolation ist ein Spezialfall der Approximation: dort wird nur ‖f − p‖ klein gemacht, hier p(x<sub>n</sub>) = f<sub>n</sub> verlangt.",
        ])}`,
      setup: (root) => nmWInterp(root),
      check: [
        { q: "Wie viele Stützstellen legen ein Polynom vom Grad ≤ N eindeutig fest?", opts: ["N + 1 paarweise verschiedene", "N", "2N", "N + 1 beliebige"], why: "Zwei solche Polynome mit gleichen Werten in N + 1 Stellen hätten eine Differenz mit N + 1 Nullstellen." },
        { q: "Was gilt für das n-te Lagrange-Polynom?", opts: ["Lₙ(xₘ) = δₙₘ", "Lₙ(xₙ) = 0", "Lₙ hat Grad n", "Σ Lₙ(x) = 0"], why: "Lₙ ist 1 in xₙ und 0 in allen anderen Stützstellen; alle Lₙ haben Grad N und summieren zu 1." },
        { q: "Was misst die Lebesgue-Konstante Λ_N?", opts: ["Die Kondition der Interpolation bzgl. Fehlern in den Werten fₙ", "Den Interpolationsfehler |f − p|", "Den Grad des Polynoms", "Den Aufwand"], why: "max|p − p̃| ≤ Λ_N max|fₙ − f̃ₙ|, und Λ_N ist die kleinste solche Zahl." },
        { q: "Was passiert bei 1/(1 + 25x²) mit vielen äquidistanten Stützstellen?", opts: ["Am Rand entstehen große Oszillationen", "Der Fehler geht gleichmäßig gegen 0", "Das Polynom ist nicht eindeutig", "p ist konstant"], why: "Runge-Phänomen. Mit Tschebyscheff-Stützstellen konvergiert es." },
      ],
    },
    {
      id: "4.2", title: "Dividierte Differenzen und Newton-Darstellung", short: "Dividierte Differenzen", about: "Lemma von Aitken, Differenzenschema, Newton-Polynome, Horner",
      html: () => `
        ${nmGist([
          `<b>Aitken</b>: das Polynom zu (x<sub>n</sub>, f<sub>n</sub>), …, (x<sub>k</sub>, f<sub>k</sub>) setzt sich aus zwei kleineren zusammen: p<sub>n,k</sub>(x) = ${frac("(x<sub>n</sub> − x)p<sub>n+1,k</sub>(x) − (x<sub>k</sub> − x)p<sub>n,k−1</sub>(x)", "x<sub>n</sub> − x<sub>k</sub>")}.`,
          `Koeffizientenvergleich gibt die <b>dividierten Differenzen</b> f<sub>n,k</sub> = ${frac("f<sub>n,k−1</sub> − f<sub>n+1,k</sub>", "x<sub>n</sub> − x<sub>k</sub>")}, f<sub>n,n</sub> = f<sub>n</sub>.`,
          `Die oberste Diagonale des Schemas sind die Koeffizienten der <b>Newton-Darstellung</b> p = f<sub>0,0</sub> + f<sub>0,1</sub>w₁ + ⋯ + f<sub>0,N</sub>w<sub>N</sub>.`,
        ])}
        <div class="card">
          <h3>Warum Newton</h3>
          <p>Aus Aitken folgt p<sub>0,N</sub> = p<sub>0,N−1</sub> + f<sub>0,N</sub>w<sub>N</sub>: der neue Koeffizient ist der Leitkoeffizient. Ein zusätzlicher Stützpunkt kostet nur eine neue Zeile im Schema — das alte Polynom bleibt (SS 17, SS 24, WS 19/20).</p>
          <p>Aufwand des Schemas: N(N + 1)/2 Divisionen und N(N + 1) Additionen.</p>
          <h3>Horner-Schema</h3>
          ${F(`p(x) = f<sub>0,0</sub> + (x − x<sub>0</sub>)[f<sub>0,1</sub> + (x − x<sub>1</sub>)[f<sub>0,2</sub> + ⋯ + (x − x<sub>N−1</sub>)f<sub>0,N</sub>]⋯]`)}
          <p>Von innen nach außen ausgewertet: N Multiplikationen statt N(N + 1)/2.</p>
        </div>
        ${pw("dd", `${pseg("set", [["vl", "Vorlesung"], ["ss24", "SS 24"], ["ws2223", "WS 22/23"], ["x", "Neue Punkte"]], "vl")}
          <div class="lw-btns">${pbtn("prev", "← zurück")}${pbtn("next", "nächste Spalte →", "primary")}${pbtn("add", "Punkt hinzufügen")}</div>`, { wide: true })}
        <p class="small muted">Beispiel der Vorlesung: (−1, 1), (0, 6), (1, −3), (3, 3) ergibt p(x) = 1 + 5(x + 1) − 7(x + 1)x + 11/4 (x + 1)x(x − 1).</p>
        ${nmTraps([
          "Nenner immer x<sub>n</sub> − x<sub>k</sub> der <b>äußeren</b> Stützstellen des Teilstücks, nicht der Nachbarn.",
          "Wird ein Punkt angefügt, der nicht am Ende der x-Reihe liegt (z. B. x₄ = 0 in SS 24), bleibt das Schema trotzdem gültig — die x<sub>n</sub> müssen nicht sortiert sein.",
          "Die Newton-Polynome angeben: w₁ = (x − x₀), w₂ = (x − x₀)(x − x₁), … (WS 20/21 verlangt sie explizit).",
          "Richtige Aitken-Form (WS 22/23): p(x) = [(x₀ − x)p<sub>1,N</sub>(x) − (x<sub>N</sub> − x)p<sub>0,N−1</sub>(x)] / (x₀ − x<sub>N</sub>).",
        ])}`,
      setup: (root) => nmWDD(root),
      check: [
        { q: "Stützpunkte (1, 16), (3, 4), (5, 8). Was ist f₀,₁?", opts: ["−6", "6", "2", "−12"], why: "(16 − 4)/(1 − 3) = −6 (WS 20/21)." },
        { q: "Welche Werte des Differenzenschemas sind die Newton-Koeffizienten?", opts: ["f₀,₀, f₀,₁, …, f₀,N (die oberste Diagonale)", "die letzte Zeile fₙ,N", "die erste Spalte fₙ,ₙ", "alle Einträge der letzten Spalte"], why: "p = Σ f₀,ₖ wₖ." },
        { q: "Ein Stützpunkt kommt hinzu. Was muss man neu berechnen?", opts: ["Eine neue Zeile im Schema; p wird um f₀,N₊₁wN₊₁ ergänzt", "Alles", "Nur f₀,₀", "Die Lagrange-Polynome"], why: "p₀,N₊₁ = p₀,N + f₀,N₊₁ wN₊₁." },
        { q: "Wozu dient das Horner-Schema?", opts: ["Zum effizienten Auswerten des Polynoms", "Zum Berechnen der dividierten Differenzen", "Zur Fehlerabschätzung", "Zur Wahl der Stützstellen"], why: "Verschachtelt ausmultipliziert braucht man nur N Multiplikationen." },
      ],
    },
    {
      id: "4.3", title: "Restglied und Tschebyscheff-Interpolation", short: "Restglied & Tschebyscheff", about: "f − p = w_{N+1} f^{(N+1)}(ξ)/(N+1)!, Min-Max-Eigenschaft, Stützstellen",
      html: () => `
        ${nmGist([
          `<b>Restglied</b>: für f ∈ C<sup>N+1</sup> gibt es ξ = ξ(x) mit f(x) − p(x) = w<sub>N+1</sub>(x) ${frac("f<sup>(N+1)</sup>(ξ)", "(N + 1)!")}.`,
          `Die Stützstellen beeinflussen nur max|w<sub>N+1</sub>|. Am kleinsten ist es für die <b>Tschebyscheff-Stützstellen</b> x<sub>n</sub> = cos(${frac("2n + 1", "2N + 2")}π): dann ist max|w<sub>N+1</sub>| = 2<sup>−N</sup>.`,
          `Sie sind auch gut konditioniert: Λ<sub>N</sub> ≤ 3 für N ≤ 20, ≤ 4 für N ≤ 100, Λ<sub>N</sub> ≈ (2/π) log N.`,
        ])}
        <div class="card">
          <h3>Tschebyscheff-Polynome</h3>
          ${F(`T<sub>0</sub> = 1,  T<sub>1</sub> = x,  T<sub>N+1</sub>(x) = 2x T<sub>N</sub>(x) − T<sub>N−1</sub>(x),  T<sub>N</sub>(x) = cos(N arccos x)`)}
          <p>Leitkoeffizient von T<sub>N+1</sub> ist 2<sup>N</sup>; T<sub>N</sub> ist gerade für gerades N, sonst ungerade. Die Nullstellen von T<sub>N+1</sub> sind die Stützstellen, und w<sub>N+1</sub> = 2<sup>−N</sup>T<sub>N+1</sub>.</p>
          <p><b>Anderes Intervall</b>: x ↦ (a + b)/2 + (b − a)x/2 bildet [−1, 1] auf [a, b] ab; Lebesgue-Konstante und Restglied-Faktor bleiben gleich (dann max|w<sub>N+1</sub>| = 2<sup>−N</sup>((b − a)/2)<sup>N+1</sup>).</p>
          <h3>Wie viele Stützstellen? (WS 20/21, WS 19/20)</h3>
          ${F(`max|f − p| ≤ ${frac("2<sup>−N</sup>", "(N + 1)!")} max|f<sup>(N+1)</sup>|`)}
          <p>f = sin auf [−1, 1], Fehler ≤ 10⁻²: alle Ableitungen ≤ 1, also 2<sup>−N</sup>/(N + 1)! ≤ 10⁻². N = 2: 1/24 ≈ 0,042 — zu groß; N = 3: 1/192 ≈ 0,0052 ✓. Für cos(πx) kommt der Faktor π<sup>N+1</sup> dazu. Weniger Stützstellen braucht man, wenn man Symmetrie ausnutzt oder das Intervall aufteilt.</p>
        </div>
        ${pw("cheb", `${pslider("N", "N", 1, 14, 1, 6)}${pseg("show", [["w", "w<sub>N+1</sub>: beide Knotenarten"], ["T", "T<sub>N+1</sub> und Nullstellen"]], "w")}`, { wide: true })}
        ${nmTraps([
          "Die Formel mit 2N + 2 im Nenner und n = 0, …, N: das sind N + 1 Knoten, die Nullstellen von T<sub>N+1</sub>.",
          "Das Restglied ist eine Gleichung mit unbekanntem ξ — für eine Schranke nimmt man max|f<sup>(N+1)</sup>|.",
          "Tschebyscheff ist gut für glatte (analytische) Funktionen mit hoher Genauigkeit; sonst sind Splines besser.",
        ])}`,
      setup: (root) => nmWCheb(root),
      check: [
        { q: "Was ist T₂(x)?", opts: ["2x² − 1", "x²", "2x²", "x² − 1"], why: "T₂ = 2x·T₁ − T₀ = 2x² − 1." },
        { q: "Was ist max|w_{N+1}| auf [−1, 1] für Tschebyscheff-Stützstellen?", opts: ["2⁻ᴺ", "1", "2ᴺ", "1/(N + 1)!"], why: "w_{N+1} = 2⁻ᴺT_{N+1}, und |T_{N+1}| ≤ 1." },
        { q: "Welche Formel gibt die Tschebyscheff-Stützstellen auf [−1, 1]?", opts: ["xₙ = cos((2n + 1)π/(2N + 2)), n = 0, …, N", "xₙ = −1 + 2n/N", "xₙ = cos(nπ/N)", "xₙ = sin((2n + 1)π/(2N + 2))"], why: "Die Nullstellen von T_{N+1}." },
        { q: "sin auf [−1, 1], Tschebyscheff-Interpolation, Fehler ≤ 10⁻². Welches N reicht minimal?", opts: ["3", "2", "5", "10"], why: "2⁻ᴺ/(N + 1)!: N = 2 gibt 1/24, N = 3 gibt 1/192 ≤ 10⁻²." },
      ],
    },
    {
      id: "4.4", title: "Kubische Splines", short: "Splines", about: "s ∈ C², stückweise kubisch; eingespannt, natürlich, periodisch; Momente, LGS, Fehler",
      html: () => `
        ${nmGist([
          `Ein <b>kubischer interpolierender Spline</b> zu a = x₀ &lt; ⋯ &lt; x<sub>N</sub> = b ist eine C²-Funktion mit s|<sub>[x<sub>n−1</sub>, x<sub>n</sub>]</sub> ∈ P₃ und s(x<sub>n</sub>) = y<sub>n</sub>.`,
          `Zwei Bedingungen fehlen noch — drei Typen: <b>eingespannt</b> s′(a) = v₀, s′(b) = v<sub>N</sub>; <b>natürlich</b> s″(a) = s″(b) = 0; <b>periodisch</b> s′(a) = s′(b), s″(a) = s″(b).`,
          `Splines minimieren die „Biegeenergie“ ∫|s″|² unter allen C²-Interpolierenden mit denselben Randbedingungen.`,
        ])}
        <div class="card">
          <h3>Warum gerade diese Randbedingungen</h3>
          <p>Variation s + εh mit h(x<sub>n</sub>) = 0: ∫|s″|² ≤ ∫|s″ + εh″|² für alle ε, h ⇔ ∫ s″h″ = 0 ⇔ (partielle Integration auf jedem Teilintervall, s‴ stückweise konstant) <b>s″(b)h′(b) − s″(a)h′(a) = 0</b>. Das gilt, wenn h′ am Rand verschwindet (eingespannt), s″ am Rand verschwindet (natürlich) oder alles periodisch ist.</p>
          <h3>Berechnung über die Momente γ<sub>n</sub> = s″(x<sub>n</sub>)</h3>
          ${F(`s<sub>n</sub>(x) = y<sub>n−1</sub> + (x − x<sub>n−1</sub>)y<sub>n−1,n</sub> + (x − x<sub>n−1</sub>)(x − x<sub>n</sub>)[α<sub>n</sub>(x − x<sub>n−1</sub>) + β<sub>n</sub>(x − x<sub>n</sub>)]`)}
          <p>Der erste Teil interpoliert (y<sub>n−1,n</sub> = (y<sub>n</sub> − y<sub>n−1</sub>)/h<sub>n</sub> ist die Sekantensteigung), der zweite glättet und verschwindet in den Knoten. Die Glattheit s′<sub>n</sub>(x<sub>n</sub>) = s′<sub>n+1</sub>(x<sub>n</sub>) gibt für h<sub>n</sub> = x<sub>n</sub> − x<sub>n−1</sub>:</p>
          ${F(`h<sub>n</sub>γ<sub>n−1</sub> + 2(h<sub>n</sub> + h<sub>n+1</sub>)γ<sub>n</sub> + h<sub>n+1</sub>γ<sub>n+1</sub> = 6(y<sub>n,n+1</sub> − y<sub>n−1,n</sub>),  n = 1, …, N − 1`)}
          <p>Eingespannt kommen 2h₁γ₀ + h₁γ₁ = 6(y<sub>0,1</sub> − v₀) und h<sub>N</sub>γ<sub>N−1</sub> + 2h<sub>N</sub>γ<sub>N</sub> = 6(v<sub>N</sub> − y<sub>N−1,N</sub>) dazu. Die Matrix ist <b>symmetrisch, tridiagonal und strikt diagonaldominant</b> — eindeutig lösbar, Cholesky mit Bandstruktur in O(N), äquidistant gut konditioniert (cond∞ ≤ 3, SS 26: ≤ 6 mit dem Faktor h/6).</p>
          ${ppFacts([
            ["Kondition", "Lagrange-Splines l<sub>n</sub> (eingespannt mit l<sub>n</sub>′ = 0 am Rand, l<sub>n</sub>(x<sub>m</sub>) = δ<sub>nm</sub>): s − s̃ = Σ(y<sub>n</sub> − ỹ<sub>n</sub>)l<sub>n</sub>, Λ<sub>N</sub> = max Σ|l<sub>n</sub>| ≤ 2 bei äquidistanter Unterteilung."],
            ["Fehler", "f ∈ C⁴, eingespannt mit s′ = f′ am Rand: max|f − s| ≤ (5/384) h⁴ max|f⁽⁴⁾|, h = max h<sub>n</sub>."],
            ["not-a-knot", "s‴ stetig in x₁ und x<sub>N−1</sub>: die ersten zwei und letzten zwei Stücke sind je ein Polynom (SS 19)."],
            ["Parameter bestimmen", "WS 17/18, SS 20: s, s′, s″ links und rechts von x₁ gleichsetzen — drei Gleichungen."],
          ])}
        </div>
        ${pw("spl", `${pseg("type", [["clamped", "eingespannt"], ["natural", "natürlich"], ["periodic", "periodisch"]], "clamped")}
          <div class="nm-clamp">${pslider("v0", "s′(a) = v₀", -90, 90, 1, 0)}${pslider("vN", "s′(b) = v<sub>N</sub>", -90, 90, 1, 0)}</div>
          ${pseg("pts", [[0, "Vorlesung"], [1, "5 Punkte"]], 0)}`, { wide: true })}
        <p class="small muted">Mit v₀ = 0 und v<sub>N</sub> = 81 entsteht der eingespannte Spline der Vorlesung: 3x³ − 2x² + 3, −15x³ + 52x² − 54x + 21, 61x³ − 404x² + 858x − 587.</p>
        ${nmTraps([
          "Ein Spline ist <b>C²</b>, nicht nur stetig: s, s′ und s″ müssen an den inneren Knoten passen.",
          "Natürlich heißt s″ = 0 am Rand — nicht s′ = 0 (das wäre eingespannt mit v = 0).",
          "Erkennen im Bild (SS 19, Übung 5): gerade auslaufend → natürlich; gleiche Steigung an beiden Enden → periodisch; sonst eingespannt.",
          "Ein quadratischer Spline (SS 20, Übung 5) ist nur C¹ und braucht nur eine Zusatzbedingung.",
        ])}`,
      setup: (root) => nmWSpline(root),
      check: [
        { q: "Welche Glattheit hat ein kubischer Spline?", opts: ["C²", "C¹", "C³", "nur stetig"], why: "Auf jedem Stück kubisch, insgesamt zweimal stetig differenzierbar." },
        { q: "Was fordert ein natürlicher Spline?", opts: ["s″(a) = s″(b) = 0", "s′(a) = s′(b) = 0", "s(a) = s(b)", "s‴ stetig"], why: "Die zweite Ableitung verschwindet am Rand." },
        { q: "Welche Struktur hat das LGS für die Momente (eingespannt)?", opts: ["symmetrisch, tridiagonal, strikt diagonaldominant", "voll besetzt", "obere Dreiecksmatrix", "singulär"], why: "Deshalb eindeutig lösbar und in O(N) mit Cholesky." },
        { q: "Wie schnell fällt der Fehler eines eingespannten Splines mit der Gitterweite h?", opts: ["wie h⁴", "wie h²", "wie h", "exponentiell"], why: "max|f − s| ≤ (5/384) h⁴ max|f⁽⁴⁾|." },
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
          `Eine <b>Quadraturformel</b> (b<sub>k</sub>, c<sub>k</sub>)<sub>k=1,…,s</sub>: ${ig("a", "b")}f dx ≈ (b − a) Σ b<sub>k</sub> f(a + c<sub>k</sub>(b − a)) mit Gewichten b<sub>k</sub> und Knoten c<sub>k</sub> ∈ [0, 1].`,
          `<b>Interpolatorisch</b>: f durch das Interpolationspolynom in den Knoten ersetzen und dieses exakt integrieren — dann b<sub>k</sub> = ∫₀¹ L<sub>k</sub>.`,
          `<b>Kondition</b>: ${frac("|I(f) − I(f̃)|", "|I(f)|")} ≤ cond₁(f) ${frac("‖f − f̃‖<sub>1</sub>", "‖f‖<sub>1</sub>")}, cond₁(f) = I(|f|)/|I(f)| — schlecht, wenn sich positive und negative Flächen fast aufheben.`,
        ])}
        <div class="card">
          <h3>Die vier Grundformeln</h3>
          <table class="len-terms nm-tab"><thead><tr><th>Regel</th><th>Formel</th><th>s</th><th>b<sub>k</sub></th><th>c<sub>k</sub></th><th>p</th></tr></thead><tbody>
            <tr><td>Rechteck</td><td>(b − a) f(a)</td><td>1</td><td>1</td><td>0</td><td>1</td></tr>
            <tr><td>Mittelpunkt</td><td>(b − a) f((a + b)/2)</td><td>1</td><td>1</td><td>½</td><td>2</td></tr>
            <tr><td>Trapez</td><td>(b − a)(f(a) + f(b))/2</td><td>2</td><td>½, ½</td><td>0, 1</td><td>2</td></tr>
            <tr><td>Simpson</td><td>(b − a)(f(a) + 4f((a + b)/2) + f(b))/6</td><td>3</td><td>⅙, ⅔, ⅙</td><td>0, ½, 1</td><td>4</td></tr></tbody></table>
          ${ppFacts([
            ["linear und monoton", "Jede QF ist linear in f; monoton (f ≥ g ⇒ QF(f) ≥ QF(g)) genau dann, wenn alle b<sub>k</sub> ≥ 0."],
            ["Newton-Cotes", "Interpolatorisch mit äquidistanten Knoten: Mittelpunkt, Trapez, Simpson, 3/8-Regel."],
            ["Herleitung", "∫p = Σ f(x<sub>n</sub>)∫L<sub>n</sub> = (b − a) Σ b<sub>k</sub>f(a + c<sub>k</sub>(b − a)) mit s = N + 1, c<sub>k</sub> = (x<sub>k−1</sub> − a)/(b − a) (WS 24/25)."],
          ])}
        </div>
        ${pw("qf", `${pseg("fn", Object.entries(NM_Q_FNS).map(([k, v]) => [k, v.name]), "exp")}${pseg("rule", Object.entries(NM_RULES).map(([k, v]) => [k, v.name]), "trap")}${pslider("N", "Teilintervalle N", 1, 8, 1, 1)}`, { wide: true })}
        ${nmTraps([
          "Die Gewichte summieren sich zu 1 (Ordnung ≥ 1) — gute Probe.",
          "Die Knoten c<sub>k</sub> beziehen sich auf [0, 1]: auf [a, b] wird a + c<sub>k</sub>(b − a) ausgewertet und mit (b − a) multipliziert.",
          "Ein großes Intervall wie [0, 2020] (SS 20) teilt man auf: summierte Formel statt einer einzigen mit riesigem (b − a)<sup>p+1</sup>.",
        ])}`,
      setup: (root) => nmWQuad(root),
      check: [
        { q: "Was sind die Gewichte und Knoten der Simpsonregel?", opts: ["b = (⅙, ⅔, ⅙), c = (0, ½, 1)", "b = (⅓, ⅓, ⅓), c = (0, ½, 1)", "b = (½, ½), c = (0, 1)", "b = (¼, ½, ¼), c = (0, ½, 1)"], why: "(b − a)(f(a) + 4f(m) + f(b))/6." },
        { q: "Wann ist eine Quadraturformel monoton?", opts: ["Wenn alle Gewichte bₖ ≥ 0 sind", "Wenn die Knoten sortiert sind", "Wenn sie symmetrisch ist", "Immer"], why: "Dann folgt aus f ≥ g auch Σbₖf(…) ≥ Σbₖg(…)." },
        { q: "Wann ist die Berechnung von ∫f schlecht konditioniert?", opts: ["Wenn |I(f)| ≪ I(|f|)", "Wenn f groß ist", "Wenn das Intervall lang ist", "Wenn f nicht stetig ist"], why: "cond₁(f) = I(|f|)/|I(f)|: positive und negative Teile heben sich fast auf." },
        { q: "Was ist das Gewicht einer interpolatorischen QF?", opts: ["bₖ = ∫₀¹ Lₖ(x) dx", "bₖ = 1/s", "bₖ = Lₖ(cₖ)", "bₖ = cₖ"], why: "Das exakte Integral des k-ten Lagrange-Polynoms zu den Knoten." },
      ],
    },
    {
      id: "5.2", title: "Ordnung und Symmetrie", short: "Ordnung", about: "Definition, Ordnungsbedingungen, Gewichte aus Knoten, symmetrische Formeln",
      html: () => `
        ${nmGist([
          `Eine QF hat die <b>Ordnung p</b>, wenn sie für alle Polynome vom Grad ≤ p − 1 exakt ist und p maximal ist.`,
          `<b>Ordnungsbedingungen</b>: Ordnung p ⇔ Σ<sub>k</sub> b<sub>k</sub>c<sub>k</sub><sup>q−1</sup> = 1/q für q = 1, …, p, aber nicht für q = p + 1.`,
          `Bei gegebenen Knoten: Ordnung p ≥ s ⇔ b<sub>k</sub> = ∫₀¹ L<sub>k</sub>(x)dx. Die Gewichte sind dann eindeutig.`,
        ])}
        <div class="card">
          <h3>Warum es reicht, [0, 1] und Monome anzusehen</h3>
          <p>Mit der Substitution x = a + t(b − a) wird ${ig("a", "b")}f = (b − a)${ig("0", "1")}g mit g(t) = f(a + t(b − a)), und g ist ein Polynom desselben Grades. Wegen der Linearität reicht es, die Monome t<sup>q−1</sup> zu prüfen: ∫₀¹ t<sup>q−1</sup> = 1/q.</p>
          <h3>Symmetrische Formeln</h3>
          <p>c<sub>k</sub> = 1 − c<sub>s+1−k</sub> und b<sub>k</sub> = b<sub>s+1−k</sub>: Knoten symmetrisch zu ½, Gewichte von oben und unten gleich gelesen.</p>
          ${ppFacts([
            ["Ordnung gerade", "Eine symmetrische QF hat gerade Ordnung — Mittelpunkt und Trapez 2, Simpson 4."],
            ["Gewichte symmetrisch", "Symmetrische Knoten und p ≥ s ⇒ die Gewichte sind ebenfalls symmetrisch (mit L<sub>s+1−k</sub>(x) = L<sub>k</sub>(1 − x), SS 22)."],
            ["ungerade Integranden", "Eine symmetrische QF liefert für punktsymmetrische f auf [−1, 1] den Wert 0 — wie das Integral (SS 22)."],
          ])}
          <h3>Rechnen in der Klausur (WS 24/25, SS 17, WS 22/23, SS 20)</h3>
          <p>Für c = (¼, ½, ¾): b₁ + b₂ + b₃ = 1, ¼b₁ + ½b₂ + ¾b₃ = ½, ¹⁄₁₆b₁ + ¼b₂ + ⁹⁄₁₆b₃ = ⅓. Mit Symmetrie b₁ = b₃: 2b₁ + b₂ = 1 und ⅝b₁ + ¼b₂ = ⅓ ⇒ b = (⅔, −⅓, ⅔). Dann die nächsten q prüfen: q = 4 gilt (symmetrisch!), q = 5 nicht ⇒ p = 4. Das negative Gewicht macht die Formel nicht monoton.</p>
        </div>
        ${pw("ord", pseg("set", Object.entries(NM_NODE_SETS).map(([k, v]) => [k, v.name]), "q14"), { wide: true })}
        ${nmTraps([
          "Ordnung p heißt exakt bis Grad <b>p − 1</b>. Trapez hat Ordnung 2, ist also exakt für Geraden, nicht für Parabeln.",
          "Für interpolatorische QF gilt immer p ≥ s.",
          "WS 24/25, 4c: eine QF mit einem negativen Gewicht ist nicht monoton (Auslöschung möglich); liegen die Knoten nicht auf 0 und 1, lässt sich summiert keine Auswertung wiederverwenden, anders als bei Simpson. (Nachgerechnet: zu den Knoten ⅕, ½, ⅘ gehören bei Ordnung ≥ 3 die Gewichte 25/54, 2/27, 25/54 — die in der Aufgabe angegebenen 11/18, −4/18, 11/18 erfüllen die Bedingung für q = 3 nicht.)",
        ])}`,
      setup: (root) => nmWOrder(root),
      check: [
        { q: "Was bedeutet Ordnung p = 4?", opts: ["Exakt für alle Polynome vom Grad ≤ 3", "Exakt für Grad ≤ 4", "Fehler ≤ h⁴", "4 Knoten"], why: "Ordnung p: exakt bis Grad p − 1." },
        { q: "Welche Ordnungsbedingung gilt für q = 2?", opts: ["Σ bₖcₖ = ½", "Σ bₖ = 1", "Σ bₖcₖ² = ⅓", "Σ cₖ = ½"], why: "∫₀¹ t dt = ½." },
        { q: "Eine symmetrische QF erfüllt die Bedingungen für q = 1, 2, 3. Was folgt?", opts: ["Auch q = 4 gilt: p ≥ 4", "p = 3", "p = 6", "nichts"], why: "Die Ordnung einer symmetrischen QF ist gerade." },
        { q: "Knoten c = (0, ½, 1), Ordnung ≥ 3. Welche Gewichte?", opts: ["(⅙, ⅔, ⅙)", "(⅓, ⅓, ⅓)", "(¼, ½, ¼)", "(½, 0, ½)"], why: "Eindeutig durch die Knoten bestimmt — die Simpsonregel." },
      ],
    },
    {
      id: "5.3", title: "Hohe Ordnung und Gauß-Quadratur", short: "Gauß", about: "Knotenpolynom M(x), Ordnung s + m, maximal 2s, Legendre, Gewichtsfunktionen",
      html: () => `
        ${nmGist([
          `Mit dem <b>Knotenpolynom</b> M(x) = (x − c₁)⋯(x − c<sub>s</sub>): eine QF mit p ≥ s hat Ordnung <b>s + m</b> ⇔ ∫₀¹ M(x)g(x)dx = 0 für alle g ∈ P<sub>m−1</sub>, aber nicht für ein g vom Grad m.`,
          `Die <b>maximale Ordnung ist 2s</b> (g = M ist nie orthogonal zu sich selbst).`,
          `Sie wird genau von der <b>Gauß-Quadratur</b> erreicht: c<sub>k</sub> = ½(1 + γ<sub>k</sub>) mit den Nullstellen γ<sub>k</sub> des Legendre-Polynoms vom Grad s.`,
        ])}
        <div class="card">
          <h3>Beweisidee (SS 24)</h3>
          <p>Polynomdivision: f ∈ P<sub>s+m−1</sub> schreibt sich als f = Mg + r mit g ∈ P<sub>m−1</sub>, r ∈ P<sub>s−1</sub>. Die QF ist für r exakt (p ≥ s) und Σ b<sub>k</sub>M(c<sub>k</sub>)g(c<sub>k</sub>) = 0, weil M(c<sub>k</sub>) = 0. Also ist sie für f genau dann exakt, wenn ∫Mg = 0.</p>
          <h3>Gauß-Quadratur</h3>
          ${ppFacts([
            ["s = 1", "Mittelpunktregel, p = 2."],
            ["s = 2", `c = ½ ∓ √3/6, b = ½, ½, p = 4 (WS 20/21: Ordnungsbedingungen bis q = 4 nachrechnen).`],
            ["s = 3", "c₁ = ½ − √15/10, c₂ = ½, c₃ = ½ + √15/10; b = 5/18, 8/18, 5/18; p = 6."],
            ["Eigenschaften", "Gewichte positiv (b<sub>k</sub> = ∫L<sub>k</sub>² &gt; 0, weil L<sub>k</sub>² Grad 2s − 2 hat), symmetrisch, Knoten im Inneren (0, 1)."],
          ])}
          <h3>Allgemeinere Integrale</h3>
          <p>∫<sub>a</sub><sup>b</sup> w(x)f(x)dx ≈ Σ w<sub>k</sub>f(x<sub>k</sub>) mit einer Gewichtsfunktion w &gt; 0: Ordnung ≥ s für w<sub>k</sub> = ∫wL<sub>k</sub>, Ordnung 2s, wenn ∫wMg = 0 — die Knoten sind dann Nullstellen orthogonaler Polynome.</p>
          <table class="len-terms nm-tab"><thead><tr><th>(a, b)</th><th>w(x)</th><th>Polynome</th></tr></thead><tbody>
            <tr><td>(−1, 1)</td><td>1</td><td>Legendre</td></tr><tr><td>(−1, 1)</td><td>1/√(1 − x²)</td><td>Tschebyscheff</td></tr>
            <tr><td>(−1, 1)</td><td>(1 − x)<sup>α</sup>(1 + x)<sup>β</sup></td><td>Jacobi</td></tr><tr><td>(0, ∞)</td><td>x<sup>α</sup>e<sup>−x</sup></td><td>Laguerre</td></tr>
            <tr><td>(−∞, ∞)</td><td>e<sup>−x²</sup></td><td>Hermite</td></tr></tbody></table>
        </div>
        ${nmTraps([
          "Gauß-Knoten sind nicht äquidistant und enthalten die Intervallenden nicht — summiert lassen sich keine Auswertungen teilen.",
          "Mit s = 3 symmetrisch und c₂ = ½ hat man einen freien Parameter: Ordnung 4 für fast jedes c₁, Ordnung 6 nur für das Gauß-c₁ (SS 20).",
        ])}`,
      check: [
        { q: "Was ist die maximale Ordnung einer QF mit s Knoten?", opts: ["2s", "s", "s + 1", "2s + 1"], why: "Für g = M wäre ∫M² = 0 nötig — unmöglich." },
        { q: "Welche Knoten hat die Gauß-Quadratur?", opts: ["Transformierte Nullstellen des Legendre-Polynoms vom Grad s", "Äquidistante Knoten", "Tschebyscheff-Stützstellen", "Die Intervallenden"], why: "cₖ = ½(1 + γₖ)." },
        { q: "Warum sind die Gewichte der Gauß-Quadratur positiv?", opts: ["bₖ = ∫₀¹ Lₖ² dx > 0, weil Lₖ² Grad 2s − 2 hat", "Weil die Knoten positiv sind", "Weil sie symmetrisch ist", "Weil ∫Lₖ = 1"], why: "Die Formel ist für Lₖ² exakt und Lₖ²(cⱼ) = δₖⱼ (WS 20/21)." },
        { q: "p ≥ s und ∫₀¹ M(x)g(x)dx = 0 für alle g ∈ P₁, aber nicht für x². Ordnung?", opts: ["s + 2", "s + 1", "2s", "s"], why: "Orthogonal zu P_{m−1} mit m = 2, nicht zu Grad m." },
      ],
    },
    {
      id: "5.4", title: "Quadraturfehler und summierte Formeln", short: "Fehler & summiert", about: "Peano-Kern, Fehlerkonstanten, summierte QF, O(hᵖ), Halbieren der Schrittweite",
      html: () => `
        ${nmGist([
          `Für g ∈ C<sup>p</sup> und Ordnung p (Peano): R(g) = ∫₀¹ K<sub>p</sub>(t)g<sup>(p)</sup>(t)dt mit dem Peano-Kern K<sub>p</sub>(t) = ${frac("(1 − t)<sup>p</sup>", "p!")} − Σ b<sub>k</sub>${frac("(c<sub>k</sub> − t)<sub>+</sub><sup>p−1</sup>", "(p − 1)!")}.`,
          `Damit |E(f)| ≤ (b − a)<sup>p+1</sup> max|f<sup>(p)</sup>| ∫₀¹|K<sub>p</sub>|: Mittelpunkt <b>1/24</b>, Trapez <b>1/12</b>, Simpson <b>1/2880</b>.`,
          `<b>Summiert</b> auf N Teilintervallen der Länge h: Gesamtfehler ≤ (b − a) max err<sub>n</sub> = <b>O(h<sup>p</sup>)</b>.`,
        ])}
        <div class="card">
          <h3>Trapezregel genau (SS 26)</h3>
          <p>Die Trapezregel ist interpolatorisch mit der Geraden p durch (0, f(0)), (1, f(1)); das Restglied f − p = ½w₂(x)f″(ξ) mit |w₂(x)| = x(1 − x) gibt</p>
          ${F(`|${ig("0", "1")}f − T(f)| ≤ ½ max|f″| ${ig("0", "1")}x(1 − x)dx = ${frac("1", "12")} max|f″|`)}
          <p>Summiert: Σ<sub>n</sub> ${frac("h<sup>3</sup>", "12")} max|f″| = ${frac("b − a", "12")} h² max|f″|.</p>
          ${F(`T<sub>N</sub>(f) = h[${frac("f(x<sub>0</sub>) + f(x<sub>N</sub>)", "2")} + ${sumOf("N−1", "n=1")} f(x<sub>n</sub>)],  T<sub>2N</sub>(f) = ½T<sub>N</sub>(f) + ${frac("h", "2")} ${sumOf("N", "n=1")} f(${frac("x<sub>n−1</sub> + x<sub>n</sub>", "2")})`)}
          <p>Nur die N Mittelpunkte sind neu; h halbiert sich, der Fehler viertelt sich. Die summierte Simpsonregel (SS 17) teilt sich ebenso die Endpunkte: h/6 [f(x₀) + 4Σf(m<sub>n</sub>) + 2Σ<sub>n&lt;N</sub>f(x<sub>n</sub>) + f(x<sub>N</sub>)] — 2N + 1 Auswertungen.</p>
          ${ppFacts([
            ["Lemma", "∫₀¹ K<sub>p</sub> = (1/p!)(1/(p + 1) − Σ b<sub>k</sub>c<sub>k</sub><sup>p</sup>) ≠ 0. Für viele QF ist ∫|K<sub>p</sub>| = |∫K<sub>p</sub>|."],
            ["Adaptivität", "Die Zerlegung so wählen, dass der Fehler gleich auf die Teilintervalle verteilt ist: wo f stark variiert, kleinere h (SS 19)."],
            ["Tabelle erkennen", "Fehlertabelle (WS 19/20): Faktor 4 je Halbierung → Ordnung 2; Faktor 16 → Simpson; Trapez hat etwa den doppelten Betrag und das andere Vorzeichen des Mittelpunkts."],
            ["Rechteck vs. Trapez", "WS 24/25: summiert kosten beide etwa N Auswertungen, aber Trapez hat Ordnung 2 statt 1 — also Trapez."],
          ])}
        </div>
        ${pw("sumq", pseg("fn", Object.entries(NM_Q_FNS).map(([k, v]) => [k, v.name]), "exp"), { wide: true })}
        <p class="small muted">Für eˣ auf [0, 5] ist das die Tabelle aus WS 19/20.</p>
        ${nmTraps([
          "Der Fehler einer einzelnen QF auf einem Teilintervall ist O(h<sup>p+1</sup>), summiert über N = (b − a)/h Stücke O(h<sup>p</sup>).",
          "Der Peano-Kern braucht g ∈ C<sup>p</sup>. Für nicht glatte f (wie |x| oder Spitzen) bringt hohe Ordnung wenig.",
        ])}`,
      setup: (root) => nmWSummed(root),
      check: [
        { q: "Fehlerschranke der Trapezregel auf [a, b]?", opts: ["(b − a)³/12 · max|f″|", "(b − a)³/24 · max|f″|", "(b − a)⁵/2880 · max|f⁽⁴⁾|", "(b − a)²/12 · max|f′|"], why: "p = 2, ∫|K₂| = 1/12." },
        { q: "Die Schrittweite der summierten Simpsonregel wird halbiert. Um welchen Faktor fällt der Fehler etwa?", opts: ["16", "4", "2", "8"], why: "O(h⁴): (½)⁴ = 1/16." },
        { q: "T_N(f) ist bekannt. Wie viele neue Auswertungen braucht T₂N(f)?", opts: ["N (die Mittelpunkte)", "2N + 1", "N + 1", "keine"], why: "T₂N = ½T_N + (h/2) Σ f(Mittelpunkte) (SS 26)." },
        { q: "Welche Größenordnung hat der Fehler einer summierten QF der Ordnung p?", opts: ["O(hᵖ)", "O(hᵖ⁺¹)", "O(h)", "O(1/N)"], why: "Pro Teilintervall h^{p+1}, mal N ≈ 1/h Teilintervalle." },
      ],
    },
  ],
});
