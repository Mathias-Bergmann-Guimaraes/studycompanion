// The study plan: its own page (#plan, from the picker's card) with today's share per course, every
// week of the plan from 16 Nov 2026 to the last exam on 31 Mar 2027 and where the courses overlap;
// and a summary card beside the courses on the picker. Each section in it is a chip that opens the
// section and is ticked once its check is passed.
//
// How the plan is built:
// - Courses whose lecture is still running (GKI, Robotics I, LEN) go at the lecture's pace: each
//   week, the sections of that week's lecture. GKI and Robotics I have one lecture a week each, so
//   each week holds one lecture of each. GKI's weeks follow GKI_PLAN; Robotics gives no dates per
//   chapter, so its weeks are an estimate: one lecture a week, the eight chapters still to come
//   over the ten lecture weeks left, the longer ones (Dynamics, Control, Motion Planning) over two.
// - Finished courses (NuMa, ProPa) are front-loaded: NuMa first, since its exam is the first and
//   GKI and Robotics build on its linear algebra; ProPa, which overlaps with nothing, after it.
// - Where two courses teach the same thing (least squares and the pseudoinverse, ridge and damped
//   least squares, the SVD, Newton and numerical IK, A* …), the bridge puts them in the same week.
// - From 15 Feb, the days up to each exam belong to that exam (CG and SuS too, from OTHER_EXAMS).
//
// When a week's dates or topics change, edit STUDY_PLAN below; nothing else needs to change.
// Loads after every course (it uses their sections, checks and openers) and is drawn by
// courses.js (courseWidgetsHTML) and app.js (showTab draws the page).

