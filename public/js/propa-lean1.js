// ProPa Lean chapter 1, "Basics": GettingStarted.lean, Employee/Data.lean, Employee/Bonus.lean and
// Recursion.lean (lecture weeks 0–2). Each section: the idea in short, the code, a drawing, traps, check.

/* ---------------------------------------------------------------- 1.1 Pipeline */

// The pipe from the first lecture, one stage at a time; each stage can be switched off.
function ppPipeline(root) {
  const { fig, read, w } = ppW(root, "pipe");
  const STAGES = [
    { src: "List.map (fun x => x * 2)", short: "double each", f: (v) => v.map((x) => x * 2), list: true },
    { src: "List.filter (fun x => x > 5)", short: "keep > 5", f: (v) => v.filter((x) => x > 5), list: true },
    { src: "List.sum", short: "add them up", f: (v) => v.reduce((a, b) => a + b, 0), list: true, toNum: true },
    { src: "add 3", short: "add 3", f: (v) => v + 3, num: true },
  ];
  const st = { xs: [1, 2, 3, 4, 5], on: [true, true, true, true] };
  const draw = () => {
    let v = st.xs, isList = true, err = "";
    const rows = [`<div class="pp-pipe-row start"><span class="pp-pipe-code">${ppVal(showList(st.xs))}</span><span class="pp-pipe-val">${ppVal(showList(v))}</span><span class="pp-pipe-ty t-ty">List Nat</span></div>`];
    STAGES.forEach((s, i) => {
      if (!st.on[i]) return;
      if (err) return;
      if (s.list && !isList) err = `<b>${s.src}</b> wants a list, but gets the number ${v}.`;
      else if (s.num && isList) err = `<b>${s.src}</b> wants a number, but gets the list ${showList(v)}: a type error.`;
      if (err) { rows.push(`<div class="pp-pipe-row bad"><span class="pp-pipe-code">${ppVal("|> " + s.src)}</span><span class="pp-pipe-err">✗ ${err}</span></div>`); return; }
      v = s.f(v);
      if (s.toNum) isList = false;
      rows.push(`<div class="pp-pipe-row"><span class="pp-pipe-code">${ppVal("|> " + s.src)}</span><span class="pp-pipe-val">${ppVal(isList ? showList(v) : String(v))}</span><span class="pp-pipe-ty t-ty">${isList ? "List Nat" : "Nat"}</span></div>`);
    });
    fig.innerHTML = `<div class="pp-pipe">${rows.join("")}</div>`;
    $$("[data-a^='st']", w).forEach((b) => b.classList.toggle("ok", st.on[+b.dataset.a.slice(2)]));
    read.innerHTML = err
      ? `<p><span class="pill bad">does not type-check</span></p><p class="small">Lean checks the types of the whole chain before running anything.</p>`
      : `<p><span class="pill good">#eval ⇒ ${isList ? showList(v) : v}</span></p><p class="small muted">${c("x |> f |> g")} is ${c("g (f x)")}: read it top to bottom.</p>`;
  };
  STAGES.forEach((s, i) => ppW(root, "pipe").on("st" + i, () => { st.on[i] = !st.on[i]; draw(); }));
  ppW(root, "pipe").on("new", () => { st.xs = rlist(5, 0, 6); draw(); });
  draw();
}

/* ---------------------------------------------------------------- 1.2 Constructors */

