// The course picker, where the site opens (an address with no #page, or #courses). Each course is
// a set of tabs (`tabs`, the first is its Home); picking one opens its Home. Japanese, LEN, ProPa,
// NuMa and GKI can be opened, the rest are placeholders (`soon`). Each course has its own main colour (`color`, a token
// from style.css) and its own line under every page (`footer`). Loaded after home.js and uses its
// helpers and game.js's; the LEN card comes from len.js, the ProPa card from propa.js, the NuMa card
// from numa.js, the GKI card from gki.js.

const COURSES = [
  {
    id: "japanese",
    tabs: ["home", "lessons", "structure", "particles", "verbs", "adjectives", "patterns", "practice", "listen", "mistakes"],
    mark: "文",
    lang: "ja",
    color: "var(--accent)",
    name: "Japanese",
    about: "Grammar you can see: colour-coded sentence blocks, 50 lessons, daily practice and real Japanese to listen to.",
    footer: "Colours mean the same thing on every page — a green block is always the object, a blue block is always the topic.",
    progress: () => [LESSONS.filter((l) => lessonPassed(l.n)).length, LESSONS.length],
  },
  {
    id: "len",
    tabs: ["len-home", "len-basics", "len-formulas", "len-exams", "len-practice", "len-mock"],
    mark: "LEN",
    lang: "de",
    color: "var(--course-len)",
    name: "Lineare Elektrische Netze",
    about: "Circuits from the ground up, with drawings you can play with — in German or English.",
    footer: `<span class="l-de" lang="de">Farben bedeuten überall dasselbe — rot ist immer ein Strom, blau immer eine Spannung.</span><span class="l-en">Colours mean the same thing everywhere — red is always a current, blue is always a voltage.</span>`,
    card: (c) => lenCourseCardHTML(c),
    exam: "2027-03-12",
    progress: () => [lenSections().filter(lenPassed).length, lenSections().length],
    mock: ["lenMock", "len-mock"],
  },
  {
    id: "propa",
    tabs: ["propa-home", "propa-l1", "propa-l2", "propa-l3", "propa-l4", "propa-l5", "propa-l6", "propa-l7", "propa-l8", "propa-cheat", "propa-exams", "propa-practice", "propa-mock"],
    mark: "ProPa",
    lang: "de",
    color: "var(--course-propa)",
    name: "Programmierparadigmen",
    about: "Lean and Reussner for review, with drawings that run the code step by step.",
    footer: "Colours mean the same in every code block and drawing — blue is a type, red an effect, green what #eval prints.",
    card: (c) => propaCourseCardHTML(c),
    exam: "2027-03-23",
    progress: () => [ppSections().filter(ppPassed).length, ppSections().length],
    mock: ["propaMock", "propa-mock"],
  },
  {
    id: "numa",
    tabs: ["numa-home", "numa-k1", "numa-k2", "numa-k3", "numa-k4", "numa-k5", "numa-k6", "numa-k7", "numa-sheet", "numa-exams", "numa-practice", "numa-mock"],
    mark: "NuMa",
    lang: "de",
    color: "var(--course-numa)",
    name: "Numerische Mathematik",
    about: "Numerische Mathematik für Informatik und Ingenieurwesen, mit Zeichnungen, die jedes Verfahren vorrechnen.",
    footer: `<span lang="de">Farben bedeuten überall dasselbe — grün ist immer die exakte Lösung, blau eine Näherung, rot ein Fehler.</span>`,
    card: (c) => numaCourseCardHTML(c),
    // Not confirmed yet: shown with a "?" until it is (examTentative).
    exam: "2027-02-24",
    examTentative: true,
    progress: () => [nmSections().filter(nmPassed).length, nmSections().length],
    mock: ["numaMock", "numa-mock"],
  },
  {
    id: "gki",
    tabs: ["gki-home", "gki-k1", "gki-k2", "gki-k3", "gki-sheet", "gki-exams", "gki-practice", "gki-mock"],
    mark: "GKI",
    lang: "de",
    color: "var(--course-gki)",
    name: "Grundlagen der Künstlichen Intelligenz",
    about: "Regression, Wahrscheinlichkeit, Klassifikation und Lernen — mit Zeichnungen zum Ausprobieren.",
    footer: `<span lang="de">Farben bedeuten überall dasselbe — grün ist die Wahrheit, blau die Vorhersage, rot ein Fehler, gold ein Gradient.</span>`,
    card: (c) => gkiCourseCardHTML(c),
    exam: "2027-03-08",
    progress: () => [gkSections().filter(gkPassed).length, gkSections().length],
    mock: ["gkiMock", "gki-mock"],
  },
  {
    id: "robotics1",
    tabs: ["rob-home", "rob-k0", "rob-k1", "rob-k2", "rob-k3", "rob-sheet", "rob-exams", "rob-practice", "rob-mock"],
    mark: "Rob I",
    lang: "en",
    color: "var(--course-robotics)",
    name: "Robotics I",
    about: "Robot arms: frames, kinematics and inverse kinematics — with an arm you can move.",
    footer: "Colours mean the same everywhere — a frame's x axis is red, y green, z blue; gold is a joint angle, pink the target.",
    card: (c) => robCourseCardHTML(c),
    exam: "2027-03-31",
    progress: () => [rbSections().filter(rbPassed).length, rbSections().length],
    mock: ["robMock", "rob-mock"],
  },
];