// [course, text, sections?]: course is a COURSES id or "cg"/"sus"; sections are chips.
const STUDY_PLAN = [
  {
    from: "2026-11-16", to: "2026-11-22", name: "W47", phase: "NuMa while the lectures build up",
    lec: [["gki", "VL 4 Neuronale Netze I"], ["robotics1", "Catch up on 0–3 if behind; Dynamics starts"], ["len", "This week's lecture and its Übungsaufgaben"]],
    main: [["numa", "LR, Cholesky, Householder and QR", ["2.1", "2.2", "2.3"]]],
    bridge: [["Solve one LEN mesh or nodal task with LR instead of Cramer", []],
      ["Rotations are orthogonal matrices; a Householder matrix is one too, but a reflection", [["robotics1", "1.2"], ["robotics1", "1.3"]]]],
  },
  {
    from: "2026-11-23", to: "2026-11-29", name: "W48", phase: "NuMa while the lectures build up",
    lec: [["gki", "VL 5 Backpropagation, optimisers"], ["robotics1", "Dynamics"], ["len", "This week's lecture"]],
    main: [["numa", "Condition, least squares, SVD", ["2.4", "2.5", "2.6"]]],
    bridge: [["Normal equation and ridge again, right after NuMa 2.5", [["gki", "2.2"], ["gki", "2.5"]]],
      ["Manipulability, pseudoinverse and damped least squares: the SVD at work", [["robotics1", "2.5"], ["robotics1", "3.5"], ["robotics1", "3.6"]]]],
  },
  {
    from: "2026-11-30", to: "2026-12-06", name: "W49", phase: "NuMa while the lectures build up",
    lec: [["gki", "VL 6 Generalisierung, Ensembles"], ["robotics1", "Control"], ["len", "This week's lecture"]],
    main: [["numa", "Newton in 1-D and N-D, applications", ["3.1", "3.2", "3.3"]]],
    bridge: [["Numerical IK is Newton with the Jacobian", [["robotics1", "2.4"], ["robotics1", "3.4"]]],
      ["Robotics' transfer functions use LEN's complex AC", []]],
  },
  {
    from: "2026-12-07", to: "2026-12-13", name: "W50", phase: "NuMa while the lectures build up",
    lec: [["gki", "VL 7 PCA, k-Means"], ["robotics1", "Control, then Motion Planning"], ["len", "This week's lecture"]],
    main: [["numa", "Eigenvalues; Jacobi, Gauß-Seidel and cg", ["6.1", "6.2", "6.3", "7.1", "7.2"]]],
    bridge: [["Eigenvalues the same week as GKI's PCA lecture", []],
      ["cg against steepest descent, next to gradient descent", [["gki", "3.5"]]]],
  },
  {
    from: "2026-12-14", to: "2026-12-20", name: "W51", phase: "NuMa while the lectures build up",
    lec: [["gki", "VL 8 GMM und EM"], ["robotics1", "Motion Planning"], ["len", "This week's lecture"]],
    main: [["numa", "Interpolation and splines, sparse matrices", ["4.1", "4.2", "4.3", "4.4", "7.3"]]],
    bridge: [["A* and BFS for Robotics: do GKI's search tasks now, they count for VL 14", []]],
  },
  {
    from: "2026-12-21", to: "2026-12-27", name: "W52", phase: "Holiday break", brk: true,
    lec: [["gki", "VL 9 CNNs (21 Dec)"], ["robotics1", "Catch up"]],
    main: [["numa", "Floating point, condition, stability; quadrature", ["1.1", "1.2", "1.3", "5.1", "5.2"]]],
    bridge: [["Floating point explains softmax overflow", [["gki", "3.6"]]], ["Leave the Christmas days free", []]],
  },
  {
    from: "2026-12-28", to: "2027-01-03", name: "W53", phase: "Holiday break", brk: true,
    lec: [],
    main: [["numa", "Gauß quadrature, summed rules: all of NuMa done", ["5.3", "5.4"]], ["propa", "Lean 1 Basics", ["1.1", "1.2", "1.3", "1.4"]]],
    bridge: [],
  },
  {
    from: "2027-01-04", to: "2027-01-10", name: "W1", phase: "Holiday break", brk: true,
    lec: [["len", "Old exam tasks for the topics taught so far"]],
    main: [["propa", "Lean 2 Functions as values", ["2.1", "2.2", "2.3", "2.4"]], ["numa", "First full old exam"]],
    bridge: [["From here on, one NuMa old exam a week keeps it warm", []]],
  },
  {
    from: "2027-01-11", to: "2027-01-17", name: "W2", phase: "ProPa while the lectures finish",
    lec: [["gki", "VL 10 RNNs, Transformer"], ["robotics1", "Grasping"], ["len", "This week's lecture"]],
    main: [["propa", "Lean 3 Scaling up", ["3.1", "3.2", "3.3", "3.4"]], ["numa", "One old exam"]],
    bridge: [],
  },
  {
    from: "2027-01-18", to: "2027-01-24", name: "W3", phase: "ProPa while the lectures finish",
    lec: [["gki", "VL 11 MDPs"], ["robotics1", "Robot Vision"], ["len", "This week's lecture"]],
    main: [["propa", "Lean 4 Effects", ["4.1", "4.2", "4.3", "4.4"]], ["numa", "One old exam"]],
    bridge: [["Image filters by hand, like GKI's convolution in VL 9", []], ["The camera model and RANSAC: CG and least squares again", []]],
  },
  {
    from: "2027-01-25", to: "2027-01-31", name: "W4", phase: "ProPa while the lectures finish",
    lec: [["gki", "VL 12 Reinforcement Learning"], ["robotics1", "Ethics, Programming by Demonstration"], ["len", "This week's lecture"]],
    main: [["propa", "Parallel basics, C and MPI", ["5.1", "5.2", "6.1", "6.2", "6.3", "6.4"]], ["numa", "One old exam"]],
    bridge: [["GKI's VL 12 applies RL to robots: read it with Robotics in mind", []]],
  },
  {
    from: "2027-02-01", to: "2027-02-07", name: "W5", phase: "ProPa while the lectures finish",
    lec: [["gki", "VL 13 Bayes nets, HMMs, Kalman"], ["robotics1", "Task Planning (STRIPS)"], ["len", "This week's lecture and the first mock exam"]],
    main: [["propa", "Java threads", ["7.1", "7.2", "7.3", "7.4"]], ["numa", "One old exam"]],
    bridge: [["STRIPS now, so GKI's planning in VL 14 is revision", []]],
  },
  {
    from: "2027-02-08", to: "2027-02-14", name: "W6", phase: "ProPa while the lectures finish",
    lec: [["gki", "VL 14 Suche, Logik, Planung"], ["robotics1", "The last slides"], ["len", "The last lectures and a second mock exam"]],
    main: [["propa", "Design by Contract: all of ProPa done", ["8.1", "8.2", "8.3"]], ["numa", "First mock exam"]],
    bridge: [["A* and planning in VL 14: already learnt in Robotics", []]],
  },
  // Exam season: the days up to each exam, ending with the exam (`exam`).
  {
    from: "2027-02-15", to: "2027-02-24", name: "15–24 Feb", phase: "Exam season", exam: "numa",
    lec: [["gki", "VL 15 Allgemeine Fragen (15 Feb)"]],
    main: [["numa", "A mock exam every second day (LR and quadrature come every time), the remaining old exams, the Formelsammlung from memory"]],
    bridge: [["30 minutes a day for CG", []]],
  },
  {
    from: "2027-02-25", to: "2027-03-01", name: "25 Feb – 1 Mar", phase: "Exam season", exam: "cg",
    lec: [],
    main: [["cg", "CG: rotations, homogeneous transforms, quaternions and the camera model"]],
    bridge: [["The same as Robotics chapter 1", [["robotics1", "1.3"], ["robotics1", "1.5"], ["robotics1", "1.6"]]]],
  },
  {
    from: "2027-03-02", to: "2027-03-08", name: "2–8 Mar", phase: "Exam season", exam: "gki",
    lec: [],
    main: [["gki", "Two full mock exams, every old exam's Allgemeine Fragen, search and RL"]],
    bridge: [["Regression and SVD/PCA come with NuMa", []], ["30 minutes a day for LEN", []]],
  },
  {
    from: "2027-03-09", to: "2027-03-12", name: "9–12 Mar", phase: "Exam season", exam: "len",
    lec: [],
    main: [["len", "A mock exam a day, the weakest topic from February's mocks first"]],
    bridge: [],
  },
  {
    from: "2027-03-13", to: "2027-03-17", name: "13–17 Mar", phase: "Exam season", exam: "sus",
    lec: [],
    main: [["sus", "SuS"]],
    bridge: [["LEN's complex AC and Bode plots carry straight over", []]],
  },
  {
    from: "2027-03-18", to: "2027-03-23", name: "18–23 Mar", phase: "Exam season", exam: "propa",
    lec: [],
    main: [["propa", "A Lean-only and a Reussner-only mock, then a whole one; the cheat sheet from memory"]],
    bridge: [],
  },
  {
    from: "2027-03-24", to: "2027-03-31", name: "24–31 Mar", phase: "Exam season", exam: "robotics1",
    lec: [],
    main: [["robotics1", "Three mock exams, an old exam a day (register by 21 Mar)"]],
    bridge: [["Pseudoinverse, SVD, A*, filters and transfer functions are solid from the other courses", []]],
  },
];

