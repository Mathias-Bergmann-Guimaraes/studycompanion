// ProPa Lean chapter 3, "Scaling up": PerformanceBaseline.lean, PerformanceAccumulators.lean,
// Specification/*.lean and Modularity/*.lean (lecture weeks 5–7). The property-based testing
// drawing is a small plausible: random inputs, a counterexample, then shrinking it.

/* ---------------------------------------------------------------- 3.1 Call stacks */

// The steps of len / lenTR / rev / revTR on a list: the stack at each step and the work so far.
function ppStackSteps(fn, xs) {
  const L = (ys) => showList(ys);
  const n = xs.length, steps = [];
  if (fn === "len") {
    for (let i = 0; i <= n; i++) steps.push({ frames: [...xs.slice(0, i).map(() => "1 + □"), `len ${L(xs.slice(i))}`], work: i, note: i < n ? "Each call waits for its tail: a new frame." : "Base case: 0." });
    for (let i = n - 1; i >= 0; i--) steps.push({ frames: [...xs.slice(0, i).map(() => "1 + □"), `= ${n - i}`], work: n + (n - i), note: "Returning: each frame adds its 1." });
  } else if (fn === "lenTR") {
    for (let i = 0; i <= n; i++) steps.push({ frames: [`lenTRAux ${L(xs.slice(i))} ${i}`], work: i, note: i < n ? "Tail call: nothing waits, the frame is reused." : `Done: the accumulator is the answer, ${n}.` });
  } else if (fn === "rev") {
    for (let i = 0; i <= n; i++) steps.push({ frames: [...xs.slice(0, i).map((x) => `□ ++ [${x}]`), `rev ${L(xs.slice(i))}`], work: i, note: i < n ? "Each call waits to append its head at the end." : "Base case: []." });
    let w = n, acc = [];
    for (let i = n - 1; i >= 0; i--) {
      w += acc.length + 1;
      acc = [...acc, xs[i]];
      steps.push({ frames: [...xs.slice(0, i).map((x) => `□ ++ [${x}]`), `= ${L(acc)}`], work: w, note: `Appending copies the whole list so far: ${acc.length} cons step${acc.length === 1 ? "" : "s"}.` });
    }
  } else {
    for (let i = 0; i <= n; i++) steps.push({ frames: [`revTRAux ${L(xs.slice(i))} ${L(xs.slice(0, i).reverse())}`], work: i, note: i < n ? "Move the head onto the accumulator: one cons." : "Done: the accumulator is the reversed list." });
  }
  return steps;
}

function ppStack(root) {
  const { fig, read, w } = ppW(root, "stack");
  const st = { fn: "len", i: 0, xs: [1, 2, 3, 4] };
  const draw = () => {
    const steps = ppStackSteps(st.fn, st.xs);
    st.i = Math.min(st.i, steps.length - 1);
    const s = steps[st.i];
    const depth = Math.max(...steps.map((x) => x.frames.length));
    fig.innerHTML = `<div class="pp-stack" style="--rows:${Math.max(depth, 3)}">${[...s.frames].reverse().map((f, j) =>
      `<div class="pp-frame ${j === 0 ? "top" : "wait"}">${ppVal(f)}</div>`).join("")}</div>`;
    read.innerHTML = `<p class="small">${s.note}</p>
      <div class="lw-vals"><span>stack frames now</span><b>${s.frames.length}</b><span>deepest stack</span><b>${depth}</b><span>cons / add steps so far</span><b>${s.work}</b></div>
      <p class="small muted">Step ${st.i + 1} / ${steps.length}</p>`;
    $('[data-a="prev"]', w).disabled = st.i === 0;
    $('[data-a="next"]', w).disabled = st.i === steps.length - 1;
  };
  const h = ppW(root, "stack");
  h.on("prev", () => { st.i--; draw(); });
  h.on("next", () => { st.i++; draw(); });
  h.on("new", () => { st.xs = rlist(rint(3, 6), 1, 9); st.i = 0; draw(); });
  lenWire($(".lw-ctrl", w), st, () => { st.i = 0; draw(); });
  draw();
}

