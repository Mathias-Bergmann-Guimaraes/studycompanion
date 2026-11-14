// NuMa chapters 6 and 7, from the Skript and the lectures VL12–VL13 (Kapitel 6: Vektoriteration,
// spektrale Bisektion, QR-Algorithmus) and VL14 (Kapitel 7: lineare Iterationen und cg). The
// drawings: the power method and inverse iteration with a shift in the plane, spectral bisection of
// a small graph, the QR algorithm on the lecture's 6 × 6 matrix with and without shift, Jacobi and
// Gauß-Seidel as paths between two lines, cg against steepest descent on the level sets of Φ, the
// CRS format and fill-in.

/* ================================================================ Kapitel 6 */

/* ---------------------------------------------------------------- 6.1 Vektoriteration */

function nmWPower(root) {
  const { w, fig, read } = ppW(root, "pow");
  const st = { l1: 3, l2: 2, mode: "pow", mu: 15, ang: 80 };
  const draw = () => {
    const th = Math.PI / 6, c = Math.cos(th), s = Math.sin(th), l1 = st.l1, l2 = st.l2 / 1, mu = st.mu / 10;
    lenOut(w, "l1", nmD(l1, 1)); lenOut(w, "l2", nmD(l2, 1)); lenOut(w, "mu", nmD(mu, 1)); lenOut(w, "ang", `${st.ang}°`);
    const v1 = [c, s], v2 = [-s, c];
    const A = [[l1 * c * c + l2 * s * s, (l1 - l2) * c * s], [(l1 - l2) * c * s, l1 * s * s + l2 * c * c]];
    const M = st.mode === "pow" ? A : nmInv(st.mode === "inv" ? A : [[A[0][0] - mu, A[0][1]], [A[1][0], A[1][1] - mu]]);
    const a0 = (st.ang * Math.PI) / 180;
    const ys = [[Math.cos(a0), Math.sin(a0)]];
    for (let k = 0; k < 12 && M && M[0].every(isFinite); k++) { const x = nmMv(M, ys[k]); const n = nmN2(x); if (!n) break; ys.push(x.map((t) => t / n)); }
    // Which eigenvalue it goes for, and how fast.
    const mus = st.mode === "pow" ? [l1, l2] : st.mode === "inv" ? [1 / l1, 1 / l2] : [1 / (l1 - mu), 1 / (l2 - mu)];
    const dom = Math.abs(mus[0]) >= Math.abs(mus[1]) ? 0 : 1, rate = Math.abs(mus[1 - dom]) / Math.abs(mus[dom]);
    const target = dom ? v2 : v1, lam = dom ? l2 : l1;
    const S = 100, C = [150, 140], P = (p) => [C[0] + p[0] * S, C[1] - p[1] * S];
    const axis = (v, cls) => `<line x1="${P(v.map((x) => -1.3 * x))[0]}" y1="${P(v.map((x) => -1.3 * x))[1]}" x2="${P(v.map((x) => 1.3 * x))[0]}" y2="${P(v.map((x) => 1.3 * x))[1]}" class="${cls}"/>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 280" role="img" aria-label="Iterierte der Vektoriteration">
      <circle cx="${C[0]}" cy="${C[1]}" r="${S}" class="guide" fill="none"/>
      ${axis(v1, "nm-eig1")}${axis(v2, "nm-eig2")}
      <text x="${P(v1.map((x) => 1.32 * x))[0]}" y="${P(v1.map((x) => 1.32 * x))[1]}" class="cap">v₁ (λ = ${nmD(l1, 1)})</text>
      <text x="${P(v2.map((x) => 1.25 * x))[0] - 20}" y="${P(v2.map((x) => 1.25 * x))[1]}" class="cap">v₂ (λ = ${nmD(l2, 1)})</text>
      ${ys.slice(0, 9).map((y, k) => { const [x2, y2] = P(y); return `<g style="opacity:${k ? 0.35 + 0.65 * (k / 8) : 1}">${arrowSVG(C[0], C[1], x2, y2, k ? "nm-approx-v" : "nm-piv-v", 2.2, 8)}${k < 4 ? `<text x="${x2 + 5}" y="${y2 + (k % 2 ? 12 : -4)}" class="vec-a nm-approx">${k ? `y${"₀₁₂₃"[k]}` : "y₀"}</text>` : ""}</g>`; }).join("")}</svg>`;
    const rows = ys.slice(0, 8).map((y, k) => {
      const err = Math.min(nmN2([y[0] - target[0], y[1] - target[1]]), nmN2([y[0] + target[0], y[1] + target[1]]));
      return `<tr><td>${k}</td><td>(${nmD(y[0], 4)}; ${nmD(y[1], 4)})</td><td>${nmD(nmDot(y, nmMv(A, y)), 5)}</td><td class="nm-err">${nmSci(err)}</td></tr>`;
    }).join("");
    read.innerHTML = `<table class="len-terms nm-tab"><thead><tr><th>k</th><th>y<sub>k</sub></th><th>y<sub>k</sub>ᵀAy<sub>k</sub></th><th>Abstand zu ±v</th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small">${Math.abs(rate - 1) < 1e-9 ? "<b class='nm-err'>Keine Konvergenz:</b> beide Eigenwerte von M sind betraglich gleich groß." :
        `Konvergiert gegen den EV zu <b>λ = ${nmD(lam, 2)}</b>, mit Rate |${st.mode === "pow" ? "λ₂/λ₁" : st.mode === "inv" ? "λ<sub>min</sub>/λ<sub>2.</sub>" : "(λ − μ)/(λ′ − μ)"}| = <b>${nmD(rate, 3)}</b>${rate > 0.9 ? " — sehr langsam." : rate < 0.2 ? " — schnell." : "."}`}
        ${st.mode === "shift" ? " Der Shift μ wählt den EW, der μ am nächsten liegt." : st.mode === "inv" ? " Invers: der betraglich kleinste EW von A." : ""}</p>`;
  };
  lenWire(w, st, draw);
  $$('[data-seg="mode"] button', w).forEach((b) => b.addEventListener("click", () => ($(".nm-mu", w).hidden = st.mode !== "shift")));
  $(".nm-mu", w).hidden = true;
  draw();
}

/* ---------------------------------------------------------------- 6.2 Spektrale Bisektion */

