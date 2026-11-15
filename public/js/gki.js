// The GKI course (Grundlagen der Künstlichen Intelligenz, WS 26/27, Benjamin Schäfer and Gerhard
// Neumann). The lecture is still running: this is built from the first three lectures (VL 1–3), the
// second exercise sheet and the old exams from WS 22/23 to SS 26. Like the lecture, it is in German.
// When more lectures come, raise GKI_VL_DONE and add their chapters to GKI_CHAPTERS (a new file
// gki-k4.js …, a tab and a panel in index.html): the old exams, the tasks and the mock exam already
// cover the whole lecture and mark what hasn't been taught yet.
//
// This file has what every GKI page uses: the lecture plan, progress and the check at the end of
// each section, the chapter pages, Home, the Formelsammlung tab and the card on the course picker.
// The chapters are in gki-k1.js, gki-k2.js and gki-k3.js; the old exams in gki-exams.js, the exam
// tasks in gki-tasks.js, Practice and the mock exam in gki-mock.js.
//
// It reuses NuMa's formulas and plots (tx, nmD, nmQ, nmFrame, KaTeX's $…$ via nmTypeset), LEN's
// page parts (len-sec, len-index, len-toc, checks) and ProPa's drawing helpers (pw, pbtn, pseg,
// pslider, ppW, ppFacts), which load before this file.
//
// Colours mean the same everywhere: green is the truth (the target y, the true class), blue the
// model's prediction, red an error or a loss, gold a gradient or what happens now; class 1 is violet
// (filled dot), class 0 orange (hollow square).

const GKI_CHAPTERS = [];
// Lectures given so far. Topics of later lectures are marked "kommt in VL …".
const GKI_VL_DONE = 3;

// The semester plan from VL 1: [VL, date, topic, lecturer].
const GKI_PLAN = [
  [1, "26.10.", "Geschichte, Erfolge und Komplexität · KI-Methoden und Systeme", "BS"],
  [2, "02.11.", "Lineare Algebra, Regression · Statistik, Maximum Likelihood", "GN"],
  [3, "09.11.", "Klassifikation und Bewertung · Logistische Regression, Gradientenabstieg", "BS"],
  [4, "16.11.", "Neuronale Netze I · Aufbau, Forward Pass, Kettenregel", "BS"],
  [5, "23.11.", "Neuronale Netze II · Backpropagation und Optimierer", "BS"],
  [6, "30.11.", "Generalisierung, Modellauswahl · Double Descent, Ensembles", "BS"],
  [7, "07.12.", "Unüberwachtes Lernen · PCA, (V)AE-Einordnung, k-Means", "GN"],
  [8, "14.12.", "Dichteschätzung, GMM und EM · Latente Variablen, VAE-Vertiefung", "GN"],
  [9, "21.12.", "Convolutions und CNNs · Anwendung: Computer Vision", "BS"],
  [10, "11.01.", "RNNs, Encoder/Decoder, NLP · Attention, Transformer und LLMs", "BS"],
  [11, "18.01.", "Markov Decision Processes · Bekanntes Modell: planen", "GN"],
  [12, "25.01.", "Reinforcement Learning · Anwendung: Robotik", "GN"],
  [13, "01.02.", "Graphische Modelle, Bayes/Kalman · HMMs, Filtern und Viterbi", "GN"],
  [14, "08.02.", "Suche, Reasoning und Planung · Symbolische und logikbasierte KI", "BS"],
  [15, "15.02.", "Allgemeine Fragen · Verbindungen und Wiederholung", "BS + GN"],
];
const GKI_EXAM_DATE = "08.03.2027";

/* ---------------------------------------------------------------- Small helpers */

const gkSig = (z) => 1 / (1 + Math.exp(-z));
// A number for $…$: decimal comma, real minus.
const gt = (x, d = 3) => nmD(x, d).replace("−", "-").replace(",", "{,}");
// A dot in a drawing for class 1 (filled circle) or class 0 (hollow square).
const gkDot = (x, y, c, extra = "") => c
  ? `<circle cx="${x}" cy="${y}" r="5.5" class="gk-c1 ${extra}"/>`
  : `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" class="gk-c0 ${extra}"/>`;
