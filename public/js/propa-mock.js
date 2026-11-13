// ProPa exam tasks on the page: one task at a time in Practice ("Exam tasks" mode), and the Mock
// exam tab — one task per topic in the real exams' order, timed at a minute a point like the real
// one, marked when handed in. Tasks come from propa-tasks.js, topics from propa-exams.js.
//
// Values and choices are marked by the page. Code and explanations you write yourself (on the page
// or on paper), then mark against the model solution by ticking the rubric — as in the exam's own
// marking scheme, points come for the parts that matter, not for matching the model letter by letter.

/* ---------------------------------------------------------------- One task */

let pmSeq = 0;
function pmMake(genId) {
  const g = PROPA_TASKS.find((x) => x.id === genId);
  const t = g.make();
  t.gen = g;
  t.uid = "pm" + ++pmSeq;
  t.parts.forEach((p) => { if (p.kind === "mc") p.order = p.fixed ? p.mc.map((_, i) => i) : shuffle(p.mc.map((_, i) => i)); });
  t.max = t.parts.reduce((s, p) => s + p.pts, 0);
  return t;
}

// What was typed, made comparable: case, spaces, quotes, { } vs [ ], and a leading Except. / Output. / .
const pmNorm = (s) => String(s).toLowerCase().replace(/[−–]/g, "-").replace(/[“”„]/g, '"').replace(/'/g, '"')
  .replace(/\s+/g, "").replace(/except\.|output\./g, "").replace(/^\./, "").replace(/\{/g, "[").replace(/\}/g, "]");
function pmNum(s) {
  const t = s.replace(",", ".");
  if (/^-?\d*\.?\d+\/-?\d*\.?\d+$/.test(t)) { const [a, b] = t.split("/"); return +a / +b; }
  return t !== "" && /^-?\d*\.?\d+$/.test(t) ? +t : null;
}
const pmValOk = (typed, ans) => {
  const u = pmNorm(typed);
  return ans.some((a) => {
    const n = pmNorm(a);
    if (u === n) return true;
    const x = pmNum(u), y = pmNum(n);
    return x !== null && y !== null && Math.abs(x - y) <= Math.max(0.011, Math.abs(y) * 0.01);
  });
};

// The old exam a task is modelled on.
function pmLike(g) {
  const [id, n] = g.like.split("/");
  const e = PROPA_EXAMS.find((x) => x.id === id);
  const et = e && e.tasks.find((x) => x.n === +n);
  return e ? { e, n, page: et ? et.page : 1 } : null;
}

function pmPartHTML(p, i) {
  const rows = Math.min(16, Math.max(3, (p.model || "").split("\n").length + 1));
  return `
    <div class="lp-part pm-part pm-${p.kind}" data-i="${i}">
      <span class="lp-letter">${"abcdefghij"[i]})</span>
      <div class="lp-ask">${p.ask}</div>
      <span class="lp-pts small muted">${p.pts} P</span>
      ${p.kind === "mc" ? `<div class="lp-mc">${p.order.map((k) => `<button type="button" class="lp-opt" data-k="${k}">${p.mc[k]}</button>`).join("")}</div>` : ""}
      ${p.kind === "val" ? `<label class="lp-in pm-in"><input type="text" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Answer" placeholder="Your answer"></label>` : ""}
      ${p.kind === "write" ? `<textarea class="pm-ta" rows="${rows}" spellcheck="false" autocapitalize="off" aria-label="Your answer" placeholder="Write it here, or on paper."></textarea>
        <div class="pm-model" hidden>
          ${code(p.model, { lang: p.lang, title: "Model solution" })}
          <div class="pm-rub">
            <span class="small muted">Mark yourself: tick what your answer does.</span>
            ${p.rubric.map(([pts, say], k) => `<label class="pm-rub-i"><input type="checkbox" data-k="${k}"><span>${say}</span><b>${pts} P</b></label>`).join("")}
          </div>
        </div>` : ""}
      <div class="lp-mark"></div>
      ${p.why ? `<div class="pm-why small" hidden>${p.why}</div>` : ""}
    </div>`;
}

function pmTaskHTML(t, { exam = false, num = "" } = {}) {
  const like = pmLike(t.gen);
  return `
    <div class="lp-task pm-task" id="${t.uid}">
      <div class="lp-head">
        ${ppTopicPill(t.gen.topic)}<h3>${num ? `<span class="muted">${num}</span> ` : ""}${t.gen.name}</h3>
        <span class="lp-max small muted">${t.max} P</span>
      </div>
      ${like && !exam ? `<p class="small muted pm-like">Like ${like.e.sem}, task ${like.n} ·
        <a href="${like.e.file}#page=${like.page}" target="_blank" rel="noopener">the real one ↗</a> ·
        <a href="${like.e.sol}#page=${like.page}" target="_blank" rel="noopener">its solution ↗</a></p>` : ""}
      <div class="pm-intro">${t.intro}</div>
      <div class="lp-parts">${t.parts.map(pmPartHTML).join("")}</div>
      <p class="lp-sum pm-sum" hidden></p>
      ${exam ? "" : `
        <div class="lp-actions">
          <button class="btn primary" type="button" data-a="check">Check</button>
          <button class="btn" type="button" data-a="sol">Show the solution</button>
          <button class="btn" type="button" data-a="again">New values</button>
          <button class="btn" type="button" data-a="other">Another task</button>
        </div>`}
    </div>`;
}

// Choices toggle; Tab in a text box indents; ticks in the rubric call onTick.
function pmWire(el, t, onTick) {
  $$(".lp-mc", el).forEach((mc) => $$(".lp-opt", mc).forEach((b) => (b.onclick = () => {
    if (mc.classList.contains("locked")) return;
    $$(".lp-opt", mc).forEach((o) => o.classList.toggle("picked", o === b));
  })));
  $$(".pm-ta", el).forEach((ta) => (ta.onkeydown = (e) => {
    if (e.key !== "Tab" || e.shiftKey) return;
    e.preventDefault();
    const { selectionStart: a, selectionEnd: b } = ta;
    ta.value = ta.value.slice(0, a) + "  " + ta.value.slice(b);
    ta.selectionStart = ta.selectionEnd = a + 2;
  }));
  $$(".pm-in input", el).forEach((inp) => (inp.onkeydown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    $('[data-a="check"]', el)?.click();
  }));
  $$(".pm-rub input", el).forEach((cb) => (cb.onchange = () => { pmSelfMark(el, t); onTick && onTick(); }));
}

// The written parts' points from the ticked rubric.
function pmSelfMark(el, t) {
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

// Marks the values and choices, opens the model solutions, and returns the points so far.
function pmGrade(el, t, { lock = false } = {}) {
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
      ok = answered && pmValOk(inp.value, p.ans);
      inp.classList.toggle("right", ok);
      inp.classList.toggle("wrong", answered && !ok);
      if (lock) inp.readOnly = true;
    }
    if (ok) got += p.pts;
    row.classList.toggle("ok", ok);
    row.classList.toggle("bad", !ok && (answered || lock));
    $(".lp-mark", row).innerHTML = ok ? `<span class="lp-ok">✓</span>`
      : !answered && !lock ? ""
      : `<span class="lp-no">✗</span> ${p.kind === "mc" ? (lock ? "The right one is marked." : "Not this one.") : lock ? `Right: <b>${c(p.ans[0])}</b>` : "Not quite."}`;
    if (why) why.hidden = !(ok || lock);
  });
  const self = pmSelfMark(el, t);
  return { got, max, self: self.got, selfMax: self.max };
}

/* ---------------------------------------------------------------- Practice: exam tasks */

const pmView = { part: "all", topic: "all", task: null, marked: null };
const pmSolved = () => store.get("propaTaskSolved", {});
const pmTopicsOf = (part) => PROPA_EXAM_TOPIC_IDS.filter((t) => (part === "all" || PROPA_EXAM_TOPICS[t].part === part) && PROPA_TASKS.some((g) => g.topic === t));
const pmPool = () => PROPA_TASKS.filter((g) => (pmView.part === "all" || PROPA_EXAM_TOPICS[g.topic].part === pmView.part) && (pmView.topic === "all" || g.topic === pmView.topic));

function pmNew(genId) {
  const pool = pmPool();
  const others = pool.filter((g) => !pmView.task || pool.length === 1 || g.id !== pmView.task.gen.id);
  pmView.task = pmMake(genId || pick(others.length ? others : PROPA_TASKS).id);
  pmView.marked = null;
  track("propa.task");
  renderPmPractice();
}

// From Old exams' "Practise": the exam tasks of one topic.
function openPropaTasks(topic) {
  ppPractice.mode = "tasks";
  pmView.part = "all";
  pmView.topic = topic;
  pmView.task = null;
  showTab("propa-practice");
  renderPropaPractice();
  window.scrollTo({ top: 0 });
}

function pmSumText(r, t) {
  const total = r.got + r.self;
  return `${total} / ${t.max} P <span class="small muted">· checked ${r.got} / ${r.max} · your own marking ${r.self} / ${r.selfMax}</span>${total === t.max ? " — all right!" : ""}`;
}

function renderPmPractice() {
  const v = pmView;
  const box = $("#pmPractice");
  if (!box) return;
  if (!v.task) return pmNew();
  const solved = pmSolved();
  const topics = pmTopicsOf(v.part);
  const count = (t) => PROPA_TASKS.filter((g) => (v.part === "all" || PROPA_EXAM_TOPICS[g.topic].part === v.part) && (t === "all" || g.topic === t)).length;
  box.innerHTML = `
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Part</span>
        <div class="chips">${[["all", "Both"], ["Lean", "Lean"], ["Reussner", "Reussner"]].map(([p, l]) => `<button class="chip ${v.part === p ? "active" : ""}" data-part="${p}">${l}</button>`).join("")}</div>
      </div>
      <div class="len-filter-row">
        <span class="len-filter-cap">Topic</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">All · ${count("all")}</button>
          ${topics.map((t) => `<button class="chip ${v.topic === t ? "active" : ""}" data-topic="${t}" style="--gc:${PROPA_EXAM_TOPICS[t].color}">${PROPA_EXAM_TOPICS[t].name} · ${count(t)}</button>`).join("")}
        </div>
      </div>
    </div>
    <div class="card lp-card">${pmTaskHTML(v.task)}</div>
    <div class="card">
      <h2>Every exam task</h2>
      <p class="small muted">Each is modelled on a task from an old exam; the number counts how often you had one fully right.</p>
      <div class="lp-gens">
        ${pmPool().map((g) => `
          <button type="button" class="lp-gen ${v.task.gen.id === g.id ? "on" : ""}" data-gen="${g.id}">
            ${ppTopicPill(g.topic)}<b>${g.name}</b>
            <span class="lp-gen-n ${solved[g.id] ? "has" : ""}">${solved[g.id] || 0}×</span>
          </button>`).join("")}
      </div>
    </div>`;
  $$("#pmPractice [data-part]").forEach((b) => (b.onclick = () => { v.part = b.dataset.part; v.topic = "all"; pmNew(); }));
  $$("#pmPractice [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; pmNew(); }));
  $$("#pmPractice [data-gen]").forEach((b) => (b.onclick = () => {
    pmNew(b.dataset.gen);
    $("#pmPractice .lp-card").scrollIntoView({ block: "start" });
    window.scrollBy(0, -barHeight() - 10);
  }));

  const t = v.task, el = $("#" + t.uid);
  const sum = $(".pm-sum", el);
  const show = () => {
    if (!v.marked) return;
    const s = pmSelfMark(el, t);
    v.marked.self = s.got;
    sum.hidden = false;
    sum.className = "lp-sum pm-sum" + (v.marked.got + s.got === t.max ? " ok" : "");
    sum.innerHTML = pmSumText(v.marked, t);
    if (v.marked.got + s.got === t.max && !t.counted) {
      t.counted = true;
      const all = pmSolved();
      store.set("propaTaskSolved", { ...all, [t.gen.id]: (all[t.gen.id] || 0) + 1 });
    }
  };
  pmWire(el, t, show);
  $('[data-a="check"]', el).onclick = () => { v.marked = pmGrade(el, t); show(); };
  $('[data-a="sol"]', el).onclick = () => { v.marked = pmGrade(el, t, { lock: true }); show(); $('[data-a="check"]', el).disabled = true; };
  $('[data-a="again"]', el).onclick = () => pmNew(t.gen.id);
  $('[data-a="other"]', el).onclick = () => pmNew();
}

/* ---------------------------------------------------------------- Mock exam */

// The real exams' order; one task per topic. Multiple choice was only in the older exams.
const PM_MOCK_TOPICS = PROPA_EXAM_TOPIC_IDS.filter((t) => PROPA_TASKS.some((g) => g.topic === t && !g.practiceOnly));
const pmMock = { phase: "setup", topics: new Set(PM_MOCK_TOPICS), tasks: [], minutes: 0, end: 0, timer: 0, result: null, last: {} };
// Points of an average task per topic, for the time before the exam is made.
const pmTypical = (topic) => {
  const gs = PROPA_TASKS.filter((g) => g.topic === topic && !g.practiceOnly);
  return gs.reduce((s, g) => s + pmMake(g.id).max, 0) / gs.length;
};
const pmMockMinutes = () => Math.round([...pmMock.topics].reduce((s, t) => s + pmTypical(t), 0));

function renderPropaMock() {
  const s = pmMock;
  if (s.phase === "run") return pmRenderRun();
  if (s.phase === "done") return pmRenderDone();
  const best = store.get("propaMock", {});
  const lean = PM_MOCK_TOPICS.filter((t) => PROPA_EXAM_TOPICS[t].part === "Lean"), reu = PM_MOCK_TOPICS.filter((t) => PROPA_EXAM_TOPICS[t].part === "Reussner");
  const same = (xs) => xs.length === s.topics.size && xs.every((t) => s.topics.has(t));
  $("#propa-mock").innerHTML = `
    <div class="card hero">
      <h1>Mock <span class="accent">exam</span></h1>
      <p>Built like the exams since WS 25/26: ten tasks in the same order — seven Lean (lists, data types, recursion,
        an interpreter, accumulators, property tests, monads), then MPI, Java threads and Design by Contract.
        Each is new: a task like an old exam's, with new values. You get a minute a point, as in the real exam. Nothing is marked until you hand in.</p>
      <p class="small">After handing in, the page marks values and choices. For code you wrote, it shows the model solution and a rubric — tick what your answer does, and the points add up.</p>
      ${best.best !== undefined ? `<p class="small">Your best so far: <b>${best.best} %</b> (${best.runs || 1} mock exam${(best.runs || 1) === 1 ? "" : "s"}).</p>` : ""}
    </div>
    <div class="card">
      <h2>Topics</h2>
      <p class="small muted">All ten for a full exam, or just a part — the time is scaled to the points.</p>
      <div class="chips pm-mock-parts">
        <button class="chip ${same(PM_MOCK_TOPICS) ? "active" : ""}" data-set="all">Full exam</button>
        <button class="chip ${same(lean) ? "active" : ""}" data-set="Lean">Lean only</button>
        <button class="chip ${same(reu) ? "active" : ""}" data-set="Reussner">Reussner only</button>
      </div>
      <div class="chips">${PM_MOCK_TOPICS.map((t) => `<button class="chip ${s.topics.has(t) ? "active" : ""}" data-topic="${t}" style="--gc:${PROPA_EXAM_TOPICS[t].color}">${s.topics.has(t) ? "✓ " : ""}${PROPA_EXAM_TOPICS[t].name}</button>`).join("")}</div>
      <div class="home-actions lm-start">
        <button class="btn primary" type="button" id="pmStart" ${s.topics.size ? "" : "disabled"}>Start the mock exam · about ${pmMockMinutes()} min</button>
      </div>
      <p class="small muted">As in the real exam, no notes and no Lean: write the code as you would on paper — here or on a sheet.</p>
    </div>`;
  $$("#propa-mock [data-topic]").forEach((b) => (b.onclick = () => {
    s.topics.has(b.dataset.topic) ? s.topics.delete(b.dataset.topic) : s.topics.add(b.dataset.topic);
    renderPropaMock();
  }));
  $$("#propa-mock [data-set]").forEach((b) => (b.onclick = () => {
    s.topics = new Set(b.dataset.set === "all" ? PM_MOCK_TOPICS : b.dataset.set === "Lean" ? lean : reu);
    renderPropaMock();
  }));
  $("#pmStart").onclick = pmStart;
}

function pmStart() {
  const s = pmMock;
  track("propa.mock");
  s.tasks = PM_MOCK_TOPICS.filter((t) => s.topics.has(t)).map((topic) => {
    const gs = PROPA_TASKS.filter((g) => g.topic === topic && !g.practiceOnly);
    const fresh = gs.filter((g) => g.id !== s.last[topic]);
    const g = pick(fresh.length ? fresh : gs);
    s.last[topic] = g.id;
    return pmMake(g.id);
  });
  s.minutes = s.tasks.reduce((a, t) => a + t.max, 0);
  s.end = Date.now() + s.minutes * 60000;
  s.phase = "run";
  renderPropaMock();
  window.scrollTo({ top: 0 });
}

function pmRenderRun() {
  const s = pmMock;
  const total = s.tasks.reduce((a, t) => a + t.max, 0);
  $("#propa-mock").innerHTML = `
    <div class="lm-bar">
      <span class="lm-clock" id="pmClock"></span>
      <span class="small muted">${s.tasks.length} task${s.tasks.length === 1 ? "" : "s"} · ${total} points</span>
      <button class="btn primary" type="button" id="pmSubmit">Hand in</button>
    </div>
    ${s.tasks.map((t, k) => `<div class="card lm-task pm-mock-task">${pmTaskHTML(t, { exam: true, num: `Task ${k + 1} ·` })}</div>`).join("")}
    <div class="home-actions lm-end"><button class="btn primary" type="button" id="pmSubmit2">Hand in</button></div>`;
  s.tasks.forEach((t) => pmWire($("#" + t.uid), t, pmUpdateResult));
  const submit = () => { if (confirm("Hand in the mock exam now?")) pmFinish(); };
  $("#pmSubmit").onclick = submit;
  $("#pmSubmit2").onclick = submit;
  clearInterval(s.timer);
  const tick = () => {
    const left = Math.max(0, s.end - Date.now());
    const clock = $("#pmClock");
    if (clock) {
      clock.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
      clock.classList.toggle("low", left < 10 * 60000);
    }
    if (!left) { clearInterval(s.timer); pmFinish(true); }
  };
  tick();
  s.timer = setInterval(tick, 1000);
}

function pmFinish(timeUp = false) {
  const s = pmMock;
  clearInterval(s.timer);
  track("propa.mockDone");
  s.result = { timeUp, used: Math.round((s.minutes * 60000 - Math.max(0, s.end - Date.now())) / 60000), per: s.tasks.map((t) => ({ t, ...pmGrade($("#" + t.uid), t, { lock: true }) })) };
  const prev = store.get("propaMock", {});
  store.set("propaMock", { best: prev.best ?? 0, runs: (prev.runs || 0) + 1 });
  s.phase = "done";
  pmRenderDone();
  window.scrollTo({ top: 0 });
}

function pmRenderDone() {
  const s = pmMock;
  // The tasks keep their answers and marks: move them under the result instead of drawing them again.
  const tasks = $$("#propa-mock .pm-mock-task");
  $("#propa-mock").innerHTML = `<div class="card hero lm-result" id="pmResult"></div>`;
  tasks.forEach((el) => $("#propa-mock").appendChild(el));
  $("#propa-mock").insertAdjacentHTML("beforeend", `<div class="home-actions lm-end"><button class="btn primary" type="button" data-again>New mock exam</button></div>`);
  pmUpdateResult();
  $$("#propa-mock [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; renderPropaMock(); window.scrollTo({ top: 0 }); }));
}

// The result card, again on every tick in a rubric.
function pmUpdateResult() {
  const s = pmMock, r = s.result, box = $("#pmResult");
  if (s.phase !== "done" || !box) return;
  r.per.forEach((x) => { const m = pmSelfMark($("#" + x.t.uid), x.t); x.self = m.got; });
  const got = r.per.reduce((a, x) => a + x.got + x.self, 0), max = r.per.reduce((a, x) => a + x.t.max, 0);
  const auto = r.per.reduce((a, x) => a + x.got, 0), autoMax = r.per.reduce((a, x) => a + x.max, 0);
  const self = r.per.reduce((a, x) => a + x.self, 0), selfMax = r.per.reduce((a, x) => a + x.selfMax, 0);
  const pct = Math.round((got / max) * 100);
  const prev = store.get("propaMock", {});
  if (pct > (prev.best ?? -1)) store.set("propaMock", { ...prev, best: pct });
  box.innerHTML = `
    <h1>${got} / ${max} points <span class="${pct >= 50 ? "lm-pass" : "lm-fail"}">· ${pct} %</span></h1>
    <p>${r.timeUp ? "Time was up — what was there by then was handed in. " : ""}Time used: ${r.used} of ${s.minutes} min.
      Checked by the page: <b>${auto} / ${autoMax}</b>. Your own marking of the written parts: <b>${self} / ${selfMax}</b>${self === 0 && selfMax ? " — tick the rubric under each model solution below" : ""}.
      <span class="small muted">(Rough guide: half the points passes.)</span></p>
    <div class="lm-per">${r.per.map((x) => `
      <div class="lm-row pm-row">${ppTopicPill(x.t.gen.topic)}<span class="lw-bar"><span style="width:${((x.got + x.self) / x.t.max) * 100}%"></span></span><b>${x.got + x.self} / ${x.t.max}</b>
        <button class="btn small-btn" type="button" data-practise="${x.t.gen.topic}">Practise</button></div>`).join("")}</div>
    <div class="home-actions"><button class="btn primary" type="button" data-again>New mock exam</button></div>`;
  $$("#pmResult [data-practise]").forEach((b) => (b.onclick = () => openPropaTasks(b.dataset.practise)));
  $$("#pmResult [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; renderPropaMock(); window.scrollTo({ top: 0 }); }));
}
