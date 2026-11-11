// LEN exam-style tasks, made up fresh each time: one generator per kind of sub-question the old
// exams keep asking (len-exams.js), with random but sensible values, its circuit drawn, answers the
// page can check and a worked solution. Used by the Practice and Mock exam tabs (len-practice.js).
//
// A generator returns a task:
//   { gen, topic, tags, title: [de, en], intro: html, fig: svg, parts: [part], steps: html }
// and a part is either a number to type in:
//   { ask: html, ans: number, unit, pts, tol? (relative, default 2 %) }
// or a choice:
//   { ask: html, mc: [html, …] (the first is right; shown shuffled), pts }
// All text is in both languages (L(), nb() from len.js), so nothing needs redrawing on a switch.

/* ---------------------------------------------------------------- Maths */

const cx = (re, im = 0) => ({ re, im });
const cAdd = (a, b) => cx(a.re + b.re, a.im + b.im);
const cMul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
const cDiv = (a, b) => { const d = b.re * b.re + b.im * b.im; return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d); };
const cAbs = (a) => Math.hypot(a.re, a.im);
const cDeg = (a) => (Math.atan2(a.im, a.re) * 180) / Math.PI;
const cConj = (a) => cx(a.re, -a.im);
// A complex number written out: 3 + j4 (both languages).
const cs = (z, d) => `${nb(z.re, d)} ${z.im < 0 ? "−" : "+"} j${nb(Math.abs(z.im), d)}`;

const rInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rPick = (a) => a[Math.floor(Math.random() * a.length)];
const rSign = () => (Math.random() < 0.5 ? -1 : 1);
const deg = (rad) => (rad * 180) / Math.PI;
const log10 = Math.log10;

/* ---------------------------------------------------------------- Drawing */

// A subscript inside SVG text: R<sub>L</sub>.
const sv = (name, sub = "") => `${name}${sub !== "" ? `<tspan class="sub" dy="4">${sub}</tspan><tspan dy="-4"> </tspan>` : ""}`;

// A two-terminal on a straight wire from (x1,y1) to (x2,y2): R, L, C, V (voltage source), I
// (current source) or a plain wire, with its label beside it (side −1 puts it on the other side).
function ckt(kind, x1, y1, x2, y2, label = "", side = 1) {
  const dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), a = deg(Math.atan2(dy, dx));
  const hw = { R: 20, L: 20, C: 5, V: 14, I: 14, W: 0 }[kind];
  const sym = {
    R: '<rect class="el" x="-20" y="-8" width="40" height="16" rx="2"/>',
    L: '<path class="w" d="M-20,0 a5,5 0 0,1 10,0 a5,5 0 0,1 10,0 a5,5 0 0,1 10,0 a5,5 0 0,1 10,0"/>',
    C: '<line class="w thick" x1="-5" y1="-13" x2="-5" y2="13"/><line class="w thick" x1="5" y1="-13" x2="5" y2="13"/>',
    V: '<circle class="el" r="14"/><line class="w" x1="-14" y1="0" x2="14" y2="0"/>',
    I: '<circle class="el" r="14"/><line class="w" x1="0" y1="-14" x2="0" y2="14"/>',
    W: "",
  }[kind];
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, horiz = Math.abs(dx) >= Math.abs(dy);
  const lx = horiz ? mx : mx + side * 22, ly = horiz ? (side > 0 ? my - 17 : my + 27) : my + 5;
  return `<g transform="translate(${r1(mx)} ${r1(my)}) rotate(${r1(a)})"><line class="w" x1="${r1(-d / 2)}" y1="0" x2="${-hw}" y2="0"/>` +
    `<line class="w" x1="${hw}" y1="0" x2="${r1(d / 2)}" y2="0"/>${sym}</g>` +
    (label ? `<text x="${r1(lx)}" y="${r1(ly)}" text-anchor="${horiz ? "middle" : side > 0 ? "start" : "end"}" class="lbl">${label}</text>` : "");
}
const wire = (...pts) => `<polyline class="w" points="${pts.map((p) => p.join(",")).join(" ")}"/>`;
const node = (x, y) => `<circle class="dot" cx="${x}" cy="${y}" r="3.5"/>`;
const term = (x, y) => `<circle class="term" cx="${x}" cy="${y}" r="4.5"/>`;
const gnd = (x, y) => `<line class="w" x1="${x}" y1="${y}" x2="${x}" y2="${y + 8}"/><line class="w" x1="${x - 12}" y1="${y + 8}" x2="${x + 12}" y2="${y + 8}"/>` +
  `<line class="w" x1="${x - 7}" y1="${y + 13}" x2="${x + 7}" y2="${y + 13}"/><line class="w" x1="${x - 3}" y1="${y + 18}" x2="${x + 3}" y2="${y + 18}"/>`;
