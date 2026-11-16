// The Robotics I course (Introduction to Robotics, WS 26/27, Tamim Asfour, KIT H²T). The lecture is
// still running: this is built from the slides of chapters 0–3 (Introduction, Mathematical
// Foundations, Kinematics, Inverse Kinematics). Like the lecture and the exam, it is in English.
// When more chapters come, raise ROB_CH_DONE, give the chapter its number in ROB_PLAN and add a file
// rob-k4.js …, a tab and a panel in index.html and its tab in courses.js.
//
// This file has what every Robotics page uses: the semester plan, progress and the check at the end
// of each section, the chapter pages, Home, the formula sheet, the card on the course picker and the
// drawing helpers (numbers, matrices, a 3-D view, a planar arm). The chapters are in rob-k0.js …
// rob-k3.js.
//
// It reuses NuMa's KaTeX setup ($…$ via nmTypeset and tx()), LEN's page parts (len-sec, len-index,
// len-toc, checks, lenWire, lenOut) and ProPa's (pw, pbtn, pseg, pslider, ppW, ppFacts, ppGist,
// ppTraps), which load before this file.
//
// Colours mean the same everywhere: a frame's x axis is red, y green, z blue (as on the slides);
// joint angles and what moves now are gold, the target is pink, an error red and dashed.

const ROB_CHAPTERS = [];
// The last chapter given so far. Later topics are shown pale on Home.
const ROB_CH_DONE = 3;

// The semester plan: the "Lecture Content" slide of chapter 0, in its order. The slides give no date
// for a single lecture, so dates stay empty ("") until one is announced: [chapter, date, topic].
// A topic's chapter number is filled in once its slides are out.
const ROB_PLAN = [
  [0, "", "What is Robotics?"],
  [1, "", "Mathematical Foundations"],
  [2, "", "Kinematics"],
  [3, "", "Inverse Kinematics"],
  [null, "", "Dynamics"],
  [null, "", "Control"],
  [null, "", "Motion Planning"],
  [null, "", "Grasping"],
  [null, "", "Robot Vision"],
  [null, "", "Ethics in Robotics"],
  [null, "", "Programming by Demonstration (PbD)"],
  [null, "", "Task Planning"],
];
// From chapter 0 (Organization).
const ROB_EXAM = { date: "March 31, 2027", time: "08:00–10:00", minutes: 120, register: "March 21, 2027" };
const ROB_TIMES = "Monday 14:00–15:30 (Gerthsen lecture hall) and Wednesday 15:45–17:15 (HS am Fasanengarten)";

/* ---------------------------------------------------------------- Numbers and matrices */

// Numbers the English way: decimal point, a real minus, trailing zeros dropped.
function rbN(x, d = 3) {
  if (!isFinite(x)) return x > 0 ? "∞" : x < 0 ? "−∞" : "NaN";
  let s = Math.abs(x).toFixed(d);
  if (s.includes(".")) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return (x < 0 && +s !== 0 ? "−" : "") + s;
}
// The same for $…$.
const rt = (x, d = 3) => rbN(x, d).replace("−", "-");
const rbDeg = (r) => (r * 180) / Math.PI;
const rbRad = (d) => (d * Math.PI) / 180;

const rbMul = (A, B) => A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
const rbMv = (A, v) => A.map((r) => r.reduce((s, a, k) => s + a * v[k], 0));
const rbT = (A) => A[0].map((_, j) => A.map((r) => r[j]));
const rbI = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
const rbRx = (a) => [[1, 0, 0], [0, Math.cos(a), -Math.sin(a)], [0, Math.sin(a), Math.cos(a)]];
const rbRy = (a) => [[Math.cos(a), 0, Math.sin(a)], [0, 1, 0], [-Math.sin(a), 0, Math.cos(a)]];
const rbRz = (a) => [[Math.cos(a), -Math.sin(a), 0], [Math.sin(a), Math.cos(a), 0], [0, 0, 1]];
// A homogeneous 4 × 4 matrix from R and t, and back.
const rbH = (R, t = [0, 0, 0]) => [[...R[0], t[0]], [...R[1], t[1]], [...R[2], t[2]], [0, 0, 0, 1]];
const rbHR = (T) => T.slice(0, 3).map((r) => r.slice(0, 3));
const rbHt = (T) => T.slice(0, 3).map((r) => r[3]);
// The DH transformation of the lecture: Rot(z, θ) · Trans(z, d) · Trans(x, a) · Rot(x, α).
function rbDH(a, alpha, d, theta) {
  const ct = Math.cos(theta), st = Math.sin(theta), ca = Math.cos(alpha), sa = Math.sin(alpha);
  return [[ct, -st * ca, st * sa, a * ct], [st, ct * ca, -ct * sa, a * st], [0, sa, ca, d], [0, 0, 0, 1]];
}
// A matrix for $…$, small values shown as 0.
const rbTex = (M, d = 3) => `\\begin{pmatrix}${M.map((r) => r.map((x) => rt(Math.abs(x) < 5e-4 ? 0 : x, d)).join(" & ")).join("\\\\")}\\end{pmatrix}`;
const rbTexV = (v, d = 3) => rbTex(v.map((x) => [x]), d);

