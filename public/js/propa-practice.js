// The ProPa Practice tab: tasks like the exam's, made new each time. Each kind of task (a drill)
// makes { q, opts (the first is right), why }; the page shuffles the options. Right answers count
// per kind in propaSolved.

const ppOpts = (right, wrongs) => {
  const seen = new Set([right]);
  const out = [right];
  for (const w of wrongs) if (!seen.has(w) && out.length < 4) { seen.add(w); out.push(w); }
  return out;
};
const cc = (s) => c(String(s));

const PROPA_DRILLS = [
  {
    id: "pipe", ch: 2, name: "Evaluate the pipeline", about: "map, filter, sum, length",
    make() {
      const xs = rlist(5, 0, 9);
      const STAGES = [
        ["List.map (· * 2)", (v) => v.map((x) => x * 2)], ["List.map (· + 1)", (v) => v.map((x) => x + 1)],
        ["List.filter (· % 2 == 0)", (v) => v.filter((x) => x % 2 === 0)], [`List.filter (· > ${rint(2, 6)})`, null],
      ];
      STAGES[3][1] = ((k) => (v) => v.filter((x) => x > k))(+STAGES[3][0].match(/\d+/)[0]);
      const chain = shuffle(STAGES).slice(0, 2);
      const end = pick([["List.sum", (v) => v.reduce((a, b) => a + b, 0)], ["List.length", (v) => v.length], null]);
      const run = (stages) => { let v = xs; stages.forEach(([, f]) => (v = f(v))); return end ? end[1](v) : v; };
      const show = (v) => (Array.isArray(v) ? showList(v) : String(v));
      const right = show(run(chain));
      const r = run(chain);
      const near = Array.isArray(r) ? [showList(r.slice(0, -1)), showList([...r, r.length ? r[r.length - 1] : 0]), "[]", showList(r.slice(1))] : [String(r + 1), String(r - 1), String(r + 2), String(r * 2 || 3)];
      const wrong = [show(run([chain[1], chain[0]])), show(run([chain[0]])), show(run([chain[1]])), end ? show(end[1](xs)) : showList(xs), ...near];
      return {
        q: code(`#eval ${showList(xs)}\n  ${[...chain.map(([s]) => `|> ${s}`), ...(end ? [`|> ${end[0]}`] : [])].join("\n  ")}`),
        opts: ppOpts(cc(right), wrong.map(cc)),
        why: `Step by step: ${[showList(xs), ...chain.map((_, i) => show(((v) => { chain.slice(0, i + 1).forEach(([, f]) => (v = f(v))); return v; })(xs)))].join(" → ")}${end ? ` → ${right}` : ""}. A pipe runs top to bottom.`,
      };
    },
  },
  {
    id: "fold", ch: 2, name: "Fold order", about: "fold, foldr, foldl with strings and minus",
    make() {
      const xs = rlist(3, 1, 9);
      const [a, b, d] = xs;
      const kinds = [
        { src: `${showList(xs)}.fold "" (fun x acc => toString x ++ acc)`, v: `"${a}${b}${d}"`, why: `${c(`"${a}" ++ ("${b}" ++ ("${d}" ++ ""))`)}: the right fold puts each element in front of the result for the rest.` },
        { src: `${showList(xs)}.fold "" (fun x acc => acc ++ toString x)`, v: `"${d}${b}${a}"`, why: `The innermost combine (for ${d}) runs first and its result comes first: ${c(`(("" ++ "${d}") ++ "${b}") ++ "${a}"`)}.` },
        { src: `${showList(xs)}.foldl (fun acc x => acc ++ toString x) ""`, v: `"${a}${b}${d}"`, why: "foldl goes from the left with the accumulator first: the elements come out in order." },
        { src: `List.foldr (· - ·) 0 ${showList(xs)}  -- on Int`, v: String(a - (b - (d - 0))), why: `${c(`${a} - (${b} - (${d} - 0))`)}: foldr nests to the right.` },
        { src: `List.foldl (· - ·) 0 ${showList(xs)}  -- on Int`, v: String(((0 - a) - b) - d), why: `${c(`((0 - ${a}) - ${b}) - ${d}`)}: foldl nests to the left.` },
        { src: `${showList(xs)}.foldl (fun acc x => acc * 10 + x) 0`, v: String(a * 100 + b * 10 + d), why: "Each step shifts the digits so far left and adds the next one." },
      ];
      const k = pick(kinds);
      const wrong = [`"${a}${b}${d}"`, `"${d}${b}${a}"`, String(a - (b - d)), String(-(a + b + d)), String(a - b - d), String(d * 100 + b * 10 + a), String(a + b + d)].filter((w) => w !== k.v);
      return { q: code(`#eval ${k.src}`), opts: ppOpts(cc(k.v), shuffle(wrong).map(cc)), why: k.why };
    },
  },
  {
    id: "match", ch: 1, name: "Which pattern fits?", about: "match on lists, first match wins",
    make() {
      const xs = rlist(rint(0, 4), 1, 9);
      const fns = [
        { src: "match xs with\n| [] => 0\n| [x] => x\n| x :: y :: _ => x + y", f: (l) => (l.length === 0 ? 0 : l.length === 1 ? l[0] : l[0] + l[1]) },
        { src: "match xs with\n| _ :: _ :: z :: _ => z\n| x :: _ => x * 10\n| _ => 100", f: (l) => (l.length >= 3 ? l[2] : l.length ? l[0] * 10 : 100) },
        { src: "match xs with\n| x :: xs => x + xs.length\n| [] => 42", f: (l) => (l.length ? l[0] + l.length - 1 : 42) },
        { src: "match xs, xs.reverse with\n| x :: _, y :: _ => x * y\n| _, _ => 0", f: (l) => (l.length ? l[0] * l[l.length - 1] : 0) },
      ];
      const fn = pick(fns);
      const right = String(fn.f(xs));
      const others = fns.map((g) => String(g.f(xs)));
      return { q: `<p>${c(`xs = ${showList(xs)}`)}. What is the result?</p>${code(fn.src)}`, opts: ppOpts(cc(right), shuffle([...others, "0", "42", String(+right + 1), "100"]).map(cc)),
        why: `${showList(xs)} has ${xs.length} element${xs.length === 1 ? "" : "s"}; the patterns are tried top to bottom and the first one that fits decides.` };
    },
  },
  {
    id: "church", ch: 2, name: "Church encodings", about: "booleans and numerals in the λ-calculus",
    make() {
      const NAMES = ["zero", "one", "two", "three"];
      if (Math.random() < 0.4) {
        const b = () => pick(["true", "false"]);
        const [x, y] = [b(), b()];
        const ops = [[`and ${x} ${y}`, x === "true" && y === "true"], [`or ${x} ${y}`, x === "true" || y === "true"], [`not ${x}`, x !== "true"], [`not (and ${x} ${y})`, !(x === "true" && y === "true")]];
        const [t, v] = pick(ops);
        return { q: `<p>With the lecture's encoding (${c("true = λ t f. t")}, ${c("and b1 b2 = λ t f. b1 (b2 t f) f")} …), what does this reduce to?</p>${code(t)}`,
          opts: ppOpts(cc(v ? "λ t f. t  (true)" : "λ t f. f  (false)"), [cc(v ? "λ t f. f  (false)" : "λ t f. t  (true)"), cc("λ t f. t f"), cc("λ z s. s z  (one)")]),
          why: "A Church boolean chooses between its two arguments; work it out like the Bool it stands for." };
      }
      const m = rint(0, 3), n = rint(0, 3);
      const [t, v] = pick([[`add ${NAMES[m]} ${NAMES[n]}`, m + n], [`mul ${NAMES[m]} ${NAMES[n]}`, m * n], [`succ ${NAMES[m]}`, m + 1], [`succ (succ ${NAMES[n]})`, n + 2]]);
      const num = (k) => `λ z s. ${"s (".repeat(k)}z${")".repeat(k)}`.replace(/s \(z\)/, "s z");
      return { q: `<p>Numerals as in the lecture: ${c("zero = λ z s. z")}, ${c("succ n = λ z s. s (n z s)")}. What does this reduce to?</p>${code(t)}`,
        opts: ppOpts(cc(num(v)), [num(v + 1), num(Math.max(0, v - 1)), num(m * n === v ? m + n : m * n), num(v + 2)].map(cc)),
        why: `It's the numeral ${v}: s applied ${v} time${v === 1 ? "" : "s"} to z.` };
    },
  },
  {
    id: "scope", ch: 2, name: "Dynamic or lexical?", about: "what an interpreter returns with each scoping",
    make() {
      const a = rint(1, 9), b = rint(10, 30), k = rint(0, 5);
      const lex = Math.random() < 0.5;
      const right = lex ? a + k : b + k;
      return {
        q: `<p>What does the interpreter return with <b>${lex ? "lexical scoping (closures)" : "dynamic scoping (plain environment)"}</b>?</p>${code(`(λx. (λf. (λx. f ${k}) ${b}) (λy. x + y)) ${a}`)}`,
        opts: ppOpts(cc(right), [lex ? b + k : a + k, a + b, a + b + k, k].map(cc)),
        why: lex ? `The closure for ${c("λy. x + y")} keeps x ↦ ${a} from where it was made: ${a} + ${k}.` : `The body runs in the caller's environment, where the inner x ↦ ${b}: ${b} + ${k}.`,
      };
    },
  },
  {
    id: "option", ch: 4, name: "Option and Except", about: "where a do block stops",
    make() {
      const x = rint(0, 20), y = pick([0, rint(1, 5)]), z = pick([0, rint(1, 5)]);
      const div = (p, q) => (q === 0 ? null : Math.trunc(p / q));
      const e = Math.random() < 0.5;
      const a = div(x, y), bb = a === null ? null : div(y, z);
      const ok = a !== null && bb !== null;
      const right = ok ? (e ? `Except.ok ${a + bb}` : `some ${a + bb}`) : e ? `Except.error "division by zero: ${a === null ? `${x} / ${y}` : `${y} / ${z}`}"` : "none";
      const src = e
        ? `def safeDiv (a b : Int) : Except String Int :=\n  if b = 0 then throw s!"division by zero: {a} / {b}" else pure (a / b)\n\n#eval do\n  let a ← safeDiv ${x} ${y}\n  let b ← safeDiv ${y} ${z}\n  return a + b`
        : `def safeDiv (a b : Int) : Option Int :=\n  if b = 0 then none else some (a / b)\n\n#eval do\n  let a ← safeDiv ${x} ${y}\n  let b ← safeDiv ${y} ${z}\n  return a + b`;
      const wr = e ? [`Except.ok ${ok ? a + bb + 1 : 0}`, `Except.error "division by zero: ${y} / ${z}"`, `Except.error "division by zero: ${x} / ${y}"`, `Except.ok ${a ?? 0}`, `Except.ok ${x}`, `Except.ok ${x + y + z}`, `Except.ok 1`]
        : [`some ${ok ? a + bb + 1 : 0}`, "none", `some ${a ?? 0}`, `some 0`, `some ${x}`, `some ${x + y + z}`, `some 1`];
      return { q: code(src), opts: ppOpts(cc(right), wr.map(cc)),
        why: ok ? "Both divisions succeed; return wraps the sum." : `The ${a === null ? "first" : "second"} division is by 0; bind passes the failure on and skips the rest.` };
    },
  },
  {
    id: "state", ch: 4, name: "State programs", about: "get, set, modify, run",
    make() {
      const ops = Array.from({ length: rint(3, 5) }, () => pick(["tick", "tick", "double", "reset"]));
      const getAt = rint(1, ops.length - 1);
      let s = rint(0, 3);
      const s0 = s;
      let got;
      const lines = [];
      ops.forEach((o, i) => {
        if (i === getAt) { lines.push("let n ← get"); got = s; }
        lines.push(o);
        s = o === "tick" ? s + 1 : o === "double" ? s * 2 : 0;
      });
      return {
        q: `<p>${c("tick := modify (· + 1)")}, ${c("double := modify (· * 2)")}, ${c("reset := set 0")}. What does ${c(`prog.run ${s0}`)} give?</p>${code(`def prog : State Nat Nat := do\n  ${lines.join("\n  ")}\n  return n`)}`,
        opts: ppOpts(cc(`(${got}, ${s})`), [`(${s}, ${got})`, `(${s}, ${s})`, `(${got}, ${got})`, `(${got + 1}, ${s})`, `(${s0}, ${s})`, `(${got}, ${s + 1})`, `(0, ${s})`, `(${got}, 0)`].map(cc)),
        why: `get reads the state at that line (${got}); the final state after all lines is ${s}. run gives (result, final state).`,
      };
    },
  },
  {
    id: "stack", ch: 4, name: "Transformer stacks", about: "which result comes out, and in which shape",
    make() {
      const good = Math.random() < 0.3;
      const xs = rlist(4, 1, 9).map(String);
      const bad = good ? -1 : rint(1, 3);
      if (!good) xs[bad] = pick(["three", "x", "4a", ""]) || "x";
      const sumTo = (k) => xs.slice(0, k).reduce((a, x) => a + +x, 0);
      const total = sumTo(4);
      const se = Math.random() < 0.5;
      const msg = `"Invalid integer: ${xs[bad]}"`;
      const right = good ? (se ? `Except.ok ((), ${total})` : `(Except.ok (), ${total})`) : se ? `Except.error ${msg}` : `(Except.error ${msg}, ${sumTo(bad)})`;
      const wrong = good ? [`Except.ok ${total}`, `(Except.ok (), ${total})`, `Except.ok ((), ${total})`, `((), ${total})`]
        : [`Except.error ${msg}`, `(Except.error ${msg}, ${sumTo(bad)})`, `Except.ok ((), ${sumTo(bad)})`, `(Except.error ${msg}, 0)`, `Except.ok ((), ${xs.filter((x) => /^\d+$/.test(x)).reduce((a, x) => a + +x, 0)})`];
      return {
        q: `<p>${se ? c("abbrev M := StateT Int (Except String)") : c("abbrev M := ExceptT String (StateM Int)")}. Each input is parsed (throw on failure) and added to the state.</p>${code(`#eval processStrings [${xs.map((x) => `"${x}"`).join(", ")}] ${se ? "|>.run 0" : "|>.run |>.run 0"}`)}`,
        opts: ppOpts(cc(right), wrong.filter((w) => w !== right).map(cc)),
        why: se ? "StateT σ (Except ε): σ → Except ε (α × σ). An error leaves no state." : "ExceptT ε (State σ): σ → Except ε α × σ. The state up to the error survives.",
      };
    },
  },
  {
    id: "types", ch: 1, name: "What's the type?", about: "#check on everyday expressions",
    bank: [
      ["[1, 2, 3].map (· > 1)", "List Bool", ["List Nat", "Bool", "List (Nat → Bool)"]],
      ["fun (x : Nat) => [x, x]", "Nat → List Nat", ["List Nat", "Nat → Nat", "List (Nat → Nat)"]],
      ["List.filter", "(α → Bool) → List α → List α", ["(α → β) → List α → List β", "List α → List α", "(α → Bool) → List α → List Bool"]],
      ["[1, 2].find? (· > 5)", "Option Nat", ["Nat", "Bool", "List Nat"]],
      ["IO.println", "String → IO Unit", ["String → Unit", "IO String", "String → String"]],
      ["(3, \"a\")", "Nat × String", ["List (Nat ⊕ String)", "Nat → String", "String × Nat"]],
      ["List.foldr", "(α → β → β) → β → List α → β", ["(β → α → β) → β → List α → β", "(α → β) → List α → β", "β → (α → β → β) → List α → β"]],
      ["Except.ok 3", "Except ε Nat", ["Option Nat", "Except Nat ε", "Nat"]],
      ["pure 5 : List Nat", "List Nat  — the value [5]", ["Nat", "List (List Nat)", "IO Nat"]],
      ["fun x => x", "α → α", ["α", "Nat → Nat", "α → β"]],
      ["StateT.run (modify (· + 1) : StateT Nat Id Unit)", "Nat → Id (Unit × Nat)", ["Nat → Nat", "Unit × Nat", "Id Nat"]],
      ["Task.spawn (fun () => 1 + 1)", "Task Nat", ["IO Nat", "Nat", "IO (Task Nat)"]],
    ],
    make() {
      const [e, t, w] = pick(this.bank);
      return { q: code(`#check ${e}`), opts: ppOpts(cc(t), w.map(cc)), why: `${c(e)} : ${c(t)}.` };
    },
  },
  {
    id: "cx", ch: 3, name: "Running time", about: "O-notation for list functions",
    bank: [
      ["def rev : List α → List α\n| [] => []\n| x :: xs => rev xs ++ [x]", "O(n²)", ["O(n)", "O(log n)", "O(1)"], "n calls, each appending to a list of up to n elements."],
      ["def revTRAux : List α → List α → List α\n| [], acc => acc\n| x :: xs, acc => revTRAux xs (x :: acc)", "O(n)", ["O(n²)", "O(1)", "O(n log n)"], "One cons per element."],
      ["def app : List α → List α → List α\n| [], ys => ys\n| x :: xs, ys => x :: app xs ys", "O(|xs|)", ["O(|xs| + |ys|)", "O(|ys|)", "O(|xs| · |ys|)"], "Recursion only on the first list; ys is shared, not copied."],
      ["def enqueue (q : List α) (x : α) := q ++ [x]  -- n enqueues on []", "O(n²) in total", ["O(n) in total", "O(1) each", "O(log n) each"], "Each enqueue copies the queue: 0 + 1 + … + (n−1)."],
      ["BankersQueue: n enqueues, then n dequeue?", "O(n) in total", ["O(n²) in total", "O(n log n)", "O(1) in total"], "One reverse of n elements, then n cheap dequeues: O(1) amortised."],
      ["def len : List α → Nat\n| [] => 0\n| _ :: xs => 1 + len xs", "O(n) time, O(n) stack", ["O(n) time, O(1) stack", "O(n²) time", "O(1) time"], "Not tail-recursive: each call waits for the next."],
      ["def lenTRAux : List α → Nat → Nat\n| [], acc => acc\n| _ :: xs, acc => lenTRAux xs (acc + 1)", "O(n) time, O(1) stack", ["O(n) time, O(n) stack", "O(1) time", "O(n²) time"], "A tail call: the frame is reused."],
    ],
    make() {
      const [src, r, w, why] = pick(this.bank);
      return { q: `<p>How long does this take, for lists of length n?</p>${code(src)}`, opts: ppOpts(r, w), why };
    },
  },
  {
    id: "tail", ch: 3, name: "Tail call or not?", about: "spot the last thing a function does",
    make() {
      const all = [
        ["| x :: xs => go xs (acc + x)", true], ["| x :: xs => x + go xs", false], ["| x :: xs => go xs (x :: acc)", true], ["| x :: xs => x :: go xs", false],
        ["| x :: xs => if p x then go xs (acc + 1) else go xs acc", true], ["| x :: xs => go xs ++ [x]", false], ["| x :: xs => (go xs).max x", false], ["| _ :: xs => go xs acc", true],
      ];
      const yes = Math.random() < 0.5;
      const rights = all.filter(([, t]) => t === yes), wrongs = all.filter(([, t]) => t !== yes);
      const r = pick(rights);
      return { q: `<p>Which recursive case is ${yes ? "" : "<b>not</b> "}a tail call?</p>`, opts: ppOpts(cc(r[0]), shuffle(wrongs).slice(0, 3).map(([s]) => cc(s))),
        why: yes ? "There the call to go is the very last thing the case does; in the others something (+, ::, ++, max) still waits for its result." : "Something still has to happen after that call returns, so its frame must stay on the stack." };
    },
  },
];

