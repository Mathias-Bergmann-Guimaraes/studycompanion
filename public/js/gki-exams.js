// GKI old exams: WS 22/23 to SS 26, each task summarised in our own words, tagged by topic and linked
// to its page in the exam (and, for WS 23/24, in the model solution). The PDFs are KIT material: they
// live in public/gki-exams/ on the server only and are never committed (see .gitignore and the README).
//
// Until WS 23/24 the exam had 92 points in eight tasks (two hours); since SS 24 it has 75 points in six
// tasks of about 12 points, the first always "Allgemeine Fragen" mixing every topic (its points are
// split by topic here). From WS 23/24 the exams are in German and English. The lecturers changed for
// WS 26/27 (Schäfer and Neumann, before Neumann and Friederich), so the order of the lecture is new,
// but the topics are the same.

// Topics: the lectures that teach them (GKI_PLAN) and, once taught, the sections here.
const GKI_EXAM_TOPICS = {
  intro: { name: "Agenten & Grundbegriffe", color: "var(--c-owner)", vl: [1], secs: ["1.3", "1.4"] },
  reg: { name: "Regression & Regularisierung", color: "var(--c-topic)", vl: [2], secs: ["2.2", "2.4", "2.5"] },
  prob: { name: "Wahrscheinlichkeit & MLE", color: "var(--c-place)", vl: [2], secs: ["2.6", "2.7", "2.8"] },
  cls: { name: "Klassifikation", color: "var(--c-time)", vl: [3], secs: ["3.1", "3.2", "3.3", "3.4", "3.6"] },
  opt: { name: "Gradientenabstieg", color: "var(--c-point)", vl: [3, 5], secs: ["3.5"] },
  nn: { name: "Neuronale Netze", color: "var(--c-verb)", vl: [4, 5], secs: [] },
  gen: { name: "Generalisierung & Ensembles", color: "var(--c-range)", vl: [6], secs: [] },
  dimred: { name: "PCA & Autoencoder", color: "var(--c-object)", vl: [7, 8], secs: [] },
  clust: { name: "k-Means", color: "var(--c-also)", vl: [7], secs: [] },
  dens: { name: "Dichteschätzung & GMM", color: "var(--c-with)", vl: [8], secs: [] },
  cnn: { name: "CNNs", color: "var(--c-dir)", vl: [9], secs: [] },
  rnn: { name: "RNNs & Sprache", color: "var(--c-subject)", vl: [10], secs: [] },
  rl: { name: "MDP & RL", color: "#0891b2", vl: [11, 12], secs: [] },
  hmm: { name: "Bayes-Netze & HMMs", color: "#ca8a04", vl: [13], secs: [] },
  search: { name: "Suche & Logik", color: "#65a30d", vl: [14], secs: [] },
};
const GKI_EXAM_TOPIC_IDS = Object.keys(GKI_EXAM_TOPICS);
// A topic counts as taught once its first lecture has been given.
// ("allg", the mixed first task of an exam, isn't a topic of its own and counts as taught.)
const gkTaught = (t) => !GKI_EXAM_TOPICS[t] || Math.min(...GKI_EXAM_TOPICS[t].vl) <= GKI_VL_DONE;
const gkTopicVL = (t) => (GKI_EXAM_TOPICS[t] ? GKI_EXAM_TOPICS[t].vl.map((v) => `VL ${v}`).join(", ") : "");

