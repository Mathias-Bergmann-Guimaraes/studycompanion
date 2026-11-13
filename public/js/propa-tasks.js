// ProPa exam tasks: whole tasks like the old exams' (propa-exams.js), several sub-questions each,
// written in our own words, with new values where it makes sense. Used one at a time by Practice
// (mode "Exam tasks") and put together by the Mock exam tab (propa-mock.js).
//
// A generator { id, topic, name, like: "2626-ss/3", make } makes { intro: html, parts: [part] }.
// A part is one of
//   choice:  { kind: "mc", ask, mc: [html, …] (the first is right; shown shuffled), pts, why }
//   value:   { kind: "val", ask, ans: [accepted answers], pts, why } — checked as typed, spaces and
//            case aside; numbers within rounding
//   writing: { kind: "write", ask, model: source, lang, rubric: [[points, what earns them]], why } —
//            you write it on the page (or on paper), then mark it yourself against the model
//            solution, ticking what the rubric asks for, like the exam's marking scheme.

const pmMC = (ask, mc, pts, why = "", fixed = false) => ({ kind: "mc", ask, mc, pts, why, fixed });
const pmVal = (ask, ans, pts, why = "") => ({ kind: "val", ask, ans: [].concat(ans).map(String), pts, why });
// A model's first line starts right after the backtick; the lines after it carry this file's
// indentation of 10 spaces (the column of that backtick), which is taken off here.
const pmW = (ask, model, rubric, { lang = "lean", why = "" } = {}) => ({
  kind: "write", ask, lang, rubric, why, pts: rubric.reduce((s, [p]) => s + p, 0),
  model: model.split("\n").map((l, i) => (i ? l.replace(/^ {0,10}/, "") : l)).join("\n"),
});
const pmJ = { lang: "java" }, pmC = { lang: "c" };
const pmList = (xs) => `[${xs.join(", ")}]`;
const pmArr = (xs) => `{ ${xs.join(", ")} }`;
const pmStr = (xs) => `[${xs.map((x) => `"${x}"`).join(", ")}]`;
// Distinct random ints.
const pmDistinct = (n, a, b) => { const s = new Set(); while (s.size < n) s.add(rint(a, b)); return [...s]; };

const PROPA_TASKS = [];
const pmT = (g) => PROPA_TASKS.push(g);

/* ================================================================ Lean: lists and HashMap */

pmT({
  id: "enrol", topic: "list", name: "Enrolments per course", like: "2626-ss/1",
  make() {
    const courses = ["LA", "ProPa", "HM", "Algo"];
    const es = Array.from({ length: 5 }, () => pick(courses.slice(0, 3)));
    const q = pick(courses);
    const n = es.filter((x) => x === q).length;
    return {
      intro: code(`
        structure Enrolment where
          student : String
          course  : String
        deriving Repr`),
      parts: [
        pmW(`Write ${c("coursesOf (s : String) (es : List Enrolment) : List String")}: the courses of student ${c("s")}, using ${c("filter")} and ${c("map")}.`,
          `def coursesOf (s : String) (es : List Enrolment) : List String :=
            es.filter (·.student == s) |>.map (·.course)`,
          [[1, "filter keeps the entries whose student is s (with ==)"], [1, "map takes the course out of each entry"]]),
        pmW(`Write ${c("bump (m : Std.HashMap String Nat) (k : String)")}: add 1 to the entry of ${c("k")}, or set it to 1 if there is none.`,
          `def bump (m : Std.HashMap String Nat) (k : String) : Std.HashMap String Nat :=
            match m[k]? with
            | some n => m.insert k (n + 1)
            | none   => m.insert k 1`,
          [[1, "looks the key up with m[k]? (or m.getD k 0)"], [1, "an existing entry becomes n + 1 (insert replaces it)"], [1, "a missing key is inserted with 1"]]),
        pmW(`Write ${c("countPerCourse (es : List Enrolment) : Std.HashMap String Nat")} with ${c("foldl")}: how many students each course has.`,
          `def countPerCourse (es : List Enrolment) : Std.HashMap String Nat :=
            es.foldl (fun m e => bump m e.course) {}`,
          [[1, "foldl starting from the empty map {}"], [1, "calls bump with e.course for every entry"]]),
        pmVal(`The courses of ${c("es")} are ${pmStr(es)}, in order. What is ${c(`(countPerCourse es)["${q}"]?`)}?`,
          n ? [`some ${n}`] : ["none"], 1, n ? `“${q}” occurs ${n}× — ${c("m[k]?")} wraps the count in ${c("some")}.` : `“${q}” never occurs, so there is no entry: ${c("none")}.`),
      ],
    };
  },
});

pmT({
  id: "safediv", topic: "list", name: "Dividing lists safely", like: "2526-ws/1",
  make() {
    const xs = rlist(rint(3, 4), 1, 9), ys = rlist(rint(2, 3), 1, 9);
    const zip = xs.slice(0, Math.min(xs.length, ys.length)).map((x, i) => `(${x}, ${ys[i]})`);
    const ds = shuffle([pick([1, 2, 3]), 0, pick([4, 6, 12])]);
    const fm = ds.filter((d) => d).map((d) => 12 / d);
    return {
      intro: code(`
        structure NonZeroFloat where
          private mk ::
          val : Float`),
      parts: [
        pmVal(`What is ${c(`${pmList(xs)}.zip ${pmList(ys)}`)}?`, [pmList(zip)], 1, "zip pairs up elements and stops at the end of the shorter list."),
        pmW(`Write ${c("divideAll (xs ys : List Float) : List Float")}: divide pairwise, skipping pairs whose denominator is 0. Use ${c("zip")}, ${c("filter")} and ${c("map")}.`,
          `def divideAll (xs ys : List Float) : List Float :=
            (xs.zip ys).filter (fun (_, d) => d != 0) |>.map (fun (n, d) => n / d)`,
          [[1, "zip the two lists"], [1, "filter drops the pairs with d = 0"], [1, "map divides n / d"]]),
        pmMC(`Why is ${c("mk")} private?`, ["So nobody outside can build a NonZeroFloat without going through the check", "It makes the structure faster", "It hides the field val from readers", "Lean requires private constructors on structures"], 1,
          "A smart constructor: the only public way in checks the invariant, so every value of the type keeps it."),
        pmW(`Write the smart constructor ${c("NonZeroFloat.mk! (x : Float) : NonZeroFloat")}: it panics on 0.`,
          `def NonZeroFloat.mk! (x : Float) : NonZeroFloat :=
            if x == 0 then panic! "zero is not allowed" else ⟨x⟩`,
          [[1, "checks x == 0 and calls panic!"], [1, "otherwise builds the value with the (private) constructor"]]),
        pmVal(`What is ${c(`${pmList(ds)}.filterMap (fun x => if x == 0 then none else some (12 / x))`)}?`, [pmList(fm)], 1, "filterMap drops the nones and unwraps the somes."),
      ],
    };
  },
});

pmT({
  id: "words", topic: "list", name: "Word statistics", like: "2626-ss/1",
  make() {
    const ws = shuffle(["ab", "c", "lean", "map", "fold", "x", "type"]).slice(0, 3);
    return {
      intro: `<p>A text is a ${c("List String")} of words.</p>`,
      parts: [
        pmVal(`What is ${c(`${pmStr(ws)}.map String.length |>.foldl (· + ·) 0`)}?`, [String(ws.join("").length)], 1, `The lengths ${pmList(ws.map((w) => w.length))} added up.`),
        pmW(`Write ${c("longWords (n : Nat) (ws : List String) : List String")}: the words longer than ${c("n")}.`,
          `def longWords (n : Nat) (ws : List String) : List String :=
            ws.filter (·.length > n)`,
          [[1, "filter over the words"], [1, "compares the length with > n"]]),
        pmW(`Write ${c("wordFreq (ws : List String) : Std.HashMap String Nat")} with ${c("foldl")}: how often each word occurs.`,
          `def wordFreq (ws : List String) : Std.HashMap String Nat :=
            ws.foldl (fun m w => m.insert w (m.getD w 0 + 1)) {}`,
          [[1, "foldl starting from the empty map {}"], [1, "the old count with getD w 0 (or a match on m[w]?)"], [1, "insert w with the old count + 1"]]),
        pmMC(`What is ${c(`(wordFreq ws)["zz"]?`)} for a word that isn't in ${c("ws")}?`, [c("none"), c("some 0"), c("0"), "It panics"], 2, `${c("m[k]?")} returns an Option; only ${c("m[k]!")} panics, and ${c("getD")} would give the default.`),
      ],
    };
  },
});

/* ================================================================ Lean: data types */

