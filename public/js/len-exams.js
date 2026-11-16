// LEN old exams (Altklausuren): the ten exams from 2018 to 2022 with their tasks, each tagged by
// topic and by the methods it asks for, with links straight to the task and to its solution in
// the PDF. The PDFs are KIT material: they live in public/len-exams/ on the server only and are
// never committed (see .gitignore and the README). The topics and tags here are shared with the
// generated practice tasks and the mock exams (len-gen.js, len-practice.js).

// The five topics every exam has, in the order the exams ask them.
const LEN_TOPICS = {
  ok: { de: "Ortskurven & Resonanz", en: "Loci & resonance", short: ["Ortskurve", "Locus"], color: "var(--c-time)" },
  net: { de: "Netzwerke", en: "Networks", short: ["Netzwerk", "Network"], color: "var(--c-object)" },
  ac: { de: "Komplexe Wechselstromlehre", en: "Complex AC circuits", short: ["Wechselstrom", "AC"], color: "var(--c-subject)" },
  bode: { de: "Bodediagramme", en: "Bode plots", short: ["Bode", "Bode"], color: "var(--c-topic)" },
  opv: { de: "Operationsverstärker", en: "Operational amplifiers", short: ["OPV", "Op-amp"], color: "var(--c-point)" },
};
const LEN_TOPIC_IDS = Object.keys(LEN_TOPICS);

// The methods a task asks for, to filter more finely than by topic.
const LEN_TAGS = {
  kirchhoff: ["Kirchhoff", "Kirchhoff"], stern: ["Stern-Dreieck", "star–delta"], quelle: ["Quellenumwandlung", "source conversion"],
  masche: ["Maschenstromverfahren", "mesh analysis"], knoten: ["Knotenpotentialverfahren", "nodal analysis"],
  anpassung: ["Leistungsanpassung", "power matching"], leistung: ["Leistung", "power"],
  zeiger: ["Zeigerdiagramm", "phasor diagram"], komp: ["Kompensation", "compensation"], vierpol: ["Vierpole", "two-ports"], trafo: ["Transformator", "transformer"],
  resonanz: ["Resonanz", "resonance"], guete: ["Güte & Bandbreite", "Q & bandwidth"], inversion: ["Inversion", "inversion"], zuordnung: ["Zuordnen", "matching"],
  tp: ["Tiefpass", "low-pass"], hp: ["Hochpass", "high-pass"], bp: ["Bandpass", "band-pass"], asym: ["Asymptoten", "asymptotes"],
  inv: ["(nicht-)invertierend", "(non-)inverting"], diff: ["Subtrahierer", "difference amp"], sum: ["Addierer", "summing amp"],
  folger: ["Impedanzwandler", "buffer"], sat: ["Aussteuergrenze", "saturation"],
};