// The two-link planar arm of chapters 2 and 3 (link lengths l1, l2): end-effector position and Jacobian.
const rbF2 = ([a, b], l1 = 1, l2 = 1) => [l1 * Math.cos(a) + l2 * Math.cos(a + b), l1 * Math.sin(a) + l2 * Math.sin(a + b)];
const rbJ2 = ([a, b], l1 = 1, l2 = 1) => [
  [-l1 * Math.sin(a) - l2 * Math.sin(a + b), -l2 * Math.sin(a + b)],
  [l1 * Math.cos(a) + l2 * Math.cos(a + b), l2 * Math.cos(a + b)],
];
// Singular values of a 2 × 2 matrix, the larger first, with the directions of the ellipse's axes.
function rbSvd2(J) {
  const A = rbMul(J, rbT(J));
  const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
  const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
  const ang = Math.abs(A[0][1]) > 1e-12 ? Math.atan2(l1 - A[0][0], A[0][1]) : A[0][0] >= A[1][1] ? 0 : Math.PI / 2;
  return { s1: Math.sqrt(l1), s2: Math.sqrt(l2), ang, det: J[0][0] * J[1][1] - J[0][1] * J[1][0] };
}
// Angles to (−π, π].
const rbWrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

/* ---------------------------------------------------------------- Drawings */

// A 2-D frame: x, y maps into an SVG of W × H, with axes and ticks in English numbers.
function rbFrame(W, H, [x0, x1], [y0, y1], pad = { l: 30, r: 10, t: 10, b: 24 }) {
  const X = (x) => pad.l + ((x - x0) / (x1 - x0)) * (W - pad.l - pad.r);
  const Y = (y) => H - pad.b - ((y - y0) / (y1 - y0)) * (H - pad.t - pad.b);
  const axes = ({ xt = [], yt = [], xl = "", yl = "", grid = false } = {}) => {
    const ay = y0 <= 0 && y1 >= 0 ? Y(0) : H - pad.b, ax = x0 <= 0 && x1 >= 0 ? X(0) : pad.l;
    return (grid ? xt.map((t) => `<line x1="${X(t)}" y1="${pad.t}" x2="${X(t)}" y2="${H - pad.b}" class="rb-grid"/>`).join("") +
      yt.map((t) => `<line x1="${pad.l}" y1="${Y(t)}" x2="${W - pad.r}" y2="${Y(t)}" class="rb-grid"/>`).join("") : "") +
      `<line x1="${pad.l}" y1="${ay}" x2="${W - pad.r}" y2="${ay}" class="tick"/><line x1="${ax}" y1="${pad.t}" x2="${ax}" y2="${H - pad.b}" class="tick"/>` +
      xt.map((t) => `<text x="${X(t)}" y="${ay + 15}" text-anchor="middle" class="tick-t">${typeof t === "number" ? rbN(t, 2) : t}</text>`).join("") +
      yt.map((t) => `<text x="${ax - 5}" y="${Y(t) + 4}" text-anchor="end" class="tick-t">${rbN(t, 2)}</text>`).join("") +
      (xl ? `<text x="${W - pad.r}" y="${ay - 6}" text-anchor="end" class="ax-t">${xl}</text>` : "") +
      (yl ? `<text x="${ax + 6}" y="${pad.t + 10}" class="ax-t">${yl}</text>` : "");
  };
  return { X, Y, axes, W, H };
}