// Build a Department value and see its constructor tree and what a match on it gives.
function ppDepartment(root) {
  const { fig, read, w } = ppW(root, "dept");
  const UNITS = { Engineering: ["EngineeringUnit", ["Backend", "Frontend", "DevOps"]], Sales: ["SalesUnit", ["Internal", "External"]], Marketing: null };
  const RATE = { Engineering: "0.10", Sales: "0.08", Marketing: "0.03" };
  const st = { d: "Engineering", u: "Backend" };
  const unitRow = $(".pp-dept-units", w);
  const draw = () => {
    const unit = UNITS[st.d];
    if (unit && !unit[1].includes(st.u)) st.u = unit[1][0];
    unitRow.innerHTML = unit ? pseg("u", unit[1].map((u) => [u, u]), st.u) : `<span class="small muted">Marketing takes no argument.</span>`;
    lenWire(unitRow, st, draw);
    const val = unit ? `Department.${st.d} ${unit[0]}.${st.u}` : "Department.Marketing";
    fig.innerHTML = `
      <div class="pp-tree">
        <div class="pp-tnode ty"><span class="t-ty">Department</span><small>type</small></div>
        <div class="pp-tdown"></div>
        <div class="pp-tnode on"><span>${st.d}</span><small>constructor${unit ? ` (unit : ${unit[0]})` : ""}</small></div>
        ${unit ? `<div class="pp-tdown"></div><div class="pp-tnode on"><span>${st.u}</span><small>constructor of <span class="t-ty">${unit[0]}</span></small></div>` : ""}
      </div>
      <div class="pp-spell">
        <div><span class="small muted">qualified</span>${ppVal(val)}</div>
        <div><span class="small muted">after open Department ${unit ? unit[0] : ""}</span>${ppVal(unit ? `${st.d} ${st.u}` : "Marketing")}</div>
        <div><span class="small muted">leading dot (type known)</span>${ppVal(unit ? `.${st.d} .${st.u}` : ".Marketing")}</div>
      </div>`;
    read.innerHTML = `${code(`
      match dept with
      | Department.Engineering _ => 0.10
      | Department.Sales _ => 0.08
      | Department.Marketing => 0.03`, { title: "bonusDistribution dept" })}
      <p><span class="pill good">⇒ ${RATE[st.d]}</span> <span class="small muted">The <b>_</b> ignores the unit.</span></p>`;
    $$(".pp-code pre", read).forEach((p) => p.innerHTML = p.innerHTML.replace(new RegExp(`(<span class="t-op">\\|</span> <span class="t-ty">Department.${st.d}</span>[^\\n]*)`), `<mark class="pp-hl">$1</mark>`));
  };
  lenWire($(".pp-dept-top", w), st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.3 Pattern matcher */

// Patterns on lists, tried top to bottom. A pattern: heads (names or _) and a tail ("[]" or a name/_).
const PP_MATCH_FNS = {
  firstThree: {
    sig: "def List.firstThree? (l : List α) : Option (α × α × α) :=\n  match l with",
    rows: [[[], "[]", "none"], [["_"], "[]", "none"], [["_", "_"], "[]", "none"], [["x", "y", "z"], "_", "some (x, y, z)"]],
  },
  third: {
    sig: "def List.third? (l : List α) : Option α :=\n  match l with",
    rows: [[["_", "_", "z"], "_", "some z"], [null, "_", "none"]],
  },
  wrong: {
    sig: "def List.third? (l : List α) : Option α :=\n  match l with   -- wrong order!",
    rows: [[null, "_", "none"], [["_", "_", "z"], "_", "some z"]],
  },
  sum: {
    sig: "def sum (l : List Nat) : Nat :=\n  match l with",
    rows: [[[], "[]", "0"], [["hd"], "tl", "hd + sum tl"]],
  },
};
const ppPatSrc = (heads, tail) => heads === null ? "_" : heads.length === 0 ? "[]" : `${heads.join(" :: ")} :: ${tail}`;

function ppMatcher(root) {
  const { fig, read } = ppW(root, "match");
  const st = { fn: "firstThree", n: 2 };
  const draw = () => {
    const xs = [7, 8, 9, 10].slice(0, st.n);
    const fn = PP_MATCH_FNS[st.fn];
    let found = -1, binds = "";
    const rows = fn.rows.map(([heads, tail, rhs], i) => {
      let state = "skip";
      if (found < 0) {
        const ok = heads === null || (tail === "[]" ? xs.length === heads.length : xs.length >= heads.length);
        state = ok ? "hit" : "miss";
        if (ok) {
          found = i;
          const b = [];
          (heads || []).forEach((h, j) => h !== "_" && b.push(`${h} = ${xs[j]}`));
          if (heads && tail !== "_" && tail !== "[]") b.push(`${tail} = ${showList(xs.slice(heads.length))}`);
          binds = b.join(", ");
        }
      } else state = st.fn === "wrong" ? "dead" : "skip";
      return `<div class="pp-mrow ${state}"><span class="pp-mstate">${{ hit: "✓", miss: "✗", skip: "·", dead: "!" }[state]}</span>${ppVal(`| ${ppPatSrc(heads, tail)} => ${rhs}`)}</div>`;
    });
    fig.innerHTML = `${code(fn.sig)}<div class="pp-mrows">${rows.join("")}</div>`;
    const rhs = fn.rows[found][2];
    let result = rhs;
    if (st.fn === "firstThree" && found === 3) result = `some (${xs[0]}, ${xs[1]}, ${xs[2]})`;
    if (st.fn !== "firstThree" && rhs === "some z") result = `some ${xs[2]}`;
    if (st.fn === "sum" && found === 1) result = `${xs[0]} + sum ${showList(xs.slice(1))}`;
    read.innerHTML = `
      <p>Input ${ppVal(showList(xs))}</p>
      <p>Pattern ${found + 1} matches${binds ? `, binding <b>${binds}</b>` : ""}.</p>
      <p><span class="pill good">⇒ ${result}</span></p>
      ${st.fn === "wrong" ? `<p class="small pp-bad-note">The first pattern <b>_</b> matches everything, so the second can never be reached. Lean rejects this with “redundant alternative”.</p>` : `<p class="small muted">Rows after the match are not even looked at.</p>`}`;
  };
  lenWire($("[data-w='match']", root), st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.4 Cons cells and evaluation */

function consSVG(xs, hl = -1) {
  const W = 74, gap = 26, h = 40;
  const width = xs.length * (W + gap) + 56;
  let s = "";
  xs.forEach((x, i) => {
    const x0 = 4 + i * (W + gap);
    s += `<g class="pp-cons ${i === hl ? "on" : ""}"><rect x="${x0}" y="10" width="${W}" height="${h}" rx="6"/><line x1="${x0 + W / 2}" y1="10" x2="${x0 + W / 2}" y2="${10 + h}"/>` +
      `<text x="${x0 + W / 4}" y="36" text-anchor="middle" class="pp-cons-v">${x}</text><circle cx="${x0 + (3 * W) / 4}" cy="30" r="4"/></g>` +
      arrowSVG(x0 + (3 * W) / 4 + 4, 30, x0 + W + gap - 2, 30, "ax", 2, 8);
  });
  const xn = 4 + xs.length * (W + gap);
  s += `<g class="pp-cons nil ${hl === xs.length ? "on" : ""}"><rect x="${xn}" y="14" width="46" height="32" rx="6"/><text x="${xn + 23}" y="35" text-anchor="middle">nil</text></g>`;
  s += xs.length ? `<text x="${4 + W / 4}" y="66" text-anchor="middle" class="cap">hd</text><text x="${4 + (3 * W) / 4}" y="66" text-anchor="middle" class="cap">tail</text>` : "";
  return `<svg class="lw-svg pp-cons-svg" viewBox="0 0 ${width} 72" role="img" aria-label="List as cons cells">${s}</svg>`;
}

// The steps of evaluating sum / length on a list, as the lecture writes them out.
function ppEvalSteps(fn, xs) {
  const arg = (ys) => (ys.length ? `(${ys.join(" :: ")} :: [])` : "[]");
  const vals = xs.map((x) => (fn === "sum" ? x : 1));
  // v₁ + (v₂ + (… + inner)), with brackets only around sums.
  const wrap = (vs, inner) => vs.reduceRight((acc, v) => `${v} + ${/\+/.test(acc) ? `(${acc})` : acc}`, inner);
  const steps = [];
  for (let i = 0; i <= xs.length; i++) steps.push({ t: wrap(vals.slice(0, i), `${fn} ${arg(xs.slice(i))}`), cell: i, phase: "down" });
  steps.push({ t: wrap(vals, "0"), cell: xs.length, phase: "base" });
  for (let k = xs.length - 1; k >= 0; k--) {
    const inner = vals.slice(k).reduce((a, b) => a + b, 0);
    steps.push({ t: wrap(vals.slice(0, k), String(inner)), cell: k, phase: "up" });
  }
  return steps;
}

function ppConsEval(root) {
  const { fig, read, w } = ppW(root, "cons");
  const st = { fn: "sum", xs: [1, 2, 3], i: 0 };
  const draw = () => {
    const steps = ppEvalSteps(st.fn, st.xs);
    st.i = Math.min(st.i, steps.length - 1);
    const s = steps[st.i];
    fig.innerHTML = consSVG(st.xs, s.cell) + `<div class="pp-steps">${steps.map((x, i) =>
      `<div class="pp-step ${i === st.i ? "on" : i < st.i ? "past" : "future"}">${i === 0 ? "&nbsp;&nbsp;" : "="} ${ppVal(x.t)}</div>`).join("")}</div>`;
    read.innerHTML = `<p class="small">${{
      down: st.i === 0 ? "Start: the list is a chain of <b>cons</b> cells ending in <b>nil</b>." : "Recursive case: take the head, call the function on the <b>tail</b>. The work waits until the call returns.",
      base: "Base case: <b>[]</b> gives " + c("0") + ". Now the waiting additions can run.",
      up: "Each waiting addition gets the result from its tail.",
    }[s.phase]}</p><p class="small muted">Step ${st.i + 1} / ${steps.length}. Every call goes one cell further: that is <b>structural recursion</b>.</p>`;
    $('[data-a="prev"]', w).disabled = st.i === 0;
    $('[data-a="next"]', w).disabled = st.i === steps.length - 1;
  };
  const h = ppW(root, "cons");
  h.on("prev", () => { st.i--; draw(); });
  h.on("next", () => { st.i++; draw(); });
  h.on("new", () => { st.xs = rlist(rint(1, 4), 1, 9); st.i = 0; draw(); });
  lenWire($(".lw-ctrl", w), st, () => { st.i = 0; draw(); });
  draw();
}

// Quicksort's calls as a tree: each call works on a list that is new, not a tail of its input.
function ppQuicksort(root) {
  const { fig, read } = ppW(root, "qs");
  let xs = [3, 6, 1, 8, 2, 9, 4];
  const build = (ys) => {
    if (!ys.length) return null;
    const [p, ...t] = ys;
    return { ys, p, l: build(t.filter((x) => x < p)), r: build(t.filter((x) => x >= p)) };
  };
  let calls = 0;
  const html = (n) => {
    calls++;
    if (!n) return `<div class="pp-qs-node leaf"><span class="pp-qs-list">[]</span></div>`;
    return `<div class="pp-qs-node"><span class="pp-qs-list">[<b class="pp-qs-p">${n.p}</b>${n.ys.slice(1).map((x) => `, <span class="${x < n.p ? "pp-qs-lt" : "pp-qs-ge"}">${x}</span>`).join("")}]</span>
      <div class="pp-qs-kids">${html(n.l)}${html(n.r)}</div></div>`;
  };
  const draw = () => {
    calls = 0;
    fig.innerHTML = `<div class="pp-qs">${html(build(xs))}</div>`;
    const sorted = [...xs].sort((a, b) => a - b);
    read.innerHTML = `<p><span class="pill good">⇒ ${showList(sorted)}</span></p>
      <p class="small"><b class="pp-qs-p">pivot</b>, <span class="pp-qs-lt">less</span> go left, <span class="pp-qs-ge">greater or equal</span> go right. ${calls} calls.</p>
      <p class="small muted">The lists in the calls are made by <b>partition</b> — they aren't parts of the input. So Lean can't see it ends: <b>partial def</b>.</p>`;
  };
  ppW(root, "qs").on("new", () => { xs = rlist(rint(5, 8), 1, 9); draw(); });
  draw();
}

/* ---------------------------------------------------------------- The chapter */

PROPA_CHAPTERS.push({
  n: 1,
  part: "Lean",
  title: "Basics",
  next: "Functions as values",
  headline: "Expressions, data and <span class='accent'>recursion</span>",
  intro: "Weeks 0–2: functions and expressions, modelling data with inductive types and structures, pattern matching, and structural vs generative recursion.",
  sections: [
    /* ------------------------------------------------------------ 1.1 */
    {
      id: "1.1",
      title: "Expressions and functions",
      short: "Expressions",
      about: "def, application, lists, pipes, if, let, #eval, #assert, purity",
      html: () => `
        <div class="card">
          ${ppGist([
            `A program is made of <b>expressions</b>, and every expression has a <b>value</b> — even ${c("if")} and ${c("let")}. There are no statements.`,
            `Functions are <b>pure</b>: the result depends only on the arguments. No printing, no changing variables.`,
            `Arguments go after the function, separated by <b>spaces</b>: ${c("add 5 10")}. ${c("(10, 20)")} is one tuple, not two arguments.`,
            `${c("let")} names a value; it can never be changed.`,
          ])}
          ${codePair(code(`
            def zero : Int := 0
            def add (x y : Int) : Int := x + y

            #eval add 5 10            --= 15
            #eval add (2 * 3) (4 * 5) --= 26
            -- #eval add (10, 20)     -- type error: one tuple`, { title: "Functions" }),
          code(`
            def absolute (x : Int) : Nat :=
              if x < 0 then (-x).toNat else x.toNat

            #assert (absolute (-7)) == 7

            def signAndParity3 (x : Int) : String :=
              let sign := if x < 0 then "negative"
                          else if x == 0 then "zero" else "positive"
              let parity := parityToString x
              sign ++ " " ++ parity`, { title: "if and let are expressions" }))}
          ${ppSrc(["Functional/GettingStarted.lean"])}
        </div>
        <div class="card">
          <h3>Pipes</h3>
          <p>${c("x |> f")} means ${c("f x")}. A chain reads top to bottom, each line taking the value above it. Switch stages off to see what each one does — and what happens when the types no longer fit.</p>
          ${pw("pipe", `<div class="lw-row">${pbtn("st0", "map (· * 2)")}${pbtn("st1", "filter (· > 5)")}</div><div class="lw-row">${pbtn("st2", "sum")}${pbtn("st3", "add 3")}</div>${pbtn("new", "New list")}`)}
          ${ppFacts([
            ["Nat vs Int", `${c("Nat")} is 0, 1, 2, … and ${c("Int")} can be negative. ${c("(5 : Nat) - 7")} is ${c("0")}, not −2.`],
            ["#eval / #check / #assert", "Show a value / show a type / fail if the test is false."],
            ["expression language", `Since ${c("if")} gives a value, it can go anywhere a value can: ${c("add (if b then 1 else 2) 3")}.`],
          ])}
          ${ppTraps([
            `${c("if")} without ${c("else")} doesn't exist in pure code — the expression needs a value either way.`,
            `${c("add 2 * 3")} is ${c("(add 2) * 3")}: application binds tighter than any operator.`,
            `${c("[\"a\"] ++ [3]")} is a type error: all elements of a list have the same type.`,
          ])}
        </div>`,
      setup: (root) => ppPipeline(root),
      check: [
        { q: `What does ${c("#eval [1, 2, 3] |> List.map (· + 1) |> List.sum")} print?`,
          opts: ["9", "6", "[2, 3, 4]", "a type error"], why: `map gives ${c("[2, 3, 4]")}, sum adds them up: 9.` },
        { q: `Why must every ${c("if")} have an ${c("else")}?`,
          opts: ["It is an expression and must give a value in both cases", "Lean can't parse it otherwise", "Only when the condition is a Bool", "It doesn't have to"],
          why: "In an expression language everything gives a value; without else there would be none when the condition is false." },
        { q: `${c("def add (x y : Int) : Int := x + y")}. Which call is right?`,
          opts: [c("add 10 20"), c("add(10, 20)"), c("add (10, 20)"), c("add [10, 20]")], why: `Arguments go by spaces. ${c("(10, 20)")} is one value of type ${c("Int × Int")}.` },
        { q: `What is ${c("#eval let a := 3 * 7; add a a")}?`,
          opts: ["42", "21", "a type error", "441"], why: `${c("a")} is 21 everywhere in the body, so 21 + 21.` },
        { q: "What makes a function pure?",
          opts: ["Its result depends only on its arguments and it has no side effects", "It has no parameters", "It uses no if", "It is defined with def"],
          why: "Same input, same output, and nothing else happens — which is why you can replace a call by its result." },
      ],
    },

    /* ------------------------------------------------------------ 1.2 */
    {
      id: "1.2",
      title: "Modelling data",
      short: "Data types",
      about: "inductive types, constructors, structures, deriving, namespaces",
      html: () => `
        <div class="card">
          ${ppGist([
            `An <b>inductive type</b> lists its <b>constructors</b>: the only ways to make a value. Like an enum, but a constructor can carry data.`,
            `A <b>structure</b> is a record with named fields — no methods.`,
            `${c("deriving Repr, BEq")} gives printing (${c("#eval")}) and ${c("==")} for free.`,
            `Constructors live in their type's <b>namespace</b>: ${c("Department.Marketing")}. ${c("open")} lets you drop the prefix, a <b>leading dot</b> works when the type is known.`,
          ])}
          ${codePair(code(`
            inductive EngineeringUnit where
            | Backend
            | Frontend
            | DevOps
            deriving Repr, BEq

            inductive Department where
            | Engineering (unit : EngineeringUnit)
            | Sales (unit : SalesUnit)
            | Marketing
            deriving Repr, BEq`, { title: "Inductive types" }),
          code(`
            structure Employee where
              id : Nat
              name : String
              salary : Float
              dept : Department
              seniority : SeniorityLevel
              tenure : Nat
              deriving Repr, BEq`, { title: "A structure" }))}
          ${ppSrc(["Functional/Employee/Data.lean", "Functional/Employee/Bonus.lean"])}
        </div>
        <div class="card">
          <h3>Building a value</h3>
          <p>Pick a constructor. The value is a small tree: the type, the constructor, and the constructor's data.</p>
          ${pw("dept", `<div class="pp-dept-top">${pseg("d", [["Engineering", "Engineering"], ["Sales", "Sales"], ["Marketing", "Marketing"]], "Engineering")}</div><div class="pp-dept-units"></div>`)}
        </div>
        <div class="card">
          <h3>Three ways to make a structure</h3>
          ${code(`
            def alice := Employee.mk 1 "Alice" 80000 (Engineering Backend) Senior 5

            def bob : Employee := ⟨2, "Bob", 60000, (Sales Internal), Junior, 2⟩

            def carol : Employee := {
              id := 3, name := "Carol", salary := 90000
              dept := Engineering Frontend, seniority := Lead, tenure := 7 }

            #eval alice.name          --= "Alice"
            #eval Employee.name bob   --= "Bob"`)}
          ${ppFacts([
            [c("Employee.mk …"), "The constructor every structure gets: fields in order."],
            [c("⟨…⟩"), "The same, when Lean knows the type (here from the annotation)."],
            [c("{ name := … }"), "By field name, in any order. Clearest for big records."],
          ])}
          ${ppTraps([
            `Without ${c("deriving BEq")}, ${c("==")} on your type is an error; without ${c("Repr")}, ${c("#eval")} can't print it.`,
            `${c("⟨…⟩")} needs a known type: ${c("def bob := ⟨2, …⟩")} alone doesn't work.`,
          ])}
        </div>`,
      setup: (root) => ppDepartment(root),
      check: [
        { q: `How many different values does ${c("Department")} have (with the units above)?`,
          opts: ["6", "3", "5", "Infinitely many"], why: "Engineering × 3 units + Sales × 2 units + Marketing = 6." },
        { q: `What does ${c("deriving BEq")} give you?`,
          opts: [`${c("==")} on the type`, `printing with ${c("#eval")}`, "an order (<)", "a hash"], why: `BEq is boolean equality. Printing is Repr, order is Ord.` },
        { q: "What do structures not have, unlike Java classes?",
          opts: ["Methods", "Fields", "Types for fields", "A constructor"], why: "A structure only groups data. Functions on it are defined separately (and can use dot notation)." },
        { q: `After ${c("open Department EngineeringUnit")}, which is the same as ${c("Department.Engineering EngineeringUnit.Backend")}?`,
          opts: [c("Engineering Backend"), c("Backend.Engineering"), c("Department Backend"), c("Engineering.Backend")], why: "open brings the constructors into scope without their prefix." },
        { q: `${c("def bob : Employee := ⟨2, \"Bob\", 60000, Sales Internal, Junior, 2⟩")}. Why the type annotation?`,
          opts: ["⟨…⟩ only works when Lean knows which structure to build", "Every def needs a type", "To make the fields public", "Otherwise salary would be a Nat"],
          why: "The anonymous constructor has no type name in it, so the type must come from the context." },
      ],
    },

    /* ------------------------------------------------------------ 1.3 */
    {
      id: "1.3",
      title: "Pattern matching",
      short: "Matching",
      about: "match, order of patterns, wildcards, nested patterns, Option, find?/filter/map",
      html: () => `
        <div class="card">
          ${ppGist([
            `${c("match v with | p₁ => r₁ | p₂ => r₂")} tries the patterns <b>top to bottom</b> and takes the <b>first</b> that fits.`,
            `A pattern takes a value apart by its constructors and <b>binds names</b> to the parts. ${c("_")} matches anything and binds nothing.`,
            `Patterns can be nested (${c("x :: y :: z :: _")}) and can match several values at once (${c("match b1, b2 with")}).`,
            `A function that has no good answer for some input (the head of ${c("[]")}) returns an ${c("Option")}: ${c("some x")} or ${c("none")}. That keeps it <b>total</b>.`,
          ])}
          ${codePair(code(`
            def seniorityBonus3 (e : Employee) : Float :=
              let rate := match e.seniority with
                | Manager => 0.05
                | Director => 0.15
                | Board => 0.40
                | _ => 0
              rate * e.salary`, { title: "Instead of if-else chains" }),
          code(`
            def Bool.xor (b1 b2 : Bool) : Bool :=
              match b1, b2 with
              | true, true => false
              | true, false => true
              | false, true => true
              | false, false => false`, { title: "Two values at once" }))}
          ${ppSrc(["Functional/Employee/Bonus.lean", "Functional/Recursion.lean"])}
        </div>
        <div class="card">
          <h3>Which pattern fits?</h3>
          <p>Pick a function and a list. ✓ is the pattern that matches, ✗ the ones tried before it.</p>
          ${pw("match", `${pseg("fn", [["firstThree", "firstThree?"], ["third", "third?"], ["wrong", "third? (wrong order)"], ["sum", "sum"]], "firstThree")}
            ${pseg("n", [[0, "[]"], [1, "[7]"], [2, "[7, 8]"], [3, "[7, 8, 9]"], [4, "[7, 8, 9, 10]"]], 2)}`)}
        </div>
        <div class="card">
          <h3>Lists without writing recursion: find?, filter, map</h3>
          ${code(`
            #eval employees.find? (fun e => e.salary > 80000)  --= some carol
            #eval employees.filter (fun e => e.salary > 80000) --= [carol, david, eve]
            #eval employees.map (fun e => e.name)              --= ["Alice", "Bob", …]

            def isDepartmentProfitable (d : Department) (r : YearlyReport) : Bool :=
              r.deptPerformance.find? (fun p => p.dept == d && p.profitable) |> Option.isSome`)}
          ${ppTraps([
            `A ${c("_")} first catches everything below it: Lean reports a <b>redundant alternative</b>.`,
            `Missing a case (no pattern for ${c("[]")}) is an error too: matches must be <b>exhaustive</b>.`,
            `${c("sorry")} makes the code compile but is a hole, not an answer.`,
            `${c("find?")} returns an ${c("Option")}, not the element: use ${c("match")} or ${c("isSome")}.`,
          ])}
        </div>`,
      setup: (root) => ppMatcher(root),
      check: [
        { q: `${c("match [5] with | [] => 0 | _ :: [] => 1 | _ => 2")} gives?`,
          opts: ["1", "0", "2", "an error"], why: `${c("[5]")} is ${c("5 :: []")}: the second pattern fits first.` },
        { q: `Why does ${c("head? : List α → Option α")} return an Option?`,
          opts: ["So the function is total: the empty list gets none", "For speed", "Lists can hold none", "Because α might be a Nat"], why: "There is no element to return for []. Option makes that visible in the type instead of crashing." },
        { q: `In ${c("| x :: y :: z :: _ => some (x, y, z)")}, which lists match?`,
          opts: ["Lists with 3 or more elements", "Lists with exactly 3 elements", "Lists with at least 4 elements", "Every list"], why: `The ${c("_")} at the end is the tail, which may be anything — also [].` },
        { q: "What happens to the patterns after the first one that matches?",
          opts: ["They are not tried", "They are tried too and the last match wins", "Lean picks the most specific", "Their results are combined"], why: "First match wins, so the order of patterns matters." },
        { q: `${c("employees.filter (fun e => e.salary > 80000)")} has type …`,
          opts: [c("List Employee"), c("Option Employee"), c("Bool"), c("List Bool")], why: "filter keeps some elements of the list, so it's still a list of employees." },
      ],
    },

    /* ------------------------------------------------------------ 1.4 */
    {
      id: "1.4",
      title: "Recursion",
      short: "Recursion",
      about: "recursive types, structural recursion, Nat, take/zip, quicksort, partial",
      html: () => `
        <div class="card">
          ${ppGist([
            `A <b>recursive type</b> mentions itself: a list is ${c("nil")} or ${c("cons hd tail")}, and the tail is a list again.`,
            `<b>Structural recursion</b>: one case per constructor; recursive calls only on the <b>direct parts</b> (the tail). It always terminates, and Lean sees that.`,
            `<b>Generative recursion</b>: the calls get <b>newly made</b> data (quicksort's partitions, collatz's ${c("3n+1")}). Lean can't prove it ends → ${c("partial def")}.`,
            `The template: base case for each non-recursive constructor, recursive case that combines the head with the result for the tail.`,
          ])}
          ${codePair(code(`
            inductive List (α : Type) where
              | nil
              | cons (hd : α) (tail : List α)

            def List.length (l : List α) : Nat :=
              match l with
              | [] => 0                    -- base case
              | _ :: tl => 1 + tl.length   -- recursive case`, { title: "Lists, by hand" }),
          code(`
            inductive Nat where
              | zero
              | succ (n : Nat)

            def Nat.add (m n : Nat) : Nat :=
              match m with
              | zero => n
              | succ m' => succ (m'.add n)`, { title: "Natural numbers, the same way" }))}
          ${ppSrc(["Functional/Recursion.lean"])}
        </div>
        <div class="card">
          <h3>Following the structure</h3>
          <p>Step through a recursive call. The highlighted cell is the one the call is on — each call goes one cell to the right until it reaches <b>nil</b>.</p>
          ${pw("cons", `${pseg("fn", [["sum", "sum"], ["length", "length"]], "sum")}<div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>${pbtn("new", "New list")}`, { wide: true })}
        </div>
        <div class="card">
          <h3>Recursion on two things, and on trees</h3>
          ${codePair(code(`
            def take (n : Nat) (list : List α) : List α :=
              match n, list with
              | 0, _ => []
              | _, [] => []
              | n + 1, x :: xs => x :: take n xs`, { title: "Down a number and a list" }),
          code(`
            def Route.turnCount (r : Route) : Nat :=
              match r with
              | destination _ => 0
              | unreachable => 0
              | turn _ rest => rest.turnCount + 1
              | sequence r1 r2 => r1.turnCount + r2.turnCount
              | alternative r1 r2 => Nat.min r1.turnCount r2.turnCount`, { title: "Two base cases, three recursive ones" }))}
        </div>
        <div class="card">
          <h3>Generative recursion: quicksort</h3>
          ${code(`
            partial def List.quicksort [Ord α] (list : List α) : List α :=
              match list with
              | nil => nil
              | pivot :: tail =>
                let (less, greaterEq) := tail.partition (fun x => compare x pivot == .lt)
                less.quicksort ++ (pivot :: greaterEq.quicksort)`)}
          ${pw("qs", pbtn("new", "New list"), { wide: true })}
          ${ppTraps([
            `${c("partial")} is a promise, not a proof: a ${c("partial def")} that loops just hangs.`,
            `Quicksort here is not structural: ${c("less")} isn't the tail of the input.`,
            `In ${c("Nat.pow")} the recursion is on ${c("n")}, not ${c("m")} — look at what the match is on.`,
          ])}
        </div>`,
      setup: (root) => { ppConsEval(root); ppQuicksort(root); },
      check: [
        { q: "Which recursion is structural?",
          opts: [`${c("| x :: xs => 1 + len xs")}`, "quicksort on its partitions", `collatz on ${c("3 * n + 1")}`, "bfs on a new queue"], why: "Only len calls itself on a direct part (the tail) of its input." },
        { q: `Why is quicksort marked ${c("partial")}?`,
          opts: ["Lean can't see that the new lists get smaller", "It doesn't work on empty lists", "It uses Ord", "It returns an Option"], why: "Its calls are on lists made by partition, so the termination check (which looks for structural parts) fails." },
        { q: `${c("take 2 [7, 8, 9]")} gives?`,
          opts: [c("[7, 8]"), c("[8, 9]"), c("[7]"), c("[9]")], why: `take keeps the first n: ${c("7 :: take 1 [8, 9]")} = ${c("7 :: 8 :: take 0 [9]")} = ${c("[7, 8]")}.` },
        { q: `${c("Route.turnCount")} has how many base cases?`,
          opts: ["2: destination and unreachable", "1", "3", "5"], why: "The constructors without a Route inside are the base cases." },
        { q: "What do you get for a structurally recursive function on a list of length n?",
          opts: ["n recursive calls plus the base case", "log n calls", "n² calls", "It depends on the values"], why: "One call per cons cell, then nil. That's why such functions are O(n·k) for k work per element." },
      ],
    },
  ],
});
