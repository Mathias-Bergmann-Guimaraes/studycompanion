// NuMa exam tasks: whole tasks like the old exams' (numa-exams.js), several parts each, written in
// our own words, with new numbers every time. Used one at a time by Practice and put together by the
// mock exam (numa-mock.js).
//
// A generator { id, topic, name, like: "2425-ws/1", make } makes { intro: html, parts: [part] }.
// A part is one of
//   choice:  { kind: "mc", ask, mc: [html, …] (the first is right; shown shuffled), pts, why }
//   value:   { kind: "val", ask, ans: [accepted answers], pts, why } — a number (also a fraction
//            like −3/4, a decimal with comma or point, 2,2e-16) or a list of numbers separated by ";",
//            compared within rounding
//   writing: { kind: "write", ask, model: html, rubric: [[points, what earns them]], why } — a proof
//            or an explanation, written on the page or on paper and marked against the model answer
//            by ticking the rubric, like the exam's marking scheme.
// Numbers that the exam would give as fractions are computed exactly (NmQ, numa.js).

const nmMC = (ask, mc, pts, why = "", fixed = false) => ({ kind: "mc", ask, mc, pts, why, fixed });
const nmVal = (ask, ans, pts, why = "") => ({ kind: "val", ask, ans: [].concat(ans).map(String), pts, why });
const nmW = (ask, model, rubric, why = "") => ({ kind: "write", ask, model, rubric, why, pts: rubric.reduce((s, [p]) => s + p, 0) });
// An exact or rounded number as an answer string, and a list of them.
const qs = (x) => (x instanceof NmQ ? x.toString() : String(+(+x).toFixed(6)));
const ql = (xs) => xs.map(qs).join("; ");
const L3 = "durch ; getrennt";

const NUMA_TASKS = [];
const nmTask = (g) => NUMA_TASKS.push(g);
const nmPick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const nmSign = () => (Math.random() < 0.5 ? -1 : 1);

/* ================================================================ Gleitpunkt */

nmTask({
  id: "flsys", topic: "gp", name: "Eine Menge von Gleitpunktzahlen", like: "2425-ws/1",
  make() {
    const B = nmPick([2, 3, 10]);
    const Lm = B === 10 ? 3 : B === 3 ? nmPick([4, 5]) : nmPick([4, 5, 6]);
    const Le = B === 10 ? 1 : B === 3 ? 3 : 5;
    const emin = B === 10 ? -rint(2, 6) : B === 3 ? -rint(3, 12) : -rint(5, 20);
    const emax = emin + B ** Le - 1;
    let x, f;
    do { x = rint(B ** (Lm - 1) * 10, B ** Lm * 10 - 1) / 10; f = nmFl(x, { B, Lm, Le, emin }); } while (Number.isInteger(x));
    return {
      intro: `<p>Wir betrachten FL für die Basis ${mi("B")} = ${B}, ${mi("e")}<sub>min</sub> = ${emin}, ${mi("L")}<sub>m</sub> = ${Lm} und ${mi("L")}<sub>e</sub> = ${Le}.</p>`,
      parts: [
        nmW(`Formulieren Sie die Definition der Menge FL<sup>+</sup> der normalisierten positiven Gleitpunktzahlen.`,
          `FL<sup>+</sup> = { B<sup>e</sup> Σ<sub>l=1</sub><sup>L<sub>m</sub></sup> a<sub>l</sub>B<sup>−l</sup> : e = e<sub>min</sub> + Σ<sub>l=0</sub><sup>L<sub>e</sub>−1</sup> c<sub>l</sub>B<sup>l</sup>, a<sub>l</sub>, c<sub>l</sub> ∈ {0, …, B − 1}, a<sub>1</sub> ≠ 0 }`,
          [[1, "Mantisse als Summe der a<sub>l</sub>B<sup>−l</sup>, Exponent e<sub>min</sub> + Σ c<sub>l</sub>B<sup>l</sup>"], [1, "Ziffern in {0, …, B − 1} und die Normalisierung a<sub>1</sub> ≠ 0"]]),
        nmVal(`Bestimmen Sie ${mi("e")}<sub>max</sub>.`, emax, 1, `e<sub>max</sub> = e<sub>min</sub> + B<sup>L<sub>e</sub></sup> − 1 = ${emin} + ${B ** Le} − 1 = ${emax}.`),
        nmVal(`min FL<sup>+</sup> = ${B}<sup>k</sup>. Geben Sie k an.`, emin - 1, 1, `min FL<sup>+</sup> = B<sup>e<sub>min</sub>−1</sup>: die Mantisse (0.10…0)<sub>B</sub> = B⁻¹ mit dem kleinsten Exponenten.`),
        nmVal(`Geben Sie die Maschinengenauigkeit eps an (als Bruch).`, [`1/${2 * B ** (Lm - 1)}`], 1, `eps = ½B<sup>1−L<sub>m</sub></sup> = 1/(2 · ${B}<sup>${Lm - 1}</sup>) = 1/${2 * B ** (Lm - 1)}.`),
        nmVal(`Bestimmen Sie fl(${mi("x")}) für ${mi("x")} = ${nmD(x, 1)}.`, f.v, 2,
          `${nmD(x, 1)} = (${f.digits}, ${f.next}…)<sub>${B}</sub>: e = ${f.e}, die ${Lm + 1}. Ziffer ist ${f.next} ${f.next >= B / 2 ? "≥" : "&lt;"} B/2 = ${nmD(B / 2)}, also wird ${f.next >= B / 2 ? "auf" : "ab"}gerundet: fl(x) = ${nmD(f.v)}.`),
      ],
    };
  },
});

nmTask({
  id: "count", topic: "gp", name: "Gleitpunktzahlen zählen", like: "19-ss/6",
  make() {
    const B = nmPick([2, 3, 5]), Lm = rint(2, 4), emin = -rint(1, 6), Le = 2;
    const per = (B - 1) * B ** (Lm - 1);
    return {
      intro: `<p>Sei ${mi("B")} = ${B}, ${mi("L")}<sub>m</sub> = ${Lm}, ${mi("e")}<sub>min</sub> = ${emin} und ${mi("L")}<sub>e</sub> = ${Le}.</p>`,
      parts: [
        nmVal("Wie viele normalisierte positive Gleitpunktzahlen gibt es zu einem festen Exponenten?", per, 1, `a₁ ∈ {1, …, B − 1}, die übrigen L<sub>m</sub> − 1 Ziffern frei: (B − 1)B<sup>L<sub>m</sub>−1</sup> = ${per}.`),
        nmVal("Wie viele positive Gleitpunktzahlen enthält FL⁺ insgesamt?", per * B ** Le, 1, `B<sup>L<sub>e</sub></sup> = ${B ** Le} Exponenten mal ${per}.`),
        nmVal("Bestimmen Sie das Verhältnis der Anzahl normalisierter Gleitpunktzahlen in (0, 1) zu denen in [1, B).", 1 - emin, 2,
          `In (0, 1) liegen die Exponenten e = ${emin}, …, 0 — das sind ${1 - emin}; in [1, B) nur e = 1. Jeder Exponent hat gleich viele Zahlen, also ${1 - emin} : 1.`),
      ],
    };
  },
});

const NM_CANCEL = [
  ["√(x + 1) − √x für großes x", "1/(√(x + 1) + √x)", ["√(x + 1)·(1 − √x)", "(x + 1 − x)/√x", "√(2x + 1) − 2√x"]],
  ["1 − cos x für kleines x", "2 sin²(x/2)", ["sin² x", "cos x − 1", "1 − sin x"]],
  ["(1 + x)² − 1 für kleines x", "x(2 + x)", ["(1 + x)(1 − x)", "x² + 1", "2x − x²"]],
  ["2 − √(4 − g²) für kleines g", "g²/(2 + √(4 − g²))", ["√(2 − g²)", "(2 − g)²/4", "g/(2 − √(4 − g²))"]],
];
nmTask({
  id: "cancel", topic: "gp", name: "Kondition der Addition, Auslöschung", like: "1920-ws/6",
  make() {
    const x = 0.98 + rint(1000000, 9999999) / 1e9, dig = rint(6, 9), y = -(x - rint(10, 99) / 10 ** (dig + 1));
    const kappa = (Math.abs(x) + Math.abs(y)) / Math.abs(x + y), lost = Math.round(Math.log10(kappa));
    const [what, good, bad] = nmPick(NM_CANCEL);
    return {
      intro: `<p>Seien x̃ = x(1 + ε<sub>x</sub>), ỹ = y(1 + ε<sub>y</sub>) relativ gestörte Daten mit |ε<sub>x</sub>|, |ε<sub>y</sub>| ≤ ε und x + y ≠ 0.</p>`,
      parts: [
        nmW("Schätzen Sie die relative Abweichung |(x̃ + ỹ) − (x + y)| / |x + y| ab und interpretieren Sie die Abschätzung im Hinblick auf die Kondition.",
          `${F(`${frac("|x̃ + ỹ − (x + y)|", "|x + y|")} = ${frac("|xε<sub>x</sub> + yε<sub>y</sub>|", "|x + y|")} ≤ ε ${frac("|x| + |y|", "|x + y|")}`, "small-f")}
           Gut konditioniert bei gleichem Vorzeichen (Faktor 1), schlecht bei x ≈ −y: Auslöschung.`,
          [[1, "x̃ + ỹ − (x + y) = xε<sub>x</sub> + yε<sub>y</sub> und Dreiecksungleichung"], [1, "Faktor (|x| + |y|)/|x + y|"], [1, "Interpretation: gleiches Vorzeichen gut, x ≈ −y schlecht"]]),
        nmVal(`Berechnen Sie den Verstärkungsfaktor (|x| + |y|)/|x + y| für x = ${String(x).replace(".", ",")}, y = ${String(+y.toFixed(12)).replace(".", ",")} (auf zwei gültige Stellen, z. B. 5,2e7).`, kappa, 2,
          `x + y = ${nmSci(x + y, 2)}, |x| + |y| ≈ ${nmD(Math.abs(x) + Math.abs(y), 4)}, also ≈ ${nmSci(kappa, 2)}.`),
        nmVal("Etwa wie viele Dezimalstellen gehen dabei verloren (ganze Zahl)?", [lost, lost - 1, lost + 1], 1, `log₁₀ des Faktors ≈ ${nmD(Math.log10(kappa), 1)}.`),
        nmMC(`Welche Formel berechnet ${what} ohne Auslöschung?`, [good, ...bad], 1, `${good} ist mathematisch gleich, aber es werden keine fast gleich großen Zahlen mehr voneinander abgezogen.`),
      ],
    };
  },
});

/* ================================================================ LR und Cholesky */