// A planar arm: joint positions [[x, y], …] (base first, end effector last) in a frame P.
function rbArmSVG(P, pts, { cls = "", ghost = false, labels = true } = {}) {
  const xy = pts.map(([x, y]) => [P.X(x), P.Y(y)]);
  const [bx, by] = xy[0];
  return `<g class="rb-arm ${ghost ? "ghost" : ""} ${cls}">
    ${ghost ? "" : `<path d="M${bx - 14},${by + 16} L${bx + 14},${by + 16} L${bx},${by} Z" class="rb-base"/><line x1="${bx - 20}" y1="${by + 16}" x2="${bx + 20}" y2="${by + 16}" class="rb-ground"/>`}
    ${xy.slice(1).map(([x, y], i) => `<line x1="${xy[i][0]}" y1="${xy[i][1]}" x2="${x}" y2="${y}" class="rb-link"/>`).join("")}
    ${xy.slice(0, -1).map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${ghost ? 4 : 6}" class="rb-joint"/>${labels && !ghost ? `<text x="${x + 9}" y="${y - 8}" class="rb-jl">${i + 1}</text>` : ""}`).join("")}
    <circle cx="${xy.at(-1)[0]}" cy="${xy.at(-1)[1]}" r="${ghost ? 4 : 5.5}" class="rb-eef"/>
  </g>`;
}
// The joints of a planar serial arm with angles th (relative) and lengths ls.
function rbPlanar(th, ls) {
  const pts = [[0, 0]];
  let a = 0;
  th.forEach((t, i) => { a += t; const [x, y] = pts[i]; pts.push([x + ls[i] * Math.cos(a), y + ls[i] * Math.sin(a)]); });
  return pts;
}

// A simple 3-D view (azimuth az, elevation el in degrees): x points to the viewer's lower left, y to
// the right, z up, as on the slides.
function rbView(cx, cy, s, az = 35, el = 22) {
  const a = rbRad(az), e = rbRad(el);
  const r = [-Math.sin(a), Math.cos(a), 0], u = [-Math.sin(e) * Math.cos(a), -Math.sin(e) * Math.sin(a), Math.cos(e)];
  const p = (v) => [cx + s * (r[0] * v[0] + r[1] * v[1]), cy - s * (u[0] * v[0] + u[1] * v[1] + u[2] * v[2])];
  // A frame given as a 4 × 4 matrix (or R and an origin): its x, y and z axes as arrows.
  const frame = (T, len = 1, label = "", { dim = false, sub = "" } = {}) => {
    const o = rbHt(T), R = rbHR(T);
    const [ox, oy] = p(o);
    const ax = [0, 1, 2].map((k) => {
      const e = [R[0][k], R[1][k], R[2][k]];
      const [ex, ey] = p(o.map((c, i) => c + len * e[i]));
      return `${arrowSVG(ox, oy, ex, ey, `rb-ax rb-ax-${"xyz"[k]}`, dim ? 1.6 : 2.4, dim ? 7 : 9)}
        <text x="${ex + (ex - ox) * 0.12}" y="${ey + (ey - oy) * 0.12 + 4}" text-anchor="middle" class="rb-axt rb-axt-${"xyz"[k]}">${"xyz"[k]}${sub}</text>`;
    }).join("");
    return `<g class="rb-frame ${dim ? "dim" : ""}"><circle cx="${ox}" cy="${oy}" r="2.6" class="rb-orig"/>${ax}
      ${label ? `<text x="${ox - 8}" y="${oy + 16}" text-anchor="end" class="rb-fl">${label}</text>` : ""}</g>`;
  };
  return { p, frame };
}

// A row of numbers a drawing reads out: [[label, value], …].
const rbVals = (rows) => `<div class="lw-vals">${rows.map(([k, v]) => `<span>${k}</span><b>${v}</b>`).join("")}</div>`;

/* ---------------------------------------------------------------- Progress */

const rbPassMark = (n) => n - 1;
const rbBest = (sec) => store.get("robChecks", {})[sec.id];
const rbPassed = (sec) => (rbBest(sec) ?? -1) >= rbPassMark(sec.check.length);
const rbSections = () => ROB_CHAPTERS.flatMap((ch) => ch.sections);
const rbNextSection = () => rbSections().find((s) => !rbPassed(s)) || rbSections()[0];
const rbSecId = (id) => "rbSec-" + id.replace(/\./g, "-");
const rbChapterOf = (id) => ROB_CHAPTERS.find((ch) => ch.sections.some((s) => s.id === id));
const rbTab = (ch) => "rob-k" + ch.n;

function rbScrollTo(id) {
  const el = $("#" + rbSecId(id));
  if (!el) return;
  const index = $(`#${rbTab(rbChapterOf(id))} .len-index`);
  window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - barHeight() - (index ? index.offsetHeight : 0) - 8 });
}
function openRobSection(id) {
  const ch = rbChapterOf(id);
  if (!ch) return;
  showTab(rbTab(ch));
  rbScrollTo(id);
}
// A link to another section, inside the text.
const rbSee = (id, label = `section ${id}`) => `<button type="button" class="nm-see" data-sec="${id}">${label}</button>`;

/* ---------------------------------------------------------------- Section checks */

// The check at the end of a section: { q, opts: [...] (the first is right), why }, all HTML.
function renderRobCheck(box, sec) {
  const n = sec.check.length;
  const best = rbBest(sec);
  box.innerHTML = `
    <div class="card-head">
      <h3>Quick check · ${sec.id}</h3>
      ${rbPassed(sec) ? `<span class="pill good">✓ passed</span>` : ""}
    </div>
    <p class="small muted">${n} questions. ${rbPassMark(n)} right and the section is done.${best === undefined ? "" : ` Best so far: ${best} / ${n}.`}</p>
    <button class="btn primary" type="button">${best === undefined ? "Start the check" : "Try again"}</button>`;
  $("button", box).onclick = () => runRobCheck(box, sec);
}