// How the work grows with n.
function ppGrowth(root) {
  const { fig, read, w } = ppW(root, "growth");
  const st = { n: 1000 };
  const draw = () => {
    const n = st.n;
    const rows = [["rev (naive)", (n * (n + 1)) / 2 + n, "O(n²)", "bad"], ["revTR", n, "O(n)", ""], ["len / lenTR", n, "O(n)", ""], ["xs ++ ys", n, "O(|xs|)", ""]];
    const max = rows[0][1];
    fig.innerHTML = `<div class="pp-bars">${rows.map(([name, v, o, cls]) => `
      <div class="pp-bar-row"><span>${name}</span><span class="pp-bar ${cls}"><span style="width:${Math.max(0.6, (v / max) * 100)}%"></span></span><b>${v.toLocaleString("en")}</b><span class="small muted">${o}</span></div>`).join("")}</div>`;
    lenOut(w, "n", n.toLocaleString("en"));
    read.innerHTML = `<p class="small">For a list of ${n.toLocaleString("en")} elements the naive reverse needs <b>${Math.round(rows[0][1] / n).toLocaleString("en")}×</b> the steps of the accumulator version.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.2 A small plausible */

const PP_IMPLS = {
  revBug: { name: "reverse: [x] ++ reverse xs", src: "| x :: xs => [x] ++ reverse xs", f: (xs) => [...xs], kind: "rev" },
  revOk: { name: "reverse: reverse xs ++ [x]", src: "| x :: xs => reverse xs ++ [x]", f: (xs) => [...xs].reverse(), kind: "rev" },
  qsBug: { name: "quicksort (the lecture's)", src: "let left := tail.filter (λ x => compare x pivot |>.isLT)\nlet right := tail.filter (λ x => compare x pivot |>.isGT)", f: null, kind: "sort" },
  qsOk: { name: "quicksort, right ≥ pivot", src: "let right := tail.filter (λ x => !(compare x pivot |>.isLT))", f: (xs) => [...xs].sort((a, b) => a - b), kind: "sort" },
  empty: { name: "fun xs => []", src: "def sort (xs : List Int) : List Int := []", f: () => [], kind: "sort" },
};
// The lecture's quicksort keeps one copy of each value: the pivot, plus elements strictly < and > it.
PP_IMPLS.qsBug.f = function qs(xs) {
  if (!xs.length) return [];
  const [p, ...t] = xs;
  return [...qs(t.filter((x) => x < p)), p, ...qs(t.filter((x) => x > p))];
};

const eqL = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const PP_PROPS = {
  len: { kind: "rev", name: "same length", src: "(reverse xs).length = xs.length", args: ["xs"], test: (f, { xs }) => ({ ok: f(xs).length === xs.length }) },
  inv: { kind: "rev", name: "involution", src: "reverse (reverse xs) = xs", args: ["xs"], test: (f, { xs }) => ({ ok: eqL(f(f(xs)), xs) }) },
  app: { kind: "rev", name: "append", src: "reverse (xs ++ ys) = reverse ys ++ reverse xs", args: ["xs", "ys"],
    test: (f, { xs, ys }) => { const l = f([...xs, ...ys]), r = [...f(ys), ...f(xs)]; return { ok: eqL(l, r), issue: `${showList(l)} = ${showList(r)}` }; } },
  sorted: { kind: "sort", name: "isSorted (random i, j)", src: "i < j ∧ j < l.length → l[i] ≤ l[j]", args: ["xs", "i", "j"],
    test: (f, { xs, i, j }) => { const l = f(xs); if (!(i < j && j < l.length)) return { ok: true, vacuous: true }; return { ok: l[i] <= l[j], issue: `${l[i]} ≤ ${l[j]}` }; } },
  perm: { kind: "sort", name: "isPermutation", src: "count x (sort xs) = count x xs", args: ["xs", "x"],
    test: (f, { xs, x }) => { const a = f(xs).filter((y) => y === x).length, b = xs.filter((y) => y === x).length; return { ok: a === b, issue: `${a} = ${b}` }; } },
};

function ppGen(args, size) {
  const n = () => rint(-Math.min(size, 9), Math.min(size, 9));
  const out = {};
  args.forEach((a) => (out[a] = a === "xs" || a === "ys" ? Array.from({ length: rint(0, Math.min(size, 12)) }, n) : a === "x" ? n() : rint(0, Math.min(size, 10))));
  if (out.x !== undefined && out.xs.length && Math.random() < 0.7) out.x = pick(out.xs); // a value that's in the list, as plausible tends to find
  return out;
}

// Smaller versions of a failing input: drop an element, or move a number towards 0.
function ppShrinks(v) {
  const out = [];
  for (const k of Object.keys(v)) {
    const x = v[k];
    if (Array.isArray(x)) {
      x.forEach((_, i) => out.push({ ...v, [k]: x.filter((_, j) => j !== i) }));
      x.forEach((y, i) => y !== 0 && out.push({ ...v, [k]: x.map((z, j) => (j === i ? (Math.abs(y) > 1 ? Math.trunc(y / 2) : 0) : z)) }));
    } else if (x !== 0) out.push({ ...v, [k]: Math.abs(x) > 1 ? Math.trunc(x / 2) : 0 });
  }
  return out;
}
const ppShowArgs = (v) => Object.entries(v).map(([k, x]) => `${k} := ${Array.isArray(x) ? showList(x) : x}`).join(", ");

function ppPlausible(root) {
  const { fig, read, w } = ppW(root, "pbt");
  const st = { impl: "revBug", prop: "app" };
  const propRow = $(".pp-pbt-prop", w);
  let result = null;
  const run = () => {
    const I = PP_IMPLS[st.impl], P = PP_PROPS[st.prop];
    const log = [];
    let vacuous = 0, fail = null;
    for (let t = 0; t < 100; t++) {
      const v = ppGen(P.args, 1 + Math.floor(t / 5));
      const r = P.test(I.f, v);
      if (r.vacuous) vacuous++;
      log.push({ v, r });
      if (!r.ok) { fail = { v, r }; break; }
    }
    const shrinks = [];
    if (fail) {
      let cur = fail;
      for (let guard = 0; guard < 60; guard++) {
        const smaller = ppShrinks(cur.v).map((v) => ({ v, r: P.test(I.f, v) })).find((x) => !x.r.ok);
        if (!smaller) break;
        cur = smaller;
        shrinks.push(cur);
      }
      fail.min = cur;
    }
    result = { log, vacuous, fail, shrinks };
    track("propa.pbt");
    draw();
  };
  const draw = () => {
    const I = PP_IMPLS[st.impl];
    const props = Object.entries(PP_PROPS).filter(([, p]) => p.kind === I.kind);
    if (!props.some(([k]) => k === st.prop)) st.prop = props[0][0];
    propRow.innerHTML = pseg("prop", props.map(([k, p]) => [k, p.name]), st.prop);
    lenWire(propRow, st, () => { result = null; draw(); });
    const P = PP_PROPS[st.prop];
    fig.innerHTML = `${code(I.src, { title: "Implementation" })}${code(`example (${P.args.join(" ")}) : ${P.src} := by\n  plausible`, { title: "Property" })}
      ${result ? `<div class="pp-pbt-log">${result.log.slice(-6).map(({ v, r }, k, arr) => `<div class="${r.ok ? (r.vacuous ? "vac" : "ok") : "bad"}">${r.ok ? (r.vacuous ? "○" : "✓") : "✗"} ${ppEsc(ppShowArgs(v))}</div>`).join("")}</div>` : ""}`;
    if (!result) { read.innerHTML = `<p class="small muted">Press <b>Run plausible</b>: up to 100 random inputs, getting bigger as it goes.</p>`; return; }
    const { log, vacuous, fail, shrinks } = result;
    read.innerHTML = fail
      ? `<p><span class="pill bad">Found a counter-example!</span></p>
         <p class="small">After ${log.length} test${log.length === 1 ? "" : "s"}: ${ppVal(ppShowArgs(fail.v))}</p>
         ${shrinks.length ? `<p class="small">Shrunk ${shrinks.length}× to <b>${ppVal(ppShowArgs(fail.min.v))}</b></p>` : `<p class="small">It's already as small as it gets.</p>`}
         ${fail.min.r.issue ? `<p class="small muted">issue: ${ppEsc(fail.min.r.issue)} does not hold</p>` : ""}`
      : `<p><span class="pill good">Unable to find a counter-example</span></p><p class="small">${log.length} tests passed. That's evidence, not a proof.</p>`;
    if (vacuous) read.innerHTML += `<p class="small pp-bad-note">${vacuous} of ${log.length} tests had i, j outside the list or i ≥ j: the implication is then true without testing anything. That's why the lecture builds a <b>Bounded</b> generator.</p>`;
  };
  lenWire($(".pp-pbt-impl", w), st, () => { result = null; draw(); });
  ppW(root, "pbt").on("run", run);
  draw();
}