pmT({
  id: "tv", topic: "adt", name: "A TV and its remote", like: "2526-ws/2",
  make() {
    const sigs = [".power", ...Array.from({ length: rint(4, 6) }, () => pick([".volUp", ".volUp", ".volDown", `.channel ${rint(2, 9)}`, ".power"]))];
    let tv = { on: false, ch: 1, vol: 20 };
    for (const s of sigs) {
      if (s === ".power") tv.on = !tv.on;
      else if (!tv.on) continue;
      else if (s === ".volUp") tv.vol = Math.min(100, tv.vol + 1);
      else if (s === ".volDown") tv.vol = Math.max(0, tv.vol - 1);
      else tv.ch = +s.split(" ")[1];
    }
    const askVol = Math.random() < 0.5;
    return {
      intro: `<p>A TV is on or off and has a channel and a volume (0 to 100). The remote sends signals: power, a channel number, volume up, volume down.</p>${code(`
        def receiveAll (tv : TV) (ss : List Signal) : TV := ss.foldl receive tv`)}`,
      parts: [
        pmW(`Write the structure ${c("TV")} and ${c("TV.default")}: off, channel 1, volume 20.`,
          `structure TV where
            on      : Bool
            channel : Nat
            volume  : Nat
          deriving Repr

          def TV.default : TV := { on := false, channel := 1, volume := 20 }`,
          [[1, "three fields with fitting types (Bool, Nat, Nat)"], [1, "the default with { … := … } (or ⟨false, 1, 20⟩)"]]),
        pmW(`Write the inductive type ${c("Signal")}.`,
          `inductive Signal where
            | power
            | channel (n : Nat)
            | volUp
            | volDown`,
          [[1, "four constructors"], [1, "only channel carries data (a Nat)"]]),
        pmW(`Write ${c("receive (tv : TV) (s : Signal) : TV")}. Power always toggles; every other signal is ignored while the TV is off; the volume stays between 0 and 100.`,
          `def receive (tv : TV) (s : Signal) : TV :=
            match s with
            | .power => { tv with on := !tv.on }
            | _ => if !tv.on then tv else
              match s with
              | .channel n => { tv with channel := n }
              | .volUp     => { tv with volume := min 100 (tv.volume + 1) }
              | .volDown   => { tv with volume := tv.volume - 1 }  -- Nat: 0 - 1 = 0
              | .power     => tv`,
          [[1, "power toggles on, also when the TV is off"], [1, "other signals change nothing while off"], [1, "changes with structure update { tv with … }"], [2, "volume capped at 100; and never below 0 (Nat subtraction stops at 0, or an explicit check)"]]),
        pmVal(`What is ${c(`(receiveAll TV.default [${sigs.join(", ")}]).${askVol ? "volume" : "channel"}`)}?`, [String(askVol ? tv.vol : tv.ch)], 2,
          `Go through the signals in order, skipping everything while the TV is off: it ends ${tv.on ? "on" : "off"}, on channel ${tv.ch} at volume ${tv.vol}.`),
      ],
    };
  },
});

pmT({
  id: "vending", topic: "adt", name: "A vending machine", like: "2626-ss/2",
  make() {
    const price = rint(2, 4), stock = pick([0, 1, 1, 2]);
    const coins = Array.from({ length: rint(1, 3) }, () => rint(1, 2));
    const credit = coins.reduce((a, b) => a + b, 0);
    const out = stock === 0 ? "soldOut" : credit < price ? `missing ${price - credit}` : `product ${credit - price}`;
    const after = out.startsWith("product") ? 0 : credit;
    const inputs = [...coins.map((n) => `.coin ${n}`), ".buy"];
    return {
      intro: code(`
        structure Machine where
          credit : Nat     -- coins put in so far
          stock  : Nat
          price  : Nat
        deriving Repr

        inductive Input where
          | coin (n : Nat)
          | buy
          | refill (n : Nat)`),
      parts: [
        pmW(`Write ${c("Output")} with four cases: ${c("ok")} (nothing to report), ${c("soldOut")}, ${c("missing")} (how much credit is short) and ${c("product")} (with the change).`,
          `inductive Output where
            | ok
            | soldOut
            | missing (n : Nat)
            | product (change : Nat)`,
          [[1, "four constructors"], [1, "data only on missing and product"]]),
        pmW(`Write ${c("step (m : Machine) : Input → Machine × Output")}. Buying checks the stock first, then the credit; a sale takes one item, gives the change and resets the credit.`,
          `def step (m : Machine) : Input → Machine × Output
            | .coin n   => ({ m with credit := m.credit + n }, .ok)
            | .refill n => ({ m with stock := m.stock + n }, .ok)
            | .buy =>
              if m.stock = 0 then (m, .soldOut)
              else if m.credit < m.price then (m, .missing (m.price - m.credit))
              else ({ m with stock := m.stock - 1, credit := 0 }, .product (m.credit - m.price))`,
          [[1, "coin adds to the credit"], [1, "refill adds to the stock"], [1, "sold out is checked first"], [1, "too little credit: missing with the difference, machine unchanged"], [1, "a sale: stock − 1 and credit back to 0, with structure update"], [1, "change = credit − price"]]),
        pmVal(`Start from ${c(`{ credit := 0, stock := ${stock}, price := ${price} }`)} and run ${c(`[${inputs.join(", ")}]`)} one step after the other. What is the Output of ${c(".buy")}?`,
          [out, `Output.${out}`, `.${out}`], 2, stock === 0 ? "Nothing in stock: soldOut comes first, whatever the credit." : `Credit ${credit}, price ${price}: ${credit < price ? `${price - credit} short` : `${credit - price} change`}.`),
        pmVal("And the credit after that step?", [String(after)], 1, after ? "No sale, so the credit stays." : "A sale resets the credit to 0."),
      ],
    };
  },
});

pmT({
  id: "shapes", topic: "adt", name: "Shapes", like: "2526-ws/2",
  make() {
    const a = rint(2, 9), b = rint(2, 9);
    return {
      intro: code(`
        inductive Shape where
          | circle (r : Float)
          | rect (w h : Float)
          | square (s : Float)
        deriving Repr`),
      parts: [
        pmW(`Write ${c("Shape.area : Shape → Float")} (π ≈ 3.14159).`,
          `def Shape.area : Shape → Float
            | .circle r => 3.14159 * r * r
            | .rect w h => w * h
            | .square s => s * s`,
          [[1, "a case for each constructor, with its data bound"], [1, "circle π·r²"], [1, "rect w·h and square s·s"]]),
        pmVal(`What is ${c(`(Shape.rect ${a} ${b}).area`)}?`, [String(a * b)], 2, `${a} · ${b}.`),
        pmW(`Write ${c("Shape.scale (k : Float) : Shape → Shape")}: every length times ${c("k")}.`,
          `def Shape.scale (k : Float) : Shape → Shape
            | .circle r => .circle (k * r)
            | .rect w h => .rect (k * w) (k * h)
            | .square s => .square (k * s)`,
          [[1, "builds a new shape of the same constructor"], [1, "scales every length (both w and h)"]]),
        pmW(`Write ${c("totalArea (ss : List Shape) : Float")} with ${c("map")} and a fold.`,
          `def totalArea (ss : List Shape) : Float :=
            (ss.map Shape.area).foldl (· + ·) 0`,
          [[1, "map Shape.area"], [1, "fold with + from 0"]]),
        pmMC(`What does ${c("deriving Repr")} give you?`, [`${c("#eval")} can print Shape values`, "Shapes can be compared with ==", "Shapes can be sorted", "A default Shape"], 2, `Repr is for printing; == needs ${c("BEq")}, a default ${c("Inhabited")}.`),
      ],
    };
  },
});

/* ================================================================ Lean: recursion and folds */

pmT({
  id: "pairmap", topic: "rec", name: "Maps as lists of pairs", like: "2626-ss/3",
  make() {
    const x = rint(1, 9), y = rint(10, 19), z = rint(20, 29);
    const k = pick(["a", "b", "c"]);
    const v = { a: x, b: z, c: 0 }[k];
    return {
      intro: code(`abbrev Map := List (String × Nat)   -- each key at most once`),
      parts: [
        pmW(`Write ${c("findWithDefault (m : Map) (k : String) (d : Nat) : Nat")} by recursion.`,
          `def findWithDefault (m : Map) (k : String) (d : Nat) : Nat :=
            match m with
            | [] => d
            | (k', v) :: rest => if k == k' then v else findWithDefault rest k d`,
          [[1, "the empty map gives d"], [1, "the right key gives its value"], [1, "otherwise recursion on the rest"]]),
        pmW(`Write ${c("insert (m : Map) (k : String) (v : Nat) : Map")}: an existing key gets the new value, keys stay unique.`,
          `def insert (m : Map) (k : String) (v : Nat) : Map :=
            match m with
            | [] => [(k, v)]
            | (k', v') :: rest =>
              if k == k' then (k, v) :: rest
              else (k', v') :: insert rest k v`,
          [[1, "into the empty map: a one-pair list"], [1, "same key: replace the pair, keep the rest as it is"], [1, "other key: keep the pair and recurse"], [1, "no key appears twice in the result"]]),
        pmW(`Write ${c("union (m1 m2 : Map) : Map")} with ${c("foldl")} and ${c("insert")}. On a shared key, ${c("m1")} wins.`,
          `def union (m1 m2 : Map) : Map :=
            m1.foldl (fun acc (k, v) => insert acc k v) m2`,
          [[1, "foldl over one map, inserting into the other"], [1, "starts from m2"], [2, "inserts the pairs of m1 last, so they override"]]),
        pmVal(`What is ${c(`findWithDefault (union [("a", ${x})] [("a", ${y}), ("b", ${z})]) "${k}" 0`)}?`, [String(v)], 2,
          { a: "The left map wins on “a”.", b: "“b” only comes from the right map.", c: "No “c” anywhere: the default." }[k]),
        pmMC(`How long does ${c("findWithDefault")} take on a map with n pairs?`, ["O(n)", "O(1)", "O(log n)", "O(n²)"], 2, "It may walk the whole list: a HashMap would be O(1) on average."),
      ],
    };
  },
});

