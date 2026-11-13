// ProPa old exams: WS23/24 to SS26 with their tasks, each summarised (in our own words), tagged by
// topic and linked to its page in the exam and in the solutions. The PDFs are KIT material: they live
// in public/propa-exams/ on the server only and are never committed (see .gitignore and the README).
//
// Since WS25/26 the functional half is Lean, so those exams count in full. Before that it was Haskell,
// Prolog, λ-calculus, type inference and compilers — of those exams only the Reussner tasks (MPI,
// Java, Design by Contract and the parallel part of the multiple-choice questions) are listed.

// Topics, the sections that teach them and the practice kind that trains them.
const PROPA_EXAM_TOPICS = {
  list: { part: "Lean", name: "Lists & HashMap", color: "var(--c-object)", secs: ["2.1", "1.3"], drill: "pipe" },
  adt: { part: "Lean", name: "Data types", color: "var(--c-topic)", secs: ["1.2", "1.3"], drill: "match" },
  rec: { part: "Lean", name: "Recursion & folds", color: "var(--c-point)", secs: ["1.4", "2.1", "2.2"], drill: "fold" },
  interp: { part: "Lean", name: "Interpreter", color: "var(--c-time)", secs: ["2.4", "4.2"], drill: "option" },
  acc: { part: "Lean", name: "Accumulators", color: "var(--c-range)", secs: ["3.1"], drill: "tail" },
  pbt: { part: "Lean", name: "Property testing", color: "var(--c-place)", secs: ["3.2"], drill: null },
  monad: { part: "Lean", name: "Monads & type classes", color: "var(--c-subject)", secs: ["4.2", "3.3"], drill: "state" },
  mc: { part: "Reussner", name: "Multiple choice", color: "var(--c-owner)", secs: ["5.1", "6.4", "7.1", "8.3"], drill: "examtf" },
  mpi: { part: "Reussner", name: "MPI", color: "var(--c-also)", secs: ["6.3", "6.4"], drill: "mpitrace" },
  java: { part: "Reussner", name: "Java threads", color: "var(--c-with)", secs: ["7.1", "7.2", "7.3", "7.4"], drill: "race" },
  dbc: { part: "Reussner", name: "Design by Contract", color: "var(--c-verb)", secs: ["8.1", "8.2", "8.3"], drill: "jml" },
};
const PROPA_EXAM_TOPIC_IDS = Object.keys(PROPA_EXAM_TOPICS);