const txt = (x, y, s, cls = "lbl", anchor = "middle") => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="${cls}">${s}</text>`;
// A mesh current: a circular arrow with its name.
function loopArrow(x, y, label, cw = true) {
  const r = 22;
  const path = cw ? `M${x - r},${y} A${r},${r} 0 1,1 ${x},${y + r}` : `M${x + r},${y} A${r},${r} 0 1,0 ${x},${y + r}`;
  return `<path class="loop" d="${path}"/>${cw ? arrowSVG(x + 6, y + r, x - 2, y + r, "hl", 2.5, 9) : arrowSVG(x - 6, y + r, x + 2, y + r, "hl", 2.5, 9)}` +
    txt(x, y + 5, label, "lbl tc q-hl");
}
// An ideal op-amp: inverting input at (x, y−15), non-inverting at (x, y+15), output at (x+70, y).
const opamp = (x, y) => `<polygon class="el" points="${x},${y - 38} ${x},${y + 38} ${x + 70},${y}"/>` +
  txt(x + 10, y - 10, "−", "lbl", "start") + txt(x + 10, y + 21, "+", "lbl", "start");
const fig = (w, h, inner) => svgBox(w, h, inner, "lp-svg");

/* ---------------------------------------------------------------- Network */

const OHM = [1, 2, 3, 4, 5, 6, 8, 10, 12];

function genStar() {
  const toStar = Math.random() < 0.5;
  const steps = [];
  let given, parts;
  if (toStar) {
    const [a, b, c] = [rPick(OHM), rPick(OHM), rPick(OHM)]; // R12, R23, R31
    const s = a + b + c;
    const R1 = (a * c) / s, R2 = (b * a) / s, R3 = (c * b) / s;
    given = `R<sub>12</sub> = ${a} Ω, R<sub>23</sub> = ${b} Ω, R<sub>31</sub> = ${c} Ω`;
    parts = [["R<sub>1</sub>", R1], ["R<sub>2</sub>", R2], ["R<sub>3</sub>", R3]];
    steps.push(L("Dreieck → Stern: Produkt der beiden anliegenden Dreieckswiderstände durch die Summe aller drei.", "Delta → star: the product of the two adjacent delta resistors over the sum of all three."),
      F(`R<sub>1</sub> = ${frac("R<sub>12</sub>R<sub>31</sub>", "R<sub>12</sub> + R<sub>23</sub> + R<sub>31</sub>")} = ${frac(`${a} · ${c}`, `${s}`)} Ω = ${nb(R1)} Ω`, "small-f"),
      F(`R<sub>2</sub> = ${frac(`${b} · ${a}`, `${s}`)} Ω = ${nb(R2)} Ω &nbsp;&nbsp; R<sub>3</sub> = ${frac(`${c} · ${b}`, `${s}`)} Ω = ${nb(R3)} Ω`, "small-f"));
  } else {
    const [a, b, c] = [rPick(OHM), rPick(OHM), rPick(OHM)]; // R1, R2, R3
    const R12 = a + b + (a * b) / c, R23 = b + c + (b * c) / a, R31 = c + a + (c * a) / b;
    given = `R<sub>1</sub> = ${a} Ω, R<sub>2</sub> = ${b} Ω, R<sub>3</sub> = ${c} Ω`;
    parts = [["R<sub>12</sub>", R12], ["R<sub>23</sub>", R23], ["R<sub>31</sub>", R31]];
    steps.push(L("Stern → Dreieck: Summe der beiden anliegenden Sternwiderstände plus ihr Produkt durch den dritten.", "Star → delta: the sum of the two adjacent star resistors plus their product over the third."),
      F(`R<sub>12</sub> = R<sub>1</sub> + R<sub>2</sub> + ${frac("R<sub>1</sub>R<sub>2</sub>", "R<sub>3</sub>")} = ${a} + ${b} + ${frac(`${a} · ${b}`, c)} = ${nb(R12)} Ω`, "small-f"),
      F(`R<sub>23</sub> = ${b} + ${c} + ${frac(`${b} · ${c}`, a)} = ${nb(R23)} Ω &nbsp;&nbsp; R<sub>31</sub> = ${c} + ${a} + ${frac(`${c} · ${a}`, b)} = ${nb(R31)} Ω`, "small-f"));
  }
  const P = { 1: [90, 20], 2: [25, 135], 3: [155, 135] }, Q = { 1: [320, 20], 2: [255, 135], 3: [385, 135] }, M = [320, 95];
  return {
    gen: "star", topic: "net", tags: ["stern"],
    title: toStar ? ["Dreieck in Stern umwandeln", "Delta to star"] : ["Stern in Dreieck umwandeln", "Star to delta"],
    intro: L(`Gegeben: ${given}. Berechne die gleichwertige ${toStar ? "Sternschaltung" : "Dreieckschaltung"}.`, `Given: ${given}. Work out the equivalent ${toStar ? "star" : "delta"}.`),
    fig: fig(420, 190, `
      ${ckt("R", ...P[1], ...P[2], "R₁₂", -1)}${ckt("R", ...P[2], ...P[3], "R₂₃", -1)}${ckt("R", ...P[3], ...P[1], "R₃₁", 1)}
      ${[1, 2, 3].map((k) => node(...P[k]) + txt(P[k][0] + (k === 2 ? -12 : 12), P[k][1] + (k === 1 ? -6 : 18), k, "cap")).join("")}
      ${svgT(90, 182, "Dreieck", "delta", 'text-anchor="middle" class="cap"')}
      ${ckt("R", ...Q[1], ...M, "R₁", 1)}${ckt("R", ...Q[2], ...M, "", 1)}${ckt("R", ...Q[3], ...M, "", 1)}
      ${txt(270, 112, "R₂", "lbl", "end")}${txt(372, 112, "R₃", "lbl", "start")}${node(...M)}
      ${[1, 2, 3].map((k) => node(...Q[k]) + txt(Q[k][0] + (k === 2 ? -12 : 12), Q[k][1] + (k === 1 ? -6 : 18), k, "cap")).join("")}
      ${svgT(320, 182, "Stern", "star", 'text-anchor="middle" class="cap"')}`),
    parts: parts.map(([name, v]) => ({ ask: name, ans: v, unit: "Ω", pts: 1 })),
    steps: steps.join(""),
  };
}

function genSource() {
  const toCurrent = Math.random() < 0.5;
  const Ri = rPick([2, 4, 5, 8, 10]);
  const RL = rPick([2, 3, 6, 10, 15]);
  let U0, I0;
  if (toCurrent) { U0 = rPick([6, 10, 12, 20, 24]); I0 = U0 / Ri; } else { I0 = rPick([0.5, 1, 2, 3, 4]); U0 = I0 * Ri; }
  const IL = U0 / (Ri + RL);
  const left = toCurrent
    ? `${ckt("V", 40, 140, 40, 40, "U₀", -1)}${wire([40, 40], [70, 40])}${ckt("R", 70, 40, 150, 40, "Rᵢ")}${wire([150, 40], [170, 40])}${wire([40, 140], [170, 140])}${term(170, 40)}${term(170, 140)}`
    : `${ckt("I", 40, 140, 40, 40, "I₀", -1)}${arrowSVG(58, 108, 58, 72, "i", 2.5)}${wire([40, 40], [170, 40])}${wire([40, 140], [170, 140])}${ckt("R", 110, 140, 110, 40, "Rᵢ")}${node(110, 40)}${node(110, 140)}${term(170, 40)}${term(170, 140)}`;
  return {
    gen: "source", topic: "net", tags: ["quelle"],
    title: toCurrent ? ["Spannungsquelle in Stromquelle", "Voltage source to current source"] : ["Stromquelle in Spannungsquelle", "Current source to voltage source"],
    intro: toCurrent
      ? L(`Eine reale Spannungsquelle hat U<sub>0</sub> = ${U0} V und R<sub>i</sub> = ${Ri} Ω. Wandle sie in eine gleichwertige Stromquelle um und schließe dann R<sub>L</sub> = ${RL} Ω an.`,
        `A real voltage source has U<sub>0</sub> = ${U0} V and R<sub>i</sub> = ${Ri} Ω. Turn it into an equivalent current source, then connect R<sub>L</sub> = ${RL} Ω.`)
      : L(`Eine reale Stromquelle hat I<sub>0</sub> = ${nb(I0)} A und R<sub>i</sub> = ${Ri} Ω parallel. Wandle sie in eine gleichwertige Spannungsquelle um und schließe dann R<sub>L</sub> = ${RL} Ω an.`,
        `A real current source has I<sub>0</sub> = ${nb(I0)} A with R<sub>i</sub> = ${Ri} Ω in parallel. Turn it into an equivalent voltage source, then connect R<sub>L</sub> = ${RL} Ω.`),
    fig: fig(200, 160, left),
    parts: [
      toCurrent ? { ask: L("Quellenstrom I<sub>0</sub> (= Kurzschlussstrom)", "Source current I<sub>0</sub> (= short-circuit current)"), ans: I0, unit: "A", pts: 1 }
        : { ask: L("Quellenspannung U<sub>0</sub> (= Leerlaufspannung)", "Source voltage U<sub>0</sub> (= open-circuit voltage)"), ans: U0, unit: "V", pts: 1 },
      { ask: L(`Innenwiderstand der neuen Quelle (${toCurrent ? "parallel" : "in Reihe"})`, `Internal resistance of the new source (${toCurrent ? "in parallel" : "in series"})`), ans: Ri, unit: "Ω", pts: 1 },
      { ask: L("Strom durch R<sub>L</sub>", "Current through R<sub>L</sub>"), ans: IL, unit: "A", pts: 1 },
    ],
    steps: L(`Beide Quellen müssen dieselbe Leerlaufspannung und denselben Kurzschlussstrom haben: U<sub>0</sub> = I<sub>0</sub> · R<sub>i</sub>, R<sub>i</sub> bleibt gleich — nur einmal in Reihe, einmal parallel.`,
      `Both sources must have the same open-circuit voltage and short-circuit current: U<sub>0</sub> = I<sub>0</sub> · R<sub>i</sub>; R<sub>i</sub> stays the same — once in series, once in parallel.`) +
      F(`U<sub>0</sub> = ${nb(U0)} V &nbsp; I<sub>0</sub> = ${frac("U<sub>0</sub>", "R<sub>i</sub>")} = ${nb(I0)} A &nbsp; I<sub>L</sub> = ${frac("U<sub>0</sub>", "R<sub>i</sub> + R<sub>L</sub>")} = ${frac(nb(U0), `${Ri + RL}`)} A = ${nb(IL)} A`, "small-f") +
      `<p class="small muted">${L("Für die Last ist die Umwandlung unsichtbar — nur innerhalb der Quelle verhalten sich die beiden anders.", "The load can't tell the difference — only inside the source do the two behave differently.")}</p>`,
  };
}

function genMatch() {
  const U0 = rPick([6, 10, 12, 20, 24]), Ri = rPick([1, 2, 4, 5, 10]);
  let RL;
  do RL = rPick([0.5, 1, 2, 3, 4, 5, 8, 10, 20]); while (RL === Ri);
  const I = U0 / (Ri + RL), P = I * I * RL, eta = (RL / (Ri + RL)) * 100, Pmax = (U0 * U0) / (4 * Ri);
  return {
    gen: "match", topic: "net", tags: ["anpassung", "leistung"],
    title: ["Leistung und Leistungsanpassung", "Power and power matching"],
    intro: L(`Eine Quelle (U<sub>0</sub> = ${U0} V, R<sub>i</sub> = ${nb(Ri)} Ω) speist den Verbraucher R<sub>L</sub> = ${nb(RL)} Ω.`, `A source (U<sub>0</sub> = ${U0} V, R<sub>i</sub> = ${nb(Ri)} Ω) feeds the load R<sub>L</sub> = ${nb(RL)} Ω.`),
    fig: fig(260, 150, `${ckt("V", 40, 120, 40, 30, "U₀", -1)}${wire([40, 30], [70, 30])}${ckt("R", 70, 30, 150, 30, "Rᵢ")}${wire([150, 30], [210, 30])}${ckt("R", 210, 30, 210, 120, "R<tspan class='sub' dy='4'>L</tspan>")}${wire([40, 120], [210, 120])}
      ${arrowSVG(165, 30, 195, 30, "i", 2.5)}${txt(180, 22, "I", "lbl tc q-i")}`),
    parts: [
      { ask: L("Wirkleistung im Verbraucher P<sub>L</sub>", "Real power in the load P<sub>L</sub>"), ans: P, unit: "W", pts: 1 },
      { ask: L("Wirkungsgrad η", "Efficiency η"), ans: eta, unit: "%", pts: 1 },
      { ask: L("R<sub>L</sub> für Leistungsanpassung", "R<sub>L</sub> for power matching"), ans: Ri, unit: "Ω", pts: 1 },
      { ask: L("Maximale Leistung P<sub>max</sub> (bei Anpassung)", "Maximum power P<sub>max</sub> (when matched)"), ans: Pmax, unit: "W", pts: 1 },
    ],
    steps: F(`I = ${frac("U<sub>0</sub>", "R<sub>i</sub> + R<sub>L</sub>")} = ${nb(I)} A &nbsp; P<sub>L</sub> = I² R<sub>L</sub> = ${frac("U<sub>L</sub>²", "R<sub>L</sub>")} = ${nb(P)} W`, "small-f") +
      F(`η = ${frac("P<sub>L</sub>", "P<sub>ges</sub>")} = ${frac("R<sub>L</sub>", "R<sub>i</sub> + R<sub>L</sub>")} = ${nb(eta)} %`, "small-f") +
      L(`Leistungsanpassung bei <b>R<sub>L</sub> = R<sub>i</sub></b>: dann ist P<sub>max</sub> = U<sub>0</sub>² / (4R<sub>i</sub>) = ${nb(Pmax)} W, aber η nur 50 %.`,
        `Power matching at <b>R<sub>L</sub> = R<sub>i</sub></b>: then P<sub>max</sub> = U<sub>0</sub>² / (4R<sub>i</sub>) = ${nb(Pmax)} W, but η is only 50 %.`),
  };
}

// Cramer's rule for 2×2, written out.
function cramer2(A, b, names, unitDet, unitX) {
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const d1 = b[0] * A[1][1] - A[0][1] * b[1], d2 = A[0][0] * b[1] - b[0] * A[1][0];
  const m = (rows) => `<span class="mat">${rows.map((r) => `<span>${r.map((x) => nb(x)).join("</span><span>")}</span>`).join("")}</span>`;
  return {
    det, x: [d1 / det, d2 / det],
    html: F(`det = ${m(A)} = ${nb(A[0][0])} · ${nb(A[1][1])} − (${nb(A[0][1])}) · (${nb(A[1][0])}) = ${nb(det)} ${unitDet}`, "small-f") +
      F(`${names[0]} = ${frac(`${m([[b[0], A[0][1]], [b[1], A[1][1]]])}`, "det")} = ${frac(nb(d1), nb(det))} = ${nb(d1 / det)} ${unitX}`, "small-f") +
      F(`${names[1]} = ${frac(`${m([[A[0][0], b[0]], [A[1][0], b[1]]])}`, "det")} = ${frac(nb(d2), nb(det))} = ${nb(d2 / det)} ${unitX}`, "small-f"),
  };
}

function genMesh() {
  const R1 = rPick([1, 2, 3, 4, 5]), R2 = rPick([1, 2, 3, 4, 6]), R3 = rPick([2, 3, 4, 5, 6]);
  const U1 = rPick([6, 8, 10, 12, 15, 20]), U2 = rPick([2, 4, 5, 6, 9]);
  const A = [[R1 + R3, -R3], [-R3, R2 + R3]], b = [U1, -U2];
  const c = cramer2(A, b, ["I<sub>M1</sub>", "I<sub>M2</sub>"], "Ω²", "A");
  const [I1, I2] = c.x, I3 = I1 - I2, P1 = U1 * I1, P2 = -U2 * I2;
  return {
    gen: "mesh", topic: "net", tags: ["masche", "leistung"],
    title: ["Maschenstromverfahren mit Cramer", "Mesh analysis with Cramer's rule"],
    intro: L(`R<sub>1</sub> = ${R1} Ω, R<sub>2</sub> = ${R2} Ω, R<sub>3</sub> = ${R3} Ω, U<sub>1</sub> = ${U1} V, U<sub>2</sub> = ${U2} V. Stelle das Gleichungssystem <b>R</b> · <b>I<sub>M</sub></b> = <b>U</b> für die beiden eingezeichneten Maschenströme auf und löse es mit der Cramerschen Regel.`,
      `R<sub>1</sub> = ${R1} Ω, R<sub>2</sub> = ${R2} Ω, R<sub>3</sub> = ${R3} Ω, U<sub>1</sub> = ${U1} V, U<sub>2</sub> = ${U2} V. Set up <b>R</b> · <b>I<sub>M</sub></b> = <b>U</b> for the two mesh currents shown and solve it with Cramer's rule.`),
    fig: fig(380, 190, `
      ${ckt("V", 40, 160, 40, 30, "U₁", -1)}${txt(54, 70, "+", "lbl", "start")}${wire([40, 30], [70, 30])}${ckt("R", 70, 30, 170, 30, "R₁")}${wire([170, 30], [190, 30], [210, 30])}
      ${ckt("R", 210, 30, 310, 30, "R₂")}${wire([310, 30], [340, 30])}${ckt("V", 340, 160, 340, 30, "U₂", 1)}${txt(326, 70, "+", "lbl", "end")}
      ${ckt("R", 190, 30, 190, 160, "R₃", 1)}${wire([40, 160], [340, 160])}${node(190, 30)}${node(190, 160)}
      ${loopArrow(115, 95, "M1")}${loopArrow(265, 95, "M2")}`),
    parts: [
      { ask: L("Determinante det <b>R</b>", "Determinant det <b>R</b>"), ans: c.det, unit: "Ω²", pts: 1 },
      { ask: "I<sub>M1</sub>", ans: I1, unit: "A", pts: 1 },
      { ask: "I<sub>M2</sub>", ans: I2, unit: "A", pts: 1 },
      { ask: L("Strom durch R<sub>3</sub> (nach unten)", "Current through R<sub>3</sub> (downwards)"), ans: I3, unit: "A", pts: 1 },
      { ask: L("Von U<sub>1</sub> abgegebene Leistung", "Power delivered by U<sub>1</sub>"), ans: P1, unit: "W", pts: 1 },
      { ask: L("Von U<sub>2</sub> abgegebene Leistung", "Power delivered by U<sub>2</sub>"), ans: P2, unit: "W", pts: 1 },
    ],
    steps: L("Hauptdiagonale: Summe aller Widerstände der Masche. Nebendiagonale: minus der gemeinsame Widerstand. Rechts: Quellenspannungen, positiv wenn der Maschenstrom die Quelle am Pluspol verlässt.",
      "Main diagonal: the sum of each mesh's resistors. Off-diagonal: minus the shared resistor. Right side: source voltages, positive if the mesh current leaves the source at its plus pole.") +
      F(`<span class="mat"><span>R<sub>1</sub>+R<sub>3</sub></span><span>−R<sub>3</sub></span><span>−R<sub>3</sub></span><span>R<sub>2</sub>+R<sub>3</sub></span></span> · <span class="mat col"><span>I<sub>M1</sub></span><span>I<sub>M2</sub></span></span> = <span class="mat col"><span>U<sub>1</sub></span><span>−U<sub>2</sub></span></span>`, "small-f") +
      c.html + F(`I<sub>R3</sub> = I<sub>M1</sub> − I<sub>M2</sub> = ${nb(I3)} A &nbsp; P<sub>U1</sub> = U<sub>1</sub> I<sub>M1</sub> = ${nb(P1)} W &nbsp; P<sub>U2</sub> = −U<sub>2</sub> I<sub>M2</sub> = ${nb(P2)} W`, "small-f") +
      `<p class="small muted">${L("Eine negative abgegebene Leistung heißt: Die Quelle nimmt Leistung auf (sie wird „geladen“).", "A negative delivered power means the source takes power in (it is being “charged”).")}</p>`,
  };
}