nmTask({
  id: "lrpiv", topic: "lr", name: "LR-Zerlegung mit Spaltenpivotwahl", like: "26-ss/1",
  make() {
    const A = nmNiceLR(), x = [rint(-3, 3), rint(-3, 3), rint(-3, 3)], b = nmMv(A, x);
    const r = nmLRSteps(A), Pb = r.perm.map((p) => nmQ(b[p - 1]));
    const y = [];
    Pb.forEach((v, i) => y.push(r.L[i].slice(0, i).reduce((s, l, j) => s.sub(l.mul(y[j])), v)));
    return {
      intro: `${F(`A = ${qmx(qm(A))},  b = ${cv(b.map((v) => nmD(v)))}`)}`,
      parts: [
        nmVal(`Berechnen Sie PA = LR mit Spaltenpivotwahl. Geben Sie die Permutation an: π<sub>k</sub> = Nummer der Zeile von A, die in PA an Stelle k steht (${L3}).`, ql(r.perm), 1, `Die Zeilennummern links im Schema nach allen Tauschen: (${r.perm.join(", ")}).`),
        nmVal(`Geben Sie ℓ<sub>21</sub>; ℓ<sub>31</sub>; ℓ<sub>32</sub> an.`, ql([r.L[1][0], r.L[2][0], r.L[2][1]]), 2, `L = ${qmx(r.L)}`),
        nmVal(`Geben Sie r<sub>11</sub>; r<sub>12</sub>; r<sub>13</sub>; r<sub>22</sub>; r<sub>23</sub>; r<sub>33</sub> an.`, ql([r.R[0][0], r.R[0][1], r.R[0][2], r.R[1][1], r.R[1][2], r.R[2][2]]), 2, `R = ${qmx(r.R)}`),
        nmVal(`Lösen Sie Ly = Pb durch Vorwärtssubstitution: y = ? (${L3})`, ql(y), 1, `Pb = (${Pb.map(qs).join(", ")}), y = (${y.map((v) => v.toString()).join(", ")}).`),
        nmVal(`Lösen Sie Rx = y: x = ? (${L3})`, ql(x), 1, `Rückwärts eingesetzt: x = (${x.join(", ")}). Probe: Ax = b.`),
        nmW("Erklären Sie, wie man mit PA = LR das LGS Ax = b löst, begründen Sie es kurz und geben Sie den Aufwand an.",
          `Löse Ly = Pb durch Vorwärts- und Rx = y durch Rückwärtssubstitution. Dann Ax = PᵀPAx = PᵀLRx = PᵀLy = PᵀPb = b (P orthogonal). Aufwand je ½N² Operationen, die Zerlegung ⅓N³.`,
          [[1, "erst Ly = Pb vorwärts, dann Rx = y rückwärts"], [1, "Begründung über PᵀP = I"], [1, "Aufwand N²/2 je Substitution (bzw. N³/3 für die Zerlegung)"]]),
      ],
    };
  },
});

nmTask({
  id: "subst", topic: "lr", name: "Vorwärts- und Rückwärtssubstitution", like: "1718-ws/1",
  make() {
    const L = [[nmPick([1, 2, -1, 3]), 0, 0], [rint(-3, 3), nmPick([1, -1, 2]), 0], [rint(-3, 3), rint(-3, 3), nmPick([1, 2, -2])]];
    const y = [rint(-3, 4), rint(-3, 4), rint(-3, 4)], b = nmMv(L, y);
    return {
      intro: F(`L = ${mx(L.map((r) => r.map((v) => nmD(v))))},  b = ${cv(b.map((v) => nmD(v)))}`),
      parts: [
        nmVal(`Lösen Sie Ly = b durch Vorwärtssubstitution (${L3}).`, ql(y), 2, `y₁ = b₁/ℓ₁₁ = ${y[0]}, y₂ = (b₂ − ℓ₂₁y₁)/ℓ₂₂ = ${y[1]}, y₃ = (b₃ − ℓ₃₁y₁ − ℓ₃₂y₂)/ℓ₃₃ = ${y[2]}.`),
        nmMC("Wie viele Operationen braucht die Vorwärtssubstitution für ein N × N-System (führender Term)?", ["N²/2", "N²", "N³/3", "N"], 1, "Zeile n braucht n − 1 Operationen: Σ(n − 1) ≈ N²/2."),
        nmW("Leiten Sie eine Spaltenversion der Vorwärtssubstitution her (zwei Zeilen in der Schleife über n).",
          `${pycode(`
            def forward_sub(L, b):
                N = len(b)
                y = np.zeros(N)
                for n in range(N):
                    y[n] = b[n] / L[n,n]
                    b[n+1:] = b[n+1:] - y[n] * L[n+1:,n]
                return y`)}
            Aus (ℓ₁₁ 0; ℓ₂₁ L₂₂)(y₁; y₂) = (b₁; b₂): y₁ = b₁/ℓ₁₁, dann L₂₂y₂ = b₂ − y₁ℓ₂₁ — rekursiv.`,
          [[1, "y[n] = b[n]/L[n,n]"], [1, "die restliche rechte Seite um y[n] mal Spalte n von L verringern"]]),
      ],
    };
  },
});

nmTask({
  id: "chol", topic: "lr", name: "Cholesky-Zerlegung", like: "1920-ws/6",
  make() {
    const L = [[rint(1, 3), 0, 0], [rint(-2, 2), rint(1, 3), 0], [rint(-2, 2), rint(-2, 2), rint(1, 3)]];
    const A = nmMul(L, nmT(L)), det = (L[0][0] * L[1][1] * L[2][2]) ** 2;
    return {
      intro: F(`A = ${mx(A.map((r) => r.map((v) => nmD(v))))}`),
      parts: [
        nmMC("Unter welcher Voraussetzung existiert eine Cholesky-Zerlegung A = LLᵀ mit regulärem L?", ["A ist symmetrisch und positiv definit", "A ist regulär", "A ist symmetrisch", "alle aₙₙ > 0"], 1, "A = LLᵀ regulär ⇔ A spd."),
        nmVal(`Bestimmen Sie ℓ<sub>11</sub>; ℓ<sub>21</sub>; ℓ<sub>22</sub> (${L3}).`, ql([L[0][0], L[1][0], L[1][1]]), 2, `ℓ₁₁ = √a₁₁ = ${L[0][0]}, ℓ₂₁ = a₂₁/ℓ₁₁ = ${L[1][0]}, ℓ₂₂ = √(a₂₂ − ℓ₂₁²) = ${L[1][1]}.`),
        nmVal(`Bestimmen Sie ℓ<sub>31</sub>; ℓ<sub>32</sub>; ℓ<sub>33</sub> (${L3}).`, ql([L[2][0], L[2][1], L[2][2]]), 2, `ℓ₃₁ = a₃₁/ℓ₁₁ = ${L[2][0]}, ℓ₃₂ = (a₃₂ − ℓ₃₁ℓ₂₁)/ℓ₂₂ = ${L[2][1]}, ℓ₃₃ = √(a₃₃ − ℓ₃₁² − ℓ₃₂²) = ${L[2][2]}.`),
        nmVal("Berechnen Sie det(A) mit Hilfe der Zerlegung.", det, 1, `det A = det L · det Lᵀ = (ℓ₁₁ℓ₂₂ℓ₃₃)² = ${det}.`),
        nmMC("Was kostet die Cholesky-Zerlegung einer N × N-Matrix?", ["N³/6", "N³/3", "2N³/3", "N²/2"], 1, "Halb so viel wie die LR-Zerlegung."),
      ],
    };
  },
});

nmTask({
  id: "block", topic: "lr", name: "Blocksystem mit bekannten Zerlegungen", like: "22-ss/1",
  make() {
    const up = Math.random() < 0.5;
    return {
      intro: `<p>Gegeben ist M x = b mit ${up ? F(`M = ${mx([["A", "B"], ["0", "C"]])}`, "small-f") : F(`M = ${mx([["A", "0"], ["B", "C"]])}`, "small-f")}
        mit A ∈ ℝ<sup>N×N</sup>, C ∈ ℝ<sup>K×K</sup>, B ${up ? "∈ ℝ<sup>N×K</sup>" : "∈ ℝ<sup>K×N</sup>"} voll besetzt, x = (x₁; x₂), b = (b₁; b₂). Bekannt sind PA = LR<sub>A</sub> und C = QR<sub>C</sub>.</p>`,
      parts: [
        nmMC("Wie viele Operationen hat die QR-Zerlegung von C gekostet (Householder)?", ["2K³/3", "K³/3", "K³/6", "K²"], 1, "MN² − N³/3 mit M = N = K."),
        nmMC(`Welcher Teil wird zuerst gelöst?`, [up ? "x₂ aus Cx₂ = b₂" : "x₁ aus Ax₁ = b₁", up ? "x₁ aus Ax₁ = b₁" : "x₂ aus Cx₂ = b₂", "beide gleichzeitig mit einer LR-Zerlegung von M", "x aus MᵀMx = Mᵀb"], 1,
          up ? "Die zweite Blockzeile enthält nur x₂." : "Die erste Blockzeile enthält nur x₁."),
        nmMC("Was kostet das Lösen insgesamt (ohne die Zerlegungen)?", ["N² + NK + 3K²/2", "N² + K²", "N³/3 + 2K³/3", "(N + K)²"], 2,
          `${up ? "Qᵀb₂ (K²), R<sub>C</sub>x₂ = c rückwärts (K²/2), b₁ − Bx₂ (NK), Ly = P(…) und R<sub>A</sub>x₁ = y (je N²/2)" : "Ly = Pb₁, R<sub>A</sub>x₁ = y (je N²/2), b₂ − Bx₁ (NK), Qᵀ(…) (K²), R<sub>C</sub>x₂ = c (K²/2)"}.`),
        nmW("Erklären Sie das Vorgehen Schritt für Schritt.",
          up ? `1. Cx₂ = b₂: c = Qᵀb₂, dann R<sub>C</sub>x₂ = c rückwärts. 2. Ax₁ = b₁ − Bx₂: Ly = P(b₁ − Bx₂) vorwärts, R<sub>A</sub>x₁ = y rückwärts.`
            : `1. Ax₁ = b₁: Ly = Pb₁ vorwärts, R<sub>A</sub>x₁ = y rückwärts. 2. Cx₂ = b₂ − Bx₁: c = Qᵀ(b₂ − Bx₁), R<sub>C</sub>x₂ = c rückwärts.`,
          [[1, "richtige Reihenfolge der Blöcke"], [1, "Teilsystem mit QR: Qᵀ anwenden, dann rückwärts"], [1, "Teilsystem mit LR: Permutation, vorwärts, rückwärts"]]),
      ],
    };
  },
});

/* ================================================================ Householder */

