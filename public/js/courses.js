// The course picker, where the site opens (an address with no #page, or #courses). Each course is
// a set of tabs (`tabs`, the first is its Home); picking one opens its Home. Japanese, LEN and ProPa
// can be opened, the rest are placeholders (`soon`). Each course has its own main colour (`color`, a token
// from style.css) and its own line under every page (`footer`). Loaded after home.js and uses its
// helpers and game.js's; the LEN card comes from len.js, the ProPa card from propa.js.

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
  },
  {
    id: "propa",
    tabs: ["propa-home", "propa-l1", "propa-l2", "propa-l3", "propa-l4", "propa-l5", "propa-l6", "propa-l7", "propa-l8", "propa-cheat", "propa-exams", "propa-practice"],
    mark: "ProPa",
    lang: "de",
    color: "var(--course-propa)",
    name: "Programmierparadigmen",
    about: "Lean and Reussner for review, with drawings that run the code step by step.",
    footer: "Colours mean the same in every code block and drawing — blue is a type, red an effect, green what #eval prints.",
    card: (c) => propaCourseCardHTML(c),
  },
  { id: "robotics1", soon: true, mark: "Rob I", lang: "en", color: "var(--course-robotics)", name: "Robotics I", about: "Robot arms: kinematics, dynamics and control." },
  { id: "gki", soon: true, mark: "GKI", lang: "de", color: "var(--course-gki)", name: "Grundlagen der künstlichen Intelligenz", about: "Search, logic, probability and learning." },
];

// The course a tab belongs to, for the top bar (the picker counts as Japanese, whose bar it hides).
const courseOf = (tab) => COURSES.find((c) => c.tabs && c.tabs.includes(tab)) || COURSES[0];

function englishGreeting() {
  const h = new Date().getHours();
  return h >= 5 && h < 12 ? "Good morning" : h >= 12 && h < 18 ? "Good afternoon" : "Good evening";
}

function renderCourses() {
  $("#courses").innerHTML = `
    <div class="courses-head">
      <h1>${englishGreeting()}</h1>
      <p class="muted">Which course are you studying today?</p>
    </div>
    ${COURSES.filter((c) => !c.soon).map((c) => (c.card ? c.card(c) : courseCardHTML(c))).join("")}
    <h2 class="courses-cap">Coming soon</h2>
    <div class="course-soon-grid">
      ${COURSES.filter((c) => c.soon).map(soonCardHTML).join("")}
    </div>`;
  $$("#courses [data-course]").forEach((b) => (b.onclick = () => {
    track("courses.open");
    showTab(COURSES.find((c) => c.id === b.dataset.course).tabs[0]);
    window.scrollTo({ top: 0 });
  }));
  wireLenCourseCard();
  wirePropaCourseCard();
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
