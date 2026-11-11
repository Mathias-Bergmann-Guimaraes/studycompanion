// ProPa Reussner chapter 7: Java_Basic (topic 5.4), Java_Advanced (5.5) and Übung 2/3. Most drawings
// run on one small engine: threads made of lines you step yourself, sharing variables and locks,
// so races, deadlocks, reentrance and compare-and-set can all be tried by hand.

/* ---------------------------------------------------------------- The interleaving engine */

// A line: { src, run(sh, loc) → index to jump to (optional) } or { src, lock: "m" } / { src, unlock: "m" }.
// Locks are reentrant, like Java monitors. A thread blocks on a lock another thread holds.
function ppInterleave(root, key, scenarios, { initial = "a", toggles = "" } = {}) {
  const { fig, read, w } = ppW(root, key);
  const st = { sc: initial, opt: 0 };
  let S, ths, sh, locks, log;
  const reset = () => {
    S = scenarios[st.sc];
    const made = S.make(st.opt);
    sh = { ...made.shared };
    ths = made.threads.map((t) => ({ ...t, pc: 0, loc: {}, retries: 0 }));
    locks = {};
    log = [];
  };
  const blocked = (t, i) => {
    const l = t.lines[t.pc];
    return l && l.lock && locks[l.lock] && locks[l.lock].by !== i;
  };
  const step = (i) => {
    const t = ths[i], l = t.lines[t.pc];
    if (!l || blocked(t, i)) return;
    if (l.lock) { locks[l.lock] = { by: i, n: (locks[l.lock]?.n || 0) + 1 }; log.push(`${t.name}: enters monitor ${l.lock}${locks[l.lock].n > 1 ? " again (reentrant)" : ""}`); t.pc++; return; }
    if (l.unlock) { if (--locks[l.unlock].n === 0) delete locks[l.unlock]; log.push(`${t.name}: leaves ${l.unlock}`); t.pc++; return; }
    const jump = l.run ? l.run(sh, t.loc, t) : undefined;
    log.push(`${t.name}: ${l.say ? l.say(sh, t.loc) : l.src.trim()}`);
    t.pc = jump ?? t.pc + 1;
  };
  const draw = () => {
    const done = ths.every((t) => t.pc >= t.lines.length);
    const live = ths.map((t, i) => t.pc < t.lines.length && !blocked(t, i));
    const dead = !done && !live.some(Boolean);
    fig.innerHTML = `<div class="pp-threads" style="--n:${ths.length}">${ths.map((t, i) => `
      <div class="pp-thread ${t.pc >= t.lines.length ? "fin" : blocked(t, i) ? "blk" : ""}">
        <div class="pp-thread-h"><b>${t.name}</b>${Object.keys(t.loc).length ? `<span class="small muted">${Object.entries(t.loc).map(([k, v]) => `${k} = ${v}`).join(", ")}</span>` : ""}</div>
        <pre class="pp-tcode">${t.lines.map((l, k) => `<span class="${k === t.pc ? (blocked(t, i) ? "blk" : "now") : k < t.pc ? "past" : ""}">${cHL(l.src)}</span>`).join("\n")}</pre>
        <button class="btn ${live[i] ? "primary" : ""}" type="button" data-t="${i}" ${live[i] ? "" : "disabled"}>${t.pc >= t.lines.length ? "finished" : blocked(t, i) ? `waits for ${t.lines[t.pc].lock}` : "Step"}</button>
      </div>`).join("")}</div>
      <div class="pp-shared">${Object.entries(sh).map(([k, v]) => `<span><span class="small muted">${k}</span><b>${v}</b></span>`).join("")}${Object.entries(locks).map(([k, v]) => `<span class="lock"><span class="small muted">monitor ${k}</span><b>${ths[v.by].name}${v.n > 1 ? ` ×${v.n}` : ""}</b></span>`).join("")}</div>`;
    $$("[data-t]", fig).forEach((b) => (b.onclick = () => { step(+b.dataset.t); draw(); }));
    read.innerHTML = `${dead ? `<p><span class="pill bad">deadlock — every thread waits for a monitor another one holds</span></p>` : done ? S.verdict(sh, ths) : `<p class="small">${S.hint}</p>`}
      <ol class="pp-trace">${log.slice(-8).map((x) => `<li>${ppEsc(x)}</li>`).join("")}</ol>`;
  };
  ppW(root, key).on("reset", () => { reset(); draw(); });
  ppW(root, key).on("auto", () => {
    for (let k = 0; k < 200; k++) { const ok = ths.map((t, i) => t.pc < t.lines.length && !blocked(t, i)).map((x, i) => (x ? i : -1)).filter((i) => i >= 0); if (!ok.length) break; step(pick(ok)); }
    draw();
  });
  lenWire(w, st, () => { reset(); draw(); });
  reset();
  draw();
}

const line = (src, run, say) => ({ src, run, say });
const lockL = (m, src = `synchronized (${m}) {`) => ({ src, lock: m });
const unlockL = (m, src = "}") => ({ src, unlock: m });