const NM_NICE_VECS = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [2, 6, 9], [4, 4, 7], [1, 2, 2, 4], [2, 4, 5, 6], [1, 5, 3, 3, 2, 1]];
nmTask({
  id: "hhvec", topic: "qr", name: "Auslöschungsfreie Householder-Spiegelung", like: "1920-ws/1",
  make() {
    const a = shuffle(nmPick(NM_NICE_VECS)).map((v) => v * nmSign()), na = Math.round(nmN2(a));
    const sigma = a[0] > 0 ? -na : na, u = [a[0] - sigma, ...a.slice(1)], nu2 = nmDot(u, u);
    return {
      intro: F(`a = ${cv(a.map((v) => nmD(v)))}`),
      parts: [
        nmVal("Geben Sie σ an, so dass Qa = σe₁ auslöschungsfrei berechnet wird.", sigma, 1, `‖a‖₂ = ${na}; a₁ ${a[0] > 0 ? "&gt; 0 ⇒ σ = −" : "≤ 0 ⇒ σ = +"}‖a‖₂ = ${sigma}.`),
        nmVal(`Geben Sie den unnormierten Householder-Vektor u = a − σe₁ an (${L3}).`, ql(u), 1, `Nur die erste Komponente ändert sich: ${a[0]} − (${sigma}) = ${u[0]}.`),
        nmVal("Berechnen Sie ‖u‖₂².", nu2, 1, `‖u‖₂² = ${u.map((v) => `${v}²`).join(" + ")} = ${nu2} = 2‖a‖₂(‖a‖₂ + |a₁|). Dann w = u/√${nu2}.`),
        nmVal(`Welcher Vektor ist Qa (${L3})?`, ql([sigma, ...a.slice(1).map(() => 0)]), 1, "Q spiegelt a genau auf σe₁."),
        nmW("Erklären Sie, warum diese Wahl von σ Auslöschung vermeidet, und was Auslöschung ist.",
          `In u₁ = a₁ − σ haben a₁ und −σ dasselbe Vorzeichen: es wird nichts Fast-Gleiches abgezogen. Auslöschung: bei der Differenz fast gleich großer Zahlen fallen die richtigen führenden Stellen weg, Rundungsfehler bestimmen das Ergebnis (x − y ist für x ≈ y schlecht konditioniert).`,
          [[1, "a₁ und −σ gleiches Vorzeichen, Summe ohne Auslöschung"], [1, "Auslöschung erklärt"]]),
      ],
    };
  },
});

nmTask({
  id: "hessen", topic: "eig", name: "Hessenbergform einer symmetrischen 3 × 3-Matrix", like: "2425-ws/3",
  make() {
    const [p, q] = nmPick([[3, 4], [4, 3], [6, 8], [8, 6], [5, 12], [12, 5]]).map((v) => v * nmSign()), r = Math.round(Math.hypot(p, q));
    const a11 = rint(-3, 4), a22 = rint(-3, 4), a23 = rint(-3, 3), a33 = rint(-3, 4);
    const sigma = p > 0 ? -r : r;
    const Qt = [[nmQ(p, sigma), nmQ(q, sigma)], [nmQ(q, sigma), nmQ(-p, sigma)]], A22 = qm([[a22, a23], [a23, a33]]);
    const mul = (X, Y) => X.map((row) => Y[0].map((_, j) => row.reduce((s, x, k) => s.add(x.mul(Y[k][j])), nmQ(0))));
    const H22 = mul(mul(Qt, A22), Qt);
    return {
      intro: F(`A = ${mx([[a11, p, q], [p, a22, a23], [q, a23, a33]].map((r) => r.map((v) => nmD(v))))}`) + `<p class="small">Transformieren Sie A auf Hessenbergform H = QAQ, ohne die Eigenwerte zu ändern; Q = diag(1, Q̃) mit einer auslöschungsfreien 2 × 2-Householder-Spiegelung Q̃.</p>`,
      parts: [
        nmMC("Warum ändern sich die Eigenwerte nicht?", ["Q ist symmetrisch und orthogonal, also QAQ = QᵀAQ = Q⁻¹AQ ähnlich zu A", "Q ist eine Dreiecksmatrix", "det Q = 1", "Weil A symmetrisch ist"], 1, "Ähnlichkeitstransformation."),
        nmVal("Auf welches Vielfache σe₁ spiegelt Q̃ den Vektor (a₂₁, a₃₁)? σ = ?", sigma, 1, `‖(${p}, ${q})‖ = ${r}, a₂₁ ${p > 0 ? "&gt; 0" : "≤ 0"} ⇒ σ = ${sigma}.`),
        nmVal(`Geben Sie Q̃ zeilenweise an: q̃₁₁; q̃₁₂; q̃₂₁; q̃₂₂ (${L3}).`, ql(Qt.flat()), 2, `Q̃ ist symmetrisch, orthogonal und Q̃e₁ = (a₂₁, a₃₁)ᵀ/σ, also Q̃ = ${qmx(Qt)}.`),
        nmVal(`Geben Sie h₂₂; h₂₃; h₃₃ an (${L3}).`, ql([H22[0][0], H22[0][1], H22[1][1]]), 3, `H = ${qmx([[nmQ(a11), nmQ(sigma), nmQ(0)], [nmQ(sigma), H22[0][0], H22[0][1]], [nmQ(0), H22[1][0], H22[1][1]]])} — symmetrisch tridiagonal.`),
      ],
    };
  },
});

/* ================================================================ Normen und Kondition */

nmTask({
  id: "norms", topic: "cond", name: "Matrixnormen und Konditionszahl", like: "2021-ws/6",
  make() {
    const A = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => rint(-6, 9)));
    let B, det;
    do { B = [[rint(-4, 5), rint(-4, 5)], [rint(-4, 5), rint(-4, 5)]]; det = B[0][0] * B[1][1] - B[0][1] * B[1][0]; } while (Math.abs(det) < 1 || Math.abs(det) > 6);
    const Bi = [[nmQ(B[1][1], det), nmQ(-B[0][1], det)], [nmQ(-B[1][0], det), nmQ(B[0][0], det)]];
    const nInf = nmNormInf(B), nInfI = Bi.map((r) => r.reduce((s, x) => s.add(x.abs()), nmQ(0))).reduce((m, x) => (x.cmp(m) > 0 ? x : m));
    return {
      intro: F(`A = ${mx(A.map((r) => r.map((v) => nmD(v))))},  B = ${mx(B.map((r) => r.map((v) => nmD(v))))}`),
      parts: [
        nmVal("Berechnen Sie ‖A‖₁.", nmNorm1(A), 1, `Maximale Spaltenbetragssumme: ${nmT(A).map((c) => c.reduce((s, x) => s + Math.abs(x), 0)).join(", ")}.`),
        nmVal("Berechnen Sie ‖A‖∞.", nmNormInf(A), 1, `Maximale Zeilenbetragssumme: ${A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)).join(", ")}.`),
        nmVal("Berechnen Sie cond∞(B) (als Bruch oder Dezimalzahl).", nInfI.mul(nInf).toString(), 2, `B⁻¹ = ${qmx(Bi)}, ‖B‖∞ = ${nInf}, ‖B⁻¹‖∞ = ${nInfI.html()}, also cond∞(B) = ${nInfI.mul(nInf).html()}.`),
        nmMC("Welche Aussage über die Konditionszahl ist falsch?", ["cond(αA) = |α| cond(A)", "cond(A) ≥ 1", "cond₂(Q) = 1 für orthogonales Q", "cond₂(A) = |λ|max/|λ|min für symmetrisches A"], 1, "cond(αA) = cond(A): der Faktor kürzt sich."),
        nmW("Zeigen Sie cond(A) ≥ 1 für jede zugehörige Matrixnorm.", `1 = ‖I‖ = ‖AA⁻¹‖ ≤ ‖A‖‖A⁻¹‖ = cond(A), mit ‖I‖ = sup ‖x‖/‖x‖ = 1 und der Submultiplikativität.`,
          [[1, "‖I‖ = 1"], [1, "Submultiplikativität auf AA⁻¹ angewendet"]]),
      ],
    };
  },
});

/* ================================================================ Ausgleichsrechnung */

nmTask({
  id: "fit", topic: "lsq", name: "Ausgleichsgerade über die Normalengleichung", like: "17-ss/3",
  make() {
    let ts, ys, S;
    do { ts = pmDistinctSorted(4, -1, 4); ys = ts.map(() => rint(-3, 6)); S = [4, ts.reduce((a, t) => a + t, 0), ts.reduce((a, t) => a + t * t, 0)]; } while (4 * S[2] - S[1] ** 2 === 0);
    const Atb = [ys.reduce((a, y) => a + y, 0), ys.reduce((a, y, i) => a + y * ts[i], 0)];
    const x = nmSolveQ([[S[0], S[1]], [S[1], S[2]]], Atb);
    return {
      intro: `<table class="len-terms nm-tab nm-data-tab"><tbody><tr><td>t<sub>m</sub></td>${ts.map((t) => `<td>${t}</td>`).join("")}</tr><tr><td>y<sub>m</sub></td>${ys.map((y) => `<td>${y}</td>`).join("")}</tr></tbody></table>
        <p>Gesucht ist die Gerade g(t) = α + βt, für die Σ(g(t<sub>m</sub>) − y<sub>m</sub>)² minimal wird.</p>`,
      parts: [
        nmW("Formulieren Sie das lineare Ausgleichsproblem (A und b angeben) und die allgemeine Form der Normalengleichung.",
          `‖Ax − b‖₂ = min! mit A = ${mx(ts.map((t) => ["1", String(t)]))}, x = (α, β)ᵀ, b = (${ys.join(", ")})ᵀ. Normalengleichung AᵀAx = Aᵀb.`,
          [[1, "A mit Spalten 1 und t<sub>m</sub>, b aus den y<sub>m</sub>"], [1, "AᵀAx = Aᵀb"]]),
        nmVal(`Berechnen Sie die Einträge von AᵀA: (AᵀA)₁₁; (AᵀA)₁₂; (AᵀA)₂₂ (${L3}).`, ql(S), 1, `m, Σt<sub>m</sub>, Σt<sub>m</sub>² = ${S.join(", ")}.`),
        nmVal(`Berechnen Sie Aᵀb (${L3}).`, ql(Atb), 1, `Σy<sub>m</sub> = ${Atb[0]}, Σt<sub>m</sub>y<sub>m</sub> = ${Atb[1]}.`),
        nmVal(`Lösen Sie die Normalengleichung: α; β (${L3}).`, ql(x), 2, `α = ${x[0].html()}, β = ${x[1].html()}.`),
        nmMC("Warum löst man Ausgleichsprobleme in der Praxis meist mit QR statt mit der Normalengleichung?", ["cond₂(AᵀA) = cond₂(A)²", "Die Normalengleichung ist nicht immer lösbar", "QR ist billiger", "AᵀA ist nie symmetrisch"], 1, "Die Normalengleichung quadriert die Kondition."),
      ],
    };
  },
});

