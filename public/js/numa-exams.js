// NuMa old exams: SS 17 to SS 26 with their tasks, each summarised in our own words, tagged by topic
// and linked to its page in the exam and in the solutions. The PDFs are KIT material: they live in
// public/numa-exams/ on the server only and are never committed (see .gitignore and the README).
//
// The exams since SS 17 are all by the same lecturer and in the same format: five or six tasks of
// about ten points, mixing calculations, short proofs, explanations and a fill-in text (Lückentext).
// The "Kurzaufgaben" collect small parts from several chapters; their points are split by topic.

// Topics, the sections that teach them.
const NUMA_EXAM_TOPICS = {
  gp: { name: "Gleitpunkt & Kondition", color: "var(--c-range)", secs: ["1.1", "1.2", "1.3"] },
  lr: { name: "LR & Cholesky", color: "var(--c-topic)", secs: ["2.1", "2.2"] },
  qr: { name: "Householder & QR", color: "var(--c-verb)", secs: ["2.3"] },
  cond: { name: "Normen & Kondition", color: "var(--c-subject)", secs: ["2.4"] },
  lsq: { name: "Ausgleich & SWZ", color: "var(--c-object)", secs: ["2.5", "2.6"] },
  newton: { name: "Newton", color: "var(--c-point)", secs: ["3.1", "3.2", "3.3"] },
  interp: { name: "Polynominterpolation", color: "var(--c-time)", secs: ["4.1", "4.2", "4.3"] },
  spline: { name: "Splines", color: "var(--c-with)", secs: ["4.4"] },
  quad: { name: "Quadratur", color: "var(--c-place)", secs: ["5.1", "5.2", "5.3", "5.4"] },
  eig: { name: "Eigenwerte", color: "var(--c-also)", secs: ["6.1", "6.2", "6.3"] },
  iter: { name: "Iterative LGS & cg", color: "var(--c-dir)", secs: ["7.1", "7.2", "7.3"] },
};
const NUMA_EXAM_TOPIC_IDS = Object.keys(NUMA_EXAM_TOPICS);