// Each exam: id (file name), semester, date, whether it is in the current (Lean) format, a note on
// what was left out, and its tasks: [number, topic, page, points, what the sub-questions ask].
const PROPA_EXAMS = [
  { id: "2626-ss", sem: "SS 26", date: "2026-09-25", full: true, tasks: [
    [1, "list", 2, 8, ["filter and map: the lectures of one student", "increment a HashMap entry, or set it to 1 (m[k]? and insert)", "count students per lecture with foldl into a HashMap"]],
    [2, "adt", 5, 11, ["an Account structure (frozen, pin, balance)", "an inductive Output with and without data", "the ATM logic: checks first, then match on the input, structure update"]],
    [3, "rec", 8, 15, ["maps as lists of pairs: findWithDefault", "insert that replaces an existing key", "partition with an accumulator", "union with foldl and insert (left side wins)"]],
    [4, "interp", 11, 9, ["write a let-expression as an Expr value", "an Option interpreter with an environment, Let, and component-wise vector addition"]],
    [5, "acc", 13, 12, ["range n with ++ (no accumulator)", "range n tail-recursive with an accumulator", "sum of 2D vectors", "average in one pass: accumulate sum and count together"]],
    [6, "pbt", 16, 14, ["union-find properties with connected / equivalent", "init keeps distinct elements apart; union connects", "union never disconnects; union of connected elements changes nothing", "the order of two unions doesn't matter"]],
    [7, "monad", 18, 11, ["a Robot type class: getDir, getPos, setDir, setPos", "exec for forward n / flip over any monad with that interface"]],
    [8, "mpi", 20, 15, ["trace localAverage, threshold (Reduce + Bcast), counts and the Gather result on 4 ranks", "replace Reduce + Bcast by one MPI_Allreduce", "two advantages of collectives over send/recv", "sequence diagrams for synchronous, buffered and ready sends"]],
    [9, "java", 24, 18, ["name the thread states and transitions", "which lines to synchronise, on which monitor", "Amdahl from measured times: T(1) = 12 s, T(4) = 9 s → p = 1/3 → at most 1.5×", "order steps of two threads so both enter a critical section (flag, x++, reordering)"]],
    [10, "dbc", 28, 7, ["turn a JML contract into Java assertions (remember the old value first)", "find the contract violation in a loop — the caller's fault"]],
  ] },
  { id: "2526-ws", sem: "WS 25/26", date: "2026-03-20", full: true, tasks: [
    [1, "list", 2, 8, ["pairwise division skipping zero denominators: zip, filter, map", "a smart constructor mk! for NonZeroFloat (private mk, panic!)", "divide lists of NonZeroFloat, keeping the invariant"]],
    [2, "adt", 4, 11, ["a TV structure and its default value", "receive a Signal: match, structure update, ignore when off, cap volume at 100", "process a list of signals with foldl"]],
    [3, "rec", 7, 15, ["sets as lists: contains", "insert without duplicates", "intersection (cons where it's safe)", "map (insert, since f may create duplicates)"]],
    [4, "interp", 9, 9, ["an Option interpreter for Const, Var, Add and Map over lists, with do-notation and List.mapM"]],
    [5, "acc", 11, 12, ["count occurrences, plain and tail-recursive", "countUnique, plain and with an accumulator for the seen elements"]],
    [6, "pbt", 13, 15, ["a double-ended list (xs, ys.reverse): getLast? and snoc", "property: getLast? after snoc", "round trip ofList / toList", "List.getLast? as reference implementation"]],
    [7, "monad", 16, 10, ["a Stack type class: push, pop, isEmpty", "run load/add instructions in do-notation"]],
    [8, "mpi", 18, 15, ["trace Bcast, predictions from the first rank + 1 values, Allgather and Gather", "replace Allgather by Gather + Bcast", "which send modes can act as a barrier (only synchronous)", "is the send buffer reusable after every blocking call (yes)", "only the root knows the length: broadcast it first (or MPI_Probe)"]],
    [9, "java", 22, 15, ["critical sections and monitor objects in a ticket list", "submit / next with wait() in a while loop and notifyAll()", "two deadlock-avoidance measures, each tied to a Coffman condition", "run one call as a Future on an ExecutorService, get() as late as possible"]],
    [10, "dbc", 26, 10, ["three bugs in sum(int[]) and whether the pre- or postcondition catches them", "who is responsible for pre / post violations", "strengthen the preconditions (non-empty, all positive)"]],
  ] },
  { id: "2525-ss", sem: "SS 25", date: "2025-09-26", full: false, skip: "Tasks 2–4 and 8 (Haskell, λ-calculus, compilers) and the non-parallel multiple-choice questions are from the old lecture.", tasks: [
    [1, "mc", 2, 3, ["(a)–(c): which collectives leave the result only on the root", "which Java operations are atomic", "which implications Liskov demands"]],
    [5, "mpi", 14, 9, ["trace scattered words, vowel counts per rank and the Reduce result", "write your own Reduce-sum with only MPI_Send / MPI_Recv"]],
    [6, "java", 18, 10, ["line ranges and monitors for a rule queue (producer/consumer)", "replace busy waiting by wait() / notifyAll()", "what a memory consistency error is, and one fix", "a stream: drop invalid items, flatMap unresolved ones"]],
    [7, "dbc", 22, 11, ["fix a JML contract (drop a needless precondition, add the missing postcondition)", "write contracts for open / close of a subclass", "which precondition in the superclass keeps Liskov for any future subclass (false)"]],
  ] },
  { id: "2425-ws", sem: "WS 24/25", date: "2025-03-27", full: false, skip: "Tasks 2–4 and 8 (Haskell, λ-calculus, compilers) and the non-parallel multiple-choice questions are from the old lecture.", tasks: [
    [1, "mc", 2, 3, ["(e)–(g): MPI collectives in Flynn's taxonomy", "which Coffman conditions synchronized can avoid", "what must hold after a method runs"]],
    [5, "mpi", 12, 9, ["trace Scatter, local averages and the Reduce result", "non-contiguous groups: Bcast instead of Scatter, MPI_MIN instead of SUM", "an advantage of shared memory and of message passing; where shared memory is impossible"]],
    [6, "java", 16, 11, ["a check-then-act race between two methods, and the fix", "a semaphore for sets of objects with wait() / notifyAll()", "needing a third resource later: release, then acquire all (hold and wait)", "happens-before: what it is and two ways to create it"]],
    [7, "dbc", 20, 10, ["find the two contract violations (caller and supplier)", "which design principle is broken (precondition availability)", "write pre/post for moving an object into the hand"]],
  ] },
  { id: "2424-ss", sem: "SS 24", date: "2024-09-27", full: false, skip: "Tasks 1–5 and 8 (Haskell, Prolog, λ-calculus, type inference, syntax analysis) are from the old lecture.", tasks: [
    [6, "mpi", 12, 10, ["trace numbers, local products and the Gather result for N = 8 on 4 ranks", "what it computes (N!)", "replace Gather + loop by MPI_Reduce with MPI_PROD", "is filling on the root and scattering sensible? (no: each rank computes its own range)"]],
    [7, "java", 16, 15, ["turn nested synchronized blocks into lock() / unlock() — also on early return and exception", "why two threads with opposite lock order deadlock; two fixes via Coffman", "happens-before arrows from line 6 (the futureTicket / futureSeats code)", "implement a method from JML-specified helpers; weakest pre, strongest post"]],
  ] },
  { id: "2324-ws", sem: "WS 23/24", date: "2024-03-28", full: false, skip: "Tasks 1–5 and 8 (Haskell, Prolog, Church pairs, type inference, compilers) are from the old lecture.", tasks: [
    [6, "mpi", 12, 12.5, ["a ring broadcast with five bugs: missing MPI_Init, negative ranks, send before receive, rank + 1 past the end"]],
    [7, "java", 14, 12.5, ["submit to an ExecutorService and write(future.get()) in a small try/catch", "iterate under the shared monitor; notifyAll + wait after each item, return a partial result on interrupt", "parallel stream: the longest delivery time", "weaken a too-strict JML precondition (∃ delivered order, ∀ valid dates)"]],
  ] },
].map((e) => ({
  ...e,
  file: `propa-exams/${e.id}.pdf`,
  sol: `propa-exams/${e.id}-solutions.pdf`,
  tasks: e.tasks.map(([n, topic, page, pts, asks]) => ({ n, topic, page, pts, asks, key: `${e.id}/${n}` })),
}));

