// LEN chapter 1, "Grundbegriffe, Definitionen und physikalische Grundlagen": sections 1.1–1.7 from
// the lectures (WiSe 26/27, lectures 1b, 2a and 3a), each with its text in German and English, its
// drawings (len-ch1-widgets.js) and its check. Then the chapter's formulas and terms for the
// Formulas tab. Later chapters go in files of their own and join LEN_CHAPTERS.

// A drawing in a card: the picture, then its controls and what it reads out. `wide` puts the
// controls under the picture instead of beside it.
const lw = (key, ctrl, { wide = false, fig = "" } = {}) => `
  <div class="lw ${wide ? "wide" : ""}" data-w="${key}">
    <div class="lw-fig">${fig}</div>
    <div class="lw-side"><div class="lw-ctrl">${ctrl}</div><div class="lw-read"></div></div>
  </div>`;
const btn = (a, de, en, cls = "") => `<button class="btn ${cls}" type="button" data-a="${a}">${L(de, en)}</button>`;
// The short definitions: a name, then what it says.
const facts = (rows) => `<div class="len-facts">${rows.map(([de, en, body]) => `
  <div class="len-fact"><div class="len-fact-name">${T(de, en)}</div><div>${body}</div></div>`).join("")}</div>`;
const aside = (de, en, body) => `<details class="len-aside"><summary>${L(de, en)}</summary><div>${body}</div></details>`;
const vI = "<i>I</i>", vU = "<i>U</i>", vQ = "<i>Q</i>", vR = "<i>R</i>", vG = "<i>G</i>";
const mQ = "<i class='mv'>Q</i>", mR = "<i class='mv'>R</i>", mG = "<i class='mv'>G</i>", me = "<i class='mv'>e</i>";

