// NuMa chapters 1–3, from the Skript and the lectures VL03 (Kapitel 1), VL02, VL04, VL05, VL06
// (Kapitel 2) and VL01 (Kapitel 3). The drawings: a small floating-point system on a number line,
// Archimedes' two recursions for π run in double precision, ((1 + x) − 1)/x near eps, the condition
// of a sum, the LR decomposition with column pivoting step by step, the Cholesky factor row by row,
// a Householder reflection with both choices of sign, an ill-conditioned 2 × 2 system, least squares
// with residuals, the SVD as a circle mapped to an ellipse, and Newton's method in 1D and 2D.

/* ================================================================ Kapitel 1 */

/* ---------------------------------------------------------------- 1.1 Gleitpunktzahlen */

// The positive numbers of FL for base B, mantissa length Lm, exponent digits Le and emin.
function nmFloatSet({ B, Lm, Le, emin }) {
  const emax = emin + B ** Le - 1, out = [];
  for (let e = emin; e <= emax; e++) for (let M = B ** (Lm - 1); M < B ** Lm; M++) out.push(M * B ** (e - Lm));
  return { emax, nums: out, max: B ** emax * (1 - B ** -Lm), min: B ** (emin - 1), eps: B ** (1 - Lm) / 2 };
}
// fl(x) as in the lecture: cut after Lm digits and round up when the next digit is ≥ B/2.
function nmFl(x, { B, Lm, Le, emin }) {
  const emax = emin + B ** Le - 1, max = B ** emax * (1 - B ** -Lm), min = B ** (emin - 1);
  if (x === 0) return { v: 0 };
  if (Math.abs(x) < min) return { v: 0, under: true };
  if (Math.abs(x) > max) return { v: Math.sign(x) * Infinity, over: true };
  const a = Math.abs(x);
  let e = Math.floor(Math.log(a) / Math.log(B) + 1e-12) + 1;
  if (B ** (e - 1) > a * (1 + 1e-12)) e--;
  if (B ** e <= a * (1 - 1e-12)) e++;
  const m = a * B ** (Lm - e), Mi = Math.floor(m + 1e-9), next = Math.floor((m - Mi) * B + 1e-9);
  const v = (next >= B / 2 ? Mi + 1 : Mi) * B ** (e - Lm);
  return { v: Math.sign(x) * v, e, digits: Mi.toString(B).padStart(Lm, "0"), next, emax };
}