const PP_RACES = {
  a: {
    name: "c++ in 3 threads",
    hint: "Step the threads in any order. Try reading c in all three before anyone writes.",
    make: (sync) => ({
      shared: { c: 0 },
      threads: ["T1", "T2", "T3"].map((name) => ({ name, lines: [
        ...(sync ? [lockL("this", "synchronized (this) {")] : []),
        line("int _c = c;      // get", (sh, lo) => { lo._c = sh.c; }),
        line("_c = _c + 1;     // increment", (sh, lo) => { lo._c += 1; }),
        line("c = _c;          // write", (sh, lo) => { sh.c = lo._c; }),
        ...(sync ? [unlockL("this")] : []),
      ] })),
    }),
    verdict: (sh) => `<p><span class="pill ${sh.c === 3 ? "good" : "bad"}">c = ${sh.c}</span></p><p class="small">${sh.c === 3 ? "Right this time." : "Lost update(s): threads read the same old value."} Without synchronisation c can end anywhere from 1 to 3.</p>`,
  },
  b: {
    name: "check, then decrement",
    hint: "Both threads check globalVar > 0 first — then both decrement.",
    make: (sync) => ({
      shared: { globalVar: 1 },
      threads: ["T1", "T2"].map((name) => ({ name, lines: [
        ...(sync ? [lockL("obj", "synchronized (obj) {")] : []),
        line("if (globalVar > 0) {", (sh, lo) => { lo.ok = sh.globalVar > 0; if (!lo.ok) return sync ? 3 : 2; }, (sh, lo) => `checks globalVar > 0: ${lo.ok}`),
        line("  globalVar--;", (sh) => { sh.globalVar--; }),
        line("}"),
        ...(sync ? [unlockL("obj")] : []),
      ] })),
    }),
    verdict: (sh) => `<p><span class="pill ${sh.globalVar >= 0 ? "good" : "bad"}">globalVar = ${sh.globalVar}</span></p><p class="small">${sh.globalVar < 0 ? "Negative: both passed the check before either decremented — a race condition." : "Fine this time. The check and the change must happen in one critical section."}</p>`,
  },
  v: {
    name: "volatile c = c + 1",
    hint: "volatile makes each read and write visible — but c = c + 1 is still a read, then a write.",
    make: () => ({
      shared: { c: 0 },
      threads: ["T1", "T2"].map((name) => ({ name, lines: [
        line("tmp = c;        // volatile read", (sh, lo) => { lo.tmp = sh.c; }),
        line("c = tmp + 1;    // volatile write", (sh, lo) => { sh.c = lo.tmp + 1; }),
      ] })),
    }),
    verdict: (sh) => `<p><span class="pill ${sh.c === 2 ? "good" : "bad"}">c = ${sh.c}</span></p><p class="small">volatile guarantees visibility and atomic single reads/writes, not an atomic read-modify-write. Still a race.</p>`,
  },
};

const PP_LOCKS = {
  a: {
    name: "m1 → m2 vs m2 → m1",
    hint: "Step A into m1 and B into m2 — then neither can go on.",
    make: (same) => ({
      shared: {},
      threads: [
        { name: "A", lines: [lockL("m1"), lockL("m2", "  synchronized (m2) {"), line("    // do something"), unlockL("m2", "  }"), unlockL("m1")] },
        { name: "B", lines: same ? [lockL("m1"), lockL("m2", "  synchronized (m2) {"), line("    // do something"), unlockL("m2", "  }"), unlockL("m1")]
          : [lockL("m2"), lockL("m1", "  synchronized (m1) {"), line("    // do something"), unlockL("m1", "  }"), unlockL("m2")] },
      ],
    }),
    verdict: () => `<p><span class="pill good">both finished</span></p><p class="small">Taking the monitors in one global order breaks <b>circular wait</b>, one of the four Coffman conditions.</p>`,
  },
  b: {
    name: "copy() and log() (exercise)",
    hint: "T1 runs copy(): read, then write. T2 runs log(): write, then copy() → read.",
    make: (same) => ({
      shared: {},
      threads: [
        { name: "T1: copy()", lines: [lockL("read"), lockL("write", "  synchronized (write) {"), line("    // copy"), unlockL("write", "  }"), unlockL("read")] },
        { name: "T2: log()", lines: same
          ? [lockL("read", "synchronized (read) {   // fixed order"), lockL("write", "  synchronized (write) {"), line("    // log"), line("    copy();   // read, write again: reentrant"), lockL("read", "    synchronized (read) {"), lockL("write", "      synchronized (write) {"), unlockL("write", "      }"), unlockL("read", "    }"), unlockL("write", "  }"), unlockL("read")]
          : [lockL("write"), line("  // log"), line("  copy();"), lockL("read", "    synchronized (read) {"), lockL("write", "      synchronized (write) {   // reentrant"), unlockL("write", "      }"), unlockL("read", "    }"), unlockL("write")] },
      ],
    }),
    verdict: () => `<p><span class="pill good">both finished</span></p><p class="small">Note T2 enters <b>write</b> twice: Java monitors are reentrant, so that alone never deadlocks.</p>`,
  },
};

const PP_CAS = {
  a: {
    name: "two threads, AtomicLong",
    hint: "Read in both, then let one compareAndSet succeed: the other one fails and tries again.",
    make: () => ({
      shared: { count: 0 },
      threads: ["T1", "T2"].map((name) => ({ name, lines: [
        line("long prev = count.get();", (sh, lo) => { lo.prev = sh.count; }),
        line("updated = count.compareAndSet(prev, prev + 1);", (sh, lo, t) => {
          lo.updated = sh.count === lo.prev;
          if (lo.updated) sh.count = lo.prev + 1; else { t.retries++; lo.retries = t.retries; return 0; }
        }, (sh, lo) => (lo.updated ? `compareAndSet(${lo.prev}, ${lo.prev + 1}) succeeds` : `compareAndSet(${lo.prev}, …) fails — count changed, retry`)),
      ] })),
    }),
    verdict: (sh, ths) => `<p><span class="pill good">count = ${sh.count}</span></p><p class="small">Always right, without a lock: a failed compareAndSet just retries (optimistic locking). ${ths.reduce((a, t) => a + t.retries, 0)} retr${ths.reduce((a, t) => a + t.retries, 0) === 1 ? "y" : "ies"}.</p>`,
  },
};

