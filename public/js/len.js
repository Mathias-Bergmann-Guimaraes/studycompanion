// The LEN course (Lineare Elektrische Netze): its language switch, the helpers every LEN page uses
// (two-language text, formulas, drawings, sliders), its Home and Formulas tabs, its card on the
// course picker and the short check at the end of each section. The chapters themselves are in
// len-basics.js (chapter 1; later chapters get files of their own and join LEN_CHAPTERS).
//
// Every text is written in German and English. Both are in the page and CSS shows one
// (body.len-en), so switching never redraws a page and a drawing keeps whatever you did to it.
// Only what a drawing writes itself (numbers, which have a decimal comma in German, and verdicts)
// is redrawn on a switch: each drawing registers its draw function with lenWidget().

let lenLang = store.get("lenLang", "de") === "en" ? "en" : "de";

// Text in both languages. L() for HTML; lt() for what code writes itself (SVG text, attributes).
const L = (de, en = de) => `<span class="l-de" lang="de">${de}</span><span class="l-en">${en}</span>`;
const Lp = (pair) => L(pair[0], pair[1]);
const lt = (de, en = de) => (lenLang === "en" ? en : de);
// A technical term. In English the German word stays beside it, since lectures and exams are German.
const T = (de, en) => `<span class="l-de" lang="de"><b>${de}</b></span><span class="l-en"><b>${en}</b> <i class="de-term" lang="de">${de}</i></span>`;

// Numbers the way each language writes them: 1,5 in German, 1.5 in English, with a real minus.
function nfx(x, d, lang) {
  let s = Math.abs(x).toFixed(d);
  const neg = x < 0 && +s !== 0;
  if (lang === "de") s = s.replace(".", ",");
  return (neg ? "−" : "") + s;
}
const nf = (x, d = 1) => nfx(x, d, lenLang);
// A number in both languages at once, for text that isn't redrawn on a switch: nb() in HTML,
// nbt() inside SVG text. sig() picks the decimals for about three significant figures.
const sigDec = (x) => (x === 0 || !isFinite(x) ? 0 : clampDec(2 - Math.floor(Math.log10(Math.abs(x)))));
const clampDec = (d) => Math.min(6, Math.max(0, d));
// Without d: about three significant figures, and no trailing zeros (1 not 1,00; 2,5 not 2,50).
const nfAuto = (x, d, lang) => (d === undefined ? nfx(x, sigDec(x), lang).replace(/([.,]\d*?)0+$/, "$1").replace(/[.,]$/, "") : nfx(x, d, lang));
const nb = (x, d) => `<span class="l-de">${nfAuto(x, d, "de")}</span><span class="l-en">${nfAuto(x, d, "en")}</span>`;
const nbt = (x, d) => `<tspan class="l-de">${nfAuto(x, d, "de")}</tspan><tspan class="l-en">${nfAuto(x, d, "en")}</tspan>`;
const nfs = (x, d = 1) => (x > 0 && +Math.abs(x).toFixed(d) !== 0 ? "+" : "") + nf(x, d);

/* ---------------------------------------------------------------- Formulas */

// Formulas are typeset in HTML. The quantities keep the course's colours: current red, voltage
// blue, potential purple.
const sym = (s, cls = "", sub = "") => `<i class="mv ${cls}">${s}${sub !== "" ? `<sub>${sub}</sub>` : ""}</i>`;
const sI = (sub = "") => sym("I", "q-i", sub);
const sU = (sub = "") => sym("U", "q-u", sub);
const sP = (sub = "") => sym("φ", "q-phi", sub);
const frac = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
const unit = (u) => `<span class="mu">${u}</span>`;
const sumOf = (top, bottom) => `<span class="msum"><small>${top}</small><span>Σ</span><small>${bottom}</small></span>`;
const vec = (s) => `<span class="mvec">${s}</span>`;
// A formula on a line of its own.
const F = (html, cls = "") => `<div class="lf ${cls}">${html}</div>`;

/* ---------------------------------------------------------------- Drawings */

// Each drawing redraws itself when the language changes (numbers and words it writes).
const lenDraws = [];
function lenWidget(draw) {
  lenDraws.push(draw);
  draw();
  return draw;
}

