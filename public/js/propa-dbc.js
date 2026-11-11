// ProPa Reussner chapter 8: Design_by_Contract (topic 6) and Übung 3. The drawings check contracts as
// the code runs: a Stack whose pre- and postconditions are tested on every call, the AddTest example
// (who broke the contract?), and the Liskov rules tried on every value in a small range.

/* ---------------------------------------------------------------- 8.1 A stack with contracts */

const PP_CAP = 3;
function ppStackContract(root) {
  const { fig, read, w } = ppW(root, "dstack");
  const st = { impl: "ok", spec: "basic" };
  let s, next, last;
  const reset = () => { s = { el: Array(PP_CAP).fill(null), size: 0 }; next = 0; last = null; };
  reset();
  const top = () => s.el[s.size - 1];
  const call = (op) => {
    const old = { size: s.size, el: [...s.el], top: s.size ? top() : null };
    const tolerant = st.impl === "tolerant";
    const checks = [];
    let result, crashed = "";
    if (op === "push") {
      const x = "ABCDEFGH"[next++ % 8];
      checks.push(["pre", "requires getSize() < " + PP_CAP, s.size < PP_CAP]);
      if (s.size >= PP_CAP) crashed = "ArrayIndexOutOfBoundsException";
      else if (st.impl === "buggy") { s.size++; for (let i = 0; i < s.size; i++) s.el[i] = x; }
      else { s.el[s.size++] = x; }
      if (!crashed) {
        checks.push(["post", "ensures getSize() == \\old(getSize()) + 1", s.size === old.size + 1]);
        checks.push(["post", "ensures top() == element", top() === x]);
        if (st.spec === "full") checks.push(["post", "ensures (\\forall int i; 0 <= i && i < \\old(getSize()); elements[i] == \\old(elements[i]))", old.el.slice(0, old.size).every((v, i) => s.el[i] === v)]);
      }
      last = { call: `push(${x})`, checks, crashed };
    } else {
      const isPop = op === "pop";
      checks.push(["pre", tolerant && isPop ? "requires true" : "requires getSize() > 0", tolerant && isPop ? true : s.size > 0]);
      if (!s.size) { if (tolerant && isPop) result = "null"; else crashed = "ArrayIndexOutOfBoundsException"; }
      else if (isPop) { result = s.el[--s.size]; s.el[s.size] = null; } else result = top();
      if (!crashed) {
        if (isPop && tolerant && !old.size) checks.push(["post", "ensures \\old(getSize()) <= 0 ==> \\result == null", result === "null"]);
        else if (isPop) { checks.push(["post", "ensures getSize() == \\old(getSize()) - 1", s.size === old.size - 1]); checks.push(["post", "ensures \\result == \\old(top())", result === old.top]); }
        else checks.push(["post", "assignable \\nothing   (pure)", s.size === old.size]);
      }
      last = { call: `${op}()`, checks, crashed, result };
    }
  };
  const draw = () => {
    fig.innerHTML = `<div class="pp-stk">${s.el.map((v, i) => `<span class="pp-stk-cell ${i < s.size ? "in" : ""} ${i === s.size - 1 ? "top" : ""}"><small>${i}</small><b>${v ?? ""}</b></span>`).join("")}</div>
      <p class="small muted pp-stk-size">size = ${s.size} / ${PP_CAP}</p>
      ${last ? `<div class="pp-contract"><b>${j(last.call)}</b>${last.checks.map(([k, c, ok]) => `<div class="${ok ? "ok" : "bad"}"><span>${ok ? "✓" : "✗"}</span>${cHL("//@ " + c, "java")}</div>`).join("")}${last.crashed ? `<div class="bad"><span>💥</span>${ppEsc(last.crashed)}</div>` : ""}${last.result !== undefined && !last.crashed ? `<div><span>⇒</span>returns ${last.result}</div>` : ""}</div>` : ""}`;
    let verdict = "<p class='small'>Call the methods. Every call checks the contract.</p>";
    if (last) {
      const pre = last.checks.find((x) => x[0] === "pre"), post = last.checks.filter((x) => x[0] === "post");
      if (!pre[2]) verdict = `<p><span class="pill bad">precondition violated → the <b>client</b>'s bug</span></p><p class="small">The method promised nothing for this call. Here it crashes.</p>`;
      else if (post.some((x) => !x[2])) verdict = `<p><span class="pill bad">postcondition violated → the <b>supplier</b>'s bug</span></p><p class="small">The precondition held, so the method had to deliver.</p>`;
      else verdict = `<p><span class="pill good">contract kept</span></p>${st.impl === "buggy" && st.spec === "basic" ? `<p class="small pp-bad-note">… although push overwrote every element! The contract is too weak to notice — add the ∀ clause.</p>` : ""}`;
    }
    read.innerHTML = verdict;
  };
  const h = ppW(root, "dstack");
  ["push", "pop", "top"].forEach((op) => h.on(op, () => { call(op); draw(); }));
  h.on("reset", () => { reset(); draw(); });
  lenWire(w, st, () => { reset(); draw(); });
  draw();
}

