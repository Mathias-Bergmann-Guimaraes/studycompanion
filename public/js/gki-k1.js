// GKI chapter 1: Einführung (VL 1, 26.10.2026, Benjamin Schäfer) — what AI systems do and what they
// risk, the history of AI, terms and agents, and modelling, learning and reasoning.

/* ---------------------------------------------------------------- 1.1 Aufgaben einordnen */

// The lecture's examples: what goes in, what comes out, where the feedback for learning comes from,
// whether one step is enough, and how the EU AI Act would typically classify the use.
const GK_TASKS = {
  spam: { name: "Spamfilter", in: "Inhalt und Merkmale einer E-Mail", out: "Spam-Wahrscheinlichkeit und eine Entscheidung", kind: "Klassifikation", sig: "überwacht: Mails mit Label Spam / kein Spam", seq: false, act: 3, vl: "VL 3" },
  mnist: { name: "Ziffern erkennen", in: "Bild aus 28 × 28 Pixeln (MNIST: 60 000 Trainings-, 10 000 Testbilder)", out: "Klasse aus {0, …, 9}", kind: "Klassifikation", sig: "überwacht: Bild + Klasse", seq: false, act: 3, vl: "VL 3, VL 9" },
  gen: { name: "Bildgenerator", in: "Beschreibung (Text)", out: "Bild", kind: "Generierung", sig: "selbstüberwacht auf vielen Bild-Text-Paaren", seq: false, act: 2, vl: "VL 8, VL 10" },
  llm: { name: "Sprachmodell", in: "Kontext: bisherige Tokens", out: "Verteilung über das nächste Token", kind: "Generierung (Token für Token)", sig: "selbstüberwacht: nächstes Token", seq: true, act: 2, vl: "VL 10", note: "Wiederholte Vorhersage erzeugt Text. Das Vortrainingsziel garantiert keine faktische Korrektheit — und ein gewähltes Token wird nicht zurückgenommen." },
  forecast: { name: "Wind- und Solarprognose", in: "beobachtete Zeitreihe (Vergangenheit)", out: "Fortsetzung in die Zukunft", kind: "Regression / Vorhersage", sig: "überwacht: die Zukunft wird später beobachtet", seq: false, act: 3, vl: "VL 2, VL 10" },
  route: { name: "Routenplaner", in: "Graph G = (V, E) mit Kosten c(u, v), Start und Ziel", out: "günstigste Route", kind: "Planung (Suche)", sig: "keins nötig — oder Fahrzeiten aus Beobachtungen lernen", seq: true, act: 3, vl: "VL 14" },
  chess: { name: "Schach, Go", in: "Stellung (Zustand s)", out: "Zug (Aktion a)", kind: "Planung / Entscheidung", sig: "Deep Blue: Suche + Bewertung von Hand; AlphaGo: gelernte Bewertung + Suche", seq: true, act: 3, vl: "VL 11, 12, 14" },
  robot: { name: "Roboter", in: "Kameras und Sensoren: Beobachtungen", out: "Aktionen wie Greifen oder Bewegen", kind: "Entscheidung (Policy)", sig: "Demonstrationen oder Belohnungen (RL)", seq: true, act: 1, vl: "VL 11–13" },
  hire: { name: "Bewerbungen vorsortieren", in: "Lebenslauf, Anschreiben", out: "Rangfolge der Bewerbungen", kind: "Klassifikation / Ranking", sig: "überwacht: frühere Entscheidungen — mit deren Bias", seq: false, act: 1, vl: "VL 3" },
};
const GK_ACT = ["Verbotene Praktiken", "Hochrisiko", "Transparenzpflichten", "Geringes / minimales Risiko"];
const GK_ACT_EX = ["z. B. bestimmte Manipulation", "z. B. Personalauswahl", "z. B. Chatbots, Deepfakes", "z. B. Spamfilter"];

function gkWTasks(root) {
  const { w, fig, read } = ppW(root, "tasks");
  const st = { ex: "spam" };
  const draw = () => {
    const T = GK_TASKS[st.ex];
    const box = (x, label, body, cls) => `<g><rect x="${x}" y="54" width="150" height="92" rx="14" class="gk-box ${cls}"/>
      <text x="${x + 75}" y="76" text-anchor="middle" class="gk-box-t">${label}</text>
      <foreignObject x="${x + 8}" y="82" width="134" height="62"><div class="gk-fo">${body}</div></foreignObject></g>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 210" role="img" aria-label="Eingabe, Modell, Ausgabe">
      ${box(10, "Eingabe", T.in, "")}
      ${arrowSVG(162, 100, 196, 100, "gk-arr")}
      <rect x="200" y="64" width="120" height="72" rx="36" class="gk-box gk-model"/><text x="260" y="96" text-anchor="middle" class="gk-box-t">Modell</text>
      <text x="260" y="116" text-anchor="middle" class="tick-t">${T.kind.split(" ")[0]}</text>
      ${arrowSVG(324, 100, 358, 100, "gk-arr")}
      ${box(360, "Ausgabe", T.out, "gk-out")}
      ${T.seq ? `<path d="M435 150 C 435 200, 260 205, 260 140" class="gk-loop"/><polygon points="254,146 260,134 266,146" class="gk-loop-h"/>
        <text x="350" y="200" text-anchor="middle" class="tick-t">die Ausgabe ändert, was als Nächstes beobachtet wird</text>` : ""}
    </svg>`;
    const kv = (k, v) => `<div><span>${k}</span><b>${v}</b></div>`;
    read.innerHTML = `<div class="gk-kv">${kv("Aufgabe", T.kind)}${kv("Lernsignal", T.sig)}
      ${kv("Ein Schritt?", T.seq ? "nein — eine Folge von Entscheidungen" : "ja — eine Vorhersage pro Eingabe")}
      ${kv("EU AI Act (typisch)", GK_ACT[T.act])}${kv("Später", T.vl)}</div>
      ${T.note ? `<p class="small">${T.note}</p>` : ""}`;
  };
  lenWire(w, st, draw);
  draw();
}

function gkActPyramid() {
  const rows = GK_ACT.map((name, i) => {
    const y = 10 + i * 46, half = 70 + i * 48;
    return `<polygon points="${260 - half},${y + 44} ${260 + half},${y + 44} ${260 + half - 24},${y} ${260 - half + 24},${y}" class="gk-act gk-act-${i}"/>
      <text x="260" y="${y + 27}" text-anchor="middle" class="gk-act-t">${name}</text>
      <text x="${260 + half + 6}" y="${y + 27}" class="tick-t">${GK_ACT_EX[i]}</text>`;
  }).join("");
  return `<svg class="lw-svg gk-pyr" viewBox="0 0 640 200" role="img" aria-label="Risikostufen des EU AI Act">${rows}</svg>`;
}