function runRobCheck(box, sec) {
  track("rob.check");
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
        <div class="q-actions"><button class="btn primary" type="button">${last ? "Result" : "Next →"}</button></div>`;
      $(".q-actions .btn", box).onclick = () => { i++; i < qs.length ? ask() : done(); };
      $(".q-actions .btn", box).focus({ preventScroll: true });
    }));
  };
  const done = () => {
    track("rob.checkDone");
    const all = store.get("robChecks", {});
    if (score > (all[sec.id] ?? -1)) store.set("robChecks", { ...all, [sec.id]: score });
    const passed = score >= rbPassMark(qs.length);
    renderRobCheck(box, sec);
    box.insertAdjacentHTML("afterbegin", `<p class="len-result ${passed ? "ok" : "bad"}">${score} / ${qs.length} — ${passed
      ? "Section done!" : "Have another look at the section and try again."}</p>`);
    rbUpdateIndex(rbChapterOf(sec.id));
  };
  ask();
}

/* ---------------------------------------------------------------- Chapter pages */

// The questions the slides leave open, with an answer to open.
const rbThink = (items) => `<div class="card gk-self"><h3>Think about it</h3>${items.map(([q, a]) =>
  `<details class="len-aside"><summary>${q}</summary><div>${a}</div></details>`).join("")}</div>`;

function renderRobChapter(ch) {
  const panel = $("#" + rbTab(ch));
  const next = ROB_CHAPTERS.find((c) => c.n === ch.n + 1);
  panel.innerHTML = `
    <div class="card hero">
      <span class="len-kicker">Chapter ${ch.n} · ${ch.title}</span>
      <h1>${ch.headline}</h1>
      <p>${ch.intro}</p>
    </div>
    <nav class="len-index" aria-label="Sections"></nav>
    ${ch.sections.map((s) => `
      <section class="len-sec" id="${rbSecId(s.id)}">
        <div class="len-sec-head"><span class="len-num">${s.id}</span><h2>${s.title}</h2></div>
        ${s.html()}
        <div class="card len-check" data-check="${s.id}"></div>
      </section>`).join("")}
    <div class="pp-next">${next
      ? `<button class="btn primary" type="button" data-go="${rbTab(next)}">Next: Chapter ${next.n} · ${next.title} →</button>`
      : `<button class="btn primary" type="button" data-go="rob-home">Back to the semester plan →</button>`}</div>`;
  ch.sections.forEach((s) => {
    s.setup?.($("#" + rbSecId(s.id)));
    renderRobCheck($(`[data-check="${s.id}"]`, panel), s);
  });
  $$("[data-go]", panel).forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
  $$("[data-sec]", panel).forEach((b) => (b.onclick = () => openRobSection(b.dataset.sec)));
  rbUpdateIndex(ch);
}

function rbUpdateIndex(ch) {
  const ix = $(`#${rbTab(ch)} .len-index`);
  if (!ix) return;
  ix.innerHTML = ch.sections.map((s) => `
    <button type="button" class="len-ix ${rbPassed(s) ? "done" : ""}" data-ix="${s.id}">
      <span class="len-num">${s.id}</span>${s.short}${rbPassed(s) ? ' <span class="len-ix-ok" aria-hidden="true">✓</span>' : ""}</button>`).join("");
  $$("button", ix).forEach((b) => (b.onclick = () => rbScrollTo(b.dataset.ix)));
}

/* ---------------------------------------------------------------- Home */

function renderRobHome() {
  const next = rbNextSection();
  const allDone = rbSections().every(rbPassed);
  const done = ROB_PLAN.filter(([n]) => n !== null && n <= ROB_CH_DONE).length;
  $("#rob-home").innerHTML = `
    <div class="card hero">
      <h1>Robotics <span class="accent">I</span></h1>
      <p>The lecture for review, chapter by chapter: each idea in short, the formulas from the slides, drawings to play with —
        an arm you move joint by joint, frames you rotate about local or global axes, a manipulability ellipse that collapses at a singularity,
        inverse kinematics solved step by step —, the usual traps and a quick check per section.</p>
      <p class="small">The lecture is still running: so far <b>chapters 0–${ROB_CH_DONE}</b> are here, ${done} of the ${ROB_PLAN.length} topics on the plan.
        Exam on <b>${ROB_EXAM.date}</b>, ${ROB_EXAM.time}, ${ROB_EXAM.minutes} minutes, written, in English.</p>
      <div class="home-actions">
        <button class="btn primary" type="button" id="rbGo">${allDone ? "Review from the start" : `Continue with ${next.id}: ${next.title}`} →</button>
        <button class="btn" type="button" data-go="rob-exams">Old exams</button>
        <button class="btn" type="button" data-go="rob-sheet">Formula sheet</button>
      </div>
    </div>
    <div class="card">
      <h2>Semester plan</h2>
      <p class="small muted">The topics from the “Lecture Content” slide of chapter 0, in its order. The slides give no date for a single lecture,
        so the date column stays empty until one is announced. Right: the old-exam topics that belong to it. Lectures: ${ROB_TIMES}.</p>
      <span class="lmastery-bar course-bar len-bar"><span style="width:${(done / ROB_PLAN.length) * 100}%"></span></span>
      <div class="rb-plan">
        ${ROB_PLAN.map(([n, d, t], i) => {
          const ch = n === null ? null : ROB_CHAPTERS.find((c) => c.n === n);
          const isDone = n !== null && n <= ROB_CH_DONE;
          const secs = ch ? ch.sections : [];
          const passed = secs.filter(rbPassed).length;
          return `<div class="rb-plan-row ${isDone ? "done" : ""}">
            <span class="len-num ${n === null ? "rb-tbd" : ""}">${n === null ? "?" : n}</span>
            <span class="small muted">${d || "—"}</span>
            <span>${ch ? `<button type="button" class="nm-see" data-go="${rbTab(ch)}">${t}</button>` : t}</span>
            <span class="nm-pills">${rbTopicsOfPlan(i).map((tp) => rbTopicPill(tp)).join("")}</span>
            <span class="small ${isDone ? "" : "muted"}">${ch ? `${passed} / ${secs.length} sections` : "not here yet"}</span>
          </div>`;
        }).join("")}
        <div class="rb-plan-row rb-plan-exam">
          <span class="len-num">✎</span><span class="small muted">31.03.</span>
          <span><b>Exam</b> · ${ROB_EXAM.time}, ${ROB_EXAM.minutes} minutes, in English</span>
          <span></span><span class="small muted">register by ${ROB_EXAM.register}</span>
        </div>
      </div>
    </div>
    ${ROB_CHAPTERS.map(rbChapterCardHTML).join("")}
    <div class="card">
      <h2>Colours</h2>
      <p class="small muted">The same on every page, in formulas and drawings.</p>
      <div class="len-legend">
        ${[["rb-x-t", "x", "a frame's x axis"], ["rb-y-t", "y", "y axis"], ["rb-z-t", "z", "z axis"],
          ["rb-th-t", "θ", "joint angle, what moves now"], ["rb-goal-t", "◎", "target pose"], ["rb-err-t", "e", "error"]]
          .map(([c, m, t]) => `<span class="len-swatch"><b class="${c}">${m}</b>${t}</span>`).join("")}
      </div>
    </div>`;
  $("#rbGo").onclick = () => { track("rob.continue"); openRobSection(next.id); };
  $$("#rob-home [data-sec]").forEach((b) => (b.onclick = () => openRobSection(b.dataset.sec)));
  $$("#rob-home [data-go]").forEach((b) => (b.onclick = () => { showTab(b.dataset.go); window.scrollTo({ top: 0 }); }));
}