// What each task asks, part by part, in our own words (German, English).
const LEN_ASKS = {
  "2018-04/1": [["Admittanz einer RLC-Schaltung nach Real- und Imaginärteil", "admittance of an RLC circuit, real and imaginary part"],
    ["Ortskurven von Admittanz und Impedanz, Schnittpunkte mit der x-Achse", "loci of admittance and impedance, where they cross the x-axis"],
    ["Resonanzkreisfrequenz ω₀ bestimmen und begründen", "find the resonant frequency ω₀ and explain"],
    ["zeigen: die ±45°-Frequenzen ω₁ und ω₂", "show the ±45° frequencies ω₁ and ω₂"],
    ["Güte Q(R, L, C) und R für Q = 10", "quality factor Q(R, L, C) and R for Q = 10"]],
  "2018-04/2": [["sechs Schaltungen A–F ihren Impedanzortskurven zuordnen", "match six circuits A–F to their impedance loci"],
    ["bei jeder Ortskurve den Startpunkt ω = 0 angeben", "mark the start point ω = 0 on each locus"]],
  "2018-04/3": [["Wirkleistung im Verbraucher als P(U_L, R_L) und P(I, R_L)", "real power in the load as P(U_L, R_L) and P(I, R_L)"],
    ["Leistungsanpassung: wie R_L und R_i zueinander stehen", "power matching: how R_L and R_i relate"],
    ["Wirkungsgrad: Formel und Verhältnis der Widerstände", "efficiency: formula and ratio of the resistors"],
    ["drei formalisierte Verfahren für Netzwerke nennen", "name three formal methods for networks"]],
  "2018-04/4": [["Quellen in Stromquellen umwandeln, Parallelwiderstände zusammenfassen, R₁ berechnen", "convert sources into current sources, combine parallel resistors, find R₁"],
    ["Stern-Dreieck-Transformation zeichnen, R₃ berechnen", "draw a star–delta transformation, find R₃"],
    ["Knotenpotentialverfahren für A, B, C aufstellen und mit der Cramerschen Regel lösen", "set up nodal analysis for A, B, C and solve with Cramer's rule"]],
  "2018-04/5": [["zeigen: Scheinleistung S_V aus den gemessenen U_e, I_e, I_V", "show the apparent power S_V from the measured U_e, I_e, I_V"],
    ["zeigen: Z_V aus den bekannten Größen", "show Z_V from the known quantities"],
    ["Z_V, Blind- und Wirkleistung Q_V und P_V berechnen", "compute Z_V, reactive and real power Q_V and P_V"],
    ["induktiv oder kapazitiv? eine Ersatzschaltung aus zwei Bauteilen", "inductive or capacitive? an equivalent circuit of two parts"],
    ["Zeigerdiagramm: I_C, U_V, U_C, U₁ einzeichnen und U₂ grafisch bestimmen", "phasor diagram: draw I_C, U_V, U_C, U₁ and find U₂ graphically"]],
  "2018-04/6": [["Übertragungsfunktion einer RL-Schaltung, normiert", "transfer function of an RL circuit, normalised"],
    ["Bodediagramm nach Betrag und Phase zeichnen", "draw the Bode plot, magnitude and phase"],
    ["L₁ für die −3-dB-Grenzfrequenz bei 1 Hz", "L₁ for the −3 dB cut-off at 1 Hz"],
    ["Tiefpass oder nicht? alternativer Aufbau aus zwei Bauteilen", "low-pass or not? an alternative of two parts"],
    ["zweite Schaltung: normieren, Amplituden- und Phasengang mit Summanden zeichnen", "second circuit: normalise, draw magnitude and phase with their terms"],
    ["Filterart bestimmen, Einfluss von b (Schwingkreis, Güte)", "name the filter, effect of b (resonant circuit, Q)"]],
  "2018-04/7": [["Potentiale an den Knoten, u_in(u_L) aufstellen", "potentials at the nodes, set up u_in(u_L)"],
    ["Übertragungsfunktion mit der Spannungsteilerregel", "transfer function with the voltage divider rule"],
    ["Eingangswiderstand eines idealen OPV, Eingangsstrom i_in", "input resistance of an ideal op-amp, input current i_in"],
    ["Impedanzwandler: B, Z_P berechnen und als Bauteile wählen", "impedance converter: compute B and Z_P, pick parts for them"],
    ["Z_P → ∞: Mit- oder Gegenkopplung? Name der Schaltung", "Z_P → ∞: positive or negative feedback? name of the circuit"]],

  "2018-08/1": [["drei unbekannte Bauteile aus Strömen und Phasen bestimmen", "identify three unknown parts from currents and phases"],
    ["Phasenverschiebung bei ω_a, Name dieser Frequenz", "phase shift at ω_a, name of this frequency"],
    ["Bauteilwerte und die ±45°-Frequenzen ω_b, ω_c berechnen", "compute the part values and the ±45° frequencies ω_b, ω_c"],
    ["Admittanz- und Impedanzortskurve mit allen markanten Punkten", "admittance and impedance locus with all key points"],
    ["Schaltung so umbauen, dass sich eine gegebene Ortskurve ergibt", "rebuild the circuit to get a given locus"]],
  "2018-08/2": [["beide Kirchhoffschen Gleichungen und ihre physikalische Grundlage", "both Kirchhoff laws and the physics behind them"],
    ["Maschenstromverfahren in Matrixform allgemein aufstellen", "set up mesh analysis in matrix form, symbols only"],
    ["aus einer gegebenen Matrix die gewählten Maschen zurückzeichnen", "draw back the meshes from a given matrix"],
    ["3 × 3-System mit der Cramerschen Regel lösen", "solve the 3 × 3 system with Cramer's rule"]],
  "2018-08/3": [["U₁ grafisch im Zeigerdiagramm bestimmen", "find U₁ graphically in the phasor diagram"],
    ["Bauteile von Z₁, Z₂, Z₃ aus dem Zeigerdiagramm begründen", "work out the parts of Z₁, Z₂, Z₃ from the phasor diagram"],
    ["Blindleistung Q₃ und Winkel von I₃", "reactive power Q₃ and the angle of I₃"],
    ["zeigen: Formel für Q_e; ω, bei der U_e und I₁ in Phase sind", "show the formula for Q_e; ω at which U_e and I₁ are in phase"]],
  "2018-08/4": [["Übertragungsfunktion zeigen, Hoch-, Tief- oder Bandpass?", "show the transfer function; high-, low- or band-pass?"],
    ["Verstärkung in dB und Phase ohne komplexe Zahlen", "gain in dB and phase without complex numbers"],
    ["normieren und Amplituden- und Phasengang zeichnen", "normalise and draw magnitude and phase"],
    ["Wirkung eines großen R₂/R₁", "effect of a large R₂/R₁"],
    ["mit R und C zum Bandpass erweitern; Entkopplung der Stufen", "extend to a band-pass with R and C; decoupling the stages"]],
  "2018-08/5": [["Schaltungsteile benennen, Bodegleichungen von ST2", "name the parts, Bode equations of ST2"],
    ["Strom durch R_i, U_L(U_e) und I_L(U_e, R_L)", "current through R_i, U_L(U_e) and I_L(U_e, R_L)"],
    ["I_L über 1/R_L mit Strombegrenzung zeichnen", "plot I_L against 1/R_L with current limit"],
    ["ohne Impedanzwandler: R_i/R_L für U_L ≥ 80 % U_e", "without the buffer: R_i/R_L for U_L ≥ 80 % of U_e"],
    ["Ersatz für ST2, damit U_L = −2·U_e", "replace ST2 so that U_L = −2·U_e"]],

  "2019-04/1": [["Admittanz Y_A und Impedanz Z_B zweier Teilschaltungen", "admittance Y_A and impedance Z_B of two sub-circuits"],
    ["vier Ortskurven (Z und Y von A und B) mit ω → 0 und ω → ∞", "four loci (Z and Y of A and B) with ω → 0 and ω → ∞"],
    ["Gesamtimpedanz, ihre Grenzwerte und die Resonanzfrequenz", "total impedance, its limits and the resonant frequency"],
    ["Widerstand hinzufügen, Y_B2 beweisen, Z_ges2 nach Re und Im", "add a resistor, prove Y_B2, Z_ges2 in real and imaginary part"]],
  "2019-04/2": [["Kennlinie einer realen Spannungsquelle, Leerlauf und Kurzschluss", "characteristic of a real voltage source, open and short circuit"],
    ["vereinfachen: Widerstände zusammenfassen, Stern-Dreieck, Quellenumwandlung", "simplify: combine resistors, star–delta, source conversion"],
    ["Knotenpotentialverfahren in Matrixform", "nodal analysis in matrix form"],
    ["mit der Cramerschen Regel lösen", "solve with Cramer's rule"]],
  "2019-04/3": [["Bedingung für Leistungsanpassung der Quelle", "condition for power matching at the source"],
    ["Kettenmatrix: Definition und für den Transformator zeigen", "chain matrix: definition and show it for the transformer"],
    ["kopplungssymmetrisch? für Transformator und Anpassungsvierpol", "reciprocal? for the transformer and the matching two-port"],
    ["Impedanzmatrix des Anpassungsvierpols", "impedance matrix of the matching two-port"],
    ["Kettenmatrix der Zusammenschaltung; von [A_A1] auf [A_A2]", "chain matrix of the cascade; from [A_A1] to [A_A2]"]],
  "2019-04/4": [["drei Komponenten aus einem Amplitudengang benennen", "name three components from a magnitude plot"],
    ["Schaltbilder von RC- und RL-Glied, Grenz- und Normierungsfrequenz", "draw the RC and RL stages, cut-off and normalising frequency"],
    ["Inverter: Schaltbild und Übertragungsfunktion", "inverter: circuit and transfer function"],
    ["Phasengänge einzeln und gesamt zeichnen", "draw the phase plots, each and in total"],
    ["Allpass: Übertragungsfunktion über drei Maschen, R_B und R_C wählen", "all-pass: transfer function from three meshes, choose R_B and R_C"]],
  "2019-04/5": [["zwei goldene Regeln des idealen OPV", "two golden rules of the ideal op-amp"],
    ["Übertragungsfunktion von Teilschaltung 2", "transfer function of sub-circuit 2"],
    ["Spannungen und u_out für die Schalterstellungen (Gleichspannung)", "voltages and u_out for the switch positions (DC)"],
    ["Zeitverläufe von u_in und u_out mit Bodediagramm und Aussteuergrenze", "time plots of u_in and u_out using the Bode plot and saturation"]],

  "2019-07/1": [["Ortskurve von Z_A mit beschrifteter Realachse", "locus of Z_A with labelled real axis"],
    ["zwei Realisierungen zu einer gegebenen Ortskurve, Widerstandswerte", "two circuits for a given locus, resistor values"],
    ["Admittanzortskurve einer Black Box mit ω₀", "admittance locus of a black box with ω₀"],
    ["RC-Serienschaltung: Kreisgleichung der Admittanz beweisen", "series RC: prove the circle equation of the admittance"],
    ["Frequenz, bei der der Strom 45° voreilt", "frequency at which the current leads by 45°"]],
  "2019-07/2": [["vereinfachen: Widerstände, Stern-Dreieck, Quellenumwandlung", "simplify: resistors, star–delta, source conversion"],
    ["Maschenstromverfahren ohne U₃ aufstellen", "set up mesh analysis without U₃"],
    ["3 × 3-System mit der Cramerschen Regel lösen", "solve the 3 × 3 system with Cramer's rule"]],
  "2019-07/3": [["Admittanzmatrix: Definition und für die Schaltung", "admittance matrix: definition and for this circuit"],
    ["kopplungssymmetrisch?", "reciprocal?"],
    ["Ein- und Ausgangsimpedanzen aus der Matrix", "input and output impedances from the matrix"],
    ["Innenwiderstand der Quelle für maximale Leistung", "source resistance for maximum power"],
    ["Leerlauf-Spannungsübersetzung, was die Schaltung macht", "open-circuit voltage ratio, what the circuit does"]],
  "2019-07/4": [["Übertragungsfunktion einer Kette ohne Doppelbrüche", "transfer function of a chain without nested fractions"],
    ["Bodediagramm der Teile 3 bis 5", "Bode plot of parts 3 to 5"],
    ["Entkopplung: welche Schaltung, Skizze", "decoupling: which circuit, sketch"],
    ["3-dB-Bandbreite in Hz", "3 dB bandwidth in Hz"],
    ["zwei Teilschaltungen skizzieren, ihre Knickfrequenzen wählen", "sketch two sub-circuits, choose their corner frequencies"]],
  "2019-07/5": [["Subtrahierer benennen, Übertragungsfunktion zeigen", "name the difference amplifier, show its transfer function"],
    ["Widerstände aus dem Datenblatt bestimmen", "find the resistors from the data sheet"],
    ["u_out zu gegebenen Eingängen zeichnen (Aussteuergrenze)", "draw u_out for given inputs (saturation)"],
    ["abgeglichene Brücke: Werte bestimmen, Zweck der Schaltung", "balanced bridge: find the values, purpose of the circuit"]],

  "2020-03/1": [["Impedanz in Abhängigkeit von C nach Re und Im", "impedance as a function of C, real and imaginary part"],
    ["C_min, das den Imaginärteil minimiert, und Z(C_min)", "C_min that minimises the imaginary part, and Z(C_min)"],
    ["Tabelle ergänzen und die Ortskurve über C zeichnen", "complete the table and draw the locus over C"]],
  "2020-03/2": [["I_L, I_C und I_ges in Abhängigkeit von U_e", "I_L, I_C and I_ges in terms of U_e"],
    ["Stromübertragungsfunktion I_C/I_ges zeigen", "show the current ratio I_C/I_ges"],
    ["Verlauf begründen, Ortskurve mit Grenzwerten zeichnen", "explain its shape, draw the locus with its limits"]],
  "2020-03/3": [["Netzwerk vereinfachen und umformen", "simplify and transform the network"],
    ["Maschenstromverfahren für zwei Maschenströme", "mesh analysis for two mesh currents"],
    ["Strom durch R_b, Leistung beider Quellen", "current through R_b, power of both sources"],
    ["welche Eigenschaft das Überlagerungsprinzip erfordert", "what property superposition needs"]],
  "2020-03/4": [["fünf Gleichungen für einen Transformator mit zwei Sekundärseiten", "five equations for a transformer with two secondaries"],
    ["Gegeninduktivitäten M₀₁, M₁₂, M₀₂ aus L₀", "mutual inductances M₀₁, M₁₂, M₀₂ from L₀"],
    ["Gleichung für U₀ zeigen", "show the equation for U₀"],
    ["R₀ dimensionieren und |U₀| bestimmen", "size R₀ and find |U₀|"]],
  "2020-03/5": [["Übertragungsfunktionen zweier aktiver Filter", "transfer functions of two active filters"],
    ["Amplitudengänge zuordnen und begründen", "match the magnitude plots and explain"],
    ["Bauteile für 20 dB und die Knickfrequenzen berechnen", "compute the parts for 20 dB and the corner frequencies"],
    ["mit Spannungsfolger zum Bandpass verketten, Filterart", "chain with a buffer into a band-pass, name the filter"],
    ["Bodediagramm der Gesamtschaltung; passives Filter im Vergleich", "Bode plot of the whole circuit; compared with a passive filter"]],
  "2020-03/6": [["Eingangswiderstand des idealen OPV", "input resistance of the ideal op-amp"],
    ["Teilschaltung 2 benennen und erklären", "name and explain sub-circuit 2"],
    ["Übertragungsfunktionen über Knoten- und Maschengleichungen", "transfer functions from node and mesh equations"],
    ["vereinfachen, k für Verstärkung 2, Aussteuergrenze", "simplify, k for a gain of 2, saturation"]],

  "2020-07/1": [["sechs Schaltungen A–F ihren Impedanzortskurven zuordnen", "match six circuits A–F to their impedance loci"],
    ["bei jeder Ortskurve den Endpunkt ω → ∞ angeben", "mark the end point ω → ∞ on each locus"]],
  "2020-07/2": [["Impedanz einer RLC-Schaltung nach Re und Im", "impedance of an RLC circuit, real and imaginary part"],
    ["Ortskurven von Impedanz und Admittanz", "loci of impedance and admittance"],
    ["Resonanzkreisfrequenz, die ±45°-Frequenzen zeigen", "resonant frequency, show the ±45° frequencies"],
    ["Güte Q(R, L, C) und R für Q = 2", "quality factor Q(R, L, C) and R for Q = 2"]],
  "2020-07/3": [["die Kirchhoffschen Gleichungen", "Kirchhoff's laws"],
    ["Knotenpotentialverfahren aufstellen und lösen", "set up and solve nodal analysis"],
    ["Stromquellen in Spannungsquellen umwandeln, Stern-Dreieck", "convert current into voltage sources, star–delta"]],
  "2020-07/4": [["Quellstrom i_e berechnen und ins Zeigerdiagramm zeichnen", "compute the source current i_e and draw it in the phasor diagram"],
    ["i_K grafisch bestimmen, Bauteil Z_K begründen", "find i_K graphically, identify Z_K"],
    ["R_M und L_M des Motors berechnen", "compute R_M and L_M of the motor"],
    ["warum die Kompensation nicht reicht; Q_e zeigen", "why the compensation falls short; show Q_e"],
    ["Zeitkonstante für vollständige Kompensation", "time constant for full compensation"]],
  "2020-07/5": [["Übertragungsfunktion über drei Maschen zeigen", "show the transfer function from three meshes"],
    ["R₁ = R₃: normieren, Amplituden- und Phasengang", "R₁ = R₃: normalise, magnitude and phase"],
    ["Name der Schaltung (Allpass) und wozu man sie einsetzt", "name of the circuit (all-pass) and what it is for"],
    ["R₃/R₁ für einen gegebenen Amplitudengang, Phasengang zeichnen", "R₃/R₁ for a given magnitude plot, draw the phase"],
    ["was passiert, wenn R₁ sich löst", "what happens if R₁ comes loose"]],
  "2020-07/6": [["Eingangswiderstand des idealen OPV", "input resistance of the ideal op-amp"],
    ["Teilschaltungen benennen, ihre Übertragungsfunktionen", "name the sub-circuits, their transfer functions"],
    ["Übertragungsfunktion der Ausgangsstufe", "transfer function of the output stage"],
    ["Grenzfrequenzen 10 Hz und 100 Hz zuordnen, Widerstände berechnen", "assign the 10 Hz and 100 Hz cut-offs, compute the resistors"]],

  "2021-03/1": [["Y_A und Z_B nach Re und Im", "Y_A and Z_B, real and imaginary part"],
    ["vier Ortskurven mit ω → 0 und ω → ∞", "four loci with ω → 0 and ω → ∞"],
    ["Gesamtimpedanz und ihre Grenzwerte", "total impedance and its limits"],
    ["Kondensator hinzufügen für gegebene Y_A2 bzw. Ortskurve Z_B2", "add a capacitor for a given Y_A2 or locus Z_B2"],
    ["Resonanzfrequenz der veränderten Teilschaltung", "resonant frequency of the changed sub-circuit"]],
  "2021-03/2": [["vereinfachen: Widerstände zusammenfassen, Quellen umwandeln", "simplify: combine resistors, convert sources"],
    ["Maschenstromverfahren mit der Cramerschen Regel lösen", "solve mesh analysis with Cramer's rule"],
    ["Leistung der beiden Quellen", "power of both sources"]],
  "2021-03/3": [["Admittanzmatrix: Definition der vier Elemente", "admittance matrix: definition of the four elements"],
    ["Schaltung in der Black Box, Ersatzschaltbilder, Filterart", "circuit in the black box, equivalent circuits, filter type"],
    ["Reziprozitätstheorem: wann es gilt", "reciprocity theorem: when it holds"],
    ["Kettenmatrix-Elemente des Transformators, Bedeutung von k = 1", "chain-matrix elements of the transformer, meaning of k = 1"],
    ["Leerlauf-Spannungsübersetzung der ganzen Kette", "open-circuit voltage ratio of the whole chain"]],
  "2021-03/4": [["Amplitudengänge A–D vier Schaltungen zuordnen und benennen", "match magnitude plots A–D to four circuits and name them"],
    ["wozu der OPV in der Mitte dient", "what the op-amp in the middle is for"],
    ["Übertragungsfunktion zeigen, normieren, Bodediagramm zeichnen", "show the transfer function, normalise, draw the Bode plot"],
    ["Name der Schaltung; mit einer Spule −40 dB/Dekade erreichen", "name of the circuit; −40 dB/decade with an extra coil"]],
  "2021-03/5": [["Eingangswiderstand des idealen OPV", "input resistance of the ideal op-amp"],
    ["Subtrahierer benennen, Übertragungsfunktion über Knotengleichungen", "name the difference amplifier, transfer function from node equations"],
    ["nicht-invertierenden Verstärker für V = 6 entwerfen", "design a non-inverting amplifier for V = 6"],
    ["invertierenden Verstärker für 12 dB entwerfen", "design an inverting amplifier for 12 dB"],
    ["Ausgangsspannung zeichnen (Aussteuergrenze)", "draw the output voltage (saturation)"]],

  "2021-09/1": [["Impedanz Z₁ nach Re und Im, Ortskurven von Z₁ und Y₁", "impedance Z₁, real and imaginary part, loci of Z₁ and Y₁"],
    ["Z₂ und das Verhältnis Z₁/Z₂", "Z₂ and the ratio Z₁/Z₂"],
    ["Resonanzkreisfrequenz und die ±45°-Frequenzen von Z₂", "resonant frequency and the ±45° frequencies of Z₂"],
    ["Güte und R(L, C) für Q = 1", "quality factor and R(L, C) for Q = 1"],
    ["Schaltung zu einer gegebenen Impedanz Z₃ zeichnen", "draw a circuit for a given impedance Z₃"]],
  "2021-09/2": [["die Kirchhoffschen Gleichungen", "Kirchhoff's laws"],
    ["Widerstände zusammenfassen, Quellenumwandlung", "combine resistors, convert sources"],
    ["Maschenstromverfahren für drei Maschenströme lösen", "solve mesh analysis for three mesh currents"],
    ["Ströme durch die Parallelschaltungen", "currents through the parallel pairs"]],
  "2021-09/3": [["Impedanzmatrix: Definition und Ersatzschaltbilder", "impedance matrix: definition and equivalent circuits"],
    ["kopplungs- und widerstandssymmetrisch?", "reciprocal and symmetric?"],
    ["r_BE für maximale Leistungsübertragung", "r_BE for maximum power transfer"],
    ["Funktion und Einheit des Parameters S", "role and unit of the parameter S"],
    ["Leerlauf-Spannungsübersetzung einzeln und verkettet, Resonanzfrequenz", "open-circuit voltage ratio alone and chained, resonant frequency"]],
  "2021-09/4": [["Amplitudengänge A–D vier Schaltungen zuordnen und benennen", "match magnitude plots A–D to four circuits and name them"],
    ["wozu der OPV in der Mitte dient", "what the op-amp in the middle is for"],
    ["Übertragungsfunktion zeigen, R₁ und R₂ für 20 dB", "show the transfer function, R₁ and R₂ for 20 dB"],
    ["normieren, Bodediagramm zeichnen, Schaltung benennen", "normalise, draw the Bode plot, name the circuit"]],
  "2021-09/5": [["Differenzspannung in Gegenkopplung, Spannung am Knoten K_n", "differential voltage with negative feedback, voltage at node K_n"],
    ["alle Ströme und Knotengleichungen aufstellen", "set up all currents and node equations"],
    ["I_a zeigen; was daran besonders ist", "show I_a; what is special about it"],
    ["Schaltung benennen, Grenzen in der Praxis, R₂ = R₃ sicherstellen", "name the circuit, practical limits, making sure R₂ = R₃"]],

  "2022-03/1": [["Impedanzen Z_A, Z_B und Admittanz Y_A nach Re und Im", "impedances Z_A, Z_B and admittance Y_A, real and imaginary part"],
    ["vier Ortskurven mit Grenzwerten", "four loci with their limits"],
    ["Resonanzkreisfrequenz und Bandbreite von Z_B", "resonant frequency and bandwidth of Z_B"],
    ["einfachste Schaltungen zu zwei gegebenen Ortskurven", "simplest circuits for two given loci"]],
  "2022-03/2": [["Schaltung umformen: I₂, R₄, R_b, R_d, R_f bestimmen", "transform the circuit: find I₂, R₄, R_b, R_d, R_f"],
    ["Maschenstromverfahren mit der Cramerschen Regel lösen", "solve mesh analysis with Cramer's rule"],
    ["Leistung der beiden Quellen", "power of both sources"]],
  "2022-03/3": [["aus Zeigerdiagrammen: Impedanz von A, Admittanz von B", "from phasor diagrams: impedance of A, admittance of B"],
    ["Verhalten von B, einfachste Schaltbilder und Bauteilwerte", "how B behaves, simplest circuits and part values"],
    ["Spannung am Verbraucher, Teilspannungen und I_L", "voltage across the load, partial voltages and I_L"],
    ["Zeigerdiagramme: U₀ und I_C grafisch bestimmen", "phasor diagrams: find U₀ and I_C graphically"]],
  "2022-03/4": [["Phasengänge A–D vier Schaltungen zuordnen und benennen", "match phase plots A–D to four circuits and name them"],
    ["wozu der OPV in der Mitte dient", "what the op-amp in the middle is for"],
    ["Übertragungsfunktion zeigen, Widerstandsverhältnis für 20 dB", "show the transfer function, resistor ratio for 20 dB"],
    ["normieren, Bodediagramm zeichnen, Schaltung benennen", "normalise, draw the Bode plot, name the circuit"]],
  "2022-03/5": [["drei Teilschaltungen ihren Übertragungsfunktionen zuordnen", "match three sub-circuits to their transfer functions"],
    ["Subtrahierer: Übertragungsfunktion zeigen, Widerstände bestimmen", "difference amplifier: show its transfer function, find the resistors"],
    ["u_out zu gegebenen Eingängen zeichnen", "draw u_out for given inputs"],
    ["abgeglichene Brücke: Werte bestimmen", "balanced bridge: find the values"]],

  "2022-09/1": [["Impedanz Z₁ nach Re und Im, Ortskurven von Z₁ und Y₁", "impedance Z₁, real and imaginary part, loci of Z₁ and Y₁"],
    ["Z₂ und das Verhältnis Z₁/Z₂", "Z₂ and the ratio Z₁/Z₂"],
    ["Schaltung zu einer gegebenen Impedanz Z₃ zeichnen", "draw a circuit for a given impedance Z₃"],
    ["R und C tauschen: Resonanzkreisfrequenz; +45°-Frequenz von Z₃", "swap R and C: resonant frequency; the +45° frequency of Z₃"],
    ["Schaltung zu zwei gegebenen Ortskurven entwerfen", "design a circuit for two given loci"]],
  "2022-09/2": [["Kochrezept für das formalisierte Maschenstromverfahren", "step-by-step recipe for formal mesh analysis"],
    ["Knotenpotentialverfahren aufstellen, Cramersche Regel definieren und lösen", "set up nodal analysis, state Cramer's rule and solve"],
    ["Stromquellen in Spannungsquellen umwandeln", "convert current into voltage sources"],
    ["Stern-Dreieck-Transformation zeichnen", "draw a star–delta transformation"]],
  "2022-09/3": [["drei Gleichungen für Quelle, Übertrager und Verbraucher", "three equations for source, transformer and load"],
    ["Eingangsimpedanz zeigen", "show the input impedance"],
    ["Gegeninduktivität M aus einer Messung", "mutual inductance M from a measurement"],
    ["Blindanteil kompensieren: welches Bauteil, wie", "compensate the reactance: which part, how"],
    ["Quellspannung für 3 kW Wirkleistung am Verbraucher", "source voltage for 3 kW of real power in the load"]],
  "2022-09/4": [["Amplituden- und Phasengänge vier Schaltungen zuordnen", "match magnitude and phase plots to four circuits"],
    ["Übertragungsfunktion eines Bandpasses zeigen", "show the transfer function of a band-pass"],
    ["normieren, Amplituden- und Phasengang zeichnen", "normalise, draw magnitude and phase"],
    ["mit OPV und R₃ auf 20 dB verstärken", "boost to 20 dB with an op-amp and R₃"]],
  "2022-09/5": [["die Anschlüsse eines OPV benennen", "name the pins of an op-amp"],
    ["Ausgangsspannung eines Subtrahierers zeigen", "show the output voltage of a difference amplifier"],
    ["Widerstände wählen für U_a = R₃/R₁·(U_e2 − U_e1)", "choose the resistors for U_a = R₃/R₁·(U_e2 − U_e1)"],
    ["U_a für zwei Werte von R₄ zeichnen (Aussteuergrenze)", "draw U_a for two values of R₄ (saturation)"]],
};

