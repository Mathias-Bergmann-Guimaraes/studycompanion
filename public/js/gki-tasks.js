// GKI exam tasks: whole tasks like the old exams' (gki-exams.js), several parts each, written in our
// own words, with new numbers every time. Used one at a time by Practice and put together by the mock
// exam (gki-mock.js). They cover the whole lecture: the topics of VL 1–3 in depth, and already the
// computing tasks the old exams always have (A*, Q-learning, value iteration, HMM filtering, Bayes
// nets, k-means, EM, PCA, CNN sizes, backpropagation, RNN parameters).
//
// The task format and the marking are NuMa's (numa-tasks.js, numa-mock.js): a generator
// { id, topic, name, like: "2425-ws/1" (an old exam task) or likeText, make } makes
// { intro: html, parts: [part] } with parts made by nmMC (choice), nmVal (a number, a fraction or a
// list separated by ";", or letters like "S A C G") and nmW (written, marked by ticking a rubric).
// The exam allows no calculator, so tasks that need σ, e or ln give the values as a hint.

const GKI_TASKS = [];
const gkTask = (g) => GKI_TASKS.push(g);
// A fraction for $…$ and as an answer string.
const fq = (x) => (x instanceof NmQ ? x.tex() : gt(x, 4));
const L3G = "durch ; getrennt";
// Letters (states, points, a path) as an answer, in the ways people type them: "S A C G", "S, A, C, G", "SACG", "S-A-C-G" …
const gkLetters = (xs) => [" ", ", ", ",", "", "-", " - ", "–", "; ", " → ", "→"].map((sep) => xs.join(sep));

/* ================================================================ Regression */

gkTask({
  id: "normal", topic: "reg", name: "Normalgleichung von Hand", likeText: "Übung 2, Aufgabe 1",
  make() {
    let pts, f;
    do {
      const N = nmPick([3, 4]);
      const xs = shuffle([0, 1, 2, 3, 4, 5]).slice(0, N).sort((a, b) => a - b);
      pts = xs.map((x) => [x, rint(0, 6)]);
      f = gkFitLine(pts);
    } while (!f || f.w.d > 14 || f.b.d > 14 || f.w.zero);
    const N = pts.length;
    const res = pts.map(([x, y]) => nmQ(y).sub(f.b).sub(f.w.mul(x)));
    const sse = res.reduce((s, e) => s.add(e.mul(e)), nmQ(0));
    const ybar = f.sy.div(N), sst = pts.reduce((s, [, y]) => s.add(nmQ(y).sub(ybar).mul(nmQ(y).sub(ybar))), nmQ(0));
    const r2 = sst.zero ? null : nmQ(1).sub(sse.div(sst));
    return {
      intro: `<p>Gegeben sind die Datenpunkte ${pts.map(([x, y]) => `$(${x}, ${y})$`).join(", ")} und das Modell $\\hat y_i = b + w x_i = \\tilde w^\\top\\tilde x_i$ mit $\\tilde w = (b, w)^\\top$, $\\tilde x_i = (1, x_i)^\\top$.</p>`,
      parts: [
        nmVal(`Stellen Sie $\\tilde X^\\top\\tilde X = \\begin{pmatrix}N & \\sum x_i\\\\ \\sum x_i & \\sum x_i^2\\end{pmatrix}$ auf: $N$; $\\sum x_i$; $\\sum x_i^2$ (${L3G}).`, ql([N, f.sx, f.sxx]), 1, `$\\tilde X^\\top\\tilde X = ${tmx([[N, f.sx], [f.sx, f.sxx]])}$.`),
        nmVal(`Und $\\tilde X^\\top y$: $\\sum y_i$; $\\sum x_iy_i$.`, ql([f.sy, f.sxy]), 1, `$\\tilde X^\\top y = ${tcv([f.sy, f.sxy])}$.`),
        nmVal(`Lösen Sie die Normalgleichung: $b$; $w$ (Brüche erlaubt).`, ql([f.b, f.w]), 2, `$w = \\frac{N\\sum x_iy_i - \\sum x_i\\sum y_i}{N\\sum x_i^2 - (\\sum x_i)^2} = ${f.w.tex()}$, $b = \\bar y - w\\bar x = ${f.b.tex()}$.`),
        nmVal("Berechnen Sie die Summe der Fehlerquadrate SSE.", qs(sse), 1, `Residuen $${res.map((e) => e.tex()).join(",\\ ")}$ (Summe null), SSE $= ${sse.tex()}$.`),
        ...(r2 ? [nmVal("Berechnen Sie $R^2$.", qs(r2), 1, `$\\bar y = ${ybar.tex()}$, $\\sum(y_i - \\bar y)^2 = ${sst.tex()}$, $R^2 = 1 - \\frac{${sse.tex()}}{${sst.tex()}} = ${r2.tex()} \\approx ${gt(+r2, 3)}$.`)] : []),
        nmW("Leiten Sie die Normalgleichung aus $L(\\tilde w) = \\frac{1}{2N}(y - \\tilde X\\tilde w)^\\top(y - \\tilde X\\tilde w)$ her.",
          `Ausmultiplizieren: $L = \\frac{1}{2N}(\\tilde w^\\top\\tilde X^\\top\\tilde X\\tilde w - 2\\tilde w^\\top\\tilde X^\\top y + y^\\top y)$. Ableiten mit $\\nabla_w w^\\top Aw = 2Aw$ ($A$ symmetrisch) und $\\nabla_w w^\\top a = a$: $\\nabla L = \\frac1N(\\tilde X^\\top\\tilde X\\tilde w - \\tilde X^\\top y)$. Null setzen: $\\tilde X^\\top\\tilde X\\tilde w = \\tilde X^\\top y$, bei vollem Spaltenrang $\\tilde w^\\star = (\\tilde X^\\top\\tilde X)^{-1}\\tilde X^\\top y$.`,
          [[1, "Ausmultipliziert, die beiden Mischterme zusammengefasst"], [1, "richtig abgeleitet (beide Regeln)"], [1, "Gradient null gesetzt, Normalgleichung, Bedingung voller Spaltenrang"]]),
      ],
    };
  },
});

gkTask({
  id: "r2", topic: "reg", name: "R² eines Modells ohne Bias", like: "26-ss/2",
  make() {
    let xs, ys, w, r2;
    do {
      xs = shuffle([1, 2, 3, 4]).slice(0, 3).sort((a, b) => a - b);
      w = nmPick([1, 2, 3]);
      ys = xs.map((x) => w * x + rint(-3, 3));
      const yb = nmQ(ys.reduce((a, b) => a + b), 3);
      const sse = xs.reduce((s, x, i) => s.add(nmQ((w * x - ys[i]) ** 2)), nmQ(0));
      const sst = ys.reduce((s, y) => s.add(nmQ(y).sub(yb).mul(nmQ(y).sub(yb))), nmQ(0));
      r2 = sst.zero ? null : { sse, sst, yb, v: nmQ(1).sub(sse.div(sst)) };
    } while (!r2);
    const better = +r2.v > 0;
    return {
      intro: `<p>Datenpunkte ${xs.map((x, i) => `$(x_${i + 1}, y_${i + 1}) = (${x}, ${ys[i]})$`).join(", ")}. Modell ohne Bias: $\\hat y_i = w\\cdot x_i$ mit $w = ${w}$.</p>${tx(`R^2 = 1 - \\frac{\\sum_{i=1}^3(\\hat y_i - y_i)^2}{\\sum_{i=1}^3(y_i - \\bar y)^2}`)}`,
      parts: [
        nmVal("Berechnen Sie den Zähler $\\sum(\\hat y_i - y_i)^2$.", qs(r2.sse), 1, `$\\hat y = (${xs.map((x) => w * x).join(", ")})$, Fehler $(${xs.map((x, i) => w * x - ys[i]).join(", ")})$.`),
        nmVal("Berechnen Sie den Nenner $\\sum(y_i - \\bar y)^2$.", qs(r2.sst), 1, `$\\bar y = ${r2.yb.tex()}$.`),
        nmVal("Berechnen Sie $R^2$.", qs(r2.v), 1, `$R^2 = 1 - \\frac{${r2.sse.tex()}}{${r2.sst.tex()}} = ${r2.v.tex()}$.`),
        nmMC("Erklärt das Modell die Zielvariable besser als die reine Mittelwertsvorhersage $\\hat y_i = \\bar y$?", better
          ? ["Ja: $R^2 > 0$, der Fehler ist kleiner als der des Mittelwerts", "Nein: $R^2 < 0$", "Nein: $R^2$ müsste 1 sein", "Das lässt sich ohne Bias nicht sagen"]
          : ["Nein: $R^2 \\le 0$, das Modell ist nicht besser als der Mittelwert", "Ja: $R^2 > 0$", "Ja, jedes Modell ist besser als der Mittelwert", "Das lässt sich ohne Bias nicht sagen"], 1,
          "Ohne Bias ist nicht garantiert, dass das Modell mindestens so gut ist wie der Mittelwert — $R^2$ kann negativ werden."),
      ],
    };
  },
});

gkTask({
  id: "mlesse", topic: "reg", name: "Kleinste Quadrate = Gauß-Likelihood", like: "26-ss/2",
  make() {
    const s2 = nmPick([1, 2, 4]);
    return {
      intro: `<p>Die Zielwerte entstehen als $y_i = w^\\top x_i + \\varepsilon_i$ mit unabhängigem $\\varepsilon_i \\sim \\mathcal N(0, \\sigma^2)$, also $y_i \\sim \\mathcal N(w^\\top x_i, \\sigma^2)$, und $\\mathrm{Lik}(w) = \\prod_{i=1}^N\\mathcal N(y_i \\mid w^\\top x_i, \\sigma^2)$.</p>`,
      parts: [
        nmW("Zeigen Sie: die Maximierung der Log-Likelihood $\\log\\mathrm{Lik}(w)$ bezüglich $w$ ist äquivalent zur Minimierung der Summe der quadrierten Fehler $\\text{SSE}(w) = \\sum_i(y_i - w^\\top x_i)^2$.",
          `${tx(`\\log\\mathrm{Lik}(w) = \\sum_{i=1}^N\\Big[-\\tfrac12\\log(2\\pi\\sigma^2) - \\frac{(y_i - w^\\top x_i)^2}{2\\sigma^2}\\Big] = -\\frac N2\\log(2\\pi\\sigma^2) - \\frac{1}{2\\sigma^2}\\text{SSE}(w)`)}
           Der erste Summand hängt nicht von $w$ ab, $\\frac{1}{2\\sigma^2} > 0$. Also $\\arg\\max_w\\log\\mathrm{Lik}(w) = \\arg\\min_w\\text{SSE}(w)$.`,
          [[1, "Log des Produkts als Summe, Dichte eingesetzt"], [1, "Konstante unabhängig von $w$ erkannt, Vorzeichen umgedreht: Maximieren ↔ Minimieren"]]),
        nmMC(`Warum minimiert man in der Praxis die <b>negative</b> Log-Likelihood, statt die Likelihood direkt zu maximieren?`,
          ["Das Produkt vieler kleiner Zahlen wird numerisch winzig; die Log-Summe ist stabil und leichter abzuleiten, mit demselben Optimum", "Weil die Likelihood negativ sein kann", "Weil der Logarithmus das Optimum verschiebt", "Weil Optimierer nur Summen mit genau N Termen können"], 1,
          "log ist streng monoton: dasselbe Optimum. Aus dem Produkt wird eine Summe, die man ableiten kann (WS 25/26, 1-8)."),
        nmMC(`Bei $\\sigma^2 = ${s2}$: Wie hängen $-\\log\\mathrm{Lik}(w)$ und $\\text{MSE}(w) = \\frac1N\\text{SSE}(w)$ zusammen?`,
          [`$-\\log\\mathrm{Lik}(w) = c + \\frac{N}{${2 * s2}}\\,\\text{MSE}(w)$ mit einer Konstanten $c$`, `$-\\log\\mathrm{Lik}(w) = \\text{MSE}(w)$`, `$-\\log\\mathrm{Lik}(w) = ${2 * s2}N\\,\\text{MSE}(w)$`, "gar nicht"], 1,
          `$\\frac{1}{2\\sigma^2}\\text{SSE} = \\frac{N}{2\\sigma^2}\\text{MSE}$.`),
        nmMC("Welche Annahme braucht man für diese Äquivalenz?", ["Unabhängige Fehler mit gleicher, fester Varianz (Gauß)", "Gleichverteilte Fehler", "Bernoulli-Labels", "Keine"], 1, "Mit anderer Rauschverteilung kommt ein anderer Loss heraus (Bernoulli → Kreuzentropie)."),
      ],
    };
  },
});

gkTask({
  id: "ridge", topic: "reg", name: "Überanpassung und Regularisierung", like: "25-ss/3",
  make() {
    const xs = shuffle([1, 2, 3]).sort((a, b) => a - b), ys = xs.map((x) => 2 * x + rint(-1, 2));
    const lam = nmPick([nmQ(1, 3), nmQ(1), nmQ(2, 3), nmQ(2)]);
    const sxy = xs.reduce((s, x, i) => s + x * ys[i], 0), sxx = xs.reduce((s, x) => s + x * x, 0);
    const wls = nmQ(sxy, sxx), wr = nmQ(sxy).div(nmQ(sxx).add(lam.mul(3)));
    return {
      intro: `<p>Ein Polynom 12. Grades wird an verrauschte Daten angepasst; auf den Validierungsdaten ist der Fehler deutlich höher als auf den Trainingsdaten. Danach ein kleines Beispiel ohne Bias: $\\hat y = wx$, Daten ${xs.map((x, i) => `$(${x}, ${ys[i]})$`).join(", ")}, Loss $L_\\lambda(w) = \\frac{1}{2N}\\sum_i(y_i - wx_i)^2 + \\frac\\lambda2w^2$.</p>`,
      parts: [
        nmMC("Wie schätzen Sie Bias und Varianz des Polynom-Modells ein?", ["Kleiner Bias, große Varianz: Überanpassung", "Großer Bias, kleine Varianz: Unteranpassung", "Beide klein", "Beide groß"], 2, "Das flexible Modell folgt dem Rauschen der Trainingsdaten."),
        nmMC("Welche Maßnahme senkt den Validierungsfehler am ehesten?", ["L2-Regularisierung (Ridge) oder ein kleinerer Grad, gewählt auf der Validierung", "Den Grad auf 20 erhöhen", "Auf den Validierungsdaten weitertrainieren", "Die Lernrate erhöhen"], 1, "Große Gewichte bestrafen, Komplexität begrenzen."),
        nmVal("Berechnen Sie die Kleinste-Quadrate-Lösung $w_{LS} = \\frac{\\sum x_iy_i}{\\sum x_i^2}$.", qs(wls), 1, `$\\frac{${sxy}}{${sxx}} = ${wls.tex()}$.`),
        nmVal(`Berechnen Sie die Ridge-Lösung für $\\lambda = ${lam.tex()}$: $w_\\lambda = \\frac{\\sum x_iy_i}{\\sum x_i^2 + N\\lambda}$.`, qs(wr), 2, `Ableiten: $-\\frac1N\\sum x_i(y_i - wx_i) + \\lambda w = 0 \\Rightarrow w = \\frac{${sxy}}{${sxx} + 3\\cdot${lam.tex()}} = ${wr.tex()}$ — kleiner als $w_{LS}$.`),
        nmMC("Welche Regularisierung setzt viele Gewichte exakt auf null (Merkmalsauswahl)?", ["L1: $\\lambda\\sum_j|w_j|$", "L2: $\\frac\\lambda2\\sum_jw_j^2$", "Beide gleich oft", "Keine von beiden"], 1, "L1 (Lasso) gibt sparse Lösungen; L2 macht alle klein, aber kaum genau null."),
        nmMC("Polynomregression gilt als lineare Regression. Warum?", ["Sie ist linear in den Parametern; die Merkmale $x^j$ sind fest", "Sie ist linear in $x$", "Sie hat nur einen Parameter", "Weil sie keine Regularisierung braucht"], 1, "Im neuronalen Netz werden dagegen die Merkmale gelernt — nichtlinear in den Parametern."),
      ],
    };
  },
});

gkTask({
  id: "code-reg", topic: "reg", name: "Code verstehen: lineare Regression in NumPy", likeText: "neu ab WS 26/27: Programmier-Verständnis",
  make() {
    return {
      intro: `<p>Die Klausur enthält neu Aufgaben, in denen man Code ergänzt oder bewertet. <code>X</code> hat die Form <code>(N, D)</code>, <code>y</code> die Form <code>(N,)</code>.</p>`,
      parts: [
        nmMC(`Welche Zeile ergänzt die Einsenspalte für den Bias? ${pycode("Xt = ___")}`,
          ["<code>np.hstack([np.ones((N, 1)), X])</code>", "<code>np.vstack([np.ones(D), X])</code>", "<code>X + 1</code>", "<code>np.hstack([X, np.zeros((N, 1))])</code>"], 1, "Eine Spalte Einsen vorn: $\\tilde X$ hat die Form $(N, D + 1)$."),
        nmMC(`Welche Zeile löst die Normalgleichung? ${pycode("w = ___")}`,
          ["<code>np.linalg.solve(Xt.T @ Xt, Xt.T @ y)</code>", "<code>np.linalg.solve(Xt @ Xt.T, y)</code>", "<code>Xt.T @ y</code>", "<code>np.linalg.inv(Xt) @ y</code>"], 1, "$\\tilde X^\\top\\tilde X\\,\\tilde w = \\tilde X^\\top y$. <code>solve</code> statt <code>inv</code> ist stabiler; $\\tilde X$ selbst ist nicht quadratisch."),
        nmMC(`Was berechnet diese Zeile? ${pycode("mse = np.mean((y - Xt @ w) ** 2)")}`,
          ["Den mittleren quadratischen Fehler $\\frac1N\\sum(y_i - \\hat y_i)^2$", "Die Summe der Fehlerquadrate", "$R^2$", "Den Loss $\\frac{1}{2N}$SSE"], 1, "Mittelwert der quadrierten Residuen."),
        nmMC(`Ridge: welche Zeile ist richtig (mit $R = \\diag(0, 1, \\dots, 1)$)? ${pycode("R = np.eye(D + 1); R[0, 0] = 0\nw = ___")}`,
          ["<code>np.linalg.solve(Xt.T @ Xt + N * lam * R, Xt.T @ y)</code>", "<code>np.linalg.solve(Xt.T @ Xt - lam * R, Xt.T @ y)</code>", "<code>np.linalg.solve(Xt.T @ Xt, Xt.T @ y) + lam</code>", "<code>np.linalg.solve(Xt.T @ Xt + lam, Xt.T @ y)</code>"], 1, "$(\\tilde X^\\top\\tilde X + N\\lambda R)\\tilde w = \\tilde X^\\top y$; die Null in $R$ lässt den Bias frei."),
        nmMC(`Wo steckt der Fehler? ${pycode("mu, sd = X.mean(0), X.std(0)          # über ALLE Daten\nX_tr, X_te = (X[:800] - mu) / sd, (X[800:] - mu) / sd")}`,
          ["Mittelwert und Skalierung werden auch auf den Testdaten gefittet — nur auf den Trainingsdaten fitten", "<code>std</code> statt <code>var</code>", "Die Aufteilung 800/200 ist verboten", "Kein Fehler"], 2, "Vorverarbeitung nur auf den Trainingsdaten fitten (VL 3), sonst sickert Information aus dem Test ein."),
      ],
    };
  },
});