// Each course's sections, checks and openers; CG and SuS have no course here.
const SP_COURSES = {
  numa: { secs: () => nmSections(), passed: (s) => nmPassed(s), open: (id) => openNumaSection(id) },
  propa: { secs: () => ppSections(), passed: (s) => ppPassed(s), open: (id) => openPropaSection(id) },
  gki: { secs: () => gkSections(), passed: (s) => gkPassed(s), open: (id) => openGkiSection(id) },
  robotics1: { secs: () => rbSections(), passed: (s) => rbPassed(s), open: (id) => openRobSection(id) },
  len: { secs: () => lenSections(), passed: (s) => lenPassed(s), open: (id) => openLenSection(id) },
};
const SP_OTHER = { cg: { mark: "CG", name: "Computergrafik" }, sus: { mark: "SuS", name: "Signale und Systeme" } };
const spCourse = (id) => COURSES.find((c) => c.id === id);
const spMark = (id) => (spCourse(id) ? spCourse(id).mark : SP_OTHER[id].mark);
const spColor = (id) => (spCourse(id) ? spCourse(id).color : "var(--muted)");
const spSec = (course, id) => (SP_COURSES[course] ? SP_COURSES[course].secs().find((s) => s.id === id) : null);

/* ---------------------------------------------------------------- Pace: how much a day */
// The plan above is the order; how much to do a day comes from what is still unpassed and the
// days left. Each course's new material has a deadline:
// - a finished course (NuMa, ProPa): the end of the week its last section is planned in; once
//   that has passed with sections left, the day before its exam's run-up (`exam` entry) starts;
// - a running course (GKI, Robotics I, LEN): every section on the site by the end of this week,
//   at the lecture's pace (only taught sections are on the site);
// - in its exam's run-up: the day before the exam.
// So the less time is left, the more a day. A day has room for two courses (spTodayPlan picks
// them). The day's share is fixed when the day starts (spToday in the store), so passing a
// section ticks it off instead of bringing up the next one.