/* ---------------------------------------------------------------- The page */

const ppExamView = { part: "all", topic: "all", open: false };
const ppExamDone = () => new Set(store.get("propaExamDone", []));
const ppDate = (iso) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
const ppTopicPill = (t) => `<span class="len-topic" style="--tc:${PROPA_EXAM_TOPICS[t].color}">${PROPA_EXAM_TOPICS[t].name}</span>`;

// Points per topic and exam, to see what always comes up.
function ppExamGrid() {
  const exams = [...PROPA_EXAMS].reverse();
  const max = 18;
  return `<div class="pp-egrid" style="--n:${exams.length}">
    <span></span>${exams.map((e) => `<span class="pp-eg-h">${e.sem}${e.full ? "" : "*"}</span>`).join("")}
    ${PROPA_EXAM_TOPIC_IDS.map((t) => `<span class="pp-eg-t">${ppTopicPill(t)}</span>${exams.map((e) => {
      const pts = e.tasks.filter((x) => x.topic === t).reduce((a, x) => a + x.pts, 0);
      const na = !e.full && PROPA_EXAM_TOPICS[t].part === "Lean";
      return `<span class="pp-eg-c ${na ? "na" : ""}" style="--a:${pts ? 18 + (pts / max) * 70 : 0}%;--tc:${PROPA_EXAM_TOPICS[t].color}">${na ? "" : pts || "–"}</span>`;
    }).join("")}`).join("")}
  </div><p class="small muted">Points per topic. * Older exams: only the Reussner part applies (the functional half was Haskell then).</p>`;
}