/* ---------------------------------------------------------------- 1.2 Geschichte */

// [year (or start), end, title, text, kind] — kind: idee, symb (Regeln, Logik, Suche), lern (Lernen), winter, erfolg.
const GK_HISTORY = [
  [1843, 0, "Ada Lovelace", "Was können Maschinen selbst hervorbringen? — eine frühe Frage nach maschineller Kreativität.", "idee"],
  [1950, 0, "Turing: Imitation Game", "Wie beurteilen wir das Verhalten einer Maschine? Turing schlägt einen Test vor, statt „Denken“ zu definieren.", "idee"],
  [1951, 0, "SNARC", "Minsky und Edmonds bauen ein künstliches neuronales Netz aus Röhren; parallel entstehen Spielprogramme, Logik und Suche.", "lern"],
  [1956, 0, "Dartmouth: KI erhält einen Namen", "Projektvorschlag 1955 von McCarthy, Minsky, Rochester und Shannon, Treffen 1956 — großer Optimismus.", "symb"],
  [1958, 0, "Perzeptron", "Ein einzelnes lineares Neuron, das aus Beispielen lernt. (Zu) hohe Erwartungen: Schachweltmeister in zehn Jahren (Simon/Newell 1958), jede Arbeit binnen 20 Jahren (Simon 1965), allgemeine KI in wenigen Jahren (Minsky 1970).", "lern"],
  [1966, 0, "ELIZA", "Ein früher Dialog: Muster und Regeln, die erstaunlich menschlich wirken.", "symb"],
  [1969, 0, "Minsky & Papert: Perceptrons", "Ein einzelnes Perzeptron kann XOR nicht trennen — Darstellbarkeit, nicht Lernen ist die Grenze. Mehrschichtige Netze können es.", "lern"],
  [1974, 1980, "Erster KI-Winter", "Erwartungen treffen auf Grenzen: Suchräume wachsen zu schnell, ein Perzeptron kann XOR nicht, das Geld wird knapp.", "winter"],
  [1976, 0, "Newell & Simon / Dreyfus", "Denken als Verarbeitung formaler Symbole — Dreyfus hält dagegen: Körper und Umwelt mitdenken (Embodiment).", "idee"],
  [1980, 0, "Expertensystem XCON", "Wissen als Regeln „wenn … dann …“, von Experten von Hand geschrieben.", "symb"],
  [1986, 0, "Backpropagation", "Rumelhart, Hinton und Williams: Merkmale aus Daten lernen statt von Hand schreiben.", "lern"],
  [1987, 1993, "Zweiter KI-Winter", "Expertensysteme sind teuer, fragil und schwer zu pflegen. Moravec (1988): Schach ist leicht, Wahrnehmen und Handeln schwer.", "winter"],
  [1997, 0, "Deep Blue schlägt Kasparov", "Suche und von Menschen gestaltete Bewertungsfunktionen — ein spezialisierter Erfolg.", "erfolg"],
  [2005, 0, "DARPA Challenges", "Autonome Fahrzeuge fahren durch die Wüste (2005) und durch eine Stadt (2007).", "erfolg"],
  [2011, 0, "Watson gewinnt Jeopardy!", "", "erfolg"],
  [2012, 0, "AlexNet / ImageNet", "Der Durchbruch des maschinellen Lernens: Daten + Hardware (GPUs) + Modelle. Sehen und Sprache lernen, statt alle Regeln von Hand zu schreiben.", "lern"],
  [2016, 0, "AlphaGo gegen Lee Sedol", "Gelernte Bewertung + Suche. Go hat etwa 10¹⁷⁰ Stellungen — viel mehr als Schach.", "erfolg"],
  [2017, 0, "Transformer", "Attention als Baustein der heutigen Sprachmodelle (VL 10).", "lern"],
  [2020, 0, "AlphaFold 2", "Proteinfaltung bei CASP14 — KI als Forschungswerkzeug.", "erfolg"],
  [2022, 0, "ChatGPT und Bildmodelle", "Nov. 2022: generative KI wird zum Massenphänomen, heute multimodal.", "lern"],
  [2024, 0, "Nobelpreise Physik und Chemie", "Für die Grundlagen neuronaler Netze und für Proteinstruktur-Vorhersage.", "erfolg"],
  [2024, 2026, "Reasoning-Modelle und Agenten", "Seit 2024 Reasoning-Modelle, seit 2025 Agenten mit Werkzeugen.", "lern"],
];
const GK_HKIND = { idee: "Idee", symb: "Regeln, Logik, Suche", lern: "Lernen", winter: "KI-Winter", erfolg: "Meilenstein" };

