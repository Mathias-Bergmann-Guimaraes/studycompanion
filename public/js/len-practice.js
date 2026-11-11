// LEN exam practice: the Practice tab (one generated task at a time, filtered by topic and method,
// checked part by part with a worked solution) and the Mock exam tab (a timed exam in the real
// exams' layout, marked at the end). Tasks come from len-gen.js; topics and tags from len-exams.js.

/* ---------------------------------------------------------------- One task */

let lpSeq = 0;
// A fresh task from a generator, with its choices shuffled once.
function lpMake(genId) {
  const g = LEN_GENERATORS.find((x) => x.id === genId);
  const t = g.make();
  t.genId = genId;
  t.uid = "lp" + ++lpSeq;
  t.parts.forEach((p) => { if (p.mc) p.order = shuffle(p.mc.map((_, i) => i)); });
  t.max = t.parts.reduce((s, p) => s + p.pts, 0);
  return t;
}

// "1,5", "1.5", "−3", "3/4" and "2e-3" all read as numbers.
function lenParse(s) {
  s = String(s).trim().replace(/[−–]/g, "-").replace(/\s/g, "").replace(",", ".");
  if (!s) return null;
  if (/^[-+]?\d*\.?\d+\/[-+]?\d*\.?\d+$/.test(s)) { const [a, b] = s.split("/"); return +a / +b; }
  const v = Number(s);
  return isFinite(v) ? v : NaN;
}
// Right within rounding: 2 % (or the part's own tolerance), and a little absolute slack near zero.
const lenClose = (v, p) => Math.abs(v - p.ans) <= Math.max(Math.abs(p.ans) * (p.tol ?? 0.02), p.abs ?? 0.006);
const lenAnsText = (p) => `${nb(p.ans)}${p.unit ? " " + p.unit : ""}`;

function lpTaskHTML(t, { exam = false, num = "" } = {}) {
  return `
    <div class="lp-task" id="${t.uid}">
      <div class="lp-head">
        ${topicPill(t.topic)}<h3>${num ? `<span class="muted">${num}</span> ` : ""}${Lp(t.title)}</h3>
        <span class="lp-max small muted">${t.max} P</span>
      </div>
      <p class="lp-intro">${t.intro}</p>
      ${t.fig ? `<div class="lp-fig">${t.fig}</div>` : ""}
      <div class="lp-parts">
        ${t.parts.map((p, i) => `
          <div class="lp-part" data-i="${i}">
            <span class="lp-letter">${"abcdefghij"[i]})</span>
            <div class="lp-ask">${p.ask}</div>
            ${p.mc
              ? `<div class="lp-mc ${p.pics ? "pics" : ""}">${p.order.map((k) => `<button type="button" class="lp-opt" data-k="${k}">${p.mc[k]}</button>`).join("")}</div>`
              : `<label class="lp-in"><input type="text" inputmode="decimal" autocomplete="off" spellcheck="false" aria-label="${lt("Antwort", "Answer")}"><span class="lp-unit">${p.unit || ""}</span></label>`}
            <span class="lp-pts small muted">${p.pts} P</span>
            <div class="lp-mark"></div>
          </div>`).join("")}
      </div>
      ${exam ? "" : `
        <div class="lp-actions">
          <button class="btn primary" type="button" data-a="check">${L("Prüfen", "Check")}</button>
          <button class="btn" type="button" data-a="sol">${L("Lösung zeigen", "Show the solution")}</button>
          <button class="btn" type="button" data-a="again">${L("Neue Zahlen", "New numbers")}</button>
          <button class="btn" type="button" data-a="other">${L("Andere Aufgabe", "Another task")}</button>
        </div>`}
      <div class="lp-sol" hidden><h4>${L("Lösungsweg", "Worked solution")}</h4>${t.steps}</div>
    </div>`;
}

// Picking a choice; and Enter in a box jumps to the next one.
function lpWire(el) {
  $$(".lp-mc", el).forEach((mc) => $$(".lp-opt", mc).forEach((b) => (b.onclick = () => {
    if (mc.classList.contains("locked")) return;
    $$(".lp-opt", mc).forEach((o) => o.classList.toggle("picked", o === b));
  })));
  const ins = $$(".lp-in input", el);
  ins.forEach((inp, i) => (inp.onkeydown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (ins[i + 1]) ins[i + 1].focus();
    else $('[data-a="check"]', el)?.click();
  }));
}

