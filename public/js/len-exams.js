// LEN old exams (Altklausuren): the ten exams from 2018 to 2022 with their tasks, each tagged by
// topic and by the methods it asks for, with links straight to the task and to its solution in
// the PDF. The PDFs are KIT material: they live in public/len-exams/ on the server only and are
// never committed (see .gitignore and the README). The topics and tags here are shared with the
// generated practice tasks and the mock exams (len-gen.js, len-practice.js).

// The five topics every exam has, in the order the exams ask them.
const LEN_TOPICS = {
  ok: { de: "Ortskurven & Resonanz", en: "Loci & resonance", short: ["Ortskurve", "Locus"], color: "var(--c-time)" },
  net: { de: "Netzwerke", en: "Networks", short: ["Netzwerk", "Network"], color: "var(--c-object)" },
  ac: { de: "Komplexe Wechselstromlehre", en: "Complex AC circuits", short: ["Wechselstrom", "AC"], color: "var(--c-subject)" },
  bode: { de: "Bodediagramme", en: "Bode plots", short: ["Bode", "Bode"], color: "var(--c-topic)" },
  opv: { de: "Operationsverstärker", en: "Operational amplifiers", short: ["OPV", "Op-amp"], color: "var(--c-point)" },
};
const LEN_TOPIC_IDS = Object.keys(LEN_TOPICS);

// The methods a task asks for, to filter more finely than by topic.
const LEN_TAGS = {
  kirchhoff: ["Kirchhoff", "Kirchhoff"], stern: ["Stern-Dreieck", "star–delta"], quelle: ["Quellenumwandlung", "source conversion"],
  masche: ["Maschenstromverfahren", "mesh analysis"], knoten: ["Knotenpotentialverfahren", "nodal analysis"],
  anpassung: ["Leistungsanpassung", "power matching"], leistung: ["Leistung", "power"],
  zeiger: ["Zeigerdiagramm", "phasor diagram"], komp: ["Kompensation", "compensation"], vierpol: ["Vierpole", "two-ports"], trafo: ["Transformator", "transformer"],
  resonanz: ["Resonanz", "resonance"], guete: ["Güte & Bandbreite", "Q & bandwidth"], inversion: ["Inversion", "inversion"], zuordnung: ["Zuordnen", "matching"],
  tp: ["Tiefpass", "low-pass"], hp: ["Hochpass", "high-pass"], bp: ["Bandpass", "band-pass"], asym: ["Asymptoten", "asymptotes"],
  inv: ["(nicht-)invertierend", "(non-)inverting"], diff: ["Subtrahierer", "difference amp"], sum: ["Addierer", "summing amp"],
  folger: ["Impedanzwandler", "buffer"], sat: ["Aussteuergrenze", "saturation"],
};