pmT({
  id: "listset", topic: "rec", name: "Sets as lists", like: "2526-ws/3",
  make() {
    const m = pick([2, 3, 4]);
    const xs = pmDistinct(4, 1, 12);
    const n = new Set(xs.map((x) => x % m)).size;
    return {
      intro: code(`abbrev NatSet := List Nat   -- no duplicates`),
      parts: [
        pmW(`Write ${c("contains (s : NatSet) (x : Nat) : Bool")} by recursion.`,
          `def contains : NatSet → Nat → Bool
            | [], _ => false
            | y :: ys, x => x == y || contains ys x`,
          [[1, "[] gives false"], [1, "compares the head, else recursion"]]),
        pmW(`Write ${c("insert (s : NatSet) (x : Nat) : NatSet")} that keeps the set free of duplicates.`,
          `def insert (s : NatSet) (x : Nat) : NatSet :=
            if contains s x then s else x :: s`,
          [[1, "checks contains first"], [1, "only conses x if it's new"]]),
        pmW(`Write ${c("inter (s t : NatSet) : NatSet")}, the intersection.`,
          `def inter : NatSet → NatSet → NatSet
            | [], _ => []
            | x :: xs, ys => if contains ys x then x :: inter xs ys else inter xs ys`,
          [[1, "base case []"], [1, "keeps x only if it is in the other set"], [1, "plain :: is safe: x is unique in xs already"], [1, "recursion on the first set"]]),
        pmW(`Write ${c("NatSet.map (f : Nat → Nat) (s : NatSet) : NatSet")}.`,
          `def NatSet.map (f : Nat → Nat) : NatSet → NatSet
            | [] => []
            | x :: xs => insert (NatSet.map f xs) (f x)`,
          [[1, "recursion over the set"], [2, "insert instead of :: — f can map two elements to the same value"]]),
        pmVal(`How many elements has ${c(`NatSet.map (· % ${m}) ${pmList(xs)}`)}?`, [String(n)], 2, `The remainders are ${pmList(xs.map((x) => x % m))}; ${n} different ones.`),
        pmMC(`How long does ${c("inter s t")} take, with |s| = n and |t| = m?`, ["O(n · m)", "O(n + m)", "O(n)", "O(m log n)"], 2, "contains walks t once for every element of s."),
      ],
    };
  },
});

pmT({
  id: "bst", topic: "rec", name: "Binary search trees", like: "2526-ws/3",
  make() {
    const xs = Array.from({ length: 6 }, () => rint(1, 9));
    const sorted = [...new Set(xs)].sort((a, b) => a - b);
    return {
      intro: code(`
        inductive Tree where
          | leaf
          | node (l : Tree) (v : Nat) (r : Tree)

        def fromList (xs : List Nat) : Tree := xs.foldl Tree.insert .leaf`),
      parts: [
        pmW(`Write ${c("Tree.size")} and ${c("Tree.sum")}.`,
          `def Tree.size : Tree → Nat
            | .leaf => 0
            | .node l _ r => l.size + 1 + r.size

          def Tree.sum : Tree → Nat
            | .leaf => 0
            | .node l v r => l.sum + v + r.sum`,
          [[1, "leaf counts 0"], [1, "size: both subtrees + 1"], [1, "sum: both subtrees + v"]]),
        pmW(`Write ${c("Tree.toList")}: the values in order (left, node, right).`,
          `def Tree.toList : Tree → List Nat
            | .leaf => []
            | .node l v r => l.toList ++ [v] ++ r.toList`,
          [[1, "leaf gives []"], [2, "left ++ [v] ++ right, in that order"]]),
        pmW(`Write ${c("Tree.insert (t : Tree) (x : Nat) : Tree")} for a search tree; a value that's already there is not added again.`,
          `def Tree.insert : Tree → Nat → Tree
            | .leaf, x => .node .leaf x .leaf
            | .node l v r, x =>
              if x < v then .node (l.insert x) v r
              else if x > v then .node l v (r.insert x)
              else .node l v r`,
          [[1, "a leaf becomes a single node"], [1, "smaller goes left"], [1, "bigger goes right"], [1, "equal: the tree stays as it is"]]),
        pmVal(`What is ${c(`(fromList ${pmList(xs)}).toList`)}?`, [pmList(sorted)], 2, "An in-order walk of a search tree gives the values sorted, each once."),
        pmMC(`You insert 1, 2, …, n in this order into an empty tree. How deep does it get?`, ["n", "log₂ n", "n / 2", "2"], 3, "Each value is bigger than all before, so every node only has a right child: a list in disguise."),
      ],
    };
  },
});

pmT({
  id: "folds", topic: "rec", name: "Writing with folds", like: "2626-ss/3",
  make() {
    const xs = rlist(3, 1, 9);
    const [a, b, d] = xs;
    return {
      intro: `<p>${c("foldl (f : β → α → β) (init : β) : List α → β")}, ${c("foldr (f : α → β → β) (init : β) : List α → β")}.</p>`,
      parts: [
        pmVal(`What is ${c(`List.foldl (· - ·) 0 ${pmList(xs)}`)} (on Int)?`, [String(-a - b - d)], 2, `((0 − ${a}) − ${b}) − ${d}.`),
        pmVal(`What is ${c(`List.foldr (· - ·) 0 ${pmList(xs)}`)} (on Int)?`, [String(a - (b - d))], 2, `${a} − (${b} − (${d} − 0)).`),
        pmW(`Write ${c("myReverse (xs : List α) : List α")} with one ${c("foldl")}.`,
          `def myReverse (xs : List α) : List α :=
            xs.foldl (fun acc x => x :: acc) []`,
          [[1, "foldl starting from []"], [2, "conses each element in front of the accumulator"]]),
        pmW(`Write ${c("myMap (f : α → β) (xs : List α) : List β")} with one ${c("foldr")}.`,
          `def myMap (f : α → β) (xs : List α) : List β :=
            xs.foldr (fun x acc => f x :: acc) []`,
          [[1, "foldr starting from []"], [2, "f x :: acc keeps the order"]]),
        pmW(`Write ${c("myFilter (p : α → Bool) (xs : List α) : List α")} by plain recursion.`,
          `def myFilter (p : α → Bool) : List α → List α
            | [] => []
            | x :: xs => if p x then x :: myFilter p xs else myFilter p xs`,
          [[1, "base case"], [2, "keeps x only when p x, recursion in both branches"]]),
        pmMC(`Which is true about ${c("foldl")} in Lean?`, ["It is tail-recursive", "It works on infinite lists", "It always gives the same as foldr", "It needs a commutative function"], 2, "foldl's recursive call is its last step; with − or :: it differs from foldr."),
      ],
    };
  },
});

/* ================================================================ Lean: interpreter */

pmT({
  id: "letinterp", topic: "interp", name: "An interpreter with let", like: "2626-ss/4",
  make() {
    const a = rint(1, 9), b = rint(1, 9);
    const withY = Math.random() < 0.7;
    return {
      intro: code(`
        inductive Expr where
          | const (n : Int)
          | var (x : String)
          | add (a b : Expr)
          | letIn (x : String) (e body : Expr)   -- let x := e in body

        abbrev Env := List (String × Int)`),
      parts: [
        pmW(`Write the ${c("Expr")} value ${c("ex")} for ${c(`let x := ${a} in x + y`)}.`,
          `def ex : Expr := .letIn "x" (.const ${a}) (.add (.var "x") (.var "y"))`,
          [[1, "letIn with the name and the bound expression"], [1, "the body: add of the two variables"]]),
        pmW(`Write ${c("eval (env : Env) : Expr → Option Int")} with do-notation. An unknown variable gives ${c("none")}.`,
          `def eval (env : Env) : Expr → Option Int
            | .const n => some n
            | .var x => env.lookup x
            | .add a b => do
                let va ← eval env a
                let vb ← eval env b
                return va + vb
            | .letIn x e body => do
                let v ← eval env e
                eval ((x, v) :: env) body`,
          [[1, "const and var (lookup already gives an Option)"], [1, "add with ← on both sides"], [1, "a none anywhere makes the result none"], [1, "letIn evaluates e first"], [1, "then the body in env extended at the front, so the new x shadows an old one"]]),
        pmVal(`What is ${c(`eval ${withY ? `[("y", ${b})]` : "[]"} ex`)}?`, withY ? [`some ${a + b}`] : ["none"], 2, withY ? `x is ${a}, y is ${b}.` : "y is unbound: the lookup fails and bind passes none on."),
      ],
    };
  },
});

