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
// Numbers that the exam would give as fractions are computed exactly (NmQ, numa.js). Formulas are
// TeX in $…$ (typeset by KaTeX, see numa.js): qt() writes a number, tmx() a matrix, tcv() a vector.

const nmMC = (ask, mc, pts, why = "", fixed = false) => ({ kind: "mc", ask, mc, pts, why, fixed });
const nmVal = (ask, ans, pts, why = "") => ({ kind: "val", ask, ans: [].concat(ans).map(String), pts, why });
const nmW = (ask, model, rubric, why = "") => ({ kind: "write", ask, model, rubric, why, pts: rubric.reduce((s, [p]) => s + p, 0) });
// An exact or rounded number as an answer string, and a list of them.
const qs = (x) => (x instanceof NmQ ? x.toString() : String(+(+x).toFixed(6)));
const ql = (xs) => xs.map(qs).join("; ");
// A rounded number for $…$, with a decimal comma.
const td = (x, d = 4) => nmD(x, d).replace("−", "-").replace(",", "{,}");
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
      intro: `<p>Wir betrachten $\\FL$ für die Basis $B = ${B}$, $e_{\\min} = ${emin}$, $L_m = ${Lm}$ und $L_e = ${Le}$.</p>`,
      parts: [
        nmW(`Formulieren Sie die Definition der Menge $\\FL^+$ der normalisierten positiven Gleitpunktzahlen.`,
          tx(`\\FL^+ = \\Big\\{B^e\\sum_{l=1}^{L_m}a_lB^{-l} : e = e_{\\min} + \\sum_{l=0}^{L_e-1}c_lB^l,\\ a_l, c_l \\in \\{0, \\dots, B-1\\},\\ a_1 \\neq 0\\Big\\}`),
          [[1, "Mantisse als Summe der $a_lB^{-l}$, Exponent $e_{\\min} + \\sum c_lB^l$"], [1, "Ziffern in $\\{0, \\dots, B-1\\}$ und die Normalisierung $a_1 \\neq 0$"]]),
        nmVal(`Bestimmen Sie $e_{\\max}$.`, emax, 1, `$e_{\\max} = e_{\\min} + B^{L_e} - 1 = ${emin} + ${B ** Le} - 1 = ${emax}$.`),
        nmVal(`$\\min\\FL^+ = ${B}^k$. Geben Sie $k$ an.`, emin - 1, 1, `$\\min\\FL^+ = B^{e_{\\min}-1}$: die Mantisse $(0.10\\cdots0)_B = B^{-1}$ mit dem kleinsten Exponenten.`),
        nmVal(`Geben Sie die Maschinengenauigkeit $\\eps$ an (als Bruch).`, [`1/${2 * B ** (Lm - 1)}`], 1, `$\\eps = \\tfrac12B^{1-L_m} = \\frac{1}{2\\cdot ${B}^{${Lm - 1}}} = \\frac{1}{${2 * B ** (Lm - 1)}}$.`),
        nmVal(`Bestimmen Sie $\\fl(x)$ für $x = ${td(x, 1)}$.`, f.v, 2,
          `$${td(x, 1)} = (${f.digits}{,}${f.next}\\ldots)_{${B}}$: $e = ${f.e}$, die ${Lm + 1}. Ziffer ist $${f.next} ${f.next >= B / 2 ? "\\ge" : "\\lt"} B/2 = ${td(B / 2)}$, also wird ${f.next >= B / 2 ? "auf" : "ab"}gerundet: $\\fl(x) = ${td(f.v)}$.`),
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
      intro: `<p>Sei $B = ${B}$, $L_m = ${Lm}$, $e_{\\min} = ${emin}$ und $L_e = ${Le}$.</p>`,
      parts: [
        nmVal("Wie viele normalisierte positive Gleitpunktzahlen gibt es zu einem festen Exponenten?", per, 1, `$a_1 \\in \\{1, \\dots, B-1\\}$, die übrigen $L_m - 1$ Ziffern frei: $(B-1)B^{L_m-1} = ${per}$.`),
        nmVal("Wie viele positive Gleitpunktzahlen enthält $\\FL^+$ insgesamt?", per * B ** Le, 1, `$B^{L_e} = ${B ** Le}$ Exponenten mal $${per}$.`),
        nmVal("Bestimmen Sie das Verhältnis der Anzahl normalisierter Gleitpunktzahlen in $(0, 1)$ zu denen in $[1, B)$.", 1 - emin, 2,
          `In $(0, 1)$ liegen die Exponenten $e = ${emin}, \\dots, 0$ — das sind $${1 - emin}$; in $[1, B)$ nur $e = 1$. Jeder Exponent hat gleich viele Zahlen, also $${1 - emin} : 1$.`),
      ],
    };
  },
});