/* ---------------------------------------------------------------- wait / notify */

// The producer/consumer from the lecture, queue capacity 1, two consumers and one producer.
const PP_WAIT = {
  notify: [
    { q: [], owner: "–", entry: [], wait: [], say: "Queue empty. Nobody in the monitor." },
    { q: [], owner: "–", entry: [], wait: ["C1"], say: "C1 calls take(): queue empty → wait() — releases the monitor, joins the wait set." },
    { q: [], owner: "–", entry: [], wait: ["C1", "C2"], say: "C2 calls take(): empty too → wait()." },
    { q: ["w1"], owner: "P", entry: ["C1"], wait: ["C2"], say: "P put(w1): adds it, notify() wakes one waiting thread — here C1 — into the entry set." },
    { q: ["w1"], owner: "–", entry: ["C1"], wait: ["C2", "P"], say: "P put(w2): queue full → wait()." },
    { q: [], owner: "C1", entry: ["C2"], wait: ["P"], say: "C1 gets the monitor, notify() wakes … C2 (any one may be chosen), takes w1." },
    { q: [], owner: "–", entry: [], wait: ["P", "C2"], say: "C2 finds the queue empty → wait() again. The signal was “swallowed”: P sleeps although there is space now.", bad: true },
  ],
  notifyAll: [
    { q: [], owner: "–", entry: [], wait: [], say: "Same start." },
    { q: [], owner: "–", entry: [], wait: ["C1", "C2"], say: "C1 and C2 wait for work." },
    { q: ["w1"], owner: "P", entry: ["C1", "C2"], wait: [], say: "P put(w1): notifyAll() moves both consumers to the entry set." },
    { q: ["w1"], owner: "–", entry: ["C1", "C2"], wait: ["P"], say: "P put(w2): queue full → wait()." },
    { q: [], owner: "C1", entry: ["C2", "P"], wait: [], say: "C1 takes w1, notifyAll() wakes everyone: C2 and P." },
    { q: [], owner: "–", entry: ["P"], wait: ["C2"], say: "C2's while loop sees an empty queue → wait() again. That's fine …" },
    { q: ["w2"], owner: "P", entry: ["C2"], wait: [], say: "… because P was woken too: it adds w2 and notifyAll() wakes C2, who takes it. Nothing is lost.", good: true },
  ],
};
function ppWaitNotify(root) {
  const { fig, read, w } = ppW(root, "wn");
  const st = { v: "notify" };
  let k = 0;
  const draw = () => {
    const F = PP_WAIT[st.v][k];
    const chips = (xs) => (xs.length ? xs.map((x) => `<span class="pp-chip ${x[0] === "P" ? "prod" : "cons"}">${x}</span>`).join("") : '<span class="small muted">—</span>');
    fig.innerHTML = `<div class="pp-mon">
      <div class="pp-mon-box"><span class="small muted">entry set</span>${chips(F.entry)}</div>
      <div class="pp-mon-box owner"><span class="small muted">in the monitor</span>${F.owner === "–" ? '<span class="small muted">—</span>' : chips([F.owner])}<span class="pp-mon-q">queue: ${F.q.length ? F.q.map((x) => `<span class="pp-box">${x}</span>`).join("") : "[ ]"} <small class="muted">(capacity 1)</small></span></div>
      <div class="pp-mon-box"><span class="small muted">wait set</span>${chips(F.wait)}</div></div>`;
    read.innerHTML = `<p class="small">${F.say}</p>${F.bad ? `<p><span class="pill bad">stuck: with notify() the wrong thread got the signal</span></p>` : F.good ? `<p><span class="pill good">notifyAll(): every waiter re-checks its own condition</span></p>` : ""}<p class="small muted">Step ${k + 1} / ${PP_WAIT[st.v].length}</p>`;
    $('[data-a="prev"]', w).disabled = k === 0;
    $('[data-a="next"]', w).disabled = k === PP_WAIT[st.v].length - 1;
  };
  ppW(root, "wn").on("prev", () => { k--; draw(); });
  ppW(root, "wn").on("next", () => { k++; draw(); });
  lenWire(w, st, () => { k = 0; draw(); });
  draw();
}

/* ---------------------------------------------------------------- Caching and happens-before */