function rbChapterCardHTML(ch) {
  const done = ch.sections.filter(rbPassed).length;
  return `
    <div class="card">
      <div class="card-head">
        <h2>Chapter ${ch.n} · ${ch.title}</h2>
        <span class="small muted"><b>${done}</b> / ${ch.sections.length} sections</span>
      </div>
      <span class="lmastery-bar course-bar len-bar"><span style="width:${(done / ch.sections.length) * 100}%"></span></span>
      <div class="len-toc">
        ${ch.sections.map((s) => `
          <button class="len-toc-tile ${rbPassed(s) ? "done" : ""}" type="button" data-sec="${s.id}">
            <span class="len-num">${s.id}</span>
            <span><b>${s.title}</b><span class="small muted">${s.about}</span></span>
            <span class="len-toc-state" aria-hidden="true">${rbPassed(s) ? "✓" : ""}</span>
          </button>`).join("")}
      </div>
    </div>`;
}

// The course picker's card for Robotics I.
function robCourseCardHTML(c) {
  const secs = rbSections();
  const done = secs.filter(rbPassed).length;
  const next = rbNextSection();
  return `
    <div class="course-card" style="--cc:${c.color}">
      <span class="course-mark short len-mark" aria-hidden="true">${c.mark}</span>
      <div class="course-body">
        <h2>${c.name}</h2>
        <p class="muted">Rotations and frames, Denavit–Hartenberg, the Jacobian and inverse kinematics — with an arm you can move.
          The lecture is still running: chapters 0–${ROB_CH_DONE} are here.</p>
      </div>
      <div class="course-side">
        <div class="course-stats small">
          <span><b>${done}</b> / ${secs.length} sections</span>
          <span>${ROB_CHAPTERS.length} chapters · ${ROB_EXAMS.length} old exams</span>
        </div>
        <span class="lmastery-bar course-bar"><span style="width:${(done / secs.length) * 100}%"></span></span>
        <div class="home-actions">
          <button class="btn primary" data-course="${c.id}">Open course →</button>
          <button class="btn" id="rbCourseGo" data-sec="${next.id}">Continue with ${next.id}</button>
        </div>
      </div>
    </div>`;
}

function wireRobCourseCard() {
  const go = $("#rbCourseGo");
  if (go) go.onclick = () => { track("courses.robContinue"); openRobSection(go.dataset.sec); };
}

/* ---------------------------------------------------------------- Formula sheet */