// The point of a pointer event in an SVG's own coordinates.
function gkSvgPt(svg, e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX; p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}
// Least squares min ‖Φw − y‖² + λ‖Rw‖² by Householder QR of the stacked system (NuMa's nmQR).
function gkLstsq(Phi, y, lam = 0, skipFirst = true) {
  const n = Phi[0].length;
  const A = Phi.map((r) => [...r]), b = [...y];
  if (lam > 0) for (let j = 0; j < n; j++) { if (skipFirst && j === 0) continue; A.push(Array.from({ length: n }, (_, k) => (k === j ? Math.sqrt(lam) : 0))); b.push(0); }
  const { Q, R } = nmQR(A);
  const qb = nmT(Q).map((r) => nmDot(r, b));
  const w = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) w[i] = (qb[i] - R[i].slice(i + 1, n).reduce((s, a, j) => s + a * w[i + 1 + j], 0)) / R[i][i];
  return w;
}
// A seeded random generator, so the noisy data of a drawing are the same every visit.
function gkRng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
const gkGauss = (rnd) => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());

/* ---------------------------------------------------------------- Progress */

const gkPassMark = (n) => n - 1;
const gkBest = (sec) => store.get("gkiChecks", {})[sec.id];
const gkPassed = (sec) => (gkBest(sec) ?? -1) >= gkPassMark(sec.check.length);
const gkSections = () => GKI_CHAPTERS.flatMap((ch) => ch.sections);
const gkNextSection = () => gkSections().find((s) => !gkPassed(s)) || gkSections()[0];
const gkSecId = (id) => "gkSec-" + id.replace(/\./g, "-");
const gkChapterOf = (id) => GKI_CHAPTERS.find((ch) => ch.sections.some((s) => s.id === id));
const gkTab = (ch) => "gki-k" + ch.n;

function gkScrollTo(id) {
  const el = $("#" + gkSecId(id));
  if (!el) return;
  const index = $(`#${gkTab(gkChapterOf(id))} .len-index`);
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - barHeight() - (index ? index.offsetHeight : 0) - 8 });
}
function openGkiSection(id) {
  const ch = gkChapterOf(id);
  if (!ch) return;
  showTab(gkTab(ch));
  gkScrollTo(id);
}
// A link to another section, inside the text.
const gkSee = (id, label = `Abschnitt ${id}`) => `<button type="button" class="nm-see" data-sec="${id}">${label}</button>`;

/* ---------------------------------------------------------------- Section checks */

// The check at the end of a section: { q, opts: [...] (the first is right), why }, all HTML.
function renderGkiCheck(box, sec) {
  const n = sec.check.length;
  const best = gkBest(sec);
  box.innerHTML = `
    <div class="card-head">
      <h3>Kurztest · ${sec.id}</h3>
      ${gkPassed(sec) ? `<span class="pill good">✓ geschafft</span>` : ""}
    </div>
    <p class="small muted">${n} Fragen. Mit ${gkPassMark(n)} richtigen ist der Abschnitt geschafft.${best === undefined ? "" : ` Bisher am besten: ${best} / ${n}.`}</p>
    <button class="btn primary" type="button">${best === undefined ? "Kurztest starten" : "Noch einmal"}</button>`;
  $("button", box).onclick = () => runGkiCheck(box, sec);
}

function runGkiCheck(box, sec) {
  track("gki.check");
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
    track("gki.checkDone");
    const all = store.get("gkiChecks", {});
    if (score > (all[sec.id] ?? -1)) store.set("gkiChecks", { ...all, [sec.id]: score });
    const passed = score >= gkPassMark(qs.length);
    renderGkiCheck(box, sec);
    box.insertAdjacentHTML("afterbegin", `<p class="len-result ${passed ? "ok" : "bad"}">${score} / ${qs.length} — ${passed
      ? "Abschnitt geschafft!" : "Schau dir den Abschnitt noch einmal an und versuch es wieder."}</p>`);
    gkUpdateIndex(gkChapterOf(sec.id));
  };
  ask();
}

/* ---------------------------------------------------------------- Chapter pages */

// The questions the slides leave to think about ("Selbsttest", "Kurzcheck"), with an answer to open.
const gkSelf = (items) => `<div class="card gk-self"><h3>Zum Nachdenken — aus den Folien</h3>${items.map(([q, a]) =>
  `<details class="len-aside"><summary>${q}</summary><div>${a}</div></details>`).join("")}</div>`;