function renderPropaExams() {
  const v = ppExamView;
  const done = ppExamDone();
  const all = PROPA_EXAMS.flatMap((e) => e.tasks);
  const ofPart = (t) => v.part === "all" || PROPA_EXAM_TOPICS[t.topic].part === v.part;
  const match = (t) => ofPart(t) && (v.topic === "all" || t.topic === v.topic) && (!v.open || !done.has(t.key));
  const count = (topic) => all.filter((t) => ofPart(t) && (topic === "all" || t.topic === topic)).length;
  const shown = PROPA_EXAMS.map((e) => ({ e, tasks: e.tasks.filter(match) })).filter((x) => x.tasks.length);
  const nShown = shown.reduce((s, x) => s + x.tasks.length, 0);
  const topics = PROPA_EXAM_TOPIC_IDS.filter((t) => v.part === "all" || PROPA_EXAM_TOPICS[t].part === v.part);

  $("#propa-exams").innerHTML = `
    <div class="card hero">
      <h1>Old <span class="accent">exams</span></h1>
      <p>Six exams from WS 23/24 to SS 26, each with a model solution. An exam lasts <b>120 minutes</b> for <b>120 points</b>.
        Since WS 25/26 about two thirds are Lean and one third Reussner — <b>MPI, Java threads and Design by Contract</b> come up in every exam.</p>
      <p class="small">“Task” and “Solution” open the PDF on the right page. Tick off what you've done; “Review” goes to the section, “Practise” to similar tasks with new values.</p>
    </div>
    <div class="card">
      <h2>What comes up</h2>
      ${ppExamGrid()}
    </div>
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
      <label class="switch inline len-open-toggle"><input type="checkbox" id="ppExamOpen" ${v.open ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Only tasks not done yet</span></label>
      <p class="small muted len-filter-sum">${nShown} tasks in ${shown.length} exams · ${done.size} of ${all.length} done</p>
    </div>
    ${shown.map(({ e, tasks }) => `
      <div class="card len-exam">
        <div class="card-head">
          <div><h2>${e.sem} <span class="muted len-exam-date">· ${ppDate(e.date)}</span></h2>
            <span class="small muted">${e.full ? "current format: everything applies" : `only the Reussner part · ${e.tasks.reduce((s, t) => s + t.pts, 0)} of 120 points listed`}</span></div>
          <span class="pp-exam-files"><a class="btn" href="${e.file}" target="_blank" rel="noopener">Exam ↗</a><a class="btn" href="${e.sol}" target="_blank" rel="noopener">Solutions ↗</a></span>
        </div>
        ${e.skip && v.topic === "all" ? `<p class="small muted pp-exam-skip">Left out: ${e.skip}</p>` : ""}
        <div class="len-tasks">
          ${tasks.map((t) => {
            const T = PROPA_EXAM_TOPICS[t.topic];
            return `
            <div class="len-task pp-etask ${done.has(t.key) ? "done" : ""}">
              <label class="len-done" title="Done"><input type="checkbox" data-done="${t.key}" ${done.has(t.key) ? "checked" : ""}><span aria-hidden="true">✓</span></label>
              <b class="len-task-n">Task ${t.n}</b>
              ${ppTopicPill(t.topic)}
              <span class="len-task-pts">${String(t.pts).replace(".", ",")} P</span>
              <ul class="pp-asks">${t.asks.map((a) => `<li>${ppEsc(a)}</li>`).join("")}</ul>
              <span class="len-task-go">
                <a class="btn small-btn" href="${e.file}#page=${t.page}" target="_blank" rel="noopener">Task · p. ${t.page}</a>
                <a class="btn small-btn" href="${e.sol}#page=${t.page}" target="_blank" rel="noopener">Solution · p. ${t.page}</a>
                <button class="btn small-btn" type="button" data-sec="${T.secs[0]}">Review ${T.secs.join(", ")}</button>
                <button class="btn small-btn primary" type="button" data-tasks="${t.topic}">Practise</button>
                ${T.drill ? `<button class="btn small-btn" type="button" data-drill="${T.drill}">Quick drill</button>` : ""}
              </span>
            </div>`;
          }).join("")}
        </div>
      </div>`).join("") || `<p class="muted">No task matches this filter.</p>`}`;

  $$("#propa-exams [data-part]").forEach((b) => (b.onclick = () => { v.part = b.dataset.part; v.topic = "all"; renderPropaExams(); }));
  $$("#propa-exams [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; renderPropaExams(); }));
  $("#ppExamOpen").onchange = (ev) => { v.open = ev.target.checked; renderPropaExams(); };
  $$("#propa-exams [data-done]").forEach((cb) => (cb.onchange = () => {
    const s = ppExamDone();
    cb.checked ? s.add(cb.dataset.done) : s.delete(cb.dataset.done);
    store.set("propaExamDone", [...s]);
    track("propa.examDone");
    renderPropaExams();
  }));
  $$("#propa-exams [data-sec]").forEach((b) => (b.onclick = () => openPropaSection(b.dataset.sec)));
  $$("#propa-exams [data-drill]").forEach((b) => (b.onclick = () => openPropaDrill(b.dataset.drill)));
  $$("#propa-exams [data-tasks]").forEach((b) => (b.onclick = () => openPropaTasks(b.dataset.tasks)));
}

// Opens the Practice tab on one kind of quick drill.
function openPropaDrill(id) {
  ppPractice.mode = "drills";
  ppPractice.kind = id;
  showTab("propa-practice");
  renderPropaPractice();
  window.scrollTo({ top: 0 });
}

/* ---------------------------------------------------------------- Exam-style practice */

const fmt = (x) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 100) / 100));
const arr = (xs) => `{ ${xs.map(fmt).join(", ")} }`;

