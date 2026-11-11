// ProPa Lean chapter 4, "Effects": Effectful/IO.lean, Monads.lean, MonadStepByStep.lean,
// Composition.lean, Shell/*.lean and Async/*.lean (lecture weeks 8–10).

/* ---------------------------------------------------------------- 4.1 parseArg */

// The lecture's argument parser, step by step: trimDash, then splitOn "=".
function ppParseArg(arg) {
  const lines = [];
  let trimmed;
  if (arg.startsWith("--")) { trimmed = arg.slice(2); lines.push(["trim", `starts with "--": return <b>"${ppEsc(trimmed)}"</b>`]); }
  else if (arg.startsWith("-")) { trimmed = arg.slice(1); lines.push(["trim", `starts with "-": return <b>"${ppEsc(trimmed)}"</b>`]); }
  else {
    lines.push(["throw", `no dash: <b>throw</b> — the rest of the do block doesn't run`]);
    return { lines, err: `${arg}, expected argument to start with '-' or '--'` };
  }
  const parts = trimmed.split("=");
  lines.push(["split", `splitOn "=" gives <b>[${parts.map((p) => `"${ppEsc(p)}"`).join(", ")}]</b>`]);
  if (parts.length === 1 && parts[0] === "") return { lines, err: `${trimmed}, got empty argument` };
  if (parts.length === 1) return { lines, ok: `Argument.flag "${trimmed}"` };
  if (parts.length === 2) return { lines, ok: `Argument.var "${parts[0]}" "${parts[1]}"` };
  return { lines, err: `${trimmed}, got too many '=': [${parts.map((p) => `"${p}"`).join(", ")}]` };
}

function ppArgs(root) {
  const { fig, read, w } = ppW(root, "args");
  const input = $(".pp-args-in", w);
  const draw = () => {
    const args = input.value.trim().split(/\s+/).filter(Boolean);
    let failed = null;
    const rows = [];
    for (const a of args) {
      const r = ppParseArg(a);
      rows.push({ a, r });
      if (r.err) { failed = r; break; }
    }
    const skipped = args.slice(rows.length);
    fig.innerHTML = `${code(`def parseArg (arg : String) : Except Error Argument := do
  let trimmed ← trimDash arg
  match trimmed.splitOn "=" with
  | [""] => throw (Error.argumentFormat s!"{trimmed}, got empty argument")
  | [name] => return Argument.flag name
  | [name, value] => return Argument.var name value
  | split => throw (Error.argumentFormat s!"{trimmed}, got too many '='")`)}
      <div class="pp-args">${rows.map(({ a, r }) => `
        <div class="pp-arg ${r.err ? "bad" : "ok"}"><b>"${ppEsc(a)}"</b><ol>${r.lines.map(([k, t]) => `<li class="${k}">${t}</li>`).join("")}</ol>
          <span class="pill ${r.err ? "bad" : "good"}">${r.err ? `Except.error (argumentFormat "${ppEsc(r.err)}")` : `Except.ok (${ppEsc(r.ok)})`}</span></div>`).join("")}
        ${skipped.map((a) => `<div class="pp-arg skip"><b>"${ppEsc(a)}"</b> <span class="small muted">not parsed: mapExcept stopped at the error</span></div>`).join("")}</div>`;
    const name = !failed && rows.map((x) => x.r.ok).find((o) => o && o.startsWith('Argument.var "name"'));
    read.innerHTML = !args.length ? `<p class="small muted">No arguments: main falls back to asking for the name.</p>`
      : failed ? `<p><span class="pill bad">parseArgs ⇒ Except.error</span></p><p class="small">main prints “Error parsing arguments: …”. One bad argument fails the whole list.</p>`
      : `<p><span class="pill good">parseArgs ⇒ Except.ok [${rows.length} argument${rows.length === 1 ? "" : "s"}]</span></p><p class="small">${name ? `main finds --name and prints <b>Hello ${ppEsc(name.match(/"name" "(.*)"/)[1])}!</b>` : "No --name=…: main asks “What is your name?” on stdin."}</p>`;
  };
  $$("[data-args]", w).forEach((b) => (b.onclick = () => { input.value = b.dataset.args; draw(); }));
  input.oninput = draw;
  draw();
}

/* ---------------------------------------------------------------- 4.2 Option chain and State */

const PP_COMPUTE_VIEWS = {
  do: `def compute (x y z : Int) : Option Int := do
  let a ← safeDiv x y
  let b ← safeDiv y z
  pure (a + b)`,
  bind: `def compute_desugared (x y z : Int) : Option Int :=
  safeDiv x y >>= fun a =>
  safeDiv y z >>= fun b =>
  pure (a + b)`,
  match: `def compute_normalized (x y z : Int) : Option Int :=
  match safeDiv x y with
  | some v1 =>
    match safeDiv y z with
    | some v2 => some (v1 + v2)
    | none => none
  | none => none`,
};