// Each exam: id (file name), semester, date (if the cover says), whether the solutions are a scan
// (then no page links into them), and its tasks:
//   [number, topic or [[topic, points], …] for mixed tasks, page in the exam, page in the solutions, points, what the parts ask].
const NUMA_EXAMS_RAW = [
  { id: "26-ss", sem: "SS 26", only: "sol", tasks: [
    [1, "lr", 1, 1, 6, ["Ax = b mit gegebener PA = LR lösen, kurz beweisen, Aufwand", "LR-Zerlegung mit Spaltenpivotwahl von (0 1 2; 2 4 6; 1 4 5)"]],
    [2, [["cond", 5], ["iter", 4]], 2, 2, 9, ["wie die Gitterweite h die Kondition der Spline-Matrix beeinflusst", "cond∞ ≤ 6 über I + C mit ‖C‖∞ = 3/4 und der Neumann-Reihe", "Jacobi: Vorkonditionierer, Iterationsmatrix, Konvergenz mit Gerschgorin-Kreisen"]],
    [3, "newton", 4, 4, 6, ["Newton-Verfahren mit Stoppkriterium", "aus Taylor: ‖xₖ − x*‖ ≈ ‖f′(x*)⁻¹f(xₖ)‖ ≤ K‖f(xₖ)‖", "warum ‖f(xₖ)‖ ≤ ε als Stoppkriterium problematisch ist"]],
    [4, "quad", 5, 5, 12, ["Trapezregel: Gewichte, Knoten, Ordnung mit Beweis", "Fehler ≤ (b − a)³/12 · max|f″| über das Restglied der Interpolation", "summierte Trapezregel: Fehler, neue Auswertungen für T₂N, Fehler viertelt sich"]],
    [5, [["qr", 4], ["eig", 3]], 7, 7, 7, ["auslöschungsfreier Householder-Vektor für die erste Spalte einer Tridiagonalmatrix, warum Auslöschung schadet", "Nicht-Null-Struktur von Q₁", "Bezug zum QR-Algorithmus"]],
    [6, "iter", 8, 8, 10, ["Minimierungsproblem des cg-Verfahrens und Äquivalenz zum LGS", "Idee eines cg-Schritts in Worten", "exakt nach L Schritten bei L verschiedenen Eigenwerten", "welches Spektrum schnelle Konvergenz bringt (Cluster)"]],
  ] },
  { id: "2425-ws", sem: "WS 24/25", date: "2025-03-06", tasks: [
    [1, [["lr", 4], ["gp", 2], ["newton", 3], ["iter", 2]], 2, 2, 11, ["LR mit Spaltenpivotsuche von (1 −2 −8; −1 −1 0; 2 4 8)", "eₘₐₓ und fl(96,6) für B = 3, eₘᵢₙ = −12, Lₘ = 5, Lₑ = 3", "Newton für die Umkehrfunktion; exp(e − 1) mit einem Schritt", "Energienorm ‖d‖_A für A = diag(11, 11, 13) + eeᵀ"]],
    [2, "cond", 2, 4, 10, ["‖A‖₂ = ‖AQ‖₂ für orthogonales Q", "‖A‖₂² = λₘₐₓ(AᵀA)", "‖A‖₂² ≤ ‖A‖∞‖A‖₁", "√2 ≤ ‖L‖₂ ≤ 2 für die Bidiagonalmatrix"]],
    [3, [["qr", 5], ["eig", 3]], 3, 5, 8, ["Householder-Transformation mit auslöschungsfreiem w angeben", "Q ist eine Spiegelung: alle u mit Qu = −u und y mit Qy = y", "(1 −4 3; −4 3 0; 3 0 3) auf Hessenbergform"]],
    [4, "quad", 3, 7, 11, ["Idee interpolatorischer QF, Knoten und Gewichte herleiten", "Gewichte zu c = ¼, ½, ¾ mit maximaler Ordnung, Ordnung bestimmen", "zwei Nachteile der Formel mit c = ⅕, ½, ⅘ gegenüber Simpson", "summierte Trapez- und Rechteckregel; welche und warum"]],
    [5, "spline", 4, 9, 10, ["eingespannte Lagrange-Splines und Λ_N definieren", "Σ lₙ = 1, also Λ_N ≥ 1", "s − s̃ = Σ(yₙ − ỹₙ)lₙ begründen", "max|s − s̃| ≤ Λ_N max|yₘ − ỹₘ|", "welche Unterteilung man wählen würde"]],
  ] },
  { id: "24-ss", sem: "SS 24", date: "2024-09-18", tasks: [
    [1, "gp", 1, 2, 10, ["Definition von FL⁺", "max FL⁺ und min FL⁺", "2 eps B⁻¹ < |x − y|/|x| ≤ 2 eps für benachbarte Zahlen", "Vorteil von B = 2 (verstecktes Bit) und die Abschätzung dazu"]],
    [2, "interp", 1, 3, 10, ["Newton-Darstellung zu (1, 3), (2, 3), (4, 63), (5, 99)", "Punkt (0, 59) hinzufügen", "max|q − p| ≤ Λ_N max|q − f| mit explizitem Λ_N", "max|f − p| ≤ (1 + Λ_N) max|q − f|", "äquidistant gegen Tschebyscheff für N ≈ 20"]],
    [3, "quad", 2, 5, 10, ["Definition der Ordnung", "p ≥ s ⇒ Gewichte eindeutig, explizite Formel", "Ordnung s + m ⇔ ∫M g = 0 für g ∈ P_{m−1}", "maximale Ordnung mit Begründung"]],
    [4, "cond", 2, 6, 10, ["Submultiplikativität", "cond(A) ≥ 1", "Störung von b: ‖x − x̃‖/‖x‖ ≤ cond(A)‖b − b̃‖/‖b‖, diskutieren", "Spektrum von eeᵀ und ‖veᵀ‖₂"]],
    [5, "iter", 3, 7, 10, ["Funktional Φ und Zusammenhang zu Ax = b", "Idee hinter αₖ und eine andere Formel", "Idee hinter βₖ und eine andere Formel", "cg für λA, λb: was ändert sich", "das Stoppkriterium im Licht davon"]],
  ] },
  { id: "2223-ws", sem: "WS 22/23", date: "2023-02-27", scan: true, tasks: [
    [1, "lr", 2, null, 10, ["Aufwand der Rückwärtssubstitution (Zeilenversion)", "Spaltenversion herleiten (zwei Zeilen Code)", "Ax = b mit LR und Spaltenpivotwahl, A = (0 3 2; 8 4 0; 4 14 4), b = (4, 32, 24)"]],
    [2, "lsq", 2, null, 10, ["Singulärwertzerlegung erklären", "‖A‖₂ = σ₁", "‖A − B‖₂ ≥ σ_{k+1} für Rang(B) = k", "B mit Gleichheit angeben und beweisen"]],
    [3, "interp", 3, null, 10, ["die richtige Aitken-Formel wählen und beweisen", "dividierte Differenz f₀,N aus f₁,N und f₀,N−1", "Newton-Polynom w_N und p = p₀,N−1 + f₀,N w_N", "Newton-Darstellung zu (0, 2), (2, 2), (3, 5), (4, 6)"]],
    [4, "lsq", 3, null, 10, ["Ausgleichsproblem und Normalengleichung", "Cholesky von ĀᵀĀ, Ā = (A | b): Zusammenhang von L, y, α mit A und b", "Lᵀx = y löst das Ausgleichsproblem", "das Residuum ist α", "was positiv semidefinit bedeuten würde"]],
    [5, "spline", 4, null, 10, ["Lückentext: Definition, Variation, drei Typen, Ansatz, Glattheitsbedingungen, Eigenschaften der Matrix"]],
    [6, [["gp", 2], ["quad", 4], ["qr", 2]], 4, null, 8, ["Abbruchkriterium s != s_alt bei der exp-Reihe", "symmetrische QF mit c₁ = ¼, c₃ = ¾ maximaler Ordnung; monoton?", "auslöschungsfreie Householder-Transformation für die erste Spalte von (1 2 5; 2 3 6; 2 4 7)"]],
  ] },
  { id: "22-ss", sem: "SS 22", date: "2022-09-20", scan: true, tasks: [
    [1, "lr", 2, null, 10, ["Aufwand von LR- und QR-Zerlegung", "M = (A B; 0 C)x = b mit PA = LR und C = QR lösen", "Aufwand in N und K je Teilschritt", "ein zweites System mit beiden Zerlegungen geschickt lösen"]],
    [2, [["newton", 4], ["gp", 6]], 2, null, 10, ["Funktion und Newton-Verfahren für √a", "Skizze: mit x₀ = 1 ist x₁ > √a", "IEEE: nur Wurzeln aus (1, 4) nötig", "√(x² + y²) für fl(π · 10¹⁶⁰), fl(e · 10¹⁵⁰) ohne Overflow, Wert"]],
    [3, "cond", 3, null, 10, ["‖A‖∞ = maximale Zeilensumme beweisen", "cond₂(Q) = 1", "‖veᵀ‖₁ = ‖v‖₁", "relativer Fehler von Ax bei gestörtem x über ‖x‖ ≤ ‖A⁻¹‖‖Ax‖"]],
    [4, "eig", 3, null, 10, ["Lückentext spektrale Bisektion: Ziel, Laplacematrix, Relaxierung, inverse Iteration auf A + eeᵀ, cg"]],
    [5, "quad", 4, null, 10, ["Definition der Ordnung", "Lagrange-Polynom zu den Knoten", "p ≥ s: Gewichte eindeutig; symmetrische Knoten ⇒ symmetrische Gewichte", "symmetrische QF integriert ungerade f auf [−1, 1] zu 0", "eine solche QF angeben"]],
    [6, [["lsq", 5], ["eig", 3], ["spline", 2]], 4, null, 10, ["Ausgleichsparabel durch vier Punkte: Problem und Normalengleichung", "Householder Q mit QAQ in Hessenbergform für (1 −1 2; 3 0 1; 4 1 0)", "natürliche Lagrange-Splines, s durch sie darstellen", "Matrizen, deren Singulärwerte die Eigenwerte sind"]],
  ] },
  { id: "2021-ws", sem: "WS 20/21", date: "2021-02-26", tasks: [
    [1, "lr", 2, 1, 10, ["det(A) für spd A effizient, Aufwand", "Blocksystem (A u; vᵀ d): Formel für y*", "y* effizient berechnen, Aufwand", "wann die Blockmatrix spd ist (mit der Cholesky-Zerlegung von A)"]],
    [2, "interp", 2, 2, 10, ["Interpolationspolynom definieren, Existenz beweisen", "Newton-Darstellung zu (1, 16), (3, 4), (5, 8) mit expliziten Newton-Polynomen", "p = [(x − x₀)p₁,N + (x_N − x)p₀,N−1]/(x_N − x₀) zeigen", "minimales N für sin auf [−1, 1] mit Fehler 10⁻²"]],
    [3, "qr", 3, 3, 10, ["Householder-Q ist orthogonal", "Qy berechnen und Aufwand", "Q₁ für die erste Spalte", "P₁ von rechts für die erste Zeile (Bidiagonalisierung), Struktur von w", "B durch die Transformationen und A ausdrücken"]],
    [4, "eig", 3, 4, 10, ["Lückentext QR-Algorithmus: Hessenberg, Aufwand, Shift, quadratische Konvergenz"]],
    [5, "quad", 4, 5, 10, ["Lagrange-Polynome zu den Knoten und ihr Grad", "bⱼ = ∫Lⱼ ⇒ p ≥ s", "Gauß-Gewichte sind positiv", "c = ½ ∓ √3/6, b = ½: Gauß-Formel", "∫₁⁵ cos(x − 3)dx mit c = ¼, ¾, b = ½"]],
    [6, [["gp", 3], ["newton", 3], ["iter", 4]], 4, 6, 10, ["konvergieren Archimedes' Approximationen in double precision? Alternative", "Newton in ℝᴺ und sein Aufwand gegen den vereinfachten", "allgemeine lineare Iteration, B für Jacobi und Gauß-Seidel", "‖x‖_A für A = diag(11, 11, 13) + eeᵀ"]],
  ] },
  { id: "20-ss", sem: "SS 20", date: "2020-10-13", scan: true, tasks: [
    [1, "lr", 2, null, 10, ["Ax = b mit PA = LR lösen, Aufwände", "(A + uvᵀ)x = b: Formel für vᵀx*", "vᵀx* effizient berechnen", "damit (A + uvᵀ)x = b lösen"]],
    [2, "lsq", 2, null, 10, ["Quadrate der Singulärwerte sind die EW von AᵀA", "Aufwand für AᵀA", "ein Verfahren für die Singulärwerte", "Bidiagonalform B: Struktur von BᵀB, Singulärwerte daraus, Aufwand"]],
    [3, "spline", 3, null, 10, ["c, d für einen eingespannten Spline mit s′(0) = 2, s′(2) = −5", "natürlich?", "Ansatz für quadratische Splines erklären", "LGS für die αₙ mit s′_N(x_N) = 0, lösbar?"]],
    [4, "quad", 3, null, 10, ["allgemeine QF, Simpson-Gewichte und -Knoten", "Bedingungen für symmetrische QF mit s = 3", "symmetrische QF der Ordnung 4 ≠ Simpson herleiten", "∫₀²⁰²⁰ f dx sinnvoll approximieren", "welche Formel und warum"]],
    [5, [["gp", 5], ["cond", 2], ["interp", 3]], 4, null, 10, ["Lückentext: instabil, Auslöschung, Konditionszahl, orthogonale Matrizen, Lebesgue-Konstante, Tschebyscheff"]],
    [6, [["gp", 3], ["cond", 2], ["newton", 2], ["iter", 3]], 4, null, 10, ["Größenordnungen von max FL, min FL⁺, eps", "det(I/10) = 0 und Rang 500 im Rechner erklären", "cond₂ einer gegebenen Matrix", "welche Iteration für π schneller ist", "Minimierungsproblem des cg und neue Suchrichtung"]],
  ] },
  { id: "1920-ws", sem: "WS 19/20", date: "2020-02-18", scan: true, tasks: [
    [1, "qr", 2, null, 10, ["QR-Zerlegung definieren, LGS damit lösen", "Vorteil gegenüber LR und Cholesky, die drei Aufwände", "auslöschungsfreier Householder-Vektor, Auslöschung", "w = (v − u)/‖v − u‖ ⇒ Qu = v und Qv = u"]],
    [2, "newton", 2, null, 10, ["Newton für Ax − b ist nach einem Schritt exakt", "Newton für ein Minimum herleiten", "ein Schritt für cos x₁ + x₁e^{x₂} ab x₀ = 0", "Skizze und Konvergenz für f(x) = 18,02 · x²⁰²⁰"]],
    [3, "interp", 3, null, 10, ["Newton-Darstellung zu (1, −2), (2, 0), (4, −4)", "Punkt (−1, 1) hinzufügen", "Lebesgue-Konstante ist affin invariant", "Ungleichung für die Zahl der Tschebyscheff-Stützstellen für cos(πx), Fehler 10⁻¹⁰"]],
    [4, "quad", 3, null, 10, ["Kondition der Integration herleiten", "allgemeine QF", "symmetrische QF und ihre Eigenschaft", "Fehlertabelle summierter Formeln Mittelpunkt, Trapez, Simpson zuordnen"]],
    [5, "iter", 4, null, 10, ["Lückentext iterative Verfahren: Fill-in, Fixpunktform, Konvergenz, Jacobi, Gauß-Seidel, unvollständige LR"]],
    [6, [["lr", 3], ["lsq", 1], ["eig", 2], ["gp", 4]], 4, null, 10, ["Cholesky-Faktor einer 4 × 4-Matrix", "lineares Ausgleichsproblem formulieren", "inverse Vektoriteration als Algorithmus", "eps und min FL⁺ allgemein bzw. für IEEE", "relative Abweichung der Addition, Kondition"]],
  ] },
  { id: "19-ss", sem: "SS 19", date: "2019-09-19", only: "exam", tasks: [
    [1, "lr", 2, null, 10, ["wann A = LR existiert, Aufwand", "LR mit Spaltenpivotwahl von (1 0 6; 2 5 3; 4 8 0)", "(A v; wᵀ 0) regulär ⇔ wᵀA⁻¹v ≠ 0", "effizienter Algorithmus für das Blocksystem, Aufwand"]],
    [2, "lsq", 2, null, 10, ["Ausgleichsproblem und Normalengleichung", "x* = A⁺b löst es", "x* = Σ (uᵣᵀb/σᵣ) vᵣ", "x* hat minimale Norm"]],
    [3, "spline", 3, null, 10, ["Definition kubischer Spline", "eingespannt, natürlich, periodisch den Bildern zuordnen", "Minimalität von ∫|s″|² beweisen", "not-a-knot-Bedingungen"]],
    [4, "eig", 3, null, 10, ["Lückentext Eigenwerte: charakteristisches Polynom, Vektoriteration, inverse mit Shift, QR-Algorithmus, Hessenberg, Shift"]],
    [5, "quad", 4, null, 10, ["Trapezregel und ihre Ordnung", "beste Zerlegung für f = 10x²e^{−5x} + x wählen", "Ordnung definieren, warum [0, 1] reicht", "p ≥ s ⇔ bₖ = ∫Lₖ beweisen"]],
    [6, [["gp", 2], ["newton", 2], ["cond", 2], ["qr", 2], ["iter", 2]], 4, null, 10, ["Anteil der Gleitpunktzahlen in (0, 1) zu [1, B) für B = 3", "Newton für √a, a ∈ (1, 4), und die Binärdarstellung", "eine Matrixnorm für eine 3 × 3-Matrix", "Householder effizient speichern, Qy berechnen", "Jacobi-Verfahren und eine hinreichende Bedingung"]],
  ] },
  { id: "1718-ws", sem: "WS 17/18", date: "2018-02-20", tasks: [
    [1, [["lr", 5], ["lsq", 4], ["iter", 2]], 2, 1, 11, ["Vorwärtssubstitution für eine 3 × 3-Matrix", "Existenz der Cholesky-Zerlegung, Formeln für N = 3", "Normalengleichung; Voraussetzung für Cholesky und Aufwand", "iteratives Verfahren für die Normalengleichung und sein Aufwand"]],
    [2, "iter", 2, 2, 9, ["Lückentext cg-Verfahren"]],
    [3, "gp", 3, 2, 8, ["den Graphen von ((1 + x) − 1)/x für 0 < x ≤ 10⁻¹⁵ erklären: die 0 links, der Sprung auf 2, die Hyperbel, die Werte am zweiten Sprung"]],
    [4, "lsq", 3, 3, 8, ["mit gegebener QR-Zerlegung: welche Systeme Ax = b lösbar sind", "die Ausgleichslösungen", "die Residuen"]],
    [5, "spline", 4, 4, 9, ["natürlicher Spline definieren", "α, β, γ für einen Spline auf [0, 2] bestimmen", "periodisch?"]],
    [6, [["quad", 3], ["interp", 6], ["newton", 2]], 4, 5, 11, ["Ordnung, Ordnungsbedingungen für p = 2, maximale Ordnung", "wie viele Stützstellen für Grad N, Eindeutigkeit", "Tschebyscheff-Stützstellen und ihr Vorteil", "Graph eines Polynoms und Kontrollpunkte", "Kreis und Hyperbel schneiden: Formulierung und ein Newton-Schritt ab (1, −1)"]],
  ] },
  { id: "17-ss", sem: "SS 17", scan: true, tasks: [
    [1, "lr", 2, null, 11, ["LR mit Spaltenpivotwahl einer 5 × 5-Matrix", "LGS mit LR-Zerlegung lösen", "Aufwand von Lx = b für bidiagonales L"]],
    [2, "quad", 2, null, 9, ["allgemeine QF und ihre Größen", "symmetrische QF mit c₁ = ⅙ und Ordnung ≥ 4", "summierte Simpsonregel mit möglichst wenigen Auswertungen"]],
    [3, "lsq", 3, null, 8, ["Lösung aus der QR-Zerlegung", "eine andere Methode und zwei Nachteile", "A und b für eine Ausgleichsgerade"]],
    [4, "interp", 3, null, 12, ["Interpolationspolynom, Fehlerformel, Lagrange-Polynom, p = Σ fₙLₙ begründen", "Newton-Darstellung zu drei Punkten", "Punkt (1, 2) mit wenig Aufwand hinzufügen"]],
    [5, "newton", 4, null, 10, ["Lückentext Newton, vereinfachtes Newton, Banachscher Fixpunktsatz"]],
    [6, [["gp", 2], ["iter", 4], ["eig", 3], ["interp", 1]], 4, null, 10, ["1 + 10⁻⁷ · 10⁻⁷ und 1 + 10⁻⁷ bei eps = 10⁻¹⁰", "wofür CCS sinnvoll ist", "Iteration für den EV zum größten und zum kleinsten EW, Aufwand", "Nachteil hoher Polynomgrade und eine Alternative", "Aufwand eines cg-Schritts voll gegen dünn besetzt"]],
  ] },
];
// File names in public/numa-exams/, the split points, a key per task.
const NUMA_EXAMS = NUMA_EXAMS_RAW.map((e) => ({
  ...e,
  file: e.only === "sol" ? `numa-exams/${e.id}-loesung.pdf` : `numa-exams/${e.id}.pdf`,
  sol: e.only === "exam" ? null : `numa-exams/${e.id}-loesung.pdf`,
  tasks: e.tasks.map(([n, topic, page, sol, pts, asks]) => {
    const split = Array.isArray(topic) ? topic : [[topic, pts]];
    return { n, topic: split[0][0], split, topics: split.map((s) => s[0]), page, solPage: sol, pts, asks, key: `${e.id}/${n}` };
  }),
}));