/* ---------------------------------------------------------------- 3.3 Instances */

const PP_BUILDINGS = {
  OfficeBuilding: { val: `OfficeBuilding.mk "North" "Admin Building" "123 Admin St." "PO Box 456" 5 100 50`,
    inst: `instance : Building OfficeBuilding where\n  campus b := b.campus\n  name b := b.name\n  address b := b.visitorAddress\n  numFloors b := b.numFloors`,
    out: ["North", "Admin Building", "123 Admin St.", "5"] },
  LectureBuilding: { val: `LectureBuilding.mk "South" "Science Hall" "456 Science Rd." 4 10 true`,
    inst: `instance : Building LectureBuilding where\n  campus b := b.campus\n  name b := s!"{b.campus}:{b.name}"\n  address b := b.address\n  numFloors b := b.numFloors`,
    out: ["South", "South:Science Hall", "456 Science Rd.", "4"] },
  LaboratoryBuilding: { val: `LaboratoryBuilding.mk "North" "Chemistry Lab" "789 Lab Ave." 3 15 "High" true`,
    inst: `instance : Building LaboratoryBuilding where\n  campus _ := "Redacted"\n  name b := b.name\n  address _ := "Redacted"\n  numFloors _ := 0`,
    out: ["Redacted", "Chemistry Lab", "Redacted", "0"], optional: true },
  String: { val: `"Mensa"`, inst: null },
};

