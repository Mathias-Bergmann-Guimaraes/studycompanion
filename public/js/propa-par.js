// ProPa Reussner chapters 5 and 6: Parallel_Fundamentals (topic 5.1), C_Repetition (5.2), MPI (5.3)
// and the MPI exercise (Übung 1). The drawings: memory models and Flynn's taxonomy, the parallel
// sum and odd-even sort step by step, Amdahl's law, C pointers in memory, a C declaration decoder,
// a send/receive simulator that finds deadlocks, the collective operations, and MapReduce.

/* ================================================================ Chapter 5 */

/* ---------------------------------------------------------------- 5.1 Memory and time */

function ppMemModels(root) {
  const { fig, read, w } = ppW(root, "mem");
  const st = { m: "shared", cores: 2 };
  const draw = () => {
    const P = [0, 1, 2, 3];
    const box = (x, y, wd, h, cls, txt) => `<rect x="${x}" y="${y}" width="${wd}" height="${h}" rx="8" class="${cls}"/><text x="${x + wd / 2}" y="${y + h / 2 + 5}" text-anchor="middle">${txt}</text>`;
    let svg;
    if (st.m === "shared") {
      svg = P.map((i) => box(20 + i * 120, 20, 90, 40, "pp-cpu", `CPU ${i}`) + `<line x1="${65 + i * 120}" y1="60" x2="${65 + i * 120}" y2="110" class="pp-bus"/>`).join("") +
        box(20, 110, 450, 50, "pp-ram", "one shared memory: every CPU reads and writes every cell") +
        `<text x="245" y="190" text-anchor="middle" class="cap">threads communicate by changing shared cells — e.g. a multi-core processor</text>`;
    } else {
      svg = P.map((i) => box(20 + i * 120, 20, 90, 40, "pp-cpu", `CPU ${i}`) + box(20 + i * 120, 70, 90, 34, "pp-ram", "own memory")).join("") +
        `<line x1="65" y1="125" x2="425" y2="125" class="pp-net"/>` + P.map((i) => `<line x1="${65 + i * 120}" y1="104" x2="${65 + i * 120}" y2="125" class="pp-net"/>`).join("") +
        `<text x="245" y="150" text-anchor="middle" class="cap">network: processes send messages (message passing)</text>` +
        `<rect x="${ppMemModels.t % 2 ? 140 : 190}" y="117" width="34" height="16" rx="4" class="pp-msg"/>` +
        `<text x="245" y="190" text-anchor="middle" class="cap">nobody can read another CPU's memory — e.g. a computer cluster with MPI</text>`;
    }
    const T = 8, lane = (k) => Array.from({ length: T }, (_, t) => {
      const runs = st.cores === 2 ? true : t % 2 === k;
      return `<span class="pp-slot ${runs ? "t" + k : ""}"></span>`;
    }).join("");
    fig.innerHTML = `<svg class="lw-svg pp-mem" viewBox="0 0 490 200" role="img" aria-label="${st.m} memory">${svg}</svg>
      <div class="pp-timeline"><span class="small muted">thread A</span><span class="pp-slots">${lane(0)}</span><span class="small muted">thread B</span><span class="pp-slots">${lane(1)}</span><span></span><span class="small muted pp-time">time →</span></div>`;
    read.innerHTML = `<p class="small">${st.m === "shared" ? "<b>Shared memory</b>: synchronisation (locks, monitors) is needed when two threads touch the same cell. Java threads work this way."
      : "<b>Distributed memory</b>: all data has to be sent explicitly. MPI works this way."}</p>
      <p class="small">${st.cores === 2 ? "<b>Parallelism</b>: both threads run at the same time." : "<b>Concurrency</b> on one core: both make progress, taking turns (time-slicing)."}</p>`;
  };
  ppMemModels.t = 0;
  lenWire(w, st, draw);
  draw();
}

const PP_FLYNN = {
  SISD: ["one instruction stream on one data stream", "the classic von Neumann computer", 1, 1],
  SIMD: ["one instruction applied to many data items at once", "vector processors, GPUs; MPI is “single program, multiple data”", 1, 4],
  MISD: ["several instructions on the same data", "redundant (fault-tolerant) systems; pipelines (controversial)", 4, 1],
  MIMD: ["different processors run different instructions on different data", "today's multi-core processors", 4, 4],
};
function ppFlynn(root) {
  const { fig, read, w } = ppW(root, "flynn");
  const st = { f: "SIMD" };
  const draw = () => {
    const [what, ex, ni, nd] = PP_FLYNN[st.f];
    const rows = Array.from({ length: Math.max(ni, nd) }, (_, k) => `<div class="pp-fl-row"><span class="pp-fl-i ${k < ni ? "" : "dup"}">${k < ni ? `instr ${ni > 1 ? k + 1 : ""}` : "same instr"}</span><span class="pp-fl-arrow">→</span><span class="pp-fl-d ${k < nd ? "" : "dup"}">${k < nd ? `data ${nd > 1 ? k + 1 : ""}` : "same data"}</span></div>`).join("");
    fig.innerHTML = `<div class="pp-flynn">${["SISD", "SIMD", "MISD", "MIMD"].map((k) => `<button type="button" class="pp-fl-cell ${k === st.f ? "on" : ""}" data-f="${k}"><b>${k}</b><span class="small muted">${k[0] === "S" ? "single" : "multiple"} instruction · ${k[2] === "S" ? "single" : "multiple"} data</span></button>`).join("")}</div>
      <div class="pp-fl-rows">${rows}</div>`;
    $$("[data-f]", fig).forEach((b) => (b.onclick = () => { st.f = b.dataset.f; draw(); }));
    read.innerHTML = `<p><b>${st.f}</b>: ${what}.</p><p class="small muted">Example: ${ex}.</p>`;
  };
  draw();
}

/* ---------------------------------------------------------------- 5.2 Parallel algorithms */

function ppParSum(root) {
  const { fig, read, w } = ppW(root, "psum");
  let h = 0;
  const a0 = [4, 2, 5, 7, 3, 1, 6, 8];
  const draw = () => {
    const levels = [a0];
    for (let k = 1; k <= 3; k++) { const p = levels[k - 1]; levels.push(Array.from({ length: p.length / 2 }, (_, i) => p[2 * i] + p[2 * i + 1])); }
    fig.innerHTML = `<div class="pp-sum">${levels.slice(0, h + 1).map((l, k) => `
      <div class="pp-sum-row"><span class="pp-sum-h">${k === 0 ? "a[]" : `h = ${k}`}</span>
        <span class="pp-sum-cells" style="--n:${l.length}">${l.map((v, i) => `<span class="pp-box ${k === h && k ? "out" : ""}">${v}${k ? `<small>P${i + 1}</small>` : ""}</span>`).join("")}</span></div>`).join("")}</div>
      ${code(`for h := 1 to log2(n) do\n  for i := 0 to n / 2^h - 1 pardo\n    a[i] := a[2i] + a[2i + 1]`, { lang: "c" })}`;
    read.innerHTML = `<div class="lw-vals"><span>parallel steps</span><b>${h}</b><span>processors busy</span><b>${h ? 8 / 2 ** h : "–"}</b><span>sequential needs</span><b>7 additions</b></div>
      <p class="small">${h === 3 ? "Done: <b>36</b> after log₂ 8 = 3 steps, so O(log n) instead of O(n)." : "Each step adds neighbours in pairs, all pairs at once."}</p>`;
    $('[data-a="prev"]', w).disabled = h === 0;
    $('[data-a="next"]', w).disabled = h === 3;
  };
  ppW(root, "psum").on("prev", () => { h--; draw(); });
  ppW(root, "psum").on("next", () => { h++; draw(); });
  draw();
}