function genNode() {
  const Ra = rPick([1, 2, 4, 5]), Rb = rPick([1, 2, 4]), Rc = rPick([1, 2, 4, 5]);
  const I1 = rPick([1, 2, 3, 4, 6]), I2 = rPick([1, 2, 3, 4]) * rSign();
  const Ga = 1 / Ra, Gb = 1 / Rb, Gc = 1 / Rc;
  const c = cramer2([[Ga + Gb, -Gb], [-Gb, Gb + Gc]], [I1, I2], ["φ<sub>1</sub>", "φ<sub>2</sub>"], "S²", "V");
  const [p1, p2] = c.x, Ib = Gb * (p1 - p2);
  const up2 = I2 > 0;
  return {
    gen: "node", topic: "net", tags: ["knoten"],
    title: ["Knotenpotentialverfahren mit Cramer", "Nodal analysis with Cramer's rule"],
    intro: L(`R<sub>a</sub> = ${Ra} Ω, R<sub>b</sub> = ${Rb} Ω, R<sub>c</sub> = ${Rc} Ω, I<sub>1</sub> = ${I1} A, I<sub>2</sub> = ${Math.abs(I2)} A (Richtung wie eingezeichnet). Bezugsknoten ist Masse (φ = 0). Stelle <b>G</b> · <b>φ</b> = <b>I</b> auf und löse mit Cramer.`,
      `R<sub>a</sub> = ${Ra} Ω, R<sub>b</sub> = ${Rb} Ω, R<sub>c</sub> = ${Rc} Ω, I<sub>1</sub> = ${I1} A, I<sub>2</sub> = ${Math.abs(I2)} A (directions as drawn). Ground is the reference node (φ = 0). Set up <b>G</b> · <b>φ</b> = <b>I</b> and solve with Cramer.`),
    fig: fig(380, 185, `
      ${ckt("I", 40, 150, 40, 40, "I₁", -1)}${arrowSVG(58, 112, 58, 78, "i", 2.5)}${wire([40, 40], [130, 40])}
      ${ckt("R", 130, 150, 130, 40, "R<tspan class='sub' dy='4'>a</tspan>", 1)}${ckt("R", 130, 40, 250, 40, "R<tspan class='sub' dy='4'>b</tspan>")}
      ${ckt("R", 250, 150, 250, 40, "R<tspan class='sub' dy='4'>c</tspan>", -1)}${wire([250, 40], [340, 40])}${ckt("I", 340, 150, 340, 40, "I₂", 1)}
      ${up2 ? arrowSVG(322, 112, 322, 78, "i", 2.5) : arrowSVG(322, 78, 322, 112, "i", 2.5)}
      ${wire([40, 150], [340, 150])}${node(130, 40)}${node(250, 40)}${txt(130, 28, "1", "lbl")}${txt(250, 28, "2", "lbl")}${gnd(190, 150)}`),
    parts: [
      { ask: L("Determinante det <b>G</b>", "Determinant det <b>G</b>"), ans: c.det, unit: "S²", pts: 1 },
      { ask: "φ<sub>1</sub>", ans: p1, unit: "V", pts: 1 },
      { ask: "φ<sub>2</sub>", ans: p2, unit: "V", pts: 1 },
      { ask: L("Strom durch R<sub>b</sub> von 1 nach 2", "Current through R<sub>b</sub> from 1 to 2"), ans: Ib, unit: "A", pts: 1 },
    ],
    steps: L("Hauptdiagonale: Summe der Leitwerte am Knoten. Nebendiagonale: minus der Leitwert zwischen den Knoten. Rechts: Quellenströme, die in den Knoten hineinfließen.",
      "Main diagonal: the sum of the conductances at the node. Off-diagonal: minus the conductance between the nodes. Right side: source currents flowing into the node.") +
      F(`<span class="mat"><span>G<sub>a</sub>+G<sub>b</sub></span><span>−G<sub>b</sub></span><span>−G<sub>b</sub></span><span>G<sub>b</sub>+G<sub>c</sub></span></span> · <span class="mat col"><span>φ<sub>1</sub></span><span>φ<sub>2</sub></span></span> = <span class="mat col"><span>I<sub>1</sub></span><span>${up2 ? "" : "−"}I<sub>2</sub></span></span>`, "small-f") +
      c.html + F(`I<sub>b</sub> = G<sub>b</sub> (φ<sub>1</sub> − φ<sub>2</sub>) = ${nb(Ib)} A`, "small-f"),
  };
}

/* ---------------------------------------------------------------- AC */

function genSeries() {
  const kind = rPick(["RL", "RC", "RLC"]);
  const f = 50, w = 2 * Math.PI * f, U = 230;
  const R = rPick([10, 20, 30, 40, 50, 60, 80, 100]);
  const Lv = kind !== "RC" ? rPick([0.05, 0.1, 0.15, 0.2, 0.3, 0.5]) : 0;
  const Cf = kind !== "RL" ? rPick([20, 33, 47, 68, 100, 150]) * 1e-6 : 0;
  const X = (Lv ? w * Lv : 0) - (Cf ? 1 / (w * Cf) : 0);
  const Z = cx(R, X), Zabs = cAbs(Z), phi = cDeg(Z), I = U / Zabs, P = I * I * R, Q = I * I * X;
  const els = [["R", "R"], ...(Lv ? [["L", "L"]] : []), ...(Cf ? [["C", "C"]] : [])];
  const seg = 220 / els.length;
  return {
    gen: "series", topic: "ac", tags: ["zeiger", "leistung"],
    title: [`${kind}-Reihenschaltung am Netz`, `${kind} series circuit on the mains`],
    intro: L(`Eine Reihenschaltung aus R = ${R} Ω${Lv ? `, L = ${nb(Lv * 1000, 0)} mH` : ""}${Cf ? `, C = ${nb(Cf * 1e6, 0)} µF` : ""} liegt an U = ${U} V (Effektivwert), f = ${f} Hz.`,
      `A series circuit of R = ${R} Ω${Lv ? `, L = ${nb(Lv * 1000, 0)} mH` : ""}${Cf ? `, C = ${nb(Cf * 1e6, 0)} µF` : ""} is connected to U = ${U} V (RMS), f = ${f} Hz.`),
    fig: fig(330, 140, `${ckt("V", 30, 115, 30, 30, "U", -1)}${wire([30, 30], [60, 30])}
      ${els.map(([k, n], i) => ckt(k, 60 + i * seg, 30, 60 + (i + 1) * seg, 30, n)).join("")}
      ${wire([280, 30], [300, 30], [300, 115], [30, 115])}`),
    parts: [
      { ask: L("Imaginärteil X von Z", "Imaginary part X of Z"), ans: X, unit: "Ω", pts: 1 },
      { ask: "|Z|", ans: Zabs, unit: "Ω", pts: 1 },
      { ask: L("Phasenwinkel φ (Spannung gegen Strom)", "Phase angle φ (voltage relative to current)"), ans: phi, unit: "°", pts: 1, tol: 0.03 },
      { ask: L("Effektivwert des Stroms I", "RMS current I"), ans: I, unit: "A", pts: 1 },
      { ask: L("Wirkleistung P", "Real power P"), ans: P, unit: "W", pts: 1 },
      { ask: L("Blindleistung Q", "Reactive power Q"), ans: Q, unit: "var", pts: 1 },
      { ask: L("Die Schaltung verhält sich …", "The circuit behaves …"), mc: X > 0 ? [L("induktiv", "inductively"), L("kapazitiv", "capacitively"), L("rein ohmsch", "purely resistively")] : [L("kapazitiv", "capacitively"), L("induktiv", "inductively"), L("rein ohmsch", "purely resistively")], pts: 1 },
    ],
    steps: F(`ω = 2πf = ${nb(w)} s<sup>−1</sup>${Lv ? ` &nbsp; X<sub>L</sub> = ωL = ${nb(w * Lv)} Ω` : ""}${Cf ? ` &nbsp; X<sub>C</sub> = −${frac("1", "ωC")} = ${nb(-1 / (w * Cf))} Ω` : ""}`, "small-f") +
      F(`Z = R + jX = ${cs(Z)} Ω &nbsp; |Z| = √(R² + X²) = ${nb(Zabs)} Ω &nbsp; φ = arctan(X/R) = ${nb(phi)}°`, "small-f") +
      F(`I = U/|Z| = ${nb(I)} A &nbsp; P = I²R = ${nb(P)} W &nbsp; Q = I²X = ${nb(Q)} var &nbsp; S = UI = ${nb(U * I)} VA`, "small-f") +
      `<p class="small muted">${L("Q &gt; 0: induktiv (Strom eilt nach). Q &lt; 0: kapazitiv (Strom eilt vor).", "Q &gt; 0: inductive (current lags). Q &lt; 0: capacitive (current leads).")}</p>`,
  };
}

function genPower() {
  const U = rPick([10, 12, 20, 24, 230]);
  const I = cx(rInt(1, 6), rInt(1, 5) * rSign());
  const S = cMul(cx(U), cConj(I)), Z = cDiv(cx(U), I);
  const cosphi = S.re / cAbs(S);
  return {
    gen: "power", topic: "ac", tags: ["leistung", "zeiger"],
    title: ["Komplexe Leistung aus U und I", "Complex power from U and I"],
    intro: L(`An einem unbekannten Verbraucher misst du (Effektivwerte) U = ${U} V und I = (${cs(I, 0)}) A.`, `On an unknown load you measure (RMS values) U = ${U} V and I = (${cs(I, 0)}) A.`),
    fig: fig(240, 120, `${ckt("V", 30, 95, 30, 25, "U", -1)}${wire([30, 25], [170, 25])}${arrowSVG(80, 25, 120, 25, "i", 2.5)}${txt(100, 17, "I", "lbl tc q-i")}
      <rect class="el" x="160" y="40" width="36" height="40" rx="3"/>${txt(178, 66, "Z", "lbl")}${wire([178, 25], [178, 40])}${wire([178, 80], [178, 95], [30, 95])}${wire([170, 25], [178, 25])}`),
    parts: [
      { ask: L("Wirkleistung P", "Real power P"), ans: S.re, unit: "W", pts: 1 },
      { ask: L("Blindleistung Q", "Reactive power Q"), ans: S.im, unit: "var", pts: 1 },
      { ask: L("Scheinleistung |S|", "Apparent power |S|"), ans: cAbs(S), unit: "VA", pts: 1 },
      { ask: L("Leistungsfaktor cos φ", "Power factor cos φ"), ans: cosphi, unit: "", pts: 1 },
      { ask: L("Re(Z)", "Re(Z)"), ans: Z.re, unit: "Ω", pts: 1 },
      { ask: L("Im(Z)", "Im(Z)"), ans: Z.im, unit: "Ω", pts: 1 },
      { ask: L("Der Verbraucher ist …", "The load is …"), mc: S.im > 0 ? [L("induktiv", "inductive"), L("kapazitiv", "capacitive")] : [L("kapazitiv", "capacitive"), L("induktiv", "inductive")], pts: 1 },
    ],
    steps: F(`S = U · I* = ${U} · (${cs(cConj(I), 0)}) = ${cs(S)} VA`, "small-f") +
      L(`Also P = Re(S) = ${nb(S.re)} W und Q = Im(S) = ${nb(S.im)} var, |S| = ${nb(cAbs(S))} VA, cos φ = P/|S| = ${nb(cosphi, 3)}.`,
        `So P = Re(S) = ${nb(S.re)} W and Q = Im(S) = ${nb(S.im)} var, |S| = ${nb(cAbs(S))} VA, cos φ = P/|S| = ${nb(cosphi, 3)}.`) +
      F(`Z = ${frac("U", "I")} = ${frac(U, `${cs(I, 0)}`)} = ${frac(`${U} · (${cs(cConj(I), 0)})`, `${I.re * I.re + I.im * I.im}`)} = ${cs(Z)} Ω`, "small-f") +
      `<p class="small muted">${L("Mit dem konjugierten Strom I* ergibt sich Q &gt; 0 für induktive Verbraucher.", "With the conjugate current I*, Q &gt; 0 for inductive loads.")}</p>`,
  };
}

