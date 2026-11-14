// The NuMa course (Numerische Mathematik für die Fachrichtungen Informatik und Ingenieurwesen,
// SS 26, Daniel Weiß). Built from the course folder: the Skript, the 14 lectures (VL01–VL14), seven
// exercise sheets with solutions and the old exams from SS 17 to SS 26. The lecture material is in
// German, so NuMa is too.
//
// This file has what every NuMa page uses: formulas (matrices, vectors, norms, fractions), exact
// fractions and small matrix routines for the drawings and the tasks, the check at the end of each
// section, the chapter pages, Home, the Formelsammlung tab and the card on the course picker. The
// chapters are in numa-k1-3.js, numa-k4-5.js and numa-k6-7.js and join NUMA_CHAPTERS; the old exams
// are numa-exams.js, the exam tasks numa-tasks.js, Practice and the mock exam numa-mock.js.
//
// The pages reuse LEN's page parts (len-sec, len-index, len-toc, lw drawings, checks, formulas with
// frac() and F()) and ProPa's helpers for drawings, code and facts (pw, pbtn, pseg, pslider, ppW,
// ppFacts, ppEsc, codePair, arrowSVG from LEN, rint), which load before this file.
//
// Colours mean the same everywhere: green is the exact solution, blue an approximation (an iterate),
// red an error, gold the pivot or what happens now, pink a stored multiplier ℓ.

const NUMA_CHAPTERS = [];

/* ---------------------------------------------------------------- Formulas */

// Inline maths (serif italic letters, like F()).
const mi = (s) => `<span class="nm-mi">${s}</span>`;
// A matrix from rows of HTML cells, in round brackets. `hl` colours cells: { "row,col": class }.
function mx(rows, { hl = {}, cls = "" } = {}) {
  const n = Math.max(...rows.map((r) => r.length));
  return `<span class="nm-mx ${cls}" style="--n:${n}">${rows.map((r, i) => r.map((x, j) =>
    `<span class="${hl[i + "," + j] || ""}">${x}</span>`).join("")).join("")}</span>`;
}
// A column vector.
const cv = (xs, o) => mx(xs.map((x) => [x]), o);
// ‖x‖ with an optional index: nrm("x", 2) → ‖x‖₂.
const nrm = (x, p = "") => `‖${x}‖${p !== "" ? `<sub>${p}</sub>` : ""}`;
// An integral with limits, a square root, a transposed name.
const ig = (a, b) => `<span class="nm-int"><small>${b}</small><span>∫</span><small>${a}</small></span>`;
const sq = (x) => `√<span class="nm-sqrt">${x}</span>`;
const tp = (x) => `${x}<sup>⊤</sup>`;

// Numbers the German way: decimal comma, a real minus, trailing zeros dropped.
function nmD(x, d = 4) {
  if (!isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "NaN";
  let s = Math.abs(x).toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  const neg = x < 0 && +s !== 0;
  return (neg ? "−" : "") + s.replace(".", ",");
}
// Scientific: 2,22 · 10<sup>−16</sup>.
function nmSci(x, d = 2) {
  if (x === 0) return "0";
  if (!isFinite(x)) return nmD(x);
  const e = Math.floor(Math.log10(Math.abs(x)));
  if (e >= -3 && e <= 4) return nmD(x, Math.max(0, d + 1 - e));
  return `${nmD(x / 10 ** e, d)} · 10<sup>${e < 0 ? "−" + -e : e}</sup>`;
}
// A float that is really a small fraction (weights, multipliers) is shown as one.
function nmNice(x, maxDen = 64) {
  for (let d = 1; d <= maxDen; d++) {
    const n = Math.round(x * d);
    if (Math.abs(x * d - n) < 1e-9) return nmQ(n, d).html();
  }
  return nmD(x, 4);
}

// The lecture's Python (numpy) snippets, coloured like the other code on the site.
const NM_PY_KW = new Set("def return for in range if elif else while import as from and or not None True False".split(" "));
function pyHL(src) {
  const re = /(#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_]\w*)|(==|!=|<=|>=|[-+*\/=<>%])/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += ppEsc(src.slice(last, m.index));
    const [t, com, str, num, word, op] = m;
    if (com) out += `<span class="t-com">${ppEsc(t)}</span>`;
    else if (str) out += `<span class="t-str">${ppEsc(t)}</span>`;
    else if (num) out += `<span class="t-num">${t}</span>`;
    else if (word) out += NM_PY_KW.has(word) ? `<span class="t-kw">${word}</span>` : word === "np" ? `<span class="t-ty">${word}</span>` : word;
    else if (op) out += `<span class="t-op">${ppEsc(t)}</span>`;
    last = m.index + t.length;
  }
  return out + ppEsc(src.slice(last));
}
function pycode(src, { title = "", note = "" } = {}) {
  const lines = src.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  return `<figure class="pp-code">${title ? `<figcaption>${title}</figcaption>` : ""}<pre><code>${pyHL(lines.map((l) => l.slice(indent)).join("\n"))}</code></pre>${note ? `<p class="pp-code-note">${note}</p>` : ""}</figure>`;
}

/* ---------------------------------------------------------------- Exact fractions */

const nmGcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };
class NmQ {
  constructor(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    const g = nmGcd(n, d);
    this.n = n / g; this.d = d / g;
  }
  add(o) { o = nmQ(o); return new NmQ(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = nmQ(o); return new NmQ(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = nmQ(o); return new NmQ(this.n * o.n, this.d * o.d); }
  div(o) { o = nmQ(o); return new NmQ(this.n * o.d, this.d * o.n); }
  neg() { return new NmQ(-this.n, this.d); }
  abs() { return new NmQ(Math.abs(this.n), this.d); }
  cmp(o) { o = nmQ(o); return this.n * o.d - o.n * this.d; }
  eq(o) { return this.cmp(o) === 0; }
  get zero() { return this.n === 0; }
  valueOf() { return this.n / this.d; }
  // As typed in an answer: -3/4.
  toString() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
  // As shown: −¾ as a small stacked fraction.
  html() {
    const s = this.n < 0 ? "−" : "";
    return this.d === 1 ? s + Math.abs(this.n) : `${s}${frac(Math.abs(this.n), this.d)}`;
  }
}
const nmQ = (n, d = 1) => (n instanceof NmQ ? n : new NmQ(n, d));
const qm = (rows) => rows.map((r) => r.map((x) => nmQ(x)));
const qh = (x) => (x instanceof NmQ ? x.html() : nmD(x));
const qmx = (M, o) => mx(M.map((r) => r.map(qh)), o);
const qcv = (v, o) => cv(v.map(qh), o);

// Solves a small system exactly (Gaussian elimination on fractions); null if singular.
function nmSolveQ(A, b) {
  const n = A.length, M = A.map((r, i) => [...r.map((x) => nmQ(x)), nmQ(b[i])]);
  for (let k = 0; k < n; k++) {
    const p = M.findIndex((r, i) => i >= k && !r[k].zero);
    if (p < 0) return null;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = 0; i < n; i++) {
      if (i === k || M[i][k].zero) continue;
      const l = M[i][k].div(M[k][k]);
      M[i] = M[i].map((x, j) => x.sub(l.mul(M[k][j])));
    }
  }
  return M.map((r, i) => r[n].div(r[i]));
}

// LR decomposition with column pivoting, step by step, on fractions — as in the lecture's scheme:
// the original row numbers stay on the left (the permutation), the multipliers ℓ are kept where the
// zeros appear. Each step: { M, perm, k, piv, phase, ell } where ell marks the stored multipliers.
function nmLRSteps(A0) {
  const n = A0.length;
  let M = qm(A0), perm = A0.map((_, i) => i + 1);
  const ell = A0.map(() => A0.map(() => false));
  const snap = (k, piv, phase, note) => ({ M: M.map((r) => [...r]), perm: [...perm], ell: ell.map((r) => [...r]), k, piv, phase, note });
  const steps = [snap(-1, -1, "start")];
  for (let k = 0; k < n - 1; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (M[i][k].abs().cmp(M[p][k].abs()) > 0) p = i;
    steps.push(snap(k, p, "pivot"));
    if (M[p][k].zero) return { steps, singular: true };
    if (p !== k) {
      [M[k], M[p]] = [M[p], M[k]]; [perm[k], perm[p]] = [perm[p], perm[k]]; [ell[k], ell[p]] = [ell[p], ell[k]];
      steps.push(snap(k, k, "swap", p));
    }
    for (let i = k + 1; i < n; i++) {
      const l = M[i][k].div(M[k][k]);
      for (let j = k + 1; j < n; j++) M[i][j] = M[i][j].sub(l.mul(M[k][j]));
      M[i][k] = l;
      ell[i][k] = true;
    }
    steps.push(snap(k, k, "elim"));
  }
  if (M[n - 1][n - 1].zero) return { steps, singular: true };
  const L = M.map((r, i) => r.map((x, j) => (j < i ? x : nmQ(+(i === j))))), R = M.map((r, i) => r.map((x, j) => (j >= i ? x : nmQ(0))));
  return { steps, perm, L, R };
}
// The permutation vector as a matrix (row k of P is e_perm[k]).
const nmPermMat = (perm) => perm.map((p) => perm.map((_, j) => nmQ(+(j === p - 1))));

/* ---------------------------------------------------------------- Floats: small matrix routines */

const nmT = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const nmMul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const nmMv = (A, v) => A.map((r) => r.reduce((s, x, k) => s + x * v[k], 0));
const nmDot = (u, v) => u.reduce((s, x, i) => s + x * v[i], 0);
const nmN2 = (v) => Math.sqrt(nmDot(v, v));
const nmEye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const nmNormInf = (A) => Math.max(...A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)));
const nmNorm1 = (A) => nmNormInf(nmT(A));

