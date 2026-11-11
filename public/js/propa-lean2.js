// ProPa Lean chapter 2, "Functions as values": HigherOrderFunctions.lean, LambdaCalculus.lean and
// Interpreter.lean (lecture weeks 3–4). The lambda calculus drawing is a real reducer (normal order,
// capture-avoiding substitution); the interpreter drawing runs the lecture's language with dynamic
// or lexical scoping.

/* ---------------------------------------------------------------- 2.1 map / filter / zipWith */

const PP_HOF = {
  map: [["(· * 2)", (x) => x * 2], ["(· + 1)", (x) => x + 1], ["(· % 2 == 0)", (x) => x % 2 === 0], ["toString", (x) => `"${x}"`]],
  filter: [["(· > 2)", (x) => x > 2], ["(· % 2 == 0)", (x) => x % 2 === 0], ["(· != 1)", (x) => x !== 1]],
  zipWith: [["(· + ·)", (x, y) => x + y], ["(· * ·)", (x, y) => x * y], ["(fun x y => (x, y))", (x, y) => `(${x}, ${y})`]],
};

function ppHof(root) {
  const { fig, read, w } = ppW(root, "hof");
  const st = { op: "map", f: 0, xs: [3, 1, 4, 1, 5] };
  const ys = [10, 20, 30];
  const fRow = $(".pp-hof-f", w);
  const box = (v, cls = "") => `<span class="pp-box ${cls}">${v}</span>`;
  const draw = () => {
    const fns = PP_HOF[st.op];
    st.f = Math.min(st.f, fns.length - 1);
    fRow.innerHTML = pseg("f", fns.map(([s], i) => [i, `<code>${ppEsc(s)}</code>`]), st.f);
    lenWire(fRow, st, draw);
    const [src, f] = fns[st.f];
    let rows = "", out;
    if (st.op === "map") {
      out = st.xs.map(f);
      rows = `<div class="pp-hof-grid" style="--n:${st.xs.length}">${st.xs.map((x) => box(x)).join("")}${st.xs.map(() => `<span class="pp-hof-arrow">↓ f</span>`).join("")}${out.map((y) => box(y, "out")).join("")}</div>`;
    } else if (st.op === "filter") {
      out = st.xs.filter(f);
      rows = `<div class="pp-hof-grid" style="--n:${st.xs.length}">${st.xs.map((x) => box(x, f(x) ? "" : "drop")).join("")}${st.xs.map((x) => `<span class="pp-hof-arrow ${f(x) ? "" : "no"}">${f(x) ? "✓ keep" : "✗ drop"}</span>`).join("")}${st.xs.map((x) => (f(x) ? box(x, "out") : `<span></span>`)).join("")}</div>`;
    } else {
      const n = Math.min(st.xs.length, ys.length);
      out = st.xs.slice(0, n).map((x, i) => f(x, ys[i]));
      rows = `<div class="pp-hof-grid" style="--n:${st.xs.length}">${st.xs.map((x) => box(x)).join("")}${st.xs.map((_, i) => (i < ys.length ? box(ys[i], "second") : `<span class="pp-hof-arrow no">no partner</span>`)).join("")}${st.xs.map((_, i) => (i < n ? `<span class="pp-hof-arrow">↓ f</span>` : "<span></span>")).join("")}${st.xs.map((_, i) => (i < n ? box(out[i], "out") : "<span></span>")).join("")}</div>`;
    }
    const call = st.op === "zipWith" ? `List.zipWith ${src} ${showList(st.xs)} ${showList(ys)}` : `${showList(st.xs)}.${st.op} ${src}`;
    fig.innerHTML = `${code(`#eval ${call}`)}${rows}`;
    read.innerHTML = `<p><span class="pill good">⇒ ${showList(out)}</span></p><p class="small muted">${{
      map: "map: same length, every element through f.", filter: "filter: same elements, some dropped. The predicate returns a Bool.",
      zipWith: "zipWith: pairs up position by position and stops at the shorter list."}[st.op]}</p>`;
  };
  lenWire($(".pp-hof-op", w), st, () => { st.f = 0; draw(); });
  ppW(root, "hof").on("new", () => { st.xs = rlist(rint(3, 6), 0, 9); draw(); });
  draw();
}

/* ---------------------------------------------------------------- 2.2 Folding */

const PP_FOLDS = {
  sum: { init: "0", comb: "(· + ·)", f: (x, a) => a + x, show: (a) => String(a), z: 0 },
  product: { init: "1", comb: "(· * ·)", f: (x, a) => a * x, show: (a) => String(a), z: 1 },
  length: { init: "0", comb: "(fun _ acc => 1 + acc)", f: (x, a) => 1 + a, show: (a) => String(a), z: 0 },
  max: { init: "0", comb: "Nat.max", f: (x, a) => Math.max(x, a), show: (a) => String(a), z: 0 },
  string: { init: '""', comb: "(fun x acc => toString x ++ acc)", f: (x, a) => x + a, show: (a) => `"${a}"`, z: "" },
  rev: { init: "[]", comb: "(fun x acc => acc ++ [x])", f: (x, a) => [...a, x], show: (a) => showList(a), z: [] },
};