/* ================================================================ Wahrscheinlichkeit */

gkTask({
  id: "joint", topic: "prob", name: "Gemeinsame Verteilung, Randverteilung, Bayes", likeText: "Übung 2, Aufgabe 2(a)",
  make() {
    let v;
    do { v = [rint(1, 8), rint(1, 8), rint(1, 8)].map((x) => x * 5); } while (v.reduce((a, b) => a + b) >= 95);
    v.push(100 - v.reduce((a, b) => a + b));
    const [a, b, c, d] = v.map((x) => nmQ(x, 100));
    const [R, Rn, C, Cn] = nmPick([["M", "\\neg M", "F", "\\neg F"], ["S", "\\neg S", "K", "\\neg K"], ["A", "\\neg A", "B", "\\neg B"]]);
    const pR = a.add(b), pC = a.add(c);
    return {
      intro: `<p>Die gemeinsame Verteilung zweier binärer Größen:</p>
        <table class="len-terms nm-tab nm-data-tab"><thead><tr><th></th><th>$${C}$</th><th>$${Cn}$</th></tr></thead><tbody>
        <tr><th>$${R}$</th><td>${nmD(+a, 2)}</td><td>${nmD(+b, 2)}</td></tr><tr><th>$${Rn}$</th><td>${nmD(+c, 2)}</td><td>${nmD(+d, 2)}</td></tr></tbody></table>`,
      parts: [
        nmVal(`Bestimmen Sie die Randverteilungen $P(${R})$; $P(${C})$.`, ql([pR, pC]), 2, `Zeile bzw. Spalte summieren: $${gt(+a, 2)} + ${gt(+b, 2)} = ${gt(+pR, 2)}$, $${gt(+a, 2)} + ${gt(+c, 2)} = ${gt(+pC, 2)}$.`),
        nmVal(`Bestimmen Sie $P(${R} \\mid ${C})$.`, qs(a.div(pC)), 1, `$\\frac{P(${R}, ${C})}{P(${C})} = \\frac{${gt(+a, 2)}}{${gt(+pC, 2)}} = ${a.div(pC).tex()}$.`),
        nmVal(`Bestimmen Sie $P(${C} \\mid ${R})$.`, qs(a.div(pR)), 1, `$\\frac{${gt(+a, 2)}}{${gt(+pR, 2)}} = ${a.div(pR).tex()}$.`),
        nmW(`Rechnen Sie $P(${C} \\mid ${R})$ mit dem Satz von Bayes aus $P(${R} \\mid ${C})$ nach und erklären Sie, warum die beiden bedingten Wahrscheinlichkeiten verschieden sind.`,
          `$P(${C} \\mid ${R}) = \\frac{P(${R} \\mid ${C})P(${C})}{P(${R})} = \\frac{${a.div(pC).tex()}\\cdot ${gt(+pC, 2)}}{${gt(+pR, 2)}} = ${a.div(pR).tex()}$. Sie unterscheiden sich, weil die Priors $P(${C}) = ${gt(+pC, 2)}$ und $P(${R}) = ${gt(+pR, 2)}$ verschieden sind: man teilt dieselbe gemeinsame Wahrscheinlichkeit durch verschiedene Ränder.`,
          [[1, "Bayes richtig eingesetzt"], [1, "Begründung über die verschiedenen Randwahrscheinlichkeiten (Prior)"]]),
      ],
    };
  },
});

gkTask({
  id: "bayes2", topic: "prob", name: "Bayes mit zwei Sensoren", like: "23-ss/2",
  make() {
    const prior = nmPick([nmQ(1, 4), nmQ(1, 5), nmQ(1, 3), nmQ(1, 10)]);
    const l1d = nmPick([nmQ(3, 4), nmQ(4, 5), nmQ(2, 3), nmQ(9, 10)]), l1n = nmPick([nmQ(1, 2), nmQ(1, 4), nmQ(1, 5), nmQ(1, 3)]);
    const l2d = nmPick([nmQ(1), nmQ(3, 4), nmQ(9, 10)]), l2n = nmPick([nmQ(1, 2), nmQ(1, 3), nmQ(1, 4)]);
    const neg = nmQ(1).sub(prior);
    const py1 = l1d.mul(prior).add(l1n.mul(neg)), post1 = l1d.mul(prior).div(py1);
    const num2 = l2d.mul(l1d).mul(prior), post2 = num2.div(num2.add(l2n.mul(l1n).mul(neg)));
    return {
      intro: `<p>Eine Maschine prüft Bauteile: $p(\\text{defekt}) = ${prior.tex()}$. Eine Kamera liefert die Beobachtung $y_1$ mit $p(y_1 \\mid \\text{defekt}) = ${l1d.tex()}$ und $p(y_1 \\mid \\text{intakt}) = ${l1n.tex()}$.
        Ein zweiter Sensor liefert $y_2$ mit $p(y_2 \\mid \\text{defekt}) = ${l2d.tex()}$, $p(y_2 \\mid \\text{intakt}) = ${l2n.tex()}$; gegeben den Zustand sind die Beobachtungen unabhängig.</p>`,
      parts: [
        nmMC("Wie heißen die Terme in $p(\\text{defekt} \\mid y_1) = \\frac{p(y_1 \\mid \\text{defekt})\\,p(\\text{defekt})}{p(y_1)}$ (in dieser Reihenfolge: links, Zähler 1, Zähler 2, Nenner)?",
          ["Posterior, Likelihood, Prior, Evidenz", "Prior, Posterior, Likelihood, Evidenz", "Likelihood, Prior, Posterior, Evidenz", "Evidenz, Likelihood, Prior, Posterior"], 1, "Die Evidenz normiert."),
        nmVal("Berechnen Sie $p(y_1)$ mit der totalen Wahrscheinlichkeit.", qs(py1), 1, `$p(y_1) = p(y_1 \\mid d)p(d) + p(y_1 \\mid \\neg d)p(\\neg d) = ${l1d.tex()}\\cdot${prior.tex()} + ${l1n.tex()}\\cdot${neg.tex()} = ${py1.tex()}$.`),
        nmVal("Berechnen Sie $p(\\text{defekt} \\mid y_1)$.", qs(post1), 2, `$\\frac{${l1d.mul(prior).tex()}}{${py1.tex()}} = ${post1.tex()}$.`),
        nmVal("Berechnen Sie $p(\\text{defekt} \\mid y_1, y_2)$.", qs(post2), 3,
          `Der Posterior nach $y_1$ ist der neue Prior: $p(d \\mid y_1, y_2) = \\frac{p(y_2 \\mid d)\\,p(d \\mid y_1)}{p(y_2 \\mid d)p(d \\mid y_1) + p(y_2 \\mid \\neg d)p(\\neg d \\mid y_1)} = ${post2.tex()}$.`),
      ],
    };
  },
});

gkTask({
  id: "mle", topic: "prob", name: "Maximum-Likelihood-Schätzung", likeText: "Übung 2, Aufgabe 2(b); VL 2",
  make() {
    const N = rint(6, 20), k = rint(1, N - 1);
    const m = rint(2, 6), dv = rint(1, 3), data = shuffle([m - dv, m, m + dv + rint(0, 1) * 3]);
    const mu = nmQ(data.reduce((a, b) => a + b), 3), s2 = data.reduce((s, x) => s.add(nmQ(x).sub(mu).mul(nmQ(x).sub(mu))), nmQ(0)).div(3);
    return {
      intro: `<p>Eine Münze zeigt mit unbekannter Wahrscheinlichkeit $\\pi$ Kopf. Bei $N = ${N}$ unabhängigen Würfen kommt $k = ${k}$-mal Kopf. Außerdem: die Messwerte $x = (${data.join(", ")})$, modelliert als i.i.d. $\\mathcal N(\\mu, \\sigma^2)$.</p>`,
      parts: [
        nmMC("Welche Log-Likelihood hat die Münze?", [`$${k}\\log\\pi + ${N - k}\\log(1 - \\pi)$`, `$\\pi^{${k}}(1 - \\pi)^{${N - k}}$`, `$${k}\\pi + ${N - k}(1 - \\pi)$`, `$\\log\\pi^{${N}}$`], 1, `$\\log\\big(\\pi^k(1 - \\pi)^{N-k}\\big)$. Die zweite ist die Likelihood selbst.`),
        nmVal("Bestimmen Sie die ML-Schätzung $\\hat\\pi$.", qs(nmQ(k, N)), 1, `$\\frac{k}{\\pi} - \\frac{N - k}{1 - \\pi} = 0 \\Rightarrow \\hat\\pi = \\frac kN = ${nmQ(k, N).tex()}$.`),
        nmMC("Drei Würfe, dreimal Kopf. Ist $\\hat\\pi = 1$ sinnvoll für die Vorhersage?", ["Nein: bei so wenig Daten überanpasst die ML-Schätzung, Zahl wäre unmöglich", "Ja, die Münze zeigt immer Kopf", "Ja, ML ist immer optimal", "Nein, weil $\\hat\\pi$ immer 0,5 sein muss"], 1, "Ein Prior (z. B. $\\frac{k+1}{N+2}$) wäre vorsichtiger."),
        nmVal("Bestimmen Sie $\\hat\\mu$ und $\\hat\\sigma^2$ (MLE): $\\hat\\mu$; $\\hat\\sigma^2$.", ql([mu, s2]), 2, `$\\hat\\mu = ${mu.tex()}$, $\\hat\\sigma^2 = \\frac13\\sum(x_i - \\hat\\mu)^2 = ${s2.tex()}$ — mit $\\frac1N$, nicht $\\frac{1}{N-1}$.`),
      ],
    };
  },
});

/* ================================================================ Klassifikation */

gkTask({
  id: "metrics", topic: "cls", name: "Konfusionsmatrix und Kennzahlen", like: "2526-ws/1",
  make() {
    const TP = rint(20, 90), FN = rint(5, 40), FP = rint(5, 60), TN = rint(300, 900);
    const q = (a, b) => nmQ(a, b);
    return {
      intro: `<p>Ein Klassifikator für eine seltene Krankheit wurde auf ${TP + FN + FP + TN} Personen getestet.</p>${gkConfTable({ TP, FN, FP, TN }, "krank", "gesund")}`,
      parts: [
        nmVal("Berechnen Sie die Precision.", qs(q(TP, TP + FP)), 1, `$\\frac{TP}{TP + FP} = \\frac{${TP}}{${TP + FP}} \\approx ${gt(TP / (TP + FP), 3)}$.`),
        nmVal("Berechnen Sie den Recall.", qs(q(TP, TP + FN)), 1, `$\\frac{TP}{TP + FN} = \\frac{${TP}}{${TP + FN}} \\approx ${gt(TP / (TP + FN), 3)}$.`),
        nmVal("Berechnen Sie $F_1$.", qs(q(2 * TP, 2 * TP + FP + FN)), 1, `$\\frac{2TP}{2TP + FP + FN} = \\frac{${2 * TP}}{${2 * TP + FP + FN}} \\approx ${gt((2 * TP) / (2 * TP + FP + FN), 3)}$.`),
        nmVal("Berechnen Sie die Accuracy.", qs(q(TP + TN, TP + TN + FP + FN)), 1, `$\\frac{${TP + TN}}{${TP + TN + FP + FN}} \\approx ${gt((TP + TN) / (TP + TN + FP + FN), 3)}$.`),
        nmW("Warum ist die Accuracy bei seltenen Klassen (z. B. 2 von 100 krank) irreführend? Nennen Sie eine besser geeignete Metrik.",
          "Ein Modell, das immer „gesund“ vorhersagt, erreicht schon 98 % Accuracy und erkennt doch keinen einzigen Fall. Besser: Recall (Anteil erkannter Kranker), Precision, $F_1$ oder ROC/AUC.",
          [[1, "Beispiel: immer die Mehrheitsklasse vorhersagen gibt hohe Accuracy"], [1, "eine passende Metrik mit kurzer Begründung"]]),
      ],
    };
  },
});

gkTask({
  id: "prev", topic: "cls", name: "Prävalenz und Modellauswahl", likeText: "VL 3, Kurzcheck",
  make() {
    const pi = nmPick([1, 2, 5]), tpr = nmPick([80, 90, 95]), fpr = nmPick([5, 10, 20]), N = nmPick([1000, 10000]);
    const P = (N * pi) / 100, TP = (P * tpr) / 100, FP = ((N - P) * fpr) / 100;
    const nF = 100, A = [rint(30, 50), rint(5, 15)], B = [rint(60, 80), rint(20, 40)];
    const ok = ([tp, fp]) => tp / nF >= 0.6 && tp / (tp + fp) >= 0.65;
    const pick = ok(B) && !ok(A) ? "Modell B" : ok(A) && !ok(B) ? "Modell A" : ok(A) ? "beide" : "keines";
    const optsAll = ["Modell A", "Modell B", "beide", "keines"];
    return {
      intro: `<p>Ein Test hat TPR $= ${gt(tpr / 100, 2)}$ und FPR $= ${gt(fpr / 100, 2)}$; die Prävalenz ist $\\pi = ${pi}\\,\\%$, getestet werden $N = ${N}$ Personen.
        Danach: Validierungsdaten mit 100 Betrugsfällen. Modell A markiert ${A[0]} richtig bei ${A[1]} Fehlalarmen, Modell B ${B[0]} richtig bei ${B[1]} Fehlalarmen. Gefordert: Recall $\\ge 0{,}6$ und Precision $\\ge 0{,}65$.</p>`,
      parts: [
        nmVal("Wie viele echte Positive (erwartet)?", TP, 1, `$\\text{TPR}\\cdot\\pi\\cdot N = ${gt(tpr / 100, 2)}\\cdot${gt(pi / 100, 2)}\\cdot${N} = ${TP}$.`),
        nmVal("Wie viele Fehlalarme (erwartet)?", FP, 1, `$\\text{FPR}\\cdot(1 - \\pi)\\cdot N = ${FP}$.`),
        nmVal("Wie groß ist die Precision?", qs(TP / (TP + FP)), 1, `$\\frac{${TP}}{${TP} + ${FP}} \\approx ${gt(TP / (TP + FP), 3)}$ — die meisten Alarme sind Fehlalarme.`),
        nmMC("Welches Betrugsmodell erfüllt beide Anforderungen?", [pick, ...optsAll.filter((o) => o !== pick)], 2,
          `A: Recall $${gt(A[0] / 100, 2)}$, Precision $\\frac{${A[0]}}{${A[0] + A[1]}} \\approx ${gt(A[0] / (A[0] + A[1]), 2)}$. B: Recall $${gt(B[0] / 100, 2)}$, Precision $\\frac{${B[0]}}{${B[0] + B[1]}} \\approx ${gt(B[0] / (B[0] + B[1]), 2)}$.`, true),
        nmMC("Ist das Validierungsergebnis die finale Bewertung des gewählten Modells?", ["Nein: es diente der Auswahl; die finale Leistung schätzt man auf ungesehenen Testdaten", "Ja", "Ja, wenn die Validierung groß genug ist", "Nein, man nimmt die Trainingsdaten"], 1, "Wer auf der Validierung auswählt, schätzt dort zu optimistisch."),
      ],
    };
  },
});

gkTask({
  id: "thresh", topic: "cls", name: "Schwelle, ROC-Punkt und AUC", likeText: "VL 3",
  make() {
    const ps = shuffle([0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2]).slice(0, 6).sort((a, b) => b - a);
    let ys;
    do { ys = ps.map(() => rint(0, 1)); } while (ys.filter((y) => y).length < 2 || ys.filter((y) => !y).length < 2);
    const tau = nmPick(ps.slice(1, 5));
    const pos = ps.filter((_, i) => ys[i]), neg = ps.filter((_, i) => !ys[i]);
    const c = gkConf(pos, neg, tau);
    let pairs = 0;
    pos.forEach((p) => neg.forEach((n) => (pairs += p > n ? 1 : 0)));
    return {
      intro: `<p>Paare (Wahrscheinlichkeit $p$; Label $y$): ${ps.map((p, i) => `$(${gt(p, 2)};\\,${ys[i]})$`).join(", ")}. Positiv vorhergesagt wird $p \\ge \\tau$ mit $\\tau = ${gt(tau, 2)}$.</p>`,
      parts: [
        nmVal("Bestimmen Sie TP; FP; FN; TN.", ql([c.TP, c.FP, c.FN, c.TN]), 2, `${gkConfTable(c)}`),
        nmVal("Precision; Recall.", ql([nmQ(c.TP, c.TP + c.FP), nmQ(c.TP, c.TP + c.FN)]), 2, `$\\frac{${c.TP}}{${c.TP + c.FP}}$ und $\\frac{${c.TP}}{${c.TP + c.FN}}$.`),
        nmVal("Welcher Punkt (FPR; TPR) der ROC-Kurve gehört zu dieser Schwelle?", ql([nmQ(c.FP, c.FP + c.TN), nmQ(c.TP, c.TP + c.FN)]), 1, `FPR $= \\frac{FP}{FP + TN} = \\frac{${c.FP}}{${c.FP + c.TN}}$, TPR = Recall.`),
        nmVal("Berechnen Sie die AUC als Anteil korrekt geordneter Positiv-Negativ-Paare.", qs(nmQ(pairs, pos.length * neg.length)), 2, `${pairs} von ${pos.length}·${neg.length} = ${pos.length * neg.length} Paaren haben das Positive vorn: $${nmQ(pairs, pos.length * neg.length).tex()}$.`),
        nmMC("Was passiert mit dem Recall, wenn $\\tau$ sinkt?", ["Er steigt oder bleibt gleich", "Er sinkt", "Er bleibt immer gleich", "Er kann beliebig schwanken"], 1, "Es kommen nur positive Vorhersagen dazu. Die Precision dagegen kann fallen."),
      ],
    };
  },
});

