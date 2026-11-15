// GKI Practice and mock exam. Practice shows one exam task at a time (gki-tasks.js), filtered by
// topic; the mock exam puts tasks together like a real exam since SS 24: "Allgemeine Fragen" first,
// then five topic tasks, about 75 points in 90 minutes — or only what the lecture has covered so far.
// Marking reuses NuMa's (numa-mock.js): nmPartHTML, nmWire, nmGrade and nmSelfMark work on any task
// made of nmMC / nmVal / nmW parts.

/* ---------------------------------------------------------------- One task */

let gkSeq = 0;
function gkMake(genId, onlyTaught = false) {
  const g = GKI_TASKS.find((x) => x.id === genId);
  const t = g.make(onlyTaught);
  t.gen = g;
  t.uid = "gk" + ++gkSeq;
  t.parts.forEach((p) => {
    if (p.kind !== "mc") return;
    const idx = p.mc.map((_, i) => i);
    p.order = p.fixed ? idx.sort((a, b) => String(p.mc[a]).localeCompare(String(p.mc[b]), "de")) : shuffle(idx);
  });
  t.max = t.parts.reduce((s, p) => s + p.pts, 0);
  return t;
}

// The old exam a task is modelled on, or what else it comes from (an exercise sheet, a slide).
function gkLikeHTML(g) {
  if (!g.like) return g.likeText ? `<p class="small muted pm-like">Wie ${g.likeText}</p>` : "";
  const [id, n] = g.like.split("/");
  const e = GKI_EXAMS.find((x) => x.id === id);
  const et = e && e.tasks.find((x) => x.n === +n);
  if (!e) return "";
  return `<p class="small muted pm-like">Wie ${e.sem}, Aufgabe ${n} · <a href="${e.file}#page=${et ? et.page : 1}" target="_blank" rel="noopener">die echte ↗</a>${e.solFile && et && et.solPage ? ` · <a href="${e.solFile}#page=${et.solPage}" target="_blank" rel="noopener">ihre Lösung ↗</a>` : ""}</p>`;
}