/* ---------------------------------------------------------------- The page */

const ppPractice = { kind: "all", streak: 0, right: 0, total: 0 };

// The tasks of one part (the Lean ones have no part set).
const ppDrillsOf = (part) => PROPA_DRILLS.filter((d) => (d.part || "Lean") === part);

function renderPropaPractice() {
  const solved = store.get("propaSolved", {});
  $("#propa-practice").innerHTML = `
    <div class="card hero">
      <h1>Practice <span class="accent">tasks</span></h1>
      <p>Exam-style questions, made new each time: work out what the code gives before you look at the answers. Pick a kind of task or mix them.</p>
      <div class="pp-kinds">
        <button type="button" class="pp-kind ${ppPractice.kind === "all" ? "active" : ""}" data-kind="all"><b>Mixed: everything</b><span class="small muted">All ${PROPA_DRILLS.length} kinds</span></button>
        ${PROPA_PARTS.map(([part]) => `<button type="button" class="pp-kind ${ppPractice.kind === "all-" + part ? "active" : ""}" data-kind="all-${part}"><b>Mixed: ${part}</b><span class="small muted">${ppDrillsOf(part).length} kinds</span></button>`).join("")}
      </div>
      ${PROPA_PARTS.map(([part, title]) => `<h3 class="pp-kinds-h">${title}</h3><div class="pp-kinds">
        ${ppDrillsOf(part).map((d) => `<button type="button" class="pp-kind ${ppPractice.kind === d.id ? "active" : ""}" data-kind="${d.id}"><b>${d.name}</b><span class="small muted">${d.about} · ${solved[d.id] || 0}× right</span></button>`).join("")}
      </div>`).join("")}
    </div>
    <div class="card len-check pp-task" id="ppTask"></div>`;
  $$("#propa-practice [data-kind]").forEach((b) => (b.onclick = () => {
    ppPractice.kind = b.dataset.kind;
    $$("#propa-practice [data-kind]").forEach((x) => x.classList.toggle("active", x === b));
    ppNextTask();
  }));
  ppNextTask();
}

