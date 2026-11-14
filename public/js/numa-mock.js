// NuMa Practice and mock exam. Practice shows one exam task at a time (numa-tasks.js), filtered by
// topic; the mock exam puts one task per chosen topic together — by default like a real exam: six
// tasks with LR and quadrature always among them — timed, and marked only when handed in.
//
// Values and choices are marked by the page. Proofs and explanations you write yourself (on the
// page or on paper), then mark against the model answer by ticking the rubric — as in the exam, the
// points come for the aspects that matter, not for the wording.

/* ---------------------------------------------------------------- One task */

let nmSeq = 0;
function nmMake(genId) {
  const g = NUMA_TASKS.find((x) => x.id === genId);
  const t = g.make();
  t.gen = g;
  t.uid = "nm" + ++nmSeq;
  // Fixed choices (Ja / Nein, (i) / (ii) / (iii)) keep a fixed order that does not give the answer away.
  t.parts.forEach((p) => {
    if (p.kind !== "mc") return;
    const idx = p.mc.map((_, i) => i);
    p.order = p.fixed ? idx.sort((a, b) => String(p.mc[a]).localeCompare(String(p.mc[b]), "de")) : shuffle(idx);
  });
  t.max = t.parts.reduce((s, p) => s + p.pts, 0);
  return t;
}

// Numbers as typed: −3/4, 0,75, 2.2e-16, 2,2 · 10^-16, √2.
function nmParseNum(s) {
  let t = String(s).trim().replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/(\d),(\d)/g, "$1.$2");
  t = t.replace(/[·*×x]10\^?\(?(-?\d+)\)?$/i, "e$1").replace(/^10\^\(?(-?\d+)\)?$/, "1e$1");
  let m;
  if ((m = t.match(/^(-?\d*\.?\d+(?:e-?\d+)?)\/(-?\d*\.?\d+(?:e-?\d+)?)$/i))) return +m[1] / +m[2];
  if ((m = t.match(/^(-?)√\(?(\d*\.?\d+)\)?$/))) return (m[1] ? -1 : 1) * Math.sqrt(+m[2]);
  return /^-?\d*\.?\d+(e-?\d+)?$/i.test(t) ? +t : null;
}
const nmParseList = (s) => {
  const t = String(s).replace(/[()[\]{}]/g, "").trim();
  if (!t) return [];
  return (t.includes(";") ? t.split(";") : t.includes("|") ? t.split("|") : /\s/.test(t.replace(/\s*\/\s*/g, "/")) ? t.replace(/\s*\/\s*/g, "/").split(/\s+/) : [t]).map((x) => x.trim()).filter(Boolean);
};
const nmNumOk = (x, y) => x !== null && y !== null && Math.abs(x - y) <= Math.max(0.0051, Math.abs(y) * 0.004);
function nmValOk(typed, ans) {
  const got = nmParseList(typed);
  return ans.some((a) => {
    const want = nmParseList(a);
    if (got.length !== want.length) return false;
    return want.every((w, i) => {
      const x = nmParseNum(got[i]), y = nmParseNum(w);
      return y === null ? got[i].toLowerCase() === w.toLowerCase() : nmNumOk(x, y);
    });
  });
}
// A right answer as shown: decimal commas, real minus signs.
const nmAnsHTML = (a) => String(a).split(";").map((x) => x.trim().replace(/-/g, "−").replace(/(\d)\.(\d)/g, "$1,$2")).join("; ");

// The old exam a task is modelled on.
function nmLike(g) {
  const [id, n] = g.like.split("/");
  const e = NUMA_EXAMS.find((x) => x.id === id);
  const et = e && e.tasks.find((x) => x.n === +n);
  return e ? { e, n, page: et ? et.page : 1, solPage: et ? et.solPage : null } : null;
}