function nmWFloat(root) {
  const { w, fig, read } = ppW(root, "fl");
  const st = { B: 2, Lm: 3, Le: 3, emin: -4, x: 44, log: 0 };
  const draw = () => {
    if (st.B === 3 && st.Le > 2) st.Le = 2;
    const F = nmFloatSet(st), x = (st.x / 100) * F.max * 1.08;
    const W = 560, H = 120, pad = 20;
    const lo = F.min / st.B, hi = F.max * 1.1;
    const X = st.log ? (v) => pad + (Math.log(v / lo) / Math.log(hi / lo)) * (W - 2 * pad) : (v) => pad + (v / hi) * (W - 2 * pad);
    const f = nmFl(x, st);
    const marks = F.nums.map((v) => `<line x1="${X(v).toFixed(1)}" y1="46" x2="${X(v).toFixed(1)}" y2="${Math.abs(v - 1) < 1e-12 || Math.abs(Math.log(v) / Math.log(st.B) % 1) < 1e-9 ? 70 : 62}" class="nm-tickfl"/>`).join("");
    const ints = st.log ? [] : Array.from({ length: Math.floor(hi) + 1 }, (_, i) => i).filter((i) => hi < 12 || i % Math.ceil(hi / 10) === 0);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Positive Gleitpunktzahlen auf dem Zahlenstrahl">
      <line x1="${pad}" y1="62" x2="${W - pad}" y2="62" class="tick"/>${marks}
      ${ints.map((i) => `<text x="${X(i)}" y="88" text-anchor="middle" class="tick-t">${i}</text>`).join("")}
      ${st.log ? `<text x="${pad}" y="88" class="tick-t">${nmD(lo, 4)}</text><text x="${W - pad}" y="88" text-anchor="end" class="tick-t">${nmD(hi, 2)}</text>` : ""}
      ${x > 0 && (!st.log || x > lo) ? `<line x1="${X(x)}" y1="22" x2="${X(x)}" y2="62" class="nm-xline"/><text x="${X(x)}" y="16" text-anchor="middle" class="nm-approx-t">x</text>` : ""}
      ${f.v > 0 && isFinite(f.v) ? `<circle cx="${X(f.v)}" cy="62" r="5.5" class="nm-flpt"/><text x="${X(f.v)}" y="108" text-anchor="middle" class="nm-exact-t">fl(x)</text>` : ""}
      <text x="${X(F.min)}" y="36" text-anchor="middle" class="cap">min</text><text x="${X(F.max)}" y="36" text-anchor="middle" class="cap">max</text>
    </svg>`;
    ["B", "Lm", "Le", "emin"].forEach((k) => lenOut(w, k, st[k]));
    lenOut(w, "x", nmD(x, 3));
    $$('[data-seg="Le"] button', w).forEach((b) => (b.disabled = st.B === 3 && b.dataset.v === "3"));
    const rel = f.v && isFinite(f.v) ? Math.abs(x - f.v) / x : null;
    read.innerHTML = `<div class="lw-vals">
        <span>${mi("e")}<sub>max</sub> = ${mi("e")}<sub>min</sub> + ${mi("B")}<sup>${mi("L")}<sub>e</sub></sup> − 1</span><b>${F.emax}</b>
        <span>max FL</span><b>${nmD(F.max, 4)}</b><span>min FL<sup>+</sup></span><b>${nmD(F.min, 5)}</b>
        <span>eps = ½${mi("B")}<sup>1−${mi("L")}<sub>m</sub></sup></span><b>${nmD(F.eps, 4)}</b>
        <span>positive Zahlen</span><b>${F.nums.length}</b></div>
      <p class="small">${f.under ? `x liegt unter min FL<sup>+</sup>: <b>Underflow</b>, fl(x) = 0.` : f.over ? `x liegt über max FL: <b>Overflow</b>, fl(x) = ∞.` :
        `x = ${nmD(x, 4)} = (0.${f.digits}<span class="nm-err">${f.next}</span>…)<sub>${st.B}</sub> · ${st.B}<sup>${f.e}</sup> → die nächste Ziffer ${f.next} ist ${f.next >= st.B / 2 ? "≥" : "&lt;"} B/2, also
        fl(x) = <b class="nm-exact">${nmD(f.v, 5)}</b>. Relativer Fehler ${nmD(rel, 4)} ≤ eps.`}</p>
      <p class="small muted">Die Abstände wachsen mit jedem Exponenten um den Faktor ${st.B} — relativ bleibt die Genauigkeit gleich.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.2 Rundung und Auslöschung */

// Archimedes: π ≈ n·gₙ/2 with the two recursions of the lecture, in IEEE double precision.
function nmWPi(root) {
  const { w, fig, read } = ppW(root, "pi");
  const st = { rec: 1 };
  const rows = [];
  let n = 6, g1 = 1, g2 = 1;
  for (let k = 0; k <= 29; k++) {
    rows.push({ k, n, p1: (n * g1) / 2, p2: (n * g2) / 2 });
    g1 = Math.sqrt(2 - Math.sqrt(4 - g1 * g1));
    g2 = g2 / Math.sqrt(2 + Math.sqrt(4 - g2 * g2));
    n *= 2;
  }
  const draw = () => {
    const P = nmFrame(520, 220, [0, 29], [-16.5, 1]);
    const err = (p) => Math.log10(Math.max(Math.abs(p - Math.PI), 1e-16));
    const line = (key, cls) => `<polyline points="${rows.map((r) => `${P.X(r.k).toFixed(1)},${P.Y(err(r[key])).toFixed(1)}`).join(" ")}" class="curve ${cls}"/>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 220" role="img" aria-label="Fehler der beiden Rekursionen">
      ${P.axes({ xl: "Verdopplungen k (n = 6 · 2^k)", yl: "log₁₀ |πₙ − π|", yt: [-15, -10, -5, 0] })}
      ${line("p1", "nm-err-c" + (st.rec === 1 ? "" : " dim"))}${line("p2", "nm-approx-c" + (st.rec === 2 ? "" : " dim"))}
      <text x="${P.X(20)}" y="${P.Y(-3)}" class="cap">Rekursion (1)</text><text x="${P.X(20)}" y="${P.Y(-15.5)}" class="cap">Rekursion (2)</text></svg>
      <div class="nm-scroll"><table class="len-terms nm-tab"><thead><tr><th>n</th><th>πₙ</th><th>|πₙ − π|</th></tr></thead><tbody>
        ${rows.filter((r) => r.k >= 12).map((r) => { const p = st.rec === 1 ? r.p1 : r.p2; return `<tr><td>${r.n.toLocaleString("de-DE")}</td><td><code>${p.toFixed(15).replace(".", ",")}</code></td><td class="${Math.abs(p - Math.PI) > 1e-9 ? "nm-err" : ""}">${nmSci(Math.abs(p - Math.PI))}</td></tr>`; }).join("")}
      </tbody></table></div>`;
    read.innerHTML = st.rec === 1
      ? `${F(`g<sub>2n</sub> = ${sq(`2 − ${sq("4 − g<sub>n</sub><sup>2</sup>")}`)}`, "small-f")}
        <p class="small">Für großes n ist g<sub>n</sub> winzig, also ${sq("4 − g<sub>n</sub><sup>2</sup>")} ≈ 2: es werden <b>fast gleich große Zahlen voneinander abgezogen</b>. Bis etwa 10⁻⁸ wird der Fehler kleiner, danach wächst er — am Ende kommt sogar 0 heraus.</p>`
      : `${F(`g<sub>2n</sub> = ${frac("g<sub>n</sub>", sq(`2 + ${sq("4 − g<sub>n</sub><sup>2</sup>")}`))}`, "small-f")}
        <p class="small">Mathematisch dieselbe Zahl (mit der dritten binomischen Formel erweitert), aber nur noch eine <b>Addition</b> positiver Zahlen: keine Auslöschung, der Fehler sinkt bis auf Maschinengenauigkeit.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

// ((1 + x) − 1)/x for 0 < x ≤ 10⁻¹⁵, evaluated in double precision (exercise sheet 2 and WS 17/18).
function nmWOnePlus(root) {
  const { w, fig, read } = ppW(root, "onex");
  const st = { zoom: 1 };
  const draw = () => {
    const xmax = st.zoom ? 1e-15 : 4e-16;
    const P = nmFrame(520, 220, [0, xmax], [0, 2.2]);
    let d = "";
    const N = 1600;
    for (let i = 1; i <= N; i++) {
      const x = (xmax * i) / N, y = ((1 + x) - 1) / x;
      d += `${i === 1 ? "M" : Math.abs(y - (((1 + (xmax * (i - 1)) / N) - 1) / ((xmax * (i - 1)) / N))) > 0.3 ? "M" : "L"}${P.X(x).toFixed(1)},${P.Y(y).toFixed(1)}`;
    }
    const ticks = st.zoom ? [0, 2e-16, 4e-16, 6e-16, 8e-16, 1e-15] : [0, 1e-16, 2e-16, 3e-16, 4e-16];
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 220" role="img" aria-label="Graph von ((1 + x) − 1)/x">
      <line x1="34" y1="${P.Y(0)}" x2="508" y2="${P.Y(0)}" class="tick"/><line x1="34" y1="12" x2="34" y2="${P.Y(0)}" class="tick"/>
      ${ticks.map((t) => `<text x="${P.X(t)}" y="${P.Y(0) + 16}" text-anchor="middle" class="tick-t">${t ? nmD(t * 1e16, 0) : 0}</text>`).join("")}
      ${[0, 1, 2].map((t) => `<text x="28" y="${P.Y(t) + 4}" text-anchor="end" class="tick-t">${t}</text><line x1="34" y1="${P.Y(t)}" x2="508" y2="${P.Y(t)}" class="guide"/>`).join("")}
      <text x="508" y="${P.Y(0) - 6}" text-anchor="end" class="ax-t">x · 10⁻¹⁶</text>
      <path d="${d}" class="curve nm-approx-c"/>
      <line x1="${P.X(2 ** -53)}" y1="12" x2="${P.X(2 ** -53)}" y2="${P.Y(0)}" class="guide nm-err-g"/><text x="${P.X(2 ** -53) + 4}" y="22" class="cap">eps/2 = 2⁻⁵³</text>
    </svg>`;
    read.innerHTML = `<ul class="small nm-ul">
      <li><b>Links 0:</b> für x &lt; 2⁻⁵³ ≈ 1,1 · 10⁻¹⁶ rundet 1 + x auf 1, also (1 + x) − 1 = 0.</li>
      <li><b>Sprung auf 2:</b> ab x = 2⁻⁵³ rundet 1 + x auf 1 + 2⁻⁵² (die nächste Zahl nach 1); der Zähler ist 2⁻⁵², bei x = 2⁻⁵³ also 2.</li>
      <li><b>Dazwischen:</b> der Zähler bleibt 2⁻⁵², der Wert fällt wie 2⁻⁵²/x — eine Hyperbel.</li>
      <li><b>Zweiter Sprung</b> bei x = 3 · 2⁻⁵³: von 2/3 auf 4/3, weil 1 + x nun auf 1 + 2 · 2⁻⁵² rundet.</li></ul>
      <p class="small muted">Gerechnet von diesem Browser, in IEEE double precision wie Python.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.3 Kondition und Stabilität */

function nmWSum(root) {
  const { w, fig, read } = ppW(root, "sum");
  const st = { y: -80 };
  const draw = () => {
    const x = 1, y = st.y / 100, kappa = (Math.abs(x) + Math.abs(y)) / Math.abs(x + y);
    lenOut(w, "y", nmD(y, 2));
    const P = nmFrame(520, 200, [-1.5, 1.5], [0, 12]);
    const f = (t) => (1 + Math.abs(t)) / Math.abs(1 + t);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 200" role="img" aria-label="Verstärkungsfaktor der Addition">
      ${P.axes({ xl: "y (bei x = 1)", yl: "(|x| + |y|) / |x + y|", yt: [1, 4, 8, 12] })}
      <line x1="${P.X(-1)}" y1="12" x2="${P.X(-1)}" y2="174" class="guide nm-err-g"/>
      <path d="${P.path(f, 600)}" class="curve nm-err-c"/>
      <circle cx="${P.X(y)}" cy="${P.Y(Math.min(kappa, 12))}" r="6" class="pt nm-piv-pt"/></svg>`;
    read.innerHTML = `${F(`${frac(`|x̃ + ỹ − (x + y)|`, `|x + y|`)} ≤ ${frac(`|x| + |y|`, `|x + y|`)} · ε = <b>${kappa > 1e6 ? "∞" : nmD(kappa, 2)}</b> · ε`, "small-f")}
      <p class="small">${y >= 0 ? "Gleiches Vorzeichen: der Faktor ist 1 — <b>gut konditioniert</b>." : kappa < 3 ? "Verschiedene Vorzeichen, aber noch harmlos." :
        `x ≈ −y: der relative Fehler kann sich um das <b>${nmD(kappa, 0)}-fache</b> verstärken. Etwa ${nmD(Math.log10(kappa), 1)} Dezimalstellen gehen verloren — <b>Auslöschung</b>.`}</p>
      <p class="small muted">Die Gleitpunktaddition selbst ist trotzdem stabil: fl(x + y) hat einen relativen Fehler ≤ eps. Schuld ist das Problem, nicht der Algorithmus.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

NUMA_CHAPTERS.push({
  n: 1, vl: "VL03", title: "Gleitpunktrechnung, Kondition, Stabilität", next: "Direkte Verfahren für LGS",
  headline: "Gleitpunkt<span class=\"accent\">rechnung</span>",
  intro: "Ein Computer rechnet mit endlich vielen Zahlen. Wie diese Zahlen aussehen, wie groß der Rundungsfehler höchstens ist, warum das Abziehen fast gleicher Zahlen gefährlich ist — und wie man trennt, was am Problem liegt (Kondition) und was am Verfahren (Stabilität).",
  sections: [
    {
      id: "1.1", title: "Gleitpunktzahlen", short: "Gleitpunktzahlen", about: "FL, normalisiert, emax, max FL, min FL⁺, eps, fl(x)",
      html: () => `
        ${nmGist([
          `Eine Gleitpunktzahl ist $m\\cdot B^e = \\pm(0.a_1a_2\\cdots a_{L_m})_B\\cdot B^e$, <b>normalisiert</b> heißt $a_1 \\neq 0$.`,
          `Vier Größen legen alles fest: Basis $B$, Mantissenlänge $L_m$, Exponentenlänge $L_e$ und kleinster Exponent $e_{\\min}$.`,
          `Der relative Rundungsfehler ist höchstens <b>$\\eps = \\tfrac12 B^{1-L_m}$</b>: $\\fl(x) = x(1+\\varepsilon)$ mit $|\\varepsilon| \\le \\eps$.`,
        ])}
        <div class="card">
          <h3>Aufbau</h3>
          ${tx(`e = e_{\\min} + \\sum_{l=0}^{L_e-1} c_l B^l, \\qquad m = \\pm\\sum_{l=1}^{L_m} a_l B^{-l}, \\qquad a_l, c_l \\in \\{0,\\dots,B-1\\}`)}
          <p>Die Menge $\\FL^+$ enthält alle positiven normalisierten Zahlen dieser Form, $\\FL = -\\FL^+ \\cup \\{0\\} \\cup \\FL^+$. Sie ist <b>endlich</b> und liegt in $\\mathbb{Q}$. Aus der Normalisierung folgt $B^{-1} \\le |m| < 1$.</p>
          ${ppFacts([
            ["größter Exponent", `$e_{\\max} = e_{\\min} + B^{L_e} - 1$`],
            ["größte Zahl", `$\\max\\FL = B^{e_{\\max}}\\,(1 - B^{-L_m})$ <span class="small muted">— alle Ziffern $B-1$</span>`],
            ["kleinste positive Zahl", `$\\min\\FL^+ = B^{e_{\\min}-1}$ <span class="small muted">— Mantisse $(0.10\\cdots0)_B = B^{-1}$</span>`],
            ["IEEE double", `$B = 2$, 64 Bit: 1 Vorzeichen, 11 Exponent, 52 Mantisse; $e_{\\min} = -1022$, $\\max\\FL \\approx 10^{308}$, $\\min\\FL^+ \\approx 10^{-308}$, $\\eps = 2^{-52} \\approx 2{,}2\\cdot 10^{-16}$.`],
          ])}
          <p><b>Runden.</b> Zu $x = B^e(0.a_1\\cdots a_{L_m}a_{L_m+1}\\cdots)_B$ wird nach $L_m$ Ziffern abgeschnitten und aufgerundet, falls $a_{L_m+1} \\ge B/2$. Unter $\\min\\FL^+$ liefert $\\fl$ die $0$ (Underflow), über $\\max\\FL$ den Wert $\\pm\\infty$ (Overflow).</p>
          <p><b>Beispiel</b> (WS 24/25): $B = 3$, $e_{\\min} = -12$, $L_m = 5$, $L_e = 3$ gibt $e_{\\max} = -12 + 27 - 1 = 14$. Für $x = 96{,}6 = (10120{,}1210\\ldots)_3$ ist die sechste Ziffer $1 < 1{,}5$, also $\\fl(96{,}6) = (0.10120)_3\\cdot 3^5 = 96$.</p>
        </div>
        ${pw("fl", `
          ${pseg("B", [[2, "B = 2"], [3, "B = 3"]], 2)}
          ${pseg("Lm", [[2, "L<sub>m</sub> = 2"], [3, "3"], [4, "4"]], 3)}
          ${pseg("Le", [[1, "L<sub>e</sub> = 1"], [2, "2"], [3, "3"]], 3)}
          ${pslider("emin", "e<sub>min</sub>", -4, 0, 1, -4)}
          ${pslider("x", "x", 1, 100, 0.1, 44)}
          ${pseg("log", [[0, "linear"], [1, "logarithmisch"]], 0)}`, { wide: true })}
        <p class="small muted">Die Einstellung zu Beginn ist das Beispiel der Vorlesung ($B = 2$, $e_{\\min} = -4$, $L_m = 3$, $L_e = 3$). Lange Striche: Potenzen von $B$.</p>
        ${nmTraps([
          `$\\min\\FL^+ = B^{e_{\\min}-1}$, nicht $B^{e_{\\min}}$: die kleinste Mantisse ist $B^{-1}$.`,
          `$e_{\\max}$ hängt von $L_e$ ab, nicht von $L_m$. Erst $B^{L_e}$ Exponenten, dann $-1$.`,
          `Die Gleitpunktzahlen sind <b>nicht gleichmäßig</b> verteilt: absolut wachsen die Abstände, relativ sind sie gleich. $1 + 2\\eps$ ist hier die nächste Zahl nach $1$ (bei IEEE $1 + \\eps$).`,
          `Vorteil von $B = 2$ (SS 24): $a_1 = 1$ ist immer gleich und muss nicht gespeichert werden — ein Bit Mantisse gewonnen (hidden bit).`,
        ])}`,
      setup: (root) => nmWFloat(root),
      check: [
        { q: `$B = 2$, $L_m = 3$, $L_e = 2$, $e_{\\min} = -1$. Was ist $e_{\\max}$?`, opts: ["$2$", "$3$", "$4$", "$1$"], why: `$e_{\\max} = e_{\\min} + B^{L_e} - 1 = -1 + 4 - 1 = 2$.` },
        { q: `Was ist $\\min\\FL^+$ für $B = 10$, $e_{\\min} = -5$?`, opts: ["$10^{-6}$", "$10^{-5}$", "$10^{-4}$", "$0{,}5\\cdot 10^{-5}$"], why: `$\\min\\FL^+ = B^{e_{\\min}-1} = 10^{-6}$: Mantisse $0.1$, Exponent $-5$.` },
        { q: "Was gilt für die Maschinengenauigkeit eps?", opts: ["$|x - \\fl(x)|/|x| \\le \\eps$ für $x$ im darstellbaren Bereich", "$\\eps$ ist die kleinste positive Gleitpunktzahl", "$|x - \\fl(x)| \\le \\eps$ für alle $x$", "$\\eps$ hängt vom Exponenten ab"], why: "$\\eps$ ist eine Schranke des <b>relativen</b> Fehlers. Die kleinste positive Zahl ist $\\min\\FL^+$ — viel kleiner." },
        { q: "Was passiert mit $x = 10^{-400}$ in IEEE double?", opts: ["Underflow: $\\fl(x) = 0$", "Overflow: $\\fl(x) = \\infty$", "$\\fl(x) = \\min\\FL^+$", "$\\fl(x) = x(1+\\varepsilon)$ mit $|\\varepsilon| \\le \\eps$"], why: "$\\min\\FL^+ \\approx 10^{-308}$; kleinere Beträge werden zu $0$." },
      ],
    },
    {
      id: "1.2", title: "Rundung, Arithmetik und Auslöschung", short: "Auslöschung", about: "x ⊕ y = fl(x + y), nicht assoziativ, Archimedes' π, (1 + x) − 1",
      html: () => `
        ${nmGist([
          `Jede Operation wird gerundet: $x \\mathbin{\\hat\\circ} y := \\fl(x\\circ y) = (x\\circ y)(1+\\varepsilon)$, $|\\varepsilon| \\le \\eps$.`,
          `Gleitpunktoperationen sind <b>nicht assoziativ</b>: $(a+b)+c$ kann etwas anderes ergeben als $a+(b+c)$.`,
          `<b>Auslöschung</b>: werden fast gleich große Zahlen voneinander abgezogen, heben sich die richtigen führenden Stellen weg und die Rundungsfehler bleiben übrig.`,
        ])}
        <div class="card">
          <h3>Das Beispiel der Vorlesung: π nach Archimedes</h3>
          <p>Ein regelmäßiges $n$-Eck im Einheitskreis hat den halben Umfang $\\pi_n = n g_n/2$ mit der Seitenlänge $g_n$; $g_6 = 1$. Mit zweimal Pythagoras folgt eine Rekursion für die Verdopplung — und dieselbe Formel lässt sich auf zwei Arten schreiben.</p>
          ${tx(`(1)\\quad g_{2n} = \\sqrt{2 - \\sqrt{4 - g_n^2}} \\qquad\\qquad (2)\\quad g_{2n} = \\frac{g_n}{\\sqrt{2 + \\sqrt{4 - g_n^2}}}`)}
        </div>
        ${pw("pi", pseg("rec", [[1, "Rekursion (1)"], [2, "Rekursion (2)"]], 1), { wide: true })}
        <div class="card">
          <h3>$((1 + x) - 1)/x$ in der Nähe von eps</h3>
          <p>Mathematisch ist der Ausdruck immer $1$. Der Rechner liefert ein ganz anderes Bild (Übungsblatt 2, WS 17/18 Aufgabe 3):</p>
        </div>
        ${pw("onex", pseg("zoom", [[1, "0 bis 10⁻¹⁵"], [0, "0 bis 4 · 10⁻¹⁶"]], 1), { wide: true })}
        ${nmTraps([
          `Auslöschung ist ein Problem der <b>Kondition</b> ($x - y$ für $x \\approx y$), nicht der Stabilität: die Subtraktion selbst rechnet mit relativem Fehler $\\le \\eps$.`,
          `Abhilfe ist eine mathematisch gleiche, aber auslöschungsfreie Formel — wie Rekursion (2), oder das Vorzeichen beim Householder-Vektor (${nmSee("2.3")}).`,
          `Abbruchkriterium <code>while s != s_alt</code> bei einer Reihe (WS 22/23): funktioniert nur, weil ab einem $k$ der Summand unter $\\eps\\cdot s$ fällt und $s$ sich nicht mehr ändert.`,
          `Overflow vermeiden (SS 22): $\\sqrt{x^2+y^2} = |x|\\sqrt{1 + (y/x)^2}$ mit $|x| \\ge |y|$ — so wird nie $x^2$ gebildet.`,
        ])}`,
      setup: (root) => { nmWPi(root); nmWOnePlus(root); },
      check: [
        { q: "Warum versagt Rekursion (1) für großes $n$?", opts: ["$2$ und $\\sqrt{4 - g_n^2}$ sind fast gleich: Auslöschung", "Overflow, weil $n$ so groß wird", "Die Rekursion ist mathematisch falsch", "Wurzeln werden ungenau berechnet"], why: "$g_n \\to 0$, also $\\sqrt{4 - g_n^2} \\to 2$. Die Differenz verliert ihre richtigen Stellen." },
        { q: "Was liefert ein IEEE-Rechner für $(1 + 10^{-17}) - 1$?", opts: ["$0$", "$10^{-17}$", "$2{,}2\\cdot 10^{-16}$", "$1$"], why: "$10^{-17} < 2^{-53}$, also rundet $1 + 10^{-17}$ auf $1$." },
        { q: "Welche Aussage über Gleitpunktoperationen stimmt?", opts: ["$x \\oplus y = (x+y)(1+\\varepsilon)$ mit $|\\varepsilon| \\le \\eps$", "Sie sind assoziativ", "Die Subtraktion fast gleicher Zahlen ist instabil", "$x \\oplus y = x + y$, wenn $x, y \\in \\FL$"], why: "Jedes Ergebnis wird gerundet. Selbst bei $x, y \\in \\FL$ ist $x + y$ meist nicht in $\\FL$." },
        { q: "Ein Rechner hat $\\eps = 10^{-10}$. Ist $1 + 10^{-7}\\cdot 10^{-7}$ größer als $1$?", opts: ["Nein, gleich $1$: $10^{-14} < \\eps$", "Ja, $1 + 10^{-14}$", "Ja, weil $10^{-14}$ darstellbar ist", "Nein, kleiner als $1$"], why: "SS 17: $10^{-14}$ ist zwar darstellbar, aber $1 + 10^{-14}$ rundet auf $1$. $1 + 10^{-7}$ dagegen ist größer als $1$." },
      ],
    },
    {
      id: "1.3", title: "Fehlerquellen, Kondition und Stabilität", short: "Kondition & Stabilität", about: "Eingabe-, Rundungs-, Approximationsfehler; gut/schlecht konditioniert; stabil",
      html: () => `
        ${nmGist([
          `<b>Kondition</b> gehört zum <b>Problem</b>: wie stark wirken sich Fehler in den Daten auf das Ergebnis aus? Sie misst die unvermeidbare Fehlerverstärkung.`,
          `<b>Stabilität</b> gehört zum <b>Verfahren</b>: es ist stabil, wenn es Fehler nur moderat verstärkt — gemessen an der Kondition und am Aufwand.`,
          `Die Summe zweier Zahlen ist gut konditioniert bei gleichem Vorzeichen und schlecht bei $x \\approx -y$.`,
        ])}
        <div class="card">
          <h3>Fehlerquellen</h3>
          ${ppFacts([
            ["Eingabefehler", "Messfehler, verrauschte Daten, schon gerundete Eingaben."],
            ["Rundungsfehler", "Jede Gleitpunktoperation rundet."],
            ["Approximationsfehler", "Ein iteratives Verfahren liefert nur eine Näherung (Newton, cg)."],
            ["Diskretisierungsfehler", "Ein kontinuierliches Problem wird diskret ersetzt (Integral durch Quadraturformel)."],
            ["Fehlerverstärkung", "durch das Problem (Kondition) und durch das Verfahren (Stabilität)."],
          ])}
          <h3>Kondition der Summe</h3>
          <p>Mit relativ gestörten Daten $\\tilde x = x(1+\\varepsilon_x)$, $\\tilde y = y(1+\\varepsilon_y)$, $|\\varepsilon_x|, |\\varepsilon_y| \\le \\varepsilon$:</p>
          ${tx(`\\frac{|\\tilde x + \\tilde y - (x+y)|}{|x+y|} = \\frac{|x\\varepsilon_x + y\\varepsilon_y|}{|x+y|} \\le \\varepsilon\\,\\frac{|x|+|y|}{|x+y|}`)}
          <p>Beispiel der Vorlesung: $x = 0{,}987654379$, $y = -0{,}987654341$ gibt $x + y = 3{,}8\\cdot 10^{-8}$ und den Faktor $\\approx 5\\cdot 10^7$.</p>
          <h3>Stabilität der Grundrechenarten</h3>
          ${tx(`\\frac{|x \\mathbin{\\hat\\circ} y - (x\\circ y)|}{|x\\circ y|} = |\\varepsilon| \\le \\eps`)}
          <p>Jede einzelne Gleitpunktoperation ist also stabil — auch die Subtraktion fast gleicher Zahlen. Instabil wird ein Algorithmus erst, wenn er ein gut konditioniertes Problem über einen schlecht konditionierten Zwischenschritt löst (Rekursion (1)).</p>
        </div>
        ${pw("sum", pslider("y", "y", -150, 150, 1, -80), { wide: true })}
        ${nmTraps([
          "Schlecht konditioniert ≠ instabil. „Instabil“ sagt man über Algorithmen, „schlecht konditioniert“ über Probleme.",
          "Ein Algorithmus heißt <b>instabil</b>, wenn er unvermeidbare Fehler in den Daten unverhältnismäßig verstärkt (Lückentext SS 20).",
          `Kondition eines Matrix-Problems: $\\cond(A) = \\|A\\|\\,\\|A^{-1}\\|$ (${nmSee("2.4")}).`,
        ])}`,
      setup: (root) => nmWSum(root),
      check: [
        { q: "Wann ist die Addition $x + y$ schlecht konditioniert?", opts: ["Wenn $x \\approx -y$", "Wenn $x$ und $y$ sehr groß sind", "Wenn $x \\approx y$", "Wenn $x$ oder $y$ negativ ist"], why: "Der Faktor $(|x|+|y|)/|x+y|$ wird groß, wenn sich $x$ und $y$ fast aufheben." },
        { q: "Was beschreibt die Kondition?", opts: ["Wie empfindlich die Lösung des Problems auf Datenfehler reagiert", "Wie viele Operationen ein Verfahren braucht", "Ob ein Verfahren Rundungsfehler verstärkt", "Wie schnell ein Verfahren konvergiert"], why: "Kondition = Eigenschaft des Problems, unabhängig vom Algorithmus." },
        { q: "Ist die Gleitpunktsubtraktion zweier fast gleicher Zahlen stabil?", opts: ["Ja: der relative Fehler ist $\\le \\eps$", "Nein, wegen Auslöschung", "Nur bei $B = 2$", "Nur wenn das Ergebnis darstellbar ist"], why: "Die Operation rundet das exakte Ergebnis der Daten. Gefährlich sind die schon vorher fehlerhaften Daten (Kondition)." },
        { q: "Ein Verfahren liefert für ein gut konditioniertes Problem riesige Fehler. Es ist …", opts: ["instabil", "schlecht konditioniert", "nicht konvergent", "exakt"], why: "Die Kondition des Problems ist gut, also liegt die Fehlerverstärkung am Verfahren." },
      ],
    },
  ],
});

/* ================================================================ Kapitel 2 */

/* ---------------------------------------------------------------- 2.1 LR-Zerlegung */

const NM_LR_PRESETS = {
  vl: [[1, 2, 2], [-2, -2, 4], [2, 4, 2]],
  ss26: [[0, 1, 2], [2, 4, 6], [1, 4, 5]],
  ws2425: [[1, -2, -8], [-1, -1, 0], [2, 4, 8]],
  ws2223: [[0, 3, 2], [8, 4, 0], [4, 14, 4]],
};
// A random 3 × 3 matrix whose LR decomposition with pivoting has small fractions and at least one swap.
function nmNiceLR(n = 3) {
  for (let t = 0; t < 4000; t++) {
    const A = Array.from({ length: n }, () => Array.from({ length: n }, () => rint(-4, 8)));
    const r = nmLRSteps(A);
    if (r.singular) continue;
    const all = [...r.L.flat(), ...r.R.flat()];
    if (all.every((x) => x.d <= 4 && Math.abs(x.n) <= 24) && r.perm.some((p, i) => p !== i + 1) && all.filter((x) => x.d > 1).length >= 1) return A;
  }
  return NM_LR_PRESETS.vl;
}

// The lecture's scheme: original row numbers on the left, ℓ where the zeros would be.
function nmLRScheme(s, n) {
  const hl = {};
  s.M.forEach((r, i) => r.forEach((_, j) => {
    if (s.ell[i][j]) hl[i + "," + j] = "nm-ell";
    if (s.phase === "pivot" && j === s.k && i >= s.k) hl[i + "," + j] = i === s.piv ? "nm-piv" : "nm-cand";
    if (s.phase !== "pivot" && s.k >= 0 && i === s.k && j >= s.k) hl[i + "," + j] = "nm-piv";
  }));
  return `<span class="nm-lr">${cv(s.perm.map((p) => `<span class="nm-perm">${p}</span>`), { cls: "nm-plain" })}${qmx(s.M, { hl })}</span>`;
}

function nmWLR(root) {
  const { w, fig, read } = ppW(root, "lr");
  const st = { A: NM_LR_PRESETS.vl, k: 0, set: "vl" };
  let res = nmLRSteps(st.A);
  const draw = () => {
    const steps = res.steps, s = steps[st.k], n = st.A.length, last = st.k === steps.length - 1;
    const say = {
      start: "Ausgangsmatrix. Links stehen die Zeilennummern — sie werden mitgetauscht und ergeben am Ende die Permutation.",
      pivot: `Spalte ${s.k + 1}: das betragsgrößte Element unter der Diagonale ist ${qh(s.M[s.piv]?.[s.k] ?? nmQ(0))} in Zeile ${s.piv + 1} (Spaltenpivotwahl).`,
      swap: `Zeilen ${s.k + 1} und ${(s.note ?? s.k) + 1} tauschen — mit den schon gespeicherten ℓ.`,
      elim: `Eliminieren: Zeile i minus ℓ<sub>i${s.k + 1}</sub> mal Zeile ${s.k + 1}. Die Faktoren ℓ<sub>i${s.k + 1}</sub> = a<sub>i${s.k + 1}</sub>/a<sub>${s.k + 1}${s.k + 1}</sub> bleiben an der Stelle der neuen Nullen stehen.`,
    }[s.phase];
    fig.innerHTML = `<div class="nm-center">${nmLRScheme(s, n)}</div>
      ${last && !res.singular ? `<div class="nm-plr lf small-f">P = ${qmx(nmPermMat(res.perm))}  L = ${qmx(res.L, { hl: Object.fromEntries(res.L.flatMap((r, i) => r.map((_, j) => [i + "," + j, j < i ? "nm-ell" : ""]))) })}  R = ${qmx(res.R)}</div>` : ""}`;
    read.innerHTML = `<p class="small"><b>Schritt ${st.k} / ${steps.length - 1}.</b> ${res.singular && last ? "Die Matrix ist singulär: keine Zerlegung." : say}</p>
      ${last && !res.singular ? `<p class="small">Fertig: <b>PA = LR</b>. Die Permutation (${res.perm.join(", ")}) heißt: Zeile 1 von PA ist Zeile ${res.perm[0]} von A, usw.</p>` : ""}
      <p class="small muted">Aufwand: Σ n² ≈ N³/3 Operationen, dazu je N²/2 für Vorwärts- und Rückwärtssubstitution.</p>`;
    $('[data-a="prev"]', w).disabled = st.k === 0;
    $('[data-a="next"]', w).disabled = last;
  };
  const load = (A) => { st.A = A; res = nmLRSteps(A); st.k = 0; draw(); };
  const { on } = ppW(root, "lr");
  on("prev", () => { st.k--; draw(); });
  on("next", () => { st.k++; draw(); });
  on("end", () => { st.k = res.steps.length - 1; draw(); });
  on("new", () => { lenSetSeg($('[data-seg="set"]', w), "x"); load(nmNiceLR()); });
  $$('[data-seg="set"] button', w).forEach((b) => (b.onclick = () => {
    lenSetSeg($('[data-seg="set"]', w), b.dataset.v);
    if (b.dataset.v !== "x") load(NM_LR_PRESETS[b.dataset.v]);
    else load(nmNiceLR());
  }));
  draw();
}

/* ---------------------------------------------------------------- 2.2 Cholesky */

const NM_CHOL_PRESETS = {
  ws1920: [[9, 3, 0, 0], [3, 2, 2, 0], [0, 2, 8, 2], [0, 0, 2, 3]],
  k3: [[4, 2, -2], [2, 5, 1], [-2, 1, 6]],
  bad: [[1, 2, 0], [2, 3, 1], [0, 1, 4]],
};
function nmWChol(root) {
  const { w, fig, read } = ppW(root, "chol");
  const st = { A: NM_CHOL_PRESETS.ws1920, n: 0 };
  const draw = () => {
    const A = st.A, N = A.length, L = A.map(() => A.map(() => null));
    let fail = null;
    for (let n = 0; n <= st.n && n < N && !fail; n++) {
      for (let j = 0; j < n; j++) L[n][j] = (A[n][j] - L[n].slice(0, j).reduce((s, x, k) => s + x * L[j][k], 0)) / L[j][j];
      const d = A[n][n] - L[n].slice(0, n).reduce((s, x) => s + x * x, 0);
      if (d <= 1e-12) { fail = { n, d }; break; }
      L[n][n] = Math.sqrt(d);
      for (let j = n + 1; j < N; j++) L[n][j] = 0;
    }
    const cell = (x, i, j) => (x === null ? "·" : Number.isInteger(Math.round(x * 1e9) / 1e9) ? nmD(x, 0) : Math.abs(x * x - Math.round(x * x)) < 1e-9 ? `√${Math.round(x * x)}` : nmD(x, 3));
    const hl = {};
    if (st.n < N) for (let j = 0; j <= st.n; j++) hl[st.n + "," + j] = "nm-piv";
    fig.innerHTML = `<div class="nm-center lf small-f">A = ${mx(A.map((r) => r.map((x) => nmD(x))), { hl: Object.fromEntries(A[0].map((_, j) => [Math.min(st.n, N - 1) + "," + j, j <= st.n ? "nm-cand" : ""])) })}
      L = ${mx(L.map((r, i) => r.map((x, j) => cell(x, i, j))), { hl })}</div>`;
    const n = Math.min(st.n, N - 1);
    read.innerHTML = fail
      ? `<p class="small"><b class="nm-err">Abbruch in Zeile ${fail.n + 1}:</b> a<sub>${fail.n + 1}${fail.n + 1}</sub> − Σ ℓ² = ${nmD(fail.d, 3)} ≤ 0 — keine Wurzel. Die Matrix ist <b>nicht positiv definit</b>. So lässt sich die Definitheit einer symmetrischen Matrix testen.</p>`
      : `<p class="small"><b>Zeile ${n + 1}:</b> erst ${n ? `ℓ<sub>${n + 1}1</sub> … ℓ<sub>${n + 1}${n}</sub> durch Vorwärtssubstitution mit dem schon fertigen Teil von L` : "ℓ<sub>11</sub> = √a<sub>11</sub>"}, ${n ? `dann ℓ<sub>${n + 1}${n + 1}</sub> = √(a<sub>${n + 1}${n + 1}</sub> − Σ ℓ<sub>${n + 1}k</sub>²) = ${cell(L[n][n])}` : ` = ${cell(L[0][0])}`}.</p>
        ${st.n >= N - 1 ? `<p class="small">Fertig: <b>A = LLᵀ</b>. Man braucht nur die untere Hälfte von A. Aufwand N³/6 — halb so viel wie LR.</p>` : ""}`;
    $('[data-a="prev"]', w).disabled = st.n === 0;
    $('[data-a="next"]', w).disabled = st.n >= N - 1 || !!fail;
  };
  const { on } = ppW(root, "chol");
  on("prev", () => { st.n--; draw(); });
  on("next", () => { st.n++; draw(); });
  $$('[data-seg="set"] button', w).forEach((b) => (b.onclick = () => {
    lenSetSeg($('[data-seg="set"]', w), b.dataset.v);
    if (b.dataset.v === "x") {
      const L = [[rint(1, 3), 0, 0], [rint(-2, 2), rint(1, 3), 0], [rint(-2, 2), rint(-2, 2), rint(1, 2)]];
      st.A = nmMul(L, nmT(L));
    } else st.A = NM_CHOL_PRESETS[b.dataset.v];
    st.n = 0;
    draw();
  }));
  draw();
}

/* ---------------------------------------------------------------- 2.3 Householder */

function nmWHouse(root) {
  const { w, fig, read } = ppW(root, "hh");
  const st = { ang: 20, sign: 0 };
  const draw = () => {
    const a = (st.ang * Math.PI) / 180, v = [2 * Math.cos(a), 2 * Math.sin(a)], nv = 2;
    const good = v[0] > 0 ? -nv : nv, sigma = st.sign ? -good : good;
    const u = [v[0] - sigma, v[1]], nu = nmN2(u), wv = u.map((x) => x / nu);
    lenOut(w, "ang", `${st.ang}°`);
    const S = 46, C = [190, 140], P = (p) => [C[0] + p[0] * S, C[1] - p[1] * S];
    const ln = (p, q, cls) => `<line x1="${P(p)[0]}" y1="${P(p)[1]}" x2="${P(q)[0]}" y2="${P(q)[1]}" class="${cls}"/>`;
    const arrow = (p, cls, lab, off = [8, -8]) => { const [x, y] = P(p); return `${arrowSVG(C[0], C[1], x, y, cls, 2.6, 10)}<text x="${x + off[0]}" y="${y + off[1]}" class="vec-l ${cls}">${lab}</text>`; };
    const mirror = [-wv[1], wv[0]];
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 380 280" role="img" aria-label="Householder-Spiegelung in der Ebene">
      ${ln([-3.8, 0], [3.8, 0], "tick")}${ln([0, -2.7], [0, 2.7], "tick")}
      ${ln(mirror.map((x) => -3 * x), mirror.map((x) => 3 * x), "nm-mirror")}
      <text x="${P(mirror.map((x) => 2.6 * x))[0] + 6}" y="${P(mirror.map((x) => 2.6 * x))[1]}" class="cap">Spiegelebene E</text>
      <circle cx="${C[0]}" cy="${C[1]}" r="${2 * S}" class="guide" fill="none"/>
      ${arrow(v, "nm-approx-v", "v")}
      ${arrow([sigma, 0], "nm-exact-v", "σe₁", [-14, -12])}
      ${nu > 0.05 ? arrow(wv, "nm-piv-v", "w", [6, 14]) : ""}
      ${ln(v, [sigma, 0], "guide")}
    </svg>`;
    read.innerHTML = `<div class="lw-vals"><span>v</span><b>(${nmD(v[0], 3)}; ${nmD(v[1], 3)})</b><span>σ</span><b>${nmD(sigma, 3)}</b>
      <span>v₁ − σ</span><b class="${Math.abs(u[0]) < 0.3 ? "nm-err" : ""}">${nmD(u[0], 4)}</b><span>‖v − σe₁‖₂</span><b>${nmD(nu, 4)}</b></div>
      <p class="small">${st.sign ? `<b class="nm-err">Ungünstiges Vorzeichen:</b> σ hat dasselbe Vorzeichen wie v₁. ${Math.abs(u[0]) < 0.3 ? "Liegt v fast auf der e₁-Achse, werden fast gleich große Zahlen abgezogen — Auslöschung, w wird ungenau." : "Dreh v nahe an die e₁-Achse."}`
        : `<b>Auslöschungsfrei:</b> σ = −sign(v₁)‖v‖₂, also haben v₁ und −σ dasselbe Vorzeichen und v₁ − σ ist eine Summe gleicher Vorzeichen.`}</p>
      <p class="small muted">Beide Wahlen spiegeln v auf ein Vielfaches von e₁ (‖Qv‖ = ‖v‖, also |σ| = ‖v‖₂) — nur die Rechnung unterscheidet sich.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.4 Kondition */

function nmWCond(root) {
  const { w, fig, read } = ppW(root, "cond");
  const st = { e: 2, d: 10 };
  const draw = () => {
    const eps = [1, 0.5, 0.2, 0.1][st.e], del = (st.d / 100) * eps;
    const A = [[1, 1], [1, 1 - eps]], b = [4, 4 - eps], bt = [4 + del, 4 - eps - del];
    const x = nmSolve(A, b), xt = nmSolve(A, bt);
    const P = nmFrame(400, 280, [-1, 6], [-1, 5]);
    const line = (a, c, cls) => { const y = (t) => (c - a[0] * t) / a[1]; return `<line x1="${P.X(-1)}" y1="${P.Y(y(-1))}" x2="${P.X(6)}" y2="${P.Y(y(6))}" class="${cls}"/>`; };
    const condInf = nmNormInf(A) * nmNormInf(nmInv(A));
    const relB = Math.max(...bt.map((v, i) => Math.abs(v - b[i]))) / Math.max(...b.map(Math.abs));
    const relX = Math.max(...xt.map((v, i) => Math.abs(v - x[i]))) / Math.max(...x.map(Math.abs));
    lenOut(w, "d", `${nmD(del, 3)}`);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 400 280" role="img" aria-label="Zwei fast parallele Geraden">
      <defs><clipPath id="nmCondClip"><rect x="34" y="12" width="354" height="242"/></clipPath></defs>
      ${P.axes({ xl: "x₁", yl: "x₂" })}<g clip-path="url(#nmCondClip)">
      ${line(A[0], b[0], "nm-line")}${line(A[1], b[1], "nm-line")}
      ${line(A[0], bt[0], "nm-line pert")}${line(A[1], bt[1], "nm-line pert")}</g>
      <circle cx="${P.X(x[0])}" cy="${P.Y(x[1])}" r="6" class="pt nm-exact-pt"/>
      <circle cx="${P.X(xt[0])}" cy="${P.Y(xt[1])}" r="6" class="pt nm-approx-pt"/></svg>`;
    read.innerHTML = `${F(`A = ${mx([["1", "1"], ["1", nmD(1 - eps)]])},  b = ${cv(["4", nmD(4 - eps)])}`, "small-f")}
      <div class="lw-vals"><span>Lösung x</span><b class="nm-exact">(${nmD(x[0], 3)}; ${nmD(x[1], 3)})</b><span>gestört x̃</span><b class="nm-approx">(${nmD(xt[0], 3)}; ${nmD(xt[1], 3)})</b>
        <span>rel. Störung von b (‖·‖∞)</span><b>${nmD(relB, 4)}</b><span>rel. Fehler von x</span><b class="nm-err">${nmD(relX, 4)}</b>
        <span>cond∞(A) = 4/ε</span><b>${nmD(condInf, 1)}</b></div>
      <p class="small">Die Störung wird um das ${nmD(relX / Math.max(relB, 1e-12), 1)}-fache verstärkt — höchstens um cond∞(A). Je kleiner ε, desto paralleler die Geraden, desto weiter wandert der Schnittpunkt.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.5 Ausgleichsrechnung */

function nmWLsq(root) {
  const { w, fig, read } = ppW(root, "lsq");
  const st = { deg: 1, pts: [[0, -2], [1, -1], [2, 0], [3, 2]] };
  const draw = () => {
    const N = st.deg + 1, A = st.pts.map(([t]) => Array.from({ length: N }, (_, k) => t ** k)), b = st.pts.map(([, y]) => y);
    const { Q, R } = nmQR(A);
    const c = nmMv(nmT(Q), b), Rb = R.slice(0, N).map((r) => r.slice(0, N));
    const x = Array(N).fill(0);
    for (let i = N - 1; i >= 0; i--) x[i] = (c[i] - Rb[i].slice(i + 1).reduce((s, a, j) => s + a * x[i + 1 + j], 0)) / Rb[i][i];
    const res = nmN2(c.slice(N));
    const p = (t) => x.reduce((s, a, k) => s + a * t ** k, 0);
    const ev = nmEigSym(nmMul(nmT(A), A)).vals, cA = Math.sqrt(ev[0] / ev[ev.length - 1]);
    const ts = st.pts.map((q) => q[0]), ys = st.pts.map((q) => q[1]);
    const P = nmFrame(440, 260, [Math.min(...ts) - 0.5, Math.max(...ts) + 0.5], [Math.min(...ys, ...ts.map(p)) - 1, Math.max(...ys, ...ts.map(p)) + 1]);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 440 260" role="img" aria-label="Ausgleichskurve mit Residuen">
      ${P.axes({ xl: "t", yl: "y" })}
      ${st.pts.map(([t, y]) => `<line x1="${P.X(t)}" y1="${P.Y(y)}" x2="${P.X(t)}" y2="${P.Y(p(t))}" class="nm-resid"/>`).join("")}
      <path d="${P.path(p)}" class="curve nm-approx-c"/>
      ${st.pts.map(([t, y]) => `<circle cx="${P.X(t)}" cy="${P.Y(y)}" r="5" class="pt nm-data-pt"/>`).join("")}</svg>`;
    const names = ["α", "β", "γ", "δ"];
    read.innerHTML = `${F(`g(t) = ${x.map((a, k) => `${k && a >= 0 ? "+ " : k ? "− " : a < 0 ? "−" : ""}${nmD(Math.abs(a), 3)}${k ? ` t${k > 1 ? `<sup>${k}</sup>` : ""}` : ""}`).join(" ")}`, "small-f")}
      <div class="lw-vals"><span>Residuum ‖Ax − b‖₂ = ‖d‖₂</span><b class="nm-err">${nmD(res, 4)}</b>
        <span>cond₂(A)</span><b>${nmD(cA, 1)}</b><span>cond₂(AᵀA) = cond₂(A)²</span><b>${nmD(cA * cA, 1)}</b></div>
      <p class="small">A hat die Spalten 1${st.deg > 0 ? ", t" : ""}${st.deg > 1 ? ", t²" : ""}${st.deg > 2 ? ", t³" : ""} an den Messstellen; ${names.slice(0, N).join(", ")} lösen R̄x = c mit Qᵀb = (c, d). Die roten Strecken sind die Residuen, ihre Quadratsumme ist minimal.</p>`;
  };
  lenWire(w, st, draw);
  ppW(root, "lsq").on("new", () => {
    const n = rint(5, 7), a = rint(-2, 2), s = rint(-1, 2) / 2, q = rint(-1, 1) / 4;
    st.pts = Array.from({ length: n }, (_, i) => [i, Math.round((a + s * i + q * i * i + (Math.random() - 0.5) * 2) * 2) / 2]);
    draw();
  });
  ppW(root, "lsq").on("ss22", () => { st.pts = [[0, -2], [1, -1], [2, 0], [3, 2]]; draw(); });
  draw();
}

/* ---------------------------------------------------------------- 2.6 SVD */

function nmWSvd(root) {
  const { w, fig, read } = ppW(root, "svd");
  const st = { m: 0 };
  const MATS = [[[3, 1], [1, 2]], [[2, 1], [0, 1]], [[1, 1], [1, 1.1]], [[0, -1], [1, 0]], [[2, 2], [1, 1]]];
  const draw = () => {
    const A = MATS[st.m], { vals, vecs } = nmEigSym(nmMul(nmT(A), A));
    const s = vals.map((l) => Math.sqrt(Math.max(l, 0))), V = vecs, U = V.map((v, i) => (s[i] > 1e-9 ? nmMv(A, v).map((x) => x / s[i]) : [-nmMv(A, V[0])[1] / s[0], nmMv(A, V[0])[0] / s[0]]));
    const Sc = 34, C1 = [110, 140], C2 = [330, 140];
    const pt = (C, p) => [C[0] + p[0] * Sc, C[1] - p[1] * Sc];
    const ring = (C, f) => Array.from({ length: 121 }, (_, i) => { const t = (i / 120) * 2 * Math.PI; return pt(C, f([Math.cos(t), Math.sin(t)])).map((z) => z.toFixed(1)).join(","); }).join(" ");
    const arr = (C, p, cls, lab) => { const [x, y] = pt(C, p); return `${arrowSVG(C[0], C[1], x, y, cls, 2.4, 9)}<text x="${x + 6}" y="${y - 6}" class="vec-a ${cls}">${lab}</text>`; };
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 440 280" role="img" aria-label="Einheitskreis und sein Bild unter A">
      <polyline points="${ring(C1, (p) => p)}" class="curve" style="color:var(--muted)"/>
      <polyline points="${ring(C2, (p) => nmMv(A, p))}" class="curve nm-approx-c"/>
      ${arr(C1, V[0], "nm-piv-v", "v₁")}${arr(C1, V[1], "nm-ell-v", "v₂")}
      ${arr(C2, U[0].map((x) => x * s[0]), "nm-piv-v", "σ₁u₁")}${s[1] > 0.05 ? arr(C2, U[1].map((x) => x * s[1]), "nm-ell-v", "σ₂u₂") : ""}
      <text x="${C1[0]}" y="260" text-anchor="middle" class="cap">‖x‖₂ = 1</text><text x="${C2[0]}" y="260" text-anchor="middle" class="cap">Ax</text>
      <text x="220" y="146" text-anchor="middle" class="big">→</text></svg>`;
    read.innerHTML = `${F(`A = ${mx(A.map((r) => r.map((x) => nmD(x))))}`, "small-f")}
      <div class="lw-vals"><span>σ₁ = ‖A‖₂</span><b>${nmD(s[0], 3)}</b><span>σ₂</span><b>${nmD(s[1], 3)}</b>
        <span>cond₂(A) = σ₁/σ₂</span><b>${s[1] > 1e-9 ? nmD(s[0] / s[1], 2) : "∞"}</b><span>‖A − A₁‖₂ (beste Rang-1-Näherung)</span><b>${nmD(s[1], 3)}</b></div>
      <p class="small">Die rechten Singulärvektoren v₁, v₂ (orthonormal) gehen auf die Halbachsen σ₁u₁, σ₂u₂ der Ellipse. ${st.m === 3 ? "Eine orthogonale Matrix: der Kreis bleibt ein Kreis, σ₁ = σ₂ = 1." : st.m === 4 ? "Rang 1: die Ellipse fällt zu einer Strecke zusammen, σ₂ = 0." : ""}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

NUMA_CHAPTERS.push({
  n: 2, vl: "VL02, VL04–VL06", title: "Direkte Verfahren für LGS", next: "Newton-Verfahren",
  headline: "Lineare <span class=\"accent\">Gleichungssysteme</span>",
  intro: "Das wichtigste Problem der Numerik: Ax = b. Drei Zerlegungen — LR mit Spaltenpivotwahl, Cholesky für spd-Matrizen, QR mit Householder-Spiegelungen —, wie gut ein LGS konditioniert ist, und was man tut, wenn es mehr Gleichungen als Unbekannte gibt.",
  sections: [
    {
      id: "2.1", title: "LR-Zerlegung", short: "LR", about: "PA = LR, Spaltenpivotwahl, Vorwärts-/Rückwärtssubstitution, Existenz, Aufwand",
      html: () => `
        ${nmGist([
          `Drei Schritte: <b>$PA = LR$</b> durch Gauß-Elimination, dann $Ly = Pb$ vorwärts, dann $Rx = y$ rückwärts. Probe: $Ax = P^\\top LRx = P^\\top Ly = P^\\top Pb = b$.`,
          `<b>Spaltenpivotwahl</b>: vor jedem Schritt die Zeile mit dem betragsgrößten Element der aktuellen Spalte nach oben tauschen. Das macht die Zerlegung stabiler.`,
          `Aufwand: Zerlegung $\\approx \\tfrac13 N^3$, jede Substitution $\\tfrac12 N^2$ Operationen. $A^{-1}$ zu kennen bringt nichts: $A^{-1}b$ kostet auch $N^2$.`,
        ])}
        <div class="card">
          <h3>Rückwärtssubstitution</h3>
          ${tx(`x_n = \\frac{1}{r_{nn}}\\Big(y_n - \\sum_{j=n+1}^{N} r_{nj}x_j\\Big), \\qquad n = N, N-1, \\dots, 1`)}
          ${pycode(`
            def backward_sub(R, y):
                N = len(y)
                x = np.zeros(N)
                for n in range(N-1, -1, -1):       # n = N-1, ..., 0
                    x[n] = (y[n] - np.dot(R[n,n+1:N], x[n+1:N])) / R[n,n]
                return x`, { title: "Zeilenversion (Python)" })}
          <p>Zeile $n$ braucht $N - n - 1$ Operationen, zusammen $\\sum (N-n) \\approx \\tfrac12 N^2$. Die <b>Spaltenversion</b> (WS 22/23) zieht nach jedem fertigen $x_n$ gleich die Spalte ab: <code>x[n] = y[n]/R[n,n]; y[0:n] = y[0:n] - x[n]*R[0:n,n]</code> — gleicher Aufwand.</p>
          <h3>Existenz</h3>
          ${ppFacts([
            ["ohne Tausch", `$A = LR$ mit $\\ell_{nn} = 1$ existiert <b>genau dann</b>, wenn alle führenden Hauptuntermatrizen $A_{[1:n,1:n]}$ regulär sind. Dann ist sie eindeutig.`],
            ["mit Tausch", `Zu jeder regulären $A$ gibt es eine Permutation $P$ mit $PA = LR$. Gegenbeispiel ohne Tausch: $\\begin{pmatrix}0&1\\\\2&3\\end{pmatrix}$.`],
            ["Speicher", "Die Faktoren $\\ell$ landen dort, wo die Nullen entstehen; die Zeilennummern links ergeben $P$. Spätere Tausche vertauschen auch die schon gespeicherten $\\ell$."],
          ])}
          <p class="small muted">Achtung: manche Programme liefern $A = PLR$ statt $PA = LR$.</p>
        </div>
        ${pw("lr", `
          ${pseg("set", [["vl", "Vorlesung"], ["ss26", "SS 26"], ["ws2425", "WS 24/25"], ["ws2223", "WS 22/23"], ["x", "Neue Matrix"]], "vl")}
          <div class="lw-btns">${pbtn("prev", "← zurück")}${pbtn("next", "weiter →", "primary")}${pbtn("end", "Ergebnis")}</div>`, { wide: true })}
        ${nmTraps([
          "Pivot nach dem <b>Betrag</b> wählen: $-8$ schlägt $4$. Bei Gleichstand die obere Zeile.",
          "Beim Tauschen die schon gespeicherten $\\ell$ mittauschen — sonst stimmt $L$ nicht.",
          "In $L$ stehen die $\\ell$ mit dem Vorzeichen, mit dem man die Zeile <b>abzieht</b> (Zeile $i$ $-\\,\\ell\\cdot$ Zeile $k$). $L$ hat Einsen auf der Diagonale.",
          "Erst $Pb$ bilden, dann vorwärts einsetzen. Für Blockmatrizen (SS 22, SS 19) schrittweise vorgehen: erst den Teil mit bekannter Zerlegung lösen.",
        ])}`,
      setup: (root) => nmWLR(root),
      check: [
        { q: `Spaltenpivotwahl für $\\begin{pmatrix}1&2\\\\-3&4\\end{pmatrix}$: welche Zeile wird Pivotzeile?`, opts: ["Zeile 2 ($|-3| > |1|$)", "Zeile 1", "Zeile 2, weil $4 > 2$", "Keine, $a_{11} \\neq 0$ reicht"], why: "Es zählt der Betrag in der aktuellen Spalte: $|-3| = 3 > 1$." },
        { q: "Was kostet die LR-Zerlegung einer $N\\times N$-Matrix (führender Term)?", opts: ["$\\tfrac13 N^3$ Operationen", "$\\tfrac12 N^2$ Operationen", "$\\tfrac16 N^3$ Operationen", "$\\tfrac23 N^3$ Operationen"], why: "$\\sum n^2 \\approx \\tfrac13 N^3$. $\\tfrac16 N^3$ ist Cholesky, $\\tfrac23 N^3$ QR ($M = N$)." },
        { q: "Wann existiert $A = LR$ ohne Zeilentausch ($\\ell_{nn} = 1$)?", opts: ["Genau dann, wenn alle führenden Hauptuntermatrizen regulär sind", "Für jede reguläre Matrix", "Nur für symmetrische Matrizen", "Wenn $\\det A > 0$"], why: "Gegenbeispiel regulär, aber $a_{11} = 0$: $\\begin{pmatrix}0&1\\\\2&3\\end{pmatrix}$." },
        { q: "$PA = LR$ ist bekannt. Wie löst man $Ax = b$?", opts: ["$Ly = Pb$ vorwärts, dann $Rx = y$ rückwärts", "$Ly = b$ vorwärts, dann $Rx = Py$ rückwärts", "$Rx = Pb$ rückwärts, dann $Lx = y$", "$x = R^{-1}L^{-1}b$ ohne $P$"], why: "$Ax = b \\Leftrightarrow PAx = Pb \\Leftrightarrow L(Rx) = Pb$." },
      ],
    },
    {
      id: "2.2", title: "Cholesky-Zerlegung", short: "Cholesky", about: "A = LLᵀ für spd-Matrizen, Zeile für Zeile, N³/6, Test auf Definitheit",
      html: () => `
        ${nmGist([
          `Für <b>symmetrisch positiv definite</b> (spd) $A$: $A = LL^\\top$ mit unterer Dreiecksmatrix $L$, $\\ell_{nn} > 0$. Dann $Ly = b$ vorwärts, $L^\\top x = y$ rückwärts.`,
          `$A = LL^\\top$ regulär <b>$\\Leftrightarrow$</b> $A$ spd. Halb so teuer wie LR: <b>$\\tfrac16 N^3$</b>.`,
          `Kein Pivotisieren — das würde die Symmetrie zerstören. Bricht die Rechnung ab (Wurzel aus $\\le 0$), ist $A$ nicht positiv definit.`,
        ])}
        <div class="card">
          <h3>Zeile für Zeile</h3>
          ${tx(`\\ell_{nm} = \\frac{1}{\\ell_{mm}}\\Big(a_{nm} - \\sum_{k=1}^{m-1}\\ell_{nk}\\ell_{mk}\\Big)\\ (m \\lt n), \\qquad \\ell_{nn} = \\sqrt{a_{nn} - \\sum_{k=1}^{n-1}\\ell_{nk}^2}`)}
          ${pycode(`
            def cholesky(A):                  # spd (N x N)
                N = A.shape[0]
                L = np.zeros(A.shape)
                L[0,0] = np.sqrt(A[0,0])
                for n in range(1, N):
                    y = forward_sub(L[:n,:n], A[n,:n])
                    L[n,:n] = y
                    L[n,n] = np.sqrt(A[n,n] - np.inner(y, y))
                return L`, { title: "Implementierung der Vorlesung" })}
          <p>Für $N = 3$ (WS 17/18): $\\ell_{11} = \\sqrt{a_{11}}$, $\\ell_{21} = a_{21}/\\ell_{11}$, $\\ell_{22} = \\sqrt{a_{22} - \\ell_{21}^2}$, $\\ell_{31} = a_{31}/\\ell_{11}$, $\\ell_{32} = (a_{32} - \\ell_{31}\\ell_{21})/\\ell_{22}$, $\\ell_{33} = \\sqrt{a_{33} - \\ell_{31}^2 - \\ell_{32}^2}$. Man braucht nur $a_{nm}$ mit $m \\le n$.</p>
          <p><b>Determinante</b> (WS 20/21): $\\det A = (\\ell_{11}\\cdots\\ell_{NN})^2$ — nach der Zerlegung fast umsonst. Eine Bandstruktur bleibt in $L$ erhalten (Splines: $O(N)$).</p>
        </div>
        ${pw("chol", `
          ${pseg("set", [["ws1920", "WS 19/20"], ["k3", "3 × 3"], ["bad", "nicht spd"], ["x", "Neue Matrix"]], "ws1920")}
          <div class="lw-btns">${pbtn("prev", "← zurück")}${pbtn("next", "nächste Zeile →", "primary")}</div>`, { wide: true })}
        ${nmTraps([
          "$\\ell_{nn} = 1$ kann man bei Cholesky <b>nicht</b> fordern — $\\ell_{nn} > 0$ macht die Zerlegung eindeutig.",
          "Reihenfolge beachten: jedes $\\ell$ braucht nur Einträge links davon und darüber.",
          `Für die Normalengleichung $A^\\top Ax = A^\\top b$ braucht man $\\operatorname{Rang} A = N$, sonst ist $A^\\top A$ nur semidefinit (${nmSee("2.5")}).`,
        ])}`,
      setup: (root) => nmWChol(root),
      check: [
        { q: "Für welche Matrizen existiert eine Cholesky-Zerlegung $A = LL^\\top$ ($L$ regulär)?", opts: ["Genau für symmetrisch positiv definite", "Für alle symmetrischen", "Für alle regulären", "Für alle mit positiver Diagonale"], why: "$A = LL^\\top$ ist symmetrisch und $x^\\top Ax = \\|L^\\top x\\|^2 > 0$. Umgekehrt existiert sie für jede spd-Matrix." },
        { q: "$A = \\begin{pmatrix}4&2\\\\2&5\\end{pmatrix}$. Was ist $\\ell_{22}$?", opts: ["$2$", "$1$", "$\\sqrt5$", "$4$"], why: "$\\ell_{11} = 2$, $\\ell_{21} = 2/2 = 1$, $\\ell_{22} = \\sqrt{5 - 1} = 2$." },
        { q: "Warum wird bei Cholesky nicht pivotisiert?", opts: ["Zeilentausch würde die Symmetrie zerstören", "Es gibt keine Nullen auf der Diagonale", "Pivotisieren ist zu teuer", "$L$ wäre sonst keine Dreiecksmatrix"], why: "$PA$ ist im Allgemeinen nicht mehr symmetrisch. Für spd-Matrizen ist es auch nicht nötig." },
        { q: "Was kostet die Cholesky-Zerlegung?", opts: ["$\\tfrac16 N^3$", "$\\tfrac13 N^3$", "$\\tfrac12 N^2$", "$\\tfrac23 N^3$"], why: "Halb so viel wie LR, weil nur eine Hälfte berechnet wird." },
      ],
    },
    {
      id: "2.3", title: "Householder und QR-Zerlegung", short: "QR", about: "Q = I − 2wwᵀ, auslöschungsfreier Householder-Vektor, A = QR, Aufwand",
      html: () => `
        ${nmGist([
          `$A \\in \\R^{M\\times N}$, $M \\ge N$, voller Rang: <b>$A = QR$</b> mit orthogonalem $Q \\in \\R^{M\\times M}$ und $R = \\binom{\\bar R}{0}$, $\\bar R$ obere Dreiecksmatrix.`,
          `Werkzeug: die <b>Householder-Transformation</b> $Q = I - 2ww^\\top$ mit $\\|w\\|_2 = 1$ — eine Spiegelung an der Ebene $w^\\top y = 0$.`,
          `Sehr stabil, aber (für $M \\approx N$) doppelt so teuer wie LR: <b>$MN^2 - \\tfrac13 N^3$</b> Operationen.`,
        ])}
        <div class="card">
          <h3>Eigenschaften von $Q = I - 2ww^\\top$</h3>
          ${ppFacts([
            ["symmetrisch", "$Q^\\top = I - 2(ww^\\top)^\\top = Q$."],
            ["orthogonal", "$Q^\\top Q = I - 4ww^\\top + 4w(w^\\top w)w^\\top = I$, weil $w^\\top w = 1$."],
            ["Spiegelung", "$Qw = w - 2w = -w$, also $Q(\\lambda w) = -\\lambda w$; $Qy = y$ für alle $y$ mit $w^\\top y = 0$."],
            ["Qy berechnen", "$Qy = y - 2(w^\\top y)\\,w$: nur $w$ speichern, $2N$ Operationen — $Q$ nie als Matrix aufstellen."],
          ])}
          <h3>Spiegeln auf die erste Achse</h3>
          <p>Gesucht $w$ mit $Qv = \\sigma e_1$. Aus $\\|Qv\\| = \\|v\\|$ folgt $|\\sigma| = \\|v\\|_2$. Allgemein spiegelt $w = (v - \\tilde v)/\\|v - \\tilde v\\|$ den Vektor $v$ auf $\\tilde v$, wenn $\\|v\\|_2 = \\|\\tilde v\\|_2$.</p>
          ${tx(`w = \\frac{v - \\sigma e_1}{\\|v - \\sigma e_1\\|_2}, \\qquad \\sigma = \\begin{cases} -\\|v\\|_2, & v_1 > 0,\\\\ \\phantom{-}\\|v\\|_2, & v_1 \\le 0.\\end{cases}`)}
          <p>So haben $v_1$ und $-\\sigma$ dasselbe Vorzeichen: in $v_1 - \\sigma$ wird nichts ausgelöscht.</p>
        </div>
        ${pw("hh", `${pslider("ang", "Winkel von v", -180, 180, 1, 20)}${pseg("sign", [[0, "σ = −sign(v₁)‖v‖ ✓"], [1, "σ = +sign(v₁)‖v‖"]], 0)}`, { wide: true })}
        <div class="card">
          <h3>QR-Zerlegung Spalte für Spalte</h3>
          <p>$Q_1$ spiegelt die erste Spalte $a_1$ auf $r_{11}e_1$, $r_{11} = -\\sign(a_{11})\\|a_1\\|_2$. Dann dasselbe mit der Restmatrix $A^{(1)} \\in \\R^{(M-1)\\times(N-1)}$ — der Householder-Vektor bekommt vorne Nullen: $w_2 = (0, \\tilde w_2)$, $Q_2 = \\diag(1, \\tilde Q_2)$. Nach $N$ Schritten $Q_N\\cdots Q_1A = R$, also $Q = Q_1\\cdots Q_N$.</p>
          <p><b>Beispiel der Vorlesung:</b> $a_1 = (-4, -2, 1, 2)^\\top$, $\\|a_1\\|_2 = 5$, $a_{11} \\le 0 \\Rightarrow \\sigma = 5$, $w_1 = \\tfrac{1}{\\sqrt{90}}(-9, -2, 1, 2)^\\top$, $Q_1a_1 = 5e_1$.</p>
          <p><b>LGS mit QR:</b> $Qc = b$ durch $c = Q^\\top b$, dann $Rx = c$ rückwärts. Kein Pivotisieren nötig, $\\cond_2(Q) = 1$.</p>
        </div>
        ${nmTraps([
          "Das Vorzeichen von $\\sigma$ ist das <b>Gegenteil</b> von $\\sign(v_1)$. Für $v_1 = 0$ nimmt man $\\sigma = +\\|v\\|_2$.",
          "$w$ normieren nicht vergessen — oder mit dem unnormierten $u = v - \\sigma e_1$ rechnen: $Q = I - 2uu^\\top/(u^\\top u)$.",
          "Eine Spiegelung ändert die Länge nicht: $|\\sigma| = \\|v\\|_2$ ist eine gute Probe.",
          `Für die Hessenbergform (${nmSee("6.3")}) beginnt der erste Householder-Vektor bei der zweiten Komponente.`,
        ])}`,
      setup: (root) => nmWHouse(root),
      check: [
        { q: "$v = (3, 4)^\\top$. Welches $\\sigma$ ist auslöschungsfrei für $Qv = \\sigma e_1$?", opts: ["$\\sigma = -5$", "$\\sigma = 5$", "$\\sigma = -3$", "$\\sigma = 4$"], why: "$\\|v\\|_2 = 5$, $v_1 = 3 > 0 \\Rightarrow \\sigma = -5$, $v - \\sigma e_1 = (8, 4)^\\top$." },
        { q: "Welche Eigenschaft hat $Q = I - 2ww^\\top$ ($\\|w\\|_2 = 1$) nicht?", opts: ["$Q$ ist eine Dreiecksmatrix", "$Q$ ist symmetrisch", "$Q$ ist orthogonal", "$Qw = -w$"], why: "$Q$ ist eine volle Spiegelungsmatrix, symmetrisch und orthogonal." },
        { q: "Wie berechnet man $Qy$ effizient?", opts: ["$y - 2(w^\\top y)w$, etwa $2N$ Operationen", "$Q$ aufstellen und multiplizieren, $N^2$", "Mit einer LR-Zerlegung von $Q$", "QR-Algorithmus"], why: "Nur ein Skalarprodukt und ein Vektor-Update." },
        { q: "Was kostet die QR-Zerlegung einer $N\\times N$-Matrix (Householder)?", opts: ["$\\approx \\tfrac23 N^3$, doppelt so viel wie LR", "$\\approx \\tfrac13 N^3$", "$\\approx \\tfrac16 N^3$", "$\\approx N^2$"], why: "$MN^2 - \\tfrac13 N^3$ mit $M = N$ ergibt $\\tfrac23 N^3$." },
      ],
    },
    {
      id: "2.4", title: "Normen und Kondition von LGS", short: "Kondition", about: "Vektor- und Matrixnormen, cond(A), Störungssatz, gut und schlecht konditionierte Matrizen",
      html: () => `
        ${nmGist([
          `Zugehörige Matrixnorm: $\\|A\\| = \\sup_{x\\neq0} \\|Ax\\|/\\|x\\|$ — die kleinste Zahl mit $\\|Ax\\| \\le \\|A\\|\\,\\|x\\|$. Submultiplikativ, $\\|I\\| = 1$.`,
          `<b>$\\cond(A) = \\|A\\|\\,\\|A^{-1}\\|$</b> $\\ge 1$ misst die Empfindlichkeit von $x$ gegen relative Störungen in $A$ und $b$.`,
          `Bei Störung nur von $b$: $\\dfrac{\\|x - \\tilde x\\|}{\\|x\\|} \\le \\cond(A)\\,\\dfrac{\\|b - \\tilde b\\|}{\\|b\\|}$.`,
        ])}
        <div class="card">
          <h3>Normen</h3>
          ${ppFacts([
            ["Vektoren", `$\\|x\\|_1 = \\sum|x_n|$, $\\|x\\|_2 = \\big(\\sum x_n^2\\big)^{1/2}$, $\\|x\\|_\\infty = \\max|x_n|$`],
            ["Spaltensummennorm", `$\\|A\\|_1 = \\max_m \\sum_n |a_{nm}|$`],
            ["Zeilensummennorm", `$\\|A\\|_\\infty = \\max_n \\sum_m |a_{nm}|$`],
            ["Spektralnorm", `$\\|A\\|_2 = \\sqrt{\\lambda_{\\max}(A^\\top A)} = \\sigma_1$; für symmetrisches $A$: $\\max|\\lambda|$`],
            ["Frobenius", `$\\|A\\|_F^2 = \\sum a_{mn}^2 = \\operatorname{Spur}(A^\\top A)$ — keine zugehörige Norm ($\\|I\\|_F = \\sqrt N$).`],
          ])}
          <h3>Störungen in $A$ und $b$</h3>
          <p>Ist $\\frac{\\|A - \\tilde A\\|}{\\|A\\|} \\le \\varepsilon_A$, $\\frac{\\|b - \\tilde b\\|}{\\|b\\|} \\le \\varepsilon_b$ und $\\varepsilon_A\\cond(A) < 1$, dann</p>
          ${tx(`\\frac{\\|x - \\tilde x\\|}{\\|x\\|} \\le \\frac{\\cond(A)}{1 - \\varepsilon_A\\cond(A)}\\,(\\varepsilon_A + \\varepsilon_b) = 2\\varepsilon\\cond(A) + O(\\varepsilon^2)`)}
          <p>Die Abschätzung ist scharf (es gibt Störungen mit Gleichheit), aber oft zu pessimistisch.</p>
          ${ppFacts([
            ["cond = 1", "$\\alpha I$; orthogonale $Q$ in der 2-Norm (Längen bleiben). $\\cond(\\alpha A) = \\cond(A)$."],
            ["symmetrisch", `$\\cond_2(A) = \\dfrac{\\max|\\lambda|}{\\min|\\lambda|}$`],
            ["Spline-Matrix", "Tridiagonal $(1\\ 4\\ 1)$: $\\cond_\\infty \\le 3$, mit der Neumann-Reihe $\\|(I+B)^{-1}\\| \\le \\sum\\|B\\|^k = \\frac{1}{1-\\|B\\|}$."],
            ["schlecht", "Hilbertmatrix $\\big(\\frac{1}{i+j-1}\\big)$: $\\cond \\approx 3{,}5\\cdot10^{13}$ für $N = 10$. $\\diag(1, \\delta)$: $\\cond_\\infty = 1/|\\delta|$, obwohl die Gleichungen entkoppelt sind."],
          ])}
        </div>
        ${pw("cond", `${pseg("e", [[0, "ε = 1"], [1, "ε = 0,5"], [2, "ε = 0,2"], [3, "ε = 0,1"]], 2)}${pslider("d", "Störung δ (in % von ε)", 0, 100, 1, 10)}`, { wide: true })}
        <p class="small muted">Das Beispiel der Vorlesung: $\\tilde b = b + \\delta(1, -1)^\\top$. Für $\\delta = \\varepsilon$ wird aus $x = (3, 1)$ die Lösung $\\tilde x = (1 + \\varepsilon, 3)$.</p>
        ${nmTraps([
          "Spaltensumme ↔ 1-Norm, Zeilensumme ↔ ∞-Norm — die ∞ „liegt“ wie eine Zeile.",
          "Eine große Konditionszahl ist nur eine obere Schranke: für spezielle Störungen (z. B. nur auf der Diagonale) kann das Problem trotzdem gut konditioniert sein.",
          "$\\|ve^\\top\\|_2 = \\sqrt N\\,\\|v\\|_2$ und $\\|ve^\\top\\|_1 = \\|v\\|_1$ (SS 24, SS 22): erst die Spalten ansehen.",
        ])}`,
      setup: (root) => nmWCond(root),
      check: [
        { q: `$\\|A\\|_\\infty$ für $A = \\begin{pmatrix}2&0&4\\\\3&1&-11\\\\0&5&-2\\end{pmatrix}$?`, opts: ["$15$", "$17$", "$16$", "$7$"], why: "Zeilensummen $6, 15, 7$ — das Maximum ist $15$ (SS 19). $\\|A\\|_1$ wäre $\\max(5, 6, 17) = 17$." },
        { q: "Welche Aussage über $\\cond(A)$ ist falsch?", opts: ["$\\cond(\\alpha A) = |\\alpha|\\cond(A)$", "$\\cond(A) \\ge 1$", "$\\cond_2(Q) = 1$ für orthogonales $Q$", "$\\cond_2(A) = |\\lambda|_{\\max}/|\\lambda|_{\\min}$ für symmetrisches $A$"], why: "$\\cond(\\alpha A) = \\|\\alpha A\\|\\,\\|\\alpha^{-1}A^{-1}\\| = \\cond(A)$." },
        { q: "$\\cond(A) = 10^8$ und $b$ hat einen relativen Fehler von $10^{-16}$. Wie groß kann der relative Fehler von $x$ sein?", opts: ["etwa $10^{-8}$", "$10^{-16}$", "$10^{-24}$", "$10^8$"], why: "$\\|\\Delta x\\|/\\|x\\| \\le \\cond(A)\\cdot\\|\\Delta b\\|/\\|b\\| = 10^8\\cdot10^{-16}$." },
        { q: "Was ist $\\|A\\|_2$ für symmetrisches $A$ mit Eigenwerten $3, -5, 1$?", opts: ["$5$", "$3$", "$\\sqrt{35}$", "$9$"], why: "Für symmetrisches $A$ ist $\\|A\\|_2 = \\max|\\lambda|$." },
      ],
    },
    {
      id: "2.5", title: "Lineare Ausgleichsrechnung", short: "Ausgleich", about: "‖Ax − b‖₂ = min!, Normalengleichung, Lösung per QR, Tikhonov",
      html: () => `
        ${nmGist([
          `Mehr Gleichungen als Unbekannte ($M > N$): suche $x$ mit <b>$\\|Ax - b\\|_2 = \\min!$</b> Dann ist $Ax$ die orthogonale Projektion von $b$ auf $\\operatorname{Bild}(A)$.`,
          `<b>Normalengleichung</b> (Gauß): $x$ löst das Ausgleichsproblem $\\Leftrightarrow A^\\top Ax = A^\\top b$. $\\operatorname{Rang} A = N \\Leftrightarrow A^\\top A$ spd.`,
          `Besser über <b>QR</b>: $Q^\\top b = \\binom{c}{d}$, dann $\\bar Rx = c$ rückwärts — das Residuum ist $\\|d\\|_2$. Denn $\\cond_2(A^\\top A) = \\cond_2(A)^2$.`,
        ])}
        <div class="card">
          <h3>Aus Messdaten</h3>
          <p>Messdaten $(t_m, y_m)$, $m = 1, \\dots, M$, und Ansatzfunktionen $\\varphi_1, \\dots, \\varphi_N$: gesucht $f = \\sum x_n\\varphi_n$ mit $\\sum (y_m - f(t_m))^2 = \\min!$</p>
          ${tx(`A = \\begin{pmatrix}\\varphi_1(t_1) & \\cdots & \\varphi_N(t_1)\\\\ \\vdots & & \\vdots\\\\ \\varphi_1(t_M) & \\cdots & \\varphi_N(t_M)\\end{pmatrix}, \\qquad b = \\begin{pmatrix}y_1\\\\ \\vdots\\\\ y_M\\end{pmatrix}`)}
          <p>Ausgleichsgerade $y = x_1 + x_2t$: Spalten $(1, \\dots, 1)$ und $(t_1, \\dots, t_M)$. Für eine Parabel kommt die Spalte $t_m^2$ dazu (SS 22).</p>
          <h3>Warum QR</h3>
          <p>Mit $Q^\\top$ orthogonal: $\\|Ax - b\\|_2^2 = \\|Q^\\top(Ax - b)\\|_2^2 = \\|\\bar Rx - c\\|_2^2 + \\|d\\|_2^2 \\ge \\|d\\|_2^2$, Gleichheit genau für $\\bar Rx = c$.</p>
          ${ppFacts([
            ["QR", "$MN^2 - \\tfrac13 N^3$ Operationen, stabil, gute Kondition."],
            ["Normalengleichung", "$A^\\top A$ ($\\tfrac12 MN^2$) + Cholesky ($\\tfrac16 N^3$) — billiger, aber $\\cond_2$ quadriert. Beispiel $A = \\begin{pmatrix}1&1\\\\ \\varepsilon&0\\\\0&\\varepsilon\\end{pmatrix}$ mit $\\varepsilon^2 < \\eps$: $A^\\top A$ wird in Gleitpunkt zu $\\begin{pmatrix}1&1\\\\1&1\\end{pmatrix}$, singulär."],
            ["Tikhonov", "$\\|Ax - b\\|_2^2 + \\alpha\\|x\\|_2^2 = \\min!$: gute Kondition für großes $\\alpha$, aber großer Approximationsfehler — Kompromiss (Diskrepanzprinzip)."],
            ["nichtlinear", `$\\|f(x)\\|_2 = \\min!$ wird durch eine Folge linearer Ausgleichsprobleme gelöst (${nmSee("3.3")}).`],
          ])}
        </div>
        ${pw("lsq", `${pseg("deg", [[1, "Gerade"], [2, "Parabel"], [3, "kubisch"]], 1)}<div class="lw-btns">${pbtn("ss22", "Daten aus SS 22")}${pbtn("new", "Neue Messdaten")}</div>`, { wide: true })}
        ${nmTraps([
          "Die Normalengleichung ist <b>immer</b> lösbar ($A^\\top b \\in \\operatorname{Bild}(A^\\top A)$), aber nur bei vollem Rang eindeutig.",
          "Ist $(A\\,|\\,b)^\\top(A\\,|\\,b)$ nur semidefinit, liegt $b$ in $\\operatorname{Bild}(A)$: das Residuum ist $0$ (WS 22/23).",
          "Mit gegebener QR-Zerlegung: lösbar ist $Ax = b$ genau dann, wenn $d = 0$ (WS 17/18).",
        ])}`,
      setup: (root) => nmWLsq(root),
      check: [
        { q: "Was ist die Normalengleichung zu $\\|Ax - b\\|_2 = \\min!$?", opts: ["$A^\\top Ax = A^\\top b$", "$AA^\\top x = b$", "$Ax = A^\\top b$", "$A^\\top Ax = b$"], why: "Der Gradient von $\\tfrac12\\|Ax - b\\|^2$ ist $A^\\top(Ax - b)$." },
        { q: "$Q^\\top b = \\binom{c}{d}$ mit $A = QR$. Wie groß ist das minimale Residuum?", opts: ["$\\|d\\|_2$", "$\\|c\\|_2$", "$\\|b\\|_2 - \\|c\\|_2$", "$0$"], why: "$\\|Ax - b\\|^2 = \\|\\bar Rx - c\\|^2 + \\|d\\|^2$, und $\\bar Rx = c$ ist lösbar." },
        { q: "Warum löst man das Ausgleichsproblem meist mit QR statt mit der Normalengleichung?", opts: ["$\\cond_2(A^\\top A) = \\cond_2(A)^2$", "QR ist billiger", "Die Normalengleichung hat keine Lösung", "Cholesky ist instabil"], why: "Die Normalengleichung quadriert die Kondition; QR ist etwas teurer, aber stabiler." },
        { q: "Ausgleichsgerade durch $(0, 1)$, $(1, 2)$, $(2, 4)$: welche Matrix $A$?", opts: ["$\\begin{pmatrix}1&0\\\\1&1\\\\1&2\\end{pmatrix}$", "$\\begin{pmatrix}0&1\\\\1&2\\\\2&4\\end{pmatrix}$", "$\\begin{pmatrix}1&1&1\\\\0&1&2\\end{pmatrix}$", "$\\begin{pmatrix}0\\\\1\\\\2\\end{pmatrix}$"], why: "Spalten $1$ und $t$ an den Messstellen; $b = (1, 2, 4)^\\top$." },
      ],
    },
    {
      id: "2.6", title: "Singulärwertzerlegung", short: "SWZ", about: "A = UΣVᵀ, ‖A‖₂ = σ₁, Rang-k-Bestapproximation, Pseudoinverse",
      html: () => `
        ${nmGist([
          `Jede $A \\in \\R^{M\\times N}$ vom Rang $R$: <b>$A = U\\Sigma V^\\top$</b> mit orthogonalen $U, V$ und $\\Sigma = \\diag(\\sigma_1, \\dots, \\sigma_R, 0, \\dots)$, $\\sigma_1 \\ge \\cdots \\ge \\sigma_R > 0$.`,
          `$\\sigma_n = \\sqrt{\\lambda_n(A^\\top A)}$; die Spalten von $V$ sind normierte EV von $A^\\top A$, $u_r = Av_r/\\sigma_r$.`,
          `$\\|A\\|_2 = \\sigma_1$, $\\|A\\|_F^2 = \\sigma_1^2 + \\cdots + \\sigma_R^2$, und $A_k = \\sum_{r\\le k}\\sigma_ru_rv_r^\\top$ ist die beste Rang-$k$-Näherung: $\\|A - A_k\\|_2 = \\sigma_{k+1}$.`,
        ])}
        ${pw("svd", pseg("m", [[0, "symmetrisch"], [1, "Dreieck"], [2, "fast singulär"], [3, "orthogonal"], [4, "Rang 1"]], 0), { wide: true })}
        <div class="card">
          <h3>Ausgleich mit Rangdefekt</h3>
          <p>Ist $\\operatorname{Rang} A = R < N$, hat $\\|Ax - b\\|_2 = \\min!$ unendlich viele Lösungen. Die mit kleinster Norm $\\|x\\|_2$ ist</p>
          ${tx(`x = \\sum_{r=1}^{R}\\frac{u_r^\\top b}{\\sigma_r}\\,v_r = A^+b, \\qquad A^+ = V\\Sigma^+U^\\top`)}
          <p>(Moore-Penrose-Pseudoinverse, $\\Sigma^+ = \\diag(1/\\sigma_1, \\dots, 1/\\sigma_R, 0, \\dots)^\\top$).</p>
          <h3>Berechnung</h3>
          <p>Nie $A^\\top A$ explizit bilden ($\\tfrac12 MN^2$ Operationen und quadrierte Kondition). Stattdessen mit Householder von links und rechts auf <b>Bidiagonalform</b> $B$ bringen: $PAQ = \\binom{B}{0}$. $A$ und $B$ haben dieselben Singulärwerte, $B^\\top B$ ist tridiagonal, und deren EW liefert der QR-Algorithmus (${nmSee("6.3")}) ohne $B^\\top B$ aufzustellen.</p>
          <p class="small muted">Anwendungen: Bildkompression, Rauschfilterung, PCA, Latent Semantic Analysis.</p>
        </div>
        ${nmTraps([
          "Singulärwerte sind nicht die Eigenwerte von $A$ — nur für symmetrisch positiv semidefinite $A$ stimmen sie überein (für symmetrische $A$: $\\sigma = |\\lambda|$).",
          "$\\|A - B\\|_2 \\ge \\sigma_{k+1}$ für jede Rang-$k$-Matrix $B$ (WS 22/23): Gleichheit für $B = A_k$.",
          "$U$ ergänzt man zu einer Orthonormalbasis, wenn $R < M$.",
        ])}`,
      setup: (root) => nmWSvd(root),
      check: [
        { q: "Wie hängen die Singulärwerte von $A$ mit $A^\\top A$ zusammen?", opts: ["$\\sigma_n^2$ sind die Eigenwerte von $A^\\top A$", "$\\sigma_n$ sind die Eigenwerte von $A^\\top A$", "$\\sigma_n$ sind die Diagonalelemente von $A$", "$\\sigma_n = \\lambda_n(A)^2$"], why: "$A^\\top A = V\\Sigma^\\top\\Sigma V^\\top = V\\diag(\\sigma_1^2, \\dots)V^\\top$." },
        { q: "$A$ hat die Singulärwerte $5$, $2$, $0{,}1$. Was ist $\\|A\\|_2$ und $\\cond_2(A)$?", opts: ["$5$ und $50$", "$5$ und $25$", "$0{,}1$ und $50$", "$7{,}1$ und $50$"], why: "$\\|A\\|_2 = \\sigma_1$, $\\cond_2 = \\sigma_1/\\sigma_N$." },
        { q: "Wie groß ist $\\|A - A_1\\|_2$ für die beste Rang-1-Näherung?", opts: ["$\\sigma_2$", "$\\sigma_1$", "$\\sigma_1 - \\sigma_2$", "$\\sqrt{\\sigma_2^2 + \\cdots}$"], why: "In der 2-Norm bleibt der größte weggelassene Singulärwert. In der Frobeniusnorm wäre es $\\sqrt{\\sigma_2^2 + \\cdots}$." },
        { q: "Für welche Matrizen sind Singulärwerte und Eigenwerte gleich?", opts: ["Symmetrisch positiv semidefinite", "Alle quadratischen", "Alle orthogonalen", "Alle Dreiecksmatrizen"], why: "SS 22: dann ist $A = V\\Lambda V^\\top$ mit $\\Lambda \\ge 0$ schon eine SWZ." },
      ],
    },
  ],
});

/* ================================================================ Kapitel 3 */

const NM_NEWTON_FNS = {
  sqrt: { name: "x² − 2", f: (x) => x * x - 2, d: (x) => 2 * x, root: Math.SQRT2, dom: [-0.5, 3], y: [-3, 7], x0: 3, say: "Die Wurzel der Vorlesung: x<sub>k+1</sub> = ½(x<sub>k</sub> + 2/x<sub>k</sub>). Für x₀ &gt; 0 konvergiert es gegen √2, für x₀ &lt; 0 gegen −√2." },
  inv: { name: "1/x − 1", f: (x) => 1 / x - 1, d: (x) => -1 / (x * x), root: 1, dom: [-1, 3.5], y: [-3, 4], x0: 0.3, say: "Konvergenz nur für x₀ ∈ (0, 2). Bei x₀ = 0 oder 2 nicht durchführbar, sonst Divergenz gegen −∞ (Übung 1)." },
  atan: { name: "arctan x", f: Math.atan, d: (x) => 1 / (1 + x * x), root: 0, dom: [-4, 4], y: [-1.6, 1.6], x0: 1.2, say: "Konvergiert nur für |x₀| &lt; 1,39…, sonst springen die Iterierten immer weiter nach außen." },
  cube: { name: "x³ (dreifache Nullstelle)", f: (x) => x ** 3, d: (x) => 3 * x * x, root: 0, dom: [-1.2, 1.6], y: [-1.5, 4], x0: 1.4, say: "f′(x*) = 0: die Voraussetzung des Konvergenzsatzes fehlt. x<sub>k+1</sub> = ⅔x<sub>k</sub> — nur noch <b>linear</b>." },
  cyc: { name: "x³ − 2x + 2", f: (x) => x ** 3 - 2 * x + 2, d: (x) => 3 * x * x - 2, root: -1.7692923542386314, dom: [-2.5, 2], y: [-4, 6], x0: 0, say: "Für x₀ = 0 springt Newton zwischen 0 und 1 hin und her: ein Zyklus. Der Startwert entscheidet." },
};

function nmWNewton1(root) {
  const { w, fig, read } = ppW(root, "nt1");
  const st = { fn: "sqrt", x0: 3 };
  const draw = () => {
    const F0 = NM_NEWTON_FNS[st.fn], [a, b] = F0.dom;
    const x0 = a + (st.x0 / 100) * (b - a);
    lenOut(w, "x0", nmD(x0, 3));
    const xs = [x0];
    for (let k = 0; k < 7; k++) {
      const x = xs[k], d = F0.d(x);
      if (!isFinite(x) || Math.abs(d) < 1e-14 || Math.abs(x) > 1e6) break;
      xs.push(x - F0.f(x) / d);
    }
    const P = nmFrame(520, 280, [a, b], F0.y);
    const inFrame = (x) => x >= a - 1e-9 && x <= b + 1e-9;
    let steps = "";
    for (let k = 0; k + 1 < xs.length && k < 6; k++) {
      const x = xs[k], y = F0.f(x), x1 = xs[k + 1];
      if (!inFrame(x)) break;
      const t = (z) => F0.d(x) * (z - x) + y;
      steps += `<line x1="${P.X(x)}" y1="${P.Y(0)}" x2="${P.X(x)}" y2="${P.Y(Math.max(Math.min(y, F0.y[1]), F0.y[0]))}" class="guide"/>
        <line x1="${P.X(Math.max(a, Math.min(x, x1)))}" y1="${P.Y(t(Math.max(a, Math.min(x, x1))))}" x2="${P.X(Math.min(b, Math.max(x, x1)))}" y2="${P.Y(t(Math.min(b, Math.max(x, x1))))}" class="nm-tangent" style="opacity:${1 - k * 0.12}"/>
        <circle cx="${P.X(x)}" cy="${P.Y(Math.max(Math.min(y, F0.y[1]), F0.y[0]))}" r="3.5" class="pt nm-approx-pt"/>
        ${k < 4 ? `<text x="${P.X(x)}" y="${P.Y(0) + (k % 2 ? 30 : 18)}" text-anchor="middle" class="cap nm-approx-t">x${"₀₁₂₃₄"[k]}</text>` : ""}`;
    }
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 280" role="img" aria-label="Newton-Verfahren mit Tangenten">
      <defs><clipPath id="nmNtClip"><rect x="34" y="12" width="474" height="242"/></clipPath></defs>
      ${P.axes({ xl: "x" })}<g clip-path="url(#nmNtClip)"><path d="${P.path(F0.f, 400)}" class="curve" style="color:var(--text)"/>${steps}</g>
      <circle cx="${P.X(F0.root)}" cy="${P.Y(0)}" r="5" class="pt nm-exact-pt"/></svg>`;
    const rows = xs.map((x, k) => {
      const e = Math.abs(x - F0.root), ep = k ? Math.abs(xs[k - 1] - F0.root) : null;
      return `<tr><td>${k}</td><td>${Math.abs(x) > 1e5 ? nmSci(x) : nmD(x, 10)}</td><td class="nm-err">${nmSci(e)}</td><td>${ep && ep > 1e-15 && e > 1e-15 ? nmD(e / ep ** 2, 3) : ""}</td><td>${ep && ep > 1e-15 && e > 1e-15 ? nmD(e / ep, 3) : ""}</td></tr>`;
    }).join("");
    read.innerHTML = `${F(`x<sub>k+1</sub> = x<sub>k</sub> − ${frac("f(x<sub>k</sub>)", "f′(x<sub>k</sub>)")}`, "small-f")}
      <table class="len-terms nm-tab"><thead><tr><th>k</th><th>x<sub>k</sub></th><th>|x<sub>k</sub> − x*|</th><th>e<sub>k</sub>/e<sub>k−1</sub>²</th><th>e<sub>k</sub>/e<sub>k−1</sub></th></tr></thead><tbody>${rows}</tbody></table>
      <p class="small">${F0.say}</p>`;
  };
  lenWire(w, st, draw);
  $$('[data-seg="fn"] button', w).forEach((b) => b.addEventListener("click", () => {
    const F0 = NM_NEWTON_FNS[st.fn];
    st.x0 = ((F0.x0 - F0.dom[0]) / (F0.dom[1] - F0.dom[0])) * 100;
    $('input[data-k="x0"]', w).value = st.x0;
    draw();
  }));
  st.x0 = ((3 - -0.5) / 3.5) * 100;
  $('input[data-k="x0"]', w).value = st.x0;
  draw();
}

// Circle x² + y² = 2 and hyperbola x² − y² = 1 (WS 17/18), with Newton or simplified Newton.
function nmWNewton2(root) {
  const { w, fig, read } = ppW(root, "nt2");
  const st = { s: 0, simp: 0 };
  const STARTS = [[1, -1], [2, 2], [0.4, 0.3], [-1.6, 0.6], [0.0001, 1]];
  const f = ([x, y]) => [x * x + y * y - 2, x * x - y * y - 1], J = ([x, y]) => [[2 * x, 2 * y], [2 * x, -2 * y]];
  const draw = () => {
    const x0 = STARTS[st.s], xs = [x0], J0 = J(x0);
    for (let k = 0; k < 8; k++) {
      const d = nmSolve(st.simp ? J0 : J(xs[k]), f(xs[k]).map((v) => -v));
      if (!d) break;
      xs.push([xs[k][0] + d[0], xs[k][1] + d[1]]);
      if (nmN2(d) < 1e-13 || nmN2(xs[k + 1]) > 1e4) break;
    }
    const root2 = [Math.sign(xs[xs.length - 1][0]) * Math.sqrt(1.5), Math.sign(xs[xs.length - 1][1]) * Math.sqrt(0.5)];
    const P = nmFrame(360, 300, [-2.6, 2.6], [-2.2, 2.2]);
    const hyp = (s) => { let d = ""; for (let i = 0; i <= 100; i++) { const t = -1.6 + (3.2 * i) / 100; d += `${i ? "L" : "M"}${P.X(s * Math.cosh(t)).toFixed(1)},${P.Y(Math.sinh(t)).toFixed(1)}`; } return d; };
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 360 300" role="img" aria-label="Kreis und Hyperbel mit Newton-Iterierten">
      <defs><clipPath id="nmNt2Clip"><rect x="34" y="12" width="314" height="262"/></clipPath></defs>
      ${P.axes({ xl: "x", yl: "y" })}<g clip-path="url(#nmNt2Clip)">
      <circle cx="${P.X(0)}" cy="${P.Y(0)}" r="${P.X(Math.SQRT2) - P.X(0)}" class="curve" fill="none" style="color:var(--muted)"/>
      <path d="${hyp(1)}" class="curve" style="color:var(--muted)"/><path d="${hyp(-1)}" class="curve" style="color:var(--muted)"/>
      <polyline points="${xs.map((p) => `${P.X(p[0]).toFixed(1)},${P.Y(p[1]).toFixed(1)}`).join(" ")}" class="curve nm-approx-c" style="stroke-width:2"/>
      ${xs.map((p, k) => `<circle cx="${P.X(p[0])}" cy="${P.Y(p[1])}" r="${k ? 3.5 : 5.5}" class="pt nm-approx-pt"/>`).join("")}</g>
      ${[1, -1].flatMap((a) => [1, -1].map((b) => `<circle cx="${P.X(a * Math.sqrt(1.5))}" cy="${P.Y(b * Math.sqrt(0.5))}" r="5" class="pt nm-exact-pt"/>`)).join("")}</svg>`;
    const singular = Math.abs(x0[0] * x0[1]) < 1e-3;
    read.innerHTML = `${F(`f(x, y) = ${cv(["x² + y² − 2", "x² − y² − 1"])},  f′ = ${mx([["2x", "2y"], ["2x", "−2y"]])}`, "small-f")}
      <table class="len-terms nm-tab"><thead><tr><th>k</th><th>x<sub>k</sub></th><th>‖x<sub>k</sub> − x*‖</th></tr></thead><tbody>
      ${xs.slice(0, 7).map((p, k) => `<tr><td>${k}</td><td>(${nmD(p[0], 6)}; ${nmD(p[1], 6)})</td><td class="nm-err">${nmSci(nmN2([p[0] - root2[0], p[1] - root2[1]]))}</td></tr>`).join("")}</tbody></table>
      <p class="small">${singular ? "Bei x = 0 oder y = 0 ist det f′ = −8xy fast 0: der erste Schritt springt weit weg." : st.simp ? "Vereinfacht: immer dieselbe Matrix f′(x₀), eine LR-Zerlegung — der Fehler fällt nur noch um einen festen Faktor (linear)." : "Volles Newton: in jedem Schritt ein LGS mit f′(x<sub>k</sub>). Nahe der Lösung verdoppeln sich die richtigen Stellen."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

NUMA_CHAPTERS.push({
  n: 3, vl: "VL01", title: "Newton-Verfahren", next: "Interpolation",
  headline: "Nichtlineare <span class=\"accent\">Gleichungen</span>",
  intro: "Für f(x) = 0 gibt es keine Lösungsformel wie im linearen Fall. Das Newton-Verfahren ersetzt f immer wieder durch seine Tangente — und konvergiert nahe der Lösung quadratisch. Die Vorlesung begann mit diesem Kapitel.",
  sections: [
    {
      id: "3.1", title: "Newton in einer Dimension", short: "Newton 1D", about: "Kondition, Tangente, Wurzelberechnung, quadratische Konvergenz, Divergenz",
      html: () => `
        ${nmGist([
          `Die Nullstelle der Tangente $t_k(x) = f'(x_k)(x - x_k) + f(x_k)$ ist die nächste Iterierte: <b>$x_{k+1} = x_k - \\dfrac{f(x_k)}{f'(x_k)}$</b>.`,
          `Nahe einer einfachen Nullstelle konvergiert es <b>lokal quadratisch</b>: $|x^* - x_{k+1}| \\le C\\,|x^* - x_k|^2$. Weit weg kann es divergieren.`,
          `Kondition: $|x^* - x^*(\\varepsilon)| \\le |f'(x^*)^{-1}|\\,|\\varepsilon| + O(\\varepsilon^2)$ — je steiler $f$ in $x^*$, desto besser konditioniert.`,
        ])}
        <div class="card">
          <h3>Beispiel der Vorlesung: Quadratwurzel</h3>
          <p>Für $f(x) = x^2 - a$ ist $x_{k+1} = x_k - \\frac{x_k^2 - a}{2x_k} = \\frac12\\big(x_k + \\frac{a}{x_k}\\big)$. Mit der binomischen Formel:</p>
          ${tx(`x_{k+1} - \\sqrt a = \\frac{1}{2x_k}\\,\\big(x_k - \\sqrt a\\big)^2`)}
          <p>Im Rechner: $a = (1 + m_a)\\cdot 2^{e_a}$, also $\\sqrt a = \\sqrt{1 + m_a}\\cdot 2^{e_a/2}$ ($e_a$ gerade) bzw. $\\sqrt{1 + m_a}\\,\\sqrt2\\cdot 2^{(e_a-1)/2}$. Man braucht nur $\\sqrt b$ für $b \\in (1, 2)$ (oder $(1, 4)$, SS 22) — mit $x_0 = 1$ ist der Fehler nach drei Schritten unter $2^{-15}$.</p>
          <p><b>Umkehrfunktion</b> (WS 24/25): $x = f^{-1}(y)$ ist Nullstelle von $g(x) = f(x) - y$. Für $\\exp(e - 1)$ mit $f = \\ln$, $x_0 = e$: $x_1 = e - (\\ln e - (e - 1))\\cdot e = e(e - 1) \\approx 4{,}67$.</p>
        </div>
        ${pw("nt1", `${pseg("fn", Object.entries(NM_NEWTON_FNS).map(([k, v]) => [k, v.name]), "sqrt")}${pslider("x0", "Startwert x₀", 0, 100, 0.2, 100)}`, { wide: true })}
        ${nmTraps([
          "Quadratische Konvergenz braucht $f'(x^*) \\neq 0$. Bei mehrfachen Nullstellen ($x^3$, $x^{2020}$ in WS 19/20) nur linear: $x_{k+1} = (1 - \\frac1p)\\,x_k$.",
          "$x_0 = 1$ bei $\\sqrt a$: $x_1 = \\frac{1 + a}{2} > \\sqrt a$, danach fällt die Folge monoton (Skizze SS 22).",
          "Für lineares $f(x) = Ax - b$ ist Newton nach <b>einem</b> Schritt exakt (WS 19/20): $x_1 = x_0 - A^{-1}(Ax_0 - b) = A^{-1}b$.",
        ])}`,
      setup: (root) => nmWNewton1(root),
      check: [
        { q: "Newton für $f(x) = x^2 - 9$ mit $x_0 = 1$. Was ist $x_1$?", opts: ["$5$", "$3$", "$4$", "$-4$"], why: "$x_1 = \\frac12(1 + 9/1) = 5$." },
        { q: "Was heißt lokal quadratische Konvergenz?", opts: ["$\\|x^* - x_{k+1}\\| \\le C\\|x^* - x_k\\|^2$ für Startwerte nah genug an $x^*$", "Konvergenz für jeden Startwert", "Der Fehler halbiert sich in jedem Schritt", "Nach $N$ Schritten exakt"], why: "Die Zahl richtiger Stellen verdoppelt sich ungefähr — aber nur nahe $x^*$." },
        { q: "Warum konvergiert Newton für $f(x) = x^3$ nur linear?", opts: ["$f'(x^*) = 0$: die Nullstelle ist mehrfach", "$f$ ist nicht stetig", "Der Startwert ist zu weit weg", "$f''$ existiert nicht"], why: "$x_{k+1} = x_k - \\frac{x_k^3}{3x_k^2} = \\frac23 x_k$." },
        { q: "Für welche Startwerte konvergiert Newton für $f(x) = \\frac1x - 1$?", opts: ["$x_0 \\in (0, 2)$", "alle $x_0 > 0$", "alle $x_0 \\neq 0$", "$x_0 \\in (-1, 1)$"], why: "$x_{k+1} = 2x_k - x_k^2$. Übung 1: für $x_0 \\notin [0, 2]$ Divergenz, bei $0$ und $2$ nicht durchführbar." },
      ],
    },
    {
      id: "3.2", title: "Newton in N Dimensionen", short: "Newton ND", about: "Jacobi-Matrix, LGS pro Schritt, Konvergenzsatz, Stoppkriterium, vereinfacht, gedämpft",
      html: () => `
        ${nmGist([
          `$f\\colon D \\subset \\R^N \\to \\R^N$. Statt durch $f'$ zu teilen, löst man in jedem Schritt ein <b>LGS</b>: $f'(x_k)\\,d_k = -f(x_k)$, $x_{k+1} = x_k + d_k$.`,
          `<b>Stopp</b>, wenn $\\|d_k\\| < \\varepsilon$ — vorsichtig mit $\\|f(x_k)\\| < \\varepsilon$: $\\lambda f$ hat dieselben Nullstellen und dieselben Iterierten.`,
          `<b>Vereinfacht</b>: $A \\approx f'(x_0)$ nur einmal zerlegen — billiger pro Schritt, aber nur noch lokal linear.`,
        ])}
        <div class="card">
          <h3>Herleitung und Algorithmus</h3>
          <p>Taylor um $x_0$ nahe $x^*$: $0 = f(x^*) = f(x_0) + f'(x_0)(x^* - x_0) + O(\\|x_0 - x^*\\|^2)$. Ohne den quadratischen Rest: $x^* \\approx x_0 - f'(x_0)^{-1}f(x_0)$.</p>
          <ol class="nm-ol">
            <li><b>S0</b> Wähle $x_0 \\in D$ und eine Toleranz $\\varepsilon$, $k = 0$.</li>
            <li><b>S1</b> Löse $f'(x_k)\\,d_k = -f(x_k)$ (z. B. LR-Zerlegung), $x_{k+1} = x_k + d_k$.</li>
            <li><b>S2</b> Falls $\\|d_k\\| < \\varepsilon$: STOPP, sonst $k$ um 1 erhöhen, weiter mit S1.</li>
          </ol>
          <h3>Satz: lokal quadratische Konvergenz</h3>
          <p>$D$ offen, $f \\in C^2(D, \\R^N)$, $f(x^*) = 0$ und $f'(x^*)$ <b>regulär</b>. Dann gibt es eine Kugel $K = \\{\\|x - x^*\\| \\le \\rho\\} \\subset D$, in der $x^*$ die einzige Nullstelle ist, alle Iterierten in $K$ bleiben, $x_k \\to x^*$ und $\\|x^* - x_k\\| \\le C\\,\\|x^* - x_{k-1}\\|^2$.</p>
          <h3>Warum $\\|f(x_k)\\|$ ein schlechtes Stoppkriterium ist (SS 26)</h3>
          <p>Aus der Taylorentwicklung: $\\|x_k - x^*\\| \\approx \\|f'(x^*)^{-1}f(x_k)\\| \\le \\|f'(x^*)^{-1}\\|\\,\\|f(x_k)\\|$. Ist $\\|f'(x^*)^{-1}\\|$ groß, sagt ein kleines $\\|f(x_k)\\|$ nichts über den Fehler.</p>
          ${ppFacts([
            ["vereinfacht", "$A\\,d_k = -f(x_k)$ mit festem $A \\approx f'(x_0)$: eine LR-Zerlegung für alle Schritte, je Schritt nur $N^2$ statt $\\tfrac13 N^3$. Lokal linear: $\\|x^* - x_k\\| \\le C\\theta^k\\|x^* - x_0\\|$, $\\theta \\in (0, 1)$."],
            ["gedämpft", "$x_{k+1} = x_k - t_k f'(x_k)^{-1}f(x_k)$ mit $t_k \\in (0, 1]$, so dass $\\|f(x_{k+1})\\| < \\|f(x_k)\\|$: bessere globale Konvergenz, aber nur linear."],
            ["Homotopie", "$f_s(x) = (1 - s)\\,g(x) + s\\,f(x)$ mit einfachem $g$ und bekannter Nullstelle; $s$ schrittweise von $0$ auf $1$."],
            ["Differenzen", "Ist $f'$ teuer: $(A_k)_{nm} = \\frac1h\\big(f_n(x_k + he_m) - f_n(x_k)\\big)$."],
          ])}
        </div>
        ${pw("nt2", `${pseg("s", [[0, "x₀ = (1, −1)"], [1, "(2, 2)"], [2, "(0,4; 0,3)"], [3, "(−1,6; 0,6)"], [4, "(≈0, 1)"]], 0)}${pseg("simp", [[0, "Newton"], [1, "vereinfacht"]], 0)}`, { wide: true })}
        <p class="small muted">Schnittpunkt von Kreis $x^2 + y^2 = 2$ und Hyperbel $x^2 - y^2 = 1$ (WS 17/18): die Lösungen sind $\\big(\\pm\\sqrt{1{,}5},\\ \\pm\\sqrt{0{,}5}\\big)$.</p>
        ${nmTraps([
          "Nie $f'(x_k)^{-1}$ berechnen — ein LGS lösen.",
          "Konvergiert Newton für $f \\in C^1$, dann immer gegen eine Lösung.",
          "Lückentext SS 17: in jedem Schritt muss ein <b>lineares Gleichungssystem</b> gelöst werden; beim vereinfachten Verfahren ersetzt man $f'(x_k)$ durch $f'(x_0)$ und braucht <b>eine</b> LR-Zerlegung.",
        ])}`,
      setup: (root) => nmWNewton2(root),
      check: [
        { q: "Was wird in jedem Schritt des Newton-Verfahrens in $N$ Dimensionen gelöst?", opts: ["$f'(x_k)\\,d_k = -f(x_k)$", "$f(x_k)\\,d_k = -f'(x_k)$", "$f'(x_k)^{-1}$ wird berechnet", "$f(x_k + d_k) = 0$"], why: "Die Jacobi-Matrix wird nicht invertiert; man löst das lineare System." },
        { q: "Was ist der Nachteil des vereinfachten Newton-Verfahrens?", opts: ["Nur noch lokal lineare Konvergenz", "Mehr LR-Zerlegungen", "Es konvergiert nie", "Es braucht die zweite Ableitung"], why: "Die feste Matrix spart Aufwand, kostet aber die quadratische Konvergenz." },
        { q: "Welche Voraussetzung braucht der Satz über lokal quadratische Konvergenz?", opts: ["$f'(x^*)$ regulär", "$f$ linear", "$x_0 = 0$", "$f'(x)$ regulär für alle $x$"], why: "Regulär in der Lösung ($f \\in C^2$); dann gibt es eine Kugel um $x^*$, in der es klappt." },
        { q: "$f(x) = Ax - b$, $A$ regulär. Nach wie vielen Newton-Schritten ist man exakt?", opts: ["nach einem", "nach $N$", "nie", "nach zwei"], why: "$f' = A$, also $x_1 = x_0 - A^{-1}(Ax_0 - b) = A^{-1}b$." },
      ],
    },
    {
      id: "3.3", title: "Anwendungen", short: "Anwendungen", about: "Minimierung über ∇f = 0, Umkehrfunktion, nichtlineare Ausgleichsrechnung",
      html: () => `
        ${nmGist([
          `<b>Minimieren</b>: ein Minimum von $f\\colon \\R^N \\to \\R$ erfüllt $\\nabla f(x^*) = 0$. Newton auf $F(x) = \\nabla f(x)^\\top$, mit der Hesse-Matrix als Jacobi-Matrix.`,
          `<b>Umkehrfunktion</b>: $f^{-1}(y)$ als Nullstelle von $f(x) - y$.`,
          `<b>Nichtlinearer Ausgleich</b>: $\\|f(x)\\|_2 = \\min!$ durch eine Folge linearer Ausgleichsprobleme (Gauß-Newton).`,
        ])}
        <div class="card">
          <h3>Newton für ein Minimum (WS 19/20, Übung 7)</h3>
          ${tx(`H_f(x_k)\\,d_k = -\\nabla f(x_k)^\\top, \\qquad x_{k+1} = x_k + d_k`)}
          <p>Beispiel $f(x) = \\cos x_1 + x_1e^{x_2}$, $x_0 = 0$: $\\nabla f = (-\\sin x_1 + e^{x_2},\\ x_1e^{x_2}) = (1, 0)$, $H_f = \\begin{pmatrix}-\\cos x_1 & e^{x_2}\\\\ e^{x_2} & x_1e^{x_2}\\end{pmatrix} = \\begin{pmatrix}-1&1\\\\1&0\\end{pmatrix}$. Aus $H_f\\,d = -(1, 0)^\\top$ folgt $d = (0, -1)^\\top$, also $x_1 = (0, -1)^\\top$.</p>
          <p class="small muted">Newton findet einen stationären Punkt — ob Minimum, Maximum oder Sattel, entscheidet die Hesse-Matrix dort.</p>
          <h3>Weitere Anwendungen der Vorlesung</h3>
          ${ppFacts([
            ["inverse Kinematik", "Gelenkwinkel eines Roboterarms zu einer gewünschten Position: ein nichtlineares System."],
            ["Teilproblem", "Implizite Verfahren und Ausgleichsprobleme führen auf nichtlineare Systeme."],
            ["Fast inverse square root", "Übung 2: $1/\\sqrt y$ mit einer Bitmanipulation als Startwert und einem Newton-Schritt für $f(x) = 1/x^2 - y$."],
            ["Einheitswurzeln", "Übung 1: $z^3 = 1$ in $\\mathbb{C}$ als System in $\\R^2$ für $(\\operatorname{Re} z, \\operatorname{Im} z)$."],
          ])}
          <h3>Lösbarkeit</h3>
          <p>Keine Lösung ($e^x$), mehrere ($x^2 - a$) oder unendlich viele ($x\\sin\\frac1x$) — und selbst eine Formel wie $\\sqrt a$ hilft dem Rechner nicht. Die Lösung wird approximiert: es bleibt ein Approximationsfehler.</p>
        </div>
        ${nmTraps([
          "Beim Minimieren ist die Jacobi-Matrix von $\\nabla f$ die <b>Hesse-Matrix</b> (symmetrisch) — nicht $f'$.",
          "Die Kondition des Nullstellenproblems $f(x) = 0$ ist $|f'(x^*)^{-1}|$: flache Funktionen sind schlecht konditioniert, $f'(x^*) = 0$ heißt „nicht sachgemäß gestellt“.",
        ])}`,
      check: [
        { q: "Newton für $\\min f(x)$: welche Gleichung löst man?", opts: ["$\\nabla f(x) = 0$ mit der Hesse-Matrix als Jacobi-Matrix", "$f(x) = 0$", "$f'(x) = f(x)$", "$H_f(x) = 0$"], why: "Notwendige Bedingung eines Minimums: der Gradient verschwindet." },
        { q: "Wie berechnet man $x = f^{-1}(y)$ mit Newton, wenn $f^{-1}$ unbekannt ist?", opts: ["Nullstelle von $g(x) = f(x) - y$", "Nullstelle von $f^{-1}(x) - y$", "Fixpunkt von $f$", "Minimum von $f$"], why: "$g' = f'$, also $x_{k+1} = x_k - \\frac{f(x_k) - y}{f'(x_k)}$." },
        { q: "Wie wird ein nichtlineares Ausgleichsproblem $\\|f(x)\\|_2 = \\min!$ gelöst?", opts: ["Iterativ durch lineare Ausgleichsprobleme", "Mit einer Cholesky-Zerlegung von $f$", "Mit dem QR-Algorithmus", "Gar nicht"], why: "In jedem Schritt wird $f$ linearisiert." },
        { q: "Was ist $|f'(x^*)| \\approx 0$ für das Nullstellenproblem?", opts: ["schlecht konditioniert", "gut konditioniert", "instabil", "quadratisch konvergent"], why: "$|x^* - x^*(\\varepsilon)| \\approx |\\varepsilon|/|f'(x^*)|$: kleine Störungen verschieben die Nullstelle stark." },
      ],
    },
  ],
});