// Runs step(dt) every frame, but only while `el` is on screen (a hidden tab counts as off screen).
function lenAnimate(el, step) {
  let on = false, last = 0, raf = 0;
  const frame = (t) => {
    const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
    last = t;
    step(dt);
    raf = requestAnimationFrame(frame);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf); }
  }).observe(el);
}
const lenCalm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

// An arrow from (x1,y1) to (x2,y2); its colour comes from `cls` (i = current, u = voltage …).
function arrowSVG(x1, y1, x2, y2, cls = "", w = 2.5, head = 10) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = x2 - head * Math.cos(a), hy = y2 - head * Math.sin(a);
  const px = Math.sin(a) * head * 0.5, py = -Math.cos(a) * head * 0.5;
  const r = (n) => Math.round(n * 10) / 10;
  return `<g class="arr ${cls}"><line x1="${r(x1)}" y1="${r(y1)}" x2="${r(hx)}" y2="${r(hy)}" stroke-width="${w}"/>` +
    `<polygon points="${r(x2)},${r(y2)} ${r(hx + px)},${r(hy + py)} ${r(hx - px)},${r(hy - py)}"/></g>`;
}

// A word in a drawing, in both languages (SVG can't hold the HTML spans).
const svgT = (x, y, de, en, attrs = "") =>
  `<text x="${x}" y="${y}" class="l-de" ${attrs}>${de}</text><text x="${x}" y="${y}" class="l-en" ${attrs}>${en}</text>`;

// A resistor (or another two-terminal box) on a straight wire from (x1,y1) to (x2,y2).
function resistorSVG(x1, y1, x2, y2, label = "", cls = "", len = 44, wid = 16) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const horiz = Math.abs(y2 - y1) < Math.abs(x2 - x1);
  const w = horiz ? len : wid, h = horiz ? wid : len;
  const lx = horiz ? mx : mx + 16, ly = horiz ? my - 14 : my + 4;
  return `<g class="${cls}"><line class="w" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>` +
    `<rect class="el" x="${mx - w / 2}" y="${my - h / 2}" width="${w}" height="${h}" rx="2"/>` +
    (label ? `<text x="${lx}" y="${ly}" class="lbl" text-anchor="${horiz ? "middle" : "start"}">${label}</text>` : "") + "</g>";
}

// Controls under a drawing. A slider: st[key] follows it, and the drawing writes its value.
const lenSlider = (key, de, en, min, max, step, value) => `
  <label class="lw-sl"><span class="lw-sl-name">${L(de, en)}</span>
    <input type="range" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
    <output data-o="${key}"></output></label>`;
// A row of buttons with one picked: st[key] becomes the picked button's value.
const lenSeg = (key, opts, active) => `
  <div class="seg lw-seg" data-seg="${key}">${opts.map(([v, de, en]) =>
    `<button type="button" data-v="${v}" class="${String(v) === String(active) ? "active" : ""}">${L(de, en)}</button>`).join("")}</div>`;

// Connects a drawing's sliders and button rows to its state, and redraws on every change.
function lenWire(root, st, draw) {
  $$("input[data-k]", root).forEach((inp) => {
    inp.oninput = () => { st[inp.dataset.k] = +inp.value; draw(); };
  });
  $$("[data-seg]", root).forEach((seg) => {
    $$("button", seg).forEach((b) => (b.onclick = () => {
      const v = b.dataset.v;
      st[seg.dataset.seg] = isNaN(+v) ? v : +v;
      lenSetSeg(seg, v);
      draw();
    }));
  });
}
const lenSetSeg = (seg, v) => $$("button", seg).forEach((b) => b.classList.toggle("active", b.dataset.v === String(v)));
// Writes a slider's value beside it, and fills its track up to the handle (--fill, style.css).
const lenOut = (root, key, html) => {
  const o = $(`[data-o="${key}"]`, root);
  if (o) o.innerHTML = html;
  const inp = $(`input[data-k="${key}"]`, root);
  if (inp) inp.style.setProperty("--fill", `${((inp.value - inp.min) / (inp.max - inp.min)) * 100}%`);
};

/* ---------------------------------------------------------------- Language */