// Each exam: id (file name), semester, date, total points, extra files, and its tasks:
//   [number, topic or [[topic, points], …] for mixed tasks, page in the exam, page in the solution, points, what the parts ask].
const GKI_EXAMS_RAW = [
  { id: "26-ss", sem: "SS 26", date: "2026-09-14", tasks: [
    [1, [["gen", 4], ["cls", 2], ["dimred", 2], ["dens", 2], ["cnn", 2], ["rl", 3]], 2, null, 15, ["99 % auf Training, 72 % auf Test: welches Phänomen, zwei Gegenmaßnahmen", "warum lineare Regression nicht für binäre Klassifikation taugt, was die logistische ändert", "Ziel der PCA, was bei den Hauptkomponenten optimiert wird", "zwei Vorteile von GMMs gegenüber k-Means, Bedeutung der Gewichte πₖ", "warum Convolutional Layer für Bilder wichtig sind, wozu mehrere Kanäle", "Bias und Varianz bei mehr Kapazität und bei mehr Daten", "Monte Carlo gegen TD: wann aktualisiert wird, warum TD weniger Varianz hat", "die Markov-Eigenschaft"]],
    [2, [["reg", 4], ["clust", 8]], 4, null, 12, ["zeigen: Log-Likelihood maximieren = SSE minimieren (Gauß-Rauschen)", "R² für ŷ = 2x ohne Bias an drei Punkten; besser als der Mittelwert?", "k-Means mit K = 2: Zentren aktualisieren, A–F neu zuordnen (Rechnung für C)", "keine Änderung der Zuordnung: was heißt das für den Algorithmus?", "Ellenbogen: Zielfunktion über K skizzieren, K wählen"]],
    [3, [["dens", 7], ["dimred", 5]], 7, null, 12, ["E-Schritt einer Mischung aus zwei Poisson-Verteilungen: Responsibility q₁₁", "M-Schritt: das Update für λ₁ herleiten (Ableitung null setzen)", "λ₁ neu berechnen", "latente Räume von zwei Modellen aus Interpolationen skizzieren (AE gegen VAE)", "die einfachste Loss-Funktion für beide (Rekonstruktion, dazu KL)", "welches Modell zum verlustbehafteten Komprimieren"]],
    [4, "search", 10, null, 12, ["Vollständigkeit und Optimalität", "Datenstruktur der Fringe bei DFS und BFS", "welche Verfahren unter den Annahmen vollständig und optimal sind", "ist die Heuristik zulässig?", "Baumsuche nur nach h: Greedy-Suche", "A*-Baumsuche: Fringe mit Prioritäten in jedem Schritt, Pfad", "warum A* weniger Knoten expandiert"]],
    [5, "rnn", 12, null, 12, ["Textzusammenfassung, negative Rezensionen, Subjekt/Verb/Objekt den RNN-Typen zuordnen", "die Pfeile mit Wₒ, Wₕ, Wₓ beschriften", "Dimensionen der Matrizen und Parameterzahl für x ∈ ℝ¹⁰, h ∈ ℝ³, o ∈ ℝ²", "wann der Output die Summe aller Eingaben ist", "warum Vanishing Gradients, welche Architektur hilft", "One-Hot-Encoding von Wörtern und sein Nachteil"]],
    [6, "rl", 14, null, 12, ["stochastische gegen deterministische Policy", "zwei Erweiterungen gegen Divergenz bei Approximate Q-Learning", "Softmax-Policy mit Temperatur β → 0 und β → ∞", "drei tabellarische Q-Learning-Updates in einer 2 × 3-Gridworld (α = 0,5, γ = 0,9)"]],
  ] },
  { id: "2526-ws", sem: "WS 25/26", date: "2026-03-27", tasks: [
    [1, [["reg", 2], ["cls", 6], ["rl", 1], ["clust", 1], ["dens", 2], ["prob", 1], ["gen", 2]], 2, null, 15, ["L1 und L2: Wirkung auf die Gewichte, welche gibt Merkmalsauswahl, wie sparse mit der anderen", "Sigmoid skizzieren (0; 0,5; 1), warum gut für Klassifikation", "konzentrische Kreise: warum keine lineare logistische Regression, welches Merkmal hilft", "98 % zu 2 %: warum Accuracy täuscht, zwei bessere Metriken", "deterministische gegen stochastische Policy", "wie man bei k-Means schlechte lokale Optima vermeidet", "E- und M-Schritt bei GMMs", "warum man die negative Log-Likelihood minimiert statt die Likelihood zu maximieren", "Validierung gegen Test, warum auf dem Test auswählen „Schummeln“ ist"]],
    [2, [["nn", 4], ["opt", 8]], 5, null, 12, ["Forward Pass eines Netzes mit einem ReLU-Neuron (x = (4, 2))", "3 × 10 gegen 1 × 100 Neuronen: welches Netz stellt Komplexeres dar?", "Gradientenabstieg: Name und Update-Regel", "Zweck von Loss-Funktion und Lernrate", "findet man immer ein globales Minimum?", "zwei Verbesserungen des Optimierers"]],
    [3, "dimred", 7, null, 12, ["Projektion und Rekonstruktion zweier Punkte mit PC1", "wäre der Fehler mit PC2 größer oder kleiner?", "Linie mit Rekonstruktionsfehler null und stärkste Ausreißer für PCA", "dasselbe für einen nichtlinearen Autoencoder", "drei Punkte mit Fehler null bei beiden", "Interpolation zwischen 3 und 7 bei t = 0,5: PCA", "… und Autoencoder"]],
    [4, "search", 10, null, 12, ["die vier Komponenten eines Suchproblems", "Zustandsraumgraph gegen Suchbaum", "terminiert DFS immer, findet sie den kürzesten Pfad?", "ist die Heuristik zulässig?", "A* mit h = 0", "A*-Baumsuche: Fringe mit Prioritäten, Pfad", "wann A*-Baumsuche optimal ist"]],
    [5, "hmm", 12, null, 12, ["probabilistische Inferenz erklären", "Explaining Away am Beispiel (verschlafen: Code oder Krise)", "gemeinsame Verteilung p(C, M, S) als Tabelle", "die zwei Unabhängigkeitsannahmen des HMM", "p(leer | y₁) = 2/9 zeigen", "sequentielle Bayes-Aktualisierung: p(leer | y₁, y₂)"]],
    [6, "cnn", 14, null, 12, ["sparse connectivity und shared weights", "einen Residual-Block vervollständigen", "Data Augmentation für Verkehrszeichen; warum nicht horizontal spiegeln (Invarianz)", "Ausgabegrößen und Gewichte für CONV5-6, POOL-2, CONV3-12, POOL-2, FC-8 bei 27 × 27 × 3", "Klassifikation, Detektion, semantische und Instanz-Segmentierung zuordnen"]],
  ] },
  { id: "25-ss", sem: "SS 25", date: "2025-09-16", tasks: [
    [1, [["cls", 3], ["dimred", 2], ["clust", 1], ["dens", 1], ["gen", 2], ["rnn", 2], ["cnn", 4]], 2, null, 15, ["warum ein Datensatz (Kreis) nicht für logistische Regression taugt", "verallgemeinerte logistische Regression und eine passende Funktion", "Denoising Autoencoder gegen gewöhnlichen", "k-Means und GMM auf zwei Datensätzen: wer clustert richtig?", "Bagging und Varianzreduktion", "Vorteil von RNNs bei Texten", "Parameter-Sharing in CNNs", "zwei Methoden der Data Augmentation, warum"]],
    [2, "nn", 4, null, 12, ["warum Backpropagation effizient mit der Tiefe skaliert", "Unterschied: lineares Modell gegen neuronales Netz per GD", "Forward Pass eines 2-2-1-Netzes mit ReLU", "drei Gradienten im Backward Pass", "ein Gewichtsupdate mit η = ½", "Vanishing Gradients bei Sigmoid und eine Gegenmaßnahme"]],
    [3, [["reg", 5], ["gen", 7]], 5, null, 12, ["warum eine Gerade nicht reicht, welche Funktion man minimiert", "Polynom 12. Grades: Validierungsfehler ≫ Trainingsfehler — Bias und Varianz?", "eine Regularisierungstechnik", "Polynomregression gegen neuronale Netze bei den Parametern", "Kapazität und Generalisierungsfehler", "eine Annahme, damit ein Modell generalisiert", "zwei Methoden der Hyperparameter-Optimierung", "Fehler stagnieren auf beiden Datensätzen: Grund und Gegenmaßnahme"]],
    [4, "rl", 7, null, 13, ["Lernziel eines RL-Agenten", "welches Modell model-based RL hat", "zwei Schlüsseltechniken von DQN", "die zwei Explorationsstrategien", "Q-Learning-Update, Behandlung von Endzuständen", "vier Updates auf einem Korridor P–A–S–B–G (α = 0,5, γ = 0,9)", "Q-Tabelle und gierige Policy"]],
    [5, "hmm", 9, null, 12, ["Filterung gegen Glättung", "die zwei Unabhängigkeitsannahmen am Roboter", "Bayes-Netz des HMM für drei Zeitschritte", "Posterior P(H₀ | E₀ = 2)", "Vorhersage P(H₁ | E₀ = 2)"]],
    [6, [["search", 10], ["intro", 1]], 10, null, 11, ["Baumsuche gegen Graphsuche", "Definition eines rationalen Agenten", "zulässige Heuristik", "ist DFS ein Spezialfall von A*?", "Suchbäume und Pfade für DFS, BFS und A*"]],
  ] },
  { id: "2425-ws", sem: "WS 24/25", date: "2025-03-21", en: true, tasks: [
    [1, [["reg", 3], ["gen", 4], ["dens", 3], ["rnn", 3], ["hmm", 2]], 2, null, 15, ["L1 gegen L2 mit Formeln", "Hyperparameter gegen Modellparameter", "Prinzip von Ensembles", "Boosting und eine weitere Ensemble-Methode", "EM für GMMs", "Vorteil von GMMs gegenüber k-Means bei Clusterformen", "RNN entfalten für t = 1, 2, 3; geteilte Gewichte bei BPTT", "welches Problem LSTMs mildern", "Explaining Away mit Bayes-Netz"]],
    [2, [["nn", 6], ["gen", 2], ["opt", 4]], 3, null, 12, ["Gleichung eines Neurons", "Output-Aktivierung für binäre Klassifikation", "Forward Pass mit ReLU und Sigmoid für (3, 5), Interpretation", "zwei Gründe für schlechte Testleistung", "Update-Regel des Gradientenabstiegs", "Mini-Batch gegen SGD", "Vorteil von Mini-Batch gegenüber GD"]],
    [3, [["dimred", 8], ["clust", 4]], 4, null, 12, ["Aufbau eines Autoencoders", "überwacht oder unüberwacht?", "PCA oder Autoencoder für eine gekrümmte Punktwolke, zwei Unterschiede", "Autoencoder als Generator: Probleme, VAE", "k-Means: Metrik und welche Cluster", "eine Metrik, die A und C zusammenlegt", "konvergiert k-Means global?"]],
    [4, "cnn", 6, null, 12, ["Klassifikation gegen semantische Segmentierung", "Ausgabegrößen und Gewichte für CONV3-8, POOL-2, CONV3-16, POOL-2, FC-10 bei 26 × 26 × 3", "Transfer Learning mit einem vortrainierten ResNet", "Residual Connections und zwei Vorteile"]],
    [5, "search", 7, null, 12, ["Vollständigkeit und Optimalität", "ein Graph, auf dem DFS nicht vollständig ist", "wann BFS optimal ist", "Bücher sortieren: Zahl der Zustände", "zulässige Heuristik", "ist „Zahl falsch einsortierter Bücher“ zulässig?", "A*-Baumsuche von [1, 4, 7, 3]"]],
    [6, "rl", 9, null, 12, ["Wertfunktion Vπ(s) als Formel", "γ so, dass beide Strategien gleich viel wert sind", "zwei tabellarische Q-Updates mit TD-Fehler (Q₀ = 1)", "Problem ohne Replay Buffer und ein weiterer Vorteil"]],
  ] },
  { id: "24-ss", sem: "SS 24", date: "2024-09-17", tasks: [
    [1, [["gen", 11], ["cls", 2], ["rl", 2]], 2, null, 15, ["Kapazität eines Modells", "woran man Over- und Underfitting erkennt", "Data Augmentation an einem Beispiel", "Output-Aktivierung und Kreuzentropie für binäre Klassifikation", "vier Hyperparameter, zwei Verfahren der Optimierung", "Ensembles und die nötige Eigenschaft", "Bagging", "vier der fünf Bestandteile eines MDP"]],
    [2, [["opt", 4], ["nn", 5], ["reg", 1], ["gen", 2]], 3, null, 12, ["Zweck der Loss-Funktion", "Gradientenabstieg: Name, Update-Regel, Skizze in 1D", "Parameterzahl zweier ReLU-Netze", "welches ist ausdrucksstärker?", "wie viele Hidden Layer für beliebige stetige Funktionen", "eine Loss-Funktion für Hauspreise", "Drohnenbilder 2021, Handyfotos heute: warum es schlecht klappt"]],
    [3, "dimred", 5, null, 12, ["Projektion und Rückprojektion mit W = [u₁ … u_M]", "uᵢᵀuⱼ: Orthonormalität", "das Optimierungsproblem für u₁", "erste Hauptkomponente von (1, 0), (2, 0), (0, 0) ohne Rechnung", "Varianz der Projektion", "Anteil erklärter Varianz", "Rekonstruktionsfehler je Punkt"]],
    [4, "clust", 7, null, 12, ["Ziel einer Clusteranalyse", "konvergiert k-Means global?", "zwei Stärken, zwei Schwächen", "Cluster nach |Δx|", "… nach euklidischer Distanz", "… nach Kosinus-Distanz", "eine Punktwolke zur Kurve „Zielfunktion über k“ skizzieren"]],
    [5, "search", 9, null, 12, ["zulässige Heuristik", "h₁ ≤ h₂ zulässig: welche nehmen?", "Manhattan-Heuristik für jeden Knoten", "A*-Graphsuche mit Fringe und Prioritäten", "ist 2h zulässig?"]],
    [6, "hmm", 11, null, 12, ["Bayes-Regel für p(z₀ | y₀)", "Beobachtungs- und Übergangsmodell als Tabelle", "Forward-Algorithmus: α₀ für y₀ = 0", "was man aus y₀ = 0 schließt", "ein Schritt: α₁ für y₁ = 1", "normierter Belief"]],
  ] },
  { id: "2324-ws", sem: "WS 23/24", date: "2024-03-07", sol: true, tasks: [
    [1, [["opt", 5], ["search", 4], ["clust", 2], ["dimred", 4]], 2, 2, 15, ["Gradientenabstieg beschreiben, Beispiel im ML", "Batch gegen stochastischen GD, Vor- und Nachteile", "Syntax gegen Semantik in der Logik", "zwei leichte Aufgaben: folgt „bestanden“ aus ¬S₁ → L₁, S₂ → ¬L₂, L₁ ∧ L₂ → B?", "Clustering, PCA und Autoencoder mit je einer Anwendung"]],
    [2, "cls", 4, 4, 12, ["warum linearer Klassifikator + MSE schlecht ist, mit Skizze", "Sigmoid: Formel, warum besser, Kreuzentropie", "vier Obstsorten: Softmax", "nicht linear trennbar: Merkmale transformieren", "wann Accuracy nicht reicht"]],
    [3, [["nn", 2], ["gen", 10]], 6, 5, 12, ["Output-Aktivierung für Regression", "drei Teile P1, P2, P3: auf welchem die Hyperparameter wählen?", "Bagging, warum für Ensembles", "ist Var = σ²/m beim Bagging richtig?", "verschiedene Architekturen im Ensemble?"]],
    [4, "search", 8, 6, 12, ["die Bausteine eines Suchproblems", "Pfannkuchen n = 4: Zahl der Zustände", "Curse of Dimensionality bei Suche", "ist „größter falsch sortierter Pfannkuchen“ zulässig?", "A*-Suche von (4, 3, 1, 2) als Suchbaum"]],
    [5, [["hmm", 7], ["rl", 5]], 10, 7, 12, ["Bayes-Netz: alle vier Variablen falsch", "P(A, C, ¬D) durch Summieren über B", "Roboter mit Überhitzung als MDP zeichnen", "optimale Policy für cool und warm"]],
    [6, "dens", 12, 8, 12, ["Log-Likelihood eines GMM", "warum direkte Optimierung schwer ist", "E- und M-Schritt", "K = 1, 3, 10: größte Likelihood, welches wählen", "eine EM-Iteration: neues μ₁ für D = {−1, 1, 5}"]],
    [7, "rnn", 14, 9, 8, ["entfalteter Graph für Sätze der Länge 4", "Parameterzahl des RNN", "zwei Aggregationen der Outputs, Output-Aktivierung", "Vorteil gegenüber FFN und CNN"]],
    [8, "rl", 16, 10, 9, ["Ziel eines RL-Agenten", "TD-Fehler für terminale und nicht-terminale s′", "Q-Werte nach drei Episoden in der Pacman-Gridworld (α = γ = 0,5)"]],
  ] },
  { id: "23-ss", sem: "SS 23", date: "2023-09-18", tasks: [
    [1, [["intro", 2], ["search", 10]], 2, null, 12, ["Reflex- gegen planenden Agenten, zwei Umgebungseigenschaften", "wann vollständig, wann optimal; ist BFS ein Spezialfall von A*?", "Bienenstock: Suchbaum und Pfad mit BFS", "… und mit A*"]],
    [2, [["prob", 6], ["hmm", 6]], 3, null, 12, ["Bayes-Formel für p(defekt | y₁) mit Namen der Terme", "totale Wahrscheinlichkeit für p(y₁)", "p(defekt | y₁) berechnen", "zweiter Sensor, bedingt unabhängig: p(defekt | y₁, y₂)"]],
    [3, "rl", 4, null, 12, ["Definition eines MDP", "Bleistift (gespitzt, stumpf, abgebrochen) als Graph mit Rewards", "zwei Schritte Value Iteration (γ = 0,5), optimale Aktion im Zustand stumpf"]],
    [4, [["nn", 10], ["rl", 2]], 5, null, 12, ["Computation Graph von ((3(a + b))² + (5(c + d))²)²", "MLP mit 5 Hidden Layern: wo die meisten Parameter sind, für drei Eingabegrößen", "Klassifikation statt Regression: was sich ändert", "warum tiefe, schmale Netze gut sein können", "warum DQN nicht ohne Weiteres für stetige Aktionen geht"]],
    [5, [["dimred", 8], ["clust", 4]], 6, null, 12, ["wie PCA die Dimension reduziert, mit der Kovarianzmatrix", "zwei Anwendungen", "Verhältnis der erklärten Varianz, M wählen", "eine Grenze der PCA mit Skizze und eine Alternative", "k-Means mit k = 2, 4, 5 auf einer Form, Problem bei k = 2"]],
    [6, [["intro", 3], ["cnn", 2], ["gen", 10]], 7, null, 15, ["die drei Bereiche des ML mit Daten und Beispiel", "rezeptives Feld mit Skizze", "Losskurven bei Over- und Underfitting; 600/400 statt 700/300", "drei Hyperparameter für die Kapazität eines L2-regularisierten Netzes", "Ensembles: welcher Anteil des erwarteten Loss sinkt, Bedingung"]],
    [7, "cnn", 8, null, 9, ["Ausgabegröße: 225 × 225 × 3, Filter 5 × 5, Stride 2", "zwei Vorteile von ReLU", "Convolution mit Zero-Padding, ReLU und Max-Pooling von Hand", "drei Computer-Vision-Aufgaben"]],
    [8, "rl", 9, null, 8, ["Monte-Carlo-Methoden und ein Anwendungsfall im RL", "Nachteil von V-basiertem TD, den Q-Learning behebt", "γ = 0 und ε = 0 beim ε-greedy Q-Learning", "warum Q-Learning mit Netzen divergiert", "Rolle des Replay Buffers"]],
  ] },
  { id: "2223-ws", sem: "WS 22/23", date: "2023-03-10", tasks: [
    [1, "search", 2, null, 12, ["Fringe-Datenstrukturen von BFS und A*", "warum BFS nicht optimal ist, wann doch", "zulässige Heuristik, was ohne passieren kann", "Manhattan-Heuristik für jeden Knoten", "A*-Suche mit der Fringe in jedem Schritt"]],
    [2, "hmm", 3, null, 12, ["HMM als Bayes-Netz für zwei Schritte, gemeinsame Verteilung", "Filterung gegen Glättung", "Belief nach einem Übergang", "P(H₁ = 0 | E₁ = 0) in Abhängigkeit von β"]],
    [3, [["nn", 7], ["opt", 1], ["gen", 4]], 4, null, 12, ["Computation Graph von (a + b)(b + a) + 5(a + b + c + d) + 2(a + b)²", "Vorteil des Graphen, zwei weitere Anwendungen", "was die Loss-Funktion quantifiziert", "Training gegen Validierung", "zwei Losskurven: Problem und Abhilfe"]],
    [4, [["clust", 6], ["dimred", 6]], 5, null, 12, ["k-Means: welche Punkte zu R gehören (quadrierte euklidische Distanz)", "neues Zentrum R", "erste und zweite Hauptkomponente einzeichnen", "das Optimierungsproblem der PCA", "zwei Unterschiede PCA und Autoencoder"]],
    [5, "dens", 6, null, 12, ["Histogramm: p(x) ≈ K/(NV)", "Curse of Dimensionality, wie KDE hilft", "Vor- und Nachteil nichtparametrischer Verfahren", "Bandbreite h den KDE-Bildern zuordnen", "GMM: warum nicht direkt per GD, E- und M-Schritt"]],
    [6, [["gen", 5], ["cnn", 2], ["cls", 2], ["opt", 3], ["rnn", 3]], 7, null, 15, ["Ziel der Regularisierung, zwei Methoden in Netzen", "Parameter-Sharing in CNNs", "generativ gegen diskriminativ", "drei Verfahren der Hyperparameter-Suche mit Vor- und Nachteil", "Batch gegen Mini-Batch GD", "Encoder-Decoder an einem Beispiel aus der Sprache"]],
    [7, "cnn", 8, null, 9, ["Ausgabegröße je Ebene für 60 × 40 × 3", "welche Data Augmentation für Handschrift sinnvoll ist", "überlappendes Max-Pooling (Kernel 3, Stride 2) von Hand"]],
    [8, "rl", 9, null, 8, ["Markov-Eigenschaft", "warum Exploration, eine Strategie", "Update-Regel für Approximate Q-Learning herleiten, TD-Fehler markieren"]],
  ] },
];