function ppOddEven(root) {
  const { fig, read, w } = ppW(root, "oes");
  let xs, steps, k;
  const reset = (arr) => {
    xs = arr;
    steps = [{ a: [...xs], pairs: [], swaps: [] }];
    let a = [...xs];
    for (let r = 0; r < xs.length; r++) {
      const start = r % 2, pairs = [], swaps = [];
      for (let i = start; i + 1 < a.length; i += 2) { pairs.push(i); if (a[i] > a[i + 1]) { [a[i], a[i + 1]] = [a[i + 1], a[i]]; swaps.push(i); } }
      steps.push({ a: [...a], pairs, swaps, odd: start === 1 });
    }
    k = 0;
  };
  reset([7, 3, 6, 5, 8, 1, 4, 2]);
  const draw = () => {
    const s = steps[k];
    fig.innerHTML = `<div class="pp-oes">${s.a.map((v, i) => {
      const inPair = s.pairs.some((p) => p === i || p + 1 === i), sw = s.swaps.some((p) => p === i || p + 1 === i);
      return `<span class="pp-box ${sw ? "out" : inPair ? "second" : ""}">${v}</span>`;
    }).join("")}</div>
      <div class="pp-oes pp-oes-pairs">${s.a.map((_, i) => `<span>${s.pairs.includes(i) ? "└─┘" : ""}</span>`).join("")}</div>`;
    const sorted = s.a.every((v, i) => !i || s.a[i - 1] <= v);
    read.innerHTML = `<p class="small">${k === 0 ? "Start. In each phase all marked pairs are compared at the same time, one processor per pair." : `Phase ${k} (${s.odd ? "odd: pairs (1,2), (3,4) …" : "even: pairs (0,1), (2,3) …"}): ${s.swaps.length} swap${s.swaps.length === 1 ? "" : "s"}.`}</p>
      <div class="lw-vals"><span>parallel phases</span><b>${k}</b><span>each phase</span><b>O(1)</b><span>sequential bubble sort</span><b>28 comparisons</b></div>
      ${sorted && k ? `<p><span class="pill good">sorted — n phases, so O(n) with n processors</span></p>` : ""}`;
    $('[data-a="prev"]', w).disabled = k === 0;
    $('[data-a="next"]', w).disabled = k === steps.length - 1;
  };
  ppW(root, "oes").on("prev", () => { k--; draw(); });
  ppW(root, "oes").on("next", () => { k++; draw(); });
  ppW(root, "oes").on("new", () => { reset(shuffle([1, 2, 3, 4, 5, 6, 7, 8])); draw(); });
  draw();
}