function setLenLang(lang) {
  lenLang = lang;
  store.set("lenLang", lang);
  document.body.classList.toggle("len-en", lang === "en");
  $$("#lenLang button").forEach((b) => b.classList.toggle("active", b.dataset.lang === lang));
  lenDraws.forEach((d) => d());
}

function setupLen() {
  $$("#lenLang button").forEach((b) => (b.onclick = () => {
    if (b.dataset.lang === lenLang) return;
    track("setting.lenLang");
    setLenLang(b.dataset.lang);
  }));
  setLenLang(lenLang);
  renderLenBasics();
  renderLenFormulas();
  // The old exams' tooltips are attributes: redraw that page on a switch.
  lenDraws.push(() => $("#len-exams").innerHTML && renderLenExams());
}

/* ---------------------------------------------------------------- Progress */

// A section is done once its check is passed: all questions right but one.
const lenPassMark = (n) => n - 1;
const lenBest = (sec) => store.get("lenChecks", {})[sec.id];
const lenPassed = (sec) => (lenBest(sec) ?? -1) >= lenPassMark(sec.check.length);
const lenSections = () => LEN_CHAPTERS.flatMap((c) => c.sections);
const lenNextSection = () => lenSections().find((s) => !lenPassed(s)) || lenSections()[0];
const lenSecId = (id) => "lenSec-" + id.replace(/\./g, "-");

// Scrolls a section to just below the top bar and the sticky row of section buttons.
function lenScrollTo(id) {
  const el = $("#" + lenSecId(id));
  const index = $("#lenIndex");
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - barHeight() - (index ? index.offsetHeight : 0) - 8 });
}

function openLenSection(id) {
  showTab("len-basics");
  lenScrollTo(id);
}

/* ---------------------------------------------------------------- Section checks */

// The check at the end of a section: its questions one at a time, each answer explained.
// A question: { q: [de, en], opts: [[de, en], …] (the first is right), why: [de, en] }.
function renderLenCheck(box, sec) {
  const n = sec.check.length;
  const best = lenBest(sec);
  box.innerHTML = `
    <div class="card-head">
      <h3>${L("Kurzer Check", "Quick check")} · ${sec.id}</h3>
      ${lenPassed(sec) ? `<span class="pill good">✓ ${L("geschafft", "done")}</span>` : ""}
    </div>
    <p class="small muted">${L(`${n} Fragen. Mindestens ${lenPassMark(n)} richtig, dann ist der Abschnitt geschafft.`,
      `${n} questions. Get ${lenPassMark(n)} or more right to finish the section.`)}
      ${best === undefined ? "" : L(` Bisher bestes Ergebnis: ${best} / ${n}.`, ` Best so far: ${best} / ${n}.`)}</p>
    <button class="btn primary" type="button">${best === undefined ? L("Check starten", "Start the check") : L("Nochmal", "Try again")}</button>`;
  $("button", box).onclick = () => runLenCheck(box, sec);
}

function runLenCheck(box, sec) {
  track("len.check");
  const qs = shuffle(sec.check.map((q) => ({ ...q, opts: shuffle(q.opts.map((o, i) => ({ o, right: i === 0 }))) })));
  let i = 0, score = 0;
  const ask = () => {
    const q = qs[i];
    box.innerHTML = `
      <div class="card-head"><h3>${L("Kurzer Check", "Quick check")} · ${sec.id}</h3>
        <span class="muted small">${i + 1} / ${qs.length}</span></div>
      <p class="len-q">${Lp(q.q)}</p>
      <div class="q-opts wide">${q.opts.map((o, j) => `<button class="q-opt" type="button" data-j="${j}">${Lp(o.o)}</button>`).join("")}</div>
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
        <div class="verdict ${pick.right ? "ok" : "bad"}">${pick.right ? L("Richtig!", "Right!") : L("Nicht ganz.", "Not quite.")}</div>
        <p>${Lp(q.why)}</p>
        <div class="q-actions"><button class="btn primary" type="button">${last ? L("Ergebnis", "See result") : L("Weiter →", "Next →")}</button></div>`;
      $(".q-actions .btn", box).onclick = () => { i++; i < qs.length ? ask() : done(); };
      $(".q-actions .btn", box).focus({ preventScroll: true });
    }));
  };
  const done = () => {
    track("len.checkDone");
    const all = store.get("lenChecks", {});
    if (score > (all[sec.id] ?? -1)) store.set("lenChecks", { ...all, [sec.id]: score });
    const passed = score >= lenPassMark(qs.length);
    renderLenCheck(box, sec);
    box.insertAdjacentHTML("afterbegin", `<p class="len-result ${passed ? "ok" : "bad"}">${score} / ${qs.length} — ${passed
      ? L("Abschnitt geschafft!", "Section done!")
      : L("Lies dir den Abschnitt nochmal an und versuch es erneut.", "Have another look at the section and try again.")}</p>`);
    lenUpdateIndex();
  };
  ask();
}