// Gaussian elimination with column pivoting (floats); null if singular.
function nmSolve(A, b) {
  const n = A.length, M = A.map((r, i) => [...r, b[i]]);
  for (let k = 0; k < n; k++) {
    let p = k;
    for (let i = k + 1; i < n; i++) if (Math.abs(M[i][k]) > Math.abs(M[p][k])) p = i;
    if (Math.abs(M[p][k]) < 1e-14) return null;
    [M[k], M[p]] = [M[p], M[k]];
    for (let i = k + 1; i < n; i++) {
      const l = M[i][k] / M[k][k];
      for (let j = k; j <= n; j++) M[i][j] -= l * M[k][j];
    }
  }
  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) x[i] = (M[i][n] - M[i].slice(i + 1, n).reduce((s, a, j) => s + a * x[i + 1 + j], 0)) / M[i][i];
  return x;
}
const nmInv = (A) => nmT(nmEye(A.length).map((e) => nmSolve(A, e)));

// Eigenvalues and eigenvectors of a symmetric matrix (Jacobi rotations), largest first:
// { vals, vecs } with vecs[k] the eigenvector of vals[k].
function nmEigSym(A0) {
  const n = A0.length, A = A0.map((r) => [...r]), V = nmEye(n);
  for (let sweep = 0; sweep < 80; sweep++) {
    let off = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += A[i][j] ** 2;
    if (off < 1e-24) break;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      if (Math.abs(A[p][q]) < 1e-300) continue;
      const th = (A[q][q] - A[p][p]) / (2 * A[p][q]);
      const t = (th >= 0 ? 1 : -1) / (Math.abs(th) + Math.sqrt(th * th + 1)), c = 1 / Math.sqrt(t * t + 1), s = t * c;
      for (let k = 0; k < n; k++) { const a = A[k][p], b = A[k][q]; A[k][p] = c * a - s * b; A[k][q] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = A[p][k], b = A[q][k]; A[p][k] = c * a - s * b; A[q][k] = s * a + c * b; }
      for (let k = 0; k < n; k++) { const a = V[k][p], b = V[k][q]; V[k][p] = c * a - s * b; V[k][q] = s * a + c * b; }
    }
  }
  const order = A.map((_, i) => i).sort((a, b) => A[b][b] - A[a][a]);
  return { vals: order.map((i) => A[i][i]), vecs: order.map((i) => V.map((r) => r[i])) };
}

// QR decomposition by Householder reflections, with the lecture's sign choice (no cancellation).
function nmQR(A) {
  const m = A.length, n = A[0].length, R = A.map((r) => [...r]), Q = nmEye(m);
  for (let k = 0; k < Math.min(n, m - 1); k++) {
    const x = R.slice(k).map((r) => r[k]), nx = nmN2(x);
    if (nx < 1e-300) continue;
    const sigma = x[0] > 0 ? -nx : nx;
    const v = [...x]; v[0] -= sigma;
    const nv = nmN2(v);
    if (nv < 1e-300) continue;
    const w = v.map((a) => a / nv);
    for (let j = 0; j < n; j++) {
      const d = w.reduce((s, wi, i) => s + wi * R[k + i][j], 0);
      w.forEach((wi, i) => (R[k + i][j] -= 2 * d * wi));
    }
    for (let i = 0; i < m; i++) {
      const d = w.reduce((s, wj, j) => s + Q[i][k + j] * wj, 0);
      w.forEach((wj, j) => (Q[i][k + j] -= 2 * d * wj));
    }
  }
  return { Q, R };
}

