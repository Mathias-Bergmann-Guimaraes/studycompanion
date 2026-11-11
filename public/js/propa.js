// The ProPa course (Programmierparadigmen). Its first part is the Lean part of the lecture
// (functional programming), built from the lecture's Lean files; a second part (Reussner) joins
// later as a group of its own. This file has the helpers every ProPa page uses (Lean code with
// colours, cards, drawings, the check at the end of each section), its Home and Cheat sheet tabs
// and its card on the course picker. The chapters are in propa-lean1.js … propa-lean4.js and join
// PROPA_CHAPTERS; the Practice tab is propa-practice.js.
//
// The lecture material is in English, so ProPa is too. The pages are made for going over material
// you have seen before: each section starts with the idea in short, then the code, a drawing you
// can play with, the traps, and a check.

const PROPA_CHAPTERS = [];
// The parts of the lecture, in the order Home shows them: [part, heading].
const PROPA_PARTS = [["Lean", "Lean · functional programming"], ["Reussner", "Reussner · parallel programming and Design by Contract"]];

/* ---------------------------------------------------------------- Lean code */

const PP_KEYWORDS = new Set(("def let rec in if then else match with fun λ inductive structure class instance where deriving " +
  "namespace end open section variable abbrev partial private do return for theorem example by import mut " +
  "true false sorry").split(" "));
// Monads and other effect types get the effect colour.
const PP_EFFECTS = new Set("IO Except ExceptT State StateT StateM Reader ReaderT Task Id EIO BaseIO".split(" "));
const ppEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Colours Lean source: keywords, types (capitalised names), strings, numbers, operators, comments.
// A comment that starts with "--=" is an #eval's result and is drawn as one ("⇒ 7").
function leanHL(src) {
  const re = /(--=[^\n]*)|(--[^\n]*)|(\/-[\s\S]*?-\/)|("(?:[^"\\]|\\.)*")|(#[a-z]+)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_α-ωΑ-Ω][\w'!?.₀-₉]*)|(=>|←|→|:=|\|>\.|\|>|<\|>|>>=|::|∀|×|⟨|⟩|·|\+\+|==|!=|&&|\|\||\$|∘|<\$>|[|=<>+*\/%-])/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += ppEsc(src.slice(last, m.index));
    const [t, outC, com, block, str, cmd, num, word, op] = m;
    if (outC) out += `<span class="t-out">⇒ ${ppEsc(t.slice(3).trim())}</span>`;
    else if (com || block) out += `<span class="t-com">${ppEsc(t)}</span>`;
    else if (str) out += `<span class="t-str">${ppEsc(t)}</span>`;
    else if (cmd) out += `<span class="t-cmd">${t}</span>`;
    else if (num) out += `<span class="t-num">${t}</span>`;
    else if (word) {
      if (PP_KEYWORDS.has(word)) out += `<span class="t-kw">${word}</span>`;
      else if (PP_EFFECTS.has(word.split(".")[0])) out += `<span class="t-eff">${ppEsc(word)}</span>`;
      else if (/^[A-Z]/.test(word)) out += `<span class="t-ty">${ppEsc(word)}</span>`;
      else out += ppEsc(word);
    } else if (op) out += `<span class="t-op">${ppEsc(t)}</span>`;
    last = m.index + t.length;
  }
  return out + ppEsc(src.slice(last));
}

