// Robotics I Practice and mock exam. Practice shows one exam-style task at a time (rob-tasks.js),
// filtered by topic; the tasks are variations with new numbers, so the real exam tasks stay unseen
// until you want them. The mock exam is built like the exams since WS 24/25: six tasks of about 10
// points (transformations, kinematics and dynamics, motion planning, grasping, vision, programming by
// demonstration), 2 minutes a point — or only what the lecture has covered so far.
// Values are checked with NuMa's nmValOk (any of "0.5", "1/2", "0,5"; lists separated by ";"); the
// written parts are marked by ticking the model answer's rubric (nmSelfMark). The texts are English.

/* ---------------------------------------------------------------- One task */

let rbSeq = 0;
function rbMake(genId) {
  const g = ROB_TASKS.find((x) => x.id === genId);
  const t = g.make();
  t.gen = g;
  t.uid = "rbt" + ++rbSeq;
  t.parts.forEach((p) => {
    if (p.kind !== "mc") return;
    const idx = p.mc.map((_, i) => i);
    p.order = p.fixed ? idx : shuffle(idx);
  });
  t.max = t.parts.reduce((s, p) => s + p.pts, 0);
  return t;
}
const rbAnsHTML = (a) => String(a).replace(/-/g, "−");
// Which old exam task a generator is modelled on — named only, not linked, so the real one stays unseen.
function rbLikeText(g) {
  if (!g.like) return "";
  const [id, n] = g.like.split("/");
  const e = ROB_EXAMS.find((x) => x.id === id);
  return e ? `<p class="small muted pm-like">Modelled on ${e.sem}, task ${n} — new numbers and wording.</p>` : "";
}

function rbPartHTML(p, i) {
  return `
    <div class="lp-part pm-part pm-${p.kind}" data-i="${i}">
      <span class="lp-letter">${"abcdefghij"[i]})</span>
      <div class="lp-ask">${p.ask}</div>
      <span class="lp-pts small muted">${p.pts} P</span>
      ${p.kind === "mc" ? `<div class="lp-mc">${p.order.map((k) => `<button type="button" class="lp-opt" data-k="${k}">${p.mc[k]}</button>`).join("")}</div>` : ""}
      ${p.kind === "val" ? `<label class="lp-in pm-in"><input type="text" autocomplete="off" spellcheck="false" autocapitalize="off" aria-label="Answer" placeholder="Your answer"></label>` : ""}
      ${p.kind === "write" ? `<textarea class="pm-ta nm-ta" rows="4" spellcheck="false" aria-label="Your answer" placeholder="Write it here, or on paper."></textarea>
        <div class="pm-model" hidden>
          <div class="nm-model"><span class="nm-model-cap">Model answer</span>${p.model}</div>
          <div class="pm-rub">
            <span class="small muted">Mark yourself: tick what your answer contains.</span>
            ${p.rubric.map(([pts, say], k) => `<label class="pm-rub-i"><input type="checkbox" data-k="${k}"><span>${say}</span><b>${pts} P</b></label>`).join("")}
          </div>
        </div>` : ""}
      <div class="lp-mark"></div>
      ${p.why ? `<div class="pm-why small" hidden>${p.why}</div>` : ""}
    </div>`;
}