function genComp() {
  const U = 230, f = 50, w = 2 * Math.PI * f;
  const R = rPick([5, 8, 10, 15, 20, 30]), Lm = rPick([20, 30, 50, 80, 100, 150]) / 1000;
  const Zm = cx(R, w * Lm), Im = U / cAbs(Zm), P = Im * Im * R, Q = Im * Im * w * Lm, cosphi = R / cAbs(Zm);
  const C = Q / (w * U * U), Ie = P / U;
  return {
    gen: "comp", topic: "ac", tags: ["komp", "leistung"],
    title: ["Blindleistungskompensation", "Reactive power compensation"],
    intro: L(`Ein Motor (Ersatzschaltbild R = ${R} Ω in Reihe mit L = ${nb(Lm * 1000, 0)} mH) hängt an U = ${U} V, f = ${f} Hz. Ein Kondensator C parallel soll den Leistungsfaktor auf cos φ = 1 bringen.`,
      `A motor (model: R = ${R} Ω in series with L = ${nb(Lm * 1000, 0)} mH) runs on U = ${U} V, f = ${f} Hz. A capacitor C in parallel should bring the power factor to cos φ = 1.`),
    fig: fig(320, 160, `${ckt("V", 30, 135, 30, 25, "U", -1)}${wire([30, 25], [250, 25])}${node(150, 25)}${node(150, 135)}
      ${ckt("C", 150, 25, 150, 135, "C ?", -1)}${ckt("R", 250, 25, 250, 80, "R", 1)}${ckt("L", 250, 80, 250, 135, "L", 1)}${wire([250, 135], [30, 135])}
      <rect class="motor" x="226" y="10" width="62" height="140" rx="10"/>${svgT(296, 158, "Motor", "motor", 'text-anchor="end" class="cap"')}`),
    parts: [
      { ask: L("Leistungsfaktor des Motors cos φ<sub>M</sub>", "Motor power factor cos φ<sub>M</sub>"), ans: cosphi, unit: "", pts: 1 },
      { ask: L("Blindleistung des Motors Q<sub>M</sub>", "Motor reactive power Q<sub>M</sub>"), ans: Q, unit: "var", pts: 1 },
      { ask: L("Nötige Kapazität C", "Capacitance needed C"), ans: C * 1e6, unit: "µF", pts: 2 },
      { ask: L("Netzstrom nach der Kompensation", "Supply current after compensation"), ans: Ie, unit: "A", pts: 1 },
    ],
    steps: F(`Z<sub>M</sub> = R + jωL = ${cs(Zm)} Ω &nbsp; |I<sub>M</sub>| = U/|Z<sub>M</sub>| = ${nb(Im)} A &nbsp; cos φ<sub>M</sub> = R/|Z<sub>M</sub>| = ${nb(cosphi, 3)}`, "small-f") +
      F(`Q<sub>M</sub> = |I<sub>M</sub>|² ωL = ${nb(Q)} var &nbsp; P = |I<sub>M</sub>|² R = ${nb(P)} W`, "small-f") +
      L("Der Kondensator muss genau Q<sub>M</sub> liefern: Q<sub>C</sub> = −ωCU² = −Q<sub>M</sub>", "The capacitor must supply exactly Q<sub>M</sub>: Q<sub>C</sub> = −ωCU² = −Q<sub>M</sub>") +
      F(`C = ${frac("Q<sub>M</sub>", "ωU²")} = ${nb(C * 1e6)} µF &nbsp; I<sub>e</sub> = ${frac("P", "U")} = ${nb(Ie)} A`, "small-f") +
      `<p class="small muted">${L(`Ohne Kompensation müsste das Netz ${nb(Im)} A liefern — jetzt nur ${nb(Ie)} A.`, `Without compensation the supply would carry ${nb(Im)} A — now only ${nb(Ie)} A.`)}</p>`,
  };
}

function genTrafo() {
  const L1 = rPick([0.1, 0.2, 0.5, 1]), L2 = L1 * rPick([0.25, 4, 9, 16]), k = rPick([0.8, 0.9, 0.95, 1]);
  const M = k * Math.sqrt(L1 * L2);
  const u = rPick([2, 4, 5, 10]), RL = rPick([2, 4, 8, 10, 20]), U1 = rPick([230, 100, 50]);
  const Zin = u * u * RL, U2 = U1 / u, I2 = U2 / RL, I1 = I2 / u;
  return {
    gen: "trafo", topic: "ac", tags: ["trafo"],
    title: ["Kopplung und idealer Übertrager", "Coupling and the ideal transformer"],
    intro: L(`(1) Zwei Spulen mit L<sub>1</sub> = ${nb(L1)} H und L<sub>2</sub> = ${nb(L2)} H sind mit k = ${nb(k, 2)} gekoppelt. (2) Ein idealer Übertrager mit ü = N<sub>1</sub>/N<sub>2</sub> = ${u} liegt primär an U<sub>1</sub> = ${U1} V, sekundär hängt R<sub>L</sub> = ${RL} Ω.`,
      `(1) Two coils with L<sub>1</sub> = ${nb(L1)} H and L<sub>2</sub> = ${nb(L2)} H are coupled with k = ${nb(k, 2)}. (2) An ideal transformer with ü = N<sub>1</sub>/N<sub>2</sub> = ${u} has U<sub>1</sub> = ${U1} V on the primary and R<sub>L</sub> = ${RL} Ω on the secondary.`),
    fig: fig(300, 140, `${ckt("V", 30, 115, 30, 25, "U₁", -1)}${wire([30, 25], [110, 25])}${wire([30, 115], [110, 115])}
      ${ckt("L", 110, 25, 110, 115, "", 1)}${ckt("L", 170, 115, 170, 25, "", 1)}<line class="w" x1="134" y1="30" x2="134" y2="110"/><line class="w" x1="146" y1="30" x2="146" y2="110"/>
      ${txt(140, 18, `ü = ${u}`, "lbl")}${wire([170, 25], [250, 25])}${wire([170, 115], [250, 115])}${ckt("R", 250, 25, 250, 115, "R<tspan class='sub' dy='4'>L</tspan>", 1)}
      ${arrowSVG(200, 40, 200, 100, "u", 2.5)}${txt(208, 75, "U₂", "lbl tc q-u", "start")}`),
    parts: [
      { ask: L("Gegeninduktivität M", "Mutual inductance M"), ans: M, unit: "H", pts: 1 },
      { ask: L("Eingangsimpedanz Z<sub>ein</sub> des Übertragers", "Input impedance Z<sub>in</sub> of the transformer"), ans: Zin, unit: "Ω", pts: 1 },
      { ask: "U<sub>2</sub>", ans: U2, unit: "V", pts: 1 },
      { ask: L("Primärstrom I<sub>1</sub>", "Primary current I<sub>1</sub>"), ans: I1, unit: "A", pts: 1 },
    ],
    steps: F(`M = k √(L<sub>1</sub>L<sub>2</sub>) = ${nb(k, 2)} · √(${nb(L1)} · ${nb(L2)}) H = ${nb(M)} H`, "small-f") +
      L("Idealer Übertrager: Spannungen im Verhältnis ü, Ströme im Verhältnis 1/ü, Impedanzen mit ü²:", "Ideal transformer: voltages scale with ü, currents with 1/ü, impedances with ü²:") +
      F(`U<sub>2</sub> = ${frac("U<sub>1</sub>", "ü")} = ${nb(U2)} V &nbsp; I<sub>2</sub> = ${frac("U<sub>2</sub>", "R<sub>L</sub>")} = ${nb(I2)} A &nbsp; I<sub>1</sub> = ${frac("I<sub>2</sub>", "ü")} = ${nb(I1)} A &nbsp; Z<sub>ein</sub> = ü² R<sub>L</sub> = ${nb(Zin)} Ω`, "small-f"),
  };
}

/* ---------------------------------------------------------------- Loci and resonance */

function genReso() {
  const R = rPick([5, 10, 20, 25, 50]), Lh = rPick([10, 20, 50, 100, 200]) / 1000, C = rPick([1, 2, 5, 10, 20, 47]) * 1e-6;
  const w0 = 1 / Math.sqrt(Lh * C), Q = (w0 * Lh) / R, bw = R / Lh;
  const disc = Math.sqrt(R * R * C * C + 4 * Lh * C);
  const wPlus = (R * C + disc) / (2 * Lh * C), wMinus = (-R * C + disc) / (2 * Lh * C);
  return {
    gen: "reso", topic: "ok", tags: ["resonanz", "guete"],
    title: ["Reihenschwingkreis: Resonanz und Güte", "Series resonant circuit: resonance and Q"],
    intro: L(`R = ${R} Ω, L = ${nb(Lh * 1000, 0)} mH und C = ${nb(C * 1e6, 0)} µF liegen in Reihe. ω<sub>1</sub> ist die Kreisfrequenz mit +45° Phasenverschiebung zwischen Spannung und Strom, ω<sub>2</sub> die mit −45°. Die Güte ist Q = ω<sub>0</sub> / (ω<sub>1</sub> − ω<sub>2</sub>).`,
      `R = ${R} Ω, L = ${nb(Lh * 1000, 0)} mH and C = ${nb(C * 1e6, 0)} µF are in series. ω<sub>1</sub> is the angular frequency where voltage and current are +45° apart, ω<sub>2</sub> where they are −45° apart. The quality factor is Q = ω<sub>0</sub> / (ω<sub>1</sub> − ω<sub>2</sub>).`),
    fig: fig(320, 90, `${term(20, 45)}${wire([20, 45], [50, 45])}${ckt("R", 50, 45, 130, 45, "R")}${ckt("L", 130, 45, 210, 45, "L")}${ckt("C", 210, 45, 280, 45, "C")}${wire([280, 45], [300, 45])}${term(300, 45)}`),
    parts: [
      { ask: L("Resonanzkreisfrequenz ω<sub>0</sub>", "Resonant angular frequency ω<sub>0</sub>"), ans: w0, unit: "s⁻¹", pts: 1 },
      { ask: L("|Z| bei Resonanz", "|Z| at resonance"), ans: R, unit: "Ω", pts: 1 },
      { ask: "ω<sub>1</sub> (+45°)", ans: wPlus, unit: "s⁻¹", pts: 2 },
      { ask: "ω<sub>2</sub> (−45°)", ans: wMinus, unit: "s⁻¹", pts: 2 },
      { ask: L("Güte Q", "Quality factor Q"), ans: Q, unit: "", pts: 1 },
      { ask: L("Unterhalb von ω<sub>0</sub> verhält sich die Schaltung …", "Below ω<sub>0</sub> the circuit behaves …"), mc: [L("kapazitiv", "capacitively"), L("induktiv", "inductively"), L("rein ohmsch", "purely resistively")], pts: 1 },
    ],
    steps: F(`Z = R + j(ωL − ${frac("1", "ωC")}) &nbsp;→&nbsp; Im(Z) = 0: ω<sub>0</sub> = ${frac("1", "√(LC)")} = ${nb(w0)} s<sup>−1</sup>, Z(ω<sub>0</sub>) = R`, "small-f") +
      L("±45° heißt Im(Z) = ±Re(Z) = ±R:", "±45° means Im(Z) = ±Re(Z) = ±R:") +
      F(`ωL − ${frac("1", "ωC")} = ±R &nbsp;⇒&nbsp; ω<sub>1,2</sub> = ${frac("±RC + √(R²C² + 4LC)", "2LC")}`, "small-f") +
      F(`ω<sub>1</sub> = ${nb(wPlus)} s<sup>−1</sup> &nbsp; ω<sub>2</sub> = ${nb(wMinus)} s<sup>−1</sup> &nbsp; ω<sub>1</sub> − ω<sub>2</sub> = ${frac("R", "L")} = ${nb(bw)} s<sup>−1</sup> &nbsp; Q = ${frac("ω<sub>0</sub>", "ω<sub>1</sub> − ω<sub>2</sub>")} = ${frac("ω<sub>0</sub>L", "R")} = ${nb(Q)}`, "small-f"),
  };
}