function ppInstances(root) {
  const { fig, read, w } = ppW(root, "inst");
  const st = { ty: "OfficeBuilding", lab: 1 };
  const draw = () => {
    const B = PP_BUILDINGS[st.ty];
    const has = B.inst && !(B.optional && !st.lab);
    fig.innerHTML = `${code(`#eval ${B.val}\n      |> printBuildingInfo`)}
      ${has ? code(B.inst, { title: "The instance Lean finds" }) : `<div class="pp-noinst">No <code>instance : Building ${st.ty}</code> anywhere.</div>`}`;
    read.innerHTML = has
      ? `<div class="pp-out"><div><span>Campus:</span> ${B.out[0]}</div><div><span>Name:</span> ${B.out[1]}</div><div><span>Address:</span> ${B.out[2]}</div><div><span>Number of Floors:</span> ${B.out[3]}</div></div>
         <p class="small muted">${{ OfficeBuilding: "address comes from visitorAddress: each instance decides.", LectureBuilding: "Same printBuildingInfo, but this instance writes the name with its campus.", LaboratoryBuilding: "A new type, added later — printBuildingInfo didn't change at all." }[st.ty]}</p>`
      : `<p><span class="pill bad">failed to synthesize Building ${st.ty}</span></p><p class="small">${st.ty === "String" ? "The constraint [Building b] can't be met for String." : "Write the instance and the old code works with it, unchanged."}</p>`;
    $(".pp-lab", w).hidden = st.ty !== "LaboratoryBuilding";
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.4 Queues and Rational */

function ppQueue(root) {
  const { fig, read, w } = ppW(root, "queue");
  const st = { kind: "bank" };
  let q, next, cost, ops, last;
  const reset = () => { q = { front: [], back: [] }; next = 1; cost = 0; ops = 0; last = ""; };
  reset();
  const enq = () => {
    ops++;
    if (st.kind === "list") { cost += q.front.length + 1; q.front = [...q.front, next]; last = `enqueue ${next}: q ++ [${next}] copies ${q.front.length - 1} cell${q.front.length === 2 ? "" : "s"}`; }
    else { cost += 1; q.back = [next, ...q.back]; last = `enqueue ${next}: onto the back list, 1 step`; }
    next++;
  };
  const deq = () => {
    if (!q.front.length && !q.back.length) { last = "dequeue? on an empty queue: none"; return; }
    ops++;
    if (st.kind === "bank" && !q.front.length) {
      const k = q.back.length;
      cost += k + 1;
      q.front = [...q.back].reverse();
      q.back = [];
      const x = q.front.shift();
      last = `front empty: reverse the back (${k} steps), then take ${x}`;
      return;
    }
    cost += 1;
    const x = q.front.shift();
    last = `dequeue: take ${x} from the front, 1 step`;
  };
  const cells = (xs, cls) => (xs.length ? xs.map((x) => `<span class="pp-box ${cls}">${x}</span>`).join("") : `<span class="small muted">[]</span>`);
  const draw = () => {
    fig.innerHTML = st.kind === "list"
      ? `<div class="pp-q"><div class="pp-q-row"><span class="pp-q-lbl">list</span>${cells(q.front, "")}</div></div>`
      : `<div class="pp-q"><div class="pp-q-row"><span class="pp-q-lbl">front</span>${cells(q.front, "")}<span class="pp-q-dir">← dequeue here</span></div>
         <div class="pp-q-row"><span class="pp-q-lbl">back</span>${cells(q.back, "second")}<span class="pp-q-dir">← enqueue here (newest first)</span></div></div>`;
    read.innerHTML = `<p class="small">${last || "Enqueue a few, then dequeue."}</p>
      <div class="lw-vals"><span>operations</span><b>${ops}</b><span>steps in total</span><b>${cost}</b><span>steps per operation</span><b>${ops ? (cost / ops).toFixed(2) : "–"}</b></div>`;
  };
  const h = ppW(root, "queue");
  h.on("enq", () => { enq(); draw(); });
  h.on("deq", () => { deq(); draw(); });
  h.on("many", () => { for (let k = 0; k < 20; k++) Math.random() < 0.6 ? enq() : deq(); last = "20 random operations"; draw(); });
  h.on("reset", () => { reset(); draw(); });
  lenWire($(".pp-q-kind", w), st, () => { reset(); draw(); });
  draw();
}

const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
function ppRational(root) {
  const { read, w } = ppW(root, "rat");
  const st = { n: -12, d: -96 };
  const draw = () => {
    lenOut(w, "n", st.n);
    lenOut(w, "d", st.d);
    let lines;
    if (st.d === 0) lines = [`d = 0 → default to <b>0 /. 1</b>`];
    else {
      const g = gcd(st.n, st.d) || 1, sign = Math.sign(st.d);
      lines = [`gcd ${st.n} ${st.d} = <b>${g}</b>`, `num := ${st.n} / ${g} * ${sign} = <b>${(st.n / g) * sign}</b>`, `den := |${st.d}| / ${g} = <b>${Math.abs(st.d) / g}</b>`];
    }
    const num = st.d === 0 ? 0 : (st.n / (gcd(st.n, st.d) || 1)) * Math.sign(st.d), den = st.d === 0 ? 1 : Math.abs(st.d) / (gcd(st.n, st.d) || 1);
    read.innerHTML = `${code(`#eval ${st.n} /. ${st.d}`)}<ol class="pp-rat">${lines.map((l) => `<li>${l}</li>`).join("")}</ol>
      <p><span class="pill good">⇒ ${num} /. ${den}</span></p><p class="small muted">den ≠ 0 and coprime — the invariant holds for every value anyone can make.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- The chapter */

PROPA_CHAPTERS.push({
  n: 3,
  part: "Lean",
  title: "Scaling up",
  next: "Effects",
  headline: "Fast, tested and <span class='accent'>modular</span>",
  intro: "Weeks 5–7: tail calls and accumulators, specifications and property-based testing, type classes, purely functional data structures and encapsulation.",
  sections: [
    /* ------------------------------------------------------------ 3.1 */
    {
      id: "3.1",
      title: "Tail recursion and accumulators",
      short: "Accumulators",
      about: "complexity of recursion, tail calls, accumulator identity, rev in O(n)",
      html: () => `
        <div class="card">
          ${ppGist([
            `Structural recursion makes one call per element: <b>O(n · k)</b> for k work per element. ${c("rev xs ++ [x]")} has k = n, so <b>O(n²)</b>.`,
            `A <b>tail call</b> is the last thing a function does. Nothing waits for it, so its stack frame can be reused — a tail-recursive function becomes a loop.`,
            `An <b>accumulator</b> carries the result so far. Find it with the identity ${c("fTRAux xs acc = acc ⊕ f xs")}, where ${c("init")} is neutral for ⊕.`,
            `Then derive the cases: ${c("[]")} gives ${c("acc")}; ${c("x :: xs")} gives a tail call with a new accumulator.`,
          ])}
          ${codePair(code(`
            def List.len (xs : List α) : Nat :=
              match xs with
              | [] => 0
              | _ :: xs => 1 + len xs      -- waits: not a tail call

            def List.lenTRAux (xs : List α) (acc : Nat) : Nat :=
              match xs with
              | [] => acc
              | _ :: xs => xs.lenTRAux (acc + 1)   -- tail call
            def List.lenTR (xs : List α) : Nat := xs.lenTRAux 0`, { title: "len with ⊕ = +, init = 0" }),
          code(`
            def List.rev (xs : List α) : List α :=
              match xs with
              | [] => []
              | x :: xs => (rev xs) ++ [x]    -- O(n²)

            def revTRAux (xs : List α) (acc : List α) : List α :=
              match xs with
              | [] => acc
              | x :: xs => revTRAux xs (x :: acc)  -- O(1) per step
            def List.revTR (xs : List α) : List α := revTRAux xs []`, { title: "rev with ⊕ = flip (++), init = []" }))}
          ${ppSrc(["Functional/PerformanceBaseline.lean", "Functional/PerformanceAccumulators.lean"])}
        </div>
        <div class="card">
          <h3>What's on the stack</h3>
          ${pw("stack", `${pseg("fn", [["len", "len"], ["lenTR", "lenTR"], ["rev", "rev (naive)"], ["revTR", "revTR"]], "len")}<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>${pbtn("new", "New list")}`)}
        </div>
        <div class="card">
          <h3>How it grows</h3>
          ${pw("growth", pslider("n", "list length n", 10, 5000, 10, 1000), { wide: true })}
          ${ppAside("The derivation for len, step by step", `
            ${code(`
              lenTRAux [] acc       = acc + len []        -- the identity
                                    = acc + 0 = acc
              lenTRAux (x :: xs') acc
                                    = acc + len (x :: xs')
                                    = acc + (1 + len xs')
                                    = (acc + 1) + len xs'  -- associativity
                                    = lenTRAux xs' (acc + 1)`)}`)}
          ${ppTraps([
            `${c("1 + len xs")} is <b>not</b> a tail call: the addition runs after the call returns.`,
            `For append, the identity ${c("acc ++ ys")} gets nowhere; the lecture reverses ${c("xs")} first: ${c("appTRAux xs.reverse ys")}.`,
            `Lean's ${c("List.length")} looks like ours but is swapped for ${c("lengthTR")} by the compiler.`,
          ])}
        </div>`,
      setup: (root) => { ppStack(root); ppGrowth(root); },
      check: [
        { q: "Which call is a tail call?",
          opts: [c("| x :: xs => go xs (x :: acc)"), c("| x :: xs => 1 + go xs"), c("| x :: xs => x :: go xs"), c("| x :: xs => go xs ++ [x]")], why: "Only there is the recursive call the very last thing; the others still add, cons or append afterwards." },
        { q: `Why is the naive ${c("rev")} O(n²)?`,
          opts: ["Each of the n steps appends to a list of up to n elements", "It makes n² recursive calls", "Reversing always needs n²", "Because of the stack"], why: "n calls, and the append after each copies the reversed tail: 1 + 2 + … + n." },
        { q: `For ${c("fTRAux xs acc = acc ⊕ f xs")}, what must ${c("init")} be?`,
          opts: ["The left-neutral element of ⊕", "Always 0", "The first element of xs", "f []"], why: `${c("f xs = fTRAux xs init = init ⊕ f xs")}, so init ⊕ y = y.` },
        { q: `${c("revTRAux [1, 2, 3] []")} — what is the accumulator after two steps?`,
          opts: [c("[2, 1]"), c("[1, 2]"), c("[3]"), c("[3, 2]")], why: `[] → [1] → [2, 1]; the next step gives [3, 2, 1].` },
        { q: "What does tail-call optimisation save?",
          opts: ["Stack space (and call overhead): frames are reused", "Heap memory for lists", "The asymptotic number of steps", "Type checking time"], why: "len and lenTR are both O(n) steps; lenTR just runs in constant stack." },
      ],
    },

    /* ------------------------------------------------------------ 3.2 */
    {
      id: "3.2",
      title: "Specification and property-based testing",
      short: "Testing",
      about: "properties as Prop, plausible, counterexamples, shrinking, generators",
      html: () => `
        <div class="card">
          ${ppGist([
            `A <b>specification</b> says what a function should do, as <b>properties</b> that hold for all inputs: ${c("reverse (reverse xs) = xs")}.`,
            `Properties are ${c("Prop")}s and use ${c("=")}; programs compute ${c("Bool")}s with ${c("==")}.`,
            `<b>Property-based testing</b> (${c("by plausible")}) tries many random inputs. A failure is a <b>counter-example</b>, which it then <b>shrinks</b> to a small one. Passing is evidence, not proof.`,
            `A <b>reference implementation</b> is a spec too: ${c("reverseTR xs = reverse xs")}. One property is rarely enough: ${c("fun xs => []")} is sorted.`,
          ])}
          ${codePair(code(`
            abbrev reverse_involution (xs : List α) : Prop :=
              reverse (reverse xs) = xs
            abbrev reverse_append (xs ys : List α) : Prop :=
              reverse (xs ++ ys) = reverse ys ++ reverse xs

            example (xs : List α) : reverse_involution xs :=
              by plausible`, { title: "Properties as code" }),
          code(`
            abbrev List.isSorted [Ord α] (l : List α) (i j : Nat) : Prop :=
              i < j ∧ j < l.length → (compare l[i]? l[j]? |>.isLE)

            abbrev List.isPermutation [Ord α] (l1 l2 : List α) (x : α) : Prop :=
              l1.countP (compare x · |>.isEq) = l2.countP (compare x · |>.isEq)`, { title: "A sort is right when both hold" }))}
          ${ppSrc(["Functional/Specification/Reverse.lean", "Functional/Specification/Sorting.lean", "Functional/Specification/Bounded.lean"])}
        </div>
        <div class="card">
          <h3>Run plausible</h3>
          <p>Pick an implementation and a property. The buggy ones are the lecture's.</p>
          ${pw("pbt", `<div class="pp-pbt-impl">${pseg("impl", Object.entries(PP_IMPLS).map(([k, i]) => [k, i.name]), "revBug")}</div><div class="pp-pbt-prop"></div>${pbtn("run", "Run plausible", "primary")}`, { wide: true })}
        </div>
        <div class="card">
          <h3>Your own types need a generator</h3>
          ${code(`
            instance [Arbitrary α] : Arbitrary (BinaryTree α) where
              arbitrary := Gen.sized go
            where
              go : Nat → Gen (BinaryTree α)
              | 0 => return .empty
              | n+1 => Gen.frequency (default := return .empty)
                  [ (1, return .empty)
                  , (3, do let elem ← arbitrary
                           let left ← go (n / 2)
                           let right ← go (n / 2)
                           return .node elem left right) ]

            instance : Shrinkable (BinaryTree α) where
              shrink | .empty => [] | .node _ l r => [l, r]`)}
          ${ppTraps([
            `With random ${c("i, j")} most tests miss ${c("i < j ∧ j < l.length")} and pass without checking anything — use a <b>Bounded</b> generator.`,
            `The lecture's quicksort drops duplicates (it keeps only ${c("< pivot")} and ${c("> pivot")}): sorted, but not a permutation.`,
            `"Failed to create a testable instance" means plausible can't generate your type: write ${c("Arbitrary")} (and ${c("Shrinkable")}).`,
          ])}
        </div>`,
      setup: (root) => ppPlausible(root),
      check: [
        { q: `Why is ${c("isSorted")} alone not a specification of sorting?`,
          opts: [`${c("fun xs => []")} is always sorted but sorts nothing`, "Sorted lists can't be tested", "It only works for Int", "It is a Bool, not a Prop"], why: "You also need that the output has the same elements: isPermutation." },
        { q: `${c("reverse")} with ${c("| x :: xs => [x] ++ reverse xs")} passes which property?`,
          opts: ["reverse (reverse xs) = xs", "reverse (xs ++ ys) = reverse ys ++ reverse xs", "reverse [1, 2] = [2, 1]", "None"], why: "That function is the identity: identity twice gives xs back, but appending doesn't swap." },
        { q: "What does shrinking do?",
          opts: ["Makes a failing input smaller while it still fails", "Makes the tests faster", "Removes passing tests", "Proves the property"], why: "A short counter-example like xs := [0], ys := [1] is much easier to understand." },
        { q: `Difference between ${c("=")} and ${c("==")} here?`,
          opts: [`${c("=")} builds a Prop (a statement), ${c("==")} computes a Bool`, "None", `${c("==")} is for numbers only`, `${c("=")} is assignment`], why: "Properties are logical statements; == is the BEq function that runs." },
        { q: "plausible found no counter-example in 100 tests. What do you know?",
          opts: ["The property held for those inputs — not that it always holds", "The function is correct", "The property is false", "Nothing at all"], why: "Testing gives confidence, a proof gives certainty." },
      ],
    },

    /* ------------------------------------------------------------ 3.3 */
    {
      id: "3.3",
      title: "Type classes",
      short: "Type classes",
      about: "data and behavioural abstraction, instances, ad-hoc polymorphism, Queue",
      html: () => `
        <div class="card">
          ${ppGist([
            `Adding a constructor to an inductive type is a <b>breaking change</b>: every match on it must change. A <b>type class</b> lets new types join without touching old code.`,
            `${c("class")} lists operations; ${c("instance")} implements them for one type; ${c("[Building b]")} asks Lean to find the instance.`,
            `<b>Ad-hoc</b> polymorphism: one name, different behaviour per type (via instances). <b>Parametric</b>: one behaviour for all types (${c("List.length")}).`,
            `Classes can abstract over type constructors: ${c("class Queue (q : Type → Type)")} — BFS works with any queue.`,
          ])}
          ${codePair(code(`
            class Building (b : Type) where
              campus : b → String
              name : b → String
              address : b → String
              numFloors : b → Nat

            def printBuildingInfo [Building build] (b : build) : String :=
              let campus := Building.campus b
              …`, { title: "Data abstraction" }),
          code(`
            class Serializable (α : Type) where
              serialize : α → ByteArray
              deserialize : ByteArray → Option α

            instance : Serializable String where
              serialize s := s.toUTF8
              deserialize ar := String.fromUTF8? ar`, { title: "Behavioural abstraction" }))}
          ${ppSrc(["Functional/Modularity/Interfaces.lean"])}
        </div>
        <div class="card">
          <h3>Which instance runs?</h3>
          ${pw("inst", `${pseg("ty", Object.keys(PP_BUILDINGS).map((k) => [k, k]), "OfficeBuilding")}<div class="pp-lab">${pseg("lab", [[1, "instance written"], [0, "not written yet"]], 1)}</div>`, { wide: true })}
        </div>
        <div class="card">
          <h3>An interface for containers</h3>
          ${code(`
            class Queue (q : Type → Type) where
              empty : q α
              isEmpty : q α → Bool
              enqueue : q α → α → q α
              dequeue? : q α → Option (α × q α)

            partial def bfsWithQueue (q : Type → Type) (α : Type) [Queue q] [BEq α] [Hashable α]
                (start : α) (neighbors : α → List α) : List α := …

            partial def bfs_list   [BEq α] [Hashable α] := bfsWithQueue List α
            partial def bfs_banker [BEq α] [Hashable α] := bfsWithQueue BankersQueue α`)}
          ${ppFacts([
            ["classes you already use", `${c("BEq")} (==), ${c("Ord")} (compare), ${c("Hashable")}, ${c("ToString")}, ${c("Repr")}, ${c("Append")} (++), ${c("OfNat")} (number literals).`],
            [c("variable [Serializable α]"), "Every definition after it in the namespace gets that constraint."],
          ])}
          ${ppTraps([
            `"failed to synthesize" = no instance for that type.`,
            `${c("Queue")} takes ${c("List")}, not ${c("List α")}: its parameter is a type <b>constructor</b>.`,
            `Type classes are like Java interfaces, but an instance can be added later, outside the type's definition.`,
          ])}
        </div>`,
      setup: (root) => ppInstances(root),
      check: [
        { q: "Why is adding a laboratory constructor to BuildingA a breaking change?",
          opts: ["Every function that matches on BuildingA must handle the new case", "Constructors can't have 7 fields", "Inductive types are private", "It changes the type's name"], why: "Matches must be exhaustive, so all existing functions on the type have to change." },
        { q: `What does ${c("[Building b]")} in a signature mean?`,
          opts: ["Lean must find an instance of Building for b", "b is a list of buildings", "b is optional", "b is a Building structure"], why: "It's an instance argument, filled in automatically by instance resolution." },
        { q: `${c("List.length")} vs ${c("Building.name")}: which is ad-hoc polymorphic?`,
          opts: [c("Building.name"), c("List.length"), "both", "neither"], why: "Building.name runs different code per type; length does the same for every element type." },
        { q: `Why does ${c("Queue")} take ${c("q : Type → Type")}?`,
          opts: ["It abstracts over containers like List, which need an element type", "Queues hold types", "To allow two element types", "So enqueue is O(1)"], why: "q α is the queue of α. List and BankersQueue are both Type → Type." },
        { q: `${c("#check Building.campus \"Mensa\"")} gives?`,
          opts: ["An error: no instance Building String", c("String"), c("\"Mensa\""), "a campus"], why: "There's no instance for String, so the constraint can't be satisfied." },
      ],
    },

    /* ------------------------------------------------------------ 3.4 */
    {
      id: "3.4",
      title: "Data structures and encapsulation",
      short: "Encapsulation",
      about: "banker's queue, amortised O(1), private constructors, smart constructors, Thunk",
      html: () => `
        <div class="card">
          ${ppGist([
            `Pure data can't be changed in place, so a list as a queue costs <b>O(n)</b> per ${c("enqueue")} (${c("q ++ [x]")}).`,
            `The <b>banker's queue</b> uses two lists: take from ${c("front")}, put onto ${c("back")}; when ${c("front")} is empty, reverse ${c("back")}. Each element is reversed once: <b>O(1) amortised</b>.`,
            `<b>Encapsulation</b>: hide the real constructor (${c("private mk' ::")}) and offer a <b>smart constructor</b> that keeps the <b>invariant</b> (den ≠ 0, coprime).`,
            `The representation can then change freely: the lazy Rational stores a ${c("Thunk")} and normalises only when ${c("num")} or ${c("den")} is asked for.`,
          ])}
          ${codePair(code(`
            structure BankersQueue (α : Type) where
              front : List α
              back : List α

            instance : Queue BankersQueue where
              empty := { front := [], back := [] }
              isEmpty q := q.front.isEmpty && q.back.isEmpty
              enqueue q x := { q with back := x :: q.back }
              dequeue? q :=
                match q.front with
                | x :: xs => some (x, { q with front := xs })
                | [] =>
                  match q.back.reverse with
                  | [] => none
                  | y :: ys => some (y, { front := ys, back := [] })`, { title: "Two lists, one queue" }),
          code(`
            /- Invariant: den ≠ 0 ∧ coprime num den -/
            structure Rational where
              private mk' ::
                num : Int
                den : Nat
            deriving BEq

            def Rational.mk (n : Int) (d : Int) : Rational :=
              if d = 0 then { num := 0, den := 1 }
              else
                let gcd := Int.gcd n d
                Rational.mk' (n / gcd * d.sign) (d.natAbs / gcd)

            infixl:72 " /. " => Rational.mk`, { title: "A smart constructor" }))}
          ${ppSrc(["Functional/Modularity/Interfaces.lean", "Functional/Modularity/Rational.lean", "Functional/Modularity/RationalLazy.lean"])}
        </div>
        <div class="card">
          <h3>List queue vs banker's queue</h3>
          ${pw("queue", `<div class="pp-q-kind">${pseg("kind", [["bank", "banker's queue"], ["list", "list queue"]], "bank")}</div><div class="lw-row">${pbtn("enq", "enqueue", "primary")}${pbtn("deq", "dequeue?")}</div><div class="lw-row">${pbtn("many", "20 random")}${pbtn("reset", "Empty")}</div>`)}
        </div>
        <div class="card">
          <h3>The smart constructor at work</h3>
          ${pw("rat", `${pslider("n", "numerator n", -24, 24, 1, -12)}${pslider("d", "denominator d", -96, 96, 1, -96)}`, { wide: true })}
          ${ppTraps([
            `Inside the same file the private ${c("mk'")} is still reachable (${c("Rational.mk' 1 0")} compiles there); outside it isn't.`,
            `Amortised O(1) means on average over many operations — a single ${c("dequeue?")} can take O(n).`,
            `${c("{ q with back := … }")} makes a new queue; the old one still exists unchanged.`,
          ])}
        </div>`,
      setup: (root) => { ppQueue(root); ppRational(root); },
      check: [
        { q: "Why is enqueue O(n) on a plain list queue?",
          opts: [`${c("q ++ [x]")} copies the whole list to add at the end`, "Lists are arrays", "It reverses the list", "It uses a HashSet"], why: "A single-linked immutable list can only be extended cheaply at the front." },
        { q: "When does the banker's queue reverse its back list?",
          opts: ["When dequeue? finds the front list empty", "On every enqueue", "On every dequeue", "When back gets longer than front"], why: "In the lecture's version only an empty front triggers the reverse." },
        { q: `What does ${c("private mk' ::")} achieve?`,
          opts: ["Other modules can't build a Rational that breaks the invariant", "The fields are hidden", "Rational is immutable", "The constructor is faster"], why: "Outside, the only way in is Rational.mk, which normalises." },
        { q: `${c("6 /. -4")} gives?`,
          opts: [c("-3 /. 2"), c("3 /. -2"), c("6 /. -4"), c("-6 /. 4")], why: "gcd 2, the sign moves to the numerator, den is a Nat." },
        { q: "What is the benefit of the lazy Rational (Thunk)?",
          opts: ["Normalisation runs only for values whose num/den are read", "It uses less memory always", "It allows den = 0", "It's needed for BEq"], why: "Intermediate results of long computations that nobody inspects are never normalised." },
      ],
    },
  ],
});