function renderGkiChapter(ch) {
  const panel = $("#" + gkTab(ch));
  panel.innerHTML = `
    <div class="card hero">
      <span class="len-kicker">Kapitel ${ch.n} · ${ch.vl}</span>
      <h1>${ch.headline}</h1>
      <p>${ch.intro}</p>
    </div>
    <nav class="len-index" aria-label="Abschnitte"></nav>
    ${ch.sections.map((s) => `
      <section class="len-sec" id="${gkSecId(s.id)}">
        <div class="len-sec-head"><span class="len-num">${s.id}</span><h2>${s.title}</h2></div>
        ${s.html()}
        <div class="card len-check" data-check="${s.id}"></div>
      </section>`).join("")}
    ${ch.next ? `<div class="pp-next"><button class="btn primary" type="button" data-go="gki-k${ch.n + 1}">Weiter: Kapitel ${ch.n + 1} · ${ch.next} →</button></div>`
      : `<div class="pp-next"><button class="btn primary" type="button" data-go="gki-practice">Weiter: Übungsaufgaben →</button></div>`}`;
  ch.sections.forEach((s) => {
    s.setup?.($("#" + gkSecId(s.id)));
    renderGkiCheck($(`[data-check="${s.id}"]`, panel), s);
  });
  $$("[data-go]", panel).forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
  $$("[data-sec]", panel).forEach((b) => (b.onclick = () => openGkiSection(b.dataset.sec)));
  gkUpdateIndex(ch);
}

function gkUpdateIndex(ch) {
  const ix = $(`#${gkTab(ch)} .len-index`);
  if (!ix) return;
  ix.innerHTML = ch.sections.map((s) => `
    <button type="button" class="len-ix ${gkPassed(s) ? "done" : ""}" data-ix="${s.id}">
      <span class="len-num">${s.id}</span>${s.short}${gkPassed(s) ? ' <span class="len-ix-ok" aria-hidden="true">✓</span>' : ""}</button>`).join("");
  $$("button", ix).forEach((b) => (b.onclick = () => gkScrollTo(b.dataset.ix)));
}

/* ---------------------------------------------------------------- Home */