// The list as nested constructor boxes; folding replaces them and works from the inside out.
function ppFold(root) {
  const { fig, read, w } = ppW(root, "fold");
  const st = { fn: "sum", k: 0, xs: [1, 2, 3] };
  const draw = () => {
    const F = PP_FOLDS[st.fn], n = st.xs.length;
    // k = 0: the list; k = 1: constructors replaced; k = 2 … n+1: the innermost k-1 combines done.
    st.k = Math.min(st.k, n + 1);
    const done = st.k - 1; // how many combines (from the inside) are worked out
    let acc = F.z;
    const vals = [];
    for (let i = n - 1; i >= 0; i--) { acc = F.f(st.xs[i], acc); vals[i] = acc; }
    const nest = (i) => {
      if (st.k === 0) return i === n ? `<span class="pp-fbox nil">nil</span>` : `<span class="pp-fbox"><b class="pp-fc">cons</b> <span class="pp-box">${st.xs[i]}</span> ${nest(i + 1)}</span>`;
      if (i === n) return `<span class="pp-fbox init">${F.init}</span>`;
      if (i >= n - done) return `<span class="pp-fbox val">${F.show(vals[i])}</span>`;
      return `<span class="pp-fbox"><b class="pp-fc comb">combine</b> <span class="pp-box">${st.xs[i]}</span> ${nest(i + 1)}</span>`;
    };
    fig.innerHTML = `
      <div class="pp-fold">${nest(0)}</div>
      ${code(`def List.fold (init : β) (combine : α → β → β) (lst : List α) : β :=
  match lst with
  | [] => init
  | hd :: tl => combine hd (tl.fold init combine)

#eval ${showList(st.xs)}.fold ${F.init} ${F.comb}  --= ${F.show(n ? vals[0] : F.z)}`)}`;
    read.innerHTML = `<p class="small">${st.k === 0 ? "A list is constructors: <b>cons</b> and <b>nil</b>."
      : st.k === 1 ? `Folding <b>replaces</b> each <b>cons</b> by <b class="pp-fc comb">combine</b> and <b>nil</b> by <b>init</b> = ${c(F.init)}.`
      : st.k === n + 1 ? `Done: ${c(F.show(n ? vals[0] : F.z))}.`
      : "The innermost combine runs first: the fold works from the end of the list to the front."}</p>
      <p class="small muted">Step ${st.k + 1} / ${n + 2}</p>`;
    $('[data-a="prev"]', w).disabled = st.k === 0;
    $('[data-a="next"]', w).disabled = st.k === n + 1;
  };
  const h = ppW(root, "fold");
  h.on("prev", () => { st.k--; draw(); });
  h.on("next", () => { st.k++; draw(); });
  h.on("new", () => { st.xs = rlist(rint(2, 4), 1, 9); st.k = 0; draw(); });
  lenWire($(".pp-fold-fn", w), st, () => { st.k = 0; draw(); });
  draw();
}

// The recipe for a fold's type: each constructor's type with the type itself replaced by β.
const PP_DERIVE = {
  List: { ty: "List α", ctors: [["nil", "List α", "fnil", "β"], ["cons", "α → List α → List α", "fcons", "α → β → β"]] },
  BinaryTree: { ty: "BinaryTree α", ctors: [["empty", "BinaryTree α", "fempty", "β"], ["leaf", "α → BinaryTree α", "fleaf", "α → β"], ["node", "BinaryTree α → BinaryTree α → BinaryTree α", "fnode", "β → β → β"]] },
  Nat: { ty: "Nat", ctors: [["zero", "Nat", "fzero", "β"], ["succ", "Nat → Nat", "fsucc", "β → β"]] },
  Bool: { ty: "Bool", ctors: [["true", "Bool", "ftrue", "β"], ["false", "Bool", "ffalse", "β"]] },
  Option: { ty: "Option α", ctors: [["none", "Option α", "fnone", "β"], ["some", "α → Option α", "fsome", "α → β"]] },
  Route: { ty: "Route", ctors: [["destination", "String → Route", "fdestination", "String → β"], ["unreachable", "Route", "funreachable", "β"], ["turn", "String → Route → Route", "fturn", "String → β → β"], ["sequence", "Route → Route → Route", "fsequence", "β → β → β"], ["alternative", "Route → Route → Route", "falternative", "β → β → β"]] },
};