pmT({
  id: "divinterp", topic: "interp", name: "Errors with Except", like: "2526-ws/4",
  make() {
    const zero = Math.random() < 0.4;
    const b = rint(3, 9), dd = zero ? 0 : rint(1, b - 1), cc_ = b - dd, q = rint(2, 6), a = q * Math.max(dd, 1);
    return {
      intro: code(`
        inductive Expr where
          | num (n : Int)
          | sub (a b : Expr)
          | div (a b : Expr)`),
      parts: [
        pmW(`Write ${c("eval : Expr → Except String Int")}. Dividing by 0 throws ${c('"division by zero"')}.`,
          `def eval : Expr → Except String Int
            | .num n => pure n
            | .sub a b => do
                let x ← eval a
                let y ← eval b
                pure (x - y)
            | .div a b => do
                let x ← eval a
                let y ← eval b
                if y == 0 then throw "division by zero"
                pure (x / y)`,
          [[1, "num with pure (or .ok)"], [1, "sub evaluates both sides with ←"], [1, "div checks the denominator after evaluating it"], [1, "throw with the message"], [1, "the result wrapped with pure"]]),
        pmVal(`What is ${c(`eval (.div (.num ${a}) (.sub (.num ${b}) (.num ${cc_})))`)}?`,
          zero ? ['Except.error "division by zero"', 'error "division by zero"'] : [`Except.ok ${q}`, `ok ${q}`], 2, zero ? `${b} − ${cc_} = 0.` : `${a} / (${b} − ${cc_}) = ${a} / ${dd}.`),
        pmMC(`In ${c("do let x ← eval a; let y ← eval b; …")}, ${c("eval a")} throws. What happens?`, [`The rest is skipped and the error is the result`, `y is evaluated anyway`, `x becomes 0 and it goes on`, `It crashes the program`], 2, `Bind on ${c("Except")} stops at the first error and passes it on.`),
      ],
    };
  },
});

pmT({
  id: "boolinterp", topic: "interp", name: "Boolean expressions", like: "2526-ws/4",
  make() {
    const va = pick([true, false]), vb = pick([true, false]);
    const res = va && !vb;
    return {
      intro: code(`
        inductive BExpr where
          | lit (b : Bool)
          | var (x : String)
          | not (e : BExpr)
          | and (a b : BExpr)
          | ite (c t e : BExpr)   -- if c then t else e`),
      parts: [
        pmW(`Write ${c("eval (env : String → Option Bool) : BExpr → Option Bool")} with do-notation.`,
          `def eval (env : String → Option Bool) : BExpr → Option Bool
            | .lit b => some b
            | .var x => env x
            | .not e => do return !(← eval env e)
            | .and a b => do
                let x ← eval env a
                let y ← eval env b
                return x && y
            | .ite c t e => do
                if (← eval env c) then eval env t else eval env e`,
          [[1, "lit and var"], [1, "not"], [1, "and with both sides through ←"], [2, "ite evaluates the condition, then only the branch it picks"]]),
        pmVal(`env gives a ↦ ${va}, b ↦ ${vb}, everything else none. What is ${c('eval env (.and (.var "a") (.not (.var "b")))')}?`, [`some ${res}`], 2, `${va} && !${vb}.`),
        pmMC(`With that eval, what is ${c('eval env (.and (.lit false) (.var "zz"))')}?`, [c("none"), c("some false"), c("some true"), "It doesn't terminate"], 2, "Both sides go through ←, so the unknown zz makes it none — no short-circuit unless you write one."),
      ],
    };
  },
});

/* ================================================================ Lean: accumulators */

pmT({
  id: "range", topic: "acc", name: "range and average", like: "2626-ss/5",
  make() {
    const k = rint(2, 4), z = rint(5, 9);
    return {
      intro: `<p>${c("range 3 = [0, 1, 2]")}.</p>`,
      parts: [
        pmW(`Write ${c("range : Nat → List Nat")} with ${c("++")}, no accumulator.`,
          `def range : Nat → List Nat
            | 0 => []
            | n + 1 => range n ++ [n]`,
          [[1, "0 gives []"], [1, "range n ++ [n]"]]),
        pmMC("How long does that take?", ["O(n²)", "O(n)", "O(log n)", "O(1)"], 1, "Each ++ copies the list built so far: 0 + 1 + … + (n − 1)."),
        pmW(`Write ${c("rangeAux : Nat → List Nat → List Nat")} (tail-recursive, with an accumulator) and ${c("rangeTR")}.`,
          `def rangeAux : Nat → List Nat → List Nat
            | 0, acc => acc
            | n + 1, acc => rangeAux n (n :: acc)

          def rangeTR (n : Nat) : List Nat := rangeAux n []`,
          [[1, "an accumulator parameter"], [1, "the recursive call is the last thing"], [1, "counts down and conses, so the order comes out right"]]),
        pmVal(`With your ${c("rangeAux")}, what is ${c(`rangeAux ${k} [${z}]`)}?`, [pmList([...Array(k).keys(), z])], 2, `Each step puts n in front: ${pmList([...Array(k).keys(), z])}.`),
        pmW(`Write ${c("average (xs : List Float) : Float")} in one pass, tail-recursive: carry the sum and the count. The empty list gives 0.`,
          `def avgAux : List Float → Float → Nat → Float
            | [], s, n => if n == 0 then 0 else s / n.toFloat
            | x :: xs, s, n => avgAux xs (s + x) (n + 1)

          def average (xs : List Float) : Float := avgAux xs 0 0`,
          [[1, "sum and count both carried along"], [1, "only one walk over the list"], [1, "tail call"], [1, "the empty list doesn't divide by 0"]]),
      ],
    };
  },
});

pmT({
  id: "count", topic: "acc", name: "Counting", like: "2526-ws/5",
  make() {
    const xs = rlist(6, 1, 4);
    return {
      intro: `<p>Count in lists of ${c("Nat")}.</p>`,
      parts: [
        pmW(`Write ${c("count (x : Nat) : List Nat → Nat")}, plain recursion.`,
          `def count (x : Nat) : List Nat → Nat
            | [] => 0
            | y :: ys => (if y == x then 1 else 0) + count x ys`,
          [[1, "base case 0"], [1, "adds 1 only on a match"]]),
        pmW(`Write ${c("countTR")}, tail-recursive with an accumulator.`,
          `def countAux (x : Nat) : List Nat → Nat → Nat
            | [], acc => acc
            | y :: ys, acc => countAux x ys (if y == x then acc + 1 else acc)

          def countTR (x : Nat) (xs : List Nat) : Nat := countAux x xs 0`,
          [[1, "accumulator starts at 0"], [1, "the call is in tail position"], [1, "the result is the accumulator at the end"]]),
        pmW(`Write ${c("countUnique (xs : List Nat) : Nat")}, the number of different elements, carrying the ones seen so far.`,
          `def cuAux : List Nat → List Nat → Nat
            | [], seen => seen.length
            | x :: xs, seen =>
              if seen.contains x then cuAux xs seen else cuAux xs (x :: seen)

          def countUnique (xs : List Nat) : Nat := cuAux xs []`,
          [[1, "a list of seen elements as accumulator"], [1, "skips an element already seen"], [1, "adds a new one"], [1, "the answer is how many were seen"]]),
        pmVal(`What is ${c(`countUnique ${pmList(xs)}`)}?`, [String(new Set(xs).size)], 1, `The different values: ${pmList([...new Set(xs)])}.`),
        pmMC("Which recursive case is a tail call?", [c("| y :: ys, acc => countAux x ys (acc + 1)"), c("| y :: ys => 1 + count x ys"), c("| y :: ys => count x ys ++ [y]"), c("| y :: ys => (count x ys).max y")], 2, "Only there nothing is left to do after the call returns."),
      ],
    };
  },
});

pmT({
  id: "revmax", topic: "acc", name: "Reverse and maximum", like: "2626-ss/5",
  make() {
    const xs = rlist(3, 1, 9), d = rint(0, 9);
    return {
      intro: code(`
        def rev : List α → List α
          | [] => []
          | x :: xs => rev xs ++ [x]`),
      parts: [
        pmMC(`How long does ${c("rev")} take on n elements?`, ["O(n²)", "O(n)", "O(n log n)", "O(1)"], 1, "n calls, each appending to a list of up to n elements."),
        pmW(`Write ${c("revAux : List α → List α → List α")}, tail-recursive, so that ${c("rev xs = revAux xs []")}.`,
          `def revAux : List α → List α → List α
            | [], acc => acc
            | x :: xs, acc => revAux xs (x :: acc)`,
          [[1, "base case returns the accumulator"], [2, "conses x onto the accumulator in the tail call"]]),
        pmVal(`What is ${c(`revAux ${pmList(xs)} [${d}]`)}?`, [pmList([...xs].reverse().concat(d))], 3, "Each element goes in front of the accumulator, so the start ends up last — before what was there."),
        pmW(`Write ${c("maxTR : List Nat → Option Nat")} with a tail-recursive helper.`,
          `def maxAux : List Nat → Nat → Nat
            | [], m => m
            | x :: xs, m => maxAux xs (max m x)

          def maxTR : List Nat → Option Nat
            | [] => none
            | x :: xs => some (maxAux xs x)`,
          [[1, "the empty list gives none"], [1, "the first element starts the accumulator"], [1, "max in the tail call"]]),
        pmMC("Why do tail calls matter?", ["The stack stays the same size however long the list", "They are always faster than loops", "Lean only accepts tail-recursive functions", "They avoid allocating lists"], 2, "A tail call can reuse the frame; deep plain recursion can overflow the stack."),
      ],
    };
  },
});

/* ================================================================ Lean: property testing */

