// Robotics I, chapter 1: Mathematical Foundations — pose, DoF and kinematic chains, rotations in
// 2-D and 3-D (SO(3)), concatenation about local or global axes, Euler and roll–pitch–yaw angles and
// gimbal lock, homogeneous transformations (SE(3)), quaternions and SLERP, dual quaternions.

/* ---------------------------------------------------------------- 1.2 Rotations in 2-D */

// A little house to rotate: its outline in its own coordinates.
const RB_HOUSE = [[0, 0], [1, 0], [1, 0.7], [0.5, 1.15], [0, 0.7], [0, 0]];

function rbWRot2(root) {
  const { w, fig, read } = ppW(root, "rot2");
  const st = { phi: 60, c: "o" };
  const draw = () => {
    lenOut(w, "phi", `${st.phi}°`);
    const f = rbRad(st.phi), R = [[Math.cos(f), -Math.sin(f)], [Math.sin(f), Math.cos(f)]];
    const c = st.c === "o" ? [0, 0] : [1, 0.5];
    const map = ([x, y]) => { const v = [x - c[0], y - c[1]]; return [R[0][0] * v[0] + R[0][1] * v[1] + c[0], R[1][0] * v[0] + R[1][1] * v[1] + c[1]]; };
    const P = rbFrame(300, 300, [-2, 2], [-2, 2], { l: 16, r: 10, t: 10, b: 16 });
    const poly = (pts, cls) => `<path d="${pts.map(([x, y], i) => `${i ? "L" : "M"}${P.X(x)},${P.Y(y)}`).join("")}" class="${cls}"/>`;
    const img = RB_HOUSE.map(map);
    const e1 = [R[0][0], R[1][0]], e2 = [R[0][1], R[1][1]];
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 300" role="img" aria-label="Rotation in the plane">
      ${P.axes({ xt: [-1, 1], yt: [-1, 1], xl: "x", yl: "y" })}
      ${poly(RB_HOUSE, "rb-shape ghost")}${poly(img, "rb-shape")}
      ${st.c === "o" ? `${arrowSVG(P.X(0), P.Y(0), P.X(e1[0]), P.Y(e1[1]), "rb-ax rb-ax-x")}${arrowSVG(P.X(0), P.Y(0), P.X(e2[0]), P.Y(e2[1]), "rb-ax rb-ax-y")}
        <text x="${P.X(e1[0] * 1.18)}" y="${P.Y(e1[1] * 1.18) + 4}" text-anchor="middle" class="rb-axt rb-axt-x">Re₁</text><text x="${P.X(e2[0] * 1.2)}" y="${P.Y(e2[1] * 1.2) + 4}" text-anchor="middle" class="rb-axt rb-axt-y">Re₂</text>`
        : `<circle cx="${P.X(c[0])}" cy="${P.Y(c[1])}" r="6" class="rb-center"/><text x="${P.X(c[0]) + 9}" y="${P.Y(c[1]) - 8}" class="rb-jl">c</text>
           <circle cx="${P.X(0)}" cy="${P.Y(0)}" r="4" class="rb-orig"/><circle cx="${P.X(map([0, 0])[0])}" cy="${P.Y(map([0, 0])[1])}" r="5" class="rb-moved"/>
           <text x="${P.X(map([0, 0])[0]) + 8}" y="${P.Y(map([0, 0])[1]) + 4}" class="rb-jl">f(0)</text>`}
      <path d="M${P.X(c[0] + 0.45)},${P.Y(c[1])} A ${P.X(0.45) - P.X(0)} ${P.X(0.45) - P.X(0)} 0 ${Math.abs(st.phi) > 180 ? 1 : 0} ${st.phi >= 0 ? 0 : 1} ${P.X(c[0] + 0.45 * Math.cos(f))},${P.Y(c[1] + 0.45 * Math.sin(f))}" class="rb-arc"/>
    </svg>`;
    const shift = [c[0] - (R[0][0] * c[0] + R[0][1] * c[1]), c[1] - (R[1][0] * c[0] + R[1][1] * c[1])];
    read.innerHTML = `<div class="nm-tex">$$R(${st.phi}°) = ${rbTex(R)}$$</div>
      ${st.c === "o" ? `<p class="small">The columns of $R$ are where $e_1 = (1, 0)$ and $e_2 = (0, 1)$ go: $(\\cos\\varphi, \\sin\\varphi)$ and $(-\\sin\\varphi, \\cos\\varphi)$. The origin stays put — a <b>linear</b> map. $\\det R = 1$, $R^\\top R = I$.</p>`
        : `<div class="nm-tex">$$f(x) = R(x - c) + c = Rx + ${rbTexV(shift)}$$</div>
           <p class="small">Shift $c$ to the origin, rotate, shift back. The origin moves to $f(0) = (${rt(shift[0], 2)}, ${rt(shift[1], 2)})$: not linear but <b>affine</b>, $Ax + t$.</p>`}`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.3 Concatenation in 3-D */

const RB_AX_R = { x: rbRx, y: rbRy, z: rbRz };
function rbWConcat(root) {
  const { w, fig, read } = ppW(root, "concat");
  const st = { a1: "y", g1: -90, a2: "z", g2: 180, how: "local", k: 2 };
  const draw = () => {
    const R1 = RB_AX_R[st.a1](rbRad(st.g1)), R2 = RB_AX_R[st.a2](rbRad(st.g2));
    const steps = [rbI(3), R1, st.how === "local" ? rbMul(R1, R2) : rbMul(R2, R1)];
    const R = steps[st.k];
    const V = rbView(150, 150, 95);
    const p = [1, 2, 3], q = rbMv(R, p);
    const prime = st.how === "local" ? ["", "′", "″"] : ["", "", ""];
    fig.innerHTML = `<div class="gk-two"><svg class="lw-svg" viewBox="0 0 300 290" role="img" aria-label="Frame after the rotations">
        ${V.frame(rbH(rbI(3)), 1, "", { dim: true })}
        ${V.frame(rbH(R), 1, "", { sub: prime[st.k] })}
      </svg>
      <div class="rb-steps">${["start", `${st.how === "local" ? "about the local" : "about the global"} ${st.a1}: ${st.g1}°`, `${st.how === "local" ? `about the new ${st.a2}${prime[1]}` : `about the global ${st.a2}`}: ${st.g2}°`]
        .map((t, i) => `<button type="button" class="btn ${i === st.k ? "primary" : ""}" data-k="${i}">${i}. ${t}</button>`).join("")}</div></div>`;
    $$("[data-k]", fig).forEach((b) => (b.onclick = () => { st.k = +b.dataset.k; draw(); }));
    const name = (a, g) => `R_{${a}}(${g}°)`;
    const prod = st.how === "local" ? `${name(st.a1, st.g1)}\\,${name(st.a2, st.g2)}` : `${name(st.a2, st.g2)}\\,${name(st.a1, st.g1)}`;
    read.innerHTML = `<div class="nm-tex">$$R = ${prod} = ${rbTex(steps[2], 2)}$$</div>
      <div class="nm-tex">$$R\\,${rbTexV(p, 0)} = ${rbTexV(rbMv(steps[2], p), 2)}$$</div>
      <p class="small">${st.how === "local"
        ? "Local (moving) axes: each new rotation is multiplied on the <b>right</b> — read the product left to right."
        : "Global (fixed) axes: each new rotation is multiplied on the <b>left</b> — read the product right to left."}
        Shown: step ${st.k}${st.k ? `, $R\\,(1, 2, 3)^\\top = (${q.map((x) => rt(x, 2)).join(", ")})^\\top$` : ""}.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.4 Roll, pitch, yaw */

function rbWRPY(root) {
  const { w, fig, read } = ppW(root, "rpy");
  const st = { r: 30, p: 0, y: 40 };
  const draw = () => {
    ["r", "p", "y"].forEach((k) => lenOut(w, k, `${st[k]}°`));
    const a = rbRad(st.r), b = rbRad(st.p), g = rbRad(st.y);
    const R = rbMul(rbRz(g), rbMul(rbRy(b), rbRx(a)));
    const V = rbView(150, 155, 90);
    // A little plane along its x axis, wings along y.
    const body = [[1.1, 0, 0], [-0.8, 0, 0]], wing = [[0.1, -0.9, 0], [0.25, 0, 0], [0.1, 0.9, 0], [-0.2, 0, 0]], tail = [[-0.8, 0, 0], [-0.9, 0, 0.35], [-0.6, 0, 0]];
    const path = (pts, close) => pts.map((v, i) => { const [x, y] = V.p(rbMv(R, v)); return `${i ? "L" : "M"}${x},${y}`; }).join("") + (close ? "Z" : "");
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 300" role="img" aria-label="Roll, pitch and yaw">
      ${V.frame(rbH(rbI(3)), 1.15, "", { dim: true })}
      <path d="${path(wing, true)}" class="rb-plane"/><path d="${path(tail, true)}" class="rb-plane"/><path d="${path(body)}" class="rb-plane-b"/>
      ${V.frame(rbH(R), 0.75)}
    </svg>`;
    const lock = Math.abs(Math.abs(st.p) - 90) < 0.5;
    read.innerHTML = `<div class="nm-tex">$$R_{RPY} = R_z(${st.y}°)\\,R_y(${st.p}°)\\,R_x(${st.r}°) = ${rbTex(R, 2)}$$</div>
      <p class="small">${lock
        ? `<b class="rb-err-t">Gimbal lock.</b> With $\\beta = ${st.p}°$ the first and last rotation turn about the same axis: only $${st.p > 0 ? "\\alpha - \\gamma" : "\\alpha + \\gamma"} = ${st.p > 0 ? st.r - st.y : st.r + st.y}°$ matters. Move roll or yaw — the same motion. One DoF is lost.`
        : "Roll about the fixed x axis first, then pitch about the fixed y, then yaw about the fixed z: multiplied right to left. Set pitch to ±90° and compare roll with yaw."}</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.5 Homogeneous transformations (2-D) */

function rbWHom(root) {
  const { w, fig, read } = ppW(root, "hom");
  const st = { tx: 1.5, ty: 0.8, phi: 30, h: 1 };
  const draw = () => {
    lenOut(w, "tx", rbN(st.tx, 1)); lenOut(w, "ty", rbN(st.ty, 1)); lenOut(w, "phi", `${st.phi}°`);
    const f = rbRad(st.phi), c = Math.cos(f), s = Math.sin(f);
    const T = [[c, -s, st.tx], [s, c, st.ty], [0, 0, 1]];
    const Bp = [1, 0.6, st.h], Ap = rbMv(T, Bp);
    const P = rbFrame(300, 270, [-0.6, 3.2], [-0.4, 3], { l: 16, r: 10, t: 10, b: 16 });
    const fr = (o, a, lab) => `${arrowSVG(P.X(o[0]), P.Y(o[1]), P.X(o[0] + 0.8 * Math.cos(a)), P.Y(o[1] + 0.8 * Math.sin(a)), "rb-ax rb-ax-x")}
      ${arrowSVG(P.X(o[0]), P.Y(o[1]), P.X(o[0] - 0.8 * Math.sin(a)), P.Y(o[1] + 0.8 * Math.cos(a)), "rb-ax rb-ax-y")}
      <text x="${P.X(o[0]) - 6}" y="${P.Y(o[1]) + 15}" text-anchor="end" class="rb-fl">${lab}</text>`;
    const pt = st.h ? `<line x1="${P.X(st.tx)}" y1="${P.Y(st.ty)}" x2="${P.X(Ap[0])}" y2="${P.Y(Ap[1])}" class="guide"/>
        <line x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(Ap[0])}" y2="${P.Y(Ap[1])}" class="guide"/>
        <circle cx="${P.X(Ap[0])}" cy="${P.Y(Ap[1])}" r="6" class="rb-goal"/><text x="${P.X(Ap[0]) + 9}" y="${P.Y(Ap[1]) - 7}" class="rb-jl">p</text>`
      : `${arrowSVG(P.X(st.tx), P.Y(st.ty), P.X(st.tx + Ap[0]), P.Y(st.ty + Ap[1]), "rb-dir")}${arrowSVG(P.X(0), P.Y(0), P.X(Ap[0]), P.Y(Ap[1]), "rb-dir")}
         <text x="${P.X(Ap[0] / 2) + 6}" y="${P.Y(Ap[1] / 2) - 6}" class="rb-jl">v</text>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 270" role="img" aria-label="Frame B in frame A">
      ${fr([0, 0], 0, "A")}
      <line x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(st.tx)}" y2="${P.Y(st.ty)}" class="rb-t"/><text x="${P.X(st.tx / 2) - 4}" y="${P.Y(st.ty / 2) - 6}" text-anchor="end" class="rb-jl">t</text>
      ${fr([st.tx, st.ty], f, "B")}${pt}
    </svg>`;
    const Ti = [[c, s, -(c * st.tx + s * st.ty)], [-s, c, s * st.tx - c * st.ty], [0, 0, 1]];
    read.innerHTML = `<div class="nm-tex">$${"${}^{A}"}T_B = ${rbTex(T, 2)},\\quad {}^{A}\\tilde p = {}^{A}T_B\\,${rbTexV(Bp, 1)} = ${rbTexV(Ap, 2)}$$</div>
      <div class="nm-tex">$$({}^{A}T_B)^{-1} = \\begin{pmatrix}R^\\top & -R^\\top t\\\\ 0 & 1\\end{pmatrix} = ${rbTex(Ti, 2)}$$</div>
      <p class="small">${st.h ? "A <b>point</b> ($h = 1$) is rotated and moved by $t$." : "A <b>direction</b> ($h = 0$) is only rotated: the last column of $T$ is multiplied by 0, the translation has no effect."}
        Here in 2-D the matrix is 3 × 3; in 3-D it is 4 × 4.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 1.6 Quaternions */

// Quaternions as [s, x, y, z].
const rbQm = ([a, b, c, d], [e, f, g, h]) => [a * e - b * f - c * g - d * h, a * f + b * e + c * h - d * g, a * g - b * h + c * e + d * f, a * h + b * g - c * f + d * e];
const rbQc = ([s, x, y, z]) => [s, -x, -y, -z];
const rbQTex = (q, d = 3) => {
  const parts = q.map((v, i) => [v, ["", "i", "j", "k"][i]]).filter(([v]) => Math.abs(v) > 5e-4);
  if (!parts.length) return "0";
  return parts.map(([v, u], i) => `${v < 0 ? "-" : i ? "+" : ""}${Math.abs(Math.abs(v) - 1) < 5e-4 && u ? "" : rt(Math.abs(v), d)}${u}`).join(" ");
};
const RB_QAX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

function rbWQuat(root) {
  const { w, fig, read } = ppW(root, "quat");
  const st = { ax: "x", th: 90, neg: 0 };
  const draw = () => {
    lenOut(w, "th", `${st.th}°`);
    const n = RB_QAX[st.ax], h = rbRad(st.th) / 2;
    let q = [Math.cos(h), ...n.map((c) => c * Math.sin(h))];
    if (st.neg) q = q.map((c) => -c);
    const p = [0, 1, 0, 9], qp = rbQm(q, p), r = rbQm(qp, rbQc(q));
    const V = rbView(150, 150, 12);
    const P0 = V.p([1, 0, 9]), P1 = V.p(r.slice(1));
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 290" role="img" aria-label="Rotating a point with a quaternion">
      ${V.frame(rbH(rbI(3)), 10)}
      ${(() => { const [ex, ey] = V.p(n.map((c) => c * 11)); const [ox, oy] = V.p([0, 0, 0]); return `<line x1="${ox - (ex - ox)}" y1="${oy - (ey - oy)}" x2="${ex}" y2="${ey}" class="rb-axis"/>`; })()}
      <circle cx="${P0[0]}" cy="${P0[1]}" r="6" class="rb-orig"/><text x="${P0[0] + 9}" y="${P0[1] - 6}" class="rb-jl">p</text>
      <circle cx="${P1[0]}" cy="${P1[1]}" r="7" class="rb-goal"/><text x="${P1[0] + 9}" y="${P1[1] - 6}" class="rb-jl">p′</text>
    </svg>`;
    read.innerHTML = `<div class="nm-tex">$$q = \\Big(\\cos\\tfrac{${st.th}°}{2},\\ n\\sin\\tfrac{${st.th}°}{2}\\Big)${st.neg ? "\\cdot(-1)" : ""} = ${rbQTex(q)}$$</div>
      <div class="nm-tex">$$p = ${rbQTex(p)},\\qquad q\\,p = ${rbQTex(qp)}$$</div>
      <div class="nm-tex">$$p' = q\\,p\\,\\bar q = ${rbQTex(r)}\\ \\Rightarrow\\ (${r.slice(1).map((x) => rt(x, 3)).join(", ")})$$</div>
      <p class="small">$|q| = 1$, so $q^{-1} = \\bar q$. ${st.neg ? "With $-q$ both signs cancel: the same $p'$ — every rotation has two unit quaternions." : "Try “−q”: the result does not change."}
        The slides' example: $p = (1, 0, 9)$, 90° about $x$ gives $(1, -9, 0)$.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

const RB_REPS = [
  ["Rotation matrix + vector", "9 + 3", "Natural (linear algebra), unique, continuous, easy to apply", "Redundant (6 constraints), vector and matrix handled separately, hard to interpolate"],
  ["Euler / RPY angles", "3", "Compact, descriptive", "Not unique, not continuous, gimbal lock"],
  ["Homogeneous 4 × 4", "12 (of 16)", "Rotation and translation in one product; chains by multiplication", "Redundant, matrix products are expensive"],
  ["Quaternion", "4", "Compact, no gimbal lock, continuous, SLERP", "Rotation only; $q$ and $-q$ give the same rotation"],
  ["Dual quaternion", "8", "The whole pose, few operations per step", "Hard to write down by hand, complex multiplication rules"],
];

ROB_CHAPTERS.push({
  n: 1, title: "Mathematical Foundations",
  headline: "Where is the juice — and <span class=\"accent\">which way does it face?</span>",
  intro: "To fetch a box of apple juice the robot must describe positions and orientations relative to the camera, the shoulder, the base or the kitchen. This chapter builds the tools: rotations, frames and homogeneous transformations, Euler angles and their traps, quaternions and dual quaternions.",
  sections: [
    {
      id: "1.1", title: "Pose, degrees of freedom and kinematic chains", short: "Pose & DoF", about: "Kinematics, statics, dynamics; DoF; open and closed chains; rigid bodies, SO(3) and SE(3)",
      html: () => `
        ${ppGist([
          "<b>Kinematics</b>: motion from geometry alone, without forces — the key concept is the <b>pose</b> (position + orientation). <b>Statics</b>: forces and torques at rest (equilibrium). <b>Dynamics</b>: forces and torques and the motion they produce.",
          "<b>Degrees of freedom</b>: independent parameters needed to fix position and orientation. Point in the plane 2, point in space 3, rigid body in the plane 3, rigid body in space <b>6</b>.",
          "<b>Kinematic chain</b>: links connected by joints. <b>Open</b> — no loops: serial (a robot arm) or branched (hand, human body, humanoid). <b>Closed</b> — contains loops (parallel robots).",
          "A <b>rigid body</b> keeps all distances and stays right-handed. Rotations form $SO(3)$, rigid body motions $SE(3)$: pairs $(p, R)$ with $p \\in \\mathbb R^3$, $R \\in SO(3)$.",
        ])}
        <div class="card">
          <h3>Notation in the lecture</h3>
          ${ppFacts([
            ["Scalars", "lower-case Latin letters: $a$, $b$"],
            ["Vectors", "bold lower-case: $\\mathbf u, \\mathbf v \\in \\mathbb R^3$"],
            ["Matrices", "upper-case Latin: $A \\in \\mathbb R^{3\\times3}$"],
            ["Linear maps", "upper-case Greek: $\\Phi(x): \\mathbb R^3 \\to \\mathbb R^3$"],
          ])}
          <h3>$SO(3)$ and $SE(3)$</h3>
          ${tx(`SO(3) = \\{R \\in \\mathbb R^{3\\times3} : R R^\\top = I,\\ \\det R = 1\\},\\qquad SE(3) = \\{(p, R) : p \\in \\mathbb R^3,\\ R \\in SO(3)\\}`)}
          <p class="small">A rigid body motion is fixed by the motion of <b>one point</b> plus the rotation of a body-fixed frame. In a pure translation all points have the same velocity.
            Frames are <b>orthonormal</b> and <b>right-handed</b>: thumb $x$, index finger $y$, middle finger $z$ — and $x \\times y = z$.</p>
        </div>
        ${rbThink([
          ["How many DoF does a rigid body need in space, and why?", "6: three for the position of one point and three for the orientation of a body-fixed frame around it."],
          ["Is a humanoid's kinematic chain open or closed?", "Open and branched: from the torso, branches lead to the arms, the head and the legs — no loops, as long as it does not hold something with both hands or stand on both feet."],
        ])}
        ${ppTraps([
          "A rigid body in the <b>plane</b> has 3 DoF (x, y, angle), not 2.",
          "A serial arm and a humanoid are both <b>open</b> chains; closed means loops (parallel robots).",
          "Kinematics ignores forces; that they are there is a matter for dynamics.",
        ])}`,
      check: [
        { q: "How many DoF does a rigid body have in 3-D space?", opts: ["6", "3", "9", "12"], why: "3 for position + 3 for orientation." },
        { q: "How many DoF does a rigid body moving in a plane have?", opts: ["3", "2", "6", "1"], why: "x, y and one angle." },
        { q: "Which kinematic chain is closed?", opts: ["A parallel robot", "A serial robot arm", "The human hand", "A humanoid robot's arms"], why: "Closed chains contain loops; serial and branched chains are open." },
        { q: "What does kinematics study?", opts: ["Motion from geometry alone, without forces", "Forces at rest", "The relation of forces and motion", "The shape of bodies"], why: "Statics: forces at rest. Dynamics: forces and the motion they cause." },
        { q: "Which conditions define $R \\in SO(3)$?", opts: ["$RR^\\top = I$ and $\\det R = 1$", "$RR^\\top = I$ only", "$\\det R = 1$ only", "$R = R^\\top$"], why: "Orthogonal ($\\det = \\pm1$) and $\\det = +1$: handedness is kept, no reflection." },
      ],
    },
    {
      id: "1.2", title: "Rotations in 2-D and affine maps", short: "2-D rotations", about: "The rotation matrix, its inverse, rotation about a point, affine transformations",
      html: () => `
        ${ppGist([
          "A rotation by $\\varphi$ about the origin is <b>linear</b>: $(1, 0) \\mapsto (\\cos\\varphi, \\sin\\varphi)$, $(0, 1) \\mapsto (-\\sin\\varphi, \\cos\\varphi)$ — those are the columns of $R$.",
          "$R^\\top R = RR^\\top = I$, $\\det R = 1$, so $R^{-1} = R^\\top$.",
          "Rotating about another point $c$ is <b>not</b> linear: shift by $-c$, rotate, shift by $+c$: $f(x) = Rx + (c - Rc)$. Maps $Ax + t$ are <b>affine</b>.",
        ])}
        ${tx(`R(\\varphi) = \\begin{pmatrix}\\cos\\varphi & -\\sin\\varphi\\\\ \\sin\\varphi & \\cos\\varphi\\end{pmatrix},\\qquad f_{c,\\varphi}(x) = R\\,(x - c) + c`)}
        ${pw("rot2", `${pslider("phi", "angle φ", -180, 180, 5, 60)}${pseg("c", [["o", "about the origin"], ["c", "about c = (1, 0.5)"]], "o")}`, { wide: true })}
        <div class="card">
          <h3>Endomorphisms and isomorphisms</h3>
          <p class="small">A linear map of $\\mathbb R^3$ onto itself (an <b>endomorphism</b>) is a square matrix $A$. It sends the basis vectors to $A$'s columns and converts coordinates
            in the new basis to the old one; the way back is $A^{-1}$. Bijective endomorphisms are <b>isomorphisms</b>. Some keep angles (scaling, rotation), some lengths (rotation),
            some handedness (rotation). The ones that keep all three are the rotations: $SO(3)$.</p>
        </div>
        ${ppTraps([
          "$R(x - c) + c$ is not $R(x) + c$: the shift is $c - Rc$.",
          "A reflection also has $R^\\top R = I$ but $\\det R = -1$ — it is not in $SO$.",
        ])}`,
      setup: (root) => rbWRot2(root),
      check: [
        { q: "What is the first column of $R(\\varphi)$ in 2-D?", opts: ["$(\\cos\\varphi, \\sin\\varphi)^\\top$", "$(\\cos\\varphi, -\\sin\\varphi)^\\top$", "$(-\\sin\\varphi, \\cos\\varphi)^\\top$", "$(\\sin\\varphi, \\cos\\varphi)^\\top$"], why: "The image of $e_1 = (1, 0)$." },
        { q: "What is $R^{-1}$ for a rotation matrix?", opts: ["$R^\\top$", "$-R$", "$R$", "$\\frac1{\\det R}R$"], why: "Orthogonal matrices: inverse = transpose." },
        { q: "Rotation by $\\varphi$ about a point $c \\ne 0$ is …", opts: ["affine: $Rx + (c - Rc)$", "linear", "a pure translation", "a reflection"], why: "The origin moves to $c - Rc$, so it cannot be linear." },
        { q: "Which property separates a rotation from a reflection?", opts: ["$\\det = +1$ instead of $-1$", "$R^\\top R = I$", "Lengths are kept", "Angles are kept"], why: "Both are orthogonal; only rotations keep the handedness." },
      ],
    },
    {
      id: "1.3", title: "Rotations in 3-D and concatenation", short: "3-D rotations", about: "$R_x$, $R_y$, $R_z$; non-commutative; local axes multiply right, global axes left",
      html: () => `
        ${ppGist([
          "A 2-D rotation in the xy-plane is a 3-D rotation about $z$: the 2 × 2 block, a 1 for $z$, zeros elsewhere. The same for $x$ and $y$.",
          "$SO(3)$ is <b>not commutative</b>: $R_1R_2 \\ne R_2R_1$ in general.",
          "One product, two readings. <b>Left to right</b>: rotations about the <b>local</b> (moving) axes. <b>Right to left</b>: rotations about the <b>global</b> (fixed) axes.",
        ])}
        ${tx(`R_x(\\alpha) = \\begin{pmatrix}1&0&0\\\\0&\\cos\\alpha&-\\sin\\alpha\\\\0&\\sin\\alpha&\\cos\\alpha\\end{pmatrix},\\ R_y(\\beta) = \\begin{pmatrix}\\cos\\beta&0&\\sin\\beta\\\\0&1&0\\\\-\\sin\\beta&0&\\cos\\beta\\end{pmatrix},\\ R_z(\\gamma) = \\begin{pmatrix}\\cos\\gamma&-\\sin\\gamma&0\\\\ \\sin\\gamma&\\cos\\gamma&0\\\\0&0&1\\end{pmatrix}`)}
        ${pw("concat", `<div class="rb-ctl-row"><span class="small muted">first</span>${pseg("a1", [["x", "x"], ["y", "y"], ["z", "z"]], "y")}${pseg("g1", [[-90, "−90°"], [90, "90°"], [180, "180°"]], -90)}</div>
          <div class="rb-ctl-row"><span class="small muted">then</span>${pseg("a2", [["x", "x"], ["y", "y"], ["z", "z"]], "z")}${pseg("g2", [[-90, "−90°"], [90, "90°"], [180, "180°"]], 180)}</div>
          ${pseg("how", [["local", "local axes"], ["global", "global axes"]], "local")}`, { wide: true })}
        <div class="card">
          <h3>The slides' example</h3>
          <p class="small">First $-90°$ about $y$, then $180°$ about the <b>new</b> $z'$ axis — local axes, so multiply left to right:</p>
          ${tx(`R = R_y(-\\tfrac\\pi2)\\,R_{z}(\\pi) = \\begin{pmatrix}0&0&-1\\\\0&1&0\\\\1&0&0\\end{pmatrix}\\begin{pmatrix}-1&0&0\\\\0&-1&0\\\\0&0&1\\end{pmatrix} = \\begin{pmatrix}0&0&-1\\\\0&-1&0\\\\-1&0&0\\end{pmatrix},\\qquad R\\begin{pmatrix}1\\\\2\\\\3\\end{pmatrix} = \\begin{pmatrix}-3\\\\-2\\\\-1\\end{pmatrix}`)}
          <p class="small">The robot's hand, with orientation $R_{TCP}$ in the global frame: turning it about a <b>global</b> axis is $R_{new} = R_z\\,R_{TCP}$ (from the left);
            about its <b>own</b> z axis it is $R_{new} = R_{TCP}\\,R_z$ (from the right).</p>
        </div>
        ${rbThink([
          ["Why is $R_1(R_2(R_3(x)))$ the same matrix whether you think in local or global axes?", "It is one product $R_1R_2R_3$. Read right to left, $R_3$ acts first about the fixed axes; read left to right, $R_1$ acts first and each following rotation is about the axes the previous ones produced."],
        ])}
        ${ppTraps([
          "$R_y$ has $+\\sin\\beta$ <b>top right</b> and $-\\sin\\beta$ bottom left — the other way round from $R_x$ and $R_z$.",
          "Local axes: multiply new rotations on the <b>right</b>. Global axes: on the <b>left</b>.",
        ])}`,
      setup: (root) => rbWConcat(root),
      check: [
        { q: "A new rotation about the robot hand's <b>own</b> (local) z axis: how is it multiplied onto $R_{TCP}$?", opts: ["From the right: $R_{TCP}R_z$", "From the left: $R_zR_{TCP}$", "It does not matter", "Transposed: $R_z^\\top R_{TCP}$"], why: "Local, moving axes: left to right, the new factor goes on the right." },
        { q: "Read right to left, $R = R_3R_2R_1$ means …", opts: ["first $R_1$, then $R_2$, then $R_3$, all about the fixed global axes", "first $R_3$ about the global axes", "the rotations about the local axes in the order $R_1, R_2, R_3$", "nothing — the order does not matter"], why: "Right to left: global axes, $R_1$ acts first." },
        { q: "Where is the $-\\sin$ in $R_y(\\beta)$?", opts: ["Bottom left (row 3, column 1)", "Top right (row 1, column 3)", "Row 2, column 3", "On the diagonal"], why: "$R_y = \\begin{pmatrix}c&0&s\\\\0&1&0\\\\-s&0&c\\end{pmatrix}$." },
        { q: "$R_y(-\\pi/2)\\,R_z(\\pi)$ applied to $(1, 2, 3)$ gives …", opts: ["$(-3, -2, -1)$", "$(3, -2, 1)$", "$(-1, -2, 3)$", "$(1, 2, 3)$"], why: "The product is $\\begin{pmatrix}0&0&-1\\\\0&-1&0\\\\-1&0&0\\end{pmatrix}$." },
        { q: "Is $SO(3)$ commutative?", opts: ["No, in general $R_1R_2 \\ne R_2R_1$", "Yes", "Only for rotations by 180°", "Only in 3-D"], why: "Try it in the drawing: swap local and global." },
      ],
    },
    {
      id: "1.4", title: "Euler angles, roll–pitch–yaw and gimbal lock", short: "Euler & RPY", about: "Three angles for a rotation; 24 conventions; not unique, not continuous, gimbal lock",
      html: () => `
        ${ppGist([
          "Every rotation can be written as <b>three rotations</b> about coordinate axes; two successive ones must not use the same axis. 12 axis sequences × (local or fixed) = <b>24 conventions</b>.",
          "<b>Euler ZY′Z″</b> (a common convention): $\\alpha$ about $z$, $\\beta$ about the new $y'$, $\\gamma$ about the new $z''$ — local axes, $R = R_z(\\alpha)R_{y'}(\\beta)R_{z''}(\\gamma)$.",
          "<b>Roll–pitch–yaw</b>: about the <b>fixed</b> axes X (roll α), Y (pitch β), Z (yaw γ): $R_{RPY} = R_z(\\gamma)R_y(\\beta)R_x(\\alpha)$ — the same as Euler ZY′X″ with the angles in reverse order.",
          "Compact and descriptive, but <b>not unique</b> and <b>not continuous</b>; at certain angles two axes line up — <b>gimbal lock</b>: one DoF is lost.",
        ])}
        ${pw("rpy", `${pslider("r", "roll α (x)", -180, 180, 5, 30)}${pslider("p", "pitch β (y)", -90, 90, 5, 0)}${pslider("y", "yaw γ (z)", -180, 180, 5, 40)}`, { wide: true })}
        <div class="card">
          <h3>Gimbal lock, worked out</h3>
          <p class="small">With pitch $\\beta = -\\frac\\pi2$, $\\sin\\beta = -1$, $\\cos\\beta = 0$:</p>
          ${tx(`R = R_z(\\gamma)\\,R_y(-\\tfrac\\pi2)\\,R_x(\\alpha) = \\begin{pmatrix}0 & -\\sin(\\alpha+\\gamma) & -\\cos(\\alpha+\\gamma)\\\\ 0 & \\cos(\\alpha+\\gamma) & -\\sin(\\alpha+\\gamma)\\\\ 1 & 0 & 0\\end{pmatrix}`)}
          <p class="small">Only $\\alpha + \\gamma$ appears: roll and yaw now turn about the same axis and have the same effect. In a gimbal (cardanic bearing — gyroscopes, compasses) three rings become two:
            no instantaneous motion is possible in the lost direction.</p>
          <h3>Not unique, not continuous</h3>
          <p class="small">In ZYZ, $(45°, 30°, -45°)$ and $(225°, -30°, 135°)$ are the same rotation. A continuous rotation can make the angles jump; small changes in orientation can mean
            huge changes in the angles — so you cannot interpolate smoothly between two sets of Euler angles.</p>
          <table class="len-terms"><thead><tr><th>Euler angles $(\\alpha, \\beta, \\gamma)$</th><th>Roll–pitch–yaw $(\\alpha, \\beta, \\gamma)$</th></tr></thead><tbody>
            <tr><td>multiplied left to right: $R_z(\\alpha)R_{y'}(\\beta)R_{z''}(\\gamma)$</td><td>multiplied right to left: $R_z(\\gamma)R_y(\\beta)R_x(\\alpha)$</td></tr>
            <tr><td>each rotation is local: about the moving, body-fixed axes</td><td>each rotation is global: about the fixed axes</td></tr></tbody></table>
        </div>
        ${rbThink([
          ["Why can't a neural network simply predict the 9 entries of a rotation matrix?", "Predicted independently, the 9 numbers will almost never satisfy the 6 orthogonality constraints and $\\det = 1$: the result is not a rotation. Use another representation or orthonormalise afterwards."],
          ["Rotation matrices vs. Euler angles in one line each?", "Matrices: natural, unique and continuous, but 9 values for 3 DoF. Euler angles: compact and meaningful, but ambiguous, discontinuous, with gimbal lock."],
        ])}
        ${ppTraps([
          "RPY rotates about <b>fixed</b> axes and is multiplied <b>right to left</b>; Euler angles about <b>moving</b> axes, left to right.",
          "Gimbal lock is a property of the <b>angle representation</b>, not of the rotation itself — the matrix is perfectly fine there.",
        ])}`,
      setup: (root) => rbWRPY(root),
      check: [
        { q: "How many Euler / fixed-angle conventions are there?", opts: ["24 (12 sequences, local or fixed)", "12", "6", "3"], why: "XYZ, XZY, …, ZYZ …: 12 sequences, each about local or fixed axes." },
        { q: "Roll–pitch–yaw rotates about …", opts: ["the fixed X, Y, Z axes, multiplied right to left", "the moving axes, multiplied left to right", "the same axis three times", "an arbitrary axis"], why: "$R_{RPY} = R_z(\\gamma)R_y(\\beta)R_x(\\alpha)$." },
        { q: "What happens at RPY pitch $\\beta = \\pm 90°$?", opts: ["Gimbal lock: roll and yaw act about the same axis, one DoF is lost", "The matrix is not invertible", "Nothing special", "The rotation becomes a reflection"], why: "The matrix depends only on $\\alpha \\pm \\gamma$." },
        { q: "Why can you not interpolate smoothly between Euler angles?", opts: ["They are not continuous: small changes in orientation can make the angles jump", "They have 9 values", "They are not compact", "They only describe translations"], why: "Use quaternions and SLERP instead (1.6)." },
        { q: "Which is a strength of Euler angles?", opts: ["Compact and descriptive (3 values)", "Unique", "Continuous", "No singularities"], why: "That is all they have going for them." },
      ],
    },
    {
      id: "1.5", title: "Homogeneous transformations", short: "Homogeneous", about: "Points and directions, the 4 × 4 matrix, its inverse, frames, chains of transformations",
      html: () => `
        ${ppGist([
          "Goal: rotation <b>and</b> translation in <b>one</b> matrix product. Append a coordinate: $(x, y, z, h)$ with $h = 1$ for <b>positions</b>, $h = 0$ for <b>directions</b>.",
          "$T = \\begin{pmatrix}R & t\\\\ 0^\\top & 1\\end{pmatrix} \\in SE(3)$, and $T\\tilde x = \\begin{pmatrix}Rx + t\\\\ 1\\end{pmatrix}$.",
          "Inverse: $T^{-1} = \\begin{pmatrix}R^\\top & -R^\\top t\\\\ 0^\\top & 1\\end{pmatrix}$. Chains: ${}^{0}T_n = {}^{0}T_1\\,{}^{1}T_2\\cdots{}^{n-1}T_n$ — each matrix refers to the frame of the one on its left.",
        ])}
        ${pw("hom", `${pslider("tx", "tₓ", -0.5, 2.5, 0.1, 1.5)}${pslider("ty", "t_y", -0.3, 2.2, 0.1, 0.8)}${pslider("phi", "angle φ", -180, 180, 5, 30)}
          ${pseg("h", [[1, "point (h = 1)"], [0, "direction (h = 0)"]], 1)}<p class="small muted">${"$"}{}^{B}p = (1, 0.6)$ in frame B.</p>`, { wide: true })}
        <div class="card">
          <h3>Reading the matrix</h3>
          ${tx(`{}^{A}T_B = \\begin{pmatrix} n_x & o_x & a_x & u_x\\\\ n_y & o_y & a_y & u_y\\\\ n_z & o_z & a_z & u_z\\\\ 0&0&0&1\\end{pmatrix}`)}
          <p class="small">$n$, $o$, $a$ (normal, orientation, approach) are the axes of B written in A, $u$ is B's origin in A. Frames are placed in the base (BCS — or the world),
            at the end effector (ECS) and on objects (OCS). Three ways to read the same matrix:</p>
          ${ppFacts([
            ["Pose", "${}^{A}T_B$ describes the pose of frame B relative to frame A."],
            ["Mapping", "between frames: ${}^{A}p = {}^{A}T_B\\,{}^{B}p$ — the same point, new coordinates."],
            ["Operator", "within one frame: $p_2 = T\\,p_1$ — the point moves."],
          ])}
          <h3>The slides' examples</h3>
          <p class="small">Translate $p = (4, 3, 2)$ and $q = (6, 2, 4)$ by $+5$ in $x$ and $-3$ in $z$: $(9, 3, -1)$ and $(11, 2, 1)$.</p>
          <p class="small">A point in the end effector's frame, $\{}^{ECS}p = (0, -3, 5)^\\top$, with $R = \\begin{pmatrix}0&0&1\\\\1&0&0\\\\0&1&0\\end{pmatrix}$ and $t = (-7, 0, 8)^\\top$:</p>
          ${tx(`{}^{BCS}\\tilde p = \\begin{pmatrix}0&0&1&-7\\\\1&0&0&0\\\\0&1&0&8\\\\0&0&0&1\\end{pmatrix}\\begin{pmatrix}0\\\\-3\\\\5\\\\1\\end{pmatrix} = \\begin{pmatrix}-2\\\\0\\\\5\\\\1\\end{pmatrix}`)}
          <p class="small">Chains: object 3 in the base, $\{}^{BCS}T_3 = {}^{BCS}T_1\\,{}^{1}T_2\\,{}^{2}T_3$. In Cartesian form the same would need $R_{new} = R_1R_2$ and $t_{new} = R_1t_2 + t_1$ separately.</p>
        </div>
        ${rbThink([
          ["How many numbers does a homogeneous transformation hold, and how many are needed?", "12 non-trivial ($R$ and $t$) for 6 DoF. The 9 entries of $R$ satisfy 6 orthogonality constraints plus $\\det R = +1$."],
          ["Derive $T^{-1}$.", "$x' = Rx + t \\Rightarrow x = R^{-1}(x' - t) = R^\\top x' - R^\\top t$."],
        ])}
        ${ppTraps([
          "The inverse's translation is $-R^\\top t$, <b>not</b> $-t$.",
          "Directions get $h = 0$: a translation must not move a velocity or an axis.",
          "In ${}^{A}T_B\\,{}^{B}T_C$ the inner indices must match.",
        ])}`,
      setup: (root) => rbWHom(root),
      check: [
        { q: "What is the inverse of $T = \\begin{pmatrix}R&t\\\\0&1\\end{pmatrix}$?", opts: ["$\\begin{pmatrix}R^\\top & -R^\\top t\\\\0&1\\end{pmatrix}$", "$\\begin{pmatrix}R^\\top & -t\\\\0&1\\end{pmatrix}$", "$\\begin{pmatrix}-R & -t\\\\0&1\\end{pmatrix}$", "$T^\\top$"], why: "From $x = R^\\top(x' - t)$." },
        { q: "Which $h$ does a direction vector get?", opts: ["0 — translations do not affect it", "1", "−1", "Its length"], why: "$h = 1$ for positions, $h = 0$ for directions." },
        { q: "${}^{ECS}p = (0, -3, 5)$, $R = \\begin{pmatrix}0&0&1\\\\1&0&0\\\\0&1&0\\end{pmatrix}$, $t = (-7, 0, 8)$. What is ${}^{BCS}p$?", opts: ["$(-2, 0, 5)$", "$(5, 0, -3)$", "$(-7, -3, 13)$", "$(-2, -3, 5)$"], why: "$Rp = (5, 0, -3)$, plus $t$." },
        { q: "What do the first three columns of ${}^{A}T_B$ contain?", opts: ["The axes of frame B, written in A (n, o, a)", "The axes of A, written in B", "The origin of B", "Euler angles"], why: "The fourth column $u$ is B's origin in A." },
        { q: "How many non-trivial entries does a 4 × 4 homogeneous transformation have?", opts: ["12", "6", "16", "9"], why: "9 for $R$, 3 for $t$; the last row is fixed." },
      ],
    },
    {
      id: "1.6", title: "Quaternions", short: "Quaternions", about: "Hamilton's numbers, product, conjugate, unit quaternions as rotations, SLERP",
      html: () => `
        ${ppGist([
          "Quaternions (Hamilton, 1843) extend the complex numbers: $q = s + v_1i + v_2j + v_3k = (s, v)$ with $i^2 = j^2 = k^2 = ijk = -1$. <b>Not commutative</b>: $ij = k = -ji$.",
          "A rotation by $\\theta$ about the unit axis $n$: $q = (\\cos\\frac\\theta2, n\\sin\\frac\\theta2)$. Rotate a point $x$ written as $p = (0, x)$: $p' = q\\,p\\,\\bar q$.",
          "<b>Unit quaternions</b> lie on the sphere $S^3$ in 4-D and form a group. $q$ and $-q$ are the <b>same</b> rotation. Concatenation = multiplication: first $q_1$, then $q_2$ is $q_2q_1$.",
          "4 numbers instead of 9, no gimbal lock, continuous — smooth interpolation by <b>SLERP</b>. But: rotation only, no translation.",
        ])}
        ${tx(`q_1q_2 = (s_1s_2 - v_1\\cdot v_2,\\ s_1v_2 + s_2v_1 + v_1\\times v_2),\\qquad \\bar q = (s, -v),\\qquad |q|^2 = q\\bar q,\\qquad q^{-1} = \\frac{\\bar q}{|q|^2}`)}
        ${pw("quat", `${pseg("ax", [["x", "axis x"], ["y", "axis y"], ["z", "axis z"]], "x")}${pslider("th", "angle θ", -180, 180, 15, 90)}${pseg("neg", [[0, "q"], [1, "−q"]], 0)}`, { wide: true })}
        <div class="card">
          <h3>SLERP: spherical linear interpolation</h3>
          ${tx(`\\mathrm{Slerp}(q_1, q_2, t) = \\frac{\\sin\\big((1 - t)\\theta\\big)}{\\sin\\theta}\\,q_1 + \\frac{\\sin(t\\theta)}{\\sin\\theta}\\,q_2,\\qquad \\cos\\theta = q_1\\cdot q_2,\\quad t \\in [0, 1]`)}
          <p class="small">Like $(1 - t)\\,a + t\\,b$, but along the great circle on $S^3$: a rotation with <b>constant angular velocity</b>. Because $q$ and $-q$ are the same rotation,
            $S^3$ covers $SO(3)$ twice — check whether $q_1 \\to q_2$ or $q_1 \\to -q_2$ is shorter, otherwise SLERP takes the long way round. (Powers of quaternions, $q_1(q_1^{-1}q_2)^t$, are not covered.)</p>
        </div>
        ${rbThink([
          ["Why is the angle halved in $q = (\\cos\\frac\\theta2, n\\sin\\frac\\theta2)$?", "$q$ is applied twice, $q\\,p\\,\\bar q$: each side turns by half the angle."],
          ["Why do $q$ and $-q$ give the same rotation?", "$(-q)\\,p\\,(\\overline{-q}) = q\\,p\\,\\bar q$ — the two minus signs cancel. Geometrically: $\\theta$ about $n$ equals $360° - \\theta$ about $-n$."],
        ])}
        ${ppTraps([
          "$q_1q_2 \\ne q_2q_1$: the cross product in the formula changes sign.",
          "Only <b>unit</b> quaternions are rotations; then $q^{-1} = \\bar q$.",
          "The axis $n$ must have length 1.",
        ])}`,
      setup: (root) => rbWQuat(root),
      check: [
        { q: "Which quaternion rotates by $\\theta$ about the unit axis $n$?", opts: ["$(\\cos\\frac\\theta2,\\ n\\sin\\frac\\theta2)$", "$(\\cos\\theta,\\ n\\sin\\theta)$", "$(\\sin\\frac\\theta2,\\ n\\cos\\frac\\theta2)$", "$(0, \\theta n)$"], why: "Half angles, because $q$ acts on both sides." },
        { q: "How is a point $x$ rotated with the unit quaternion $q$?", opts: ["$p' = q\\,p\\,\\bar q$ with $p = (0, x)$", "$p' = q\\,p$", "$p' = \\bar q\\,p\\,\\bar q$", "$p' = q + p$"], why: "Conjugation; $\\bar q = q^{-1}$ for unit quaternions." },
        { q: "What is $ij$?", opts: ["$k$", "$-k$", "$-1$", "$1$"], why: "$ij = k$, $ji = -k$." },
        { q: "Why must SLERP check $q_2$ against $-q_2$?", opts: ["Both are the same rotation; one of them gives the shorter path", "Because $-q_2$ is not a unit quaternion", "To avoid gimbal lock", "To turn rotation into translation"], why: "$S^3$ covers $SO(3)$ twice." },
        { q: "What can a (real) quaternion <b>not</b> describe?", opts: ["A translation", "A rotation by 180°", "The inverse rotation", "A concatenation of rotations"], why: "That needs dual quaternions (1.7)." },
      ],
    },
    {
      id: "1.7", title: "Dual quaternions and the choice of representation", short: "Dual quaternions", about: "Dual numbers, a pose in 8 numbers; all representations compared",
      html: () => `
        ${ppGist([
          "<b>Dual numbers</b>: $\\hat a = a_r + \\varepsilon a_d$ with $\\varepsilon^2 = 0$. Sum: $(a_r + b_r) + \\varepsilon(a_d + b_d)$. Product: $a_rb_r + \\varepsilon(a_rb_d + b_ra_d)$.",
          "<b>Dual quaternion</b> $\\hat q = q_r + \\varepsilon q_d$: the real part carries the rotation (angle $/2$), the dual part the translation ($t/2$).",
          "Rotation: $\\hat q_r = (\\cos\\frac\\theta2, n\\sin\\frac\\theta2) + \\varepsilon(0, 0, 0, 0)$. Translation: $\\hat q_t = (1, 0, 0, 0) + \\varepsilon(0, \\frac{t_x}2, \\frac{t_y}2, \\frac{t_z}2)$. Both: $\\hat q = \\hat q_t\\,\\hat q_r$.",
          "A point $\\hat p = 1 + \\varepsilon(0, x)$ is moved by $\\hat p' = \\hat q\\,\\hat p\\,\\bar{\\hat q}^{*}$ — conjugated both as a quaternion and as a dual number.",
        ])}
        <div class="card">
          <h3>The slides' example</h3>
          <p class="small">Rotate $p = (3, 4, 5)$ by $180°$ about $x$, then translate by $t = (4, 2, 6)$:</p>
          ${tx(`\\hat q_r = (\\cos 90°, \\sin 90°\\cdot(1, 0, 0)) = i,\\qquad \\hat q_t = 1 + \\varepsilon(2i + j + 3k)`)}
          ${tx(`\\hat q = \\hat q_t\\,\\hat q_r = i + \\varepsilon(2i + j + 3k)\\,i = i + \\varepsilon(-2 + 3j - k),\\qquad \\hat p' = 1 + \\varepsilon(7i - 2j + k)`)}
          <p class="small">Check: $180°$ about $x$ sends $(3, 4, 5)$ to $(3, -4, -5)$; plus $(4, 2, 6)$ gives <b>$(7, -2, 1)$</b>.</p>
          <h3>All representations compared</h3>
          <table class="len-terms"><thead><tr><th>Representation</th><th>Numbers</th><th>Good</th><th>Bad</th></tr></thead>
            <tbody>${RB_REPS.map((r) => `<tr>${r.map((c, i) => `<td>${i ? c : `<b>${c}</b>`}</td>`).join("")}</tr>`).join("")}</tbody></table>
          <p class="small">Each has its strengths; the application decides.</p>
        </div>
        ${rbThink([
          ["Why does the dual part hold $t/2$ and not $t$?", "Like the half angle: the transformation is applied as $\\hat q\\,\\hat p\\,\\bar{\\hat q}^*$, and both sides contribute half of the translation."],
        ])}
        ${ppTraps([
          "$\\varepsilon^2 = 0$, not $-1$ — dual numbers are not complex numbers.",
          "Order matters: $\\hat q = \\hat q_t\\hat q_r$ rotates first, then translates.",
        ])}`,
      check: [
        { q: "What is $\\varepsilon^2$ for dual numbers?", opts: ["0", "−1", "1", "ε"], why: "That is what makes $(a_r + \\varepsilon a_d)(b_r + \\varepsilon b_d) = a_rb_r + \\varepsilon(a_rb_d + b_ra_d)$." },
        { q: "How many numbers does a dual quaternion need for a pose?", opts: ["8", "12", "4", "6"], why: "Two quaternions; a homogeneous matrix has 12 non-trivial entries." },
        { q: "Where is the translation stored in a dual quaternion?", opts: ["In the dual part, as $t/2$", "In the real part, as $t$", "In the scalar part", "It cannot be stored"], why: "$\\hat q_t = 1 + \\varepsilon(0, t/2)$." },
        { q: "$p = (3, 4, 5)$, rotate by 180° about $x$, then translate by $(4, 2, 6)$:", opts: ["$(7, -2, 1)$", "$(7, 6, 11)$", "$(-1, -2, 1)$", "$(3, -4, -5)$"], why: "$(3, -4, -5) + (4, 2, 6)$." },
        { q: "Which representation has gimbal lock?", opts: ["Euler / RPY angles", "Quaternions", "Rotation matrices", "Dual quaternions"], why: "Only the three-angle representations have it." },
      ],
    },
  ],
});