// A small locus picture: shape A–H (see genLocus), a dot where ω = 0 and an arrow for rising ω.
function locusSVG(shape, axis) {
  const O = [22, 60], a = 70; // origin and the crossing on the real axis
  const ax = `${arrowSVG(8, 60, 128, 60, "ax", 1.2, 7)}${arrowSVG(22, 112, 22, 6, "ax", 1.2, 7)}${txt(126, 74, `Re(${axis})`, "tick-t", "end")}${txt(28, 12, `Im(${axis})`, "tick-t", "start")}`;
  const X = O[0] + a;
  const S = {
    A: { d: `M${X},60 L${X},10`, start: [X, 60], dir: [[X, 34], [X, 24]] },
    B: { d: `M${X},110 L${X},60`, start: null, dir: [[X, 88], [X, 78]], end: [X, 60] },
    C: { d: `M22,60 A35,35 0 0,1 ${X},60`, start: [22, 60], dir: [[50, 26], [60, 25]] },
    D: { d: `M${X},60 A35,35 0 0,1 22,60`, start: [X, 60], dir: [[64, 95], [54, 95]], sweepDown: true },
    E: { d: `M${X},60 L${X},110`, start: [X, 60], dir: [[X, 84], [X, 94]] },
    F: { d: `M${X},60 A35,35 0 0,0 22,60`, start: [X, 60], dir: [[64, 25], [54, 26]] },
    G: { d: `M22,60 A35,35 0 0,0 ${X},60`, start: [22, 60], dir: [[50, 95], [60, 95]] },
    H: { d: `M${X},10 L${X},60`, start: null, dir: [[X, 30], [X, 40]], end: [X, 60] },
  }[shape];
  return svgBox(140, 120, `${ax}<path class="curve q-u" d="${S.d}"/>
    ${arrowSVG(S.dir[0][0], S.dir[0][1], S.dir[1][0], S.dir[1][1], "u", 2, 9)}
    ${S.start ? `<circle class="pt q-phi" cx="${S.start[0]}" cy="${S.start[1]}" r="4"/>${txt(S.start[0] + 4, S.start[1] + 16, "ω=0", "tick-t", "start")}` : txt(X + 6, shape === "B" ? 108 : 16, "ω=0", "tick-t", "start")}`, "lp-locus");
}

function genLocus() {
  const circuit = rPick(["RLs", "RCs", "RLp", "RCp"]), axis = rPick(["Z", "Y"]);
  // Which shape each circuit's Z and Y locus has.
  const shapeOf = { Z: { RLs: "A", RCs: "B", RLp: "C", RCp: "D" }, Y: { RLs: "D", RCs: "C", RLp: "B", RCp: "A" } };
  const right = shapeOf[axis][circuit];
  const others = shuffle(["A", "B", "C", "D", "E", "F", "G", "H"].filter((s) => s !== right)).slice(0, 3);
  const R = rPick([10, 20, 50, 100]);
  const series = circuit.endsWith("s"), el = circuit[1];
  const figHTML = series
    ? fig(260, 70, `${term(20, 35)}${wire([20, 35], [40, 35])}${ckt("R", 40, 35, 120, 35, "R")}${ckt(el, 120, 35, 200, 35, el)}${wire([200, 35], [240, 35])}${term(240, 35)}`)
    : fig(260, 110, `${term(20, 55)}${wire([20, 55], [70, 55])}${wire([70, 25], [70, 85])}${ckt("R", 70, 25, 190, 25, "R")}${ckt(el, 70, 85, 190, 85, el, -1)}${wire([190, 25], [190, 85])}${wire([190, 55], [240, 55])}${term(240, 55)}${node(70, 55)}${node(190, 55)}`);
  const cross = axis === "Z" ? R : 1 / R;
  const names = { RLs: ["R und L in Reihe", "R and L in series"], RCs: ["R und C in Reihe", "R and C in series"], RLp: ["R und L parallel", "R and L in parallel"], RCp: ["R und C parallel", "R and C in parallel"] };
  const why = {
    A: ["Z = R + jωL: der Realteil bleibt R, der Imaginärteil wächst von 0 nach +∞ — eine Halbgerade nach oben, die bei R beginnt.", "Z = R + jωL: the real part stays R, the imaginary part grows from 0 to +∞ — a half-line upwards starting at R."],
    B: ["Der Realteil bleibt fest, der Imaginärteil kommt von −∞ (ω = 0) und geht gegen 0 — eine Halbgerade von unten, die bei ω → ∞ auf der reellen Achse endet.", "The real part stays fixed, the imaginary part comes from −∞ (ω = 0) and goes to 0 — a half-line from below that ends on the real axis as ω → ∞."],
    C: ["Inversion einer Geraden, die nicht durch den Ursprung geht: ein Halbkreis durch den Ursprung — oben, von 0 (ω = 0) bis zur reellen Achse.", "Inverting a line that misses the origin gives a semicircle through the origin — the upper half, from 0 (ω = 0) to the real axis."],
    D: ["Inversion einer Geraden, die nicht durch den Ursprung geht: ein Halbkreis durch den Ursprung — unten, vom Wert auf der reellen Achse (ω = 0) bis 0.", "Inverting a line that misses the origin gives a semicircle through the origin — the lower half, from the value on the real axis (ω = 0) to 0."],
  }[right];
  return {
    gen: "locus", topic: "ok", tags: ["inversion", "zuordnung"],
    title: ["Ortskurve zuordnen", "Match the locus"],
    intro: L(`Schaltung: ${names[circuit][0]}, R = ${R} Ω. Welche Ortskurve hat <b>${axis}(ω)</b> für ω von 0 bis ∞?`, `Circuit: ${names[circuit][1]}, R = ${R} Ω. Which locus does <b>${axis}(ω)</b> have for ω from 0 to ∞?`),
    fig: figHTML,
    parts: [
      { ask: L("Ortskurve", "Locus"), mc: [locusSVG(right, axis), ...others.map((s) => locusSVG(s, axis))], pts: 2, pics: true },
      { ask: L(`Wo liegt der Punkt auf der reellen Achse (außer 0)?`, `Where is the point on the real axis (other than 0)?`), ans: cross, unit: axis === "Z" ? "Ω" : "S", pts: 1 },
    ],
    steps: L(why[0], why[1]) + `<p class="small">${L(`Auf der reellen Achse: ${axis === "Z" ? `Z = R = ${R} Ω` : `Y = 1/R = ${nb(1 / R)} S`}. Merke: Z und Y gehen durch <b>Inversion</b> auseinander hervor — Gerade ↔ Kreis durch den Ursprung.`,
      `On the real axis: ${axis === "Z" ? `Z = R = ${R} Ω` : `Y = 1/R = ${nb(1 / R)} S`}. Remember: Z and Y turn into each other by <b>inversion</b> — a line ↔ a circle through the origin.`)}</p>`,
  };
}

/* ---------------------------------------------------------------- Bode */

function genRC() {
  const hp = Math.random() < 0.5;
  const R = rPick([1, 2.2, 4.7, 10]) * 1000, C = rPick([10, 22, 47, 100]) * 1e-9;
  const fg = 1 / (2 * Math.PI * R * C);
  const m = rPick([0.1, 1, 10, 100]), f = m * fg;
  const mag = hp ? m / Math.sqrt(1 + m * m) : 1 / Math.sqrt(1 + m * m);
  const dB = 20 * log10(mag), ph = hp ? 90 - deg(Math.atan(m)) : -deg(Math.atan(m));
  return {
    gen: "rc", topic: "bode", tags: [hp ? "hp" : "tp", "asym"],
    title: [`RC-${hp ? "Hochpass" : "Tiefpass"}: Grenzfrequenz und Bodediagramm`, `RC ${hp ? "high-pass" : "low-pass"}: cut-off and Bode plot`],
    intro: L(`R = ${nb(R / 1000)} kΩ, C = ${nb(C * 1e9, 0)} nF. Betrachte die Übertragungsfunktion G = U<sub>a</sub>/U<sub>e</sub> (unbelastet).`, `R = ${nb(R / 1000)} kΩ, C = ${nb(C * 1e9, 0)} nF. Look at the transfer function G = U<sub>a</sub>/U<sub>e</sub> (no load).`),
    fig: fig(280, 130, `${term(20, 30)}${term(20, 110)}${wire([20, 110], [260, 110])}
      ${hp ? ckt("C", 20, 30, 150, 30, "C") + ckt("R", 150, 30, 150, 110, "R", 1) : ckt("R", 20, 30, 150, 30, "R") + ckt("C", 150, 30, 150, 110, "C", 1)}
      ${wire([150, 30], [260, 30])}${node(150, 30)}${node(150, 110)}${term(260, 30)}${term(260, 110)}
      ${arrowSVG(36, 44, 36, 96, "u", 2)}${txt(44, 75, "U<tspan class='sub' dy='4'>e</tspan>", "lbl tc q-u", "start")}${arrowSVG(244, 44, 244, 96, "u", 2)}${txt(236, 75, "U<tspan class='sub' dy='4'>a</tspan>", "lbl tc q-u", "end")}`),
    parts: [
      { ask: L("Grenzfrequenz f<sub>g</sub>", "Cut-off frequency f<sub>g</sub>"), ans: fg, unit: "Hz", pts: 1 },
      { ask: L(`Verstärkung in dB bei f = ${nb(m, m < 1 ? 1 : 0)} · f<sub>g</sub>`, `Gain in dB at f = ${nb(m, m < 1 ? 1 : 0)} · f<sub>g</sub>`), ans: dB, unit: "dB", pts: 1, tol: 0.03, abs: 0.1 },
      { ask: L(`Phase bei f = ${nb(m, m < 1 ? 1 : 0)} · f<sub>g</sub>`, `Phase at f = ${nb(m, m < 1 ? 1 : 0)} · f<sub>g</sub>`), ans: ph, unit: "°", pts: 1, tol: 0.03, abs: 0.5 },
      { ask: L(`Steigung der Asymptote ${hp ? "unterhalb" : "oberhalb"} von f<sub>g</sub>`, `Slope of the asymptote ${hp ? "below" : "above"} f<sub>g</sub>`),
        mc: hp ? ["+20 dB/Dek", "−20 dB/Dek", "+40 dB/Dek", "0 dB/Dek"] : ["−20 dB/Dek", "+20 dB/Dek", "−40 dB/Dek", "0 dB/Dek"], pts: 1 },
    ],
    steps: F(`G(jω) = ${hp ? frac("jωRC", "1 + jωRC") : frac("1", "1 + jωRC")} &nbsp; f<sub>g</sub> = ${frac("1", "2πRC")} = ${nb(fg)} Hz`, "small-f") +
      L(`Mit Ω = f/f<sub>g</sub> = ${nb(m, m < 1 ? 1 : 0)}:`, `With Ω = f/f<sub>g</sub> = ${nb(m, m < 1 ? 1 : 0)}:`) +
      F(`a<sub>v</sub> = 20 log|G| = ${hp ? "20 log Ω − " : "−"}10 log(1 + Ω²) = ${nb(dB, 2)} dB &nbsp; φ = ${hp ? "90° − " : "−"}arctan Ω = ${nb(ph, 1)}°`, "small-f") +
      `<p class="small muted">${L(`Bei f<sub>g</sub> selbst: −3 dB und ${hp ? "+45°" : "−45°"}. Ein Glied 1. Ordnung ändert die Asymptote um 20 dB pro Dekade.`, `At f<sub>g</sub> itself: −3 dB and ${hp ? "+45°" : "−45°"}. A first-order stage changes the asymptote by 20 dB per decade.`)}</p>`,
  };
}