function rbTaskHTML(t, { exam = false, num = "" } = {}) {
  const later = !rbTaught(t.gen.topic);
  return `
    <div class="lp-task pm-task" id="${t.uid}">
      <div class="lp-head">
        ${rbTopicPill(t.gen.topic)}<h3>${num ? `<span class="muted">${num}</span> ` : ""}${t.gen.name}</h3>
        <span class="lp-max small muted">${t.max} P</span>
      </div>
      ${exam ? "" : rbLikeText(t.gen)}
      ${later && !exam ? `<p class="small gk-later-note">Comes with ${rbTopicLater(t.gen.topic)} — the task is like the old exams'; the explanations are in the solution.</p>` : ""}
      <div class="pm-intro">${t.intro}</div>
      <div class="lp-parts">${t.parts.map(rbPartHTML).join("")}</div>
      <p class="lp-sum pm-sum" hidden></p>
      ${exam ? "" : `
        <div class="lp-actions">
          <button class="btn primary" type="button" data-a="check">Check</button>
          <button class="btn" type="button" data-a="sol">Show the solution</button>
          <button class="btn" type="button" data-a="again">New numbers</button>
          <button class="btn" type="button" data-a="other">Another task</button>
        </div>`}
    </div>`;
}

// Marks the values and choices, opens the model answers, and returns the points so far.
function rbGrade(el, t, { lock = false } = {}) {
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
      : `<span class="lp-no">✗</span> ${p.kind === "mc" ? (lock ? "The right one is marked." : "Not this one.") : lock ? `Right: <b>${rbAnsHTML(p.ans[0])}</b>` : "Not yet."}`;
    if (why) why.hidden = !(ok || lock);
  });
  const self = nmSelfMark(el, t);
  return { got, max, self: self.got, selfMax: self.max };
}
const rbSumText = (r, t) => `${r.got + r.self} / ${t.max} points — checked by the page: ${r.got} / ${r.max}${r.selfMax ? `, marked by you: ${r.self} / ${r.selfMax}` : ""}.`;

/* ---------------------------------------------------------------- Practice */

const rbPrac = { topic: "all", taught: false, task: null, marked: null };
const rbSolved = () => store.get("robTaskSolved", {});
const rbTaskTopics = () => ROB_EXAM_TOPIC_IDS.filter((t) => ROB_TASKS.some((g) => g.topic === t));
const rbPool = () => ROB_TASKS.filter((g) => (rbPrac.topic === "all" || g.topic === rbPrac.topic) && (!rbPrac.taught || rbTaught(g.topic)));

function rbNew(genId) {
  const pool = rbPool().length ? rbPool() : ROB_TASKS;
  const others = pool.filter((g) => !rbPrac.task || pool.length === 1 || g.id !== rbPrac.task.gen.id);
  rbPrac.task = rbMake(genId || pick(others.length ? others : pool).id);
  rbPrac.marked = null;
  track("rob.task");
  renderRobPractice();
}

// From Old exams' "Practise": the tasks of one topic.
function openRobTasks(topic) {
  rbPrac.topic = topic;
  rbPrac.taught = false;
  rbPrac.task = null;
  showTab("rob-practice");
  renderRobPractice();
  window.scrollTo({ top: 0 });
}

function renderRobPractice() {
  const v = rbPrac;
  if (!v.task) return rbNew();
  const solved = rbSolved();
  const count = (t) => ROB_TASKS.filter((g) => (t === "all" || g.topic === t) && (!v.taught || rbTaught(g.topic))).length;
  $("#rob-practice").innerHTML = `
    <div class="card hero">
      <h1>Prac<span class="accent">tice</span></h1>
      <p>Tasks like the old exams', each modelled on a real one but with new numbers and new wording every time — so you can train a kind of task without using up the real exam.
        The page checks numbers and choices: decimals with a point or comma, fractions like <code>3/14</code>, several values separated by <code>;</code>, letters like <code>S A C G</code>.
        Explanations you write yourself and mark against the model answer.</p>
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Topic</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">All · ${count("all")}</button>
          ${rbTaskTopics().filter((t) => !v.taught || rbTaught(t)).map((t) => `<button class="chip ${v.topic === t ? "active" : ""} ${rbTaught(t) ? "" : "gk-later"}" data-topic="${t}" style="--gc:${ROB_EXAM_TOPICS[t].color}">${ROB_EXAM_TOPICS[t].name} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="rbPracTaught" ${v.taught ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Only topics already here (chapters 0–${ROB_CH_DONE})</span></label>
    </div>
    <div class="card lp-card">${rbTaskHTML(v.task)}</div>
    <div class="card">
      <h2>All tasks</h2>
      <p class="small muted">The number counts how often you had a task fully right. Pale: not in the lecture yet.</p>
      <div class="lp-gens">
        ${rbPool().map((g) => `
          <button type="button" class="lp-gen ${v.task.gen.id === g.id ? "on" : ""} ${rbTaught(g.topic) ? "" : "gk-later"}" data-gen="${g.id}">
            ${rbTopicPill(g.topic)}<b>${g.name}</b>
            <span class="lp-gen-n ${solved[g.id] ? "has" : ""}">${solved[g.id] || 0}×</span>
          </button>`).join("")}
      </div>
    </div>`;
  $$("#rob-practice [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; rbNew(); }));
  $("#rbPracTaught").onchange = (ev) => { v.taught = ev.target.checked; if (v.taught && v.topic !== "all" && !rbTaught(v.topic)) v.topic = "all"; rbNew(); };
  $$("#rob-practice [data-gen]").forEach((b) => (b.onclick = () => {
    rbNew(b.dataset.gen);
    $("#rob-practice .lp-card").scrollIntoView({ block: "start" });
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
    sum.innerHTML = rbSumText(v.marked, t);
    if (v.marked.got + s.got === t.max && !t.counted && !t.peeked) {
      t.counted = true;
      const all = rbSolved();
      store.set("robTaskSolved", { ...all, [t.gen.id]: (all[t.gen.id] || 0) + 1 });
    }
  };
  nmWire(el, t, show);
  $('[data-a="check"]', el).onclick = () => { v.marked = rbGrade(el, t); show(); };
  $('[data-a="sol"]', el).onclick = () => { t.peeked = !v.marked || v.marked.got < v.marked.max; v.marked = rbGrade(el, t, { lock: true }); show(); $('[data-a="check"]', el).disabled = true; };
  $('[data-a="again"]', el).onclick = () => rbNew(t.gen.id);
  $('[data-a="other"]', el).onclick = () => rbNew();
}

/* ---------------------------------------------------------------- Mock exam */

// The six tasks of the exams since WS 24/25, and a version with only the chapters already here.
const RB_SLOTS = [
  ["Foundations and transformations", ["rot", "quat"]],
  ["Kinematics and dynamics", ["dh", "jac", "ik", "dyn"]],
  ["Motion planning", ["plan"]],
  ["Grasping", ["grasp"]],
  ["Robot vision", ["vision"]],
  ["Programming by demonstration", ["pbd", "task"]],
];
const RB_SLOTS_SOFAR = [
  ["Rotations and transformations", ["rot"]],
  ["Quaternions", ["quat"]],
  ["Forward kinematics", ["dh", "ws"]],
  ["Jacobian and manipulability", ["jac"]],
  ["Inverse kinematics", ["ik"]],
];
const rbMock = { phase: "setup", mode: "exam", perPt: 2, tasks: [], minutes: 0, end: 0, timer: 0, result: null, last: new Set() };

function renderRobMock() {
  const s = rbMock;
  if (s.phase === "run") return rbRenderRun();
  if (s.phase === "done") return rbRenderDone();
  const best = store.get("robMock", {});
  const slots = s.mode === "exam" ? RB_SLOTS : RB_SLOTS_SOFAR;
  $("#rob-mock").innerHTML = `
    <div class="card hero">
      <h1>Mock <span class="accent">exam</span></h1>
      <p>Built like the exams since WS 24/25: six tasks of about 10 points — transformations, kinematics and dynamics, motion planning, grasping, robot vision,
        programming by demonstration. Every task is new, with new numbers; none is a real exam task. Marked only when you hand in.</p>
      <p class="small">The real exam: ${ROB_EXAM.minutes} minutes for 60 points — 2 minutes a point, written, in English or German. After handing in, the page checks numbers and choices;
        for explanations it shows the model answer — tick what yours contains.</p>
      ${best.best !== undefined ? `<p class="small">Best so far: <b>${best.best} %</b> (${best.runs || 1} mock exam${(best.runs || 1) === 1 ? "" : "s"}).</p>` : ""}
    </div>
    <div class="card">
      <h2>Which exam</h2>
      <div class="chips pm-mock-parts">
        <button class="chip ${s.mode === "exam" ? "active" : ""}" data-mode="exam">Like a real exam (all six topics)</button>
        <button class="chip ${s.mode === "sofar" ? "active" : ""}" data-mode="sofar">Only chapters 0–${ROB_CH_DONE}</button>
      </div>
      <ol class="small rb-slots">${slots.map(([name, ts]) => `<li><b>${name}</b> ${ts.map((t) => rbTopicPill(t)).join("")}</li>`).join("")}</ol>
      <div class="len-filter-row nm-perpt">
        <span class="len-filter-cap">Time</span>
        <div class="seg" id="rbPerPt">${[[2, "2 min (like the exam)"], [2.5, "2.5 min"], [3, "3 min"]].map(([v, l]) => `<button type="button" data-v="${v}" class="${s.perPt === v ? "active" : ""}">${l}</button>`).join("")}</div>
        <span class="small muted">per point</span>
      </div>
      <div class="home-actions lm-start">
        <button class="btn primary" type="button" id="rbStart">Start the mock exam · ${slots.length} tasks</button>
      </div>
      <p class="small muted">As in the exam: no notes, no calculator. Calculate on paper and type in the results.</p>
    </div>`;
  $$("#rob-mock [data-mode]").forEach((b) => (b.onclick = () => { s.mode = b.dataset.mode; renderRobMock(); }));
  $$("#rbPerPt button").forEach((b) => (b.onclick = () => { s.perPt = +b.dataset.v; renderRobMock(); }));
  $("#rbStart").onclick = rbStart;
}

function rbStart() {
  const s = rbMock;
  track("rob.mock");
  const slots = s.mode === "exam" ? RB_SLOTS : RB_SLOTS_SOFAR;
  const target = s.mode === "exam" ? 9 : 7;
  // Each slot takes tasks of its topics until it has about 10 points; tasks of the last mock exam are avoided.
  s.tasks = slots.map(([name, topics], k) => {
    const gs = shuffle(ROB_TASKS.filter((g) => topics.includes(g.topic)));
    const fresh = gs.filter((g) => !s.last.has(g.id)), order = [...fresh, ...gs.filter((g) => s.last.has(g.id))];
    const out = [];
    for (const g of order) {
      if (out.reduce((a, t) => a + t.max, 0) >= target) break;
      out.push(rbMake(g.id));
      if (out.length === 2) break;
    }
    // The second task gives only as many parts as fit into about 10 points (the real slots have 10).
    if (out.length === 2) {
      const t = out[1], room = (s.mode === "exam" ? 10 : 8) - out[0].max;
      while (t.parts.length > 2 && t.parts.reduce((a, p) => a + p.pts, 0) > Math.max(room, 2)) t.parts.pop();
      t.max = t.parts.reduce((a, p) => a + p.pts, 0);
    }
    out.forEach((t, i) => (t.slot = { k, name, sub: out.length > 1 ? "ab"[i] : "" }));
    return out;
  }).flat();
  s.last = new Set(s.tasks.map((t) => t.gen.id));
  s.minutes = Math.round(s.tasks.reduce((a, t) => a + t.max, 0) * s.perPt);
  s.end = Date.now() + s.minutes * 60000;
  s.phase = "run";
  renderRobMock();
  window.scrollTo({ top: 0 });
}

function rbRenderRun() {
  const s = rbMock;
  const total = s.tasks.reduce((a, t) => a + t.max, 0);
  $("#rob-mock").innerHTML = `
    <div class="lm-bar">
      <span class="lm-clock" id="rbClock"></span>
      <span class="small muted">${s.tasks.length} parts · ${total} points</span>
      <button class="btn primary" type="button" id="rbSubmit">Hand in</button>
    </div>
    ${s.tasks.map((t) => `<div class="card lm-task pm-mock-task">${rbTaskHTML(t, { exam: true, num: `Task ${t.slot.k + 1}${t.slot.sub} · ${t.slot.name} ·` })}</div>`).join("")}
    <div class="home-actions lm-end"><button class="btn primary" type="button" id="rbSubmit2">Hand in</button></div>`;
  s.tasks.forEach((t) => nmWire($("#" + t.uid), t, rbUpdateResult));
  const submit = () => { if (confirm("Hand in the mock exam now?")) rbFinish(); };
  $("#rbSubmit").onclick = submit;
  $("#rbSubmit2").onclick = submit;
  clearInterval(s.timer);
  const tick = () => {
    const left = Math.max(0, s.end - Date.now());
    const clock = $("#rbClock");
    if (clock) {
      clock.textContent = `${Math.floor(left / 60000)}:${String(Math.floor((left % 60000) / 1000)).padStart(2, "0")}`;
      clock.classList.toggle("low", left < 10 * 60000);
    }
    if (!left) { clearInterval(s.timer); rbFinish(true); }
  };
  tick();
  s.timer = setInterval(tick, 1000);
}

function rbFinish(timeUp = false) {
  const s = rbMock;
  clearInterval(s.timer);
  track("rob.mockDone");
  s.result = { timeUp, saved: false, used: Math.round((s.minutes * 60000 - Math.max(0, s.end - Date.now())) / 60000), per: s.tasks.map((t) => ({ t, ...rbGrade($("#" + t.uid), t, { lock: true }) })) };
  const prev = store.get("robMock", {});
  store.set("robMock", { best: prev.best ?? 0, runs: (prev.runs || 0) + 1 });
  s.phase = "done";
  rbRenderDone();
  window.scrollTo({ top: 0 });
}

function rbRenderDone() {
  const s = rbMock;
  const tasks = $$("#rob-mock .pm-mock-task");
  $("#rob-mock").innerHTML = `<div class="card hero lm-result" id="rbResult"></div>`;
  tasks.forEach((el) => $("#rob-mock").appendChild(el));
  $("#rob-mock").insertAdjacentHTML("beforeend", `<div class="home-actions lm-end"><button class="btn primary" type="button" data-again>New mock exam</button></div>`);
  rbUpdateResult();
  $$("#rob-mock [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; renderRobMock(); window.scrollTo({ top: 0 }); }));
}

function rbUpdateResult() {
  const s = rbMock, r = s.result, box = $("#rbResult");
  if (s.phase !== "done" || !box) return;
  r.per.forEach((x) => { const m = nmSelfMark($("#" + x.t.uid), x.t); x.self = m.got; });
  const got = r.per.reduce((a, x) => a + x.got + x.self, 0), max = r.per.reduce((a, x) => a + x.t.max, 0);
  const auto = r.per.reduce((a, x) => a + x.got, 0), autoMax = r.per.reduce((a, x) => a + x.max, 0);
  const self = r.per.reduce((a, x) => a + x.self, 0), selfMax = r.per.reduce((a, x) => a + x.selfMax, 0);
  const pct = Math.round((got / max) * 100);
  r.pct = pct;
  box.innerHTML = `
    <h1>${got} / ${max} points <span class="${pct >= 50 ? "lm-pass" : "lm-fail"}">· ${pct} %</span></h1>
    <p>${r.timeUp ? "Time was up — what was there by then was handed in. " : ""}Time used: ${r.used} of ${s.minutes} min.
      Checked by the page: <b>${auto} / ${autoMax}</b>. Marked by you: <b>${self} / ${selfMax}</b>${self === 0 && selfMax ? " — tick under each model answer what you had" : ""}.</p>
    <div class="lm-per">${r.per.map((x) => `
      <div class="lm-row pm-row">${rbTopicPill(x.t.gen.topic)}<span class="lw-bar"><span style="width:${((x.got + x.self) / x.t.max) * 100}%"></span></span><b>${x.got + x.self} / ${x.t.max}</b>
        <button class="btn small-btn" type="button" data-practise="${x.t.gen.topic}">Practise</button></div>`).join("")}</div>
    <div class="home-actions">
      ${r.saved ? `<span class="pm-saved small">✓ Marking finished — ${pct} % saved.</span>`
        : `<button class="btn primary" type="button" id="rbSave">Finish marking · save ${pct} %</button>`}
      <button class="btn ${r.saved ? "primary" : ""}" type="button" data-again>New mock exam</button>
    </div>
    ${r.saved ? "" : `<p class="small muted">Tick the rubric under each written answer first; the result is saved once, when you finish marking.</p>`}`;
  if (!r.saved) $("#rbSave").onclick = () => {
    r.saved = true;
    $$("#rob-mock .pm-rub input").forEach((cb) => (cb.disabled = true));
    rbUpdateResult();
    const prev = store.get("robMock", {});
    store.set("robMock", { ...prev, best: Math.max(prev.best ?? 0, r.pct) });
  };
  $$("#rbResult [data-practise]").forEach((b) => (b.onclick = () => openRobTasks(b.dataset.practise)));
  $$("#rbResult [data-again]").forEach((b) => (b.onclick = () => { s.phase = "setup"; renderRobMock(); window.scrollTo({ top: 0 }); }));
}