const spAdd = (s, n) => { const d = examDay(s); d.setDate(d.getDate() + n); return dayStr(d); };
const spRunning = (c) => STUDY_PLAN.some((w) => !w.exam && w.lec.some(([x]) => x === c));

// A course's sections in the order the plan takes them, each with the end of its plan week
// (null for a section the plan doesn't name: the running courses' earlier lectures), then the rest.
function spOrder(c) {
  const due = new Map();
  for (const w of STUDY_PLAN) {
    const ids = [...w.main, ...w.lec].filter(([x]) => x === c).flatMap(([, , secs]) => secs || [])
      .concat(w.bridge.flatMap(([, links]) => links.filter(([x]) => x === c).map(([, id]) => id)));
    for (const id of ids) if (!due.has(id)) due.set(id, w.to);
  }
  const all = SP_COURSES[c].secs();
  const named = [...due.keys()].map((id) => all.find((s) => s.id === id)).filter(Boolean);
  const rest = all.filter((s) => !due.has(s.id));
  // A running course's earlier lectures come first: they were due already.
  return (spRunning(c) ? [...rest, ...named] : [...named, ...rest]).map((s) => ({ s, due: due.get(s.id) || null }));
}

// One course's pace today, or null when its exam is past or it has none.
function spPace(c) {
  const course = spCourse(c);
  if (!SP_COURSES[c] || !course || !course.exam || daysUntil(course.exam) < 0) return null;
  const today = dayStr();
  const order = spOrder(c);
  const left = order.filter(({ s }) => !SP_COURSES[c].passed(s));
  const run = STUDY_PLAN.find((w) => w.exam === c);
  const sprint = run ? run.from : spAdd(course.exam, -7);
  const hard = spAdd(sprint, -1);
  // A finished course waits for its first planned week (ProPa after NuMa), unless it's behind.
  const start = spRunning(c) ? "" : STUDY_PLAN.find((w) => !w.exam && w.main.some(([x, , secs]) => x === c && secs && secs.length))?.from || "";
  if (today < start) return { c, left, days: 0, target: start, why: "later", behind: 0, sprint: false, start };
  let target, why;
  if (today >= sprint) { target = spAdd(course.exam, -1); why = "exam"; }
  else if (spRunning(c)) { const w = STUDY_PLAN[spToday()]; target = !w.exam && w.to < hard ? w.to : hard; why = "week"; }
  else {
    const last = order.reduce((m, o) => (o.due && o.due > m ? o.due : m), "");
    [target, why] = last >= today ? [last, "plan"] : [hard, "late"];
  }
  const days = Math.max(1, daysUntil(target) + 1);
  // Sections the plan had finished by now: their week is over, or (running) their lecture was earlier.
  const behind = left.filter(({ due }) => (due ? due < today : spRunning(c))).length;
  return { c, left, days, target, why, behind, sprint: today >= sprint };
}

// "by Sun 22 Nov" and why that day.
function spBy(p) {
  const d = fmtExamDate(p.target);
  return p.why === "week" ? `by ${d}, at the lecture's pace`
    : p.why === "plan" ? `by ${d}, as planned`
    : p.why === "late" ? `by ${d}, before the exam run-up (behind the plan)`
    : `by ${d}, the day before the exam`;
}

// How much fits in a day: at most this many courses, and this many sections of one course.
const SP_COURSES_A_DAY = 2;
const SP_SECTIONS_A_COURSE = 3;

// A course's pressure: the sections it still needs a day to make its deadline.
const spPressure = (p) => p.left.length / p.days;