// The sections of the course so far that each topic builds on, for "Go over".
const LEN_TOPIC_SECS = { net: ["1.4", "1.7"] };

// Each exam: its file, semester and date, and its tasks (number, topic, page of the task and of its
// solution, points, tags).
const LEN_EXAMS = [
  { id: "2018-04", sem: "WS 17/18", date: "2018-04-04", tasks: [
    [1, "ok", 2, 2, 16, "resonanz guete inversion"], [2, "ok", 6, 6, 6, "zuordnung"], [3, "net", 8, 8, 4, "anpassung leistung"],
    [4, "net", 9, 10, 12, "stern knoten"], [5, "ac", 12, 13, 20, "zeiger leistung"], [6, "bode", 16, 17, 23, "tp hp asym"], [7, "opv", 21, 22, 13, "folger"]] },
  { id: "2018-08", sem: "SS 18", date: "2018-08-03", tasks: [
    [1, "ok", 2, 3, 20, "resonanz"], [2, "net", 6, 7, 15, "kirchhoff masche"], [3, "ac", 9, 10, 20, "zeiger leistung"],
    [4, "bode", 14, 15, 23, "tp hp"], [5, "opv", 18, 19, 16, "inv folger"]] },
  { id: "2019-04", sem: "WS 18/19", date: "2019-04-02", tasks: [
    [1, "ok", 2, 2, 20, "resonanz"], [2, "net", 5, 6, 14, "stern quelle knoten"], [3, "ac", 10, 12, 22, "vierpol trafo anpassung leistung"],
    [4, "bode", 15, 17, 23, "tp hp asym"], [5, "opv", 21, 22, 15, "sat"]] },
  { id: "2019-07", sem: "SS 19", date: "2019-07-31", tasks: [
    [1, "ok", 2, 4, 21, "zuordnung"], [2, "net", 7, 8, 16, "stern quelle masche"], [3, "ac", 13, 14, 20, "vierpol leistung"],
    [4, "bode", 16, 18, 21, "tp bp folger"], [5, "opv", 21, 22, 16, "diff sat"]] },
  { id: "2020-03", sem: "WS 19/20", date: "2020-03-24", tasks: [
    [1, "ok", 2, 2, 13, "zuordnung"], [2, "ok", 5, 5, 11, "inversion"], [3, "net", 8, 9, 12, "masche leistung"],
    [4, "ac", 12, 13, 21, "trafo leistung"], [5, "bode", 17, 18, 23, "tp hp bp asym folger"], [6, "opv", 22, 22, 14, "diff sat"]] },
  { id: "2020-07", sem: "SS 20", date: "2020-07-27", tasks: [
    [1, "ok", 2, 2, 6, "zuordnung"], [2, "ok", 4, 4, 16, "resonanz guete inversion"], [3, "net", 7, 8, 16, "kirchhoff knoten quelle stern"],
    [4, "ac", 11, 13, 20, "zeiger komp leistung"], [5, "bode", 15, 15, 22, "tp asym"], [6, "opv", 20, 20, 14, "inv sat"]] },
  { id: "2021-03", sem: "WS 20/21", date: "2021-03-01", tasks: [
    [1, "ok", 2, 3, 25, "resonanz"], [2, "net", 6, 7, 13, "quelle masche leistung"], [3, "ac", 9, 10, 20, "vierpol trafo"],
    [4, "bode", 13, 13, 22, "tp hp bp folger"], [5, "opv", 16, 17, 14, "inv diff sat"]] },
  { id: "2021-09", sem: "SS 21", date: "2021-09-29", tasks: [
    [1, "ok", 2, 3, 21, "resonanz guete inversion"], [2, "net", 6, 7, 16, "kirchhoff quelle masche"], [3, "ac", 10, 11, 20, "vierpol leistung"],
    [4, "bode", 14, 15, 22, "tp hp bp folger"], [5, "opv", 17, 17, 15, "inv"]] },
  { id: "2022-03", sem: "WS 21/22", date: "2022-03-16", tasks: [
    [1, "ok", 2, 3, 21, "resonanz guete"], [2, "net", 6, 7, 16, "stern masche leistung"], [3, "ac", 10, 11, 20, "zeiger"],
    [4, "bode", 13, 14, 22, "tp hp bp folger"], [5, "opv", 16, 18, 15, "diff sat"]] },
  { id: "2022-09", sem: "SS 22", date: "2022-09-26", tasks: [
    [1, "ok", 2, 4, 21, "resonanz inversion"], [2, "net", 7, 8, 16, "masche knoten quelle stern"], [3, "ac", 11, 12, 20, "trafo komp leistung"],
    [4, "bode", 14, 15, 23, "tp hp"], [5, "opv", 17, 18, 14, "inv"]] },
].map((e) => ({
  ...e,
  file: `len-exams/${e.id}.pdf`,
  tasks: e.tasks.map(([n, topic, page, sol, pts, tags]) => ({ n, topic, page, sol, pts, tags: tags.split(" "), key: `${e.id}/${n}`, asks: LEN_ASKS[`${e.id}/${n}`] || [] })),
}));