// C, Java and JML (the Reussner part). MPI names get a colour of their own, as in the lecture's
// slides; a JML comment (/*@ … @*/ or //@) is drawn as a contract, with its keywords coloured.
const PP_C_KW = new Set("int char float double void long short unsigned signed const volatile static extern struct union enum return if else for while do sizeof typedef register auto break continue".split(" "));
const PP_J_KW = new Set("class interface extends implements public private protected static final void int long boolean double float char byte short new return if else for while do synchronized volatile try catch finally throw throws this super null true false import package abstract default instanceof var".split(" "));
const PP_JML_KW = new Set("requires ensures invariant assignable signals signals_only pure spec_public nullable non_null also behavior normal_behavior helper".split(" "));
function cHL(src, lang = "java") {
  const kw = lang === "c" ? PP_C_KW : PP_J_KW;
  const re = /(\/\*@[\s\S]*?@\*\/|\/\/@[^\n]*)|(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(#\s*[a-z]+)|(\\[a-z_]+)|(\b\d+(?:\.\d+)?[fdL]?\b)|(@[A-Za-z]+)|([A-Za-z_][\w]*)|(==>|<==>|<=!=>|->|::|&&|\|\||[=!<>]=|\+\+|--|[-+*\/%&|^!~<>=?:])/g;
  let out = "", last = 0, m;
  while ((m = re.exec(src))) {
    out += ppEsc(src.slice(last, m.index));
    const [t, jml, com, str, pre, bs, num, anno, word, op] = m;
    if (jml) {
      const open = t.startsWith("//@") ? "//@" : "/*@", close = open === "/*@" ? "@*/" : "";
      out += `<span class="t-jml"><span class="t-com">${open}</span>${cHL(t.slice(3, t.length - close.length), "jml")}<span class="t-com">${close}</span></span>`;
    } else if (com) out += `<span class="t-com">${ppEsc(t)}</span>`;
    else if (str) out += `<span class="t-str">${ppEsc(t)}</span>`;
    else if (pre) out += `<span class="t-cmd">${ppEsc(t)}</span>`;
    else if (bs) out += `<span class="t-kw">${ppEsc(t)}</span>`;
    else if (num) out += `<span class="t-num">${t}</span>`;
    else if (anno) out += `<span class="t-cmd">${t}</span>`;
    else if (word) {
      if (/^MPI_/.test(word)) out += `<span class="t-mpi">${word}</span>`;
      else if (kw.has(word) || (lang === "jml" && (PP_JML_KW.has(word) || PP_J_KW.has(word)))) out += `<span class="t-kw">${word}</span>`;
      else if (/^[A-Z]/.test(word)) out += `<span class="t-ty">${word}</span>`;
      else out += word;
    } else if (op) out += `<span class="t-op">${ppEsc(t)}</span>`;
    last = m.index + t.length;
  }
  return out + ppEsc(src.slice(last));
}
const ppHL = (src, lang) => (!lang || lang === "lean" ? leanHL(src) : cHL(src, lang));

// A block of code (Lean unless `lang` says "c", "java" or "jml"). `title` goes above it; `note` under it.
function code(src, { title = "", note = "", cls = "", lang = "lean" } = {}) {
  const lines = src.replace(/^\n+|\s+$/g, "").split("\n");
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length));
  const body = lines.map((l) => l.slice(indent)).join("\n");
  return `<figure class="pp-code ${cls}">${title ? `<figcaption>${title}</figcaption>` : ""}<pre><code>${ppHL(body, lang)}</code></pre>${note ? `<p class="pp-code-note">${note}</p>` : ""}</figure>`;
}
// Two code blocks side by side (stacked on a phone), e.g. before / after.
const codePair = (a, b) => `<div class="pp-pair">${a}${b}</div>`;
// Inline code: Lean with c(), Java with j(), C with cq().
const c = (s) => `<code class="pp-ic">${leanHL(s)}</code>`;
const j = (s) => `<code class="pp-ic">${cHL(s, "java")}</code>`;
const cq = (s) => `<code class="pp-ic">${cHL(s, "c")}</code>`;
// Java and C code blocks.
const jcode = (src, o = {}) => code(src, { ...o, lang: "java" });
const ccode = (src, o = {}) => code(src, { ...o, lang: "c" });

/* ---------------------------------------------------------------- Page parts */