const PP_CACHE = (vol) => [
  { mem: "false", c1: "", c2: "", out: [], say: "working = false in main memory. Thread t starts on CPU 2." },
  { mem: "false", c1: "", c2: "false", out: [], say: "t reads working into its cache and spins in while (!working)." },
  { mem: vol ? "true" : "false", c1: "true", c2: vol ? "true" : "false", out: ["Work!"], say: vol ? "main sets working = true. volatile: written straight to main memory, and every read goes there too." : "main sets working = true — in CPU 1's cache. Nothing forces it to main memory or into CPU 2's cache." },
  { mem: vol ? "true" : "false", c1: "true", c2: vol ? "true" : "false", out: vol ? ["Work!", "Working!"] : ["Work!"], say: vol ? "t sees true: prints “Working!”." : "t still reads its cached false: it keeps spinning.", },
  { mem: "false", c1: "false", c2: vol ? "false" : "false", out: vol ? ["Work!", "Working!", "Stop working", "Stopped"] : ["Work!", "Stop working"], say: vol ? "main sets false; t sees it and prints “Stopped”. The program ends." : "main sets false and ends — t never saw the change. The program may never terminate.", end: true },
];
function ppCaching(root) {
  const { fig, read, w } = ppW(root, "cache");
  const st = { vol: 0 };
  let k = 0;
  const draw = () => {
    const F = PP_CACHE(st.vol)[k];
    const cell = (label, v) => `<div class="pp-cache"><span class="small muted">${label}</span><b class="${v === "true" ? "t" : v === "false" ? "f" : ""}">${v ? `working = ${v}` : "—"}</b></div>`;
    fig.innerHTML = `<div class="pp-caches">${cell("cache of CPU 1 (main)", F.c1)}${cell("cache of CPU 2 (t)", F.c2)}</div><div class="pp-caches one">${cell("main memory", F.mem)}</div>
      <div class="pp-console">${F.out.map((x) => `<div>${x}</div>`).join("") || "&nbsp;"}</div>`;
    read.innerHTML = `<p class="small">${F.say}</p>${F.end ? `<p><span class="pill ${st.vol ? "good" : "bad"}">${st.vol ? "terminates" : "may hang for ever"}</span></p>` : ""}<p class="small muted">Step ${k + 1} / 5</p>`;
    $('[data-a="prev"]', w).disabled = k === 0;
    $('[data-a="next"]', w).disabled = k === 4;
  };
  ppW(root, "cache").on("prev", () => { k--; draw(); });
  ppW(root, "cache").on("next", () => { k++; draw(); });
  lenWire(w, st, () => { k = 0; draw(); });
  draw();
}

// Übung 3: from the statement on line 6, which statements have a happens-before relationship?
const PP_HB_LINES = [
  "prepareWebpage();", "Future<Document> futureTicket =", "    executor.submit(() -> {", "        PersonalData data = getPersonalData();",
  "        synchronized (reservation) {", "            return generateTicketConfirmation(", "                data, reservation);", "        } });",
  "Future<Document> futureSeats =", "    executor.submit(() -> {", "        PersonalData data = getPersonalData();", "        synchronized (reservation) {",
  "            return generateSeatsConfirmation(", "                data, reservation);", "        } });", "updateWebpage();", "Document ticket = futureTicket.get();", "startDownload(ticket);",
];
// [line index in PP_HB_LINES, the slide's line number, has hb, why]
const PP_HB_Q = [
  [0, 1, true, "Yes — it runs before the task is submitted (like statements before Thread.start)."],
  [3, 4, true, "Yes — same thread, earlier in program order."],
  [10, 10, false, "No — it's in the other task, outside any synchronized block: no relation."],
  [12, 12, true, "Yes — synchronized on the same monitor (reservation), entered after the first task left it."],
  [15, 14, false, "No — the main thread hasn't waited for the task yet."],
  [17, 16, true, "Yes — after futureTicket.get(), which waits for the task like Thread.join."],
];
function ppHappensBefore(root) {
  const { fig, read } = ppW(root, "hb");
  const ans = {};
  const draw = () => {
    fig.innerHTML = `<pre class="pp-tcode pp-hb">${PP_HB_LINES.map((src, i) => {
      const q = PP_HB_Q.find((x) => x[0] === i), from = i === 5;
      const a = q && ans[i];
      return `<span class="${from ? "from" : q ? "ask" : ""}">${cHL(src)}${from ? "   ◯ from here" : q ? `   ${a === undefined ? `<button type="button" class="pp-hb-b" data-i="${i}" data-v="1">yes</button><button type="button" class="pp-hb-b" data-i="${i}" data-v="0">no</button>` : `<b class="${a === q[2] ? "ok" : "no"}">${q[2] ? "yes" : "no"}${a === q[2] ? " ✓" : " ✗"}</b>`}` : ""}</span>`;
    }).join("\n")}</pre>`;
    $$("[data-i]", fig).forEach((b) => (b.onclick = () => { ans[b.dataset.i] = b.dataset.v === "1"; draw(); }));
    const given = PP_HB_Q.filter((q) => ans[q[0]] !== undefined);
    read.innerHTML = `<p class="small">Assume the task submitted first runs completely before the other starts.</p>
      ${given.map((q) => `<p class="small"><b>Line ${q[1]}</b>: ${q[3]}</p>`).join("")}
      ${given.length === PP_HB_Q.length ? `<p><span class="pill good">${given.filter((q) => ans[q[0]] === q[2]).length} / ${PP_HB_Q.length} right</span></p>` : ""}`;
  };
  ppW(root, "hb").on("reset", () => { Object.keys(ans).forEach((k) => delete ans[k]); draw(); });
  draw();
}

/* ---------------------------------------------------------------- Streams */