function nmPartHTML(p, i) {
  return `
    <div class="lp-part pm-part pm-${p.kind}" data-i="${i}">
      <span class="lp-letter">${"abcdefghij"[i]})</span>
      <div class="lp-ask">${p.ask}</div>
      <span class="lp-pts small muted">${String(p.pts).replace(".", ",")} P</span>
      ${p.kind === "mc" ? `<div class="lp-mc">${p.order.map((k) => `<button type="button" class="lp-opt" data-k="${k}">${p.mc[k]}</button>`).join("")}</div>` : ""}
      ${p.kind === "val" ? `<label class="lp-in pm-in"><input type="text" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Antwort" placeholder="Antwort"></label>` : ""}
      ${p.kind === "write" ? `<textarea class="pm-ta nm-ta" rows="4" spellcheck="false" aria-label="Deine Antwort" placeholder="Hier aufschreiben — oder auf Papier."></textarea>
        <div class="pm-model" hidden>
          <div class="nm-model"><span class="nm-model-cap">Musterlösung</span>${p.model}</div>
          <div class="pm-rub">
            <span class="small muted">Selbst bewerten: hak ab, was deine Antwort enthält.</span>
            ${p.rubric.map(([pts, say], k) => `<label class="pm-rub-i"><input type="checkbox" data-k="${k}"><span>${say}</span><b>${String(pts).replace(".", ",")} P</b></label>`).join("")}
          </div>
        </div>` : ""}
      <div class="lp-mark"></div>
      ${p.why ? `<div class="pm-why small" hidden>${p.why}</div>` : ""}
    </div>`;
}

function nmTaskHTML(t, { exam = false, num = "" } = {}) {
  const like = nmLike(t.gen);
  return `
    <div class="lp-task pm-task" id="${t.uid}">
      <div class="lp-head">
        ${nmTopicPill(t.gen.topic)}<h3>${num ? `<span class="muted">${num}</span> ` : ""}${t.gen.name}</h3>
        <span class="lp-max small muted">${String(t.max).replace(".", ",")} P</span>
      </div>
      ${like && !exam ? `<p class="small muted pm-like">Wie ${like.e.sem}, Aufgabe ${like.n} ·
        <a href="${like.e.file}#page=${like.page}" target="_blank" rel="noopener">die echte ↗</a>${like.e.sol ? ` ·
        <a href="${like.e.sol}${like.solPage ? `#page=${like.solPage}` : ""}" target="_blank" rel="noopener">ihre Lösung ↗</a>` : ""}</p>` : ""}
      <div class="pm-intro">${t.intro}</div>
      <div class="lp-parts">${t.parts.map(nmPartHTML).join("")}</div>
      <p class="lp-sum pm-sum" hidden></p>
      ${exam ? "" : `
        <div class="lp-actions">
          <button class="btn primary" type="button" data-a="check">Prüfen</button>
          <button class="btn" type="button" data-a="sol">Lösung zeigen</button>
          <button class="btn" type="button" data-a="again">Neue Zahlen</button>
          <button class="btn" type="button" data-a="other">Andere Aufgabe</button>
        </div>`}
    </div>`;
}

function nmWire(el, t, onTick) {
  $$(".lp-mc", el).forEach((mc) => $$(".lp-opt", mc).forEach((b) => (b.onclick = () => {
    if (mc.classList.contains("locked")) return;
    $$(".lp-opt", mc).forEach((o) => o.classList.toggle("picked", o === b));
  })));
  $$(".pm-in input", el).forEach((inp) => (inp.onkeydown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    $('[data-a="check"]', el)?.click();
  }));
  $$(".pm-rub input", el).forEach((cb) => (cb.onchange = () => { nmSelfMark(el, t); onTick && onTick(); }));
}

// The written parts' points from the ticked rubric.
function nmSelfMark(el, t) {
  let got = 0, max = 0;
  t.parts.forEach((p, i) => {
    if (p.kind !== "write") return;
    const row = $(`.lp-part[data-i="${i}"]`, el);
    const pts = $$(".pm-rub input", row).reduce((s, cb) => s + (cb.checked ? p.rubric[+cb.dataset.k][0] : 0), 0);
    got += pts;
    max += p.pts;
    const open = !$(".pm-model", row).hidden;
    row.classList.toggle("ok", open && pts === p.pts);
    $(".lp-mark", row).innerHTML = open ? `<span class="${pts === p.pts ? "lp-ok" : "muted"}">${pts} / ${p.pts} P</span>` : "";
  });
  return { got, max };
}

// Marks the values and choices, opens the model answers, and returns the points so far.
function nmGrade(el, t, { lock = false } = {}) {
  let got = 0, max = 0;
  t.parts.forEach((p, i) => {
    const row = $(`.lp-part[data-i="${i}"]`, el);
    const why = $(".pm-why", row);
    if (p.kind === "write") {
      $(".pm-model", row).hidden = false;
      if (lock) $(".pm-ta", row).readOnly = true;
      if (why) why.hidden = false;
      return;
    }
    max += p.pts;
    let ok = false, answered;
    if (p.kind === "mc") {
      const picked = $(".lp-opt.picked", row);
      answered = !!picked;
      ok = !!picked && +picked.dataset.k === 0;
      $$(".lp-opt", row).forEach((o) => o.classList.toggle("right", +o.dataset.k === 0 && (ok || lock)));
      $$(".lp-opt", row).forEach((o) => o.classList.toggle("wrong", o === picked && !ok));
      if (lock) $(".lp-mc", row).classList.add("locked");
    } else {
      const inp = $("input", row);
      answered = inp.value.trim() !== "";
      ok = answered && nmValOk(inp.value, p.ans);
      inp.classList.toggle("right", ok);
      inp.classList.toggle("wrong", answered && !ok);
      if (lock) inp.readOnly = true;
    }
    if (ok) got += p.pts;
    row.classList.toggle("ok", ok);
    row.classList.toggle("bad", !ok && (answered || lock));
    $(".lp-mark", row).innerHTML = ok ? `<span class="lp-ok">✓</span>`
      : !answered && !lock ? ""
      : `<span class="lp-no">✗</span> ${p.kind === "mc" ? (lock ? "Die richtige ist markiert." : "Nicht diese.") : lock ? `Richtig: <b>${nmAnsHTML(p.ans[0])}</b>` : "Noch nicht."}`;
    if (why) why.hidden = !(ok || lock);
  });
  const self = nmSelfMark(el, t);
  return { got, max, self: self.got, selfMax: self.max };
}

/* ---------------------------------------------------------------- Practice */

const nmView = { topic: "all", task: null, marked: null };
const nmSolved = () => store.get("numaTaskSolved", {});
const nmTopicsWithTasks = () => NUMA_EXAM_TOPIC_IDS.filter((t) => NUMA_TASKS.some((g) => g.topic === t));
const nmPool = () => NUMA_TASKS.filter((g) => nmView.topic === "all" || g.topic === nmView.topic);

function nmNew(genId) {
  const pool = nmPool();
  const others = pool.filter((g) => !nmView.task || pool.length === 1 || g.id !== nmView.task.gen.id);
  nmView.task = nmMake(genId || pick(others.length ? others : NUMA_TASKS).id);
  nmView.marked = null;
  track("numa.task");
  renderNumaPractice();
}

// From Old exams' "Üben": the tasks of one topic.
function openNumaTasks(topic) {
  nmView.topic = topic;
  nmView.task = null;
  showTab("numa-practice");
  renderNumaPractice();
  window.scrollTo({ top: 0 });
}

function nmSumText(r, t) {
  const total = r.got + r.self;
  return `${total} / ${t.max} P <span class="small muted">· von der Seite geprüft ${r.got} / ${r.max} · selbst bewertet ${r.self} / ${r.selfMax}</span>${total === t.max ? " — alles richtig!" : ""}`;
}

function renderNumaPractice() {
  const v = nmView;
  if (!v.task) return nmNew();
  const solved = nmSolved();
  const count = (t) => NUMA_TASKS.filter((g) => t === "all" || g.topic === t).length;
  $("#numa-practice").innerHTML = `
    <div class="card hero">
      <h1>Übungs<span class="accent">aufgaben</span></h1>
      <p>Aufgaben wie in den Altklausuren, jedes Mal mit neuen Zahlen. Zahlen und Auswahlfragen prüft die Seite — Brüche wie <code>-3/4</code>,
        Dezimalzahlen mit Komma oder Punkt, mehrere Werte durch <code>;</code> getrennt. Beweise und Erklärungen schreibst du selbst und bewertest sie mit der Musterlösung.</p>
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Thema</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">Alle · ${count("all")}</button>
          ${nmTopicsWithTasks().map((t) => `<button class="chip ${v.topic === t ? "active" : ""}" data-topic="${t}" style="--gc:${NUMA_EXAM_TOPICS[t].color}">${NUMA_EXAM_TOPICS[t].name} · ${count(t)}</button>`).join("")}
        </div>
      </div>
    </div>
    <div class="card lp-card">${nmTaskHTML(v.task)}</div>
    <div class="card">
      <h2>Alle Aufgaben</h2>
      <p class="small muted">Jede ist einer Aufgabe aus einer Altklausur nachgebaut; die Zahl zählt, wie oft du sie ganz richtig hattest.</p>
      <div class="lp-gens">
        ${nmPool().map((g) => `
          <button type="button" class="lp-gen ${v.task.gen.id === g.id ? "on" : ""}" data-gen="${g.id}">
            ${nmTopicPill(g.topic)}<b>${g.name}</b>
            <span class="lp-gen-n ${solved[g.id] ? "has" : ""}">${solved[g.id] || 0}×</span>
          </button>`).join("")}
      </div>
    </div>`;
  $$("#numa-practice [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; nmNew(); }));
  $$("#numa-practice [data-gen]").forEach((b) => (b.onclick = () => {
    nmNew(b.dataset.gen);
    $("#numa-practice .lp-card").scrollIntoView({ block: "start" });
    window.scrollBy(0, -barHeight() - 10);
  }));

  const t = v.task, el = $("#" + t.uid);
  const sum = $(".pm-sum", el);
  const show = () => {
    if (!v.marked) return;
    const s = nmSelfMark(el, t);
    v.marked.self = s.got;
    sum.hidden = false;
    sum.className = "lp-sum pm-sum" + (v.marked.got + s.got === t.max ? " ok" : "");
    sum.innerHTML = nmSumText(v.marked, t);
    if (v.marked.got + s.got === t.max && !t.counted) {
      t.counted = true;
      const all = nmSolved();
      store.set("numaTaskSolved", { ...all, [t.gen.id]: (all[t.gen.id] || 0) + 1 });
    }
  };
  nmWire(el, t, show);
  $('[data-a="check"]', el).onclick = () => { v.marked = nmGrade(el, t); show(); };
  $('[data-a="sol"]', el).onclick = () => { v.marked = nmGrade(el, t, { lock: true }); show(); $('[data-a="check"]', el).disabled = true; };
  $('[data-a="again"]', el).onclick = () => nmNew(t.gen.id);
  $('[data-a="other"]', el).onclick = () => nmNew();
}

/* ---------------------------------------------------------------- Mock exam */

const NM_MOCK_TOPICS = nmTopicsWithTasks();
// Like a real exam: LR and quadrature, and four more topics.
const nmExamLike = () => new Set(["lr", "quad", ...shuffle(NM_MOCK_TOPICS.filter((t) => t !== "lr" && t !== "quad")).slice(0, 4)]);
const nmMock = { phase: "setup", topics: nmExamLike(), perPt: 2, tasks: [], minutes: 0, end: 0, timer: 0, result: null, last: {} };

function renderNumaMock() {
  const s = nmMock;
  if (s.phase === "run") return nmRenderRun();
  if (s.phase === "done") return nmRenderDone();
  const best = store.get("numaMock", {});
  $("#numa-mock").innerHTML = `
    <div class="card hero">
      <h1>Probe<span class="accent">klausur</span></h1>
      <p>Gebaut wie die Altklausuren: sechs Aufgaben mit je mehreren Teilen — LR-Zerlegung und Quadratur sind immer dabei, dazu vier weitere Themen.
        Jede Aufgabe ist neu, mit neuen Zahlen. Bewertet wird erst bei der Abgabe.</p>
      <p class="small">Die Dauer der echten Klausur steht nicht in den Unterlagen; stell die Zeit pro Punkt unten passend ein. Nach der Abgabe prüft die Seite Zahlen und Auswahlfragen; für Beweise und Erklärungen zeigt sie die Musterlösung — hak ab, was deine Antwort enthält.</p>
      ${best.best !== undefined ? `<p class="small">Bisher am besten: <b>${best.best} %</b> (${best.runs || 1} Probeklausur${(best.runs || 1) === 1 ? "" : "en"}).</p>` : ""}
    </div>
    <div class="card">
      <h2>Themen</h2>
      <div class="chips pm-mock-parts">
        <button class="chip" data-set="exam">Wie eine Klausur (neu mischen)</button>
        <button class="chip ${s.topics.size === NM_MOCK_TOPICS.length ? "active" : ""}" data-set="all">Alle Themen</button>
      </div>
      <div class="chips">${NM_MOCK_TOPICS.map((t) => `<button class="chip ${s.topics.has(t) ? "active" : ""}" data-topic="${t}" style="--gc:${NUMA_EXAM_TOPICS[t].color}">${s.topics.has(t) ? "✓ " : ""}${NUMA_EXAM_TOPICS[t].name}</button>`).join("")}</div>
      <div class="len-filter-row nm-perpt">
        <span class="len-filter-cap">Zeit</span>
        <div class="seg" id="nmPerPt">${[[1.5, "1,5 min"], [2, "2 min"], [2.5, "2,5 min"]].map(([v, l]) => `<button type="button" data-v="${v}" class="${s.perPt === v ? "active" : ""}">${l}</button>`).join("")}</div>
        <span class="small muted">pro Punkt</span>
      </div>
      <div class="home-actions lm-start">
        <button class="btn primary" type="button" id="nmStart" ${s.topics.size ? "" : "disabled"}>Probeklausur starten · ${s.topics.size} Aufgaben</button>
      </div>
      <p class="small muted">Wie in der Klausur ohne Unterlagen: rechne auf Papier, tipp die Ergebnisse ein.</p>
    </div>`;
  $$("#numa-mock [data-topic]").forEach((b) => (b.onclick = () => {
    s.topics.has(b.dataset.topic) ? s.topics.delete(b.dataset.topic) : s.topics.add(b.dataset.topic);
    renderNumaMock();
  }));
  $$("#numa-mock [data-set]").forEach((b) => (b.onclick = () => { s.topics = b.dataset.set === "all" ? new Set(NM_MOCK_TOPICS) : nmExamLike(); renderNumaMock(); }));
  $$("#nmPerPt button").forEach((b) => (b.onclick = () => { s.perPt = +b.dataset.v; renderNumaMock(); }));
  $("#nmStart").onclick = nmStart;
}

function nmStart() {
  const s = nmMock;
  track("numa.mock");
  // Mostly computing tasks; at most one fill-in text per exam, like the real ones.
  let gaps = 0;
  s.tasks = shuffle(NM_MOCK_TOPICS.filter((t) => s.topics.has(t))).map((topic) => {
    const gs = NUMA_TASKS.filter((g) => g.topic === topic && (!g.gap || gaps === 0));
    const fresh = gs.filter((g) => g.id !== s.last[topic]);
    const g = pick(fresh.length ? fresh : gs);
    if (g.gap) gaps++;
    s.last[topic] = g.id;
    return nmMake(g.id);
  }).sort((a, b) => NM_MOCK_TOPICS.indexOf(a.gen.topic) - NM_MOCK_TOPICS.indexOf(b.gen.topic));
  s.minutes = Math.round(s.tasks.reduce((a, t) => a + t.max, 0) * s.perPt);
  s.end = Date.now() + s.minutes * 60000;
  s.phase = "run";
  renderNumaMock();
  window.scrollTo({ top: 0 });
}

function nmRenderRun() {
  const s = nmMock;
  const total = s.tasks.reduce((a, t) => a + t.max, 0);
  $("#numa-mock").innerHTML = `
    <div class="lm-bar">
      <span class="lm-clock" id="nmClock"></span>
      <span class="small muted">${s.tasks.length} Aufgaben · ${total} Punkte</span>
      <button class="btn primary" type="button" id="nmSubmit">Abgeben</button>
    </div>
    ${s.tasks.map((t, k) => `<div class="card lm-task pm-mock-task">${nmTaskHTML(t, { exam: true, num: `Aufgabe ${k + 1} ·` })}</div>`).join("")}
    <div class="home-actions lm-end"><button class="btn primary" type="button" id="nmSubmit2">Abgeben</button></div>`;
  s.tasks.forEach((t) => nmWire($("#" + t.uid), t, nmUpdateResult));
  const submit = () => { if (confirm("Probeklausur jetzt abgeben?")) nmFinish(); };
  $("#nmSubmit").onclick = submit;
  $("#nmSubmit2").onclick = submit;
  clearInterval(s.timer);
  const tick = () => {
    const left = Math.max(0, s.end - Date.now());
    const clock = $("#nmClock");
    if (clock) {
      clock.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
      clock.classList.toggle("low", left < 10 * 60000);
    }
    if (!left) { clearInterval(s.timer); nmFinish(true); }
  };
  tick();
  s.timer = setInterval(tick, 1000);
}

function nmFinish(timeUp = false) {
  const s = nmMock;
  clearInterval(s.timer);
  track("numa.mockDone");
  s.result = { timeUp, used: Math.round((s.minutes * 60000 - Math.max(0, s.end - Date.now())) / 60000), per: s.tasks.map((t) => ({ t, ...nmGrade($("#" + t.uid), t, { lock: true }) })) };
  const prev = store.get("numaMock", {});
  store.set("numaMock", { best: prev.best ?? 0, runs: (prev.runs || 0) + 1 });
  s.phase = "done";
  nmRenderDone();
  window.scrollTo({ top: 0 });
}

function nmRenderDone() {
  const s = nmMock;
  const tasks = $$("#numa-mock .pm-mock-task");
  $("#numa-mock").innerHTML = `<div class="card hero lm-result" id="nmResult"></div>`;
  tasks.forEach((el) => $("#numa-mock").appendChild(el));
  $("#numa-mock").insertAdjacentHTML("beforeend", `<div class="home-actions lm-end"><button class="btn primary" type="button" data-again>Neue Probeklausur</button></div>`);
  nmUpdateResult();
  $$("#numa-mock [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; s.topics = nmExamLike(); renderNumaMock(); window.scrollTo({ top: 0 }); }));
}

function nmUpdateResult() {
  const s = nmMock, r = s.result, box = $("#nmResult");
  if (s.phase !== "done" || !box) return;
  r.per.forEach((x) => { const m = nmSelfMark($("#" + x.t.uid), x.t); x.self = m.got; });
  const got = r.per.reduce((a, x) => a + x.got + x.self, 0), max = r.per.reduce((a, x) => a + x.t.max, 0);
  const auto = r.per.reduce((a, x) => a + x.got, 0), autoMax = r.per.reduce((a, x) => a + x.max, 0);
  const self = r.per.reduce((a, x) => a + x.self, 0), selfMax = r.per.reduce((a, x) => a + x.selfMax, 0);
  const pct = Math.round((got / max) * 100);
  const prev = store.get("numaMock", {});
  if (pct > (prev.best ?? -1)) store.set("numaMock", { ...prev, best: pct });
  box.innerHTML = `
    <h1>${got} / ${max} Punkte <span class="${pct >= 50 ? "lm-pass" : "lm-fail"}">· ${pct} %</span></h1>
    <p>${r.timeUp ? "Die Zeit war um — abgegeben wurde, was bis dahin dastand. " : ""}Gebraucht: ${r.used} von ${s.minutes} min.
      Von der Seite geprüft: <b>${auto} / ${autoMax}</b>. Selbst bewertet: <b>${self} / ${selfMax}</b>${self === 0 && selfMax ? " — hak unter jeder Musterlösung ab, was du hattest" : ""}.</p>
    <div class="lm-per">${r.per.map((x) => `
      <div class="lm-row pm-row">${nmTopicPill(x.t.gen.topic)}<span class="lw-bar"><span style="width:${((x.got + x.self) / x.t.max) * 100}%"></span></span><b>${x.got + x.self} / ${x.t.max}</b>
        <button class="btn small-btn" type="button" data-practise="${x.t.gen.topic}">Üben</button></div>`).join("")}</div>
    <div class="home-actions"><button class="btn primary" type="button" data-again>Neue Probeklausur</button></div>`;
  $$("#nmResult [data-practise]").forEach((b) => (b.onclick = () => openNumaTasks(b.dataset.practise)));
  $$("#nmResult [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; s.topics = nmExamLike(); renderNumaMock(); window.scrollTo({ top: 0 }); }));
}