// Each exam: its file, semester and date, and its tasks (number, topic, page of the task and of its
// solution, points, tags).
const LEN_EXAMS = [
  { id: "2018-04", sem: "WS 17/18", date: "2018-04-04", tasks: [
    [1, "ok", 2, 2, 16, "resonanz guete inversion"], [2, "ok", 6, 6, 6, "zuordnung"], [3, "net", 8, 8, 4, "anpassung leistung"],
    [4, "net", 9, 10, 12, "stern knoten"], [5, "ac", 12, 13, 20, "zeiger leistung"], [6, "bode", 16, 17, 23, "tp hp asym"], [7, "opv", 21, 22, 13, "folger"]] },
  { id: "2018-08", sem: "SS 18", date: "2018-08-03", tasks: [
    [1, "ok", 2, 3, 20, "resonanz"], [2, "net", 6, 7, 15, "kirchhoff masche"], [3, "ac", 9, 10, 20, "zeiger leistung"],
    [4, "bode", 14, 15, 23, "tp hp"], [5, "opv", 18, 19, 16, "inv folger"]] },
  { id: "2019-04", sem: "WS 18/19", date: "2019-04-02", tasks: [
    [1, "ok", 2, 2, 20, "resonanz"], [2, "net", 5, 6, 14, "stern quelle knoten"], [3, "ac", 10, 12, 22, "vierpol trafo anpassung leistung"],
    [4, "bode", 15, 17, 23, "tp hp asym"], [5, "opv", 21, 22, 15, "sat"]] },
  { id: "2019-07", sem: "SS 19", date: "2019-07-31", tasks: [
    [1, "ok", 2, 4, 21, "zuordnung"], [2, "net", 7, 8, 16, "stern quelle masche"], [3, "ac", 13, 14, 20, "vierpol leistung"],
    [4, "bode", 16, 18, 21, "tp bp folger"], [5, "opv", 21, 22, 16, "diff sat"]] },
  { id: "2020-03", sem: "WS 19/20", date: "2020-03-24", tasks: [
    [1, "ok", 2, 2, 13, "zuordnung"], [2, "ok", 5, 5, 11, "inversion"], [3, "net", 8, 9, 12, "masche leistung"],
    [4, "ac", 12, 13, 21, "trafo leistung"], [5, "bode", 17, 18, 23, "tp hp bp asym folger"], [6, "opv", 22, 22, 14, "diff sat"]] },
  { id: "2020-07", sem: "SS 20", date: "2020-07-27", tasks: [
    [1, "ok", 2, 2, 6, "zuordnung"], [2, "ok", 4, 4, 16, "resonanz guete inversion"], [3, "net", 7, 8, 16, "kirchhoff knoten quelle stern"],
    [4, "ac", 11, 13, 20, "zeiger komp leistung"], [5, "bode", 15, 15, 22, "tp asym"], [6, "opv", 20, 20, 14, "inv sat"]] },
  { id: "2021-03", sem: "WS 20/21", date: "2021-03-01", tasks: [
    [1, "ok", 2, 3, 25, "resonanz"], [2, "net", 6, 7, 13, "quelle masche leistung"], [3, "ac", 9, 10, 20, "vierpol trafo"],
    [4, "bode", 13, 13, 22, "tp hp bp folger"], [5, "opv", 16, 17, 14, "inv diff sat"]] },
  { id: "2021-09", sem: "SS 21", date: "2021-09-29", tasks: [
    [1, "ok", 2, 3, 21, "resonanz guete inversion"], [2, "net", 6, 7, 16, "kirchhoff quelle masche"], [3, "ac", 10, 11, 20, "vierpol leistung"],
    [4, "bode", 14, 15, 22, "tp hp bp folger"], [5, "opv", 17, 17, 15, "inv"]] },
  { id: "2022-03", sem: "WS 21/22", date: "2022-03-16", tasks: [
    [1, "ok", 2, 3, 21, "resonanz guete"], [2, "net", 6, 7, 16, "stern masche leistung"], [3, "ac", 10, 11, 20, "zeiger"],
    [4, "bode", 13, 14, 22, "tp hp bp folger"], [5, "opv", 16, 18, 15, "diff sat"]] },
  { id: "2022-09", sem: "SS 22", date: "2022-09-26", tasks: [
    [1, "ok", 2, 4, 21, "resonanz inversion"], [2, "net", 7, 8, 16, "masche knoten quelle stern"], [3, "ac", 11, 12, 20, "trafo komp leistung"],
    [4, "bode", 14, 15, 23, "tp hp"], [5, "opv", 17, 18, 14, "inv"]] },
].map((e) => ({
  ...e,
  file: `len-exams/${e.id}.pdf`,
  tasks: e.tasks.map(([n, topic, page, sol, pts, tags]) => ({ n, topic, page, sol, pts, tags: tags.split(" "), key: `${e.id}/${n}` })),
}));

const lenDate = (iso) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
const topicPill = (t) => `<span class="len-topic" style="--tc:${LEN_TOPICS[t].color}">${L(LEN_TOPICS[t].short[0], LEN_TOPICS[t].short[1])}</span>`;
const tagChip = (g) => `<span class="len-tag">${L(LEN_TAGS[g][0], LEN_TAGS[g][1])}</span>`;

/* ---------------------------------------------------------------- The page */

const lenExamsView = { topic: "all", tag: null, open: false };
const lenExamDone = () => new Set(store.get("lenExamDone", []));