function ppDerive(root) {
  const { fig, read, w } = ppW(root, "derive");
  const st = { ty: "BinaryTree" };
  const mark = (s, ty) => ppEsc(s).split(ppEsc(ty)).join(`<b class="pp-dv-ty">${ppEsc(ty)}</b>`);
  const draw = () => {
    const D = PP_DERIVE[st.ty];
    fig.innerHTML = `<table class="lw-table pp-dv">
      <thead><tr><th>constructor</th><th>its type</th><th></th><th>parameter of fold</th></tr></thead>
      <tbody>${D.ctors.map(([n, t, fn, ft]) => `<tr><td><code>${n}</code></td><td><code>${mark(t, D.ty)}</code></td><td>→</td><td><code>${fn} : ${ppEsc(ft).replace(/β/g, '<b class="pp-dv-b">β</b>')}</code></td></tr>`).join("")}</tbody></table>`;
    read.innerHTML = code(`def ${st.ty}.fold ${D.ctors.map(([, , fn, ft]) => `(${fn} : ${ft})`).join(" ")} (x : ${D.ty}) : β`) +
      `<p class="small muted">Replace every <b class="pp-dv-ty">${D.ty}</b> by <b class="pp-dv-b">β</b>. The body matches on the constructors and folds the parts that were ${D.ty}.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.3 The lambda calculus */

// Terms: { t: "var", n } | { t: "lam", p, b } | { t: "app", f, a }.
const LC_MACROS = {
  true: "λt f. t", false: "λt f. f",
  not: "λb. λt f. b f t", and: "λb1 b2. λt f. b1 (b2 t f) f", or: "λb1 b2. λt f. b1 t (b2 t f)",
  zero: "λz s. z", succ: "λn. λz s. s (n z s)", one: "succ zero", two: "succ (succ zero)", three: "succ (succ (succ zero))",
  add: "λm n. λz s. m (n z s) (λx. s x)", mul: "λm n. λz s. m z (λp. n p s)",
};

function lcParse(src) {
  const toks = src.replace(/\\/g, "λ").match(/λ|\.|\(|\)|[A-Za-z_][\w']*|\d+|\S/g) || [];
  let i = 0;
  const peek = () => toks[i];
  const eat = (t) => { if (toks[i] !== t) throw new Error(`expected “${t}”${toks[i] ? ` but found “${toks[i]}”` : " at the end"}`); i++; };
  const term = () => {
    if (peek() === "λ") {
      i++;
      const ps = [];
      while (peek() && /^[A-Za-z_]/.test(peek())) ps.push(toks[i++]);
      if (!ps.length) throw new Error("λ needs a parameter name");
      eat(".");
      const b = term();
      return ps.reduceRight((body, p) => ({ t: "lam", p, b: body }), b);
    }
    let f = atom();
    while (peek() && peek() !== ")") f = { t: "app", f, a: peek() === "λ" ? term() : atom() };
    return f;
  };
  const atom = () => {
    const t = toks[i];
    if (t === undefined) throw new Error("the term ends too early");
    if (t === "(") { i++; const e = term(); eat(")"); return e; }
    if (/^\d+$/.test(t)) {
      i++;
      const n = +t;
      if (n > 12) throw new Error("numbers up to 12, please");
      let b = { t: "var", n: "z" };
      for (let k = 0; k < n; k++) b = { t: "app", f: { t: "var", n: "s" }, a: b };
      return { t: "lam", p: "z", b: { t: "lam", p: "s", b } };
    }
    if (/^[A-Za-z_]/.test(t)) { i++; return LC_MACROS[t] ? { ...lcParse(LC_MACROS[t]), macro: t } : { t: "var", n: t }; }
    throw new Error(`unexpected “${t}”`);
  };
  const e = term();
  if (i < toks.length) throw new Error(`unexpected “${toks[i]}”`);
  return e;
}

const lcFree = (e, s = new Set()) => {
  if (e.t === "var") s.add(e.n);
  else if (e.t === "lam") { const inner = lcFree(e.b); inner.delete(e.p); inner.forEach((v) => s.add(v)); }
  else { lcFree(e.f, s); lcFree(e.a, s); }
  return s;
};
const lcFresh = (n, avoid) => { let m = n + "'"; while (avoid.has(m)) m += "'"; return m; };

// Renamings made by the last reduction step, to say so beside it.
let lcRenames = [];
// e[x := s], renaming a λ's parameter when it would capture a free variable of s.
function lcSubst(e, x, s) {
  if (e.t === "var") return e.n === x ? s : e;
  if (e.t === "app") return { t: "app", f: lcSubst(e.f, x, s), a: lcSubst(e.a, x, s) };
  if (e.p === x) return e;
  const fs = lcFree(s);
  if (fs.has(e.p) && lcFree(e.b).has(x)) {
    const p2 = lcFresh(e.p, new Set([...fs, ...lcFree(e.b), x]));
    lcRenames.push([e.p, p2]);
    return { t: "lam", p: p2, b: lcSubst(lcSubst(e.b, e.p, { t: "var", n: p2 }), x, s) };
  }
  return { t: "lam", p: e.p, b: lcSubst(e.b, x, s) };
}

// The leftmost, outermost redex (normal order).
function lcRedex(e) {
  if (e.t === "app" && e.f.t === "lam") return e;
  if (e.t === "app") return lcRedex(e.f) || lcRedex(e.a);
  if (e.t === "lam") return lcRedex(e.b);
  return null;
}
function lcReduce(e, r) {
  if (e === r) return lcSubst(r.f.b, r.f.p, r.a);
  if (e.t === "app") return { t: "app", f: lcReduce(e.f, r), a: lcReduce(e.a, r) };
  if (e.t === "lam") return { t: "lam", p: e.p, b: lcReduce(e.b, r) };
  return e;
}

// A term as text (HTML), with the redex marked. `macros` prints named parts by their names.
function lcShow(e, r = null, macros = false) {
  const go = (e, pos) => {
    let s;
    if (macros && e.macro) s = `<b class="pp-lc-m">${e.macro}</b>`;
    else if (e.t === "var") s = ppEsc(e.n);
    else if (e.t === "lam") {
      const ps = [];
      let b = e;
      while (b.t === "lam" && !(macros && b.macro && b !== e)) { ps.push(b.p); b = b.b; }
      s = `<span class="pp-lc-l">λ${ps.map(ppEsc).join(" ")}.</span> ${go(b, "body")}`;
      if (pos !== "top" && pos !== "body" && pos !== "last") s = `(${s})`;
    } else {
      s = `${go(e.f, "fn")} ${go(e.a, "arg")}`;
      if (pos === "arg") s = `(${s})`;
    }
    if (e === r) s = `<mark class="pp-hl">${s}</mark>`;
    return s;
  };
  return go(e, "top");
}

// What a normal form reads as, in the lecture's encoding.
function lcDecode(e) {
  if (e.t !== "lam" || e.b.t !== "lam") return "";
  const a = e.p, b = e.b.p, body = e.b.b;
  const out = [];
  if (body.t === "var" && body.n === a) out.push("<b>true</b>");
  if (body.t === "var" && body.n === b && a !== b) out.push("<b>false</b>");
  let n = 0, k = body;
  while (k.t === "app" && k.f.t === "var" && k.f.n === b) { n++; k = k.a; }
  if (k.t === "var" && k.n === a && a !== b) out.push(`the Church numeral <b>${n}</b>`);
  return out.join(" and also ");
}

function ppLambda(root) {
  const { fig, read, w } = ppW(root, "lc");
  const input = $(".pp-lc-in", w);
  let steps = [], shown = 1, err = "";
  const start = (src) => {
    err = "";
    try {
      const e0 = lcParse(src);
      // With names shown, then spelled out (if it has names), then each β-step.
      const named = lcShow(e0, null, true) !== lcShow(e0);
      steps = named ? [{ e: e0, macros: true, eq: true }, { e: e0 }] : [{ e: e0, macros: true }];
      let e = e0;
      for (let k = 0; k < 400; k++) {
        const r = lcRedex(e);
        steps[steps.length - 1].r = r;
        if (!r) break;
        lcRenames = [];
        e = lcReduce(e, r);
        steps.push({ e, renamed: lcRenames[0] });
        if (lcShow(e).length > 6000) { err = "The term keeps growing: it has no normal form (or a huge one)."; break; }
      }
      if (lcRedex(e) && !err) err = "Still not done after 400 steps: this term probably never stops.";
    } catch (x) { err = "Can't read that: " + x.message + "."; steps = []; }
    shown = Math.min(steps.length, 1);
    draw();
  };
  const draw = () => {
    if (!steps.length) { fig.innerHTML = `<p class="pp-bad-note">${ppEsc(err)}</p>`; read.innerHTML = ""; return; }
    const vis = steps.slice(0, shown);
    fig.innerHTML = `<div class="pp-steps lc">${vis.map((s, i) => `
      <div class="pp-step ${i === shown - 1 ? "on" : "past"}">${i === 0 ? "&nbsp;&nbsp;" : vis[i - 1].eq ? "≡" : "→<sub>β</sub>"} <code class="pp-lc">${lcShow(s.e, i === shown - 1 && !s.eq ? s.r : null, !!s.macros)}</code>
      ${s.renamed ? `<span class="small pp-lc-ren">renamed ${s.renamed[0]} → ${s.renamed[1]} to avoid capture</span>` : ""}</div>`).join("")}</div>`;
    const last = steps[steps.length - 1];
    const finished = shown === steps.length;
    const betas = steps.length - 1 - (steps[0].eq ? 1 : 0);
    const dec = finished && !lcRedex(last.e) ? lcDecode(last.e) : "";
    read.innerHTML = finished
      ? (err ? `<p><span class="pill bad">no normal form found</span></p><p class="small">${err}</p>`
        : `<p><span class="pill good">normal form after ${betas} β-step${betas === 1 ? "" : "s"}</span></p>${dec ? `<p class="small">Reads as ${dec}.</p>` : ""}`)
      : vis[shown - 1].eq ? `<p class="small">First the names are replaced by their definitions.</p>`
      : `<p class="small">The <mark class="pp-hl">marked</mark> part is the next redex ${c("(λx. e) a")}: the leftmost, outermost one.</p><p class="small muted">Step ${shown} / ${steps.length}</p>`;
    $('[data-a="next"]', w).disabled = finished;
    $('[data-a="all"]', w).disabled = finished;
  };
  $$("[data-lc]", w).forEach((b) => (b.onclick = () => { input.value = b.dataset.lc; start(input.value); }));
  input.onkeydown = (ev) => { if (ev.key === "Enter") start(input.value); };
  ppW(root, "lc").on("go", () => start(input.value));
  ppW(root, "lc").on("next", () => { shown++; draw(); });
  ppW(root, "lc").on("all", () => { shown = steps.length; draw(); });
  start(input.value);
}

/* ---------------------------------------------------------------- 2.4 The interpreter */

// The lecture's Expression, as JS: [kind, …]. Values: { int } | { bool } | { lam, p, b, env? }.
const IE = {
  int: (n) => ["int", n], add: (a, b) => ["add", a, b], mul: (a, b) => ["mul", a, b], lt: (a, b) => ["lt", a, b],
  ite: (c, t, e) => ["if", c, t, e], v: (n) => ["var", n], lam: (p, b) => ["lam", p, b], app: (f, a) => ["app", f, a],
};
const ieShow = (e) => {
  const [k, x, y, z] = e;
  return k === "int" ? String(x) : k === "var" ? x : k === "add" ? `${ieShow(x)} + ${ieShow(y)}` : k === "mul" ? `${ieShow(x)} * ${ieShow(y)}`
    : k === "lt" ? `${ieShow(x)} < ${ieShow(y)}` : k === "if" ? `if ${ieShow(x)} then ${ieShow(y)} else ${ieShow(z)}`
    : k === "lam" ? `(λ${x}. ${ieShow(y)})` : `${ieShow(x)} ${y[0] === "app" ? `(${ieShow(y)})` : ieShow(y)}`;
};
const ievShow = (v) => v.int !== undefined ? String(v.int) : v.bool !== undefined ? String(v.bool)
  : `λ${v.p}. ${ieShow(v.b)}${v.env ? ` <span class="pp-env-in">with ${ieEnvShow(v.env)}</span>` : ""}`;
const ieEnvShow = (env) => {
  const ks = Object.keys(env);
  return ks.length ? `{${ks.map((k) => `${k} ↦ ${ievShow(env[k])}`).join(", ")}}` : "∅";
};

function ieRun(e, lexical) {
  const trace = [];
  const ev = (e, env, d) => {
    if (trace.length > 60) throw new Error("too many steps");
    const [k, x, y, z] = e;
    if (k === "int") return { int: x };
    if (k === "add" || k === "mul" || k === "lt") {
      const a = ev(x, env, d), b = ev(y, env, d);
      return k === "add" ? { int: a.int + b.int } : k === "mul" ? { int: a.int * b.int } : { bool: a.int < b.int };
    }
    if (k === "if") return ev(x, env, d).bool ? ev(y, env, d) : ev(z, env, d);
    if (k === "lam") return lexical ? { lam: true, p: x, b: y, env } : { lam: true, p: x, b: y };
    if (k === "var") {
      const v = env[x];
      trace.push({ d, kind: "var", text: `look up <b>${x}</b> in ${ieEnvShow(env)} → <b>${v ? ievShow(v) : "unbound!"}</b>` });
      if (!v) throw new Error(`Unbound variable ${x}`);
      return v;
    }
    const f = ev(x, env, d);
    const a = ev(y, env, d);
    const base = lexical ? f.env : env;
    const env2 = { ...base, [f.p]: a };
    trace.push({ d, kind: "app", text: `apply <b>λ${f.p}. ${ieShow(f.b)}</b> to <b>${ievShow(a)}</b>: body runs in ${lexical ? "its own" : "the caller's"} env + ${f.p} ↦ ${ievShow(a)} = ${ieEnvShow(env2)}` });
    return ev(f.b, env2, d + 1);
  };
  try { return { v: ev(e, {}, 0), trace }; } catch (x) { return { err: x.message, trace }; }
}

const PP_PROGS = {
  prog: {
    name: "prog 41 (the lecture's)",
    lean: `def plus : Expression := (.lambda "x" (.lambda "y" (.add (.var "x") (.var "y"))))
def inc : Expression := (.apply plus (.intLiteral 1))
def prog : Expression := (.lambda "x" (.apply inc (.var "x")))
#eval interpEnv! ∅ (.apply prog (.intLiteral 41))`,
    e: (() => { const plus = IE.lam("x", IE.lam("y", IE.add(IE.v("x"), IE.v("y")))); const inc = IE.app(plus, IE.int(1)); return IE.app(IE.lam("x", IE.app(inc, IE.v("x"))), IE.int(41)); })(),
  },
  shadow: {
    name: "a function that remembers x",
    lean: `-- (λx. (λf. (λx. f 0) 100) (λy. x + y)) 1`,
    e: IE.app(IE.lam("x", IE.app(IE.lam("f", IE.app(IE.lam("x", IE.app(IE.v("f"), IE.int(0))), IE.int(100))), IE.lam("y", IE.add(IE.v("x"), IE.v("y"))))), IE.int(1)),
  },
  ifte: {
    name: "if 3 < 5 then 1 + 2 else 10 * 20",
    lean: `#eval interp! (.ifThenElse (.less_than (.intLiteral 3) (.intLiteral 5))
                (.add (.intLiteral 1) (.intLiteral 2))
                (.multiply (.intLiteral 10) (.intLiteral 20)))`,
    e: IE.ite(IE.lt(IE.int(3), IE.int(5)), IE.add(IE.int(1), IE.int(2)), IE.mul(IE.int(10), IE.int(20))),
  },
};