// The idea in short, at the top of a section: what to remember before anything else.
const ppGist = (items) => `<div class="pp-gist"><span class="pp-gist-cap">In short</span><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
// Mistakes that are easy to make (in the exercises, in the exam).
const ppTraps = (items) => `<div class="pp-traps"><span class="pp-traps-cap">Watch out</span><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`;
// Names and what they mean.
const ppFacts = (rows) => `<div class="len-facts pp-facts">${rows.map(([name, body]) => `
  <div class="len-fact"><div class="len-fact-name"><b>${name}</b></div><div>${body}</div></div>`).join("")}</div>`;
const ppAside = (summary, body) => `<details class="len-aside"><summary>${summary}</summary><div>${body}</div></details>`;
// Where the material is in the course repository.
const ppSrc = (files) => `<p class="pp-src small muted">From ${files.map((f) => `<code>${f}</code>`).join(", ")}</p>`;
const ppCard = (title, body) => `<div class="card"><h3>${title}</h3>${body}</div>`;

/* ---------------------------------------------------------------- Drawings */

// A drawing in a card (the same frame as LEN's): the picture, then its controls and what it reads out.
const pw = (key, ctrl, { wide = false, fig = "" } = {}) => `
  <div class="lw pp-w ${wide ? "wide" : ""}" data-w="${key}">
    <div class="lw-fig">${fig}</div>
    <div class="lw-side"><div class="lw-ctrl">${ctrl}</div><div class="lw-read"></div></div>
  </div>`;
const pbtn = (a, label, cls = "") => `<button class="btn ${cls}" type="button" data-a="${a}">${label}</button>`;
const pseg = (key, opts, active) => `
  <div class="seg lw-seg" data-seg="${key}">${opts.map(([v, label]) =>
    `<button type="button" data-v="${v}" class="${String(v) === String(active) ? "active" : ""}">${label}</button>`).join("")}</div>`;
const pslider = (key, label, min, max, step, value) => `
  <label class="lw-sl"><span class="lw-sl-name">${label}</span>
    <input type="range" data-k="${key}" min="${min}" max="${max}" step="${step}" value="${value}">
    <output data-o="${key}"></output></label>`;
// The parts of a drawing, found by its key.
const ppW = (root, key) => {
  const w = $(`[data-w="${key}"]`, root);
  return { w, fig: $(".lw-fig", w), read: $(".lw-read", w), ctrl: $(".lw-ctrl", w), on: (a, f) => $$(`[data-a="${a}"]`, w).forEach((b) => (b.onclick = f)) };
};
// A Lean value drawn as text in a drawing.
const ppVal = (s) => `<code class="pp-ic">${leanHL(s)}</code>`;
// Random whole numbers and small lists, for drawings and practice tasks.
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const rlist = (n, a = 0, b = 9) => Array.from({ length: n }, () => rint(a, b));
const showList = (xs) => `[${xs.join(", ")}]`;

/* ---------------------------------------------------------------- Progress */

const ppPassMark = (n) => n - 1;
const ppBest = (sec) => store.get("propaChecks", {})[sec.id];
const ppPassed = (sec) => (ppBest(sec) ?? -1) >= ppPassMark(sec.check.length);
const ppSections = () => PROPA_CHAPTERS.flatMap((ch) => ch.sections);
const ppNextSection = () => ppSections().find((s) => !ppPassed(s)) || ppSections()[0];
const ppSecId = (id) => "ppSec-" + id.replace(/\./g, "-");
const ppChapterOf = (id) => PROPA_CHAPTERS.find((ch) => ch.sections.some((s) => s.id === id));
const ppTab = (ch) => "propa-l" + ch.n;

function ppScrollTo(id) {
  const el = $("#" + ppSecId(id));
  if (!el) return;
  const index = $(`#${ppTab(ppChapterOf(id))} .len-index`);
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - barHeight() - (index ? index.offsetHeight : 0) - 8 });
}

function openPropaSection(id) {
  showTab(ppTab(ppChapterOf(id)));
  ppScrollTo(id);
}

/* ---------------------------------------------------------------- Section checks */

// The check at the end of a section, one question at a time, each answer explained.
// A question: { q, opts: [...] (the first is right), why }, all HTML.
function renderPropaCheck(box, sec) {
  const n = sec.check.length;
  const best = ppBest(sec);
  box.innerHTML = `
    <div class="card-head">
      <h3>Quick check · ${sec.id}</h3>
      ${ppPassed(sec) ? `<span class="pill good">✓ done</span>` : ""}
    </div>
    <p class="small muted">${n} questions. Get ${ppPassMark(n)} or more right to finish the section.${best === undefined ? "" : ` Best so far: ${best} / ${n}.`}</p>
    <button class="btn primary" type="button">${best === undefined ? "Start the check" : "Try again"}</button>`;
  $("button", box).onclick = () => runPropaCheck(box, sec);
}