// The MPI task of every exam: follow a small program's variables on each rank.
ppR({
  id: "mpitrace", ch: 6, name: "MPI: trace the variables", about: "the table task of every exam",
  make() {
    const size = 4, r = rint(0, 3);
    const kind = pick(["scatterAvg", "bcastAllgather", "threshold", "product"]);
    let src, q, right, wrong, why;
    if (kind === "scatterAvg") {
      const data = rlist(8, 0, 9);
      const loc = (k) => data.slice(2 * k, 2 * k + 2), avg = (k) => (loc(k)[0] + loc(k)[1]) / 2;
      const sum = [0, 1, 2, 3].reduce((a, k) => a + avg(k), 0);
      src = `// data on rank 0: ${arr(data)}\nMPI_Scatter(data, 2, MPI_INT, local, 2, MPI_INT, 0, MPI_COMM_WORLD);\ndouble localAvg = (local[0] + local[1]) / 2.0;\ndouble globalSum = 0;\nMPI_Reduce(&localAvg, &globalSum, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);`;
      const v = pick(["local", "localAvg", "globalSum"]);
      q = `${cq(v)} on rank ${r} at the end?`;
      if (v === "local") { right = arr(loc(r)); wrong = [arr(loc((r + 1) % 4)), arr(data.slice(0, 2)), arr(data), arr(loc(r).reverse())]; why = `Scatter gives rank ${r} elements ${2 * r} and ${2 * r + 1}.`; }
      else if (v === "localAvg") { right = fmt(avg(r)); wrong = [fmt(avg((r + 1) % 4)), fmt(loc(r)[0] + loc(r)[1]), fmt(sum / 4), fmt(sum)]; why = `The average of its own two values ${arr(loc(r))}.`; }
      else { right = r === 0 ? fmt(sum) : "0"; wrong = r === 0 ? [fmt(sum / 4), "0", fmt(avg(0))] : [fmt(sum), fmt(avg(r)), fmt(sum / 4)]; why = r === 0 ? "The root receives the sum of all four averages." : "Only the root receives the Reduce result; elsewhere globalSum keeps its 0."; }
    } else if (kind === "bcastAllgather") {
      const data = rlist(6, 0, 9);
      const m = (k) => Math.max(...data.slice(0, k + 1));
      src = `// data on rank 0: ${arr(data)}, on the others uninitialised\nMPI_Bcast(data, 6, MPI_INT, 0, MPI_COMM_WORLD);\nint m = max(data, rank + 1);           // max of the first rank + 1 values\nint *all = malloc(size * sizeof(int));\nMPI_Allgather(&m, 1, MPI_INT, all, 1, MPI_INT, MPI_COMM_WORLD);`;
      const v = pick(["m", "all", "data"]);
      q = `${cq(v)} on rank ${r} at the end?`;
      const allV = [0, 1, 2, 3].map(m);
      if (v === "m") { right = fmt(m(r)); wrong = [fmt(m(3)), fmt(data[r]), fmt(m(Math.max(0, r - 1)) + 1), fmt(Math.min(...data.slice(0, r + 1))), fmt(m(r) + 1), fmt(m(r) - 1), fmt(data[0] + data[r])]; why = `The largest of ${arr(data.slice(0, r + 1))}.`; }
      else if (v === "all") { right = arr(allV); wrong = [arr([m(r)]), r === 0 ? arr(allV.slice().reverse()) : "uninitialised", arr(allV.map((x, k) => (k === r ? x : 0))), arr(data.slice(0, 4))]; why = "Allgather: every rank gets everyone's m, in rank order — the same array everywhere."; }
      else { right = arr(data); wrong = [arr(data.slice(0, r + 1)), "uninitialised", arr(data.slice(r, r + 1))]; why = "After the broadcast every rank has the root's whole array."; }
    } else if (kind === "threshold") {
      const vals = [0, 1, 2, 3].map(() => rlist(4, 10, 30));
      const avg = (k) => vals[k].reduce((a, b) => a + b, 0) / 4;
      const thr = [0, 1, 2, 3].reduce((a, k) => a + avg(k), 0) / size;
      const cnt = (k) => vals[k].filter((x) => x > thr).length;
      src = `// each rank has its own 4 values: ${vals.map((v, k) => `rank ${k}: ${arr(v)}`).join("; ")}\ndouble localAvg = average(vals, 4);\ndouble sum = 0;\nMPI_Reduce(&localAvg, &sum, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);\ndouble threshold = 0;\nif (rank == 0) threshold = sum / size;\nMPI_Bcast(&threshold, 1, MPI_DOUBLE, 0, MPI_COMM_WORLD);\nint count = 0;\nfor (int i = 0; i < 4; i++) if (vals[i] > threshold) count++;\nint *counts = calloc(size, sizeof(int));\nMPI_Gather(&count, 1, MPI_INT, counts, 1, MPI_INT, 0, MPI_COMM_WORLD);`;
      const v = pick(["threshold", "count", "counts"]);
      q = `${cq(v)} on rank ${r} at the end?`;
      if (v === "threshold") { right = fmt(thr); wrong = [fmt(avg(r)), "0", fmt(thr * size)]; why = "The root computes it from the sum of averages, then Bcast gives every rank the same value."; }
      else if (v === "count") { right = String(cnt(r)); wrong = [String(4 - cnt(r)), String(cnt((r + 1) % 4)), ...[0, 1, 2, 3, 4].filter((x) => x !== cnt(r)).map(String)]; why = `Values of rank ${r} above ${fmt(thr)}.`; }
      else { const c = [0, 1, 2, 3].map(cnt); right = r === 0 ? arr(c) : arr([0, 0, 0, 0]); wrong = r === 0 ? [arr([0, 0, 0, 0]), arr(c.slice().reverse()), arr([c[0], 0, 0, 0])] : [arr(c), arr(c.map((x, k) => (k === r ? x : 0))), "uninitialised"]; why = r === 0 ? "The root gathers every rank's count, in rank order." : "Only the root's buffer is filled; calloc left zeros elsewhere."; }
    } else {
      const N = 8, nums = [1, 2, 3, 4, 5, 6, 7, 8];
      src = `// N = 8, numbers = { 1, …, 8 } on rank 0\nMPI_Scatter(numbers, N / size, MPI_LONG, local, N / size, MPI_LONG, 0, MPI_COMM_WORLD);\nlong local_result = 1;\nfor (int i = 0; i < N / size; i++) local_result *= local[i];\nMPI_Reduce(&local_result, &result, 1, MPI_LONG, MPI_PROD, 0, MPI_COMM_WORLD);`;
      const v = pick(["local", "local_result", "result"]);
      const loc = nums.slice(2 * r, 2 * r + 2);
      q = v === "result" ? `${cq("result")} on rank 0 at the end?` : `${cq(v)} on rank ${r} at the end?`;
      if (v === "local") { right = arr(loc); wrong = [arr(nums.slice(0, 2)), arr(nums), arr(nums.slice(r, r + 2)), arr(nums.slice(2 * ((r + 1) % 4), 2 * ((r + 1) % 4) + 2)), arr([2 * r + 2, 2 * r + 1]), arr(nums.slice(4 * (r % 2), 4 * (r % 2) + 4))]; why = "Scatter: 8 / 4 = 2 numbers per rank, in rank order."; }
      else if (v === "local_result") { right = String(loc[0] * loc[1]); wrong = [String(loc[0] + loc[1]), String(40320), String(loc[0])]; why = `${loc[0]} · ${loc[1]}.`; }
      else { right = "40320 (= 8!)"; wrong = ["36 (= 1 + … + 8)", "56 (= 7 · 8)", "1"]; why = "The product of all partial products: N!."; }
    }
    return { q: `${ccode(src)}<p>Run with 4 processes. What is ${q}</p>`, opts: ppOpts(cq(right), wrong.map((x) => cq(x))), why };
  },
});