function gkTaskHTML(t, { exam = false, num = "" } = {}) {
  const later = !gkTaught(t.gen.topic);
  return `
    <div class="lp-task pm-task" id="${t.uid}">
      <div class="lp-head">
        ${gkTopicPill(t.gen.topic)}<h3>${num ? `<span class="muted">${num}</span> ` : ""}${t.gen.name}</h3>
        <span class="lp-max small muted">${String(t.max).replace(".", ",")} P</span>
      </div>
      ${exam ? "" : gkLikeHTML(t.gen)}
      ${later && !exam ? `<p class="small gk-later-note">Kommt erst in ${gkTopicVL(t.gen.topic)} — die Aufgabe ist wie in den Altklausuren; die Erklärung steht in der Lösung.</p>` : ""}
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

/* ---------------------------------------------------------------- Practice */

const gkView = { topic: "all", taught: false, task: null, marked: null };
const gkSolved = () => store.get("gkiTaskSolved", {});
// Topics with tasks, in the exam's order, "Allgemeine Fragen" first.
const gkTaskTopics = () => ["allg", ...GKI_EXAM_TOPIC_IDS].filter((t) => GKI_TASKS.some((g) => g.topic === t));
const gkTopicName = (t) => (GKI_EXAM_TOPICS[t] ? GKI_EXAM_TOPICS[t].name : "Allgemeine Fragen");
const gkPool = () => GKI_TASKS.filter((g) => (gkView.topic === "all" || g.topic === gkView.topic) && (!gkView.taught || gkTaught(g.topic)));

function gkNew(genId) {
  const pool = gkPool().length ? gkPool() : GKI_TASKS;
  const others = pool.filter((g) => !gkView.task || pool.length === 1 || g.id !== gkView.task.gen.id);
  gkView.task = gkMake(genId || pick(others.length ? others : pool).id, gkView.taught);
  gkView.marked = null;
  track("gki.task");
  renderGkiPractice();
}

// From Old exams' "Üben": the tasks of one topic.
function openGkiTasks(topic) {
  gkView.topic = topic;
  gkView.taught = false;
  gkView.task = null;
  showTab("gki-practice");
  renderGkiPractice();
  window.scrollTo({ top: 0 });
}

function renderGkiPractice() {
  const v = gkView;
  if (!v.task) return gkNew();
  const solved = gkSolved();
  const count = (t) => GKI_TASKS.filter((g) => (t === "all" || g.topic === t) && (!v.taught || gkTaught(g.topic))).length;
  $("#gki-practice").innerHTML = `
    <div class="card hero">
      <h1>Übungs<span class="accent">aufgaben</span></h1>
      <p>Aufgaben wie in den Altklausuren, jedes Mal mit neuen Zahlen — nicht nur zum bisherigen Stoff, sondern auch die Rechenaufgaben, die in jeder Klausur kommen (A*, Q-Learning, HMM, k-Means, CNN-Größen …).
        Zahlen und Auswahlfragen prüft die Seite — Brüche wie <code>4/13</code>, Dezimalzahlen mit Komma oder Punkt, mehrere Werte durch <code>;</code> getrennt, Buchstabenfolgen wie <code>S A C G</code>.
        Erklärungen schreibst du selbst und bewertest sie mit der Musterlösung. Die Klausur erlaubt keinen Taschenrechner: wo σ, e oder ln nötig sind, steht ein Hinweis dabei.</p>
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Thema</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">Alle · ${count("all")}</button>
          ${gkTaskTopics().filter((t) => !v.taught || gkTaught(t)).map((t) => `<button class="chip ${v.topic === t ? "active" : ""} ${gkTaught(t) ? "" : "gk-later"}" data-topic="${t}" style="--gc:${GKI_EXAM_TOPICS[t] ? GKI_EXAM_TOPICS[t].color : "var(--muted)"}">${gkTopicName(t)} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="gkPracTaught" ${v.taught ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Nur schon behandelter Stoff (VL 1–${GKI_VL_DONE})</span></label>
    </div>
    <div class="card lp-card">${gkTaskHTML(v.task)}</div>
    <div class="card">
      <h2>Alle Aufgaben</h2>
      <p class="small muted">Jede ist einer Aufgabe aus einer Altklausur, dem Übungsblatt oder den Folien nachgebaut; die Zahl zählt, wie oft du sie ganz richtig hattest. Blass: kommt erst noch in der Vorlesung.</p>
      <div class="lp-gens">
        ${gkPool().map((g) => `
          <button type="button" class="lp-gen ${v.task.gen.id === g.id ? "on" : ""} ${gkTaught(g.topic) ? "" : "gk-later"}" data-gen="${g.id}">
            ${gkTopicPill(g.topic)}<b>${g.name}</b>
            <span class="lp-gen-n ${solved[g.id] ? "has" : ""}">${solved[g.id] || 0}×</span>
          </button>`).join("")}
      </div>
    </div>`;
  $$("#gki-practice [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; gkNew(); }));
  $("#gkPracTaught").onchange = (ev) => { v.taught = ev.target.checked; if (v.taught && v.topic !== "all" && !gkTaught(v.topic)) v.topic = "all"; gkNew(); };
  $$("#gki-practice [data-gen]").forEach((b) => (b.onclick = () => {
    gkNew(b.dataset.gen);
    $("#gki-practice .lp-card").scrollIntoView({ block: "start" });
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
      const all = gkSolved();
      store.set("gkiTaskSolved", { ...all, [t.gen.id]: (all[t.gen.id] || 0) + 1 });
    }
  };
  nmWire(el, t, show);
  $('[data-a="check"]', el).onclick = () => { v.marked = nmGrade(el, t); show(); };
  $('[data-a="sol"]', el).onclick = () => { v.marked = nmGrade(el, t, { lock: true }); show(); $('[data-a="check"]', el).disabled = true; };
  $('[data-a="again"]', el).onclick = () => gkNew(t.gen.id);
  $('[data-a="other"]', el).onclick = () => gkNew();
}

/* ---------------------------------------------------------------- Mock exam */

const GK_MOCK_TOPICS = GKI_EXAM_TOPIC_IDS.filter((t) => GKI_TASKS.some((g) => g.topic === t));
// Like a real exam since SS 24: "Allgemeine Fragen", search and RL (in almost every exam), three more.
const gkExamLike = () => new Set(["allg", "search", "rl", ...shuffle(GK_MOCK_TOPICS.filter((t) => t !== "search" && t !== "rl")).slice(0, 3)]);
const gkSoFar = () => new Set(["allg", ...GK_MOCK_TOPICS.filter(gkTaught)]);
const gkMock = { phase: "setup", topics: gkExamLike(), taught: false, perPt: 1.2, tasks: [], minutes: 0, end: 0, timer: 0, result: null, last: {} };

function renderGkiMock() {
  const s = gkMock;
  if (s.phase === "run") return gkRenderRun();
  if (s.phase === "done") return gkRenderDone();
  const best = store.get("gkiMock", {});
  const chip = (t) => `<button class="chip ${s.topics.has(t) ? "active" : ""} ${gkTaught(t) ? "" : "gk-later"}" data-topic="${t}" style="--gc:${GKI_EXAM_TOPICS[t] ? GKI_EXAM_TOPICS[t].color : "var(--muted)"}">${s.topics.has(t) ? "✓ " : ""}${gkTopicName(t)}</button>`;
  $("#gki-mock").innerHTML = `
    <div class="card hero">
      <h1>Probe<span class="accent">klausur</span></h1>
      <p>Gebaut wie die Klausuren seit SS 24: zuerst „Allgemeine Fragen“ quer durch den Stoff, dann fünf Themen — Suche und Reinforcement Learning sind immer dabei, dazu drei weitere; ist eine Aufgabe kürzer als in der Klausur, kommt eine zweite zum selben Thema dazu. Jede Aufgabe ist neu, mit neuen Zahlen. Bewertet wird erst bei der Abgabe.</p>
      <p class="small">Die echte Klausur: 90 Minuten, zuletzt 75 Punkte — das sind 1,2 Minuten pro Punkt. Nach der Abgabe prüft die Seite Zahlen und Auswahlfragen; für Erklärungen zeigt sie die Musterlösung — hak ab, was deine Antwort enthält.</p>
      ${best.best !== undefined ? `<p class="small">Bisher am besten: <b>${best.best} %</b> (${best.runs || 1} Probeklausur${(best.runs || 1) === 1 ? "" : "en"}).</p>` : ""}
    </div>
    <div class="card">
      <h2>Themen</h2>
      <div class="chips pm-mock-parts">
        <button class="chip" data-set="exam">Wie eine Klausur (neu mischen)</button>
        <button class="chip ${s.taught ? "active" : ""}" data-set="sofar">Nur bisheriger Stoff (VL 1–${GKI_VL_DONE})</button>
        <button class="chip ${s.topics.size === GK_MOCK_TOPICS.length + 1 && !s.taught ? "active" : ""}" data-set="all">Alle Themen</button>
      </div>
      <div class="chips">${chip("allg")}${GK_MOCK_TOPICS.map(chip).join("")}</div>
      <div class="len-filter-row nm-perpt">
        <span class="len-filter-cap">Zeit</span>
        <div class="seg" id="gkPerPt">${[[1.2, "1,2 min (wie die Klausur)"], [1.5, "1,5 min"], [2, "2 min"]].map(([v, l]) => `<button type="button" data-v="${v}" class="${s.perPt === v ? "active" : ""}">${l}</button>`).join("")}</div>
        <span class="small muted">pro Punkt</span>
      </div>
      <div class="home-actions lm-start">
        <button class="btn primary" type="button" id="gkStart" ${s.topics.size ? "" : "disabled"}>Probeklausur starten · ${s.topics.size} Aufgaben</button>
      </div>
      <p class="small muted">Wie in der Klausur ohne Unterlagen und ohne Taschenrechner: rechne auf Papier, tipp die Ergebnisse ein.</p>
    </div>`;
  $$("#gki-mock [data-topic]").forEach((b) => (b.onclick = () => {
    s.topics.has(b.dataset.topic) ? s.topics.delete(b.dataset.topic) : s.topics.add(b.dataset.topic);
    renderGkiMock();
  }));
  $$("#gki-mock [data-set]").forEach((b) => (b.onclick = () => {
    const k = b.dataset.set;
    s.taught = k === "sofar";
    s.topics = k === "all" ? new Set(["allg", ...GK_MOCK_TOPICS]) : k === "sofar" ? gkSoFar() : gkExamLike();
    renderGkiMock();
  }));
  $$("#gkPerPt button").forEach((b) => (b.onclick = () => { s.perPt = +b.dataset.v; renderGkiMock(); }));
  $("#gkStart").onclick = gkStart;
}

function gkStart() {
  const s = gkMock;
  track("gki.mock");
  const order = ["allg", ...GK_MOCK_TOPICS];
  // A real exam task has about 12 points; ours have 6 to 9, so a topic takes a second, different task
  // when the first is short (and the topic has one).
  s.tasks = order.filter((t) => s.topics.has(t)).flatMap((topic) => {
    const gs = GKI_TASKS.filter((g) => g.topic === topic);
    const fresh = gs.filter((g) => g.id !== s.last[topic]);
    const g = pick(fresh.length ? fresh : gs);
    s.last[topic] = g.id;
    const first = gkMake(g.id, s.taught), more = gs.filter((x) => x.id !== g.id);
    return first.max >= 10 || !more.length || s.topics.size > 7 ? [first] : [first, gkMake(pick(more).id, s.taught)];
  });
  s.minutes = Math.round(s.tasks.reduce((a, t) => a + t.max, 0) * s.perPt);
  s.end = Date.now() + s.minutes * 60000;
  s.phase = "run";
  renderGkiMock();
  window.scrollTo({ top: 0 });
}

function gkRenderRun() {
  const s = gkMock;
  const total = s.tasks.reduce((a, t) => a + t.max, 0);
  $("#gki-mock").innerHTML = `
    <div class="lm-bar">
      <span class="lm-clock" id="gkClock"></span>
      <span class="small muted">${s.tasks.length} Aufgaben · ${total} Punkte</span>
      <button class="btn primary" type="button" id="gkSubmit">Abgeben</button>
    </div>
    ${s.tasks.map((t, k) => `<div class="card lm-task pm-mock-task">${gkTaskHTML(t, { exam: true, num: `Aufgabe ${k + 1} ·` })}</div>`).join("")}
    <div class="home-actions lm-end"><button class="btn primary" type="button" id="gkSubmit2">Abgeben</button></div>`;
  s.tasks.forEach((t) => nmWire($("#" + t.uid), t, gkUpdateResult));
  const submit = () => { if (confirm("Probeklausur jetzt abgeben?")) gkFinish(); };
  $("#gkSubmit").onclick = submit;
  $("#gkSubmit2").onclick = submit;
  clearInterval(s.timer);
  const tick = () => {
    const left = Math.max(0, s.end - Date.now());
    const clock = $("#gkClock");
    if (clock) {
      clock.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
      clock.classList.toggle("low", left < 10 * 60000);
    }
    if (!left) { clearInterval(s.timer); gkFinish(true); }
  };
  tick();
  s.timer = setInterval(tick, 1000);
}

function gkFinish(timeUp = false) {
  const s = gkMock;
  clearInterval(s.timer);
  track("gki.mockDone");
  s.result = { timeUp, used: Math.round((s.minutes * 60000 - Math.max(0, s.end - Date.now())) / 60000), per: s.tasks.map((t) => ({ t, ...nmGrade($("#" + t.uid), t, { lock: true }) })) };
  const prev = store.get("gkiMock", {});
  store.set("gkiMock", { best: prev.best ?? 0, runs: (prev.runs || 0) + 1 });
  s.phase = "done";
  gkRenderDone();
  window.scrollTo({ top: 0 });
}

function gkRenderDone() {
  const s = gkMock;
  const tasks = $$("#gki-mock .pm-mock-task");
  $("#gki-mock").innerHTML = `<div class="card hero lm-result" id="gkResult"></div>`;
  tasks.forEach((el) => $("#gki-mock").appendChild(el));
  $("#gki-mock").insertAdjacentHTML("beforeend", `<div class="home-actions lm-end"><button class="btn primary" type="button" data-again>Neue Probeklausur</button></div>`);
  gkUpdateResult();
  $$("#gki-mock [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; s.topics = s.taught ? gkSoFar() : gkExamLike(); renderGkiMock(); window.scrollTo({ top: 0 }); }));
}

function gkUpdateResult() {
  const s = gkMock, r = s.result, box = $("#gkResult");
  if (s.phase !== "done" || !box) return;
  r.per.forEach((x) => { const m = nmSelfMark($("#" + x.t.uid), x.t); x.self = m.got; });
  const got = r.per.reduce((a, x) => a + x.got + x.self, 0), max = r.per.reduce((a, x) => a + x.t.max, 0);
  const auto = r.per.reduce((a, x) => a + x.got, 0), autoMax = r.per.reduce((a, x) => a + x.max, 0);
  const self = r.per.reduce((a, x) => a + x.self, 0), selfMax = r.per.reduce((a, x) => a + x.selfMax, 0);
  const pct = Math.round((got / max) * 100);
  const prev = store.get("gkiMock", {});
  if (pct > (prev.best ?? -1)) store.set("gkiMock", { ...prev, best: pct });
  box.innerHTML = `
    <h1>${got} / ${max} Punkte <span class="${pct >= 50 ? "lm-pass" : "lm-fail"}">· ${pct} %</span></h1>
    <p>${r.timeUp ? "Die Zeit war um — abgegeben wurde, was bis dahin dastand. " : ""}Gebraucht: ${r.used} von ${s.minutes} min. Bestanden ist die echte Klausur ab der Hälfte der Punkte.
      Von der Seite geprüft: <b>${auto} / ${autoMax}</b>. Selbst bewertet: <b>${self} / ${selfMax}</b>${self === 0 && selfMax ? " — hak unter jeder Musterlösung ab, was du hattest" : ""}.</p>
    <div class="lm-per">${r.per.map((x) => `
      <div class="lm-row pm-row">${gkTopicPill(x.t.gen.topic)}<span class="lw-bar"><span style="width:${((x.got + x.self) / x.t.max) * 100}%"></span></span><b>${x.got + x.self} / ${x.t.max}</b>
        <button class="btn small-btn" type="button" data-practise="${x.t.gen.topic}">Üben</button></div>`).join("")}</div>
    <div class="home-actions"><button class="btn primary" type="button" data-again>Neue Probeklausur</button></div>`;
  $$("#gkResult [data-practise]").forEach((b) => (b.onclick = () => openGkiTasks(b.dataset.practise)));
  $$("#gkResult [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; s.topics = s.taught ? gkSoFar() : gkExamLike(); renderGkiMock(); window.scrollTo({ top: 0 }); }));
}