pmT({
  id: "dlist", topic: "pbt", name: "A double-ended list", like: "2526-ws/6",
  make() {
    return {
      intro: code(`
        structure DList (α : Type) where
          front : List α
          back  : List α    -- reversed: the last element is back's head
        deriving Repr

        def DList.toList (d : DList α) : List α := d.front ++ d.back.reverse
        def DList.ofList (xs : List α) : DList α := ⟨xs, []⟩`),
      parts: [
        pmW(`Write ${c("DList.snoc (d : DList α) (x : α) : DList α")}: add x at the end in O(1).`,
          `def DList.snoc (d : DList α) (x : α) : DList α := ⟨d.front, x :: d.back⟩`,
          [[1, "conses onto back"], [1, "front unchanged"]]),
        pmW(`Write ${c("DList.getLast? (d : DList α) : Option α")}.`,
          `def DList.getLast? (d : DList α) : Option α :=
            match d.back with
            | x :: _ => some x
            | []     => d.front.getLast?`,
          [[1, "back's head is the last element"], [1, "an empty back falls back to front"], [1, "both empty gives none"]]),
        pmW("Write the property: after snoc, getLast? gives the new element. Test it with plausible on lists.",
          `example (xs : List Nat) (x : Nat) :
              ((DList.ofList xs).snoc x).getLast? = some x := by
            plausible`,
          [[1, "builds a DList from a random list and snocs x"], [1, "= some x, checked with by plausible"]]),
        pmW("Write the round trip: ofList, then toList, gives the list back.",
          `example (xs : List Nat) : (DList.ofList xs).toList = xs := by
            plausible`,
          [[2, "(DList.ofList xs).toList = xs"]]),
        pmW("Use List.getLast? as a reference: getLast? must agree with it on any front and back.",
          `example (f b : List Nat) :
              (DList.mk f b).getLast? = (DList.mk f b).toList.getLast? := by
            plausible`,
          [[1, "any front and back, not just ofList"], [2, "compares with toList.getLast?"]]),
        pmMC(`plausible prints “Unable to find a counter-example”. What do you know?`, ["The property held on the inputs it tried — evidence, not a proof", "The property is proved", "The property is false", "The generator is broken"], 2, "Only a proof covers every input."),
      ],
    };
  },
});

pmT({
  id: "queue", topic: "pbt", name: "Testing a queue", like: "2626-ss/6",
  make() {
    return {
      intro: code(`
        structure Queue (α : Type) where
          front : List α
          back  : List α
        deriving Repr

        def Queue.empty : Queue α := ⟨[], []⟩
        def Queue.enqueue (x : α) (q : Queue α) : Queue α := { q with back := x :: q.back }
        def Queue.dequeue? (q : Queue α) : Option (α × Queue α) :=
          match q.front with
          | x :: f => some (x, { q with front := f })
          | [] => match q.back.reverse with
            | [] => none
            | x :: f => some (x, ⟨f, []⟩)`),
      parts: [
        pmW(`Write ${c("Queue.toList")}: the elements in the order they come out, and ${c("Queue.ofList")}, which enqueues a list's elements one after the other.`,
          `def Queue.toList (q : Queue α) : List α := q.front ++ q.back.reverse

          def Queue.ofList (xs : List α) : Queue α :=
            xs.foldl (fun q x => q.enqueue x) Queue.empty`,
          [[1, "front, then back reversed"], [1, "foldl with enqueue from empty"]]),
        pmW("Property: enqueue adds at the end.",
          `example (xs : List Nat) (x : Nat) :
              ((Queue.ofList xs).enqueue x).toList = xs ++ [x] := by
            plausible`,
          [[1, "compares with xs ++ [x]"], [1, "by plausible"]]),
        pmW("Property: first in, first out — the first element dequeued is the list's head.",
          `example (xs : List Nat) :
              ((Queue.ofList xs).dequeue?.map (·.1)) = xs.head? := by
            plausible`,
          [[1, "takes the element out of the Option pair"], [2, "compares with xs.head? (also covers the empty list)"]]),
        pmMC(`Someone drops the ${c(".reverse")} in dequeue?. Which property fails?`, ["First in, first out", "Enqueue adds at the end", "Both", "Neither"], 2, "enqueue and toList don't use dequeue?; the FIFO property does, on any list with 2+ elements."),
        pmMC("plausible found [3, 0] and then reports [0, 1]. What did it do?", ["Shrank the counter-example to a smaller one that still fails", "Found a second, unrelated bug", "Retried with a new seed", "Sorted the input"], 2, "Shrinking makes failing inputs smaller and simpler while they still fail."),
        pmMC(`To test properties of ${c("Queue Nat")} directly (not via ofList), plausible needs …`, [`an ${c("Arbitrary")} instance (and ${c("Shrinkable")}) for Queue`, `a ${c("Repr")} instance only`, `a ${c("BEq")} instance only`, "nothing more"], 2, `Without one: “failed to create a testable instance”.`),
        pmMC("Which property is the strongest test of dequeue? on its own?", ["Draining a queue built from xs gives back exactly xs", "dequeue? of empty is none", "dequeue? never panics", "toList has the same length as xs"], 1, "It checks every element and the order, not just one case."),
      ],
    };
  },
});

pmT({
  id: "sortprop", topic: "pbt", name: "Properties of a sort", like: "2626-ss/6",
  make() {
    return {
      intro: code(`
        def insertSorted (x : Nat) : List Nat → List Nat
          | [] => [x]
          | y :: ys => if x ≤ y then x :: y :: ys else y :: insertSorted x ys

        def isort (xs : List Nat) : List Nat := xs.foldr insertSorted []`),
      parts: [
        pmW(`Write ${c("sorted : List Nat → Bool")}.`,
          `def sorted : List Nat → Bool
            | x :: y :: rest => x ≤ y && sorted (y :: rest)
            | _ => true`,
          [[1, "lists of length 0 and 1 are sorted"], [1, "compares neighbours"], [1, "recursion keeps y in the rest"]]),
        pmW("Property: isort's result is sorted.",
          `example (xs : List Nat) : sorted (isort xs) = true := by
            plausible`,
          [[2, "sorted (isort xs) for any xs"]]),
        pmW("Property: isort keeps every element as often as it was there.",
          `example (xs : List Nat) (x : Nat) : (isort xs).count x = xs.count x := by
            plausible`,
          [[1, "count of any x"], [2, "the same before and after"]]),
        pmMC(`A broken ${c("isort")} always returns ${c("[]")}. Which property catches it?`, ["The count property", "The sorted property", "Both", "Neither"], 2, "[] is sorted — only the count property sees the lost elements."),
        pmMC("Which property says sorting twice changes nothing?", [c("isort (isort xs) = isort xs"), c("isort xs = xs"), c("(isort xs).length = xs.length"), c("isort xs.reverse = isort xs")], 2, "That's idempotence. isort xs = xs is false for unsorted input."),
        pmMC("Which pair of properties together pins isort down completely?", ["Sorted + same count of every element", "Sorted + same length", "Same length + same first element", "Idempotent + same length"], 2, "A sorted permutation of xs is unique."),
      ],
    };
  },
});

/* ================================================================ Lean: monads and type classes */

pmT({
  id: "robot", topic: "monad", name: "A robot interface", like: "2626-ss/7",
  make() {
    const cmds = Array.from({ length: rint(4, 6) }, () => (Math.random() < 0.6 ? `.forward ${rint(1, 4)}` : ".turnRight"));
    let x = 0, y = 0, d = 0;
    for (const cmd of cmds) {
      if (cmd === ".turnRight") d = (d + 1) % 4;
      else { const n = +cmd.split(" ")[1]; [x, y] = [[x, y + n], [x + n, y], [x, y - n], [x - n, y]][d]; }
    }
    return {
      intro: code(`
        inductive Dir where | north | east | south | west
        deriving Repr, BEq

        def Dir.right : Dir → Dir
          | .north => .east | .east => .south | .south => .west | .west => .north

        inductive Cmd where
          | forward (n : Int)
          | turnRight`),
      parts: [
        pmW(`Write a type class ${c("Robot (m : Type → Type)")} with ${c("getDir")}, ${c("setDir")}, ${c("getPos")} and ${c("setPos")} (the position is ${c("Int × Int")}).`,
          `class Robot (m : Type → Type) where
            getDir : m Dir
            setDir : Dir → m Unit
            getPos : m (Int × Int)
            setPos : Int × Int → m Unit`,
          [[1, "class over a type constructor m"], [1, "getters return m Dir / m (Int × Int)"], [1, "setters take a value and return m Unit"]]),
        pmW(`Write ${c("exec [Monad m] [Robot m] : Cmd → m Unit")}. North is +y, east is +x.`,
          `def exec [Monad m] [Robot m] : Cmd → m Unit
            | .turnRight => do
                let d ← Robot.getDir
                Robot.setDir d.right
            | .forward n => do
                let (x, y) ← Robot.getPos
                match (← Robot.getDir) with
                | .north => Robot.setPos (x, y + n)
                | .east  => Robot.setPos (x + n, y)
                | .south => Robot.setPos (x, y - n)
                | .west  => Robot.setPos (x - n, y)`,
          [[1, "both constraints, works for any such m"], [1, "turnRight reads and sets the direction"], [1, "forward reads the position with ←"], [2, "moves the right way for each direction"]]),
        pmVal(`The robot starts at (0, 0) facing north. Where is it after ${c(`[${cmds.join(", ")}]`)}?`, [`(${x}, ${y})`], 3, "Follow it step by step: a turn changes only the direction."),
      ],
    };
  },
});