/* ---------------------------------------------------------------- Home */

function renderLenHome() {
  const next = lenNextSection();
  const allDone = lenSections().every(lenPassed);
  $("#len-home").innerHTML = `
    <div class="card hero">
      <h1>${L(`Lineare Elektrische <span class="accent">Netze</span>`, `Linear Electrical <span class="accent">Networks</span>`)}</h1>
      <p>${L(
        "Die Vorlesung zum Nachschlagen und Ausprobieren: jede Skizze aus der Vorlesung als Zeichnung, an der du drehen kannst — Ströme fließen, Pfeile drehen sich um, Gleichungen rechnen mit.",
        "The lectures to look things up and try them out: every sketch from the lectures as a drawing you can play with — currents flow, arrows flip, equations work themselves out.")}</p>
      <p>${L("Oben links schaltest du zwischen <b>Deutsch</b> und <b>Englisch</b> um. Auf Englisch steht der deutsche Fachbegriff immer daneben, für die Klausur.",
        "Switch between <b>German</b> and <b>English</b> in the bar. In English the German term always stays beside the English one, for the exam.")}</p>
      <div class="home-actions">
        <button class="btn primary" type="button" id="lenGo">${allDone ? L("Kapitel 1 wiederholen", "Go over chapter 1") : L(`Weiter mit ${next.id}`, `Continue with ${next.id}`)}: ${Lp(next.title)} →</button>
        <button class="btn" type="button" id="lenFormulasGo">${L("Formeln &amp; Begriffe", "Formulas &amp; terms")}</button>
      </div>
    </div>
    ${LEN_CHAPTERS.map(lenChapterCardHTML).join("")}
    ${lenExamPrepHTML()}
    <div class="card">
      <h2>${L("Farbcode", "Colour code")}</h2>
      <p class="small muted">${L("Wie in der Vorlesung — und auf jeder LEN-Seite gleich.", "As in the lectures — and the same on every LEN page.")}</p>
      <div class="len-legend">
        ${[["q-i", "→", "Strom <i>I</i>", "current <i>I</i>"], ["q-u", "→", "Spannung <i>U</i>", "voltage <i>U</i>"],
          ["q-phi", "φ", "Potential <i>φ</i>", "potential <i>φ</i>"], ["q-pos", "+", "positive Ladung, Proton", "positive charge, proton"],
          ["q-neg", "−", "Elektron (negativ)", "electron (negative)"], ["q-hl", "▬", "hervorgehoben: Zweig, Masche", "highlighted: branch, mesh"]]
          .map(([c, m, de, en]) => `<span class="len-swatch"><b class="${c}">${m}</b>${L(de, en)}</span>`).join("")}
      </div>
    </div>
    <p class="small muted len-more">${L("Weitere Kapitel kommen dazu, sobald sie in der Vorlesung dran waren.", "More chapters are added as the lectures get to them.")}</p>`;
  $("#lenGo").onclick = () => { track("len.continue"); openLenSection(next.id); };
  $("#lenFormulasGo").onclick = () => { showTab("len-formulas"); window.scrollTo({ top: 0 }); };
  $$("#len-home [data-sec]").forEach((b) => (b.onclick = () => openLenSection(b.dataset.sec)));
  $$("#len-home [data-go]").forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
}

