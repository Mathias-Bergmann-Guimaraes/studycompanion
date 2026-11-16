// Robotics I, chapter 2: Kinematics — configuration and task space, kinematic chains, the
// Denavit–Hartenberg convention, forward kinematics with the planar and the 3-D example and ARMAR-I,
// the Jacobian for velocities and forces, singularities and manipulability, reachability maps and
// geometric models.

/* ---------------------------------------------------------------- 2.1 A planar arm */

const RB_A3 = [1, 0.8, 0.5];
function rbWFK3(root) {
  const { w, fig, read } = ppW(root, "fk3");
  const st = { t1: 30, t2: 40, t3: -30 };
  const draw = () => {
    ["t1", "t2", "t3"].forEach((k) => lenOut(w, k, `${st[k]}°`));
    const th = [st.t1, st.t2, st.t3].map(rbRad);
    const pts = rbPlanar(th, RB_A3);
    const [x, y] = pts[3], phi = th[0] + th[1] + th[2];
    const P = rbFrame(300, 270, [-2.4, 2.4], [-0.9, 2.4], { l: 16, r: 10, t: 10, b: 16 });
    const C = rbFrame(150, 150, [-180, 180], [-180, 180], { l: 10, r: 10, t: 10, b: 10 });
    fig.innerHTML = `<div class="gk-two"><svg class="lw-svg" viewBox="0 0 300 270" role="img" aria-label="Task space">
        ${P.axes({ xt: [-2, -1, 1, 2], yt: [1, 2], xl: "x", yl: "y" })}
        ${rbArmSVG(P, pts)}
        ${arrowSVG(P.X(x), P.Y(y), P.X(x + 0.45 * Math.cos(phi)), P.Y(y + 0.45 * Math.sin(phi)), "rb-ax rb-ax-x", 2)}
        <text x="${P.X(x) + 8}" y="${P.Y(y) - 10}" class="rb-jl">(x, y, φ)</text>
        <text x="296" y="264" text-anchor="end" class="tick-t">task space X</text>
      </svg><svg class="lw-svg" viewBox="0 0 150 170" role="img" aria-label="Configuration space">
        <rect x="10" y="10" width="130" height="130" rx="8" class="rb-cspace"/>
        <circle cx="${C.X(st.t1)}" cy="${C.Y(st.t2)}" r="6" class="rb-th"/>
        <text x="75" y="156" text-anchor="middle" class="tick-t">θ₁ →  (θ₃ = ${st.t3}°)</text>
        <text x="4" y="75" class="tick-t" transform="rotate(-90 4 75)" text-anchor="middle">θ₂ →</text>
        <text x="75" y="168" text-anchor="middle" class="tick-t">configuration space C</text>
      </svg></div>`;
    read.innerHTML = `${rbVals([["x = a₁c₁ + a₂c₁₂ + a₃c₁₂₃", rbN(x, 3)], ["y = a₁s₁ + a₂s₁₂ + a₃s₁₂₃", rbN(y, 3)], ["φ = θ₁ + θ₂ + θ₃", `${rbN(rbDeg(rbWrap(phi)), 1)}°`]])}
      <p class="small">$a = (${RB_A3.join(", ")})$. Three joints, three task coordinates $(x, y, \\varphi)$: $n = m = 3$. Forward kinematics is the map $\\theta \\mapsto x = f(\\theta)$ from the square on the right to the arm on the left.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.2 The four DH steps */

function rbWDH(root) {
  const { w, fig, read } = ppW(root, "dh");
  const st = { th: 50, d: 0.8, a: 1, al: 60, k: 4 };
  const draw = () => {
    lenOut(w, "th", `${st.th}°`); lenOut(w, "d", rbN(st.d, 1)); lenOut(w, "a", rbN(st.a, 1)); lenOut(w, "al", `${st.al}°`);
    const mats = [rbH(rbRz(rbRad(st.th))), rbH(rbI(3), [0, 0, st.d]), rbH(rbI(3), [st.a, 0, 0]), rbH(rbRx(rbRad(st.al)))];
    const part = mats.slice(0, st.k).reduce(rbMul, rbI(4));
    const full = mats.reduce(rbMul, rbI(4));
    const V = rbView(115, 215, 100, 40, 20);
    const zTop = V.p([0, 0, 1.9]), zBot = V.p([0, 0, -0.3]);
    const o = rbHt(full), zi = [full[0][2], full[1][2], full[2][2]];
    const za = V.p(o.map((c, i) => c - 0.8 * zi[i])), zb = V.p(o.map((c, i) => c + 1.3 * zi[i]));
    const trail = [0, 1, 2, 3, 4].map((k) => V.p(rbHt(mats.slice(0, k).reduce(rbMul, rbI(4)))));
    fig.innerHTML = `<div class="gk-two"><svg class="lw-svg" viewBox="0 0 300 280" role="img" aria-label="DH steps">
        <line x1="${zBot[0]}" y1="${zBot[1]}" x2="${zTop[0]}" y2="${zTop[1]}" class="rb-axis"/><text x="${zTop[0] + 6}" y="${zTop[1] + 4}" class="tick-t">joint i</text>
        <line x1="${za[0]}" y1="${za[1]}" x2="${zb[0]}" y2="${zb[1]}" class="rb-axis"/><text x="${zb[0] + 6}" y="${zb[1] + 4}" class="tick-t">joint i+1</text>
        <path d="${trail.slice(0, st.k + 1).map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("")}" class="rb-trail"/>
        ${V.frame(rbI(4), 0.7, "i−1", { dim: true, sub: "ᵢ₋₁" })}
        ${st.k ? V.frame(part, 0.7, st.k === 4 ? "i" : "", { sub: st.k === 4 ? "ᵢ" : "" }) : ""}
      </svg>
      <div class="rb-steps">${["frame i−1", "1. Rot(z, θᵢ)", "2. Trans(z, dᵢ)", "3. Trans(x, aᵢ)", "4. Rot(x, αᵢ)"]
        .map((t, i) => `<button type="button" class="btn ${i === st.k ? "primary" : ""}" data-k="${i}">${t}</button>`).join("")}</div></div>`;
    $$("[data-k]", fig).forEach((b) => (b.onclick = () => { st.k = +b.dataset.k; draw(); }));
    const what = ["The frame of link i−1: $z_{i-1}$ lies on the axis of joint i.",
      "Turn about $z_{i-1}$ by $\\theta_i$ until $x$ is parallel to $x_i$.",
      "Slide along $z_{i-1}$ by $d_i$ to where the common normal meets it.",
      "Slide along the new $x$ by $a_i$: the origins now coincide.",
      "Turn about $x_i$ by $\\alpha_i$ until $z$ lies on the axis of joint i+1."][st.k];
    read.innerHTML = `<p class="small">${what}</p>
      <div class="nm-tex">$${"${}^{i-1}"}T_i = ${rbTex(full, 2)}$$</div>
      <p class="small">$a_i$ = ${rbN(st.a, 1)} (link length), $\\alpha_i$ = ${st.al}° (twist), $d_i$ = ${rbN(st.d, 1)} (offset), $\\theta_i$ = ${st.th}° (joint angle).</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.3 The 3-D example (R R P) */

const RB_D2 = 0.6;
function rbWRRP(root) {
  const { w, fig, read } = ppW(root, "rrp");
  const st = { t1: 30, t2: 50, d3: 0.9 };
  const draw = () => {
    lenOut(w, "t1", `${st.t1}°`); lenOut(w, "t2", `${st.t2}°`); lenOut(w, "d3", rbN(st.d3, 2));
    const t1 = rbRad(st.t1), t2 = rbRad(st.t2);
    const T01 = rbDH(0, -Math.PI / 2, 0, t1), T12 = rbDH(0, Math.PI / 2, RB_D2, t2), T23 = rbDH(0, 0, st.d3, 0);
    const T02 = rbMul(T01, T12), T03 = rbMul(T02, T23);
    const V = rbView(140, 190, 95, 35, 20);
    const pts = [[0, 0, -0.6], [0, 0, 0], rbHt(T02), rbHt(T03)].map(V.p);
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 300" role="img" aria-label="R R P robot">
      ${V.frame(rbI(4), 0.45, "0", { dim: true, sub: "₀" })}
      <path d="${pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join("")}" class="rb-link3"/>
      ${pts.slice(1, 3).map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" class="rb-joint"/>`).join("")}
      <rect x="${pts[3][0] - 6}" y="${pts[3][1] - 6}" width="12" height="12" class="rb-eef"/>
      ${V.frame(T02, 0.35, "", { dim: true, sub: "₂" })}
      ${V.frame(T03, 0.45, "3", { sub: "₃" })}
    </svg>`;
    const s1 = Math.sin(t1), c1 = Math.cos(t1), s2 = Math.sin(t2), c2 = Math.cos(t2);
    read.innerHTML = `<div class="nm-tex">$${"${}^{0}"}T_3 = ${rbTex(T03, 2)}$$</div>
      ${rbVals([["c₁s₂d₃ − s₁d₂", rbN(c1 * s2 * st.d3 - s1 * RB_D2)], ["s₁s₂d₃ + c₁d₂", rbN(s1 * s2 * st.d3 + c1 * RB_D2)], ["c₂d₃", rbN(c2 * st.d3)]])}
      <p class="small">Two revolute joints ($\\theta_1$, $\\theta_2$), one prismatic ($d_3$); $d_2 = ${RB_D2}$. The last column is the end effector's position.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.4 The Jacobian of the 2-link arm */

const RB_L = [1, 0.8];
function rbWJac(root) {
  const { w, fig, read } = ppW(root, "jac");
  const st = { t1: 30, t2: 60, mode: "v", w1: 1, w2: 0.5, fx: 0, fy: -1 };
  const draw = () => {
    ["t1", "t2"].forEach((k) => lenOut(w, k, `${st[k]}°`));
    ["w1", "w2", "fx", "fy"].forEach((k) => lenOut(w, k, rbN(st[k], 1)));
    $$(".rb-mode-v", w).forEach((e) => (e.hidden = st.mode !== "v"));
    $$(".rb-mode-f", w).forEach((e) => (e.hidden = st.mode !== "f"));
    const th = [rbRad(st.t1), rbRad(st.t2)];
    const pts = rbPlanar(th, RB_L), [x, y] = pts[2];
    const J = rbJ2(th, ...RB_L);
    const P = rbFrame(300, 280, [-2, 2], [-1.6, 2.2], { l: 16, r: 10, t: 10, b: 16 });
    const k = 0.6;
    let arrows, rd;
    if (st.mode === "v") {
      const v1 = [J[0][0] * st.w1, J[1][0] * st.w1], v2 = [J[0][1] * st.w2, J[1][1] * st.w2], v = [v1[0] + v2[0], v1[1] + v2[1]];
      arrows = `${arrowSVG(P.X(x), P.Y(y), P.X(x + k * v1[0]), P.Y(y + k * v1[1]), "rb-j1", 2)}
        ${arrowSVG(P.X(x + k * v1[0]), P.Y(y + k * v1[1]), P.X(x + k * v[0]), P.Y(y + k * v[1]), "rb-j2", 2)}
        ${arrowSVG(P.X(x), P.Y(y), P.X(x + k * v[0]), P.Y(y + k * v[1]), "rb-v", 3)}`;
      rd = `<div class="nm-tex">$$\\dot x = J\\dot\\theta = ${rbTex(J, 2)}${rbTexV([st.w1, st.w2], 1)} = ${rbTexV(v, 2)}$$</div>
        <p class="small"><span class="rb-j1-t">$J_1\\dot\\theta_1$</span> + <span class="rb-j2-t">$J_2\\dot\\theta_2$</span> = <span class="rb-th-t">$\\dot x$</span>: the end-effector velocity is a linear combination of the Jacobian's columns.</p>`;
    } else {
      const F = [st.fx, st.fy], tau = [J[0][0] * F[0] + J[1][0] * F[1], J[0][1] * F[0] + J[1][1] * F[1]];
      arrows = arrowSVG(P.X(x), P.Y(y), P.X(x + k * F[0]), P.Y(y + k * F[1]), "rb-force", 3);
      rd = `<div class="nm-tex">$$\\tau = J^\\top F = ${rbTex(rbT(J), 2)}${rbTexV(F, 1)} = ${rbTexV(tau, 3)}$$</div>
        <p class="small">The joint torques that hold the force $F$ at the end effector (static, no friction). A force along the line through a joint costs that joint nothing.</p>`;
    }
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 280" role="img" aria-label="Jacobian columns">
      ${P.axes({ xt: [-1, 1], yt: [-1, 1, 2], xl: "x₁", yl: "x₂" })}
      ${rbArmSVG(P, pts)}${arrows}
    </svg>`;
    read.innerHTML = rd;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.5 Manipulability ellipse */

function rbWManip(root) {
  const { w, fig, read } = ppW(root, "manip");
  const st = { t1: 20, t2: 90, kind: "v" };
  const draw = () => {
    ["t1", "t2"].forEach((k) => lenOut(w, k, `${st[k]}°`));
    const th = [rbRad(st.t1), rbRad(st.t2)];
    const pts = rbPlanar(th, RB_L), [x, y] = pts[2];
    const J = rbJ2(th, ...RB_L), { s1, s2, ang, det } = rbSvd2(J);
    const P = rbFrame(300, 280, [-2, 2], [-1.6, 2.2], { l: 16, r: 10, t: 10, b: 16 });
    const sc = P.X(1) - P.X(0), k = 0.45, cap = 2.4;
    const [ra, rb] = st.kind === "v" ? [s1 * k, s2 * k] : [Math.min(cap, k / Math.max(s1, 1e-9)), Math.min(cap, k / Math.max(s2, 1e-9))];
    const sing = s2 < 0.03;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 280" role="img" aria-label="Manipulability ellipse">
      ${P.axes({ xt: [-1, 1], yt: [-1, 1, 2] })}
      <circle cx="${P.X(0)}" cy="${P.Y(0)}" r="${(RB_L[0] + RB_L[1]) * sc}" class="rb-ws"/>
      <ellipse cx="${P.X(x)}" cy="${P.Y(y)}" rx="${Math.max(ra * sc, 1.5)}" ry="${Math.max(rb * sc, 1.5)}" transform="rotate(${-rbDeg(ang)} ${P.X(x)} ${P.Y(y)})" class="rb-ell ${st.kind === "f" ? "force" : ""} ${sing ? "sing" : ""}"/>
      ${rbArmSVG(P, pts)}
    </svg>`;
    read.innerHTML = `${rbVals([["σ₁ (largest)", rbN(s1)], ["σ₂ (smallest) = w₁", rbN(s2)], ["w₂ = σ_min / σ_max", rbN(s2 / s1)], ["w₃ = √det(JJᵀ) = |det J|", rbN(Math.abs(det))]])}
      <p class="small">${sing ? `<b class="rb-err-t">Singular:</b> $\\det J = l_1l_2\\sin\\theta_2 = 0$. The ellipse has collapsed to a line — the end effector cannot move across it${st.kind === "f" ? ", but it can resist any force in that direction without torque" : ""}.`
        : st.kind === "v" ? "The image of all joint velocities with $\\|\\dot\\theta\\| = 1$. Round: free to move in every direction. Flat: restricted. Bend the elbow to 0° or 180°."
        : "Force ellipse: axes proportional to $1/\\sigma_i$ — where the arm moves fast, it pushes weakly, and the other way round."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 2.6 Reachability grid */

function rbWReach(root) {
  const { w, fig, read } = ppW(root, "reach");
  const st = { l1: 180, l2: 150, step: 5 };
  const draw = () => {
    lenOut(w, "l1", `±${st.l1}°`); lenOut(w, "l2", `±${st.l2}°`);
    const cell = 0.1, R = 1.9, n = Math.round((2 * R) / cell), best = new Map();
    let evals = 0;
    for (let a = -st.l1; a <= st.l1 + 1e-9; a += st.step) for (let b = -st.l2; b <= st.l2 + 1e-9; b += st.step) {
      evals++;
      const th = [rbRad(a), rbRad(b)], [x, y] = rbF2(th, ...RB_L);
      const i = Math.floor((x + R) / cell), j = Math.floor((y + R) / cell), key = i * 1000 + j;
      const m = Math.abs(RB_L[0] * RB_L[1] * Math.sin(th[1]));
      if (!best.has(key) || best.get(key) < m) best.set(key, m);
    }
    const P = rbFrame(300, 300, [-R, R], [-R, R], { l: 10, r: 10, t: 10, b: 10 });
    const sz = P.X(cell) - P.X(0), top = RB_L[0] * RB_L[1];
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 300" role="img" aria-label="Reachability grid">
      ${[...best].map(([key, m]) => { const i = Math.floor(key / 1000), j = key % 1000; return `<rect x="${P.X(-R + i * cell)}" y="${P.Y(-R + (j + 1) * cell)}" width="${sz}" height="${sz}" class="rb-cell" style="opacity:${(0.18 + 0.82 * (m / top)).toFixed(2)}"/>`; }).join("")}
      <circle cx="${P.X(0)}" cy="${P.Y(0)}" r="${(RB_L[0] + RB_L[1]) * (P.X(1) - P.X(0))}" class="rb-ws"/>
      <circle cx="${P.X(0)}" cy="${P.Y(0)}" r="5" class="rb-joint"/>
    </svg>`;
    read.innerHTML = `${rbVals([["joint angle configurations checked", evals], ["reachable grid cells", `${best.size} of ${n * n}`]])}
      <p class="small">Offline: step through all joint angles (here in ${st.step}° steps), compute the TCP with forward kinematics, mark its cell and keep the best manipulability
        ($|\\det J|$, darker = better). Online, “is this pose reachable?” is one lookup: $O(1)$. Narrow the joint limits and watch the workspace shrink; coarse steps leave holes.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

ROB_CHAPTERS.push({
  n: 2, title: "Kinematics",
  headline: "Where is my hand? — <span class=\"accent\">forward kinematics</span>",
  intro: "The kinematic model relates the joint angles to the pose of the end effector. Denavit–Hartenberg gives every link four numbers, chaining their matrices gives forward kinematics, and the Jacobian turns joint velocities into end-effector velocities — and shows where the arm gets stuck.",
  sections: [
    {
      id: "2.1", title: "The kinematic model", short: "Kinematic model", about: "Configuration space and task space, forward and inverse kinematics, links and joints",
      html: () => `
        ${ppGist([
          "Two spaces: the <b>configuration space</b> $C$ (joint space, robot coordinates: $\\theta = (\\theta_1, \\dots, \\theta_n)$) and the <b>task space</b> $X$ (Cartesian space of end-effector poses: $x = (x, y, z, \\alpha, \\beta, \\gamma)$, $m$ DoF).",
          "<b>Forward kinematics</b>: joint angles in, pose of the end effector out: $x = f(\\theta)$ — “where is my hand?”. <b>Inverse kinematics</b>: target pose in, joint angles out: $\\theta = f^{-1}(x)$ — “how do I move my hand to the target?” (chapter 3).",
          "Models in robotics: <b>kinematic</b> (geometry of motion), <b>dynamic</b> (forces and torques → accelerations), <b>geometric</b> (the shape of the bodies).",
          "A kinematic chain: <b>links</b> (rigid bodies) from the base to the end effector, connected by <b>joints</b> with one DoF each (revolute: rotation axis; prismatic: direction of translation). A general transformation between two joints needs <b>6 parameters</b>.",
        ])}
        ${pw("fk3", `${pslider("t1", "θ₁", -180, 180, 5, 30)}${pslider("t2", "θ₂", -180, 180, 5, 40)}${pslider("t3", "θ₃", -180, 180, 5, -30)}`, { wide: true })}
        <div class="card">
          <h3>What the kinematic model is used for</h3>
          ${ppFacts([
            ["Joint angles ↔ pose", "forward and inverse kinematics"],
            ["Reachability", "which poses can the end effector reach at all? (2.6)"],
            ["Self-collision", "the geometric relation between the robot's own body parts"],
            ["Collision", "the geometric relation to the environment"],
          ])}
        </div>
        ${ppTraps([
          "$n$ counts the robot's joints, $m$ the DoF of the task: in 3-D a full pose has $m = 6$.",
          "Forward kinematics has one answer; inverse kinematics can have none, several or infinitely many.",
        ])}`,
      setup: (root) => rbWFK3(root),
      check: [
        { q: "What is the input of forward kinematics?", opts: ["The joint angles", "The target pose", "The joint torques", "The DH parameters only"], why: "Output: the pose of the end effector." },
        { q: "What is the task space?", opts: ["The space of end-effector poses (Cartesian space)", "The space of joint angles", "The set of all tasks", "The robot's geometric model"], why: "The configuration space is the joint space." },
        { q: "How many parameters describe a general transformation between two joints?", opts: ["6 (3 rotation, 3 translation)", "4", "12", "3"], why: "DH reduces this to 4 (2.2)." },
        { q: "How many DoF does a joint have in the lecture's chains?", opts: ["One: a rotation (revolute) or a translation (prismatic)", "Three", "Six", "As many as the robot"], why: "Each link is one rigid body, each joint one DoF." },
      ],
    },
    {
      id: "2.2", title: "The Denavit–Hartenberg convention", short: "DH convention", about: "Three rules for the frames, the four parameters, the 4 × 4 DH matrix",
      html: () => `
        ${ppGist([
          "Goal: describe each link with <b>4 instead of 6</b> parameters (Denavit, Hartenberg 1955). The lecture uses the variant of Waldron and Paul.",
          "Frames: <b>1.</b> $z_{i-1}$ lies along the axis of motion of joint $i$. <b>2.</b> $x_i$ lies along the common normal of $z_{i-1}$ and $z_i$: $x_i = z_{i-1} \\times z_i$. <b>3.</b> $y_i$ completes a right-handed frame.",
          "<b>$a_i$</b> link length: distance from $z_{i-1}$ to $z_i$ along $x_i$. <b>$\\alpha_i$</b> link twist: angle from $z_{i-1}$ to $z_i$ about $x_i$. <b>$d_i$</b> link offset: distance from $x_{i-1}$ to $x_i$ along $z_{i-1}$. <b>$\\theta_i$</b> joint angle: angle from $x_{i-1}$ to $x_i$ about $z_{i-1}$.",
          "${}^{i-1}T_i = R_z(\\theta_i)\\,T_z(d_i)\\,T_x(a_i)\\,R_x(\\alpha_i)$.",
        ])}
        ${pw("dh", `${pslider("th", "θᵢ", -180, 180, 5, 50)}${pslider("d", "dᵢ", 0, 1.5, 0.1, 0.8)}${pslider("a", "aᵢ", 0, 1.5, 0.1, 1)}${pslider("al", "αᵢ", -180, 180, 5, 60)}`, { wide: true })}
        <div class="card">
          ${tx(`{}^{i-1}T_i = \\begin{pmatrix} \\cos\\theta_i & -\\sin\\theta_i\\cos\\alpha_i & \\sin\\theta_i\\sin\\alpha_i & a_i\\cos\\theta_i\\\\ \\sin\\theta_i & \\cos\\theta_i\\cos\\alpha_i & -\\cos\\theta_i\\sin\\alpha_i & a_i\\sin\\theta_i\\\\ 0 & \\sin\\alpha_i & \\cos\\alpha_i & d_i\\\\ 0&0&0&1\\end{pmatrix}`)}
          <table class="len-terms"><thead><tr><th>Parameter</th><th>Symbol</th><th>Revolute joint</th><th>Prismatic joint</th></tr></thead><tbody>
            <tr><td>Link length</td><td>$a_i$</td><td>constant</td><td>constant</td></tr>
            <tr><td>Link twist</td><td>$\\alpha_i$</td><td>constant</td><td>constant</td></tr>
            <tr><td>Link offset</td><td>$d_i$</td><td>constant</td><td><b>variable</b></td></tr>
            <tr><td>Joint angle</td><td>$\\theta_i$</td><td><b>variable</b></td><td>constant</td></tr></tbody></table>
          <h3>Ten steps to the DH parameters</h3>
          <ol class="small rb-ol"><li>Sketch the manipulator.</li><li>Number the joints (1 … n, last link = n).</li><li>Draw the axis $z_{i-1}$ for each joint $i$.</li><li>Place the origins $O_i$.</li><li>Draw the $x_i$ axes.</li>
            <li>Read $a_i$ between $z_{i-1}$ and $z_i$.</li><li>Read the twists $\\alpha_i$ about the $x_i$ axes.</li><li>Read the offsets $d_i$.</li><li>Read the angles $\\theta_i$ about the $z_{i-1}$ axes.</li><li>Compose the matrices $\{}^{i-1}T_i$.</li></ol>
          <p class="small">Choose the base frame (BCS, frame 0) and the end-effector frame (ECS, frame n) as intuitively as possible and so that their DH parameters are simple, preferably zero:
            the BCS as the frame of the first joint in its zero position, the ECS at an important reference point of the end effector.
            The inverse $\{}^{i-1}T_i^{-1}$ follows from chapter 1: $\\begin{pmatrix}R^\\top & -R^\\top t\\\\ 0 & 1\\end{pmatrix}$.</p>
        </div>
        ${ppTraps([
          "Frame $i$ belongs to link $i$, but its $z_i$ lies on the axis of joint <b>$i + 1$</b>.",
          "$\\theta_i$ and $d_i$ are measured along / about $z_{i-1}$; $a_i$ and $\\alpha_i$ along / about $x_i$.",
          "The order is fixed: rotate about $z$, slide along $z$, slide along $x$, rotate about $x$.",
        ])}`,
      setup: (root) => rbWDH(root),
      check: [
        { q: "Which DH parameter varies for a <b>prismatic</b> joint?", opts: ["The link offset $d_i$", "The joint angle $\\theta_i$", "The link length $a_i$", "The twist $\\alpha_i$"], why: "For a revolute joint, $\\theta_i$ varies; the other three stay constant." },
        { q: "Along which axis does $z_{i-1}$ lie?", opts: ["The axis of motion of joint $i$", "The axis of joint $i - 1$", "The common normal", "The axis of joint $i + 1$"], why: "And $z_i$ on the axis of joint $i + 1$." },
        { q: "What is $\\alpha_i$?", opts: ["The angle from $z_{i-1}$ to $z_i$ about $x_i$", "The angle from $x_{i-1}$ to $x_i$ about $z_{i-1}$", "The distance along $z_{i-1}$", "The distance along $x_i$"], why: "The link twist." },
        { q: "In which order are the elementary transformations multiplied?", opts: ["$R_z(\\theta)\\,T_z(d)\\,T_x(a)\\,R_x(\\alpha)$", "$R_x(\\alpha)\\,T_x(a)\\,T_z(d)\\,R_z(\\theta)$", "$T_z(d)\\,R_z(\\theta)\\,R_x(\\alpha)\\,T_x(a)$", "Any order"], why: "Rotate and slide about/along $z_{i-1}$, then slide and rotate along/about $x_i$." },
        { q: "How does $x_i$ get its direction?", opts: ["$x_i = z_{i-1} \\times z_i$, along the common normal", "$x_i = z_i \\times z_{i-1}$", "Parallel to $x_{i-1}$ always", "From the right-hand rule with $y_i$"], why: "Rule 2; $y_i$ then completes the frame." },
      ],
    },
    {
      id: "2.3", title: "Forward kinematics and examples", short: "Forward kinematics", about: "Chaining DH matrices; the planar 3R arm, a 3-D R R P robot, ARMAR-I",
      html: () => `
        ${ppGist([
          "The pose of the end effector (frame $n$) in the base (frame 0): ${}^{0}T_n(\\theta) = {}^{0}T_1(\\theta_1)\\,{}^{1}T_2(\\theta_2)\\cdots{}^{n-1}T_n(\\theta_n) = \\begin{pmatrix}R & t\\\\ 0 & 1\\end{pmatrix}$.",
          "Insert the joint angles and you have the pose: forward kinematics is just evaluation — a map $f: C \\subseteq \\mathbb R^n \\to X \\subseteq \\mathbb R^m$.",
        ])}
        <div class="card">
          <h3>Example 1: planar robot in the xy-plane</h3>
          <p class="small">All $z$ axes are parallel ($\\alpha_i = 0$), no translation in $z$ ($d_i = 0$). DH table: $(a_i, \\alpha_i, d_i, \\theta_i) = (a_i, 0, 0, \\theta_i)$ for $i = 1, 2, 3$, so</p>
          ${tx(`{}^{i-1}T_i = \\begin{pmatrix}c_i & -s_i & 0 & a_ic_i\\\\ s_i & c_i & 0 & a_is_i\\\\ 0&0&1&0\\\\0&0&0&1\\end{pmatrix},\\qquad {}^{0}T_3 = \\begin{pmatrix}c_{123} & -s_{123} & 0 & a_1c_1 + a_2c_{12} + a_3c_{123}\\\\ s_{123} & c_{123} & 0 & a_1s_1 + a_2s_{12} + a_3s_{123}\\\\ 0&0&1&0\\\\0&0&0&1\\end{pmatrix}`)}
          <p class="small">with $c_{123} = \\cos(\\theta_1 + \\theta_2 + \\theta_3)$, $s_{12} = \\sin(\\theta_1 + \\theta_2)$ and so on. Try it in ${rbSee("2.1")}.</p>
          <h3>Example 2: a 3-D robot (R R P)</h3>
          <table class="len-terms"><thead><tr><th>Joint</th><th>$a_i$</th><th>$\\alpha_i$</th><th>$d_i$</th><th>$\\theta_i$</th></tr></thead><tbody>
            <tr><td>1</td><td>0</td><td>−90°</td><td>0</td><td>$\\theta_1$</td></tr><tr><td>2</td><td>0</td><td>90°</td><td>$d_2$</td><td>$\\theta_2$</td></tr><tr><td>3</td><td>0</td><td>0</td><td>$d_3$</td><td>0</td></tr></tbody></table>
          ${tx(`{}^{0}T_1 = \\begin{pmatrix}c_1&0&-s_1&0\\\\ s_1&0&c_1&0\\\\ 0&-1&0&0\\\\0&0&0&1\\end{pmatrix},\\ {}^{1}T_2 = \\begin{pmatrix}c_2&0&s_2&0\\\\ s_2&0&-c_2&0\\\\ 0&1&0&d_2\\\\0&0&0&1\\end{pmatrix},\\ {}^{2}T_3 = \\begin{pmatrix}1&0&0&0\\\\0&1&0&0\\\\0&0&1&d_3\\\\0&0&0&1\\end{pmatrix}`)}
          ${tx(`{}^{0}T_3 = \\begin{pmatrix}c_1c_2 & -s_1 & c_1s_2 & c_1s_2d_3 - s_1d_2\\\\ s_1c_2 & c_1 & s_1s_2 & s_1s_2d_3 + c_1d_2\\\\ -s_2 & 0 & c_2 & c_2d_3\\\\ 0&0&0&1\\end{pmatrix}`)}
        </div>
        ${pw("rrp", `${pslider("t1", "θ₁", -180, 180, 5, 30)}${pslider("t2", "θ₂", -180, 180, 5, 50)}${pslider("d3", "d₃", 0.2, 1.4, 0.05, 0.9)}`, { wide: true })}
        <div class="card">
          <h3>DH notation: the arm of ARMAR-I</h3>
          <table class="len-terms"><thead><tr><th>Joint</th><th>$\\theta_i$ [°]</th><th>$a_i$ [mm]</th><th>$\\alpha_i$ [°]</th><th>$d_i$ [mm]</th></tr></thead><tbody>
            ${[["1", "θ₁", 30, -90, 0], ["2", "θ₂ − 90", 0, -90, 0], ["3", "θ₃ + 90", 0, 90, 223.5], ["4", "θ₄", 0, -90, 0], ["5", "θ₅", 0, 90, 270], ["6", "θ₆ + 90", 0, -90, 0], ["7", "θ₇", 140, 90, 0]]
              .map((r) => `<tr>${r.map((c) => `<td>${typeof c === "number" ? rbN(c, 1) : c}</td>`).join("")}</tr>`).join("")}</tbody></table>
          <p class="small">Seven revolute joints. Offsets like $\\theta_2 - 90$ make the DH zero position match the robot's own zero position.</p>
        </div>
        ${ppTraps([
          "Multiply in the order of the chain, base first: ${}^{0}T_1\\,{}^{1}T_2\\,{}^{2}T_3$, never the other way round.",
          "For the R R P robot, joint 3 is prismatic: $\\theta_3 = 0$ is fixed and $d_3$ is the variable.",
        ])}`,
      setup: (root) => rbWRRP(root),
      check: [
        { q: "How is the pose of the end effector in the base frame computed?", opts: ["${}^{0}T_n = {}^{0}T_1\\,{}^{1}T_2\\cdots{}^{n-1}T_n$", "${}^{0}T_n = {}^{n-1}T_n\\cdots{}^{0}T_1$", "As the sum of all ${}^{i-1}T_i$", "By inverting each ${}^{i-1}T_i$"], why: "Each matrix refers to the frame of the one on its left." },
        { q: "Planar 3R arm: what is the $x$ coordinate of the end effector?", opts: ["$a_1c_1 + a_2c_{12} + a_3c_{123}$", "$a_1c_1 + a_2c_2 + a_3c_3$", "$(a_1 + a_2 + a_3)c_{123}$", "$a_1s_1 + a_2s_{12} + a_3s_{123}$"], why: "The angles add up along the chain: $c_{12} = \\cos(\\theta_1 + \\theta_2)$." },
        { q: "In the planar example, which DH parameters are 0?", opts: ["$\\alpha_i$ and $d_i$", "$a_i$ and $\\theta_i$", "$a_i$ and $d_i$", "Only $\\alpha_i$"], why: "Parallel $z$ axes and no translation in $z$." },
        { q: "R R P robot: what is the $z$ coordinate of the end effector?", opts: ["$c_2d_3$", "$d_2 + d_3$", "$s_2d_3$", "$-s_2$"], why: "Third row, last column of ${}^{0}T_3$." },
      ],
    },
    {
      id: "2.4", title: "The Jacobian", short: "Jacobian", about: "Differential forward kinematics: velocities $\\dot x = J\\dot\\theta$, forces $\\tau = J^\\top F$, geometric columns",
      html: () => `
        ${ppGist([
          "The Jacobian holds all first partial derivatives: $J_f(\\theta) = \\frac{\\partial f}{\\partial\\theta} \\in \\mathbb R^{m\\times n}$, row $i$ for component $f_i$, column $j$ for joint $j$.",
          "${}^{0}T_n$ is a matrix, so use a vector for the pose: position plus roll–pitch–yaw, $f: \\mathbb R^n \\to \\mathbb R^6$ — the <b>analytical</b> Jacobian.",
          "Chain rule along a trajectory $\\theta(t)$: $\\dot x = J(\\theta)\\,\\dot\\theta$. Joint velocities → end-effector velocities (forward), and with $J^{-1}$ or the pseudoinverse back (inverse, chapter 3).",
          "Virtual work (static, no friction): $\\tau^\\top\\dot\\theta = F^\\top\\dot x = F^\\top J\\dot\\theta$ for every $\\dot\\theta$, so $\\boldsymbol{\\tau = J^\\top F}$.",
        ])}
        ${pw("jac", `${pslider("t1", "θ₁", -180, 180, 5, 30)}${pslider("t2", "θ₂", -180, 180, 5, 60)}${pseg("mode", [["v", "velocity"], ["f", "force"]], "v")}
          <div class="rb-mode-v">${pslider("w1", "θ̇₁", -2, 2, 0.1, 1)}${pslider("w2", "θ̇₂", -2, 2, 0.1, 0.5)}</div>
          <div class="rb-mode-f" hidden>${pslider("fx", "Fₓ", -2, 2, 0.1, 0)}${pslider("fy", "F_y", -2, 2, 0.1, -1)}</div>`, { wide: true })}
        <div class="card">
          <h3>The slides' example: two joints</h3>
          ${tx(`x = \\begin{pmatrix} l_1\\cos\\theta_1 + l_2\\cos(\\theta_1 + \\theta_2)\\\\ l_1\\sin\\theta_1 + l_2\\sin(\\theta_1 + \\theta_2)\\end{pmatrix},\\qquad J(\\theta) = \\begin{pmatrix} -l_1\\sin\\theta_1 - l_2\\sin(\\theta_1 + \\theta_2) & -l_2\\sin(\\theta_1 + \\theta_2)\\\\ l_1\\cos\\theta_1 + l_2\\cos(\\theta_1 + \\theta_2) & l_2\\cos(\\theta_1 + \\theta_2)\\end{pmatrix}`)}
          <p class="small">$\\dot x = J_1(\\theta)\\,\\dot\\theta_1 + J_2(\\theta)\\,\\dot\\theta_2$: as long as the two columns are not linearly dependent, $\\dot x$ can point in any direction of the plane.</p>
          <h3>Geometric Jacobian, column by column</h3>
          <p class="small">Joint by joint: column $i$ is the end effector's linear velocity $v$ and angular velocity $\\omega$ when only joint $i$ moves at unit speed.</p>
          ${tx(`\\text{prismatic along } z_{i-1}:\\ J_i = \\begin{pmatrix} z_{i-1}\\\\ 0\\end{pmatrix},\\qquad \\text{revolute about } z_{i-1} \\text{ through } p_{i-1}:\\ J_i = \\begin{pmatrix} z_{i-1}\\times(p - p_{i-1})\\\\ z_{i-1}\\end{pmatrix}`)}
          <p class="small">$p$: position of the end effector; $z_{i-1}$ and $p_{i-1}$ come straight from $\{}^{0}T_{i-1}$. The Jacobian depends on the configuration $\\theta$.</p>
        </div>
        ${rbThink([
          ["Why $J^\\top$ for forces when $J$ maps velocities?", "Power is the same at the joints and at the end effector: $\\tau^\\top\\dot\\theta = F^\\top\\dot x = F^\\top J\\dot\\theta$. Since this holds for every $\\dot\\theta$, $\\tau^\\top = F^\\top J$."],
          ["Which two problems does $\\tau = J^\\top F$ solve?", "Given a force at the end effector: which joint torques resist it? Given joint torques: which force acts on the (fixed) end effector?"],
        ])}
        ${ppTraps([
          "$J$ is $m \\times n$: rows for task coordinates, columns for joints.",
          "Forces use $J^\\top$, not $J^{-1}$.",
          "Revolute column: $z_{i-1} \\times (p - p_{i-1})$ — the lever from the joint <b>to the end effector</b>.",
        ])}`,
      setup: (root) => rbWJac(root),
      check: [
        { q: "How are joint velocities related to end-effector velocities?", opts: ["$\\dot x = J(\\theta)\\,\\dot\\theta$", "$\\dot\\theta = J(\\theta)\\,\\dot x$", "$\\dot x = J^\\top\\dot\\theta$", "$\\dot x = \\dot J\\theta$"], why: "Chain rule: $\\dot x = \\frac{\\partial f}{\\partial\\theta}\\dot\\theta$." },
        { q: "How are end-effector forces related to joint torques?", opts: ["$\\tau = J^\\top F$", "$\\tau = JF$", "$F = J\\tau$", "$\\tau = J^{-1}F$"], why: "Principle of virtual work." },
        { q: "Geometric Jacobian, revolute joint: the linear part of column $i$ is …", opts: ["$z_{i-1} \\times (p - p_{i-1})$", "$z_{i-1}$", "$p - p_{i-1}$", "0"], why: "Its angular part is $z_{i-1}$." },
        { q: "Geometric Jacobian, prismatic joint: the angular part of column $i$ is …", opts: ["0", "$z_{i-1}$", "$z_{i-1} \\times p$", "1"], why: "A sliding joint does not rotate the end effector: $J_i = (z_{i-1}, 0)$." },
        { q: "What size is the Jacobian of a 7-joint arm for a full 3-D pose?", opts: ["6 × 7", "7 × 6", "7 × 7", "6 × 6"], why: "$m \\times n$ with $m = 6$ task DoF, $n = 7$ joints." },
      ],
    },
    {
      id: "2.5", title: "Singularities and manipulability", short: "Singularities", about: "Rank loss of $J$, the 2-link arm stretched out, the manipulability and force ellipsoids",
      html: () => `
        ${ppGist([
          "A configuration is <b>singular</b> if the robot cannot move instantaneously in one or more directions: the columns of $J$ no longer span the velocity space — $\\operatorname{rank} J(\\theta) < \\min(m, n)$.",
          "Near a singularity, <b>large joint velocities</b> are needed to keep the end effector moving.",
          "2-link arm: $\\det J = l_1l_2\\sin\\theta_2$ — singular at $\\theta_2 = 0$ (stretched) and $\\theta_2 = \\pi$ (folded). With $\\theta_2 = 0$: $J_1 = \\frac{l_1 + l_2}{l_2}J_2$.",
          "<b>Manipulability</b>: how freely the end effector can move, and how close a configuration is to a singularity. The <b>manipulability ellipsoid</b> is the image of the unit sphere $\\|\\dot\\theta\\| = 1$ under $J$.",
        ])}
        ${pw("manip", `${pslider("t1", "θ₁", -180, 180, 5, 20)}${pslider("t2", "θ₂", -180, 180, 5, 90)}${pseg("kind", [["v", "manipulability"], ["f", "force"]], "v")}`, { wide: true })}
        <div class="card">
          <h3>Eigenvalue analysis</h3>
          ${tx(`A(\\theta) = J(\\theta)\\,J(\\theta)^\\top \\in \\mathbb R^{m\\times m},\\qquad A v_i = \\lambda_i v_i,\\qquad \\sigma_i = \\sqrt{\\lambda_i},\\qquad V \\propto \\sqrt{\\lambda_1\\cdots\\lambda_m} = \\sqrt{\\det(JJ^\\top)}`)}
          <p class="small">$A$ is square, symmetric and positive semi-definite — positive definite and invertible if $\\operatorname{rank} J = m$ (not at singularities).
            The ellipsoid's axes point along the eigenvectors $v_i$, with lengths $\\sigma_i$, the singular values of $J$.</p>
          ${ppFacts([
            ["$w_1 = \\sigma_{min}$", "the smallest singular value"],
            ["$w_2 = \\sigma_{min} / \\sigma_{max}$", "the inverse condition number — 1 for a circle"],
            ["$w_3 = \\sqrt{\\det(JJ^\\top)}$", "proportional to the volume of the ellipsoid"],
          ])}
          <p class="small">Uses: compare joint configurations, avoid singularities. The <b>force ellipsoid</b> ($F = J^{-\\top}\\tau$ for $\\|\\tau\\| = 1$) has the same axes with lengths $1/\\sigma_i$.</p>
        </div>
        ${rbThink([
          ["Why is the stretched-out arm singular?", "Both joints move the hand perpendicular to the arm; nothing can move it along the arm. The two Jacobian columns are parallel."],
          ["Is a singularity always bad?", "For moving, yes. For holding: along the collapsed direction the arm can resist a force without any joint torque — your stretched arm carrying a bag."],
        ])}
        ${ppTraps([
          "The rank is compared with $\\min(m, n)$, not with $n$.",
          "$w_3$ uses $\\det(JJ^\\top)$; $\\det J$ alone only exists for square $J$.",
          "Force and manipulability ellipsoids have the same axes, but reciprocal lengths.",
        ])}`,
      setup: (root) => rbWManip(root),
      check: [
        { q: "When is a configuration singular?", opts: ["When $\\operatorname{rank} J(\\theta) < \\min(m, n)$", "When $\\det J > 0$", "When a joint is at its limit", "When $J$ is not square"], why: "Some end-effector velocities can no longer be produced." },
        { q: "2-link arm: where is it singular?", opts: ["$\\theta_2 = 0$ or $\\theta_2 = \\pi$", "$\\theta_1 = 0$", "$\\theta_2 = \\pi/2$", "Never"], why: "$\\det J = l_1l_2\\sin\\theta_2$." },
        { q: "What is the manipulability ellipsoid?", opts: ["The image of the unit sphere of joint velocities under $J$", "The workspace of the robot", "The set of reachable poses", "The unit sphere in task space"], why: "Round: free in all directions; flat: restricted." },
        { q: "Which measure is the inverse condition number?", opts: ["$\\sigma_{min}/\\sigma_{max}$", "$\\sigma_{min}$", "$\\sqrt{\\det(JJ^\\top)}$", "$\\sigma_{max}$"], why: "It is 1 for a circle and 0 at a singularity." },
        { q: "What happens near a singularity when the end effector should keep its speed?", opts: ["Very large joint velocities are needed", "The joints stop", "The Jacobian becomes the identity", "Nothing"], why: "Dividing by a small singular value." },
      ],
    },
    {
      id: "2.6", title: "Reachability and geometric models", short: "Reachability", about: "Joint limits, the 6-D reachability grid, block, edge, volume and collision models",
      html: () => `
        ${ppGist([
          "Joints have limits $\\theta_i \\in [\\theta_{i,min}, \\theta_{i,max}]$ (except continuous joints, as on ARMAR-6), so the robot covers only part of $\\mathbb R^n$ — and the <b>reachable workspace</b> $W_{reachable} \\subset \\mathbb R^6$ shrinks.",
          "<b>Reachability map</b>: a 6-D grid over the workspace. Each cell holds whether some configuration puts the TCP in it (binary) or the best manipulability there.",
          "Built <b>offline</b> in simulation: all joint angles in steps of $\\Delta$ (e.g. 5°), forward kinematics, mark the cell. Online: is a pose reachable? One lookup, $O(1)$ — sort out unreachable grasps fast.",
          "<b>Geometric models</b> describe the shape of bodies: for collision and contact, grasping, motion planning, simulation, visualisation, distances, and forces.",
        ])}
        ${pw("reach", `${pslider("l1", "limit θ₁", 10, 180, 10, 180)}${pslider("l2", "limit θ₂", 10, 180, 10, 150)}${pseg("step", [[5, "Δ = 5°"], [10, "Δ = 10°"], [20, "Δ = 20°"]], 5)}`, { wide: true })}
        <div class="card">
          <h3>Geometric models</h3>
          <p class="small">Classified by space (2-D, 3-D) and by basic primitive (edges / wireframe, surfaces, volumes).</p>
          ${ppFacts([
            ["Block world", "bodies as bounding boxes — the first steps of collision avoidance. 3-D, volumes or surfaces."],
            ["Edge model", "bodies as polygons (edges) — fast visualisation. 3-D, edges or surfaces."],
            ["Volume model", "bodies represented accurately — precise collision detection, animation. 3-D, volume."],
            ["Collision model", "bodies simplified — fast collision detection. 3-D, volume."],
          ])}
        </div>
        ${ppTraps([
          "The grid is built <b>offline</b>; the lookup online is $O(1)$, independent of the number of joints.",
          "A coarse step $\\Delta$ can leave reachable cells empty.",
        ])}`,
      setup: (root) => rbWReach(root),
      check: [
        { q: "How is a reachability map built?", opts: ["Offline: step through joint angles, forward kinematics, mark the TCP's grid cell", "Online with inverse kinematics for every cell", "From the geometric model", "By measuring the real robot"], why: "Then a lookup costs $O(1)$." },
        { q: "What does a cell of the reachability map store?", opts: ["Whether the TCP can be in it, or the best manipulability there", "The joint torques", "The DH parameters", "The collision model"], why: "Binary reachability or e.g. $\\max w_1$." },
        { q: "What is a block world model used for?", opts: ["The first steps of collision avoidance (bounding boxes)", "Precise collision detection", "Animation", "Computing DH parameters"], why: "Volume models are precise; collision models simplified but fast." },
        { q: "Why does the reachable workspace usually not fill the whole circle of the arm's length?", opts: ["Joint angle limits", "Singularities", "The Jacobian", "Gimbal lock"], why: "Narrow the limits in the drawing." },
      ],
    },
  ],
});