// Every course's pace, soonest exam first, with today's share fixed at the start of the day:
// the SP_COURSES_A_DAY courses under the most pressure get today, the rest wait. A course that
// only gets every few days does more on its day, up to SP_SECTIONS_A_COURSE. Doing a course
// lowers its pressure and waiting raises it, so the courses take turns, and the nearer a
// deadline, the more often its course comes up.
function spTodayPlan() {
  const paces = COURSES.filter((c) => SP_COURSES[c.id]).sort(byExam).map((c) => spPace(c.id)).filter(Boolean);
  const today = dayStr();
  let day = store.get("spToday", null);
  if (!day || day.day !== today) {
    const active = paces.filter((p) => p.left.length && !p.start);
    // Most pressure first; on a tie, the sooner exam (paces are in exam order, and sort is stable).
    const picked = [...active].sort((x, y) => spPressure(y) - spPressure(x)).slice(0, SP_COURSES_A_DAY);
    // With n courses to share the days, each comes up about every n / SP_COURSES_A_DAY days.
    const every = Math.max(1, active.length / SP_COURSES_A_DAY);
    const quota = (p) => (picked.includes(p) ? Math.min(SP_SECTIONS_A_COURSE, p.left.length, Math.ceil(spPressure(p) * every)) : 0);
    day = { day: today, start: Object.fromEntries(paces.map((p) => [p.c, [p.left.length, quota(p)]])) };
    store.set("spToday", day);
  }
  return paces.map((p) => {
    const [startLeft, fixed] = day.start[p.c] || [p.left.length, 0];
    const quota = p.start ? 0 : fixed;
    const doneToday = Math.max(0, Math.min(quota, startLeft - p.left.length));
    return { ...p, quota, doneToday, todo: p.left.slice(0, quota - doneToday) };
  });
}

// "18 left by Sun 22 Nov" within a week, otherwise "about 4 a week by Sun 3 Jan".
function spRate(p) {
  if (p.days <= 7) return `${p.left.length} left ${spBy(p)}`;
  const k = Math.ceil((p.left.length / p.days) * 7);
  return `about ${k} a week ${spBy(p)}`;
}

// Where courses teach the same thing: [course, sections] (chips) or [course, "text"].
const SP_OVERLAPS = [
  { title: "Least squares and the pseudoinverse", same: true, links: [["numa", ["2.5"]], ["gki", ["2.2"]], ["robotics1", ["3.5"]]],
    why: "GKI's w = (ΦᵀΦ)⁻¹Φᵀy and Robotics' J⁺ = Jᵀ(JJᵀ)⁻¹ are both NuMa 2.5. GKI's least-squares drawings on this site even run on NuMa's QR." },
  { title: "Regularisation", same: true, links: [["gki", ["2.5"]], ["robotics1", ["3.6"]], ["numa", ["2.4"]]],
    why: "Ridge (AᵀA + λI)⁻¹Aᵀ and damped least squares are one formula. Both exist because AᵀA is badly conditioned (NuMa 2.4). GKI writes λ, Robotics λ²." },
  { title: "SVD and eigenvalues", same: true, links: [["numa", ["2.6", "6.1", "6.2", "6.3"]], ["robotics1", ["2.5", "3.6"]], ["gki", "VL 7 PCA (7 Dec)"]],
    why: "The manipulability ellipse's axes are the singular values of J, its condition σ_max / σ_min. PCA is the SVD of the data matrix, or the eigenvectors of its covariance." },
  { title: "Newton and iterating to a solution", links: [["numa", ["3.2"]], ["robotics1", ["2.4", "3.4", "3.5"]]],
    why: "Numerical IK solves f(θ) = x_goal with the Jacobian: Newton's method in N dimensions. With a non-square J the step uses J⁺ instead of J⁻¹." },
  { title: "Gradient descent", links: [["gki", ["3.5"]], ["robotics1", ["3.4"]], ["numa", ["7.2"]]],
    why: "One method for a loss over weights, an error over joint angles and a quadratic form. NuMa adds why steepest descent zigzags and what cg does about it." },
  { title: "Orthogonal matrices", links: [["numa", ["2.3"]], ["robotics1", ["1.2", "1.3", "1.5"]], ["cg", "Computergrafik (1 Mar)"]],
    why: "Rotations are orthogonal with det +1, so R⁻¹ = Rᵀ. A Householder matrix is orthogonal too, but det −1: a reflection. Robotics chapter 1 is most of CG's transformations." },
  { title: "Linear systems in circuits", links: [["len", "Mesh and nodal analysis"], ["numa", ["2.1", "2.2"]]],
    why: "LEN solves its mesh and node equations with Cramer's rule. A resistor network's nodal matrix is symmetric positive definite, so Cholesky works too." },
  { title: "Transfer functions and control", links: [["len", "Complex AC, Bode plots"], ["robotics1", "Control"], ["sus", "Signale und Systeme (17 Mar)"]],
    why: "Robotics' control tasks ask for a plant's transfer function and step responses, with LEN's tools. SuS is built on them." },
  { title: "Search and planning", same: true, links: [["robotics1", "Motion Planning (A*), Task Planning (STRIPS)"], ["gki", "VL 14 (8 Feb)"]],
    why: "Robotics teaches A* and symbolic planning weeks before GKI's last lecture, so VL 14 becomes revision. The one place the overlap lets you get ahead of GKI." },
  { title: "Convolution and filtering", links: [["gki", "VL 9 CNNs"], ["robotics1", "Robot Vision"]],
    why: "Both exams have you slide a kernel over a small grey image. Robotics asks you to tell convolution (kernel flipped) from correlation; CNNs compute correlation." },
];

