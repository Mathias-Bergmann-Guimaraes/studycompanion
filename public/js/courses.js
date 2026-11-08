// The course picker, where the site opens (an address with no #page, or #courses). Each course is
// a set of tabs; picking one opens its own Home tab. Japanese is the only course so far: the other
// tabs all belong to it, and the rest are placeholders (`soon`). Each course has its own main colour
// (`color`, a token from style.css). Loaded after home.js and uses its helpers and game.js's.

const COURSES = [
  {
    id: "japanese",
    tab: "home",
    mark: "文",
    lang: "ja",
    color: "var(--accent)",
    name: "Japanese",
    about: "Grammar you can see: colour-coded sentence blocks, 50 lessons, daily practice and real Japanese to listen to.",
  },
  { id: "len", soon: true, mark: "LEN", lang: "de", color: "var(--course-len)", name: "Lineare Elektrische Netze", about: "Circuits and network analysis." },
  { id: "robotics1", soon: true, mark: "Rob I", lang: "en", color: "var(--course-robotics)", name: "Robotics I", about: "Robot arms: kinematics, dynamics and control." },
  { id: "propa", soon: true, mark: "ProPa", lang: "de", color: "var(--course-propa)", name: "Programmierparadigmen", about: "Functional, logic and parallel programming." },
  { id: "gki", soon: true, mark: "GKI", lang: "de", color: "var(--course-gki)", name: "Grundlagen der künstlichen Intelligenz", about: "Search, logic, probability and learning." },
];

// The course the tabs belong to, for the brand in the top bar.
const courseOf = () => COURSES[0];

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
    ${COURSES.filter((c) => !c.soon).map(courseCardHTML).join("")}
    <h2 class="courses-cap">Coming soon</h2>
    <div class="course-soon-grid">
      ${COURSES.filter((c) => c.soon).map(soonCardHTML).join("")}
    </div>`;
  $$("#courses [data-course]").forEach((b) => (b.onclick = () => {
    track("courses.open");
    showTab(COURSES.find((c) => c.id === b.dataset.course).tab);
    window.scrollTo({ top: 0 });
  }));
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

// Only Japanese has progress to show so far.
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