nmTask({
  id: "qrls", topic: "lsq", name: "Ausgleich mit gegebener QR-Zerlegung", like: "1718-ws/4",
  make() {
    const R = [[nmPick([2, 3, 5, -5, 4]), rint(-3, 3)], [0, nmPick([2, -5, 4, 3])]], c = [rint(-6, 6), rint(-6, 6)];
    const d = nmPick([[0, 0], [3, 4], [-4, 3], [0, 2], [5, 12]]), res = Math.hypot(...d);
    const x2 = nmQ(c[1], R[1][1]), x1 = nmQ(c[0]).sub(x2.mul(R[0][1])).div(R[0][0]);
    return {
      intro: `<p>Für A ∈ ℝ<sup>4×2</sup> mit vollem Rang ist eine QR-Zerlegung A = QR bekannt mit R̄ = ${mx(R.map((r) => r.map((v) => nmD(v))))} und Qᵀb = (${[...c, ...d].join(", ")})ᵀ.</p>`,
      parts: [
        nmVal(`Bestimmen Sie die Lösung x des Ausgleichsproblems ‖Ax − b‖₂ = min! (${L3}).`, ql([x1, x2]), 2, `R̄x = c = (${c.join(", ")}) rückwärts: x₂ = ${x2.html()}, x₁ = ${x1.html()}.`),
        nmVal("Wie groß ist das Residuum ‖Ax − b‖₂?", res, 1, `‖d‖₂ = ‖(${d.join(", ")})‖₂ = ${nmD(res, 4)}.`),
        nmMC("Ist das überbestimmte System Ax = b exakt lösbar?", res === 0 ? ["Ja, weil d = 0", "Nein, weil d ≠ 0", "Nein, überbestimmte Systeme sind nie lösbar", "Nur wenn R̄ symmetrisch ist"] : ["Nein, weil d ≠ 0", "Ja, weil d = 0", "Ja, weil A vollen Rang hat", "Nur wenn R̄ symmetrisch ist"], 1, "Ax = b ist genau dann lösbar, wenn das minimale Residuum 0 ist."),
        nmW("Begründen Sie, warum x = R̄⁻¹c das Ausgleichsproblem löst.", `‖Ax − b‖₂² = ‖Qᵀ(Ax − b)‖₂² = ‖Rx − Qᵀb‖₂² = ‖R̄x − c‖₂² + ‖d‖₂² ≥ ‖d‖₂², mit Gleichheit genau für R̄x = c.`,
          [[1, "Qᵀ ändert die 2-Norm nicht"], [1, "Aufspaltung in ‖R̄x − c‖² + ‖d‖² und Minimum bei R̄x = c"]]),
      ],
    };
  },
});

nmTask({
  id: "svd", topic: "lsq", name: "Singulärwerte", like: "2223-ws/2",
  make() {
    const [s1, s2] = nmPick([[5, 3], [5, 1], [4, 2], [6, 2], [3, 1], [7, 1], [5, 4]]);
    const l1 = s1 * s1, l2 = s2 * s2, M = [[(l1 + l2) / 2, (l1 - l2) / 2], [(l1 - l2) / 2, (l1 + l2) / 2]];
    return {
      intro: `<p>Für A ∈ ℝ<sup>3×2</sup> gilt AᵀA = ${mx(M.map((r) => r.map((v) => nmD(v))))}.</p>`,
      parts: [
        nmVal(`Bestimmen Sie die Singulärwerte σ₁ ≥ σ₂ von A (${L3}).`, ql([s1, s2]), 2, `Eigenwerte von AᵀA: ${(l1 + l2) / 2} ± ${(l1 - l2) / 2} = ${l1}, ${l2} (Eigenvektoren (1, ±1)/√2); σ = √λ.`),
        nmVal("Was ist ‖A‖₂?", s1, 1, "‖A‖₂ = σ₁."),
        nmVal("Was ist cond₂(A) = σ₁/σ₂?", `${s1}/${s2}`, 1, `${s1}/${s2}.`),
        nmVal("Wie groß ist ‖A − A₁‖₂ für die beste Rang-1-Näherung A₁ = σ₁u₁v₁ᵀ?", s2, 1, "Es bleibt der größte weggelassene Singulärwert σ₂."),
        nmW("Zeigen Sie ‖A‖₂ = σ₁ mit A = UΣVᵀ.", `‖Ax‖₂ = ‖UΣVᵀx‖₂ = ‖Σy‖₂ mit y = Vᵀx, ‖y‖₂ = ‖x‖₂ (U, V orthogonal). ‖Σy‖₂² = Σσᵢ²yᵢ² ≤ σ₁²‖y‖₂², Gleichheit für y = e₁ (x = v₁).`,
          [[1, "orthogonale Matrizen erhalten die 2-Norm"], [1, "‖Σy‖ ≤ σ₁‖y‖ mit Gleichheit für y = e₁"]]),
      ],
    };
  },
});

/* ================================================================ Newton */

nmTask({
  id: "nt1", topic: "newton", name: "Newton-Schritte in einer Dimension", like: "2425-ws/1",
  make() {
    const v = rint(0, 3);
    let intro, f, xs = [], fname;
    if (v === 0) {
      let a; do { a = rint(2, 40); } while (Number.isInteger(Math.sqrt(a)));
      const x0 = Math.max(1, Math.round(Math.sqrt(a)) + nmPick([-1, 1, 2]));
      fname = `f(x) = x² − ${a}`;
      xs = [x0]; for (let k = 0; k < 2; k++) xs.push((xs[k] + a / xs[k]) / 2);
      intro = `<p>Approximieren Sie √${a} mit dem Newton-Verfahren der Vorlesung, Startwert x₀ = ${x0}.</p>`;
      f = "x<sub>k+1</sub> = ½(x<sub>k</sub> + a/x<sub>k</sub>)";
    } else if (v === 1) {
      const a = rint(3, 30), x0 = Math.max(1, Math.round(Math.cbrt(a)));
      fname = `f(x) = x³ − ${a}`;
      xs = [x0]; for (let k = 0; k < 2; k++) xs.push((2 * xs[k] + a / xs[k] ** 2) / 3);
      intro = `<p>Approximieren Sie ∛${a} mit dem Newton-Verfahren, Startwert x₀ = ${x0}.</p>`;
      f = "x<sub>k+1</sub> = (2x<sub>k</sub> + a/x<sub>k</sub>²)/3";
    } else if (v === 2) {
      const y = rint(2, 12), x0 = nmPick([1, 2]);
      fname = `f(x) = eˣ − ${y}`;
      xs = [x0]; for (let k = 0; k < 2; k++) xs.push(xs[k] - 1 + y * Math.exp(-xs[k]));
      intro = `<p>Berechnen Sie ln ${y} als Umkehrfunktion von exp: Newton für die Nullstelle von eˣ − ${y}, Startwert x₀ = ${x0}.</p>`;
      f = "x<sub>k+1</sub> = x<sub>k</sub> − 1 + y e<sup>−x<sub>k</sub></sup>";
    } else {
      const y = rint(5, 25) / 10;
      fname = `g(x) = ln x − ${nmD(y)}`;
      xs = [Math.E, Math.E * y];
      intro = `<p>Berechnen Sie näherungsweise exp(${nmD(y)}) durch Newton für die Umkehrfunktion: Nullstelle von ln x − ${nmD(y)}, Startwert x₀ = e.</p>`;
      f = "x₁ = x₀ − (ln x₀ − y)x₀ = e · y";
    }
    const parts = [
      nmW("Formulieren Sie das Newton-Verfahren mit Stoppkriterium.", `S0) Startwert x₀, Toleranz ε, k = 0. S1) Löse f′(x<sub>k</sub>)d<sub>k</sub> = −f(x<sub>k</sub>), x<sub>k+1</sub> = x<sub>k</sub> + d<sub>k</sub>. S2) Falls ‖d<sub>k</sub>‖ &lt; ε: STOPP, sonst k um 1 erhöhen und zu S1.`,
        [[1, "Iterationsvorschrift (bzw. LGS f′(xₖ)dₖ = −f(xₖ))"], [1, "Stoppkriterium über ‖dₖ‖ und Startwert/Toleranz"]]),
      nmVal(`Berechnen Sie x₁ (auf mindestens drei Nachkommastellen).`, xs[1], 2, `Mit ${fname}: ${f}, also x₁ = ${nmD(xs[1], 6)}.`),
    ];
    if (v < 3) parts.push(nmVal("Berechnen Sie x₂.", xs[2], 1, `x₂ = ${nmD(xs[2], 6)}.`));
    parts.push(nmMC("Wie konvergiert das Verfahren nahe einer einfachen Nullstelle?", ["lokal quadratisch", "linear mit Rate ½", "global quadratisch", "kubisch"], 1, "‖x* − xₖ₊₁‖ ≤ C‖x* − xₖ‖² für Startwerte nah an x* (f′(x*) ≠ 0)."));
    return { intro, parts };
  },
});

nmTask({
  id: "nt2", topic: "newton", name: "Ein Newton-Schritt in zwei Dimensionen", like: "1718-ws/6",
  make() {
    const H = rint(1, 4), R = H + rint(1, 6);
    let x0, y0;
    do { x0 = rint(-2, 3); y0 = rint(-2, 2); } while (!x0 || !y0);
    const fx = [x0 * x0 + y0 * y0 - R, x0 * x0 - y0 * y0 - H], J = [[2 * x0, 2 * y0], [2 * x0, -2 * y0]];
    const d = nmSolveQ(J, fx.map((v) => -v)), x1 = [nmQ(x0).add(d[0]), nmQ(y0).add(d[1])];
    return {
      intro: `<p>Gesucht ist ein Schnittpunkt des Kreises x² + y² = ${R} und der Hyperbel x² − y² = ${H}.</p>`,
      parts: [
        nmMC("Wie formuliert man das Problem für das Newton-Verfahren?", [`f(x, y) = (x² + y² − ${R}, x² − y² − ${H})ᵀ = 0`, `f(x, y) = x² + y² − x² + y² = ${R - H}`, `min (x² + y²)`, `f(x, y) = (x² + y², x² − y²)ᵀ`], 1, "Ein System f: ℝ² → ℝ² mit Nullstelle im Schnittpunkt."),
        nmVal(`Berechnen Sie f(x₀) für x₀ = (${x0}, ${y0})ᵀ (${L3}).`, ql(fx), 1, `(${x0 * x0} + ${y0 * y0} − ${R}, ${x0 * x0} − ${y0 * y0} − ${H}).`),
        nmVal(`Geben Sie die Jacobi-Matrix f′(x₀) zeilenweise an (${L3}).`, ql(J.flat()), 1, `f′ = (2x 2y; 2x −2y) = ${mx(J.map((r) => r.map((v) => nmD(v))))}.`),
        nmVal(`Berechnen Sie die erste Iterierte x₁ (${L3}).`, ql(x1), 2, `f′(x₀)d₀ = −f(x₀) ergibt d₀ = (${d.map((v) => v.toString()).join(", ")}), x₁ = x₀ + d₀ = (${x1.map((v) => v.toString()).join(", ")}).`),
        nmMC("Was ist der Vorteil des vereinfachten Newton-Verfahrens?", ["Die Jacobi-Matrix wird nur einmal berechnet und zerlegt", "Es konvergiert quadratisch", "Es braucht keinen Startwert", "Es findet alle Nullstellen"], 1, "Dafür nur noch lineare Konvergenz."),
      ],
    };
  },
});