// Transfer functions in normalised form, for reading Bode plots.
const BODE_FNS = [
  { id: "tp1", f: frac("1", "1 + jΩ"), G: (W) => cDiv(cx(1), cx(1, W)), name: ["Tiefpass 1. Ordnung", "1st-order low-pass"] },
  { id: "hp1", f: frac("jΩ", "1 + jΩ"), G: (W) => cDiv(cx(0, W), cx(1, W)), name: ["Hochpass 1. Ordnung", "1st-order high-pass"] },
  { id: "tp2", f: frac("1", "(1 + jΩ)²"), G: (W) => cDiv(cx(1), cMul(cx(1, W), cx(1, W))), name: ["Tiefpass 2. Ordnung", "2nd-order low-pass"] },
  { id: "hp2", f: frac("(jΩ)²", "(1 + jΩ)²"), G: (W) => cDiv(cx(-W * W), cMul(cx(1, W), cx(1, W))), name: ["Hochpass 2. Ordnung", "2nd-order high-pass"] },
  { id: "bp", f: frac("jΩ", "(1 + jΩ)(1 + jΩ/100)"), G: (W) => cDiv(cx(0, W), cMul(cx(1, W), cx(1, W / 100))), name: ["Bandpass", "band-pass"] },
  { id: "tpv", f: `10 · ${frac("1", "1 + jΩ")}`, G: (W) => cDiv(cx(10), cx(1, W)), name: ["Tiefpass mit Verstärkung 10", "low-pass with gain 10"] },
];

function bodePlotSVG(G) {
  const p = plotArea(46, 14, 260, 130, -2, 3, -60, 30);
  let d = "";
  for (let e = -2; e <= 3.0001; e += 0.025) {
    const v = clamp(20 * log10(cAbs(G(10 ** e))), -60, 30);
    d += `${d ? "L" : "M"}${r1(p.X(e))},${r1(p.Y(v))}`;
  }
  let grid = "";
  for (let e = -2; e <= 3; e++) grid += `<line class="grid" x1="${p.X(e)}" y1="${p.y0}" x2="${p.X(e)}" y2="${p.y0 + p.h}"/>${txt(p.X(e), p.y0 + p.h + 14, `10<tspan dy="-5" font-size="8">${e}</tspan>`, "tick-t")}`;
  for (let v = -60; v <= 30; v += 20) grid += `<line class="grid" x1="${p.x0}" y1="${p.Y(v)}" x2="${p.x0 + p.w}" y2="${p.Y(v)}"/>${v > -60 ? txt(p.x0 - 6, p.Y(v) + 4, v, "tick-t", "end") : ""}`;
  return svgBox(320, 175, `${grid}<line class="zero" x1="${p.x0}" y1="${p.Y(0)}" x2="${p.x0 + p.w}" y2="${p.Y(0)}"/><path class="curve q-u" d="${d}"/>
    ${txt(p.x0 + p.w, p.y0 + p.h + 30, "Ω", "ax-t", "end")}${txt(p.x0 - 40, p.y0 - 2, "a<tspan class='sub' dy='4'>v</tspan><tspan dy='-4'> / dB</tspan>", "ax-t", "start")}`, "lp-svg");
}

function genBodeId() {
  const pick = rPick(BODE_FNS);
  const others = shuffle(BODE_FNS.filter((b) => b !== pick)).slice(0, 3);
  const at1 = 20 * log10(cAbs(pick.G(1)));
  const phInf = cDeg(pick.G(1e6));
  return {
    gen: "bodeid", topic: "bode", tags: ["tp", "hp", "bp"],
    title: ["Amplitudengang lesen", "Read the magnitude plot"],
    intro: L("Das Diagramm zeigt den Amplitudengang einer Schaltung über der normierten Frequenz Ω.", "The plot shows a circuit's magnitude response over the normalised frequency Ω."),
    fig: bodePlotSVG(pick.G),
    parts: [
      { ask: L("Welche Übertragungsfunktion gehört dazu?", "Which transfer function belongs to it?"), mc: [pick.f, ...others.map((o) => o.f)], pts: 2 },
      { ask: L("Wie heißt die Schaltung?", "What is the circuit called?"), mc: [Lp(pick.name), ...others.map((o) => Lp(o.name))], pts: 1 },
      { ask: L("Verstärkung bei Ω = 1", "Gain at Ω = 1"), ans: at1, unit: "dB", pts: 1, tol: 0.03, abs: 0.15 },
      { ask: L("Phase für Ω → ∞", "Phase as Ω → ∞"), ans: Math.round(phInf), unit: "°", pts: 1, abs: 1 },
    ],
    steps: F(`G(jΩ) = ${pick.f}`, "small-f") +
      L(`Jeder Faktor (1 + jΩ) im Nenner knickt die Kurve um −20 dB/Dek und dreht die Phase um −90°; jedes jΩ im Zähler gibt +20 dB/Dek und +90°. Bei Ω = 1: a<sub>v</sub> = ${nb(at1, 2)} dB. Für Ω → ∞: φ = ${nb(Math.round(phInf), 0)}°.`,
        `Each factor (1 + jΩ) in the denominator bends the curve by −20 dB/dec and turns the phase by −90°; each jΩ in the numerator gives +20 dB/dec and +90°. At Ω = 1: a<sub>v</sub> = ${nb(at1, 2)} dB. As Ω → ∞: φ = ${nb(Math.round(phInf), 0)}°.`),
  };
}

/* ---------------------------------------------------------------- Op-amps */

const KOHM = [1, 2, 4.7, 5, 10, 22, 47, 100];
const satText = (u, Vs) => (Math.abs(u) > Vs
  ? L(` Das liegt außerhalb von ±${Vs} V: der Ausgang geht in die Sättigung, U<sub>a</sub> = ${u > 0 ? "+" : "−"}${Vs} V.`, ` That's outside ±${Vs} V: the output saturates, U<sub>a</sub> = ${u > 0 ? "+" : "−"}${Vs} V.`)
  : L(" Das liegt innerhalb der Versorgung.", " That's within the supply."));

function genInv() {
  const R1 = rPick([1, 2, 5, 10]), R2 = rPick([10, 22, 47, 100]), Vs = rPick([5, 10, 15]);
  const Ue = rPick([0.1, 0.2, 0.25, 0.5, 1]) * rSign();
  const V = -R2 / R1, uIdeal = V * Ue, Ua = clamp(uIdeal, -Vs, Vs);
  return {
    gen: "inv", topic: "opv", tags: ["inv", "sat"],
    title: ["Invertierender Verstärker", "Inverting amplifier"],
    intro: L(`Idealer OPV an ±${Vs} V. R<sub>1</sub> = ${R1} kΩ, R<sub>2</sub> = ${R2} kΩ, U<sub>e</sub> = ${nb(Ue)} V.`, `Ideal op-amp on ±${Vs} V. R<sub>1</sub> = ${R1} kΩ, R<sub>2</sub> = ${R2} kΩ, U<sub>e</sub> = ${nb(Ue)} V.`),
    fig: fig(320, 160, `${term(20, 60)}${ckt("R", 20, 60, 120, 60, "R₁")}${wire([120, 60], [150, 60])}${node(120, 60)}${wire([120, 60], [120, 20])}${ckt("R", 120, 20, 240, 20, "R₂")}${wire([240, 20], [240, 75])}
      ${opamp(150, 75)}${wire([150, 90], [130, 90], [130, 130])}${gnd(130, 130)}${wire([220, 75], [280, 75])}${node(240, 75)}${term(280, 75)}${txt(286, 80, "U<tspan class='sub' dy='4'>a</tspan>", "lbl", "start")}${txt(14, 50, "U<tspan class='sub' dy='4'>e</tspan>", "lbl", "start")}`),
    parts: [
      { ask: L("Spannungsverstärkung V = U<sub>a</sub>/U<sub>e</sub>", "Voltage gain V = U<sub>a</sub>/U<sub>e</sub>"), ans: V, unit: "", pts: 1 },
      { ask: L("Ausgangsspannung U<sub>a</sub> (mit Versorgungsgrenze)", "Output voltage U<sub>a</sub> (with the supply limit)"), ans: Ua, unit: "V", pts: 1 },
      { ask: L("Eingangswiderstand der Schaltung", "Input resistance of the circuit"), ans: R1, unit: "kΩ", pts: 1 },
    ],
    steps: L("Goldene Regeln: kein Strom in die Eingänge, U<sub>D</sub> = 0. Der −-Eingang liegt also virtuell auf Masse, und durch R<sub>1</sub> und R<sub>2</sub> fließt derselbe Strom.",
      "Golden rules: no current into the inputs, U<sub>D</sub> = 0. So the − input is a virtual ground and R<sub>1</sub> and R<sub>2</sub> carry the same current.") +
      F(`${frac("U<sub>e</sub>", "R<sub>1</sub>")} = −${frac("U<sub>a</sub>", "R<sub>2</sub>")} ⇒ V = −${frac("R<sub>2</sub>", "R<sub>1</sub>")} = ${nb(V)} &nbsp; U<sub>a</sub> = ${nb(uIdeal)} V`, "small-f") + `<p>${satText(uIdeal, Vs)}</p>` +
      `<p class="small muted">${L("Eingangswiderstand: Die Quelle sieht R<sub>1</sub> gegen virtuelle Masse.", "Input resistance: the source sees R<sub>1</sub> to virtual ground.")}</p>`,
  };
}