/* ---------------------------------------------------------------- Plots */

// A coordinate frame for a plot: X(x), Y(y) map into an SVG of size W × H with a margin, and
// axes() draws the axes with a few ticks.
function nmFrame(W, H, [x0, x1], [y0, y1], pad = { l: 34, r: 12, t: 12, b: 26 }) {
  const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = (y) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const ticks = (a, b, n = 5) => {
    const step = 10 ** Math.floor(Math.log10((b - a) / n)), m = [1, 2, 5, 10].find((k) => (b - a) / (k * step) <= n) * step;
    const out = [];
    for (let t = Math.ceil(a / m) * m; t <= b + 1e-9; t += m) out.push(+t.toFixed(10));
    return out;
  };
  const axes = ({ xl = "", yl = "", xt = ticks(x0, x1), yt = ticks(y0, y1) } = {}) => {
    const ay = y0 <= 0 && y1 >= 0 ? Y(0) : H - pad.b, ax = x0 <= 0 && x1 >= 0 ? X(0) : pad.l;
    return `<line x1="${pad.l}" y1="${ay}" x2="${W - pad.r}" y2="${ay}" class="tick"/><line x1="${ax}" y1="${pad.t}" x2="${ax}" y2="${H - pad.b}" class="tick"/>` +
      xt.map((t) => `<line x1="${X(t)}" y1="${ay}" x2="${X(t)}" y2="${ay + 4}" class="tick"/><text x="${X(t)}" y="${ay + 16}" text-anchor="middle" class="tick-t">${nmD(t, 3)}</text>`).join("") +
      yt.map((t) => `<line x1="${ax - 4}" y1="${Y(t)}" x2="${ax}" y2="${Y(t)}" class="tick"/><text x="${ax - 6}" y="${Y(t) + 4}" text-anchor="end" class="tick-t">${nmD(t, 3)}</text>`).join("") +
      (xl ? `<text x="${W - pad.r}" y="${ay - 6}" text-anchor="end" class="ax-t">${xl}</text>` : "") +
      (yl ? `<text x="${ax + 6}" y="${pad.t + 10}" class="ax-t">${yl}</text>` : "");
  };
  // A function as a polyline, cut where it leaves the frame by more than the frame's height.
  const path = (f, n = 240, a = x0, b = x1) => {
    let d = "", pen = false;
    for (let i = 0; i <= n; i++) {
      const x = a + ((b - a) * i) / n, y = f(x);
      if (!isFinite(y) || y > y1 + (y1 - y0) || y < y0 - (y1 - y0)) { pen = false; continue; }
      d += `${pen ? "L" : "M"}${X(x).toFixed(1)},${Y(y).toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  return { X, Y, axes, path, W, H };
}

/* ---------------------------------------------------------------- Progress */

const nmPassMark = (n) => n - 1;
const nmBest = (sec) => store.get("numaChecks", {})[sec.id];
const nmPassed = (sec) => (nmBest(sec) ?? -1) >= nmPassMark(sec.check.length);
const nmSections = () => NUMA_CHAPTERS.flatMap((ch) => ch.sections);
const nmNextSection = () => nmSections().find((s) => !nmPassed(s)) || nmSections()[0];
const nmSecId = (id) => "nmSec-" + id.replace(/\./g, "-");
const nmChapterOf = (id) => NUMA_CHAPTERS.find((ch) => ch.sections.some((s) => s.id === id));
const nmTab = (ch) => "numa-k" + ch.n;

function nmScrollTo(id) {
  const el = $("#" + nmSecId(id));
  if (!el) return;
  const index = $(`#${nmTab(nmChapterOf(id))} .len-index`);
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - barHeight() - (index ? index.offsetHeight : 0) - 8 });
}

function openNumaSection(id) {
  showTab(nmTab(nmChapterOf(id)));
  nmScrollTo(id);
}

/* ---------------------------------------------------------------- Section checks */

// The check at the end of a section: { q, opts: [...] (the first is right), why }, all HTML.
function renderNumaCheck(box, sec) {
  const n = sec.check.length;
  const best = nmBest(sec);
  box.innerHTML = `
    <div class="card-head">
      <h3>Kurztest · ${sec.id}</h3>
      ${nmPassed(sec) ? `<span class="pill good">✓ geschafft</span>` : ""}
    </div>
    <p class="small muted">${n} Fragen. Mit ${nmPassMark(n)} richtigen ist der Abschnitt geschafft.${best === undefined ? "" : ` Bisher am besten: ${best} / ${n}.`}</p>
    <button class="btn primary" type="button">${best === undefined ? "Kurztest starten" : "Noch einmal"}</button>`;
  $("button", box).onclick = () => runNumaCheck(box, sec);
}

function runNumaCheck(box, sec) {
  track("numa.check");
  const qs = shuffle(sec.check.map((q) => ({ ...q, opts: shuffle(q.opts.map((o, i) => ({ o, right: i === 0 }))) })));
  let i = 0, score = 0;
  const ask = () => {
    const q = qs[i];
    box.innerHTML = `
      <div class="card-head"><h3>Kurztest · ${sec.id}</h3><span class="muted small">${i + 1} / ${qs.length}</span></div>
      <div class="len-q">${q.q}</div>
      <div class="q-opts wide">${q.opts.map((o, j) => `<button class="q-opt" type="button" data-j="${j}">${o.o}</button>`).join("")}</div>
      <div class="q-feedback"></div>`;
    $$(".q-opt", box).forEach((b) => (b.onclick = () => {
      const pick = q.opts[+b.dataset.j];
      if (pick.right) score++;
      $$(".q-opt", box).forEach((o, j) => {
        o.disabled = true;
        if (q.opts[j].right) o.classList.add("right");
      });
      if (!pick.right) b.classList.add("wrong");
      const last = i === qs.length - 1;
      $(".q-feedback", box).innerHTML = `
        <div class="verdict ${pick.right ? "ok" : "bad"}">${pick.right ? "Richtig!" : "Nicht ganz."}</div>
        <div class="pp-why">${q.why}</div>
        <div class="q-actions"><button class="btn primary" type="button">${last ? "Ergebnis" : "Weiter →"}</button></div>`;
      $(".q-actions .btn", box).onclick = () => { i++; i < qs.length ? ask() : done(); };
      $(".q-actions .btn", box).focus({ preventScroll: true });
    }));
  };
  const done = () => {
    track("numa.checkDone");
    const all = store.get("numaChecks", {});
    if (score > (all[sec.id] ?? -1)) store.set("numaChecks", { ...all, [sec.id]: score });
    const passed = score >= nmPassMark(qs.length);
    renderNumaCheck(box, sec);
    box.insertAdjacentHTML("afterbegin", `<p class="len-result ${passed ? "ok" : "bad"}">${score} / ${qs.length} — ${passed
      ? "Abschnitt geschafft!" : "Schau dir den Abschnitt noch einmal an und versuch es wieder."}</p>`);
    nmUpdateIndex(nmChapterOf(sec.id));
  };
  ask();
}