// Home's way into exam practice: old exams, generated tasks and the mock exam.
function lenExamPrepHTML() {
  const tasks = LEN_EXAMS.flatMap((e) => e.tasks).length;
  const done = store.get("lenExamDone", []).length;
  const solved = Object.values(store.get("lenSolved", {})).reduce((a, b) => a + b, 0);
  const mock = store.get("lenMock", {});
  const tile = (go, icon, de, en, sub) => `<button class="home-tile" type="button" data-go="${go}"><span class="home-tile-ja len-tile-icon" aria-hidden="true">${icon}</span><span><b>${L(de, en)}</b><span class="small muted">${sub}</span></span></button>`;
  return `
    <div class="card">
      <h2>${L("Klausurvorbereitung", "Exam preparation")}</h2>
      <div class="home-tiles">
        ${tile("len-exams", "📄", "Altklausuren", "Old exams", L(`${LEN_EXAMS.length} Klausuren · ${done} / ${tasks} Aufgaben erledigt`, `${LEN_EXAMS.length} exams · ${done} / ${tasks} tasks done`))}
        ${tile("len-practice", "✎", "Übungsaufgaben", "Practice tasks", L(`${LEN_GENERATORS.length} Aufgabentypen · ${solved}× komplett richtig`, `${LEN_GENERATORS.length} kinds of task · ${solved}× fully right`))}
        ${tile("len-mock", "⏱", "Probeklausur", "Mock exam", mock.best !== undefined ? L(`Bestes Ergebnis: ${mock.best} %`, `Best result: ${mock.best} %`) : L("120 Minuten, wie die echte", "120 minutes, like the real one"))}
      </div>
    </div>`;
}