function runPropaCheck(box, sec) {
  track("propa.check");
  const qs = shuffle(sec.check.map((q) => ({ ...q, opts: shuffle(q.opts.map((o, i) => ({ o, right: i === 0 }))) })));
  let i = 0, score = 0;
  const ask = () => {
    const q = qs[i];
    box.innerHTML = `
      <div class="card-head"><h3>Quick check · ${sec.id}</h3><span class="muted small">${i + 1} / ${qs.length}</span></div>
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
        <div class="verdict ${pick.right ? "ok" : "bad"}">${pick.right ? "Right!" : "Not quite."}</div>
        <div class="pp-why">${q.why}</div>
        <div class="q-actions"><button class="btn primary" type="button">${last ? "See result" : "Next →"}</button></div>`;
      $(".q-actions .btn", box).onclick = () => { i++; i < qs.length ? ask() : done(); };
      $(".q-actions .btn", box).focus({ preventScroll: true });
    }));
  };
  const done = () => {
    track("propa.checkDone");
    const all = store.get("propaChecks", {});
    if (score > (all[sec.id] ?? -1)) store.set("propaChecks", { ...all, [sec.id]: score });
    const passed = score >= ppPassMark(qs.length);
    renderPropaCheck(box, sec);
    box.insertAdjacentHTML("afterbegin", `<p class="len-result ${passed ? "ok" : "bad"}">${score} / ${qs.length} — ${passed
      ? "Section done!" : "Have another look at the section and try again."}</p>`);
    ppUpdateIndex(ppChapterOf(sec.id));
  };
  ask();
}

/* ---------------------------------------------------------------- Chapter pages */

function renderPropaChapter(ch) {
  const panel = $("#" + ppTab(ch));
  panel.innerHTML = `
    <div class="card hero">
      <span class="len-kicker">${ch.part} · chapter ${ch.n}</span>
      <h1>${ch.headline}</h1>
      <p>${ch.intro}</p>
    </div>
    <nav class="len-index" aria-label="Sections"></nav>
    ${ch.sections.map((s) => `
      <section class="len-sec" id="${ppSecId(s.id)}">
        <div class="len-sec-head"><span class="len-num">${s.id}</span><h2>${s.title}</h2></div>
        ${s.html()}
        <div class="card len-check" data-check="${s.id}"></div>
      </section>`).join("")}
    ${ch.next ? `<div class="pp-next"><button class="btn primary" type="button" data-go="propa-l${ch.n + 1}">Next: chapter ${ch.n + 1} · ${ch.next} →</button></div>` : ""}`;
  ch.sections.forEach((s) => {
    s.setup?.($("#" + ppSecId(s.id)));
    renderPropaCheck($(`[data-check="${s.id}"]`, panel), s);
  });
  $$("[data-go]", panel).forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
  ppUpdateIndex(ch);
}

function ppUpdateIndex(ch) {
  const ix = $(`#${ppTab(ch)} .len-index`);
  if (!ix) return;
  ix.innerHTML = ch.sections.map((s) => `
    <button type="button" class="len-ix ${ppPassed(s) ? "done" : ""}" data-sec="${s.id}">
      <span class="len-num">${s.id}</span>${s.short}${ppPassed(s) ? ' <span class="len-ix-ok" aria-hidden="true">✓</span>' : ""}</button>`).join("");
  $$("button", ix).forEach((b) => (b.onclick = () => ppScrollTo(b.dataset.sec)));
}

/* ---------------------------------------------------------------- Home */