/* ---------------------------------------------------------------- Chapter pages */

function renderNumaChapter(ch) {
  const panel = $("#" + nmTab(ch));
  panel.innerHTML = `
    <div class="card hero">
      <span class="len-kicker">Kapitel ${ch.n} · ${ch.vl}</span>
      <h1>${ch.headline}</h1>
      <p>${ch.intro}</p>
    </div>
    <nav class="len-index" aria-label="Abschnitte"></nav>
    ${ch.sections.map((s) => `
      <section class="len-sec" id="${nmSecId(s.id)}">
        <div class="len-sec-head"><span class="len-num">${s.id}</span><h2>${s.title}</h2></div>
        ${s.html()}
        <div class="card len-check" data-check="${s.id}"></div>
      </section>`).join("")}
    ${ch.next ? `<div class="pp-next"><button class="btn primary" type="button" data-go="numa-k${ch.n + 1}">Weiter: Kapitel ${ch.n + 1} · ${ch.next} →</button></div>` : ""}`;
  ch.sections.forEach((s) => {
    s.setup?.($("#" + nmSecId(s.id)));
    renderNumaCheck($(`[data-check="${s.id}"]`, panel), s);
  });
  $$("[data-go]", panel).forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
  $$("[data-sec]", panel).forEach((b) => (b.onclick = () => openNumaSection(b.dataset.sec)));
  nmUpdateIndex(ch);
}

function nmUpdateIndex(ch) {
  const ix = $(`#${nmTab(ch)} .len-index`);
  if (!ix) return;
  ix.innerHTML = ch.sections.map((s) => `
    <button type="button" class="len-ix ${nmPassed(s) ? "done" : ""}" data-ix="${s.id}">
      <span class="len-num">${s.id}</span>${s.short}${nmPassed(s) ? ' <span class="len-ix-ok" aria-hidden="true">✓</span>' : ""}</button>`).join("");
  $$("button", ix).forEach((b) => (b.onclick = () => nmScrollTo(b.dataset.ix)));
}

// The idea in short at the top of a section, and the traps at its end (ProPa's boxes, in German).
const nmGist = (items) => `<div class="pp-gist"><span class="pp-gist-cap">Kurz gesagt</span><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
const nmTraps = (items) => `<div class="pp-traps"><span class="pp-traps-cap">Achtung</span><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;

// A link to another section, inside the text.
const nmSee = (id, label = `Abschnitt ${id}`) => `<button type="button" class="nm-see" data-sec="${id}">${label}</button>`;

/* ---------------------------------------------------------------- Home */

function renderNumaHome() {
  const next = nmNextSection();
  const allDone = nmSections().every(nmPassed);
  const solved = Object.values(store.get("numaTaskSolved", {})).reduce((a, b) => a + b, 0);
  const mock = store.get("numaMock", {});
  const tile = (go, icon, title, sub) => `<button class="home-tile" type="button" data-go="${go}"><span class="home-tile-ja len-tile-icon" aria-hidden="true">${icon}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`;
  $("#numa-home").innerHTML = `
    <div class="card hero">
      <h1>Numerische <span class="accent">Mathematik</span></h1>
      <p>Die Vorlesung zum Wiederholen, Kapitel für Kapitel wie im Skript: jedes Verfahren kurz gesagt, die Formeln, die man
        in der Klausur braucht, Zeichnungen, die das Verfahren Schritt für Schritt vorrechnen, die typischen Fallen und ein
        Kurztest pro Abschnitt. <b>Übungsaufgaben</b> macht Aufgaben wie in den Altklausuren, immer mit neuen Zahlen, und die
        <b>Probeklausur</b> stellt sechs davon zu einer Klausur zusammen.</p>
      <div class="home-actions">
        <button class="btn primary" type="button" id="nmGo">${allDone ? "Von vorn wiederholen" : `Weiter mit ${next.id}: ${next.title}`} →</button>
        <button class="btn" type="button" data-go="numa-practice">Übungsaufgaben</button>
        <button class="btn" type="button" data-go="numa-mock">Probeklausur</button>
        <button class="btn" type="button" data-go="numa-sheet">Formelsammlung</button>
      </div>
    </div>
    ${NUMA_CHAPTERS.map(nmChapterCardHTML).join("")}
    <div class="card">
      <h2>Klausur</h2>
      <div class="home-tiles">
        ${tile("numa-practice", "✎", "Übungsaufgaben", `${NUMA_TASKS.length} Aufgaben wie in den Altklausuren · ${solved}× ganz richtig`)}
        ${tile("numa-mock", "⏱", "Probeklausur", mock.best !== undefined ? `Bestes Ergebnis: ${mock.best} %` : "Sechs Aufgaben, wie eine echte Klausur")}
        ${tile("numa-exams", "📄", "Altklausuren", `${NUMA_EXAMS.length} Klausuren · ${store.get("numaExamDone", []).length} / ${NUMA_EXAMS.flatMap((e) => e.tasks).length} Aufgaben erledigt`)}
        ${tile("numa-sheet", "Σ", "Formelsammlung", "Formeln, Aufwände und Begriffe auf einen Blick")}
      </div>
    </div>
    <div class="card">
      <h2>Farben</h2>
      <p class="small muted">Auf allen Seiten dasselbe, in Formeln und Zeichnungen.</p>
      <div class="len-legend">
        ${[["nm-exact", "x*", "exakte Lösung"], ["nm-approx", "x<sub>k</sub>", "Näherung, Iterierte"], ["nm-err", "e", "Fehler, Residuum"],
          ["nm-piv", "▬", "Pivot, was gerade passiert"], ["nm-ell", "ℓ", "gespeicherter Faktor ℓ der LR-Zerlegung"]]
          .map(([c, m, t]) => `<span class="len-swatch"><b class="${c}">${m}</b>${t}</span>`).join("")}
      </div>
    </div>`;
  $("#nmGo").onclick = () => { track("numa.continue"); openNumaSection(next.id); };
  $$("#numa-home [data-sec]").forEach((b) => (b.onclick = () => openNumaSection(b.dataset.sec)));
  $$("#numa-home [data-go]").forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
}