// Marks every part, shows what was right, and returns the points.
function lpGrade(el, t, { lock = false } = {}) {
  let got = 0;
  t.parts.forEach((p, i) => {
    const row = $(`.lp-part[data-i="${i}"]`, el);
    const mark = $(".lp-mark", row);
    let ok = false, answered = true;
    if (p.mc) {
      const picked = $(".lp-opt.picked", row);
      answered = !!picked;
      ok = picked && +picked.dataset.k === 0;
      $$(".lp-opt", row).forEach((o) => o.classList.toggle("right", +o.dataset.k === 0 && (ok || lock)));
      if (picked && !ok) picked.classList.add("wrong");
      if (lock) $(".lp-mc", row).classList.add("locked");
    } else {
      const inp = $("input", row);
      const v = lenParse(inp.value);
      answered = v !== null;
      ok = v !== null && !isNaN(v) && lenClose(v, p);
      inp.classList.toggle("right", ok);
      inp.classList.toggle("wrong", answered && !ok);
      if (lock) inp.readOnly = true;
    }
    if (ok) got += p.pts;
    row.classList.toggle("ok", ok);
    row.classList.toggle("bad", !ok && answered);
    mark.innerHTML = ok ? `<span class="lp-ok">✓</span>`
      : !answered && !lock ? ""
      : `<span class="lp-no">✗</span> ${p.mc ? L("Richtig ist markiert.", "The right one is marked.") : `${L("Richtig", "Right")}: <b>${lenAnsText(p)}</b>`}`;
  });
  return got;
}

/* ---------------------------------------------------------------- Practice tab */

const lpView = { topic: "all", tag: null, task: null };
const lpSolved = () => store.get("lenSolved", {});

function lpPool() {
  return LEN_GENERATORS.filter((g) => (lpView.topic === "all" || g.topic === lpView.topic) && (!lpView.tag || g.tags.includes(lpView.tag)));
}

function lpNew(genId) {
  const pool = lpPool();
  const id = genId || (pool.length ? rPick(pool.filter((g) => !lpView.task || pool.length === 1 || g.id !== lpView.task.genId)).id : rPick(LEN_GENERATORS).id);
  lpView.task = lpMake(id);
  track("len.practice");
  renderLenPractice();
}

// From an old exam task's "Practise" button: its topic, and a method it shares with a generator.
function openLenPractice(topic, tags = []) {
  lpView.topic = topic;
  lpView.tag = tags.find((g) => LEN_GENERATORS.some((x) => x.topic === topic && x.tags.includes(g))) || null;
  lpView.task = null;
  showTab("len-practice");
  lpNew();
  window.scrollTo({ top: 0 });
}