function ppCompute(root) {
  const { fig, read, w } = ppW(root, "opt");
  const st = { x: 10, y: 2, z: 5, view: "do" };
  const draw = () => {
    ["x", "y", "z"].forEach((k) => lenOut(w, k, st[k]));
    const div = (a, b) => (b === 0 ? null : Math.trunc(a / b));
    const a = div(st.x, st.y), b = a === null ? undefined : div(st.y, st.z);
    const rows = [
      [`safeDiv ${st.x} ${st.y}`, a === null ? "none" : `some ${a}`, a === null ? "stop" : "ok"],
      [`safeDiv ${st.y} ${st.z}`, b === undefined ? "not run" : b === null ? "none" : `some ${b}`, b === undefined ? "skip" : b === null ? "stop" : "ok"],
      [`pure (a + b)`, a !== null && b !== null && b !== undefined ? `some ${a + b}` : "not run", a !== null && b !== null && b !== undefined ? "ok" : "skip"],
    ];
    fig.innerHTML = `${code(PP_COMPUTE_VIEWS[st.view])}<div class="pp-chain">${rows.map(([e, v, k]) => `<div class="pp-link ${k}">${ppVal(e)}<span>⇒ ${v}</span></div>`).join("")}</div>`;
    const res = rows[2][2] === "ok" ? rows[2][1] : "none";
    read.innerHTML = `<p><span class="pill ${res === "none" ? "bad" : "good"}">compute ${st.x} ${st.y} ${st.z} ⇒ ${res}</span></p>
      <p class="small">${res === "none" ? "Option's bind: <b>none</b> skips everything after it." : "Each ← unwraps a <b>some</b> and hands the value on."}</p>
      <p class="small muted">${{ do: "do notation …", bind: "… is >>= with a lambda for the rest …", match: "… and with bind inlined it's nested matches." }[st.view]}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

const PP_TICKER = [
  ["tick", (s) => ({ ...s, n: s.n + 1 })], ["tick", (s) => ({ ...s, n: s.n + 1 })], ["let n1 ← get", (s) => ({ ...s, n1: s.n })],
  ["reset", (s) => ({ ...s, n: 0 })], ["[0:5].forM (fun _ => tick)", (s) => ({ ...s, n: s.n + 5 })], ["let n2 ← get", (s) => ({ ...s, n2: s.n })],
  ["reset", (s) => ({ ...s, n: 0 })], ["return (n1, n2)", (s) => ({ ...s, ret: true })],
];
function ppTicker(root) {
  const { fig, read, w } = ppW(root, "tick");
  let i = 0;
  const draw = () => {
    let s = { n: 0 };
    const states = [s];
    PP_TICKER.forEach(([, f]) => { s = f(s); states.push(s); });
    fig.innerHTML = `<div class="pp-tick">
      <div class="pp-tick-row head"><span>def ticker : State Nat (Nat × Nat) := do</span><span>state</span></div>
      ${PP_TICKER.map(([line], k) => `<div class="pp-tick-row ${k < i ? "past" : k === i ? "on" : ""}"><span>${ppVal("  " + line)}</span><span>${k < i ? `<b>${states[k + 1].n}</b>` : ""}</span></div>`).join("")}</div>`;
    const cur = states[i];
    read.innerHTML = `<div class="lw-vals"><span>state before this line</span><b>${cur.n}</b><span>n1</span><b>${cur.n1 ?? "–"}</b><span>n2</span><b>${cur.n2 ?? "–"}</b></div>
      ${i === PP_TICKER.length ? `<p><span class="pill good">ticker.run 0 ⇒ ((2, 5), 0)</span></p><p class="small muted">The result and the final state: State σ α is a function σ → α × σ.</p>`
        : `<p class="small">${i === 0 ? "No variable changes: bind passes the state from one line to the next." : PP_TICKER[i][0].startsWith("let") ? "get reads the state into a name." : ""}</p>`}`;
    $('[data-a="prev"]', w).disabled = i === 0;
    $('[data-a="next"]', w).disabled = i === PP_TICKER.length;
  };
  ppW(root, "tick").on("prev", () => { i--; draw(); });
  ppW(root, "tick").on("next", () => { i++; draw(); });
  draw();
}

/* ---------------------------------------------------------------- 4.3 Transformer stacks */

const PP_STACKS = {
  se: { name: "StateT Int (Except String)", layers: ["StateT Int", "Except String"], run: "processStrings xs |>.run 0", shape: "σ → Except ε (α × σ)" },
  es: { name: "ExceptT String (StateM Int)", layers: ["ExceptT String", "StateM Int"], run: "processStrings xs |>.run |>.run 0", shape: "σ → Except ε α × σ" },
  io: { name: "StateT Int (ExceptT String IO) + tryCatch", layers: ["StateT Int", "ExceptT String", "IO"], run: "processStrings xs |>.run 0 |>.run", shape: "σ → IO (Except ε (α × σ))" },
};

function ppStackRun(kind, xs) {
  let sum = 0;
  const log = [];
  for (const x of xs) {
    const n = /^-?\d+$/.test(x) ? +x : null;
    if (n === null) {
      const msg = `Invalid integer: ${x}`;
      if (kind === "io") { log.push(`Skipping erroneous input '${x}': ${msg}`); continue; }
      return kind === "se" ? { out: `Except.error "${msg}"`, lost: true, log } : { out: `(Except.error "${msg}", ${sum})`, log };
    }
    sum += n;
  }
  return { out: kind === "se" ? `Except.ok ((), ${sum})` : kind === "es" ? `(Except.ok (), ${sum})` : `Except.ok ((), ${sum})`, log };
}

function ppStacks(root) {
  const { fig, read, w } = ppW(root, "stk");
  const st = { k: "se" };
  const input = $(".pp-stk-in", w);
  const draw = () => {
    const S = PP_STACKS[st.k];
    const xs = input.value.split(",").map((s) => s.trim()).filter(Boolean);
    const r = ppStackRun(st.k, xs);
    const nest = (i) => (i === S.layers.length ? `<span class="pp-layer core">α</span>` : `<span class="pp-layer l${i}"><b>${S.layers[i]}</b>${nest(i + 1)}</span>`);
    fig.innerHTML = `<div class="pp-layers">${nest(0)}</div>
      ${code(`abbrev M := ${S.layers.length === 3 ? "StateT Int (ExceptT String IO)" : S.name}\n-- running it is a function: ${S.shape}\n#eval ${S.run.replace("xs", `[${xs.map((x) => `"${x}"`).join(", ")}]`)}`)}`;
    read.innerHTML = `${r.log.length ? `<div class="pp-console">${r.log.map((l) => `<div>${ppEsc(l)}</div>`).join("")}</div>` : ""}
      <p><span class="pill ${r.out.includes("error") ? "bad" : "good"}">⇒ ${ppEsc(r.out)}</span></p>
      <p class="small">${st.k === "se" ? (r.lost ? "The error is the <b>outer</b> result: the state (the sum so far) is <b>lost</b>." : "Success: the result and the final state.")
        : st.k === "es" ? (r.out.includes("error") ? "The state is the <b>outer</b> part: you get the error <b>and</b> the sum up to it." : "Success: Except.ok and the final state.")
        : "With IO underneath, tryCatch logs the bad input and carries on."}</p>`;
  };
  lenWire(w, st, draw);
  input.oninput = draw;
  $$("[data-stk]", w).forEach((b) => (b.onclick = () => { input.value = b.dataset.stk; draw(); }));
  draw();
}

/* ---------------------------------------------------------------- 4.4 Races and tasks */

// Two workers each do modify (· - 1) on a counter of 2: get, then set. Without a mutex any order goes.
function ppRace(root) {
  const { fig, read, w } = ppW(root, "race");
  const st = { mutex: 0 };
  let shared, local, done, log;
  const reset = () => { shared = 2; local = { A: null, B: null }; done = { A: 0, B: 0 }; log = []; };
  reset();
  const act = (who) => {
    if (st.mutex) {
      if (done[who] === 2) return;
      shared -= 1; done[who] = 2;
      log.push(`${who}: atomically (modify (· - 1)) → ${shared}`);
    } else if (done[who] === 0) { local[who] = shared; done[who] = 1; log.push(`${who}: get → reads ${shared}`); }
    else if (done[who] === 1) { shared = local[who] - 1; done[who] = 2; log.push(`${who}: set ${local[who]} - 1 → ${shared}`); }
  };
  const draw = () => {
    const finished = done.A === 2 && done.B === 2;
    const label = (who) => (st.mutex ? `${who}: atomically modify` : done[who] === 0 ? `${who}: get` : `${who}: set ${local[who] - 1}`);
    $$("[data-a='A'], [data-a='B']", w).forEach((b) => { b.innerHTML = label(b.dataset.a); b.disabled = done[b.dataset.a] === 2; });
    fig.innerHTML = `<div class="pp-race">
      <div class="pp-race-w ${done.A === 2 ? "done" : ""}"><b>Worker A</b><span>${local.A === null ? "" : `read ${local.A}`}</span></div>
      <div class="pp-race-mem ${st.mutex ? "locked" : ""}"><span class="small muted">active workers${st.mutex ? " (Std.Mutex)" : ""}</span><b>${shared}</b></div>
      <div class="pp-race-w ${done.B === 2 ? "done" : ""}"><b>Worker B</b><span>${local.B === null ? "" : `read ${local.B}`}</span></div></div>
      <ol class="pp-trace">${log.map((l) => `<li>${l}</li>`).join("")}</ol>`;
    read.innerHTML = !finished ? `<p class="small">Both workers finish and each lowers the count by one. Click their steps in any order.</p>`
      : shared === 0 ? `<p><span class="pill good">0 workers left — right</span></p><p class="small muted">${st.mutex ? "With the mutex no other worker can get in between." : "This order happened to work. Try A: get, B: get, then both sets."}</p>`
      : `<p><span class="pill bad">${shared} worker left — an update was lost</span></p><p class="small">Both read 2 before either wrote: a <b>race condition</b>. The IO worker would wait for ever.</p>`;
  };
  ppW(root, "race").on("A", () => { act("A"); draw(); });
  ppW(root, "race").on("B", () => { act("B"); draw(); });
  ppW(root, "race").on("reset", () => { reset(); draw(); });
  lenWire($(".pp-race-mode", w), st, () => { reset(); draw(); });
  draw();
}

// parfilter isPrime: tasks of uneven length on a few cores, against one after the other.
function ppTasks(root) {
  const { fig, read, w } = ppW(root, "tasks");
  const st = { cores: 4 };
  let jobs = [];
  const make = () => { jobs = Array.from({ length: 12 }, (_, i) => ({ i, cost: Math.random() < 0.3 ? rint(6, 10) : rint(1, 3) })); };
  make();
  const draw = () => {
    lenOut(w, "cores", st.cores);
    const free = Array(st.cores).fill(0), lanes = Array.from({ length: st.cores }, () => []);
    jobs.forEach((j) => { const c = free.indexOf(Math.min(...free)); lanes[c].push({ ...j, start: free[c] }); free[c] += j.cost; });
    const par = Math.max(...free), seq = jobs.reduce((a, j) => a + j.cost, 0);
    const scale = (t) => (t / seq) * 100;
    fig.innerHTML = `<div class="pp-gantt">
      <div class="pp-lane"><span class="pp-lane-l">sequential</span><span class="pp-lane-bar">${jobs.map((j) => `<span class="pp-job ${j.cost > 5 ? "long" : ""}" style="width:${scale(j.cost)}%" title="isPrime #${j.i + 1}"></span>`).join("")}</span></div>
      ${lanes.map((l, k) => `<div class="pp-lane"><span class="pp-lane-l">core ${k + 1}</span><span class="pp-lane-bar">${l.map((j) => `<span class="pp-job ${j.cost > 5 ? "long" : ""}" style="left:${scale(j.start)}%;width:${scale(j.cost)}%;position:absolute"></span>`).join("")}</span></div>`).join("")}</div>`;
    read.innerHTML = `<div class="lw-vals"><span>sequential time</span><b>${seq}</b><span>parallel time</span><b>${par}</b><span>speedup</span><b>${(seq / par).toFixed(1)}×</b></div>
      <p class="small muted">Long bars are numbers that turn out prime (checked all the way). A free core takes the next task, so uneven tasks still spread out.</p>`;
  };
  lenWire(w, st, draw);
  ppW(root, "tasks").on("new", () => { make(); draw(); });
  draw();
}

/* ---------------------------------------------------------------- The chapter */

PROPA_CHAPTERS.push({
  n: 4,
  part: "Lean",
  title: "Effects",
  next: "Parallel basics",
  headline: "IO, monads and <span class='accent'>concurrency</span>",
  intro: "Weeks 8–10: keeping effects apart from pure code, do notation and what it means, the Except, Option, List, Reader and State monads, stacking them with transformers, and threads without races.",
  sections: [
    /* ------------------------------------------------------------ 4.1 */
    {
      id: "4.1",
      title: "IO and do notation",
      short: "IO & do",
      about: "effects in the type, do, ← vs :=, Except for errors, mapM",
      html: () => `
        <div class="card">
          ${ppGist([
            `Effects show in the <b>type</b>: ${c("String → String")} is guaranteed pure, ${c("String → IO Unit")} may print. Pure code keeps <b>equational reasoning</b>: a call can be replaced by its value.`,
            `${c("do")} runs effectful steps in order. ${c("let x ← op")} runs an effect and binds its result; ${c("let x := e")} is a pure value. The last line is the result.`,
            `Errors without exceptions: ${c("Except ε α")} is ${c("ok")} or ${c("error")}. ${c("throw")} fails, ${c("return")} succeeds, and ${c("←")} passes a failure on.`,
            `${c("map")} can't take a function returning ${c("Except")}; ${c("mapExcept")} (in general ${c("List.mapM")}) stops at the first error.`,
          ])}
          ${codePair(code(`
            def greet (name : String) : IO Unit :=
              IO.println s!"Hello {name}!"

            def helloWorld := do
              IO.println "What is your name?"
              let stdin ← IO.getStdin
              let line ← stdin.getLine
              let name := line.trimAscii.toString
              greet name`, { title: "Hello world" }),
          code(`
            def List.mapExcept (f : α → Except ε β) (xs : List α)
                : Except ε (List β) := do
              match xs with
              | [] => return []
              | x :: xs' =>
                let y ← f x
                let ys ← mapExcept f xs'
                return y :: ys`, { title: "map, for functions that can fail" }))}
          ${ppSrc(["Functional/Effectful/IO.lean"])}
        </div>
        <div class="card">
          <h3>Parsing command-line arguments</h3>
          <p>Type arguments the way you'd pass them to ${c("lake exe io")}.</p>
          ${pw("args", `<div class="lw-row pp-lc-row"><input class="pp-args-in" type="text" value="--name=Ada -v" spellcheck="false" aria-label="Arguments"></div>
            <div class="lw-row">${[["--name=Ada -v", "--name=Ada -v"], ["-v name", "a missing dash"], ["--", "--"], ["--a=b=c", "--a=b=c"], ["", "none"]].map(([a, l]) => `<button class="btn small-btn" type="button" data-args="${a}">${l}</button>`).join("")}</div>`, { wide: true })}
          ${ppTraps([
            `${c("let line := stdin.getLine")} doesn't read a line: it names the <b>action</b>. You need ${c("←")}.`,
            `${c("←")} only works inside a ${c("do")} block of the same monad.`,
            `${c("Except")} is just an inductive type: ${c("match parseArgs args with | .ok cfg => … | .error e => …")} looks inside.`,
          ])}
        </div>`,
      setup: (root) => ppArgs(root),
      check: [
        { q: `Which type promises the function has no side effects?`,
          opts: [c("String → String"), c("String → IO String"), c("IO String"), c("String → IO Unit")], why: "Without IO (or another effect) in the type, Lean doesn't let it do any." },
        { q: `In a do block, ${c("let x ← e")} vs ${c("let x := e")}?`,
          opts: ["← runs the effect e and binds its result; := binds a pure value", "They are the same", ":= runs it twice", "← is for lists only"], why: "With := you'd bind the action itself, not what it produces." },
        { q: `${c("parseArgs [\"--a=1\", \"oops\", \"-v\"]")} gives?`,
          opts: ["An error for \"oops\" — \"-v\" is never parsed", "Two arguments and an error", "Three arguments", "A panic"], why: "mapExcept's ← passes the first error on and stops." },
        { q: `What is the result of a do block?`,
          opts: ["The result of its last line", "Unit always", "The first ← value", "A list of all results"], why: "Like any expression block, the last line gives the value." },
        { q: "Why isolate effects at all?",
          opts: ["Pure parts stay easy to test and reason about", "IO is slow", "Lean can't compile IO otherwise", "To use fewer types"], why: "Equational reasoning and property-based testing only work for pure code." },
      ],
    },

    /* ------------------------------------------------------------ 4.2 */
    {
      id: "4.2",
      title: "Monads",
      short: "Monads",
      about: "pure and bind, do desugaring, Except, Option, List, Reader, State",
      html: () => `
        <div class="card">
          ${ppGist([
            `A <b>monad</b> is a type operator ${c("m : Type → Type")} with ${c("pure : α → m α")} and ${c("bind : m α → (α → m β) → m β")} (written ${c(">>=")}).`,
            `${c("do")} is sugar for ${c(">>=")}: ${c("do let x ← m; rest")} = ${c("m >>= fun x => rest")}. Same do, different monad, different effect.`,
            `What <b>bind</b> does is the effect: Option/Except stop at a failure, List runs the rest for <b>every</b> element, Reader passes one environment along, State threads a state through.`,
            `Reader: ${c("ρ → α")}. State: ${c("σ → α × σ")}. They look imperative but are pure functions underneath.`,
          ])}
          ${codePair(code(`
            class MyMonad (m : Type → Type) where
              pure : α → m α
              bind : m α → (α → m β) → m β

            instance : Monad Option where
              pure x := some x
              bind x f := match x with
                | some v => f v
                | none => none`, { title: "Monad, and Option" }),
          code(`
            instance : Monad (Except ε) where
              pure x := Except.ok x
              bind x f := match x with
                | Except.ok v => f v
                | Except.error err => Except.error err

            instance : Monad List where
              pure x := [x]
              bind xs f := xs.flatMap f`, { title: "Except and List" }))}
          ${ppSrc(["Functional/Effectful/Monads.lean", "Functional/Effectful/MonadStepByStep.lean"])}
        </div>
        <div class="card">
          <h3>Short-circuiting with Option</h3>
          ${pw("opt", `${pslider("x", "x", -4, 12, 1, 10)}${pslider("y", "y", -4, 12, 1, 2)}${pslider("z", "z", -4, 12, 1, 5)}${pseg("view", [["do", "do"], ["bind", ">>="], ["match", "inlined"]], "do")}`)}
        </div>
        <div class="card">
          <h3>State, line by line</h3>
          ${codePair(code(`
            structure State (σ α : Type) where
              run : σ → (α × σ)

            instance : Monad (State σ) where
              pure x := ⟨fun s => (x, s)⟩
              bind m f := ⟨fun s =>
                let (v, s') := m.run s
                (f v).run s'⟩`),
          code(`
            def get : State σ σ := ⟨fun s => (s, s)⟩
            def set (s : σ) : State σ Unit := ⟨fun _ => ((), s)⟩
            def modify (f : σ → σ) : State σ Unit := do
              let s ← get
              set (f s)

            def tick : State Nat Unit := modify (· + 1)
            def reset : State Nat Unit := set 0`))}
          ${pw("tick", `<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>`)}
        </div>
        <div class="card">
          <h3>List and Reader</h3>
          ${codePair(code(`
            def pairs (xs : List α) (ys : List β) : List (α × β) := do
              let a ← xs
              let b ← ys
              return (a, b)

            #eval pairs [1, 2, 3] ["a", "b"]
            --= [(1, "a"), (1, "b"), (2, "a"), (2, "b"), (3, "a"), (3, "b")]`, { title: "List: nested loops" }),
          code(`
            def sendRequest (req : String) : Reader SessionID String := do
              let id ← read
              return s!"Sending request '{req}' with session ID '{id}'."

            def asAnonymous (f : Reader SessionID α) := withReader (fun _ => "") f`, { title: "Reader: one environment for all" }))}
          ${ppTraps([
            `In the List monad, ${c("guard (y > x)")} drops a combination (via ${c("Alternative")}) — like a filter in a comprehension.`,
            `${c("bind")}'s second argument is a <b>function</b>: the rest of the do block, waiting for the value.`,
            `${c("ticker.run 0")} gives a pair (result, final state), not just the result.`,
          ])}
        </div>`,
      setup: (root) => { ppCompute(root); ppTicker(root); },
      check: [
        { q: `${c("do let a ← m; f a")} desugars to?`,
          opts: [c("m >>= fun a => f a"), c("f (m a)"), c("pure m >>= f"), c("m >>= f >>= a")], why: "Each ← becomes a bind with a lambda for the rest." },
        { q: `${c("compute 10 0 5")} (with safeDiv) gives?`,
          opts: [c("none"), c("some 0"), c("some 2"), "a panic"], why: "The first safeDiv divides by 0, gives none, and Option's bind skips the rest." },
        { q: `${c("([1, 2] >>= fun x => [x, x * 10])")} in the List monad?`,
          opts: [c("[1, 10, 2, 20]"), c("[[1, 10], [2, 20]]"), c("[1, 2, 10, 20]"), c("[10, 20]")], why: "bind is flatMap: each element gives a list, and they are concatenated." },
        { q: `What is a value of ${c("State σ α")} really?`,
          opts: [`A function ${c("σ → α × σ")}`, "A mutable variable", "A pair of σ and α", "An IO action"], why: "It takes the state before and returns a result with the state after." },
        { q: `In ${c("Except")}, what does bind do with ${c("Except.error e")}?`,
          opts: ["Returns the error without running the rest", "Runs the rest with a default", "Throws a Lean exception", "Turns it into none"], why: "That's how one failing step fails the whole do block." },
      ],
    },

    /* ------------------------------------------------------------ 4.3 */
    {
      id: "4.3",
      title: "Monad transformers",
      short: "Transformers",
      about: "combining effects, StateT and ExceptT, order matters, lifting, effect classes",
      html: () => `
        <div class="card">
          ${ppGist([
            `Two monads don't mix: ${c("parseInt")} is in ${c("Except")}, ${c("runningSum")} in ${c("StateM")} — one do block can't use both.`,
            `By hand: ${c("ExceptStateM σ ε α := σ → Except ε (α × σ)")} plus its own Monad, throw, modify. Works, but it's boilerplate for every combination.`,
            `A <b>transformer</b> adds one effect on top of any monad ${c("m")}: ${c("StateT σ m α := σ → m (α × σ)")}, ${c("ExceptT ε m α := m (Except ε α)")}. Stack them: ${c("StateT Int (ExceptT String IO)")}.`,
            `The <b>order matters</b>, and operations of inner monads are <b>lifted</b> (${c("MonadLift")}).`,
          ])}
          ${codePair(code(`
            structure MyStateT (σ : Type) (m : Type → Type) (α : Type) where
              run : σ → m (α × σ)

            instance [Monad m] : Monad (MyStateT σ m) where
              pure a := ⟨fun s => pure (a, s)⟩    -- pure of m
              bind f g := ⟨fun s => do            -- bind of m
                let (a, s') ← f.run s
                (g a).run s'⟩`, { title: "StateT over any monad" }),
          code(`
            abbrev M := StateT Int (Except String)

            def parseInt (s : String) : M Int :=
              match s.toInt? with
              | some n => pure n
              | none => throw s!"Invalid integer: {s}"

            def processStrings (inputs : List String) : M Unit := do
              for input in inputs do
                let i ← parseInt input
                modify (· + i)`, { title: "Both effects in one do block" }))}
          ${ppSrc(["Functional/Effectful/Composition.lean", "Functional/Effectful/Shell/"])}
        </div>
        <div class="card">
          <h3>Order matters</h3>
          ${pw("stk", `${pseg("k", Object.entries(PP_STACKS).map(([k, s]) => [k, s.name]), "se")}
            <div class="lw-row pp-lc-row"><input class="pp-stk-in" type="text" value="1, 2, three, 4" spellcheck="false" aria-label="Inputs"></div>
            <div class="lw-row"><button class="btn small-btn" type="button" data-stk="1, 2, three, 4">with an error</button><button class="btn small-btn" type="button" data-stk="1, 2, 3, 4">all numbers</button></div>`, { wide: true })}
        </div>
        <div class="card">
          <h3>Lifting, and your own effects</h3>
          ${codePair(code(`
            class MyMonadLift (m : Type → Type) (n : Type → Type) where
              monadLift : {α : Type} → m α → n α

            instance [Monad m] : MonadLift m (MyStateT σ m) where
              monadLift ma := ⟨fun s => do
                let a ← ma
                pure (a, s)⟩`, { title: "Running an inner action in the stack" }),
          code(`
            class DirectoryEffects (m : Type → Type) where
              homeDir : m System.FilePath
              getCurrentDir : m System.FilePath
              changeDir : System.FilePath → m Unit

            def logErrors [Monad m] [ErrorEffects m] [LiftIO m]
                (f : m α) : m Unit := …`, { title: "The shell: effects as type classes" }))}
          ${ppTraps([
            `${c("StateT σ (Except ε)")}: an error throws the state away. ${c("ExceptT ε (State σ)")}: you keep the state up to the error.`,
            `In ${c("StateT σ (ExceptT ε IO)")}, ${c("IO.println")} has to be lifted twice — Lean does it for you with ${c("MonadLift")}.`,
            `${c(".run")} peels off one layer at a time, outermost first.`,
          ])}
        </div>`,
      setup: (root) => ppStacks(root),
      check: [
        { q: `${c("StateT Int (Except String) Unit")} unfolds to?`,
          opts: [c("Int → Except String (Unit × Int)"), c("Except String (Int → Unit × Int)"), c("Int → (Except String Unit) × Int"), c("Unit × Int")], why: "StateT σ m α = σ → m (α × σ), with m = Except String." },
        { q: `With ${c("StateT Int (Except String)")}, what does a parse error on the 3rd input give?`,
          opts: ["Just the error: the sum so far is lost", "The error and the sum so far", "The sum without the bad input", "A panic"], why: "Except is the outer result; the state lives inside the ok branch only." },
        { q: "What is a monad transformer?",
          opts: ["A type constructor that adds an effect to another monad m", "A function from one monad to another", "A monad with two binds", "A type class for IO"], why: "StateT σ m, ExceptT ε m … wrap any monad m." },
        { q: `Why does ${c("MyStateT")}'s bind use a ${c("do")} block?`,
          opts: ["It uses the bind of the inner monad m", "do is required in instances", "To run IO", "It doesn't"], why: "The state handling is StateT's, the sequencing of the inner effect is m's." },
        { q: `What does ${c("MonadLift m n")} provide?`,
          opts: ["A way to run an m action inside n", "A way to remove an effect", "Automatic error handling", "A second state"], why: "monadLift : m α → n α, e.g. IO actions inside StateT … IO." },
      ],
    },

    /* ------------------------------------------------------------ 4.4 */
    {
      id: "4.4",
      title: "Concurrency and parallelism",
      short: "Concurrency",
      about: "IO.asTask, Task.spawn, parmap, race conditions, Std.Mutex",
      html: () => `
        <div class="card">
          ${ppGist([
            `${c("IO.asTask f")} starts ${c("f")} in a new thread and returns at once: <b>asynchronous</b> work, e.g. a worker next to a UI.`,
            `${c("Task.spawn (fun () => f x)")} and ${c("t.get")} run <b>pure</b> work in parallel — no IO needed: ${c("parmap")}, ${c("parfilter")}.`,
            `Pure code shares nothing mutable, so it can't race. Shared state needs a ${c("Std.Mutex")} and ${c("atomically")}.`,
            `A <b>race condition</b>: ${c("modify (· - 1)")} is ${c("get")} then ${c("set")}; two threads can read the same value and one update is lost.`,
          ])}
          ${codePair(code(`
            def List.parmap (xs : List α) (f : α → β) : List β :=
              let tasks := xs.map $ fun x =>
                Task.spawn $ fun () => f x
              tasks.map $ fun t => t.get

            def List.parfilter (xs : List α) (p : α → Bool) : List α :=
              let tasks := xs.map $ fun x => (x, Task.spawn $ fun () => p x)
              tasks.filterMap $ fun (x, t) => if t.get then some x else none`, { title: "Parallel map and filter, purely" }),
          code(`
            def main_mutex : IO Unit := do
              let workers := 10
              let activeWorkers ← Std.Mutex.new workers
              for i in [0:workers] do
                let duration ← IO.rand 3000 7000
                async $ slowWorker i duration
                  (activeWorkers.atomically (modify (· - 1)))
              async $ ioWorker (activeWorkers.atomically get)`, { title: "Shared state behind a mutex" }))}
          ${ppSrc(["Functional/Async/Async.lean", "Functional/Async/Primes.lean"])}
        </div>
        <div class="card">
          <h3>Losing an update</h3>
          ${pw("race", `<div class="pp-race-mode">${pseg("mutex", [[0, "no mutex"], [1, "Std.Mutex"]], 0)}</div><div class="lw-row">${pbtn("A", "A: get", "primary")}${pbtn("B", "B: get", "primary")}</div>${pbtn("reset", "Start again")}`, { wide: true })}
        </div>
        <div class="card">
          <h3>Task parallelism</h3>
          ${pw("tasks", `${pslider("cores", "cores", 1, 8, 1, 4)}${pbtn("new", "New numbers")}`, { wide: true })}
          ${ppTraps([
            `${c("IO.asTask")} only works inside ${c("IO")}; ${c("Task.spawn")} is pure — use it for CPU work.`,
            `Lean may move pure code out of a ${c("do")} block, so timing it needs the ${c("asIO")} trick from the lecture.`,
            `${c("$")} is just application with low precedence: ${c("f $ g x")} = ${c("f (g x)")}.`,
          ])}
        </div>`,
      setup: (root) => { ppRace(root); ppTasks(root); },
      check: [
        { q: "Why can't pure parallel code have race conditions?",
          opts: ["There is no shared mutable state to race on", "Lean runs it on one core", "Tasks lock automatically", "It can"], why: "Each task only computes a value from its inputs." },
        { q: `Counter 2, two threads run ${c("modify (· - 1)")} without a mutex. Possible results?`,
          opts: ["0 or 1", "Only 0", "0, 1 or 2", "Only 1"], why: "If both get 2 before either sets, both write 1." },
        { q: `${c("IO.asTask f")} …`,
          opts: ["starts f in a new thread and returns right away", "runs f and waits for it", "runs f lazily on get", "is pure"], why: "It returns a task handle; the lecture's async ignores it." },
        { q: "Why is task parallelism a good fit for checking primes?",
          opts: ["The tasks take very different times, and free threads take the next one", "Primes are independent of each other", "It needs a mutex", "Each core gets the same number of numbers"], why: "1000000000 is quick (even), 1000000007 is slow (prime): fixed chunks would be uneven." },
        { q: `What does ${c("activeWorkers.atomically (modify (· - 1))")} guarantee?`,
          opts: ["The get and set run without another thread in between", "It runs faster", "It never blocks", "It runs on the main thread"], why: "The mutex makes the read-modify-write one step." },
      ],
    },
  ],
});