// A part of a task as HTML: R_L becomes R with a subscript L.
const lenAsk = (s) => ppEsc(s).replace(/_([A-Za-z0-9]+)/g, "<sub>$1</sub>");
const lenDate = (iso) => { const [y, m, d] = iso.split("-"); return `${d}.${m}.${y}`; };
// A topic as a coloured pill: its short name, or with `long` its full name.
const topicPill = (t, long = false) => `<span class="len-topic" style="--tc:${LEN_TOPICS[t].color}">${long ? L(LEN_TOPICS[t].de, LEN_TOPICS[t].en) : L(LEN_TOPICS[t].short[0], LEN_TOPICS[t].short[1])}</span>`;

// Points per topic and exam, to see how much each topic is worth.
function lenExamGrid() {
  return `<div class="pp-egrid" style="--n:${LEN_EXAMS.length}">
    <span></span>${LEN_EXAMS.map((e) => `<span class="pp-eg-h">${e.sem}</span>`).join("")}
    ${LEN_TOPIC_IDS.map((t) => `<span class="pp-eg-t">${topicPill(t)}</span>${LEN_EXAMS.map((e) => {
      const pts = e.tasks.filter((x) => x.topic === t).reduce((a, x) => a + x.pts, 0);
      return `<span class="pp-eg-c" style="--a:${pts ? 18 + (Math.max(0, Math.min(pts, 25) - 10) / 15) * 70 : 0}%;--tc:${LEN_TOPICS[t].color}">${pts || "–"}</span>`;
    }).join("")}`).join("")}
  </div><p class="small muted">${L("Punkte pro Thema und Klausur.", "Points per topic and exam.")}</p>`;
}