function renderLenExams() {
  const v = lenExamsView;
  const done = lenExamDone();
  const all = LEN_EXAMS.flatMap((e) => e.tasks);
  const match = (t) => (v.topic === "all" || t.topic === v.topic) && (!v.tag || t.tags.includes(v.tag)) && (!v.open || !done.has(t.key));
  const count = (topic) => all.filter((t) => topic === "all" || t.topic === topic).length;
  // The method tags that occur in the picked topic, most frequent first.
  const tagCount = {};
  all.filter((t) => v.topic === "all" || t.topic === v.topic).forEach((t) => t.tags.forEach((g) => (tagCount[g] = (tagCount[g] || 0) + 1)));
  const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
  const shown = LEN_EXAMS.map((e) => ({ e, tasks: e.tasks.filter(match) })).filter((x) => x.tasks.length);
  const nShown = shown.reduce((s, x) => s + x.tasks.length, 0);

  $("#len-exams").innerHTML = `
    <div class="card hero">
      <h1>${L(`Alt<span class="accent">klausuren</span>`, `Old <span class="accent">exams</span>`)}</h1>
      <p>${L(`Zehn LEN-Klausuren von 2018 bis 2022, jeweils mit Lösungen. Jede Klausur dauert <b>2 Stunden</b>, hat rund <b>90 Punkte</b> und fragt immer dieselben fünf Themen ab — die Liste unten zeigt, welche Aufgabe was abfragt.`,
        `Ten LEN exams from 2018 to 2022, each with solutions. Every exam lasts <b>2 hours</b>, has about <b>90 points</b> and always covers the same five topics — the list below shows what each task asks for.`)}</p>
      <p class="small">${L("„Aufgabe“ und „Lösung“ öffnen die PDF genau auf der richtigen Seite. Hak erledigte Aufgaben ab; „Üben“ bringt dich zu ähnlichen Aufgaben mit neuen Zahlen.",
        "“Task” and “Solution” open the PDF on exactly the right page. Tick off the tasks you've done; “Practise” takes you to similar tasks with new numbers.")}</p>
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">${L("Thema", "Topic")}</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">${L("Alle", "All")} · ${count("all")}</button>
          ${LEN_TOPIC_IDS.map((t) => `<button class="chip ${v.topic === t ? "active" : ""}" data-topic="${t}" style="--gc:${LEN_TOPICS[t].color}">${L(LEN_TOPICS[t].de, LEN_TOPICS[t].en)} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <div class="len-filter-row">
        <span class="len-filter-cap">${L("Methode", "Method")}</span>
        <div class="chips small-chips">
          ${tags.map((g) => `<button class="chip ${v.tag === g ? "active" : ""}" data-tag="${g}">${L(LEN_TAGS[g][0], LEN_TAGS[g][1])} · ${tagCount[g]}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="lenExamOpen" ${v.open ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>${L("Nur offene Aufgaben", "Only tasks not done yet")}</span></label>
      <p class="small muted len-filter-sum">${L(`${nShown} Aufgaben in ${shown.length} Klausuren`, `${nShown} tasks in ${shown.length} exams`)} · ${L(`${done.size} von ${all.length} erledigt`, `${done.size} of ${all.length} done`)}</p>
    </div>
    ${shown.map(({ e, tasks }) => `
      <div class="card len-exam">
        <div class="card-head">
          <div><h2>${e.sem} <span class="muted len-exam-date">· ${lenDate(e.date)}</span></h2>
            <span class="small muted">${e.tasks.length} ${L("Aufgaben", "tasks")} · ${e.tasks.reduce((s, t) => s + t.pts, 0)} ${L("Punkte", "points")} · 120 min</span></div>
          <a class="btn" href="${e.file}" target="_blank" rel="noopener">${L("Ganze Klausur", "Whole exam")} ↗</a>
        </div>
        <div class="len-tasks">
          ${tasks.map((t) => `
            <div class="len-task ${done.has(t.key) ? "done" : ""}">
              <label class="len-done" title="${lt("Erledigt", "Done")}"><input type="checkbox" data-done="${t.key}" ${done.has(t.key) ? "checked" : ""}><span aria-hidden="true">✓</span></label>
              <b class="len-task-n">${L("Aufgabe", "Task")} ${t.n}</b>
              ${topicPill(t.topic)}
              <span class="len-task-tags">${t.tags.map(tagChip).join("")}</span>
              <span class="len-task-pts">${t.pts} P</span>
              <span class="len-task-go">
                <a class="btn small-btn" href="${e.file}#page=${t.page}" target="_blank" rel="noopener">${L("Aufgabe", "Task")} · S. ${t.page}</a>
                <a class="btn small-btn" href="${e.file}#page=${t.sol}" target="_blank" rel="noopener">${L("Lösung", "Solution")} · S. ${t.sol}</a>
                <button class="btn small-btn primary" type="button" data-practise="${t.topic}" data-tags="${t.tags.join(" ")}">${L("Üben", "Practise")}</button>
              </span>
            </div>`).join("")}
        </div>
      </div>`).join("") || `<p class="muted">${L("Keine Aufgabe passt zu diesem Filter.", "No task matches this filter.")}</p>`}
    <p class="small muted len-more">${L("Die Klausuren decken die ganze Vorlesung ab — vieles davon kommt in der Vorlesung erst noch.", "The exams cover the whole course — a lot of it is still to come in the lectures.")}</p>`;

  $$("#len-exams [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; v.tag = null; renderLenExams(); }));
  $$("#len-exams [data-tag]").forEach((b) => (b.onclick = () => { v.tag = v.tag === b.dataset.tag ? null : b.dataset.tag; renderLenExams(); }));
  $("#lenExamOpen").onchange = (ev) => { v.open = ev.target.checked; renderLenExams(); };
  $$("#len-exams [data-done]").forEach((c) => (c.onchange = () => {
    const s = lenExamDone();
    c.checked ? s.add(c.dataset.done) : s.delete(c.dataset.done);
    store.set("lenExamDone", [...s]);
    renderLenExams();
  }));
  $$("#len-exams [data-practise]").forEach((b) => (b.onclick = () => openLenPractice(b.dataset.practise, b.dataset.tags.split(" "))));
}