function renderGkiHome() {
  const next = gkNextSection();
  const allDone = gkSections().every(gkPassed);
  const solved = Object.values(store.get("gkiTaskSolved", {})).reduce((a, b) => a + b, 0);
  const mock = store.get("gkiMock", {});
  const tile = (go, icon, title, sub) => `<button class="home-tile" type="button" data-go="${go}"><span class="home-tile-ja len-tile-icon" aria-hidden="true">${icon}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`;
  const topicsOf = (vl) => GKI_EXAM_TOPIC_IDS.filter((t) => GKI_EXAM_TOPICS[t].vl.includes(vl));
  $("#gki-home").innerHTML = `
    <div class="card hero">
      <h1>Grundlagen der <span class="accent">KI</span></h1>
      <p>Die Vorlesung zum Wiederholen, Vorlesung für Vorlesung: jedes Thema kurz gesagt, die Formeln aus den Folien, Zeichnungen
        zum Ausprobieren — eine Gerade, die sich an Punkte anpasst, die man verschiebt, eine Schwelle, die Precision und Recall verschiebt,
        Gradientenabstieg Schritt für Schritt —, die typischen Fallen und ein Kurztest pro Abschnitt.</p>
      <p class="small">Die Vorlesung läuft noch: Bisher sind <b>VL 1–${GKI_VL_DONE}</b> da. Die Altklausuren, die Übungsaufgaben und die
        Probeklausur decken aber schon den ganzen Stoff ab; was noch nicht dran war, ist markiert. Klausur am <b>${GKI_EXAM_DATE}</b>, 90 Minuten.</p>
      <div class="home-actions">
        <button class="btn primary" type="button" id="gkGo">${allDone ? "Von vorn wiederholen" : `Weiter mit ${next.id}: ${next.title}`} →</button>
        <button class="btn" type="button" data-go="gki-practice">Übungsaufgaben</button>
        <button class="btn" type="button" data-go="gki-mock">Probeklausur</button>
        <button class="btn" type="button" data-go="gki-sheet">Formelsammlung</button>
      </div>
    </div>
    ${GKI_CHAPTERS.map(gkChapterCardHTML).join("")}
    <div class="card">
      <h2>Semesterplan</h2>
      <p class="small muted">Aus VL 1. Rechts: die Themen der Altklausuren, die zu der Vorlesung gehören.</p>
      <div class="gk-plan">
        ${GKI_PLAN.map(([n, d, t, who]) => {
          const ch = GKI_CHAPTERS.find((c) => c.lectures.includes(n));
          return `<div class="gk-plan-row ${n <= GKI_VL_DONE ? "done" : ""}">
            <span class="len-num">${n}</span><span class="small muted">${d}</span>
            <span>${ch ? `<button type="button" class="nm-see" data-go="${gkTab(ch)}">${t}</button>` : t}</span>
            <span class="nm-pills">${topicsOf(n).map((tp) => gkTopicPill(tp)).join("")}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
    <div class="card">
      <h2>Klausur</h2>
      <div class="home-tiles">
        ${tile("gki-practice", "✎", "Übungsaufgaben", `${GKI_TASKS.length} Aufgaben wie in den Altklausuren · ${solved}× ganz richtig`)}
        ${tile("gki-mock", "⏱", "Probeklausur", mock.best !== undefined ? `Bestes Ergebnis: ${mock.best} %` : "Sechs Aufgaben, 75 Punkte, 90 Minuten")}
        ${tile("gki-exams", "📄", "Altklausuren", `${GKI_EXAMS.length} Klausuren · ${store.get("gkiExamDone", []).length} / ${GKI_EXAMS.flatMap((e) => e.tasks).length} Aufgaben erledigt`)}
        ${tile("gki-sheet", "Σ", "Formelsammlung", "Formeln und Begriffe auf einen Blick")}
      </div>
    </div>
    <div class="card">
      <h2>Farben</h2>
      <p class="small muted">Auf allen Seiten dasselbe, in Formeln und Zeichnungen.</p>
      <div class="len-legend">
        ${[["nm-exact", "y", "Wahrheit: Zielwert, wahre Klasse"], ["nm-approx", "ŷ", "Vorhersage des Modells"], ["nm-err", "e", "Fehler, Residuum, Loss"],
          ["nm-piv", "∇", "Gradient, Schritt, was gerade passiert"], ["gk-c1-t", "●", "Klasse 1 (positiv)"], ["gk-c0-t", "□", "Klasse 0 (negativ)"]]
          .map(([c, m, t]) => `<span class="len-swatch"><b class="${c}">${m}</b>${t}</span>`).join("")}
      </div>
    </div>`;
  $("#gkGo").onclick = () => { track("gki.continue"); openGkiSection(next.id); };
  $$("#gki-home [data-sec]").forEach((b) => (b.onclick = () => openGkiSection(b.dataset.sec)));
  $$("#gki-home [data-go]").forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
}

function gkChapterCardHTML(ch) {
  const done = ch.sections.filter(gkPassed).length;
  return `
    <div class="card">
      <div class="card-head">
        <h2>Kapitel ${ch.n} · ${ch.title}</h2>
        <span class="small muted">${ch.vl} · <b>${done}</b> / ${ch.sections.length} Abschnitte</span>
      </div>
      <span class="lmastery-bar course-bar len-bar"><span style="width:${(done / ch.sections.length) * 100}%"></span></span>
      <div class="len-toc">
        ${ch.sections.map((s) => `
          <button class="len-toc-tile ${gkPassed(s) ? "done" : ""}" type="button" data-sec="${s.id}">
            <span class="len-num">${s.id}</span>
            <span><b>${s.title}</b><span class="small muted">${s.about}</span></span>
            <span class="len-toc-state" aria-hidden="true">${gkPassed(s) ? "✓" : ""}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

// The course picker's card for GKI.
function gkiCourseCardHTML(c) {
  const secs = gkSections();
  const done = secs.filter(gkPassed).length;
  const next = gkNextSection();
  return `
    <div class="course-card" style="--cc:${c.color}">
      <span class="course-mark short len-mark" aria-hidden="true">${c.mark}</span>
      <div class="course-body">
        <h2 lang="de">${c.name}</h2>
        <p class="muted" lang="de">Regression, Wahrscheinlichkeit und Maximum Likelihood, Klassifikation und Gradientenabstieg — mit Zeichnungen
          zum Ausprobieren und Aufgaben wie in den Altklausuren. Die Vorlesung läuft noch: VL 1–${GKI_VL_DONE} sind da.</p>
      </div>
      <div class="course-side">
        <div class="course-stats small">
          <span><b>${done}</b> / ${secs.length} Abschnitte</span>
          <span>${GKI_CHAPTERS.length} Kapitel · ${GKI_EXAMS.length} Altklausuren</span>
        </div>
        <span class="lmastery-bar course-bar"><span style="width:${(done / secs.length) * 100}%"></span></span>
        <div class="home-actions">
          <button class="btn primary" data-course="${c.id}">Kurs öffnen →</button>
          <button class="btn" id="gkCourseGo" data-sec="${next.id}">Weiter mit ${next.id}</button>
        </div>
      </div>
    </div>`;
}

function wireGkiCourseCard() {
  const go = $("#gkCourseGo");
  if (go) go.onclick = () => { track("courses.gkiContinue"); openGkiSection(go.dataset.sec); };
}

/* ---------------------------------------------------------------- Formelsammlung */

// [group, [[what, formula (TeX), note, section]]]
const GKI_SHEET = [
  ["Lineare Regression", [
    ["Modell mit Bias-Trick", `\\hat y_i = b + w^\\top x_i = \\tilde w^\\top \\tilde x_i,\\quad \\tilde x_i = \\begin{pmatrix}1\\\\x_i\\end{pmatrix},\\ \\tilde w = \\begin{pmatrix}b\\\\w\\end{pmatrix}`, "$\\tilde X \\in \\R^{N\\times(D+1)}$, erste Spalte Einsen.", "2.1"],
    ["Loss", `L(\\tilde w) = \\frac{1}{2N}\\sum_{i=1}^N\\big(y_i - \\tilde w^\\top\\tilde x_i\\big)^2 = \\frac{1}{2N}(y - \\tilde X\\tilde w)^\\top(y - \\tilde X\\tilde w)`, "SSE, MSE $= \\frac1N$SSE und $L = \\frac12$MSE haben denselben Minimierer.", "2.2"],
    ["Ableitungsregeln", `\\nabla_w\\, a^\\top w = a,\\qquad \\nabla_w\\, w^\\top A w = (A + A^\\top)w = 2Aw\\ \\text{(A symm.)}`, "", "2.2"],
    ["Normalgleichung", `\\tilde X^\\top\\tilde X\\,\\tilde w = \\tilde X^\\top y,\\qquad \\tilde w^\\star = (\\tilde X^\\top\\tilde X)^{-1}\\tilde X^\\top y`, "Eindeutig bei vollem Spaltenrang von $\\tilde X$.", "2.2"],
    ["Bestimmtheitsmaß", `R^2 = 1 - \\frac{\\sum_i (y_i - \\hat y_i)^2}{\\sum_i (y_i - \\bar y)^2} = 1 - \\frac{\\text{SSE}_{\\text{Modell}}}{\\text{SSE}_{\\text{Mittelwert}}}`, "Auf Testdaten auch negativ möglich.", "2.3"],
    ["Basisfunktionen", `\\hat y(x) = \\sum_{j=0}^M w_j\\,\\phi_j(x) = w^\\top\\phi(x),\\qquad w^\\star = (\\Phi^\\top\\Phi)^{-1}\\Phi^\\top y`, "Nichtlinear in $x$, linear in $w$. $\\phi_0 = 1$ ist der Bias.", "2.4"],
    ["Gauß-Basis, Sigmoid-Basis", `\\phi_j(x) = \\exp\\!\\Big(-\\frac{(x - \\mu_j)^2}{2s^2}\\Big),\\qquad \\phi_j(x) = \\sigma\\Big(\\frac{x - \\mu_j}{s}\\Big)`, "$\\mu_j$ und $s$ werden vorher festgelegt.", "2.4"],
    ["Ridge", `L_\\lambda(\\tilde w) = \\frac{1}{2N}\\|y - \\tilde X\\tilde w\\|^2 + \\frac\\lambda2\\tilde w^\\top R\\,\\tilde w,\\quad R = \\diag(0, 1, \\dots, 1)`, "", "2.5"],
    ["Ridge-Lösung", `\\tilde w^\\star_{\\text{ridge}} = (\\tilde X^\\top\\tilde X + N\\lambda R)^{-1}\\tilde X^\\top y`, "Für $\\lambda > 0$ immer invertierbar.", "2.5"],
  ]],
  ["Wahrscheinlichkeit", [
    ["Marginalisieren", `p(x) = \\sum_y p(x, y)`, "Die Ränder der Tabelle.", "2.6"],
    ["Produktregel", `p(x, y) = p(y \\mid x)\\,p(x) = p(x \\mid y)\\,p(y)`, "Konditionieren: auf eine Zeile einschränken und neu normieren.", "2.6"],
    ["Satz von Bayes", `p(x \\mid y) = \\frac{p(y \\mid x)\\,p(x)}{p(y)},\\qquad p(y) = \\sum_{x'} p(y \\mid x')\\,p(x')`, "Posterior = Likelihood · Prior / Evidenz.", "2.6"],
    ["i.i.d.", `p(x_1, \\dots, x_N) = \\prod_{i=1}^N p(x_i)`, "", "2.6"],
    ["Erwartungswert, Varianz", `\\mathbb E[x] = \\sum_x x\\,p(x),\\qquad \\mathrm{Var}[x] = \\mathbb E\\big[(x - \\mathbb E[x])^2\\big]`, "Fairer Würfel: $3{,}5$ und $\\frac{35}{12}$.", "2.7"],
    ["Monte Carlo", `\\mathbb E[f(x)] \\approx \\frac1M\\sum_{m=1}^M f(x_m),\\quad x_m \\sim p`, "Fehler sinkt wie $1/\\sqrt M$.", "2.7"],
    ["Gauß-Dichte", `\\mathcal N(x \\mid \\mu, \\sigma^2) = \\frac{1}{\\sqrt{2\\pi\\sigma^2}}\\exp\\!\\Big(-\\frac{(x - \\mu)^2}{2\\sigma^2}\\Big)`, "Eine Dichte darf größer als 1 sein.", "2.7"],
  ]],
  ["Maximum Likelihood", [
    ["Likelihood", `\\mathrm{Lik}(\\theta) = \\prod_{i=1}^N p_\\theta(y_i \\mid x_i),\\qquad \\log\\mathrm{Lik}(\\theta) = \\sum_{i=1}^N \\log p_\\theta(y_i \\mid x_i)`, "Wir minimieren die negative Log-Likelihood.", "2.8"],
    ["Münze", `\\mathrm{Lik}(\\pi) = \\pi^k(1 - \\pi)^{N-k},\\qquad \\hat\\pi = \\frac kN`, "Drei Würfe, dreimal Kopf: $\\hat\\pi = 1$.", "2.8"],
    ["Gauß-MLE", `\\hat\\mu = \\frac1N\\sum_i x_i,\\qquad \\hat\\sigma^2 = \\frac1N\\sum_i (x_i - \\hat\\mu)^2`, "Nicht die unverzerrte Stichprobenvarianz ($\\frac{1}{N-1}$).", "2.8"],
    ["Lineares Gauß-Modell", `-\\log\\mathrm{Lik}(\\tilde w) = \\frac N2\\log(2\\pi\\sigma^2) + \\frac{1}{2\\sigma^2}\\sum_i(y_i - \\tilde w^\\top\\tilde x_i)^2 = c + \\frac{N}{\\sigma^2}L(\\tilde w)`, "Gleicher Minimierer wie die kleinsten Quadrate.", "2.8"],
  ]],
  ["Klassifikation bewerten", [
    ["Precision, Recall", `\\text{Precision} = \\frac{TP}{TP + FP},\\qquad \\text{Recall} = \\text{TPR} = \\frac{TP}{TP + FN}`, "", "3.1"],
    ["F₁, Accuracy", `F_1 = \\frac{2TP}{2TP + FP + FN},\\qquad \\text{Accuracy} = \\frac{TP + TN}{TP + TN + FP + FN}`, "", "3.1"],
    ["FPR", `\\text{FPR} = \\frac{FP}{FP + TN}`, "ROC: TPR über FPR, ein Punkt pro Schwelle. AUC: Anteil richtig geordneter Positiv-Negativ-Paare.", "3.2"],
    ["Precision aus Prävalenz", `\\text{Precision} = \\frac{\\text{TPR}\\cdot\\pi}{\\text{TPR}\\cdot\\pi + \\text{FPR}\\cdot(1 - \\pi)}`, "$\\pi = P(Y = 1)$.", "3.2"],
  ]],
  ["Logistische Regression", [
    ["Score und Entscheidung", `z = w^\\top x + b,\\qquad \\hat y = 1 \\iff z \\ge 0 \\iff p \\ge 0{,}5`, "Grenze $z = 0$: eine Hyperebene, $w$ steht senkrecht auf ihr.", "3.3"],
    ["0-1-Loss", `L_{01} = \\frac1N\\sum_i \\mathbb 1[\\hat y_i \\ne y_i] = 1 - \\text{Accuracy}`, "Stückweise konstant: kein Gradient.", "3.3"],
    ["Sigmoid", `\\sigma(z) = \\frac{1}{1 + e^{-z}},\\quad \\sigma(-z) = 1 - \\sigma(z),\\quad \\sigma'(z) = \\sigma(z)(1 - \\sigma(z))`, "", "3.4"],
    ["Bernoulli", `p(y) = p^y(1 - p)^{1-y},\\quad y \\in \\{0, 1\\}`, "", "3.4"],
    ["Log-Odds", `\\ln\\frac{p}{1 - p} = z`, "Linear in $x$.", "3.4"],
    ["Binäre Kreuzentropie", `l_i = -y_i\\ln p_i - (1 - y_i)\\ln(1 - p_i),\\qquad L = \\frac1N\\sum_i l_i`, "$p = 0{,}8$: $l(1) \\approx 0{,}22$, $l(0) \\approx 1{,}61$.", "3.4"],
    ["Gradient", `\\nabla_{\\tilde w}\\, l_i = (p_i - y_i)\\,\\tilde x_i,\\qquad \\nabla L = \\frac1N\\tilde X^\\top(p - y)`, "Struktur wie in VL 2: $\\tilde X^\\top$(Vorhersage − Ziel).", "3.5"],
  ]],
  ["Optimierung", [
    ["Gradientenabstieg", `\\tilde w_{t+1} = \\tilde w_t - \\eta\\,\\nabla L(\\tilde w_t),\\quad \\eta > 0`, "$\\eta$: Lernrate.", "3.5"],
    ["Updates pro Epoche", `\\text{Batch: } 1,\\qquad \\text{Mini-Batch: } \\lceil N/B\\rceil,\\qquad \\text{SGD: } N`, "", "3.5"],
  ]],
  ["Mehrere Klassen", [
    ["Softmax", `p_k = \\frac{\\exp(a_k)}{\\sum_{j=1}^K \\exp(a_j)},\\qquad a_k = w_k^\\top x + b_k`, "Für $K = 2$: $p_1 = \\sigma(a_1 - a_2)$.", "3.6"],
    ["Kreuzentropie", `l_i = -\\sum_{k=1}^K y_{i,k}\\ln p_{i,k} = -\\ln p_{i,\\text{wahr}},\\qquad \\frac{\\partial l_i}{\\partial a_{i,k}} = p_{i,k} - y_{i,k}`, "One-hot-Ziel $y_i$.", "3.6"],
  ]],
];
const GKI_TERMS = [
  ["Agent", "nimmt Beobachtungen $o$ wahr und wählt Aktionen $a$; ein Leistungsmaß sagt, was gutes Verhalten ist.", "1.3"],
  ["Rational handeln", "die Sicht der Vorlesung unter den vier Perspektiven: geeignete Aktionen wählen.", "1.3"],
  ["Maschinelles Lernen", "ein System lernt aus Beispielen und verallgemeinert auf neue Fälle.", "1.3"],
  ["Deep Learning", "ML mit mehrschichtigen neuronalen Netzen.", "1.3"],
  ["Foundation Model", "ein Basismodell, auf vielen Daten trainiert, für viele Aufgaben angepasst (Fine-Tuning).", "1.3"],
  ["Überwacht", "Eingabe $x$ mit Label $y$.", "1.4"],
  ["Unüberwacht", "nur Punkte $x$: Struktur finden.", "1.4"],
  ["Selbstüberwacht", "das Ziel kommt aus den Daten selbst (nächstes Token).", "1.4"],
  ["Verstärkend (RL)", "Aktion, Erfahrung und Belohnung $r$.", "1.4"],
  ["EU AI Act", "Pflichten nach dem Einsatz: verboten, Hochrisiko, Transparenzpflichten, gering.", "1.1"],
  ["KI-Winter", "1974–80 und 1987–93: Erwartungen trafen auf Grenzen.", "1.2"],
  ["Moravec-Paradox", "Schach und Rechnen sind für Maschinen leicht, Wahrnehmen und Handeln schwer.", "1.2"],
  ["Residuum", "$e_i = y_i - \\hat y_i$, der vertikale Fehler.", "2.2"],
  ["Voller Spaltenrang", "keine Spalte ist Linearkombination der anderen; dann ist $\\tilde X^\\top\\tilde X$ invertierbar.", "2.1"],
  ["Überanpassung (Overfitting)", "kleiner Trainingsfehler, großer Validierungsfehler; die Gewichte explodieren.", "2.4"],
  ["Hyperparameter", "Konfigurationsgröße, die nicht durch das Training gelernt wird (Grad $M$, $\\lambda$, Schwelle $\\tau$, Lernrate $\\eta$).", "2.4"],
  ["Training / Validierung / Test", "Parameter lernen / Hyperparameter wählen / finale Leistung schätzen — nicht wiederholt.", "2.4"],
  ["Weight decay", "L2-Regularisierung bei neuronalen Netzen, in der Statistik Ridge.", "2.5"],
  ["Prior, Posterior", "$p(x)$ vor, $p(x \\mid y)$ nach der Beobachtung $y$.", "2.6"],
  ["Likelihood", "$\\mathrm{Lik}(\\theta)$: die Daten stehen fest, die Parameter werden variiert.", "2.8"],
  ["Konfusionsmatrix", "Zeilen = Wahrheit, Spalten = Vorhersage: TP, FN, FP, TN.", "3.1"],
  ["Prävalenz", "$\\pi = P(Y = 1)$, Anteil positiver Fälle.", "3.2"],
  ["Generativ / diskriminativ", "$p(x \\mid y)$ und $p(y)$ lernen / direkt $p(y \\mid x)$.", "3.3"],
  ["Linear separierbar", "eine Hyperebene trennt alle Beispiele nach ihren Labels — eine Eigenschaft der Daten (und Merkmale).", "3.3"],
  ["Logistische Regression", "linearer Score + Sigmoid + Bernoulli-Labels.", "3.4"],
  ["Epoche", "einmal alle Trainingsbeispiele durchlaufen.", "3.5"],
  ["Logits", "der reelle Scorevektor $a$ vor der Softmax.", "3.6"],
  ["One-hot", "Vektor mit einer 1 an der wahren Klasse, sonst 0.", "3.6"],
];

function renderGkiSheet() {
  $("#gki-sheet").innerHTML = `
    <div class="card hero">
      <h1>Formel<span class="accent">sammlung</span></h1>
      <p>Die Formeln aus VL 1–${GKI_VL_DONE} auf einer Seite. Ein Klick auf die Abschnittsnummer führt zur Erklärung. In der Klausur sind keine Hilfsmittel erlaubt — das hier ist zum Lernen.</p>
      <input type="search" class="len-search pp-search" id="gkSheetSearch" placeholder="Formeln und Begriffe durchsuchen …" aria-label="Formelsammlung durchsuchen">
    </div>
    ${GKI_SHEET.map(([group, rows]) => `
      <div class="card pp-sheet-group">
        <h2>${group}</h2>
        <div class="pp-sheet">
          ${rows.map(([what, f, note, sec]) => `
            <div class="pp-sheet-row">
              <div class="pp-sheet-what"><button type="button" class="len-num len-f-sec" data-sec="${sec}" title="Zum Abschnitt">${sec}</button><b>${what}</b>${note ? `<span class="small muted">${note}</span>` : ""}</div>
              <div class="nm-sheet-f">$$${f}$$</div>
            </div>`).join("")}
        </div>
      </div>`).join("")}
    <div class="card pp-sheet-group">
      <h2>Begriffe</h2>
      <table class="len-terms pp-terms">
        <tbody>${[...GKI_TERMS].sort((a, b) => a[0].localeCompare(b[0], "de")).map(([t, m, sec]) =>
          `<tr><td><b>${t}</b></td><td>${m}</td><td><button type="button" class="len-num len-f-sec pp-term-sec" data-sec="${sec}" title="Zum Abschnitt">${sec}</button></td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  $$("#gki-sheet [data-sec]").forEach((b) => (b.onclick = () => openGkiSection(b.dataset.sec)));
  const search = $("#gkSheetSearch");
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    $$("#gki-sheet .pp-sheet-row, #gki-sheet .pp-terms tr").forEach((r) => (r.hidden = q && !r.textContent.toLowerCase().includes(q)));
    $$("#gki-sheet .pp-sheet-group").forEach((g) => (g.hidden = q && !$$(".pp-sheet-row:not([hidden]), .pp-terms tr:not([hidden])", g).length));
  };
}

/* ---------------------------------------------------------------- Setup */

// KaTeX for every GKI panel, typeset again whenever its content changes (like NuMa's).
function setupGkiTex() {
  const mo = new MutationObserver((ms) => {
    const els = [...new Set(ms.map((m) => (m.target.nodeType === 1 ? m.target : m.target.parentElement)).filter(Boolean))];
    els.filter((e) => e.isConnected && !els.some((o) => o !== e && o.contains(e))).forEach(nmTypeset);
  });
  $$('.panel[id^="gki-"]').forEach((p) => { nmTypeset(p); mo.observe(p, { childList: true, subtree: true, characterData: true }); });
}

function setupGki() {
  Object.assign(NM_TEX.macros, { "\\argmin": "\\operatorname*{arg\\,min}", "\\argmax": "\\operatorname*{arg\\,max}" });
  GKI_CHAPTERS.forEach(renderGkiChapter);
  renderGkiSheet();
  setupGkiTex();
}