const amdahl = (p, n) => 1 / ((1 - p) + p / n);
function ppAmdahl(root) {
  const { fig, read, w } = ppW(root, "amdahl");
  const st = { p: 90, n: 4 };
  const draw = () => {
    const p = st.p / 100, n = 2 ** st.n;
    lenOut(w, "p", `${st.p} %`);
    lenOut(w, "n", n);
    const W = 460, H = 200, maxN = 10, lim = p < 1 ? 1 / (1 - p) : Infinity, top = Math.min(Math.max(lim * 1.1, 4), 60);
    const X = (k) => 40 + (k / maxN) * (W - 60), Y = (s) => H - 30 - ((s - 1) / (top - 1)) * (H - 50);
    const pts = Array.from({ length: 101 }, (_, i) => { const k = (i / 100) * maxN; return `${X(k).toFixed(1)},${Y(Math.min(amdahl(p, 2 ** k), top)).toFixed(1)}`; }).join(" ");
    const ticks = [0, 2, 4, 6, 8, 10].map((k) => `<line x1="${X(k)}" y1="${H - 30}" x2="${X(k)}" y2="${H - 26}" class="tick"/><text x="${X(k)}" y="${H - 12}" text-anchor="middle" class="tick-t">${2 ** k}</text>`).join("");
    const s = amdahl(p, n);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Amdahl speedup curve">
      <line x1="40" y1="${H - 30}" x2="${W - 20}" y2="${H - 30}" class="tick"/><line x1="40" y1="20" x2="40" y2="${H - 30}" class="tick"/>${ticks}
      <text x="${W - 20}" y="${H - 34}" text-anchor="end" class="ax-t">processors n (log scale)</text><text x="46" y="28" class="ax-t">speedup S(n)</text>
      ${isFinite(lim) && lim < top ? `<line x1="40" y1="${Y(lim)}" x2="${W - 20}" y2="${Y(lim)}" class="guide"/><text x="${W - 22}" y="${Y(lim) - 5}" text-anchor="end" class="tick-t">limit 1 / (1 − p) = ${lim.toFixed(1)}</text>` : ""}
      <polyline points="${pts}" class="curve" style="color:var(--accent)"/>
      <circle cx="${X(st.n)}" cy="${Y(Math.min(s, top))}" r="6" class="pt" style="color:var(--accent)"/></svg>`;
    read.innerHTML = `${F(`<i class="mv">S</i>(<i class="mv">n</i>) = ${frac("1", `(1 − <i class="mv">p</i>) + ${frac("<i class='mv'>p</i>", "<i class='mv'>n</i>")}`)} = <b>${s.toFixed(2)}</b>`)}
      <p class="small">With ${st.p} % parallel, even infinitely many processors give at most <b>${isFinite(lim) ? lim.toFixed(1) + "×" : "∞"}</b>: the serial ${100 - st.p} % limits it.</p>`;
  };
  lenWire(w, st, draw);
  ppW(root, "amdahl").on("ex", () => { st.p = 86; st.n = 2; $("input[data-k=p]", w).value = 86; $("input[data-k=n]", w).value = 2; draw(); });
  draw();
}

/* ================================================================ Chapter 6 */

/* ---------------------------------------------------------------- 6.1 Pointers */

// The exercise's memory: int a[] = {1, 3, 5}; int *b = a; int *c[] = {a, b}; (4-byte ints, 8-byte pointers)
const PP_MEM = [
  { name: "a", cells: [[100, "1", "a[0]"], [104, "3", "a[1]"], [108, "5", "a[2]"]], ty: "int[3]" },
  { name: "b", cells: [[200, "→100", "b"]], ty: "int *" },
  { name: "c", cells: [[300, "→100", "c[0]"], [308, "→100", "c[1]"]], ty: "int *[2]" },
];
const PP_PTR_EX = {
  pingo: { src: "*(*(c + 1) + 2) + 3", steps: [
    ["c", "300", [300], "An array name decays to the address of its first element: &c[0]."],
    ["c + 1", "308", [308], "+1 on an int* pointer moves by sizeof(int*) = 8 bytes, to c[1]."],
    ["*(c + 1)", "100", [308, 100], "Dereference: c[1] holds the address 100, i.e. it points to a[0] (it is b)."],
    ["*(c + 1) + 2", "108", [108], "+2 on an int* moves by 2 · sizeof(int) = 8 bytes, to a[2]."],
    ["*(*(c + 1) + 2)", "5", [108], "Dereference: the int at 108 is 5."],
    ["*(*(c + 1) + 2) + 3", "8", [], "Plain integer addition: 5 + 3."],
  ] },
  sub: { src: "b[1]", steps: [
    ["b", "100", [200, 100], "b holds the address of a[0]."],
    ["b[1]  ≡  *(b + 1)", "3", [104], "Subscripting a pointer is pointer arithmetic plus dereference."],
  ] },
  prec: { src: "*a + 1", steps: [
    ["a", "100", [100], "The array decays to &a[0]."],
    ["*a", "1", [100], "* binds tighter than +, so this is a[0] …"],
    ["*a + 1", "2", [], "… plus 1. Not *(a + 1), which would be 3."],
  ] },
  two: { src: "c[0][2]", steps: [
    ["c[0]", "100", [300], "The first pointer in c: the address of a[0]."],
    ["c[0][2]  ≡  *(c[0] + 2)", "5", [108], "Two subscripts: into c, then into the int array it points to."],
  ] },
  addr: { src: "&a[1]", steps: [
    ["a[1]", "3", [104], "The element itself …"],
    ["&a[1]", "104", [104], "… and & gives its address, the same as a + 1."],
  ] },
};
function ppPointers(root) {
  const { fig, read, w } = ppW(root, "ptr");
  const st = { ex: "pingo", k: 0 };
  const draw = () => {
    const E = PP_PTR_EX[st.ex];
    const [expr, val, hl, why] = E.steps[st.k];
    fig.innerHTML = `${ccode(`int a[] = { 1, 3, 5 };\nint *b = a;\nint *c[] = { a, b };\nprintf("%d\\n", ${E.src});`)}
      <div class="pp-memgrid">${PP_MEM.map((v) => `<div class="pp-memvar"><span class="pp-memname">${v.name} <small class="muted">${v.ty}</small></span>${v.cells.map(([ad, x, lbl]) =>
        `<span class="pp-cell ${hl.includes(ad) ? "on" : ""}"><small>${ad}</small><b>${x}</b><em>${lbl}</em></span>`).join("")}</div>`).join("")}</div>`;
    read.innerHTML = `<p>${cq(expr)} = <b class="pp-val">${val}</b></p><p class="small">${why}</p><p class="small muted">Step ${st.k + 1} / ${E.steps.length}</p>`;
    $('[data-a="prev"]', w).disabled = st.k === 0;
    $('[data-a="next"]', w).disabled = st.k === E.steps.length - 1;
  };
  ppW(root, "ptr").on("prev", () => { st.k--; draw(); });
  ppW(root, "ptr").on("next", () => { st.k++; draw(); });
  lenWire($(".pp-ptr-ex", w), st, () => { st.k = 0; draw(); });
  draw();
}

/* ---------------------------------------------------------------- 6.2 Declarations */

// van der Linden's decoder ring: start at the identifier, go right for [] and (), then left for *,
// const and volatile, step out of parentheses, and finish with the type.
const PP_TYPE_WORDS = new Set("void char short int long float double signed unsigned struct union enum const volatile static extern register".split(" "));
function cdecl(src) {
  const toks = (src.replace(/;\s*$/, "").match(/[A-Za-z_]\w*|\d+|\*|\(|\)|\[|\]|,|\S/g) || []);
  const idx = toks.findIndex((t, i) => /^[A-Za-z_]/.test(t) && !PP_TYPE_WORDS.has(t) && !(toks[i - 1] === "struct"));
  if (idx < 0) throw new Error("no name found");
  const steps = [{ hl: [idx], say: `${toks[idx]} is` }];
  let r = idx + 1, l = idx - 1;
  while (true) {
    if (toks[r] === "[") {
      let e = r; while (e < toks.length && toks[e] !== "]") e++;
      const size = toks.slice(r + 1, e).join("");
      steps.push({ hl: range(r, e), say: size ? `array[${size}] of` : "array of" }); r = e + 1; continue;
    }
    if (toks[r] === "(") {
      let depth = 0, e = r;
      for (; e < toks.length; e++) { if (toks[e] === "(") depth++; if (toks[e] === ")" && --depth === 0) break; }
      const params = toks.slice(r + 1, e).join(" ").replace(/ \* /g, " *").replace(/\* /g, "*");
      steps.push({ hl: range(r, e), say: `function${params ? ` taking (${params})` : ""} returning` }); r = e + 1; continue;
    }
    if (toks[l] === "(") { steps.push({ hl: [l, r], say: "" , paren: true }); l--; r++; continue; }
    if (toks[l] === "*" || ((toks[l] === "const" || toks[l] === "volatile") && toks.slice(0, l).some((t) => t === "*"))) {
      const t = toks[l];
      steps.push({ hl: [l], say: t === "*" ? "pointer to" : t === "const" ? "read-only" : "volatile" }); l--; continue;
    }
    break;
  }
  const rest = toks.slice(0, l + 1).map((t) => (t === "const" ? "read-only" : t));
  if (rest.length) steps.push({ hl: range(0, l), say: rest.join(" ") });
  return { toks, steps };
}
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const cdeclText = (steps) => steps.map((s) => s.say).filter(Boolean).join(" ").replace(/\s+/g, " ").replace(/ (pointer|function|array|read-only|volatile)/g, (m, x) => m).trim();

function ppDecl(root) {
  const { fig, read, w } = ppW(root, "decl");
  const input = $(".pp-decl-in", w);
  let res = null, k = 0, err = "";
  const start = () => {
    err = "";
    try { res = cdecl(input.value); k = res.steps.length - 1; } catch (e) { res = null; err = e.message; }
    draw();
  };
  const draw = () => {
    if (!res) { fig.innerHTML = `<p class="pp-bad-note">Can't read that: ${ppEsc(err)}.</p>`; read.innerHTML = ""; return; }
    const hl = new Set(res.steps.slice(0, k + 1).flatMap((s) => s.hl)), now = new Set(res.steps[k].hl);
    fig.innerHTML = `<div class="pp-decl">${res.toks.map((t, i) => `<span class="pp-dtok ${now.has(i) ? "now" : hl.has(i) ? "done" : ""}">${ppEsc(t)}</span>`).join("")}</div>
      <ol class="pp-decl-steps">${res.steps.slice(0, k + 1).map((s, i) => `<li class="${i === k ? "on" : ""}">${s.paren ? "<span class='muted'>step out of the parentheses</span>" : `“${ppEsc(s.say)}”`}</li>`).join("")}</ol>`;
    read.innerHTML = `<p class="pp-decl-say">${ppEsc(cdeclText(res.steps.slice(0, k + 1)))}${k === res.steps.length - 1 ? "." : " …"}</p>
      <p class="small muted">Right first ([] and ()), then left (*, const, volatile); parentheses group. Step ${k + 1} / ${res.steps.length}</p>`;
    $('[data-a="prev"]', w).disabled = k === 0;
    $('[data-a="next"]', w).disabled = k === res.steps.length - 1;
  };
  $$("[data-decl]", w).forEach((b) => (b.onclick = () => { input.value = b.dataset.decl; start(); k = 0; draw(); }));
  input.onkeydown = (e) => { if (e.key === "Enter") { start(); } };
  ppW(root, "decl").on("go", start);
  ppW(root, "decl").on("prev", () => { k--; draw(); });
  ppW(root, "decl").on("next", () => { k++; draw(); });
  start(); k = 0; draw();
}

/* ---------------------------------------------------------------- 6.3 Send and receive */