function gkWHistory(root) {
  const { w, fig, read } = ppW(root, "hist");
  const st = { i: 3 };
  const X = (y) => 20 + ((y - 1940) / (2030 - 1940)) * 480;
  // A schematic curve of expectations: high after Dartmouth and in the early 80s, low in the winters, steep since 2012.
  const hype = (y) => 0.25 + 0.55 * Math.exp(-(((y - 1965) / 7) ** 2)) + 0.45 * Math.exp(-(((y - 1985) / 3.5) ** 2)) + 0.1 * Math.exp(-(((y - 2000) / 6) ** 2)) + 0.85 / (1 + Math.exp(-(y - 2015) / 3));
  const Y = (v) => 150 - v * 95;
  let d = "";
  for (let y = 1940; y <= 2030; y += 0.5) d += `${d ? "L" : "M"}${X(y).toFixed(1)},${Y(hype(y)).toFixed(1)}`;
  const items = GK_HISTORY.map((h, i) => ({ h, i })).filter(({ h }) => h[0] >= 1940);
  const draw = () => {
    const H = GK_HISTORY[st.i];
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 200" role="img" aria-label="Zeitleiste der KI">
      ${GK_HISTORY.filter((h) => h[4] === "winter").map((h) => `<rect x="${X(h[0])}" y="20" width="${X(h[1]) - X(h[0])}" height="140" class="gk-winter"/><text x="${(X(h[0]) + X(h[1])) / 2}" y="34" text-anchor="middle" class="tick-t">Winter</text>`).join("")}
      <path d="${d}" class="curve gk-hype"/>
      <text x="24" y="16" class="tick-t">- - - Erwartungen (schematisch)</text>
      <line x1="20" y1="160" x2="500" y2="160" class="tick"/>
      ${[1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].map((y) => `<line x1="${X(y)}" y1="160" x2="${X(y)}" y2="165" class="tick"/><text x="${X(y)}" y="178" text-anchor="middle" class="tick-t">${y}</text>`).join("")}
      ${items.filter(({ h }) => h[4] !== "winter").map(({ h, i }) => `<g class="click" data-i="${i}"><circle cx="${X(h[0])}" cy="160" r="${i === st.i ? 7 : 4.5}" class="gk-hdot gk-h-${h[4]} ${i === st.i ? "on" : ""}"/><circle cx="${X(h[0])}" cy="160" r="11" class="hit-c"/></g>`).join("")}
      ${H[4] === "winter" ? `<rect x="${X(H[0])}" y="20" width="${X(H[1]) - X(H[0])}" height="140" class="gk-winter on"/>` : ""}
      ${H[0] >= 1940 ? `<line x1="${X(H[0])}" y1="40" x2="${X(H[0])}" y2="160" class="guide"/>` : ""}
    </svg>`;
    $$("[data-i]", fig).forEach((g) => (g.onclick = () => { st.i = +g.dataset.i; draw(); }));
    read.innerHTML = `<p class="gk-hist-y"><b>${H[0]}${H[1] ? `–${H[1]}` : ""}</b> · <span class="gk-hk gk-h-${H[4]}">${GK_HKIND[H[4]]}</span></p>
      <p><b>${H[2]}</b></p><p class="small">${H[3]}</p>`;
  };
  w.querySelector('[data-a="prev"]').onclick = () => { st.i = (st.i + GK_HISTORY.length - 1) % GK_HISTORY.length; draw(); };
  w.querySelector('[data-a="next"]').onclick = () => { st.i = (st.i + 1) % GK_HISTORY.length; draw(); };
  draw();
}

/* ---------------------------------------------------------------- 1.3 KI ⊃ ML ⊃ DL */

const GK_NEST = [
  ["Sudoku mit festen Regeln", 0, "Variablen und Bedingungen: eine Belegung suchen, die alle Regeln erfüllt — kein Lernen aus Daten."],
  ["A*-Routenplaner", 0, "Suche im Graphen mit Kosten und Heuristik (VL 14). Das Wissen steckt im Modell, nicht in Trainingsdaten."],
  ["Expertensystem (XCON)", 0, "Von Menschen formulierte Regeln „wenn … dann …“."],
  ["Spamfilter mit logistischer Regression", 1, "Lernt Gewichte aus markierten Mails (VL 3), aber ohne tiefes Netz."],
  ["Hauspreis-Regression", 1, "Lineares Modell, Gewichte aus der Normalgleichung (VL 2)."],
  ["Bildklassifikator (CNN)", 2, "Ein mehrschichtiges neuronales Netz lernt die Merkmale selbst (VL 9)."],
  ["Sprachmodell (Transformer)", 2, "Tiefes Netz, selbstüberwacht auf das nächste Token trainiert — ein Foundation Model (VL 10)."],
];

function gkWNest(root) {
  const { w, fig, read } = ppW(root, "nest");
  const st = { ex: 3 };
  const draw = () => {
    const [name, lvl, why] = GK_NEST[st.ex];
    const ring = (cx, rx, ry, cls, label, ly) => `<ellipse cx="${cx}" cy="110" rx="${rx}" ry="${ry}" class="gk-ring ${cls}"/><text x="${cx}" y="${ly}" text-anchor="middle" class="gk-ring-t">${label}</text>`;
    const spots = [[90, 110], [235, 110], [345, 118]];
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 220" role="img" aria-label="KI umfasst ML, ML umfasst Deep Learning">
      ${ring(260, 240, 100, `gk-ki ${lvl === 0 ? "on" : ""}`, "Künstliche Intelligenz", 30)}
      ${ring(300, 170, 76, `gk-ml ${lvl === 1 ? "on" : ""}`, "Maschinelles Lernen", 56)}
      ${ring(345, 90, 46, `gk-dl ${lvl === 2 ? "on" : ""}`, "Deep Learning", 96)}
      <circle cx="${spots[lvl][0]}" cy="${spots[lvl][1] + (lvl === 2 ? 14 : 0)}" r="9" class="gk-spot"/>
    </svg>`;
    read.innerHTML = `<p><b>${name}</b> gehört zu <b>${["KI, aber nicht ML", "ML, aber nicht Deep Learning", "Deep Learning"][lvl]}</b>.</p><p class="small">${why}</p>`;
  };
  $$("[data-ex]", w).forEach((b) => (b.onclick = () => { st.ex = +b.dataset.ex; $$("[data-ex]", w).forEach((o) => o.classList.toggle("active", o === b)); draw(); }));
  draw();
}

/* ---------------------------------------------------------------- 1.4 Modellieren, Lernen, Schlussfolgern */

const GK_RN = { A: [40, 110], B: [160, 40], C: [160, 180], D: [290, 110], Z: [410, 110] };
// [u, v, cost, observed travel times]
const GK_RE = [["A", "B", 5, [4, 6, 5]], ["A", "C", 8, [9, 7, 8]], ["B", "D", 4, [5, 3, 4, 4]], ["C", "D", 2, [2, 3, 1]], ["D", "Z", 3, [3, 2, 4]], ["C", "Z", 9, [10, 8]]];

function gkDijkstra(nodes, edges, s, t) {
  const dist = Object.fromEntries(nodes.map((n) => [n, Infinity])), prev = {}, done = new Set();
  dist[s] = 0;
  while (done.size < nodes.length) {
    const u = nodes.filter((n) => !done.has(n)).sort((a, b) => dist[a] - dist[b])[0];
    if (dist[u] === Infinity) break;
    done.add(u);
    edges.forEach(([a, b, c]) => {
      [[a, b], [b, a]].forEach(([x, y]) => { if (x === u && dist[u] + c < dist[y]) { dist[y] = dist[u] + c; prev[y] = u; } });
    });
  }
  const path = [t];
  while (path[0] !== s && prev[path[0]]) path.unshift(prev[path[0]]);
  return { cost: dist[t], path };
}