function genNonInv() {
  const V = rPick([2, 3, 5, 6, 11]), Rg = rPick([1, 2, 5, 10]), Vs = rPick([5, 10, 15]);
  const Ue = rPick([0.2, 0.5, 1, 1.5, 2]);
  const Rf = (V - 1) * Rg, uIdeal = V * Ue, Ua = clamp(uIdeal, -Vs, Vs);
  return {
    gen: "noninv", topic: "opv", tags: ["inv", "sat"],
    title: ["Nichtinvertierenden Verstärker auslegen", "Design a non-inverting amplifier"],
    intro: L(`Idealer OPV an ±${Vs} V. Die Verstärkung soll V = ${V} sein; R<sub>g</sub> (nach Masse) = ${Rg} kΩ. Am Eingang liegt U<sub>e</sub> = ${nb(Ue)} V.`, `Ideal op-amp on ±${Vs} V. The gain should be V = ${V}; R<sub>g</sub> (to ground) = ${Rg} kΩ. The input is U<sub>e</sub> = ${nb(Ue)} V.`),
    fig: fig(320, 170, `${term(20, 100)}${wire([20, 100], [150, 100])}${opamp(150, 85)}${wire([150, 70], [120, 70], [120, 30])}${node(120, 70)}
      ${ckt("R", 120, 30, 240, 30, "R<tspan class='sub' dy='4'>f</tspan>")}${wire([240, 30], [240, 85])}${ckt("R", 120, 70, 50, 70, "R<tspan class='sub' dy='4'>g</tspan>")}${gnd(50, 70)}
      ${wire([220, 85], [280, 85])}${node(240, 85)}${term(280, 85)}${txt(286, 90, "U<tspan class='sub' dy='4'>a</tspan>", "lbl", "start")}${txt(14, 90, "U<tspan class='sub' dy='4'>e</tspan>", "lbl", "start")}`),
    parts: [
      { ask: L("Rückkoppelwiderstand R<sub>f</sub>", "Feedback resistor R<sub>f</sub>"), ans: Rf, unit: "kΩ", pts: 1 },
      { ask: L("Ausgangsspannung U<sub>a</sub> (mit Versorgungsgrenze)", "Output voltage U<sub>a</sub> (with the supply limit)"), ans: Ua, unit: "V", pts: 1 },
      { ask: L("Eingangswiderstand (idealer OPV)", "Input resistance (ideal op-amp)"), mc: ["∞", "R<sub>g</sub>", "R<sub>f</sub> + R<sub>g</sub>", "0"], pts: 1 },
    ],
    steps: L("U<sub>D</sub> = 0: am −-Eingang liegt auch U<sub>e</sub>. R<sub>f</sub> und R<sub>g</sub> bilden einen Spannungsteiler vom Ausgang:", "U<sub>D</sub> = 0: the − input also sits at U<sub>e</sub>. R<sub>f</sub> and R<sub>g</sub> divide the output voltage:") +
      F(`U<sub>e</sub> = U<sub>a</sub> ${frac("R<sub>g</sub>", "R<sub>f</sub> + R<sub>g</sub>")} ⇒ V = 1 + ${frac("R<sub>f</sub>", "R<sub>g</sub>")} ⇒ R<sub>f</sub> = (V − 1) R<sub>g</sub> = ${nb(Rf)} kΩ`, "small-f") +
      F(`U<sub>a</sub> = V · U<sub>e</sub> = ${nb(uIdeal)} V`, "small-f") + `<p>${satText(uIdeal, Vs)}</p>` +
      `<p class="small muted">${L("Der Eingang geht direkt in den +-Eingang, in den kein Strom fließt: Eingangswiderstand ∞.", "The input goes straight into the + input, which takes no current: input resistance ∞.")}</p>`,
  };
}

function genDiff() {
  const sym = Math.random() < 0.5;
  const R1 = rPick([1, 2, 5, 10]), R2 = rPick([2, 5, 10, 20]);
  const R3 = sym ? R1 : rPick([1, 2, 5, 10]), R4 = sym ? R2 : rPick([2, 5, 10, 20]);
  const Vs = rPick([5, 10, 15]);
  const u1 = rPick([0.5, 1, 1.5, 2]), u2 = rPick([0.5, 1, 2, 2.5, 3]);
  const uIdeal = (R4 / R1) * ((R1 + R2) / (R3 + R4)) * u2 - (R2 / R1) * u1, Ua = clamp(uIdeal, -Vs, Vs);
  return {
    gen: "diff", topic: "opv", tags: ["diff", "sat"],
    title: ["Subtrahierer (Differenzverstärker)", "Difference amplifier"],
    intro: L(`Idealer OPV an ±${Vs} V. R<sub>1</sub> = ${R1} kΩ, R<sub>2</sub> = ${R2} kΩ, R<sub>3</sub> = ${R3} kΩ, R<sub>4</sub> = ${R4} kΩ, u<sub>1</sub> = ${nb(u1)} V, u<sub>2</sub> = ${nb(u2)} V.`,
      `Ideal op-amp on ±${Vs} V. R<sub>1</sub> = ${R1} kΩ, R<sub>2</sub> = ${R2} kΩ, R<sub>3</sub> = ${R3} kΩ, R<sub>4</sub> = ${R4} kΩ, u<sub>1</sub> = ${nb(u1)} V, u<sub>2</sub> = ${nb(u2)} V.`),
    fig: fig(330, 180, `${term(20, 60)}${txt(14, 50, "u₁", "lbl", "start")}${ckt("R", 20, 60, 120, 60, "R₁")}${wire([120, 60], [150, 60])}${node(120, 60)}${wire([120, 60], [120, 20])}
      ${ckt("R", 120, 20, 240, 20, "R₂")}${wire([240, 20], [240, 75])}${opamp(150, 75)}
      ${term(20, 110)}${txt(14, 100, "u₂", "lbl", "start")}${ckt("R", 20, 110, 120, 110, "R₃", -1)}${wire([120, 110], [130, 110], [130, 90], [150, 90])}${node(120, 110)}
      ${ckt("R", 120, 110, 120, 160, "R₄", 1)}${gnd(120, 160)}${wire([220, 75], [290, 75])}${node(240, 75)}${term(290, 75)}${txt(296, 80, "u<tspan class='sub' dy='4'>out</tspan>", "lbl", "start")}`),
    parts: [{ ask: "u<sub>out</sub>", ans: Ua, unit: "V", pts: 3 }],
    steps: L("Überlagerung (oder Knotengleichungen an beiden Eingängen) ergibt die Formel aus der Klausur:", "Superposition (or the node equations at both inputs) gives the formula from the exams:") +
      F(`u<sub>out</sub> = ${frac("R<sub>4</sub>", "R<sub>1</sub>")} · ${frac("R<sub>1</sub> + R<sub>2</sub>", "R<sub>3</sub> + R<sub>4</sub>")} · u<sub>2</sub> − ${frac("R<sub>2</sub>", "R<sub>1</sub>")} · u<sub>1</sub> = ${nb(uIdeal)} V`, "small-f") +
      (sym ? `<p>${L(`Hier ist R<sub>3</sub> = R<sub>1</sub> und R<sub>4</sub> = R<sub>2</sub>, also einfach u<sub>out</sub> = ${frac("R<sub>2</sub>", "R<sub>1</sub>")} (u<sub>2</sub> − u<sub>1</sub>).`, `Here R<sub>3</sub> = R<sub>1</sub> and R<sub>4</sub> = R<sub>2</sub>, so simply u<sub>out</sub> = ${frac("R<sub>2</sub>", "R<sub>1</sub>")} (u<sub>2</sub> − u<sub>1</sub>).`)}</p>` : "") +
      `<p>${satText(uIdeal, Vs)}</p>`,
  };
}

function genSum() {
  const R1 = rPick([1, 2, 5, 10]), R2 = rPick([1, 2, 5, 10]), Rf = rPick([2, 5, 10, 20]), Vs = rPick([10, 15]);
  const U1 = rPick([0.5, 1, 2]) * rSign(), U2 = rPick([0.5, 1, 1.5, 2]) * rSign();
  const I = U1 / R1 + U2 / R2, uIdeal = -Rf * I, Ua = clamp(uIdeal, -Vs, Vs);
  return {
    gen: "sum", topic: "opv", tags: ["sum", "inv", "sat"],
    title: ["Invertierender Addierer", "Inverting summing amplifier"],
    intro: L(`Idealer OPV an ±${Vs} V. R<sub>1</sub> = ${R1} kΩ, R<sub>2</sub> = ${R2} kΩ, R<sub>f</sub> = ${Rf} kΩ, U<sub>1</sub> = ${nb(U1)} V, U<sub>2</sub> = ${nb(U2)} V.`,
      `Ideal op-amp on ±${Vs} V. R<sub>1</sub> = ${R1} kΩ, R<sub>2</sub> = ${R2} kΩ, R<sub>f</sub> = ${Rf} kΩ, U<sub>1</sub> = ${nb(U1)} V, U<sub>2</sub> = ${nb(U2)} V.`),
    fig: fig(330, 170, `${term(20, 50)}${txt(14, 40, "U₁", "lbl", "start")}${ckt("R", 20, 50, 110, 50, "R₁")}${term(20, 100)}${txt(14, 90, "U₂", "lbl", "start")}${ckt("R", 20, 100, 110, 100, "R₂", -1)}
      ${wire([110, 50], [130, 50], [130, 100], [110, 100])}${wire([130, 65], [160, 65])}${node(130, 65)}${wire([130, 50], [130, 20])}${ckt("R", 130, 20, 250, 20, "R<tspan class='sub' dy='4'>f</tspan>")}${wire([250, 20], [250, 80])}
      ${opamp(160, 80)}${wire([160, 95], [145, 95], [145, 140])}${gnd(145, 140)}${wire([230, 80], [290, 80])}${node(250, 80)}${term(290, 80)}${txt(296, 85, "U<tspan class='sub' dy='4'>a</tspan>", "lbl", "start")}`),
    parts: [
      { ask: L("Strom durch R<sub>f</sub>", "Current through R<sub>f</sub>"), ans: I, unit: "mA", pts: 1 },
      { ask: L("Ausgangsspannung U<sub>a</sub> (mit Versorgungsgrenze)", "Output voltage U<sub>a</sub> (with the supply limit)"), ans: Ua, unit: "V", pts: 2 },
    ],
    steps: L("Virtuelle Masse am −-Eingang: Die Ströme durch R<sub>1</sub> und R<sub>2</sub> addieren sich im Knoten und fließen alle durch R<sub>f</sub>.", "Virtual ground at the − input: the currents through R<sub>1</sub> and R<sub>2</sub> add up in the node and all flow through R<sub>f</sub>.") +
      F(`I = ${frac("U<sub>1</sub>", "R<sub>1</sub>")} + ${frac("U<sub>2</sub>", "R<sub>2</sub>")} = ${nb(I)} mA &nbsp; U<sub>a</sub> = −R<sub>f</sub> · I = ${nb(uIdeal)} V`, "small-f") + `<p>${satText(uIdeal, Vs)}</p>`,
  };
}

/* ---------------------------------------------------------------- Theory */