// The course a tab belongs to, for the top bar (the picker counts as Japanese, whose bar it hides).
const courseOf = (tab) => COURSES.find((c) => c.tabs && c.tabs.includes(tab)) || COURSES[0];

function englishGreeting() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 18 ? "Good afternoon" : "Good evening";
}

function renderCourses() {
  $("#courses").innerHTML = `
    <div class="courses-layout"><div class="courses-main">
    <div class="courses-head">
      <h1>${englishGreeting()}</h1>
      <p class="muted">Which course are you studying today?</p>
    </div>
    ${COURSES.filter((c) => !c.soon).map((c) => (c.card ? c.card(c) : courseCardHTML(c))).join("")}
    ${COURSES.some((c) => c.soon) ? `<h2 class="courses-cap">Coming soon</h2>
    <div class="course-soon-grid">
      ${COURSES.filter((c) => c.soon).map(soonCardHTML).join("")}
    </div>` : ""}
    </div>${courseWidgetsHTML()}</div>`;
  wireCourseWidgets();
  $$("#courses [data-course]").forEach((b) => (b.onclick = () => {
    track("courses.open");
    showTab(COURSES.find((c) => c.id === b.dataset.course).tabs[0]);
    window.scrollTo({ top: 0 });
  }));
  // The mark, the name and the description open the course too, like its "Open course" button
  // (which stays the way in for the keyboard).
  $$("#courses .course-card").forEach((card) => {
    const open = $("[data-course]", card);
    if (open) $$(".course-mark, .course-body", card).forEach((el) => (el.onclick = () => open.click()));
  });
  wireLenCourseCard();
  wirePropaCourseCard();
  wireNumaCourseCard();
  wireGkiCourseCard();
  wireRobCourseCard();
  const go = $("#courseContinue");
  if (go) go.onclick = () => {
    track("courses.continue");
    const l = lessonToContinue();
    const next = lessonNextStep(l);
    openLessonTab(l);
    if (next) goToNextStep(l, next);
    else scrollBelowBar($("#lessonDetail"));
  };
}

// Japanese's card, with its level, streak and lessons.
function courseCardHTML(c) {
  const done = LESSONS.filter((l) => lessonPassed(l.n)).length;
  const l = lessonToContinue();
  const { lv } = levelOf(game.xp);
  const streak = liveStreak();
  return `
    <div class="course-card" style="--cc:${c.color}">
      <span class="course-mark" lang="${c.lang}" aria-hidden="true">${c.mark}</span>
      <div class="course-body">
        <h2>${c.name}</h2>
        <p class="muted">${c.about}</p>
      </div>
      <div class="course-side">
        <div class="course-stats small">
          <span><b>Level ${lv}</b></span>
          <span>🔥 <b>${streak}</b> day${streak === 1 ? "" : "s"}</span>
          <span><b>${done}</b> / ${LESSONS.length} lessons</span>
        </div>
        <span class="lmastery-bar course-bar"><span style="width:${(done / LESSONS.length) * 100}%"></span></span>
        <div class="home-actions">
          <button class="btn primary" data-course="${c.id}">Open course →</button>
          <button class="btn" id="courseContinue">Continue lesson ${l.n}</button>
        </div>
      </div>
    </div>`;
}