pmT({
  id: "stackm", topic: "monad", name: "A stack machine", like: "2526-ws/7",
  make() {
    const a = rint(1, 9), b = rint(1, 9), cv = rint(2, 5);
    const op1 = pick(["add", "mul"]), op2 = pick(["add", "mul"]);
    const f = (o, p, q) => (o === "add" ? p + q : p * q);
    const res = f(op2, f(op1, a, b), cv);
    return {
      intro: code(`
        class Stack (m : Type → Type) where
          push    : Int → m Unit
          pop     : m (Option Int)
          isEmpty : m Bool

        inductive Instr where
          | load (n : Int)
          | add
          | mul`),
      parts: [
        pmW(`Write ${c("instance : Stack (StateM (List Int))")}: the state is the stack, its head on top.`,
          `instance : Stack (StateM (List Int)) where
            push x := modify (x :: ·)
            pop := do
              match (← get) with
              | [] => return none
              | x :: xs => do
                  set xs
                  return some x
            isEmpty := do return (← get).isEmpty`,
          [[1, "push with modify (or get and set)"], [2, "pop: none on [], otherwise set the rest and return some x"], [1, "isEmpty reads the state"]]),
        pmW(`Write ${c("run [Monad m] [Stack m] : Instr → m Unit")}. add and mul pop two values and push the result; with fewer than two, put back what was popped.`,
          `def binop [Monad m] [Stack m] (f : Int → Int → Int) : m Unit := do
            match (← Stack.pop), (← Stack.pop) with
            | some a, some b => Stack.push (f b a)
            | some a, none   => Stack.push a
            | none, _        => pure ()

          def run [Monad m] [Stack m] : Instr → m Unit
            | .load n => Stack.push n
            | .add => binop (· + ·)
            | .mul => binop (· * ·)`,
          [[1, "load pushes"], [1, "pops twice with ←"], [1, "pushes the result"], [1, "too few values: the stack is as before"]]),
        pmVal(`What is the stack after ${c(`[.load ${a}, .load ${b}, .${op1}, .load ${cv}, .${op2}]`)}, starting empty?`, [pmList([res])], 3, `${op1 === "add" ? `${a} + ${b}` : `${a} · ${b}`} = ${f(op1, a, b)}, then ${op2 === "add" ? "+" : "·"} ${cv}.`),
      ],
    };
  },
});

pmT({
  id: "label", topic: "monad", name: "State and transformers", like: "2626-ss/7",
  make() {
    const ws = shuffle(["a", "b", "c", "d"]).slice(0, rint(2, 3)), k = rint(1, 9);
    const out = `([${ws.map((w, i) => `(${k + i}, "${w}")`).join(", ")}], ${k + ws.length})`;
    return {
      intro: `<p>${c("StateM σ α")} is a function ${c("σ → α × σ")}; ${c("run")} feeds it the start state.</p>`,
      parts: [
        pmMC(`What is ${c("StateT σ (Except ε) α")} unfolded?`, [c("σ → Except ε (α × σ)"), c("Except ε (σ → α × σ)"), c("σ → Except ε α × σ"), c("σ → α × Except ε σ")], 2, "StateT puts the state around the inner monad's result."),
        pmW(`Write ${c("tick : StateM Nat Unit")}, which adds 1 to the state.`, `def tick : StateM Nat Unit := modify (· + 1)`, [[1, "modify (· + 1) (or get, then set)"]]),
        pmW(`Write ${c("label (xs : List String) : StateM Nat (List (Nat × String))")}: number the words, counting on from the state.`,
          `def label (xs : List String) : StateM Nat (List (Nat × String)) :=
            xs.mapM fun x => do
              let n ← get
              set (n + 1)
              return (n, x)`,
          [[1, "mapM (or recursion) over the words"], [1, "get the current number"], [1, "set it one higher"], [1, "return the pair"]]),
        pmVal(`What is ${c(`(label ${pmStr(ws)}).run ${k}`)}?`, [out], 2, "run gives (result, final state)."),
        pmMC(`${c("ExceptT String (StateM Nat)")}: a program ticks twice, then throws. Run from 0, what comes out?`, [c('(Except.error "…", 2)'), c('Except.error "…"'), c('(Except.error "…", 0)'), c("(Except.ok (), 2)")], 2, "ExceptT over State: σ → Except ε α × σ — the state reached before the error survives."),
      ],
    };
  },
});

/* ================================================================ Reussner: multiple choice (older exams) */

pmT({
  id: "tf", topic: "mc", name: "True or false", like: "2525-ss/1", practiceOnly: true,
  make() {
    const qs = shuffle([...PP_TF]).slice(0, 4);
    return {
      intro: "<p>Each statement is either true or false.</p>",
      parts: qs.map(([s, t]) => pmMC(s, t ? ["True", "False"] : ["False", "True"], 1, `It's ${t ? "true" : "false"}.`, true)),
    };
  },
});

/* ================================================================ Reussner: MPI */

pmT({
  id: "mpithresh", topic: "mpi", name: "Trace a threshold count", like: "2626-ss/8",
  make() {
    // Averages that are whole numbers, and a whole-number threshold.
    let avgs;
    do avgs = Array.from({ length: 4 }, () => rint(12, 24)); while (avgs.reduce((a, b) => a + b, 0) % 4);
    const vals = avgs.map((a) => { let v; do { v = rlist(3, a - 8, a + 8); v.push(4 * a - v[0] - v[1] - v[2]); } while (v[3] < 0 || v[3] > 40); return v; });
    const thr = avgs.reduce((a, b) => a + b, 0) / 4;
    const cnt = vals.map((v) => v.filter((x) => x > thr).length);
    const r = rint(0, 3), s = rint(1, 3);
    return {
      intro: `${ccode(`
        // run with 4 processes; vals (4 values) is different on every rank
        double localAvg = average(vals, 4);
        double sum = 0;
        MPI_Reduce(&localAvg, &sum, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);
        double threshold = 0;
        if (rank == 0) threshold = sum / size;
        MPI_Bcast(&threshold, 1, MPI_DOUBLE, 0, MPI_COMM_WORLD);
        int count = 0;
        for (int i = 0; i < 4; i++) if (vals[i] > threshold) count++;
        int counts[4] = { 0 };
        MPI_Gather(&count, 1, MPI_INT, counts, 1, MPI_INT, 0, MPI_COMM_WORLD);`)}
        <p>${vals.map((v, k) => `rank ${k}: ${cq(pmArr(v))}`).join(" · ")}</p>`,
      parts: [
        pmVal(`${cq("localAvg")} on rank ${r}?`, [String(avgs[r])], 2, `(${vals[r].join(" + ")}) / 4.`),
        pmVal(`${cq("sum")} on rank ${s}?`, ["0"], 2, "Only the root gets the Reduce result; elsewhere sum keeps its 0."),
        pmVal(`${cq("threshold")} on rank ${s}?`, [String(thr)], 2, `The root computes (${avgs.join(" + ")}) / 4; Bcast copies it to every rank.`),
        pmVal(`${cq("counts")} on rank 0?`, [pmArr(cnt), pmList(cnt)], 2, `Each rank counts its values above ${thr}; Gather collects them in rank order.`),
        pmW(`Replace the Reduce, the ${cq("if")} and the Bcast by a single collective.`,
          `MPI_Allreduce(&localAvg, &sum, 1, MPI_DOUBLE, MPI_SUM, MPI_COMM_WORLD);
          double threshold = sum / size;`,
          [[1, "MPI_Allreduce with MPI_SUM"], [1, "no root argument"], [1, "every rank divides by size itself"]], pmC),
        pmW("Name two advantages of collective operations over hand-written send/receive.",
          `// 1. The library can use a better algorithm (a tree: log p steps
          //    instead of p - 1 messages through one root) and the network's hardware.
          // 2. Less code and fewer mistakes: no wrong ranks or tags, no deadlocks
          //    from mismatched send/receive orders.`,
          [[1, "faster / optimised (tree, hardware)"], [1, "simpler, fewer bugs (deadlocks, wrong ranks)"]], pmC),
        pmMC("Which send returns only once the matching receive has started?", [cq("MPI_Ssend"), cq("MPI_Bsend"), cq("MPI_Rsend"), cq("MPI_Isend")], 2, "Synchronous send: that's why it can act like a barrier between the two."),
      ],
    };
  },
});