/* ================================================================ Interpolation */

nmTask({
  id: "dd", topic: "interp", name: "Newton-Darstellung mit dividierten Differenzen", like: "24-ss/2",
  make() {
    const xs = pmDistinctSorted(5, -3, 5), fs = xs.map(() => rint(-6, 9));
    const order = [0, 1, 2, 3].sort(() => 0), base = xs.slice(0, 4), add = xs[4];
    const T = nmDDTable(base, fs.slice(0, 4)), coef = T.map((c) => c[0]);
    const T5 = nmDDTable([...base, add], fs), c4 = T5[4][0];
    const xe = [...Array(9).keys()].map((i) => i - 3).find((v) => !xs.includes(v));
    const p = (x) => coef.reduce((s, c, k) => s.add(c.mul(base.slice(0, k).reduce((pr, xm) => pr.mul(nmQ(x - xm)), nmQ(1)))), nmQ(0));
    return {
      intro: `<table class="len-terms nm-tab nm-data-tab"><tbody><tr><td>n</td>${order.map((n) => `<td>${n}</td>`).join("")}</tr><tr><td>x<sub>n</sub></td>${base.map((x) => `<td>${x}</td>`).join("")}</tr><tr><td>f<sub>n</sub></td>${fs.slice(0, 4).map((f) => `<td>${f}</td>`).join("")}</tr></tbody></table>`,
      parts: [
        nmVal(`Bestimmen Sie die Koeffizienten der Newton-Darstellung f₀,₀; f₀,₁; f₀,₂; f₀,₃ (${L3}).`, ql(coef), 3, `Die oberste Diagonale des Schemas: p(x) = ${nmNewtonForm(base, coef)}.`),
        nmMC("Wie lauten die Newton-Polynome?", [`w₀ = 1, w₁ = (x − ${base[0]}), w₂ = (x − ${base[0]})(x − ${base[1]}), w₃ = (x − ${base[0]})(x − ${base[1]})(x − ${base[2]})`, `wₙ = (x − xₙ)`, `w₃ = (x − ${base[0]})(x − ${base[1]})(x − ${base[2]})(x − ${base[3]})`, "die Lagrange-Polynome Lₙ"], 1, "wₙ(x) = ∏_{m<n}(x − xₘ)."),
        nmVal(`Werten Sie p an der Stelle x = ${xe} aus.`, p(xe).toString(), 1, `Mit dem Horner-Schema: p(${xe}) = ${p(xe).html()}.`),
        nmVal(`Der Punkt (${add}, ${fs[4]}) kommt hinzu. Wie lautet der neue Koeffizient f₀,₄?`, c4.toString(), 2, `Nur eine neue Zeile im Schema; p₀,₄ = p₀,₃ + f₀,₄w₄ mit f₀,₄ = ${c4.html()}.`),
      ],
    };
  },
});

nmTask({
  id: "cheb", topic: "interp", name: "Wie viele Tschebyscheff-Stützstellen?", like: "2021-ws/2",
  make() {
    const k = nmPick([1, 2, 3]), fn = nmPick(["sin", "cos"]), m = nmPick([2, 3, 4, 6]), tol = 10 ** -m;
    let N = 0;
    const fact = (n) => (n <= 1 ? 1 : n * fact(n - 1));
    while (k ** (N + 1) / (2 ** N * fact(N + 1)) > tol) N++;
    const f = `${fn}(${k === 1 ? "" : k}x)`;
    return {
      intro: `<p>Wir wollen f(x) = ${f} auf [−1, 1] gleichmäßig bis auf einen Fehler von 10<sup>−${m}</sup> durch ein Interpolationspolynom vom Grad ≤ N in Tschebyscheff-Stützstellen approximieren.</p>`,
      parts: [
        nmW("Leiten Sie eine Ungleichung für N her.", `Restglied: |f(x) − p(x)| = |w<sub>N+1</sub>(x)| |f<sup>(N+1)</sup>(ξ)|/(N + 1)!. Für Tschebyscheff-Stützstellen ist max|w<sub>N+1</sub>| = 2<sup>−N</sup>, und |f<sup>(N+1)</sup>| ≤ ${k === 1 ? "1" : `${k}<sup>N+1</sup>`}. Also genügt ${k === 1 ? "" : `${k}<sup>N+1</sup>`}/(2<sup>N</sup>(N + 1)!) ≤ 10<sup>−${m}</sup>.`,
          [[1, "Restglied mit (N + 1)!"], [1, "max|w<sub>N+1</sub>| = 2<sup>−N</sup>"], [1, "Schranke für die Ableitung"]]),
        nmVal("Bestimmen Sie das minimale N.", N, 2, `Probieren: N = ${N - 1} gibt ${nmSci(k ** N / (2 ** (N - 1) * fact(N)), 2)} &gt; 10<sup>−${m}</sup>, N = ${N} gibt ${nmSci(k ** (N + 1) / (2 ** N * fact(N + 1)), 2)} ≤ 10<sup>−${m}</sup>.`),
        nmVal("Wie lautet der Knoten x₀ = cos(π/(2N + 2)) für N = 2 (vier Nachkommastellen)?", Math.cos(Math.PI / 6), 1, "cos(π/6) = √3/2 ≈ 0,8660."),
        nmMC("Warum sind Tschebyscheff-Stützstellen besser als äquidistante?", ["max|w_{N+1}| ist minimal und die Lebesgue-Konstante bleibt klein", "Sie sind leichter zu berechnen", "Das Polynom hat dann kleineren Grad", "Sie liegen gleichmäßig verteilt"], 1, "Kleiner Restglied-Faktor und gute Kondition (Λ_N ≤ 3 für N ≤ 20)."),
      ],
    };
  },
});

/* ================================================================ Splines */

nmTask({
  id: "splpar", topic: "spline", name: "Parameter eines kubischen Splines", like: "1718-ws/5",
  make() {
    const nat = Math.random() < 0.35;
    const a3 = nmPick([-2, -1, 1, 2]), a2 = nat ? 0 : rint(-3, 3), a1 = rint(-6, 8), al = rint(-4, 5);
    const d = nat ? -2 * a3 : nmPick([-3, -2, -1, 1, 2, 3]);
    const be = a3 + d, ga = a2 - 3 * d, b1 = a1 + 3 * d, b0 = al - d;
    const term = (c, p, first = false) => (c === 0 ? "" : `${c < 0 ? (first ? "−" : " − ") : first ? "" : " + "}${Math.abs(c) === 1 && p ? "" : Math.abs(c)}${p ? `x${p > 1 ? `<sup>${p}</sup>` : ""}` : ""}`);
    const s1 = (term(a3, 3, true) + term(a2, 2) + term(a1, 1)) + " + α";
    const s2 = "βx³ + γx²" + term(b1, 1) + term(b0, 0);
    const sd0 = 2 * a2, sd2 = 12 * be + 2 * ga;
    const sp0 = a1, sp2 = 12 * be + 4 * ga + b1;
    const sv0 = al, sv2 = 8 * be + 4 * ga + 2 * b1 + b0, per = sv0 === sv2 && sp0 === sp2 && sd0 === sd2;
    return {
      intro: F(`s(x) = <span class="nm-cases"><span>${s1},  0 ≤ x ≤ 1</span><span>${s2},  1 &lt; x ≤ 2</span></span>`),
      parts: [
        nmVal(`Bestimmen Sie α, β, γ so, dass s ein kubischer Spline zu x₀ = 0, x₁ = 1, x₂ = 2 ist: α; β; γ (${L3}).`, ql([al, be, ga]), 4,
          `s″ stetig in 1: 6·${a3} + 2·${a2} = 6β + 2γ; s′ stetig: 3·${a3} + 2·${a2} + ${a1} = 3β + 2γ + ${b1}; s stetig: ${a3} + ${a2} + ${a1} + α = β + γ + ${b1} + ${b0}. Ergibt β = ${be}, γ = ${ga}, α = ${al}.`),
        nmMC("Ist s ein natürlicher Spline?", sd0 === 0 && sd2 === 0 ? ["Ja: s″(0) = s″(2) = 0", "Nein: s″(0) ≠ 0", "Nein: s′(0) ≠ 0", "Das lässt sich nicht entscheiden"] : ["Nein", "Ja", "Ja, weil s ∈ C²", "Nur wenn α = 0"], 1, `s″(0) = ${sd0}, s″(2) = ${sd2}.`),
        nmVal(`Geben Sie die Randsteigungen s′(0); s′(2) an (${L3}) — als eingespannter Spline wären das v₀ und v_N.`, ql([sp0, sp2]), 1, `s′(0) = ${sp0}, s′(2) = 3β·4 + 2γ·2 + ${b1} = ${sp2}.`),
        nmMC("Ist s ein periodischer Spline?", per ? ["Ja", "Nein"] : ["Nein", "Ja"], 1, `s(0) = ${sv0}, s(2) = ${sv2}; s′: ${sp0}, ${sp2}; s″: ${sd0}, ${sd2} — periodisch nur, wenn alle drei Paare gleich sind.`, true),
        nmW("Geben Sie die Definition eines natürlichen interpolierenden kubischen Splines an.", "s ∈ C²([a, b]), s|<sub>[x<sub>n−1</sub>, x<sub>n</sub>]</sub> ∈ P₃ für n = 1, …, N, s(x<sub>n</sub>) = y<sub>n</sub> für n = 0, …, N und s″(a) = s″(b) = 0.",
          [[1, "C² und stückweise P₃"], [1, "Interpolation und s″(a) = s″(b) = 0"]]),
      ],
    };
  },
});

/* ================================================================ Quadratur */