const nmExamView = { topic: "all", open: false };
const nmExamDone = () => new Set(store.get("numaExamDone", []));
const nmDate = (iso) => { const [y, m, d] = iso.split("-"); return `${+d}.${+m}.${y}`; };
const nmTopicPill = (t, pts) => `<span class="len-topic" style="--tc:${NUMA_EXAM_TOPICS[t].color}">${NUMA_EXAM_TOPICS[t].name}${pts !== undefined ? ` · ${String(pts).replace(".", ",")}` : ""}</span>`;

// Points per topic and exam, to see what always comes up.
function nmExamGrid() {
  const exams = [...NUMA_EXAMS].reverse();
  return `<div class="pp-egrid" style="--n:${exams.length}">
    <span></span>${exams.map((e) => `<span class="pp-eg-h">${e.sem}</span>`).join("")}
    ${NUMA_EXAM_TOPIC_IDS.map((t) => `<span class="pp-eg-t">${nmTopicPill(t)}</span>${exams.map((e) => {
      const pts = e.tasks.flatMap((x) => x.split).filter(([tt]) => tt === t).reduce((a, [, p]) => a + p, 0);
      return `<span class="pp-eg-c" style="--a:${pts ? 18 + (Math.min(pts, 16) / 16) * 70 : 0}%;--tc:${NUMA_EXAM_TOPICS[t].color}">${pts || "–"}</span>`;
    }).join("")}`).join("")}
  </div><p class="small muted">Punkte pro Thema; Kurzaufgaben sind nach ihren Teilen aufgeteilt.</p>`;
}

