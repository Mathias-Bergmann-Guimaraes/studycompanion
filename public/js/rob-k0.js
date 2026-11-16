// Robotics I, chapter 0: Introduction — what a robot is (the term, Asimov, the VDI and scientific
// definitions), the history from Heron to today's humanoids and the generations of robots, the
// disciplines involved, and the fields of application with industrial, service and personal robots.

/* ---------------------------------------------------------------- 0.2 History */

// [year, what, kind]: kind is one of idea (automata, ideas), ind (industrial), mob (mobile, driving,
// space), hum (humanoids and hands), now (lightweight arms, challenges, today).
const RB_HISTORY = [
  ["1st c. AD", "Heron of Alexandria builds an automatic altar.", "idea"],
  ["3rd c. AD", "A four-legged walking machine in China carries 200–250 kg, 10 km a day.", "idea"],
  ["15th c.", "Leonardo da Vinci designs a mechanical soldier.", "idea"],
  ["1738", "Jacques de Vaucanson's mechanical duck flaps its wings, quacks, drinks, eats and “digests”.", "idea"],
  ["1774", "Jaquet-Droz and Leschot: a mechanical writer.", "idea"],
  ["1805", "Jacquard's weaving loom is programmed with punch cards.", "idea"],
  ["1920", "Karel Čapek's play R.U.R. (Rossum's Universal Robots) gives us the word: <i>robota</i>, heavy work.", "idea"],
  ["1942", "Isaac Asimov's three laws of robotics (“Runaround”).", "idea"],
  ["1954", "George Devol patents the programmable manipulator.", "ind"],
  ["1959/60", "Devol and Engelberger: Unimate, the first industrial robot — hydraulic, computer-controlled.", "ind"],
  ["1961", "A Unimate is installed at Ford.", "ind"],
  ["1968", "Shakey (Charles Rosen, SRI): the first mobile robot — robotics, vision and speech in one.", "mob"],
  ["1973", "Wabot-1 (Ichiro Kato, Waseda University): the first humanoid robot.", "hum"],
  ["1974", "AL, an assembly language; Unimation carries it on as VAL.", "ind"],
  ["1978", "PUMA (Programmable Universal Machine for Assembly) by Unimation.", "ind"],
  ["1984/85", "Wabot-2; the three-finger Salisbury hand (Stanford/JPL).", "hum"],
  ["1986", "Ernst Dickmanns' robot car VaMoRs drives up to 96 km/h.", "mob"],
  ["1996", "Sojourner on Mars (Pathfinder mission).", "mob"],
  ["1999", "Kismet (MIT): the sociable machine.", "hum"],
  ["2000", "ARMAR-I at KIT — the start of the ARMAR family (ARMAR-7 in 2024).", "hum"],
  ["2003", "DLR LWR III: 14 kg payload for 14 kg weight, 7 DoF with torque control; KUKA LBR iiwa in 2013.", "now"],
  ["2005/07", "DARPA Grand Challenge won by Stanford; Urban Challenge with Team AnnieWAY from Karlsruhe.", "mob"],
  ["2008", "Universal Robots' UR5 (5 kg payload).", "now"],
  ["2012–15", "DARPA Robotics Challenge: semi-autonomous robots in disaster scenarios.", "now"],
  ["2017", "Franka Emika Panda: 7 DoF, torque control, from about 10 000 €.", "now"],
  ["2025", "First humanoid half-marathon: the winning robot needs 2:40 h. 1 million robots at Amazon.", "now"],
  ["2026", "Second half-marathon: 100+ humanoids; the winner runs 50:26 min, faster than the fastest human (1:07 h).", "now"],
];
const RB_HIST_KIND = { idea: "Automata and ideas", ind: "Industrial robots", mob: "Mobile robots, cars, space", hum: "Humanoids and hands", now: "Lightweight arms, challenges, today" };