const NM_NODE_TASKS = [[[0, 1], [1, 2], [1, 1]], [[1, 4], [1, 2], [3, 4]], [[1, 5], [1, 2], [4, 5]], [[1, 6], [1, 2], [5, 6]], [[1, 3], [1, 2], [2, 3]], [[1, 4], [3, 4]], [[1, 3], [2, 3]], [[0, 1], [1, 3], [1, 1]], [[0, 1], [2, 3]]];
nmTask({
  id: "qweights", topic: "quad", name: "Gewichte und Ordnung zu gegebenen Knoten", like: "2425-ws/4",
  make() {
    const c = nmPick(NM_NODE_TASKS), r = nmRuleFromNodes({ c }), p = r.conds.findIndex((x) => !x.ok);
    const sym = r.c.every((ck, k) => ck.add(r.c[r.c.length - 1 - k]).eq(nmQ(1))) && r.b.every((bk, k) => bk.eq(r.b[r.b.length - 1 - k]));
    const mono = r.b.every((bk) => bk.n >= 0);
    return {
      intro: `<p>Gegeben sind die Knoten ${r.c.map((ck, k) => `c<sub>${k + 1}</sub> = ${ck.html()}`).join(", ")}.</p>`,
      parts: [
        nmVal(`Bestimmen Sie die Gewichte so, dass die Quadraturformel maximale Ordnung hat: b₁; …; b<sub>${r.c.length}</sub> (${L3}).`, ql(r.b), 3,
          `Aus den Ordnungsbedingungen Σbₖcₖ<sup>q−1</sup> = 1/q für q = 1, …, ${r.c.length} (oder bₖ = ∫₀¹Lₖ): b = (${r.b.map((x) => x.html()).join(", ")}).`),
        nmVal("Welche Ordnung hat die Formel?", p, 1, r.conds.slice(0, p + 1).map((x) => `q = ${x.q}: ${x.lhs.html()} ${x.ok ? "=" : "≠"} ${frac(1, x.q)}`).join("; ") + "."),
        nmMC("Ist die Formel symmetrisch?", sym ? ["Ja", "Nein"] : ["Nein", "Ja"], 1, "cₖ = 1 − c_{s+1−k} und bₖ = b_{s+1−k}.", true),
        nmMC("Ist die Formel monoton?", mono ? ["Ja, alle Gewichte ≥ 0", "Nein, ein Gewicht ist negativ"] : ["Nein, ein Gewicht ist negativ", "Ja, alle Gewichte ≥ 0"], 1, "Monoton genau dann, wenn alle bₖ ≥ 0.", true),
        nmW("Zeigen Sie: bei p ≥ s sind die Gewichte durch die Knoten eindeutig bestimmt (mit expliziter Formel).", "Die QF ist exakt für die Lagrange-Polynome L<sub>k</sub> (Grad s − 1 ≤ p − 1): ∫₀¹L<sub>k</sub> = Σ<sub>j</sub> b<sub>j</sub>L<sub>k</sub>(c<sub>j</sub>) = b<sub>k</sub>, weil L<sub>k</sub>(c<sub>j</sub>) = δ<sub>kj</sub>.",
          [[1, "Exaktheit für Lₖ, weil Grad ≤ p − 1"], [1, "Lₖ(cⱼ) = δₖⱼ ⇒ bₖ = ∫₀¹Lₖ"]]),
      ],
    };
  },
});

const NM_QAPPLY = [
  { name: "cos(x − m)", f: (m) => (x) => Math.cos(x - m), F: (m) => (x) => Math.sin(x - m), d2: "max|f″| ≤ 1" },
  { name: "eˣ", f: () => Math.exp, F: () => Math.exp },
  { name: "1/x", f: () => (x) => 1 / x, F: () => Math.log, pos: true },
];
nmTask({
  id: "qapply", topic: "quad", name: "Eine Quadraturformel anwenden", like: "2021-ws/5",
  make() {
    const R = nmPick([{ name: "Trapezregel", b: [0.5, 0.5], c: [0, 1], p: 2 }, { name: "Simpsonregel", b: [1 / 6, 4 / 6, 1 / 6], c: [0, 0.5, 1], p: 4 },
      { name: "Mittelpunktregel", b: [1], c: [0.5], p: 2 }, { name: "QF mit c = (¼, ¾), b = (½, ½)", b: [0.5, 0.5], c: [0.25, 0.75], p: 2 }]);
    const G = nmPick(NM_QAPPLY), a = G.pos ? rint(1, 3) : rint(0, 2), b = a + nmPick([2, 4]), m = (a + b) / 2;
    const f = G.f(m), Fx = G.F(m), name = G.name.replace("m", String(m));
    const q = (b - a) * R.b.reduce((s, bk, k) => s + bk * f(a + R.c[k] * (b - a)), 0), exact = Fx(b) - Fx(a);
    return {
      intro: `<p>Approximieren Sie ${ig(String(a), String(b))} ${name} dx mit der ${R.name}.</p>`,
      parts: [
        nmVal("Berechnen Sie die Näherung (vier Nachkommastellen).", q, 2, `(b − a)Σbₖf(a + cₖ(b − a)) = ${(b - a)} · (${R.b.map((bk, k) => `${nmNice(bk)}·f(${nmD(a + R.c[k] * (b - a))})`).join(" + ")}) = ${nmD(q, 6)}. Exakt: ${nmD(exact, 6)}.`),
        nmVal("Welche Ordnung hat die Formel?", R.p, 1, `Die Ordnungsbedingungen gelten bis q = ${R.p}.`),
        nmMC(`Für welche Polynome ist die Formel exakt?`, [`alle Polynome vom Grad ≤ ${R.p - 1}`, `alle Polynome vom Grad ≤ ${R.p}`, `nur Konstanten`, `alle Polynome vom Grad ≤ ${R.p + 1}`], 1, "Ordnung p heißt exakt bis Grad p − 1."),
      ],
    };
  },
});