// The week the plan is in today (the first or last outside the plan's dates).
function spToday() {
  const t = dayStr(new Date());
  const i = STUDY_PLAN.findIndex((w) => t >= w.from && t <= w.to);
  return i >= 0 ? i : t < STUDY_PLAN[0].from ? 0 : STUDY_PLAN.length - 1;
}

const spTitle = (s) => (Array.isArray(s.title) ? s.title[lenLang === "en" ? 1 : 0] : s.title).replace(/<[^>]+>/g, "");

// A section as a chip: ticked once its check is passed, pale while it isn't on the site yet.
// `named` adds its title (on the page, where there's room).
function spChipHTML(course, id, named = false) {
  const s = spSec(course, id);
  if (!s) return `<span class="sp-chip later" style="--cc:${spColor(course)}" title="Not on the site yet">${id}</span>`;
  const done = SP_COURSES[course].passed(s);
  const title = spTitle(s);
  return `<button type="button" class="sp-chip ${done ? "done" : ""} ${named ? "named" : ""}" style="--cc:${spColor(course)}" data-sp-sec="${course}:${id}"
    title="${id} ${title}${done ? " (passed)" : ""}" aria-label="${spMark(course)} ${id} ${title}${done ? ", passed" : ""}">${done ? "✓ " : ""}<b>${id}</b>${named ? ` ${title}` : ""}</button>`;
}

const spMarkHTML = (c) => `<span class="sp-mark" style="--cc:${spColor(c)}">${spMark(c)}</span>`;
function spRowHTML([course, text, secs]) {
  return `<li>${spMarkHTML(course)}<span class="sp-text">${text}${secs && secs.length ? `<span class="sp-chips">${secs.map((id) => spChipHTML(course, id)).join("")}</span>` : ""}</span></li>`;
}

// Today's total and its load.
function spLoad(rows) {
  const quota = rows.reduce((n, r) => n + r.quota, 0);
  const done = rows.reduce((n, r) => n + r.doneToday, 0);
  const load = quota <= 2 ? ["light", "Light"] : quota <= 4 ? ["steady", "Steady"] : ["heavy", "Heavy"];
  return { quota, done, load };
}
const spLoadHTML = ({ quota, done, load }) => (quota ? `<span class="sp-load ${load[0]}">${load[1]} · ${done} / ${quota} done</span>` : `<span class="sp-load light">Nothing due</span>`);
const spWhen = (w) => (w.exam ? w.name : `${w.name} · ${shortExamDate(w.from)} – ${shortExamDate(w.to)}`);

/* ---------------------------------------------------------------- The card on the picker */