/* ---------------------------------------------------------------- The page */

const lenExamsView = { topic: "all", tag: null, open: false };
const lenExamDone = () => new Set(store.get("lenExamDone", []));

function renderLenExams() {
  const v = lenExamsView;
  const done = lenExamDone();
  const all = LEN_EXAMS.flatMap((e) => e.tasks);
  const match = (t) => (v.topic === "all" || t.topic === v.topic) && (!v.tag || t.tags.includes(v.tag)) && (!v.open || !done.has(t.key));
  const count = (topic) => all.filter((t) => topic === "all" || t.topic === topic).length;
  // The method tags that occur in the picked topic, most frequent first.
  const tagCount = {};
  all.filter((t) => v.topic === "all" || t.topic === v.topic).forEach((t) => t.tags.forEach((g) => (tagCount[g] = (tagCount[g] || 0) + 1)));
  const tags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]);
  const shown = LEN_EXAMS.map((e) => ({ e, tasks: e.tasks.filter(match) })).filter((x) => x.tasks.length);
  const nShown = shown.reduce((s, x) => s + x.tasks.length, 0);

  $("#len-exams").innerHTML = `
    <div class="card hero">
      <h1>${L(`Alt<span class="accent">klausuren</span>`, `Old <span class="accent">exams</span>`)}</h1>
      <p>${L(`Zehn LEN-Klausuren von 2018 bis 2022, jeweils mit Lösungen. Jede Klausur dauert <b>2 Stunden</b>, hat rund <b>90 Punkte</b> und fragt immer dieselben fünf Themen ab — die Liste unten zeigt, welche Aufgabe was abfragt.`,
        `Ten LEN exams from 2018 to 2022, each with solutions. Every exam lasts <b>2 hours</b>, has about <b>90 points</b> and always covers the same five topics — the list below shows what each task asks for.`)}</p>
      <p class="small">${L("„Aufgabe“ und „Lösung“ öffnen das PDF auf der richtigen Seite. Hak ab, was du gemacht hast; „Wiederholen“ führt zum Abschnitt, „Üben“ zu ähnlichen Aufgaben mit neuen Zahlen.",
        "“Task” and “Solution” open the PDF on the right page. Tick off what you've done; “Go over” takes you to the section, “Practise” to similar tasks with new numbers.")}</p>
    </div>
    <div class="card">
      <h2>${L("Was drankommt", "What comes up")}</h2>
      ${lenExamGrid()}
    </div>
    <div class="card">
      <h2>${L("Aufbau und Hinweise", "Format and rules")}</h2>
      <p class="small muted">${L("Von den Deckblättern, in eigenen Worten.", "From the cover pages, in our own words.")}</p>
      ${ppFacts([
        [L("Dauer und Punkte", "Time and points"), L(`Klausur am ${LEN_EXAM_DATE.de}. ` + "2 Stunden, rund 90 Punkte in fünf Aufgaben (anfangs bis zu sieben) — eine je Thema, immer in derselben Reihenfolge. Die Punkte je Teilaufgabe stehen in der Aufgabe.",
          `Exam on ${LEN_EXAM_DATE.en}. ` + "2 hours, about 90 points in five tasks (up to seven in the early exams) — one per topic, always in the same order. Each part shows its points.")],
        [L("Hilfsmittel", "Allowed aids"), L("Nur ein nicht programmierbarer Taschenrechner.", "Only a non-programmable calculator.")],
        [L("Lösungsweg", "Working"), L("Der Weg muss vollständig und nachvollziehbar sein: Überlegungen aufschreiben, kurze Kommentare dazu. Bei „Zeigen Sie“ ist das Ergebnis gegeben — es zählt nur der Weg.",
          "Show the full working so it can be followed: write down your reasoning, add short comments. In “show that” parts the result is given — only the working counts.")],
        [L("Zeichnen", "Drawing"), L("Ortskurven, Zeiger- und Bodediagramme kommen in die vorgedruckten Diagramme. Achsen beschriften und ω → 0, ω → ∞ markieren — fehlende Beschriftungen kosten Punkte. Grafische Konstruktionen müssen erkennbar sein.",
          "Loci, phasor and Bode diagrams go into the printed diagrams. Label the axes and mark ω → 0 and ω → ∞ — missing labels cost points. Graphical constructions must be visible.")],
        [L("Form", "Form"), L("Nur dokumentenechtes Schreibzeug, also kein Bleistift.", "Only permanent ink, so no pencil.")],
      ])}
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">${L("Thema", "Topic")}</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">${L("Alle", "All")} · ${count("all")}</button>
          ${LEN_TOPIC_IDS.map((t) => `<button class="chip ${v.topic === t ? "active" : ""}" data-topic="${t}" style="--gc:${LEN_TOPICS[t].color}">${L(LEN_TOPICS[t].de, LEN_TOPICS[t].en)} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <div class="len-filter-row">
        <span class="len-filter-cap">${L("Methode", "Method")}</span>
        <div class="chips small-chips">
          ${tags.map((g) => `<button class="chip ${v.tag === g ? "active" : ""}" data-tag="${g}">${L(LEN_TAGS[g][0], LEN_TAGS[g][1])} · ${tagCount[g]}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="lenExamOpen" ${v.open ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>${L("Nur offene Aufgaben", "Only tasks not done yet")}</span></label>
      <p class="small muted len-filter-sum">${L(`${nShown} Aufgaben in ${shown.length} Klausuren`, `${nShown} tasks in ${shown.length} exams`)} · ${L(`${done.size} von ${all.length} erledigt`, `${done.size} of ${all.length} done`)}</p>
    </div>
    ${shown.map(({ e, tasks }) => `
      <div class="card len-exam">
        <div class="card-head">
          <div><h2>${e.sem} <span class="muted len-exam-date">· ${lenDate(e.date)}</span></h2>
            <span class="small muted">${e.tasks.length} ${L("Aufgaben", "tasks")} · ${e.tasks.reduce((s, t) => s + t.pts, 0)} ${L("Punkte", "points")} · 120 min</span></div>
          <span class="pp-exam-files"><a class="btn" href="${e.file}" target="_blank" rel="noopener">${L("Klausur", "Exam")} ↗</a></span>
        </div>
        <div class="len-tasks">
          ${tasks.map((t) => `
            <div class="len-task pp-etask ${done.has(t.key) ? "done" : ""}">
              <label class="len-done" title="${lt("Erledigt", "Done")}"><input type="checkbox" data-done="${t.key}" ${done.has(t.key) ? "checked" : ""}><span aria-hidden="true">✓</span></label>
              <b class="len-task-n">${L("Aufgabe", "Task")} ${t.n}</b>
              <span class="nm-pills">${topicPill(t.topic, true)}</span>
              <span class="len-task-pts">${t.pts} P</span>
              <ul class="pp-asks">${t.asks.map(([de, en]) => `<li>${L(lenAsk(de), lenAsk(en))}</li>`).join("")}</ul>
              <span class="len-task-go">
                <a class="btn small-btn" href="${e.file}#page=${t.page}" target="_blank" rel="noopener">${L("Aufgabe · S.", "Task · p.")} ${t.page}</a>
                <a class="btn small-btn" href="${e.file}#page=${t.sol}" target="_blank" rel="noopener">${L("Lösung · S.", "Solution · p.")} ${t.sol}</a>
                ${LEN_TOPIC_SECS[t.topic] ? `<button class="btn small-btn" type="button" data-sec="${LEN_TOPIC_SECS[t.topic][0]}">${L("Wiederholen", "Go over")} ${LEN_TOPIC_SECS[t.topic].join("–")}</button>`
                  : `<span class="small muted gk-soon">${L("kommt später in der Vorlesung", "comes later in the lectures")}</span>`}
                <button class="btn small-btn primary" type="button" data-practise="${t.topic}" data-tags="${t.tags.join(" ")}">${L("Üben", "Practise")}</button>
              </span>
            </div>`).join("")}
        </div>
      </div>`).join("") || `<p class="muted">${L("Keine Aufgabe passt zu diesem Filter.", "No task matches this filter.")}</p>`}
    <p class="small muted len-more">${L("Die Klausuren decken die ganze Vorlesung ab — vieles davon kommt in der Vorlesung erst noch.", "The exams cover the whole course — a lot of it is still to come in the lectures.")}</p>`;

  $$("#len-exams [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; v.tag = null; renderLenExams(); }));
  $$("#len-exams [data-tag]").forEach((b) => (b.onclick = () => { v.tag = v.tag === b.dataset.tag ? null : b.dataset.tag; renderLenExams(); }));
  $("#lenExamOpen").onchange = (ev) => { v.open = ev.target.checked; renderLenExams(); };
  $$("#len-exams [data-done]").forEach((c) => (c.onchange = () => {
    const s = lenExamDone();
    c.checked ? s.add(c.dataset.done) : s.delete(c.dataset.done);
    store.set("lenExamDone", [...s]);
    renderLenExams();
  }));
  $$("#len-exams [data-sec]").forEach((b) => (b.onclick = () => openLenSection(b.dataset.sec)));
  $$("#len-exams [data-practise]").forEach((b) => (b.onclick = () => openLenPractice(b.dataset.practise, b.dataset.tags.split(" "))));
}