function nmChapterCardHTML(ch) {
  const done = ch.sections.filter(nmPassed).length;
  return `
    <div class="card">
      <div class="card-head">
        <h2>Kapitel ${ch.n} · ${ch.title}</h2>
        <span class="small muted">${ch.vl} · <b>${done}</b> / ${ch.sections.length} Abschnitte</span>
      </div>
      <span class="lmastery-bar course-bar len-bar"><span style="width:${(done / ch.sections.length) * 100}%"></span></span>
      <div class="len-toc">
        ${ch.sections.map((s) => `
          <button class="len-toc-tile ${nmPassed(s) ? "done" : ""}" type="button" data-sec="${s.id}">
            <span class="len-num">${s.id}</span>
            <span><b>${s.title}</b><span class="small muted">${s.about}</span></span>
            <span class="len-toc-state" aria-hidden="true">${nmPassed(s) ? "✓" : ""}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

// The course picker's card for NuMa.
function numaCourseCardHTML(c) {
  const secs = nmSections();
  const done = secs.filter(nmPassed).length;
  const next = nmNextSection();
  return `
    <div class="course-card" style="--cc:${c.color}">
      <span class="course-mark short len-mark" aria-hidden="true">${c.mark}</span>
      <div class="course-body">
        <h2 lang="de">${c.name}</h2>
        <p class="muted" lang="de">Gleitpunktzahlen, LR-, Cholesky- und QR-Zerlegung, Newton, Interpolation, Quadratur, Eigenwerte und
          das cg-Verfahren — mit Zeichnungen, die jedes Verfahren Schritt für Schritt vorrechnen, und Aufgaben wie in den Altklausuren.</p>
      </div>
      <div class="course-side">
        <div class="course-stats small">
          <span><b>${done}</b> / ${secs.length} Abschnitte</span>
          <span>${NUMA_CHAPTERS.length} Kapitel · ${NUMA_EXAMS.length} Altklausuren</span>
        </div>
        <span class="lmastery-bar course-bar"><span style="width:${(done / secs.length) * 100}%"></span></span>
        <div class="home-actions">
          <button class="btn primary" data-course="${c.id}">Kurs öffnen →</button>
          <button class="btn" id="nmCourseGo" data-sec="${next.id}">Weiter mit ${next.id}</button>
        </div>
      </div>
    </div>`;
}

function wireNumaCourseCard() {
  const go = $("#nmCourseGo");
  if (go) go.onclick = () => { track("courses.numaContinue"); openNumaSection(go.dataset.sec); };
}

/* ---------------------------------------------------------------- Formelsammlung */

// [group, [[what, formula, note, section]]]
const NUMA_SHEET = [
  ["Gleitpunktzahlen", [
    ["Gleitpunktzahl", `±(0.${mi("a")}<sub>1</sub>${mi("a")}<sub>2</sub>…${mi("a")}<sub>${mi("L")}<sub>m</sub></sub>)<sub>${mi("B")}</sub> · ${mi("B")}<sup>${mi("e")}</sup>, ${mi("a")}<sub>1</sub> ≠ 0`, "Normalisiert: B⁻¹ ≤ |m| < 1.", "1.1"],
    ["Exponenten", `${mi("e")}<sub>max</sub> = ${mi("e")}<sub>min</sub> + ${mi("B")}<sup>${mi("L")}<sub>e</sub></sup> − 1`, "Le Ziffern zur Basis B für e − emin.", "1.1"],
    ["Größte, kleinste", `max FL = ${mi("B")}<sup>${mi("e")}<sub>max</sub></sup>(1 − ${mi("B")}<sup>−${mi("L")}<sub>m</sub></sup>),  min FL<sup>+</sup> = ${mi("B")}<sup>${mi("e")}<sub>min</sub>−1</sup>`, "", "1.1"],
    ["Maschinengenauigkeit", `eps = ${frac("1", "2")}${mi("B")}<sup>1−${mi("L")}<sub>m</sub></sup>,  fl(${mi("x")}) = ${mi("x")}(1 + ε), |ε| ≤ eps`, "IEEE double (wie in der Vorlesung): eps = 2⁻⁵² ≈ 2,2 · 10⁻¹⁶.", "1.1"],
    ["Kondition der Summe", `${frac(`|x̃ + ỹ − (x + y)|`, `|x + y|`)} ≤ ε ${frac(`|x| + |y|`, `|x + y|`)}`, "Schlecht bei x ≈ −y: Auslöschung.", "1.2"],
  ]],
  ["Lineare Gleichungssysteme", [
    ["LR-Zerlegung", `${mi("PA")} = ${mi("LR")}, dann ${mi("Ly")} = ${mi("Pb")} vorwärts, ${mi("Rx")} = ${mi("y")} rückwärts`, "ℓnn = 1; Spaltenpivotwahl: betragsgrößtes Element.", "2.1"],
    ["Cholesky", `${mi("A")} = ${mi("L")}${tp(mi("L"))}: ${mi("ℓ")}<sub>nn</sub> = ${sq(`${mi("a")}<sub>nn</sub> − Σ<sub>k&lt;n</sub> ${mi("ℓ")}<sub>nk</sub><sup>2</sup>`)}`, "Existiert genau für spd A. Kein Pivotisieren.", "2.2"],
    ["Householder", `${mi("Q")} = ${mi("I")} − 2${mi("w")}${tp(mi("w"))}, ${mi("w")} = ${frac(`v − σe<sub>1</sub>`, `‖v − σe<sub>1</sub>‖<sub>2</sub>`)}, σ = −sign(${mi("v")}<sub>1</sub>)${nrm(mi("v"), 2)}`, "Q symmetrisch, orthogonal, Spiegelung.", "2.3"],
    ["Konditionszahl", `cond(${mi("A")}) = ${nrm(mi("A"))} ${nrm(`${mi("A")}<sup>−1</sup>`)},  cond<sub>2</sub>(${mi("A")}) = ${frac("|λ|<sub>max</sub>", "|λ|<sub>min</sub>")} (A symm.)`, "", "2.4"],
    ["Störungssatz", `${frac(`‖x − x̃‖`, `‖x‖`)} ≤ ${frac(`cond(A)`, `1 − ε<sub>A</sub> cond(A)`)} (ε<sub>A</sub> + ε<sub>b</sub>)`, "", "2.4"],
    ["Matrixnormen", `${nrm(mi("A"), 1)} = max Spaltensumme, ${nrm(mi("A"), "∞")} = max Zeilensumme, ${nrm(mi("A"), 2)} = ${sq(`λ<sub>max</sub>(${tp("A")}A)`)}`, "", "2.4"],
    ["Ausgleich", `${nrm(`${mi("Ax")} − ${mi("b")}`, 2)} = min! ⇔ ${tp(mi("A"))}${mi("Ax")} = ${tp(mi("A"))}${mi("b")}`, "Besser per QR: x = R̄⁻¹c mit Qᵀb = (c, d), Residuum ‖d‖₂.", "2.5"],
    ["SWZ", `${mi("A")} = ${mi("U")}Σ${tp(mi("V"))}, σ<sub>n</sub> = ${sq(`λ<sub>n</sub>(${tp("A")}A)`)}, ${nrm(mi("A"), 2)} = σ<sub>1</sub>`, "x = Σ (uᵣᵀb/σᵣ) vᵣ: Lösung kleinster Norm.", "2.6"],
  ]],
  ["Nichtlineare Gleichungen", [
    ["Newton", `${mi("f")}′(${mi("x")}<sub>k</sub>)${mi("d")}<sub>k</sub> = −${mi("f")}(${mi("x")}<sub>k</sub>),  ${mi("x")}<sub>k+1</sub> = ${mi("x")}<sub>k</sub> + ${mi("d")}<sub>k</sub>`, "Stopp, wenn ‖dₖ‖ < ε. Lokal quadratisch.", "3.1"],
    ["Wurzel", `${mi("x")}<sub>k+1</sub> = ${frac("1", "2")}(${mi("x")}<sub>k</sub> + ${frac("a", "x<sub>k</sub>")})`, "Newton für f(x) = x² − a.", "3.1"],
    ["Vereinfacht", `${mi("A")}${mi("d")}<sub>k</sub> = −${mi("f")}(${mi("x")}<sub>k</sub>), ${mi("A")} ≈ ${mi("f")}′(${mi("x")}<sub>0</sub>)`, "Eine LR-Zerlegung, aber nur linear.", "3.2"],
    ["Minimum", `∇${mi("f")}(${mi("x")}) = 0: ${mi("H")}<sub>f</sub>(${mi("x")}<sub>k</sub>)${mi("d")}<sub>k</sub> = −∇${mi("f")}(${mi("x")}<sub>k</sub>)<sup>⊤</sup>`, "Newton auf den Gradienten.", "3.3"],
  ]],
  ["Interpolation", [
    ["Lagrange", `${mi("L")}<sub>n</sub>(${mi("x")}) = ∏<sub>m≠n</sub> ${frac("x − x<sub>m</sub>", "x<sub>n</sub> − x<sub>m</sub>")},  ${mi("p")} = Σ ${mi("f")}<sub>n</sub>${mi("L")}<sub>n</sub>`, "", "4.1"],
    ["Lebesgue-Konstante", `Λ<sub>N</sub> = max<sub>x</sub> Σ<sub>n</sub> |${mi("L")}<sub>n</sub>(${mi("x")})|,  max|p − p̃| ≤ Λ<sub>N</sub> max|f<sub>n</sub> − f̃<sub>n</sub>|`, "", "4.1"],
    ["Dividierte Differenzen", `${mi("f")}<sub>n,k</sub> = ${frac("f<sub>n,k−1</sub> − f<sub>n+1,k</sub>", "x<sub>n</sub> − x<sub>k</sub>")}`, "", "4.2"],
    ["Newton-Darstellung", `${mi("p")} = ${mi("f")}<sub>0,0</sub> + ${mi("f")}<sub>0,1</sub>${mi("w")}<sub>1</sub> + … + ${mi("f")}<sub>0,N</sub>${mi("w")}<sub>N</sub>, ${mi("w")}<sub>n</sub> = ∏<sub>m&lt;n</sub>(x − x<sub>m</sub>)`, "", "4.2"],
    ["Restglied", `${mi("f")}(${mi("x")}) − ${mi("p")}(${mi("x")}) = ${mi("w")}<sub>N+1</sub>(${mi("x")}) ${frac("f<sup>(N+1)</sup>(ξ)", "(N + 1)!")}`, "", "4.3"],
    ["Tschebyscheff", `${mi("x")}<sub>n</sub> = cos(${frac("2n + 1", "2N + 2")}π),  max|${mi("w")}<sub>N+1</sub>| = 2<sup>−N</sup>`, "T₀ = 1, T₁ = x, Tₙ₊₁ = 2xTₙ − Tₙ₋₁.", "4.3"],
    ["Spline-Fehler", `max|${mi("f")} − ${mi("s")}| ≤ ${frac("5", "384")}${mi("h")}<sup>4</sup> max|${mi("f")}<sup>(4)</sup>|`, "Eingespannt, f ∈ C⁴.", "4.4"],
  ]],
  ["Integration", [
    ["Quadraturformel", `${ig("a", "b")}${mi("f")} d${mi("x")} ≈ (${mi("b")} − ${mi("a")}) Σ ${mi("b")}<sub>k</sub>${mi("f")}(${mi("a")} + ${mi("c")}<sub>k</sub>(${mi("b")} − ${mi("a")}))`, "Gewichte bₖ, Knoten cₖ.", "5.1"],
    ["Ordnungsbedingungen", `Σ<sub>k</sub> ${mi("b")}<sub>k</sub>${mi("c")}<sub>k</sub><sup>q−1</sup> = ${frac("1", "q")} für q = 1, …, p`, "Ordnung p: exakt für Grad ≤ p − 1.", "5.2"],
    ["Gewichte aus Knoten", `${mi("b")}<sub>k</sub> = ${ig("0", "1")}${mi("L")}<sub>k</sub>(${mi("x")}) d${mi("x")}`, "Genau dann p ≥ s.", "5.2"],
    ["Gauß", `p = 2s, ${mi("c")}<sub>k</sub> = ${frac("1", "2")}(1 + γ<sub>k</sub>), γ<sub>k</sub> Nullstellen von Legendre`, "s = 2: c = ½ ∓ √3/6, b = ½, ½.", "5.3"],
    ["Fehler", `|E(f)| ≤ (b − a)<sup>p+1</sup> max|f<sup>(p)</sup>| ${ig("0", "1")}|K<sub>p</sub>|`, "Mittelpunkt 1/24, Trapez 1/12, Simpson 1/2880.", "5.4"],
    ["Summiert", `Fehler = O(h<sup>p</sup>)`, "Trapez: (b − a)h²/12 · max|f″|.", "5.4"],
  ]],
  ["Eigenwerte und Iterationen", [
    ["Vektoriteration", `${mi("y")}<sub>k</sub> = ${frac("x<sub>k</sub>", "‖x<sub>k</sub>‖")},  ${mi("x")}<sub>k+1</sub> = ${mi("A")}${mi("y")}<sub>k</sub>`, "Rate |λ₂/λ₁|; λ ≈ yᵀAy.", "6.1"],
    ["Inverse mit Shift", `(${mi("A")} − λ*${mi("I")})${mi("x")}<sub>k+1</sub> = ${mi("y")}<sub>k</sub>`, "Liefert den EW am nächsten an λ*.", "6.1"],
    ["QR-Algorithmus", `${mi("H")}<sub>k</sub> − μ<sub>k</sub>${mi("I")} = ${mi("Q")}<sub>k</sub>${mi("R")}<sub>k</sub>,  ${mi("H")}<sub>k+1</sub> = ${mi("R")}<sub>k</sub>${mi("Q")}<sub>k</sub> + μ<sub>k</sub>${mi("I")}`, "μₖ = hₙₙ: quadratisch, symmetrisch kubisch.", "6.3"],
    ["Lineare Iteration", `${mi("x")}<sub>k+1</sub> = ${mi("x")}<sub>k</sub> + ${mi("B")}<sup>−1</sup>(${mi("b")} − ${mi("A")}${mi("x")}<sub>k</sub>)`, "Konvergent, wenn ρ(I − B⁻¹A) < 1. Jacobi B = D, Gauß-Seidel B = L + D.", "7.1"],
    ["cg", `Φ(${mi("x")}) = ${frac("1", "2")}${tp(mi("x"))}${mi("Ax")} − ${tp(mi("x"))}${mi("b")}, α<sub>k</sub> = ${frac("⟨r<sub>k</sub>, r<sub>k</sub>⟩", "⟨d<sub>k</sub>, d<sub>k</sub>⟩<sub>A</sub>")}, β<sub>k</sub> = ${frac("⟨r<sub>k+1</sub>, r<sub>k+1</sub>⟩", "⟨r<sub>k</sub>, r<sub>k</sub>⟩")}`, "", "7.2"],
    ["cg-Fehler", `${nrm("x* − x<sub>k</sub>", "A")} ≤ 2(${frac("√κ − 1", "√κ + 1")})<sup>k</sup> ${nrm("x* − x<sub>0</sub>", "A")}`, "κ = cond₂(A).", "7.2"],
  ]],
];

// Operation counts (1 Operation = 1 Multiplikation + 1 Addition), only the leading term.
const NUMA_COST = [
  ["Vorwärts- / Rückwärtssubstitution", "N²/2", "2.1"],
  ["Matrix-Vektor-Produkt (voll)", "N²", "2.1"],
  ["LR-Zerlegung", "N³/3", "2.1"],
  ["Cholesky-Zerlegung", "N³/6", "2.2"],
  ["QR-Zerlegung (Householder), A ∈ ℝ^{M×N}", "MN² − N³/3 (M = N: 2N³/3)", "2.3"],
  ["Qy mit Householder-Vektor w", "2N (y − 2(wᵀy)w)", "2.3"],
  ["AᵀA berechnen", "MN²/2 (symmetrisch)", "2.5"],
  ["Normalengleichung (AᵀA + Cholesky)", "MN²/2 + N³/6", "2.5"],
  ["Dividierte Differenzen", "N(N + 1) Additionen, N(N + 1)/2 Divisionen", "4.2"],
  ["Spline-LGS (tridiagonal)", "O(N)", "4.4"],
  ["Hessenbergform", "5N³/3 (symmetrisch tridiagonal: 2N³/3)", "6.3"],
  ["ein QR-Schritt auf Hessenbergform", "O(N²) (symmetrisch: O(N))", "6.3"],
  ["ein cg-Schritt", "eine Matrix-Vektor-Multiplikation Adₖ (dünn: O(Nicht-Nullen))", "7.2"],
];

// [Begriff, Bedeutung, Abschnitt]
const NUMA_TERMS = [
  ["Auslöschung", "Bei x ≈ −y fallen die führenden Stellen weg; übrig bleiben Rundungsfehler. Schlecht konditioniert, nicht instabil.", "1.2"],
  ["Kondition", "Wie stark Fehler in den Daten das Ergebnis ändern — eine Eigenschaft des Problems.", "1.3"],
  ["Stabilität", "Ein Verfahren verstärkt Fehler nur moderat im Vergleich zur Kondition — eine Eigenschaft des Algorithmus.", "1.3"],
  ["Maschinengenauigkeit", "eps = ½B^{1−Lm}: Schranke des relativen Rundungsfehlers.", "1.1"],
  ["Spaltenpivotwahl", "Vor jedem Schritt die Zeile mit dem betragsgrößten Element der Spalte nach oben tauschen.", "2.1"],
  ["Permutationsmatrix", "In jeder Zeile und Spalte genau eine 1; orthogonal: P⁻¹ = Pᵀ.", "2.1"],
  ["spd", "Symmetrisch (A = Aᵀ) und positiv definit (xᵀAx > 0 für x ≠ 0).", "2.2"],
  ["Householder-Transformation", "Q = I − 2wwᵀ, ‖w‖₂ = 1: Spiegelung an der Ebene mit Normale w.", "2.3"],
  ["zugehörige Matrixnorm", "‖A‖ = sup ‖Ax‖/‖x‖; die kleinste Zahl mit ‖Ax‖ ≤ ‖A‖‖x‖.", "2.4"],
  ["Spektralradius", "ρ(M) = max |λ| über die Eigenwerte von M.", "7.1"],
  ["Normalengleichung", "AᵀAx = Aᵀb; löst das Ausgleichsproblem, aber cond₂(AᵀA) = cond₂(A)².", "2.5"],
  ["Tikhonov-Regularisierung", "‖Ax − b‖² + α‖x‖² = min!: bessere Kondition, größerer Fehler.", "2.5"],
  ["Singulärwerte", "σₙ = √λₙ(AᵀA), der Größe nach geordnet.", "2.6"],
  ["Pseudoinverse", "A⁺ = VΣ⁺Uᵀ; x = A⁺b ist die Ausgleichslösung kleinster Norm.", "2.6"],
  ["quadratische Konvergenz", "‖x* − xₖ‖ ≤ C‖x* − xₖ₋₁‖²: die Zahl richtiger Stellen verdoppelt sich etwa.", "3.1"],
  ["Dämpfung", "xₖ₊₁ = xₖ + tₖdₖ mit tₖ ∈ (0, 1], damit ‖f‖ fällt; globaler, aber nur linear.", "3.2"],
  ["Lebesgue-Konstante", "Λ_N = max Σ|Lₙ(x)|: Kondition der Interpolation.", "4.1"],
  ["Runge-Phänomen", "Bei äquidistanten Stützstellen schwingt das Polynom hohen Grades am Rand auf.", "4.1"],
  ["Tschebyscheff-Stützstellen", "Nullstellen von T_{N+1}: minimieren max|w_{N+1}|, Λ_N ≈ (2/π) log N.", "4.3"],
  ["kubischer Spline", "C²-Funktion, auf jedem Teilintervall ein Polynom vom Grad ≤ 3.", "4.4"],
  ["eingespannt / natürlich / periodisch", "s′ am Rand vorgegeben / s″(a) = s″(b) = 0 / s′ und s″ an a und b gleich.", "4.4"],
  ["Ordnung einer QF", "Exakt für alle Polynome vom Grad ≤ p − 1, p maximal.", "5.2"],
  ["symmetrische QF", "cₖ = 1 − c_{s+1−k}, bₖ = b_{s+1−k}; Ordnung gerade.", "5.2"],
  ["monotone QF", "Alle Gewichte bₖ ≥ 0.", "5.1"],
  ["Peano-Kern", "K_p(t): Fehler = ∫ K_p(t) g^{(p)}(t) dt.", "5.4"],
  ["Hessenbergform", "Null unterhalb der ersten Nebendiagonale; bleibt im QR-Algorithmus erhalten.", "6.3"],
  ["Laplacematrix", "aₙₙ = Grad des Knotens, aₙₘ = −1 bei Kante: Grundlage der spektralen Bisektion.", "6.2"],
  ["Vorkonditionierer", "B ≈ A, so dass Bc = r leicht lösbar und cond(B⁻¹A) klein ist.", "7.1"],
  ["Energienorm", "‖x‖_A = √(xᵀAx) für spd A.", "7.2"],
  ["Fill-in", "Nullen von A werden in den Faktoren einer Zerlegung zu Nicht-Nullen.", "7.3"],
  ["CRS-Format", "Werte, Spaltenindizes und Zeilenzeiger: speichert nur die Nicht-Nullen.", "7.3"],
];

function renderNumaSheet() {
  $("#numa-sheet").innerHTML = `
    <div class="card hero">
      <h1>Formel<span class="accent">sammlung</span></h1>
      <p>Das ganze Skript auf einer Seite. Ein Klick auf die Abschnittsnummer führt zur Erklärung.</p>
      <input type="search" class="len-search pp-search" id="nmSheetSearch" placeholder="Formeln und Begriffe durchsuchen …" aria-label="Formelsammlung durchsuchen">
    </div>
    ${NUMA_SHEET.map(([group, rows]) => `
      <div class="card pp-sheet-group">
        <h2>${group}</h2>
        <div class="pp-sheet">
          ${rows.map(([what, f, note, sec]) => `
            <div class="pp-sheet-row">
              <div class="pp-sheet-what"><button type="button" class="len-num len-f-sec" data-sec="${sec}" title="Zum Abschnitt">${sec}</button><b>${what}</b>${note ? `<span class="small muted">${note}</span>` : ""}</div>
              <div class="lf small-f nm-sheet-f">${f}</div>
            </div>`).join("")}
        </div>
      </div>`).join("")}
    <div class="card pp-sheet-group">
      <h2>Aufwand</h2>
      <p class="small muted">Eine Operation = eine Multiplikation und eine Addition; nur der führende Term.</p>
      <table class="len-terms pp-cx">
        <thead><tr><th>Was</th><th>Operationen</th><th></th></tr></thead>
        <tbody class="pp-terms">${NUMA_COST.map(([w, n, sec]) => `<tr><td>${w}</td><td><b>${n}</b></td><td><button type="button" class="len-num len-f-sec pp-term-sec" data-sec="${sec}" title="Zum Abschnitt">${sec}</button></td></tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="card pp-sheet-group">
      <h2>Begriffe</h2>
      <table class="len-terms pp-terms">
        <tbody>${[...NUMA_TERMS].sort((a, b) => a[0].localeCompare(b[0], "de")).map(([t, m, sec]) =>
          `<tr><td><b>${t}</b></td><td>${m}</td><td><button type="button" class="len-num len-f-sec pp-term-sec" data-sec="${sec}" title="Zum Abschnitt">${sec}</button></td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  $$("#numa-sheet [data-sec]").forEach((b) => (b.onclick = () => openNumaSection(b.dataset.sec)));
  const search = $("#nmSheetSearch");
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    $$("#numa-sheet .pp-sheet-row, #numa-sheet .pp-terms tr").forEach((r) => (r.hidden = q && !r.textContent.toLowerCase().includes(q)));
    $$("#numa-sheet .pp-sheet-group").forEach((g) => (g.hidden = q && !$$(".pp-sheet-row:not([hidden]), .pp-terms tr:not([hidden])", g).length));
  };
}

/* ---------------------------------------------------------------- Setup */

function setupNuma() {
  NUMA_CHAPTERS.forEach(renderNumaChapter);
  renderNumaSheet();
}