pmT({
  id: "mpiscatter", topic: "mpi", name: "Scatter and your own Reduce", like: "2525-ss/5",
  make() {
    const data = rlist(8, 1, 9), r = rint(0, 3);
    const loc = (k) => data.slice(2 * k, 2 * k + 2);
    const sums = [0, 1, 2, 3].map((k) => loc(k)[0] + loc(k)[1]);
    const total = sums.reduce((a, b) => a + b, 0);
    return {
      intro: `${ccode(`
        // run with 4 processes; data is only filled on rank 0
        int data[8] = ${pmArr(data)};
        int local[2];
        MPI_Scatter(data, 2, MPI_INT, local, 2, MPI_INT, 0, MPI_COMM_WORLD);
        int mine = local[0] + local[1];
        int result = 0;
        MPI_Reduce(&mine, &result, 1, MPI_INT, MPI_SUM, 0, MPI_COMM_WORLD);`)}`,
      parts: [
        pmVal(`${cq("local")} on rank ${r}?`, [pmArr(loc(r)), pmList(loc(r))], 1, `Scatter hands out blocks of 2 in rank order: elements ${2 * r} and ${2 * r + 1}.`),
        pmVal(`${cq("mine")} on rank ${r}?`, [String(sums[r])], 1, `${loc(r)[0]} + ${loc(r)[1]}.`),
        pmVal(`${cq("result")} on rank 0?`, [String(total)], 2, "The sum of all four partial sums — the sum of data."),
        pmW(`Write the ${cq("MPI_Reduce")} line yourself, with only ${cq("MPI_Send")} and ${cq("MPI_Recv")}.`,
          `if (rank == 0) {
            result = mine;
            for (int src = 1; src < size; src++) {
              int v;
              MPI_Recv(&v, 1, MPI_INT, src, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
              result += v;
            }
          } else {
            MPI_Send(&mine, 1, MPI_INT, 0, 0, MPI_COMM_WORLD);
          }`,
          [[1, "the root starts from its own value"], [1, "the root receives size − 1 values"], [1, "and adds them up"], [1, "every other rank sends its value to 0"], [1, "matching type, count and tag on both sides"]], pmC),
        pmMC("Every rank first calls MPI_Recv from its left neighbour, then MPI_Send to its right one. What happens?", ["Deadlock: everyone waits to receive", "It works if the messages are small", "Only rank 0 blocks", "It works: MPI reorders the calls"], 2, "No one ever gets to send."),
        pmMC(`Which collective would hand every rank the whole ${cq("data")} array?`, [cq("MPI_Bcast"), cq("MPI_Scatter"), cq("MPI_Gather"), cq("MPI_Reduce")], 2, "Bcast copies; Scatter splits."),
        pmMC("After a blocking MPI_Send returns, …", ["the send buffer may be reused", "the message has been received", "the receiver has started receiving", "the message is still in the send buffer"], 2, "That's all blocking means; the message may sit in a system buffer."),
      ],
    };
  },
});