// σ and ln to two decimals, for hints.
const gkHintSig = (z) => `$\\sigma(${gt(z, 2)}) \\approx ${gt(gkSig(z), 2)}$`;
gkTask({
  id: "logpoint", topic: "cls", name: "Logistische Regression: ein Gradientenschritt", likeText: "VL 3, Folie „Ein Punkt“",
  make() {
    let x, w, z;
    do {
      x = [rint(-2, 2), rint(-2, 2)];
      w = [nmPick([-1, -0.5, 0, 0.5, 1]), nmPick([-1, -0.5, 0.5, 1, 2]), nmPick([-1, -0.5, 0.5, 1])];
      z = w[0] + w[1] * x[0] + w[2] * x[1];
    } while (Math.abs(z) > 2.5 || (x[0] === 0 && x[1] === 0));
    const y = rint(0, 1), p = +gkSig(z).toFixed(2), eta = nmPick([0.5, 1]);
    const l = -Math.log(y ? p : 1 - p), xt = [1, ...x], g = xt.map((v) => (p - y) * v), wn = w.map((v, j) => v - eta * g[j]);
    return {
      intro: `${tx(`x = ${tcv(x)},\\quad y = ${y},\\quad \\tilde w = ${tcv(w.map((v) => gt(v, 2)))}\\ (\\text{vorn } b)`)}<p class="small">Hinweise: ${gkHintSig(z)}, $\\ln ${gt(y ? p : 1 - p, 2)} \\approx ${gt(Math.log(y ? p : 1 - p), 2)}$. Rechnen Sie mit $p = ${gt(p, 2)}$ weiter.</p>`,
      parts: [
        nmVal("Berechnen Sie den Score $z = \\tilde w^\\top\\tilde x$.", qs(z), 1, `$${gt(w[0], 2)} + ${gt(w[1], 2)}\\cdot${x[0]} + ${gt(w[2], 2)}\\cdot${x[1]} = ${gt(z, 2)}$.`),
        nmVal("Berechnen Sie den Einzelverlust $l = -y\\ln p - (1 - y)\\ln(1 - p)$.", qs(l), 1, `Für $y = ${y}$ bleibt $-\\ln ${y ? "p" : "(1 - p)"} \\approx ${gt(l, 2)}$.`),
        nmVal("Berechnen Sie den Gradienten $\\nabla_{\\tilde w}l = (p - y)\\tilde x$ (drei Werte).", ql(g), 2, `$(${gt(p, 2)} - ${y})\\cdot(1, ${x[0]}, ${x[1]})^\\top = ${tcv(g.map((v) => gt(v, 3)))}$.`),
        nmVal(`Führen Sie einen Gradientenschritt mit $\\eta = ${gt(eta, 1)}$ aus: $\\tilde w_{\\text{neu}}$ (drei Werte).`, ql(wn), 2, `$\\tilde w - \\eta\\nabla l = ${tcv(wn.map((v) => gt(v, 3)))}$. Der Score bewegt sich in Richtung des Labels.`),
        nmW("Zeigen Sie mit der Kettenregel, dass $\\nabla_{\\tilde w}l = (p - y)\\tilde x$.",
          `$\\frac{\\partial l}{\\partial p} = -\\frac yp + \\frac{1 - y}{1 - p} = \\frac{p - y}{p(1 - p)}$, $\\frac{\\partial p}{\\partial z} = \\sigma'(z) = p(1 - p)$, $\\nabla_{\\tilde w}z = \\tilde x$. Produkt: $(p - y)\\tilde x$ — der Faktor $p(1 - p)$ kürzt sich.`,
          [[1, "die drei Faktoren der Kettenregel"], [1, "$\\sigma' = \\sigma(1 - \\sigma)$ und das Kürzen"]]),
      ],
    };
  },
});

gkTask({
  id: "softmax", topic: "cls", name: "Softmax und Kreuzentropie", like: "2324-ws/2",
  make() {
    const a = shuffle([2, 1, 0, nmPick([0, 1, -1])]).slice(0, 3);
    const yk = rint(1, 3), e = a.map(Math.exp), s = e.reduce((x, y) => x + y), p = e.map((v) => +(v / s).toFixed(2));
    const g = p.map((v, k) => v - +(k === yk - 1));
    return {
      intro: `${tx(`a = ${tcv(a)},\\qquad \\text{wahre Klasse: } ${yk}`)}<p class="small">Hinweise: $e^{-1} \\approx 0{,}37$, $e^0 = 1$, $e^1 \\approx 2{,}72$, $e^2 \\approx 7{,}39$; $\\ln ${gt(p[yk - 1], 2)} \\approx ${gt(Math.log(p[yk - 1]), 2)}$.</p>`,
      parts: [
        nmMC("Wie lautet die Softmax?", ["$p_k = \\frac{\\exp(a_k)}{\\sum_j\\exp(a_j)}$", "$p_k = \\frac{a_k}{\\sum_ja_j}$", "$p_k = \\sigma(a_k)$", "$p_k = \\frac{\\exp(a_k)}{\\exp(\\sum_ja_j)}$"], 1, "Positiv und auf Summe 1 normiert."),
        nmVal("Berechnen Sie $p$ (drei Werte, zwei Nachkommastellen).", ql(p), 2, `$\\sum_j e^{a_j} \\approx ${gt(s, 2)}$, $p \\approx ${tcv(p.map((v) => gt(v, 2)))}$.`),
        nmVal("Berechnen Sie die Kreuzentropie $l = -\\sum_k y_k\\ln p_k$.", qs(-Math.log(p[yk - 1])), 1, `Nur die wahre Klasse zählt: $-\\ln p_${yk} \\approx ${gt(-Math.log(p[yk - 1]), 2)}$.`),
        nmVal("Berechnen Sie den Gradienten nach den Scores, $p - y$ (drei Werte).", ql(g), 2, `$y = ${tcv([0, 1, 2].map((k) => +(k === yk - 1)))}$.`),
        nmMC("Ist der Loss null, wenn die vorhergesagte Klasse (argmax) stimmt?", ["Nein — nur wenn $p_{\\text{wahr}} = 1$", "Ja", "Nur bei $K = 2$", "Ja, wenn $p_{\\text{wahr}} > 0{,}5$"], 1, "$-\\ln p_{\\text{wahr}} > 0$ für $p_{\\text{wahr}} < 1$."),
      ],
    };
  },
});

gkTask({
  id: "clsconcept", topic: "cls", name: "Klassifikation: Verlust und Merkmale", like: "2324-ws/2",
  make() {
    return {
      intro: `<p>Obst soll klassifiziert werden; jedes Stück ist ein Vektor $x$. Zuerst zwei Sorten mit Labels 0 (Äpfel) und 1 (Birnen), linear separierbar; ein linearer Klassifikator $f(\\tilde x) = \\tilde w^\\top\\tilde x$ mit Schwelle 0,5.</p>`,
      parts: [
        nmW("Warum ist der lineare Klassifikator mit dem mittleren quadratischen Fehler als Loss schlecht für Klassifikation geeignet? Beschreiben Sie einen Datensatz, bei dem es schiefgeht.",
          "Die Labels sind 0/1, der lineare Output ist unbegrenzt. Punkte weit von der Grenze haben große Fehler, obwohl sie richtig liegen, und ziehen die Grenze zu sich. Beispiel: zwei trennbare Klassen, eine davon mit einigen weit entfernten Punkten (Ausreißern) — die Least-Squares-Grenze verschiebt sich und klassifiziert Punkte falsch.",
          [[1, "unbegrenzter Output gegen Labels 0/1"], [1, "weit entfernte (richtige) Punkte dominieren den Loss"], [1, "Beispiel mit Ausreißern"]]),
        nmMC("Welche Funktion und welcher Loss werden stattdessen verwendet?", ["Sigmoid $\\sigma(z) = \\frac{1}{1 + e^{-z}}$ und binäre Kreuzentropie", "ReLU und MSE", "Softmax und MSE", "Identität und Kreuzentropie"], 2, "Werte in $(0, 1)$, die Kreuzentropie ist die negative Bernoulli-Log-Likelihood."),
        nmMC("Dazu kommen Bananen und Orangen (vier Klassen). Welche Funktion?", ["Softmax: $p_k = \\frac{e^{a_k}}{\\sum_j e^{a_j}}$", "Vier Sigmoids, die man addiert", "ReLU", "Argmax ohne Wahrscheinlichkeiten"], 2, "Ein Score pro Klasse, normiert."),
        nmW("Die Klassen seien nicht linear separierbar: eine Klasse innen, die andere als Ring. Wie gehen Sie vor?",
          "Eine passende Merkmalstransformation wählen, z. B. $\\phi(x) = x_1^2 + x_2^2$. Im Merkmalsraum trennt dann eine Schwelle $c$ linear; im Eingaberaum ist die Grenze der Kreis $x_1^2 + x_2^2 = c$.",
          [[1, "Merkmalstransformation / Basisfunktion"], [1, "konkretes Merkmal und Grenze"]]),
      ],
    };
  },
});

gkTask({
  id: "code-cls", topic: "cls", name: "Code verstehen: logistische Regression", likeText: "neu ab WS 26/27: Programmier-Verständnis",
  make() {
    return {
      intro: `<p><code>Xt</code> hat die Form <code>(N, D + 1)</code> mit Einsenspalte, <code>y</code> Labels 0/1 der Form <code>(N,)</code>, <code>w</code> die Form <code>(D + 1,)</code>.</p>`,
      parts: [
        nmMC(`Welche Zeile berechnet den Gradienten des mittleren Kreuzentropie-Loss? ${pycode("p = 1 / (1 + np.exp(-(Xt @ w)))\ngrad = ___")}`,
          ["<code>Xt.T @ (p - y) / N</code>", "<code>Xt @ (p - y) / N</code>", "<code>(p - y) * p * (1 - p)</code>", "<code>Xt.T @ (y - p) * N</code>"], 2, "$\\nabla L = \\frac1N\\tilde X^\\top(p - y)$: Form $(D + 1,)$."),
        nmMC(`Welche Zeile ist ein Schritt des Gradientenabstiegs? ${pycode("eta = 0.1\nw = ___")}`, ["<code>w - eta * grad</code>", "<code>w + eta * grad</code>", "<code>eta * grad</code>", "<code>w / grad</code>"], 1, "Entgegen dem Gradienten."),
        nmMC(`Was gibt diese Zeile zurück? ${pycode("y_hat = (p >= 0.5).astype(int)")}`, ["Die Klassenentscheidungen mit Schwelle 0,5", "Die Wahrscheinlichkeiten", "Den Loss", "Die Accuracy"], 1, "Entscheidung $\\hat y = 1$ für $p \\ge \\tau$."),
        nmMC(`Warum zieht man hier das Maximum ab? ${pycode("e = np.exp(a - a.max())\np = e / e.sum()")}`, ["Damit <code>exp</code> nicht überläuft — das Ergebnis ändert sich nicht", "Damit die Summe 0 ist", "Das ändert die Klasse", "Für die Kreuzentropie"], 1, "Softmax hängt nur von Differenzen der Scores ab."),
        nmMC(`Welche Zeile berechnet die Precision? ${pycode("tp = np.sum((y_hat == 1) & (y == 1))\nfp = np.sum((y_hat == 1) & (y == 0))\nfn = np.sum((y_hat == 0) & (y == 1))\nprecision = ___")}`,
          ["<code>tp / (tp + fp)</code>", "<code>tp / (tp + fn)</code>", "<code>(tp + fp) / len(y)</code>", "<code>fp / (fp + tp)</code>"], 1, "Anteil echter Positiver unter den positiven Vorhersagen."),
      ],
    };
  },
});

/* ================================================================ Gradientenabstieg */

gkTask({
  id: "gd1d", topic: "opt", name: "Gradientenabstieg auf einer Parabel", like: "24-ss/2",
  make() {
    const a = nmPick([1, 2, 3]), c = rint(-1, 2), th0 = c + nmPick([2, 3, 4, -2, -3]);
    const eta = nmPick([nmQ(1, 10), nmQ(1, 8), nmQ(1, 4), nmQ(1, 2 * a), nmQ(1, a), nmQ(3, 4 * a)].filter((e) => +e > 0 && +e <= 1));
    const d = (t) => nmQ(2 * a).mul(nmQ(t).sub(c));
    const t1 = nmQ(th0).sub(eta.mul(d(th0))), t2 = t1.sub(eta.mul(nmQ(2 * a).mul(t1.sub(c))));
    const f = nmQ(1).sub(eta.mul(2 * a));
    const beh = f.zero ? "Ein Schritt ins Minimum" : +f > 0 ? "Monotone Konvergenz" : +f > -1 ? "Konvergenz mit Hin-und-her-Springen" : +f === -1 ? "Ewiges Hin-und-her ohne Konvergenz" : "Divergenz";
    return {
      intro: `${tx(`L(\\theta) = ${a === 1 ? "" : a}(\\theta ${c < 0 ? "+" : "-"} ${Math.abs(c)})^2,\\qquad \\theta_0 = ${th0},\\qquad \\eta = ${eta.tex()}`)}`,
      parts: [
        nmMC("Wie lautet die Update-Regel?", ["$\\theta_{t+1} = \\theta_t - \\eta L'(\\theta_t)$", "$\\theta_{t+1} = \\theta_t + \\eta L'(\\theta_t)$", "$\\theta_{t+1} = \\eta L'(\\theta_t)$", "$\\theta_{t+1} = \\theta_t - L(\\theta_t)/\\eta$"], 1, "Entgegen dem Gradienten."),
        nmVal("Berechnen Sie $L'(\\theta_0)$.", qs(d(th0)), 1, `$L'(\\theta) = ${2 * a}(\\theta ${c < 0 ? "+" : "-"} ${Math.abs(c)})$, also $${d(th0).tex()}$.`),
        nmVal("Berechnen Sie $\\theta_1$; $\\theta_2$.", ql([t1, t2]), 2, `$\\theta_1 = ${th0} - ${eta.tex()}\\cdot${d(th0).tex()} = ${t1.tex()}$, $\\theta_2 = ${t2.tex()}$. Pro Schritt: $\\theta_{t+1} - ${c} = (1 - ${2 * a}\\eta)(\\theta_t - ${c})$, Faktor $${f.tex()}$.`),
        nmMC("Wie verhält sich das Verfahren mit dieser Lernrate?", [beh, ...["Ein Schritt ins Minimum", "Monotone Konvergenz", "Konvergenz mit Hin-und-her-Springen", "Divergenz", "Ewiges Hin-und-her ohne Konvergenz"].filter((x) => x !== beh).slice(0, 3)], 1, `Faktor $1 - 2a\\eta = ${f.tex()}$.`, true),
        nmVal("Mit welcher Lernrate ist man nach einem Schritt im Minimum?", qs(nmQ(1, 2 * a)), 1, `$1 - ${2 * a}\\eta = 0 \\Rightarrow \\eta = ${nmQ(1, 2 * a).tex()}$.`),
      ],
    };
  },
});

gkTask({
  id: "batch", topic: "opt", name: "Batch, Mini-Batch und SGD", like: "2324-ws/1",
  make() {
    const N = nmPick([600, 1000, 1200, 2000, 5000, 60000]), B = nmPick([32, 50, 64, 100, 128, 256]);
    const g = [rint(-3, 5), rint(-3, 5), rint(-3, 5), rint(-3, 5)];
    return {
      intro: `<p>$N = ${N}$ Trainingsbeispiele, Mini-Batch-Größe $B = ${B}$ (der letzte, kleinere Batch wird verwendet). Für einen skalaren Parameter haben vier Beispiele am selben Parameterstand die Einzelgradienten $${g.join(",\\ ")}$.</p>`,
      parts: [
        nmVal("Updates pro Epoche: Batch-GD; Mini-Batch; SGD.", ql([1, Math.ceil(N / B), N]), 2, `Batch $1$, Mini-Batch $\\lceil ${N}/${B}\\rceil = ${Math.ceil(N / B)}$, SGD $N = ${N}$.`),
        nmVal("Der volle Gradient dieser vier Beispiele; der Mini-Batch-Gradient aus den ersten zwei; der aus den letzten zwei.", ql([nmQ(g[0] + g[1] + g[2] + g[3], 4), nmQ(g[0] + g[1], 2), nmQ(g[2] + g[3], 2)]), 2,
          "Mittelwerte. Einzelne Mini-Batches zeigen in verschiedene Richtungen, im Erwartungswert ergeben sie den vollen Gradienten."),
        nmW("Erklären Sie den Unterschied zwischen Batch-GD und Mini-Batch-GD und nennen Sie je einen Vor- und Nachteil.",
          "Batch-GD nutzt für jedes Update alle $N$ Beispiele: + exakter Gradient, stabile Konvergenz; − teuer pro Update, viel Speicher, langsam bei großem $N$. Mini-Batch nutzt $B$ Beispiele: + viele billige Updates, nutzt Hardware parallel, Rauschen hilft aus flachen Stellen; − verrauschter Gradient, schwankender Loss, Lernrate/Batchgröße müssen abgestimmt werden.",
          [[1, "Unterschied: alle Daten gegen Teilmenge pro Update"], [1, "Vor- und Nachteil Batch-GD"], [1, "Vor- und Nachteil Mini-Batch"]]),
        nmMC("Zwei Läufe mit gleicher Zahl an Updates: haben sie gleiches Rechenbudget?", ["Nein — Beispiele pro Update, Hardware und Overhead unterscheiden sich", "Ja, immer", "Nur bei SGD", "Ja, wenn die Lernrate gleich ist"], 1, "Vergleichen nach Updates, verarbeiteten Beispielen oder tatsächlicher Zeit."),
      ],
    };
  },
});