function renderNumaExams() {
  const v = nmExamView;
  const done = nmExamDone();
  const all = NUMA_EXAMS.flatMap((e) => e.tasks);
  const match = (t) => (v.topic === "all" || t.topics.includes(v.topic)) && (!v.open || !done.has(t.key));
  const count = (topic) => all.filter((t) => topic === "all" || t.topics.includes(topic)).length;
  const shown = NUMA_EXAMS.map((e) => ({ e, tasks: e.tasks.filter(match) })).filter((x) => x.tasks.length);
  const nShown = shown.reduce((s, x) => s + x.tasks.length, 0);

  $("#numa-exams").innerHTML = `
    <div class="card hero">
      <h1>Alt<span class="accent">klausuren</span></h1>
      <p>${NUMA_EXAMS.length} Klausuren von SS 17 bis SS 26, alle von Daniel Weiß und im selben Aufbau: fünf oder sechs Aufgaben zu je etwa zehn Punkten
        (50 bis 60 Punkte insgesamt) — Rechnungen, kurze Beweise, Erklärungen und oft ein Lückentext.
        <b>Quadratur</b> kam in jeder Klausur dran, <b>LR- oder Cholesky-Zerlegung</b> in fast jeder.</p>
      <p class="small">„Aufgabe“ und „Lösung“ öffnen das PDF auf der richtigen Seite (bei eingescannten Lösungen am Anfang). Hak ab, was du gemacht hast; „Wiederholen“ führt zum Abschnitt, „Üben“ zu ähnlichen Aufgaben mit neuen Zahlen.</p>
    </div>
    <div class="card">
      <h2>Was drankommt</h2>
      ${nmExamGrid()}
    </div>
    <div class="card">
      <h2>Operatoren und Bewertung</h2>
      <p class="small muted">Aus dem Merkblatt zur Klausur, in eigenen Worten.</p>
      ${ppFacts([
        ["Zeigen / Beweisen", "Der häufigste Operator: ein Beweis, der Weg ist frei. Längere Beweise kommen nicht dran."],
        ["Widerlegen", "Meist ein einfaches Gegenbeispiel — und deutlich machen, warum es die Aussage widerlegt."],
        ["Begründen / Erklären", "Auf Gesetzmäßigkeiten zurückführen bzw. verständlich machen und einordnen. „Entscheiden / Geben Sie an“ mit „Begründen Sie kurz“: die Begründung zählt, nicht die Entscheidung."],
        ["Bestimmen / Berechnen / Lösen", "Den Weg mit Zwischenschritten zeigen und mit einem Antwortsatz abschließen."],
        ["Formulieren", "Definitionen und Sätze — möglichst nah an der Vorlesung, sonst verfälscht man leicht den Inhalt."],
        ["Skizzieren", "Nur bei Schaubildern; Achsen und wichtige Objekte beschriften."],
        ["Punkte", "Die Punkte je Teilaufgabe zeigen, wie viele zielführende Aspekte erwartet werden (je ½ oder 1 Punkt). Leichte Rechenfehler −½, schwere (Widerspruch zur Vorlesung) −1; vereinfachende Fehler senken die erreichbaren Punkte."],
      ])}
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Thema</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">Alle · ${count("all")}</button>
          ${NUMA_EXAM_TOPIC_IDS.map((t) => `<button class="chip ${v.topic === t ? "active" : ""}" data-topic="${t}" style="--gc:${NUMA_EXAM_TOPICS[t].color}">${NUMA_EXAM_TOPICS[t].name} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="nmExamOpen" ${v.open ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Nur noch offene Aufgaben</span></label>
      <p class="small muted len-filter-sum">${nShown} Aufgaben in ${shown.length} Klausuren · ${done.size} von ${all.length} erledigt</p>
    </div>
    ${shown.map(({ e, tasks }) => `
      <div class="card len-exam">
        <div class="card-head">
          <div><h2>${e.sem}${e.date ? ` <span class="muted len-exam-date">· ${nmDate(e.date)}</span>` : ""}</h2>
            <span class="small muted">${e.tasks.length} Aufgaben · ${e.tasks.reduce((s, t) => s + t.pts, 0)} Punkte${e.only === "sol" ? " · die Aufgaben stehen in der Lösungsskizze" : e.only === "exam" ? " · keine Lösung im Ordner" : e.scan ? " · Lösung eingescannt" : ""}</span></div>
          <span class="pp-exam-files">${e.only === "sol" ? "" : `<a class="btn" href="${e.file}" target="_blank" rel="noopener">Klausur ↗</a>`}${e.sol ? `<a class="btn" href="${e.sol}" target="_blank" rel="noopener">Lösung ↗</a>` : ""}</span>
        </div>
        <div class="len-tasks">
          ${tasks.map((t) => {
            const T = NUMA_EXAM_TOPICS[t.topic];
            return `
            <div class="len-task pp-etask ${done.has(t.key) ? "done" : ""}">
              <label class="len-done" title="Erledigt"><input type="checkbox" data-done="${t.key}" ${done.has(t.key) ? "checked" : ""}><span aria-hidden="true">✓</span></label>
              <b class="len-task-n">Aufgabe ${t.n}</b>
              <span class="nm-pills">${t.split.length > 1 ? t.split.map(([tt, p]) => nmTopicPill(tt, p)).join("") : nmTopicPill(t.topic)}</span>
              <span class="len-task-pts">${String(t.pts).replace(".", ",")} P</span>
              <ul class="pp-asks">${t.asks.map((a) => `<li>${ppEsc(a)}</li>`).join("")}</ul>
              <span class="len-task-go">
                <a class="btn small-btn" href="${e.file}#page=${t.page}" target="_blank" rel="noopener">Aufgabe · S. ${t.page}</a>
                ${e.sol ? `<a class="btn small-btn" href="${e.sol}${t.solPage ? `#page=${t.solPage}` : ""}" target="_blank" rel="noopener">Lösung${t.solPage ? ` · S. ${t.solPage}` : ""}</a>` : ""}
                <button class="btn small-btn" type="button" data-sec="${T.secs[0]}">Wiederholen ${T.secs.length > 1 ? `${T.secs[0]}–${T.secs[T.secs.length - 1]}` : T.secs[0]}</button>
                ${NUMA_TASKS.some((g) => g.topic === t.topic) ? `<button class="btn small-btn primary" type="button" data-tasks="${t.topic}">Üben</button>` : ""}
              </span>
            </div>`;
          }).join("")}
        </div>
      </div>`).join("") || `<p class="muted">Keine Aufgabe passt zu diesem Filter.</p>`}`;

  $$("#numa-exams [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; renderNumaExams(); }));
  $("#nmExamOpen").onchange = (ev) => { v.open = ev.target.checked; renderNumaExams(); };
  $$("#numa-exams [data-done]").forEach((cb) => (cb.onchange = () => {
    const s = nmExamDone();
    cb.checked ? s.add(cb.dataset.done) : s.delete(cb.dataset.done);
    store.set("numaExamDone", [...s]);
    track("numa.examDone");
    renderNumaExams();
  }));
  $$("#numa-exams [data-sec]").forEach((b) => (b.onclick = () => openNumaSection(b.dataset.sec)));
  $$("#numa-exams [data-tasks]").forEach((b) => (b.onclick = () => openNumaTasks(b.dataset.tasks)));
}