// File names in public/gki-exams/, the split points, a key per task.
const GKI_EXAMS = GKI_EXAMS_RAW.map((e) => ({
  ...e,
  file: `gki-exams/${e.id}.pdf`,
  solFile: e.sol ? `gki-exams/${e.id}-loesung.pdf` : null,
  enFile: e.en ? `gki-exams/${e.id}-en.pdf` : null,
  tasks: e.tasks.map(([n, topic, page, sol, pts, asks]) => {
    const split = Array.isArray(topic) ? topic : [[topic, pts]];
    return { n, topic: split[0][0], split, topics: split.map((s) => s[0]), page, solPage: sol, pts, asks, key: `${e.id}/${n}` };
  }),
}));

const gkExamView = { topic: "all", open: false, taught: false };
const gkExamDone = () => new Set(store.get("gkiExamDone", []));
const gkDate = (iso) => { const [y, m, d] = iso.split("-"); return `${+d}.${+m}.${y}`; };
const gkTopicPill = (t, pts) => !GKI_EXAM_TOPICS[t] ? `<span class="len-topic" style="--tc:var(--muted)">Allgemeine Fragen</span>` : `<span class="len-topic ${gkTaught(t) ? "" : "gk-later"}" style="--tc:${GKI_EXAM_TOPICS[t].color}" title="${gkTaught(t) ? "" : `kommt in ${gkTopicVL(t)}`}">${GKI_EXAM_TOPICS[t].name}${pts !== undefined ? ` · ${String(pts).replace(".", ",")}` : ""}</span>`;