function gkWRoute(root) {
  const { w, fig, read } = ppW(root, "route");
  const st = { mode: "model", jam: 0 };
  const draw = () => {
    const edges = GK_RE.map(([u, v, c, obs]) => [u, v, u === "B" && v === "D" ? c + st.jam : c, obs]);
    const r = gkDijkstra(Object.keys(GK_RN), edges, "A", "Z");
    const onPath = (u, v) => r.path.some((x, i) => i && ((r.path[i - 1] === u && x === v) || (r.path[i - 1] === v && x === u)));
    lenOut(w, "jam", st.jam ? `+${st.jam}` : "0");
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 450 220" role="img" aria-label="Verkehr als Graph">
      ${edges.map(([u, v, c, obs]) => {
        const [x1, y1] = GK_RN[u], [x2, y2] = GK_RN[v], mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const hot = st.mode === "reason" && onPath(u, v);
        const label = st.mode === "model" ? "?" : st.mode === "learn" ? `${nmD(obs.reduce((a, b) => a + b, 0) / obs.length, 2)}` : String(c);
        return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="gk-edge ${hot ? "on" : ""} ${u === "B" && v === "D" && st.jam ? "jam" : ""}"/>
          <rect x="${mx - 15}" y="${my - 12}" width="30" height="22" rx="7" class="gk-elab"/><text x="${mx}" y="${my + 4}" text-anchor="middle" class="gk-elab-t">${label}</text>`;
      }).join("")}
      ${Object.entries(GK_RN).map(([n, [x, y]]) => `<circle cx="${x}" cy="${y}" r="17" class="gk-node ${st.mode === "reason" && r.path.includes(n) ? "on" : ""}"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="gk-node-t">${n}</text>`).join("")}
    </svg>`;
    read.innerHTML = st.mode === "model"
      ? `<p><b>Modellieren</b>: die echte Welt wird zum Graphen $G = (V, E)$ mit Kosten $c(u, v)$. Die Kosten kennen wir noch nicht.</p>`
      : st.mode === "learn"
        ? `<p><b>Lernen</b>: die Kosten aus beobachteten Fahrzeiten schätzen — hier der Mittelwert, der den quadratischen Fehler minimiert (VL 2).</p>
           <p class="small">${GK_RE.map(([u, v, , obs]) => `${u}–${v}: ${obs.join(", ")}`).join(" · ")}</p>`
        : `<p><b>Schlussfolgern</b>: im Modell die günstigste Route berechnen.</p>
           <div class="lw-vals"><span>Route</span><b>${r.path.join(" → ")}</b><span>Kosten</span><b>${r.path.slice(1).map((x, i) => edges.find(([u, v]) => (u === r.path[i] && v === x) || (v === r.path[i] && u === x))[2]).join(" + ")} = ${r.cost}</b></div>
           <p class="small">${st.jam ? "Mit Stau auf B–D lohnt sich ab +2 der Weg über C." : "Zieh den Stau-Regler: das Modell bleibt, die Antwort ändert sich."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

function gkWTree(root) {
  const { w, fig, read } = ppW(root, "tree");
  const st = { b: 10, d: 10 };
  const draw = () => {
    lenOut(w, "b", st.b);
    lenOut(w, "d", st.d);
    const lg = st.d * Math.log10(st.b);
    const shown = Math.min(st.b, 6);
    let svg = `<circle cx="260" cy="24" r="8" class="gk-node"/>`;
    const lvl1 = Array.from({ length: shown }, (_, i) => 260 + (i - (shown - 1) / 2) * 80);
    lvl1.forEach((x) => {
      svg += `<line x1="260" y1="24" x2="${x}" y2="84" class="gk-edge"/><circle cx="${x}" cy="84" r="6" class="gk-node"/>`;
      Array.from({ length: shown }, (_, j) => x + (j - (shown - 1) / 2) * 12).forEach((x2) => (svg += `<line x1="${x}" y1="84" x2="${x2}" y2="140" class="gk-edge thin"/><circle cx="${x2}" cy="140" r="3" class="gk-node"/>`));
    });
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 170" role="img" aria-label="Suchbaum">${svg}
      ${st.b > shown ? `<text x="260" y="164" text-anchor="middle" class="tick-t">… gezeichnet: ${shown} von ${st.b} Kindern je Knoten, nur zwei Ebenen</text>` : `<text x="260" y="164" text-anchor="middle" class="tick-t">nur die ersten zwei Ebenen</text>`}</svg>`;
    const years = 10 ** lg / 1e9 / 3.15e7;
    read.innerHTML = `<div class="lw-vals"><span>Folgen der Tiefe d</span><b>b<sup>d</sup> = ${st.b}<sup>${st.d}</sup> ≈ 10<sup>${nmD(lg, 1)}</sup></b>
      <span>bei 10⁹ Folgen pro Sekunde</span><b>${years < 1 / 3.15e7 ? "unter einer Sekunde" : years < 1 ? `${nmD(years * 3.15e7, 1)} s` : `≈ 10<sup>${nmD(Math.log10(years), 1)}</sup> Jahre`}</b></div>
      <p class="small">Zum Vergleich: Go hat etwa 10¹⁷⁰ Stellungen, das Universum etwa 10⁸⁰ Atome. ${lg > 80 ? "<b>Mehr Folgen als Atome im Universum.</b>" : ""}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

GKI_CHAPTERS.push({
  n: 1, vl: "VL 1", lectures: [1], title: "Einführung", next: "Lineare Modelle",
  headline: "Was KI ist — und <span class=\"accent\">woher sie kommt</span>",
  intro: "Welche Aufgaben KI-Systeme lösen und welche Risiken sie haben, ein Wechsel von zu hohen Erwartungen und bahnbrechenden Neuerungen, und wie man die Beispiele systematisch einordnet: Aufgabe, Modell, Lernsignal und Berechnung.",
  sections: [
    {
      id: "1.1", title: "Erfolge, Grenzen und Risiken", short: "Erfolge & Risiken", about: "Eingabe → Ausgabe, Lernsignal, eine Entscheidung oder viele, EU AI Act",
      html: () => `
        ${nmGist([
          "Ein KI-System bildet eine <b>Eingabe</b> auf eine <b>Ausgabe</b> ab: Pixel auf eine Ziffer, eine Mail auf „Spam“, eine Beschreibung auf ein Bild, einen Text auf das nächste Token.",
          "Manche Ausgaben haben <b>Konsequenzen für die Zukunft</b>: ein Zug im Schach, ein Griff des Roboters — dann braucht es eine Folge von Entscheidungen, nicht nur eine Vorhersage.",
          "Risiken: Arbeitswelt, Deepfakes, Angriffe auf Modelle, Bias, Halluzinationen, Daten, Urheberrecht, Ressourcen und Macht. Der <b>EU AI Act</b> knüpft die Pflichten an den <b>Einsatz</b>, nicht an das Modell.",
        ])}
        <div class="card">
          <h3>Was KI-Systeme lösen</h3>
          ${ppFacts([
            ["Klassifikation", "Bild aus 28 × 28 Pixeln → Klasse aus {0, …, 9} (MNIST: 60 000 Trainings-, 10 000 Testbilder). Computer Vision: eine Klasse pro Bild, Detektion (Objekte lokalisieren: Box) oder Segmentierung (eine Klasse oder Instanz pro Pixel: Maske)."],
            ["Generierung", "Aus einer Beschreibung wird ein Bild (Midjourney, 2022) — heute auch Audio und Video, multimodal."],
            ["Vorhersage", "Eine Zeitreihe in die Zukunft fortsetzen: Wind- und Solarleistung, Nachfrage, Wetter, Verkehr."],
            ["Sprache", "Transkription (Sprache → Text), Übersetzung (eine Sequenz → eine andere), Sprachmodelle: das nächste Token vorhersagen, immer wieder."],
            ["Empfehlung", "Wie wahrscheinlich ist ein Klick? Die Vorhersage steuert, was wir sehen — das Lernziel beeinflusst, welche Inhalte sichtbar werden."],
            ["Spiele, Robotik", "Deep Blue (1997): Suche + Bewertung von Hand; AlphaGo (2016): gelernte Bewertung + Suche. Roboter: wahrnehmen, entscheiden, handeln."],
            ["Autonomes Fahren", "Stufen: Level 1/2 Assistenz, Level 3 bedingt automatisiert, Level 4 fahrerlos im definierten Bereich, Level 5 allgemein fahrerlos."],
          ])}
        </div>
        ${pw("tasks", pseg("ex", Object.entries(GK_TASKS).map(([k, v]) => [k, v.name]), "spam"), { wide: true })}
        <div class="card">
          <h3>Risiken</h3>
          ${ppFacts([
            ["Arbeitswelt", "Unterstützen oder ersetzen? Wer profitiert, wer trägt die Umstellung?"],
            ["Deepfakes", "Plausibel aussehend ≠ authentisch: Quelle und Kontext prüfen. Fehlende Bildfehler sind kein Echtheitsbeleg."],
            ["Sicherheit", "Gezielte kleine Veränderungen (Aufkleber auf einem Stoppschild) können die Vorhersage kippen — für Menschen bleibt es ein Stoppschild."],
            ["Bias", "Geschlechtsneutrale Eingabe → stereotype Übersetzung. Ursachen: die Trainingsdaten, das Lernziel, die Auswahl."],
            ["Halluzinationen", "Eine plausible Literaturangabe ist noch kein überprüfter Beleg."],
            ["Daten, Rechte, Ressourcen, Macht", "Datenschutz, Urheberrecht, Energie- und Rechenbedarf, Machtkonzentration und Missbrauch."],
          ])}
          <h3>EU AI Act: der Einsatz bestimmt die Pflichten</h3>
          ${gkActPyramid()}
          <p class="small">Dazu kommen für <b>General-Purpose AI</b> (GPAI) Pflichten auf Modellebene. Gestaffelt: erste Verbote 02.02.2025, GPAI-Pflichten 02.08.2025, Transparenz 02.08.2026, Hochrisiko (Annex III) 02.12.2027, Hochrisiko (Annex I) 02.08.2028.
            Dasselbe Basismodell kann im Spamfilter (gering) und bei der Vorauswahl von Bewerbungen (Hochrisiko) stecken.</p>
        </div>
        ${gkSelf([
          ["Spamfilter, Schachprogramm, einzelne Wortvorhersage, Routenplaner: welche Aufgabe ist in einem Schritt lösbar?", "Spamfilter und eine einzelne Wortvorhersage sind ein Schritt. Schach und Routenplanung brauchen eine Folge von Entscheidungen (Zustände und Aktionen)."],
          ["Warum schlug ein Schachcomputer schon 1997 den Weltmeister, ein Go-Programm aber erst 2016?", "Go hat viel mehr mögliche Stellungen (etwa 10¹⁷⁰) und eine größere Verzweigung; reine Suche mit Bewertung von Hand reicht nicht — AlphaGo brauchte eine gelernte Bewertung."],
          ["Ein Sprachmodell erzeugt Text Token für Token. Was, wenn das wahrscheinlichste nächste Token in die Irre führt?", "Es kann nicht zurück: das Token ist gesetzt und wird Teil des Kontexts. Reasoning-Modelle und Agenten versuchen das mit Zwischenschritten und Werkzeugen auszugleichen."],
          ["Dasselbe Basismodell im Spamfilter und in der Bewerbungsvorauswahl — welche Rolle spielt der Einsatz?", "Der AI Act ordnet nach dem Einsatz ein: Spamfilter gering, Personalauswahl Hochrisiko. Modellpflichten (GPAI) gelten zusätzlich für das Basismodell selbst."],
        ])}
        ${nmTraps([
          "Eine Wortvorhersage ist <b>eine</b> Vorhersage; erst wiederholt erzeugt sie Text. Das Vortrainingsziel garantiert keine faktische Korrektheit.",
          "Der AI Act teilt keine Modellklassen ein, sondern Anwendungen — die Kategorien sind nicht trennscharf.",
        ])}`,
      setup: (root) => gkWTasks(root),
      check: [
        { q: "Was garantiert das Vortrainingsziel eines Sprachmodells (das nächste Token vorhersagen) <b>nicht</b>?", opts: ["Faktische Korrektheit", "Eine Verteilung über das nächste Token", "Dass wiederholte Vorhersage Text erzeugt", "Dass ein Token ein Wortstück sein kann"], why: "Es lernt, was wahrscheinlich folgt — nicht, was wahr ist. Daher Halluzinationen." },
        { q: "Welche Aufgabe braucht eine <b>Folge</b> von Entscheidungen?", opts: ["Ein Roboter greift einen Becher", "Ein Spamfilter bewertet eine Mail", "MNIST: eine Ziffer erkennen", "Eine einzelne Wortvorhersage"], why: "Jede Aktion des Roboters ändert, was er danach beobachtet — die Entscheidung hat Konsequenzen für die Zukunft." },
        { q: "Wonach richten sich die Pflichten im EU AI Act?", opts: ["Nach dem konkreten Einsatz des Systems", "Nach der Zahl der Parameter allein", "Nach dem Hersteller", "Nach der Programmiersprache"], why: "Spamfilter: geringes Risiko, Personalauswahl: Hochrisiko — auch mit demselben Basismodell. GPAI-Modelle haben zusätzlich Modellpflichten." },
        { q: "Ein Video zeigt eine politische Aussage und hat keine sichtbaren Bildfehler. Was folgt daraus?", opts: ["Nichts über die Echtheit — Quelle und Kontext prüfen", "Es ist echt", "Es ist ein Deepfake", "Es ist mit einem Sprachmodell erzeugt"], why: "Plausibel aussehend ist nicht authentisch." },
        { q: "MNIST: was sind Eingabe und Ausgabe?", opts: ["Ein Bild aus 28 × 28 Pixeln → eine Klasse aus {0, …, 9}", "Eine Ziffer → ein Bild", "Eine Mail → Spam ja/nein", "Ein Text → das nächste Token"], why: "Klassifikation: 60 000 Trainings- und 10 000 Testbilder." },
      ],
    },
    {
      id: "1.2", title: "Geschichte der KI", short: "Geschichte", about: "Turing, Dartmouth, Perzeptron, zwei KI-Winter, Backpropagation, Deep Learning",
      html: () => `
        ${nmGist([
          "Ein Wechsel von <b>zu hohen Erwartungen</b> und bahnbrechenden Neuerungen: Dartmouth 1956 gibt der KI ihren Namen und viel Optimismus.",
          "<b>Erster KI-Winter</b> (1974–80): Suchräume wachsen zu schnell, ein einzelnes Perzeptron kann XOR nicht. <b>Zweiter</b> (1987–93): Expertensysteme sind teuer, fragil und schwer zu pflegen.",
          "Der <b>Durchbruch des maschinellen Lernens</b> kommt aus Daten + Hardware + Modellen: Merkmale lernen statt alle Regeln von Hand schreiben.",
        ])}
        ${pw("hist", `<div class="lw-btns">${pbtn("prev", "← früher")}${pbtn("next", "später →", "primary")}</div>`, { wide: true })}
        <div class="card">
          <h3>Zwei Linien</h3>
          ${ppFacts([
            ["Regeln und Symbole", "Newell & Simon (1976): Denken als Verarbeitung formaler Symbole. Expertensysteme wie XCON (1980): Wissen als Regeln „wenn … dann …“."],
            ["Lernen", "SNARC (1951), Perzeptron (1958), Backpropagation (1986), AlexNet (2012), Transformer (2017): Merkmale aus Daten."],
            ["Embodiment", "Dreyfus: Körper und Umwelt mitdenken. Moravec-Paradox (1988): Schach und Rechnen sind leicht, Wahrnehmen und Handeln schwer."],
          ])}
          <h3>XOR und das Perzeptron</h3>
          <p>Ein einzelnes lineares Perzeptron zieht eine Gerade. Die vier Punkte von XOR — $(0,0)$ und $(1,1)$ in der einen, $(0,1)$ und $(1,0)$ in der anderen Klasse — trennt keine Gerade. Das ist eine Grenze der <b>Darstellbarkeit</b> eines einzelnen Neurons, keine aller neuronalen Netze: mit einer verborgenen Schicht (oder dem Merkmal $x_1x_2$, ${gkSee("3.3")}) geht es. Wie man passende Parameter <b>lernt</b>, ist eine zweite Frage — die hat Backpropagation beantwortet.</p>
        </div>
        ${gkSelf([
          ["Technische und organisatorische Ursachen der beiden KI-Winter?", "Erster: Suchräume explodieren (kombinatorische Explosion), Perzeptron-Grenzen, überzogene Versprechen, Geldgeber ziehen sich zurück. Zweiter: Expertensysteme teuer, fragil, schwer zu pflegen; frühe Erfolge übertrugen sich nicht auf neue Aufgaben."],
          ["Wie wirken Daten, Hardware und Architekturen beim Deep Learning zusammen? Belegt ein Erfolg allgemeine Intelligenz?", "Große Datensätze (ImageNet), GPUs und passende Architekturen (CNNs, Transformer) machten das Lernen tiefer Netze praktikabel. Ein Erfolg in einer bestimmten Aufgabe belegt keine allgemeine Intelligenz."],
        ])}
        ${nmTraps([
          "„Ein Perzeptron kann XOR nicht“ heißt nicht „neuronale Netze können XOR nicht“ — Darstellbarkeit eines Neurons ≠ Grenze aller Netze.",
          "KI-Winter sind Zeiträume, keine einzelnen Ereignisse; die Jahreszahlen dienen der Orientierung.",
        ])}`,
      setup: (root) => gkWHistory(root),
      check: [
        { q: "Warum kann ein einzelnes lineares Perzeptron XOR nicht darstellen?", opts: ["Keine Gerade trennt (0,0), (1,1) von (0,1), (1,0)", "Weil es nicht differenzierbar ist", "Weil XOR zu viele Punkte hat", "Weil es keinen Bias hat"], why: "Die Klassen liegen über Kreuz. Mit einer verborgenen Schicht oder dem Merkmal $x_1x_2$ geht es." },
        { q: "Welches Treffen gab der KI 1956 ihren Namen?", opts: ["Dartmouth", "Turing-Test", "ImageNet", "CASP"], why: "Projektvorschlag 1955 von McCarthy, Minsky, Rochester und Shannon." },
        { q: "Was trug zum zweiten KI-Winter (1987–93) bei?", opts: ["Expertensysteme waren teuer, fragil und schwer zu pflegen", "Backpropagation war noch nicht erfunden", "Es gab zu viele Daten", "Deep Blue verlor gegen Kasparov"], why: "Regeln von Hand schreiben und pflegen skaliert schlecht." },
        { q: "Was besagt das Moravec-Paradox?", opts: ["Schach und Rechnen sind für Maschinen leicht, Wahrnehmen und Handeln schwer", "Je mehr Daten, desto schlechter das Modell", "Ein Perzeptron kann alles lernen", "KI wird nie Schach gewinnen"], why: "Was für Menschen schwer ist, ist für Maschinen oft leicht — und umgekehrt." },
        { q: "Was ermöglichte den Durchbruch des maschinellen Lernens um 2012?", opts: ["Daten, Hardware und Modelle zusammen", "Mehr handgeschriebene Regeln", "Der Turing-Test", "Expertensysteme"], why: "ImageNet, GPUs und tiefe Netze (AlexNet)." },
      ],
    },
    {
      id: "1.3", title: "Begriffe und Agenten", short: "Begriffe & Agenten", about: "KI ⊃ ML ⊃ DL, vier Perspektiven, Foundation Models, der Agent",
      html: () => `
        ${nmGist([
          "<b>KI</b> umfasst auch Suche, Logik und von Menschen formulierte Regeln. <b>Maschinelles Lernen</b> passt Modelle an Daten oder Erfahrung an. <b>Deep Learning</b> verwendet mehrschichtige neuronale Netze.",
          "Russell &amp; Norvig: vier Perspektiven — menschlich oder rational, denken oder handeln. Die Vorlesung: <b>rational handeln</b>, also geeignete Aktionen wählen.",
          "Ein <b>Agent</b> nimmt Beobachtungen $o$ wahr und wählt Aktionen $a$ in einer Umgebung; ein <b>Leistungsmaß</b> sagt, was als gutes Verhalten zählt.",
        ])}
        <div class="card">
          <h3>Was ist Künstliche Intelligenz?</h3>
          ${ppFacts([
            ["Lexikon", "Teilgebiet der Informatik, das intelligentes Verhalten automatisiert — unscharf, weil „Intelligenz“ selbst nicht definiert ist."],
            ["EU AI Act", "Ein maschinelles System, das mit gewisser Autonomie aus Eingaben Vorhersagen, Inhalte, Empfehlungen oder Entscheidungen ableitet."],
            ["Maschinelles Lernen", "Ein System lernt aus Beispielen und verallgemeinert auf neue Fälle. Mitchell (1997): die Leistung P bei Aufgabe T verbessert sich mit Erfahrung E."],
            ["Foundation Models", "Statt vieler Modelle für viele Datensätze: ein Modell, trainiert auf vielen Daten, per Fine-Tuning für einzelne Aufgaben angepasst."],
          ])}
          <table class="len-terms gk-persp"><thead><tr><th></th><th>menschlich</th><th>rational</th></tr></thead><tbody>
            <tr><th>denken</th><td>Kognition modellieren</td><td>gültig schließen</td></tr>
            <tr><th>handeln</th><td>Verhalten nachbilden (Turing-Test)</td><td class="gk-hl"><b>geeignete Aktionen wählen</b> — unser Blick</td></tr>
          </tbody></table>
        </div>
        ${pw("nest", `<div class="chips gk-chips">${GK_NEST.map(([n], i) => `<button type="button" class="chip ${i === 3 ? "active" : ""}" data-ex="${i}">${n}</button>`).join("")}</div>`, { wide: true })}
        <div class="card">
          <h3>Der Agent</h3>
          <svg class="lw-svg gk-agent" viewBox="0 0 520 150" role="img" aria-label="Agent und Umgebung">
            <rect x="20" y="40" width="130" height="70" rx="16" class="gk-box gk-model"/><text x="85" y="80" text-anchor="middle" class="gk-box-t">Agent</text>
            <rect x="370" y="40" width="130" height="70" rx="16" class="gk-box"/><text x="435" y="80" text-anchor="middle" class="gk-box-t">Umgebung</text>
            ${arrowSVG(152, 56, 366, 56, "gk-arr")}<text x="260" y="48" text-anchor="middle" class="gk-lab">Aktionen a</text>
            ${arrowSVG(366, 96, 154, 96, "gk-arr")}<text x="260" y="116" text-anchor="middle" class="gk-lab">Beobachtungen o</text>
            <text x="260" y="142" text-anchor="middle" class="tick-t">Ziel / Leistungsmaß: was zählt als gutes Verhalten?</text>
          </svg>
          <p class="small">Altklausuren fragen danach (SS 23, SS 25): ein <b>Reflex-Agent</b> handelt direkt nach der aktuellen Wahrnehmung, ohne die Folgen zu bedenken; ein <b>planender Agent</b> bewertet Folgen von Aktionen mit einem Modell der Welt. Umgebungen können z. B. voll oder teilweise beobachtbar, deterministisch oder stochastisch sein — bei teilweiser Beobachtbarkeit braucht der Agent einen inneren Zustand (Belief), bei Zufall Wahrscheinlichkeiten. Ein <b>rationaler Agent</b> wählt die Aktion, die sein erwartetes Leistungsmaß maximiert.</p>
        </div>
        ${gkSelf([
          ["Ist jedes KI-System ein ML-System?", "Nein. Ein A*-Routenplaner, ein Sudoku-Löser mit festen Regeln oder ein Expertensystem sind KI ohne maschinelles Lernen."],
          ["Kann ein KI-System arbeiten, ohne vorher aus Daten zu lernen?", "Ja — wenn das Wissen im Modell steckt: Regeln, Graph mit Kosten, Logik. Der Sudoku-Löser kennt die Regeln; der Bildklassifikator hat sein Wissen aus Daten."],
        ])}
        ${nmTraps([
          "Deep Learning ⊂ ML ⊂ KI — nicht umgekehrt. KI ohne Lernen gibt es (Suche, Logik, Regeln).",
          "Die Vorlesung nimmt die Sicht „rational handeln“ ein, nicht „menschlich denken“.",
        ])}`,
      setup: (root) => gkWNest(root),
      check: [
        { q: "Welches System ist KI, aber kein maschinelles Lernen?", opts: ["Ein Sudoku-Löser mit festen Regeln", "Ein Spamfilter mit logistischer Regression", "Ein Bildklassifikator (CNN)", "Ein Sprachmodell"], why: "Das Wissen steckt in den Regeln, nicht in Trainingsdaten." },
        { q: "Welche der vier Perspektiven von Russell &amp; Norvig nimmt die Vorlesung ein?", opts: ["Rational handeln", "Menschlich denken", "Menschlich handeln", "Rational denken"], why: "Geeignete Aktionen wählen." },
        { q: "Was gehört zu einem Agenten in der Vorlesung?", opts: ["Beobachtungen, Aktionen, Umgebung und ein Leistungsmaß", "Nur ein neuronales Netz", "Ein Datensatz mit Labels", "Eine Verlustfunktion und ein Optimierer"], why: "Der Agent nimmt wahr und handelt; das Leistungsmaß sagt, was gut ist." },
        { q: "Was zeichnet ein Foundation Model aus?", opts: ["Ein Basismodell auf vielen Daten, für einzelne Aufgaben angepasst", "Ein eigenes Modell pro Datensatz", "Ein Expertensystem", "Ein Modell ohne Parameter"], why: "Fine-Tuning für einzelne Aufgaben." },
        { q: "Ein Reflex-Agent …", opts: ["handelt direkt nach der aktuellen Wahrnehmung, ohne Folgen zu planen", "bewertet Folgen von Aktionen mit einem Weltmodell", "lernt immer mit Reinforcement Learning", "braucht ein Ziel und eine Heuristik"], why: "Der planende Agent bewertet Folgen von Zuständen und Aktionen." },
      ],
    },
    {
      id: "1.4", title: "Modellieren, Lernen, Schlussfolgern", short: "Modellieren · Lernen · Schließen", about: "Verkehr als Graph, vier Arten zu rechnen, Lernsignale, b^d",
      html: () => `
        ${nmGist([
          "Vom realen Problem zum lösbaren Modell: <b>Modellieren</b> (Verkehr wird zum Graphen), <b>Lernen</b> (Kosten aus Beobachtungen schätzen: einen Verlust $L(w)$ minimieren), <b>Schlussfolgern</b> (im Modell die Route berechnen). Daten, Modell und Lösung müssen zusammenpassen.",
          "Vier Arten zu rechnen: <b>direkte Vorhersage</b> $\\hat y = f(x; w)$, <b>Zustände und Aktionen</b> (Planen, Suche, MDP), <b>Variablen und Bedingungen</b> (Sudoku, unsichere Abhängigkeiten), <b>Logik</b>.",
          "<b>Lernsignale</b>: überwacht, unüberwacht, selbstüberwacht, verstärkend. Die Zahl der Möglichkeiten <b>explodiert</b>: $b^d$ Folgen bei Verzweigung $b$ und Tiefe $d$.",
        ])}
        ${pw("route", `${pseg("mode", [["model", "Modellieren"], ["learn", "Lernen"], ["reason", "Schlussfolgern"]], "model")}${pslider("jam", "Stau auf B–D", 0, 8, 1, 0)}`, { wide: true })}
        <div class="card">
          <h3>Vier Arten zu rechnen</h3>
          ${ppFacts([
            ["Direkte Vorhersage", "Welches Tier ist das? Bild → Klasse in einem Schritt: $\\hat y = f(x; w)$ mit Eingabe $x$, Vorhersage $\\hat y$, Parametern $w$ (VL 2–10). Wie „schnelles Denken“ (Kahneman) — eine Analogie, keine Gleichsetzung."],
            ["Zustände und Aktionen", "Welcher Zug? Zustand $s$, Aktion $a$, Folgezustand $s'$. Planen heißt: Folgen von Zuständen und Aktionen bewerten — Suche (Route, VL 14), MDP mit Übergängen $p(s' \\mid s, a)$ und Belohnung $r$ (z. B. Blackjack, VL 11/12), Spiele (Schach)."],
            ["Variablen und Bedingungen", "Harte Bedingungen (Sudoku: eine Belegung, die alle Regeln erfüllt) oder unsichere Abhängigkeiten (verborgener Zustand → Beobachtung: HMM, VL 13)."],
            ["Logik", "„Alle Quadrate sind Rechtecke. A ist ein Quadrat.“ ⇒ A ist ein Rechteck — unter diesen Annahmen. Logik und statistische Modelle können sich ergänzen."],
          ])}
          <h3>Lernsignale: woher kommt die Rückmeldung?</h3>
          <table class="len-terms"><tbody>
            <tr><td><b>Überwacht</b></td><td>Bild $x$ + Klasse $y$ → lernen</td><td class="small muted">VL 2/3</td></tr>
            <tr><td><b>Unüberwacht</b></td><td>Punkte $x$ → Struktur</td><td class="small muted">VL 7/8</td></tr>
            <tr><td><b>Selbstüberwacht</b></td><td>Kontext $x$ → nächstes Token $y$ (das Ziel steckt in den Daten)</td><td class="small muted">VL 10</td></tr>
            <tr><td><b>Verstärkend (RL)</b></td><td>Aktion $a$ → Erfahrung + Belohnung $r$</td><td class="small muted">VL 12</td></tr>
          </tbody></table>
          <p class="small">Lernsignal, Datentyp und Modelltyp sind getrennte Achsen. Genauso Aufgabe (Regression, Klassifikation, Generierung, Zustandsschätzung, Planung), Repräsentation (Regeln, Vektoren, Wahrscheinlichkeiten) und Berechnung (direkte Vorhersage, Suche, probabilistische Inferenz, Optimierung).</p>
        </div>
        ${pw("tree", `${pslider("b", "Verzweigung b", 2, 35, 1, 10)}${pslider("d", "Tiefe d", 1, 40, 1, 10)}`, { wide: true })}
        ${gkSelf([
          ["Spamfilter: welcher Schritt passiert einmal, welcher bei jeder neuen Mail?", "Modellieren (Merkmale, Modellform) und Lernen (Gewichte aus markierten Mails) einmal; das Schlussfolgern — die Vorhersage — bei jeder neuen Mail."],
          ["Handschrifterkennung, Staubsaugerroboter lernt seine Strategie, Wetter-App schätzt Regen aus verrauschten Sensoren, „Alle Vögel legen Eier; Tweety ist ein Vogel“ — welcher Baustein?", "Direkte Vorhersage (überwacht) · Zustände und Aktionen mit Belohnung (RL) · Variablen mit unsicheren Abhängigkeiten (Zustandsschätzung, HMM) · Logik."],
          ["Ein Sprachmodell wird ohne menschliche Labels trainiert. Warum heißt das selbstüberwacht, nicht unüberwacht?", "Es gibt ein Ziel $y$ — das nächste Token —, nur kommt es aus den Daten selbst statt von Menschen."],
          ["Ein Spamfilter wird mit 10 000 markierten Mails trainiert. Lernsignal, Datentyp, Modelltyp?", "Überwacht; Text bzw. Merkmalsvektoren; ein Klassifikator, z. B. logistische Regression (VL 3)."],
        ])}
        ${nmTraps([
          "Selbstüberwacht ist nicht unüberwacht: es gibt ein Ziel, es steht nur schon in den Daten.",
          "$b^d$ wächst exponentiell in der Tiefe — „Curse of Dimensionality“ bei Suchproblemen (WS 23/24: Pfannkuchen, $n!$ Zustände).",
        ])}`,
      setup: (root) => { gkWRoute(root); gkWTree(root); },
      check: [
        { q: "Spamfilter: was passiert bei jeder neuen Mail?", opts: ["Schlussfolgern: das gelernte Modell sagt Spam oder nicht voraus", "Modellieren", "Die Gewichte werden neu gelernt", "Der Graph wird neu gebaut"], why: "Modellieren und Lernen einmal, die Vorhersage pro Mail." },
        { q: "Ein Sprachmodell lernt, das nächste Token aus dem Kontext vorherzusagen. Welches Lernsignal?", opts: ["Selbstüberwacht", "Unüberwacht", "Verstärkend", "Überwacht mit menschlichen Labels"], why: "Das Ziel kommt aus den Daten selbst." },
        { q: "Ein Staubsaugerroboter lernt seine Strategie aus Belohnungen. Welcher Baustein?", opts: ["Zustände und Aktionen, verstärkendes Lernen", "Direkte Vorhersage", "Logik", "Unüberwachtes Lernen"], why: "Aktion → Erfahrung + Belohnung $r$." },
        { q: "Verzweigung $b = 10$, Tiefe $d = 10$: wie viele Folgen?", opts: ["$10^{10}$", "$100$", "$10^{100}$", "$20$"], why: "$b^d = 10^{10}$." },
        { q: "„Alle Vögel legen Eier; Tweety ist ein Vogel — also …“ gehört zu …", opts: ["Logik", "direkter Vorhersage", "Reinforcement Learning", "Regression"], why: "Aus Wissen folgen neue Aussagen." },
      ],
    },
  ],
});