// True/false knowledge like the exams' multiple-choice part (our own statements).
const PP_TF = [
  ["After MPI_Gather the collected data is only on the root.", true], ["After MPI_Reduce the result is only on the root.", true],
  ["After MPI_Bcast the data is only on the root.", false], ["After MPI_Allgather every process has all the data.", true],
  ["MPI collectives are classified as SIMD in Flynn's taxonomy.", true], ["MPI collectives are MISD in Flynn's taxonomy.", false],
  ["Reading an int in Java is atomic.", true], ["i++ on an int is atomic in Java.", false], ["Reading a volatile long is atomic in Java.", true],
  ["Writing a (non-volatile) double is guaranteed atomic in Java.", false],
  ["Liskov: Pre(superclass) ⇒ Pre(subclass).", true], ["Liskov: Pre(subclass) ⇒ Pre(superclass).", false],
  ["Liskov: Post(subclass) ⇒ Post(superclass).", true], ["Liskov: Post(superclass) ⇒ Post(subclass).", false],
  ["With synchronized blocks you can still avoid hold-and-wait.", true], ["With synchronized blocks you can still avoid circular wait.", true],
  ["With synchronized blocks you can avoid mutual exclusion.", false], ["With synchronized blocks you can avoid no-preemption.", false],
  ["After a method runs, the class invariant must hold.", true], ["After a method runs, its precondition must still hold.", false],
  ["After an overriding method runs, the overridden method's postcondition must hold.", true],
  ["Synchronous sends can be used as a barrier between sender and receiver.", true], ["Buffered sends can be used as a barrier.", false],
  ["After any blocking MPI send, the send buffer may be reused.", true], ["After MPI_Isend returns, the send buffer may be reused at once.", false],
  ["volatile makes x = x + 1 atomic.", false], ["notifyAll() wakes every thread waiting on that monitor.", true],
  ["A signal sent with notify() is stored until someone waits.", false], ["Future.get() blocks until the result is available.", true],
  ["A violated precondition is a bug in the caller.", true], ["A violated precondition is a bug in the called method.", false],
];
ppR({
  id: "examtf", ch: 5, name: "Exam multiple choice", about: "true or false, like part 1 of older exams",
  make() {
    const t = shuffle(PP_TF.filter(([, b]) => b)), f = shuffle(PP_TF.filter(([, b]) => !b));
    const wantTrue = Math.random() < 0.6;
    const [right] = wantTrue ? t : f;
    const others = (wantTrue ? f : t).slice(0, 3);
    return { q: `<p>Which statement is <b>${wantTrue ? "true" : "false"}</b>?</p>`, opts: ppOpts(right[0], others.map((x) => x[0])),
      why: `“${right[0]}” is ${right[1] ? "true" : "false"}.` };
  },
});

// Amdahl from measured times, as in SS 26.
ppR({
  id: "amdahlT", ch: 5, name: "Amdahl from measurements", about: "T(1) and T(n) → p → the limit",
  make() {
    const n = pick([2, 4, 8]), p = pick([1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4]), T1 = pick([12, 24, 36, 48]);
    const Tn = T1 * (1 - p) + (T1 * p) / n;
    const lim = 1 / (1 - p);
    return { q: `<p>A program takes T(1) = ${T1} s on one processor and T(${n}) = ${fmt(Tn)} s on ${n}. What speedup can unlimited processors give at most?</p>`,
      opts: ppOpts(fmt(lim), [fmt(T1 / Tn), fmt(n), fmt(1 / p), fmt(lim + 1)]),
      why: `T(${n}) = (1 − p)·T(1) + p·T(1)/${n} gives p = ${fmt(p)}; then S(∞) = 1 / (1 − p) = ${fmt(lim)}.` };
  },
});