/* ================================================================ Neuronale Netze (VL 4/5) */

gkTask({
  id: "mlpparams", topic: "nn", name: "Parameter eines MLP zählen", like: "24-ss/2",
  make() {
    const d = nmPick([10, 20, 100, 784, 1000]), hs = shuffle([50, 100, 200, 500]).slice(0, rint(2, 3)), k = nmPick([1, 10]);
    const sizes = [d, ...hs, k], W = sizes.slice(1).map((s, i) => sizes[i] * s), Bs = sizes.slice(1).reduce((a, b) => a + b, 0);
    const big = W.indexOf(Math.max(...W));
    const names = sizes.slice(1).map((_, i) => (i === sizes.length - 2 ? "Output" : `Hidden ${i + 1}`));
    return {
      intro: `<p>Ein vollständig verbundenes Netz mit Eingabe $x \\in \\R^{${d}}$, Hidden Layern mit ${hs.join(", ")} Neuronen und ${k} Output${k > 1 ? "s" : ""}.</p>`,
      parts: [
        nmVal("Wie viele Gewichte (ohne Bias) hat das Netz insgesamt?", W.reduce((a, b) => a + b), 2, `${W.map((w, i) => `$${sizes[i]}\\cdot${sizes[i + 1]}$`).join(" + ")} $= ${W.reduce((a, b) => a + b)}$.`),
        nmVal("Und mit Bias-Termen?", W.reduce((a, b) => a + b) + Bs, 1, `Ein Bias pro Neuron außer der Eingabe: $+${Bs}$.`),
        nmMC("Welche Schicht hat die meisten Parameter?", [names[big], ...names.filter((_, i) => i !== big)].slice(0, 4), 1, `Die Gewichte von ${names[big]}: $${sizes[big]}\\cdot${sizes[big + 1]} = ${W[big]}$. Bei großer Eingabe dominiert meist die erste Schicht.`),
        nmMC("Wie viele Hidden Layer braucht ein FFN mindestens, um beliebige stetige Funktionen (auf kompakten Mengen) beliebig genau darzustellen?", ["Eine (mit genügend Neuronen)", "Keine", "Mindestens zwei", "So viele wie Eingaben"], 1, "Universeller Approximationssatz — praktisch sind tiefe Netze aber oft effizienter."),
      ],
    };
  },
});

gkTask({
  id: "forward", topic: "nn", name: "Forward Pass von Hand", like: "2425-ws/2",
  make() {
    const x = [rint(1, 5), rint(1, 5)], w = [nmPick([0.5, 1, 2, -0.5]), nmPick([-1, -0.5, 0.5, -1.5])], bh = nmPick([0, 1, -1]);
    const a = w[0] * x[0] + w[1] * x[1] + bh, h = Math.max(0, a);
    const wo = nmPick([1, 2, -1]), bo = nmPick([0, -1, -2, 1]), zo = wo * h + bo;
    const cls = Math.random() < 0.6;
    return {
      intro: `<p>Ein kleines Netz mit Eingaben $x_1 = ${x[0]}$, $x_2 = ${x[1]}$, einem Neuron im Hidden Layer (ReLU) und einem Output-Neuron (${cls ? "binäre Klassifikation" : "Regression, ReLU auch im Output"}).
        Gewichte: $w_{x_1\\to h} = ${gt(w[0], 1)}$, $w_{x_2\\to h} = ${gt(w[1], 1)}$, $b_h = ${bh}$; $w_{h\\to o} = ${wo}$, $b_o = ${bo}$.</p>${cls ? `<p class="small">Hinweis: ${gkHintSig(zo)}.</p>` : ""}`,
      parts: [
        nmMC("Wie berechnet ein einzelnes Neuron seinen Output?", ["$y = f(w^\\top x + b)$: gewichtete Summe plus Bias, dann Aktivierung $f$", "$y = w^\\top f(x)$", "$y = f(x) + b$", "$y = \\max(x)$"], 1, "$w$ Gewichte, $b$ Bias, $f$ Aktivierungsfunktion."),
        nmVal("Voraktivierung $a_h$ und Aktivierung $h = \\text{ReLU}(a_h)$.", ql([a, h]), 2, `$a_h = ${gt(w[0], 1)}\\cdot${x[0]} ${w[1] < 0 ? "-" : "+"} ${gt(Math.abs(w[1]), 1)}\\cdot${x[1]} ${bh < 0 ? "-" : "+"} ${Math.abs(bh)} = ${gt(a, 2)}$, ReLU: $${gt(h, 2)}$.`),
        cls ? nmVal("Output $\\hat y = \\sigma(w_{h\\to o}h + b_o)$.", qs(+gkSig(zo).toFixed(2)), 1, `$\\sigma(${gt(zo, 2)}) \\approx ${gt(gkSig(zo), 2)}$: die Wahrscheinlichkeit für Klasse 1 — ${gkSig(zo) >= 0.5 ? "Klasse 1" : "Klasse 0"} bei Schwelle 0,5.`)
          : nmVal("Output $\\hat y = \\text{ReLU}(w_{h\\to o}h + b_o)$.", Math.max(0, zo), 1, `$\\text{ReLU}(${gt(zo, 2)}) = ${Math.max(0, zo)}$.`),
        nmMC(cls ? "Welche Output-Aktivierung für binäre Klassifikation?" : "Welche Output-Aktivierung wäre für eine Regression mit Werten in ganz $\\R$ richtig?",
          cls ? ["Sigmoid: Werte in $(0, 1)$, als Wahrscheinlichkeit lesbar", "ReLU", "Identität", "Softmax mit einem Output"] : ["Linear (keine): der Wertebereich ist unbeschränkt", "Sigmoid", "ReLU", "Softmax"], 1,
          cls ? "Dazu die binäre Kreuzentropie." : "ReLU im Output kann nichts Negatives vorhersagen (WS 23/24, 3.1)."),
      ],
    };
  },
});

gkTask({
  id: "backprop", topic: "nn", name: "Backpropagation von Hand", like: "25-ss/2",
  make() {
    let x, W1, W2, y, a, z, yh;
    do {
      x = [rint(-2, 2), rint(-2, 2)];
      W1 = [[rint(-1, 2), rint(-1, 1)], [rint(-1, 1), rint(-1, 2)]];
      W2 = [nmPick([-1, 1, 2, 3]), nmPick([-1, 1, 2])];
      a = W1.map((r) => r[0] * x[0] + r[1] * x[1]);
      z = a.map((v) => Math.max(0, v));
      yh = W2[0] * z[0] + W2[1] * z[1];
      y = yh + nmPick([-3, -2, -1, 1, 2]);
    } while (!a.some((v) => v > 0) || a.some((v) => v === 0) || (x[0] === 0 && x[1] === 0));
    const dy = yh - y, dw2 = z.map((v) => dy * v), da = a.map((v, j) => dy * W2[j] * (v > 0 ? 1 : 0));
    const dW1 = da.map((g) => x.map((v) => g * v)), eta = 0.5;
    const W1n = W1.map((r, j) => r.map((v, i) => v - eta * dW1[j][i])), W2n = W2.map((v, j) => v - eta * dw2[j]);
    return {
      intro: `<p>Ein Netz mit zwei Eingaben, einem Hidden Layer mit zwei ReLU-Neuronen und linearer Ausgabe; $w^{(1)}_{ji}$ verbindet $x_i$ mit dem Hidden-Neuron $j$. Ohne Bias.</p>
        ${tx(`x = ${tcv(x)},\\quad W^{(1)} = ${tmx(W1)},\\quad W^{(2)} = (${W2.join(",\\ ")}),\\quad y = ${y},\\quad L = \\tfrac12(\\hat y - y)^2`)}`,
      parts: [
        nmVal("Forward: $a^{(1)} = W^{(1)}x$ (zwei Werte); $z^{(1)} = \\text{ReLU}(a^{(1)})$ (zwei Werte); $\\hat y$.", ql([...a, ...z, yh]), 2, `$a^{(1)} = (${a.join(", ")})$, $z^{(1)} = (${z.join(", ")})$, $\\hat y = ${W2[0]}\\cdot${z[0]} + ${W2[1]}\\cdot${z[1]} = ${yh}$.`),
        nmVal("Backward: $\\frac{\\partial L}{\\partial w_1^{(2)}}$; $\\frac{\\partial L}{\\partial w_{11}^{(1)}}$; $\\frac{\\partial L}{\\partial w_{21}^{(1)}}$.", ql([dw2[0], dW1[0][0], dW1[1][0]]), 3,
          `$\\frac{\\partial L}{\\partial\\hat y} = \\hat y - y = ${dy}$. $\\frac{\\partial L}{\\partial w^{(2)}_1} = ${dy}\\cdot z_1 = ${dw2[0]}$. $\\frac{\\partial L}{\\partial a_j} = ${dy}\\cdot w^{(2)}_j\\cdot\\mathbb 1[a_j > 0]$ $= (${da.join(", ")})$, $\\frac{\\partial L}{\\partial w^{(1)}_{ji}} = \\frac{\\partial L}{\\partial a_j}x_i$: $${dW1[0][0]}$ und $${dW1[1][0]}$.`),
        nmVal("Ein Update mit $\\eta = \\frac12$: $W^{(1)}_{\\text{neu}}$ zeilenweise (vier Werte); $W^{(2)}_{\\text{neu}}$ (zwei Werte).", ql([...W1n.flat(), ...W2n]), 2,
          `Alle Gradienten: $\\nabla W^{(1)} = ${tmx(dW1)}$, $\\nabla W^{(2)} = (${dw2.join(",\\ ")})$; jeweils $W - \\frac12\\nabla W$.`),
        nmMC("Ein tiefes Netz mit Sigmoid: frühe Layer lernen kaum. Was ist das?", ["Vanishing Gradients: $\\sigma' \\le \\frac14$ wird über viele Layer multipliziert — Abhilfe z. B. ReLU, Residual Connections, gute Initialisierung", "Überanpassung", "Eine zu kleine Lernrate in der letzten Schicht", "Exploding Gradients durch ReLU"], 2, "SS 25, 2.3."),
      ],
    };
  },
});

/* ================================================================ Generalisierung (VL 6) */

gkTask({
  id: "ensemble", topic: "gen", name: "Hyperparameter und Ensembles", like: "2324-ws/3",
  make() {
    const m = nmPick([4, 5, 10]), s2 = nmPick([1, 2, 4]), rho = nmPick([nmQ(1, 2), nmQ(1, 4)]);
    return {
      intro: `<p>Ein Datensatz wird in drei gleich große Teile $P_1, P_2, P_3$ geteilt; trainiert wird auf $P_1$, der Fehler wird auf $P_3$ gemessen. Danach ein Ensemble aus $m = ${m}$ Netzen, jedes mit $\\mathrm{Var}[\\hat f_i] = \\sigma^2 = ${s2}$.</p>`,
      parts: [
        nmMC("Auf welchem Teil sollte man die Hyperparameter (Zahl und Größe der Hidden Layer) wählen?", ["$P_2$ — ein eigener Validierungsteil", "$P_1$", "$P_3$", "egal"], 2, "Auf $P_3$ wäre die Schätzung zu optimistisch, auf $P_1$ überanpasst man."),
        nmMC("Ordnen Sie den erwarteten Fehler auf $P_3$, wenn auf $P_1$, $P_2$ bzw. $P_3$ gewählt wird (aufsteigend).", ["$P_3 < P_2 < P_1$", "$P_1 < P_2 < P_3$", "$P_2 < P_3 < P_1$", "alle gleich"], 1, "Wer auf dem Test wählt, sieht dort den kleinsten Fehler — geschummelt."),
        nmVal("Varianz des Ensemble-Mittels bei unabhängigen Modellen.", qs(nmQ(s2, m)), 1, `$\\mathrm{Var}\\big[\\frac1m\\sum\\hat f_i\\big] = \\frac{1}{m^2}\\cdot m\\sigma^2 = \\frac{\\sigma^2}{m} = ${nmQ(s2, m).tex()}$.`),
        nmVal(`Und bei paarweiser Korrelation $\\rho = ${rho.tex()}$: $\\rho\\sigma^2 + \\frac{1 - \\rho}{m}\\sigma^2$.`, qs(rho.mul(s2).add(nmQ(1).sub(rho).mul(s2).div(m))), 1, "Korrelierte Modelle reduzieren die Varianz weniger — deshalb Bagging und verschiedene Initialisierungen oder Architekturen."),
        nmW("Erklären Sie Bagging und warum Luisas Rechnung $\\mathrm{Var} = \\frac{\\sigma^2}{m}$ beim Bagging nicht exakt stimmt.",
          "Bagging: jedes Modell bekommt eine Bootstrap-Stichprobe, $N$ Beispiele mit Zurücklegen aus dem Datensatz (manche mehrfach, manche gar nicht). Die Modelle werden dadurch unterschiedlicher, die Ensemble-Varianz sinkt. Die Datensätze überlappen aber, die Modelle sind also nicht unabhängig: die Varianz ist größer als $\\frac{\\sigma^2}{m}$.",
          [[1, "Bootstrap: mit Zurücklegen ziehen"], [1, "Modelle nicht unabhängig, Formel gilt nur bei Unabhängigkeit"]]),
      ],
    };
  },
});

/* ================================================================ PCA (VL 7) */

gkTask({
  id: "pca", topic: "dimred", name: "PCA: Projektion und Rekonstruktion", like: "2526-ws/3",
  make() {
    const [c, s] = nmPick([[3, 4], [4, 3], [-3, 4], [4, -3], [5, 12], [12, 5]]), n = Math.hypot(c, s);
    const u1 = [nmQ(c, n), nmQ(s, n)], u2 = [nmQ(-s, n), nmQ(c, n)];
    const lam = [rint(6, 12), rint(1, 4)];
    const pts = [[rint(-3, 3), rint(-3, 3)], [rint(-3, 3), rint(-3, 3)]];
    const z = pts.map((p) => u1[0].mul(p[0]).add(u1[1].mul(p[1])));
    const rec = z.map((zz) => u1.map((u) => u.mul(zz)));
    const e1 = pts.map((p) => { const v = u2[0].mul(p[0]).add(u2[1].mul(p[1])); return v.mul(v); });
    const e2 = z.map((v) => v.mul(v));
    return {
      intro: `<p>Eine PCA auf einem zweidimensionalen Datensatz mit Mittelwert $\\mu = 0$ ergab die Eigenwerte $\\lambda_1 = ${lam[0]}$, $\\lambda_2 = ${lam[1]}$ der Kovarianzmatrix mit den Eigenvektoren</p>
        ${tx(`u_1 = ${tcv(u1)},\\qquad u_2 = ${tcv(u2)}.`)}<p>Neue Punkte: $x_1 = (${pts[0].join(", ")})^\\top$, $x_2 = (${pts[1].join(", ")})^\\top$.</p>`,
      parts: [
        nmVal("Projektion auf PC1: $z = u_1^\\top x$ für $x_1$; $x_2$.", ql(z), 2, `$z_1 = ${z[0].tex()}$, $z_2 = ${z[1].tex()}$.`),
        nmVal("Rekonstruktion $\\tilde x = z\\,u_1$ von $x_1$ (zwei Werte).", ql(rec[0]), 1, `$${z[0].tex()}\\cdot u_1 = ${tcv(rec[0])}$.`),
        nmVal("Rekonstruktionsfehler $\\|x - \\tilde x\\|^2$ für $x_1$; $x_2$.", ql(e1), 2, `Der Fehler ist der Anteil in Richtung $u_2$: $(u_2^\\top x)^2$ = $${e1[0].tex()}$ und $${e1[1].tex()}$.`),
        nmMC("Würde der Rekonstruktionsfehler dieser beiden Punkte mit PC2 statt PC1 steigen oder sinken?", (() => {
          const t1 = e1[0].add(e1[1]), t2 = e2[0].add(e2[1]), c = t2.cmp(t1);
          const right = c > 0 ? `Er steigt: zusammen $${t2.tex()}$ statt $${t1.tex()}$` : c < 0 ? `Er sinkt: zusammen $${t2.tex()}$ statt $${t1.tex()}$` : "Er bleibt gleich";
          return [right, ...["Er steigt", "Er sinkt", "Er bleibt gleich"].filter((o) => !right.startsWith(o))];
        })(), 1,
          "Mit PC2 bleibt der Anteil in Richtung $u_1$ als Fehler übrig: $(u_1^\\top x)^2$. Für die Trainingsdaten im Mittel ist PC1 immer besser (größte Varianz)."),
        nmVal("Welcher Anteil der Gesamtvarianz wird durch PC1 erklärt?", qs(nmQ(lam[0], lam[0] + lam[1])), 1, `$\\frac{\\lambda_1}{\\lambda_1 + \\lambda_2} = \\frac{${lam[0]}}{${lam[0] + lam[1]}}$.`),
        nmMC("Welches Optimierungsproblem liefert $u_1$?", ["$\\max_u u^\\top\\Sigma u$ unter $u^\\top u = 1$", "$\\min_u u^\\top\\Sigma u$ ohne Nebenbedingung", "$\\max_u\\|u\\|$", "$\\min_u\\sum_i\\|x_i\\|^2$"], 1, "Varianz der Projektion maximieren, Länge 1; Lösung: Eigenvektor zum größten Eigenwert."),
      ],
    };
  },
});

/* ================================================================ k-Means (VL 7) */

