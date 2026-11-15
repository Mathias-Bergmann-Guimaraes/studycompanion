// GKI chapter 3: Klassifikation (VL 3, 09.11.2026, Benjamin Schäfer) — evaluating classifiers
// (confusion matrix, precision, recall, ROC, prevalence), linear classifiers and separability,
// logistic regression and cross-entropy, gradient descent and mini-batches, softmax.
// Exercise sheet 2, task 3 is worked through in 3.1 and 3.3.

/* ---------------------------------------------------------------- 3.1 Konfusionsmatrix */

const GK_MAILS = {
  mail: { name: "20 Mails", pos: [0.95, 0.9, 0.85, 0.8, 0.7, 0.62, 0.55, 0.4], neg: [0.75, 0.6, 0.5, 0.45, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1, 0.08, 0.05], P: "Spam", N: "kein Spam" },
  rare: { name: "Selten: 1 von 100 krank", pos: [0.7], neg: Array.from({ length: 99 }, (_, i) => +(0.02 + (i % 33) * 0.025 + (i % 3) * 0.004).toFixed(3)), P: "krank", N: "gesund" },
};
function gkConf(pos, neg, tau) {
  const TP = pos.filter((p) => p >= tau).length, FN = pos.length - TP, FP = neg.filter((p) => p >= tau).length, TN = neg.length - FP;
  return { TP, FN, FP, TN };
}
const gkRatio = (a, b) => (b ? nmD(a / b, 3) : "—");
function gkConfTable({ TP, FN, FP, TN }, P = "positiv", N = "negativ") {
  return `<table class="gk-cm"><thead><tr><th>Wahrheit ↓ · Vorhersage →</th><th>${P}</th><th>${N}</th></tr></thead><tbody>
    <tr><th>${P} (${TP + FN})</th><td class="gk-tp"><b>${TP}</b><span>TP</span></td><td class="gk-fn"><b>${FN}</b><span>FN</span></td></tr>
    <tr><th>${N} (${FP + TN})</th><td class="gk-fp"><b>${FP}</b><span>FP</span></td><td class="gk-tn"><b>${TN}</b><span>TN</span></td></tr></tbody></table>`;
}
function gkMetrics({ TP, FN, FP, TN }) {
  return `<div class="lw-vals"><span>Precision TP/(TP+FP)</span><b>${gkRatio(TP, TP + FP)}</b><span>Recall TP/(TP+FN)</span><b>${gkRatio(TP, TP + FN)}</b>
    <span>F₁ 2TP/(2TP+FP+FN)</span><b>${gkRatio(2 * TP, 2 * TP + FP + FN)}</b><span>Accuracy</span><b>${gkRatio(TP + TN, TP + TN + FP + FN)}</b></div>`;
}