const PP_PERSONS = [[true, 18], [false, 21], [false, 19], [true, 28]];
function ppStream(root) {
  const { fig, read, w } = ppW(root, "stream");
  const st = { par: 0 };
  const draw = () => {
    const p = (xs) => xs.map(([s, a]) => `<span class="pp-box ${s ? "" : "drop"}">${s ? "🎓" : "·"} ${a}</span>`).join("");
    const half = (xs) => { const st2 = xs.filter(([s]) => s).map(([, a]) => a); return { sum: st2.reduce((x, y) => x + y, 0), n: st2.length, ages: st2 }; };
    if (!st.par) {
      const h = half(PP_PERSONS);
      fig.innerHTML = `<div class="pp-pipe">
        <div class="pp-pipe-row start"><span class="pp-pipe-code">${j(".stream()")}</span><span>${p(PP_PERSONS)}</span></div>
        <div class="pp-pipe-row"><span class="pp-pipe-code">${j(".filter(Person::isStudent)")}</span><span>${p(PP_PERSONS.filter(([s]) => s))}</span></div>
        <div class="pp-pipe-row"><span class="pp-pipe-code">${j(".mapToInt(Person::getAge)")}</span><span>${h.ages.map((a) => `<span class="pp-box out">${a}</span>`).join("")}</span></div>
        <div class="pp-pipe-row"><span class="pp-pipe-code">${j(".average().getAsDouble()")}</span><span><b>${(h.sum / h.n).toFixed(1)}</b></span></div></div>`;
    } else {
      const L1 = PP_PERSONS.slice(0, 2), R1 = PP_PERSONS.slice(2), a = half(L1), b = half(R1);
      fig.innerHTML = `<div class="pp-par">
        <div><span class="small muted">thread 1</span>${p(L1)}<span class="pp-par-r">sum ${a.sum}, count ${a.n}</span></div>
        <div><span class="small muted">thread 2</span>${p(R1)}<span class="pp-par-r">sum ${b.sum}, count ${b.n}</span></div></div>
        <div class="pp-pipe-row"><span class="pp-pipe-code">combine</span><span><b>(${a.sum} + ${b.sum}) / (${a.n} + ${b.n}) = ${((a.sum + b.sum) / (a.n + b.n)).toFixed(1)}</b></span></div>`;
    }
    read.innerHTML = st.par ? `<p class="small"><b>parallelStream()</b> splits the data; partial results are joined by the <b>combiner</b> — the third argument of collect, unused in a sequential stream.</p>`
      : `<p class="small">Streams are <b>lazy</b>: nothing runs until the terminal operation (average) asks for values. mapToInt gives an IntStream, which has average().</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- The chapter */

PROPA_CHAPTERS.push({
  n: 7,
  part: "Reussner",
  title: "Java threads",
  next: "Design by Contract",
  headline: "Threads, monitors and the <span class='accent'>memory model</span>",
  intro: "Topics 5.4 and 5.5: creating threads, race conditions and synchronized, wait/notify and deadlocks, caching, reordering and happens-before, then atomics, executors and futures, streams, locks, barriers, fork/join and actors.",
  sections: [
    {
      id: "7.1",
      title: "Threads and race conditions",
      short: "Races",
      about: "lambdas, Runnable vs Thread, start vs run, race conditions, atomicity, synchronized",
      html: () => `
        <div class="card">
          ${ppGist([
            `A <b>lambda</b> ${j("(i, j) -> i + j")} implements a <b>functional interface</b> (one abstract method). A method reference ${j("SimpleCheckers::checkGreaterThanFive")} does the same with a named method.`,
            `Make a thread by implementing ${j("Runnable")} (preferred: no inheritance pollution, the task can run sequentially or be sent over a network) or by extending ${j("Thread")}. Then call ${j("start()")} — once. Calling ${j("run()")} directly runs it in the <b>current</b> thread.`,
            `A <b>race condition</b>: at least two threads use the same data, at least one writes, and the result depends on the interleaving. ${j("i++")} looks atomic but is read, add, write.`,
            `A <b>critical section</b> may only be run by one thread at a time: ${j("synchronized (obj) { … }")}, or a ${j("synchronized")} method (monitor ${j("this")}, or the class object if static). Monitors are <b>reentrant</b>.`,
          ])}
          ${codePair(jcode(`class ComputeRun implements Runnable {
  long min, max;
  ComputeRun(long min, long max) { this.min = min; this.max = max; }
  public void run() { /* parallel task */ }
}
new Thread(new ComputeRun(1, 20)).start();`, { title: "Runnable" }),
            jcode(`Thread t = new Thread(() -> {
  /* parallel task */
});
t.start();     // returns immediately
t.join();      // waits until t has finished`, { title: "With a lambda" }))}
          ${ppSrc(["Java_Basic.pdf", "Übung Java.pdf"])}
        </div>
        <div class="card">
          <h3>Interleave it yourself</h3>
          ${pw("jrace", `${pseg("sc", Object.entries(PP_RACES).map(([k, s]) => [k, s.name]), "a")}${pseg("opt", [[0, "unsynchronized"], [1, "synchronized"]], 0)}<div class="lw-row">${pbtn("auto", "Random order")}${pbtn("reset", "Start again")}</div>`, { wide: true })}
          ${ppFacts([
            ["atomic in Java", "reads and writes of references and of most primitives (32 bit); long and double maybe not; everything declared volatile."],
            ["not atomic", `${j("x = y + 1")}, ${j("i++")}, check-then-act, any sequence of accesses.`],
            ["monitor", "any object (not a primitive). Entering an occupied monitor blocks — uninterruptibly, with no way to test first."],
          ])}
          ${ppTraps([
            "Three threads each doing c++ once can leave c at 1, 2 or 3.",
            "volatile does not make c = c + 1 atomic — it's still a read, then a write.",
            "Synchronise the check and the change together, or the check is worthless.",
          ])}
        </div>`,
      setup: (root) => ppInterleave(root, "jrace", PP_RACES),
      check: [
        { q: "3 threads each run c = c + 1 once (unsynchronized, c starts at 0). Which final values are possible?", opts: ["1, 2 or 3", "only 3", "0 to 3", "only 1"], why: "At worst all read 0 before anyone writes; at best they take turns." },
        { q: `What happens with ${j("t.run()")} instead of ${j("t.start()")}?`, opts: ["The task runs in the current thread; no new thread starts", "The same as start()", "An exception", "The thread starts twice"], why: "Only start() creates the new activity (with VM support)." },
        { q: `A ${j("synchronized")} instance method uses which monitor?`, opts: [j("this"), "the class object", "a new lock per call", "none"], why: "Static synchronized methods use the class object instead." },
        { q: "Why prefer implementing Runnable over extending Thread?", opts: ["The task stays a separate object: reusable sequentially, no inheritance used up", "Runnable is faster", "Thread can't be started", "Only Runnable can use synchronized"], why: "Better modularisation; a Thread can't be serialised and sent, a task can." },
        { q: "The same thread enters a monitor it already holds. What happens?", opts: ["It enters again — monitors are reentrant", "Deadlock", "IllegalMonitorStateException", "It waits for notify()"], why: "Useful for recursion and nested synchronized methods." },
      ],
    },
    {
      id: "7.2",
      title: "wait, notify and deadlocks",
      short: "wait & notify",
      about: "guard conditions, wait/notify/notifyAll, spurious wake-ups, interrupts, Coffman conditions",
      html: () => `
        <div class="card">
          ${ppGist([
            `Busy waiting inside a monitor wastes CPU and blocks everyone else. Instead: ${j("while (!condition) wait();")} — ${j("wait()")} <b>releases the monitor</b> and sleeps in the wait set.`,
            `${j("notify()")} wakes <b>one</b> waiting thread, ${j("notifyAll()")} all; they then compete for the monitor again. Signals are <b>not stored</b>: nobody waiting, nothing happens.`,
            `Always ${j("wait()")} in a <b>loop</b> that re-checks the condition (spurious wake-ups, wrong signals). Prefer ${j("notifyAll()")}. Call both only while holding the monitor, or you get ${j("IllegalMonitorStateException")}.`,
            `<b>Deadlock</b> needs all four Coffman conditions: mutual exclusion, hold and wait, no preemption, circular wait. With synchronized, the first and third always hold — so avoid hold-and-wait or circular wait.`,
          ])}
          ${codePair(jcode(`synchronized void put(Work w) throws InterruptedException {
  while (queue.isFull()) { this.wait(); }
  queue.add(w);
  this.notifyAll();
}
synchronized Work take() throws InterruptedException {
  while (queue.isEmpty()) { this.wait(); }
  this.notifyAll();
  return queue.remove();
}`, { title: "Producer / consumer, repaired" }),
            jcode(`synchronized (monitor) {
  while (!dataAvailable) {
    try {
      monitor.wait();
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      return;
    }
  }
  // do something
}`, { title: "Handling the interrupt" }))}
          ${ppSrc(["Java_Basic.pdf", "Übung Java.pdf"])}
        </div>
        <div class="card">
          <h3>notify() can lose a signal</h3>
          ${pw("wn", `${pseg("v", [["notify", "notify()"], ["notifyAll", "notifyAll()"]], "notify")}<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`, { wide: true })}
        </div>
        <div class="card">
          <h3>Deadlock</h3>
          ${pw("dl", `${pseg("sc", Object.entries(PP_LOCKS).map(([k, s]) => [k, s.name]), "a")}${pseg("opt", [[0, "as written"], [1, "same lock order"]], 0)}<div class="lw-row">${pbtn("auto", "Random order")}${pbtn("reset", "Start again")}</div>`, { wide: true })}
          ${ppFacts([
            ["interrupt", `${j("t.interrupt()")}: if t waits, ${j("wait()")} throws ${j("InterruptedException")}; otherwise it's remembered for the next wait. Use it to end threads cleanly — and don't swallow it with an empty catch.`],
            ["join", `${j("t.join()")} waits until t has finished (and can be interrupted too).`],
          ])}
          ${ppTraps([
            `${j("if (!cond) wait();")} is wrong — use ${j("while")}.`,
            `${j("notify()")} without changing the state, or ${j("wait()")} without a condition, are bugs.`,
            "Don't use Thread objects as monitors: thread.wait() pauses the current thread, not that one.",
          ])}
        </div>`,
      setup: (root) => { ppWaitNotify(root); ppInterleave(root, "dl", PP_LOCKS); },
      check: [
        { q: "What does wait() do with the monitor?", opts: ["Releases it while waiting (other monitors stay held)", "Keeps it", "Releases all monitors the thread holds", "Destroys it"], why: "That's why others can enter and change the condition." },
        { q: "Why must wait() be in a while loop?", opts: ["The thread may wake without its condition being true (spurious wake-up, other signal)", "Java requires a loop syntactically", "To call notify again", "For speed"], why: "Re-check after waking; only leave when the condition holds." },
        { q: "With synchronized blocks, which Coffman conditions always hold?", opts: ["Mutual exclusion and no preemption", "Hold and wait and circular wait", "All four", "None"], why: "Hold-and-wait and circular wait depend on how you nest them." },
        { q: "Thread A: sync(m1){sync(m2){…}}, thread B: sync(m2){sync(m1){…}}. Simplest fix?", opts: ["Acquire m1 and m2 in the same order everywhere", "Use notify()", "Make m1 volatile", "Add Thread.sleep"], why: "A global lock order removes circular wait." },
        { q: "notify() is called while no thread waits. Then a thread calls wait(). What happens?", opts: ["It waits — the earlier signal was not stored", "It returns at once", "Exception", "Deadlock is detected"], why: "Signals only reach threads already in the wait set." },
      ],
    },
    {
      id: "7.3",
      title: "Memory consistency and happens-before",
      short: "Happens-before",
      about: "caching, reordering, happens-before rules, volatile",
      html: () => `
        <div class="card">
          ${ppGist([
            `Without synchronisation a thread may see an <b>old value</b>: caches aren't synced, and the compiler/CPU may <b>reorder</b> statements if the thread itself can't tell.`,
            `If s₁ <b>happens-before</b> s₂, every write of s₁ is visible to s₂. It is transitive. No happens-before relation, no guarantee.`,
            `Sources: <b>program order</b> in one thread; ${j("Thread.start")} (everything before it → the new thread); ${j("Thread.join")} (the thread → after join); ${j("synchronized")} on the same monitor (a block → a later block); ${j("volatile")} (a write → every later read).`,
            `${j("volatile")}: no caching, no reordering around it, single reads/writes atomic — but no mutual exclusion.`,
          ])}
          ${jcode(`public class Main {
  static boolean working = false;        // add volatile to fix
  public static void main(String[] args) throws InterruptedException {
    Thread t = new Thread(() -> {
      while (!working) {}
      System.out.println("Working!");
      while (working) { /* do something */ }
      System.out.println("Stopped");
    });
    t.start();
    Thread.sleep(1000); System.out.println("Work!"); working = true;
    Thread.sleep(1000); System.out.println("Stop working"); working = false;
  }
}`)}
          ${ppSrc(["Java_Basic.pdf", "Übung Parallelprogrammierung Design by Contract.pdf"])}
        </div>
        <div class="card">
          <h3>A cached flag</h3>
          ${pw("cache", `${pseg("vol", [[0, "boolean working"], [1, "volatile boolean working"]], 0)}<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`, { wide: true })}
        </div>
        <div class="card">
          <h3>Reordering</h3>
          ${codePair(jcode(`// thread 1
state.a = 1;
state.b = 1;
state.c = state.a + 1;
// thread 2
if (state.c == 2 && state.b == 0)
  System.out.println("Wrong");`, { title: "Can print “Wrong”" }),
            jcode(`// thread 1 may run it as:
state.a = 1;
state.c = state.a + 1;
state.b = 1;
// fix: volatile int c — then the writes before
// writing c are visible after reading c`, { title: "Same result for thread 1 alone" }))}
        </div>
        <div class="card">
          <h3>Exercise: which statements happen-before?</h3>
          <p>From the statement marked ◯ (line 6), answer for each marked line.</p>
          ${pw("hb", pbtn("reset", "Start again"), { wide: true })}
          ${ppTraps([
            "Happens-before is about <b>visibility</b>, not about what actually runs first.",
            "Statements before a volatile write can still be reordered among themselves.",
            "Future.get() waits for the task, so it works like join.",
          ])}
        </div>`,
      setup: (root) => { ppCaching(root); ppHappensBefore(root); },
      check: [
        { q: "t1: flag = 1; t2: print(flag); both just started. What can t2 print?", opts: ["0 or 1", "always 1", "always 0", "nothing"], why: "No happens-before between them: t2 may run first or see a stale value." },
        { q: "Which creates a happens-before from thread A's writes to thread B's reads?", opts: ["A writes, then releases monitor m; B later synchronizes on m", "Both use synchronized on different objects", "B calls Thread.sleep", "A calls System.gc()"], why: "Only the same monitor connects them." },
        { q: "What does volatile NOT give you?", opts: ["Mutual exclusion", "Visibility of writes", "No reordering around it", "Atomic single reads/writes"], why: "Two threads can still interleave a read-then-write." },
        { q: "Everything thread t did is visible to main after …", opts: ["t.join() returns", "t.start()", "t.interrupt()", "Thread.yield()"], why: "join creates the happens-before from the finished thread." },
        { q: "Why can a compiler reorder state.b = 1 and state.c = state.a + 1?", opts: ["It doesn't change the result for that thread alone", "It's a bug in Java", "Because c is final", "Only on single-core machines"], why: "Reorderings keep intra-thread semantics; other threads aren't considered without happens-before." },
      ],
    },
    {
      id: "7.4",
      title: "Advanced concurrency in Java",
      short: "Advanced",
      about: "atomics and CAS, executors, Callable and Future, streams, locks, barriers, fork/join, actors",
      html: () => `
        <div class="card">
          ${ppGist([
            `<b>Atomic types</b> (${j("AtomicInteger")}, ${j("AtomicLong")}): ${j("incrementAndGet()")}, ${j("compareAndSet(old, new)")} — thread-safe without locks; loops of compare-and-set are <b>non-blocking algorithms</b> (optimistic locking).`,
            `<b>Executors</b> separate tasks from threads: ${j("Executors.newFixedThreadPool(n)")}, ${j("newCachedThreadPool()")}, ${j("newSingleThreadExecutor()")}. ${j("execute(Runnable)")}; don't forget ${j("shutdown()")}.`,
            `A ${j("Callable<T>")} returns a value from ${j("call()")}; ${j("submit")} gives a ${j("Future<T>")} whose ${j("get()")} <b>blocks</b> until the result is there (or times out).`,
            `<b>Streams</b>: ${j("filter")}, ${j("map")}, ${j("reduce")}, ${j("collect")} … lazy, no extra memory; ${j("parallelStream()")} runs some operations in parallel.`,
          ])}
          ${codePair(jcode(`ExecutorService pool = Executors.newFixedThreadPool(4);
List<Future<Integer>> futures = new ArrayList<>();
for (int i = 0; i < 10; i++) {
  final int v = i;
  futures.add(pool.submit(() -> v * v));   // a Callable
}
for (Future<Integer> f : futures)
  System.out.println(f.get());             // blocks
pool.shutdown();`, { title: "Executor, Callable, Future" }),
            jcode(`public class AtomicCounter {
  private AtomicLong count = new AtomicLong(0);
  public void increment() {
    boolean updated = false;
    while (!updated) {
      long prev = count.get();
      updated = count.compareAndSet(prev, prev + 1);
    }
  }
}`, { title: "A non-blocking counter" }))}
          ${ppSrc(["Java_Advanced.pdf", "Übung Parallelprogrammierung Design by Contract.pdf"])}
        </div>
        <div class="card">
          <h3>Compare-and-set</h3>
          ${pw("cas", `<div class="lw-row">${pbtn("auto", "Random order")}${pbtn("reset", "Start again")}</div>`, { wide: true })}
        </div>
        <div class="card">
          <h3>A stream, sequential and parallel</h3>
          ${jcode(`double average = personsInAuditorium.stream()     // or .parallelStream()
    .filter(Person::isStudent)
    .mapToInt(Person::getAge)
    .average()
    .getAsDouble();`)}
          ${pw("stream", pseg("par", [[0, "stream()"], [1, "parallelStream()"]], 0), { wide: true })}
          ${ppAside("collect(supplier, accumulator, combiner), and why “? super T”", `
            <p>${j("collect")} makes a result container (supplier), adds every element (accumulator), and — only in parallel — merges partial containers (combiner). The container must be <b>mutable</b>: with ${j("() -> 0")} and ${j("currentSum += …")} the result stays 0, since Integer is immutable.</p>
            <p><b>PECS</b>: producer <b>extends</b>, consumer <b>super</b>. The accumulator consumes T, so any ${j("BiConsumer<R, ? super T>")} will do (Liskov: parameters may be more general).</p>`)}
        </div>
        <div class="card">
          <h3>More tools</h3>
          ${ppFacts([
            [j("ReentrantLock"), `${j("lock()")} … ${j("unlock()")} in a ${j("finally")}; ${j("tryLock()")} doesn't block — taking all locks or none avoids hold-and-wait.`],
            [j("Semaphore(n, fair)"), `n permits: ${j("acquire()")} blocks when none are left, ${j("release()")} gives one back.`],
            [j("CyclicBarrier(n)"), `${j("await()")} blocks until n threads arrived; reusable.`],
            [j("CountDownLatch(n)"), `${j("await()")} blocks until ${j("countDown()")} was called n times; not reusable.`],
            ["Fork/Join", `divide and conquer: a ${j("RecursiveTask<T>")}'s ${j("compute()")} splits above a threshold, forks the parts, joins and combines; run with ${j("new ForkJoinPool().invoke(task)")}.`],
            [j("CompletableFuture"), `${j("supplyAsync(…)")}, then ${j("thenApply(…)")} chains work without blocking.`],
            [j("BlockingQueue"), `${j("put")} blocks when full, ${j("take")} when empty — producer/consumer ready-made. Also ${j("ConcurrentHashMap")}.`],
            ["actors (Akka)", "isolated state, a mailbox processed one message at a time, only asynchronous messages (tell: fire-and-forget, ask: returns a Future). A parent supervises its children (“let it crash”). Unlike MPI: dynamic number of actors, node-transparent."],
          ])}
          ${ppTraps([
            "Parallelism only pays off above some problem size — tiny tasks drown in overhead.",
            "Never rely on timing (sleep); use join, signals or barriers.",
            "Unlock in finally, or an exception leaves the lock held for ever.",
          ])}
        </div>`,
      setup: (root) => { ppInterleave(root, "cas", PP_CAS); ppStream(root); },
      check: [
        { q: "What does compareAndSet(5, 6) do if the value is 7?", opts: ["Nothing, and returns false", "Sets it to 6", "Blocks until it is 5", "Throws"], why: "It only replaces the expected old value; the caller then retries." },
        { q: "What does Future.get() do if the task isn't finished?", opts: ["Blocks until the result is available", "Returns null", "Throws at once", "Starts the task"], why: "get(timeout, unit) can limit the wait (TimeoutException)." },
        { q: "Difference between CyclicBarrier and CountDownLatch?", opts: ["The barrier can be reused; the latch can't", "The latch needs n threads to call await", "They're the same", "A latch is a lock"], why: "Once the latch's count is 0, await() returns immediately for ever." },
        { q: "In collect(supplier, accumulator, combiner), when is the combiner used?", opts: ["Only for parallel streams, to merge partial results", "Always", "Never", "For sorting"], why: "A sequential collect only needs supplier and accumulator." },
        { q: "How does an actor process its messages?", opts: ["One at a time, in arrival order, from its mailbox", "All at once in parallel", "Only with ask", "By sharing memory with the sender"], why: "n messages in parallel need n actors." },
      ],
    },
  ],
});