function renderPropaHome() {
  const next = ppNextSection();
  const allDone = ppSections().every(ppPassed);
  const solved = Object.values(store.get("propaSolved", {})).reduce((a, b) => a + b, 0);
  const tile = (go, icon, title, sub) => `<button class="home-tile" type="button" data-go="${go}"><span class="home-tile-ja len-tile-icon" aria-hidden="true">${icon}</span><span><b>${title}</b><span class="small muted">${sub}</span></span></button>`;
  $("#propa-home").innerHTML = `
    <div class="card hero">
      <h1>Programming <span class="accent">Paradigms</span></h1>
      <p>The lecture's two parts, Lean and Reussner, for going over them again: every topic in short, the code that matters,
        drawings that run the code step by step, the traps to avoid, and a check per section.
        Then <b>Practice</b> makes new tasks like the exam's, as many as you like.</p>
      <div class="home-actions">
        <button class="btn primary" type="button" id="ppGo">${allDone ? "Go over the Lean part again" : `Continue with ${next.id}: ${next.title}`} →</button>
        <button class="btn" type="button" data-go="propa-practice">Practice</button>
        <button class="btn" type="button" data-go="propa-cheat">Cheat sheet</button>
      </div>
    </div>
    ${PROPA_PARTS.map(([part, title]) => `<h2 class="pp-part">${title}</h2>${PROPA_CHAPTERS.filter((ch) => ch.part === part).map(ppChapterCardHTML).join("")}`).join("")}
    <div class="card">
      <h2>Train</h2>
      <div class="home-tiles">
        ${tile("propa-practice", "✎", "Practice", `${PROPA_DRILLS.length} kinds of task · ${solved}× right`)}
        ${tile("propa-cheat", "λ", "Cheat sheet", "Syntax, terms and complexities at a glance")}
        ${tile("propa-exams", "📄", "Old exams", `${PROPA_EXAMS.length} exams · ${store.get("propaExamDone", []).length} / ${PROPA_EXAMS.flatMap((e) => e.tasks).length} tasks done`)}
      </div>
    </div>
    <div class="card">
      <h2>Colour code</h2>
      <p class="small muted">The same in every code block and drawing on these pages.</p>
      <div class="len-legend">
        ${[["t-kw", "def", "keyword"], ["t-ty", "Nat", "type, type class, constructor in capitals"], ["t-op", "=>", "operator"],
          ["t-str", '"a"', "string"], ["t-num", "42", "number"], ["t-com", "--", "comment"], ["t-out", "⇒", "what #eval prints"],
          ["t-eff", "IO", "effect: IO, Except, State …"], ["t-cmd", "#eval", "command"], ["pp-c-hl", "▬", "what happens now"]]
          .map(([c, m, t]) => `<span class="len-swatch"><b class="${c}">${m}</b>${t}</span>`).join("")}
      </div>
    </div>
`;
  $("#ppGo").onclick = () => { track("propa.continue"); openPropaSection(next.id); };
  $$("#propa-home [data-sec]").forEach((b) => (b.onclick = () => openPropaSection(b.dataset.sec)));
  $$("#propa-home [data-go]").forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
}