pmT({
  id: "mpiring", topic: "mpi", name: "Fix a ring", like: "2324-ws/6",
  make() {
    const n = rint(4, 8);
    return {
      intro: `<p>A token should travel from rank 0 round a ring: 0 → 1 → … → size − 1. This has bugs.</p>${ccode(`
        int main(int argc, char **argv) {
          int rank, size, token;
          MPI_Comm_rank(MPI_COMM_WORLD, &rank);
          MPI_Comm_size(MPI_COMM_WORLD, &size);
          if (rank == 0) token = 42;
          MPI_Send(&token, 1, MPI_INT, rank + 1, 0, MPI_COMM_WORLD);
          MPI_Recv(&token, 1, MPI_INT, rank - 1, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
          printf("%d got %d\\n", rank, token);
          MPI_Finalize();
        }`)}`,
      parts: [
        pmW("Write the fixed program.",
          `int main(int argc, char **argv) {
            int rank, size, token;
            MPI_Init(&argc, &argv);
            MPI_Comm_rank(MPI_COMM_WORLD, &rank);
            MPI_Comm_size(MPI_COMM_WORLD, &size);
            if (rank == 0) {
              token = 42;
            } else {
              MPI_Recv(&token, 1, MPI_INT, rank - 1, 0, MPI_COMM_WORLD, MPI_STATUS_IGNORE);
            }
            if (rank < size - 1)
              MPI_Send(&token, 1, MPI_INT, rank + 1, 0, MPI_COMM_WORLD);
            printf("%d got %d\\n", rank, token);
            MPI_Finalize();
          }`,
          [[1, "MPI_Init before any other MPI call"], [1, "rank 0 doesn't receive from rank −1"], [1, "the last rank doesn't send to rank size"], [2, "receive before send (except rank 0), so nobody waits for ever"], [1, "the token only goes on once it has arrived"]], pmC),
        pmVal(`How many messages does the fixed ring send with ${n} processes?`, [String(n - 1)], 3, "One per edge 0→1, …, (n−2)→(n−1)."),
        pmW("Do the same with one collective. Why is it better?",
          `MPI_Bcast(&token, 1, MPI_INT, 0, MPI_COMM_WORLD);
          // log p rounds (a tree) instead of p - 1 one after the other, and no
          // send/receive order to get wrong.`,
          [[1, "MPI_Bcast from root 0"], [1, "a reason: a tree is faster, or nothing to get wrong"]], pmC),
        pmMC("Which collective leaves the result on every rank?", [cq("MPI_Allreduce"), cq("MPI_Reduce"), cq("MPI_Gather"), cq("MPI_Scatter")], 2, "Reduce and Gather only fill the root's buffer."),
        pmMC("Only the root knows how many values it will broadcast. What do you do?", ["Broadcast the length first (or MPI_Probe it)", "Broadcast a fixed maximum and hope", "Every rank allocates as much as the root", "Use MPI_Gather"], 2, "The receivers need the count before they can allocate and call Bcast."),
      ],
    };
  },
});

/* ================================================================ Reussner: Java threads */

pmT({
  id: "tickets", topic: "java", name: "A ticket queue", like: "2526-ws/9",
  make() {
    return {
      intro: jcode(`
        class TicketQueue {
          private final List<String> tickets = new ArrayList<>();
          private int served = 0;

          public void submit(String t) {
            tickets.add(t);
          }
          public String next() {
            while (tickets.isEmpty()) { }      // busy waiting
            served++;
            return tickets.remove(0);
          }
        }`),
      parts: [
        pmMC("Several threads call submit and next. What can go wrong?", ["Lost updates on served and a corrupted list (ArrayList isn't thread-safe)", "Nothing: each method is one line", "Only a deadlock", "The JVM serialises the calls"], 2, "served++ is read-modify-write; ArrayList's add/remove aren't atomic either."),
        pmW("Rewrite submit and next: synchronised, no busy waiting.",
          `public synchronized void submit(String t) {
            tickets.add(t);
            notifyAll();
          }
          public synchronized String next() throws InterruptedException {
            while (tickets.isEmpty()) wait();
            served++;
            return tickets.remove(0);
          }`,
          [[1, "both on the same monitor (this)"], [1, "wait() instead of spinning"], [2, "wait in a while loop, not an if"], [1, "notifyAll() after adding"], [1, "InterruptedException declared or handled"]], pmJ),
        pmW("Name two ways to avoid deadlocks and the Coffman condition each one breaks.",
          `// 1. Take locks in one fixed global order       → no circular wait
          // 2. Take all locks at once, or give back what you
          //    hold when the next one isn't free (tryLock)  → no hold and wait`,
          [[2, "a measure with its condition (e.g. lock order → circular wait)"], [2, "a second one with its condition (e.g. all at once / tryLock → hold and wait)"]], pmJ),
        pmW(`Run ${j("queue.next()")} in the background on an ExecutorService, do other work, then use the ticket.`,
          `ExecutorService ex = Executors.newFixedThreadPool(2);
          Future<String> f = ex.submit(() -> queue.next());
          doOtherWork();
          String t = f.get();          // as late as possible
          ex.shutdown();`,
          [[1, "submit a lambda / Callable, keep the Future"], [1, "get() only where the result is needed"], [1, "shutdown() at the end"]], pmJ),
        pmMC("Why while and not if around wait()?", ["After waking, the condition may be false again (another thread, or a spurious wakeup)", "if doesn't compile around wait()", "while is faster", "To release the lock"], 2, "Always re-check the condition after waking up."),
      ],
    };
  },
});

pmT({
  id: "amdahlj", topic: "java", name: "Threads, Amdahl and races", like: "2626-ss/9",
  make() {
    const p = pick([1 / 4, 1 / 3, 1 / 2, 2 / 3]), n = pick([2, 4]), T1 = pick([12, 24, 36]);
    const Tn = T1 * (1 - p) + (T1 * p) / n, lim = 1 / (1 - p), s2 = 1 / ((1 - p) + p / 2);
    const r = (x) => String(Math.round(x * 100) / 100);
    const pStr = { 0.25: "1/4", [1 / 3]: "1/3", 0.5: "1/2", [2 / 3]: "2/3" }[p];
    return {
      intro: `<p>A program takes T(1) = ${T1} s on one core and T(${n}) = ${r(Tn)} s on ${n}.</p>`,
      parts: [
        pmVal("What share p of the work runs in parallel?", [pStr, r(p)], 2, `T(${n}) = (1 − p)·${T1} + p·${T1}/${n} ⇒ p = ${pStr}.`),
        pmVal("What speedup can any number of cores give at most?", [r(lim)], 2, `1 / (1 − p) = ${r(lim)}.`),
        pmVal("And the speedup on 2 cores?", [r(s2)], 2, `1 / ((1 − p) + p/2) = ${r(s2)}.`),
        pmMC(`A thread calls ${j("wait()")} inside a synchronized block. Which state is it in?`, ["WAITING", "BLOCKED", "RUNNABLE", "TERMINATED"], 1, "BLOCKED is for waiting to enter a monitor; WAITING for wait() / join()."),
        pmMC(`A thread wants to enter a ${j("synchronized")} block another thread holds. Its state?`, ["BLOCKED", "WAITING", "TIMED_WAITING", "NEW"], 1, "It's blocked on the monitor."),
        pmW("Which lines must be synchronised, and on what? (Several threads share one Counter.)",
          `class Counter {
            private int n = 0;
            public void inc() { synchronized (this) { n++; } }
            public int get()  { synchronized (this) { return n; } }
            public void incIfBelow(int max) {
              synchronized (this) { if (n < max) n++; }   // check and act together
            }
          }`,
          [[1, "n++ synchronised"], [1, "get synchronised (visibility)"], [1, "the check and the increment in one block"], [1, "all on the same monitor"]], pmJ),
        pmMC(`Two threads each run ${j("x++")} once on a shared ${j("int x = 0")}. What can x be afterwards?`, ["1 or 2", "Only 2", "0, 1 or 2", "Only 1"], 3, "Both may read 0 before either writes."),
        pmMC(`What does ${j("volatile int x")} give you?`, ["Every read sees the latest write — but x++ is still not atomic", "x++ becomes atomic", "Mutual exclusion for x", "Nothing in Java"], 2, "volatile is about visibility and ordering, not atomicity."),
      ],
    };
  },
});

pmT({
  id: "transfer", topic: "java", name: "Locks and a transfer", like: "2424-ss/7",
  make() {
    return {
      intro: jcode(`
        class Account {
          int id, balance;
          final Lock lock = new ReentrantLock();
        }
        void transfer(Account from, Account to, int amount) {
          from.lock.lock();
          to.lock.lock();
          if (from.balance < amount) return;      // !
          from.balance -= amount;
          to.balance += amount;
          to.lock.unlock();
          from.lock.unlock();
        }`),
      parts: [
        pmW("Fix it so the locks are always released, on the early return and on an exception too.",
          `void transfer(Account from, Account to, int amount) {
            from.lock.lock();
            try {
              to.lock.lock();
              try {
                if (from.balance < amount) return;
                from.balance -= amount;
                to.balance += amount;
              } finally { to.lock.unlock(); }
            } finally { from.lock.unlock(); }
          }`,
          [[2, "unlock in finally"], [1, "each lock() right before its try"], [1, "the early return can stay: finally runs anyway"]], pmJ),
        pmMC(`${j("transfer(a, b, 1)")} and ${j("transfer(b, a, 1)")} run at the same time. What can happen?`, ["Deadlock: each holds one lock and waits for the other", "One transfer is lost", "Both balances go negative", "Nothing: ReentrantLock prevents it"], 3, "Circular wait between the two threads."),
        pmW("Prevent that deadlock without one global lock.",
          `void transfer(Account from, Account to, int amount) {
            Account first  = from.id < to.id ? from : to;
            Account second = from.id < to.id ? to : from;
            first.lock.lock();
            try {
              second.lock.lock();
              try {
                if (from.balance < amount) return;
                from.balance -= amount;
                to.balance += amount;
              } finally { second.lock.unlock(); }
            } finally { first.lock.unlock(); }
          }`,
          [[2, "locks always taken in one global order (by id)"], [1, "the money still moves from → to"], [1, "says which Coffman condition is gone (circular wait)"]], pmJ),
        pmMC("Which creates a happens-before edge?", ["unlock() of a lock, then a later lock() of the same lock", "Two reads of the same variable", "Starting two threads at the same time", "Any lock() on any lock"], 2, "Release → acquire of the same lock (also: volatile write → read, start(), join())."),
        pmW(`With a parallel stream: the total of all positive balances in ${j("List<Account> accounts")}.`,
          `int total = accounts.parallelStream()
              .mapToInt(a -> a.balance)
              .filter(b -> b > 0)
              .sum();`,
          [[1, "parallelStream()"], [1, "mapToInt to the balance"], [1, "filter b > 0"], [1, "sum() — no shared variable updated in a lambda"]], pmJ),
      ],
    };
  },
});

/* ================================================================ Reussner: Design by Contract */

pmT({
  id: "deposit", topic: "dbc", name: "From JML to assertions", like: "2626-ss/10",
  make() {
    const start = pick([0, 1]);
    return {
      intro: jcode(`
        /*@ requires amount > 0;
          @ ensures balance == \\old(balance) + amount;
          @*/
        void deposit(int amount) { balance += amount; }`, { lang: "java" }),
      parts: [
        pmW("Write deposit with Java assertions that check its contract.",
          `void deposit(int amount) {
            assert amount > 0;
            int oldBalance = balance;
            balance += amount;
            assert balance == oldBalance + amount;
          }`,
          [[1, "the precondition asserted at the start"], [1, "the old value saved before the change"], [1, "the postcondition asserted at the end"]], pmJ),
        pmW(`Someone runs ${j(`for (int i = ${start}; i < 10; i++) acc.deposit(i);`)} Is the contract broken, and whose fault is it?`,
          start === 0 ? `// Yes: the first call is deposit(0), but the precondition demands
          // amount > 0. A broken precondition is the caller's fault.`
            : `// No: every call has amount >= 1 > 0, and deposit keeps its
          // postcondition. (A broken precondition would be the caller's fault.)`,
          [[1, start === 0 ? "yes, deposit(0) breaks amount > 0" : "no, every amount is ≥ 1"], [1, "precondition ↔ caller (postcondition ↔ the method)"]], pmJ),
        pmMC("A postcondition is violated. Who is responsible?", ["The method (the supplier)", "The caller (the client)", "Both", "Nobody, if the precondition held"], 2, "If the precondition held, the method promised the postcondition."),
        pmMC("A subclass overrides deposit. Liskov allows it to …", ["weaken the precondition and strengthen the postcondition", "strengthen the precondition and weaken the postcondition", "strengthen both", "change neither"], 2, "Pre(super) ⇒ Pre(sub) and Post(sub) ⇒ Post(super)."),
      ],
    };
  },
});

pmT({
  id: "maxbug", topic: "dbc", name: "A buggy max", like: "2526-ws/10",
  make() {
    const s1 = rint(1, 5), s2 = rint(1, 5), b = rint(6, 9);
    return {
      intro: jcode(`
        /*@ requires a != null && a.length > 0;
          @ ensures (\\forall int i; 0 <= i && i < a.length; \\result >= a[i]);
          @*/
        int max(int[] a) {
          int m = 0;
          for (int i = 1; i < a.length; i++)
            if (a[i] > m) m = a[i];
          return m;
        }`),
      parts: [
        pmVal(`What does ${j(`max(new int[] { ${b}, ${s1}, ${s2} })`)} return?`, [String(Math.max(s1, s2))], 2, "The loop starts at 1 and skips a[0]."),
        pmMC("Does the postcondition catch that?", ["Yes: the result is smaller than a[0]", "No: the result is ≥ every element", "No: postconditions are only checked in tests", "Only with assertions switched off"], 1, `${Math.max(s1, s2)} < ${b} = a[0].`),
        pmMC(`And for ${j("{ -3, -7 }")}?`, ["It returns 0, and the postcondition doesn't notice", "It returns -3", "The postcondition fails", "It throws"], 2, "m starts at 0, which is ≥ every element — but 0 isn't in the array."),
        pmW("Strengthen the postcondition so it catches both bugs.",
          `/*@ requires a != null && a.length > 0;
            @ ensures (\\forall int i; 0 <= i && i < a.length; \\result >= a[i]);
            @ ensures (\\exists int i; 0 <= i && i < a.length; \\result == a[i]);
            @*/`,
          [[1, "keeps the ∀ part"], [2, "adds: the result is one of the elements (\\exists … \\result == a[i])"]], { lang: "java" }),
        pmMC("Who must make sure a.length > 0?", ["The caller", "max itself", "The JVM", "Nobody: JML checks it"], 1, "It's a precondition."),
      ],
    };
  },
});

pmT({
  id: "liskovfile", topic: "dbc", name: "Contracts and subclasses", like: "2525-ss/7",
  make() {
    return {
      intro: jcode(`
        class File {
          //@ requires !isOpen();
          //@ ensures isOpen();
          void open() { … }
        }
        class LockedFile extends File {
          //@ requires !isOpen() && !isLocked();
          //@ ensures isOpen() && position() == 0;
          void open() { … }
        }`),
      parts: [
        pmMC("Is LockedFile's precondition allowed by Liskov?", ["No: it is stronger than File's", "Yes: it is weaker", "Yes: preconditions may change freely", "Only if isLocked() is pure"], 2, "Code written for File may call open() on a locked LockedFile."),
        pmMC("Is its postcondition allowed?", ["Yes: it is stronger, so it still implies File's", "No: it is stronger", "No: it mentions position()", "Only without the precondition"], 2, "Post(sub) ⇒ Post(super) holds."),
        pmW("Fix LockedFile's contract so it keeps Liskov and still says what happens when the file is locked.",
          `class LockedFile extends File {
            //@ requires !isOpen();
            //@ ensures isLocked() ? !isOpen() : (isOpen() && position() == 0);
            void open() { … }
          }
          // (or: also signals a LockedException when locked — but then File's
          // contract must allow that exception too)`,
          [[1, "precondition no stronger than File's"], [1, "the locked case handled in the postcondition (or an allowed exception)"], [1, "notices that the result must still imply File's postcondition — otherwise File's contract needs changing"]], { lang: "java" }),
        pmMC("Which precondition in a superclass keeps Liskov for whatever precondition a future subclass picks?", [j("false"), j("true"), j("!isOpen()"), "none can"], 1, "Pre(super) ⇒ Pre(sub) holds for every Pre(sub) when Pre(super) is false — though then nobody may call it."),
        pmMC("A class invariant must hold …", ["before and after every public method call", "only after the constructor", "at every line of every method", "only when assertions are on"], 1, "Inside a method it may be broken for a while."),
      ],
    };
  },
});