nmTask({
  id: "qtable", topic: "quad", name: "Fehlertabelle summierter Formeln", like: "1920-ws/4",
  make() {
    const Lr = rint(3, 5), exact = Math.exp(Lr) - 1, Ns = [10, 20, 40, 80];
    const rules = shuffle([["mid", "Mittelpunktregel"], ["trap", "Trapezregel"], ["simp", "Simpsonregel"]]);
    const cols = rules.map(([r]) => Ns.map((N) => nmQuad(NM_RULES[r], Math.exp, 0, Lr, N) - exact));
    const lab = ["(i)", "(ii)", "(iii)"], col = (r) => lab[rules.findIndex(([x]) => x === r)];
    return {
      intro: `<p>Die Tabelle zeigt die Differenz der summierten Formel (äquidistant, h = ${Lr}/N) zum exakten Wert von ${ig("0", String(Lr))}eˣ dx.</p>
        <table class="len-terms nm-tab"><thead><tr><th>N</th>${lab.map((l) => `<th>${l}</th>`).join("")}</tr></thead><tbody>
        ${Ns.map((N, i) => `<tr><td>${N}</td>${cols.map((c) => `<td>${nmD(c[i], 7)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
      parts: [
        nmMC("Welche Spalte gehört zur Simpsonregel?", [col("simp"), ...lab.filter((l) => l !== col("simp"))], 1, "Fehler ÷ 16 pro Halbierung: Ordnung 4.", true),
        nmMC("Welche Spalte gehört zur Mittelpunktregel?", [col("mid"), ...lab.filter((l) => l !== col("mid"))], 1, "Ordnung 2 (÷ 4), etwa halb so groß wie Trapez und mit anderem Vorzeichen (Konstanten 1/24 und 1/12). Für das konvexe eˣ ist Trapez zu groß, Mittelpunkt zu klein.", true),
        nmVal(`Um welchen Faktor fällt der Fehler der Trapezregel ungefähr, wenn N verdoppelt wird?`, 4, 1, "Ordnung 2: Faktor 2² = 4."),
        nmW("Begründen Sie die Zuordnung kurz.", "Der Fehler einer summierten QF der Ordnung p ist O(h<sup>p</sup>): Halbieren von h teilt ihn durch 2<sup>p</sup>. Simpson (p = 4) ÷ 16, Mittelpunkt und Trapez (p = 2) ÷ 4. Die Fehlerkonstanten 1/24 und 1/12 und die Vorzeichen (eˣ konvex: Trapez überschätzt, Mittelpunkt unterschätzt) trennen die beiden.",
          [[1, "Fehlerordnung O(hᵖ) und Faktor 2ᵖ"], [1, "Mittelpunkt und Trapez über Konstante bzw. Vorzeichen unterschieden"]]),
      ],
    };
  },
});

nmTask({
  id: "qsum", topic: "quad", name: "Summierte Trapezregel", like: "26-ss/4",
  make() {
    const k = nmPick([2, 3]), b = nmPick([1, 2]), N = nmPick([2, 4]), h = nmQ(b, N);
    const f = (x) => x.mul(x).mul(k === 3 ? x : nmQ(1));
    let T = f(nmQ(0)).add(f(nmQ(b))).div(2);
    for (let n = 1; n < N; n++) T = T.add(f(h.mul(n)));
    T = T.mul(h);
    const f2max = k === 2 ? 2 : 6 * b, bound = (b * (b / N) ** 2 * f2max) / 12;
    return {
      intro: `<p>Wir approximieren ${ig("0", String(b))} x<sup>${k}</sup> dx mit der summierten Trapezregel T<sub>N</sub> auf N = ${N} gleich langen Teilintervallen.</p>`,
      parts: [
        nmVal("Berechnen Sie T_N (exakt, als Bruch).", T.toString(), 2, `h = ${h.html()}: T<sub>N</sub> = h[(f(0) + f(${b}))/2 + Σ f(x<sub>n</sub>)] = ${T.html()} (exakt: ${nmQ(b ** (k + 1), k + 1).html()}).`),
        nmVal("Wie viele zusätzliche Funktionsauswertungen braucht T₂N, wenn T_N vorliegt?", N, 1, "Nur die N Intervallmittelpunkte: T₂N = ½T_N + (h/2)Σf(Mittelpunkte)."),
        nmVal("Fehlerschranke (b − a)h²/12 · max|f″| für dieses N (als Dezimalzahl).", bound, 2, `(${b}) · (${h.html()})² / 12 · ${f2max} = ${nmD(bound, 5)}.`),
        nmMC("Wie ändert sich die Fehlerschranke, wenn N verdoppelt wird?", ["Sie viertelt sich", "Sie halbiert sich", "Sie bleibt gleich", "Sie fällt auf 1/16"], 1, "h halbiert, Fehler ∝ h²."),
      ],
    };
  },
});

/* ================================================================ Eigenwerte */

nmTask({
  id: "power", topic: "eig", name: "Vektoriteration", like: "17-ss/6",
  make() {
    let l1, l2;
    do { l1 = rint(-7, 9); l2 = rint(-6, 8); } while (Math.abs(l1) <= Math.abs(l2) || (l1 - l2) % 2 !== 0 || !l2);
    const p = (l1 + l2) / 2, q = (l1 - l2) / 2, A = [[p, q], [q, p]];
    const x1 = [p, q], n1 = Math.hypot(...x1), y1 = x1.map((v) => v / n1), ray = nmDot(y1, nmMv(A, y1));
    const mu = nmPick([l2 + 1, l2 - 1, l2 + 0.5]), rate = Math.abs(l2 - mu) / Math.abs(l1 - mu);
    return {
      intro: F(`A = ${mx(A.map((r) => r.map((v) => nmD(v))))},  x₀ = (1, 0)ᵀ`) + `<p class="small">A hat die Eigenwerte ${l1} und ${l2} mit den Eigenvektoren (1, 1)ᵀ bzw. (1, −1)ᵀ (bis auf Normierung).</p>`,
      parts: [
        nmVal(`Berechnen Sie y₁ = Ax₀/‖Ax₀‖₂ (vier Nachkommastellen, ${L3}).`, ql(y1), 2, `Ax₀ = (${p}, ${q})ᵀ, ‖·‖₂ = ${nmD(n1, 4)}.`),
        nmVal("Berechnen Sie die Eigenwertschätzung y₁ᵀAy₁.", ray, 1, `${nmD(ray, 4)} — auf dem Weg zu λ₁ = ${l1}.`),
        nmVal("Mit welcher Rate |λ₂|/|λ₁| konvergiert die Vektoriteration?", `${Math.abs(l2)}/${Math.abs(l1)}`, 1, `|${l2}|/|${l1}|.`),
        nmVal(`Mit welcher Rate konvergiert die inverse Iteration mit Shift μ = ${nmD(mu)}?`, rate, 1, `Sie findet den EW ${l2} (am nächsten an μ), Rate |${l2} − ${nmD(mu)}| / |${l1} − ${nmD(mu)}| = ${nmD(rate, 4)}.`),
        nmMC("Was muss in jedem Schritt der inversen Iteration mit Shift getan werden?", ["(A − μI)xₖ₊₁ = yₖ lösen", "A − μI invertieren", "eine QR-Zerlegung von A berechnen", "det(A − μI) auswerten"], 1, "Mit einer einmal berechneten Zerlegung von A − μI."),
      ],
    };
  },
});

nmTask({
  id: "laplace", topic: "eig", name: "Laplacematrix und spektrale Bisektion", like: "22-ss/4",
  make() {
    const N = 6, E = new Set();
    for (let i = 1; i < N; i++) E.add(`${rint(0, i - 1)}-${i}`);
    while (E.size < 8) { const a = rint(0, N - 1), b = rint(0, N - 1); if (a !== b) E.add(`${Math.min(a, b)}-${Math.max(a, b)}`); }
    const edges = [...E].map((s) => s.split("-").map(Number)), deg = Array(N).fill(0);
    edges.forEach(([a, b]) => { deg[a]++; deg[b]++; });
    const [i, j] = nmPick(edges);
    return {
      intro: `<p>Ein ungerichteter zusammenhängender Graph mit den Knoten v₁, …, v₆ und den Kanten ${edges.map(([a, b]) => `{v${a + 1}, v${b + 1}}`).join(", ")}.</p>`,
      parts: [
        nmVal(`Geben Sie die Diagonale a₁₁; …; a₆₆ der Laplacematrix an (${L3}).`, ql(deg), 2, "aₙₙ ist die Anzahl der Nachbarn von vₙ."),
        nmVal(`Was ist a<sub>${i + 1}${j + 1}</sub>?`, -1, 1, "Bei einer Kante −1, sonst 0."),
        nmMC("Welchen Eigenwert und Eigenvektor hat die Laplacematrix immer?", ["0 mit e = (1, …, 1)ᵀ", "1 mit e", "den größten Knotengrad", "keinen festen"], 1, "Jede Zeilensumme ist 0."),
        nmMC("Welcher Eigenvektor wird für die Bisektion gebraucht?", ["der zum kleinsten positiven Eigenwert", "der zum größten Eigenwert", "e", "der zum Eigenwert 0"], 1, "Der Fiedler-Vektor der Relaxation; dann am Median teilen."),
        nmW("Warum wendet man die inverse Vektoriteration auf A + eeᵀ an und mit welchem Startwert?", "A ist singulär (Ae = 0). A + eeᵀ ist spd, und mit eᵀx₀ = 0 bleibt eᵀxₖ = 0 — auf diesem Unterraum stimmen A und A + eeᵀ überein. In jedem Schritt (A + eeᵀ)xₖ₊₁ = yₖ lösen, z. B. mit Cholesky oder cg.",
          [[1, "A singulär, A + eeᵀ spd"], [1, "Startwert ⊥ e, bleibt ⊥ e"]]),
      ],
    };
  },
});

/* ================================================================ Iterative Verfahren */

nmTask({
  id: "jacobi", topic: "iter", name: "Jacobi und Gauß-Seidel", like: "2021-ws/6",
  make() {
    const A = Array.from({ length: 3 }, (_, i) => Array.from({ length: 3 }, (_, j) => (i === j ? 0 : rint(-2, 2))));
    A.forEach((r, i) => (r[i] = r.reduce((s, x) => s + Math.abs(x), 0) + rint(1, 4)));
    const b = [rint(-6, 9), rint(-6, 9), rint(-6, 9)], x0 = [1, 1, 1];
    const jac = A.map((r, i) => nmQ(b[i] - r.reduce((s, a, j) => s + (j === i ? 0 : a * x0[j]), 0), r[i]));
    const gs = [];
    A.forEach((r, i) => gs.push(r.reduce((s, a, j) => (j === i ? s : s.sub(nmQ(a).mul(j < i ? gs[j] : nmQ(x0[j])))), nmQ(b[i])).div(r[i])));
    const rows = A.map((r, i) => r.reduce((s, a, j) => (j === i ? s : s.add(nmQ(Math.abs(a), r[i]))), nmQ(0))), nm = rows.reduce((m, x) => (x.cmp(m) > 0 ? x : m));
    return {
      intro: F(`A = ${mx(A.map((r) => r.map((v) => nmD(v))))},  b = ${cv(b.map((v) => nmD(v)))},  x₀ = ${cv(["1", "1", "1"])}`),
      parts: [
        nmMC("Welchen Vorkonditionierer B benutzt das Jacobi-Verfahren (A = L + D + R)?", ["B = D", "B = L + D", "B = A", "B = I"], 1, "Gesamtschrittverfahren: nur die Diagonale."),
        nmVal(`Berechnen Sie einen Jacobi-Schritt x₁ (${L3}).`, ql(jac), 2, `x₁,ₙ = (bₙ − Σ_{m≠n} aₙₘ x₀,ₘ)/aₙₙ = (${jac.map((v) => v.toString()).join(", ")}).`),
        nmVal(`Berechnen Sie einen Gauß-Seidel-Schritt x₁ (${L3}).`, ql(gs), 2, `Die neuen Komponenten werden sofort benutzt: (${gs.map((v) => v.toString()).join(", ")}).`),
        nmVal("Berechnen Sie ‖I − D⁻¹A‖∞.", nm.toString(), 1, `Zeilensummen Σ_{m≠n}|aₙₘ|/aₙₙ = ${rows.map((x) => x.html()).join(", ")}.`),
        nmMC("Warum konvergiert das Jacobi-Verfahren hier für jeden Startwert?", ["A ist strikt diagonaldominant, also ρ(I − D⁻¹A) ≤ ‖I − D⁻¹A‖∞ < 1", "A ist symmetrisch", "x₀ ist nah an der Lösung", "det A > 0"], 1, "Hinreichende Bedingung der Vorlesung."),
      ],
    };
  },
});

nmTask({
  id: "cg", topic: "iter", name: "Ein Schritt des cg-Verfahrens", like: "24-ss/5",
  make() {
    let A;
    do { const a = rint(2, 6), c = rint(2, 6), bb = rint(-2, 2); A = [[a, bb], [bb, c]]; } while (A[0][0] * A[1][1] - A[0][1] ** 2 <= 0);
    let b;
    do { b = [rint(-4, 5), rint(-4, 5)]; } while (!b[0] && !b[1]);
    const r0 = b.map((v) => nmQ(v)), Ad = A.map((r) => r.reduce((s, a, j) => s.add(r0[j].mul(a)), nmQ(0)));
    const rr = r0.reduce((s, v) => s.add(v.mul(v)), nmQ(0)), dAd = r0.reduce((s, v, i) => s.add(v.mul(Ad[i])), nmQ(0));
    const al = rr.div(dAd), x1 = r0.map((v) => v.mul(al)), r1 = r0.map((v, i) => v.sub(al.mul(Ad[i])));
    const be = r1.reduce((s, v) => s.add(v.mul(v)), nmQ(0)).div(rr);
    const e = [1, 1], dA = (A[0][0] + 2 * A[0][1] + A[1][1]);
    return {
      intro: F(`A = ${mx(A.map((r) => r.map((v) => nmD(v))))},  b = ${cv(b.map((v) => nmD(v)))},  x₀ = 0`),
      parts: [
        nmMC("Welches Funktional minimiert das cg-Verfahren?", ["Φ(x) = ½xᵀAx − xᵀb", "‖Ax − b‖₂²", "xᵀAx − b", "½‖x‖₂² − xᵀb"], 1, "∇Φ = Ax − b, A spd."),
        nmVal("Berechnen Sie α₀ = ⟨r₀, r₀⟩/⟨d₀, d₀⟩_A (d₀ = r₀ = b).", al.toString(), 2, `⟨r₀, r₀⟩ = ${rr.html()}, Ad₀ = (${Ad.map((v) => v.toString()).join(", ")}), ⟨d₀, d₀⟩_A = ${dAd.html()}.`),
        nmVal(`Berechnen Sie x₁ = x₀ + α₀d₀ (${L3}).`, ql(x1), 1, `x₁ = α₀ b = (${x1.map((v) => v.toString()).join(", ")}).`),
        nmVal(`Berechnen Sie r₁ = r₀ − α₀Ad₀ (${L3}).`, ql(r1), 1, `r₁ ⊥ r₀ — Probe: ⟨r₁, r₀⟩ = 0.`),
        nmVal("Berechnen Sie β₀ = ⟨r₁, r₁⟩/⟨r₀, r₀⟩.", be.toString(), 1, `${be.html()}; d₁ = r₁ + β₀d₀.`),
        nmVal("Berechnen Sie die Energienorm ‖e‖_A² = eᵀAe für e = (1, 1)ᵀ.", dA, 1, `a₁₁ + 2a₁₂ + a₂₂ = ${dA}.`),
        nmMC("Nach wie vielen Schritten liefert cg hier (exakt gerechnet) die Lösung?", ["nach höchstens 2", "nach 1", "nach unendlich vielen", "nach 4"], 1, "Nach höchstens N Schritten."),
      ],
    };
  },
});

/* ================================================================ Lückentexte */

// Fill-in texts like the exams' (one point per gap). Each gap: [text with ___, right, three wrong].
const NM_GAPS = {
  spline: { like: "2223-ws/5", name: "Lückentext Splines", gaps: [
    ["Ein kubischer interpolierender Spline ist auf ganz [a, b] ___.", "zweimal stetig differenzierbar", "nur stetig", "einmal stetig differenzierbar", "dreimal stetig differenzierbar"],
    ["Auf den Teilintervallen gilt sₙ = s|[xₙ₋₁, xₙ] ∈ ___.", "P₃", "P₂", "C²", "P₄"],
    ["Für die Funktionswerte gilt ___.", "s(xₙ) = yₙ für n = 0, …, N", "s′(xₙ) = yₙ", "s(xₙ) = 0", "s″(xₙ) = yₙ"],
    ["Von der Variation h fordert man h ∈ C² und ___.", "h(xₙ) = 0 für alle n", "h′(xₙ) = 0 für alle n", "h(a) = h(b) = 1", "h″ ≡ 0"],
    ["Aus s″(b)h′(b) − s″(a)h′(a) = 0 motiviert man drei Typen: ___.", "eingespannt, natürlich, periodisch", "linear, quadratisch, kubisch", "Lagrange, Newton, Hermite", "Gauß, Simpson, Trapez"],
    ["In sₙ(x) = yₙ₋₁ + (x − xₙ₋₁)yₙ₋₁,ₙ + … ist der erste Teil der ___ Anteil.", "interpolierende", "glättende", "periodische", "Rest-"],
    ["Die Glattheitsbedingungen für n = 1, …, N − 1 lauten ___.", "s′ₙ(xₙ) = s′ₙ₊₁(xₙ) und s″ₙ(xₙ) = s″ₙ₊₁(xₙ)", "sₙ(xₙ) = 0", "s′ₙ(xₙ) = 0", "s‴ₙ(xₙ) = s‴ₙ₊₁(xₙ)"],
    ["Die Matrix des LGS bei eingespannten Randbedingungen ist ___.", "symmetrisch, tridiagonal und strikt diagonaldominant", "voll besetzt und orthogonal", "obere Dreiecksmatrix", "singulär"],
    ["Für eingespannte Splines gilt max|f − s| ≤ ___.", "(5/384) h⁴ max|f⁽⁴⁾|", "(1/12) h² max|f″|", "2⁻ᴺ/(N + 1)! max|f⁽ᴺ⁺¹⁾|", "h max|f′|"],
  ] },
  eig: { like: "19-ss/4", name: "Lückentext Eigenwerte", gaps: [
    ["Die Eigenwerte lassen sich über die Nullstellen des ___ bestimmen.", "charakteristischen Polynoms", "Newton-Polynoms", "Legendre-Polynoms", "Knotenpolynoms"],
    ["Diese Nullstellenbestimmung ist im Allgemeinen ___.", "schlecht konditioniert", "gut konditioniert", "exakt", "stabil und billig"],
    ["Die Vektoriteration liefert für symmetrisches A einen EV zum ___ Eigenwert.", "betragsgrößten", "betragskleinsten", "zweitgrößten", "kleinsten positiven"],
    ["Für einen beliebigen anderen EW λₙ verwendet man die ___.", "inverse Vektoriteration mit Shift", "Vektoriteration ohne Shift", "Gauß-Seidel-Iteration", "Cholesky-Zerlegung"],
    ["Dafür braucht man eine ___ von λₙ.", "Näherung (Schätzung)", "LR-Zerlegung", "Hessenbergform", "Ableitung"],
    ["Im QR-Algorithmus ist Aₖ₊₁ = ___.", "RₖQₖ", "QₖRₖ", "Rₖ⁻¹Qₖ", "QₖᵀRₖQₖ"],
    ["Weil das teuer ist, transformiert man A zuerst auf ___.", "Hessenbergform", "Diagonalform", "Jordanform", "Bidiagonalform"],
    ["Dafür sind ___ Householder-Transformationen nötig.", "N − 2", "N", "N − 1", "2N"],
    ["Ein Schritt kostet dann im Allgemeinen ___ Operationen.", "O(N²)", "O(N³)", "O(N)", "O(log N)"],
    ["Bei symmetrischem A kostet ein Schritt ___ Operationen.", "O(N)", "O(N²)", "O(N³)", "O(1)"],
    ["Um die Konvergenz zu verbessern, verwendet man ___.", "Shifts", "Pivotisierung", "Dämpfung", "Vorkonditionierung"],
  ] },
  iter: { like: "1920-ws/5", name: "Lückentext iterative Verfahren", gaps: [
    ["Iterative Verfahren lohnen sich, wenn N ___ ist.", "groß", "klein", "gerade", "eine Zweierpotenz"],
    ["… und A ___ ist.", "dünn besetzt", "voll besetzt", "orthogonal", "eine Dreiecksmatrix"],
    ["Direkte Verfahren haben das Problem des ___.", "Fill-ins", "Overflows", "Runge-Phänomens", "Rangdefekts"],
    ["Die Fixpunktgleichung allgemeiner linearer Iterationen lautet ___.", "x = (I − B⁻¹A)x + B⁻¹b", "x = Ax − b", "x = B⁻¹Ax", "x = (A − B)x + b"],
    ["Konvergenz für jeden Startwert liegt vor, falls ___.", "ρ(I − B⁻¹A) < 1", "‖A‖ < 1", "det B ≠ 0", "A symmetrisch ist"],
    ["Beim Jacobi-Verfahren wählt man B = ___.", "D", "L + D", "A", "I"],
    ["Beim Gauß-Seidel-Verfahren wählt man B = ___.", "L + D", "D", "D + R", "LLᵀ"],
    ["Auch eine ___ von A kann als Vorkonditionierer dienen.", "unvollständige LR-Zerlegung", "Singulärwertzerlegung", "Inverse", "Transponierte"],
    ["Die Hauptidee: ___ lässt sich leichter lösen als Ax = b.", "Bc = r", "Ac = r", "Bᵀc = b", "Ax = 0"],
    ["Das cg-Verfahren setzt voraus, dass A ___ ist.", "symmetrisch positiv definit", "regulär", "diagonaldominant", "orthogonal"],
    ["Der Hauptaufwand eines cg-Schritts ist ___.", "die Berechnung von Adₖ", "eine LR-Zerlegung", "die Berechnung von A⁻¹", "das Sortieren"],
    ["Theoretisch liefert cg nach ___ Schritten die exakte Lösung.", "N", "1", "N²", "log N"],
  ] },
  newton: { like: "17-ss/5", name: "Lückentext Newton", gaps: [
    ["Das Newton-Verfahren löst Probleme der Form ___.", "f(x) = 0", "Ax = b mit A spd", "min ‖x‖", "x = Ax"],
    ["Die Iterationsvorschrift lautet ___.", "xₖ₊₁ = xₖ − f′(xₖ)⁻¹f(xₖ)", "xₖ₊₁ = f(xₖ)", "xₖ₊₁ = xₖ − f(xₖ)", "xₖ₊₁ = f′(xₖ)xₖ"],
    ["In jedem Schritt muss ein ___ gelöst werden.", "lineares Gleichungssystem", "Eigenwertproblem", "Ausgleichsproblem", "Integral"],
    ["Die Wahl des ___ beeinflusst stark das Konvergenzverhalten.", "Startwerts", "Stoppkriteriums", "Rechners", "Pivots"],
    ["Bei günstiger Wahl erwartet man ___ Konvergenz.", "(lokal) quadratische", "lineare", "keine", "sublineare"],
    ["Beim vereinfachten Verfahren ersetzt man f′(xₖ) durch ___.", "f′(x₀)", "die Einheitsmatrix", "f(x₀)", "f″(xₖ)"],
    ["Die Anzahl nötiger LR-Zerlegungen beim vereinfachten Verfahren ist ___.", "eins", "eine pro Schritt", "N", "null"],
    ["Für Fixpunktprobleme der Form ___ liefert der Banachsche Fixpunktsatz ein Verfahren.", "x = g(x)", "f(x) = 0", "Ax = λx", "min f(x)"],
    ["Eine Kontraktion erfüllt ___.", "‖g(x) − g(y)‖ ≤ L‖x − y‖ mit L < 1", "‖g(x)‖ ≤ 1", "g′(x) > 0", "g(x) = x für alle x"],
  ] },
  gp: { like: "20-ss/5", name: "Lückentext Kondition und Stabilität", gaps: [
    ["Ein Algorithmus heißt ___, wenn unvermeidbare Fehler in den Eingabedaten unverhältnismäßig verstärkt werden.", "instabil", "schlecht konditioniert", "divergent", "inkonsistent"],
    ["Die Addition zweier Gleitpunktzahlen in Gleitpunktarithmetik ist immer ___.", "stabil", "exakt", "schlecht konditioniert", "instabil"],
    ["Berechnet man x + y mit ___, tritt Auslöschung auf.", "x ≈ −y", "x ≈ y", "x ≫ y", "x, y > 0"],
    ["Problematisch, weil sich ___ auslöschen …", "die führenden (richtigen) Stellen", "die Rundungsfehler", "die Exponenten", "die Vorzeichen"],
    ["… und ___ das Ergebnis dominieren.", "die Rundungsfehler", "die führenden Stellen", "die Exponenten", "die Nullen"],
    ["Die Kondition einer regulären Matrix ist ___.", "‖A‖‖A⁻¹‖", "‖A‖/‖A⁻¹‖", "|det A|", "max |aᵢⱼ|"],
    ["Bezüglich der 2-Norm haben ___ immer die Kondition 1.", "orthogonale Matrizen", "Dreiecksmatrizen", "symmetrische Matrizen", "Permutations- und Diagonalmatrizen"],
    ["Die Lebesgue-Konstante ist Λ_N = ___.", "max_x Σₙ|Lₙ(x)|", "max_x |w_{N+1}(x)|", "Σₙ|fₙ|", "max|f − p|"],
    ["Eine gute Wahl der Stützstellen sind ___ Stützstellen.", "Tschebyscheff-", "äquidistante", "zufällige", "ganzzahlige"],
    ["Für IEEE double ist eps ≈ ___.", "2,2 · 10⁻¹⁶", "10⁻³⁰⁸", "10⁻⁸", "1,8 · 10³⁰⁸"],
  ] },
};
Object.entries(NM_GAPS).forEach(([topic, G]) => nmTask({
  id: "gap-" + topic, topic, name: G.name, like: G.like, gap: true,
  make() {
    const gaps = shuffle([...G.gaps]).slice(0, 6);
    return {
      intro: `<p class="small">Vervollständigen Sie den Text — ein Punkt pro Lücke.</p>`,
      parts: gaps.map(([t, right, ...wrong]) => nmMC(t.replace("___", "<span class='nm-gap'>…</span>"), [right, ...wrong], 1)),
    };
  },
}));