// Each process runs its operations in order. send: standard mode with a buffer (returns at once);
// ssend: synchronous (waits until the matching receive is posted); recv: waits for a matching message.
const PP_MPI_SCEN = {
  ok: { name: "0 sends, 1 receives", src: `if (myrank == 0) {\n  strcpy(msg, "Hello student!");\n  MPI_Send(msg, strlen(msg)+1, MPI_CHAR, 1, tag, MPI_COMM_WORLD);\n} else {\n  MPI_Recv(msg, 20, MPI_CHAR, 0, tag, MPI_COMM_WORLD, &status);\n}`, np: 2, prog: (r) => (r === 0 ? [["send", 1]] : [["recv", 0]]) },
  np3: { name: "the same with -np 3", src: `// mpirun -np 3 a.out: every rank but 0 takes the else branch\nif (myrank == 0) { MPI_Send(…, 1, tag, …); }\nelse { MPI_Recv(…, 0, tag, …); }`, np: 3, prog: (r) => (r === 0 ? [["send", 1]] : [["recv", 0]]) },
  recvFirst: { name: "both receive first", src: `if (myRank == 0) {\n  MPI_Recv(msg, 20, MPI_CHAR, 1, tag, MPI_COMM_WORLD, &status);\n  MPI_Send(msg, strlen(msg)+1, MPI_CHAR, 1, tag, MPI_COMM_WORLD);\n} else {\n  MPI_Recv(msg, 20, MPI_CHAR, 0, tag, MPI_COMM_WORLD, &status);\n  MPI_Send(msg, strlen(msg)+1, MPI_CHAR, 0, tag, MPI_COMM_WORLD);\n}`, np: 2, prog: (r) => [["recv", 1 - r], ["send", 1 - r]] },
  sendFirst: { name: "both send first (MPI_Send)", src: `MPI_Send(…, other, tag, …);   // standard mode: may buffer\nMPI_Recv(…, other, tag, …);`, np: 2, prog: (r) => [["send", 1 - r], ["recv", 1 - r]] },
  ssend: { name: "both send first (MPI_Ssend)", src: `MPI_Ssend(…, other, tag, …);  // synchronous: waits for the receive\nMPI_Recv(…, other, tag, …);`, np: 2, prog: (r) => [["ssend", 1 - r], ["recv", 1 - r]] },
  ordered: { name: "fixed: order by rank", src: `if (myRank == 0) { MPI_Ssend(…, 1, …); MPI_Recv(…, 1, …); }\nelse             { MPI_Recv(…, 0, …); MPI_Ssend(…, 0, …); }`, np: 2, prog: (r) => (r === 0 ? [["ssend", 1], ["recv", 1]] : [["recv", 0], ["ssend", 0]]) },
};

function mpiRun(scen) {
  const S = PP_MPI_SCEN[scen];
  const ps = Array.from({ length: S.np }, (_, r) => ({ r, ops: S.prog(r), pc: 0, log: [] }));
  const chan = []; // buffered messages: { from, to }
  const ticks = [];
  for (let t = 0; t < 12; t++) {
    const row = ps.map((p) => ({ op: p.ops[p.pc], state: p.pc >= p.ops.length ? "done" : "wait" }));
    let moved = false;
    ps.forEach((p, i) => {
      const op = p.ops[p.pc];
      if (!op || row[i].state === "ok") return;
      const [kind, peer] = op;
      if (kind === "send") { chan.push({ from: p.r, to: peer }); row[i].state = "ok"; p.pc++; moved = true; }
      else if (kind === "recv") {
        const m = chan.findIndex((x) => x.from === peer && x.to === p.r);
        if (m >= 0) { chan.splice(m, 1); row[i].state = "ok"; p.pc++; moved = true; }
        else {
          const q = ps[peer];
          if (q && q.ops[q.pc] && q.ops[q.pc][0] === "ssend" && q.ops[q.pc][1] === p.r && row[peer].state !== "ok") {
            row[i].state = "ok"; row[peer].state = "ok"; p.pc++; q.pc++; moved = true;
          }
        }
      } else if (kind === "ssend") {
        const q = ps[peer];
        if (q && q.ops[q.pc] && q.ops[q.pc][0] === "recv" && q.ops[q.pc][1] === p.r && row[peer].state !== "ok") {
          row[i].state = "ok"; row[peer].state = "ok"; p.pc++; q.pc++; moved = true;
        }
      }
    });
    ticks.push(row);
    if (!moved) break;
  }
  const done = ps.every((p) => p.pc >= p.ops.length);
  return { ticks, done, stuck: ps.filter((p) => p.pc < p.ops.length).map((p) => p.r) };
}