// [group, [[what, formula (TeX), note, section]]]
const ROB_SHEET = [
  ["Rotations", [
    ["SO(3)", `R^\\top R = R R^\\top = I,\\qquad \\det R = 1,\\qquad R^{-1} = R^\\top`, "Lengths, angles and handedness are kept.", "1.2"],
    ["2-D rotation", `R(\\varphi) = \\begin{pmatrix}\\cos\\varphi & -\\sin\\varphi\\\\ \\sin\\varphi & \\cos\\varphi\\end{pmatrix}`, "The columns are the rotated unit vectors.", "1.2"],
    ["About a point c", `f_{c,\\varphi}(x) = R(x - c) + c = Rx + (c - Rc)`, "Affine, not linear.", "1.2"],
    ["Basic rotations", `R_x(\\alpha) = \\begin{pmatrix}1&0&0\\\\0&c_\\alpha&-s_\\alpha\\\\0&s_\\alpha&c_\\alpha\\end{pmatrix},\\ R_y(\\beta) = \\begin{pmatrix}c_\\beta&0&s_\\beta\\\\0&1&0\\\\-s_\\beta&0&c_\\beta\\end{pmatrix},\\ R_z(\\gamma) = \\begin{pmatrix}c_\\gamma&-s_\\gamma&0\\\\s_\\gamma&c_\\gamma&0\\\\0&0&1\\end{pmatrix}`, "Watch the sign of sin in $R_y$.", "1.3"],
    ["Concatenation", `R = R_1 R_2 R_3`, "Left to right: about the local (moving) axes. Right to left: about the global (fixed) axes.", "1.3"],
    ["Euler ZY′Z″", `R = R_z(\\alpha)\\,R_{y'}(\\beta)\\,R_{z''}(\\gamma)`, "Local axes. 12 sequences, ×2 for local/fixed = 24 conventions.", "1.4"],
    ["Roll–pitch–yaw", `R_{RPY} = R_z(\\gamma)\\,R_y(\\beta)\\,R_x(\\alpha)`, "Fixed X, then Y, then Z. Gimbal lock at $\\beta = \\pm 90°$.", "1.4"],
  ]],
  ["Homogeneous transformations", [
    ["Coordinates", `\\tilde x = (x, y, z, h)^\\top,\\quad h = 1 \\text{ point},\\ h = 0 \\text{ direction}`, "A direction is not moved by a translation.", "1.5"],
    ["Matrix", `T = \\begin{pmatrix} R & t\\\\ 0^\\top & 1\\end{pmatrix} = \\begin{pmatrix} n & o & a & u\\\\ 0&0&0&1\\end{pmatrix} \\in SE(3)`, "Columns: the axes of B (normal, orientation, approach) and its origin, all in A.", "1.5"],
    ["Inverse", `T^{-1} = \\begin{pmatrix} R^\\top & -R^\\top t\\\\ 0^\\top & 1\\end{pmatrix}`, "Not $-t$: the translation is rotated back too.", "1.5"],
    ["Change of frame", `{}^{A}p = {}^{A}T_{B}\\,{}^{B}p,\\qquad {}^{0}T_{n} = {}^{0}T_{1}\\,{}^{1}T_{2}\\cdots{}^{n-1}T_{n}`, "Each matrix refers to the frame of the one on its left.", "1.5"],
  ]],
  ["Quaternions", [
    ["Definition", `q = (s, v) = s + v_1 i + v_2 j + v_3 k,\\qquad i^2 = j^2 = k^2 = ijk = -1`, "$ij = k = -ji$, not commutative.", "1.6"],
    ["Product", `q_1 q_2 = (s_1 s_2 - v_1\\cdot v_2,\\ s_1 v_2 + s_2 v_1 + v_1 \\times v_2)`, "", "1.6"],
    ["Conjugate, norm, inverse", `\\bar q = (s, -v),\\quad |q| = \\sqrt{q\\bar q} = \\sqrt{s^2 + v_1^2 + v_2^2 + v_3^2},\\quad q^{-1} = \\frac{\\bar q}{|q|^2}`, "", "1.6"],
    ["Rotation", `q = \\big(\\cos\\tfrac\\theta2,\\ n\\sin\\tfrac\\theta2\\big),\\qquad p' = q\\,p\\,\\bar q,\\quad p = (0, x)`, "$q$ and $-q$ are the same rotation. Concatenation = product.", "1.6"],
    ["SLERP", `\\mathrm{Slerp}(q_1, q_2, t) = \\frac{\\sin((1-t)\\theta)}{\\sin\\theta}q_1 + \\frac{\\sin(t\\theta)}{\\sin\\theta}q_2,\\quad \\cos\\theta = q_1\\cdot q_2`, "Constant angular velocity. Check $q_2$ against $-q_2$ for the shorter way.", "1.6"],
    ["Dual quaternion", `\\hat q = q_r + \\varepsilon q_d,\\ \\varepsilon^2 = 0,\\qquad \\hat q_t = 1 + \\varepsilon\\big(0, \\tfrac{t}{2}\\big),\\quad \\hat q = \\hat q_t\\,\\hat q_r`, "8 numbers for a whole pose.", "1.7"],
  ]],
  ["Forward kinematics", [
    ["DH transformation", `{}^{i-1}T_i = R_z(\\theta_i)\\,T_z(d_i)\\,T_x(a_i)\\,R_x(\\alpha_i)`, "Revolute: $\\theta_i$ varies. Prismatic: $d_i$ varies.", "2.2"],
    ["DH matrix", `{}^{i-1}T_i = \\begin{pmatrix} c\\theta_i & -s\\theta_i c\\alpha_i & s\\theta_i s\\alpha_i & a_i c\\theta_i\\\\ s\\theta_i & c\\theta_i c\\alpha_i & -c\\theta_i s\\alpha_i & a_i s\\theta_i\\\\ 0 & s\\alpha_i & c\\alpha_i & d_i\\\\ 0&0&0&1\\end{pmatrix}`, "", "2.2"],
    ["Forward kinematics", `x = f(\\theta),\\quad f: C \\subseteq \\mathbb R^n \\to X \\subseteq \\mathbb R^m,\\qquad {}^{0}T_n(\\theta) = \\prod_{i=1}^n {}^{i-1}T_i(\\theta_i)`, "", "2.3"],
    ["Planar 3-link arm", `x = a_1c_1 + a_2c_{12} + a_3c_{123},\\quad y = a_1s_1 + a_2s_{12} + a_3s_{123},\\quad \\varphi = \\theta_1+\\theta_2+\\theta_3`, "$c_{12} = \\cos(\\theta_1 + \\theta_2)$.", "2.3"],
  ]],
  ["Jacobian", [
    ["Velocities", `\\dot x = J(\\theta)\\,\\dot\\theta,\\qquad J = \\frac{\\partial f}{\\partial\\theta} \\in \\mathbb R^{m\\times n}`, "Column $i$: what joint $i$ alone does to the end effector.", "2.4"],
    ["Forces", `\\tau = J^\\top(\\theta)\\,F`, "From virtual work: $\\tau^\\top\\dot\\theta = F^\\top\\dot x$.", "2.4"],
    ["Geometric columns", `J_i = \\begin{pmatrix} z_{i-1}\\\\ 0\\end{pmatrix} \\text{ (prismatic)},\\qquad J_i = \\begin{pmatrix} z_{i-1}\\times(p - p_{i-1})\\\\ z_{i-1}\\end{pmatrix}\\text{ (revolute)}`, "$p$: position of the end effector.", "2.4"],
    ["2-link arm", `J = \\begin{pmatrix} -l_1s_1 - l_2s_{12} & -l_2s_{12}\\\\ l_1c_1 + l_2c_{12} & l_2c_{12}\\end{pmatrix},\\qquad \\det J = l_1l_2\\sin\\theta_2`, "Singular at $\\theta_2 = 0$ and $\\pi$.", "2.4"],
    ["Singular", `\\operatorname{rank} J(\\theta) < \\min(m, n)`, "Some end-effector motions are impossible; near it, joint speeds blow up.", "2.5"],
    ["Manipulability", `A = JJ^\\top,\\quad \\sigma_i = \\sqrt{\\lambda_i(A)},\\quad V \\propto \\sqrt{\\det(JJ^\\top)}`, "Measures: $\\sigma_{min}$, $\\sigma_{min}/\\sigma_{max}$, $\\det$.", "2.5"],
    ["Force ellipsoid", `\\text{axes } \\propto 1/\\sigma_i`, "Easy to move in a direction ⇔ hard to push in it.", "2.5"],
  ]],
  ["Inverse kinematics", [
    ["2-link, closed form", `\\cos\\theta_2 = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2},\\qquad \\theta_1 = \\operatorname{atan2}(y, x) \\mp \\psi`, "$\\cos\\psi = \\frac{x^2 + y^2 + l_1^2 - l_2^2}{2l_1\\sqrt{x^2+y^2}}$. Two solutions: elbow up / down.", "3.2"],
    ["Half-angle substitution", `u = \\tan\\tfrac\\theta2:\\quad \\cos\\theta = \\frac{1-u^2}{1+u^2},\\quad \\sin\\theta = \\frac{2u}{1+u^2}`, "Turns sin/cos equations into polynomials.", "3.2"],
    ["Gradient descent", `e(\\theta) = \\|x_{goal} - f(\\theta)\\|^2,\\quad \\nabla e = -2J^\\top(x_{goal} - f(\\theta)),\\quad \\theta_{k+1} = \\theta_k - \\gamma\\nabla e`, "", "3.4"],
    ["Pseudoinverse", `J^+ = J^\\top(JJ^\\top)^{-1},\\qquad \\Delta\\theta = J^+\\Delta x`, "Full row rank. Least squares; for redundant arms the smallest $\\|\\Delta\\theta\\|$.", "3.5"],
    ["Damped least squares", `\\Delta\\theta = J^\\top(JJ^\\top + \\lambda^2 I)^{-1}\\Delta x = \\sum_i \\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}v_iu_i^\\top\\Delta x`, "Pseudoinverse: $\\sum_i \\frac1{\\sigma_i}v_iu_i^\\top$ — blows up as $\\sigma_i \\to 0$.", "3.6"],
  ]],
];
const ROB_TERMS = [
  ["Robot (VDI 2860)", "freely programmable, multifunctional manipulator with at least 3 independent axes, moving material, parts, tools along programmed, variable trajectories.", "0.1"],
  ["Industrial robot (ISO 8373)", "automatically controlled, reprogrammable, multipurpose manipulator, programmable in three or more axes, fixed or mobile.", "0.3"],
  ["Service robot", "works half- or fully autonomously to perform useful tasks for humans and institutions; industrial production excluded.", "0.3"],
  ["Kinematics", "motion from geometry alone, without forces. Key concept: the pose.", "1.1"],
  ["Statics", "forces and torques on a body at rest: static equilibrium.", "1.1"],
  ["Dynamics", "the relation between forces/torques and the motion they produce.", "1.1"],
  ["Pose", "position and orientation together.", "1.1"],
  ["Degrees of freedom (DoF)", "number of independent parameters that fix position and orientation. Rigid body: 3 in the plane, 6 in space.", "1.1"],
  ["Kinematic chain", "links connected by joints. Open (serial or branched) or closed (contains loops, e.g. parallel robots).", "1.1"],
  ["Affine transformation", "$f(x) = Ax + t$: linear plus a constant. Rotation about a point other than the origin is one.", "1.2"],
  ["Gimbal lock", "two rotation axes line up; one degree of freedom is lost (RPY at $\\beta = \\pm90°$).", "1.4"],
  ["BCS, ECS, OCS", "base, end-effector and object coordinate system.", "1.5"],
  ["TCP", "tool center point: the reference point at the end effector.", "2.6"],
  ["Configuration space", "joint space: one coordinate per joint, $\\theta \\in C \\subseteq \\mathbb R^n$.", "2.1"],
  ["Task space", "Cartesian space of end-effector poses, $x \\in X \\subseteq \\mathbb R^m$.", "2.1"],
  ["DH parameters", "$a_i$ link length, $\\alpha_i$ link twist, $d_i$ link offset, $\\theta_i$ joint angle.", "2.2"],
  ["Kinematic singularity", "configuration where the end effector cannot move instantaneously in some direction: rank $J$ drops.", "2.5"],
  ["Manipulability ellipsoid", "image of the unit sphere of joint velocities under $J$.", "2.5"],
  ["Reachability map", "6-D grid over the workspace, filled offline by forward kinematics; lookup in $O(1)$.", "2.6"],
  ["Injective / surjective", "at most one / at least one $\\theta$ for each $x$. Forward kinematics is in general neither.", "3.1"],
  ["Redundant robot", "more joints than task dimensions ($n > m$): infinitely many solutions, self-motion in the null space.", "3.5"],
  ["Null space", "$\\{\\dot\\theta : J\\dot\\theta = 0\\}$: joint motions that do not move the end effector.", "3.6"],
];