function ppChapterCardHTML(ch) {
  const done = ch.sections.filter(ppPassed).length;
  return `
    <div class="card">
      <div class="card-head">
        <h2>Chapter ${ch.n} · ${ch.title}</h2>
        <span class="small muted"><b>${done}</b> / ${ch.sections.length} sections done</span>
      </div>
      <span class="lmastery-bar course-bar len-bar"><span style="width:${(done / ch.sections.length) * 100}%"></span></span>
      <div class="len-toc">
        ${ch.sections.map((s) => `
          <button class="len-toc-tile ${ppPassed(s) ? "done" : ""}" type="button" data-sec="${s.id}">
            <span class="len-num">${s.id}</span>
            <span><b>${s.title}</b><span class="small muted">${s.about}</span></span>
            <span class="len-toc-state" aria-hidden="true">${ppPassed(s) ? "✓" : ""}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

// The course picker's card for ProPa.
function propaCourseCardHTML(c) {
  const secs = ppSections();
  const done = secs.filter(ppPassed).length;
  const next = ppNextSection();
  return `
    <div class="course-card" style="--cc:${c.color}">
      <span class="course-mark short len-mark" aria-hidden="true">${c.mark}</span>
      <div class="course-body">
        <h2 lang="de">${c.name}</h2>
        <p class="muted">Both parts for review — Lean (recursion, folds, λ-calculus, monads) and Reussner (parallel programming, C &amp; MPI, Java threads, Design by Contract) — with drawings that run the code step by step, and practice tasks like the exam's.</p>
      </div>
      <div class="course-side">
        <div class="course-stats small">
          <span><b>${done}</b> / ${secs.length} sections</span>
          <span>${PROPA_CHAPTERS.length} chapters · Lean + Reussner</span>
        </div>
        <span class="lmastery-bar course-bar"><span style="width:${(done / secs.length) * 100}%"></span></span>
        <div class="home-actions">
          <button class="btn primary" data-course="${c.id}">Open course →</button>
          <button class="btn" id="ppCourseGo" data-sec="${next.id}">Continue with ${next.id}</button>
        </div>
      </div>
    </div>`;
}

function wirePropaCourseCard() {
  const go = $("#ppCourseGo");
  if (go) go.onclick = () => { track("courses.propaContinue"); openPropaSection(go.dataset.sec); };
}

/* ---------------------------------------------------------------- Cheat sheet */

// [group, [[what, code, note, section]]]
const PROPA_SHEET = [
  ["Basics", [
    ["Define a function", "def add (x y : Int) : Int := x + y", "Parameters with types, then the result type.", "1.1"],
    ["Call a function", "add 2 3        -- not add(2, 3)", "Arguments by spaces. (2, 3) is one tuple.", "1.1"],
    ["Local name", "let a := 3 * 7; a + a", "Immutable. A let is an expression too.", "1.1"],
    ["Condition", "if x < 0 then -x else x", "Always both branches: it must give a value.", "1.1"],
    ["Pipe", "xs |> List.map f |> List.sum", "Left value becomes the last argument.", "1.1"],
    ["Test", "#assert (absolute (-7)) == 7", "#eval shows a value, #check its type.", "1.1"],
  ]],
  ["Data", [
    ["Enum-like type", "inductive Unit where\n| Backend | Frontend\nderiving Repr, BEq", "deriving Repr: printable; BEq: ==.", "1.2"],
    ["Constructor with data", "| Engineering (unit : EngineeringUnit)", "Department.Engineering .Backend", "1.2"],
    ["Record", "structure Employee where\n  name : String\n  salary : Float", "Fields: e.name or Employee.name e.", "1.2"],
    ["Make a record", "Employee.mk \"Ann\" 9.0\n⟨\"Ann\", 9.0⟩\n{ name := \"Ann\", salary := 9.0 }", "Positional, anonymous, by name.", "1.2"],
    ["Copy with a change", "{ q with back := x :: q.back }", "A new value; the old one is unchanged.", "3.4"],
    ["Type parameter", "inductive List (α : Type) where\n| nil | cons (hd : α) (tl : List α)", "Recursive and generic.", "1.4"],
  ]],
  ["Matching and recursion", [
    ["Match", "match xs with\n| [] => 0\n| x :: rest => x + sum rest", "Top to bottom, first match wins.", "1.3"],
    ["Two at once", "match xs, ys with\n| [], _ => …\n| x :: xs, y :: ys => …", "One pattern per value.", "1.3"],
    ["Match in the signature", "def f : Expr → Nat\n| .var _ => 1\n| .app a b => f a + f b", "No match … with needed.", "2.4"],
    ["Total vs partial", "partial def collatz (n : Nat) : Nat := …", "Lean can't see it ends: you promise it does.", "1.4"],
    ["Option result", "def head? : List α → Option α", "? returns Option, ! may panic.", "1.3"],
  ]],
  ["Functions as values", [
    ["Lambda", "fun x => x * 2      λ x => x * 2      (· * 2)", "All the same function.", "2.1"],
    ["map / filter", "[1,2,3].map (· * 2)       --= [2, 4, 6]\n[1,2,3].filter (· > 1)   --= [2, 3]", "", "2.1"],
    ["zipWith", "List.zipWith (· + ·) [1,2] [10,20]   --= [11, 22]", "Stops at the shorter list.", "2.1"],
    ["fold (right)", "List.foldr (· + ·) 0 [1,2,3]   --= 6", "cons ↦ combine, nil ↦ init.", "2.2"],
    ["foldl (left)", "[1,2,3].foldl (fun acc x => acc * 10 + x) 0   --= 123", "Accumulator first; tail-recursive.", "3.1"],
  ]],
  ["Effects", [
    ["do block", "do\n  let line ← stdin.getLine\n  let name := line.trim\n  IO.println name", "← runs an effect, := is pure.", "4.1"],
    ["Monad", "class Monad m where\n  pure : α → m α\n  bind : m α → (α → m β) → m β", "do is sugar for >>=.", "4.2"],
    ["Except", "throw \"bad\"   /   return x", "Except ε α: ok or error.", "4.1"],
    ["State", "get  /  set s  /  modify (· + 1)", "State σ α ≈ σ → α × σ.", "4.2"],
    ["Stack", "abbrev M := StateT Int (ExceptT String IO)", "Order matters.", "4.3"],
    ["Parallel", "Task.spawn (fun () => f x) |>.get", "Pure work in parallel, no races.", "4.4"],
  ]],
  ["Type classes", [
    ["Interface", "class Building (b : Type) where\n  name : b → String", "", "3.3"],
    ["Implement it", "instance : Building Office where\n  name o := o.title", "", "3.3"],
    ["Use it", "def info [Building b] (x : b) := Building.name x", "[…] asks Lean to find the instance.", "3.3"],
    ["Hide a constructor", "structure Rational where\n  private mk' ::\n  num : Int\n  den : Nat", "Only the smart constructor builds one.", "3.4"],
  ]],
];

// [term, meaning, section]
const PROPA_TERMS = [
  ["accumulator", "An extra parameter that carries the result so far; makes recursion tail-recursive.", "3.1"],
  ["ad-hoc polymorphism", "One name, different code per type — via type classes (Building.name).", "3.3"],
  ["algebraic data type", "A type built from constructors: inductive types and structures.", "1.2"],
  ["amortised cost", "Average cost per operation over a long run (banker's queue: O(1)).", "3.4"],
  ["beta reduction", "(λ x. e) a → e[x := a]: the one computation rule of the lambda calculus.", "2.3"],
  ["bind (>>=)", "Runs a monadic computation and feeds its result to the next one.", "4.2"],
  ["Church encoding", "Data as functions: a value is its own fold (true picks the first of two).", "2.3"],
  ["closure", "A function value together with the environment it was made in.", "2.4"],
  ["constructor", "One way to build a value of an inductive type (nil, cons, some, none …).", "1.2"],
  ["dynamic scoping", "A variable means its most recent binding at run time. Fragile; prog gives 82.", "2.4"],
  ["environment", "A map from variable names to values, used instead of substitution.", "2.4"],
  ["equational reasoning", "Replacing a call by its result, which pure code allows.", "4.1"],
  ["expression language", "Everything is an expression with a value; no statements.", "1.1"],
  ["fold", "The function that replaces each constructor of a type by a function.", "2.2"],
  ["free variable", "A variable not bound by a λ around it.", "2.3"],
  ["generative recursion", "Recursive calls on newly made data, not on parts of the input (quicksort).", "1.4"],
  ["higher-order function", "Takes or returns a function (map, filter, fold).", "2.1"],
  ["lexical scoping", "A variable means its binding where the function was defined. Gives 42.", "2.4"],
  ["monad", "A type operator m with pure and bind: the shape of effectful code.", "4.2"],
  ["monad transformer", "Adds one effect to another monad: StateT σ m, ExceptT ε m.", "4.3"],
  ["MonadLift", "Lifts an action from an inner monad into the stack.", "4.3"],
  ["mutex", "Lets one thread at a time change shared state (atomically).", "4.4"],
  ["parametric polymorphism", "One code for every type (List.length).", "3.3"],
  ["partial function", "May not terminate or not be defined for every input; marked partial.", "1.4"],
  ["pattern matching", "Taking a value apart by its constructors, first match wins.", "1.3"],
  ["property-based testing", "Checking a property on many random inputs (plausible).", "3.2"],
  ["Prop", "A logical statement (uses =). Bool is a computed value (uses ==).", "3.2"],
  ["pure function", "Output depends only on the input; no side effects.", "1.1"],
  ["race condition", "Two threads read-then-write the same state and one update is lost.", "4.4"],
  ["shrinking", "Making a counterexample smaller until it still fails.", "3.2"],
  ["smart constructor", "A function that checks or normalises before building the value.", "3.4"],
  ["structural recursion", "Recursive calls only on direct parts of the input. Always terminates.", "1.4"],
  ["tail call", "A call that is the last thing a function does; needs no new stack frame.", "3.1"],
  ["thunk", "A delayed computation, run the first time its value is needed.", "3.4"],
  ["type class", "An interface: operations a type must provide.", "3.3"],
];

const PROPA_COMPLEXITY = [
  ["len, sum, map, filter (structural)", "O(n)", "one step per element"],
  ["xs ++ ys", "O(|xs|)", "copies the first list only"],
  ["naive rev: rev xs ++ [x]", "O(n²)", "an append per element"],
  ["revTR with accumulator", "O(n)", "one cons per element"],
  ["list as queue: enqueue q ++ [x]", "O(n)", "per enqueue"],
  ["banker's queue", "O(1) amortised", "reverse only when front is empty"],
  ["substitution interpreter", "walks the body at every call", "environment avoids it"],
];

function renderPropaCheat() {
  $("#propa-cheat").innerHTML = `
    <div class="card hero">
      <h1>Cheat <span class="accent">sheet</span></h1>
      <p>Both parts on one page. Click a section number to go to its explanation.</p>
      <input type="search" class="len-search pp-search" id="ppSheetSearch" placeholder="Search syntax and terms …" aria-label="Search the cheat sheet">
    </div>
    ${PROPA_SHEET.map(([group, rows]) => `
      <div class="card pp-sheet-group">
        <h2>${group}</h2>
        <div class="pp-sheet">
          ${rows.map(([what, src, note, sec, lang]) => `
            <div class="pp-sheet-row">
              <div class="pp-sheet-what"><button type="button" class="len-num len-f-sec" data-sec="${sec}" title="Go to the section">${sec}</button><b>${what}</b>${note ? `<span class="small muted">${note}</span>` : ""}</div>
              <pre class="pp-sheet-code"><code>${ppHL(src, lang)}</code></pre>
            </div>`).join("")}
        </div>
      </div>`).join("")}
    <div class="card">
      <h2>Running times</h2>
      <table class="len-terms pp-cx">
        <thead><tr><th>Function</th><th>Time</th><th>Why</th></tr></thead>
        <tbody>${PROPA_COMPLEXITY.map(([f, t, w]) => `<tr><td>${f}</td><td><b>${t}</b></td><td class="muted">${w}</td></tr>`).join("")}</tbody>
      </table>
    </div>
    <div class="card pp-sheet-group">
      <h2>Terms</h2>
      <table class="len-terms pp-terms">
        <tbody>${[...PROPA_TERMS].sort((a, b) => a[0].localeCompare(b[0])).map(([t, m, sec]) =>
          `<tr><td><b>${t}</b></td><td>${m}</td><td><button type="button" class="len-num len-f-sec pp-term-sec" data-sec="${sec}" title="Go to the section">${sec}</button></td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  $$("#propa-cheat [data-sec]").forEach((b) => (b.onclick = () => openPropaSection(b.dataset.sec)));
  const search = $("#ppSheetSearch");
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    $$("#propa-cheat .pp-sheet-row, #propa-cheat .pp-terms tr").forEach((r) => (r.hidden = q && !r.textContent.toLowerCase().includes(q)));
    $$("#propa-cheat .pp-sheet-group").forEach((g) => (g.hidden = q && !$$(".pp-sheet-row:not([hidden]), .pp-terms tr:not([hidden])", g).length));
  };
}

/* ---------------------------------------------------------------- Setup */

function setupPropa() {
  PROPA_CHAPTERS.forEach(renderPropaChapter);
  renderPropaCheat();
}