// A summary: today's load, how many sections per course, who's behind, and the way to the page.
function studyPlanHTML() {
  const rows = spTodayPlan();
  const L = spLoad(rows);
  const w = STUDY_PLAN[spToday()];
  const behind = rows.filter((r) => r.behind);
  return `
    <div class="card cw sp" id="studyPlan">
      <h2 class="cw-cap">Study plan</h2>
      <div class="sp-today-head"><h3>Today</h3>${spLoadHTML(L)}</div>
      ${L.quota ? `<span class="lmastery-bar course-bar"><span style="width:${(L.done / L.quota) * 100}%"></span></span>` : ""}
      <div class="sp-sum">${rows.filter((r) => r.quota).map((r) => {
        const left = r.quota - r.doneToday;
        return `<span class="sp-pill ${left ? "" : "ok"}" style="--cc:${spColor(r.c)}"><b>${spMark(r.c)}</b> ${left ? left : "✓"}</span>`;
      }).join("")}</div>
      ${behind.length ? `<p class="small sp-behind">Behind the plan: ${behind.map((r) => `${spMark(r.c)} ${r.behind}`).join(", ")}</p>` : ""}
      <p class="small muted">${spWhen(w)} · ${w.phase}</p>
      <button type="button" class="btn primary" data-cw-go="plan">Open study plan →</button>
    </div>`;
}

/* ---------------------------------------------------------------- The study plan page (#plan) */