function renderLenPractice() {
  const v = lpView;
  if (!v.task) return lpNew();
  const solved = lpSolved();
  const inTopic = LEN_GENERATORS.filter((g) => v.topic === "all" || g.topic === v.topic);
  const tags = [...new Set(inTopic.flatMap((g) => g.tags))];
  const pool = lpPool();
  $("#len-practice").innerHTML = `
    <div class="card hero">
      <h1>${L(`Übungs<span class="accent">aufgaben</span>`, `Practice <span class="accent">tasks</span>`)}</h1>
      <p>${L("Aufgaben wie in den Altklausuren, mit neuen Zahlen bei jedem Klick. Tipp deine Ergebnisse ein (Komma oder Punkt, auch Brüche wie 3/4), lass sie prüfen und schau dir den Lösungsweg an.",
        "Tasks like the ones in the old exams, with new numbers every time. Type in your results (comma or point, fractions like 3/4 work too), check them and look at the worked solution.")}</p>
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">${L("Thema", "Topic")}</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">${L("Alle", "All")}</button>
          ${LEN_TOPIC_IDS.map((t) => `<button class="chip ${v.topic === t ? "active" : ""}" data-topic="${t}" style="--gc:${LEN_TOPICS[t].color}">${L(LEN_TOPICS[t].de, LEN_TOPICS[t].en)}</button>`).join("")}
        </div>
      </div>
      ${tags.length ? `<div class="len-filter-row">
        <span class="len-filter-cap">${L("Methode", "Method")}</span>
        <div class="chips small-chips">${tags.map((g) => `<button class="chip ${v.tag === g ? "active" : ""}" data-tag="${g}">${L(LEN_TAGS[g][0], LEN_TAGS[g][1])}</button>`).join("")}</div>
      </div>` : ""}
    </div>
    <div class="card lp-card">${lpTaskHTML(v.task)}</div>
    <div class="card">
      <h2>${L("Alle Aufgabentypen", "Every kind of task")}</h2>
      <p class="small muted">${L("Die Zahl zählt, wie oft du eine Aufgabe dieses Typs komplett richtig hattest.", "The number counts how often you got a task of this kind fully right.")}</p>
      <div class="lp-gens">
        ${pool.map((g) => `
          <button type="button" class="lp-gen ${v.task.genId === g.id ? "on" : ""}" data-gen="${g.id}">
            ${topicPill(g.topic)}<b>${Lp(g.name)}</b>
            <span class="lp-gen-n ${solved[g.id] ? "has" : ""}">${solved[g.id] || 0}×</span>
          </button>`).join("") || `<p class="muted">${L("Kein Aufgabentyp passt zu diesem Filter.", "No kind of task matches this filter.")}</p>`}
      </div>
    </div>`;
  $$("#len-practice [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; v.tag = null; lpNew(); }));
  $$("#len-practice [data-tag]").forEach((b) => (b.onclick = () => { v.tag = v.tag === b.dataset.tag ? null : b.dataset.tag; lpNew(); }));
  $$("#len-practice [data-gen]").forEach((b) => (b.onclick = () => { lpNew(b.dataset.gen); $("#len-practice .lp-card").scrollIntoView({ block: "start" }); window.scrollBy(0, -barHeight() - 10); }));
  const el = $("#" + v.task.uid);
  lpWire(el);
  $('[data-a="check"]', el).onclick = () => {
    const got = lpGrade(el, v.task);
    if (got === v.task.max && !v.task.counted) {
      v.task.counted = true;
      const s = lpSolved();
      store.set("lenSolved", { ...s, [v.task.genId]: (s[v.task.genId] || 0) + 1 });
    }
    let sum = $(".lp-sum", el);
    if (!sum) { $(".lp-actions", el).insertAdjacentHTML("beforebegin", '<p class="lp-sum"></p>'); sum = $(".lp-sum", el); }
    sum.className = "lp-sum " + (got === v.task.max ? "ok" : "");
    sum.innerHTML = `${got} / ${v.task.max} P${got === v.task.max ? ` — ${L("alles richtig!", "all right!")}` : ""}`;
  };
  $('[data-a="sol"]', el).onclick = () => { const s = $(".lp-sol", el); s.hidden = !s.hidden; };
  $('[data-a="again"]', el).onclick = () => lpNew(v.task.genId);
  $('[data-a="other"]', el).onclick = () => lpNew();
}

/* ---------------------------------------------------------------- Mock exam tab */

// Each exam task: one generator picked from each group, in this order.
const MOCK_PLAN = {
  ok: [["reso"], ["locus"], ["theory-ok"]],
  net: [["mesh", "node"], ["star", "source", "match"], ["theory-net"]],
  ac: [["series", "power"], ["comp", "trafo"], ["theory-ac"]],
  bode: [["rc"], ["bodeid"], ["theory-bode"]],
  opv: [["inv", "noninv"], ["diff", "sum"], ["theory-opv"]],
};
const lmState = { phase: "setup", topics: new Set(LEN_TOPIC_IDS), tasks: [], end: 0, timer: 0, result: null };
const lmMinutes = () => Math.max(25, Math.round((120 * lmState.topics.size) / 5));

function renderLenMock() {
  const s = lmState;
  if (s.phase === "run") return lmRenderRun();
  if (s.phase === "done") return lmRenderDone();
  const best = store.get("lenMock", {});
  $("#len-mock").innerHTML = `
    <div class="card hero">
      <h1>${L(`Probe<span class="accent">klausur</span>`, `Mock <span class="accent">exam</span>`)}</h1>
      <p>${L("Aufgebaut wie die echte Klausur: fünf Aufgaben in derselben Reihenfolge — Ortskurve, Netzwerk, Wechselstrom, Bodediagramm, Operationsverstärker — mit je einer Rechen-, einer zweiten Aufgabe und einer Theoriefrage. Die Uhr läuft; bewertet wird erst beim Abgeben.",
        "Built like the real exam: five tasks in the same order — locus, network, AC, Bode plot, op-amp — each with a calculation, a second task and a theory question. The clock runs; nothing is marked until you hand it in.")}</p>
      ${best.best !== undefined ? `<p class="small">${L(`Dein bestes Ergebnis bisher: <b>${best.best} %</b> (${best.runs || 1} Probeklausuren).`, `Your best result so far: <b>${best.best} %</b> (${best.runs || 1} mock exams).`)}</p>` : ""}
    </div>
    <div class="card">
      <h2>${L("Themen", "Topics")}</h2>
      <p class="small muted">${L("Alle fünf für eine volle Klausur (120 min), oder nur die, die du üben willst — die Zeit wird angepasst.", "All five for a full exam (120 min), or just the ones you want to practise — the time is scaled to match.")}</p>
      <div class="chips">${LEN_TOPIC_IDS.map((t) => `<button class="chip ${s.topics.has(t) ? "active" : ""}" data-topic="${t}" style="--gc:${LEN_TOPICS[t].color}">${s.topics.has(t) ? "✓ " : ""}${L(LEN_TOPICS[t].de, LEN_TOPICS[t].en)}</button>`).join("")}</div>
      <div class="home-actions lm-start">
        <button class="btn primary" type="button" id="lmStart" ${s.topics.size ? "" : "disabled"}>${L(`Probeklausur starten · ${lmMinutes()} min`, `Start the mock exam · ${lmMinutes()} min`)}</button>
      </div>
      <p class="small muted">${L("Wie in der echten Klausur: nur ein Taschenrechner, Papier und Stift.", "As in the real exam: just a calculator, paper and a pen.")}</p>
    </div>`;
  $$("#len-mock [data-topic]").forEach((b) => (b.onclick = () => {
    s.topics.has(b.dataset.topic) ? s.topics.delete(b.dataset.topic) : s.topics.add(b.dataset.topic);
    renderLenMock();
  }));
  $("#lmStart").onclick = lmStart;
}

function lmStart() {
  const s = lmState;
  track("len.mock");
  s.tasks = LEN_TOPIC_IDS.filter((t) => s.topics.has(t)).map((topic) => ({ topic, items: MOCK_PLAN[topic].map((group) => lpMake(rPick(group))) }));
  s.end = Date.now() + lmMinutes() * 60000;
  s.phase = "run";
  renderLenMock();
  window.scrollTo({ top: 0 });
}

const lmMax = (task) => task.items.reduce((sum, t) => sum + t.max, 0);

function lmRenderRun() {
  const s = lmState;
  const total = s.tasks.reduce((sum, t) => sum + lmMax(t), 0);
  $("#len-mock").innerHTML = `
    <div class="lm-bar">
      <span class="lm-clock" id="lmClock"></span>
      <span class="small muted">${s.tasks.length} ${L("Aufgaben", "tasks")} · ${total} ${L("Punkte", "points")}</span>
      <button class="btn primary" type="button" id="lmSubmit">${L("Abgeben", "Hand in")}</button>
    </div>
    ${s.tasks.map((task, k) => `
      <div class="card lm-task">
        <h2>${L("Aufgabe", "Task")} ${k + 1} · ${L(LEN_TOPICS[task.topic].de, LEN_TOPICS[task.topic].en)} <span class="muted small">(${lmMax(task)} ${L("Punkte", "points")})</span></h2>
        ${task.items.map((t, j) => lpTaskHTML(t, { exam: true, num: `${k + 1}.${j + 1}` })).join("")}
      </div>`).join("")}
    <div class="home-actions lm-end"><button class="btn primary" type="button" id="lmSubmit2">${L("Abgeben", "Hand in")}</button></div>`;
  s.tasks.forEach((task) => task.items.forEach((t) => lpWire($("#" + t.uid))));
  const submit = () => {
    if (!confirm(lt("Probeklausur jetzt abgeben?", "Hand in the mock exam now?"))) return;
    lmFinish();
  };
  $("#lmSubmit").onclick = submit;
  $("#lmSubmit2").onclick = submit;
  clearInterval(s.timer);
  const tick = () => {
    const left = Math.max(0, s.end - Date.now());
    const m = Math.floor(left / 60000), sec = Math.floor((left % 60000) / 1000);
    const c = $("#lmClock");
    if (c) {
      c.textContent = `${m}:${String(sec).padStart(2, "0")}`;
      c.classList.toggle("low", left < 10 * 60000);
    }
    if (!left) { clearInterval(s.timer); lmFinish(true); }
  };
  tick();
  s.timer = setInterval(tick, 1000);
}

function lmFinish(timeUp = false) {
  const s = lmState;
  clearInterval(s.timer);
  track("len.mockDone");
  // Mark in place, so the answers stay where they were typed.
  const per = s.tasks.map((task) => ({ topic: task.topic, got: task.items.reduce((sum, t) => sum + lpGrade($("#" + t.uid), t, { lock: true }), 0), max: lmMax(task) }));
  const got = per.reduce((a, b) => a + b.got, 0), max = per.reduce((a, b) => a + b.max, 0);
  const pct = Math.round((got / max) * 100);
  s.result = { per, got, max, pct, timeUp, used: Math.round((lmMinutes() * 60000 - Math.max(0, s.end - Date.now())) / 60000) };
  const prev = store.get("lenMock", {});
  store.set("lenMock", { best: Math.max(prev.best ?? 0, pct), runs: (prev.runs || 0) + 1 });
  s.phase = "done";
  lmRenderDone();
  window.scrollTo({ top: 0 });
}

function lmRenderDone() {
  const s = lmState, r = s.result;
  const pass = r.pct >= 50;
  // The tasks keep their marked answers: move them under the result instead of drawing them again.
  const tasks = $$("#len-mock .lm-task");
  $("#len-mock").innerHTML = `
    <div class="card hero lm-result">
      <h1>${r.got} / ${r.max} ${L("Punkte", "points")} <span class="${pass ? "lm-pass" : "lm-fail"}">· ${r.pct} %</span></h1>
      <p>${r.timeUp ? L("Die Zeit war um — abgegeben wurde, was bis dahin dastand. ", "Time was up — what was there by then was handed in. ") : ""}${L(`Gebraucht: ${r.used} min. `, `Time used: ${r.used} min. `)}${pass
        ? L("Das wäre sehr wahrscheinlich bestanden.", "That would very likely be a pass.")
        : L("Noch nicht ganz — schau dir die Lösungswege unten an und übe die schwächsten Themen.", "Not quite yet — look at the worked solutions below and practise the weakest topics.")}
        <span class="small muted">${L("(Richtwert: etwa die Hälfte der Punkte.)", "(Rough guide: about half the points.)")}</span></p>
      <div class="lm-per">${r.per.map((x) => `
        <div class="lm-row">${topicPill(x.topic)}<span class="lw-bar"><span style="width:${(x.got / x.max) * 100}%"></span></span><b>${x.got} / ${x.max}</b>
          <button class="btn small-btn" type="button" data-practise="${x.topic}">${L("Üben", "Practise")}</button></div>`).join("")}</div>
      <div class="home-actions"><button class="btn primary" type="button" id="lmAgain">${L("Neue Probeklausur", "New mock exam")}</button></div>
    </div>`;
  tasks.forEach((t) => {
    $$(".lp-sol", t).forEach((sol) => (sol.hidden = false));
    $("#len-mock").appendChild(t);
  });
  $("#lmAgain").onclick = () => { s.phase = "setup"; renderLenMock(); window.scrollTo({ top: 0 }); };
  $$("#len-mock [data-practise]").forEach((b) => (b.onclick = () => openLenPractice(b.dataset.practise)));
}