const NM_CANCEL = [
  ["$\\sqrt{x+1} - \\sqrt x$ für großes $x$", "$\\dfrac{1}{\\sqrt{x+1} + \\sqrt x}$", ["$\\sqrt{x+1}\\,(1 - \\sqrt x)$", "$\\dfrac{x+1-x}{\\sqrt x}$", "$\\sqrt{2x+1} - 2\\sqrt x$"]],
  ["$1 - \\cos x$ für kleines $x$", "$2\\sin^2(x/2)$", ["$\\sin^2 x$", "$\\cos x - 1$", "$1 - \\sin x$"]],
  ["$(1+x)^2 - 1$ für kleines $x$", "$x(2+x)$", ["$(1+x)(1-x)$", "$x^2 + 1$", "$2x - x^2$"]],
  ["$2 - \\sqrt{4 - g^2}$ für kleines $g$", "$\\dfrac{g^2}{2 + \\sqrt{4 - g^2}}$", ["$\\sqrt{2 - g^2}$", "$\\frac{(2-g)^2}{4}$", "$\\dfrac{g}{2 - \\sqrt{4 - g^2}}$"]],
];
nmTask({
  id: "cancel", topic: "gp", name: "Kondition der Addition, Auslöschung", like: "1920-ws/6",
  make() {
    const x = 0.98 + rint(1000000, 9999999) / 1e9, dig = rint(6, 9), y = -(x - rint(10, 99) / 10 ** (dig + 1));
    const kappa = (Math.abs(x) + Math.abs(y)) / Math.abs(x + y), lost = Math.round(Math.log10(kappa));
    const [what, good, bad] = nmPick(NM_CANCEL);
    const ys = String(+y.toFixed(12));
    return {
      intro: `<p>Seien $\\tilde x = x(1+\\varepsilon_x)$, $\\tilde y = y(1+\\varepsilon_y)$ relativ gestörte Daten mit $|\\varepsilon_x|, |\\varepsilon_y| \\le \\varepsilon$ und $x + y \\neq 0$.</p>`,
      parts: [
        nmW("Schätzen Sie die relative Abweichung $\\frac{|(\\tilde x + \\tilde y) - (x+y)|}{|x+y|}$ ab und interpretieren Sie die Abschätzung im Hinblick auf die Kondition.",
          `${tx(`\\frac{|\\tilde x + \\tilde y - (x+y)|}{|x+y|} = \\frac{|x\\varepsilon_x + y\\varepsilon_y|}{|x+y|} \\le \\varepsilon\\,\\frac{|x| + |y|}{|x+y|}`)}
           Gut konditioniert bei gleichem Vorzeichen (Faktor 1), schlecht bei $x \\approx -y$: Auslöschung.`,
          [[1, "$\\tilde x + \\tilde y - (x+y) = x\\varepsilon_x + y\\varepsilon_y$ und Dreiecksungleichung"], [1, "Faktor $\\frac{|x| + |y|}{|x+y|}$"], [1, "Interpretation: gleiches Vorzeichen gut, $x \\approx -y$ schlecht"]]),
        nmVal(`Berechnen Sie den Verstärkungsfaktor $\\frac{|x| + |y|}{|x+y|}$ für $x = ${String(x).replace(".", "{,}")}$, $y = ${ys.replace(".", "{,}")}$ (auf zwei gültige Stellen, z. B. 5,2e7).`, kappa, 2,
          `$x + y = ${nmSci(x + y, 2).replace(/<sup>(.*?)<\/sup>/, "^{$1}").replace(/−/g, "-").replace(" · ", "\\cdot ").replace(",", "{,}")}$, $|x| + |y| \\approx ${td(Math.abs(x) + Math.abs(y))}$, also ≈ ${nmSci(kappa, 2)}.`),
        nmVal("Etwa wie viele Dezimalstellen gehen dabei verloren (ganze Zahl)?", [lost, lost - 1, lost + 1], 1, `$\\log_{10}$ des Faktors $\\approx ${td(Math.log10(kappa), 1)}$.`),
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
      intro: tx(`A = ${tmx(A)}, \\qquad b = ${tcv(b)}`),
      parts: [
        nmVal(`Berechnen Sie $PA = LR$ mit Spaltenpivotwahl. Geben Sie die Permutation an: $\\pi_k$ = Nummer der Zeile von $A$, die in $PA$ an Stelle $k$ steht (${L3}).`, ql(r.perm), 1, `Die Zeilennummern links im Schema nach allen Tauschen: $(${r.perm.join(", ")})$.`),
        nmVal(`Geben Sie $\\ell_{21}$; $\\ell_{31}$; $\\ell_{32}$ an.`, ql([r.L[1][0], r.L[2][0], r.L[2][1]]), 2, `$L = ${tmx(r.L)}$`),
        nmVal(`Geben Sie $r_{11}$; $r_{12}$; $r_{13}$; $r_{22}$; $r_{23}$; $r_{33}$ an.`, ql([r.R[0][0], r.R[0][1], r.R[0][2], r.R[1][1], r.R[1][2], r.R[2][2]]), 2, `$R = ${tmx(r.R)}$`),
        nmVal(`Lösen Sie $Ly = Pb$ durch Vorwärtssubstitution: $y$ = ? (${L3})`, ql(y), 1, `$Pb = ${tcv(Pb)}$, $y = ${tcv(y)}$.`),
        nmVal(`Lösen Sie $Rx = y$: $x$ = ? (${L3})`, ql(x), 1, `Rückwärts eingesetzt: $x = (${x.join(", ")})^\\top$. Probe: $Ax = b$.`),
        nmW("Erklären Sie, wie man mit $PA = LR$ das LGS $Ax = b$ löst, begründen Sie es kurz und geben Sie den Aufwand an.",
          `Löse $Ly = Pb$ durch Vorwärts- und $Rx = y$ durch Rückwärtssubstitution. Dann $Ax = P^\\top PAx = P^\\top LRx = P^\\top Ly = P^\\top Pb = b$ ($P$ orthogonal). Aufwand je $\\tfrac12N^2$ Operationen, die Zerlegung $\\tfrac13N^3$.`,
          [[1, "erst $Ly = Pb$ vorwärts, dann $Rx = y$ rückwärts"], [1, "Begründung über $P^\\top P = I$"], [1, "Aufwand $\\tfrac12N^2$ je Substitution (bzw. $\\tfrac13N^3$ für die Zerlegung)"]]),
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
      intro: tx(`L = ${tmx(L)}, \\qquad b = ${tcv(b)}`),
      parts: [
        nmVal(`Lösen Sie $Ly = b$ durch Vorwärtssubstitution (${L3}).`, ql(y), 2, `$y_1 = b_1/\\ell_{11} = ${y[0]}$, $y_2 = (b_2 - \\ell_{21}y_1)/\\ell_{22} = ${y[1]}$, $y_3 = (b_3 - \\ell_{31}y_1 - \\ell_{32}y_2)/\\ell_{33} = ${y[2]}$.`),
        nmMC("Wie viele Operationen braucht die Vorwärtssubstitution für ein $N\\times N$-System (führender Term)?", ["$\\tfrac12N^2$", "$N^2$", "$\\tfrac13N^3$", "$N$"], 1, "Zeile $n$ braucht $n - 1$ Operationen: $\\sum(n-1) \\approx \\tfrac12N^2$."),
        nmW("Leiten Sie eine Spaltenversion der Vorwärtssubstitution her (zwei Zeilen in der Schleife über $n$).",
          `${pycode(`
            def forward_sub(L, b):
                N = len(b)
                y = np.zeros(N)
                for n in range(N):
                    y[n] = b[n] / L[n,n]
                    b[n+1:] = b[n+1:] - y[n] * L[n+1:,n]
                return y`)}
            Aus $\\begin{pmatrix}\\ell_{11}&0\\\\ \\ell_{21}&L_{22}\\end{pmatrix}\\binom{y_1}{y_2} = \\binom{b_1}{b_2}$: $y_1 = b_1/\\ell_{11}$, dann $L_{22}y_2 = b_2 - y_1\\ell_{21}$ — rekursiv.`,
          [[1, "<code>y[n] = b[n]/L[n,n]</code>"], [1, "die restliche rechte Seite um <code>y[n]</code> mal Spalte $n$ von $L$ verringern"]]),
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
      intro: tx(`A = ${tmx(A)}`),
      parts: [
        nmMC("Unter welcher Voraussetzung existiert eine Cholesky-Zerlegung $A = LL^\\top$ mit regulärem $L$?", ["$A$ ist symmetrisch und positiv definit", "$A$ ist regulär", "$A$ ist symmetrisch", "alle $a_{nn} > 0$"], 1, "$A = LL^\\top$ regulär $\\Leftrightarrow$ $A$ spd."),
        nmVal(`Bestimmen Sie $\\ell_{11}$; $\\ell_{21}$; $\\ell_{22}$ (${L3}).`, ql([L[0][0], L[1][0], L[1][1]]), 2, `$\\ell_{11} = \\sqrt{a_{11}} = ${L[0][0]}$, $\\ell_{21} = a_{21}/\\ell_{11} = ${L[1][0]}$, $\\ell_{22} = \\sqrt{a_{22} - \\ell_{21}^2} = ${L[1][1]}$.`),
        nmVal(`Bestimmen Sie $\\ell_{31}$; $\\ell_{32}$; $\\ell_{33}$ (${L3}).`, ql([L[2][0], L[2][1], L[2][2]]), 2, `$\\ell_{31} = a_{31}/\\ell_{11} = ${L[2][0]}$, $\\ell_{32} = (a_{32} - \\ell_{31}\\ell_{21})/\\ell_{22} = ${L[2][1]}$, $\\ell_{33} = \\sqrt{a_{33} - \\ell_{31}^2 - \\ell_{32}^2} = ${L[2][2]}$.`),
        nmVal("Berechnen Sie $\\det(A)$ mit Hilfe der Zerlegung.", det, 1, `$\\det A = \\det L\\cdot\\det L^\\top = (\\ell_{11}\\ell_{22}\\ell_{33})^2 = ${det}$.`),
        nmMC("Was kostet die Cholesky-Zerlegung einer $N\\times N$-Matrix?", ["$\\tfrac16N^3$", "$\\tfrac13N^3$", "$\\tfrac23N^3$", "$\\tfrac12N^2$"], 1, "Halb so viel wie die LR-Zerlegung."),
      ],
    };
  },
});

nmTask({
  id: "block", topic: "lr", name: "Blocksystem mit bekannten Zerlegungen", like: "22-ss/1",
  make() {
    const up = Math.random() < 0.5;
    return {
      intro: `<p>Gegeben ist $Mx = b$ mit $M = ${up ? "\\begin{pmatrix}A&B\\\\0&C\\end{pmatrix}" : "\\begin{pmatrix}A&0\\\\B&C\\end{pmatrix}"}$,
        $A \\in \\R^{N\\times N}$, $C \\in \\R^{K\\times K}$, $B ${up ? "\\in \\R^{N\\times K}" : "\\in \\R^{K\\times N}"}$ voll besetzt, $x = \\binom{x_1}{x_2}$, $b = \\binom{b_1}{b_2}$. Bekannt sind $PA = LR_A$ und $C = QR_C$.</p>`,
      parts: [
        nmMC("Wie viele Operationen hat die QR-Zerlegung von $C$ gekostet (Householder)?", ["$\\tfrac23K^3$", "$\\tfrac13K^3$", "$\\tfrac16K^3$", "$K^2$"], 1, "$MN^2 - \\tfrac13N^3$ mit $M = N = K$."),
        nmMC(`Welcher Teil wird zuerst gelöst?`, [up ? "$x_2$ aus $Cx_2 = b_2$" : "$x_1$ aus $Ax_1 = b_1$", up ? "$x_1$ aus $Ax_1 = b_1$" : "$x_2$ aus $Cx_2 = b_2$", "beide gleichzeitig mit einer LR-Zerlegung von $M$", "$x$ aus $M^\\top Mx = M^\\top b$"], 1,
          up ? "Die zweite Blockzeile enthält nur $x_2$." : "Die erste Blockzeile enthält nur $x_1$."),
        nmMC("Was kostet das Lösen insgesamt (ohne die Zerlegungen)?", ["$N^2 + NK + \\tfrac32K^2$", "$N^2 + K^2$", "$\\tfrac13N^3 + \\tfrac23K^3$", "$(N+K)^2$"], 2,
          `${up ? "$Q^\\top b_2$ ($K^2$), $R_Cx_2 = c$ rückwärts ($\\tfrac12K^2$), $b_1 - Bx_2$ ($NK$), $Ly = P(\\dots)$ und $R_Ax_1 = y$ (je $\\tfrac12N^2$)" : "$Ly = Pb_1$, $R_Ax_1 = y$ (je $\\tfrac12N^2$), $b_2 - Bx_1$ ($NK$), $Q^\\top(\\dots)$ ($K^2$), $R_Cx_2 = c$ ($\\tfrac12K^2$)"}.`),
        nmW("Erklären Sie das Vorgehen Schritt für Schritt.",
          up ? `1. $Cx_2 = b_2$: $c = Q^\\top b_2$, dann $R_Cx_2 = c$ rückwärts. 2. $Ax_1 = b_1 - Bx_2$: $Ly = P(b_1 - Bx_2)$ vorwärts, $R_Ax_1 = y$ rückwärts.`
            : `1. $Ax_1 = b_1$: $Ly = Pb_1$ vorwärts, $R_Ax_1 = y$ rückwärts. 2. $Cx_2 = b_2 - Bx_1$: $c = Q^\\top(b_2 - Bx_1)$, $R_Cx_2 = c$ rückwärts.`,
          [[1, "richtige Reihenfolge der Blöcke"], [1, "Teilsystem mit QR: $Q^\\top$ anwenden, dann rückwärts"], [1, "Teilsystem mit LR: Permutation, vorwärts, rückwärts"]]),
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
      intro: tx(`a = ${tcv(a)}`),
      parts: [
        nmVal("Geben Sie $\\sigma$ an, so dass $Qa = \\sigma e_1$ auslöschungsfrei berechnet wird.", sigma, 1, `$\\|a\\|_2 = ${na}$; $a_1 ${a[0] > 0 ? "> 0 \\Rightarrow \\sigma = -" : "\\le 0 \\Rightarrow \\sigma = +"}\\|a\\|_2 = ${sigma}$.`),
        nmVal(`Geben Sie den unnormierten Householder-Vektor $u = a - \\sigma e_1$ an (${L3}).`, ql(u), 1, `Nur die erste Komponente ändert sich: $${a[0]} - (${sigma}) = ${u[0]}$.`),
        nmVal("Berechnen Sie $\\|u\\|_2^2$.", nu2, 1, `$\\|u\\|_2^2 = ${u.map((v) => `${v < 0 ? `(${v})` : v}^2`).join(" + ")} = ${nu2} = 2\\|a\\|_2(\\|a\\|_2 + |a_1|)$. Dann $w = u/\\sqrt{${nu2}}$.`),
        nmVal(`Welcher Vektor ist $Qa$ (${L3})?`, ql([sigma, ...a.slice(1).map(() => 0)]), 1, "$Q$ spiegelt $a$ genau auf $\\sigma e_1$."),
        nmW("Erklären Sie, warum diese Wahl von $\\sigma$ Auslöschung vermeidet, und was Auslöschung ist.",
          `In $u_1 = a_1 - \\sigma$ haben $a_1$ und $-\\sigma$ dasselbe Vorzeichen: es wird nichts Fast-Gleiches abgezogen. Auslöschung: bei der Differenz fast gleich großer Zahlen fallen die richtigen führenden Stellen weg, Rundungsfehler bestimmen das Ergebnis ($x - y$ ist für $x \\approx y$ schlecht konditioniert).`,
          [[1, "$a_1$ und $-\\sigma$ gleiches Vorzeichen, Summe ohne Auslöschung"], [1, "Auslöschung erklärt"]]),
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
      intro: tx(`A = ${tmx([[a11, p, q], [p, a22, a23], [q, a23, a33]])}`) + `<p class="small">Transformieren Sie $A$ auf Hessenbergform $H = QAQ$, ohne die Eigenwerte zu ändern; $Q = \\diag(1, \\tilde Q)$ mit einer auslöschungsfreien $2\\times2$-Householder-Spiegelung $\\tilde Q$.</p>`,
      parts: [
        nmMC("Warum ändern sich die Eigenwerte nicht?", ["$Q$ ist symmetrisch und orthogonal, also $QAQ = Q^\\top AQ = Q^{-1}AQ$ ähnlich zu $A$", "$Q$ ist eine Dreiecksmatrix", "$\\det Q = 1$", "Weil $A$ symmetrisch ist"], 1, "Ähnlichkeitstransformation."),
        nmVal("Auf welches Vielfache $\\sigma e_1$ spiegelt $\\tilde Q$ den Vektor $(a_{21}, a_{31})$? $\\sigma$ = ?", sigma, 1, `$\\|(${p}, ${q})\\| = ${r}$, $a_{21} ${p > 0 ? "> 0" : "\\le 0"} \\Rightarrow \\sigma = ${sigma}$.`),
        nmVal(`Geben Sie $\\tilde Q$ zeilenweise an: $\\tilde q_{11}$; $\\tilde q_{12}$; $\\tilde q_{21}$; $\\tilde q_{22}$ (${L3}).`, ql(Qt.flat()), 2, `$\\tilde Q$ ist symmetrisch, orthogonal und $\\tilde Qe_1 = (a_{21}, a_{31})^\\top/\\sigma$, also $\\tilde Q = ${tmx(Qt)}$.`),
        nmVal(`Geben Sie $h_{22}$; $h_{23}$; $h_{33}$ an (${L3}).`, ql([H22[0][0], H22[0][1], H22[1][1]]), 3, `$H = ${tmx([[nmQ(a11), nmQ(sigma), nmQ(0)], [nmQ(sigma), H22[0][0], H22[0][1]], [nmQ(0), H22[1][0], H22[1][1]]])}$ — symmetrisch tridiagonal.`),
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
      intro: tx(`A = ${tmx(A)}, \\qquad B = ${tmx(B)}`),
      parts: [
        nmVal("Berechnen Sie $\\|A\\|_1$.", nmNorm1(A), 1, `Maximale Spaltenbetragssumme: $${nmT(A).map((c) => c.reduce((s, x) => s + Math.abs(x), 0)).join(",\\ ")}$.`),
        nmVal("Berechnen Sie $\\|A\\|_\\infty$.", nmNormInf(A), 1, `Maximale Zeilenbetragssumme: $${A.map((r) => r.reduce((s, x) => s + Math.abs(x), 0)).join(",\\ ")}$.`),
        nmVal("Berechnen Sie $\\cond_\\infty(B)$ (als Bruch oder Dezimalzahl).", nInfI.mul(nInf).toString(), 2, `$B^{-1} = ${tmx(Bi)}$, $\\|B\\|_\\infty = ${nInf}$, $\\|B^{-1}\\|_\\infty = ${nInfI.tex()}$, also $\\cond_\\infty(B) = ${nInfI.mul(nInf).tex()}$.`),
        nmMC("Welche Aussage über die Konditionszahl ist falsch?", ["$\\cond(\\alpha A) = |\\alpha|\\cond(A)$", "$\\cond(A) \\ge 1$", "$\\cond_2(Q) = 1$ für orthogonales $Q$", "$\\cond_2(A) = |\\lambda|_{\\max}/|\\lambda|_{\\min}$ für symmetrisches $A$"], 1, "$\\cond(\\alpha A) = \\cond(A)$: der Faktor kürzt sich."),
        nmW("Zeigen Sie $\\cond(A) \\ge 1$ für jede zugehörige Matrixnorm.", `$1 = \\|I\\| = \\|AA^{-1}\\| \\le \\|A\\|\\,\\|A^{-1}\\| = \\cond(A)$, mit $\\|I\\| = \\sup\\|x\\|/\\|x\\| = 1$ und der Submultiplikativität.`,
          [[1, "$\\|I\\| = 1$"], [1, "Submultiplikativität auf $AA^{-1}$ angewendet"]]),
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
      intro: `<table class="len-terms nm-tab nm-data-tab"><tbody><tr><td>$t_m$</td>${ts.map((t) => `<td>${t}</td>`).join("")}</tr><tr><td>$y_m$</td>${ys.map((y) => `<td>${y}</td>`).join("")}</tr></tbody></table>
        <p>Gesucht ist die Gerade $g(t) = \\alpha + \\beta t$, für die $\\sum_m (g(t_m) - y_m)^2$ minimal wird.</p>`,
      parts: [
        nmW("Formulieren Sie das lineare Ausgleichsproblem ($A$ und $b$ angeben) und die allgemeine Form der Normalengleichung.",
          `$\\|Ax - b\\|_2 = \\min!$ mit $A = ${tmx(ts.map((t) => [1, t]))}$, $x = \\binom{\\alpha}{\\beta}$, $b = ${tcv(ys)}$. Normalengleichung $A^\\top Ax = A^\\top b$.`,
          [[1, "$A$ mit Spalten $1$ und $t_m$, $b$ aus den $y_m$"], [1, "$A^\\top Ax = A^\\top b$"]]),
        nmVal(`Berechnen Sie die Einträge von $A^\\top A$: $(A^\\top A)_{11}$; $(A^\\top A)_{12}$; $(A^\\top A)_{22}$ (${L3}).`, ql(S), 1, `$m$, $\\sum t_m$, $\\sum t_m^2$ $= ${S.join(",\\ ")}$.`),
        nmVal(`Berechnen Sie $A^\\top b$ (${L3}).`, ql(Atb), 1, `$\\sum y_m = ${Atb[0]}$, $\\sum t_my_m = ${Atb[1]}$.`),
        nmVal(`Lösen Sie die Normalengleichung: $\\alpha$; $\\beta$ (${L3}).`, ql(x), 2, `$\\alpha = ${x[0].tex()}$, $\\beta = ${x[1].tex()}$.`),
        nmMC("Warum löst man Ausgleichsprobleme in der Praxis meist mit QR statt mit der Normalengleichung?", ["$\\cond_2(A^\\top A) = \\cond_2(A)^2$", "Die Normalengleichung ist nicht immer lösbar", "QR ist billiger", "$A^\\top A$ ist nie symmetrisch"], 1, "Die Normalengleichung quadriert die Kondition."),
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
      intro: `<p>Für $A \\in \\R^{4\\times2}$ mit vollem Rang ist eine QR-Zerlegung $A = QR$ bekannt mit $\\bar R = ${tmx(R)}$ und $Q^\\top b = (${[...c, ...d].join(", ")})^\\top$.</p>`,
      parts: [
        nmVal(`Bestimmen Sie die Lösung $x$ des Ausgleichsproblems $\\|Ax - b\\|_2 = \\min!$ (${L3}).`, ql([x1, x2]), 2, `$\\bar Rx = c = (${c.join(", ")})^\\top$ rückwärts: $x_2 = ${x2.tex()}$, $x_1 = ${x1.tex()}$.`),
        nmVal("Wie groß ist das Residuum $\\|Ax - b\\|_2$?", res, 1, `$\\|d\\|_2 = \\|(${d.join(", ")})\\|_2 = ${td(res)}$.`),
        nmMC("Ist das überbestimmte System $Ax = b$ exakt lösbar?", res === 0 ? ["Ja, weil $d = 0$", "Nein, weil $d \\neq 0$", "Nein, überbestimmte Systeme sind nie lösbar", "Nur wenn $\\bar R$ symmetrisch ist"] : ["Nein, weil $d \\neq 0$", "Ja, weil $d = 0$", "Ja, weil $A$ vollen Rang hat", "Nur wenn $\\bar R$ symmetrisch ist"], 1, "$Ax = b$ ist genau dann lösbar, wenn das minimale Residuum $0$ ist."),
        nmW("Begründen Sie, warum $x = \\bar R^{-1}c$ das Ausgleichsproblem löst.", `$\\|Ax - b\\|_2^2 = \\|Q^\\top(Ax - b)\\|_2^2 = \\|Rx - Q^\\top b\\|_2^2 = \\|\\bar Rx - c\\|_2^2 + \\|d\\|_2^2 \\ge \\|d\\|_2^2$, mit Gleichheit genau für $\\bar Rx = c$.`,
          [[1, "$Q^\\top$ ändert die 2-Norm nicht"], [1, "Aufspaltung in $\\|\\bar Rx - c\\|^2 + \\|d\\|^2$ und Minimum bei $\\bar Rx = c$"]]),
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
      intro: `<p>Für $A \\in \\R^{3\\times2}$ gilt $A^\\top A = ${tmx(M)}$.</p>`,
      parts: [
        nmVal(`Bestimmen Sie die Singulärwerte $\\sigma_1 \\ge \\sigma_2$ von $A$ (${L3}).`, ql([s1, s2]), 2, `Eigenwerte von $A^\\top A$: $${(l1 + l2) / 2} \\pm ${(l1 - l2) / 2} = ${l1}, ${l2}$ (Eigenvektoren $(1, \\pm1)/\\sqrt2$); $\\sigma = \\sqrt\\lambda$.`),
        nmVal("Was ist $\\|A\\|_2$?", s1, 1, "$\\|A\\|_2 = \\sigma_1$."),
        nmVal("Was ist $\\cond_2(A) = \\sigma_1/\\sigma_2$?", `${s1}/${s2}`, 1, `$\\frac{${s1}}{${s2}}$.`),
        nmVal("Wie groß ist $\\|A - A_1\\|_2$ für die beste Rang-1-Näherung $A_1 = \\sigma_1u_1v_1^\\top$?", s2, 1, "Es bleibt der größte weggelassene Singulärwert $\\sigma_2$."),
        nmW("Zeigen Sie $\\|A\\|_2 = \\sigma_1$ mit $A = U\\Sigma V^\\top$.", `$\\|Ax\\|_2 = \\|U\\Sigma V^\\top x\\|_2 = \\|\\Sigma y\\|_2$ mit $y = V^\\top x$, $\\|y\\|_2 = \\|x\\|_2$ ($U$, $V$ orthogonal). $\\|\\Sigma y\\|_2^2 = \\sum\\sigma_i^2y_i^2 \\le \\sigma_1^2\\|y\\|_2^2$, Gleichheit für $y = e_1$ ($x = v_1$).`,
          [[1, "orthogonale Matrizen erhalten die 2-Norm"], [1, "$\\|\\Sigma y\\| \\le \\sigma_1\\|y\\|$ mit Gleichheit für $y = e_1$"]]),
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
      fname = `f(x) = x^2 - ${a}`;
      xs = [x0]; for (let k = 0; k < 2; k++) xs.push((xs[k] + a / xs[k]) / 2);
      intro = `<p>Approximieren Sie $\\sqrt{${a}}$ mit dem Newton-Verfahren der Vorlesung, Startwert $x_0 = ${x0}$.</p>`;
      f = "x_{k+1} = \\tfrac12\\big(x_k + \\frac{a}{x_k}\\big)";
    } else if (v === 1) {
      const a = rint(3, 30), x0 = Math.max(1, Math.round(Math.cbrt(a)));
      fname = `f(x) = x^3 - ${a}`;
      xs = [x0]; for (let k = 0; k < 2; k++) xs.push((2 * xs[k] + a / xs[k] ** 2) / 3);
      intro = `<p>Approximieren Sie $\\sqrt[3]{${a}}$ mit dem Newton-Verfahren, Startwert $x_0 = ${x0}$.</p>`;
      f = "x_{k+1} = \\tfrac13\\big(2x_k + \\frac{a}{x_k^2}\\big)";
    } else if (v === 2) {
      const y = rint(2, 12), x0 = nmPick([1, 2]);
      fname = `f(x) = e^x - ${y}`;
      xs = [x0]; for (let k = 0; k < 2; k++) xs.push(xs[k] - 1 + y * Math.exp(-xs[k]));
      intro = `<p>Berechnen Sie $\\ln ${y}$ als Umkehrfunktion von $\\exp$: Newton für die Nullstelle von $e^x - ${y}$, Startwert $x_0 = ${x0}$.</p>`;
      f = "x_{k+1} = x_k - 1 + y\\,e^{-x_k}";
    } else {
      const y = rint(5, 25) / 10;
      fname = `g(x) = \\ln x - ${td(y)}`;
      xs = [Math.E, Math.E * y];
      intro = `<p>Berechnen Sie näherungsweise $\\exp(${td(y)})$ durch Newton für die Umkehrfunktion: Nullstelle von $\\ln x - ${td(y)}$, Startwert $x_0 = e$.</p>`;
      f = "x_1 = x_0 - (\\ln x_0 - y)\\,x_0 = e\\cdot y";
    }
    const parts = [
      nmW("Formulieren Sie das Newton-Verfahren mit Stoppkriterium.", `S0) Startwert $x_0$, Toleranz $\\varepsilon$, $k = 0$. S1) Löse $f'(x_k)\\,d_k = -f(x_k)$, $x_{k+1} = x_k + d_k$. S2) Falls $\\|d_k\\| < \\varepsilon$: STOPP, sonst $k$ um 1 erhöhen und zu S1.`,
        [[1, "Iterationsvorschrift (bzw. LGS $f'(x_k)d_k = -f(x_k)$)"], [1, "Stoppkriterium über $\\|d_k\\|$ und Startwert/Toleranz"]]),
      nmVal(`Berechnen Sie $x_1$ (auf mindestens drei Nachkommastellen).`, xs[1], 2, `Mit $${fname}$: $${f}$, also $x_1 = ${td(xs[1], 6)}$.`),
    ];
    if (v < 3) parts.push(nmVal("Berechnen Sie $x_2$.", xs[2], 1, `$x_2 = ${td(xs[2], 6)}$.`));
    parts.push(nmMC("Wie konvergiert das Verfahren nahe einer einfachen Nullstelle?", ["lokal quadratisch", "linear mit Rate $\\frac12$", "global quadratisch", "kubisch"], 1, "$\\|x^* - x_{k+1}\\| \\le C\\|x^* - x_k\\|^2$ für Startwerte nah an $x^*$ ($f'(x^*) \\neq 0$)."));
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
      intro: `<p>Gesucht ist ein Schnittpunkt des Kreises $x^2 + y^2 = ${R}$ und der Hyperbel $x^2 - y^2 = ${H}$.</p>`,
      parts: [
        nmMC("Wie formuliert man das Problem für das Newton-Verfahren?", [`$f(x, y) = \\binom{x^2 + y^2 - ${R}}{x^2 - y^2 - ${H}} = 0$`, `$f(x, y) = x^2 + y^2 - x^2 + y^2 = ${R - H}$`, `$\\min\\,(x^2 + y^2)$`, `$f(x, y) = \\binom{x^2 + y^2}{x^2 - y^2}$`], 1, "Ein System $f\\colon\\R^2 \\to \\R^2$ mit Nullstelle im Schnittpunkt."),
        nmVal(`Berechnen Sie $f(x_0)$ für $x_0 = (${x0}, ${y0})^\\top$ (${L3}).`, ql(fx), 1, `$(${x0 * x0} + ${y0 * y0} - ${R},\\ ${x0 * x0} - ${y0 * y0} - ${H})$.`),
        nmVal(`Geben Sie die Jacobi-Matrix $f'(x_0)$ zeilenweise an (${L3}).`, ql(J.flat()), 1, `$f' = \\begin{pmatrix}2x&2y\\\\2x&-2y\\end{pmatrix} = ${tmx(J)}$.`),
        nmVal(`Berechnen Sie die erste Iterierte $x_1$ (${L3}).`, ql(x1), 2, `$f'(x_0)\\,d_0 = -f(x_0)$ ergibt $d_0 = ${tcv(d)}$, $x_1 = x_0 + d_0 = ${tcv(x1)}$.`),
        nmMC("Was ist der Vorteil des vereinfachten Newton-Verfahrens?", ["Die Jacobi-Matrix wird nur einmal berechnet und zerlegt", "Es konvergiert quadratisch", "Es braucht keinen Startwert", "Es findet alle Nullstellen"], 1, "Dafür nur noch lineare Konvergenz."),
      ],
    };
  },
});

/* ================================================================ Interpolation */

// Newton form p(x) = f00 + f01 (x − x0) + … as TeX.
function nmNewtonTex(xs, coef) {
  const fac = (k) => xs.slice(0, k).map((x) => (x === 0 ? "x" : `(x ${x < 0 ? "+" : "-"} ${Math.abs(x)})`)).join("");
  return coef.map((c, k) => (c.zero && k ? "" : `${k ? (c.n < 0 ? " - " : " + ") : c.n < 0 ? "-" : ""}${k && Math.abs(c.n) === c.d ? "" : nmQ(Math.abs(c.n), c.d).tex()}${fac(k)}`)).join("");
}
nmTask({
  id: "dd", topic: "interp", name: "Newton-Darstellung mit dividierten Differenzen", like: "24-ss/2",
  make() {
    const xs = pmDistinctSorted(5, -3, 5), fs = xs.map(() => rint(-6, 9));
    const base = xs.slice(0, 4), add = xs[4];
    const T = nmDDTable(base, fs.slice(0, 4)), coef = T.map((c) => c[0]);
    const T5 = nmDDTable([...base, add], fs), c4 = T5[4][0];
    const xe = [...Array(9).keys()].map((i) => i - 3).find((v) => !xs.includes(v));
    const p = (x) => coef.reduce((s, c, k) => s.add(c.mul(base.slice(0, k).reduce((pr, xm) => pr.mul(nmQ(x - xm)), nmQ(1)))), nmQ(0));
    const w = (k) => base.slice(0, k).map((x) => (x === 0 ? "x" : `(x ${x < 0 ? "+" : "-"} ${Math.abs(x)})`)).join("");
    return {
      intro: `<table class="len-terms nm-tab nm-data-tab"><tbody><tr><td>$n$</td>${[0, 1, 2, 3].map((n) => `<td>${n}</td>`).join("")}</tr><tr><td>$x_n$</td>${base.map((x) => `<td>${x}</td>`).join("")}</tr><tr><td>$f_n$</td>${fs.slice(0, 4).map((f) => `<td>${f}</td>`).join("")}</tr></tbody></table>`,
      parts: [
        nmVal(`Bestimmen Sie die Koeffizienten der Newton-Darstellung $f_{0,0}$; $f_{0,1}$; $f_{0,2}$; $f_{0,3}$ (${L3}).`, ql(coef), 3, `Die oberste Diagonale des Schemas: $p(x) = ${nmNewtonTex(base, coef)}$.`),
        nmMC("Wie lauten die Newton-Polynome?", [`$w_0 = 1,\\ w_1 = ${w(1)},\\ w_2 = ${w(2)},\\ w_3 = ${w(3)}$`, `$w_n = (x - x_n)$`, `$w_3 = ${w(4)}$`, "die Lagrange-Polynome $L_n$"], 1, "$w_n(x) = \\prod_{m\\lt n}(x - x_m)$."),
        nmVal(`Werten Sie $p$ an der Stelle $x = ${xe}$ aus.`, p(xe).toString(), 1, `Mit dem Horner-Schema: $p(${xe}) = ${p(xe).tex()}$.`),
        nmVal(`Der Punkt $(${add}, ${fs[4]})$ kommt hinzu. Wie lautet der neue Koeffizient $f_{0,4}$?`, c4.toString(), 2, `Nur eine neue Zeile im Schema; $p_{0,4} = p_{0,3} + f_{0,4}w_4$ mit $f_{0,4} = ${c4.tex()}$.`),
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
    const f = `\\${fn}(${k === 1 ? "" : k}x)`;
    const sci = (v) => { const e = Math.floor(Math.log10(v)); return `${td(v / 10 ** e, 2)}\\cdot10^{${e}}`; };
    return {
      intro: `<p>Wir wollen $f(x) = ${f}$ auf $[-1, 1]$ gleichmäßig bis auf einen Fehler von $10^{-${m}}$ durch ein Interpolationspolynom vom Grad $\\le N$ in Tschebyscheff-Stützstellen approximieren.</p>`,
      parts: [
        nmW("Leiten Sie eine Ungleichung für $N$ her.", `Restglied: $|f(x) - p(x)| = |w_{N+1}(x)|\\,\\frac{|f^{(N+1)}(\\xi)|}{(N+1)!}$. Für Tschebyscheff-Stützstellen ist $\\max|w_{N+1}| = 2^{-N}$, und $|f^{(N+1)}| \\le ${k === 1 ? "1" : `${k}^{N+1}`}$. Also genügt $\\frac{${k === 1 ? "1" : `${k}^{N+1}`}}{2^N(N+1)!} \\le 10^{-${m}}$.`,
          [[1, "Restglied mit $(N+1)!$"], [1, "$\\max|w_{N+1}| = 2^{-N}$"], [1, "Schranke für die Ableitung"]]),
        nmVal("Bestimmen Sie das minimale $N$.", N, 2, `Probieren: $N = ${N - 1}$ gibt $${sci(k ** N / (2 ** (N - 1) * fact(N)))} > 10^{-${m}}$, $N = ${N}$ gibt $${sci(k ** (N + 1) / (2 ** N * fact(N + 1)))} \\le 10^{-${m}}$.`),
        nmVal("Wie lautet der Knoten $x_0 = \\cos\\frac{\\pi}{2N+2}$ für $N = 2$ (vier Nachkommastellen)?", Math.cos(Math.PI / 6), 1, "$\\cos\\frac\\pi6 = \\frac{\\sqrt3}{2} \\approx 0{,}8660$."),
        nmMC("Warum sind Tschebyscheff-Stützstellen besser als äquidistante?", ["$\\max|w_{N+1}|$ ist minimal und die Lebesgue-Konstante bleibt klein", "Sie sind leichter zu berechnen", "Das Polynom hat dann kleineren Grad", "Sie liegen gleichmäßig verteilt"], 1, "Kleiner Restglied-Faktor und gute Kondition ($\\Lambda_N \\le 3$ für $N \\le 20$)."),
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
    const term = (c, p, first = false) => (c === 0 ? "" : `${c < 0 ? (first ? "-" : " - ") : first ? "" : " + "}${Math.abs(c) === 1 && p ? "" : Math.abs(c)}${p ? `x${p > 1 ? `^${p}` : ""}` : ""}`);
    const s1 = term(a3, 3, true) + term(a2, 2) + term(a1, 1) + " + \\alpha";
    const s2 = "\\beta x^3 + \\gamma x^2" + term(b1, 1) + term(b0, 0);
    const sd0 = 2 * a2, sd2 = 12 * be + 2 * ga;
    const sp0 = a1, sp2 = 12 * be + 4 * ga + b1;
    const sv0 = al, sv2 = 8 * be + 4 * ga + 2 * b1 + b0, per = sv0 === sv2 && sp0 === sp2 && sd0 === sd2;
    return {
      intro: tx(`s(x) = \\begin{cases} ${s1}, & 0 \\le x \\le 1,\\\\ ${s2}, & 1 \\lt x \\le 2.\\end{cases}`),
      parts: [
        nmVal(`Bestimmen Sie $\\alpha, \\beta, \\gamma$ so, dass $s$ ein kubischer Spline zu $x_0 = 0$, $x_1 = 1$, $x_2 = 2$ ist: $\\alpha$; $\\beta$; $\\gamma$ (${L3}).`, ql([al, be, ga]), 4,
          `$s''$ stetig in 1: $6\\cdot(${a3}) + 2\\cdot(${a2}) = 6\\beta + 2\\gamma$; $s'$ stetig: $3\\cdot(${a3}) + 2\\cdot(${a2}) + (${a1}) = 3\\beta + 2\\gamma + (${b1})$; $s$ stetig: $(${a3}) + (${a2}) + (${a1}) + \\alpha = \\beta + \\gamma + (${b1}) + (${b0})$. Ergibt $\\beta = ${be}$, $\\gamma = ${ga}$, $\\alpha = ${al}$.`),
        nmMC("Ist $s$ ein natürlicher Spline?", sd0 === 0 && sd2 === 0 ? ["Ja: $s''(0) = s''(2) = 0$", "Nein: $s''(0) \\neq 0$", "Nein: $s'(0) \\neq 0$", "Das lässt sich nicht entscheiden"] : ["Nein", "Ja", "Ja, weil $s \\in C^2$", "Nur wenn $\\alpha = 0$"], 1, `$s''(0) = ${sd0}$, $s''(2) = ${sd2}$.`),
        nmVal(`Geben Sie die Randsteigungen $s'(0)$; $s'(2)$ an (${L3}) — als eingespannter Spline wären das $v_0$ und $v_N$.`, ql([sp0, sp2]), 1, `$s'(0) = ${sp0}$, $s'(2) = 12\\beta + 4\\gamma + (${b1}) = ${sp2}$.`),
        nmMC("Ist $s$ ein periodischer Spline?", per ? ["Ja", "Nein"] : ["Nein", "Ja"], 1, `$s(0) = ${sv0}$, $s(2) = ${sv2}$; $s'$: $${sp0}, ${sp2}$; $s''$: $${sd0}, ${sd2}$ — periodisch nur, wenn alle drei Paare gleich sind.`, true),
        nmW("Geben Sie die Definition eines natürlichen interpolierenden kubischen Splines an.", "$s \\in C^2([a, b])$, $s|_{[x_{n-1}, x_n]} \\in P_3$ für $n = 1, \\dots, N$, $s(x_n) = y_n$ für $n = 0, \\dots, N$ und $s''(a) = s''(b) = 0$.",
          [[1, "$C^2$ und stückweise $P_3$"], [1, "Interpolation und $s''(a) = s''(b) = 0$"]]),
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
      intro: `<p>Gegeben sind die Knoten ${r.c.map((ck, k) => `$c_${k + 1} = ${ck.tex()}$`).join(", ")}.</p>`,
      parts: [
        nmVal(`Bestimmen Sie die Gewichte so, dass die Quadraturformel maximale Ordnung hat: $b_1$; …; $b_${r.c.length}$ (${L3}).`, ql(r.b), 3,
          `Aus den Ordnungsbedingungen $\\sum b_kc_k^{q-1} = \\frac1q$ für $q = 1, \\dots, ${r.c.length}$ (oder $b_k = \\int_0^1L_k$): $b = (${r.b.map((x) => x.tex()).join(",\\ ")})$.`),
        nmVal("Welche Ordnung hat die Formel?", p, 1, r.conds.slice(0, p + 1).map((x) => `$q = ${x.q}$: $${x.lhs.tex()} ${x.ok ? "=" : "\\neq"} \\frac{1}{${x.q}}$`).join("; ") + "."),
        nmMC("Ist die Formel symmetrisch?", sym ? ["Ja", "Nein"] : ["Nein", "Ja"], 1, "$c_k = 1 - c_{s+1-k}$ und $b_k = b_{s+1-k}$.", true),
        nmMC("Ist die Formel monoton?", mono ? ["Ja, alle Gewichte $\\ge 0$", "Nein, ein Gewicht ist negativ"] : ["Nein, ein Gewicht ist negativ", "Ja, alle Gewichte $\\ge 0$"], 1, "Monoton genau dann, wenn alle $b_k \\ge 0$.", true),
        nmW("Zeigen Sie: bei $p \\ge s$ sind die Gewichte durch die Knoten eindeutig bestimmt (mit expliziter Formel).", "Die QF ist exakt für die Lagrange-Polynome $L_k$ (Grad $s - 1 \\le p - 1$): $\\int_0^1L_k = \\sum_j b_jL_k(c_j) = b_k$, weil $L_k(c_j) = \\delta_{kj}$.",
          [[1, "Exaktheit für $L_k$, weil Grad $\\le p - 1$"], [1, "$L_k(c_j) = \\delta_{kj} \\Rightarrow b_k = \\int_0^1L_k$"]]),
      ],
    };
  },
});

const NM_QAPPLY = [
  { name: "\\cos(x - m)", f: (m) => (x) => Math.cos(x - m), F: (m) => (x) => Math.sin(x - m) },
  { name: "e^x", f: () => Math.exp, F: () => Math.exp },
  { name: "\\frac1x", f: () => (x) => 1 / x, F: () => Math.log, pos: true },
];
nmTask({
  id: "qapply", topic: "quad", name: "Eine Quadraturformel anwenden", like: "2021-ws/5",
  make() {
    const R = nmPick([{ name: "Trapezregel", b: [0.5, 0.5], c: [0, 1], p: 2 }, { name: "Simpsonregel", b: [1 / 6, 4 / 6, 1 / 6], c: [0, 0.5, 1], p: 4 },
      { name: "Mittelpunktregel", b: [1], c: [0.5], p: 2 }, { name: "QF mit $c = (\\frac14, \\frac34)$, $b = (\\frac12, \\frac12)$", b: [0.5, 0.5], c: [0.25, 0.75], p: 2 }]);
    const G = nmPick(NM_QAPPLY), a = G.pos ? rint(1, 3) : rint(0, 2), b = a + nmPick([2, 4]), m = (a + b) / 2;
    const f = G.f(m), Fx = G.F(m), name = G.name.replace("m", String(m));
    const q = (b - a) * R.b.reduce((s, bk, k) => s + bk * f(a + R.c[k] * (b - a)), 0), exact = Fx(b) - Fx(a);
    const frac2 = (x) => { for (let d = 1; d <= 12; d++) if (Math.abs(x * d - Math.round(x * d)) < 1e-9) return d === 1 ? String(Math.round(x * d)) : `\\frac{${Math.round(x * d)}}{${d}}`; return td(x); };
    return {
      intro: `<p>Approximieren Sie $\\int_{${a}}^{${b}} ${name}\\,dx$ mit der ${R.name}.</p>`,
      parts: [
        nmVal("Berechnen Sie die Näherung (vier Nachkommastellen).", q, 2, `$(b - a)\\sum b_kf(a + c_k(b - a)) = ${b - a}\\cdot\\big(${R.b.map((bk, k) => `${frac2(bk)}\\,f(${td(a + R.c[k] * (b - a))})`).join(" + ")}\\big) = ${td(q, 6)}$. Exakt: $${td(exact, 6)}$.`),
        nmVal("Welche Ordnung hat die Formel?", R.p, 1, `Die Ordnungsbedingungen gelten bis $q = ${R.p}$.`),
        nmMC(`Für welche Polynome ist die Formel exakt?`, [`alle Polynome vom Grad $\\le ${R.p - 1}$`, `alle Polynome vom Grad $\\le ${R.p}$`, `nur Konstanten`, `alle Polynome vom Grad $\\le ${R.p + 1}$`], 1, "Ordnung $p$ heißt exakt bis Grad $p - 1$."),
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
      intro: `<p>Die Tabelle zeigt die Differenz der summierten Formel (äquidistant, $h = ${Lr}/N$) zum exakten Wert von $\\int_0^{${Lr}}e^x\\,dx$.</p>
        <table class="len-terms nm-tab"><thead><tr><th>N</th>${lab.map((l) => `<th>${l}</th>`).join("")}</tr></thead><tbody>
        ${Ns.map((N, i) => `<tr><td>${N}</td>${cols.map((c) => `<td>${nmD(c[i], 7)}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
      parts: [
        nmMC("Welche Spalte gehört zur Simpsonregel?", [col("simp"), ...lab.filter((l) => l !== col("simp"))], 1, "Fehler $\\div 16$ pro Halbierung: Ordnung 4.", true),
        nmMC("Welche Spalte gehört zur Mittelpunktregel?", [col("mid"), ...lab.filter((l) => l !== col("mid"))], 1, "Ordnung 2 ($\\div 4$), etwa halb so groß wie Trapez und mit anderem Vorzeichen (Konstanten $\\frac1{24}$ und $\\frac1{12}$). Für das konvexe $e^x$ ist Trapez zu groß, Mittelpunkt zu klein.", true),
        nmVal(`Um welchen Faktor fällt der Fehler der Trapezregel ungefähr, wenn $N$ verdoppelt wird?`, 4, 1, "Ordnung 2: Faktor $2^2 = 4$."),
        nmW("Begründen Sie die Zuordnung kurz.", "Der Fehler einer summierten QF der Ordnung $p$ ist $O(h^p)$: Halbieren von $h$ teilt ihn durch $2^p$. Simpson ($p = 4$) $\\div 16$, Mittelpunkt und Trapez ($p = 2$) $\\div 4$. Die Fehlerkonstanten $\\frac1{24}$ und $\\frac1{12}$ und die Vorzeichen ($e^x$ konvex: Trapez überschätzt, Mittelpunkt unterschätzt) trennen die beiden.",
          [[1, "Fehlerordnung $O(h^p)$ und Faktor $2^p$"], [1, "Mittelpunkt und Trapez über Konstante bzw. Vorzeichen unterschieden"]]),
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
      intro: `<p>Wir approximieren $\\int_0^{${b}} x^${k}\\,dx$ mit der summierten Trapezregel $T_N$ auf $N = ${N}$ gleich langen Teilintervallen.</p>`,
      parts: [
        nmVal("Berechnen Sie $T_N$ (exakt, als Bruch).", T.toString(), 2, `$h = ${h.tex()}$: $T_N = h\\big[\\frac{f(0) + f(${b})}{2} + \\sum f(x_n)\\big] = ${T.tex()}$ (exakt: $${nmQ(b ** (k + 1), k + 1).tex()}$).`),
        nmVal("Wie viele zusätzliche Funktionsauswertungen braucht $T_{2N}$, wenn $T_N$ vorliegt?", N, 1, "Nur die $N$ Intervallmittelpunkte: $T_{2N} = \\frac12T_N + \\frac h2\\sum f(\\text{Mittelpunkte})$."),
        nmVal("Fehlerschranke $\\frac{b-a}{12}h^2\\max|f''|$ für dieses $N$ (als Dezimalzahl).", bound, 2, `$\\frac{${b}}{12}\\cdot\\big(${h.tex()}\\big)^2\\cdot ${f2max} = ${td(bound, 5)}$.`),
        nmMC("Wie ändert sich die Fehlerschranke, wenn $N$ verdoppelt wird?", ["Sie viertelt sich", "Sie halbiert sich", "Sie bleibt gleich", "Sie fällt auf $\\frac1{16}$"], 1, "$h$ halbiert, Fehler $\\propto h^2$."),
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
      intro: tx(`A = ${tmx(A)}, \\qquad x_0 = \\binom{1}{0}`) + `<p class="small">$A$ hat die Eigenwerte $${l1}$ und $${l2}$ mit den Eigenvektoren $(1, 1)^\\top$ bzw. $(1, -1)^\\top$ (bis auf Normierung).</p>`,
      parts: [
        nmVal(`Berechnen Sie $y_1 = Ax_0/\\|Ax_0\\|_2$ (vier Nachkommastellen, ${L3}).`, ql(y1), 2, `$Ax_0 = (${p}, ${q})^\\top$, $\\|\\cdot\\|_2 = ${td(n1)}$.`),
        nmVal("Berechnen Sie die Eigenwertschätzung $y_1^\\top Ay_1$.", ray, 1, `$${td(ray)}$ — auf dem Weg zu $\\lambda_1 = ${l1}$.`),
        nmVal("Mit welcher Rate $|\\lambda_2|/|\\lambda_1|$ konvergiert die Vektoriteration?", `${Math.abs(l2)}/${Math.abs(l1)}`, 1, `$\\frac{|${l2}|}{|${l1}|}$.`),
        nmVal(`Mit welcher Rate konvergiert die inverse Iteration mit Shift $\\mu = ${td(mu)}$?`, rate, 1, `Sie findet den EW $${l2}$ (am nächsten an $\\mu$), Rate $\\frac{|${l2} - ${td(mu)}|}{|${l1} - ${td(mu)}|} = ${td(rate)}$.`),
        nmMC("Was muss in jedem Schritt der inversen Iteration mit Shift getan werden?", ["$(A - \\mu I)\\,x_{k+1} = y_k$ lösen", "$A - \\mu I$ invertieren", "eine QR-Zerlegung von $A$ berechnen", "$\\det(A - \\mu I)$ auswerten"], 1, "Mit einer einmal berechneten Zerlegung von $A - \\mu I$."),
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
      intro: `<p>Ein ungerichteter zusammenhängender Graph mit den Knoten $v_1, \\dots, v_6$ und den Kanten ${edges.map(([a, b]) => `$\\{v_${a + 1}, v_${b + 1}\\}$`).join(", ")}.</p>`,
      parts: [
        nmVal(`Geben Sie die Diagonale $a_{11}$; …; $a_{66}$ der Laplacematrix an (${L3}).`, ql(deg), 2, "$a_{nn}$ ist die Anzahl der Nachbarn von $v_n$."),
        nmVal(`Was ist $a_{${i + 1}${j + 1}}$?`, -1, 1, "Bei einer Kante $-1$, sonst $0$."),
        nmMC("Welchen Eigenwert und Eigenvektor hat die Laplacematrix immer?", ["$0$ mit $e = (1, \\dots, 1)^\\top$", "$1$ mit $e$", "den größten Knotengrad", "keinen festen"], 1, "Jede Zeilensumme ist $0$."),
        nmMC("Welcher Eigenvektor wird für die Bisektion gebraucht?", ["der zum kleinsten positiven Eigenwert", "der zum größten Eigenwert", "$e$", "der zum Eigenwert $0$"], 1, "Der Fiedler-Vektor der Relaxation; dann am Median teilen."),
        nmW("Warum wendet man die inverse Vektoriteration auf $A + ee^\\top$ an und mit welchem Startwert?", "$A$ ist singulär ($Ae = 0$). $A + ee^\\top$ ist spd, und mit $e^\\top x_0 = 0$ bleibt $e^\\top x_k = 0$ — auf diesem Unterraum stimmen $A$ und $A + ee^\\top$ überein. In jedem Schritt $(A + ee^\\top)\\,x_{k+1} = y_k$ lösen, z. B. mit Cholesky oder cg.",
          [[1, "$A$ singulär, $A + ee^\\top$ spd"], [1, "Startwert $\\perp e$, bleibt $\\perp e$"]]),
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
      intro: tx(`A = ${tmx(A)}, \\qquad b = ${tcv(b)}, \\qquad x_0 = ${tcv(x0)}`),
      parts: [
        nmMC("Welchen Vorkonditionierer $B$ benutzt das Jacobi-Verfahren ($A = L + D + R$)?", ["$B = D$", "$B = L + D$", "$B = A$", "$B = I$"], 1, "Gesamtschrittverfahren: nur die Diagonale."),
        nmVal(`Berechnen Sie einen Jacobi-Schritt $x_1$ (${L3}).`, ql(jac), 2, `$x_{1,n} = \\frac{1}{a_{nn}}\\big(b_n - \\sum_{m\\neq n}a_{nm}x_{0,m}\\big)$, also $x_1 = ${tcv(jac)}$.`),
        nmVal(`Berechnen Sie einen Gauß-Seidel-Schritt $x_1$ (${L3}).`, ql(gs), 2, `Die neuen Komponenten werden sofort benutzt: $x_1 = ${tcv(gs)}$.`),
        nmVal("Berechnen Sie $\\|I - D^{-1}A\\|_\\infty$.", nm.toString(), 1, `Zeilensummen $\\sum_{m\\neq n}|a_{nm}|/a_{nn} = ${rows.map((x) => x.tex()).join(",\\ ")}$.`),
        nmMC("Warum konvergiert das Jacobi-Verfahren hier für jeden Startwert?", ["$A$ ist strikt diagonaldominant, also $\\rho(I - D^{-1}A) \\le \\|I - D^{-1}A\\|_\\infty < 1$", "$A$ ist symmetrisch", "$x_0$ ist nah an der Lösung", "$\\det A > 0$"], 1, "Hinreichende Bedingung der Vorlesung."),
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
    const dA = A[0][0] + 2 * A[0][1] + A[1][1];
    return {
      intro: tx(`A = ${tmx(A)}, \\qquad b = ${tcv(b)}, \\qquad x_0 = 0`),
      parts: [
        nmMC("Welches Funktional minimiert das cg-Verfahren?", ["$\\Phi(x) = \\frac12x^\\top Ax - x^\\top b$", "$\\|Ax - b\\|_2^2$", "$x^\\top Ax - b$", "$\\frac12\\|x\\|_2^2 - x^\\top b$"], 1, "$\\nabla\\Phi = Ax - b$, $A$ spd."),
        nmVal("Berechnen Sie $\\alpha_0 = \\langle r_0, r_0\\rangle/\\langle d_0, d_0\\rangle_A$ ($d_0 = r_0 = b$).", al.toString(), 2, `$\\langle r_0, r_0\\rangle = ${rr.tex()}$, $Ad_0 = ${tcv(Ad)}$, $\\langle d_0, d_0\\rangle_A = ${dAd.tex()}$.`),
        nmVal(`Berechnen Sie $x_1 = x_0 + \\alpha_0d_0$ (${L3}).`, ql(x1), 1, `$x_1 = \\alpha_0b = ${tcv(x1)}$.`),
        nmVal(`Berechnen Sie $r_1 = r_0 - \\alpha_0Ad_0$ (${L3}).`, ql(r1), 1, `$r_1 = ${tcv(r1)}$, und $r_1 \\perp r_0$ — Probe: $\\langle r_1, r_0\\rangle = 0$.`),
        nmVal("Berechnen Sie $\\beta_0 = \\langle r_1, r_1\\rangle/\\langle r_0, r_0\\rangle$.", be.toString(), 1, `$${be.tex()}$; $d_1 = r_1 + \\beta_0d_0$.`),
        nmVal("Berechnen Sie die Energienorm $\\|e\\|_A^2 = e^\\top Ae$ für $e = (1, 1)^\\top$.", dA, 1, `$a_{11} + 2a_{12} + a_{22} = ${dA}$.`),
        nmMC("Nach wie vielen Schritten liefert cg hier (exakt gerechnet) die Lösung?", ["nach höchstens 2", "nach 1", "nach unendlich vielen", "nach 4"], 1, "Nach höchstens $N$ Schritten."),
      ],
    };
  },
});

/* ================================================================ Lückentexte */

// Fill-in texts like the exams' (one point per gap). Each gap: [text with ___, right, three wrong].
const NM_GAPS = {
  spline: { like: "2223-ws/5", name: "Lückentext Splines", gaps: [
    ["Ein kubischer interpolierender Spline ist auf ganz $[a, b]$ ___.", "zweimal stetig differenzierbar", "nur stetig", "einmal stetig differenzierbar", "dreimal stetig differenzierbar"],
    ["Auf den Teilintervallen gilt $s_n = s|_{[x_{n-1}, x_n]} \\in$ ___.", "$P_3$", "$P_2$", "$C^2$", "$P_4$"],
    ["Für die Funktionswerte gilt ___.", "$s(x_n) = y_n$ für $n = 0, \\dots, N$", "$s'(x_n) = y_n$", "$s(x_n) = 0$", "$s''(x_n) = y_n$"],
    ["Von der Variation $h$ fordert man $h \\in C^2$ und ___.", "$h(x_n) = 0$ für alle $n$", "$h'(x_n) = 0$ für alle $n$", "$h(a) = h(b) = 1$", "$h'' \\equiv 0$"],
    ["Aus $s''(b)h'(b) - s''(a)h'(a) = 0$ motiviert man drei Typen: ___.", "eingespannt, natürlich, periodisch", "linear, quadratisch, kubisch", "Lagrange, Newton, Hermite", "Gauß, Simpson, Trapez"],
    ["In $s_n(x) = y_{n-1} + (x - x_{n-1})\\,y_{n-1,n} + \\dots$ ist der erste Teil der ___ Anteil.", "interpolierende", "glättende", "periodische", "Rest-"],
    ["Die Glattheitsbedingungen für $n = 1, \\dots, N - 1$ lauten ___.", "$s_n'(x_n) = s_{n+1}'(x_n)$ und $s_n''(x_n) = s_{n+1}''(x_n)$", "$s_n(x_n) = 0$", "$s_n'(x_n) = 0$", "$s_n'''(x_n) = s_{n+1}'''(x_n)$"],
    ["Die Matrix des LGS bei eingespannten Randbedingungen ist ___.", "symmetrisch, tridiagonal und strikt diagonaldominant", "voll besetzt und orthogonal", "obere Dreiecksmatrix", "singulär"],
    ["Für eingespannte Splines gilt $\\max|f - s| \\le$ ___.", "$\\frac{5}{384}h^4\\max|f^{(4)}|$", "$\\frac1{12}h^2\\max|f''|$", "$\\frac{2^{-N}}{(N+1)!}\\max|f^{(N+1)}|$", "$h\\max|f'|$"],
  ] },
  eig: { like: "19-ss/4", name: "Lückentext Eigenwerte", gaps: [
    ["Die Eigenwerte lassen sich über die Nullstellen des ___ bestimmen.", "charakteristischen Polynoms", "Newton-Polynoms", "Legendre-Polynoms", "Knotenpolynoms"],
    ["Diese Nullstellenbestimmung ist im Allgemeinen ___.", "schlecht konditioniert", "gut konditioniert", "exakt", "stabil und billig"],
    ["Die Vektoriteration liefert für symmetrisches $A$ einen EV zum ___ Eigenwert.", "betragsgrößten", "betragskleinsten", "zweitgrößten", "kleinsten positiven"],
    ["Für einen beliebigen anderen EW $\\lambda_n$ verwendet man die ___.", "inverse Vektoriteration mit Shift", "Vektoriteration ohne Shift", "Gauß-Seidel-Iteration", "Cholesky-Zerlegung"],
    ["Dafür braucht man eine ___ von $\\lambda_n$.", "Näherung (Schätzung)", "LR-Zerlegung", "Hessenbergform", "Ableitung"],
    ["Im QR-Algorithmus ist $A_{k+1}$ = ___.", "$R_kQ_k$", "$Q_kR_k$", "$R_k^{-1}Q_k$", "$Q_k^\\top R_kQ_k$"],
    ["Weil das teuer ist, transformiert man $A$ zuerst auf ___.", "Hessenbergform", "Diagonalform", "Jordanform", "Bidiagonalform"],
    ["Dafür sind ___ Householder-Transformationen nötig.", "$N - 2$", "$N$", "$N - 1$", "$2N$"],
    ["Ein Schritt kostet dann im Allgemeinen ___ Operationen.", "$O(N^2)$", "$O(N^3)$", "$O(N)$", "$O(\\log N)$"],
    ["Bei symmetrischem $A$ kostet ein Schritt ___ Operationen.", "$O(N)$", "$O(N^2)$", "$O(N^3)$", "$O(1)$"],
    ["Um die Konvergenz zu verbessern, verwendet man ___.", "Shifts", "Pivotisierung", "Dämpfung", "Vorkonditionierung"],
  ] },
  iter: { like: "1920-ws/5", name: "Lückentext iterative Verfahren", gaps: [
    ["Iterative Verfahren lohnen sich, wenn $N$ ___ ist.", "groß", "klein", "gerade", "eine Zweierpotenz"],
    ["… und $A$ ___ ist.", "dünn besetzt", "voll besetzt", "orthogonal", "eine Dreiecksmatrix"],
    ["Direkte Verfahren haben das Problem des ___.", "Fill-ins", "Overflows", "Runge-Phänomens", "Rangdefekts"],
    ["Die Fixpunktgleichung allgemeiner linearer Iterationen lautet ___.", "$x = (I - B^{-1}A)\\,x + B^{-1}b$", "$x = Ax - b$", "$x = B^{-1}Ax$", "$x = (A - B)\\,x + b$"],
    ["Konvergenz für jeden Startwert liegt vor, falls ___.", "$\\rho(I - B^{-1}A) < 1$", "$\\|A\\| < 1$", "$\\det B \\neq 0$", "$A$ symmetrisch ist"],
    ["Beim Jacobi-Verfahren wählt man $B$ = ___.", "$D$", "$L + D$", "$A$", "$I$"],
    ["Beim Gauß-Seidel-Verfahren wählt man $B$ = ___.", "$L + D$", "$D$", "$D + R$", "$LL^\\top$"],
    ["Auch eine ___ von $A$ kann als Vorkonditionierer dienen.", "unvollständige LR-Zerlegung", "Singulärwertzerlegung", "Inverse", "Transponierte"],
    ["Die Hauptidee: ___ lässt sich leichter lösen als $Ax = b$.", "$Bc = r$", "$Ac = r$", "$B^\\top c = b$", "$Ax = 0$"],
    ["Das cg-Verfahren setzt voraus, dass $A$ ___ ist.", "symmetrisch positiv definit", "regulär", "diagonaldominant", "orthogonal"],
    ["Der Hauptaufwand eines cg-Schritts ist ___.", "die Berechnung von $Ad_k$", "eine LR-Zerlegung", "die Berechnung von $A^{-1}$", "das Sortieren"],
    ["Theoretisch liefert cg nach ___ Schritten die exakte Lösung.", "$N$", "$1$", "$N^2$", "$\\log N$"],
  ] },
  newton: { like: "17-ss/5", name: "Lückentext Newton", gaps: [
    ["Das Newton-Verfahren löst Probleme der Form ___.", "$f(x) = 0$", "$Ax = b$ mit $A$ spd", "$\\min\\|x\\|$", "$x = Ax$"],
    ["Die Iterationsvorschrift lautet ___.", "$x_{k+1} = x_k - f'(x_k)^{-1}f(x_k)$", "$x_{k+1} = f(x_k)$", "$x_{k+1} = x_k - f(x_k)$", "$x_{k+1} = f'(x_k)\\,x_k$"],
    ["In jedem Schritt muss ein ___ gelöst werden.", "lineares Gleichungssystem", "Eigenwertproblem", "Ausgleichsproblem", "Integral"],
    ["Die Wahl des ___ beeinflusst stark das Konvergenzverhalten.", "Startwerts", "Stoppkriteriums", "Rechners", "Pivots"],
    ["Bei günstiger Wahl erwartet man ___ Konvergenz.", "(lokal) quadratische", "lineare", "keine", "sublineare"],
    ["Beim vereinfachten Verfahren ersetzt man $f'(x_k)$ durch ___.", "$f'(x_0)$", "die Einheitsmatrix", "$f(x_0)$", "$f''(x_k)$"],
    ["Die Anzahl nötiger LR-Zerlegungen beim vereinfachten Verfahren ist ___.", "eins", "eine pro Schritt", "$N$", "null"],
    ["Für Fixpunktprobleme der Form ___ liefert der Banachsche Fixpunktsatz ein Verfahren.", "$x = g(x)$", "$f(x) = 0$", "$Ax = \\lambda x$", "$\\min f(x)$"],
    ["Eine Kontraktion erfüllt ___.", "$\\|g(x) - g(y)\\| \\le L\\|x - y\\|$ mit $L < 1$", "$\\|g(x)\\| \\le 1$", "$g'(x) > 0$", "$g(x) = x$ für alle $x$"],
  ] },
  gp: { like: "20-ss/5", name: "Lückentext Kondition und Stabilität", gaps: [
    ["Ein Algorithmus heißt ___, wenn unvermeidbare Fehler in den Eingabedaten unverhältnismäßig verstärkt werden.", "instabil", "schlecht konditioniert", "divergent", "inkonsistent"],
    ["Die Addition zweier Gleitpunktzahlen in Gleitpunktarithmetik ist immer ___.", "stabil", "exakt", "schlecht konditioniert", "instabil"],
    ["Berechnet man $x + y$ mit ___, tritt Auslöschung auf.", "$x \\approx -y$", "$x \\approx y$", "$x \\gg y$", "$x, y > 0$"],
    ["Problematisch, weil sich ___ auslöschen …", "die führenden (richtigen) Stellen", "die Rundungsfehler", "die Exponenten", "die Vorzeichen"],
    ["… und ___ das Ergebnis dominieren.", "die Rundungsfehler", "die führenden Stellen", "die Exponenten", "die Nullen"],
    ["Die Kondition einer regulären Matrix ist ___.", "$\\|A\\|\\,\\|A^{-1}\\|$", "$\\|A\\|/\\|A^{-1}\\|$", "$|\\det A|$", "$\\max|a_{ij}|$"],
    ["Bezüglich der 2-Norm haben ___ immer die Kondition 1.", "orthogonale Matrizen", "Dreiecksmatrizen", "symmetrische Matrizen", "Permutations- und Diagonalmatrizen"],
    ["Die Lebesgue-Konstante ist $\\Lambda_N$ = ___.", "$\\max_x\\sum_n|L_n(x)|$", "$\\max_x|w_{N+1}(x)|$", "$\\sum_n|f_n|$", "$\\max|f - p|$"],
    ["Eine gute Wahl der Stützstellen sind ___ Stützstellen.", "Tschebyscheff-", "äquidistante", "zufällige", "ganzzahlige"],
    ["Für IEEE double ist $\\eps \\approx$ ___.", "$2{,}2\\cdot10^{-16}$", "$10^{-308}$", "$10^{-8}$", "$1{,}8\\cdot10^{308}$"],
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