// Short questions like the ones each exam task opens with. The first answer is right.
const LEN_THEORY = {
  net: [
    [["Worauf beruhen die beiden Kirchhoffschen Gesetze?", "What are Kirchhoff's two laws based on?"], [["Knotensatz: Ladungserhaltung, Maschensatz: Energieerhaltung", "KCL: conservation of charge, KVL: conservation of energy"], ["beide auf Energieerhaltung", "both on conservation of energy"], ["Knotensatz: Energieerhaltung, Maschensatz: Ladungserhaltung", "KCL: energy, KVL: charge"], ["auf dem Ohmschen Gesetz", "on Ohm's law"]]],
    [["Wann wird einem Verbraucher die größte Leistung übertragen?", "When does a load get the most power?"], [["bei R<sub>L</sub> = R<sub>i</sub>", "at R<sub>L</sub> = R<sub>i</sub>"], ["bei R<sub>L</sub> → ∞", "at R<sub>L</sub> → ∞"], ["bei R<sub>L</sub> = 0", "at R<sub>L</sub> = 0"], ["bei R<sub>L</sub> = 2R<sub>i</sub>", "at R<sub>L</sub> = 2R<sub>i</sub>"]]],
    [["Welcher Wirkungsgrad ergibt sich bei Leistungsanpassung?", "What efficiency do you get with power matching?"], [["50 %"], ["100 %"], ["25 %"], ["70,7 %", "70.7 %"]]],
    [["Welche Eigenschaft müssen die Bauelemente haben, damit man Ströme überlagern darf?", "What must the elements be for currents to be superposed?"], [["linear", "linear"], ["passiv", "passive"], ["zeitabhängig", "time-dependent"], ["ohmsch", "resistive"]]],
    [["Was sagt die Cramersche Regel?", "What does Cramer's rule say?"], [["x<sub>i</sub> = det A<sub>i</sub> / det A (Spalte i durch die rechte Seite ersetzt)", "x<sub>i</sub> = det A<sub>i</sub> / det A (column i replaced by the right-hand side)"], ["x<sub>i</sub> = det A / det A<sub>i</sub>", "x<sub>i</sub> = det A / det A<sub>i</sub>"], ["x = A · b", "x = A · b"], ["x<sub>i</sub> = a<sub>ii</sub> / b<sub>i</sub>", "x<sub>i</sub> = a<sub>ii</sub> / b<sub>i</sub>"]]],
  ],
  ac: [
    [["Wie berechnet man die komplexe Scheinleistung?", "How do you work out complex apparent power?"], [["S = U · I*", "S = U · I*"], ["S = U* · I*", "S = U* · I*"], ["S = U / I", "S = U / I"], ["S = |U| + |I|", "S = |U| + |I|"]]],
    [["Ein Verbraucher hat Q &gt; 0. Er ist …", "A load has Q &gt; 0. It is …"], [["induktiv — der Strom eilt der Spannung nach", "inductive — the current lags the voltage"], ["kapazitiv — der Strom eilt vor", "capacitive — the current leads"], ["rein ohmsch", "purely resistive"], ["eine Quelle", "a source"]]],
    [["Ein Vierpol ist kopplungssymmetrisch (reziprok), wenn …", "A two-port is reciprocal when …"], [["Z<sub>12</sub> = Z<sub>21</sub>", "Z<sub>12</sub> = Z<sub>21</sub>"], ["Z<sub>11</sub> = Z<sub>22</sub>", "Z<sub>11</sub> = Z<sub>22</sub>"], ["det Z = 0", "det Z = 0"], ["Z<sub>12</sub> = −Z<sub>21</sub>", "Z<sub>12</sub> = −Z<sub>21</sub>"]]],
    [["Wie wird eine Last R<sub>L</sub> durch einen idealen Übertrager (ü = N<sub>1</sub>/N<sub>2</sub>) auf die Primärseite übertragen?", "How does an ideal transformer (ü = N<sub>1</sub>/N<sub>2</sub>) show a load R<sub>L</sub> on the primary side?"], [["ü² · R<sub>L</sub>", "ü² · R<sub>L</sub>"], ["ü · R<sub>L</sub>", "ü · R<sub>L</sub>"], ["R<sub>L</sub> / ü²", "R<sub>L</sub> / ü²"], ["R<sub>L</sub> bleibt gleich", "R<sub>L</sub> stays the same"]]],
    [["Wie definiert man Y<sub>11</sub> einer Admittanzmatrix?", "How is Y<sub>11</sub> of an admittance matrix defined?"], [["Y<sub>11</sub> = I<sub>1</sub>/U<sub>1</sub> bei U<sub>2</sub> = 0 (Ausgang kurzgeschlossen)", "Y<sub>11</sub> = I<sub>1</sub>/U<sub>1</sub> with U<sub>2</sub> = 0 (output shorted)"], ["Y<sub>11</sub> = I<sub>1</sub>/U<sub>1</sub> bei I<sub>2</sub> = 0 (Leerlauf)", "Y<sub>11</sub> = I<sub>1</sub>/U<sub>1</sub> with I<sub>2</sub> = 0 (open)"], ["Y<sub>11</sub> = U<sub>1</sub>/I<sub>1</sub>", "Y<sub>11</sub> = U<sub>1</sub>/I<sub>1</sub>"], ["Y<sub>11</sub> = I<sub>2</sub>/U<sub>1</sub>", "Y<sub>11</sub> = I<sub>2</sub>/U<sub>1</sub>"]]],
  ],
  ok: [
    [["Was ergibt die Inversion einer Geraden, die nicht durch den Ursprung geht?", "What do you get by inverting a line that misses the origin?"], [["einen Kreis durch den Ursprung", "a circle through the origin"], ["wieder eine Gerade", "a line again"], ["einen Kreis um den Ursprung", "a circle around the origin"], ["einen Punkt", "a point"]]],
    [["Bei Resonanz einer Reihen-RLC-Schaltung ist …", "At resonance a series RLC circuit has …"], [["Im(Z) = 0 und |Z| minimal (= R)", "Im(Z) = 0 and |Z| minimal (= R)"], ["|Z| maximal", "|Z| maximal"], ["Re(Z) = 0", "Re(Z) = 0"], ["der Strom null", "zero current"]]],
    [["Wie groß ist die Resonanzkreisfrequenz eines LC-Kreises?", "What is the resonant angular frequency of an LC circuit?"], [["ω<sub>0</sub> = 1/√(LC)", "ω<sub>0</sub> = 1/√(LC)"], ["ω<sub>0</sub> = √(LC)", "ω<sub>0</sub> = √(LC)"], ["ω<sub>0</sub> = 1/(LC)", "ω<sub>0</sub> = 1/(LC)"], ["ω<sub>0</sub> = L/C", "ω<sub>0</sub> = L/C"]]],
    [["Wo beginnt die Impedanz-Ortskurve von R in Reihe mit C (ω = 0)?", "Where does the impedance locus of R in series with C start (ω = 0)?"], [["bei R − j∞", "at R − j∞"], ["bei R", "at R"], ["im Ursprung", "at the origin"], ["bei R + j∞", "at R + j∞"]]],
  ],
  bode: [
    [["Um wie viel ändert sich die Asymptote eines Glieds 1. Ordnung pro Dekade?", "How much does a first-order stage change the asymptote per decade?"], [["20 dB", "20 dB"], ["6 dB", "6 dB"], ["3 dB", "3 dB"], ["40 dB", "40 dB"]]],
    [["Was gilt bei der Grenzfrequenz eines RC-Tiefpasses?", "What holds at the cut-off frequency of an RC low-pass?"], [["−3 dB und −45°", "−3 dB and −45°"], ["−6 dB und −90°", "−6 dB and −90°"], ["0 dB und 0°", "0 dB and 0°"], ["−20 dB und −45°", "−20 dB and −45°"]]],
    [["Wozu dient ein Spannungsfolger zwischen zwei Filterstufen?", "What is a voltage follower between two filter stages for?"], [["Entkopplung: die zweite Stufe belastet die erste nicht", "Decoupling: the second stage doesn't load the first"], ["Er verstärkt um den Faktor 10", "It amplifies tenfold"], ["Er dreht die Phase um 180°", "It turns the phase by 180°"], ["Er erhöht die Grenzfrequenz", "It raises the cut-off frequency"]]],
    [["Ein Faktor 10 in |G| entspricht …", "A factor of 10 in |G| is …"], [["+20 dB", "+20 dB"], ["+10 dB", "+10 dB"], ["+6 dB", "+6 dB"], ["+100 dB", "+100 dB"]]],
  ],
  opv: [
    [["Welche Eingangswiderstände hat ein idealer OPV?", "What input resistance does an ideal op-amp have?"], [["unendlich — es fließt kein Eingangsstrom", "infinite — no input current flows"], ["null", "zero"], ["50 Ω", "50 Ω"], ["so groß wie der Rückkoppelwiderstand", "as large as the feedback resistor"]]],
    [["Was gilt für einen idealen OPV mit Gegenkopplung?", "What holds for an ideal op-amp with negative feedback?"], [["U<sub>D</sub> = 0: beide Eingänge auf gleichem Potential", "U<sub>D</sub> = 0: both inputs at the same potential"], ["Der Ausgangsstrom ist null", "The output current is zero"], ["U<sub>a</sub> = U<sub>D</sub>", "U<sub>a</sub> = U<sub>D</sub>"], ["Die Verstärkung ist 1", "The gain is 1"]]],
    [["Welche Verstärkung hat ein Spannungsfolger (Impedanzwandler)?", "What gain does a voltage follower (buffer) have?"], [["1"], ["−1"], ["∞"], ["0"]]],
    [["Was passiert, wenn die berechnete Ausgangsspannung größer als die Versorgung ist?", "What happens if the calculated output exceeds the supply?"], [["Der Ausgang bleibt an der Versorgungsgrenze hängen (Sättigung)", "The output sticks at the supply limit (saturation)"], ["Der OPV liefert sie trotzdem", "The op-amp delivers it anyway"], ["Die Verstärkung kehrt sich um", "The gain reverses"], ["Der Ausgang wird 0 V", "The output becomes 0 V"]]],
  ],
};

function genTheory(topic) {
  const [q, opts] = rPick(LEN_THEORY[topic]);
  return {
    gen: "theory", topic, tags: [],
    title: ["Theoriefrage", "Theory question"],
    intro: Lp(q),
    parts: [{ ask: L("Antwort", "Answer"), mc: opts.map(Lp), pts: 1 }],
    steps: L(`Richtig: ${opts[0][0]}.`, `Right: ${opts[0][1] ?? opts[0][0]}.`),
  };
}

/* ---------------------------------------------------------------- The list */

const LEN_GENERATORS = [
  { id: "reso", topic: "ok", make: genReso, name: ["Resonanz, ±45°-Frequenzen und Güte", "Resonance, ±45° frequencies and Q"] },
  { id: "locus", topic: "ok", make: genLocus, name: ["Ortskurve zuordnen", "Match the locus"] },
  { id: "star", topic: "net", make: genStar, name: ["Stern-Dreieck-Umwandlung", "Star–delta conversion"] },
  { id: "source", topic: "net", make: genSource, name: ["Quellenumwandlung", "Source conversion"] },
  { id: "mesh", topic: "net", make: genMesh, name: ["Maschenstromverfahren mit Cramer", "Mesh analysis with Cramer"] },
  { id: "node", topic: "net", make: genNode, name: ["Knotenpotentialverfahren mit Cramer", "Nodal analysis with Cramer"] },
  { id: "match", topic: "net", make: genMatch, name: ["Leistungsanpassung und Wirkungsgrad", "Power matching and efficiency"] },
  { id: "series", topic: "ac", make: genSeries, name: ["Impedanz, Strom und Leistung einer Reihenschaltung", "Impedance, current and power of a series circuit"] },
  { id: "power", topic: "ac", make: genPower, name: ["Komplexe Leistung aus Messwerten", "Complex power from measurements"] },
  { id: "comp", topic: "ac", make: genComp, name: ["Blindleistungskompensation", "Reactive power compensation"] },
  { id: "trafo", topic: "ac", make: genTrafo, name: ["Kopplung und idealer Übertrager", "Coupling and the ideal transformer"] },
  { id: "rc", topic: "bode", make: genRC, name: ["RC-Filter: Grenzfrequenz, dB und Phase", "RC filter: cut-off, dB and phase"] },
  { id: "bodeid", topic: "bode", make: genBodeId, name: ["Amplitudengang lesen und zuordnen", "Read and match a magnitude plot"] },
  { id: "inv", topic: "opv", make: genInv, name: ["Invertierender Verstärker mit Sättigung", "Inverting amplifier with saturation"] },
  { id: "noninv", topic: "opv", make: genNonInv, name: ["Nichtinvertierenden Verstärker auslegen", "Design a non-inverting amplifier"] },
  { id: "diff", topic: "opv", make: genDiff, name: ["Subtrahierer", "Difference amplifier"] },
  { id: "sum", topic: "opv", make: genSum, name: ["Addierer", "Summing amplifier"] },
  ...LEN_TOPIC_IDS.map((t) => ({ id: "theory-" + t, topic: t, make: () => genTheory(t), name: ["Theoriefragen", "Theory questions"] })),
];
// Which tags each generator covers, for the method filter (from one sample of each).
LEN_GENERATORS.forEach((g) => (g.tags = g.id.startsWith("theory") ? [] : g.make().tags));