function rbWHistory(root) {
  const { w, fig, read, on } = ppW(root, "hist");
  const st = { i: 9 };
  const draw = () => {
    const n = RB_HISTORY.length, X = (k) => 20 + (k / (n - 1)) * 480;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 520 96" role="img" aria-label="Timeline">
      <line x1="20" y1="48" x2="500" y2="48" class="tick"/>
      ${RB_HISTORY.map(([y, , k], i) => `<circle cx="${X(i)}" cy="48" r="${i === st.i ? 8 : 5}" class="rb-hdot rb-h-${k} ${i === st.i ? "on" : ""}" data-i="${i}"/>`).join("")}
      <text x="${X(st.i)}" y="${st.i % 2 ? 80 : 26}" text-anchor="${st.i < 3 ? "start" : st.i > n - 4 ? "end" : "middle"}" class="gk-box-t">${RB_HISTORY[st.i][0]}</text>
      <text x="20" y="92" class="tick-t">antiquity</text><text x="500" y="92" text-anchor="end" class="tick-t">2026</text>
    </svg>`;
    const [y, what, k] = RB_HISTORY[st.i];
    read.innerHTML = `<p><span class="rb-hk rb-h-${k}">${RB_HIST_KIND[k]}</span> · <b>${y}</b></p><p>${what}</p>
      <p class="small muted">${st.i + 1} / ${n}. Click a dot or step through.</p>`;
    $$("circle[data-i]", fig).forEach((c) => (c.onclick = () => { st.i = +c.dataset.i; draw(); }));
  };
  on("prev", () => { st.i = Math.max(0, st.i - 1); draw(); });
  on("next", () => { st.i = Math.min(RB_HISTORY.length - 1, st.i + 1); draw(); });
  draw();
}

/* ---------------------------------------------------------------- 0.3 Classes of robots */

// Where a robot sits on the slide's chart: [autonomy 0–1, unstructured environment 0–1].
const RB_KINDS = {
  weld: { name: "Welding robot", at: [0.15, 0.12], cls: "Industrial robot", text: "Stationary, few DoF, easy to program, highly specialised. The environment is built for it: fences, fixtures. Fast and repeatable — but programmed for one task." },
  cobot: { name: "Cobot (Panda, LBR iiwa)", at: [0.3, 0.3], cls: "Industrial robot", text: "Torque control for safe human–robot collaboration. From DLR research to a certifiably safe product took more than 10 years." },
  agv: { name: "Warehouse robot", at: [0.5, 0.42], cls: "Service robot (professional)", text: "Transport and logistics is the largest application area for service robots: shelves drive to a person who picks. 24/7, people nearby; the challenge is coordinating a fleet." },
  surgery: { name: "Da Vinci", at: [0.22, 0.45], cls: "Service robot (professional)", text: "Teleoperated surgery with 3-D view and force feedback — little autonomy. Medical approval, sterility, reliability; high cost." },
  mower: { name: "Lawn mower", at: [0.55, 0.55], cls: "Service robot (domestic)", text: "A domestic service robot: one task, done autonomously in a garden that is only partly structured." },
  care: { name: "Care robot", at: [0.62, 0.72], cls: "Service robot (professional)", text: "Fetch and deliver for staff, lift patients (ROBEAR), support household tasks. Semi-structured environment, strict safety; must support the staff without reducing human contact." },
  armar: { name: "ARMAR-7", at: [0.84, 0.88], cls: "“Personal robot”", text: "A humanoid assistant in homes and care facilities: high flexibility in environment and task, learning, social interaction — the 4th generation." },
};

function rbWKinds(root) {
  const { w, fig, read } = ppW(root, "kinds");
  const st = { k: "weld" };
  const draw = () => {
    const P = rbFrame(300, 250, [0, 1], [0, 1], { l: 30, r: 10, t: 10, b: 30 });
    const zone = (x0, y0, x1, y1, t, cls) => `<rect x="${P.X(x0)}" y="${P.Y(y1)}" width="${P.X(x1) - P.X(x0)}" height="${P.Y(y0) - P.Y(y1)}" rx="12" class="rb-zone ${cls}"/>
      <text x="${(P.X(x0) + P.X(x1)) / 2}" y="${P.Y(y1) + 16}" text-anchor="middle" class="tick-t">${t}</text>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 250" role="img" aria-label="Autonomy versus unstructured environment">
      ${zone(0.02, 0.02, 0.42, 0.4, "Industrial", "z1")}${zone(0.18, 0.3, 0.75, 0.8, "Service", "z2")}${zone(0.66, 0.66, 0.98, 0.98, "Personal", "z3")}
      <line x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(1)}" y2="${P.Y(0)}" class="tick"/><line x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(0)}" y2="${P.Y(1)}" class="tick"/>
      <text x="${P.X(0.5)}" y="246" text-anchor="middle" class="ax-t">unstructured environment →</text>
      <text x="12" y="${P.Y(0.5)}" text-anchor="middle" class="ax-t" transform="rotate(-90 12 ${P.Y(0.5)})">autonomy in the task →</text>
      ${Object.entries(RB_KINDS).map(([k, r]) => `<circle cx="${P.X(r.at[1])}" cy="${P.Y(r.at[0])}" r="${k === st.k ? 8 : 5}" class="rb-kdot ${k === st.k ? "on" : ""}"/>`).join("")}
    </svg>`;
    const r = RB_KINDS[st.k];
    read.innerHTML = `<p><b>${r.name}</b> · <span class="muted">${r.cls}</span></p><p class="small">${r.text}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

ROB_CHAPTERS.push({
  n: 0, title: "Introduction",
  headline: "What a robot is — and <span class=\"accent\">where robots are</span>",
  intro: "Where the word comes from and how it is defined, how robots got from Heron's altar to humanoids that run half-marathons, which disciplines meet in robotics, and where robots work today.",
  sections: [
    {
      id: "0.1", title: "Terminology", short: "Terms", about: "Čapek, Asimov, the VDI definition, robotics as AI in the real world",
      html: () => `
        ${ppGist([
          "<b>Robot</b> comes from Karel Čapek's play <i>R.U.R.</i> (Rossum's Universal Robots): <i>robota</i> is West Slavic for heavy work. Čapek's robots work restlessly, unlike humans.",
          "Industrial definition (<b>VDI 2860</b>, 1990): a freely programmable, multifunctional manipulator with <b>at least 3 independent axes</b>, moving material, parts, tools or devices along programmed, variable trajectories.",
          "Scientific definition (Christaller, 2001): <b>sensorimotor machines</b> that extend the human capacity to act — mechatronics, sensors and computer control; more DoF and more varied actions than other machines.",
          "Asfour: robotics engineers technical systems with intelligent behaviour for the real world — <b>robotics is artificial intelligence in the real world</b>.",
        ])}
        <div class="card">
          <h3>Asimov's three laws (“Runaround”, 1942)</h3>
          ${ppFacts([
            ["First", "A robot may not injure a human being or, through inaction, allow a human being to come to harm."],
            ["Second", "A robot must obey orders given by human beings, except where they conflict with the First Law."],
            ["Third", "A robot must protect its own existence, as long as that does not conflict with the First or Second Law."],
          ])}
          <h3>Disciplines involved in modern robotics</h3>
          <div class="gk-chips">${["Informatics", "Engineering", "Artificial Intelligence", "Biology", "Neuroscience", "Cognitive Science", "Psychology", "Material science"].map((d) => `<span class="len-topic">${d}</span>`).join("")}</div>
          <p class="small">Mechanical engineering builds the body, computer science the algorithms; electrical, control, software and materials engineering add theirs.
            Most robots help or assist humans: in jobs that are hazardous (ruins, space, mines) or boring, repetitive and unpleasant (cleaning, transporting, assembling).</p>
        </div>
        ${rbThink([
          ["A pick-and-place machine moves along two axes only. Is it a robot in the sense of VDI 2860?", "No: VDI 2860 asks for at least 3 independent axes, freely programmable, with variable trajectories."],
          ["What makes a robot more complex than other machines, according to Christaller?", "The higher number of degrees of freedom and the variety and extent of its actions."],
        ])}
        ${ppTraps([
          "“Robota” means heavy work (forced labour), not “machine”.",
          "VDI 2860 counts <b>axes</b> (at least 3), not sensors or intelligence.",
        ])}`,
      check: [
        { q: "Where does the word “robot” come from?", opts: ["Karel Čapek's play R.U.R. — robota, heavy work", "Isaac Asimov's “Runaround”", "The first Unimate at Ford", "The VDI guideline 2860"], why: "Čapek introduced it; Asimov's laws came in 1942." },
        { q: "How many independent axes does a robot need according to VDI 2860?", opts: ["At least 3", "At least 6", "Exactly 6", "At least 1"], why: "A freely programmable, multifunctional manipulator with at least 3 independent axes." },
        { q: "Asimov's Second Law: a robot must obey orders unless …", opts: ["they conflict with the First Law", "they endanger the robot", "they come from another robot", "they are not programmed"], why: "The First Law (do not harm humans) comes first; protecting itself is only the Third Law." },
        { q: "Which slogan sums up the lecturer's definition?", opts: ["Robotics is artificial intelligence in the real world", "Robots are restlessly working machines", "Robots are manipulators with 3 axes", "Robotics is mechanical engineering"], why: "Systems that move, perceive, predict the consequences of actions and keep learning from interacting with the real world." },
      ],
    },
    {
      id: "0.2", title: "History and generations", short: "History", about: "From Heron's altar to Unimate, Shakey, Wabot and today's humanoids; four generations",
      html: () => `
        ${ppGist([
          "Automata for centuries (Heron, da Vinci, Vaucanson's duck), then programmable machines: Jacquard's loom with <b>punch cards</b> (1805).",
          "<b>1959/60 Unimate</b> (Devol, Engelberger): the first industrial robot; 1961 at Ford. <b>1968 Shakey</b>: the first mobile robot. <b>1973 Wabot-1</b>: the first humanoid.",
          "Today: hundreds of new humanoids, bold investments (China, US); 5.1 million industrial robots in operation (2025).",
        ])}
        ${pw("hist", `<div class="lw-btns">${pbtn("prev", "← earlier")}${pbtn("next", "later →", "primary")}</div>`, { wide: true })}
        <div class="card">
          <h3>Four generations of robots</h3>
          ${ppFacts([
            ["1st · since 1960", "<b>Programmable manipulators.</b> Little computing power, fixed waypoints only (point-to-point programming), few senses: pick-and-place."],
            ["2nd · since the 1980s", "<b>Adaptive robots.</b> More sensors (cameras), adapt to the environment, special languages (VAL), a little intelligence: adaptive execution."],
            ["3rd · starting now", "<b>Autonomous robots.</b> High computing power (multiprocessor), task-oriented programming, a demand for autonomy."],
            ["4th · research", "<b>Humanoid AI robots.</b> Flexible in environment and task, learn and adapt, social interaction, self-reflection."],
          ])}
        </div>
        ${rbThink([
          ["Why is Jacquard's loom part of the history of robotics?", "It was programmable: punch cards changed the pattern without changing the machine — the idea behind a freely programmable manipulator."],
          ["What did Shakey combine for the first time?", "A mobile robot with vision and speech processing — robotics, perception and planning together."],
        ])}
        ${ppTraps([
          "Unimate (1959/60) is the first <b>industrial</b> robot; Shakey (1968) the first <b>mobile</b> robot; Wabot-1 (1973) the first <b>humanoid</b>.",
          "Point-to-point programming with fixed waypoints is the <b>1st</b> generation; adaptation through sensors the <b>2nd</b>.",
        ])}`,
      setup: (root) => rbWHistory(root),
      check: [
        { q: "What was Unimate?", opts: ["The first industrial robot (1959/60), hydraulic and computer-controlled", "The first humanoid robot", "The first mobile robot", "A programming language"], why: "Devol and Engelberger; installed at Ford in 1961." },
        { q: "Which was the first mobile robot?", opts: ["Shakey (1968, SRI)", "PUMA (1978)", "Wabot-1 (1973)", "Sojourner (1996)"], why: "Shakey combined robotics, vision and speech processing." },
        { q: "Which generation is characterised by fixed waypoints and little sensing?", opts: ["The 1st (programmable manipulators)", "The 2nd (adaptive robots)", "The 3rd (autonomous robots)", "The 4th (humanoid AI robots)"], why: "Point-to-point programming, pick-and-place." },
        { q: "What does the 2nd generation add?", opts: ["Sensors such as cameras and adaptation to the environment", "Self-reflection", "Social interaction", "Punch cards"], why: "Adaptive robots, programmed in languages such as VAL." },
        { q: "Wabot-1 (Waseda University, 1973) was …", opts: ["the first humanoid robot", "the first industrial robot", "a robot car", "a surgical robot"], why: "Built by Ichiro Kato's group; Wabot-2 followed in 1984." },
      ],
    },
    {
      id: "0.3", title: "Fields of application", short: "Applications", about: "Industrial, service and personal robots; production, logistics, care, medicine, underwater, air",
      html: () => `
        ${ppGist([
          "Classified by <b>degree of autonomy</b> in the task and how <b>unstructured</b> the environment is: industrial robot → service robot → “personal robot”.",
          "<b>Industrial robot</b> (ISO 8373): automatically controlled, reprogrammable, multipurpose manipulator, programmable in 3 or more axes. Categorised by number of axes, type of control (PTP, continuous path, adaptive, teleoperation) and kinematic structure (SCARA, parallel …).",
          "<b>Service robot</b>: half or fully autonomous, useful tasks for humans and institutions — not industrial production. Domestic, professional, others. <b>Personal robot</b> (Fukuda): resembles human behaviour in motion, intelligence and communication.",
        ])}
        ${pw("kinds", pseg("k", Object.entries(RB_KINDS).map(([k, v]) => [k, v.name]), "weld"), { wide: true })}
        <div class="card">
          <h3>Where robots work</h3>
          ${ppFacts([
            ["Production", "Welding, painting, assembly. Fast and repeatable; the environment is built for the robot. Challenge: one task per program while batches get smaller; safe collaboration (cobots)."],
            ["Logistics", "The largest area for service robots: warehouses, supplying assembly lines, hospital transport. Fleets; grasping different items (Dex-Net)."],
            ["Caregiving", "Fetch and deliver, lift patients, household, social interaction. Safety, semi-structured environment, socially adequate behaviour."],
            ["Medicine", "Surgery (Da Vinci: teleoperation, 20 million procedures until 2025), exoskeletons, prostheses. Approval, sterility, intuitive control, cost."],
            ["Micro and nano", "Drug delivery, manipulation in electron microscopes. Viscosity dominates over inertia — special propulsion, e.g. magnetic steering."],
            ["Underwater", "ROV (remotely operated) and AUV (autonomous): pipelines, seabed mapping. +1 bar per 10 m, no GPS, little bandwidth, darkness, corrosion."],
            ["Aerial drones", "Inspection, mapping, transport (Zipline delivers medicine). Payload-to-weight ratio; fast flight with on-board perception."],
          ])}
          <p class="small">5.1 million industrial robots in factories worldwide (2025, IFR); the industrial robot is stationary, has few DoF, is easy to program, highly specialised
            and cheaper than human labour for its task.</p>
        </div>
        ${rbThink([
          ["Why is a factory easier for a robot than a kitchen?", "In the factory the environment is built for the robot — fences, fixtures, known parts. A kitchen is unstructured: objects move, people are around, every home is different."],
          ["Is a surgical robot like the Da Vinci autonomous?", "Hardly: it is teleoperated by the surgeon. It is a service robot because it does useful work outside industrial production, not because of its autonomy."],
        ])}
        ${ppTraps([
          "Service robots are defined by <b>what they do</b> (useful tasks, not industrial production), not by being mobile.",
          "ISO 8373 also allows an industrial robot to be <b>mobile</b> — “fixed in place or mobile”.",
        ])}`,
      setup: (root) => rbWKinds(root),
      check: [
        { q: "Which two axes classify robots on the slide's chart?", opts: ["Degree of autonomy in the task and how unstructured the environment is", "Payload and speed", "Number of axes and price", "Indoor and outdoor"], why: "Industrial robots: little autonomy, structured environment; personal robots: high autonomy, unstructured environment." },
        { q: "What is excluded from service robots by definition?", opts: ["Industrial production tasks", "Autonomous operation", "Medical applications", "Domestic use"], why: "A service robot performs useful tasks for humans and institutions, industrial production excepted." },
        { q: "Which is the largest application area for service robots?", opts: ["Transportation and logistics", "Surgery", "Underwater inspection", "Entertainment"], why: "Warehouses, factories, hospitals — 1 million robots at Amazon in 2025." },
        { q: "Why do micro-robots need special propulsion?", opts: ["At small scale viscosity dominates over inertia", "There is no gravity", "They are too heavy", "Magnets do not work in the body"], why: "Swimming like a fish does not work at that scale; e.g. magnetic steering (Navion)." },
        { q: "Which is <b>not</b> a way ISO 8373 categorises industrial robots?", opts: ["By their colour", "By number of axes", "By type of control (PTP, continuous path …)", "By kinematic structure (SCARA, parallel …)"], why: "Axes, control and kinematic structure." },
      ],
    },
  ],
});