function renderStudyPlanPage() {
  const rows = spTodayPlan();
  const L = spLoad(rows);
  const now = spToday();
  const inPlan = dayStr() >= STUDY_PLAN[0].from;
  const next = upcomingExams()[0];
  const card = (r) => {
    const c = spCourse(r.c);
    const [passed, total] = c.progress();
    const status = r.start ? `Starts ${fmtExamDate(r.start)}, after the course before it in the plan.`
      : !r.left.length ? (r.sprint && c.mock ? `Every section done: <button type="button" class="xc-link" data-cw-go="${c.mock[1]}">on to mock exams</button>.` : "Caught up with every section on the site.")
      : r.quota ? `${spRate(r)}.`
      : `Not today: ${spRate(r)}. It comes up as its deadline gets closer.`;
    return `
      <div class="spp-course ${r.quota && r.doneToday >= r.quota ? "done" : ""}" style="--cc:${c.color}">
        <div class="spp-course-head">
          <button type="button" class="spp-name" data-cw-go="${c.tabs[0]}">${spMarkHTML(r.c)} ${c.name}</button>
          <span class="small muted">${examIn(daysUntil(c.exam))}</span>
        </div>
        ${r.todo.length ? `<div class="spp-todo">${r.todo.map(({ s }) => spChipHTML(r.c, s.id, true)).join("")}</div>`
          : r.quota ? `<p class="sp-ok">✓ Today's ${r.quota} done</p>` : ""}
        <p class="small">${status}</p>
        <span class="lmastery-bar course-bar"><span style="width:${total ? (passed / total) * 100 : 0}%"></span></span>
        <p class="small muted">${passed} / ${total} sections passed${r.behind ? ` · <b class="sp-behind">${r.behind} behind the plan</b>` : ""}</p>
      </div>`;
  };
  let phase = "";
  const weeks = STUDY_PLAN.map((w, i) => {
    const head = w.phase !== phase ? `<h3 class="spp-phase">${(phase = w.phase)}</h3>` : "";
    const cls = [i === now && inPlan ? "now" : "", i < now ? "past" : "", w.brk ? "brk" : "", w.exam ? "exam" : ""].join(" ");
    const col = (cap, list) => `<div class="spp-col"><span class="spp-cap">${cap}</span>${list}</div>`;
    return `${head}
      <div class="spp-week ${cls}" id="spw-${i}">
        <div class="spp-when"><b>${w.name}</b><span class="small muted">${w.exam ? "" : `${shortExamDate(w.from)} – ${shortExamDate(w.to)}`}</span>
          ${i === now && inPlan ? `<span class="spp-now">This week</span>` : ""}
          ${w.exam ? `<span class="spp-exam" style="--cc:${spColor(w.exam)}">${spMark(w.exam)} exam ${fmtExamDate(w.to)}</span>` : ""}</div>
        ${col(w.exam ? "Focus" : "Front-load", w.main.length ? `<ul class="sp-list">${w.main.map(spRowHTML).join("")}</ul>` : `<span class="small muted">—</span>`)}
        ${col("Lectures, at their pace", w.lec.length ? `<ul class="sp-list">${w.lec.map(spRowHTML).join("")}</ul>` : `<span class="small muted">No lectures</span>`)}
        ${col("Learn once, use twice", w.bridge.length ? `<ul class="sp-list spp-bridges">${w.bridge.map(([text, links]) =>
          `<li><span class="sp-text">${text}${links.length ? `<span class="sp-chips">${links.map(([c, id]) => spMarkHTML(c) + spChipHTML(c, id)).join("")}</span>` : ""}</span></li>`).join("")}</ul>` : `<span class="small muted">—</span>`)}
      </div>`;
  }).join("");
  const overlaps = SP_OVERLAPS.map((o) => `
    <div class="spp-ov">
      <div class="spp-ov-head"><h3>${o.title}</h3>${o.same ? `<span class="spp-same">Same maths</span>` : ""}</div>
      <ul class="spp-links">${o.links.map(([c, x]) => `<li>${spMarkHTML(c)}<span>${typeof x === "string" ? x : `<span class="sp-chips">${x.map((id) => spChipHTML(c, id, true)).join("")}</span>`}</span></li>`).join("")}</ul>
      <p class="small muted">${o.why}</p>
    </div>`).join("");

  $("#plan").innerHTML = `
    <div class="spp">
      <div class="spp-head">
        <button type="button" class="btn small-btn" data-cw-go="courses">← All courses</button>
        <h1>Study plan</h1>
        <p class="muted">From 16 Nov to the last exam on 31 Mar${next ? `. Next: <b>${next.name}</b> ${examIn(daysUntil(next.date))}${next.tentative ? " (not confirmed)" : ""}` : ""}.
          Running lectures go at their pace, finished courses are front-loaded, and the less time is left, the more a day.</p>
      </div>

      <section class="spp-sec">
        <div class="sp-today-head"><h2>Today</h2>${spLoadHTML(L)}</div>
        ${L.quota ? `<span class="lmastery-bar course-bar"><span style="width:${(L.done / L.quota) * 100}%"></span></span>` : ""}
        <div class="spp-courses">${rows.filter((r) => r.quota).map(card).join("")}</div>
        ${rows.some((r) => !r.quota) ? `<h3 class="spp-later-cap">Not today</h3>
        <div class="spp-courses spp-later">${rows.filter((r) => !r.quota).map(card).join("")}</div>` : ""}
        <p class="small muted">A day has room for ${SP_COURSES_A_DAY} courses and up to ${SP_SECTIONS_A_COURSE} sections of each. Each morning the two that need the most a day to make their deadline get it: a running course should catch up by Sunday, a finished one by the end of its last planned week (or, once behind, before its exam's run-up), and in the run-up everything is due the day before the exam. Doing a course lowers its need and waiting raises it, so the courses take turns.</p>
      </section>

      <section class="spp-sec">
        <div class="spp-sec-head"><h2>Week by week</h2>${inPlan ? `<button type="button" class="btn small-btn" data-spp-now>Jump to this week</button>` : ""}</div>
        <p class="small muted">Robotics gives no dates per chapter, so its weeks are an estimate; shift them when the slides come.</p>
        <div class="spp-weeks">${weeks}</div>
      </section>

      <section class="spp-sec">
        <h2>Where the courses overlap</h2>
        <p class="small muted">Learn it in one course and tick it off in the other. The plan puts each pair in the same week.</p>
        <div class="spp-ovs">${overlaps}</div>
        <div class="spp-false small">
          <b>False friends.</b> Newton–Euler in Robotics' dynamics is the physics recursion for joint torques, not NuMa's Newton method.
          Lagrange in Robotics is the energy method for the equations of motion, not NuMa's interpolation polynomial.
          ProPa has no real overlap with the other courses.
        </div>
      </section>
    </div>`;

  const page = $("#plan");
  page.onclick = (e) => {
    const sec = e.target.closest("[data-sp-sec]");
    if (sec) { const [c, id] = sec.dataset.spSec.split(":"); track("plan.section"); SP_COURSES[c].open(id); return; }
    const go = e.target.closest("[data-cw-go]");
    if (go) { showTab(go.dataset.cwGo); window.scrollTo({ top: 0 }); return; }
    if (e.target.closest("[data-spp-now]")) scrollBelowBar($(`#spw-${now}`));
  };
}