// Points per topic and exam, to see what always comes up.
function gkExamGrid() {
  const exams = [...GKI_EXAMS].reverse();
  return `<div class="pp-egrid" style="--n:${exams.length}">
    <span></span>${exams.map((e) => `<span class="pp-eg-h">${e.sem}</span>`).join("")}
    ${GKI_EXAM_TOPIC_IDS.map((t) => `<span class="pp-eg-t">${gkTopicPill(t)}</span>${exams.map((e) => {
      const pts = e.tasks.flatMap((x) => x.split).filter(([tt]) => tt === t).reduce((a, [, p]) => a + p, 0);
      return `<span class="pp-eg-c" style="--a:${pts ? 18 + (Math.min(pts, 16) / 16) * 70 : 0}%;--tc:${GKI_EXAM_TOPICS[t].color}">${pts || "–"}</span>`;
    }).join("")}`).join("")}
  </div><p class="small muted">Punkte pro Thema; „Allgemeine Fragen“ sind nach ihren Teilen aufgeteilt. Blass: kommt erst noch in der Vorlesung.</p>`;
}

function renderGkiExams() {
  const v = gkExamView;
  const done = gkExamDone();
  const all = GKI_EXAMS.flatMap((e) => e.tasks);
  const match = (t) => (v.topic === "all" || t.topics.includes(v.topic)) && (!v.open || !done.has(t.key)) && (!v.taught || t.topics.some(gkTaught));
  const count = (topic) => all.filter((t) => topic === "all" || t.topics.includes(topic)).length;
  const shown = GKI_EXAMS.map((e) => ({ e, tasks: e.tasks.filter(match) })).filter((x) => x.tasks.length);
  const nShown = shown.reduce((s, x) => s + x.tasks.length, 0);
  const taughtPts = all.flatMap((t) => t.split).filter(([t]) => gkTaught(t)).reduce((a, [, p]) => a + p, 0);
  const allPts = all.reduce((a, t) => a + t.pts, 0);

  $("#gki-exams").innerHTML = `
    <div class="card hero">
      <h1>Alt<span class="accent">klausuren</span></h1>
      <p>${GKI_EXAMS.length} Klausuren von WS 22/23 bis SS 26. Bis WS 23/24 waren es 92 Punkte in acht Aufgaben, seit SS 24 sind es <b>75 Punkte in sechs Aufgaben</b> zu je etwa 12 Punkten —
        die erste immer „Allgemeine Fragen“ quer durch den Stoff. <b>Suche</b> (A*) kam in jeder Klausur dran, <b>Reinforcement Learning</b> in fast jeder.</p>
      <p class="small">Die Vorlesung läuft noch (VL 1–${GKI_VL_DONE}): von allen ${allPts} Punkten gehören bisher <b>${taughtPts}</b> zu schon behandelten Themen. „Aufgabe“ öffnet das PDF auf der richtigen Seite. Hak ab, was du gemacht hast; „Wiederholen“ führt zum Abschnitt, „Üben“ zu ähnlichen Aufgaben mit neuen Zahlen.</p>
    </div>
    <div class="card">
      <h2>Was drankommt</h2>
      ${gkExamGrid()}
    </div>
    <div class="card">
      <h2>Aufbau und Hinweise</h2>
      <p class="small muted">Von den Deckblättern und aus VL 1, in eigenen Worten.</p>
      ${ppFacts([
        ["Dauer und Punkte", `Klausur ${examWhenDE("gki")}, 90 Minuten. Zuletzt 75 Punkte, bestanden ab der Hälfte (37,5). Keine Hilfsmittel außer Schreibmaterial — die Klausur findet ohne KI statt.`],
        ["Rechnen", "Bei Rechnungen zuerst den Ansatz bzw. die Formel angeben, erst dann Zahlen einsetzen. Brüche kürzen, wenn verlangt (SS 24: alle Brüche mit Zahlen unter 50)."],
        ["Erklären", "Begründungen so kurz wie möglich, in wenigen Sätzen oder Stichpunkten. Die Punkte je Teilaufgabe zeigen, wie viele Aspekte erwartet werden."],
        ["Neu ab WS 26/27", "Programmier-Verständnis-Aufgaben: kein eigenes Coden, sondern Code-Auszüge ergänzen und bewerten — geübt in den Übungen (Jupyter, NumPy). Die Übungsaufgaben hier haben deshalb auch Code-Fragen."],
        ["Bonus", "Wer mindestens 60 % der Programmieraufgaben der Übungsblätter 2 bis 7 korrekt bearbeitet, bekommt eine Notenstufe Bonus (Blatt 1 zählt nicht)."],
        ["Form", "Nicht mit Bleistift oder Rotstift schreiben; die Lösungen kommen in die vorgesehenen Felder der Lösungsblätter."],
      ])}
    </div>
    <div class="card len-filter">
      <div class="len-filter-row">
        <span class="len-filter-cap">Thema</span>
        <div class="chips">
          <button class="chip ${v.topic === "all" ? "active" : ""}" data-topic="all">Alle · ${count("all")}</button>
          ${GKI_EXAM_TOPIC_IDS.map((t) => `<button class="chip ${v.topic === t ? "active" : ""} ${gkTaught(t) ? "" : "gk-later"}" data-topic="${t}" style="--gc:${GKI_EXAM_TOPICS[t].color}">${GKI_EXAM_TOPICS[t].name} · ${count(t)}</button>`).join("")}
        </div>
      </div>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="gkExamTaught" ${v.taught ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Nur Aufgaben mit schon behandeltem Stoff</span></label>
      <label class="switch inline len-open-toggle"><input type="checkbox" id="gkExamOpen" ${v.open ? "checked" : ""}>
        <span class="switch-track"><span class="switch-thumb"></span></span><span>Nur noch offene Aufgaben</span></label>
      <p class="small muted len-filter-sum">${nShown} Aufgaben in ${shown.length} Klausuren · ${done.size} von ${all.length} erledigt</p>
    </div>
    ${shown.map(({ e, tasks }) => `
      <div class="card len-exam">
        <div class="card-head">
          <div><h2>${e.sem} <span class="muted len-exam-date">· ${gkDate(e.date)}</span></h2>
            <span class="small muted">${e.tasks.length} Aufgaben · ${e.tasks.reduce((s, t) => s + t.pts, 0)} Punkte${e.sol ? " · mit Musterlösung" : ""}${e.en ? " · auch auf Englisch" : ""}</span></div>
          <span class="pp-exam-files"><a class="btn" href="${e.file}" target="_blank" rel="noopener">Klausur ↗</a>${e.solFile ? `<a class="btn" href="${e.solFile}" target="_blank" rel="noopener">Lösung ↗</a>` : ""}${e.enFile ? `<a class="btn" href="${e.enFile}" target="_blank" rel="noopener">English ↗</a>` : ""}</span>
        </div>
        <div class="len-tasks">
          ${tasks.map((t) => {
            const T = GKI_EXAM_TOPICS[t.topic];
            const sec = t.topics.map((x) => GKI_EXAM_TOPICS[x]).find((x) => x.secs.length);
            return `
            <div class="len-task pp-etask ${done.has(t.key) ? "done" : ""}">
              <label class="len-done" title="Erledigt"><input type="checkbox" data-done="${t.key}" ${done.has(t.key) ? "checked" : ""}><span aria-hidden="true">✓</span></label>
              <b class="len-task-n">Aufgabe ${t.n}</b>
              <span class="nm-pills">${t.split.length > 1 ? t.split.map(([tt, p]) => gkTopicPill(tt, p)).join("") : gkTopicPill(t.topic)}</span>
              <span class="len-task-pts">${String(t.pts).replace(".", ",")} P</span>
              <ul class="pp-asks">${t.asks.map((a) => `<li>${ppEsc(a)}</li>`).join("")}</ul>
              <span class="len-task-go">
                <a class="btn small-btn" href="${e.file}#page=${t.page}" target="_blank" rel="noopener">Aufgabe · S. ${t.page}</a>
                ${e.solFile && t.solPage ? `<a class="btn small-btn" href="${e.solFile}#page=${t.solPage}" target="_blank" rel="noopener">Lösung · S. ${t.solPage}</a>` : ""}
                ${sec ? `<button class="btn small-btn" type="button" data-sec="${sec.secs[0]}">Wiederholen ${sec.secs.length > 1 ? `${sec.secs[0]}–${sec.secs[sec.secs.length - 1]}` : sec.secs[0]}</button>`
                  : `<span class="small muted gk-soon">kommt in ${gkTopicVL(t.topic)}</span>`}
                ${GKI_TASKS.some((g) => t.topics.includes(g.topic)) ? `<button class="btn small-btn primary" type="button" data-tasks="${t.topics.find((x) => GKI_TASKS.some((g) => g.topic === x))}">Üben</button>` : ""}
              </span>
            </div>`;
          }).join("")}
        </div>
      </div>`).join("") || `<p class="muted">Keine Aufgabe passt zu diesem Filter.</p>`}`;

  $$("#gki-exams [data-topic]").forEach((b) => (b.onclick = () => { v.topic = b.dataset.topic; renderGkiExams(); }));
  $("#gkExamOpen").onchange = (ev) => { v.open = ev.target.checked; renderGkiExams(); };
  $("#gkExamTaught").onchange = (ev) => { v.taught = ev.target.checked; renderGkiExams(); };
  $$("#gki-exams [data-done]").forEach((cb) => (cb.onchange = () => {
    const s = gkExamDone();
    cb.checked ? s.add(cb.dataset.done) : s.delete(cb.dataset.done);
    store.set("gkiExamDone", [...s]);
    track("gki.examDone");
    renderGkiExams();
  }));
  $$("#gki-exams [data-sec]").forEach((b) => (b.onclick = () => openGkiSection(b.dataset.sec)));
  $$("#gki-exams [data-tasks]").forEach((b) => (b.onclick = () => openGkiTasks(b.dataset.tasks)));
}