const LEN_CH1 = {
  n: 1,
  title: ["Grundbegriffe", "Basic concepts"],
  headline: ["Grundbegriffe, Definitionen und <span class='accent'>physikalische Grundlagen</span>", "Basic terms, definitions and the <span class='accent'>physics behind them</span>"],
  intro: [
    "Von der Ladung im Atom bis zu den Kirchhoffschen Gesetzen. Jede Skizze aus der Vorlesung ist hier eine Zeichnung, an der du drehen kannst — probier sie aus, bevor du den Check am Ende jedes Abschnitts machst.",
    "From the charge in an atom to Kirchhoff's laws. Every sketch from the lectures is a drawing here that you can play with — try them out before you take the check at the end of each section.",
  ],
  sections: [
    /* ------------------------------------------------------------ 1.1 */
    {
      id: "1.1",
      title: ["Ladung, Strom, Potential, Spannung", "Charge, current, potential, voltage"],
      short: ["Ladung & Strom", "Charge & current"],
      about: ["Atome, Ladungserhaltung, Stromrichtung, Potential, Potentialdifferenz", "Atoms, conservation of charge, current direction, potential, potential difference"],
      html: () => `
        <div class="card">
          <h3>${L("Elektrische Ladung", "Electric charge")}</h3>
          <p>${L(`Die ${T("elektrische Ladung", "electric charge")} ist die Ursache aller elektrischen und magnetischen Phänomene. Sie steckt in den Atomen:
              im <b>Atomkern</b> sitzen <b class="q-pos">Protonen</b> (positiv) und Neutronen (ungeladen), in der <b>Atomhülle</b> die <b class="q-neg">Elektronen</b> (negativ).`,
            `${T("Elektrische Ladung", "Electric charge")} is the cause of all electric and magnetic phenomena. It sits in atoms:
              the <b>nucleus</b> holds <b class="q-pos">protons</b> (positive) and neutrons (no charge), the <b>electron shell</b> holds the <b class="q-neg">electrons</b> (negative).`)}</p>
          ${F(`<i class="mv">q</i><sub>p</sub> = +${me} &nbsp;&nbsp; <i class="mv">q</i><sub>e</sub> = −${me} &nbsp;&nbsp; ${me} ≈ ${L("1,602", "1.602")} · 10<sup>−19</sup> C`)}
          <p class="small muted lw-c">${L(`<i>e</i> heißt ${T("Elementarladung", "elementary charge")}.`, `<i>e</i> is the ${T("Elementarladung", "elementary charge")}.`)}</p>
          ${lw("atom", btn("minus", "− Elektron abziehen", "− Remove an electron") + btn("plus", "+ Elektron hinzufügen", "+ Add an electron") + btn("reset", "Zurück", "Reset"))}
          ${facts([
            ["Ladungsquantisierung", "charge quantization", `${F(`${mQ} = <i class="mv">N</i> · ${me}, &nbsp; <i class="mv">N</i> ∈ ℤ`, "small-f")}
              ${L("Ladung gibt es nur in ganzen Paketen von <i>e</i> — nie 1,5 <i>e</i>.", "Charge only comes in whole packets of <i>e</i> — never 1.5 <i>e</i>.")}`],
            ["Ladungsneutralität", "charge neutrality", `${F(`${mQ} = ${sumOf("", "<i>i</i>")} <i class="mv">q</i><sub>i</sub> = 0 ⇔ ${L("ladungsneutral", "neutral")}; &nbsp; ≠ 0 ⇔ ${L("geladen", "charged")}`, "small-f")}
              ${L("Gleich viele Protonen wie Elektronen: nach außen keine Ladung.", "As many protons as electrons: no charge seen from outside.")}`],
            ["Ladungstrennung", "charge separation", `${L(`Elektronen <b>abziehen</b> → mehr Protonen als Elektronen → ${vQ} &gt; 0.<br>Elektronen <b>hinzufügen</b> → mehr Elektronen als Protonen → ${vQ} &lt; 0.`,
              `<b>Remove</b> electrons → more protons than electrons → ${vQ} &gt; 0.<br><b>Add</b> electrons → more electrons than protons → ${vQ} &lt; 0.`)}`],
          ])}
        </div>

        <div class="card">
          <h3>${L("Ladungserhaltung", "Conservation of charge")}</h3>
          <p>${L(`${T("Ladungserhaltungssatz", "law of conservation of charge")}: Innerhalb eines <b>abgeschlossenen</b> (isolierten) Systems bleibt die Gesamtladung erhalten.`,
            `${T("Ladungserhaltungssatz", "law of conservation of charge")}: inside a <b>closed</b> (isolated) system the total charge stays the same.`)}</p>
          ${F(`${mQ} = ${sumOf("", "<i>i</i>")} <i class="mv">q</i><sub>i</sub> = const.`)}
          ${lw("conserve", lenSeg("open", [[0, "abgeschlossen", "closed"], [1, "offen", "open"]], 0) +
            `<div class="lw-row">${btn("ab", "e⁻ von A nach B", "e⁻ from A to B")}${btn("ba", "e⁻ von B nach A", "e⁻ from B to A")}</div>
             <div class="lw-row">${btn("in", "e⁻ von außen dazu", "e⁻ in from outside")}${btn("out", "e⁻ nach außen weg", "e⁻ out")}${btn("reset", "Zurück", "Reset")}</div>`, { wide: true })}
          ${aside("Kurz erklärt: das Summenzeichen Σ", "Quick reminder: the sum sign Σ", `
            ${F(`${sumOf("3", "<i>i</i> = 1")} <i class="mv">q</i><sub>i</sub> = <i class="mv">q</i><sub>1</sub> + <i class="mv">q</i><sub>2</sub> + <i class="mv">q</i><sub>3</sub>`, "small-f")}
            ${F(`${sumOf("", "<i>i</i>")} (<i class="mv">i</i>² + 2<i class="mv">i</i>) = (1² + 2·1) + (2² + 2·2) + …`, "small-f")}
            <p class="small">${L("Ohne Grenzen (nur <i>i</i> darunter) heißt: über <b>alle</b> <i>i</i> summieren.", "Without limits (just <i>i</i> underneath) it means: add up over <b>all</b> <i>i</i>.")}</p>`)}
        </div>

        <div class="card">
          <h3>${L("Elektrischer Strom", "Electric current")}</h3>
          <p>${L(`${T("Elektrischer Strom", "electric current")} ist die <b>gerichtete Bewegung</b> elektrischer Ladungen.`, `${T("Elektrischer Strom", "Electric current")} is the <b>directed movement</b> of electric charges.`)}</p>
          ${lw("lattice", lenSeg("on", [[0, "keine Spannung", "no voltage"], [1, "Spannung anlegen", "apply a voltage"]], 0))}
          <p>${L(`Gemessen wird, wie viel Ladung Δ${vQ} in der Zeit Δ<i>t</i> durch eine Querschnittsfläche <i>A</i> fließt:`,
            `We measure how much charge Δ${vQ} passes through a cross-section <i>A</i> in the time Δ<i>t</i>:`)}</p>
          ${F(`${sI()} = ${frac(`Δ${mQ}`, "Δ<i class='mv'>t</i>")} &nbsp;→&nbsp; ${sI()} = ${frac(`d${mQ}`, "d<i class='mv'>t</i>")} &nbsp;&nbsp; ${unit(`[${sI()}] = 1 A = 1 ${frac("C", "s")}`)}`)}
          <p>${L(`Ob ${vI} positiv oder negativ ist, hängt davon ab, welche Ladung sich bewegt <b>und</b> in welche Richtung der Normalenvektor <span class="mvec"><i>n</i></span> der Fläche zeigt.`,
            `Whether ${vI} is positive or negative depends on which charge moves <b>and</b> on which way the area's normal vector <span class="mvec"><i>n</i></span> points.`)}</p>
          ${lw("tube", lenSeg("q", [[1, "positive Ladung", "positive charge"], [-1, "Elektronen", "electrons"]], 1) +
            lenSeg("v", [[1, "nach rechts →", "to the right →"], [-1, "← nach links", "← to the left"]], 1) + btn("flip-n", "<span class='mvec'><i>n</i></span> umdrehen", "Flip <span class='mvec'><i>n</i></span>"), { wide: true })}
          ${facts([
            ["technische Stromrichtung", "conventional current direction", L("Die Richtung, in die sich <b>positive</b> Ladung bewegt. Mit ihr rechnen wir — der rote Pfeil.", "The direction <b>positive</b> charge moves in. We calculate with this one — the red arrow.")],
            ["physikalische Stromrichtung", "electron flow direction", L("Die Richtung, in die sich die <b>Elektronen</b> bewegen — genau entgegengesetzt.", "The direction the <b>electrons</b> move in — exactly the opposite.")],
          ])}
        </div>

        <div class="card">
          <h3>${L("Elektrisches Potential", "Electric potential")}</h3>
          <p>${L(`Das ${T("Potential", "potential")} ${sP()} ist ein Maß für die elektrische Energie <i>W</i>, die eine Ladung <i>q</i> an einem Punkt des Raumes hat.`,
            `The ${T("Potential", "potential")} ${sP()} measures the electric energy <i>W</i> that a charge <i>q</i> has at a point in space.`)}</p>
          ${F(`${sP()} = ${frac("<i class='mv'>W</i>", "<i class='mv'>q</i>")} &nbsp;&nbsp; ${unit(`[${sP()}] = 1 ${frac("J", "C")} = 1 V`)}`)}
          ${lw("potential", lenSlider("Q", "Feste Ladung Q₁", "Fixed charge Q₁", -3, 3, 1, 2) + lenSeg("q", [[1, "Probeladung +", "test charge +"], [-1, "Probeladung −", "test charge −"]], 1),
            { wide: true, fig: `<div class="lw-field"></div><div class="lw-graph"></div>` })}
          ${facts([
            ["Bezugspunkt Erde", "reference: earth", `${L("Das Potential der Erde (oder: weit weg) ist", "The potential of the earth (or: far away) is")} ${sP("0")} = 0 V.`],
            ["positive Ladung", "positive charge", `<i>q</i> &gt; 0 → ${sP()} &gt; 0 ${L("in ihrer Umgebung — ein Berg", "around it — a hill")}.`],
            ["negative Ladung", "negative charge", `<i>q</i> &lt; 0 → ${sP()} &lt; 0 ${L("in ihrer Umgebung — ein Tal", "around it — a valley")}.`],
          ])}
          ${aside("Und die Kraft? Der Gradient ∇", "And the force? The gradient ∇", `
            ${F(`${vec("<i class='mv'>F</i>")}<sub>el</sub> = −<i class="mv">q</i> · ${vec("∇")}${sP()}(${vec("<i class='mv'>r</i>")}) &nbsp;&nbsp; ${vec("∇")} = (∂/∂<i>x</i>, ∂/∂<i>y</i>, ∂/∂<i>z</i>)<sup>T</sup>`, "small-f")}
            <p class="small">${L("∇φ zeigt dorthin, wo das Potential am steilsten <b>ansteigt</b>. Das Minus heißt: Eine positive Ladung wird „bergab“ gedrückt, zu kleinerem Potential. In der Zeichnung oben siehst du das am Kraftpfeil.",
              "∇φ points where the potential <b>rises</b> most steeply. The minus means: a positive charge is pushed “downhill”, towards lower potential. You can see this from the force arrow in the drawing above.")}</p>`)}
        </div>

        <div class="card">
          <h3>${L("Spannung: warum Strom fließt", "Voltage: why current flows")}</h3>
          ${facts([
            ["Aktives Gebiet", "active region", L("Bereich, in dem elektrische Energie durch eine äußere Kraft zugeführt werden kann — z. B. eine Batterie oder ein Generator.", "A region where electric energy can be supplied by an outside force — e.g. a battery or a generator.")],
            ["Passives Gebiet", "passive region", L("Alle Gebiete, die nicht aktiv sind.", "Every region that isn't active.")],
          ])}
          ${lw("regions", lenSlider("p1", "Potential φ₁", "Potential φ₁", -5, 5, 0.5, 2) + lenSlider("p2", "Potential φ₂", "Potential φ₂", -5, 5, 0.5, 6) +
            lenSeg("src", [[1, "mit Quelle", "with a source"], [0, "ohne Quelle", "without a source"]], 1), { wide: true })}
          <p>${L(`⇒ Ursache für einen elektrischen Strom ist eine ${T("Potentialdifferenz", "potential difference")}, die ${T("Spannung", "voltage")}:`,
            `⇒ The cause of an electric current is a ${T("Potentialdifferenz", "potential difference")}, the ${T("Spannung", "voltage")}:`)}</p>
          ${F(`${sU("12")} = ${sP("1")} − ${sP("2")}`)}
        </div>`,
      setup: (root) => { wAtom(root); wConservation(root); wLattice(root); wTube(root); wPotential(root); wRegions(root); },
      check: [
        { q: ["Ein Körper hat 10 Protonen und 12 Elektronen. Wie groß ist seine Ladung?", "A body has 10 protons and 12 electrons. What is its charge?"],
          opts: [["<i>Q</i> = −2<i>e</i>"], ["<i>Q</i> = +2<i>e</i>"], ["<i>Q</i> = 22<i>e</i>"], ["<i>Q</i> = 0"]],
          why: ["<i>Q</i> = (10 − 12) · <i>e</i> = −2<i>e</i>. Mehr Elektronen als Protonen → negativ geladen.", "<i>Q</i> = (10 − 12) · <i>e</i> = −2<i>e</i>. More electrons than protons → negatively charged."] },
        { q: ["Welche Ladung kann es <b>nicht</b> geben?", "Which charge can <b>not</b> exist?"],
          opts: [["<i>Q</i> = 1,5 · <i>e</i>", "<i>Q</i> = 1.5 · <i>e</i>"], ["<i>Q</i> = −3 · <i>e</i>"], ["<i>Q</i> = 0"], ["<i>Q</i> = 1000 · <i>e</i>"]],
          why: ["Ladungsquantisierung: <i>Q</i> = <i>N</i> · <i>e</i> mit ganzzahligem <i>N</i>. Halbe Elementarladungen gibt es nicht.", "Charge quantization: <i>Q</i> = <i>N</i> · <i>e</i> with a whole number <i>N</i>. There are no half elementary charges."] },
        { q: ["Elektronen bewegen sich in einem Draht nach rechts. Wohin zeigt die technische Stromrichtung?", "Electrons move to the right in a wire. Which way does the conventional current point?"],
          opts: [["nach links", "to the left"], ["nach rechts", "to the right"], ["es fließt kein Strom", "no current flows"], ["quer zum Draht", "across the wire"]],
          why: ["Die technische Stromrichtung ist die Bewegungsrichtung <b>positiver</b> Ladung — also entgegen den Elektronen.", "The conventional direction is the way <b>positive</b> charge moves — so against the electrons."] },
        { q: ["In 2 s fließen 6 C durch einen Leiterquerschnitt. Wie groß ist der Strom?", "6 C pass through a wire's cross-section in 2 s. How big is the current?"],
          opts: [["3 A"], ["12 A"], ["0,33 A", "0.33 A"], ["6 A"]],
          why: ["<i>I</i> = Δ<i>Q</i> / Δ<i>t</i> = 6 C / 2 s = 3 A.", "<i>I</i> = Δ<i>Q</i> / Δ<i>t</i> = 6 C / 2 s = 3 A."] },
        { q: ["φ₁ = 5 V und φ₂ = 2 V. Wie groß ist <i>U</i>₁₂?", "φ₁ = 5 V and φ₂ = 2 V. What is <i>U</i>₁₂?"],
          opts: [["3 V"], ["−3 V"], ["7 V"], ["2,5 V", "2.5 V"]],
          why: ["<i>U</i>₁₂ = φ₁ − φ₂ = 5 V − 2 V = 3 V.", "<i>U</i>₁₂ = φ₁ − φ₂ = 5 V − 2 V = 3 V."] },
      ],
    },

    /* ------------------------------------------------------------ 1.2 */
    {
      id: "1.2",
      title: ["Widerstände", "Resistors"],
      short: ["Widerstände", "Resistors"],
      about: ["R = ρ·l/A, Kennlinie, Ohmsches Gesetz, Leitwert", "R = ρ·l/A, characteristic curve, Ohm's law, conductance"],
      html: () => `
        <div class="card">
          <h3>${L("Widerstand und Material", "Resistance and material")}</h3>
          <p>${L(`Ein Stück Material mit der Länge <i>l</i> und dem Querschnitt <i>A</i> bremst den Strom: Es hat einen ${T("Widerstand", "resistance")} ${vR} — oder umgekehrt einen ${T("Leitwert", "conductance")} ${vG}.`,
            `A piece of material with length <i>l</i> and cross-section <i>A</i> holds the current back: it has a ${T("Widerstand", "resistance")} ${vR} — or, the other way round, a ${T("Leitwert", "conductance")} ${vG}.`)}</p>
          <div class="len-symbols">
            <figure>${svgBox(140, 50, `<line class="w" x1="10" y1="30" x2="130" y2="30"/><rect class="el" x="45" y="21" width="50" height="18" rx="2"/><text x="70" y="14" text-anchor="middle" class="lbl">R, G</text>`)}
              <figcaption>${L("Europa (DIN)", "Europe (DIN)")}</figcaption></figure>
            <figure>${svgBox(140, 50, `<path class="w" d="M10,30 L42,30 l4,-9 l8,18 l8,-18 l8,18 l8,-18 l8,18 l4,-9 L130,30"/><text x="70" y="14" text-anchor="middle" class="lbl">R, G</text>`)}
              <figcaption>${L("USA", "USA")}</figcaption></figure>
          </div>
          ${lw("geometry", lenSlider("l", "Länge l", "Length l", 1, 50, 1, 20) + lenSlider("A", "Querschnitt A", "Cross-section A", 0.5, 10, 0.5, 1.5) +
            lenSeg("m", MATERIALS.map((m) => [m.id, m.de, m.en]), "cu"), { wide: true })}
          <p>${L("Experimentell findet man:", "Experiments show:")}</p>
          ${F(`${mR} = <i class="mv">ρ</i> · ${frac("<i class='mv'>l</i>", "<i class='mv'>A</i>")} &nbsp;&nbsp;&nbsp; ${mG} = <i class="mv">κ</i> · ${frac("<i class='mv'>A</i>", "<i class='mv'>l</i>")} &nbsp;&nbsp;&nbsp; <i class="mv">ρ</i> = ${frac("1", "<i class='mv'>κ</i>")}`)}
          <p class="small muted lw-c">${L(`<i>ρ</i>: ${T("spezifischer Widerstand", "resistivity")} · <i>κ</i>: ${T("Leitfähigkeit", "conductivity")}`,
            `<i>ρ</i>: ${T("spezifischer Widerstand", "resistivity")} · <i>κ</i>: ${T("Leitfähigkeit", "conductivity")}`)}</p>
        </div>

        <div class="card">
          <h3>${L("Kennlinie und Ohmsches Gesetz", "Characteristic curve and Ohm's law")}</h3>
          <p>${L(`Das ${T("Klemmenverhalten", "terminal behaviour")} eines Bauteils ist seine ${T("Strom-Spannungs-Kennlinie", "current–voltage characteristic")}: ${sI()} = ${sI()}(${sU()}) bzw. ${sU()} = ${sU()}(${sI()}). Man misst sie so wie in der Skizze: ein <b>Voltmeter</b> parallel zum Widerstand, ein <b>Amperemeter</b> in Reihe.`,
            `A component's ${T("Klemmenverhalten", "terminal behaviour")} is its ${T("Strom-Spannungs-Kennlinie", "current–voltage characteristic")}: ${sI()} = ${sI()}(${sU()}) or ${sU()} = ${sU()}(${sI()}). You measure it as in the sketch: a <b>voltmeter</b> across the resistor, an <b>ammeter</b> in series.`)}</p>
          ${lw("ohm", lenSlider("U", "Spannung U", "Voltage U", 0, 10, 0.5, 4) + lenSlider("R", "Widerstand R", "Resistance R", 2, 20, 1, 5) +
            btn("clear", "Messpunkte löschen", "Clear the points"), { wide: true })}
          <p class="small muted">${L("Schieb die Spannung hin und her: Jeder Messpunkt bleibt im Diagramm stehen. Alle liegen auf einer Geraden durch den Ursprung — dann ein anderes <i>R</i> probieren.",
            "Slide the voltage back and forth: every reading stays in the graph. They all lie on a straight line through zero — then try another <i>R</i>.")}</p>
          ${facts([
            ["Ohmsches Gesetz", "Ohm's law", `${L(`Beim Widerstand ist ${vU} proportional zu ${vI}:`, `For a resistor ${vU} is proportional to ${vI}:`)} ${F(`${sU()} = ${mR} · ${sI()} &nbsp;&nbsp; ${sI()} = ${mG} · ${sU()} &nbsp;&nbsp; ${mR} = ${frac("1", mG)}`, "small-f")}`],
            ["Einheiten", "units", `${F(`[${mR}] = 1 ${frac("V", "A")} = 1 Ω &nbsp;&nbsp; [${mG}] = 1 ${frac("A", "V")} = 1 S`, "small-f")}${L("S = Siemens", "S = siemens")}`],
          ])}
        </div>`,
      setup: (root) => { wGeometry(root); wOhm(root); },
      check: [
        { q: ["<i>U</i> = 12 V liegen an <i>R</i> = 4 Ω. Wie groß ist <i>I</i>?", "<i>U</i> = 12 V is across <i>R</i> = 4 Ω. What is <i>I</i>?"],
          opts: [["3 A"], ["48 A"], ["0,33 A", "0.33 A"], ["16 A"]],
          why: ["<i>I</i> = <i>U</i> / <i>R</i> = 12 V / 4 Ω = 3 A.", "<i>I</i> = <i>U</i> / <i>R</i> = 12 V / 4 Ω = 3 A."] },
        { q: ["Ein Draht wird doppelt so lang (gleiches Material, gleicher Querschnitt). Was passiert mit <i>R</i>?", "A wire is made twice as long (same material, same cross-section). What happens to <i>R</i>?"],
          opts: [["<i>R</i> verdoppelt sich", "<i>R</i> doubles"], ["<i>R</i> halbiert sich", "<i>R</i> halves"], ["<i>R</i> bleibt gleich", "<i>R</i> stays the same"], ["<i>R</i> vervierfacht sich", "<i>R</i> becomes four times as big"]],
          why: ["<i>R</i> = ρ · <i>l</i> / <i>A</i>: <i>R</i> ist proportional zur Länge.", "<i>R</i> = ρ · <i>l</i> / <i>A</i>: <i>R</i> is proportional to the length."] },
        { q: ["<i>R</i> = 50 Ω. Wie groß ist der Leitwert <i>G</i>?", "<i>R</i> = 50 Ω. What is the conductance <i>G</i>?"],
          opts: [["0,02 S", "0.02 S"], ["50 S"], ["0,5 S", "0.5 S"], ["2 S"]],
          why: ["<i>G</i> = 1 / <i>R</i> = 1 / 50 Ω = 0,02 S.", "<i>G</i> = 1 / <i>R</i> = 1 / 50 Ω = 0.02 S."] },
        { q: ["Wie sieht die <i>I</i>-<i>U</i>-Kennlinie eines ohmschen Widerstands aus?", "What does the <i>I</i>–<i>U</i> characteristic of a resistor look like?"],
          opts: [["eine Gerade durch den Ursprung", "a straight line through the origin"], ["eine waagerechte Gerade", "a flat line"], ["eine Parabel", "a parabola"], ["eine senkrechte Gerade", "a vertical line"]],
          why: ["<i>I</i> = <i>G</i> · <i>U</i>: proportional, also eine Gerade durch (0, 0) mit der Steigung <i>G</i>.", "<i>I</i> = <i>G</i> · <i>U</i>: proportional, so a straight line through (0, 0) with slope <i>G</i>."] },
        { q: ["Welche Einheit gehört zum Widerstand?", "Which unit belongs to resistance?"],
          opts: [["1 Ω = 1 V/A"], ["1 S = 1 A/V"], ["1 V = 1 J/C"], ["1 A = 1 C/s"]],
          why: ["[<i>R</i>] = [<i>U</i>] / [<i>I</i>] = 1 V/A = 1 Ω. (1 A/V = 1 S ist der Leitwert.)", "[<i>R</i>] = [<i>U</i>] / [<i>I</i>] = 1 V/A = 1 Ω. (1 A/V = 1 S is conductance.)"] },
      ],
    },

    /* ------------------------------------------------------------ 1.3 */
    {
      id: "1.3",
      title: ["Klemme, Zweipol, n-Pol", "Terminal, two-terminal, n-terminal"],
      short: ["Zweipole", "Two-terminals"],
      about: ["Klemmen, Zweipole, n-Pole, lineare Zweipole", "Terminals, two-terminal elements, n-terminals, linear two-terminals"],
      html: () => `
        <div class="card">
          <h3>${L("Zweipol und n-Pol", "Two-terminal and n-terminal")}</h3>
          <p>${L(`Ein ${T("Zweipol", "two-terminal element")} ist eine elektrische Anordnung (Schaltung) mit <b>zwei Anschlüssen</b>, den ${T("Klemmen", "terminals")}.
              Widerstand, Spule, Kondensator, Diode … sind alle Zweipole. Was zählt, ist ihr Klemmenverhalten: ${sI()} = ${sI()}(${sU()}) bzw. ${sU()} = ${sU()}(${sI()}).`,
            `A ${T("Zweipol", "two-terminal element")} is an electrical arrangement (circuit) with <b>two connections</b>, the ${T("Klemmen", "terminals")}.
              Resistor, inductor, capacitor, diode … are all two-terminals. What matters is their terminal behaviour: ${sI()} = ${sI()}(${sU()}) or ${sU()} = ${sU()}(${sI()}).`)}</p>
          ${lw("twopole", lenSeg("e", ELEMENTS.map((e) => [e.id, e.de, e.en]), "r") + lenSlider("n", "Klemmen beim n-Pol", "Terminals of the n-pole", 2, 8, 1, 3), { wide: true })}
        </div>

        <div class="card">
          <h3>${L("Lineare Zweipole", "Linear two-terminals")}</h3>
          <p>${L("Ist die Kennlinie eine <b>Gerade</b>, heißt der Zweipol linear. Es gibt zwei gleichwertige Schreibweisen:", "If the characteristic is a <b>straight line</b>, the two-terminal is called linear. There are two equivalent ways to write it:")}</p>
          ${F(`${sU()} = ${mR} · ${sI()} + ${sU("0")} &nbsp;&nbsp;&nbsp;&nbsp; ${sI()} = ${mG} · ${sU()} + ${sI("0")}`)}
          ${lw("linear", lenSlider("R", "Steigung R", "Slope R", 0, 4, 0.5, 2) + lenSlider("U0", "Verschiebung U₀", "Offset U₀", -6, 6, 1, 3) + lenSlider("I", "Strom I ablesen", "Read off at current I", -3, 3, 0.5, 1))}
          <p class="small muted">${L("Stell <i>U</i>₀ auf 0: ein Widerstand. Stell <i>R</i> auf 0: eine ideale Spannungsquelle. Beides steckt in derselben Gleichung.",
            "Set <i>U</i>₀ to 0: a resistor. Set <i>R</i> to 0: an ideal voltage source. Both are in the same equation.")}</p>
        </div>`,
      setup: (root) => { wTwoPole(root); wLinear(root); },
      check: [
        { q: ["Was ist ein Zweipol?", "What is a two-terminal element?"],
          opts: [["eine Schaltung mit zwei Anschlüssen (Klemmen)", "a circuit with two connections (terminals)"], ["ein Bauteil mit zwei Knoten im Inneren", "a component with two nodes inside"],
            ["zwei parallel geschaltete Widerstände", "two resistors in parallel"], ["nur eine Batterie mit Plus- und Minuspol", "only a battery with a plus and a minus pole"]],
          why: ["Zweipol = elektrische Anordnung mit genau zwei Klemmen — egal, was drinsteckt.", "Two-terminal = an electrical arrangement with exactly two terminals — whatever is inside."] },
        { q: ["Ein linearer Zweipol mit <i>U</i> = <i>R</i>·<i>I</i> + <i>U</i>₀, <i>R</i> = 2 Ω, <i>U</i>₀ = 4 V. Welche Spannung liegt bei <i>I</i> = 3 A an?", "A linear two-terminal with <i>U</i> = <i>R</i>·<i>I</i> + <i>U</i>₀, <i>R</i> = 2 Ω, <i>U</i>₀ = 4 V. What is the voltage at <i>I</i> = 3 A?"],
          opts: [["10 V"], ["6 V"], ["24 V"], ["2 V"]],
          why: ["<i>U</i> = 2 Ω · 3 A + 4 V = 6 V + 4 V = 10 V.", "<i>U</i> = 2 Ω · 3 A + 4 V = 6 V + 4 V = 10 V."] },
        { q: ["Bei welchem linearen Zweipol geht die Kennlinie durch den Ursprung?", "For which linear two-terminal does the characteristic go through the origin?"],
          opts: [["<i>U</i>₀ = 0 — ein ohmscher Widerstand", "<i>U</i>₀ = 0 — a resistor"], ["<i>R</i> = 0"], ["<i>R</i> = <i>U</i>₀"], ["bei keinem", "none"]],
          why: ["Mit <i>U</i>₀ = 0 bleibt <i>U</i> = <i>R</i>·<i>I</i>: bei <i>I</i> = 0 ist auch <i>U</i> = 0.", "With <i>U</i>₀ = 0 it's just <i>U</i> = <i>R</i>·<i>I</i>: at <i>I</i> = 0, <i>U</i> = 0 too."] },
        { q: ["Ein Transistor hat drei Anschlüsse. Er ist ein …", "A transistor has three connections. It is a …"],
          opts: [["Dreipol (n-Pol mit n = 3)", "three-terminal (n-terminal with n = 3)"], ["Zweipol", "two-terminal"], ["Knoten", "node"], ["Masche", "mesh"]],
          why: ["Ein n-Pol hat n Klemmen — drei Anschlüsse heißt n = 3.", "An n-terminal has n terminals — three connections means n = 3."] },
      ],
    },

    /* ------------------------------------------------------------ 1.4 */
    {
      id: "1.4",
      title: ["Elektrische Netzwerke", "Electrical networks"],
      short: ["Netzwerke", "Networks"],
      about: ["Knoten, Zweige und Maschen erkennen", "Spotting nodes, branches and meshes"],
      html: () => `
        <div class="card">
          <p>${L(`Ein ${T("elektrisches Netz", "electrical network")} ist ein Zusammenschluss mehrerer elektrischer n-Pole (Netzelemente). Drei Begriffe braucht man, um darüber zu reden:`,
            `An ${T("elektrisches Netz", "electrical network")} is several electrical n-terminals (network elements) joined together. You need three words to talk about it:`)}</p>
          ${facts([
            ["Knoten", "node", L("Punkt, in dem <b>mehr als zwei</b> Klemmen zusammenlaufen.", "A point where <b>more than two</b> terminals meet.")],
            ["Zweig", "branch", L("Verbindung zwischen <b>zwei Knoten</b>, die einen oder mehrere Zweipole enthält.", "A connection between <b>two nodes</b> holding one or more two-terminals.")],
            ["Masche", "mesh (loop)", L("<b>Geschlossener Weg</b> im Netz, der aus mindestens zwei Zweigen besteht.", "A <b>closed path</b> in the network made of at least two branches.")],
          ])}
          ${lw("network", lenSeg("mode", [["k", "Knoten", "Nodes"], ["z", "Zweige", "Branches"], ["m", "Maschen", "Meshes"]], "k") + `<div class="lw-net-pick"></div>`, { wide: true })}
          <p class="note">${L("Zwei Punkte, die nur durch einen Draht <b>ohne Bauteil</b> verbunden sind, sind ein und derselbe Knoten — so wie E und F hier.",
            "Two points joined only by a wire <b>with no element</b> are one and the same node — like E and F here.")}</p>
        </div>`,
      setup: (root) => { wNetwork(root); },
      check: [
        { q: ["Wann ist ein Verbindungspunkt ein Knoten?", "When is a connection point a node?"],
          opts: [["wenn mehr als zwei Klemmen dort zusammenlaufen", "when more than two terminals meet there"], ["wenn genau zwei Klemmen dort zusammenlaufen", "when exactly two terminals meet there"],
            ["an jeder Ecke einer Leitung", "at every corner of a wire"], ["nur an einer Quelle", "only at a source"]],
          why: ["Knoten: mehr als zwei Klemmen. Bei genau zwei liegen die Bauteile nur hintereinander im selben Zweig.", "Node: more than two terminals. With exactly two, the elements just sit in a row in the same branch."] },
        { q: ["Zwei Knotenpunkte sind nur durch einen Draht ohne Bauteil verbunden. Wie viele Knoten sind das?", "Two node points are joined only by a wire with no element. How many nodes is that?"],
          opts: [["einer", "one"], ["zwei", "two"], ["keiner", "none"], ["drei", "three"]],
          why: ["Ein blanker Draht hat überall dasselbe Potential — beide Punkte sind derselbe Knoten.", "A bare wire has the same potential everywhere — both points are the same node."] },
        { q: ["Was ist ein Zweig?", "What is a branch?"],
          opts: [["eine Verbindung zwischen zwei Knoten mit einem oder mehreren Zweipolen", "a connection between two nodes with one or more two-terminals"], ["ein geschlossener Weg im Netz", "a closed path in the network"],
            ["ein Punkt mit drei Klemmen", "a point with three terminals"], ["ein einzelner Draht ohne Bauteil", "a single wire with no element"]],
          why: ["Zweig = von Knoten zu Knoten, mit mindestens einem Zweipol darin. Der geschlossene Weg ist die Masche.", "Branch = from node to node, with at least one two-terminal in it. The closed path is the mesh."] },
        { q: ["Aus wie vielen Zweigen besteht eine Masche mindestens?", "At least how many branches make a mesh?"],
          opts: [["2"], ["1"], ["3"], ["4"]],
          why: ["Ein Zweig allein führt von einem Knoten zu einem anderen — erst ein zweiter Zweig schließt den Weg.", "One branch only leads from one node to another — a second branch is needed to close the path."] },
      ],
    },

    /* ------------------------------------------------------------ 1.5 */
    {
      id: "1.5",
      title: ["Zählpfeile, Zählpfeilsysteme", "Reference arrows and sign conventions"],
      short: ["Zählpfeile", "Arrows"],
      about: ["Bezugspfeile für Strom und Spannung, VZS und EZS", "Reference arrows for current and voltage, VZS and EZS"],
      html: () => `
        <div class="card">
          <h3>${L("Zählpfeile", "Reference arrows")}</h3>
          <p>${L(`${T("Bezugspfeile", "reference arrows")} legen Richtungen in der Schaltung fest. ${T("Zählpfeilgrößen", "arrow quantities")} sind skalare Größen, deren Wert ein Vorzeichen hat und erst zusammen mit einer Bezugsrichtung eindeutig ist. Bisher: <b class="q-i">Strom</b> und <b class="q-u">Spannung</b>.`,
            `${T("Bezugspfeile", "Reference arrows")} fix directions in the circuit. ${T("Zählpfeilgrößen", "Arrow quantities")} are scalars whose value has a sign and only means something together with a reference direction. So far: <b class="q-i">current</b> and <b class="q-u">voltage</b>.`)}</p>
          ${lw("arrows", lenSlider("p1", "Potential φ₁", "Potential φ₁", 0, 10, 1, 6) + lenSlider("p2", "Potential φ₂", "Potential φ₂", 0, 10, 1, 2) +
            `<div class="lw-row">${btn("fi", "Strompfeil umdrehen", "Flip the current arrow")}${btn("fu", "Spannungspfeil umdrehen", "Flip the voltage arrow")}</div>`, { wide: true })}
          ${facts([
            ["Strom", "current", L(`${sI("1")} &gt; 0: der Strom fließt <b>in</b> Pfeilrichtung. ${sI("1")} &lt; 0: er fließt <b>gegen</b> den Pfeil.`, `${sI("1")} &gt; 0: the current flows <b>along</b> the arrow. ${sI("1")} &lt; 0: it flows <b>against</b> it.`)],
            ["Spannung", "voltage", L(`Der Pfeil zeigt von ${sP("1")} nach ${sP("2")}: ${sU("1")} = ${sP("1")} − ${sP("2")}. Man darf ihn auch gebogen neben das Bauteil zeichnen.`,
              `The arrow points from ${sP("1")} to ${sP("2")}: ${sU("1")} = ${sP("1")} − ${sP("2")}. It may also be drawn curved beside the element.`)],
          ])}
        </div>

        <div class="card">
          <h3>${L("Zählpfeilsysteme", "Sign conventions")}</h3>
          <p>${L("An einem Zweipol gibt es zwei Möglichkeiten, Strom- und Spannungspfeil zueinander zu legen:", "On a two-terminal there are two ways to put the current and voltage arrows relative to each other:")}</p>
          ${facts([
            ["Verbraucher-Zählpfeilsystem (VZS)", "passive / load convention (VZS)", L("Die Zählpfeile sind <b>gleichgerichtet</b>.", "The arrows point the <b>same way</b>.")],
            ["Erzeuger-Zählpfeilsystem (EZS)", "active / generator convention (EZS)", L("Die Zählpfeile sind <b>entgegengerichtet</b>.", "The arrows point <b>opposite ways</b>.")],
          ])}
          ${lw("systems", lenSeg("look", [["part", "Bauteil", "Element"], ["box", "Kasten mit Klemmen", "Box with terminals"]], "part") +
            btn("quiz", "Teste dich", "Test yourself"))}
          <p class="small muted">${L("Tipp die Pfeile an, um sie umzudrehen. Bei „Teste dich“ kommen zufällige Bilder wie in der Vorlesung.", "Tap the arrows to flip them. “Test yourself” shows random pictures like the ones in the lectures.")}</p>
          <p class="note">${L(`Merke: Am Widerstand gilt ${sU()} = ${mR} · ${sI()} im <b>VZS</b>. Im EZS wird daraus ${sU()} = −${mR} · ${sI()}. Für Verbraucher nimmt man darum meist das VZS, für Quellen das EZS.`,
            `Remember: for a resistor ${sU()} = ${mR} · ${sI()} holds in the <b>VZS</b>. In the EZS it becomes ${sU()} = −${mR} · ${sI()}. So loads usually get the VZS, sources the EZS.`)}</p>
        </div>`,
      setup: (root) => { wArrows(root); wSystems(root); },
      check: [
        { q: ["Der Strompfeil zeigt nach rechts, tatsächlich fließen 2 A nach links. Welcher Wert gehört zum Pfeil?", "The current arrow points right, but really 2 A flow to the left. What value goes with the arrow?"],
          opts: [["<i>I</i> = −2 A"], ["<i>I</i> = +2 A"], ["<i>I</i> = 0"], ["So darf man den Pfeil nicht zeichnen.", "You aren't allowed to draw the arrow like that."]],
          why: ["Der Pfeil darf beliebig liegen. Fließt der Strom dagegen, ist der Wert negativ.", "The arrow may point either way. If the current flows against it, the value is negative."] },
        { q: ["φ₁ = 3 V (links), φ₂ = 8 V (rechts). Der Spannungspfeil zeigt von links nach rechts. <i>U</i> = ?", "φ₁ = 3 V (left), φ₂ = 8 V (right). The voltage arrow points left to right. <i>U</i> = ?"],
          opts: [["−5 V"], ["+5 V"], ["11 V"], ["−11 V"]],
          why: ["Pfeil von 1 nach 2: <i>U</i> = φ₁ − φ₂ = 3 V − 8 V = −5 V.", "Arrow from 1 to 2: <i>U</i> = φ₁ − φ₂ = 3 V − 8 V = −5 V."] },
        { q: ["Strom- und Spannungspfeil zeigen an einem Zweipol in dieselbe Richtung. Welches Zählpfeilsystem ist das?", "The current and voltage arrows on a two-terminal point the same way. Which convention is that?"],
          opts: [["Verbraucher-Zählpfeilsystem (VZS)", "passive / load convention (VZS)"], ["Erzeuger-Zählpfeilsystem (EZS)", "active / generator convention (EZS)"], ["keins von beiden", "neither"], ["beide", "both"]],
          why: ["Gleichgerichtet = VZS, entgegengerichtet = EZS.", "Same direction = VZS, opposite = EZS."] },
        { q: ["Ändert sich der tatsächliche Stromfluss, wenn man einen Zählpfeil umdreht?", "Does the real current change if you flip a reference arrow?"],
          opts: [["Nein — nur das Vorzeichen des Werts ändert sich.", "No — only the sign of the value changes."], ["Ja, der Strom fließt dann andersherum.", "Yes, the current then flows the other way."],
            ["Ja, der Strom wird null.", "Yes, the current becomes zero."], ["Nur bei Spannungen.", "Only for voltages."]],
          why: ["Der Pfeil ist nur eine Vereinbarung, in welche Richtung gezählt wird. Die Physik bleibt gleich.", "The arrow is only an agreement on which way we count. The physics stays the same."] },
      ],
    },

    /* ------------------------------------------------------------ 1.6 */
    {
      id: "1.6",
      title: ["Kirchhoffsche Gleichungen", "Kirchhoff's laws"],
      short: ["Kirchhoff", "Kirchhoff"],
      about: ["Knotensatz (Ladungserhaltung) und Maschensatz (Energieerhaltung)", "Current law (charge conservation) and voltage law (energy conservation)"],
      html: () => `
        <div class="card">
          <h3>${L("Knotensatz — 1. Kirchhoffsches Gesetz", "Current law — Kirchhoff's 1st law")}</h3>
          <p>${L(`${T("Knotensatz", "Kirchhoff's current law, KCL")} → folgt aus der <b>Ladungserhaltung</b>. Die Summe aller in einen Knoten <b>hineinfließenden</b> Ströme ist gleich der Summe der <b>herausfließenden</b> Ströme.`,
            `${T("Knotensatz", "Kirchhoff's current law, KCL")} → follows from <b>conservation of charge</b>. The sum of all currents flowing <b>into</b> a node equals the sum of the currents flowing <b>out</b>.`)}</p>
          ${F(`${sumOf("<i>p</i>", "<i>i</i> = 1")} ${sym("I", "q-i", "i")}<sup>(${L("zu", "in")})</sup> = ${sumOf("<i>q</i>", "<i>j</i> = 1")} ${sym("I", "q-i", "j")}<sup>(${L("weg", "out")})</sup> &nbsp;⇔&nbsp; <span class="len-box">${sumOf("<i>p</i>+<i>q</i>", "<i>k</i> = 1")} ${sym("I", "q-i", "k")} = 0</span>`)}
          <p class="small muted lw-c">${L(`${sym("I", "q-i", "k")} &gt; 0, falls der Strom in den Knoten fließt; ${sym("I", "q-i", "k")} &lt; 0, falls er herausfließt.`, `${sym("I", "q-i", "k")} &gt; 0 if the current flows into the node; ${sym("I", "q-i", "k")} &lt; 0 if it flows out.`)}</p>
          ${lw("node", lenSeg("auto", [[1, "I₅ ausrechnen lassen", "Work out I₅ for me"], [0, "I₅ selbst einstellen", "Set I₅ myself"]], 1) + `<div class="lw-node-ctrl"></div>`)}
          <p class="small muted">${L("Tipp auf einen Pfeil, um ihn umzudrehen. Wie Wasser in einer Rohrkreuzung: Im Knoten kann sich keine Ladung ansammeln.",
            "Tap an arrow to flip it. Like water at a pipe junction: no charge can pile up in the node.")}</p>
        </div>

        <div class="card">
          <h3>${L("Maschensatz — 2. Kirchhoffsches Gesetz", "Voltage law — Kirchhoff's 2nd law")}</h3>
          <p>${L(`${T("Maschensatz", "Kirchhoff's voltage law, KVL")} → folgt aus der <b>Energieerhaltung</b>. Die Summe aller Zweigspannungen über einen <b>geschlossenen</b> Maschenumlauf (die ${T("Umlaufspannung", "loop voltage")}) muss verschwinden.`,
            `${T("Maschensatz", "Kirchhoff's voltage law, KVL")} → follows from <b>conservation of energy</b>. The sum of all branch voltages round a <b>closed</b> loop (the ${T("Umlaufspannung", "loop voltage")}) must be zero.`)}</p>
          ${F(`<span class="len-box">${sumOf("<i>n</i>", "<i>k</i> = 1")} ${sU("k")} = 0</span> &nbsp;=&nbsp; (${sP("1")} − ${sP("2")}) + (${sP("2")} − ${sP("3")}) + … + (${sP("n")} − ${sP("1")})`)}
          <p class="small muted lw-c">${L("Jedes Potential kommt einmal mit + und einmal mit − vor. Wer einmal herumläuft, ist wieder beim gleichen Potential — und damit bei der gleichen Energie (φ = <i>W</i>/<i>q</i>).",
            "Every potential appears once with + and once with −. Walk round once and you're back at the same potential — and so at the same energy (φ = <i>W</i>/<i>q</i>).")}</p>
          ${lw("mesh", lenSeg("cw", [[1, "↻ im Uhrzeigersinn", "↻ clockwise"], [0, "↺ gegen den Uhrzeigersinn", "↺ anticlockwise"]], 1) +
            `<div class="lw-row">${btn("step", "Schritt ▸", "Step ▸", "primary")}${btn("all", "Ganz herum", "All the way")}${btn("restart", "Von vorn", "Start again")}</div>` +
            lenSlider("U0", "Quelle U₀", "Source U₀", 1, 12, 1, 9) + lenSlider("R1", "R₁", "R₁", 1, 10, 1, 2) + lenSlider("R2", "R₂", "R₂", 1, 10, 1, 3) + lenSlider("R3", "R₃", "R₃", 1, 10, 1, 4),
            { wide: true, fig: `<div class="lw-pair"><div class="lw-circ"></div><div class="lw-prof"></div></div>` })}
          <p class="small muted">${L("Wie in der Vorlesung: im Uhrzeigersinn ergibt sich −<i>U</i>₁₄ + <i>U</i>₁₂ + <i>U</i>₂₃ + <i>U</i>₃₄ = 0, gegen den Uhrzeigersinn +<i>U</i>₁₄ − <i>U</i>₃₄ − <i>U</i>₂₃ − <i>U</i>₁₂ = 0 — dieselbe Gleichung, nur mal −1.",
            "As in the lecture: clockwise gives −<i>U</i>₁₄ + <i>U</i>₁₂ + <i>U</i>₂₃ + <i>U</i>₃₄ = 0, anticlockwise +<i>U</i>₁₄ − <i>U</i>₃₄ − <i>U</i>₂₃ − <i>U</i>₁₂ = 0 — the same equation, just times −1.")}</p>
        </div>`,
      setup: (root) => { wNode(root); wMesh(root); },
      check: [
        { q: ["In einen Knoten fließen 3 A und 2 A hinein und 4 A heraus. Was ist mit dem vierten Zweig?", "3 A and 2 A flow into a node and 4 A flow out. What about the fourth branch?"],
          opts: [["1 A fließt heraus", "1 A flows out"], ["1 A fließt hinein", "1 A flows in"], ["9 A fließen heraus", "9 A flow out"], ["kein Strom", "no current"]],
          why: ["Hinein: 5 A, heraus bisher 4 A. Damit die Summe 0 ist, muss noch 1 A herausfließen.", "In: 5 A, out so far: 4 A. For the sum to be 0, another 1 A must flow out."] },
        { q: ["Der Knotensatz folgt aus der …", "The current law follows from …"],
          opts: [["Ladungserhaltung", "conservation of charge"], ["Energieerhaltung", "conservation of energy"], ["Impulserhaltung", "conservation of momentum"], ["dem Ohmschen Gesetz", "Ohm's law"]],
          why: ["Ladung kann sich im Knoten weder ansammeln noch aus dem Nichts entstehen.", "Charge can neither pile up in a node nor appear from nowhere."] },
        { q: ["Der Maschensatz folgt aus der …", "The voltage law follows from …"],
          opts: [["Energieerhaltung", "conservation of energy"], ["Ladungserhaltung", "conservation of charge"], ["Impulserhaltung", "conservation of momentum"], ["dem Ohmschen Gesetz", "Ohm's law"]],
          why: ["Einmal herum ist man wieder beim gleichen Potential, also bei der gleichen Energie: Die Spannungen heben sich auf.", "Once round you're back at the same potential, so at the same energy: the voltages cancel out."] },
        { q: ["Eine Masche: eine Quelle mit 12 V und drei Widerstände. An zweien fallen 5 V und 4 V ab. Wie viel am dritten?", "A mesh: a 12 V source and three resistors. Two of them drop 5 V and 4 V. How much does the third drop?"],
          opts: [["3 V"], ["21 V"], ["9 V"], ["12 V"]],
          why: ["12 V − 5 V − 4 V − <i>U</i>₃ = 0 → <i>U</i>₃ = 3 V.", "12 V − 5 V − 4 V − <i>U</i>₃ = 0 → <i>U</i>₃ = 3 V."] },
      ],
    },

    /* ------------------------------------------------------------ 1.7 */
    {
      id: "1.7",
      title: ["Elektrische Quellen", "Electrical sources"],
      short: ["Quellen", "Sources"],
      about: ["Ideale Spannungs- und Stromquelle", "Ideal voltage and current sources"],
      html: () => `
        <div class="card">
          ${facts([
            ["Elektrische Quelle", "electrical source", L("Ein <b>aktiver Zweipol</b>, der elektrische Ladung trennen kann.", "An <b>active two-terminal</b> that can separate electric charge.")],
            ["Ideale Quelle", "ideal source", L("Klemmenspannung bzw. Klemmenstrom hängen <b>nicht</b> von der angeschlossenen Schaltung ab.", "Its terminal voltage, or terminal current, does <b>not</b> depend on the circuit connected to it.")],
          ])}
          ${lw("sources", lenSeg("kind", [["u", "Ideale Spannungsquelle", "Ideal voltage source"], ["i", "Ideale Stromquelle", "Ideal current source"]], "u") +
            lenSlider("R", "Angeschlossener Widerstand R", "Connected resistor R", 0.5, 20, 0.5, 5) +
            `<div class="lw-u0">${lenSlider("U0", "Quellenspannung U₀", "Source voltage U₀", 1, 12, 1, 10)}</div>
             <div class="lw-i0" hidden>${lenSlider("I0", "Quellenstrom I₀", "Source current I₀", 0.5, 4, 0.5, 2)}</div>`, { wide: true })}
          <p class="small muted">${L("Dreh am Widerstand: Die Größe, die die Quelle festhält, bleibt eine waagerechte Linie. Der Betriebspunkt wandert nur entlang dieser Linie — dorthin, wo sie die Gerade des Widerstands schneidet.",
            "Turn the resistor: the quantity the source holds stays a flat line. The operating point only moves along that line — to where it meets the resistor's line.")}</p>
          ${facts([
            ["Ideale Spannungsquelle", "ideal voltage source", L(`${sU()} = ${sU("0")} für jeden Strom ${vI}. Schaltzeichen: Kreis mit einem Strich <b>in</b> Leitungsrichtung.`, `${sU()} = ${sU("0")} for any current ${vI}. Symbol: a circle with a line <b>along</b> the wire.`)],
            ["Ideale Stromquelle", "ideal current source", L(`${sI()} = ${sI("0")} für jede Spannung ${vU}. Schaltzeichen: Kreis mit einem Strich <b>quer</b> zur Leitung.`, `${sI()} = ${sI("0")} for any voltage ${vU}. Symbol: a circle with a line <b>across</b> the wire.`)],
          ])}
        </div>`,
      setup: (root) => { wSources(root); },
      check: [
        { q: ["An einer idealen Spannungsquelle mit <i>U</i>₀ = 10 V hängt statt 10 Ω jetzt 5 Ω. Was passiert?", "An ideal 10 V voltage source now feeds 5 Ω instead of 10 Ω. What happens?"],
          opts: [["<i>U</i> bleibt 10 V, der Strom verdoppelt sich", "<i>U</i> stays 10 V, the current doubles"], ["<i>U</i> halbiert sich, <i>I</i> bleibt gleich", "<i>U</i> halves, <i>I</i> stays the same"],
            ["<i>U</i> und <i>I</i> bleiben gleich", "<i>U</i> and <i>I</i> stay the same"], ["<i>U</i> verdoppelt sich", "<i>U</i> doubles"]],
          why: ["Die ideale Spannungsquelle hält <i>U</i> = 10 V fest. <i>I</i> = 10 V / 5 Ω = 2 A statt 1 A.", "The ideal voltage source holds <i>U</i> = 10 V. <i>I</i> = 10 V / 5 Ω = 2 A instead of 1 A."] },
        { q: ["Eine ideale Stromquelle mit <i>I</i>₀ = 2 A speist <i>R</i> = 3 Ω. Wie groß ist <i>U</i>?", "An ideal current source with <i>I</i>₀ = 2 A feeds <i>R</i> = 3 Ω. What is <i>U</i>?"],
          opts: [["6 V"], ["1,5 V", "1.5 V"], ["0,67 V", "0.67 V"], ["2 V"]],
          why: ["Die Stromquelle hält <i>I</i> = 2 A fest; <i>U</i> = <i>I</i> · <i>R</i> = 2 A · 3 Ω = 6 V.", "The current source holds <i>I</i> = 2 A; <i>U</i> = <i>I</i> · <i>R</i> = 2 A · 3 Ω = 6 V."] },
        { q: ["Wie sieht die <i>U</i>(<i>I</i>)-Kennlinie einer idealen Spannungsquelle aus?", "What does the <i>U</i>(<i>I</i>) characteristic of an ideal voltage source look like?"],
          opts: [["eine waagerechte Gerade bei <i>U</i>₀", "a flat line at <i>U</i>₀"], ["eine Gerade durch den Ursprung", "a straight line through the origin"], ["eine senkrechte Gerade", "a vertical line"], ["eine Hyperbel", "a hyperbola"]],
          why: ["<i>U</i> = <i>U</i>₀, egal welcher Strom fließt — also waagerecht.", "<i>U</i> = <i>U</i>₀ whatever current flows — so it's flat."] },
        { q: ["Was ist eine elektrische Quelle?", "What is an electrical source?"],
          opts: [["ein aktiver Zweipol, der Ladung trennen kann", "an active two-terminal that can separate charge"], ["ein passiver Zweipol", "a passive two-terminal"], ["ein Knoten mit Ladung", "a node with charge"], ["jeder Widerstand", "any resistor"]],
          why: ["Quellen sind aktive Zweipole: Sie trennen Ladung und liefern so Energie.", "Sources are active two-terminals: they separate charge and so supply energy."] },
      ],
    },
  ],
};

const LEN_CHAPTERS = [LEN_CH1];

/* ---------------------------------------------------------------- Formulas and terms */

const LEN_FORMULAS = [
  { sec: "1.1", name: ["Elementarladung", "Elementary charge"], f: `${me} ≈ <span class="l-de">1,602</span><span class="l-en">1.602</span> · 10<sup>−19</sup> C` },
  { sec: "1.1", name: ["Ladungsquantisierung", "Charge quantization"], f: `${mQ} = <i class="mv">N</i> · ${me}, &nbsp;<i class="mv">N</i> ∈ ℤ` },
  { sec: "1.1", name: ["Ladungserhaltung", "Conservation of charge"], f: `${sumOf("", "<i>i</i>")} <i class="mv">q</i><sub>i</sub> = const.`, note: ["im abgeschlossenen System", "in a closed system"] },
  { sec: "1.1", name: ["Strom", "Current"], f: `${sI()} = ${frac(`d${mQ}`, "d<i class='mv'>t</i>")} &nbsp; ${unit("1 A = 1 C/s")}` },
  { sec: "1.1", name: ["Potential", "Potential"], f: `${sP()} = ${frac("<i class='mv'>W</i>", "<i class='mv'>q</i>")} &nbsp; ${unit("1 V = 1 J/C")}` },
  { sec: "1.1", name: ["Spannung", "Voltage"], f: `${sU("12")} = ${sP("1")} − ${sP("2")}` },
  { sec: "1.2", name: ["Ohmsches Gesetz", "Ohm's law"], f: `${sU()} = ${mR} · ${sI()} &nbsp;&nbsp; ${sI()} = ${mG} · ${sU()}`, note: ["im VZS", "in the VZS"] },
  { sec: "1.2", name: ["Leitwert", "Conductance"], f: `${mG} = ${frac("1", mR)} &nbsp; ${unit("1 S = 1 A/V")}` },
  { sec: "1.2", name: ["Widerstand eines Leiters", "Resistance of a conductor"], f: `${mR} = <i class="mv">ρ</i> · ${frac("<i class='mv'>l</i>", "<i class='mv'>A</i>")} &nbsp;&nbsp; ${mG} = <i class="mv">κ</i> · ${frac("<i class='mv'>A</i>", "<i class='mv'>l</i>")}` },
  { sec: "1.3", name: ["Linearer Zweipol", "Linear two-terminal"], f: `${sU()} = ${mR} · ${sI()} + ${sU("0")} &nbsp;&nbsp; ${sI()} = ${mG} · ${sU()} + ${sI("0")}` },
  { sec: "1.5", name: ["Spannungspfeil", "Voltage arrow"], f: `${sU("12")} = ${sP("1")} − ${sP("2")}`, note: ["Pfeil von 1 nach 2", "arrow from 1 to 2"] },
  { sec: "1.6", name: ["Knotensatz", "Current law (KCL)"], f: `${sumOf("", "<i>k</i>")} ${sym("I", "q-i", "k")} = 0`, note: ["hinein +, heraus −", "in +, out −"] },
  { sec: "1.6", name: ["Maschensatz", "Voltage law (KVL)"], f: `${sumOf("", "<i>k</i>")} ${sU("k")} = 0`, note: ["Pfeil in Umlaufrichtung +, dagegen −", "arrow along the loop +, against −"] },
  { sec: "1.7", name: ["Ideale Spannungsquelle", "Ideal voltage source"], f: `${sU()} = ${sU("0")}`, note: ["für jeden Strom", "for any current"] },
  { sec: "1.7", name: ["Ideale Stromquelle", "Ideal current source"], f: `${sI()} = ${sI("0")}`, note: ["für jede Spannung", "for any voltage"] },
];

// German term, English term.
const LEN_GLOSSARY = [
  ["Ladung", "charge"], ["Elementarladung", "elementary charge"], ["Atomkern", "nucleus"], ["Atomhülle", "electron shell"],
  ["Ladungsquantisierung", "charge quantization"], ["Ladungsneutralität", "charge neutrality"], ["Ladungstrennung", "charge separation"],
  ["Ladungserhaltung", "conservation of charge"], ["abgeschlossenes System", "closed (isolated) system"], ["Strom", "current"],
  ["technische Stromrichtung", "conventional current direction"], ["physikalische Stromrichtung", "electron flow direction"],
  ["Querschnitt", "cross-section"], ["Normalenvektor", "normal vector"], ["Potential", "potential"], ["Spannung", "voltage"],
  ["Potentialdifferenz", "potential difference"], ["aktives Gebiet", "active region"], ["passives Gebiet", "passive region"], ["Leiter", "conductor"],
  ["Widerstand", "resistor; resistance"], ["Leitwert", "conductance"], ["spezifischer Widerstand", "resistivity"], ["Leitfähigkeit", "conductivity"],
  ["Kennlinie", "characteristic (curve)"], ["Klemmenverhalten", "terminal behaviour"], ["Ohmsches Gesetz", "Ohm's law"], ["Messschaltung", "measuring circuit"],
  ["Klemme", "terminal"], ["Zweipol", "two-terminal element (one-port)"], ["n-Pol", "n-terminal element"], ["Spule", "inductor (coil)"],
  ["Kondensator", "capacitor"], ["Diode", "diode"], ["linearer Zweipol", "linear two-terminal"], ["Netz, Netzwerk", "network"],
  ["Netzelement", "network element"], ["Knoten", "node"], ["Zweig", "branch"], ["Masche", "mesh, loop"], ["Zählpfeil, Bezugspfeil", "reference arrow"],
  ["Bezugsrichtung", "reference direction"], ["Verbraucher-Zählpfeilsystem (VZS)", "passive / load sign convention"],
  ["Erzeuger-Zählpfeilsystem (EZS)", "active / generator sign convention"], ["Knotensatz", "Kirchhoff's current law (KCL)"],
  ["Maschensatz", "Kirchhoff's voltage law (KVL)"], ["Umlaufspannung", "loop voltage"], ["Quelle", "source"], ["ideale Spannungsquelle", "ideal voltage source"],
  ["ideale Stromquelle", "ideal current source"], ["Klemmenspannung", "terminal voltage"], ["Klemmenstrom", "terminal current"],
  ["Kurzschluss", "short circuit"], ["Leerlauf", "open circuit"], ["Betriebspunkt", "operating point"],
];