function renderRobSheet() {
  $("#rob-sheet").innerHTML = `
    <div class="card hero">
      <h1>Formula <span class="accent">sheet</span></h1>
      <p>The formulas of chapters 1–${ROB_CH_DONE} on one page. Click a section number for the explanation.</p>
      <input type="search" class="len-search pp-search" id="rbSheetSearch" placeholder="Search formulas and terms …" aria-label="Search the formula sheet">
    </div>
    ${ROB_SHEET.map(([group, rows]) => `
      <div class="card pp-sheet-group">
        <h2>${group}</h2>
        <div class="pp-sheet">
          ${rows.map(([what, f, note, sec]) => `
            <div class="pp-sheet-row">
              <div class="pp-sheet-what"><button type="button" class="len-num len-f-sec" data-sec="${sec}" title="Go to the section">${sec}</button><b>${what}</b>${note ? `<span class="small muted">${note}</span>` : ""}</div>
              <div class="nm-sheet-f">$$${f}$$</div>
            </div>`).join("")}
        </div>
      </div>`).join("")}
    <div class="card pp-sheet-group">
      <h2>Terms</h2>
      <table class="len-terms pp-terms">
        <tbody>${[...ROB_TERMS].sort((a, b) => a[0].localeCompare(b[0], "en")).map(([t, m, sec]) =>
          `<tr><td><b>${t}</b></td><td>${m}</td><td><button type="button" class="len-num len-f-sec pp-term-sec" data-sec="${sec}" title="Go to the section">${sec}</button></td></tr>`).join("")}</tbody>
      </table>
    </div>`;
  $$("#rob-sheet [data-sec]").forEach((b) => (b.onclick = () => openRobSection(b.dataset.sec)));
  const search = $("#rbSheetSearch");
  search.oninput = () => {
    const q = search.value.trim().toLowerCase();
    $$("#rob-sheet .pp-sheet-row, #rob-sheet .pp-terms tr").forEach((r) => (r.hidden = q && !r.textContent.toLowerCase().includes(q)));
    $$("#rob-sheet .pp-sheet-group").forEach((g) => (g.hidden = q && !$$(".pp-sheet-row:not([hidden]), .pp-terms tr:not([hidden])", g).length));
  };
}

/* ---------------------------------------------------------------- Setup */

// KaTeX for every Robotics panel, typeset again whenever its content changes (like NuMa's).
function setupRobTex() {
  const mo = new MutationObserver((ms) => {
    const els = [...new Set(ms.map((m) => (m.target.nodeType === 1 ? m.target : m.target.parentElement)).filter(Boolean))];
    els.filter((e) => e.isConnected && !els.some((o) => o !== e && o.contains(e))).forEach(nmTypeset);
  });
  $$('.panel[id^="rob-"]').forEach((p) => { nmTypeset(p); mo.observe(p, { childList: true, subtree: true, characterData: true }); });
}

function setupRob() {
  Object.assign(NM_TEX.macros, { "\\atan": "\\operatorname{atan2}" });
  ROB_CHAPTERS.sort((a, b) => a.n - b.n).forEach(renderRobChapter);
  renderRobSheet();
  setupRobTex();
}