function lenChapterCardHTML(ch) {
  const done = ch.sections.filter(lenPassed).length;
  return `
    <div class="card">
      <div class="card-head">
        <h2>${L("Kapitel", "Chapter")} ${ch.n} · ${Lp(ch.title)}</h2>
        <span class="small muted"><b>${done}</b> / ${ch.sections.length} ${L("Abschnitte geschafft", "sections done")}</span>
      </div>
      <span class="lmastery-bar course-bar len-bar"><span style="width:${(done / ch.sections.length) * 100}%"></span></span>
      <div class="len-toc">
        ${ch.sections.map((s) => `
          <button class="len-toc-tile ${lenPassed(s) ? "done" : ""}" type="button" data-sec="${s.id}">
            <span class="len-num">${s.id}</span>
            <span><b>${Lp(s.title)}</b><span class="small muted">${Lp(s.about)}</span></span>
            <span class="len-toc-state" aria-hidden="true">${lenPassed(s) ? "✓" : ""}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

// The course picker's card for LEN.
function lenCourseCardHTML(c) {
  const secs = lenSections();
  const done = secs.filter(lenPassed).length;
  const next = lenNextSection();
  return `
    <div class="course-card" style="--cc:${c.color}">
      <span class="course-mark short len-mark" aria-hidden="true">${c.mark}</span>
      <div class="course-body">
        <h2 lang="de">${c.name}</h2>
        <p class="muted">${L("Netzwerke von Grund auf: Ladung, Strom, Spannung, Kirchhoff — mit Zeichnungen, an denen du drehen kannst. Auf Deutsch oder Englisch.",
          "Circuits from the ground up: charge, current, voltage, Kirchhoff — with drawings you can play with. In German or English.")}</p>
      </div>
      <div class="course-side">
        <div class="course-stats small">
          <span><b>${done}</b> / ${secs.length} ${L("Abschnitte", "sections")}</span>
          <span>${L("Kapitel", "Chapter")} 1 · ${Lp(LEN_CHAPTERS[0].title)}</span>
        </div>
        <span class="lmastery-bar course-bar"><span style="width:${(done / secs.length) * 100}%"></span></span>
        <div class="home-actions">
          <button class="btn primary" data-course="${c.id}">${L("Kurs öffnen →", "Open course →")}</button>
          <button class="btn" id="lenCourseGo" data-sec="${next.id}">${L("Weiter mit", "Continue with")} ${next.id}</button>
        </div>
      </div>
    </div>`;
}

function wireLenCourseCard() {
  const go = $("#lenCourseGo");
  if (go) go.onclick = () => { track("courses.lenContinue"); openLenSection(go.dataset.sec); };
}

/* ---------------------------------------------------------------- Basics page */

// A chapter's page: its sections one after another, with a row of section buttons at the top.
function renderLenBasics() {
  const ch = LEN_CHAPTERS[0];
  $("#len-basics").innerHTML = `
    <div class="card hero">
      <span class="len-kicker">${L("Kapitel", "Chapter")} ${ch.n}</span>
      <h1>${Lp(ch.headline)}</h1>
      <p>${Lp(ch.intro)}</p>
    </div>
    <nav class="len-index" id="lenIndex" aria-label="${lt("Abschnitte", "Sections")}"></nav>
    ${ch.sections.map((s) => `
      <section class="len-sec" id="${lenSecId(s.id)}">
        <div class="len-sec-head"><span class="len-num">${s.id}</span><h2>${Lp(s.title)}</h2></div>
        ${s.html()}
        <div class="card len-check" data-check="${s.id}"></div>
      </section>`).join("")}`;
  ch.sections.forEach((s) => {
    s.setup($("#" + lenSecId(s.id)));
    renderLenCheck($(`#len-basics [data-check="${s.id}"]`), s);
  });
  lenUpdateIndex();
}

function lenUpdateIndex() {
  const ix = $("#lenIndex");
  if (!ix) return;
  ix.innerHTML = LEN_CHAPTERS[0].sections.map((s) => `
    <button type="button" class="len-ix ${lenPassed(s) ? "done" : ""}" data-sec="${s.id}">
      <span class="len-num">${s.id}</span>${Lp(s.short)}${lenPassed(s) ? ' <span class="len-ix-ok" aria-hidden="true">✓</span>' : ""}</button>`).join("");
  $$("button", ix).forEach((b) => (b.onclick = () => lenScrollTo(b.dataset.sec)));
}

/* ---------------------------------------------------------------- Formulas page */

function renderLenFormulas() {
  const ch = LEN_CHAPTERS[0];
  const terms = [...LEN_GLOSSARY].sort((a, b) => a[0].localeCompare(b[0], "de"));
  $("#len-formulas").innerHTML = `
    <div class="card hero">
      <h1>${L(`Formeln &amp; <span class="accent">Begriffe</span>`, `Formulas &amp; <span class="accent">terms</span>`)}</h1>
      <p>${L("Alles Wichtige aus den Kapiteln auf einen Blick. Ein Klick auf den Abschnitt bringt dich zur Erklärung.",
        "Everything important from the chapters at a glance. Click a section to go to its explanation.")}</p>
    </div>
    <div class="card">
      <h2>${L("Kapitel", "Chapter")} ${ch.n} · ${Lp(ch.title)}</h2>
      <div class="len-fgrid">
        ${LEN_FORMULAS.map((f) => `
          <div class="len-f">
            <button type="button" class="len-num len-f-sec" data-sec="${f.sec}" title="${lt("Zum Abschnitt", "Go to the section")}">${f.sec}</button>
            <div class="len-f-name">${Lp(f.name)}</div>
            ${F(f.f)}
            ${f.note ? `<p class="small muted">${Lp(f.note)}</p>` : ""}
          </div>`).join("")}
      </div>
    </div>
    <div class="card">
      <div class="card-head">
        <h2>${L("Begriffe", "Terms")}</h2>
        <input type="search" class="len-search" id="lenTermSearch" placeholder="${lt("Suchen …", "Search …")}" aria-label="${lt("Begriffe suchen", "Search terms")}">
      </div>
      <table class="len-terms">
        <thead><tr><th lang="de">Deutsch</th><th>English</th></tr></thead>
        <tbody>${terms.map(([de, en]) => `<tr><td lang="de">${de}</td><td>${en}</td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  $$("#len-formulas [data-sec]").forEach((b) => (b.onclick = () => openLenSection(b.dataset.sec)));
  const search = $("#lenTermSearch");
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    $$("#len-formulas .len-terms tbody tr").forEach((tr) => (tr.hidden = q && !tr.textContent.toLowerCase().includes(q)));
  };
  // The placeholder and labels are attributes, so they follow the language here.
  lenDraws.push(() => {
    search.placeholder = lt("Suchen …", "Search …");
    search.setAttribute("aria-label", lt("Begriffe suchen", "Search terms"));
    $$("#len-formulas .len-f-sec").forEach((b) => (b.title = lt("Zum Abschnitt", "Go to the section")));
    $("#lenIndex")?.setAttribute("aria-label", lt("Abschnitte", "Sections"));
  });
}