function gkScatterSVG(pts, centers, labels) {
  const P = nmFrame(300, 240, [-6, 7], [-5, 5], { l: 22, r: 8, t: 8, b: 20 });
  return `<svg class="lw-svg gk-taskfig" viewBox="0 0 300 240" role="img" aria-label="Punkte und Clusterzentren">${P.axes({ xt: [-4, 0, 4], yt: [-4, 0, 4] })}
    ${pts.map(([x, y], i) => `<circle cx="${P.X(x)}" cy="${P.Y(y)}" r="4.5" class="pt gk-data"/><text x="${P.X(x) + 7}" y="${P.Y(y) - 5}" class="tick-t">${labels[i]}(${x},${y})</text>`).join("")}
    ${centers.map(([x, y], k) => `<text x="${P.X(x)}" y="${P.Y(y) + 6}" text-anchor="middle" class="gk-cross">×</text><text x="${P.X(x) + 9}" y="${P.Y(y) + 14}" class="tick-t">c${k + 1}(${x},${y})</text>`).join("")}</svg>`;
}
gkTask({
  id: "kmeans", topic: "clust", name: "k-Means: Zuordnung und Update", like: "2223-ws/4",
  make() {
    const labels = ["A", "B", "C", "D", "E", "F"];
    let pts, cs, asg;
    do {
      pts = labels.map(() => [rint(-5, 6), rint(-4, 4)]);
      cs = [[rint(-4, -1), rint(-3, 3)], [rint(1, 5), rint(-3, 3)]];
      const d = (p, c) => (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
      asg = pts.map((p) => (d(p, cs[0]) === d(p, cs[1]) ? -1 : d(p, cs[0]) < d(p, cs[1]) ? 0 : 1));
    } while (asg.includes(-1) || !asg.includes(0) || !asg.includes(1) || new Set(pts.map(String)).size < 6);
    const c1 = pts.filter((_, i) => !asg[i]), c2 = pts.filter((_, i) => asg[i]);
    const mean = (ps) => [nmQ(ps.reduce((s, p) => s + p[0], 0), ps.length), nmQ(ps.reduce((s, p) => s + p[1], 0), ps.length)];
    const i0 = rint(0, 5), p0 = pts[i0];
    return {
      intro: `<p>k-Means mit $k = 2$ und quadrierter euklidischer Distanz $d(X, Y) = (X_1 - Y_1)^2 + (X_2 - Y_2)^2$. Punkte und aktuelle Zentren:</p>${gkScatterSVG(pts, cs, labels)}`,
      parts: [
        nmVal(`Berechnen Sie für ${labels[i0]} die Distanzen zu $c_1$; $c_2$.`, ql(cs.map((c) => (p0[0] - c[0]) ** 2 + (p0[1] - c[1]) ** 2)), 1, `$(${p0[0]} - ${cs[0][0]})^2 + (${p0[1]} - ${cs[0][1]})^2$ usw.`),
        nmVal("Zuordnungsschritt: welche Punkte gehören zu $c_1$? (Buchstaben, z. B. A C D)", gkLetters(c1.map((p) => labels[pts.indexOf(p)])), 2, `Zu $c_1$: ${c1.map((p) => labels[pts.indexOf(p)]).join(", ")}; zu $c_2$: ${c2.map((p) => labels[pts.indexOf(p)]).join(", ")}.`),
        nmVal("Update: neues $c_1$ (zwei Werte).", ql(mean(c1)), 2, `Mittelwert der zugeordneten Punkte: $(${mean(c1).map((v) => v.tex()).join(",\\ ")})$.`),
        nmVal("Update: neues $c_2$ (zwei Werte).", ql(mean(c2)), 1, `$(${mean(c2).map((v) => v.tex()).join(",\\ ")})$.`),
        nmMC("Konvergiert k-Means immer gegen das globale Optimum?", ["Nein, nur gegen ein lokales — abhängig von der Initialisierung (deshalb mehrere Starts / k-means++)", "Ja, immer", "Ja, bei euklidischer Distanz", "Nein, er konvergiert nie"], 1, "Die Zielfunktion sinkt monoton, aber die Lösung hängt vom Start ab."),
      ],
    };
  },
});

/* ================================================================ GMM und EM (VL 8) */

gkTask({
  id: "em", topic: "dens", name: "Ein EM-Schritt für ein GMM", like: "2324-ws/6",
  make() {
    let xs, N1, N2;
    do {
      xs = shuffle([-2, -1, 0, 1, 3, 4, 5]).slice(0, 3).sort((a, b) => a - b);
      N1 = xs.map(() => nmPick([0, 5, 10, 15, 20, 25]));
      N2 = xs.map(() => nmPick([0, 5, 10, 25, 35]));
    } while (N1.every((v) => !v) || xs.some((_, i) => !N1[i] && !N2[i]) || N1.filter(Boolean).length < 2);
    const q = xs.map((_, i) => nmQ(N1[i], N1[i] + N2[i]));
    const sq = q.reduce((s, v) => s.add(v), nmQ(0)), mu = q.reduce((s, v, i) => s.add(v.mul(xs[i])), nmQ(0)).div(sq);
    return {
      intro: `<p>Datensatz $D = \\{${xs.join(", ")}\\}$, ein GMM mit zwei Komponenten, $\\pi_1 = \\pi_2 = \\frac12$. Die Gauß-Likelihoods sind (gerundet) gegeben:</p>
        <table class="len-terms nm-tab nm-data-tab"><thead><tr><th></th>${xs.map((x) => `<th>$x = ${x}$</th>`).join("")}</tr></thead><tbody>
        <tr><th>$\\mathcal N(x \\mid \\mu_1, \\Sigma_1)$</th>${N1.map((v) => `<td>$\\frac{${v}}{100}$</td>`).join("")}</tr>
        <tr><th>$\\mathcal N(x \\mid \\mu_2, \\Sigma_2)$</th>${N2.map((v) => `<td>$\\frac{${v}}{100}$</td>`).join("")}</tr></tbody></table>`,
      parts: [
        nmMC("Was wird im E-Schritt berechnet?", ["Die Responsibilities $q_{ik} = \\frac{\\pi_k\\mathcal N(x_i \\mid \\mu_k, \\Sigma_k)}{\\sum_j\\pi_j\\mathcal N(x_i \\mid \\mu_j, \\Sigma_j)}$", "Neue Mittelwerte", "Die Log-Likelihood allein", "Die Zahl der Komponenten"], 1, "Im M-Schritt: gewichtete ML-Schätzungen von $\\pi_k$, $\\mu_k$, $\\Sigma_k$."),
        nmVal("E-Schritt: $q_{11}$; $q_{21}$; $q_{31}$ (Responsibilities der Komponente 1).", ql(q), 3, `Die $\\pi = \\frac12$ kürzen sich: $q_{i1} = \\frac{\\mathcal N_1(x_i)}{\\mathcal N_1(x_i) + \\mathcal N_2(x_i)}$ = $${q.map((v) => v.tex()).join(",\\ ")}$.`),
        nmVal("M-Schritt: das neue $\\mu_1 = \\frac{\\sum_i q_{i1}x_i}{\\sum_i q_{i1}}$.", qs(mu), 2, `$\\frac{${q.map((v, i) => `${v.tex()}\\cdot(${xs[i]})`).join(" + ")}}{${sq.tex()}} = ${mu.tex()}$.`),
        nmVal("Und das neue $\\pi_1 = \\frac1N\\sum_i q_{i1}$.", qs(sq.div(3)), 1, `$\\frac{${sq.tex()}}{3}$.`),
        nmMC("Warum optimiert man die GMM-Log-Likelihood nicht einfach direkt mit Gradientenabstieg?", ["Die Summe im Logarithmus koppelt alle Komponenten: keine geschlossene Lösung, langsame, schwierige Optimierung (Nebenbedingungen an π und Σ)", "Weil sie keine Ableitung hat", "Weil sie immer konvex ist", "Weil GMMs keine Parameter haben"], 1, "$\\log\\sum_k\\pi_k\\mathcal N(\\cdot)$ — EM umgeht das mit den Responsibilities."),
      ],
    };
  },
});

/* ================================================================ CNNs (VL 9) */

gkTask({
  id: "cnnshape", topic: "cnn", name: "CNN: Ausgabegrößen und Gewichte", like: "2425-ws/4",
  make() {
    let H, C, k1, n1, k2, n2, K, s1, p1, s2, p2;
    do {
      H = nmPick([26, 27, 28, 30, 32]); C = nmPick([1, 3]); k1 = nmPick([3, 5]); n1 = nmPick([6, 8, 16]); k2 = 3; n2 = nmPick([12, 16, 32]); K = nmPick([8, 10, 26]);
      s1 = H - k1 + 1; p1 = Math.floor(s1 / 2); s2 = p1 - k2 + 1; p2 = Math.floor(s2 / 2);
    } while (p2 < 2);
    const flat = p2 * p2 * n2;
    return {
      intro: `<p>Eingabe der Größe $(H, W, C) = (${H}, ${H}, ${C})$. Kein Padding, alle Convolutions mit Stride 1. CONV$x$-$N$: Kernel $x \\times x$, $N$ Filter; POOL-2: $2 \\times 2$ Max-Pooling mit Stride 2 (abrunden).</p>
        <p><b>CONV${k1}-${n1}</b> → ReLU → <b>POOL-2</b> → <b>CONV${k2}-${n2}</b> → ReLU → <b>POOL-2</b> → FLATTEN → <b>FC-${K}</b></p>`,
      parts: [
        nmVal(`Ausgabegröße nach CONV${k1}-${n1}: H; W; C.`, ql([s1, s1, n1]), 1, `$${H} - ${k1} + 1 = ${s1}$, $C = ${n1}$ Filter.`),
        nmVal("Nach dem ersten POOL-2: H; W; C.", ql([p1, p1, n1]), 1, `$\\lfloor ${s1}/2\\rfloor = ${p1}$.`),
        nmVal(`Nach CONV${k2}-${n2} und dem zweiten POOL-2: H; W; C.`, ql([p2, p2, n2]), 1, `$${p1} - ${k2} + 1 = ${s2}$, $\\lfloor ${s2}/2\\rfloor = ${p2}$.`),
        nmVal("Länge des Vektors nach FLATTEN.", flat, 1, `$${p2}\\cdot${p2}\\cdot${n2} = ${flat}$.`),
        nmVal(`Gewichte (ohne Bias) von CONV${k1}-${n1}; CONV${k2}-${n2}; FC-${K}.`, ql([k1 * k1 * C * n1, k2 * k2 * n1 * n2, flat * K]), 3,
          `$${k1}\\cdot${k1}\\cdot${C}\\cdot${n1}$, $${k2}\\cdot${k2}\\cdot${n1}\\cdot${n2}$, $${flat}\\cdot${K}$. ReLU und Pooling haben keine Gewichte. Ein Filter sieht alle Eingangskanäle.`),
        nmMC("Warum haben Convolutional Layer so viel weniger Gewichte als vollständig verbundene?", ["Parameter-Sharing: derselbe kleine Filter wird an jeder Stelle verwendet (und jede Ausgabe sieht nur einen lokalen Ausschnitt)", "Weil sie keinen Bias haben", "Weil Pooling Gewichte spart", "Weil sie nur einen Kanal sehen"], 1, "Sparse connectivity und shared weights (WS 25/26, 6-1)."),
      ],
    };
  },
});

gkTask({
  id: "convhand", topic: "cnn", name: "Convolution, ReLU und Pooling von Hand", like: "23-ss/7",
  make() {
    const I = [0, 1, 2].map(() => [0, 1, 2].map(() => rint(0, 4)));
    const h = [[nmPick([1, 2, -1]), nmPick([-2, -1, 1])], [nmPick([0, 1, -1]), nmPick([1, 2, -1])]];
    const P = [[0, 0, 0, 0, 0], ...I.map((r) => [0, ...r, 0]), [0, 0, 0, 0, 0]];
    const O = [0, 1, 2, 3].map((i) => [0, 1, 2, 3].map((j) => h[0][0] * P[i][j] + h[0][1] * P[i][j + 1] + h[1][0] * P[i + 1][j] + h[1][1] * P[i + 1][j + 1]));
    const R = O.map((r) => r.map((v) => Math.max(0, v)));
    const M = [[0, 0], [0, 1], [1, 0], [1, 1]].map(([a, b]) => Math.max(R[2 * a][2 * b], R[2 * a][2 * b + 1], R[2 * a + 1][2 * b], R[2 * a + 1][2 * b + 1]));
    return {
      intro: `${tx(`I = ${tmx(I)},\\qquad h = ${tmx(h)}`)}<p>Convolution mit Zero-Padding der Größe 1 und Stride 1 — wie in CNNs üblich ohne Spiegeln des Filters (der Filter wird über das Bild geschoben, elementweise multipliziert, summiert). Danach ReLU, dann Max-Pooling mit Kernel 2 und Stride 2.</p>`,
      parts: [
        nmVal("Welche Größe hat die Ausgabe der Convolution? H; W.", ql([4, 4]), 1, "Mit Padding $5 \\times 5$, Filter $2 \\times 2$: $5 - 2 + 1 = 4$."),
        nmVal("Die erste Zeile der Convolution (vier Werte).", ql(O[0]), 2, `$${tmx(O)}$`),
        nmVal("Nach ReLU und Max-Pooling: das $2 \\times 2$-Ergebnis zeilenweise (vier Werte).", ql(M), 3, `ReLU: $${tmx(R)}$, dann das Maximum jedes $2 \\times 2$-Blocks.`),
        nmMC("Zwei Vorteile von ReLU gegenüber Sigmoid/tanh?", ["Billig zu berechnen und keine Sättigung für positive Werte (weniger Vanishing Gradients)", "Werte immer in $(0, 1)$", "Überall differenzierbar und beschränkt", "Negativer Output für negative Eingaben"], 1, "SS 23, 7.2."),
      ],
    };
  },
});

/* ================================================================ RNNs (VL 10) */

gkTask({
  id: "rnnparams", topic: "rnn", name: "Ein RNN: Dimensionen und Parameter", like: "2324-ws/7",
  make() {
    const nx = nmPick([10, 20, 50, 100]), nh = nmPick([3, 4, 8, 16, 32]), ny = nmPick([1, 2, 5]);
    return {
      intro: `${tx(`h_t = \\sigma(W^Hh_{t-1} + W^Xx_t + b),\\qquad y_t = \\sigma(W^Yh_t + c),\\qquad x_t \\in \\R^{${nx}},\\ h_t \\in \\R^{${nh}},\\ y_t \\in \\R^{${ny}}`)}`,
      parts: [
        nmVal("Dimensionen: Zeilen; Spalten von $W^H$, dann von $W^X$, dann von $W^Y$ (sechs Werte).", ql([nh, nh, nh, nx, ny, nh]), 2, `$W^H \\in \\R^{${nh}\\times${nh}}$, $W^X \\in \\R^{${nh}\\times${nx}}$, $W^Y \\in \\R^{${ny}\\times${nh}}$.`),
        nmVal("Wie viele trainierbare Parameter (inklusive Bias) hat das RNN?", nh * nh + nh * nx + nh + ny * nh + ny, 2, `$n_h^2 + n_hn_x + n_h + n_yn_h + n_y = ${nh * nh} + ${nh * nx} + ${nh} + ${ny * nh} + ${ny}$ — unabhängig von der Länge der Sequenz, die Gewichte werden über die Zeit geteilt.`),
        nmMC("Was ist der entscheidende Vorteil eines RNN gegenüber FFN oder CNN beim Klassifizieren von Rezensionen?", ["Sequenzen unterschiedlicher Länge, mit Reihenfolge, mit denselben Gewichten", "Weniger Daten nötig", "Kein Vanishing-Gradient-Problem", "Es braucht kein Training"], 1, "WS 23/24, 7.4."),
        nmMC("Welches Problem einfacher RNNs mildern LSTMs?", ["Vanishing (und exploding) Gradients über lange Sequenzen", "Überanpassung", "Zu viele Parameter", "Feste Eingabelänge"], 1, "Gates und ein Zellzustand halten Information über viele Schritte."),
        nmMC("Wie aggregiert man die Outputs aller Zeitschritte für eine binäre Klassifikation, und welche Aktivierung hat das Ausgabeneuron?", ["Letzter Output oder Summe/Mittelwert aller Outputs; Sigmoid", "Nur der erste Output; ReLU", "Maximum; Softmax mit einer Klasse", "Produkt; linear"], 1, "WS 23/24, 7.3."),
      ],
    };
  },
});

/* ================================================================ MDP und RL (VL 11/12) */

gkTask({
  id: "qlearn", topic: "rl", name: "Tabellarisches Q-Learning", like: "25-ss/4",
  make() {
    const rP = -nmPick([5, 10, 20]), rG = nmPick([5, 10, 20]), step = nmPick([-1, 0]), alpha = nmPick([0.5, 0.25]), gamma = nmPick([0.9, 0.5]);
    const Q = { "A,L": 0, "A,R": 0, "S,L": 0, "S,R": 0, "B,L": 0, "B,R": 0 };
    const next = { "A,L": "P", "A,R": "S", "S,L": "A", "S,R": "B", "B,L": "S", "B,R": "G" };
    const rew = (s2) => (s2 === "P" ? rP : s2 === "G" ? rG : step);
    const maxQ = (s) => (s === "P" || s === "G" ? 0 : Math.max(Q[s + ",L"], Q[s + ",R"]));
    const eps = shuffle([[["S", "R"], ["B", "R"]], [["S", "L"], ["A", "L"]]]);
    if (Math.random() < 0.5) eps.push([["S", "R"], ["B", "R"]]);
    const log = [];
    eps.forEach((ep) => ep.forEach(([s, a]) => {
      const s2 = next[s + "," + a], r = rew(s2), target = r + gamma * maxQ(s2);
      Q[s + "," + a] = Q[s + "," + a] + alpha * (target - Q[s + "," + a]);
      log.push({ s, a, s2, r, target, q: Q[s + "," + a] });
    }));
    const pol = ["A", "S", "B"].map((s) => (Q[s + ",R"] >= Q[s + ",L"] ? "R" : "L"));
    const nm = { L: "Left", R: "Right" };
    return {
      intro: `<svg class="lw-svg gk-taskfig" viewBox="0 0 400 60" role="img" aria-label="Korridor">${["P", "A", "S", "B", "G"].map((s, i) => `<rect x="${10 + i * 76}" y="10" width="70" height="40" rx="8" class="gk-box ${s === "P" || s === "G" ? "gk-term" : ""}"/><text x="${45 + i * 76}" y="36" text-anchor="middle" class="gk-box-t">${s}</text>`).join("")}</svg>
        <p>Start in $S$; $P$ und $G$ sind Endzustände (Q-Werte 0). Aktionen Left/Right deterministisch zum Nachbarn. Belohnung beim Betreten: $P$: $${rP}$, $G$: $+${rG}$, $A, S, B$: $${step}$. $Q_0 \\equiv 0$, $\\alpha = ${gt(alpha, 2)}$, $\\gamma = ${gt(gamma, 1)}$.</p>
        <p>Episoden: ${eps.map((ep, k) => `${k + 1}. ${ep.map(([s, a]) => `$(${s}, \\text{${nm[a]}})$`).join(" → ")} → ${next[ep[ep.length - 1].join(",")]}`).join("; ")}.</p>`,
      parts: [
        nmMC("Wie lautet das Q-Learning-Update?", ["$Q(s, a) \\leftarrow Q(s, a) + \\alpha\\big[r + \\gamma\\max_{a'}Q(s', a') - Q(s, a)\\big]$, bei terminalem $s'$ ohne den $\\max$-Term", "$Q(s, a) \\leftarrow r + \\gamma Q(s, a)$", "$Q(s, a) \\leftarrow \\alpha r$", "$Q(s, a) \\leftarrow Q(s, a) - \\alpha\\,r$"], 1, "Der TD-Fehler $\\delta = r + \\gamma\\max Q(s', \\cdot) - Q(s, a)$."),
        nmVal(`Die Zielwerte (Targets) aller ${log.length} Updates in der gegebenen Reihenfolge.`, ql(log.map((l) => l.target)), 2,
          log.map((l) => `$(${l.s}, ${l.a}) \\to ${l.s2}$: $${l.r} + ${gt(gamma, 1)}\\cdot${gt(l.target - l.r === 0 ? 0 : (l.target - l.r) / gamma, 3)} = ${gt(l.target, 3)}$`).join("; ")),
        nmVal("Die Q-Tabelle danach: $Q(A, L)$; $Q(A, R)$; $Q(S, L)$; $Q(S, R)$; $Q(B, L)$; $Q(B, R)$.", ql(["A,L", "A,R", "S,L", "S,R", "B,L", "B,R"].map((k) => Q[k])), 2, `Nach jedem Update: ${log.map((l) => `$Q(${l.s}, ${l.a}) = ${gt(l.q, 3)}$`).join(", ")}.`),
        nmVal("Gierige Policy für $A$; $S$; $B$ (L oder R, bei Gleichstand R).", gkLetters(pol), 1, `$\\pi(s) = \\arg\\max_aQ(s, a)$.`),
        nmMC("Warum braucht man Exploration?", ["Ohne sie probiert der Agent nie Aktionen, deren Wert er (noch) unterschätzt — z. B. ε-greedy oder Softmax-Policy", "Damit der Loss sinkt", "Weil Q-Werte negativ werden", "Exploration braucht man nicht"], 1, "Die zwei Strategien der Vorlesung: ε-greedy und Softmax (Boltzmann)."),
      ],
    };
  },
});

gkTask({
  id: "valueit", topic: "rl", name: "Value Iteration, zwei Schritte", like: "23-ss/3",
  make() {
    const r1 = nmPick([6, 8, 10]), p = nmPick([nmQ(4, 5), nmQ(1, 2), nmQ(3, 5)]), c1 = nmPick([1, 2]), q = nmPick([nmQ(7, 10), nmQ(1, 2), nmQ(4, 5)]), c2 = nmPick([5, 10]), g = nmQ(1, 2);
    const V1 = [nmQ(r1), nmQ(0), nmQ(-c2)];
    const Q2 = { s1a1: nmQ(r1).add(g.mul(p.mul(V1[0]).add(nmQ(1).sub(p).mul(V1[1])))), s2a1: g.mul(V1[1]), s2a2: nmQ(-c1).add(g.mul(q.mul(V1[0]).add(nmQ(1).sub(q).mul(V1[2])))), s3a2: nmQ(-c2).add(g.mul(V1[0])) };
    const V2 = [Q2.s1a1, Q2.s2a1.cmp(Q2.s2a2) >= 0 ? Q2.s2a1 : Q2.s2a2, Q2.s3a2];
    const best2 = Q2.s2a2.cmp(Q2.s2a1) > 0 ? "A2 (spitzen)" : "A1 (schreiben)";
    return {
      intro: `<p>Ein Bleistift ist gespitzt ($S_1$), stumpf ($S_2$) oder abgebrochen ($S_3$). In $S_1$: schreiben ($A_1$), Reward $${r1}$, danach mit $${p.tex()}$ weiter $S_1$, sonst $S_2$.
        In $S_2$: schreiben ($A_1$), Reward 0, bleibt $S_2$; oder spitzen ($A_2$), Reward $-${c1}$, danach mit $${q.tex()}$ $S_1$, sonst $S_3$. In $S_3$ nur spitzen ($A_2$), Reward $-${c2}$, danach $S_1$.
        $V_0 \\equiv 0$, $\\gamma = \\frac12$, kein Endzustand.</p>${tx(`Q_k(s, a) = r(s, a) + \\gamma\\sum_{s'}p(s' \\mid s, a)\\,V_{k-1}(s'),\\qquad V_k(s) = \\max_aQ_k(s, a)`)}`,
      parts: [
        nmMC("Welche Elemente definieren einen MDP?", ["Zustände, Aktionen, Übergangswahrscheinlichkeiten, Rewards, Discount-Faktor (und Startverteilung)", "Nur Zustände und Rewards", "Daten, Labels, Loss", "Policy und Wertfunktion"], 1, "$(S, A, P, r, \\gamma)$ — die Markov-Eigenschaft: der nächste Zustand hängt nur vom aktuellen Zustand und der Aktion ab."),
        nmVal("$V_1(S_1)$; $V_1(S_2)$; $V_1(S_3)$.", ql(V1), 2, `Mit $V_0 = 0$ nur der Reward: $Q_1(S_2, A_1) = 0 > Q_1(S_2, A_2) = -${c1}$.`),
        nmVal("$V_2(S_1)$; $V_2(S_2)$; $V_2(S_3)$.", ql(V2), 3,
          `$Q_2(S_1, A_1) = ${r1} + \\frac12(${p.tex()}\\cdot${r1} + ${nmQ(1).sub(p).tex()}\\cdot0) = ${Q2.s1a1.tex()}$; $Q_2(S_2, A_1) = ${Q2.s2a1.tex()}$; $Q_2(S_2, A_2) = -${c1} + \\frac12(${q.tex()}\\cdot${r1} + ${nmQ(1).sub(q).tex()}\\cdot(-${c2})) = ${Q2.s2a2.tex()}$; $Q_2(S_3, A_2) = -${c2} + \\frac12\\cdot${r1} = ${Q2.s3a2.tex()}$.`),
        nmMC("Optimale Aktion in $S_2$ nach der zweiten Iteration (Horizont 2)?", [best2, best2.startsWith("A1") ? "A2 (spitzen)" : "A1 (schreiben)"], 1, `Vergleich $${Q2.s2a1.tex()}$ gegen $${Q2.s2a2.tex()}$. Nach der ersten Iteration war es schreiben.`, true),
      ],
    };
  },
});

gkTask({
  id: "discount", topic: "rl", name: "Discount-Faktor und TD-Fehler", like: "2425-ws/6",
  make() {
    const gam = nmPick([nmQ(1, 2), nmQ(1, 3), nmQ(1, 4), nmQ(2, 3)]), rR = nmPick([12, 24, 36, 48]);
    const rL = gam.mul(rR).sub(1);
    if (rL.d !== 1 || rL.n <= 1) return this.make();
    const alpha = 0.5, g = 0.5;
    const d1 = rL.n - 1, q1 = 1 + alpha * d1, d2 = -1 + g * Math.max(q1, 1) - 1, q2 = 1 + alpha * d2;
    return {
      intro: `<svg class="lw-svg gk-taskfig" viewBox="0 0 470 60" role="img" aria-label="Kette A bis F">${["A", "B", "C", "D", "E", "F"].map((s, i) => `<rect x="${10 + i * 76}" y="14" width="68" height="36" rx="8" class="gk-box ${s === "A" || s === "F" ? "gk-term" : ""}"/><text x="${44 + i * 76}" y="37" text-anchor="middle" class="gk-box-t">${s}</text>`).join("")}<text x="44" y="10" text-anchor="middle" class="tick-t">+${rL.n}</text><text x="424" y="10" text-anchor="middle" class="tick-t">+${rR}</text></svg>
        <p>Aktionen ← und → bewegen deterministisch um einen Zustand; Start $C$, $A$ und $F$ terminal. $r(B, \\leftarrow) = ${rL.n}$, $r(E, \\rightarrow) = ${rR}$, sonst $-1$.</p>`,
      parts: [
        nmMC("Wie lautet die Wertfunktion $V^\\pi(s)$?", ["$V^\\pi(s) = \\mathbb E_\\pi\\big[\\sum_{t=0}^\\infty\\gamma^tr_t \\mid s_0 = s\\big]$", "$V^\\pi(s) = \\sum_t r_t$", "$V^\\pi(s) = \\max_ar(s, a)$", "$V^\\pi(s) = \\gamma\\,r(s)$"], 1, "Erwartete diskontierte Summe zukünftiger Rewards."),
        nmVal("Für welches $\\gamma > 0$ ist $V^{\\pi_\\rightarrow}(C) = V^{\\pi_\\leftarrow}(C)$?", qs(gam), 3,
          `$\\pi_\\rightarrow$: $-1, -1, +${rR}$, also $-1 - \\gamma + ${rR}\\gamma^2$. $\\pi_\\leftarrow$: $-1, +${rL.n}$, also $-1 + ${rL.n}\\gamma$. Gleichsetzen: $${rR}\\gamma^2 = ${rL.n + 1}\\gamma \\Rightarrow \\gamma = ${gam.tex()}$.`),
        nmVal(`Tabellarisches Q-Learning, $\\gamma = \\alpha = 0{,}5$, alle $Q = 1$ (terminale 0). Transition $(B, \\leftarrow, +${rL.n})$: TD-Fehler $\\delta$; neues $Q(B, \\leftarrow)$.`, ql([d1, q1]), 2, `$A$ ist terminal: $\\delta = ${rL.n} - 1 = ${d1}$, $Q = 1 + 0{,}5\\cdot${d1} = ${gt(q1, 2)}$.`),
        nmVal("Danach $(C, \\leftarrow, -1)$: $\\delta$; neues $Q(C, \\leftarrow)$.", ql([d2, q2]), 2, `$\\delta = -1 + 0{,}5\\cdot\\max_aQ(B, a) - 1 = -1 + 0{,}5\\cdot${gt(Math.max(q1, 1), 2)} - 1 = ${gt(d2, 2)}$, $Q = ${gt(q2, 3)}$.`),
        nmMC("Welches Problem tritt bei Approximate Q-Learning ohne Replay Buffer auf?", ["Aufeinanderfolgende Transitionen sind stark korreliert — das Netz vergisst und divergiert leicht; der Buffer erlaubt auch, Erfahrung mehrfach zu nutzen", "Die Rewards werden negativ", "Die Policy wird deterministisch", "Kein Problem"], 1, "Dazu ein Target-Netz gegen bewegliche Ziele (SS 26, 6-2)."),
      ],
    };
  },
});

/* ================================================================ Bayes-Netze und HMMs (VL 13) */

gkTask({
  id: "bn", topic: "hmm", name: "Bayes-Netz: Wahrscheinlichkeiten ausrechnen", like: "2324-ws/5",
  make() {
    const t = () => nmPick([1, 2, 3, 4, 6, 7, 8, 9]) / 10;
    const pA = t(), pB = t(), pC = [[t(), t()], [t(), t()]], pD = [[t(), t()], [t(), t()]];
    const all0 = (1 - pA) * (1 - pB) * (1 - pC[0][0]) * (1 - pD[0][0]);
    const acnd = pA * pB * pC[1][1] * (1 - pD[1][1]) + pA * (1 - pB) * pC[1][0] * (1 - pD[0][1]);
    const row = (a, b, v) => `<tr><td>${a ? "true" : "false"}</td><td>${b ? "true" : "false"}</td><td>${nmD(v, 1)}</td></tr>`;
    return {
      intro: `<p>Boolesche Variablen $A, B, C, D$ mit $A \\to C \\leftarrow B$ und $B \\to D \\leftarrow C$. $P(A) = ${gt(pA, 1)}$, $P(B) = ${gt(pB, 1)}$ (für true).</p>
        <div class="gk-tabs"><table class="len-terms nm-tab nm-data-tab"><thead><tr><th>A</th><th>B</th><th>P(C = t | A, B)</th></tr></thead><tbody>${row(0, 0, pC[0][0])}${row(0, 1, pC[0][1])}${row(1, 0, pC[1][0])}${row(1, 1, pC[1][1])}</tbody></table>
        <table class="len-terms nm-tab nm-data-tab"><thead><tr><th>B</th><th>C</th><th>P(D = t | B, C)</th></tr></thead><tbody>${row(0, 0, pD[0][0])}${row(0, 1, pD[0][1])}${row(1, 0, pD[1][0])}${row(1, 1, pD[1][1])}</tbody></table></div>`,
      parts: [
        nmMC("Wie faktorisiert die gemeinsame Verteilung?", ["$P(A)P(B)P(C \\mid A, B)P(D \\mid B, C)$", "$P(A)P(B)P(C)P(D)$", "$P(A \\mid B)P(B \\mid C)P(C \\mid D)$", "$P(D \\mid A, B, C)$"], 1, "Produkt der lokalen bedingten Verteilungen jedes Knotens."),
        nmVal("Wahrscheinlichkeit, dass alle vier Variablen falsch sind — in Prozent.", qs(all0 * 100), 2, `$${gt(1 - pA, 1)}\\cdot${gt(1 - pB, 1)}\\cdot${gt(1 - pC[0][0], 1)}\\cdot${gt(1 - pD[0][0], 1)} = ${gt(all0, 4)}$.`),
        nmVal("$P(A = t, C = t, D = f)$ — in Prozent.", qs(acnd * 100), 3, `Über $B$ summieren: $${gt(pA, 1)}\\cdot${gt(pB, 1)}\\cdot${gt(pC[1][1], 1)}\\cdot${gt(1 - pD[1][1], 1)} + ${gt(pA, 1)}\\cdot${gt(1 - pB, 1)}\\cdot${gt(pC[1][0], 1)}\\cdot${gt(1 - pD[0][1], 1)} = ${gt(acnd, 4)}$.`),
        nmMC("Was ist der Explaining-Away-Effekt (hier: $A$ und $B$ beide Ursachen von $C$)?", ["Wird $C$ beobachtet, werden $A$ und $B$ abhängig: erklärt eine Ursache $C$, wird die andere unwahrscheinlicher", "$A$ und $B$ sind immer abhängig", "Beobachtet man $A$, wird $C$ unabhängig von allem", "Ohne Beobachtung erklären sich alle Variablen gegenseitig"], 1, "Unabhängige Ursachen werden durch einen beobachteten gemeinsamen Effekt abhängig."),
      ],
    };
  },
});

gkTask({
  id: "hmmfwd", topic: "hmm", name: "HMM: filtern und vorhersagen", like: "25-ss/5",
  make() {
    const F = (a, b) => nmQ(a, b);
    const prior = nmPick([[F(1, 2), F(1, 2)], [F(2, 5), F(3, 5)], [F(1, 3), F(2, 3)]]);
    const rows = [[F(4, 5), F(1, 5)], [F(2, 5), F(3, 5)], [F(3, 4), F(1, 4)], [F(1, 2), F(1, 2)], [F(2, 3), F(1, 3)], [F(7, 10), F(3, 10)]];
    const T = [nmPick(rows), nmPick(rows).slice().reverse()], O = [nmPick(rows), nmPick(rows).slice().reverse()];
    const e0 = rint(1, 2), e1 = rint(1, 2);
    const norm = (v) => { const s = v[0].add(v[1]); return v.map((x) => x.div(s)); };
    const post0 = norm(prior.map((p, h) => p.mul(O[h][e0 - 1])));
    const pred1 = [0, 1].map((h1) => post0[0].mul(T[0][h1]).add(post0[1].mul(T[1][h1])));
    const post1 = norm(pred1.map((p, h) => p.mul(O[h][e1 - 1])));
    const tab = (M, a, b) => `<table class="len-terms nm-tab nm-data-tab"><thead><tr><th>${a}</th><th>${b} = 1</th><th>${b} = 2</th></tr></thead><tbody>${M.map((r, i) => `<tr><th>${i + 1}</th><td>$${r[0].tex()}$</td><td>$${r[1].tex()}$</td></tr>`).join("")}</tbody></table>`;
    return {
      intro: `<p>Ein Roboter in zwei Zellen: verborgener Zustand $H_t \\in \\{1, 2\\}$, Beobachtung $E_t \\in \\{1, 2\\}$. Anfangsbelief $P(H_0) = (${prior.map((p) => p.tex()).join(",\\ ")})$.</p>
        <div class="gk-tabs"><div><p class="small">Übergänge $P(H_{t+1} \\mid H_t)$ (Zeile: $H_t$)</p>${tab(T, "Hₜ", "Hₜ₊₁")}</div><div><p class="small">Beobachtung $P(E_t \\mid H_t)$ (Zeile: $H_t$)</p>${tab(O, "Hₜ", "Eₜ")}</div></div>`,
      parts: [
        nmMC("Welche zwei Unabhängigkeitsannahmen macht ein HMM?", ["Markov: $H_{t+1}$ hängt nur von $H_t$ ab; die Beobachtung $E_t$ hängt nur von $H_t$ ab", "Alle $E_t$ sind unabhängig voneinander", "$H_t$ ist unabhängig von $H_{t-1}$", "Die Beobachtungen bestimmen den Zustand exakt"], 1, "Übergangs- und Beobachtungsmodell."),
        nmVal(`Beobachtung $E_0 = ${e0}$: Posterior $P(H_0 = 1 \\mid E_0)$; $P(H_0 = 2 \\mid E_0)$.`, ql(post0), 3, `Prior mal Likelihood, normiert: $\\propto (${prior.map((p, h) => p.mul(O[h][e0 - 1]).tex()).join(",\\ ")})$ → $(${post0.map((v) => v.tex()).join(",\\ ")})$.`),
        nmVal("Vorhersage $P(H_1 = 1 \\mid E_0)$; $P(H_1 = 2 \\mid E_0)$.", ql(pred1), 2, `$P(H_1) = \\sum_{h_0}P(H_1 \\mid h_0)P(h_0 \\mid E_0)$ = $(${pred1.map((v) => v.tex()).join(",\\ ")})$.`),
        nmVal(`Dann $E_1 = ${e1}$: $P(H_1 = 1 \\mid E_0, E_1)$; $P(H_1 = 2 \\mid E_0, E_1)$.`, ql(post1), 2, `$\\propto (${pred1.map((p, h) => p.mul(O[h][e1 - 1]).tex()).join(",\\ ")})$, normiert $(${post1.map((v) => v.tex()).join(",\\ ")})$.`),
        nmMC("Was ist der Unterschied zwischen Filterung und Glättung?", ["Filterung: $P(H_t \\mid e_{0:t})$ mit den Beobachtungen bis jetzt; Glättung: $P(H_k \\mid e_{0:T})$ für $k < T$, auch mit späteren Beobachtungen", "Es gibt keinen", "Glättung sagt die Zukunft voraus", "Filterung braucht keine Beobachtungen"], 1, "Vorwärts gegen vorwärts-rückwärts."),
      ],
    };
  },
});

/* ================================================================ Suche (VL 14) */

// Small search graphs on a grid: positions, edges; costs are the Manhattan distance plus a little,
// so the Manhattan heuristic is admissible and consistent.
const GK_GRAPHS = [
  { pos: { S: [0, 1], A: [1, 2], B: [1, 0], C: [2, 2], D: [3, 0], G: [4, 1] }, e: [["S", "A"], ["S", "B"], ["A", "C"], ["A", "B"], ["B", "D"], ["C", "G"], ["C", "D"], ["D", "G"]] },
  { pos: { S: [0, 0], A: [0, 2], B: [2, 0], C: [2, 2], D: [3, 1], G: [4, 2] }, e: [["S", "A"], ["S", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["C", "G"], ["D", "G"]] },
  { pos: { S: [0, 2], A: [1, 0], B: [2, 2], C: [2, 0], D: [3, 1], G: [4, 0] }, e: [["S", "A"], ["S", "B"], ["A", "C"], ["B", "C"], ["B", "D"], ["C", "D"], ["C", "G"], ["D", "G"]] },
];
function gkMakeGraph() {
  const T = nmPick(GK_GRAPHS), man = (u, v) => Math.abs(T.pos[u][0] - T.pos[v][0]) + Math.abs(T.pos[u][1] - T.pos[v][1]);
  const edges = T.e.map(([u, v]) => [u, v, man(u, v) + rint(0, 3)]);
  const h = Object.fromEntries(Object.keys(T.pos).map((n) => [n, man(n, "G")]));
  return { pos: T.pos, edges, h, nodes: Object.keys(T.pos) };
}
const gkAdj = (edges, u) => edges.filter((e) => e[0] === u || e[1] === u).map((e) => [e[0] === u ? e[1] : e[0], e[2]]).sort((a, b) => a[0].localeCompare(b[0]));
// A* graph search: the fringe sorted by f, ties by insertion; a state is expanded at most once.
function gkAstar(G, hf = G.h) {
  let seq = 0;
  const fringe = [{ n: "S", g: 0, f: hf.S, path: ["S"], seq: seq++ }], closed = new Set(), order = [], steps = [];
  while (fringe.length) {
    fringe.sort((a, b) => a.f - b.f || a.seq - b.seq);
    steps.push(fringe.map((x) => `${x.path.join("")}:${x.f}`));
    const cur = fringe.shift();
    if (closed.has(cur.n)) continue;
    order.push(cur.n);
    if (cur.n === "G") return { order, path: cur.path, cost: cur.g, steps };
    closed.add(cur.n);
    gkAdj(G.edges, cur.n).forEach(([v, c]) => { if (!closed.has(v)) fringe.push({ n: v, g: cur.g + c, f: cur.g + c + hf[v], path: [...cur.path, v], seq: seq++ }); });
  }
  return null;
}
// BFS (queue) or DFS (stack) as graph search, children added alphabetically, goal test on expansion.
function gkUninformed(G, dfs) {
  const fringe = [["S"]], closed = new Set(), order = [];
  while (fringe.length) {
    const path = dfs ? fringe.pop() : fringe.shift(), n = path[path.length - 1];
    if (closed.has(n)) continue;
    order.push(n);
    if (n === "G") return { order, path };
    closed.add(n);
    gkAdj(G.edges, n).forEach(([v]) => { if (!closed.has(v)) fringe.push([...path, v]); });
  }
  return null;
}
function gkGraphSVG(G, showH = false) {
  const X = (x) => 40 + x * 105, Y = (y) => 190 - y * 75;
  return `<svg class="lw-svg gk-taskfig" viewBox="0 0 500 230" role="img" aria-label="Suchgraph">
    ${[0, 1, 2, 3, 4].map((x) => [0, 1, 2].map((y) => `<circle cx="${X(x)}" cy="${Y(y)}" r="2" class="gk-grid"/>`).join("")).join("")}
    ${G.edges.map(([u, v, c]) => { const [x1, y1] = G.pos[u], [x2, y2] = G.pos[v], mx = (X(x1) + X(x2)) / 2, my = (Y(y1) + Y(y2)) / 2;
      return `<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" class="gk-edge"/><rect x="${mx - 11}" y="${my - 11}" width="22" height="20" rx="6" class="gk-elab"/><text x="${mx}" y="${my + 4}" text-anchor="middle" class="gk-elab-t">${c}</text>`; }).join("")}
    ${G.nodes.map((n) => `<circle cx="${X(G.pos[n][0])}" cy="${Y(G.pos[n][1])}" r="16" class="gk-node ${n === "S" || n === "G" ? "on" : ""}"/><text x="${X(G.pos[n][0])}" y="${Y(G.pos[n][1]) + 5}" text-anchor="middle" class="gk-node-t">${n}</text>
      ${showH ? `<text x="${X(G.pos[n][0])}" y="${Y(G.pos[n][1]) - 22}" text-anchor="middle" class="tick-t">h=${G.h[n]}</text>` : ""}`).join("")}
  </svg>`;
}

gkTask({
  id: "astar", topic: "search", name: "A*-Suche auf einem geometrischen Graphen", like: "24-ss/5",
  make() {
    let G, r;
    do { G = gkMakeGraph(); r = gkAstar(G); } while (!r || r.order.length < 4);
    // True costs to G, for the question about 2h.
    const cost = Object.fromEntries(G.nodes.map((n) => [n, gkDijkstra(G.nodes, G.edges, n, "G").cost]));
    const adm2 = G.nodes.every((n) => 2 * G.h[n] <= cost[n]);
    return {
      intro: `<p>Gesucht ist der kürzeste Pfad von $S$ nach $G$; die Zahlen sind die Kantenkosten, die Knoten liegen auf einem Gitter (Abstand 1 zwischen benachbarten Gitterpunkten). Heuristik $h(X)$: Manhattan-Distanz von $X$ zu $G$.
        A*-<b>Graphsuche</b>: jeder Zustand wird höchstens einmal expandiert; Kinder werden alphabetisch eingefügt, bei gleicher Priorität kommt der früher eingefügte zuerst; Abbruch, wenn $G$ zum Expandieren gewählt wird.</p>${gkGraphSVG(G)}`,
      parts: [
        nmVal("Die Heuristik $h(S)$; $h(A)$; $h(B)$; $h(C)$; $h(D)$; $h(G)$.", ql(["S", "A", "B", "C", "D", "G"].map((n) => G.h[n])), 2, `Manhattan-Distanz: ${G.nodes.map((n) => `$h(${n}) = ${G.h[n]}$`).join(", ")}.`),
        nmVal("In welcher Reihenfolge werden die Knoten expandiert? (Buchstaben, z. B. S A C G)", gkLetters(r.order), 2, `Fringe in jedem Schritt (Pfad:f): ${r.steps.map((s, i) => `${i + 1}. [${s.join(", ")}]`).join(" · ")}`),
        nmVal("Welchen Pfad findet A*? (Buchstaben)", gkLetters(r.path), 1, `${r.path.join(" → ")}.`),
        nmVal("Welche Kosten hat er?", r.cost, 1, "Die Manhattan-Heuristik ist zulässig (und konsistent), also ist der Pfad optimal."),
        nmMC("Ist die Heuristik $h'(X) = 2h(X)$ für diesen Graphen zulässig?", adm2 ? ["Ja: hier überschätzt $2h$ an keinem Knoten die wahren Kosten", "Nein"] : ["Nein: an mindestens einem Knoten ist $2h$ größer als die wahren Restkosten", "Ja"], 1,
          `Wahre Restkosten: ${G.nodes.map((n) => `$h^*(${n}) = ${cost[n]}$`).join(", ")}. Zulässig heißt $h(n) \\le h^*(n)$ für alle $n$.`, true),
        nmMC("Wann ist eine Heuristik zulässig (admissible)?", ["Wenn sie die wahren Kosten zum Ziel nie überschätzt: $0 \\le h(n) \\le h^*(n)$", "Wenn sie immer 0 ist", "Wenn sie die Kosten immer überschätzt", "Wenn $h(G) > 0$"], 1, "Dann findet A*-Baumsuche einen optimalen Pfad."),
      ],
    };
  },
});

gkTask({
  id: "bfsdfs", topic: "search", name: "Breiten- und Tiefensuche", like: "25-ss/6",
  make() {
    let G, b, d;
    do { G = gkMakeGraph(); b = gkUninformed(G, false); d = gkUninformed(G, true); } while (!b || !d);
    return {
      intro: `<p>Derselbe Aufbau wie bei A*: Start $S$, Ziel $G$, Kantenkosten an den Kanten. <b>Graphsuche</b>: ein Zustand wird höchstens einmal expandiert. Beim Expandieren werden die Kinder <b>alphabetisch</b> in die Fringe eingefügt; welcher Knoten als Nächstes expandiert wird, ergibt sich aus der Datenstruktur. Abbruch, wenn $G$ expandiert wird.</p>${gkGraphSVG(G)}`,
      parts: [
        nmMC("Welche Datenstrukturen verwalten die Fringe bei BFS, DFS und A*?", ["Queue (FIFO), Stack (LIFO), Prioritätswarteschlange", "Stack, Queue, Liste", "Prioritätswarteschlange für alle", "Queue, Queue, Stack"], 1, "WS 22/23, 1.1; SS 26, 4-2."),
        nmVal("BFS: Reihenfolge der Expansionen (Buchstaben).", gkLetters(b.order), 2, `Gefundener Pfad: ${b.path.join(" → ")}.`),
        nmVal("DFS: Reihenfolge der Expansionen (Buchstaben).", gkLetters(d.order), 2, `Der zuletzt eingefügte (alphabetisch letzte) Knoten wird zuerst expandiert. Gefundener Pfad: ${d.path.join(" → ")}.`),
        nmMC("Wann ist BFS optimal?", ["Wenn alle Kanten gleiche Kosten haben", "Immer", "Nie", "Wenn die Heuristik zulässig ist"], 1, "BFS findet den Pfad mit den wenigsten Kanten."),
        nmMC("Ist DFS als Baumsuche vollständig?", ["Nein: auf Graphen mit Zyklen (oder unendlicher Tiefe) kann sie endlos laufen", "Ja, immer", "Ja, wenn es einen Pfad gibt", "Nur mit Heuristik"], 1, "Etwa S ↔ A hin und her (WS 24/25, 5.2)."),
      ],
    };
  },
});

gkTask({
  id: "searchconcept", topic: "search", name: "Suchprobleme: Begriffe", like: "2526-ws/4",
  make() {
    const n = rint(4, 7), fact = [1, 1, 2, 6, 24, 120, 720, 5040][n];
    return {
      intro: `<p>Ein Stapel aus $n = ${n}$ verschieden großen Pfannkuchen (oder Büchern) soll sortiert werden; ein Zustand ist eine Reihenfolge.</p>`,
      parts: [
        nmMC("Was gehört zu einem Suchproblem?", ["Zustandsraum, Startzustand, Nachfolgerfunktion mit Aktionen und Kosten, Zieltest", "Daten, Labels, Loss, Optimierer", "Nur Start und Ziel", "Zustände, Rewards, Discount"], 1, "WS 25/26, 4-1."),
        nmVal("Wie viele Zustände hat das Problem?", fact, 1, `Alle Reihenfolgen: $${n}! = ${fact}$ — wächst exponentiell (Curse of Dimensionality).`),
        nmMC("Was ist der Unterschied zwischen Zustandsraumgraph und Suchbaum?", ["Im Graphen kommt jeder Zustand einmal vor; im Suchbaum steht ein Knoten für einen Pfad, ein Zustand kann mehrfach vorkommen", "Es gibt keinen", "Der Suchbaum hat keine Kosten", "Der Graph ist immer ein Baum"], 1, "Graphsuche merkt sich expandierte Zustände, Baumsuche nicht."),
        nmMC("A* mit $h \\equiv 0$ ist …", ["Uniform-Cost-Suche", "Tiefensuche", "Greedy-Suche", "Breitensuche"], 1, "Nur $g$ zählt."),
        nmMC("Eine Baumsuche, die die Fringe nur nach $h$ sortiert, ist …", ["Greedy-Suche", "A*", "Uniform-Cost-Suche", "BFS"], 1, "Schnell, aber nicht optimal."),
        nmMC("$h_1$ und $h_2$ sind zulässig mit $h_1 \\le h_2$ überall. Welche nimmt man für A*?", ["$h_2$: sie ist genauer (dominiert $h_1$) und expandiert höchstens so viele Knoten", "$h_1$, weil sie kleiner ist", "Egal", "Keine von beiden"], 1, "SS 24, 5.2."),
      ],
    };
  },
});

// Implications over S1, S2 (difficult), L1, L2 (solvable), B (passed); a conclusion is "B", "¬B" or none.
gkTask({
  id: "logic", topic: "search", name: "Logik: was folgt?", like: "2324-ws/1",
  make() {
    const T = nmPick([
      { prem: ["\\neg S_1 \\to L_1", "S_2 \\to \\neg L_2", "L_1 \\wedge L_2 \\to B"], f: (v) => (!v.S1 ? v.L1 : true) && (v.S2 ? !v.L2 : true) && (v.L1 && v.L2 ? v.B : true) },
      { prem: ["\\neg S_1 \\to L_1", "\\neg S_2 \\to L_2", "L_1 \\wedge L_2 \\to B"], f: (v) => (!v.S1 ? v.L1 : true) && (!v.S2 ? v.L2 : true) && (v.L1 && v.L2 ? v.B : true) },
      { prem: ["S_1 \\to \\neg L_1", "\\neg S_2 \\to L_2", "L_1 \\vee L_2 \\to B"], f: (v) => (v.S1 ? !v.L1 : true) && (!v.S2 ? v.L2 : true) && (v.L1 || v.L2 ? v.B : true) },
      { prem: ["\\neg S_1 \\to L_1", "L_1 \\to B", "S_2 \\to \\neg B"], f: (v) => (!v.S1 ? v.L1 : true) && (v.L1 ? v.B : true) && (v.S2 ? !v.B : true) },
    ]);
    const S1 = !!rint(0, 1), S2 = !!rint(0, 1);
    const models = [];
    for (let m = 0; m < 8; m++) { const v = { S1, S2, L1: !!(m & 1), L2: !!(m & 2), B: !!(m & 4) }; if (T.f(v)) models.push(v); }
    const ans = !models.length ? "Widerspruch" : models.every((v) => v.B) ? "Ja, B folgt" : models.every((v) => !v.B) ? "Ja, ¬B folgt" : "Nein, es fehlt Information";
    return {
      intro: `<p>$S_n$: Aufgabe $n$ ist schwierig. $L_n$: Sie können Aufgabe $n$ lösen. $B$: Sie bestehen. Bekannt: $${T.prem.join(",\\quad ")}$.</p>
        <p>Die Prüfung hat ${S1 ? "eine schwierige" : "eine leichte"} Aufgabe 1 und ${S2 ? "eine schwierige" : "eine leichte"} Aufgabe 2: $${S1 ? "" : "\\neg "}S_1$, $${S2 ? "" : "\\neg "}S_2$.</p>`,
      parts: [
        nmMC("Können Sie daraus schließen, ob Sie bestehen?", [ans, ...["Ja, B folgt", "Ja, ¬B folgt", "Nein, es fehlt Information"].filter((x) => x !== ans)], 2,
          `Alle Belegungen von $L_1, L_2, B$, die die Prämissen erfüllen: ${models.map((v) => `$(${+v.L1}, ${+v.L2}, ${+v.B})$`).join(", ")}. ${ans.startsWith("Nein") ? "$B$ ist in manchen wahr, in manchen falsch." : ""}`, true),
        nmMC("Was ist der Unterschied zwischen Syntax und Semantik in der Logik?", ["Syntax: welche Symbole und Formeln gültig gebildet sind; Semantik: ihre Bedeutung, wann eine Formel wahr ist", "Syntax ist die Bedeutung, Semantik die Schreibweise", "Es gibt keinen", "Syntax gilt nur für Prädikatenlogik"], 2, "WS 23/24, 1.2(a)."),
      ],
    };
  },
});

/* ================================================================ Allgemeine Fragen */

// Short questions across the whole lecture for the first task of an exam. [topic, question, right, wrong…, why]
const GK_ALLG_MC = [
  ["reg", "Was ist der Unterschied zwischen Hyperparametern und Modellparametern?", "Hyperparameter werden vor dem Training festgelegt (Grad, λ, Lernrate), Modellparameter werden gelernt (Gewichte)", "Es gibt keinen", "Hyperparameter werden auf dem Test gelernt", "Modellparameter wählt man auf der Validierung", "WS 24/25, 1.2."],
  ["reg", "Welche Regularisierung führt direkt zur Merkmalsauswahl?", "L1", "L2", "Dropout", "Early Stopping", "Gewichte exakt null."],
  ["prob", "Wie heißt $p(x \\mid y)$ im Satz von Bayes (Ziel: $x$)?", "Posterior", "Prior", "Likelihood", "Evidenz", "$p(y \\mid x)$ ist die Likelihood."],
  ["prob", "Was bedeutet i.i.d.?", "Unabhängig und identisch verteilt", "Immer identisch definiert", "Unabhängig, aber verschieden verteilt", "Integriert in Daten", "Die gemeinsame Verteilung faktorisiert."],
  ["cls", "Warum ist lineare Regression für binäre Klassifikation ungeeignet?", "Ihr Output ist unbeschränkt und keine Wahrscheinlichkeit; weit entfernte Punkte verzerren die Grenze", "Sie hat zu wenige Parameter", "Sie kann keine Gerade darstellen", "Sie braucht Gradientenabstieg", "SS 26, 1-2."],
  ["cls", "Welche Metrik ist bei 98 % / 2 % Klassenverteilung aussagekräftiger als Accuracy?", "Recall (oder F₁, Precision, AUC)", "Accuracy auf mehr Daten", "Der Trainingsloss", "Die Zahl der Parameter", "WS 25/26, 1-4."],
  ["cls", "Ein Datensatz: Klasse 1 innen, Klasse 0 als Ring. Welches Merkmal macht ihn linear trennbar?", "$x_1^2 + x_2^2$", "$x_1 + x_2$", "$x_1$", "$x_1 - x_2$", "Eine Schwelle auf dem Radius."],
  ["opt", "Wie lautet ein Schritt des Gradientenabstiegs?", "$\\theta \\leftarrow \\theta - \\eta\\nabla L(\\theta)$", "$\\theta \\leftarrow \\theta + \\eta\\nabla L(\\theta)$", "$\\theta \\leftarrow \\eta L(\\theta)$", "$\\theta \\leftarrow \\nabla L(\\theta)$", "Entgegen dem Gradienten."],
  ["opt", "Findet Gradientenabstieg bei einem neuronalen Netz immer das globale Minimum?", "Nein: der Loss ist nicht konvex, es gibt lokale Minima und Sattelpunkte", "Ja, immer", "Ja, mit genug Epochen", "Nur mit SGD", "WS 25/26, 2-5."],
  ["nn", "Wozu dient die Loss-Funktion beim Training?", "Sie misst, wie schlecht die Vorhersagen sind — das, was die Optimierung minimiert", "Sie bestimmt die Lernrate", "Sie wählt die Architektur", "Sie normiert die Eingaben", "SS 24, 2.1."],
  ["nn", "Was macht Backpropagation effizient?", "Die Kettenregel wird rückwärts angewendet und Zwischenergebnisse werden wiederverwendet: Aufwand wie ein Forward Pass", "Sie berechnet jede Ableitung einzeln numerisch", "Sie braucht keinen Forward Pass", "Sie ignoriert tiefe Schichten", "SS 25, 2.1."],
  ["gen", "Was ist die Kapazität eines Modells?", "Wie komplexe Funktionen es darstellen kann", "Die Größe des Datensatzes", "Der Speicher der GPU", "Die Zahl der Epochen", "SS 24, 1.1."],
  ["gen", "Trainings- und Validierungsfehler stagnieren beide auf hohem Niveau. Was liegt nahe?", "Unteranpassung: Modell zu einfach — mehr Kapazität", "Überanpassung: mehr Regularisierung", "Zu viele Daten", "Die Lernrate ist perfekt", "SS 25, 3.8."],
  ["gen", "Was ist Bagging?", "Jedes Ensemble-Modell auf einer Bootstrap-Stichprobe (mit Zurücklegen) trainieren", "Modelle nacheinander auf den Fehlern der vorigen trainieren", "Alle Modelle auf denselben Daten", "Daten in Beutel sortieren", "Boosting wäre das sequenzielle Verfahren."],
  ["gen", "Was ist Boosting?", "Modelle nacheinander trainieren, jedes korrigiert die Fehler der vorigen", "Bootstrap-Stichproben parallel", "Die Lernrate erhöhen", "Ein größeres Netz", "WS 24/25, 1.4."],
  ["dimred", "Was maximiert die erste Hauptkomponente?", "Die Varianz der projizierten Daten (unter $\\|u\\| = 1$)", "Den Rekonstruktionsfehler", "Die Zahl der Cluster", "Die Likelihood eines GMM", "Eigenvektor zum größten Eigenwert der Kovarianz."],
  ["dimred", "Was gilt für die Hauptkomponenten $u_i^\\top u_j$?", "$1$ für $i = j$, $0$ sonst: orthonormal", "immer $1$", "immer $0$", "beliebig", "SS 24, 3.2."],
  ["dimred", "Was unterscheidet einen Denoising Autoencoder?", "Er bekommt verrauschte Eingaben und soll die sauberen rekonstruieren", "Er hat keinen Decoder", "Er ist linear", "Er braucht Labels", "SS 25, 1.3."],
  ["clust", "Wie vermeidet man bei k-Means schlechte lokale Optima?", "Mehrere zufällige Starts (oder k-means++) und den besten nehmen", "k = N wählen", "Die Distanz quadrieren", "Nur einen Iterationsschritt", "WS 25/26, 1-6."],
  ["dens", "Ein Vorteil von GMMs gegenüber k-Means?", "Elliptische Cluster verschiedener Größe und weiche Zuordnungen (Wahrscheinlichkeiten)", "Sie brauchen kein k", "Sie sind immer schneller", "Sie haben keine Parameter", "WS 24/25, 1.6; SS 26, 1-4."],
  ["dens", "Histogramm: wie schätzt man $p(x)$ in einer Region mit Volumen $V$ und $K$ von $N$ Punkten?", "$p(x) \\approx \\frac{K}{NV}$", "$\\frac{N}{KV}$", "$\\frac{K}{N}$", "$KV$", "WS 22/23, 5.1."],
  ["cnn", "Was ist Parameter-Sharing in CNNs?", "Derselbe Filter (dieselben Gewichte) wird an allen Bildpositionen verwendet", "Mehrere Netze teilen sich die Daten", "Alle Layer haben dieselben Gewichte", "Der Bias wird geteilt", "SS 25, 1.7."],
  ["cnn", "Was ist das rezeptive Feld eines Neurons?", "Der Bereich der Eingabe, der seinen Wert beeinflusst — wächst mit der Tiefe", "Die Zahl seiner Gewichte", "Seine Aktivierung", "Die Größe des Datensatzes", "SS 23, 6.2."],
  ["cnn", "Was bringen Residual Connections?", "Gradienten fließen leichter durch tiefe Netze; die Schicht muss nur eine Korrektur lernen", "Weniger Parameter", "Kein Training nötig", "Größere Bilder", "WS 24/25, 4.4."],
  ["rnn", "Was ist ein Nachteil von One-Hot-Encoding für Wörter?", "Sehr hochdimensional und dünn; ähnliche Wörter sind nicht ähnlich (alle Vektoren orthogonal)", "Es kann keine Wörter darstellen", "Es ist zu klein", "Es braucht Labels", "SS 26, 5.6."],
  ["rl", "Was ist die Markov-Eigenschaft?", "Der nächste Zustand hängt nur vom aktuellen Zustand (und der Aktion) ab, nicht von der Vorgeschichte", "Alle Zustände sind gleich wahrscheinlich", "Rewards sind immer positiv", "Die Policy ist deterministisch", "WS 22/23, 8.1."],
  ["rl", "Was ist das Ziel eines RL-Agenten?", "Eine Policy, die die erwartete diskontierte Summe zukünftiger Rewards maximiert", "Den Loss auf Labels minimieren", "Alle Zustände besuchen", "Den sofortigen Reward maximieren", "WS 23/24, 8.1."],
  ["rl", "Stochastische gegen deterministische Policy?", "Deterministisch: eine Aktion pro Zustand; stochastisch: eine Verteilung über Aktionen", "Es gibt keinen Unterschied", "Stochastisch heißt zufällige Rewards", "Deterministisch heißt ohne Zustände", "WS 25/26, 1-5."],
  ["rl", "Monte Carlo gegen TD: wann wird aktualisiert?", "MC am Ende der Episode mit dem ganzen Return, TD nach jedem Schritt mit einer Schätzung (Bootstrapping)", "Beide am Ende", "Beide nach jedem Schritt", "TD nie", "SS 26, 1-7."],
  ["hmm", "Filterung im HMM berechnet …", "$P(H_t \\mid e_{1:t})$", "$P(H_k \\mid e_{1:T})$ für $k < T$", "die wahrscheinlichste Folge", "$P(e_t)$ allein", "Glättung nutzt auch spätere Beobachtungen."],
  ["search", "Wann ist ein Suchalgorithmus vollständig, wann optimal?", "Vollständig: findet eine Lösung, wenn es eine gibt; optimal: findet die günstigste", "Vollständig: findet alle Lösungen; optimal: ist schnell", "Beides heißt dasselbe", "Optimal: expandiert wenig Knoten", "SS 23, 1.1(c)."],
  ["intro", "In welche drei Bereiche teilt man ML nach der Art der Daten?", "Überwacht (x mit y), unüberwacht (nur x), Reinforcement Learning (Belohnungen)", "Klein, mittel, groß", "Linear, nichtlinear, tief", "Bild, Text, Ton", "SS 23, 6.1."],
];
const GK_ALLG_W = [
  ["gen", "Ein Netz hat 99 % Accuracy auf den Trainings-, aber nur 72 % auf den Testdaten. Welches Phänomen? Zwei Gegenmaßnahmen.", "Überanpassung: das Netz lernt die Trainingsdaten (samt Rauschen) auswendig und generalisiert schlecht. Gegenmaßnahmen: Regularisierung (L2/weight decay, Dropout), Early Stopping, mehr Daten oder Data Augmentation, kleineres Modell.", [[1, "Overfitting mit Erklärung"], [1, "zwei passende Maßnahmen mit kurzer Begründung"]]],
  ["gen", "Erklären Sie den Unterschied zwischen Validierungs- und Testdaten. Warum ist es Schummeln, Hyperparameter auf dem Test zu wählen?", "Validierung: Hyperparameter und Modellvariante auswählen. Test: am Ende einmal die Leistung schätzen. Wählt man auf dem Test aus, passt man sich an ihn an — die Testleistung ist dann zu optimistisch und schätzt die Leistung auf neuen Daten nicht mehr ehrlich.", [[1, "Rollen der beiden Datensätze"], [1, "Begründung: optimistische, verzerrte Schätzung"]]],
  ["reg", "Wie beeinflussen L1- und L2-Regularisierung die Gewichte qualitativ? Geben Sie beide Strafterme an.", "L2: $\\lambda\\sum_jw_j^2$ — alle Gewichte werden gleichmäßig kleiner, selten exakt null. L1: $\\lambda\\sum_j|w_j|$ — viele Gewichte werden exakt null (sparse, Merkmalsauswahl).", [[1, "beide Formeln"], [1, "L2 schrumpft, L1 setzt auf null"]]],
  ["cls", "Skizzieren Sie die Sigmoidfunktion (mit 0; 0,5; 1) und erklären Sie, warum sie für Klassifikation vorteilhaft ist.", "S-förmig, $\\sigma(z) \\to 0$ für $z \\to -\\infty$, $\\sigma(0) = 0{,}5$, $\\to 1$ für $z \\to \\infty$. Vorteil: Werte in $(0, 1)$, als Wahrscheinlichkeit für Klasse 1 lesbar; differenzierbar; weit entfernte Punkte sättigen statt den Loss zu dominieren.", [[1, "Form mit den drei Werten"], [1, "Wahrscheinlichkeit, differenzierbar / Sättigung"]]],
  ["cls", "Was ist der Unterschied zwischen generativen und diskriminativen Modellen?", "Generativ: modelliert $p(x \\mid y)$ und $p(y)$ (also $p(x, y)$) und klassifiziert mit Bayes; kann Daten erzeugen. Diskriminativ: modelliert direkt $p(y \\mid x)$ (z. B. logistische Regression).", [[1, "generativ: $p(x \\mid y)p(y)$"], [1, "diskriminativ: $p(y \\mid x)$"]]],
  ["opt", "Erklären Sie Mini-Batch- und stochastischen Gradientenabstieg und ihren Unterschied.", "Beide schätzen den Gradienten aus einer Teilmenge: SGD aus einem Beispiel ($N$ Updates pro Epoche), Mini-Batch aus $B$ Beispielen ($\\lceil N/B\\rceil$ Updates). Mini-Batch ist weniger verrauscht und nutzt Hardware parallel; SGD ist am billigsten pro Update, aber am lautesten.", [[1, "SGD: ein Beispiel pro Update"], [1, "Mini-Batch: B Beispiele, Vergleich"]]],
  ["dimred", "Erklären Sie Aufbau und Funktion eines Autoencoders. Zu welchem Lernparadigma gehört er?", "Ein Encoder bildet die Eingabe auf einen niederdimensionalen Code ab, ein Decoder rekonstruiert daraus die Eingabe; trainiert wird auf den Rekonstruktionsfehler. Unüberwacht (bzw. selbstüberwacht): die Eingabe ist ihr eigenes Ziel, keine Labels nötig.", [[1, "Encoder, Code, Decoder, Rekonstruktionsfehler"], [1, "unüberwacht mit Begründung"]]],
  ["dimred", "Nennen Sie zwei Unterschiede zwischen PCA und Autoencoder.", "PCA ist linear, ein Autoencoder (mit Aktivierungen) nichtlinear. PCA hat eine geschlossene Lösung (Eigenvektoren), der AE wird iterativ trainiert. PCA-Komponenten sind orthogonal und nach Varianz geordnet, AE-Codes nicht.", [[1, "linear gegen nichtlinear"], [1, "ein weiterer Unterschied"]]],
  ["dens", "Beschreiben Sie E- und M-Schritt des EM-Algorithmus für GMMs.", "E-Schritt: mit den aktuellen Parametern die Responsibilities $q_{ik}$ berechnen — wie wahrscheinlich Punkt $i$ zu Komponente $k$ gehört. M-Schritt: $\\pi_k$, $\\mu_k$, $\\Sigma_k$ als mit $q_{ik}$ gewichtete ML-Schätzungen neu berechnen. Wiederholen bis zur Konvergenz.", [[1, "E: Responsibilities"], [1, "M: gewichtete Schätzung der Parameter"]]],
  ["cnn", "Nennen Sie zwei Methoden der Data Augmentation bei CNNs und erklären Sie, warum man sie verwendet.", "Z. B. kleine Verschiebungen, Rotationen, Zuschneiden, Helligkeit/Kontrast ändern, Rauschen. Mehr (künstliche) Trainingsdaten, das Netz wird invariant gegenüber diesen Änderungen, weniger Überanpassung. Nur Transformationen, die das Label nicht ändern (horizontales Spiegeln nicht bei Buchstaben oder Verkehrszeichen).", [[1, "zwei sinnvolle Methoden"], [1, "Zweck: Invarianz, weniger Overfitting"]]],
  ["rnn", "Welchen Vorteil haben RNNs bei Texten gegenüber Feed-forward-Netzen, und wie erreichen sie ihn?", "Texte haben variable Länge und Reihenfolge. Ein RNN verarbeitet Token für Token mit denselben Gewichten und trägt einen versteckten Zustand $h_t = f(W^Hh_{t-1} + W^Xx_t + b)$ weiter, der den bisherigen Kontext zusammenfasst.", [[1, "variable Länge, Reihenfolge"], [1, "geteilte Gewichte und versteckter Zustand"]]],
  ["rl", "Nennen Sie zwei Erweiterungen, die Deep Q-Learning stabilisieren, und was sie bewirken.", "Experience Replay Buffer: zufällige Mini-Batches aus gespeicherten Transitionen brechen die Korrelation aufeinanderfolgender Daten, Erfahrung wird mehrfach genutzt. Target Network: die Ziele $r + \\gamma\\max Q_{\\text{target}}(s', a')$ kommen aus einer langsam aktualisierten Kopie — keine beweglichen Ziele.", [[1, "Replay Buffer mit Wirkung"], [1, "Target-Netz mit Wirkung"]]],
  ["hmm", "Erklären Sie den Explaining-Away-Effekt an einem einfachen Beispiel.", "Zwei unabhängige Ursachen eines Effekts, z. B. Einbruch → Alarm ← Erdbeben. Ohne Beobachtung sind sie unabhängig. Wird der Alarm beobachtet, und erfährt man, dass es ein Erdbeben gab, sinkt die Wahrscheinlichkeit für einen Einbruch: die eine Ursache erklärt den Effekt weg.", [[1, "Bayes-Netz: zwei Ursachen, ein Effekt"], [1, "beobachteter Effekt macht die Ursachen abhängig"]]],
  ["intro", "Geben Sie die Definition eines rationalen Agenten.", "Ein Agent, der für jede Wahrnehmungsfolge die Aktion wählt, die sein erwartetes Leistungsmaß maximiert — gegeben seine Wahrnehmungen und sein Wissen.", [[1, "Aktion, die das erwartete Leistungsmaß maximiert"], [1, "auf Basis von Wahrnehmungen / Wissen"]]],
];

gkTask({
  id: "allg", topic: "allg", name: "Allgemeine Fragen", likeText: "Aufgabe 1 jeder Klausur seit SS 24",
  make(onlyTaught = false) {
    const ok = (t) => !onlyTaught || gkTaught(t);
    const mc = shuffle(GK_ALLG_MC.filter(([t]) => ok(t))).slice(0, 7);
    const wr = shuffle(GK_ALLG_W.filter(([t]) => ok(t))).slice(0, 4);
    return {
      intro: `<p class="small">Beantworten Sie die Fragen in wenigen Sätzen oder Stichpunkten. Quer durch den Stoff${onlyTaught ? ` (nur VL 1–${GKI_VL_DONE})` : ""}.</p>`,
      parts: shuffle([
        ...mc.map(([t, q, right, ...rest]) => nmMC(`${gkTopicPill(t)} ${q}`, [right, ...rest.slice(0, -1)], 1, rest[rest.length - 1])),
        ...wr.map(([t, q, model, rub]) => nmW(`${gkTopicPill(t)} ${q}`, model, rub)),
      ]),
    };
  },
});