const NM_GRAPHS = {
  dumb: { name: "Hantel", p: [[0, 0], [1, 0.8], [1, -0.8], [2, 0], [3.5, 0], [4.5, 0.8], [4.5, -0.8], [5.5, 0]], e: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [5, 6], [5, 7], [6, 7]] },
  grid: { name: "Gitter 2 × 4", p: [[0, 0.6], [1.5, 0.6], [3, 0.6], [4.5, 0.6], [0, -0.6], [1.5, -0.6], [3, -0.6], [4.5, -0.6]], e: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [0, 4], [1, 5], [2, 6], [3, 7]] },
  ring: { name: "Ring", p: Array.from({ length: 8 }, (_, i) => [2.75 + 2 * Math.cos((i * Math.PI) / 4), Math.sin((i * Math.PI) / 4) * 1.1]), e: Array.from({ length: 8 }, (_, i) => [i, (i + 1) % 8]) },
};
function nmWFiedler(root) {
  const { w, fig, read } = ppW(root, "fied");
  const st = { g: "dumb" };
  const draw = () => {
    const G = NM_GRAPHS[st.g], N = G.p.length, A = Array.from({ length: N }, () => Array(N).fill(0));
    G.e.forEach(([a, b]) => { A[a][b] = A[b][a] = -1; A[a][a]++; A[b][b]++; });
    const { vals, vecs } = nmEigSym(A);
    const lam = vals[N - 2], f = vecs[N - 2], med = [...f].sort((a, b) => a - b), m = (med[N / 2 - 1] + med[N / 2]) / 2;
    const side = f.map((x) => (x < m ? -1 : 1)), cut = G.e.filter(([a, b]) => side[a] !== side[b]).length;
    const X = (x) => 40 + x * 76, Y = (y) => 110 - y * 70;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 500 220" role="img" aria-label="Graph mit spektraler Bisektion">
      ${G.e.map(([a, b]) => `<line x1="${X(G.p[a][0])}" y1="${Y(G.p[a][1])}" x2="${X(G.p[b][0])}" y2="${Y(G.p[b][1])}" class="${side[a] !== side[b] ? "nm-cut" : "nm-edge"}"/>`).join("")}
      ${G.p.map(([x, y], i) => `<circle cx="${X(x)}" cy="${Y(y)}" r="15" class="${side[i] < 0 ? "nm-vminus" : "nm-vplus"}"/><text x="${X(x)}" y="${Y(y) + 5}" text-anchor="middle" class="nm-vt">${nmD(f[i], 2)}</text>`).join("")}</svg>
      <div class="lf small-f nm-center">A = ${mx(A.map((r) => r.map((x) => (x ? nmD(x) : `<span class="muted">0</span>`))))}</div>`;
    read.innerHTML = `<div class="lw-vals"><span>kleinster EW</span><b>${nmD(Math.abs(vals[N - 1]) < 1e-12 ? 0 : vals[N - 1], 3)} (EV e = (1, …, 1))</b><span>kleinster positiver EW</span><b>${nmD(lam, 4)}</b><span>geschnittene Kanten</span><b class="nm-err">${cut}</b></div>
      <p class="small">In den Knoten steht der Eigenvektor w zum kleinsten positiven EW. Knoten mit w<sub>n</sub> unter dem Median kommen in V<sup>−</sup> (blau), die anderen in V<sup>+</sup> (grün) — gleich viele, und die rot gestrichelten Kanten sind der Schnitt.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 6.3 QR-Algorithmus */

const NM_QRA_B = [[0, 0, 0.5, 0.5, 0, 0], [0.25, 0, 0, 0, 0, 0.5], [0.25, 1 / 3, 0, 0.5, 0, 0], [0.25, 1 / 3, 0, 0, 0, 0.5], [0.25, 1 / 3, 0, 0, 0, 0], [0, 0, 0.5, 0, 1, 0]];
// Hessenberg form by N − 2 Householder similarity transformations (tridiagonal for symmetric A).
function nmHessenberg(A0) {
  const N = A0.length, H = A0.map((r) => [...r]);
  for (let k = 0; k < N - 2; k++) {
    const x = H.slice(k + 1).map((r) => r[k]), nx = nmN2(x);
    if (nx < 1e-14) continue;
    const sigma = x[0] > 0 ? -nx : nx, v = [...x]; v[0] -= sigma;
    const nv = nmN2(v); if (nv < 1e-14) continue;
    const u = v.map((t) => t / nv);
    for (let j = 0; j < N; j++) { const d = u.reduce((s, ui, i) => s + ui * H[k + 1 + i][j], 0); u.forEach((ui, i) => (H[k + 1 + i][j] -= 2 * d * ui)); }
    for (let i = 0; i < N; i++) { const d = u.reduce((s, uj, j) => s + H[i][k + 1 + j] * uj, 0); u.forEach((uj, j) => (H[i][k + 1 + j] -= 2 * d * uj)); }
  }
  return H;
}
function nmQRRun(shift, steps = 60) {
  const A = nmMul(NM_QRA_B, nmT(NM_QRA_B)).map((r) => r.map((x) => 10 * x));
  let H = nmHessenberg(A), m = H.length;
  const snaps = [H.map((r) => [...r])], found = [];
  for (let k = 0; k < steps && m > 1; k++) {
    const mu = shift ? H[m - 1][m - 1] : 0, Hm = H.slice(0, m).map((r) => r.slice(0, m).map((x, j) => x));
    for (let i = 0; i < m; i++) Hm[i][i] -= mu;
    const { Q, R } = nmQR(Hm), RQ = nmMul(R, Q);
    for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) H[i][j] = RQ[i][j] + (i === j ? mu : 0);
    if (shift && Math.abs(H[m - 1][m - 2]) <= 1e-12 * (Math.abs(H[m - 1][m - 1]) + Math.abs(H[m - 2][m - 2]))) { found.push({ k: k + 1, lam: H[m - 1][m - 1] }); H[m - 1][m - 2] = H[m - 2][m - 1] = 0; m--; if (m === 1) found.push({ k: k + 1, lam: H[0][0] }); }
    snaps.push(H.map((r) => [...r]));
  }
  return { snaps, found };
}
function nmWQRAlg(root) {
  const { w, fig, read } = ppW(root, "qra");
  const st = { shift: 0, k: 0 };
  const runs = [nmQRRun(false, 60), nmQRRun(true, 60)];
  const draw = () => {
    const run = runs[st.shift], K = run.snaps.length - 1;
    const sl = $('input[data-k="k"]', w);
    sl.max = K;
    if (st.k > K) st.k = K;
    lenOut(w, "k", st.k);
    const H = run.snaps[st.k], N = H.length;
    const cell = (x) => { const a = Math.abs(x); const l = a < 1e-14 ? 0 : Math.max(0, Math.min(1, (Math.log10(a) + 14) / 15)); return `<span class="nm-heat" style="--a:${l}" title="${nmSci(x)}">${a > 1e-3 ? nmD(x, 2) : a > 1e-14 ? "·" : ""}</span>`; };
    const sub = run.snaps.map((S) => Array.from({ length: N - 1 }, (_, i) => Math.abs(S[i + 1][i])));
    const P = nmFrame(320, 200, [0, K], [-16, 1.5]);
    fig.innerHTML = `<div class="nm-qra"><div class="nm-heatgrid" style="--n:${N}">${H.map((r) => r.map(cell).join("")).join("")}</div>
      <svg class="lw-svg" viewBox="0 0 320 200" role="img" aria-label="Nebendiagonale über die Iterationen">
      ${P.axes({ xl: "k", yl: "log₁₀ |hₙ₊₁,ₙ|", yt: [-15, -10, -5, 0] })}
      ${Array.from({ length: N - 1 }, (_, i) => `<polyline points="${sub.map((s, k) => `${P.X(k).toFixed(1)},${P.Y(Math.log10(Math.max(s[i], 1e-16))).toFixed(1)}`).join(" ")}" class="curve" style="color:hsl(${190 + i * 34} 70% 50%);stroke-width:2"/>`).join("")}
      <line x1="${P.X(st.k)}" y1="12" x2="${P.X(st.k)}" y2="174" class="guide"/></svg></div>`;
    const ev = [...nmEigSym(nmMul(NM_QRA_B, nmT(NM_QRA_B)).map((r) => r.map((x) => 10 * x))).vals];
    read.innerHTML = `<p class="small">${st.k === 0 ? "Start: A wurde auf <b>Tridiagonalform</b> gebracht (symmetrisch: Hessenberg = tridiagonal). Die Heatmap zeigt |h<sub>ij</sub>| — je dunkler, desto größer." :
      st.shift ? `Mit Shift μ<sub>k</sub> = h<sub>NN</sub>: ${run.found.filter((x) => x.k <= st.k).length} Eigenwerte nach ${st.k} Schritten abgespalten (deflationiert).` : `Ohne Shift: die Nebendiagonale fällt nur linear, mit dem Faktor |λ<sub>n+1</sub>/λ<sub>n</sub>| (0,66; 0,64; 0,41; 0,20; 0,30).`}</p>
      ${st.shift ? `<p class="small">${run.found.map((x) => `λ ≈ ${nmD(x.lam, 6)} nach k = ${x.k}`).join(" · ")}</p>` : `<p class="small">Diagonale: ${H.map((r, i) => nmD(r[i], 3)).join(" · ")}<br><span class="muted">Eigenwerte: ${ev.map((x) => nmD(x, 3)).join(" · ")}</span></p>`}`;
  };
  lenWire(w, st, draw);
  $$('[data-seg="shift"] button', w).forEach((b) => b.addEventListener("click", () => { st.k = 0; $('input[data-k="k"]', w).value = 0; draw(); }));
  draw();
}

NUMA_CHAPTERS.push({
  n: 6, vl: "VL12–VL13", title: "Eigenwertprobleme", next: "Iterative Verfahren für LGS",
  headline: "Eigen<span class=\"accent\">werte</span>",
  intro: "Av = λv numerisch lösen, ohne das charakteristische Polynom anzufassen (dessen Nullstellen schlecht konditioniert von den Koeffizienten abhängen). Für einen Eigenwert die Vektoriteration — mit Inversion und Shift für jeden beliebigen —, für alle der QR-Algorithmus.",
  sections: [
    {
      id: "6.1", title: "Vektoriteration und inverse Vektoriteration", short: "Vektoriteration", about: "Power method, Konvergenzrate |λ₂/λ₁|, invers, mit Shift, Kondition des LGS",
      html: () => `
        ${nmGist([
          `<b>Vektoriteration</b>: y<sub>k</sub> = x<sub>k</sub>/‖x<sub>k</sub>‖, x<sub>k+1</sub> = Ay<sub>k</sub>. Für symmetrisches A mit |λ₁| &gt; |λ₂| ≥ ⋯ und x₀ᵀv₁ ≠ 0 konvergiert y<sub>k</sub> gegen den normierten EV v₁ (bis auf das Vorzeichen); λ₁ = v₁ᵀAv₁.`,
          `Die Konvergenzrate ist <b>|λ₂|/|λ₁|</b>.`,
          `<b>Inverse Iteration mit Shift</b>: löse (A − λ*I)x<sub>k+1</sub> = y<sub>k</sub> — sie findet den EW, der λ* am nächsten liegt.`,
        ])}
        <div class="card">
          <h3>Warum es funktioniert</h3>
          <p>Zerlege x = μ₁v₁ + ⋯ + μ<sub>N</sub>v<sub>N</sub> in Eigenvektoren. Dann</p>
          ${F(`A<sup>k</sup>x = λ<sub>1</sub><sup>k</sup>[μ<sub>1</sub>v<sub>1</sub> + (${frac("λ<sub>2</sub>", "λ<sub>1</sub>")})<sup>k</sup>μ<sub>2</sub>v<sub>2</sub> + ⋯ + (${frac("λ<sub>N</sub>", "λ<sub>1</sub>")})<sup>k</sup>μ<sub>N</sub>v<sub>N</sub>]`)}
          <p>Alle Anteile außer v₁ verschwinden wie (λ<sub>n</sub>/λ₁)<sup>k</sup>. Gilt auch für nicht symmetrische A mit halbeinfachen EW, deren betragsgrößter einfach ist (PageRank, Übung 6).</p>
          ${ppFacts([
            ["Spektren", "A − λ*I hat die EW λ<sub>n</sub> − λ*, A⁻¹ hat 1/λ<sub>n</sub> — dieselben Eigenvektoren."],
            ["Shift", "Beispiel der Vorlesung: EW 3, 2, 1, Rate 2/3. A − 1,5 I hat die EW 1,5; 0,5; −0,5: Rate 1/3."],
            ["invers", "Für 0 &lt; |λ₁| &lt; |λ₂| ≤ ⋯: Ax<sub>k+1</sub> = y<sub>k</sub> konvergiert gegen v₁ (kleinster EW). A einmal LR- bzw. Cholesky-zerlegen, dann pro Schritt nur N² (SS 17)."],
            ["Kondition", "cond₂(A − λ*I) = max|λ − λ*|/min|λ − λ*| ist riesig, wenn λ* nah an einem EW liegt — trotzdem kein Problem: gesucht ist nur die Richtung, und die ist gut konditioniert."],
          ])}
        </div>
        ${pw("pow", `${pslider("l1", "λ₁", -4, 4, 0.1, 3)}${pslider("l2", "λ₂", -4, 4, 0.1, 2)}${pslider("ang", "Startvektor", 0, 180, 1, 80)}
          ${pseg("mode", [["pow", "Vektoriteration"], ["inv", "invers"], ["shift", "invers mit Shift"]], "pow")}
          <div class="nm-mu">${pslider("mu", "Shift μ", -40, 40, 1, 15)}</div>`, { wide: true })}
        ${nmTraps([
          "Bei |λ₁| = |λ₂| (z. B. λ und −λ) konvergiert die Vektoriteration nicht.",
          "Der Startvektor muss einen Anteil in Richtung v₁ haben (x₀ᵀv₁ ≠ 0) — durch Rundung fast immer erfüllt.",
          "Inverse Iteration: nie A⁻¹ bilden, sondern das LGS lösen — mit einer Zerlegung, die man für alle Schritte wiederverwendet.",
        ])}`,
      setup: (root) => nmWPower(root),
      check: [
        { q: "A symmetrisch mit EW 4, −3, 1. Wie schnell konvergiert die Vektoriteration?", opts: ["mit Rate 3/4", "mit Rate 1/4", "gar nicht", "quadratisch"], why: "|λ₂|/|λ₁| = 3/4." },
        { q: "Welchen Eigenwert findet die inverse Iteration mit Shift λ*?", opts: ["den, der λ* am nächsten liegt", "den größten", "den kleinsten", "λ* selbst"], why: "Der betragsgrößte EW von (A − λ*I)⁻¹ ist 1/(λ − λ*) mit minimalem |λ − λ*|." },
        { q: "Was muss in jedem Schritt der inversen Vektoriteration getan werden?", opts: ["ein LGS (A − λ*I)x = y lösen", "eine QR-Zerlegung", "A⁻¹ neu berechnen", "das charakteristische Polynom auswerten"], why: "Mit einer Zerlegung von A − λ*I, die nur einmal berechnet wird." },
        { q: "Wie bekommt man aus dem EV v₁ den Eigenwert?", opts: ["λ₁ = v₁ᵀAv₁ (‖v₁‖₂ = 1)", "λ₁ = ‖v₁‖", "λ₁ = det(A)", "λ₁ = v₁ᵀv₁"], why: "Rayleigh-Quotient." },
      ],
    },
    {
      id: "6.2", title: "Spektrale Bisektion", short: "Spektrale Bisektion", about: "Graph halbieren, Laplacematrix, Relaxation, Fiedler-Vektor, (A + eeᵀ)",
      html: () => `
        ${nmGist([
          `Ziel: die Knoten eines ungerichteten zusammenhängenden Graphen in zwei <b>gleich große</b> Mengen V<sup>+</sup>, V<sup>−</sup> teilen, so dass <b>möglichst wenige Kanten</b> zwischen ihnen verlaufen.`,
          `Das ganzzahlige Problem ist zu schwer. <b>Relaxiert</b>: berechne den EV w zum <b>kleinsten positiven EW</b> der Laplacematrix und teile am Median von w.`,
          `Numerisch: inverse Vektoriteration auf A + eeᵀ, mit x₀ ⊥ e.`,
        ])}
        <div class="card">
          <h3>Laplacematrix</h3>
          ${F(`a<sub>nn</sub> = Grad von v<sub>n</sub>,  a<sub>nm</sub> = −1, falls {v<sub>n</sub>, v<sub>m</sub>} ∈ Γ, sonst 0`)}
          <p>A ist symmetrisch (der Graph ist ungerichtet), positiv semidefinit, und Ae = 0: der kleinste EW ist 0 mit EV e = (1, …, 1). Deshalb kann man die inverse Iteration nicht direkt auf A anwenden — A ist <b>singulär</b>.</p>
          <h3>Der Trick</h3>
          <ol class="nm-ol">
            <li>Wähle x₀ mit eᵀx₀ = 0, k = 0.</li>
            <li>Normiere y<sub>k</sub> = x<sub>k</sub>/‖x<sub>k</sub>‖₂.</li>
            <li>Löse (A + eeᵀ)x<sub>k+1</sub> = y<sub>k</sub>, k um 1 erhöhen, weiter mit 2.</li>
          </ol>
          <p>Mit eᵀx₀ = 0 bleibt eᵀx<sub>k</sub> = 0, und gesucht ist auch ein Vektor ⊥ e. A + eeᵀ ist <b>spd</b>: Cholesky möglich — oder bei großem, dünn besetztem A in jedem Schritt das cg-Verfahren (${nmSee("7.2")}), dessen Hauptaufwand eine Matrix-Vektor-Multiplikation ist (Lückentext SS 22).</p>
        </div>
        ${pw("fied", pseg("g", Object.entries(NM_GRAPHS).map(([k, v]) => [k, v.name]), "dumb"), { wide: true })}
        ${nmTraps([
          "Gesucht ist der kleinste <b>positive</b> EW — der kleinste ist 0.",
          "Der Median sorgt für |V<sup>+</sup>| = |V<sup>−</sup>|; das Vorzeichen allein würde das nicht garantieren.",
        ])}`,
      setup: (root) => nmWFiedler(root),
      check: [
        { q: "Was ist der kleinste Eigenwert der Laplacematrix eines Graphen?", opts: ["0, mit EV e = (1, …, 1)", "1", "der kleinste Knotengrad", "negativ"], why: "Jede Zeilensumme ist 0, also Ae = 0." },
        { q: "Warum wendet man die inverse Iteration auf A + eeᵀ statt auf A an?", opts: ["A ist singulär, A + eeᵀ ist spd", "A ist nicht symmetrisch", "A + eeᵀ hat weniger Nicht-Nullen", "Das ist schneller"], why: "Mit x ⊥ e ändert eeᵀ nichts an der Iteration, macht die Matrix aber regulär." },
        { q: "Welcher Eigenvektor teilt den Graphen?", opts: ["der zum kleinsten positiven EW", "der zum größten EW", "e", "der zum EW 0"], why: "Der Fiedler-Vektor der Relaxation." },
        { q: "Wie wird aus w die Zerlegung?", opts: ["V⁻ = {vₙ : wₙ < Median von w}", "nach dem Vorzeichen von wₙ", "nach dem Knotengrad", "zufällig"], why: "Der Median teilt in zwei gleich große Mengen." },
      ],
    },
    {
      id: "6.3", title: "QR-Algorithmus", short: "QR-Algorithmus", about: "Aₖ = QₖRₖ, Aₖ₊₁ = RₖQₖ, Hessenbergform, Shift hₙₙ, Deflation, Konvergenz",
      html: () => `
        ${nmGist([
          `<b>Naiv</b>: A₀ = A, zerlege A<sub>k</sub> = Q<sub>k</sub>R<sub>k</sub>, setze A<sub>k+1</sub> = R<sub>k</sub>Q<sub>k</sub> = Q<sub>k</sub>ᵀA<sub>k</sub>Q<sub>k</sub> — ähnlich, also dieselben EW; A<sub>k</sub> wird (fast) obere Dreiecksmatrix.`,
          `Erst auf <b>Hessenbergform</b> H = QᵀAQ bringen (N − 2 Householder-Spiegelungen, 5N³/3): sie bleibt erhalten, und ein Schritt kostet nur O(N²) — symmetrisch tridiagonal O(N).`,
          `<b>Shift</b> μ<sub>k</sub> = h<sub>NN</sub>: H<sub>k</sub> − μ<sub>k</sub>I = Q<sub>k</sub>R<sub>k</sub>, H<sub>k+1</sub> = R<sub>k</sub>Q<sub>k</sub> + μ<sub>k</sub>I — quadratische Konvergenz, symmetrisch kubisch.`,
        ])}
        <div class="card">
          <h3>Hessenbergform</h3>
          <p>Der erste Householder-Vektor w₂ = (0, w̃₂) lässt die erste Zeile stehen und spiegelt (a₂₁, …, a<sub>N1</sub>) auf ein Vielfaches von e₁ ∈ ℝ<sup>N−1</sup>. Von rechts multipliziert ändert Q₂ die erste Spalte nicht — die Nullen bleiben. Ist A symmetrisch, ist H tridiagonal.</p>
          <p><b>3 × 3</b> (WS 24/25, SS 22): nur eine Spiegelung Q = diag(1, Q̃) mit 2 × 2-Householder Q̃, die (a₂₁, a₃₁) auf (σ, 0) spiegelt. Für (−4, 3): σ = 5, und Q̃ = ${mx([["−⅘", "⅗"], ["⅗", "⅘"]])}.</p>
          <h3>Ein Schritt auf einer Hessenbergmatrix</h3>
          <p>Die QR-Zerlegung braucht nur N − 1 Spiegelungen mit je zwei Nicht-Null-Komponenten (w<sub>n</sub> = (0, …, ∗, ∗, 0, …)), und RQ ist wieder Hessenberg. Zerfällt H (ein h<sub>n+1,n</sub> = 0), behandelt man die Blöcke getrennt — o. E. ist H irreduzibel.</p>
          <h3>Shift und Deflation</h3>
          <p>Ist μ ein EW einer irreduziblen Hessenbergmatrix H und H − μI = QR, dann hat H̄ = RQ + μI die letzte Zeile (0, …, 0, μ): h̄<sub>N,N−1</sub> = 0, die Matrix zerfällt nach einem Schritt. Mit μ<sub>k</sub> = h<sub>NN</sub> und |h<sub>N,N−1</sub>| = δ klein wird h̄<sub>N,N−1</sub> = O(δ²) (quadratisch; symmetrisch O(δ³)). Ist |h<sub>N,N−1</sub>| ≤ ε(|h<sub>NN</sub>| + |h<sub>N−1,N−1</sub>|), wird h<sub>NN</sub> als EW akzeptiert und mit dem (N − 1) × (N − 1)-Block weitergemacht.</p>
        </div>
        ${pw("qra", `${pseg("shift", [[0, "ohne Shift"], [1, "mit Shift h<sub>NN</sub>"]], 0)}${pslider("k", "Schritt k", 0, 60, 1, 0)}`, { wide: true })}
        <p class="small muted">Das Beispiel der Vorlesung: A = 10 BBᵀ mit der 6 × 6-Matrix B aus dem PageRank-Beispiel (Übung 6); EW ≈ 13,33; 8,85; 5,69; 2,34; 0,478; 0,145.</p>
        ${nmTraps([
          "Naive Schritte kosten O(N³) pro Schritt — deshalb zuerst Hessenberg.",
          "Quadratische Konvergenz heißt: die Zahl richtiger Nachkommastellen von μ verdoppelt sich ungefähr pro Schritt (Lückentext WS 20/21).",
          "Lückentext: N − 2 Householder-Transformationen, 5N³/3 Operationen, symmetrisch → symmetrische Tridiagonalmatrix, (e<sub>N</sub>)ᵀH̄ = μe<sub>N</sub>ᵀ.",
        ])}`,
      setup: (root) => nmWQRAlg(root),
      check: [
        { q: "Warum haben Aₖ und Aₖ₊₁ = RₖQₖ dieselben Eigenwerte?", opts: ["Aₖ₊₁ = QₖᵀAₖQₖ ist ähnlich zu Aₖ", "Weil Rₖ eine Dreiecksmatrix ist", "Weil det(Qₖ) = 1", "Das stimmt nur mit Shift"], why: "Rₖ = QₖᵀAₖ, also RₖQₖ = QₖᵀAₖQₖ." },
        { q: "Wie viele Householder-Transformationen bringen A ∈ ℝᴺˣᴺ auf Hessenbergform?", opts: ["N − 2", "N − 1", "N", "N²"], why: "Spalten 1 bis N − 2; die vorletzte Spalte hat unter der Nebendiagonale nichts mehr." },
        { q: "Was kostet ein QR-Schritt für eine symmetrische Tridiagonalmatrix?", opts: ["O(N)", "O(N²)", "O(N³)", "O(1)"], why: "N − 1 kleine Spiegelungen mit konstantem Aufwand (6 Operationen)." },
        { q: "μ ist ein Eigenwert der irreduziblen Hessenbergmatrix H. Was gilt nach einem Schritt mit Shift μ?", opts: ["h̄_{N,N−1} = 0 und h̄_{NN} = μ", "H̄ = H", "H̄ ist diagonal", "h̄₁₁ = μ"], why: "Die Matrix zerfällt sofort; μ kann abgespalten werden." },
      ],
    },
  ],
});

/* ================================================================ Kapitel 7 */

/* ---------------------------------------------------------------- 7.1 Jacobi und Gauß-Seidel */

const NM_IT_SYS = {
  dd: { name: "diagonaldominant", A: [[4, 1], [1, 3]], b: [1, 2] },
  weak: { name: "knapp", A: [[2, 1.7], [1.5, 2]], b: [2, 1] },
  div: { name: "divergent", A: [[1, 2], [2, 1]], b: [1, 1] },
};
const nmRho2 = (M) => { const t = M[0][0] + M[1][1], d = M[0][0] * M[1][1] - M[0][1] * M[1][0], disc = t * t / 4 - d; return disc >= 0 ? Math.max(Math.abs(t / 2 + Math.sqrt(disc)), Math.abs(t / 2 - Math.sqrt(disc))) : Math.sqrt(d); };
function nmWIter(root) {
  const { w, fig, read } = ppW(root, "jgs");
  const st = { sys: "dd", m: "jac" };
  const draw = () => {
    const { A, b } = NM_IT_SYS[st.sys], xs = nmSolve(A, b);
    const B = st.m === "jac" ? [[A[0][0], 0], [0, A[1][1]]] : [[A[0][0], 0], [A[1][0], A[1][1]]];
    const Bi = nmInv(B), M = nmMul(Bi, A).map((r, i) => r.map((x, j) => (i === j ? 1 : 0) - x)), rho = nmRho2(M);
    const pts = [[-1.2, 2.3]], path = [pts[0]];
    for (let k = 0; k < 14; k++) {
      const x = pts[k];
      if (st.m === "jac") pts.push([(b[0] - A[0][1] * x[1]) / A[0][0], (b[1] - A[1][0] * x[0]) / A[1][1]]);
      else { const x0 = (b[0] - A[0][1] * x[1]) / A[0][0]; path.push([x0, x[1]]); pts.push([x0, (b[1] - A[1][0] * x0) / A[1][1]]); }
      path.push(pts[k + 1]);
      if (nmN2(pts[k + 1]) > 50) break;
    }
    const P = nmFrame(400, 300, [-2.5, 3], [-2, 3]);
    const line = (a, c) => { const y = (t) => (c - a[0] * t) / a[1]; return `<line x1="${P.X(-2.5)}" y1="${P.Y(y(-2.5))}" x2="${P.X(3)}" y2="${P.Y(y(3))}" class="nm-line"/>`; };
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 400 300" role="img" aria-label="Iterationspfad">
      <defs><clipPath id="nmItClip"><rect x="34" y="12" width="354" height="262"/></clipPath></defs>
      ${P.axes({ xl: "x₁", yl: "x₂" })}<g clip-path="url(#nmItClip)">${line(A[0], b[0])}${line(A[1], b[1])}
      <polyline points="${path.map((p) => `${P.X(p[0]).toFixed(1)},${P.Y(p[1]).toFixed(1)}`).join(" ")}" class="curve nm-approx-c" style="stroke-width:2"/>
      ${pts.map((p) => `<circle cx="${P.X(p[0])}" cy="${P.Y(p[1])}" r="3.5" class="pt nm-approx-pt"/>`).join("")}</g>
      <circle cx="${P.X(xs[0])}" cy="${P.Y(xs[1])}" r="6" class="pt nm-exact-pt"/></svg>`;
    const dd = A.every((r, i) => Math.abs(r[i]) > r.reduce((s, x, j) => s + (i === j ? 0 : Math.abs(x)), 0));
    read.innerHTML = `${F(`A = ${mx(A.map((r) => r.map((x) => nmD(x))))},  B = ${mx(B.map((r) => r.map((x) => nmD(x))))},  I − B<sup>−1</sup>A = ${mx(M.map((r) => r.map((x) => nmD(x, 3))))}`, "small-f")}
      <div class="lw-vals"><span>ρ(I − B⁻¹A)</span><b class="${rho < 1 ? "" : "nm-err"}">${nmD(rho, 3)}</b><span>strikt diagonaldominant</span><b>${dd ? "ja" : "nein"}</b>
        <span>Fehler nach 10 Schritten</span><b class="nm-err">${pts[10] ? nmSci(nmN2([pts[10][0] - xs[0], pts[10][1] - xs[1]])) : "—"}</b></div>
      <p class="small">${st.m === "jac" ? "Jacobi rechnet beide Komponenten aus dem alten x<sub>k</sub> — parallelisierbar." : "Gauß-Seidel benutzt die neue erste Komponente sofort: eine Treppe aus waagerechten und senkrechten Schritten."}
        ${rho < 1 ? ` Der Fehler fällt pro Schritt etwa um den Faktor ${nmD(rho, 2)}.` : " ρ ≥ 1: die Iteration läuft weg."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 7.2 cg */

function nmWCG(root) {
  const { w, fig, read } = ppW(root, "cg");
  const st = { kap: 8, start: 0 };
  const draw = () => {
    const kap = st.kap, th = 0.5, c = Math.cos(th), s = Math.sin(th), l = [1, kap];
    lenOut(w, "kap", kap);
    const A = [[l[0] * c * c + l[1] * s * s, (l[0] - l[1]) * c * s], [(l[0] - l[1]) * c * s, l[0] * s * s + l[1] * c * c]];
    const xs = [1, 0.5], b = nmMv(A, xs), x0 = [[-2.2, 2], [2.5, 2.2], [-2, -1.5]][st.start];
    const run = (cg) => {
      let x = [...x0], r = b.map((v, i) => v - nmMv(A, x)[i]), d = [...r];
      const out = [[...x]];
      for (let k = 0; k < (cg ? 2 : 25); k++) {
        const Ad = nmMv(A, d), dAd = nmDot(d, Ad);
        if (dAd < 1e-14 || nmN2(r) < 1e-12) break;
        const al = nmDot(r, r) / dAd;
        x = x.map((v, i) => v + al * d[i]);
        const rn = r.map((v, i) => v - al * Ad[i]);
        const be = cg ? nmDot(rn, rn) / nmDot(r, r) : 0;
        d = rn.map((v, i) => v + be * d[i]);
        r = rn;
        out.push([...x]);
      }
      return out;
    };
    const sd = run(false), cgp = run(true);
    const P = nmFrame(400, 300, [-3, 3.5], [-2.5, 3]);
    const ell = (lev) => { let d = ""; for (let i = 0; i <= 80; i++) { const t = (i / 80) * 2 * Math.PI, u = [Math.cos(t) * Math.sqrt(lev / l[0]), Math.sin(t) * Math.sqrt(lev / l[1])]; const p = [xs[0] + c * u[0] - s * u[1], xs[1] + s * u[0] + c * u[1]]; d += `${i ? "L" : "M"}${P.X(p[0]).toFixed(1)},${P.Y(p[1]).toFixed(1)}`; } return d + "Z"; };
    const e0 = nmDot(x0.map((v, i) => v - xs[i]), nmMv(A, x0.map((v, i) => v - xs[i])));
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 400 300" role="img" aria-label="Höhenlinien von Φ mit cg und Gradientenverfahren">
      <defs><clipPath id="nmCgClip"><rect x="34" y="12" width="354" height="262"/></clipPath></defs>
      ${P.axes({ xl: "x₁", yl: "x₂" })}<g clip-path="url(#nmCgClip)">
      ${[0.02, 0.08, 0.2, 0.4, 0.7, 1].map((f) => `<path d="${ell(f * e0)}" class="nm-level"/>`).join("")}
      <polyline points="${sd.map((p) => `${P.X(p[0]).toFixed(1)},${P.Y(p[1]).toFixed(1)}`).join(" ")}" class="curve nm-err-c" style="stroke-width:1.8"/>
      <polyline points="${cgp.map((p) => `${P.X(p[0]).toFixed(1)},${P.Y(p[1]).toFixed(1)}`).join(" ")}" class="curve nm-approx-c" style="stroke-width:3"/>
      ${cgp.map((p) => `<circle cx="${P.X(p[0])}" cy="${P.Y(p[1])}" r="4.5" class="pt nm-approx-pt"/>`).join("")}</g>
      <circle cx="${P.X(xs[0])}" cy="${P.Y(xs[1])}" r="6" class="pt nm-exact-pt"/></svg>`;
    const q = (Math.sqrt(kap) - 1) / (Math.sqrt(kap) + 1);
    read.innerHTML = `<div class="lw-vals"><span>κ = cond₂(A)</span><b>${kap}</b><span>cg: Schritte bis exakt</span><b class="nm-approx">${cgp.length - 1}</b>
      <span>steilster Abstieg: Schritte (bis 25)</span><b class="nm-err">${sd.length - 1}</b><span>Faktor (√κ − 1)/(√κ + 1)</span><b>${nmD(q, 3)}</b></div>
      <p class="small">Die Ellipsen sind Höhenlinien von Φ (Φ(x) − Φ(x*) = ½‖x − x*‖<sub>A</sub>²). <span class="nm-err">Rot</span>: immer in Richtung des Residuums — Zickzack, je länglicher die Ellipsen, desto schlimmer. <span class="nm-approx">Blau</span>: cg wählt d₁ A-orthogonal zu d₀ und ist im ℝ² nach <b>zwei</b> Schritten exakt.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 7.3 Dünn besetzte Matrizen */

function nmWCRS(root) {
  const { w, fig, read } = ppW(root, "crs");
  const st = { row: 1 };
  const A = [[1.1, 3, 0, 0], [0, 4, 6, 7], [0, 0, 0, 0], [2, 5, 0, 8]];
  const v = [], c = [], p = [0];
  A.forEach((r) => { r.forEach((x, j) => { if (x) { v.push(x); c.push(j + 1); } }); p.push(v.length); });
  const draw = () => {
    const r = st.row, lo = p[r], hi = p[r + 1];
    fig.innerHTML = `<div class="lf small-f nm-center">A = ${mx(A.map((row, i) => row.map((x) => (x ? nmD(x) : `<span class="muted">0</span>`))), { hl: Object.fromEntries(A[r].map((x, j) => [r + "," + j, x ? "nm-piv" : "nm-cand"])) })}</div>
      <div class="nm-crs">${[["v", v.map((x) => nmD(x))], ["c", c], ["p", p]].map(([n, xs]) => `<div><b>${n} =</b> ${xs.map((x, k) => `<span class="${(n !== "p" && k >= lo && k < hi) || (n === "p" && (k === r || k === r + 1)) ? "nm-piv-cell" : ""}">${x}</span>`).join("")}</div>`).join("")}</div>`;
    read.innerHTML = `<p class="small">Zeile ${r + 1}: p<sub>${r + 1}</sub> = ${lo} bis p<sub>${r + 2}</sub> = ${hi} — also ${hi - lo} Nicht-Null${hi - lo === 1 ? "" : "en"}${hi > lo ? `, die Werte v[${lo + 1}…${hi}] in den Spalten ${c.slice(lo, hi).join(", ")}` : " (leere Zeile)"}.</p>
      ${pycode(`
        def crs_matvec(v, c, p, x):     # A im CRS-Format, c 1-basiert wie oben
            M = len(p) - 1
            y = np.zeros(M)
            for n in range(M):
                for k in range(p[n], p[n+1]):
                    y[n] += v[k] * x[c[k] - 1]
            return y`, { title: "Ax mit genau K Operationen" })}`;
  };
  $$("[data-row]", w).forEach((b) => (b.onclick = () => { st.row = +b.dataset.row; lenSetSeg($('[data-seg="row"]', w), st.row); draw(); }));
  lenWire(w, st, draw);
  draw();
}
// Fill-in: LR without pivoting of an arrow matrix, arrow at the top-left or at the bottom-right.
function nmWFill(root) {
  const { w, fig, read } = ppW(root, "fill");
  const st = { arrow: 0 };
  const draw = () => {
    const N = 7, A = Array.from({ length: N }, (_, i) => Array.from({ length: N }, (_, j) => (i === j ? 10 : 0)));
    for (let k = 1; k < N; k++) { const a = st.arrow ? N - 1 : 0, i = st.arrow ? k - 1 : k; A[a][i] = A[i][a] = 1; }
    const M = A.map((r) => [...r]);
    for (let k = 0; k < N - 1; k++) for (let i = k + 1; i < N; i++) { const l = M[i][k] / M[k][k]; for (let j = k; j < N; j++) M[i][j] -= l * M[k][j]; M[i][k] = l; }
    const nzA = A.flat().filter((x) => x).length, nzM = M.flat().filter((x) => Math.abs(x) > 1e-14).length;
    const grid = (X, cls) => `<div class="nm-spy" style="--n:${N}">${X.map((r, i) => r.map((x, j) => `<span class="${Math.abs(x) > 1e-14 ? (A[i][j] ? "on" : cls) : ""}"></span>`).join("")).join("")}</div>`;
    fig.innerHTML = `<div class="nm-spies"><div>${grid(A, "on")}<span class="small muted">A · ${nzA} Nicht-Nullen</span></div><div>${grid(M, "fill")}<span class="small muted">L und R · ${nzM} Nicht-Nullen</span></div></div>`;
    read.innerHTML = `<p class="small">${st.arrow ? "Pfeil unten rechts: die Elimination berührt nur die letzte Zeile — <b>kein Fill-in</b>, alle Nullen bleiben." : "Pfeil oben links: schon der erste Eliminationsschritt füllt die ganze Restmatrix — <b class='nm-err'>Fill-in</b> (rot)."}
      Mit einer Permutation (erste und letzte Zeile und Spalte tauschen) wird aus dem einen der andere Fall (Übung 1).</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

NUMA_CHAPTERS.push({
  n: 7, vl: "VL14", title: "Iterative Verfahren für LGS", next: "",
  headline: "Iterative <span class=\"accent\">Verfahren</span>",
  intro: "Ist A groß und dünn besetzt, sind LR und Cholesky zu teuer — schon wegen des Fill-ins. Iterative Verfahren brauchen nur Matrix-Vektor-Produkte: allgemeine lineare Iterationen (Jacobi, Gauß-Seidel) und das cg-Verfahren für spd-Matrizen.",
  sections: [
    {
      id: "7.1", title: "Allgemeine lineare Iterationen", short: "Jacobi & Gauß-Seidel", about: "Fixpunktform, ρ(I − B⁻¹A) < 1, Jacobi B = D, Gauß-Seidel B = L + D, unvollständige LR",
      html: () => `
        ${nmGist([
          `Mit einem <b>Vorkonditionierer</b> B ≈ A: Ax = b ⇔ x = (I − B⁻¹A)x + B⁻¹b. Fixpunktiteration x<sub>k+1</sub> = x<sub>k</sub> + B⁻¹r<sub>k</sub>, r<sub>k</sub> = b − Ax<sub>k</sub>.`,
          `<b>Konvergenz</b> für jeden Startwert, wenn ρ(I − B⁻¹A) &lt; 1 (dann ist A regulär); linear.`,
          `A = L + D + R: <b>Jacobi</b> B = D (Gesamtschritt), <b>Gauß-Seidel</b> B = L + D (Einzelschritt), oder eine unvollständige LR-Zerlegung.`,
        ])}
        <div class="card">
          <h3>Praktische Durchführung</h3>
          <ol class="nm-ol">
            <li>Wähle x₀, ε &gt; 0; r₀ = b − Ax₀, k = 0.</li>
            <li>Falls ‖r<sub>k</sub>‖ ≤ ε‖b‖: STOPP. Sonst löse Bc<sub>k</sub> = r<sub>k</sub>, x<sub>k+1</sub> = x<sub>k</sub> + c<sub>k</sub>, r<sub>k+1</sub> = r<sub>k</sub> − Ac<sub>k</sub>, k um 1 erhöhen.</li>
          </ol>
          <p>Wichtig: Bc = r muss <b>viel leichter</b> lösbar sein als Ax = b. B = I bringt nichts, B = A ist unmöglich.</p>
          ${ppFacts([
            ["Jacobi", `x<sub>k+1,n</sub> = (b<sub>n</sub> − Σ<sub>m≠n</sub> a<sub>nm</sub>x<sub>k,m</sub>)/a<sub>nn</sub> — leicht parallel.`],
            ["Gauß-Seidel", "benutzt die schon neuen Komponenten sofort; explizit ausführbar (Vorwärtssubstitution), konvergiert oft schneller."],
            ["hinreichend", "A strikt diagonaldominant ⇒ Jacobi (und Gauß-Seidel) konvergieren."],
            ["Gerschgorin (SS 26)", "Alle EW von M liegen in ⋃ K<sub>n</sub>, K<sub>n</sub> = {z : |z − m<sub>nn</sub>| ≤ Σ<sub>k≠n</sub>|m<sub>nk</sub>|}. Für die Spline-Matrix (2 1; 1 4 1; …) und Jacobi: Mittelpunkte 0, Radien ≤ ½ ⇒ ρ ≤ ½ &lt; 1."],
          ])}
        </div>
        ${pw("jgs", `${pseg("sys", Object.entries(NM_IT_SYS).map(([k, v]) => [k, v.name]), "dd")}${pseg("m", [["jac", "Jacobi"], ["gs", "Gauß-Seidel"]], "jac")}`, { wide: true })}
        ${nmTraps([
          "Die Iterationsmatrix ist I − B⁻¹A, nicht B⁻¹A. Für Jacobi: I − D⁻¹A hat Nullen auf der Diagonale.",
          "Konvergenz hängt am Spektralradius, nicht an einer Norm — eine Norm &lt; 1 reicht aber (‖·‖ ≥ ρ).",
          "Lückentext WS 19/20: iterativ, wenn N <b>groß</b> und A <b>dünn besetzt</b>; die Hauptidee ist, dass Bc = r <b>leichter</b> gelöst werden kann.",
        ])}`,
      setup: (root) => nmWIter(root),
      check: [
        { q: "Welcher Vorkonditionierer gehört zum Gauß-Seidel-Verfahren (A = L + D + R)?", opts: ["B = L + D", "B = D", "B = D + R", "B = A"], why: "Untere Dreiecksmatrix mit Diagonale: Bc = r per Vorwärtssubstitution." },
        { q: "Wann konvergiert x_{k+1} = (I − B⁻¹A)xₖ + B⁻¹b für jeden Startwert?", opts: ["Wenn ρ(I − B⁻¹A) < 1", "Wenn A symmetrisch ist", "Wenn ‖B‖ < 1", "Wenn det A ≠ 0"], why: "Dann ist I − B⁻¹A eine Kontraktion (in einer passenden Norm)." },
        { q: "Was ist ein Vorteil des Jacobi-Verfahrens?", opts: ["Es lässt sich leicht parallelisieren", "Es konvergiert immer", "Es ist exakt nach N Schritten", "Es braucht keine Diagonale"], why: "Jede Komponente hängt nur vom alten Vektor ab." },
        { q: "Eine hinreichende Bedingung für die Konvergenz von Jacobi?", opts: ["A strikt diagonaldominant", "A symmetrisch", "A regulär", "A dünn besetzt"], why: "Dann ist ‖I − D⁻¹A‖∞ < 1." },
      ],
    },
    {
      id: "7.2", title: "Das cg-Verfahren", short: "cg", about: "Φ(x) = ½xᵀAx − xᵀb, Energienorm, αₖ, βₖ, A-orthogonale Suchrichtungen, Fehlerabschätzung",
      html: () => `
        ${nmGist([
          `Für <b>spd</b> A: x löst Ax = b ⇔ x minimiert <b>Φ(x) = ½xᵀAx − xᵀb</b>, denn ∇Φ = Ax − b und die Hesse-Matrix A ist positiv definit.`,
          `Jeder Schritt minimiert Φ entlang einer Suchrichtung d<sub>k</sub>; die nächste Richtung d<sub>k+1</sub> = r<sub>k+1</sub> + β<sub>k</sub>d<sub>k</sub> ist <b>A-orthogonal</b> zu d<sub>k</sub>.`,
          `Hauptaufwand: <b>eine Matrix-Vektor-Multiplikation Ad<sub>k</sub></b> pro Schritt. Theoretisch nach höchstens N Schritten exakt.`,
        ])}
        <div class="card">
          <h3>Algorithmus</h3>
          <ol class="nm-ol">
            <li>Wähle x₀, ε &gt; 0; d₀ = r₀ = b − Ax₀, k = 0.</li>
            <li>Falls ‖r<sub>k</sub>‖ ≤ ε‖b‖ STOPP, sonst
              ${F(`α<sub>k</sub> = ${frac("⟨r<sub>k</sub>, r<sub>k</sub>⟩", "⟨d<sub>k</sub>, d<sub>k</sub>⟩<sub>A</sub>")},  x<sub>k+1</sub> = x<sub>k</sub> + α<sub>k</sub>d<sub>k</sub>,  r<sub>k+1</sub> = r<sub>k</sub> − α<sub>k</sub>Ad<sub>k</sub>,  β<sub>k</sub> = ${frac("⟨r<sub>k+1</sub>, r<sub>k+1</sub>⟩", "⟨r<sub>k</sub>, r<sub>k</sub>⟩")},  d<sub>k+1</sub> = r<sub>k+1</sub> + β<sub>k</sub>d<sub>k</sub>`, "small-f")}</li>
          </ol>
          ${ppFacts([
            ["Energienorm", "⟨x, y⟩<sub>A</sub> = xᵀAy, ‖x‖<sub>A</sub> = √(xᵀAx); Φ(x) − Φ(x*) = ½‖x − x*‖<sub>A</sub>²: die Höhenlinien sind Ellipsen um x*."],
            ["α<sub>k</sub>", "Minimum der Parabel α ↦ Φ(x<sub>k</sub> + αd<sub>k</sub>): α<sub>k</sub> = ⟨r<sub>k</sub>, d<sub>k</sub>⟩/⟨d<sub>k</sub>, d<sub>k</sub>⟩<sub>A</sub> (= ⟨r<sub>k</sub>, r<sub>k</sub>⟩/… wegen r<sub>k</sub> ⊥ d<sub>k−1</sub>)."],
            ["β<sub>k</sub>", "aus ⟨d<sub>k+1</sub>, d<sub>k</sub>⟩<sub>A</sub> = 0: β<sub>k</sub> = −⟨r<sub>k+1</sub>, d<sub>k</sub>⟩<sub>A</sub>/⟨d<sub>k</sub>, d<sub>k</sub>⟩<sub>A</sub> (SS 24)."],
            ["Fehler", `${nrm("x* − x<sub>k</sub>", "A")} ≤ max<sub>λ∈σ(A)</sub>|q<sub>k</sub>(λ)| ${nrm("x* − x<sub>0</sub>", "A")} für jedes q<sub>k</sub> ∈ P<sub>k</sub> mit q<sub>k</sub>(0) = 1; daraus ≤ 2(${frac("√κ − 1", "√κ + 1")})<sup>k</sup>${nrm("x* − x<sub>0</sub>", "A")}, κ = cond₂(A).`],
            ["L verschiedene EW", "Mit q = Lagrange-Polynom, das in 0 gleich 1 und in allen L Eigenwerten 0 ist: exakt nach L Schritten (SS 26). Wenige schmale Cluster ⇒ schnelle Konvergenz."],
          ])}
        </div>
        ${pw("cg", `${pslider("kap", "κ = cond₂(A)", 1, 30, 1, 8)}${pseg("start", [[0, "Start 1"], [1, "Start 2"], [2, "Start 3"]], 0)}`, { wide: true })}
        ${nmTraps([
          "cg nur für <b>symmetrisch positiv definite</b> A. Sonst z. B. auf die Normalengleichung AᵀAx = Aᵀb anwenden (" + nmSee("7.3") + ").",
          "Skaliert man A und b mit λ &gt; 0 (SS 24), bleiben die x<sub>k</sub> gleich, r<sub>k</sub> skaliert mit λ: ein Stoppkriterium ‖r<sub>k</sub>‖ ≤ ε ohne ‖b‖ wäre nicht skalierungsinvariant.",
          "Energienorm ausrechnen (WS 24/25, WS 20/21): ‖d‖<sub>A</sub>² = dᵀAd; für A = D + eeᵀ ist dᵀAd = dᵀDd + (eᵀd)².",
        ])}`,
      setup: (root) => nmWCG(root),
      check: [
        { q: "Welches Funktional minimiert das cg-Verfahren?", opts: ["Φ(x) = ½xᵀAx − xᵀb", "‖Ax − b‖₂", "xᵀAx", "½‖x‖² − bᵀx"], why: "∇Φ = Ax − b; das Minimum ist die Lösung, weil A spd ist." },
        { q: "Was ist der Hauptaufwand eines cg-Schritts?", opts: ["die Matrix-Vektor-Multiplikation Adₖ", "eine LR-Zerlegung", "das Invertieren von A", "das Sortieren der Residuen"], why: "Alles andere sind Skalarprodukte und Vektor-Updates (O(N))." },
        { q: "A hat nur drei verschiedene Eigenwerte. Nach wie vielen Schritten ist cg (exakt gerechnet) fertig?", opts: ["höchstens 3", "N", "1", "nie"], why: "Ein Polynom vom Grad 3 mit q(0) = 1 verschwindet auf allen drei EW." },
        { q: "Welche Bedingung legt βₖ fest?", opts: ["⟨dₖ₊₁, dₖ⟩_A = 0", "⟨rₖ₊₁, dₖ⟩ = 0", "‖dₖ₊₁‖ = 1", "dₖ₊₁ = rₖ₊₁"], why: "Die neue Suchrichtung soll A-orthogonal (konjugiert) zur alten sein." },
      ],
    },
    {
      id: "7.3", title: "Dünn besetzte Matrizen und Vorkonditionierung", short: "Dünn & vorkonditioniert", about: "CRS/CCS, Fill-in, A⁻¹ voll, vorkonditioniertes cg, cg für die Normalengleichung",
      html: () => `
        ${nmGist([
          `Dünn besetzte Matrizen speichert man nur mit ihren K ≪ N² Nicht-Nullen: <b>CRS</b> (zeilenweise) oder <b>CCS</b> (spaltenweise). Ax kostet dann K statt N² Operationen.`,
          `Direkte Verfahren erzeugen <b>Fill-in</b>: die Faktoren (und erst recht A⁻¹) sind viel dichter als A.`,
          `<b>Vorkonditionieren</b>: B⁻¹Ax = B⁻¹b mit cond(B⁻¹A) ≪ cond(A) — weniger Schritte, weniger Aufwand.`,
        ])}
        <div class="card">
          <h3>CRS-Format (Übung 3)</h3>
          <p>Drei Vektoren: v (Werte zeilenweise), c (Spaltenindex jedes Werts) und p (Zeiger: p<sub>n+1</sub> − p<sub>n</sub> Nicht-Nullen in Zeile n, p₁ = 0, p<sub>M+1</sub> = K).</p>
        </div>
        ${pw("crs", pseg("row", [[0, "Zeile 1"], [1, "Zeile 2"], [2, "Zeile 3"], [3, "Zeile 4"]], 1), { wide: true })}
        <div class="card">
          <h3>Fill-in</h3>
          <p>Beispiel der Vorlesung: eine spd-Matrix mit 17 801 Nicht-Nullen — ihr Cholesky-Faktor hat 13-mal so viele, obwohl die Bandstruktur bleibt. A⁻¹ ist sogar voll.</p>
        </div>
        ${pw("fill", pseg("arrow", [[0, "Pfeil oben links"], [1, "Pfeil unten rechts"]], 0), { wide: true })}
        <div class="card">
          <h3>Vorkonditioniertes cg und Normalengleichung</h3>
          ${ppFacts([
            ["vorkonditioniert", "Mit spd B = CCᵀ wendet man cg auf C⁻¹AC⁻ᵀ an; praktisch braucht man pro Schritt eine Lösung von Bz = r (z. B. unvollständige Cholesky-Zerlegung)."],
            ["Normalengleichung", "AᵀAx = Aᵀb mit A ∈ ℝ<sup>M×N</sup> von vollem Rang: cg mit AᵀAd<sub>k</sub> = Aᵀ(Ad<sub>k</sub>) — zwei Matrix-Vektor-Produkte (2MN), nie das Produkt AᵀA bilden."],
            ["Aufwand (SS 17)", "Ein cg-Schritt kostet für voll besetztes A etwa N², für dünn besetztes mit K Nicht-Nullen etwa K."],
          ])}
        </div>
        ${nmTraps([
          "CRS für dünn besetzte Matrizen sinnvoll — für volle Matrizen braucht es mehr Speicher als das Feld selbst.",
          "Auch eine Approximation reicht oft (spektrale Bisektion, weitere Fehlerquellen): man muss das LGS nicht exakt lösen.",
        ])}`,
      setup: (root) => { nmWCRS(root); nmWFill(root); },
      check: [
        { q: "Wie viele Operationen kostet Ax im CRS-Format mit K Nicht-Nullen?", opts: ["K", "N²", "N", "K²"], why: "Jede Nicht-Null wird genau einmal multipliziert." },
        { q: "Was ist Fill-in?", opts: ["Nullen von A werden in den Faktoren einer Zerlegung zu Nicht-Nullen", "Das Auffüllen von A mit Einsen", "Das Speichern im CRS-Format", "Die Vorkonditionierung"], why: "Darum werden direkte Verfahren für große dünne Matrizen teuer." },
        { q: "Wie wendet man cg auf die Normalengleichung an, ohne AᵀA zu bilden?", opts: ["AᵀAd = Aᵀ(Ad): zwei Matrix-Vektor-Produkte", "AᵀA vorher mit Cholesky zerlegen", "Nur A statt AᵀA verwenden", "Gar nicht"], why: "Das spart das Matrix-Matrix-Produkt (MN²/2)." },
        { q: "Wozu dient ein Vorkonditionierer B beim cg-Verfahren?", opts: ["cond(B⁻¹A) ≪ cond(A): weniger Schritte", "A symmetrisch machen", "Das Residuum berechnen", "Fill-in erzeugen"], why: "Die Fehlerschranke hängt an √κ." },
      ],
    },
  ],
});