/* ---------------------------------------------------------------- 8.2 Who broke it? */

function ppAddTest(root) {
  const { fig, read, w } = ppW(root, "add");
  const st = { a: 2, b: -1 };
  const draw = () => {
    lenOut(w, "a", st.a);
    lenOut(w, "b", st.b);
    const pre = st.b > 0;
    const result = st.a < 0 ? 1 : st.a - st.b;
    const p1 = !(st.a >= 0) || result === st.a - st.b, p2 = !(st.a < 0) || result === 0;
    const mark = (ok, src) => `<span class="${ok === null ? "" : ok ? "ok" : "bad"}">${cHL(src)}${ok === null ? "" : ok ? "   ✓" : "   ✗"}</span>`;
    fig.innerHTML = `<pre class="pp-tcode pp-addtest">${[
      "public class AddTest {",
      mark(pre, "  //@ requires b > 0;"),
      mark(pre ? p1 : null, "  //@ ensures a >= 0 ==> \\result == a-b;"),
      mark(pre ? p2 : null, "  //@ ensures a < 0 ==> \\result == 0;"),
      `  public int add(int a, int b) {`,
      mark(st.a < 0 ? true : null, "    if (a < 0) return 1;"),
      mark(st.a >= 0 ? true : null, "    return a-b;"),
      "  }",
      `  // caller: new AddTest().add(${st.a}, ${st.b})`,
      "}"].map((l) => (l.startsWith("<span") ? l : cHL(l))).join("\n")}</pre>`;
    read.innerHTML = `<p>${j(`add(${st.a}, ${st.b})`)} returns <b>${result}</b></p>
      ${!pre ? `<p><span class="pill bad">caller violates the precondition b &gt; 0</span></p><p class="small">OpenJML: “Cannot establish an assertion: precondition is false”. The method owes nothing.</p>`
        : !(p1 && p2) ? `<p><span class="pill bad">method violates its postcondition</span></p><p class="small">For a &lt; 0 it must return 0 but returns 1 — a static checker reports this without any call.</p>`
        : `<p><span class="pill good">contract kept for these values</span></p><p class="small muted">That's only one input. Try a &lt; 0: the method's bug shows for every negative a.</p>`}`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 8.3 Liskov */

const PP_PRES = { "x > 0": (x) => x > 0, "x >= 0": (x) => x >= 0, "x > 5": (x) => x > 5, "true": () => true };
const PP_POSTS = { "\\result > 0": (r) => r > 0, "\\result >= 0": (r) => r >= 0, "\\result > 10": (r) => r > 10, "true": () => true };
function ppLiskov(root) {
  const { fig, read, w } = ppW(root, "lsp");
  const st = { ps: "x > 0", qs: "\\result >= 0", pb: "x >= 0", qb: "\\result > 0" };
  const counter = (A, B) => { for (let v = -10; v <= 20; v++) if (A(v) && !B(v)) return v; return null; };
  const draw = () => {
    const preBad = counter(PP_PRES[st.ps], PP_PRES[st.pb]);   // Pre_super ⇒ Pre_sub
    const postBad = counter(PP_POSTS[st.qb], PP_POSTS[st.qs]); // Post_sub ⇒ Post_super
    fig.innerHTML = codePair(jcode(`class Super {\n  //@ requires ${st.ps};\n  //@ ensures ${st.qs};\n  int f(int x) { … }\n}`, { title: "superclass" }),
      jcode(`class Sub extends Super {\n  //@ requires ${st.pb};\n  //@ ensures ${st.qb};\n  int f(int x) { … }\n}`, { title: "subclass (overrides f)" }));
    read.innerHTML = `
      <div class="pp-lsp ${preBad === null ? "ok" : "bad"}"><b>Pre<sub>super</sub> ⇒ Pre<sub>sub</sub></b> — ${preBad === null ? "✓ the subclass accepts every call the superclass accepts" : `✗ for x = ${preBad} a client of Super may call f, but Sub forbids it (stronger precondition)`}</div>
      <div class="pp-lsp ${postBad === null ? "ok" : "bad"}"><b>Post<sub>sub</sub> ⇒ Post<sub>super</sub></b> — ${postBad === null ? "✓ the subclass promises at least as much" : `✗ Sub may return ${postBad}, which breaks Super's promise (weaker postcondition)`}</div>
      <p><span class="pill ${preBad === null && postBad === null ? "good" : "bad"}">${preBad === null && postBad === null ? "Sub can stand in for Super" : "violates the Liskov substitution principle"}</span></p>`;
  };
  ["ps", "qs", "pb", "qb"].forEach((k) => {
    const sel = $(`select[data-l="${k}"]`, w);
    sel.value = st[k];
    sel.onchange = () => { st[k] = sel.value; draw(); };
  });
  draw();
}
const ppSel = (key, opts) => `<label class="pp-sel"><span class="small muted">${{ ps: "Super requires", qs: "Super ensures", pb: "Sub requires", qb: "Sub ensures" }[key]}</span><select data-l="${key}">${opts.map((o) => `<option value="${ppEsc(o)}">${ppEsc(o)}</option>`).join("")}</select></label>`;

/* ---------------------------------------------------------------- The chapter */

PROPA_CHAPTERS.push({
  n: 8,
  part: "Reussner",
  title: "Design by Contract",
  headline: "Contracts: who has to do <span class='accent'>what</span>",
  intro: "Topic 6: correctness relative to a specification, Hoare triples, pre- and postconditions, writing contracts in JML, class invariants, the Liskov substitution principle, and checking contracts.",
  sections: [
    {
      id: "8.1",
      title: "Contracts and Hoare triples",
      short: "Contracts",
      about: "correctness, validation vs verification, {P} C {Q}, obligations and benefits, demanding vs tolerant",
      html: () => `
        <div class="card">
          ${ppGist([
            `Software is <b>correct</b> only relative to its <b>specification</b>. <b>Validation</b> tests with example inputs; <b>verification</b> proves it for all inputs.`,
            `<b>Hoare triple</b> ${j("{P} C {Q}")}: if P holds before C, then Q holds after. Example: ${j("{x >= 9} x := x + 5 {x >= 13}")}.`,
            `A <b>contract</b> between client and supplier: the <b>client</b> must ensure the <b>precondition</b>; then the <b>supplier</b> must deliver the <b>postcondition</b> (Bertrand Meyer, Eiffel).`,
            `<b>Demanding</b> design puts a condition in the precondition (client's job); <b>tolerant</b> design handles it in the body (supplier's job). <b>Non-redundancy</b>: never both — the body doesn't test its own precondition.`,
          ])}
          ${codePair(jcode(`class Stack {
  private Object[] elements = new Object[10];
  private int size = 0;
  void push(Object element) { this.elements[size++] = element; }
  public Object pop() { return this.elements[--size]; }
  public Object top() { return this.elements[size-1]; }
}
// is this usage correct?
myStack.push(new Object()); myStack.pop(); myStack.pop();`, { title: "Correct? Without a spec, you can't say" }),
            `<figure class="pp-code"><figcaption>Method push: obligations and benefits</figcaption><table class="lw-table pp-ob"><thead><tr><th></th><th>obligation</th><th>benefit</th></tr></thead><tbody>
              <tr><th>client</th><td>only call push(x) on a non-full stack</td><td>stack updated: not empty, x on top, size + 1</td></tr>
              <tr><th>supplier</th><td>update: x on top, size + 1, not empty</td><td>may assume the stack isn't full</td></tr></tbody></table></figure>`)}
          ${ppSrc(["Design_by_Contract.pdf", "Übung Parallelprogrammierung Design by Contract.pdf"])}
        </div>
        <div class="card">
          <h3>A stack that checks its contract</h3>
          ${pw("dstack", `${pseg("impl", [["ok", "correct"], ["buggy", "buggy push"], ["tolerant", "tolerant pop"]], "ok")}${pseg("spec", [["basic", "basic contract"], ["full", "+ rest unchanged (∀)"]], "basic")}<div class="lw-row">${pbtn("push", "push(x)", "primary")}${pbtn("pop", "pop()")}${pbtn("top", "top()")}${pbtn("reset", "Empty")}</div>`, { wide: true })}
          ${jcode(`public void push(Object element) {   // the slide's "buggy push"
  size++;
  for (int i = 0; i < size; i++) this.elements[i] = element;
}   // fulfils: size + 1, not empty, element on top — but destroys the rest`)}
          ${ppTraps([
            "A violated precondition is a bug in the <b>client</b>; a violated postcondition (with a precise precondition) one in the <b>supplier</b>.",
            "Contracts can be incomplete: the buggy push meets a contract that only talks about size and top.",
            "Contracts don't say how — the same contract fits many implementations (abstraction).",
          ])}
        </div>`,
      setup: (root) => ppStackContract(root),
      check: [
        { q: "pop() is called on an empty stack whose contract says requires size > 0. Whose bug is it?", opts: ["The client's", "The supplier's", "Nobody's", "The compiler's"], why: "The client broke its obligation; the supplier owes nothing then." },
        { q: `Which Hoare triple is valid?`, opts: [j("{x >= 9} x := x + 5 {x >= 13}"), j("{x >= 9} x := x + 5 {x >= 15}"), j("{x > 0} x := x - 1 {x > 0}"), j("{true} x := x * x {x > 0}")], why: "x ≥ 9 gives x + 5 ≥ 14 ≥ 13. The others fail for x = 9, x = 1 and x = 0." },
        { q: "What does the non-redundancy principle say?", opts: ["The body shall not test the method's own precondition", "Every condition must be checked twice", "Postconditions must not repeat preconditions", "Only one method may have a contract"], why: "Either the client is responsible (demanding) or the supplier (tolerant) — not both." },
        { q: "Validation vs verification?", opts: ["Testing with examples vs proving for all inputs", "The same thing", "Proving vs testing", "Compile time vs run time"], why: "Verification is universally quantified." },
        { q: "pop() returns null for an empty stack instead of having a precondition. That's …", opts: ["tolerant precondition design", "demanding precondition design", "a Liskov violation", "redundant"], why: "The supplier handles the case in its body and must specify that behaviour." },
      ],
    },
    {
      id: "8.2",
      title: "JML",
      short: "JML",
      about: "requires, ensures, \\old, \\result, quantifiers, pure, assignable, signals, invariants",
      html: () => `
        <div class="card">
          ${ppGist([
            `JML contracts are special comments: ${j("/*@ … @*/")} or ${j("//@")}. ${j("requires")} = precondition, ${j("ensures")} = postcondition; several lines are joined with “and”.`,
            `In postconditions: ${j("\\result")} (the return value) and ${j("\\old(E)")} (E before the call). Logic: ${j("==>")} implies, ${j("<==>")} iff, ${j("<=!=>")} not iff.`,
            `Quantifiers: ${j("(\\forall int i; range; body)")}, ${j("\\exists")}, also ${j("\\sum")}, ${j("\\max")}, ${j("\\min")}.`,
            `${j("pure")} = no side effects (implies ${j("assignable \\nothing")}); only pure methods may appear in contracts. ${j("signals (E e) P")}: if E is thrown, P holds. ${j("invariant")}: holds in every visible state.`,
          ])}
          ${codePair(jcode(`class Stack {
  //@ invariant size >= 0 && size <= 10;
  private /*@ spec_public @*/ Object[] elements = new Object[10];
  private /*@ spec_public @*/ int size = 0;

  /*@ requires size > 0;
    @ ensures size == \\old(size) - 1;
    @ ensures \\result == \\old(top());
    @ ensures (\\forall int i; 0 <= i && i < size;
    @           \\old(elements[i]) == elements[i]);
    @*/
  Object pop() { … }
}`, { title: "pop, fully specified" }),
            jcode(`/*@ requires size < 10;
  @ signals (NullPointerException npEx) element == null;
  @ ensures …
  @*/
void push(Object element) { … }

/*@ requires size > 0;
  @ assignable \\nothing;
  @*/
Object top() { … }

public /*@ pure @*/ int getElementCount() { return size; }`, { title: "Exceptions, side effects, pure" }))}
          ${ppSrc(["Design_by_Contract.pdf"])}
        </div>
        <div class="card">
          <h3>Where is this contract violated?</h3>
          ${pw("add", `${pslider("a", "a", -5, 5, 1, 2)}${pslider("b", "b", -3, 3, 1, -1)}`)}
          ${ppFacts([
            ["class correctness", `C is correct ⇔ every constructor I: ${j("{PRE_I} BODY_I {POST_I && INV}")} and every method M: ${j("{PRE_M && INV} BODY_M {POST_M && INV}")}.`],
            [j("requires true"), "the weakest precondition; can be left out."],
            [j("nullable / non_null"), "reference types are non_null by default in JML; mark the exceptions nullable (or the class nullable_by_default)."],
            [j("spec_public / private behavior"), "ways to mention private fields in a contract."],
            ["Eiffel and OCL", `Eiffel: ${j("require")} … ${j("ensure size = old size - 1")}. OCL (UML): ${j("context Stack::pop() pre: … post: … size@pre")}.`],
          ])}
          ${ppTraps([
            "signals says an exception <b>may</b> be thrown (and what holds then), not that it <b>must</b> be.",
            `${j("\\old")} and ${j("\\result")} only exist in postconditions.`,
            "A method with side effects (not pure) must not be used inside a contract.",
          ])}
        </div>`,
      setup: (root) => ppAddTest(root),
      check: [
        { q: `${j("//@ ensures \\result == \\old(size) - 1;")} — what is ${j("\\old(size)")}?`, opts: ["size before the method ran", "size after the method", "the initial value of the field", "the previous object's size"], why: "\\old evaluates its expression in the pre-state." },
        { q: `What does ${j("pure")} on a method mean?`, opts: ["It has no side effects, so it may be used in contracts", "It is static", "It never throws", "It is synchronized"], why: "pure implies assignable \\nothing." },
        { q: "add(2, -1) with requires b > 0. OpenJML says …", opts: ["the precondition is false at the call: the caller's error", "the postcondition fails", "nothing", "the invariant fails"], why: "b = −1 breaks the precondition." },
        { q: `${j("//@ signals (NullPointerException e) element == null;")} means …`, opts: ["If an NPE is thrown, element was null", "push always throws an NPE for null", "element may never be null", "NPEs are caught"], why: "It constrains the exceptional post-state; it doesn't force the exception." },
        { q: "When must a class invariant hold?", opts: ["After every constructor, and before and after every (visible) method", "Only at the end of the program", "Only inside methods", "Only before constructors"], why: "In all states a client can observe." },
      ],
    },
    {
      id: "8.3",
      title: "Liskov, availability and checking",
      short: "Liskov",
      about: "Liskov substitution principle, precondition availability, static and runtime checking, assertions",
      html: () => `
        <div class="card">
          ${ppGist([
            `<b>Liskov</b>: an overriding method may <b>weaken</b> the precondition (${j("Pre_super ⇒ Pre_sub")}) and <b>strengthen</b> the postcondition (${j("Post_sub ⇒ Post_super")}); invariants may only get stronger.`,
            `<b>Precondition availability</b>: everything in a precondition must be accessible to every client that can call the method — ${j("requires size > 0")} with a private size breaks it; add a pure ${j("getElementCount()")}.`,
            `Checking: <b>static</b> (verification without running, e.g. KeY, OpenJML -esc), <b>runtime</b> (contracts become checks, OpenJML -rac), or <b>generated tests</b> (jmlunit).`,
            `Java ${j("assert")} can simulate contracts at run time, but it's no specification language and no input check. <b>Assertion violation rule</b>: a violated assertion is a bug in the software.`,
          ])}
          ${codePair(jcode(`class Stack {
  //@ requires element != null;
  void push(Object element) { … }
  //@ ensures \\result != null;
  Object pop() { … }
}
class NullAcceptingStack extends Stack {
  //@ requires true;          // weaker: fine
  void push(Object element) { … }
  //@ ensures true;           // weaker: NOT fine
  Object pop() { … }
}`, { title: "Does this respect Liskov?" }),
            jcode(`Object pop() {
  assert size > 0;                 // precondition
  int _oldSize = size;             // remember \\old values
  Object _oldTop = top();
  // … pop logic …
  assert size == _oldSize - 1;     // postcondition
  assert result == _oldTop;
  return result;
}`, { title: "Contracts as assertions" }))}
          ${ppSrc(["Design_by_Contract.pdf", "Übung Parallelprogrammierung Design by Contract.pdf"])}
        </div>
        <div class="card">
          <h3>Try the Liskov rules</h3>
          ${pw("lsp", `${ppSel("ps", Object.keys(PP_PRES))}${ppSel("qs", Object.keys(PP_POSTS))}${ppSel("pb", Object.keys(PP_PRES))}${ppSel("qb", Object.keys(PP_POSTS))}`, { wide: true })}
          ${ppFacts([
            ["run-time checking costs", "only in debug builds; contracts report bugs, they are not error handling."],
            ["best use", `when the postcondition is simpler than the code: ${j("//@ ensures \\result * \\result == a;")} for a square root.`],
            ["limitation", "protocols (“call A before B”) can't be expressed directly — only through status variables."],
            ["assertions vs JML", "+ plain Java, run anywhere; − only Java expressions, no \\old/quantifiers, no documentation value, not for user input, unsuited to tolerant design (that needs real control flow)."],
          ])}
          ${ppTraps([
            "Same rule as co-/contravariance: parameters (pre) may get more general, results (post) more specific.",
            "Postconditions may mention internal state, preconditions may not (availability).",
            "Runtime checking only finds violations on the paths that actually run — it's not verification.",
          ])}
        </div>`,
      setup: (root) => ppLiskov(root),
      check: [
        { q: "Super: requires x > 0. Which Sub precondition is allowed?", opts: [j("requires x >= 0"), j("requires x > 5"), j("requires x > 10"), j("requires x == 1")], why: "It must accept at least what Super accepts: x > 0 ⇒ x ≥ 0." },
        { q: "Super: ensures \\result > 0. Which Sub postcondition is allowed?", opts: [j("ensures \\result > 10"), j("ensures \\result >= 0"), j("ensures true"), j("ensures \\result != 5")], why: "It must promise at least as much: > 10 ⇒ > 0." },
        { q: "requires size > 0 where size is private. Which rule is broken?", opts: ["Precondition availability", "Liskov", "Non-redundancy", "Assertion violation"], why: "Clients can't check a condition on a field they can't see." },
        { q: "Which kind of checking proves a contract for all inputs?", opts: ["Static verification", "Runtime assertion checking", "Generated unit tests", "Code review"], why: "The others only see the executions that happen." },
        { q: "Are Java assertions suited for tolerant precondition design?", opts: ["No — tolerant design needs real control flow (if/else), assertions only flag bugs", "Yes, that's their purpose", "Only with -ea", "Only for public methods"], why: "Assertions can be switched off and aren't meant to handle cases." },
      ],
    },
  ],
});