function ppMpi(root) {
  const { fig, read, w } = ppW(root, "mpi");
  const st = { sc: "ok" };
  const label = (op) => (!op ? "" : op[0] === "recv" ? `Recv ← ${op[1]}` : `${op[0] === "ssend" ? "Ssend" : "Send"} → ${op[1]}`);
  const draw = () => {
    const S = PP_MPI_SCEN[st.sc], R = mpiRun(st.sc);
    const np = S.np;
    fig.innerHTML = `${ccode(S.src)}
      <div class="pp-lanes" style="--t:${R.ticks.length}">
        ${Array.from({ length: np }, (_, r) => `<span class="pp-lane-name">rank ${r}</span>${R.ticks.map((row) => {
          const c = row[r];
          return `<span class="pp-tick-c ${c.state}">${c.state === "done" ? "✓ done" : `${label(c.op)}${c.state === "wait" ? " ⏳" : ""}`}</span>`;
        }).join("")}`).join("")}
      </div>`;
    read.innerHTML = R.done ? `<p><span class="pill good">all ranks finish</span></p><p class="small">${{ sendFirst: "Works only because standard mode buffered both messages. Without buffer space it turns into the Ssend case.", ordered: "One side sends while the other receives — no cycle of waiting.", ok: "The receive matches source 0 and the tag." }[st.sc] || ""}</p>`
      : `<p><span class="pill bad">${R.stuck.length === np ? "deadlock" : "hangs"}: rank${R.stuck.length > 1 ? "s" : ""} ${R.stuck.join(", ")} wait${R.stuck.length > 1 ? "" : "s"} for ever</span></p>
         <p class="small">${{ np3: "Rank 2 also runs the else branch and waits for a message from 0 that is only sent to rank 1.", recvFirst: "Both block in MPI_Recv, waiting for a message the other would only send afterwards.", ssend: "Synchronous sends wait for a matching receive; both wait in Ssend, so nobody receives." }[st.sc]}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 6.4 Collectives */

const PP_COLL = {
  Bcast: { call: "MPI_Bcast(buf, 1, MPI_INT, 0, comm)", before: [["A0"], [], []], after: () => [["A0"], ["A0"], ["A0"]], note: "The root sends its buffer to everyone (and to itself). Everyone calls MPI_Bcast." },
  Scatter: { call: "MPI_Scatter(sendbuf, 1, MPI_INT, recvbuf, 1, MPI_INT, 0, comm)", before: [["A0", "A1", "A2"], [], []], after: () => [["A0"], ["A1"], ["A2"]], note: "Equal-sized, different pieces: piece i goes to rank i. sendcount is per process." },
  Gather: { call: "MPI_Gather(sendbuf, 1, MPI_INT, recvbuf, 1, MPI_INT, 0, comm)", before: [["A0"], ["B0"], ["C0"]], after: () => [["A0", "B0", "C0"], [], []], note: "The inverse of Scatter: the root collects, sorted by rank. recvcount is per process." },
  Allgather: { call: "MPI_Allgather(sendbuf, 1, MPI_INT, recvbuf, 1, MPI_INT, comm)", before: [["A0"], ["B0"], ["C0"]], after: () => [["A0", "B0", "C0"], ["A0", "B0", "C0"], ["A0", "B0", "C0"]], note: "Gather + broadcast: everyone ends with everything, in rank order. No root." },
  Alltoall: { call: "MPI_Alltoall(sendbuf, 1, MPI_INT, recvbuf, 1, MPI_INT, comm)", before: [["A0", "A1", "A2"], ["B0", "B1", "B2"], ["C0", "C1", "C2"]], after: () => [["A0", "B0", "C0"], ["A1", "B1", "C1"], ["A2", "B2", "C2"]], note: "Sender s gives its r-th element to receiver r, stored at position s: a transpose." },
  Reduce: { call: "MPI_Reduce(sendbuf, recvbuf, 3, MPI_INT, MPI_SUM, 0, comm)", num: true, after: (v) => [sumCols(v, 3), [], []], note: "Element by element with the operation (here +); only the root gets the result." },
  Allreduce: { call: "MPI_Allreduce(sendbuf, recvbuf, 3, MPI_INT, MPI_SUM, comm)", num: true, after: (v) => [sumCols(v, 3), sumCols(v, 3), sumCols(v, 3)], note: "Reduce, and everyone gets the result." },
  "Reduce-scatter": { call: "MPI_Reduce_scatter(…, MPI_SUM, comm)", num: true, after: (v) => sumCols(v, 3).map((x) => [x]), note: "Reduce, then scatter the result: rank i gets element i of the sum." },
  Scan: { call: "MPI_Scan(sendbuf, recvbuf, 3, MPI_INT, MPI_SUM, comm)", num: true, after: (v) => v.map((_, r) => sumCols(v.slice(0, r + 1), 3)), note: "Prefix reduction: rank r gets the sum over ranks 0 … r." },
};
const PP_COLL_NUM = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
const sumCols = (rows, n) => Array.from({ length: n }, (_, i) => rows.reduce((a, r) => a + r[i], 0));

function ppCollectives(root) {
  const { fig, read, w } = ppW(root, "coll");
  const st = { op: "Scatter" };
  const cell = (x) => {
    const own = typeof x === "string" ? "ABC".indexOf(x[0]) : -1;
    return `<span class="pp-cc ${own >= 0 ? "o" + own : "sum"}">${x}</span>`;
  };
  const grid = (rows, title) => `<div class="pp-cgrid"><span class="small muted pp-cg-t">${title}</span>${rows.map((r, i) => `<span class="pp-cg-p">P${i}</span><span class="pp-cg-row">${r.length ? r.map(cell).join("") : '<span class="pp-cc empty">–</span>'}</span>`).join("")}</div>`;
  const draw = () => {
    const C = PP_COLL[st.op];
    const before = C.num ? PP_COLL_NUM : C.before, after = C.after(PP_COLL_NUM);
    fig.innerHTML = `<div class="pp-coll">${grid(before, "before")}<span class="pp-coll-arrow">→</span>${grid(after, "after")}</div>${ccode(C.call)}`;
    read.innerHTML = `<p class="small">${C.note}</p><p class="small muted">Collective calls must be made by <b>every</b> process of the communicator, in the same order.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

const PP_MR_DOCS = ["to be or not to be", "to do is to be", "be quick"];
function ppMapReduce(root) {
  const { fig, read, w } = ppW(root, "mr");
  let k = 0;
  const STAGES = ["documents on 3 nodes", "Map: count words per document", "Shuffle: all pairs of a word to one node", "Reduce: add up per word"];
  const draw = () => {
    const maps = PP_MR_DOCS.map((d) => { const m = {}; d.split(" ").forEach((x) => (m[x] = (m[x] || 0) + 1)); return m; });
    const words = [...new Set(PP_MR_DOCS.join(" ").split(" "))].sort();
    const owner = (wd) => words.indexOf(wd) % 3;
    let cols;
    if (k === 0) cols = PP_MR_DOCS.map((d) => [`“${d}”`]);
    else if (k === 1) cols = maps.map((m) => Object.entries(m).map(([x, n]) => `(${x}, ${n})`));
    else if (k === 2) cols = [0, 1, 2].map((node) => maps.flatMap((m) => Object.entries(m).filter(([x]) => owner(x) === node).map(([x, n]) => `(${x}, ${n})`)));
    else cols = [0, 1, 2].map((node) => words.filter((x) => owner(x) === node).map((x) => `(${x}, ${maps.reduce((a, m) => a + (m[x] || 0), 0)})`));
    fig.innerHTML = `<div class="pp-mr">${cols.map((c, i) => `<div class="pp-mr-node"><b>P${i + 1}</b>${c.map((x) => `<span>${ppEsc(x)}</span>`).join("")}</div>`).join("")}</div>`;
    read.innerHTML = `<p class="small"><b>${STAGES[k]}</b></p><p class="small muted">Map and Reduce are yours; Shuffle is generic. With MPI: map via scatter, reduce via reduce operations.</p>`;
    $('[data-a="prev"]', w).disabled = k === 0;
    $('[data-a="next"]', w).disabled = k === 3;
  };
  ppW(root, "mr").on("prev", () => { k--; draw(); });
  ppW(root, "mr").on("next", () => { k++; draw(); });
  draw();
}

/* ================================================================ The chapters */

PROPA_CHAPTERS.push({
  n: 5,
  part: "Reussner",
  title: "Parallel basics",
  next: "C and MPI",
  headline: "Why parallel, and how <span class='accent'>fast</span> it can get",
  intro: "Topic 5.1: why clock rates stopped helping, shared vs distributed memory, Flynn's taxonomy, task vs data parallelism, two parallel algorithms, and Amdahl's law.",
  sections: [
    {
      id: "5.1",
      title: "Terms: memory, threads, Flynn",
      short: "Terms",
      about: "Moore's law, parallelism vs concurrency, shared vs distributed memory, processes and threads, SISD … MIMD",
      html: () => `
        <div class="card">
          ${ppGist([
            `Clock rates have stalled at about 3–4 GHz, so more speed now comes from <b>more cores</b> (multi-core, clusters), not faster ones.`,
            `<b>Parallelism</b>: at least two threads run at the same time. <b>Concurrency</b>: at least two make progress (maybe by taking turns). Concurrency is the more general one.`,
            `<b>Shared memory</b> (multi-core, Java threads): everyone reads and writes the same memory. <b>Distributed memory</b> (clusters, MPI): each has its own and they send messages.`,
            `A <b>process</b> has its own address space (switching is slow). Its <b>threads</b> share code, data and heap but each has its own stack, registers and program counter.`,
          ])}
          ${pw("mem", `${pseg("m", [["shared", "shared memory"], ["distributed", "distributed memory"]], "shared")}${pseg("cores", [[2, "2 cores"], [1, "1 core"]], 2)}`, { wide: true })}
          ${ppSrc(["Parallel_Fundamentals.pdf"])}
        </div>
        <div class="card">
          <h3>Flynn's taxonomy</h3>
          <p>{Single, Multiple} Instruction × {Single, Multiple} Data. Click a box.</p>
          ${pw("flynn", "", { wide: true })}
          ${ppFacts([
            ["levels of parallelism", "bit level (two 32-bit additions in a 64-bit unit), instruction level (pipelining), data level (loops), process level."],
            ["thread's own", "program counter, stack (with an activation record per call), registers."],
            ["threads share", "address space, code and data segments, heap, open files, locks."],
          ])}
          ${ppTraps([
            "Parallel processing is <b>not</b> a paradigm of its own — it can be done in C, Java, functional languages …",
            "In Java, threads can only share data through objects on the heap; the stack is thread-local.",
            "MPI is “single program, multiple data”: one program on all nodes — but with branches on the rank it can do MIMD.",
          ])}
        </div>`,
      setup: (root) => { ppMemModels(root); ppFlynn(root); },
      check: [
        { q: "Two threads on one core, taking turns. That is …", opts: ["concurrency, not parallelism", "parallelism", "neither", "MIMD"], why: "Both make progress, but never at the same instant." },
        { q: "Today's multi-core processors are, in Flynn's terms, …", opts: ["MIMD", "SISD", "SIMD", "MISD"], why: "Different cores run different instructions on different data." },
        { q: "Which does a thread NOT share with the other threads of its process?", opts: ["its stack", "the heap", "the code segment", "open files"], why: "Each thread has its own stack, program counter and registers." },
        { q: "How do processes communicate on a distributed-memory system?", opts: ["By sending messages", "Through shared variables", "Through the heap", "Through monitors"], why: "Each processor can only access its own memory." },
        { q: "Why is parallel processing now the rule?", opts: ["Clock rates stopped growing, so more speed needs more cores", "Moore's law forbids faster clocks", "Parallel programs are easier", "Single cores can't run Java"], why: "Moore's law (transistors) went on for a while, but clock rates stagnate at 3–4 GHz." },
      ],
    },
    {
      id: "5.2",
      title: "Partitioning and speedup",
      short: "Speedup",
      about: "task vs data parallelism, parallel sum in O(log n), odd-even sort, Amdahl's law",
      html: () => `
        <div class="card">
          ${ppGist([
            `The programmer partitions the problem: <b>task parallelism</b> (split the <i>function</i> into independent tasks) or <b>data parallelism</b> (split the <i>data</i>, same operation on each part).`,
            `Summing n numbers sequentially takes O(n); pairwise in parallel it takes <b>O(log n)</b> steps.`,
            `Bubble sort is O(n²); the odd-even variant compares all even pairs, then all odd pairs at once: n phases of O(1) → <b>O(n)</b> on n processors.`,
            `<b>Amdahl</b>: ${F(`<i class="mv">S</i>(<i class="mv">n</i>) = ${frac("<i class='mv'>T</i>(1)", "<i class='mv'>T</i>(<i class='mv'>n</i>)")} ≤ ${frac("1", `(1 − <i class="mv">p</i>) + ${frac("<i class='mv'>p</i>", "<i class='mv'>n</i>")}`)}`, "small-f")} — the serial part limits the speedup, however many processors.`,
          ])}
        </div>
        <div class="card">
          <h3>Parallel addition</h3>
          ${pw("psum", `<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`)}
        </div>
        <div class="card">
          <h3>Odd-even transposition sort</h3>
          ${codePair(ccode(`for (int i = a.length-1; i > 0; i--)\n  for (int j = 0; j < i; j++)\n    if (a[j] > a[j+1]) swap(a, j, j+1);\n// 7+6+5+4+3+2+1 = 28 comparisons: O(n²)`, { title: "Serial bubble sort" }),
            ccode(`for h := 0 to n div 2 do\n  for i := 0, 2, 4, ... pardo\n    compareAndExchange(a[i], a[i+1])\n  for i := 1, 3, 5, ... pardo\n    compareAndExchange(a[i], a[i+1])`, { title: "Parallel: each phase O(1)" }))}
          ${pw("oes", `<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Phase →", "primary")}</div>${pbtn("new", "New numbers")}`)}
        </div>
        <div class="card">
          <h3>Amdahl's law</h3>
          ${pw("amdahl", `${pslider("p", "parallel part p", 0, 100, 1, 90)}${pslider("n", "processors n = 2^k", 0, 10, 1, 2)}${pbtn("ex", "Exercise: readers and writers")}`, { wide: true })}
          ${ppAside("The exercise: 90 % readers (2 s), 10 % writers (3 s), 4 cores", `
            <p>Readers can run in parallel, writers can't. Measured in <b>time</b>, not in threads:</p>
            ${F(`<i class="mv">p</i> = ${frac("2 · 0.9", "2 · 0.9 + 3 · 0.1")} ≈ 0.86 &nbsp;&nbsp; <i class="mv">S</i>(4) = ${frac("1", "(1 − 0.86) + 0.86 / 4")} ≈ 2.82`, "small-f")}`)}
          ${ppTraps([
            "In Amdahl, p is a share of <b>running time</b>, not of the number of threads or lines.",
            "Synchronisation and communication overhead means the bound is rarely reached in practice.",
            "Task parallelism is about splitting work into different functions; data parallelism runs the same one on parts of the data.",
          ])}
        </div>`,
      setup: (root) => { ppParSum(root); ppOddEven(root); ppAmdahl(root); },
      check: [
        { q: "p = 0.75 of a program can run in parallel. Speedup with n = 3?", opts: ["2", "3", "1.75", "4"], why: "1 / (0.25 + 0.75/3) = 1 / 0.5 = 2." },
        { q: "And the most you could ever get with p = 0.75?", opts: ["4", "∞", "0.75", "3"], why: "n → ∞ leaves 1 / (1 − p) = 1 / 0.25." },
        { q: "Edge detection applies the same filter to every pixel, split into stripes. That is …", opts: ["data parallelism", "task parallelism", "MISD", "concurrency only"], why: "The same operation on different parts of the data." },
        { q: "The parallel sum of 8 numbers with pairwise additions takes how many parallel steps?", opts: ["3", "7", "8", "4"], why: "log₂ 8 = 3: 4 additions, then 2, then 1." },
        { q: "Why is each phase of odd-even sort O(1)?", opts: ["All its compare-and-exchanges run at once, one processor per pair", "It only compares two numbers", "The array is already sorted", "It uses a heap"], why: "The pairs in one phase don't overlap, so they are independent." },
      ],
    },
  ],
});

PROPA_CHAPTERS.push({
  n: 6,
  part: "Reussner",
  title: "C and MPI",
  next: "Java threads",
  headline: "Pointers, and processes that only <span class='accent'>talk</span>",
  intro: "Topics 5.2 and 5.3: the C you need for MPI (pointers, arrays, memory, reading declarations), then MPI's point-to-point and collective operations, and MapReduce.",
  sections: [
    {
      id: "6.1",
      title: "Pointers, arrays and memory",
      short: "Pointers",
      about: "& and *, pointer arithmetic, arrays decay, pass by value, malloc/free, stack and heap",
      html: () => `
        <div class="card">
          ${ppGist([
            `A pointer holds an address. ${cq("&x")} gives the address of x, ${cq("*p")} the value p points to.`,
            `<b>Pointer arithmetic</b> counts in elements: ${cq("p + 1")} moves by ${cq("sizeof(*p)")} bytes. ${cq("p[i]")} is just ${cq("*(p + i)")}.`,
            `An array name <b>decays</b> to the address of its first element: ${cq("p = arr")} is ${cq("p = &arr[0]")} — but an array is not a pointer variable.`,
            `C passes everything <b>by value</b>, except arrays (only the pointer is passed). To change a caller's variable, pass its address. C++ has references (${cq("int &i")}).`,
            `No garbage collection: memory from ${cq("malloc")} must be given back with ${cq("free")}.`,
          ])}
          ${codePair(ccode(`int arr[] = { 45, 67, 89 };\nint *p, i;\np = arr;        /* = &arr[0] */\ni = arr[1];     /* 67 */\ni = p[1];       /* 67 */\ni = *(p + 1);   /* 67 */`, { title: "Pointers and arrays" }),
            ccode(`void incr(int *i) {\n  (*i)++;\n}\nint main() {\n  int i = 1;\n  incr(&i);     /* i is now 2 */\n  return 0;\n}`, { title: "Pass the address to change it" }))}
          ${ppSrc(["C_Repetition.pdf", "Übung MPI.pdf"])}
        </div>
        <div class="card">
          <h3>Follow the addresses</h3>
          <p>The exercise's memory (ints are 4 bytes, pointers 8). Step through an expression.</p>
          ${pw("ptr", `<div class="pp-ptr-ex">${pseg("ex", [["pingo", "*(*(c + 1) + 2) + 3"], ["sub", "b[1]"], ["prec", "*a + 1"], ["two", "c[0][2]"], ["addr", "&a[1]"]], "pingo")}</div><div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`, { wide: true })}
        </div>
        <div class="card">
          <h3>Memory and the rest of C</h3>
          ${ppFacts([
            ["text segment", "the program's instructions."],
            ["stack", "automatic (local) variables; freed when the function returns. Deep recursion or big parameters → stack overflow."],
            ["heap", "global and static variables, and everything from malloc (until free)."],
            ["types", "int, char, float, double, void, enum; sizes depend on the platform. No bool in C (0 is false), strings are char[] ending in '\\0'."],
            ["function pointers", `${cq("void (*foo)(int); foo = &my_int_func; foo(2);")}`],
            ["struct vs union", "a struct has all its members side by side; a union's members share the same memory (one at a time)."],
          ])}
          ${ppTraps([
            `In ${cq("int *p, q;")} only p is a pointer; q is an int.`,
            `${cq("*p + 1")} is ${cq("(*p) + 1")}, not ${cq("*(p + 1)")}.`,
            `For ${cq("MPI_Send")} you pass a buffer address: an array name works as is, a single int needs ${cq("&x")}.`,
            "const data can still be changed through pointers — C doesn't stop you.",
          ])}
        </div>`,
      setup: (root) => ppPointers(root),
      check: [
        { q: `${cq("int a[] = {1, 3, 5}; int *b = a;")} What is ${cq("*(b + 2) - *b")}?`, opts: ["4", "2", "1", "an address"], why: "a[2] − a[0] = 5 − 1." },
        { q: `${cq("int *c[] = {a, b};")} — what is c?`, opts: ["an array of pointers to int", "a pointer to an array of int", "a pointer to a pointer", "an int array"], why: "[] binds tighter than *: c is an array of int*." },
        { q: `${cq("p")} is an int* with value 100, ints are 4 bytes. ${cq("p + 3")} is …`, opts: ["112", "103", "300", "the value 3 later"], why: "Pointer arithmetic moves by whole elements: 100 + 3 · 4." },
        { q: "How do you let a C function change the caller's int?", opts: ["Pass a pointer to it", "Pass it by value", "Declare it const", "Return void"], why: "C only has pass by value; the address lets the function write to the original." },
        { q: "Where does memory from malloc live, and who frees it?", opts: ["On the heap; you, with free()", "On the stack; automatically", "On the heap; the garbage collector", "In the text segment"], why: "C has no garbage collection." },
      ],
    },
    {
      id: "6.2",
      title: "Reading C declarations",
      short: "Declarations",
      about: "the precedence rule, the decoder ring, const and volatile",
      html: () => `
        <div class="card">
          ${ppGist([
            `Start at the <b>name</b>. Then read to the <b>right</b> as long as there is ${cq("[]")} (“array of”) or ${cq("()")} (“function returning”).`,
            `Then read to the <b>left</b>: ${cq("*")} is “pointer to”, ${cq("const")} “read-only”, ${cq("volatile")} “volatile”. A parenthesis sends you back to the right.`,
            `What remains on the left is the base type.`,
            `${cq("const")} = read-only after definition. ${cq("volatile")} = always read from memory (no registers, no optimisation), e.g. for I/O buffers.`,
          ])}
          ${ccode(`int * arr[];                     /* arr is an array of pointer to int */
int *(*p)();                     /* p is a pointer to a function returning a pointer to int */
volatile int * const i;          /* i is a read-only pointer to a volatile int */
unsigned int* const *(*next)();  /* next is a pointer to a function returning
                                    a pointer to a read-only pointer to unsigned int */`)}
          ${ppSrc(["C_Repetition.pdf (van der Linden, Expert C Programming)"])}
        </div>
        <div class="card">
          <h3>The decoder ring</h3>
          ${pw("decl", `<div class="lw-row">${["int *arr[];", "int *(*p)();", "volatile int * const i;", "unsigned int* const *(*next)();", "char *(*c[10])(int **p);", "void (*foo)(int);"].map((d) => `<button class="btn small-btn" type="button" data-decl="${d}">${ppEsc(d)}</button>`).join("")}</div>
            <div class="lw-row pp-lc-row"><input class="pp-decl-in pp-lc-in" type="text" value="unsigned int* const *(*next)();" spellcheck="false" aria-label="C declaration">${pbtn("go", "Read")}</div>
            <div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`, { wide: true })}
          ${ppTraps([
            `${cq("const int *p")}: p points to a read-only int (p itself can change). ${cq("int * const p")}: p itself is read-only.`,
            "Postfix [] and () bind tighter than prefix * — that's why int *a[] is an array of pointers.",
            `${cq("int (*a)[5]")} is a pointer to an array of 5 ints — the parentheses change everything.`,
          ])}
        </div>`,
      setup: (root) => ppDecl(root),
      check: [
        { q: `${cq("int *(*p)();")} — p is …`, opts: ["a pointer to a function returning a pointer to int", "a function returning a pointer to a pointer to int", "an array of function pointers", "a pointer to an int"], why: "(*p) first: pointer to; then (): function returning; then *: pointer to; then int." },
        { q: `${cq("volatile int * const i;")} — what can't you change?`, opts: ["i itself (the pointer)", "the int i points to", "both", "neither"], why: "const is right of *, so it belongs to the pointer: a read-only pointer to a volatile int." },
        { q: `${cq("char *x[10];")} — x is …`, opts: ["an array of 10 pointers to char", "a pointer to an array of 10 chars", "a function", "a string of 10 chars"], why: "Right first: array of 10; then left: pointer to; then char." },
        { q: "What does volatile tell the compiler?", opts: ["Always read the value from memory; don't optimise it into a register", "The value never changes", "It's thread-safe", "It's on the heap"], why: "The value may change outside the program's control (e.g. hardware)." },
        { q: "In which direction do you read first, after finding the name?", opts: ["Right, for [] and ()", "Left, for *", "From the start of the line", "It doesn't matter"], why: "Postfix operators have higher precedence than the prefix *." },
      ],
    },
    {
      id: "6.3",
      title: "MPI: point-to-point",
      short: "Send & receive",
      about: "SPMD, ranks, MPI_Send/Recv, wildcards, communication modes, blocking, deadlocks",
      html: () => `
        <div class="card">
          ${ppGist([
            `MPI: processes with <b>separate memory</b> talk only through messages. The <b>same program</b> runs on N nodes (${cq("mpirun -np N a.out")}); branching on the <b>rank</b> lets them do different things.`,
            `${cq("MPI_Init")} … ${cq("MPI_Finalize")}; ${cq("MPI_Comm_size")} and ${cq("MPI_Comm_rank")} return through pointers. ${cq("MPI_COMM_WORLD")} holds all processes; rank 0 is by convention the root.`,
            `${cq("MPI_Send")} / ${cq("MPI_Recv")} are <b>blocking</b>: Send returns when the buffer can be reused, Recv when the message is in the buffer. Source and tag must match (or ${cq("MPI_ANY_SOURCE")}, ${cq("MPI_ANY_TAG")}).`,
            `Messages between one sender–receiver pair don't overtake each other. There is no global order.`,
          ])}
          ${codePair(ccode(`int MPI_Send(void* buffer, int count, MPI_Datatype datatype,
             int dest, int tag, MPI_Comm comm)
int MPI_Recv(void* buffer, int count, MPI_Datatype datatype,
             int source, int tag, MPI_Comm comm, MPI_Status* status)`, { title: "The signatures" }),
            ccode(`int main(int argc, char** args) {
  int size, myrank;
  MPI_Init(&argc, &args);
  MPI_Comm_size(MPI_COMM_WORLD, &size);
  MPI_Comm_rank(MPI_COMM_WORLD, &myrank);
  printf("Hello world, I have rank %d out of %d.\\n", myrank, size);
  MPI_Finalize();
  return 0;
}`, { title: "Hello world: any order of output" }))}
          ${ppSrc(["MPI.pdf", "Übung MPI.pdf"])}
        </div>
        <div class="card">
          <h3>Who waits for whom?</h3>
          <p>Each column is a moment; ⏳ means blocked. Pick a program.</p>
          ${pw("mpi", pseg("sc", Object.entries(PP_MPI_SCEN).map(([k, s]) => [k, s.name]), "ok"), { wide: true })}
        </div>
        <div class="card">
          <h3>Communication modes, and blocking</h3>
          ${ppFacts([
            [`synchronous (${cq("MPI_Ssend")})`, "no buffer; returns only once the matching receive has started (rendezvous). Safest, most portable, can replace a barrier."],
            [`buffered (${cq("MPI_Bsend")})`, "copies into a user buffer (MPI_Buffer_attach) and returns; error if the buffer overflows."],
            [`ready (${cq("MPI_Rsend")})`, "the receive must already be posted, else undefined. Lowest overhead."],
            [`standard (${cq("MPI_Send")})`, "may buffer or not — implementation-dependent; turns synchronous when the hidden buffer is full."],
            [`non-blocking (${cq("MPI_Isend")}, ${cq("MPI_Irecv")})`, `return at once with an ${cq("MPI_Request")}; check with ${cq("MPI_Test")} (flag) or wait with ${cq("MPI_Wait")}. Don't touch the buffer before that.`],
            [cq("MPI_Barrier"), "blocks until all processes of the communicator have called it."],
            [cq("MPI_Sendrecv"), "send and receive in one call — avoids deadlocks in cyclic exchanges."],
          ])}
          ${ppTraps([
            `Recv count is a <b>maximum</b>: fewer elements may arrive, more is an error — so ${cq("strlen(msg)+1")} can't be used on the receiving side.`,
            "Blocking/non-blocking is orthogonal to the four modes. There is only one receive mode.",
            "A program that only works because standard mode happened to buffer is not correct.",
          ])}
        </div>`,
      setup: (root) => ppMpi(root),
      check: [
        { q: "Both ranks first call MPI_Recv from each other, then MPI_Send. What happens?", opts: ["Deadlock: both wait for a message never sent", "It works", "Only rank 0 finishes", "MPI reorders the calls"], why: "Blocking receives wait; neither process reaches its send." },
        { q: "When does a blocking MPI_Send return?", opts: ["When the send buffer can be reused", "When the receiver has processed the data", "Immediately, always", "After MPI_Finalize"], why: "Not necessarily when it was received — standard mode may have buffered it." },
        { q: `How must the buffers be passed? ${cq("int *send_buf = malloc(8 * sizeof(int)); int recv_buf = 0;")}`, opts: [`${cq("MPI_Send(send_buf, 8, …)")} and ${cq("MPI_Recv(&recv_buf, 1, …)")}`, `${cq("MPI_Send(&send_buf, 8, …)")} and ${cq("MPI_Recv(recv_buf, 1, …)")}`, `${cq("MPI_Send(*send_buf, 8, …)")} and ${cq("MPI_Recv(&recv_buf, 1, …)")}`, "both without & or *"], why: "send_buf already is an address; recv_buf is an int, so pass its address." },
        { q: "Which mode needs the receive to be posted already, or the behaviour is undefined?", opts: ["Ready", "Synchronous", "Buffered", "Standard"], why: "MPI_Rsend skips all handshaking." },
        { q: "MPI_Irecv returns. What may you NOT do yet?", opts: ["Read the receive buffer", "Compute something else", "Call MPI_Test", "Call MPI_Wait"], why: "The message may not have arrived; check with MPI_Test or MPI_Wait first." },
      ],
    },
    {
      id: "6.4",
      title: "MPI: collective operations and MapReduce",
      short: "Collectives",
      about: "Bcast, Scatter, Gather, Allgather, Alltoall, Reduce, Scan, MapReduce",
      html: () => `
        <div class="card">
          ${ppGist([
            `A typical pattern: <b>distribute</b> the data, <b>compute</b>, <b>collect</b> the results — collective operations do that.`,
            `A collective must be called by <b>every</b> process of the communicator (also the root, also to receive), in the same order.`,
            `Counts are <b>per process</b>: scattering 6 ints to 3 processes uses sendcount = recvcount = 2. The v-variants (${cq("MPI_Scatterv")}, ${cq("MPI_Gatherv")}) allow different counts.`,
            `Reductions combine element-wise with an ${cq("MPI_Op")}: ${cq("MPI_SUM")}, ${cq("MPI_MAX")}, ${cq("MPI_MIN")}, ${cq("MPI_PROD")}, ${cq("MPI_LAND")}, ${cq("MPI_MAXLOC")} …`,
          ])}
          ${ppSrc(["MPI.pdf", "Übung MPI.pdf"])}
        </div>
        <div class="card">
          <h3>Before and after</h3>
          ${pw("coll", pseg("op", Object.keys(PP_COLL).map((k) => [k, k]), "Scatter"), { wide: true })}
          ${codePair(ccode(`int all_data[] = { 2, 3, 5, 7, 11, 13 }; // on root
int *data = malloc(2 * sizeof(int));
MPI_Scatter(all_data, 2, MPI_INT,   // send
            data, 2, MPI_INT,       // recv
            root, MPI_COMM_WORLD);`, { title: "The exercise: 6 values on N = 3 nodes" }),
            ccode(`if (rank == 0) buf = 777;
printf("[%d]: Before Bcast, buf is %d\\n", rank, buf);
MPI_Bcast(&buf, 1, MPI_INT, 0, MPI_COMM_WORLD);
printf("[%d]: After Bcast, buf is %d\\n", rank, buf);`, { title: "Same program for everyone" }))}
        </div>
        <div class="card">
          <h3>MapReduce</h3>
          ${pw("mr", `<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`, { wide: true })}
          ${ppAside("Matrix multiplication C = A · B (exercise 6)", `<p>Each process computes some rows of C. Every row of C needs a row of A and <b>all</b> of B: so <b>MPI_Bcast</b> B, <b>MPI_Scatter</b> the rows of A, compute, and <b>MPI_Gather</b> the rows of C. Rows are contiguous in memory (row-major), which is what makes scattering rows easy.</p>`)}
          ${ppTraps([
            "Scatter ≠ Bcast: broadcast sends the <b>same</b> data to all, scatter sends <b>different</b> pieces.",
            "Gather's receive buffer only matters on the root.",
            "MapReduce is a model for certain problems; MPI is a general communication library (MapReduce can be built on it).",
          ])}
        </div>`,
      setup: (root) => { ppCollectives(root); ppMapReduce(root); },
      check: [
        { q: "Which collective gives every process the sum of everyone's values?", opts: ["MPI_Allreduce", "MPI_Reduce", "MPI_Gather", "MPI_Scan"], why: "Reduce puts the result only on the root; Allreduce on all." },
        { q: "12 ints on the root, scattered to 4 processes. sendcount?", opts: ["3", "12", "4", "1"], why: "The count is per receiving process." },
        { q: "After MPI_Alltoall with 3 processes, P1's buffer holds …", opts: ["element 1 of P0, P1 and P2", "all of P1's own elements", "P0's elements", "the sum"], why: "Receiver r gets the r-th element of every sender, sorted by sender rank." },
        { q: "What does MPI_Scan with MPI_SUM give rank 2 (ranks 0, 1, 2 have 1, 2, 3)?", opts: ["6", "3", "5", "1"], why: "A prefix sum over ranks 0 … 2." },
        { q: "In MapReduce, which step is generic (not written by you)?", opts: ["Shuffle", "Map", "Reduce", "None"], why: "Shuffle redistributes the pairs by key so one node has all values of a key." },
      ],
    },
  ],
});