function gkWConf(root) {
  const { w, fig, read } = ppW(root, "conf");
  const st = { set: "mail", tau: 0.5 };
  const draw = () => {
    const S = GK_MAILS[st.set];
    lenOut(w, "tau", nmD(st.tau, 2));
    const X = (p) => 92 + p * 410;
    const lay = (ps, y0, dir) => {
      const seen = {};
      return ps.map((p) => { const k = Math.round(p * 40); seen[k] = (seen[k] || 0) + 1; return [p, y0 + dir * (seen[k] - 1) * 12]; });
    };
    // Positives stacked upwards above the score axis, negatives downwards below it.
    const AX = 80, H = st.set === "rare" ? 200 : 170;
    const pos = lay(S.pos, AX - 26, -1), neg = lay(S.neg, AX + 36, 1);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 ${H}" role="img" aria-label="Scores und Schwelle">
      <rect x="${X(st.tau)}" y="6" width="${Math.max(0, X(1) - X(st.tau))}" height="${H - 26}" class="gk-predpos"/>
      <text x="${X(1) - 4}" y="18" text-anchor="end" class="tick-t">„${S.P}“ vorhergesagt: p ≥ τ</text>
      <line x1="${X(0)}" y1="${AX}" x2="${X(1)}" y2="${AX}" class="tick"/>
      ${[0, 0.25, 0.5, 0.75, 1].map((t) => `<line x1="${X(t)}" y1="${AX}" x2="${X(t)}" y2="${AX + 5}" class="tick"/><text x="${X(t)}" y="${AX + 17}" text-anchor="middle" class="tick-t">${nmD(t, 2)}</text>`).join("")}
      <line x1="${X(st.tau)}" y1="6" x2="${X(st.tau)}" y2="${H - 20}" class="gk-tau"/>
      ${pos.map(([p, y]) => gkDot(X(p), y, 1, p >= st.tau ? "" : "gk-miss")).join("")}
      ${neg.map(([p, y]) => gkDot(X(p), y, 0, p >= st.tau ? "gk-miss" : "")).join("")}
      <text x="4" y="${AX - 22}" class="gk-box-t" style="fill:var(--gk-c1)">● ${S.P}</text><text x="4" y="${AX + 40}" class="gk-box-t" style="fill:var(--gk-c0)">□ ${S.N}</text>
      <text x="${X(0.5)}" y="${H - 4}" text-anchor="middle" class="ax-t">Score p</text>
    </svg>`;
    const c = gkConf(S.pos, S.neg, st.tau);
    read.innerHTML = gkConfTable(c, S.P, S.N) + gkMetrics(c) +
      `<p class="small">${st.set === "rare" && c.TP === 0 ? `<b>${Math.round(((c.TP + c.TN) / (S.pos.length + S.neg.length)) * 100)} % Accuracy — und kein einziger Krankheitsfall erkannt.</b> Bei unausgewogenen Klassen reicht Accuracy nicht.` : "Rot umrandet: falsch eingeordnet. Schieb die Schwelle: Recall fällt monoton, wenn τ steigt, Precision nicht unbedingt."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.2 ROC, Prävalenz */

const GK_ROC = { pos: [0.9, 0.7, 0.5, 0.2], neg: [0.8, 0.6, 0.4, 0.1] };
function gkWROC(root) {
  const { w, fig, read } = ppW(root, "roc");
  const st = { k: 4 };
  const all = [...GK_ROC.pos.map((p) => [p, 1]), ...GK_ROC.neg.map((p) => [p, 0])].sort((a, b) => b[0] - a[0]);
  // The ROC points: threshold above everything, then at each score in turn.
  const pts = [[0, 0, 1]];
  let tp = 0, fp = 0;
  all.forEach(([p, y]) => { y ? tp++ : fp++; pts.push([fp / 4, tp / 4, p]); });
  const P = nmFrame(260, 260, [0, 1], [0, 1], { l: 34, r: 10, t: 10, b: 30 });
  const draw = () => {
    lenOut(w, "k", st.k);
    const [fx, fy, tau] = pts[st.k];
    const path = pts.map(([x, y], i) => `${i ? "L" : "M"}${P.X(x)},${P.Y(y)}`).join("");
    const area = path + `L${P.X(1)},${P.Y(0)}Z`;
    fig.innerHTML = `<div class="gk-two"><svg class="lw-svg" viewBox="0 0 260 260" role="img" aria-label="ROC-Kurve">
        ${P.axes({ xt: [0, 0.5, 1], yt: [0, 0.5, 1] })}
        <path d="${area}" class="gk-auc"/><line x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(1)}" y2="${P.Y(1)}" class="guide"/>
        <path d="${path}" class="curve nm-approx-c"/><circle cx="${P.X(fx)}" cy="${P.Y(fy)}" r="7" class="pt nm-piv-pt"/>
        <text x="${P.X(0.5)}" y="256" text-anchor="middle" class="ax-t">FPR</text><text x="10" y="${P.Y(0.5)}" class="ax-t" transform="rotate(-90 10 ${P.Y(0.5)})" text-anchor="middle">TPR</text>
      </svg><svg class="lw-svg" viewBox="0 0 240 260" role="img" aria-label="Scores">
        ${all.map(([p, y], i) => `<g transform="translate(0 ${20 + i * 28})">${gkDot(30, 0, y, i < st.k ? "gk-sel" : "")}<text x="48" y="5" class="gk-box-t">p = ${nmD(p, 1)}</text>
          <text x="120" y="5" class="tick-t">${i < st.k ? "→ positiv" : ""}</text></g>`).join("")}
        <line x1="10" y1="${6 + st.k * 28}" x2="230" y2="${6 + st.k * 28}" class="gk-tau"/>
      </svg></div>`;
    read.innerHTML = `<div class="lw-vals"><span>Schwelle τ</span><b>${st.k === 0 ? "über allen Scores" : `τ = ${nmD(tau, 1)}`}</b><span>TPR = Recall</span><b>${nmD(fy, 2)}</b><span>FPR = FP/(FP+TN)</span><b>${nmD(fx, 2)}</b><span>AUC</span><b>5/8 ≈ 0,63</b></div>
      <p class="small">Jede Schwelle gibt einen Punkt. AUC = Anteil der Positiv-Negativ-Paare, die richtig geordnet sind: hier 10 von 16. Die Diagonale ist ein Zufallsranking im Erwartungswert.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

function gkWPrev(root) {
  const { w, fig, read } = ppW(root, "prev");
  const st = { pi: 1, tpr: 80, fpr: 10 };
  const draw = () => {
    lenOut(w, "pi", `${nmD(st.pi, 1)} %`); lenOut(w, "tpr", nmD(st.tpr / 100, 2)); lenOut(w, "fpr", nmD(st.fpr / 100, 2));
    const N = 1000, pos = Math.round((N * st.pi) / 100), TP = Math.round((pos * st.tpr) / 100), FP = Math.round(((N - pos) * st.fpr) / 100);
    const cells = [];
    for (let i = 0; i < N; i++) cells.push(i < TP ? "gk-tp" : i < pos ? "gk-fn" : i < pos + FP ? "gk-fp" : "gk-tn");
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 220" role="img" aria-label="1000 Personen">
      ${cells.map((c, i) => `<rect x="${10 + (i % 50) * 10}" y="${10 + Math.floor(i / 50) * 10}" width="8.4" height="8.4" rx="1.5" class="gk-wf ${c}"/>`).join("")}</svg>`;
    const prec = TP + FP ? TP / (TP + FP) : 0;
    read.innerHTML = `<div class="lw-vals"><span>echte Positive (TP)</span><b>${TP}</b><span>Fehlalarme (FP)</span><b class="nm-err">${FP}</b><span>Precision</span><b>${TP + FP ? `${TP}/${TP + FP} ≈ ${nmD(prec, 3)}` : "—"}</b></div>
      <div class="nm-tex">$$\\text{Precision} = \\frac{\\text{TPR}\\cdot\\pi}{\\text{TPR}\\cdot\\pi + \\text{FPR}\\cdot(1 - \\pi)} = \\frac{${gt(st.tpr / 100, 2)}\\cdot ${gt(st.pi / 100, 3)}}{${gt(st.tpr / 100, 2)}\\cdot ${gt(st.pi / 100, 3)} + ${gt(st.fpr / 100, 2)}\\cdot ${gt(1 - st.pi / 100, 3)}} \\approx ${gt((st.tpr * st.pi) / (st.tpr * st.pi + st.fpr * (100 - st.pi)) || 0, 3)}$$</div>
      <p class="small">1000 Personen: violett erkannt (TP), hell violett übersehen (FN), orange Fehlalarm (FP). Bei seltenen Fällen sind die meisten Alarme Fehlalarme — obwohl TPR und FPR gut klingen.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.3 Lineare Grenze */

const GK_BOUND_SETS = (() => {
  const rnd = gkRng(11), g = () => gkGauss(rnd);
  const lin = [...Array.from({ length: 14 }, () => [1 + 0.7 * g(), 1 + 0.7 * g(), 1]), ...Array.from({ length: 14 }, () => [-1.2 + 0.7 * g(), -0.8 + 0.7 * g(), 0])];
  const xor = [];
  [[1, 1, 0], [-1, -1, 0], [1, -1, 1], [-1, 1, 1]].forEach(([a, b, c]) => { for (let i = 0; i < 7; i++) xor.push([a * 1.4 + 0.45 * g(), b * 1.4 + 0.45 * g(), c]); });
  const circ = [];
  for (let i = 0; i < 16; i++) { const r = 0.25 + 0.55 * rnd(), a = 2 * Math.PI * rnd(); circ.push([r * Math.cos(a), r * Math.sin(a), 1]); }
  for (let i = 0; i < 20; i++) { const r = 1.5 + 1 * rnd(), a = 2 * Math.PI * rnd(); circ.push([r * Math.cos(a), r * Math.sin(a), 0]); }
  return { lin: { name: "linear trennbar", pts: lin, w: [1, 1, 0] }, xor: { name: "XOR", pts: xor, w: [1, 0, 0] }, circ: { name: "Kreis", pts: circ, w: [1, 0, 0] } };
})();

function gkWBound(root) {
  const { w, fig, read } = ppW(root, "bound");
  const st = { set: "lin", w1: 1, w2: 1, b: 0, phi: 0, c: 1.2 };
  const P = nmFrame(300, 300, [-3, 3], [-3, 3], { l: 20, r: 10, t: 10, b: 20 });
  const setSliders = () => ["w1", "w2", "b"].forEach((k) => { const i = $(`input[data-k="${k}"]`, w); if (i) i.value = st[k]; });
  const draw = () => {
    const S = GK_BOUND_SETS[st.set];
    const phiMode = st.set === "circ" && st.phi;
    $$(".gk-lin", w).forEach((e) => (e.hidden = phiMode));
    $$(".gk-phi", w).forEach((e) => (e.hidden = !phiMode));
    $$(".gk-phiseg", w).forEach((e) => (e.hidden = st.set !== "circ"));
    ["w1", "w2", "b", "c"].forEach((k) => lenOut(w, k, nmD(st[k], 1)));
    const z = (x1, x2) => (phiMode ? st.c - (x1 * x1 + x2 * x2) : st.w1 * x1 + st.w2 * x2 + st.b);
    const pred = (x1, x2) => +(z(x1, x2) >= 0);
    const err = S.pts.filter(([a, b, c]) => pred(a, b) !== c).length;
    // The half-plane z ≥ 0 as a polygon clipped to the frame, or a disc in feature mode.
    let region = "", line = "", arrow = "";
    if (phiMode) {
      region = `<circle cx="${P.X(0)}" cy="${P.Y(0)}" r="${(Math.sqrt(st.c) / 6) * 270}" class="gk-half"/>`;
      line = `<circle cx="${P.X(0)}" cy="${P.Y(0)}" r="${(Math.sqrt(st.c) / 6) * 270}" class="gk-bline"/>`;
    } else if (st.w1 || st.w2) {
      const poly = [];
      const corners = [[-3, -3], [3, -3], [3, 3], [-3, 3]];
      for (let i = 0; i < 4; i++) {
        const A = corners[i], B = corners[(i + 1) % 4], za = z(...A), zb = z(...B);
        if (za >= 0) poly.push(A);
        if ((za >= 0) !== (zb >= 0)) { const t = za / (za - zb); poly.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])]); }
      }
      region = poly.length ? `<polygon points="${poly.map(([a, b]) => `${P.X(a)},${P.Y(b)}`).join(" ")}" class="gk-half"/>` : "";
      const cut = poly.filter(([a, b]) => Math.abs(z(a, b)) < 1e-9);
      if (cut.length >= 2) line = `<line x1="${P.X(cut[0][0])}" y1="${P.Y(cut[0][1])}" x2="${P.X(cut[1][0])}" y2="${P.Y(cut[1][1])}" class="gk-bline"/>`;
      const n2 = st.w1 ** 2 + st.w2 ** 2, ox = (-st.b * st.w1) / n2, oy = (-st.b * st.w2) / n2, nn = Math.sqrt(n2);
      if (Math.abs(ox) < 3 && Math.abs(oy) < 3) arrow = arrowSVG(P.X(ox), P.Y(oy), P.X(ox + st.w1 / nn), P.Y(oy + st.w2 / nn), "gk-warr", 2.5, 9);
    }
    let strip = "";
    if (phiMode) {
      const F = (v) => 20 + (v / 7) * 270;
      strip = `<svg class="lw-svg" viewBox="0 0 300 70" role="img" aria-label="Merkmalsraum">
        <line x1="20" y1="35" x2="290" y2="35" class="tick"/><text x="290" y="60" text-anchor="end" class="ax-t">φ(x) = x₁² + x₂²</text>
        ${S.pts.map(([a, b, c]) => gkDot(F(Math.min(a * a + b * b, 7)), c ? 26 : 44, c, pred(a, b) !== c ? "gk-miss" : "")).join("")}
        <line x1="${F(st.c)}" y1="8" x2="${F(st.c)}" y2="60" class="gk-tau"/><text x="${F(st.c) + 4}" y="14" class="tick-t">c</text></svg>`;
    }
    fig.innerHTML = `<div class="${phiMode ? "gk-stack" : "gk-two"}"><svg class="lw-svg" viewBox="0 0 300 300" role="img" aria-label="Entscheidungsgrenze">
        <defs><clipPath id="gkBClip"><rect x="20" y="10" width="270" height="270"/></clipPath></defs>
        <g clip-path="url(#gkBClip)">${region}${line}</g>${P.axes({ xl: "x₁", yl: "x₂", xt: [-2, 0, 2], yt: [-2, 0, 2] })}
        ${S.pts.map(([a, b, c]) => gkDot(P.X(a), P.Y(b), c, pred(a, b) !== c ? "gk-miss" : "")).join("")}${arrow}
      </svg>${strip}</div>`;
    read.innerHTML = `<div class="lw-vals"><span>Grenze</span><b>${phiMode ? `$x_1^2 + x_2^2 = ${gt(st.c, 1)}$` : `$${gt(st.w1, 1)}x_1 ${st.w2 < 0 ? "-" : "+"} ${gt(Math.abs(st.w2), 1)}x_2 ${st.b < 0 ? "-" : "+"} ${gt(Math.abs(st.b), 1)} = 0$`}</b>
      <span>falsch eingeordnet</span><b class="${err ? "nm-err" : ""}">${err} von ${S.pts.length}</b><span>0-1-Loss</span><b>${nmD(err / S.pts.length, 3)}</b></div>
      <p class="small">${phiMode ? "Nichtlinear in $x$, linear im Merkmal: eine Schwelle auf $\\phi$ ist hier eine Kreisgrenze."
        : st.set === "lin" ? "Gefärbt: $z \\ge 0$, also Klasse 1. Gold: $w$ steht senkrecht auf der Grenze; $b$ verschiebt sie. Der 0-1-Loss springt nur, wenn ein Punkt die Seite wechselt."
        : st.set === "xor" ? "Keine Gerade trennt XOR — die Daten sind in $x_1, x_2$ nicht linear separierbar. Mit dem Merkmal $x_1x_2$ ginge es."
        : "Keine Gerade trennt den Kreis. Schalte auf das Merkmal $\\phi(x) = x_1^2 + x_2^2$."}</p>`;
  };
  lenWire(w, st, draw);
  $$('[data-seg="set"] button', w).forEach((b) => b.addEventListener("click", () => { [st.w1, st.w2, st.b] = GK_BOUND_SETS[st.set].w; setSliders(); draw(); }));
  draw();
}

/* ---------------------------------------------------------------- 3.4 Logistische Regression */

// The lecture's mails: counts of keyword 1 and 2, spam label.
const GK_MAIL4 = [["A", 0, 1, 0], ["B", 3, 2, 1], ["C", 1, 0, 0], ["D", 4, 1, 1]];
function gkWLogReg(root) {
  const { w, fig, read } = ppW(root, "logreg");
  const st = { w1: 0, w2: 0, b: 0, steps: 0 };
  const S = nmFrame(300, 220, [-6, 6], [-0.05, 1.05], { l: 28, r: 8, t: 10, b: 24 });
  const F = nmFrame(220, 220, [-0.5, 5], [-0.5, 3], { l: 24, r: 8, t: 10, b: 24 });
  const setSliders = () => ["w1", "w2", "b"].forEach((k) => ($(`input[data-k="${k}"]`, w).value = st[k]));
  const rows = () => GK_MAIL4.map(([n, x1, x2, y]) => { const z = st.b + st.w1 * x1 + st.w2 * x2, p = gkSig(z); return { n, x1, x2, y, z, p, l: -(y ? Math.log(p) : Math.log(1 - p)) }; });
  const draw = () => {
    ["w1", "w2", "b"].forEach((k) => lenOut(w, k, nmD(st[k], 2)));
    const R = rows(), L = R.reduce((s, r) => s + r.l, 0) / R.length;
    let line = "";
    if (st.w1 || st.w2) {
      const xs = [-0.5, 5].map((x1) => [x1, st.w2 ? -(st.b + st.w1 * x1) / st.w2 : null]);
      line = st.w2 ? `<line x1="${F.X(xs[0][0])}" y1="${F.Y(xs[0][1])}" x2="${F.X(xs[1][0])}" y2="${F.Y(xs[1][1])}" class="gk-bline"/>`
        : `<line x1="${F.X(-st.b / st.w1)}" y1="${F.Y(-0.5)}" x2="${F.X(-st.b / st.w1)}" y2="${F.Y(3)}" class="gk-bline"/>`;
    }
    fig.innerHTML = `<div class="gk-two"><svg class="lw-svg" viewBox="0 0 300 220" role="img" aria-label="Sigmoid">
        ${S.axes({ xl: "z", xt: [-6, -3, 0, 3, 6], yt: [0, 0.5, 1] })}<path d="${S.path(gkSig, 200)}" class="curve nm-approx-c gk-thin"/>
        <line x1="${S.X(-6)}" y1="${S.Y(0.5)}" x2="${S.X(6)}" y2="${S.Y(0.5)}" class="guide"/>
        ${R.map((r) => `${gkDot(S.X(Math.max(-6, Math.min(6, r.z))), S.Y(r.p), r.y)}<text x="${S.X(Math.max(-6, Math.min(6, r.z))) + 8}" y="${S.Y(r.p) + (r.y ? 14 : -6)}" class="tick-t">${r.n}</text>`).join("")}
      </svg><svg class="lw-svg" viewBox="0 0 220 220" role="img" aria-label="Merkmalsraum">
        <defs><clipPath id="gkLRClip"><rect x="24" y="10" width="188" height="186"/></clipPath></defs>
        ${F.axes({ xl: "x₁", yl: "x₂", xt: [0, 2, 4], yt: [0, 1, 2] })}<g clip-path="url(#gkLRClip)">${line}</g>
        ${R.map((r) => `${gkDot(F.X(r.x1), F.Y(r.x2), r.y, (r.p >= 0.5) !== !!r.y ? "gk-miss" : "")}<text x="${F.X(r.x1) + 8}" y="${F.Y(r.x2) - 6}" class="tick-t">${r.n}</text>`).join("")}
      </svg></div>`;
    read.innerHTML = `<table class="len-terms nm-tab gk-lrt"><thead><tr><th></th><th>x</th><th>y</th><th>z</th><th>p = σ(z)</th><th class="nm-err">l</th><th class="nm-piv">p − y</th></tr></thead><tbody>
      ${R.map((r) => `<tr><td>${r.n}</td><td>(${r.x1}, ${r.x2})</td><td>${r.y}</td><td>${nmD(r.z, 2)}</td><td>${nmD(r.p, 3)}</td><td class="nm-err">${nmD(r.l, 3)}</td><td class="nm-piv">${nmD(r.p - r.y, 3)}</td></tr>`).join("")}</tbody></table>
      <div class="lw-vals"><span>mittlere Kreuzentropie L</span><b class="nm-err">${nmD(L, 4)}</b><span>Gradientenschritte</span><b>${st.steps}</b></div>
      <p class="small">${st.steps ? "Jeder Schritt: $\\tilde w \\leftarrow \\tilde w - \\eta\\,\\frac1N\\tilde X^\\top(p - y)$ mit $\\eta = 0{,}5$." : "Alle Gewichte null: $p = 0{,}5$ für jede Mail, $L = \\ln 2 \\approx 0{,}693$. Probier „Gradientenschritt“."}</p>`;
  };
  lenWire(w, st, () => { st.steps = 0; draw(); });
  w.querySelector('[data-a="step"]').onclick = () => {
    const R = rows(), N = R.length;
    const g = [R.reduce((s, r) => s + (r.p - r.y), 0) / N, R.reduce((s, r) => s + (r.p - r.y) * r.x1, 0) / N, R.reduce((s, r) => s + (r.p - r.y) * r.x2, 0) / N];
    st.b = +(st.b - 0.5 * g[0]).toFixed(4); st.w1 = +(st.w1 - 0.5 * g[1]).toFixed(4); st.w2 = +(st.w2 - 0.5 * g[2]).toFixed(4);
    st.steps++;
    setSliders();
    draw();
  };
  w.querySelector('[data-a="zero"]').onclick = () => { st.w1 = st.w2 = st.b = 0; st.steps = 0; setSliders(); draw(); };
  draw();
}

/* ---------------------------------------------------------------- 3.5 Gradientenabstieg */

function gkWGD(root) {
  const { w, fig, read } = ppW(root, "gd");
  const st = { mode: "1d", eta: 0.1, t: 3, eta2: 0.1 };
  const draw = () => {
    const one = st.mode === "1d";
    $$(".gk-1d", w).forEach((e) => (e.hidden = !one));
    $$(".gk-2d", w).forEach((e) => (e.hidden = one));
    lenOut(w, "t", st.t);
    lenOut(w, "eta2", nmD(st.eta2, 3));
    if (one) {
      const L = (th) => 2 * (th - 1) ** 2, dL = (th) => 4 * (th - 1);
      const th = [4];
      for (let i = 0; i < st.t; i++) th.push(th[i] - st.eta * dL(th[i]));
      const P = nmFrame(520, 240, [-3, 5], [-1, 20]);
      fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 240" role="img" aria-label="Gradientenabstieg auf einer Parabel">
        <defs><clipPath id="gkGDClip"><rect x="34" y="12" width="474" height="202"/></clipPath></defs>
        ${P.axes({ xl: "θ", yl: "L(θ)" })}<g clip-path="url(#gkGDClip)"><path d="${P.path(L, 300)}" class="curve nm-err-c gk-thin"/>
        ${th.slice(0, -1).map((a, i) => `<line x1="${P.X(a)}" y1="${P.Y(L(a))}" x2="${P.X(th[i + 1])}" y2="${P.Y(L(th[i + 1]))}" class="gk-step"/>`).join("")}</g>
        ${th.map((a, i) => Math.abs(a) < 50 ? `<circle cx="${P.X(Math.max(-3, Math.min(5, a)))}" cy="${P.Y(Math.min(L(a), 20))}" r="${i === th.length - 1 ? 7 : 4.5}" class="pt ${i === th.length - 1 ? "nm-piv-pt" : "nm-approx-pt"}"/>` : "").join("")}
      </svg>`;
      const beh = st.eta < 0.25 ? "kriecht monoton zum Minimum" : st.eta === 0.25 ? "erreicht das Minimum in einem Schritt" : st.eta < 0.5 ? "springt über das Minimum, konvergiert aber" : st.eta === 0.5 ? "springt zwischen 4 und −2 hin und her" : "entfernt sich immer weiter: Divergenz";
      read.innerHTML = `<table class="len-terms nm-tab"><thead><tr><th>t</th><th>θ<sub>t</sub></th><th class="nm-piv">L′(θ<sub>t</sub>)</th><th class="nm-err">L(θ<sub>t</sub>)</th></tr></thead><tbody>
        ${th.map((a, i) => `<tr><td>${i}</td><td>${nmD(a, 3)}</td><td class="nm-piv">${nmD(dL(a), 3)}</td><td class="nm-err">${nmD(L(a), 3)}</td></tr>`).join("")}</tbody></table>
        <p class="small">$L(\\theta) = 2(\\theta - 1)^2$, $L'(\\theta) = 4(\\theta - 1)$, Start $\\theta_0 = 4$: $\\theta_{t+1} = \\theta_t - ${gt(st.eta, 2)}\\cdot4(\\theta_t - 1)$. Mit $\\eta = ${gt(st.eta, 2)}$ ${beh}.</p>`;
    } else {
      const L = (a, b) => a * a + 4 * b * b;
      const th = [[-2.5, 1]];
      for (let i = 0; i < 25; i++) { const [a, b] = th[i]; th.push([a - st.eta2 * 2 * a, b - st.eta2 * 8 * b]); }
      const P = nmFrame(520, 260, [-3, 3], [-1.4, 1.4]);
      const ell = [0.25, 1, 2.25, 4, 6.25].map((c) => `<ellipse cx="${P.X(0)}" cy="${P.Y(0)}" rx="${P.X(Math.sqrt(c)) - P.X(0)}" ry="${P.Y(0) - P.Y(Math.sqrt(c) / 2)}" class="nm-level"/>`).join("");
      const g0 = [2 * 1, 8 * 0.5];
      fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 260" role="img" aria-label="Gradientenabstieg in 2D">
        <defs><clipPath id="gkGD2Clip"><rect x="34" y="12" width="474" height="222"/></clipPath></defs>${P.axes({ xl: "θ₁", yl: "θ₂" })}
        <g clip-path="url(#gkGD2Clip)">${ell}${th.slice(0, -1).map(([a, b], i) => `<line x1="${P.X(a)}" y1="${P.Y(b)}" x2="${P.X(th[i + 1][0])}" y2="${P.Y(th[i + 1][1])}" class="gk-step"/>`).join("")}
        ${th.map(([a, b]) => `<circle cx="${P.X(a)}" cy="${P.Y(b)}" r="3.5" class="pt nm-approx-pt"/>`).join("")}</g>
        ${arrowSVG(P.X(1), P.Y(0.5), P.X(1 + 0.12 * g0[0]), P.Y(0.5 + 0.12 * g0[1]), "gk-garr", 2.5, 9)}${arrowSVG(P.X(1), P.Y(0.5), P.X(1 - 0.12 * g0[0]), P.Y(0.5 - 0.12 * g0[1]), "gk-warr", 2.5, 9)}
      </svg>`;
      const last = th[th.length - 1];
      read.innerHTML = `<div class="lw-vals"><span>nach 25 Schritten</span><b>θ = (${nmD(last[0], 3)}, ${nmD(last[1], 3)})</b><span>L</span><b class="nm-err">${Math.abs(last[1]) > 1e6 ? "divergiert" : nmD(L(...last), 4)}</b></div>
        <p class="small">$L(\\theta) = \\theta_1^2 + 4\\theta_2^2$, $\\nabla L = (2\\theta_1, 8\\theta_2)^\\top$; in $(1;\\, 0{,}5)$ ist $\\nabla L = (2, 4)^\\top$: rot $+\\nabla L$, grün $-\\nabla L$. Der Gradient steht senkrecht zur Niveaulinie.
        ${st.eta2 > 0.25 ? "<b>In θ₂-Richtung ist η zu groß</b> (Faktor $1 - 8\\eta$, Betrag > 1): Zickzack nach außen." : st.eta2 > 0.125 ? "In θ₂-Richtung springt es hin und her (Zickzack), in θ₁ kriecht es — eine Lernrate für zwei Krümmungen." : "Kleine Lernrate: stabil, aber langsam in θ₁."}</p>`;
    }
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.6 Softmax */

function gkWSoftmax(root) {
  const { w, fig, read } = ppW(root, "soft");
  const st = { a1: 2, a2: 1, a3: 0, y: 2 };
  const draw = () => {
    const a = [st.a1, st.a2, st.a3];
    a.forEach((v, k) => lenOut(w, "a" + (k + 1), nmD(v, 1)));
    const m = Math.max(...a), e = a.map((v) => Math.exp(v - m)), s = e.reduce((x, y) => x + y), p = e.map((v) => v / s);
    const yv = [0, 1, 2].map((k) => +(k === st.y - 1)), g = p.map((v, k) => v - yv[k]);
    const pred = p.indexOf(Math.max(...p)) + 1;
    const col = (k, x) => `
      <rect x="${x}" y="${160 - p[k] * 140}" width="44" height="${p[k] * 140}" rx="4" class="gk-bar ${k === st.y - 1 ? "gk-cell-y" : "gk-cell-c"}"/>
      <text x="${x + 22}" y="${154 - p[k] * 140}" text-anchor="middle" class="gk-cell-t">${nmD(p[k], 2)}</text>
      <text x="${x + 22}" y="178" text-anchor="middle" class="gk-box-t">${k + 1}${k === st.y - 1 ? " ✓" : ""}</text>
      <rect x="${x + 260}" y="${g[k] >= 0 ? 100 - g[k] * 80 : 100}" width="44" height="${Math.abs(g[k]) * 80}" rx="4" class="gk-bar gk-gbar"/>
      <text x="${x + 282}" y="${g[k] >= 0 ? 94 - g[k] * 80 : 114 - g[k] * 80}" text-anchor="middle" class="gk-cell-t">${nmD(g[k], 2)}</text>
      <text x="${x + 282}" y="178" text-anchor="middle" class="gk-box-t">${k + 1}</text>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 190" role="img" aria-label="Softmax">
      <text x="10" y="14" class="tick-t">Wahrscheinlichkeiten p = softmax(a)</text><text x="270" y="14" class="tick-t">Gradient nach den Scores: p − y</text>
      <line x1="270" y1="100" x2="510" y2="100" class="tick"/>${[0, 1, 2].map((k) => col(k, 20 + k * 70)).join("")}</svg>`;
    read.innerHTML = `<div class="nm-tex">$$p = \\operatorname{softmax}${tcv(a.map((v) => gt(v, 1)))} \\approx ${tcv(p.map((v) => gt(v, 3)))},\\qquad l = -\\ln p_{${st.y}} \\approx ${gt(-Math.log(p[st.y - 1]), 3)}$$</div>
      <p class="small">Vorhergesagt: Klasse ${pred} (argmax). ${pred === st.y ? `Richtig — aber der Loss ist trotzdem größer als null, solange $p_${st.y} < 1$.` : `<b class="nm-err">Falsch</b>: wahr ist Klasse ${st.y}.`} Gelb: $p - y$ — positiv bei den falschen Klassen (ihr Score soll sinken), negativ bei der wahren (ihr Score soll steigen). Nur die Differenzen der Scores zählen: alle um dasselbe verschieben ändert nichts.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

GKI_CHAPTERS.push({
  n: 3, vl: "VL 3", lectures: [3], title: "Klassifikation", next: null,
  headline: "Klassifikation und <span class=\"accent\">logistische Regression</span>",
  intro: "Wie man diskrete Vorhersagen bewertet — Konfusionsmatrix, Precision, Recall, ROC — und wie man sie ohne geschlossene Lösung lernt: dasselbe Rezept wie in VL 2 (Modell → Likelihood → Loss → Optimierung), mit Bernoulli statt Gauß, Kreuzentropie statt Fehlerquadraten und Gradientenabstieg statt Normalgleichung.",
  sections: [
    {
      id: "3.1", title: "Klassifikation bewerten", short: "Konfusionsmatrix", about: "TP, FN, FP, TN, Precision, Recall, F₁, warum Accuracy täuscht",
      html: () => `
        ${nmGist([
          "Lernen heißt (Mitchell): <b>Aufgabe T</b> (Mails einteilen), <b>Leistungsmaß P</b> (wie gut werden neue Mails eingeordnet?), <b>Erfahrung E</b> (Trainingsmails mit Label). Testdaten bleiben beim Lernen unberührt.",
          "Das Modell liefert eine Wahrscheinlichkeit $p$ für Klasse 1; die <b>Entscheidung</b> $\\hat y = 1$ für $p \\ge \\tau$ hängt an einer gewählten <b>Schwelle</b> $\\tau$ — einem Hyperparameter, gewählt auf der Validierung.",
          "Die <b>Konfusionsmatrix</b> (Zeilen Wahrheit, Spalten Vorhersage) zählt TP, FN, FP, TN. <b>Precision</b> $= \\frac{TP}{TP + FP}$, <b>Recall</b> $= \\frac{TP}{TP + FN}$, $F_1 = \\frac{2TP}{2TP + FP + FN}$. <b>Accuracy</b> allein täuscht bei unausgewogenen Klassen.",
        ])}
        ${pw("conf", `${pseg("set", Object.entries(GK_MAILS).map(([k, v]) => [k, v.name]), "mail")}${pslider("tau", "Schwelle τ", 0, 1.05, 0.05, 0.5)}`, { wide: true })}
        <div class="card">
          <h3>1000 Mails, davon 100 Spam</h3>
          ${gkConfTable({ TP: 80, FN: 20, FP: 30, TN: 870 }, "Spam", "kein Spam")}
          ${tx(`\\text{Precision} = \\tfrac{80}{110} \\approx 0{,}73,\\quad \\text{Recall} = \\tfrac{80}{100} = 0{,}8,\\quad F_1 = \\tfrac{160}{210} \\approx 0{,}76,\\quad \\text{Accuracy} = \\tfrac{950}{1000} = 0{,}95`)}
          <p>95 % Genauigkeit stehen neben 20 übersehenen Spam-Mails und 30 Fehlalarmen. Welche Kennzahl zählt, hängt von der Anwendung ab: bei Krankheiten oder Betrug der <b>Recall</b> (nichts übersehen), beim Spamfilter eher die <b>Precision</b> (keine wichtige Mail verlieren).</p>
          <h3>99 % Accuracy kann das Ziel verfehlen</h3>
          <p>1 % krank, 99 % gesund: <b>immer „gesund“</b> vorhersagen gibt 99 % Accuracy — und erkennt keinen einzigen Krankheitsfall. Übung 2, Aufgabe 3(a), WS 23/24 2.5, WS 25/26 1-4: bei seltenen Klassen (2 von 100) ist Accuracy irreführend; besser Recall, Precision, $F_1$ oder die ROC/AUC.</p>
          <h3>Training, Validierung und Test</h3>
          <p>Training: Parameter $\\tilde w$ lernen — auch die Vorverarbeitung (Mittelwert, Skalierung) <b>nur auf den Trainingsdaten</b> fitten. Validierung: Modellvariante und Schwelle $\\tau$ wählen. Test: finale Leistung schätzen, nicht wiederholt zum Auswählen verwenden.</p>
        </div>
        ${gkSelf([
          ["Validierung mit 100 Betrugsfällen. Modell A: 40 richtig markiert, 10 Fehlalarme. Modell B: 70 richtig, 30 Fehlalarme. Gefordert: Recall ≥ 0,6 und Precision ≥ 0,65. Welches Modell? Ist das die finale Bewertung?", "A: Recall $\\frac{40}{100} = 0{,}4$ ✗, Precision $\\frac{40}{50} = 0{,}8$. B: Recall $0{,}7$ ✓, Precision $\\frac{70}{100} = 0{,}7$ ✓. Also B. Nein — das Validierungsergebnis diente der Auswahl; die finale Leistung schätzt man auf den Testdaten."],
        ])}
        ${nmTraps([
          "Zeilen = Wahrheit, Spalten = Vorhersage. FN ist ein übersehener Positiver (Wahrheit positiv, Vorhersage negativ), FP ein Fehlalarm.",
          "Precision teilt durch alle <b>positiven Vorhersagen</b>, Recall durch alle <b>echten Positiven</b>.",
          "$F_1$ ist das harmonische Mittel von Precision und Recall — nicht das arithmetische.",
        ])}`,
      setup: (root) => gkWConf(root),
      check: [
        { q: "TP = 80, FN = 20, FP = 30, TN = 870. Was ist die Precision?", opts: ["$\\frac{80}{110} \\approx 0{,}73$", "$\\frac{80}{100} = 0{,}8$", "$0{,}95$", "$\\frac{870}{900}$"], why: "TP durch alle positiven Vorhersagen (TP + FP)." },
        { q: "Dieselbe Matrix: was ist der Recall?", opts: ["$0{,}8$", "$0{,}73$", "$0{,}95$", "$0{,}03$"], why: "TP durch alle echten Positiven (TP + FN)." },
        { q: "1 % krank. Ein Modell sagt immer „gesund“. Accuracy und Recall?", opts: ["99 % und 0", "1 % und 1", "99 % und 1", "50 % und 0,5"], why: "Hohe Accuracy, kein Fall erkannt." },
        { q: "In der Konfusionsmatrix der Vorlesung sind die Zeilen …", opts: ["die Wahrheit", "die Vorhersage", "die Schwellen", "die Merkmale"], why: "Zeilen = Wahrheit, Spalten = Vorhersage." },
        { q: "Worauf wählt man die Schwelle $\\tau$?", opts: ["Auf den Validierungsdaten", "Auf den Testdaten", "Auf den Trainingsdaten, dann fest", "Immer $\\tau = 0{,}5$"], why: "$\\tau$ ist ein Hyperparameter." },
        { q: "Was ist $F_1$ für TP = 80, FP = 30, FN = 20?", opts: ["$\\frac{160}{210}$", "$\\frac{80}{130}$", "$\\frac{110}{210}$", "$0{,}8$"], why: "$\\frac{2TP}{2TP + FP + FN}$." },
      ],
    },
    {
      id: "3.2", title: "Schwelle, ROC und Prävalenz", short: "ROC & Prävalenz", about: "Recall monoton, Precision nicht, TPR über FPR, AUC, seltene Fälle",
      html: () => `
        ${nmGist([
          "Schwelle senken: der <b>Recall</b> steigt monoton (mehr Positive werden erkannt), die <b>Precision</b> nicht zwingend.",
          "<b>ROC</b> (Receiver Operating Characteristic): jede Schwelle gibt einen Punkt (FPR, TPR) mit TPR = Recall und FPR $= \\frac{FP}{FP + TN}$. <b>AUC</b>: Anteil korrekt geordneter Positiv-Negativ-Paare; die Diagonale ist ein Zufallsranking.",
          "<b>Prävalenz</b> $\\pi = P(Y = 1)$: Precision $= \\frac{\\text{TPR}\\cdot\\pi}{\\text{TPR}\\cdot\\pi + \\text{FPR}\\cdot(1 - \\pi)}$. Bei seltenen Fällen sind die meisten Alarme Fehlalarme.",
        ])}
        <div class="card">
          <h3>Schwelle senken: (p; y) = (0,9; 1), (0,8; 0), (0,7; 1), (0,6; 1)</h3>
          <table class="len-terms nm-tab"><thead><tr><th>Schwelle τ</th><th>positiv vorhergesagt</th><th>Precision</th><th>Recall</th></tr></thead><tbody>
            <tr><td>0,85</td><td>nur p = 0,9 (y = 1)</td><td>1</td><td>1/3</td></tr>
            <tr><td>0,75</td><td>+ p = 0,8 (y = 0: Fehlalarm)</td><td class="nm-err">1/2</td><td>1/3</td></tr>
            <tr><td>0,65</td><td>+ p = 0,7 (y = 1)</td><td>2/3</td><td>2/3</td></tr>
            <tr><td>0,55</td><td>+ p = 0,6 (y = 1)</td><td>3/4</td><td>1</td></tr></tbody></table>
        </div>
        ${pw("roc", pslider("k", "positiv: die obersten", 0, 8, 1, 4), { wide: true })}
        ${pw("prev", `${pslider("pi", "Prävalenz π", 0.1, 50, 0.1, 1)}${pslider("tpr", "TPR", 0, 100, 1, 80)}${pslider("fpr", "FPR", 0, 100, 1, 10)}`, { wide: true })}
        <div class="card">
          <h3>Das Beispiel der Vorlesung</h3>
          ${tx(`\\pi = 0{,}01,\\ \\text{TPR} = 0{,}8,\\ \\text{FPR} = 0{,}1,\\ N = 1000:\\quad TP = 8,\\ FP = 99,\\quad \\text{Precision} = \\tfrac{8}{107} \\approx 0{,}07`)}
          <p>Herleitung: $TP = \\text{TPR}\\cdot\\pi\\cdot N$ und $FP = \\text{FPR}\\cdot(1 - \\pi)\\cdot N$; $N$ kürzt sich. Bei Populationsraten sind die Zählwerte erwartete Anzahlen. Dasselbe wie der Satz von Bayes mit Prior $\\pi$ (${gkSee("2.6")}).</p>
        </div>
        ${nmTraps([
          "Die ROC hängt nicht von der Prävalenz ab (TPR und FPR sind Raten innerhalb der Klassen), die Precision schon.",
          "AUC = 0,5 heißt Zufall, nicht „halb so gut“. AUC = 1: jedes Positive hat einen höheren Score als jedes Negative.",
        ])}`,
      setup: (root) => { gkWROC(root); gkWPrev(root); },
      check: [
        { q: "Was passiert mit dem Recall, wenn man die Schwelle senkt?", opts: ["Er steigt oder bleibt gleich (monoton)", "Er sinkt", "Er schwankt beliebig", "Er bleibt immer gleich"], why: "Es werden nur mehr Fälle positiv; erkannte bleiben erkannt." },
        { q: "Was ist auf den Achsen der ROC-Kurve?", opts: ["FPR (x) und TPR (y)", "Precision und Recall", "Schwelle und Accuracy", "Loss und Epoche"], why: "Jede Schwelle gibt einen Punkt." },
        { q: "Was misst die AUC?", opts: ["Den Anteil korrekt geordneter Positiv-Negativ-Paare", "Die Accuracy bei τ = 0,5", "Die Prävalenz", "Den mittleren Score"], why: "Hier 10 von 16 Paaren: 5/8." },
        { q: "$\\pi = 0{,}01$, TPR = 0,8, FPR = 0,1. Etwa wie groß ist die Precision?", opts: ["$\\approx 0{,}07$", "$0{,}8$", "$0{,}9$", "$0{,}5$"], why: "8 echte Positive, 99 Fehlalarme." },
        { q: "Welche Größe hängt von der Prävalenz ab?", opts: ["Precision", "TPR", "FPR", "Keine"], why: "TPR und FPR sind Raten innerhalb der echten Positiven bzw. Negativen." },
      ],
    },
    {
      id: "3.3", title: "Lineare Klassifikatoren", short: "Lineare Grenze", about: "generativ/diskriminativ, Hyperebene, Separierbarkeit, 0-1-Loss, Merkmale φ",
      html: () => `
        ${nmGist([
          "<b>Generativ</b>: $p(x \\mid y)$ und $p(y)$ lernen, dann Bayes. <b>Diskriminativ</b>: direkt $p(y \\mid x)$.",
          "Linearer Klassifikator: Score $z = b + w^\\top x$, Entscheidung $\\hat y = 1$ für $z \\ge 0$. Die Grenze $z = 0$ ist eine <b>Hyperebene</b> (Gerade in 2D, Ebene in 3D); $w$ steht senkrecht auf ihr, $b$ verschiebt sie.",
          "<b>Linear separierbar</b> ist eine Eigenschaft der Daten: eine Hyperebene trennt alle Beispiele nach Label. Andere Merkmale können die Trennung ermöglichen: mit $\\phi(x) = x_1^2 + x_2^2$ wird ein Kreis zu einer Schwelle.",
        ])}
        ${pw("bound", `${pseg("set", Object.entries(GK_BOUND_SETS).map(([k, v]) => [k, v.name]), "lin")}
          <div class="gk-phiseg" hidden>${pseg("phi", [[0, "Merkmale x₁, x₂"], [1, "Merkmal φ = x₁² + x₂²"]], 0)}</div>
          <div class="gk-lin">${pslider("w1", "w₁", -3, 3, 0.1, 1)}${pslider("w2", "w₂", -3, 3, 0.1, 1)}${pslider("b", "b", -4, 4, 0.1, 0)}</div>
          <div class="gk-phi" hidden>${pslider("c", "Schwelle c", 0.1, 6, 0.1, 1.2)}</div>`, { wide: true })}
        <div class="card">
          <h3>Generativ am Spam-Beispiel</h3>
          <p>$S$ = Spam, $K$ = Schlüsselwort vorhanden. Prior $P(S) = 0{,}1$; $P(K \\mid S) = 0{,}8$; $P(K \\mid \\neg S) = 0{,}2$:</p>
          ${tx(`P(S \\mid K) = \\frac{P(K \\mid S)P(S)}{P(K \\mid S)P(S) + P(K \\mid \\neg S)P(\\neg S)} = \\frac{0{,}08}{0{,}08 + 0{,}18} = \\frac{4}{13} \\approx 0{,}31`)}
          <p class="small">Klassenbedingte Merkmalsverteilung + Prior → Posterior. Die logistische Regression (${gkSee("3.4")}) ist diskriminativ: sie lernt $p(y \\mid x)$ direkt. WS 22/23, 6.3 fragt nach genau diesem Unterschied.</p>
          <h3>Erster Versuch: Fehlklassifikationen zählen</h3>
          ${tx(`L_{01} = \\frac1N\\sum_i \\mathbb 1[\\hat y_i \\neq y_i] = 1 - \\text{Accuracy}`)}
          <p>Sprunghaft: kleine Parameteränderungen ändern häufig gar keine Entscheidung — kein brauchbarer Gradient. Für das Lernen braucht es ein glattes Maß, das auch Wahrscheinlichkeiten bewertet.</p>
          <h3>Zweiter Versuch: quadratischer Fehler auf den Labels</h3>
          <p>$l_i = \\frac12(z_i - y_i)^2$ wie in VL 2, jetzt für Labels 0/1. Der lineare Output $z$ ist nicht auf $[0, 1]$ begrenzt: Punkte <b>weit</b> von der Grenze haben einen großen Fehler, obwohl sie richtig liegen, und ziehen die Grenze zu sich (Bishop, Abb. 4.4). WS 23/24, 2.1: ein linear separierbarer Datensatz mit Ausreißern, den Least Squares falsch trennt.</p>
          <h3>Nicht trennbar? Merkmale ändern</h3>
          <p>Übung 2, Aufgabe 3(b); WS 23/24 2.4; SS 25 1.1–1.2; WS 25/26 1-3: Klasse 0 im Zentrum, Klasse 1 als Ring — keine Gerade trennt das. „Verallgemeinerte“ logistische Regression nimmt Basisfunktionen: mit $\\phi(x) = x_1^2 + x_2^2$ trennt eine Schwelle $c$, im Eingaberaum also ein Kreis mit Radius $\\sqrt c$. Bei XOR hilft $x_1x_2$.</p>
        </div>
        ${gkSelf([
          ["Keine Gerade trennt die Klassen (grün innen, rot außen). Welches Merkmal trennt durch eine einzige Schwelle: $\\phi(x) = x_1$, $\\phi(x) = x_2$ oder $\\phi(x) = x_1^2 + x_2^2$?", "$x_1^2 + x_2^2$: der quadrierte Abstand zum Ursprung — innen klein, außen groß. Die Lösung zeigt $c = 0{,}24$."],
        ])}
        ${nmTraps([
          "Linear separierbar ist eine Eigenschaft der <b>Daten mit ihren Merkmalen</b>, nicht des Modells. Neue Merkmale ändern sie.",
          "Der Score $z$ ist <b>keine</b> Wahrscheinlichkeit — erst $\\sigma(z)$.",
          "$w$ steht senkrecht auf der Grenze und zeigt zur Seite von Klasse 1.",
        ])}`,
      setup: (root) => gkWBound(root),
      check: [
        { q: "Was lernt ein diskriminatives Modell?", opts: ["Direkt $p(y \\mid x)$", "$p(x \\mid y)$ und $p(y)$", "Nur $p(x)$", "Die Konfusionsmatrix"], why: "Ein generatives Modell lernt $p(x \\mid y)$ und $p(y)$." },
        { q: "$P(S) = 0{,}1$, $P(K \\mid S) = 0{,}8$, $P(K \\mid \\neg S) = 0{,}2$. Was ist $P(S \\mid K)$?", opts: ["$\\frac{4}{13}$", "$0{,}8$", "$0{,}08$", "$\\frac12$"], why: "$\\frac{0{,}08}{0{,}08 + 0{,}18}$." },
        { q: "Wie steht $w$ zur Entscheidungsgrenze $w^\\top x + b = 0$?", opts: ["Senkrecht", "Parallel", "Im Winkel 45°", "Das hängt von $b$ ab"], why: "$b$ verschiebt die Grenze, $w$ ist ihr Normalenvektor." },
        { q: "Warum taugt der 0-1-Loss nicht zum Lernen mit Gradienten?", opts: ["Er ist stückweise konstant: der Gradient ist fast überall null", "Er ist zu groß", "Er ist nicht definiert", "Er bevorzugt Ausreißer"], why: "Kleine Änderungen ändern meist keine Entscheidung." },
        { q: "Klasse 1 innen, Klasse 0 als Ring. Welches Merkmal macht die Daten linear trennbar?", opts: ["$x_1^2 + x_2^2$", "$x_1$", "$x_1 + x_2$", "$x_2$"], why: "Eine Schwelle auf dem quadrierten Radius." },
        { q: "Warum ist der quadratische Fehler auf 0/1-Labels für Klassifikation schlecht?", opts: ["Weit entfernte, richtig liegende Punkte haben große Fehler und verschieben die Grenze", "Er ist nicht differenzierbar", "Er hat kein Minimum", "Er ignoriert Ausreißer"], why: "Der lineare Output ist nicht auf $[0, 1]$ begrenzt." },
      ],
    },
    {
      id: "3.4", title: "Logistische Regression und Kreuzentropie", short: "Logistische Regression", about: "Sigmoid, Bernoulli, Log-Odds, Likelihood → binäre Kreuzentropie",
      html: () => `
        ${nmGist([
          "Die <b>Sigmoid</b>-Funktion $\\sigma(z) = \\frac{1}{1 + e^{-z}}$ bildet den Score auf $(0, 1)$ ab: $\\sigma(0) = 0{,}5$, $\\sigma(-z) = 1 - \\sigma(z)$, streng monoton — $p \\ge 0{,}5 \\iff z \\ge 0$, die Grenze bleibt eine Gerade.",
          "<b>Logistische Regression</b> = linearer Score + Sigmoid + Bernoulli-Labels: $p_i = \\sigma(\\tilde w^\\top\\tilde x_i)$, $y_i \\mid x_i \\sim \\text{Bernoulli}(p_i)$. Die Log-Odds $\\ln\\frac{p}{1 - p} = z$ sind linear in $x$.",
          "Likelihood maximieren ⇔ <b>binäre Kreuzentropie</b> minimieren: $l_i = -y_i\\ln p_i - (1 - y_i)\\ln(1 - p_i)$, $L = \\frac1N\\sum l_i$. Eine geschlossene Lösung gibt es nicht mehr.",
        ])}
        ${tx(`p(y) = p^y(1 - p)^{1-y},\\qquad \\mathrm{Lik}(\\tilde w) = \\prod_{i=1}^N p_i^{y_i}(1 - p_i)^{1-y_i},\\qquad L(\\tilde w) = -\\frac1N\\ln\\mathrm{Lik}(\\tilde w) = \\frac1N\\sum_{i=1}^N l_i`)}
        ${pw("logreg", `${pslider("w1", "w₁", -3, 3, 0.05, 0)}${pslider("w2", "w₂", -3, 3, 0.05, 0)}${pslider("b", "b", -6, 6, 0.05, 0)}
          <div class="lw-btns">${pbtn("step", "Gradientenschritt", "primary")}${pbtn("zero", "auf 0")}</div>`, { wide: true })}
        <div class="card">
          <h3>Von der Münze zur einzelnen Mail</h3>
          <p>Bei der Münze gab es ein gemeinsames $\\pi$ für alle Würfe (${gkSee("2.8")}: $\\hat\\pi = 0{,}7$ bei 7 Kopf). Hier hängt $p_i$ vom Score der Eingabe $x_i$ ab — aber dieselben Parameter $\\tilde w$ bestimmen alle $p_i$, kein eigener Gewichtsvektor pro Mail.</p>
          <p class="small">Die Mails der Vorlesung: A $= (0, 1)$, kein Spam; B $= (3, 2)$, Spam; C $= (1, 0)$, kein Spam; D $= (4, 1)$, Spam — Anzahl Schlüsselwort 1 und 2.</p>
          <h3>Die Kreuzentropie straft sichere Fehler</h3>
          ${tx(`p = 0{,}8:\\quad l(y = 1) = -\\ln 0{,}8 \\approx 0{,}22,\\qquad l(y = 0) = -\\ln 0{,}2 \\approx 1{,}61`)}
          <p>Im Gegensatz zum quadratischen Fehler wächst der Loss ohne Grenze, je sicherer das Modell falsch liegt — und richtig liegende, weit entfernte Punkte kosten fast nichts.</p>
          <p class="small">In der Klausur (SS 24 1.4, WS 23/24 2.2, WS 24/25 2.2) heißt der Output oft $y_i$ und das Label $c_i$: $L = -\\sum_i\\big[c_i\\log\\sigma(y_i) + (1 - c_i)\\log(1 - \\sigma(y_i))\\big]$. Output-Aktivierung für binäre Klassifikation: <b>Sigmoid</b>; für Regression: linear (keine).</p>
        </div>
        ${nmTraps([
          "Minuszeichen nicht vergessen: $\\ln p < 0$, die Kreuzentropie ist $-\\ln p > 0$.",
          "Für $y = 1$ bleibt nur $-\\ln p$, für $y = 0$ nur $-\\ln(1 - p)$.",
          "Bei linear separierbaren Daten gibt es kein endliches Minimum: die Gewichte wachsen beim Lernen immer weiter (dagegen hilft Regularisierung).",
        ])}`,
      setup: (root) => gkWLogReg(root),
      check: [
        { q: "Was ist $\\sigma(0)$?", opts: ["$0{,}5$", "$0$", "$1$", "$e$"], why: "$\\frac{1}{1 + 1}$." },
        { q: "Wie lautet die binäre Kreuzentropie eines Beispiels?", opts: ["$-y\\ln p - (1 - y)\\ln(1 - p)$", "$\\frac12(y - p)^2$", "$y\\ln p + (1 - y)\\ln(1 - p)$", "$-\\ln(y - p)$"], why: "Die negative Log-Likelihood der Bernoulli-Verteilung." },
        { q: "$p = 0{,}8$, wahres Label $y = 0$. Wie groß ist der Loss etwa?", opts: ["$1{,}61$", "$0{,}22$", "$0{,}8$", "$0{,}64$"], why: "$-\\ln 0{,}2$." },
        { q: "Was ist linear in $x$ bei der logistischen Regression?", opts: ["Die Log-Odds $\\ln\\frac{p}{1 - p}$", "Die Wahrscheinlichkeit $p$", "Der Loss", "Die Kreuzentropie"], why: "$\\ln\\frac{p}{1 - p} = z = b + w^\\top x$." },
        { q: "Welche Output-Aktivierung für binäre Klassifikation?", opts: ["Sigmoid", "Linear (keine)", "ReLU", "Softmax mit einer Klasse"], why: "Werte in $(0, 1)$, als Wahrscheinlichkeit lesbar." },
        { q: "Gibt es für die logistische Regression eine geschlossene Lösung wie die Normalgleichung?", opts: ["Nein, man lernt iterativ, z. B. mit Gradientenabstieg", "Ja, $\\tilde w = (\\tilde X^\\top\\tilde X)^{-1}\\tilde X^\\top y$", "Ja, mit Softmax", "Nur für $N = 1$"], why: "Das Nullsetzen des Gradienten lässt sich nicht nach $\\tilde w$ auflösen." },
      ],
    },
    {
      id: "3.5", title: "Gradientenabstieg", short: "Gradientenabstieg", about: "Kettenregel, (p − y)x̃, Lernrate, Batch, Mini-Batch, SGD",
      html: () => `
        ${nmGist([
          "Kettenregel entlang Parameter → Score → Wahrscheinlichkeit → Loss: $\\frac{\\partial l}{\\partial p}\\cdot\\frac{\\partial p}{\\partial z}\\cdot\\nabla z = \\frac{p - y}{p(1 - p)}\\cdot p(1 - p)\\cdot\\tilde x$ — der Faktor $p(1 - p)$ kürzt sich: $\\nabla_{\\tilde w}\\,l_i = (p_i - y_i)\\,\\tilde x_i$, gemittelt $\\nabla L = \\frac1N\\tilde X^\\top(p - y)$.",
          "<b>Gradientenabstieg</b>: $\\tilde w_{t+1} = \\tilde w_t - \\eta\\nabla L(\\tilde w_t)$ — entgegen dem lokalen Anstieg, in kleinen Schritten. Initialisieren, Gradient berechnen, aktualisieren, wiederholen; Abbruch nach Budget oder Konvergenzdiagnose.",
          "Die <b>Lernrate</b> $\\eta$ entscheidet: zu klein langsam, zu groß Hin-und-her oder Divergenz. <b>Batch</b> (alle $N$), <b>Mini-Batch</b> ($B$ Beispiele, $\\lceil N/B\\rceil$ Updates pro Epoche), <b>SGD</b> (eins, $N$ Updates).",
        ])}
        ${pw("gd", `${pseg("mode", [["1d", "1D: L = 2(θ − 1)²"], ["2d", "2D: L = θ₁² + 4θ₂²"]], "1d")}
          <div class="gk-1d">${pseg("eta", [[0.1, "η = 0,1"], [0.25, "0,25"], [0.4, "0,4"], [0.5, "0,5"], [0.6, "0,6"]], 0.1)}${pslider("t", "Schritte", 0, 10, 1, 3)}</div>
          <div class="gk-2d" hidden>${pslider("eta2", "η", 0.01, 0.3, 0.005, 0.1)}</div>`, { wide: true })}
        <div class="card">
          <h3>Warum entgegen dem Gradienten?</h3>
          <p>Die partielle Ableitung sagt, wie sich der Loss ändert, wenn nur ein Parameter leicht verändert wird. Positiver Eintrag: eine kleine Erhöhung steigert den Loss; negativer: sie senkt ihn. Also in Richtung $-\\nabla L$ gehen (SS 24 2.2: an einer Skizze von $L(\\theta)$ in 1D erklären).</p>
          <h3>Ein Punkt von Hand (Vorlesung)</h3>
          ${tx(`x = \\begin{pmatrix}1\\\\1\\end{pmatrix},\\ y = 1,\\ \\tilde w = \\begin{pmatrix}0{,}5\\\\2\\\\-1\\end{pmatrix}:\\quad z = 0{,}5 + 2 - 1 = 1{,}5,\\quad p = \\sigma(1{,}5) \\approx 0{,}82,\\quad l = -\\ln p \\approx 0{,}20`)}
          ${tx(`\\nabla_{\\tilde w}\\,l = (p - 1)\\begin{pmatrix}1\\\\1\\\\1\\end{pmatrix} \\approx \\begin{pmatrix}-0{,}18\\\\-0{,}18\\\\-0{,}18\\end{pmatrix}\\ \\overset{\\eta = 1}{\\Longrightarrow}\\ \\tilde w_{\\text{neu}} \\approx \\begin{pmatrix}0{,}68\\\\2{,}18\\\\-0{,}82\\end{pmatrix},\\ z \\approx 2{,}05,\\ p \\approx 0{,}89,\\ l \\approx 0{,}12`)}
          <p class="small">Negative Komponenten: größere Parameter senken hier lokal den Loss. Die Einsenspalte liefert den Biasgradienten.</p>
          <h3>Batch, Mini-Batch und SGD</h3>
          <table class="len-terms nm-tab"><thead><tr><th>Variante</th><th>Beispiele pro Update</th><th>Updates pro Epoche</th><th>N = 1000, B = 100</th></tr></thead><tbody>
            <tr><td>Batch-GD</td><td>alle $N$</td><td>1</td><td>1</td></tr>
            <tr><td>Mini-Batch</td><td>$B$</td><td>$\\lceil N/B\\rceil$</td><td>10</td></tr>
            <tr><td>SGD</td><td>1</td><td>$N$</td><td>1000</td></tr></tbody></table>
          <p>Ein Mini-Batch <b>schätzt</b> den vollen Gradienten: Einzelgradienten $2, 4, -2, 0$ haben das Mittel $1$; die Mini-Batches $\\{2, 4\\}$ und $\\{-2, 0\\}$ geben $3$ und $-1$ — sie können in verschiedene Richtungen zeigen, im Erwartungswert aber den vollen Gradienten.
            Gleiche Updatezahl bedeutet nicht gleiches Rechenbudget: vergleichen nach Updates, verarbeiteten Beispielen oder tatsächlicher Zeit (Hardware, Parallelisierung).</p>
          ${ppFacts([
            ["Batch-GD", "+ genauer Gradient, stabile Konvergenz. − ein Update braucht alle Daten: langsam bei großem $N$, viel Speicher."],
            ["SGD / Mini-Batch", "+ viele billige Updates, das Rauschen hilft, aus flachen Stellen herauszukommen; Mini-Batches nutzen die Hardware parallel. − verrauschter Gradient, schwankender Loss, Lernrate muss oft sinken."],
          ])}
        </div>
        ${gkSelf([
          ["$y_1 = y_2 = 1$; $p_1 = 0{,}51$, $p_2 = 0{,}99$. Bei Schwelle 0,5 sind beide richtig. Liefern sie deshalb keinen Lernbeitrag mehr? Gilt die Rangfolge auch für die Norm der Gewichtsgradienten?", "Nein: die Biasableitungen sind $p - y = -0{,}49$ und $-0{,}01$ — beide ungleich null, der unsichere Punkt zählt viel mehr. Die Gewichtsgradienten $(p_i - y_i)x_i$ hängen zusätzlich von $\\|x_i\\|$ ab; die Rangfolge muss dort nicht gelten."],
          ["Was passiert bei $L(\\theta) = 2(\\theta - 1)^2$, $\\eta = 0{,}5$ und $\\theta_0 = 4$?", "$\\theta_1 = 4 - 0{,}5\\cdot12 = -2$, $\\theta_2 = -2 - 0{,}5\\cdot(-12) = 4$: es springt ewig hin und her. Die Richtung stimmt, aber die Lernrate ist zu groß."],
          ["$N = 1000$, $B = 100$: wie viele Mini-Batch-Updates hat eine Epoche?", "$\\lceil 1000/100\\rceil = 10$."],
        ])}
        ${nmTraps([
          "Minus! $\\tilde w - \\eta\\nabla L$, nicht plus.",
          "$\\eta > 0$. Bei $L = a(\\theta - c)^2$ ist der Faktor pro Schritt $1 - 2a\\eta$: Konvergenz für $0 < \\eta < \\frac1a$, ein Schritt für $\\eta = \\frac{1}{2a}$.",
          "Trainingsloss misst Optimierung, nicht automatisch Leistung auf neuen Daten.",
          "Der Gradient ist ein Spaltenvektor mit derselben Form wie $\\tilde w$; die Einzelgradienten werden genau einmal gemittelt.",
        ])}`,
      setup: (root) => gkWGD(root),
      check: [
        { q: "Was ist $\\nabla_{\\tilde w}\\,l_i$ für die logistische Regression mit Kreuzentropie?", opts: ["$(p_i - y_i)\\,\\tilde x_i$", "$(p_i - y_i)\\,p_i(1 - p_i)\\,\\tilde x_i$", "$\\tilde x_i^\\top\\tilde w$", "$-\\ln p_i\\,\\tilde x_i$"], why: "$\\sigma' = p(1 - p)$ kürzt sich gegen den Nenner von $\\partial l/\\partial p$." },
        { q: "Wie lautet ein Schritt des Gradientenabstiegs?", opts: ["$\\tilde w_{t+1} = \\tilde w_t - \\eta\\nabla L(\\tilde w_t)$", "$\\tilde w_{t+1} = \\tilde w_t + \\eta\\nabla L(\\tilde w_t)$", "$\\tilde w_{t+1} = \\eta\\nabla L$", "$\\tilde w_{t+1} = \\tilde w_t / \\nabla L$"], why: "Entgegen dem Anstieg." },
        { q: "$L = 2(\\theta - 1)^2$, $\\theta_0 = 4$, $\\eta = 0{,}1$. Was ist $\\theta_1$?", opts: ["$2{,}8$", "$2{,}08$", "$1$", "$-2$"], why: "$4 - 0{,}1\\cdot4\\cdot3 = 2{,}8$." },
        { q: "Dieselbe Funktion: mit welchem $\\eta$ ist man nach einem Schritt im Minimum?", opts: ["$0{,}25$", "$0{,}1$", "$0{,}5$", "$1$"], why: "$4 - 0{,}25\\cdot12 = 1$." },
        { q: "$N = 1000$, Mini-Batch $B = 100$. Updates pro Epoche?", opts: ["$10$", "$100$", "$1$", "$1000$"], why: "$\\lceil N/B\\rceil$." },
        { q: "Ein Vorteil von Mini-Batch gegenüber Batch-GD?", opts: ["Viele billige Updates pro Epoche, parallel auf der Hardware", "Der Gradient ist genauer", "Er braucht keine Lernrate", "Er findet immer das globale Minimum"], why: "Ein Mini-Batch schätzt den Gradienten — verrauscht, aber viel billiger." },
      ],
    },
    {
      id: "3.6", title: "Mehrere Klassen: Softmax", short: "Softmax", about: "kategorial, one-hot, Logits, Softmax, Kreuzentropie, p − y",
      html: () => `
        ${nmGist([
          "<b>Kategorial</b>: genau eine von $K$ Klassen, $P(Y = k) = p_k$, $\\sum p_k = 1$. Das Ziel als <b>one-hot</b>-Vektor $y$; vorhergesagt wird $\\arg\\max_k p_k$.",
          "<b>Softmax-Regression</b>: ein Score pro Klasse, $a_k = w_k^\\top x + b_k$ (die Logits), $p_k = \\frac{\\exp(a_k)}{\\sum_j\\exp(a_j)}$. Für $K = 2$: $p_1 = \\sigma(a_1 - a_2)$.",
          "Kategoriale Likelihood → <b>Kreuzentropie</b> $l_i = -\\sum_k y_{i,k}\\ln p_{i,k} = -\\ln p_{i,\\text{wahr}}$; Gradient nach den Scores $\\frac{\\partial l_i}{\\partial a_{i,k}} = p_{i,k} - y_{i,k}$ (zum Gewichtsgradienten gehört zusätzlich die Eingabe).",
        ])}
        ${pw("soft", `${pslider("a1", "a₁", -3, 3, 0.1, 2)}${pslider("a2", "a₂", -3, 3, 0.1, 1)}${pslider("a3", "a₃", -3, 3, 0.1, 0)}${pseg("y", [[1, "wahr: 1"], [2, "wahr: 2"], [3, "wahr: 3"]], 2)}`, { wide: true })}
        <div class="card">
          <h3>Beispiele der Vorlesung</h3>
          <p><b>Iris</b>: 150 Beispiele, 4 Merkmale (Kelch- und Kronblatt, Länge und Breite), 3 Arten. Mit $p = (0{,}6;\\, 0{,}3;\\, 0{,}1)$ und wahrer Klasse 2 ist $l = -\\ln 0{,}3 \\approx 1{,}20$ — argmax sagt Klasse 1, also falsch.</p>
          ${tx(`a = \\begin{pmatrix}2\\\\1\\\\0\\end{pmatrix}:\\ p \\approx \\begin{pmatrix}0{,}67\\\\0{,}24\\\\0{,}09\\end{pmatrix},\\quad y = \\begin{pmatrix}0\\\\1\\\\0\\end{pmatrix}:\\ l = -\\ln p_2 \\approx 1{,}41,\\quad p - y \\approx \\begin{pmatrix}0{,}67\\\\-0{,}76\\\\0{,}09\\end{pmatrix}`)}
          <h3>Was sich ändert und was gleich bleibt</h3>
          <table class="len-terms"><thead><tr><th>Baustein</th><th>Lineare Regression</th><th>Logistische / Softmax-Regression</th></tr></thead><tbody>
            <tr><td>Zielgröße</td><td>reell</td><td>diskrete Klasse</td></tr>
            <tr><td>Modell</td><td>linearer Mittelwert</td><td>lineare Scores + Sigmoid / Softmax</td></tr>
            <tr><td>Loss</td><td>SSE/(2N)</td><td>gemittelte negative Log-Likelihood</td></tr>
            <tr><td>Lernen</td><td>Normalgleichung</td><td>iterativ, z. B. Gradientenabstieg</td></tr>
            <tr><td>Gradient</td><td>$\\frac1N\\tilde X^\\top(\\hat y - y)$</td><td>$\\frac1N\\tilde X^\\top(p - y)$</td></tr></tbody></table>
          <p class="small">Ausblick VL 4: die Merkmalsabbildung $\\phi$ wird selbst lernbar — ein neuronales Netz.</p>
        </div>
        ${gkSelf([
          ["Wahre Klasse 1, Scores wie oben ($p \\approx 0{,}67;\\, 0{,}24;\\, 0{,}09$). Die Vorhersage ist richtig — ist der Kreuzentropie-Loss deshalb null?", "Nein: $l = -\\ln 0{,}67 \\approx 0{,}41 > 0$. Null wäre er nur bei $p_1 = 1$; der Gradient zieht weiter in Richtung größerer Sicherheit."],
          ["Wie wird aus $p$ eine Klasse? Welche Komponente von $p$ bestimmt den Verlust?", "argmax: der Index des größten Eintrags. Den Verlust bestimmt nur $p$ der wahren Klasse."],
        ])}
        ${nmTraps([
          "Richtige Klasse heißt nicht Loss null — nur $p_{\\text{wahr}} = 1$ gibt $l = 0$.",
          "Softmax hängt nur von den Differenzen der Scores ab: $a + c\\mathbf 1$ gibt dasselbe $p$. Beim Rechnen zieht man deshalb $\\max a$ ab, damit $\\exp$ nicht überläuft.",
          "WS 23/24 2.3: der Name ist <b>Softmax</b>, die Gleichung $\\sigma_i(f(x)) = \\frac{e^{f_i(x)}}{\\sum_k e^{f_k(x)}}$.",
        ])}`,
      setup: (root) => gkWSoftmax(root),
      check: [
        { q: "$a = (2, 1, 0)$: welche Klasse wird vorhergesagt?", opts: ["Klasse 1", "Klasse 2", "Klasse 3", "Keine"], why: "argmax der Softmax ist argmax der Scores." },
        { q: "Wie lautet die Kreuzentropie mit one-hot-Ziel?", opts: ["$-\\ln p_{\\text{wahr}}$", "$-\\sum_k\\ln p_k$", "$1 - p_{\\text{wahr}}$", "$\\sum_k (p_k - y_k)^2$"], why: "Genau ein Summand bleibt." },
        { q: "Was ist $\\frac{\\partial l}{\\partial a_k}$?", opts: ["$p_k - y_k$", "$p_k(1 - p_k)$", "$-\\frac{1}{p_k}$", "$a_k - y_k$"], why: "Wie bei der logistischen Regression: Vorhersage minus Ziel." },
        { q: "Für $K = 2$ ist die Softmax …", opts: ["die Sigmoid der Scoredifferenz: $p_1 = \\sigma(a_1 - a_2)$", "eine Gerade", "die ReLU", "nicht definiert"], why: "$\\frac{e^{a_1}}{e^{a_1} + e^{a_2}} = \\frac{1}{1 + e^{-(a_1 - a_2)}}$." },
        { q: "Alle Scores werden um 5 erhöht. Was passiert mit $p$?", opts: ["Nichts", "Alle $p_k$ steigen", "Die größte Klasse wird sicherer", "Die Summe wird größer als 1"], why: "$e^{a_k + 5} = e^5e^{a_k}$ kürzt sich." },
        { q: "Wahre Klasse richtig vorhergesagt mit $p_{\\text{wahr}} = 0{,}67$. Der Loss ist …", opts: ["$\\approx 0{,}41$", "$0$", "$0{,}67$", "$1$"], why: "$-\\ln 0{,}67$." },
      ],
    },
  ],
});