// A course that isn't here yet: its name and colour, nothing to open.
function soonCardHTML(c) {
  return `
    <div class="course-soon" style="--cc:${c.color}">
      <span class="course-mark short" aria-hidden="true">${c.mark}</span>
      <h3 lang="${c.lang}">${c.name}</h3>
      <p class="small muted">${c.about}</p>
    </div>`;
}

/* ---------------------------------------------------------------- Widgets beside the courses */
// On a wide screen they sit in a column to the right of the course cards, below them (in two columns) otherwise.
// Each course's exam date is its `exam` above; OTHER_EXAMS are exams with no course here.

const OTHER_EXAMS = [
  { name: "Computergrafik", mark: "CG", date: "2027-03-01" },
  { name: "Signale und Systeme", mark: "SuS", date: "2027-03-17" },
];

// "2027-03-12" as a local date at midnight. Days to it: daysUntil (lesson-review.js; 0 today, < 0 past).
const examDay = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const shortExamDate = (s) => examDay(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtExamDate = (s) => examDay(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
const examIn = (n) => (n === 0 ? "today" : n === 1 ? "tomorrow" : n < 0 ? "done" : `in ${n} days`);

// Every exam with a date, soonest first: the courses' own and the others.
function allExams() {
  return [
    ...COURSES.filter((c) => c.exam).map((c) => ({ name: c.name, mark: c.mark, date: c.exam, tentative: c.examTentative, color: c.color, course: c })),
    ...OTHER_EXAMS.map((e) => ({ ...e, color: "var(--muted)" })),
  ].sort((a, b) => a.date.localeCompare(b.date));
}
const upcomingExams = () => allExams().filter((e) => daysUntil(e.date) >= 0);

// The month the calendar opens on: the next exam's (this month once an exam is in it).
const examCal = { month: null };
function examCalStart() {
  const next = upcomingExams()[0];
  const d = next ? examDay(next.date) : new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// A month as a grid, weeks starting on Monday, each exam day filled in its course's colour.
function examCalHTML() {
  const m = examCal.month || (examCal.month = examCalStart());
  const exams = allExams();
  const lead = (m.getDay() + 6) % 7;
  const len = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
  const today = dayStr();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(`<span></span>`);
  for (let d = 1; d <= len; d++) {
    const iso = dayStr(new Date(m.getFullYear(), m.getMonth(), d));
    const on = exams.filter((e) => e.date === iso);
    const cls = ["xc-day", iso === today ? "today" : "", on.length ? "exam" : "", on.length && iso < today ? "past" : ""].join(" ");
    cells.push(on.length
      ? `<span class="${cls}" style="--xc:${on[0].color}" title="${on.map((e) => `${e.name} exam${e.tentative ? " (not confirmed)" : ""}`).join(", ")}"><b>${d}</b><i>${on.map((e) => e.mark + (e.tentative ? "?" : "")).join("·")}</i></span>`
      : `<span class="${cls}"><b>${d}</b></span>`);
  }
  return `
    <div class="xc-head">
      <button class="xc-nav" type="button" data-cal="-1" aria-label="Previous month">‹</button>
      <b>${m.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</b>
      <button class="xc-nav" type="button" data-cal="1" aria-label="Next month">›</button>
    </div>
    <div class="xc-grid">
      ${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((w) => `<span class="xc-wd">${w}</span>`).join("")}
      ${cells.join("")}
    </div>`;
}

// The soonest exam still to come, as a big countdown, with that course's mock exam.
function nextExamHTML() {
  const up = upcomingExams();
  const next = up[0];
  if (!next) return `<div class="card cw"><h2 class="cw-cap">Next exam</h2><p class="muted small">No exams coming up.</p></div>`;
  const n = daysUntil(next.date);
  const c = next.course;
  return `
    <div class="card cw cw-next" style="--cc:${next.color}">
      <h2 class="cw-cap">Next exam</h2>
      <div class="cw-big"><b>${n === 0 ? "Today" : n}</b>${n === 0 ? "" : `<span>day${n === 1 ? "" : "s"}</span>`}</div>
      <p><b>${next.name}</b><br><span class="small muted">${fmtExamDate(next.date)}${next.tentative ? " (not confirmed)" : ""} · ${up.length} exam${up.length === 1 ? "" : "s"} to go</span></p>
      ${c && c.mock ? `<div class="home-actions"><button class="btn primary" type="button" data-cw-go="${c.mock[1]}">Mock exam</button>
        <button class="btn" type="button" data-cw-go="${c.tabs[0]}">Open course</button></div>` : ""}
    </div>`;
}

// The calendar, then every exam as a list with its countdown.
function examCalCardHTML() {
  const row = (e, n) => `<li class="${n !== null && n < 0 ? "past" : ""}" style="--xc:${e.color}">
      <span class="xc-dot"></span>
      <span class="xc-name" title="${e.name}">${e.course ? `<button type="button" class="xc-link" data-cw-go="${e.course.tabs[0]}">${e.name}</button>` : e.name}</span>
      <span class="small ${n !== null && n >= 0 && n <= 14 ? "xc-soon" : "muted"}">${e.date ? `${shortExamDate(e.date)}${e.tentative ? "?" : ""} · ${examIn(n)}` : "no date yet"}</span></li>`;
  return `
    <div class="card cw">
      <h2 class="cw-cap">Exam calendar</h2>
      <div id="examCal">${examCalHTML()}</div>
      <ul class="xc-list">
        ${allExams().map((e) => row(e, daysUntil(e.date))).join("")}
        ${COURSES.filter((c) => c.mock && !c.exam).map((c) => row({ name: c.name, color: c.color, course: c }, null)).join("")}
      </ul>
    </div>`;
}

// Per course with an exam: how much of it is done, the best mock exam, and the days left.
function examPrepHTML() {
  const rows = COURSES.filter((c) => c.mock)
    .sort((a, b) => (a.exam || "9").localeCompare(b.exam || "9"))
    .map((c) => {
      const [done, total] = c.progress();
      const best = store.get(c.mock[0], {}).best;
      return `<button type="button" class="cw-prep" style="--cc:${c.color}" data-cw-go="${c.tabs[0]}">
        <span class="cw-prep-top"><b>${c.mark}</b><span class="small muted">${c.exam ? examIn(daysUntil(c.exam)) + (c.examTentative ? " (not confirmed)" : "") : "no date"}</span></span>
        <span class="lmastery-bar course-bar"><span style="width:${total ? (done / total) * 100 : 0}%"></span></span>
        <span class="small muted">${done} / ${total} sections · mock ${best === undefined ? "not tried yet" : `best ${best} %`}</span>
      </button>`;
    });
  return `<div class="card cw"><h2 class="cw-cap">Exam prep</h2><div class="cw-preps">${rows.join("")}</div></div>`;
}

// Today's XP toward the daily goal and the streak (game.js; every course earns XP).
function todayHTML() {
  const xp = todayXp();
  const streak = liveStreak();
  return `
    <div class="card cw">
      <h2 class="cw-cap">Today</h2>
      <div class="course-stats small"><span><b>${xp}</b> / ${DAILY_GOAL} XP</span><span>🔥 <b>${streak}</b> day${streak === 1 ? "" : "s"} in a row</span></div>
      <span class="lmastery-bar course-bar"><span style="width:${Math.min(100, (xp / DAILY_GOAL) * 100)}%"></span></span>
      <p class="small muted">${xp >= DAILY_GOAL ? "Daily goal reached." : `${DAILY_GOAL - xp} XP to go for today's goal.`}</p>
    </div>`;
}

const courseWidgetsHTML = () =>
  `<aside class="courses-aside" aria-label="Exams and today">${nextExamHTML()}${examCalCardHTML()}${examPrepHTML()}${todayHTML()}</aside>`;

function wireCourseWidgets() {
  const box = $(".courses-aside");
  box.addEventListener("click", (e) => {
    const nav = e.target.closest("[data-cal]");
    if (nav) {
      const m = examCal.month;
      examCal.month = new Date(m.getFullYear(), m.getMonth() + Number(nav.dataset.cal), 1);
      $("#examCal").innerHTML = examCalHTML();
      return;
    }
    const go = e.target.closest("[data-cw-go]");
    if (go) { track("courses.widget"); showTab(go.dataset.cwGo); window.scrollTo({ top: 0 }); }
  });
}