function ppNextTask() {
  const box = $("#ppTask");
  const k = ppPractice.kind;
  const d = k === "all" ? pick(PROPA_DRILLS) : k.startsWith("all-") ? pick(ppDrillsOf(k.slice(4))) : PROPA_DRILLS.find((x) => x.id === k);
  const t = d.make();
  track("propa.practice");
  const opts = shuffle(t.opts.map((o, i) => ({ o, right: i === 0 })));
  box.innerHTML = `
    <div class="card-head"><h3>${d.name}</h3><span class="small muted">${ppPractice.total ? `${ppPractice.right} / ${ppPractice.total} right this time${ppPractice.streak > 1 ? ` · ${ppPractice.streak} in a row` : ""}` : ""}</span></div>
    <div class="len-q">${t.q}</div>
    <div class="q-opts wide">${opts.map((o, j) => `<button class="q-opt" type="button" data-j="${j}">${o.o}</button>`).join("")}</div>
    <div class="q-feedback"></div>`;
  $$(".q-opt", box).forEach((b) => (b.onclick = () => {
    const ok = opts[+b.dataset.j].right;
    ppPractice.total++;
    if (ok) {
      ppPractice.right++;
      ppPractice.streak++;
      const all = store.get("propaSolved", {});
      store.set("propaSolved", { ...all, [d.id]: (all[d.id] || 0) + 1 });
    } else ppPractice.streak = 0;
    $$(".q-opt", box).forEach((o, j) => { o.disabled = true; if (opts[j].right) o.classList.add("right"); });
    if (!ok) b.classList.add("wrong");
    $(".q-feedback", box).innerHTML = `
      <div class="verdict ${ok ? "ok" : "bad"}">${ok ? "Right!" : "Not quite."}</div>
      <div class="pp-why">${t.why}</div>
      <div class="q-actions"><button class="btn primary" type="button">Next task →</button></div>`;
    $(".q-actions .btn", box).onclick = ppNextTask;
    $(".q-actions .btn", box).focus({ preventScroll: true });
  }));
}