function ppInterp(root) {
  const { fig, read, w } = ppW(root, "interp");
  const st = { prog: "prog", scope: "dyn" };
  const draw = () => {
    const P = PP_PROGS[st.prog];
    const lex = st.scope === "lex";
    const r = ieRun(P.e, lex), other = ieRun(P.e, !lex);
    fig.innerHTML = `${code(P.lean)}<p class="small muted pp-prog-read">As a λ-term: <code>${ppEsc(ieShow(P.e))}</code></p>
      <ol class="pp-trace">${r.trace.map((t) => `<li class="${t.kind}" style="--d:${t.d}">${t.text}</li>`).join("")}</ol>`;
    const same = !r.err && !other.err && ievShow(r.v) === ievShow(other.v);
    read.innerHTML = r.err ? `<p><span class="pill bad">panic: ${r.err}</span></p>`
      : `<p><span class="pill ${lex || same ? "good" : "bad"}">⇒ ${ievShow(r.v)}</span></p>
        <p class="small">${same ? "Both kinds of scoping give the same here: no function uses a variable from outside."
          : lex ? `<b>Lexical</b>: a λ becomes a <b>closure</b> that keeps the environment it was made in. With dynamic scoping it would be ${ievShow(other.v)}.`
          : `<b>Dynamic</b>: the body sees the <b>caller's</b> variables, so a later x takes the place of the one the function was made with. Lexical scoping gives ${ievShow(other.v)}.`}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- The chapter */

PROPA_CHAPTERS.push({
  n: 2,
  part: "Lean",
  title: "Functions as values",
  next: "Scaling up",
  headline: "Higher-order functions, the <span class='accent'>λ-calculus</span> and interpreters",
  intro: "Weeks 3–4: map, filter and fold as the patterns behind recursion, how to derive a fold for any type, Church encodings, and an interpreter that shows why scoping matters.",
  sections: [
    /* ------------------------------------------------------------ 2.1 */
    {
      id: "2.1",
      title: "Higher-order functions and lambdas",
      short: "map & filter",
      about: "map, filter, zipWith on lists and trees, lambdas, functions as values",
      html: () => `
        <div class="card">
          ${ppGist([
            `A <b>higher-order function</b> takes or returns a function. ${c("map")}, ${c("filter")} and ${c("zipWith")} are recursion patterns with the varying part passed in.`,
            `Spot the pattern: three functions that differ only in what they do to each element → one ${c("map")} with an ${c("f")} parameter.`,
            `A <b>lambda</b> is a function as an expression: ${c("fun x => x * 2")} = ${c("λ x => x * 2")} = ${c("(· * 2)")}. It can be passed, returned, stored in a structure.`,
            `A lambda can use names from around it: in ${c("let read := fun a => memory[base + wordSize * a]!")}, memory, base and wordSize come along.`,
          ])}
          ${codePair(code(`
            def List.negate (lst : List Bool) : List Bool :=
              match lst with
              | [] => []
              | hd :: tl => (!hd) :: tl.negate

            def List.round (lst : List Float) : List Float :=
              match lst with
              | [] => []
              | hd :: tl => hd.round :: tl.round`, { title: "The same shape twice …" }),
          code(`
            def List.mymap (f : α → β) (lst : List α) : List β :=
              match lst with
              | [] => []
              | hd :: tl => f hd :: tl.mymap f

            def Lists.negate' := List.mymap (!·)
            def Lists.round'  := List.mymap Float.round`, { title: "… becomes one function with a parameter" }))}
          ${ppSrc(["Functional/HigherOrderFunctions.lean"])}
        </div>
        <div class="card">
          <h3>map, filter, zipWith</h3>
          ${pw("hof", `<div class="pp-hof-op">${pseg("op", [["map", "map"], ["filter", "filter"], ["zipWith", "zipWith"]], "map")}</div><div class="pp-hof-f"></div>${pbtn("new", "New list")}`, { wide: true })}
        </div>
        <div class="card">
          <h3>The same patterns on trees</h3>
          ${code(`
            inductive BinaryTree (α : Type) where
            | empty
            | leaf (elem : α)
            | node (left : BinaryTree α) (right : BinaryTree α)

            def BinaryTree.map (f : α → β) (tree : BinaryTree α) : BinaryTree β :=
              match tree with
              | empty => empty
              | leaf x => leaf (f x)
              | node left right => node (left.map f) (right.map f)`)}
          ${ppFacts([
            ["functions in data", `${c("structure Utilities where hashFunc : String → UInt64 …")} — fill the fields with lambdas once, use them everywhere.`],
            ["returning functions", `${c("def encryptFunction (key : String) : String → List Char := fun s => …")}: the key is fixed, the string comes later.`],
            ["definitions vs lambdas", `A ${c("def")} is a named top-level thing; a lambda is a <b>value</b> — it can appear anywhere an expression can.`],
          ])}
          ${ppTraps([
            `${c("filter")}'s function returns a ${c("Bool")}; ${c("map")}'s can return anything.`,
            `${c("zipWith")} drops the rest of the longer list — no error.`,
            `${c("(· - 1)")} is ${c("fun x => x - 1")}, but ${c("(1 - ·)")} is ${c("fun x => 1 - x")}.`,
          ])}
        </div>`,
      setup: (root) => ppHof(root),
      check: [
        { q: `${c("[1, 2, 3, 4].filter (· % 2 == 0) |>.map (· * 10)")} gives?`,
          opts: [c("[20, 40]"), c("[10, 30]"), c("[false, true, false, true]"), c("[10, 20, 30, 40]")], why: "filter keeps 2 and 4, map multiplies them." },
        { q: `What is the type of ${c("List.mymap")}?`,
          opts: [c("(α → β) → List α → List β"), c("List α → List β"), c("(α → Bool) → List α → List α"), c("α → β → List β")], why: "It takes the function first, then the list, and the element type may change." },
        { q: `${c("List.zipWith (· + ·) [1, 2, 3] [10, 20]")} gives?`,
          opts: [c("[11, 22]"), c("[11, 22, 3]"), "an error", c("[11, 22, 30]")], why: "zipWith stops at the shorter list." },
        { q: "Which is NOT the same function as the others?",
          opts: [c("fun x => 2 - x"), c("fun x => x - 2"), c("λ x => x - 2"), c("(· - 2)")], why: `The dot stands where the argument goes: ${c("(· - 2)")} subtracts 2 from x.` },
        { q: "Why does BinaryTree.filter return a tree with empty where leaves were removed?",
          opts: ["It keeps the shape of the tree and replaces dropped leaves by empty", "It's a bug", "Trees can't shrink", "filter must return a list"], why: "It follows the tree's structure like map does; a removed leaf becomes the empty constructor." },
      ],
    },

    /* ------------------------------------------------------------ 2.2 */
    {
      id: "2.2",
      title: "Folds",
      short: "Folds",
      about: "fold replaces constructors, deriving a fold for any type",
      html: () => `
        <div class="card">
          ${ppGist([
            `${c("fold")} is the pattern behind every structural recursion: give a result for each constructor, and fold does the recursion.`,
            `It <b>replaces the constructors</b>: ${c("cons 1 (cons 2 (cons 3 nil))")} becomes ${c("combine 1 (combine 2 (combine 3 init))")}.`,
            `The lecture's ${c("List.fold init combine")} is a <b>right</b> fold (like ${c("List.foldr")}): the last element is combined first.`,
            `A fold for <b>any</b> algebraic type: one parameter per constructor, its type is the constructor's type with the type itself replaced by ${c("β")}.`,
          ])}
          ${codePair(code(`
            def List.mysum' := List.fold 0 Int.add

            def List.mypartition' (p : α → Bool) :=
              List.fold ([], [])
                (fun x (ts, fs) =>
                  if p x then (x :: ts, fs) else (ts, x :: fs))`, { title: "Functions as folds" }),
          code(`
            def BinaryTree.height (t : BinaryTree α) : Nat :=
              t.fold 0 (fun _ => 1) (fun l r => 1 + Nat.max l r)

            def BinaryTree.scaffold (t : BinaryTree α) :=
              t.fold empty (fun _ => empty) (fun l r => node l r)`, { title: "On trees: one function per constructor" }))}
          ${ppSrc(["Functional/HigherOrderFunctions.lean"])}
        </div>
        <div class="card">
          <h3>Replace the constructors, then work inside out</h3>
          ${pw("fold", `<div class="pp-fold-fn">${pseg("fn", [["sum", "sum"], ["product", "product"], ["length", "length"], ["max", "max"], ["string", "toString"], ["rev", "reverse"]], "sum")}</div><div class="lw-row">${pbtn("prev", "← Back")}${pbtn("next", "Step →", "primary")}</div>${pbtn("new", "New list")}`, { wide: true })}
        </div>
        <div class="card">
          <h3>Deriving a fold</h3>
          <p>The three steps from the lecture: list the constructors with their types, replace the type by β, take one function per constructor.</p>
          ${pw("derive", pseg("ty", Object.keys(PP_DERIVE).map((k) => [k, k]), "BinaryTree"), { wide: true })}
          ${ppTraps([
            `In ${c("fcons : α → β → β")} the element stays ${c("α")}: only the <b>recursive</b> part becomes ${c("β")}.`,
            `${c("[1,2,3].fold \"\" (fun x acc => toString x ++ acc)")} is ${c("\"123\"")}; with ${c("acc ++ toString x")} it's ${c("\"321\"")}. Order matters.`,
            `Lean's ${c("List.foldl")} is a <b>left</b> fold: ${c("f (f (f init 1) 2) 3")} — the accumulator comes first.`,
          ])}
        </div>`,
      setup: (root) => { ppFold(root); ppDerive(root); },
      check: [
        { q: `What does ${c("[1, 2, 3].fold 0 (fun _ acc => acc + 1)")} compute?`,
          opts: ["3, the length", "6, the sum", "0", "1"], why: "Each cons adds 1 to the result for the tail, starting from 0." },
        { q: `The fold for ${c("Option α")} with constructors ${c("none")} and ${c("some (x : α)")} has which type?`,
          opts: [c("β → (α → β) → Option α → β"), c("(α → β) → Option α → β"), c("β → (β → β) → Option α → β"), c("α → β → Option α → β")], why: "none : Option α gives β; some : α → Option α gives α → β (no recursive part)." },
        { q: `${c("[1, 2, 3].fold [] (fun x acc => acc ++ [x])")} gives?`,
          opts: [c("[3, 2, 1]"), c("[1, 2, 3]"), c("[]"), c("[[1], [2], [3]]")], why: "The innermost combine handles 3 first, so 3 is appended first." },
        { q: `For ${c("node : BinaryTree α → BinaryTree α → BinaryTree α")}, the fold takes …`,
          opts: [c("fnode : β → β → β"), c("fnode : α → α → β"), c("fnode : BinaryTree α → β"), c("fnode : β → β")], why: "Both arguments are trees, so both become β." },
        { q: `${c("cons 1 (cons 2 nil)")} folded with init ${c("i")} and combine ${c("f")} is …`,
          opts: [c("f 1 (f 2 i)"), c("f (f i 1) 2"), c("f 2 (f 1 i)"), c("i 1 (i 2 f)")], why: "Replace cons by f and nil by i, keep the shape." },
      ],
    },

    /* ------------------------------------------------------------ 2.3 */
    {
      id: "2.3",
      title: "The lambda calculus",
      short: "λ-calculus",
      about: "three constructs, β-reduction, substitution, Church booleans and numerals",
      html: () => `
        <div class="card">
          ${ppGist([
            `Only three constructs: variables ${c("x")}, abstraction ${c("λ x. e")}, application ${c("e₁ e₂")}. Still as powerful as a Turing machine (Church–Turing).`,
            `One rule, <b>β-reduction</b>: ${c("(λ x. e) a → e[x := a]")} — replace the <b>free</b> x in the body by the argument.`,
            `Substitution must not <b>capture</b>: in ${c("(λ x. λ y. x) y")} the inner y has to be renamed first, or the free y would become bound.`,
            `<b>Church encoding</b>: data as its own fold. A Bool picks one of two: ${c("true = λ t f. t")}. A number n applies ${c("s")} n times: ${c("two = λ z s. s (s z)")}.`,
          ])}
          ${codePair(code(`
            def Bool := ∀ {β}, β → β → β
            def true : Bool := fun ftrue _ => ftrue
            def false : Bool := fun _ ffalse => ffalse

            def not (b : Bool) : Bool :=
              fun ftrue ffalse => b ffalse ftrue
            def and (b1 b2 : Bool) : Bool :=
              fun ftrue ffalse => b1 (b2 ftrue ffalse) ffalse`, { title: "Church booleans" }),
          code(`
            def Nat := ∀ {β}, β → (β → β) → β
            def zero : Nat := λ fzero fsucc => fzero
            def succ (n : Nat) : Nat :=
              λ fzero fsucc => fsucc (n fzero fsucc)

            def add (m n : Nat) : Nat :=
              λ fzero fsucc => m (n fzero fsucc) (fun x => fsucc x)
            def toNat (n : Nat) : _root_.Nat := n 0 (λ x => x + 1)`, { title: "Church numerals (base first, as in the lecture)" }))}
          ${ppSrc(["Functional/LambdaCalculus.lean"])}
        </div>
        <div class="card">
          <h3>Reduce it yourself</h3>
          <p>Pick a term or type your own (${c("\\")} works for λ; ${c("true false not and or zero one two three succ add mul")} and numbers are filled in with the lecture's definitions).</p>
          ${pw("lc", `<div class="lw-row pp-lc-presets">${[["not true", "not true"], ["and true false", "and true false"], ["or false true", "or false true"], ["succ one", "succ one"], ["add one two", "add one two"], ["mul two two", "mul two two"], ["(λx. λy. x) y", "capture"], ["(λx. x x) (λx. x x)", "Ω (never stops)"]]
              .map(([t, l]) => `<button class="btn small-btn" type="button" data-lc="${t}">${l}</button>`).join("")}</div>
            <div class="lw-row pp-lc-row"><input class="pp-lc-in" type="text" value="not true" spellcheck="false" aria-label="λ-term">${pbtn("go", "Reduce")}</div>
            <div class="lw-row">${pbtn("next", "Step →", "primary")}${pbtn("all", "All steps")}</div>`, { wide: true })}
          ${ppTraps([
            `Application is <b>left</b>-associative: ${c("f a b")} is ${c("(f a) b")}. A λ body goes as far <b>right</b> as it can.`,
            `In this encoding ${c("zero")} and ${c("true")} are the same term ${c("λ a b. a")} — the type tells them apart in Lean.`,
            `Not every term has a normal form: ${c("(λx. x x) (λx. x x)")} reduces to itself forever.`,
          ])}
        </div>`,
      setup: (root) => ppLambda(root),
      check: [
        { q: `${c("(λ x. x y) (λ z. z)")} reduces to?`,
          opts: [c("y"), c("λ z. z"), c("x y"), c("(λ z. z) (λ z. z)")], why: `First step: ${c("(λ z. z) y")}, then ${c("y")}.` },
        { q: `With ${c("true = λ t f. t")}, what is ${c("true a b")}?`,
          opts: [c("a"), c("b"), c("true"), c("a b")], why: "A Church boolean picks its first argument when it's true." },
        { q: `Why must ${c("(λ x. λ y. x) y")} rename the inner y?`,
          opts: ["Otherwise the free y would be captured and become bound", "Variables must be unique", "Because y is a keyword", "It doesn't need to"], why: `Naive substitution gives ${c("λ y. y")} (the identity), but the right answer is ${c("λ y'. y")}, a constant function.` },
        { q: `Which term is the Church numeral 2 in the lecture's encoding?`,
          opts: [c("λ z s. s (s z)"), c("λ z s. z z"), c("λ s z. s s"), c("λ z s. s z z")], why: "The successor s is applied twice to the base z." },
        { q: `What does ${c("not")} do to a Church boolean b?`,
          opts: ["Swaps the two arguments it chooses between", "Applies b to itself", "Returns false always", "Adds one"], why: `${c("not b = λ t f. b f t")}: b chooses between f and t instead.` },
      ],
    },

    /* ------------------------------------------------------------ 2.4 */
    {
      id: "2.4",
      title: "Interpreters and scoping",
      short: "Interpreters",
      about: "syntax as data, interp!, substitution, environments, dynamic vs lexical scoping, closures",
      html: () => `
        <div class="card">
          ${ppGist([
            `An interpreter defines what a language <b>means</b>: a function from syntax (an inductive ${c("Expression")}) to ${c("Value")}s.`,
            `It's structural recursion on the syntax — except ${c("apply")}, which runs the body of a function: hence ${c("partial def")}.`,
            `Two ways to handle variables: <b>substitute</b> the value into the body, or keep an <b>environment</b> (name ↦ value). Environments avoid walking the body every time.`,
            `A plain environment gives <b>dynamic scoping</b> (bugs: 82 instead of 42). The fix: a λ evaluates to a <b>closure</b> that keeps its own environment — <b>lexical scoping</b>.`,
          ])}
          ${codePair(code(`
            inductive Expression where
            | intLiteral (n : Int)
            | boolLiteral (b : Bool)
            | add (e1 e2 : Expression)
            | less_than (e1 e2 : Expression)
            | ifThenElse (cond eThen eElse : Expression)
            | var (name : String)
            | lambda (name : String) (body : Expression)
            | apply (func arg : Expression)`, { title: "Syntax as data" }),
          code(`
            inductive Value where
            | int (n : Int)
            | bool (b : Bool)
            | closure (name : String) (body : Expression)
                      (env : Environment)

            | .lambda name body => .closure name body env
            | .apply funexp arg =>
              let (name, body, funenv) := (interpEnv! env funexp).asClosure
              let argval := interpEnv! env arg
              interpEnv! (funenv.insert name argval) body`, { title: "Lexical scoping with closures" }))}
          ${ppSrc(["Functional/Interpreter.lean"])}
        </div>
        <div class="card">
          <h3>Dynamic or lexical?</h3>
          <p>Run a program and follow every function call. The difference is one word: which environment the body runs in.</p>
          ${pw("interp", `${pseg("prog", Object.entries(PP_PROGS).map(([k, p]) => [k, p.name]), "prog")}${pseg("scope", [["dyn", "dynamic (Value.lambda)"], ["lex", "lexical (closures)"]], "dyn")}`, { wide: true })}
        </div>
        <div class="card">
          <h3>Substitution and free variables</h3>
          ${code(`
            def Expression.freeVariables : Expression → Std.HashSet String
              | .var name => {name}
              | .lambda name body => body.freeVariables |>.erase name
              | .apply func arg => func.freeVariables ∪ arg.freeVariables
              | …

            -- in substitute: stop at a λ that binds the same name (shadowing)
              | .lambda x body => if x == name then .lambda x body else …`)}
          ${ppFacts([
            ["! and ?", `Names ending in ${c("!")} may panic (${c("asInt!")}, ${c("head!")}); names ending in ${c("?")} return an ${c("Option")}.`],
            ["let rec", `A local recursive helper (${c("subst")} inside ${c("substitute")}) that sees the outer parameters.`],
            ["leading dot", `${c(".add e1 e2")} instead of ${c("Expression.add e1 e2")} when the type is known.`],
            ["abbrev", `${c("abbrev Environment := Std.HashMap String Value")} — a second name for a type.`],
          ])}
          ${ppTraps([
            `With substitution, ${c("λ x. (λ x. x + 3)")}: the inner x shadows the outer one — don't substitute into it.`,
            `A leftover ${c(".var")} after substitution means the variable was <b>unbound</b>.`,
            `Lexical scoping: the body uses the closure's env (${c("funenv")}), not the caller's (${c("env")}) — but the <b>argument</b> is still evaluated in the caller's.`,
          ])}
        </div>`,
      setup: (root) => ppInterp(root),
      check: [
        { q: "In the lecture's example, why does dynamic scoping give 82?",
          opts: ["The x in plus is looked up in the caller's environment, where x = 41", "Integers overflow", "41 is added twice by mistake in plus", "The interpreter substitutes too early"], why: "inc's body runs where prog bound x ↦ 41, so x + y = 41 + 41." },
        { q: "What does a closure contain?",
          opts: ["Parameter, body and the environment where the λ was evaluated", "Only the body", "The caller's environment", "The argument value"], why: "That saved environment is what makes lexical scoping work." },
        { q: `Free variables of ${c("λ x. x + y")}?`,
          opts: [c("{y}"), c("{x, y}"), c("{x}"), c("∅")], why: "x is bound by the λ; y isn't." },
        { q: `Why is ${c("interp!")} a ${c("partial def")}?`,
          opts: ["Running a program may not terminate, so Lean can't prove it does", "It uses HashMap", "It panics", "It has too many cases"], why: "apply interprets the body of a function, which isn't a structural part of the expression — and programs can loop." },
        { q: `What is an advantage of the environment interpreter over substitution?`,
          opts: ["It doesn't rewrite the whole body at each call", "It never panics", "It gives dynamic scoping", "It needs no Value type"], why: "Substitution traverses the body for every call; an environment is just a lookup." },
      ],
    },
  ],
});
