// Robotics I exam tasks: whole tasks like the old exams' (rob-exams.js), written in our own words with
// new numbers every time, so you can practise a kind of task without seeing the real one. Used one at
// a time by Practice and put together by the mock exam (rob-practice.js). They cover every topic of
// the exams, not just chapters 0–3.
//
// The format is NuMa's (numa-tasks.js): a generator { id, topic, name, like: "E22_SS_2026/4", make }
// makes { intro: html, parts } with parts made by nmMC (choice, the first is right), nmVal (a number, a
// fraction or a list separated by ";", or letters like "S A C G") and nmW (written, marked by ticking a
// rubric). Numbers are checked within rounding, so 0.866 and 0.87 both count for √3/2.

const ROB_TASKS = [];
const rbTask = (g) => ROB_TASKS.push(g);
const SEP = "separate the values with ;";
const rbR = (x, d = 4) => +(+x).toFixed(d) || 0;
const rbLst = (xs, d = 4) => xs.map((x) => (x instanceof NmQ ? x.toString() : String(rbR(x, d)))).join("; ");
const rbDegs = [0, 30, 45, 60, 90, 120, 135, 150, 180, -30, -45, -60, -90, -120, -135, -150];
// Exact values of cos and sin at multiples of 30° and 45°, for $…$.
function rbEx(v) {
  const s = v < -1e-9 ? "-" : "", a = Math.abs(v);
  const t = [[0, "0"], [0.5, "\\tfrac12"], [Math.SQRT1_2, "\\tfrac{\\sqrt2}{2}"], [Math.sqrt(3) / 2, "\\tfrac{\\sqrt3}{2}"], [1, "1"]].find(([x]) => Math.abs(x - a) < 1e-9);
  return t ? (t[1] === "0" ? "0" : s + t[1]) : rt(v);
}
const rbTexE = (M) => `\\begin{pmatrix}${M.map((r) => r.map(rbEx).join(" & ")).join("\\\\")}\\end{pmatrix}`;
const rbTexI = (M) => `\\begin{pmatrix}${M.map((r) => r.map((x) => rt(Math.abs(x) < 1e-9 ? 0 : x)).join(" & ")).join("\\\\")}\\end{pmatrix}`;
const rbV = (v) => `(${v.map((x) => rt(x)).join(", ")})^\\top`;
const rbDet3 = (M) => M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
const rbClean = (M) => M.map((r) => r.map((x) => Math.round(x * 1e6) / 1e6 || 0));
// A random rotation by multiples of 90°: entries 0 and ±1.
const rbR90 = () => rbClean(rbMul(RB_AX_R[nmPick(["x", "y", "z"])](rbRad(nmPick([90, -90, 180]))), RB_AX_R[nmPick(["x", "y", "z"])](rbRad(nmPick([90, -90, 0])))));
const rbIntV = (n, a, b) => Array.from({ length: n }, () => rint(a, b));
const rbDist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const rbDeg1 = (r) => rbR(rbDeg(r), 2);
const rbAngs = (a) => [a, a + 360, a - 360].map((x) => String(rbR(x, 2)));

/* ================================================================ Rotations & transforms */

rbTask({
  id: "rotcheck", topic: "rot", name: "Is it a rotation matrix?", like: "E19_WS_2024-25/1",
  make() {
    const kind = nmPick(["ok", "ok", "refl", "skew"]);
    let R = rbClean(rbMul(RB_AX_R[nmPick(["x", "y", "z"])](rbRad(nmPick([90, -90, 180]))), RB_AX_R[nmPick(["x", "y", "z"])](Math.atan2(nmPick([0.8, -0.8]), 0.6))));
    R = R.map((r) => r.map((x) => Math.round(x * 10) / 10 || 0));
    if (kind === "refl") { const j = rint(0, 2); R = R.map((r) => r.map((x, k) => (k === j ? -x || 0 : x))); }
    if (kind === "skew") { const z = []; R.forEach((r, i) => r.forEach((x, j) => !x && z.push([i, j]))); const [i, j] = pick(z); R[i][j] = nmPick([0.6, -0.8]); }
    const RtR = rbClean(rbMul(rbT(R), R)), det = rbR(rbDet3(R));
    const opts = {
      ok: "Yes: $R^\\top R = I$ and $\\det R = 1$",
      refl: "No: $R^\\top R = I$, but $\\det R = -1$ — a reflection",
      skew: "No: $R^\\top R \\ne I$ — the columns are not orthonormal",
      pm: "Yes: $\\det R = \\pm 1$ is enough",
    };
    return {
      intro: `<p>Given the matrix</p>${tx(`R = ${rbTexI(R)}`)}`,
      parts: [
        nmVal(`Compute the diagonal of $R^\\top R$: $(R^\\top R)_{11}$; $(R^\\top R)_{22}$; $(R^\\top R)_{33}$ (${SEP}).`, rbLst([RtR[0][0], RtR[1][1], RtR[2][2]]), 1, "Each is the squared length of a column of $R$."),
        nmVal("And the off-diagonal entries $(R^\\top R)_{12}$; $(R^\\top R)_{13}$; $(R^\\top R)_{23}$.", rbLst([RtR[0][1], RtR[0][2], RtR[1][2]]), 1, "Each is the dot product of two columns: 0 if they are perpendicular."),
        nmVal("Compute $\\det R$.", String(det), 1, `$\\det R = ${rt(det)}$ (expand along a row with zeros).`),
        nmMC("Is $R$ a rotation matrix?", [opts[kind], ...["ok", "refl", "skew", "pm"].filter((k) => k !== kind).map((k) => opts[k])], 1, "$R \\in SO(3) \\iff R^\\top R = I$ and $\\det R = +1$."),
        ...(kind === "ok" ? [nmVal("Give the second row of $R^{-1}$.", rbLst(R.map((r) => r[1])), 1, "$R^{-1} = R^\\top$: the second row of $R^{-1}$ is the second column of $R$.")] : []),
      ],
    };
  },
});

rbTask({
  id: "frames", topic: "rot", name: "A point in two frames", like: "E13_WS_2021-22/1",
  make() {
    const R = rbR90(), t = rbIntV(3, -5, 5), bp = rbIntV(3, -3, 3), q = rbIntV(3, -4, 4);
    const ap = rbMv(R, bp).map((x, i) => x + t[i]), ti = rbMv(rbT(R), t).map((x) => -x || 0), bq = rbMv(rbT(R), q.map((x, i) => x - t[i]));
    return {
      intro: `<p>The pose of an object frame B in the base frame A is given by</p>${tx(`R = ${rbTexI(R)},\\qquad t = ${rbV(t)}`)}`,
      parts: [
        nmVal(`A point has the coordinates ${"$"}{}^{B}p = ${rbV(bp)}$ in B. Compute ${"$"}{}^{A}p$ (${SEP}).`, rbLst(ap), 2, `${"$"}{}^{A}p = R\\,{}^{B}p + t = ${rbV(rbMv(R, bp))} + ${rbV(t)} = ${rbV(ap)}$.`),
        nmVal("Give the translation part of $({}^{A}T_B)^{-1}$.", rbLst(ti), 2, `$-R^\\top t = ${rbV(ti)}$ — not simply $-t$.`),
        nmVal(`A point is at ${"$"}{}^{A}q = ${rbV(q)}$ in A. Where is it in B?`, rbLst(bq), 1, `${"$"}{}^{B}q = R^\\top({}^{A}q - t) = ${rbV(bq)}$.`),
        nmMC("What does the first column of $R$ tell you?", ["The direction of B's x axis, written in A", "The direction of A's x axis, written in B", "The origin of B in A", "The first Euler angle"], 1, "The columns of ${}^{A}R_B$ are B's axes in A (n, o, a)."),
      ],
    };
  },
});

rbTask({
  id: "localglobal", topic: "rot", name: "Turn the hand: local or global axis?", like: "E15_WS_2022-23/1",
  make() {
    const R0 = rbR90(), ax = nmPick(["x", "y", "z"]), g = nmPick([90, -90]);
    const Rk = rbClean(RB_AX_R[ax](rbRad(g)));
    const loc = rbClean(rbMul(R0, Rk)), glob = rbClean(rbMul(Rk, R0));
    const col = (M) => M.map((r) => r[2]);
    return {
      intro: `<p>The hand's orientation in the world frame is</p>${tx(`R_{TCP} = ${rbTexI(R0)}`)}<p>The hand is now turned by $${g}°$ about a ${ax} axis.</p>`,
      parts: [
        nmVal(`About the hand's <b>own</b> ${ax} axis: where does the hand's z axis (approach) point afterwards, in world coordinates?`, rbLst(col(loc)), 2, `Local axis: multiply from the right, $R_{TCP}R_${ax}(${g}°) = ${rbTexI(loc)}$; the z axis is the third column.`),
        nmVal(`About the <b>world's</b> ${ax} axis instead?`, rbLst(col(glob)), 2, `Global axis: multiply from the left, $R_${ax}(${g}°)R_{TCP} = ${rbTexI(glob)}$.`),
        nmMC("Rotations about the moving, local axes are …", ["multiplied on the right — read left to right", "multiplied on the left — read right to left", "added", "applied to the transposed matrix"], 1, "Global (fixed) axes: on the left."),
      ],
    };
  },
});

rbTask({
  id: "rpy", topic: "rot", name: "Roll, pitch and yaw from a matrix", like: "E14_SS_2022/1",
  make() {
    const a = nmPick([0, 30, 45, 60, 90, -30, -60, -90, 120]), b = nmPick([0, 30, 45, -30, -45, 60, -60]), c = nmPick([0, 30, 60, 90, -45, -90, 135]);
    const R = rbClean(rbMul(RB_AX_R.z(rbRad(c)), rbMul(RB_AX_R.y(rbRad(b)), RB_AX_R.x(rbRad(a)))));
    return {
      intro: `<p>An orientation is given in roll–pitch–yaw form, $R = R_z(\\gamma)\\,R_y(\\beta)\\,R_x(\\alpha)$ with $-90° < \\beta < 90°$:</p>${tx(`R = ${rbTexE(R)}`)}
        <p class="small muted">From the product: $r_{31} = -\\sin\\beta$, $r_{32} = \\cos\\beta\\sin\\alpha$, $r_{33} = \\cos\\beta\\cos\\alpha$, $r_{11} = \\cos\\gamma\\cos\\beta$, $r_{21} = \\sin\\gamma\\cos\\beta$.</p>`,
      parts: [
        nmVal("Give the pitch $\\beta$ in degrees.", String(b), 1, `$\\beta = -\\arcsin r_{31} = ${b}°$.`),
        nmVal("Give the roll $\\alpha$ and the yaw $\\gamma$ in degrees (α; γ).", `${a}; ${c}`, 2, `$\\alpha = \\operatorname{atan2}(r_{32}, r_{33}) = ${a}°$, $\\gamma = \\operatorname{atan2}(r_{21}, r_{11}) = ${c}°$.`),
        nmMC("For which pitch does this representation have a gimbal lock?", ["$\\beta = \\pm 90°$", "$\\beta = 0$", "$\\alpha = \\gamma$", "Never"], 1, "Then $\\cos\\beta = 0$: only $\\alpha \\pm \\gamma$ can be read off — one DoF is lost."),
        nmMC("Which is a drawback of Euler / RPY angles?", ["They are not unique and not continuous, so you cannot interpolate them smoothly", "They need 9 numbers", "They cannot describe every rotation", "They only work in 2-D"], 1, "Plus the gimbal lock."),
      ],
    };
  },
});

rbTask({
  id: "platform", topic: "rot", name: "Pose of a robot in the plane", like: "E22_SS_2026/1",
  make() {
    const phi = nmPick([30, 45, 60, 90, -30, -45, -60, -90, 120, 180]), p = [rint(-3, 8), rint(0, 10)];
    const f = rbRad(phi), c = Math.cos(f), s = Math.sin(f);
    const T = rbClean([[c, -s, p[0]], [s, c, p[1]], [0, 0, 1]]);
    const lp = [rint(-3, 4), rint(-3, 4)], bp = [c * lp[0] - s * lp[1] + p[0], s * lp[0] + c * lp[1] + p[1]];
    const q = [p[0] + rint(-3, 3), p[1] + rint(-3, 3)], lq = [c * (q[0] - p[0]) + s * (q[1] - p[1]), -s * (q[0] - p[0]) + c * (q[1] - p[1])];
    return {
      intro: `<p>A mobile robot moves in the plane of the base frame BCS. Its local frame LCS has its origin at $p = (${p.join(", ")})^\\top$ m and is turned by ${Math.abs(phi)}° ${phi > 0 ? "counter-clockwise" : "clockwise"} against BCS (about $z$, right-hand rule).
        Use $\\sin 30° = \\frac12$, $\\cos 30° = \\frac{\\sqrt3}{2}$; decimals are fine.</p>`,
      parts: [
        nmVal("Give the first row of the homogeneous 3 × 3 matrix ${}^{BCS}T_{LCS}$.", rbLst(T[0]), 2, `${"$"}{}^{BCS}T_{LCS} = ${rbTexE(T)}$ with $\\varphi = ${phi}°$.`),
        nmVal(`A sensor sees an obstacle at ${"$"}{}^{LCS}p = (${lp.join(", ")})^\\top$ m. Where is it in BCS?`, rbLst(bp), 2, `${"$"}{}^{BCS}\\tilde p = T\\,(${lp.join(", ")}, 1)^\\top = (${bp.map((x) => rt(x)).join(", ")}, 1)^\\top$.`),
        nmVal(`A target is at ${"$"}{}^{BCS}q = (${q.join(", ")})^\\top$ m. Where is it in LCS?`, rbLst(lq), 1, `$R^\\top(q - p) = (${lq.map((x) => rt(x)).join(", ")})^\\top$.`),
        nmMC("Which homogeneous coordinate does a velocity get?", ["$h = 0$: a direction is only rotated", "$h = 1$", "$h = -1$", "Its length"], 1, "Points get $h = 1$."),
      ],
    };
  },
});

/* ================================================================ Quaternions */

rbTask({
  id: "quatrot", topic: "quat", name: "Rotate a point with a quaternion", like: "E12_SS_2021/1",
  make() {
    const ax = nmPick(["x", "y", "z"]), th = nmPick([60, 90, 120, 180, -90]);
    const n = RB_QAX[ax], h = rbRad(th) / 2;
    const q = [Math.cos(h), ...n.map((c) => c * Math.sin(h))].map((x) => rbR(x, 6));
    const p = rbIntV(3, -3, 3), r = rbQm(rbQm(q, [0, ...p]), rbQc(q));
    const absTh = Math.abs(th), nn = th < 0 ? n.map((x) => -x || 0) : n;
    const axisAns = [`${absTh}; ${nn.join("; ")}`].concat(absTh === 180 ? [`${absTh}; ${nn.map((x) => -x || 0).join("; ")}`] : []);
    const qt = (v) => `(${v.map(rbEx).join(", ")})`;
    return {
      intro: `<p>Given the unit quaternion $q = ${qt(q)}$ (as $(s, v_1, v_2, v_3)$) and the point $p = (${p.join(", ")})^\\top$.</p>`,
      parts: [
        nmVal("Give the rotation angle $\\theta \\in [0°, 180°]$ in degrees and the unit axis $n$ (θ; n₁; n₂; n₃).", axisAns, 2, `$q = (\\cos\\frac\\theta2, n\\sin\\frac\\theta2)$: $\\cos\\frac\\theta2 = ${rbEx(q[0])}$ gives $\\theta = ${absTh}°$, and $n = v / \\sin\\frac\\theta2$.`),
        nmVal("Give $q^{-1}$ (s; v₁; v₂; v₃).", rbLst(rbQc(q)), 1, "For a unit quaternion $q^{-1} = \\bar q = (s, -v)$."),
        nmVal("Rotate $p$: give $p'$ from $q\\,(0, p)\\,\\bar q$.", rbLst(r.slice(1)), 2, `$q\\,(0, p)\\,\\bar q = (0, ${r.slice(1).map((x) => rt(x)).join(", ")})$ — check: ${absTh}° about the ${ax} axis.`),
        nmMC("What does $-q$ describe?", ["The same rotation", "The inverse rotation", "A rotation by $-\\theta$ about $-n$ … which is a different rotation", "Nothing — $-q$ is not a unit quaternion"], 1, "$(-q)\\,p\\,(\\overline{-q}) = q\\,p\\,\\bar q$."),
      ],
    };
  },
});

rbTask({
  id: "quatmul", topic: "quat", name: "Computing with quaternions", like: "E19_WS_2024-25/1",
  make() {
    let q1, q2;
    do { q1 = rbIntV(4, -2, 2); q2 = rbIntV(4, -2, 2); } while (q1.every((x) => !x) || q2.every((x) => !x) || q1.filter(Boolean).length < 2);
    const p12 = rbQm(q1, q2), p21 = rbQm(q2, q1), n2 = q1.reduce((s, x) => s + x * x, 0);
    const inv = rbQc(q1).map((x) => nmQ(x, n2));
    const qs4 = (q) => rbQTex(q);
    return {
      intro: `<p>Given $q_1 = ${qs4(q1)}$ and $q_2 = ${qs4(q2)}$, with $i^2 = j^2 = k^2 = ijk = -1$.</p>${tx(`q_1q_2 = (s_1s_2 - v_1\\cdot v_2,\\ s_1v_2 + s_2v_1 + v_1\\times v_2)`)}`,
      parts: [
        nmVal(`Compute $q_1q_2$ (s; v₁; v₂; v₃).`, rbLst(p12), 2, `$q_1q_2 = ${qs4(p12)}$.`),
        nmVal("Compute $q_2q_1$.", rbLst(p21), 1, `$q_2q_1 = ${qs4(p21)}$ — only the cross product changes sign.`),
        nmVal("Compute $|q_1|^2 = q_1\\bar q_1$.", String(n2), 1, `$${q1.map((x) => `${x < 0 ? `(${x})` : x}^2`).join(" + ")} = ${n2}$.`),
        nmVal("Give $q_1^{-1}$ (fractions are fine).", rbLst(inv), 1, `$q_1^{-1} = \\bar q_1 / |q_1|^2 = ${qs4(rbQc(q1))}$ divided by ${n2}.`),
        nmMC("Is quaternion multiplication commutative?", [p12.every((x, i) => x === p21[i]) ? "No — here they happen to agree because $v_1 \\times v_2 = 0$, but not in general" : "No: $q_1q_2 \\ne q_2q_1$ in general", "Yes", "Only for unit quaternions", "Only for pure quaternions"], 1, "$ij = k = -ji$."),
      ],
    };
  },
});

rbTask({
  id: "quatwhy", topic: "quat", name: "Representations compared", like: "E20_SS_2025/1",
  make() {
    return {
      intro: "<p>Rotations and poses can be written as rotation matrices, Euler angles, homogeneous matrices, quaternions or dual quaternions.</p>",
      parts: [
        nmVal("How many numbers do they need: rotation matrix; unit quaternion; homogeneous matrix (non-trivial entries); dual quaternion?", "9; 4; 12; 8", 2, "A rotation has 3 DoF, a pose 6."),
        nmMC("What does SLERP give that linear interpolation of the four numbers does not?", ["A rotation with constant angular velocity along the great circle on $S^3$", "A shorter computation", "Translations as well", "A rotation matrix"], 1, "Linear interpolation leaves the unit sphere and speeds up in the middle."),
        nmMC("What must SLERP check first?", ["Whether $q_2$ or $-q_2$ is closer to $q_1$ — both are the same rotation", "Whether $q_1 = q_2$", "Whether the axis is normalised", "Nothing"], 1, "Otherwise it may take the long way round."),
        nmMC("Why do unit quaternions form a group under multiplication?", ["$|q_1q_2| = |q_1||q_2| = 1$ (closed), associative, identity $(1, 0, 0, 0)$, inverse $\\bar q$", "Because multiplication is commutative", "Because every quaternion has norm 1", "They do not"], 1, "Closure needs the norm to be multiplicative."),
        nmW("Name one advantage and one drawback of quaternions compared with rotation matrices.",
          "Advantage: 4 instead of 9 numbers, no gimbal lock, continuous — smooth interpolation with SLERP; easy to renormalise. Drawback: less intuitive to read; $q$ and $-q$ are the same rotation (double cover); rotating a point needs two products; no translation.",
          [[1, "an advantage (compact, no singularity, interpolation)"], [1, "a drawback (not intuitive, double cover, no translation)"]]),
      ],
    };
  },
});

/* ================================================================ DH & forward kinematics */

rbTask({
  id: "fkplanar", topic: "dh", name: "Forward kinematics of a planar arm", like: "E21_WS_2025-26/2",
  make() {
    const n = nmPick([2, 3]), ls = rbIntV(n, 1, 3), th = Array.from({ length: n }, () => nmPick([0, 30, 45, 60, 90, -30, -45, -60, -90, 120]));
    const pts = rbPlanar(th.map(rbRad), ls), [x, y] = pts[n], phi = th.reduce((a, b) => a + b, 0);
    const wrap = ((phi + 540) % 360) - 180 || 0;
    return {
      intro: `<p>A planar arm with ${n} revolute joints, link lengths ${ls.map((l, i) => `$a_${i + 1} = ${l}$`).join(", ")} and joint angles ${th.map((t, i) => `$\\theta_${i + 1} = ${t}°$`).join(", ")}. All joint axes are parallel to $z$.</p>`,
      parts: [
        nmVal("Give the end-effector position $x$; $y$.", rbLst([x, y], 3), 3, `$x = ${ls.map((l, i) => `${l}\\cos(${th.slice(0, i + 1).reduce((a, b) => a + b, 0)}°)`).join(" + ")} = ${rt(x)}$, and the same with $\\sin$ for $y = ${rt(y)}$.`),
        nmVal("Give the orientation $\\varphi$ of the end effector in degrees.", rbAngs(wrap), 1, `$\\varphi = ${th.join(" + ").replace(/\+ -/g, "- ")} = ${phi}°$.`),
        nmMC("Which DH parameters are zero for every joint of this arm?", ["$\\alpha_i$ and $d_i$", "$a_i$ and $\\theta_i$", "$a_i$ and $d_i$", "Only $\\theta_i$"], 1, "Parallel $z$ axes ($\\alpha_i = 0$), no offset along $z$ ($d_i = 0$)."),
      ],
    };
  },
});

rbTask({
  id: "dhmatrix", topic: "dh", name: "One DH transformation", like: "E17_WS_2023-24/2",
  make() {
    const a = rint(0, 2), al = nmPick([0, 90, -90]), d = rint(0, 2), th = nmPick([0, 30, 60, 90, -90, 180, 45]);
    const T = rbClean(rbDH(a, rbRad(al), d, rbRad(th)));
    return {
      intro: `<p>A link has the DH parameters $a_i = ${a}$, $\\alpha_i = ${al}°$, $d_i = ${d}$, $\\theta_i = ${th}°$. The lecture's convention:</p>${tx("{}^{i-1}T_i = R_z(\\theta_i)\\,T_z(d_i)\\,T_x(a_i)\\,R_x(\\alpha_i)")}`,
      parts: [
        nmVal("Give the position of frame $i$'s origin in frame $i-1$ (the last column, without the 1).", rbLst(rbHt(T), 3), 2, `$(a_i\\cos\\theta_i,\\ a_i\\sin\\theta_i,\\ d_i) = (${rbHt(T).map(rt).join(", ")})$.`),
        nmVal("Give the direction of $z_i$ in frame $i-1$ (the third column).", rbLst(T.slice(0, 3).map((r) => r[2]), 3), 1, `$(\\sin\\theta_i\\sin\\alpha_i,\\ -\\cos\\theta_i\\sin\\alpha_i,\\ \\cos\\alpha_i)$; the whole matrix: $${rbTexE(T)}$.`),
        nmMC("The joint is prismatic. Which parameter is the joint variable?", ["$d_i$", "$\\theta_i$", "$a_i$", "$\\alpha_i$"], 1, "Revolute: $\\theta_i$. The other three are constant."),
        nmMC("Along which axis does $z_{i-1}$ lie?", ["The axis of motion of joint $i$", "The axis of joint $i-1$", "The common normal", "The axis of joint $i+1$"], 1, "$z_i$ lies on the axis of joint $i+1$."),
      ],
    };
  },
});

rbTask({
  id: "rrp", topic: "dh", name: "A 3-D robot: R R P", like: "E04_SS_2017/2",
  make() {
    const d2 = rint(1, 2), d3 = rint(1, 3), t1 = nmPick([0, 30, 90, -90, 180, 60]), t2 = nmPick([0, 30, 90, 60, -90]);
    const T = rbClean(rbMul(rbMul(rbDH(0, -Math.PI / 2, 0, rbRad(t1)), rbDH(0, Math.PI / 2, d2, rbRad(t2))), rbDH(0, 0, d3, 0)));
    return {
      intro: `<p>A robot with two revolute joints and one prismatic joint has the DH table (lecture's convention $R_z(\\theta)T_z(d)T_x(a)R_x(\\alpha)$):</p>
        <table class="len-terms"><thead><tr><th>Joint</th><th>$a_i$</th><th>$\\alpha_i$</th><th>$d_i$</th><th>$\\theta_i$</th></tr></thead><tbody>
        <tr><td>1</td><td>0</td><td>−90°</td><td>0</td><td>$\\theta_1 = ${t1}°$</td></tr><tr><td>2</td><td>0</td><td>90°</td><td>$${d2}$</td><td>$\\theta_2 = ${t2}°$</td></tr><tr><td>3</td><td>0</td><td>0</td><td>$d_3 = ${d3}$</td><td>0</td></tr></tbody></table>`,
      parts: [
        nmVal("Compute the position of the end effector (frame 3) in the base frame.", rbLst(rbHt(T), 3), 3, `${"$"}{}^{0}T_3$ has the last column $(c_1s_2d_3 - s_1d_2,\\ s_1s_2d_3 + c_1d_2,\\ c_2d_3) = (${rbHt(T).map(rt).join(", ")})$.`),
        nmVal("Give the direction of the end effector's z axis in the base frame.", rbLst(T.slice(0, 3).map((r) => r[2]), 3), 1, "Third column of ${}^{0}T_3$: $(c_1s_2, s_1s_2, c_2)$."),
        nmMC("Which joint variable is a length?", ["$d_3$", "$\\theta_1$", "$\\theta_2$", "$d_2$"], 1, "$d_2$ is a constant offset; $d_3$ belongs to the prismatic joint."),
      ],
    };
  },
});

/* ================================================================ Jacobian & manipulability */

rbTask({
  id: "jac2", topic: "jac", name: "Jacobian of a 2-link arm", like: "E09_WS_2019-20/2",
  make() {
    const l = [rint(1, 3), rint(1, 3)], th = [nmPick([0, 30, 45, 60, 90, -30]), nmPick([30, 45, 60, 90, 120, -60, -90])];
    const J = rbJ2(th.map(rbRad), ...l), w = [rint(-2, 2) || 1, rint(-2, 2)], v = rbMv(J, w);
    return {
      intro: `<p>A planar arm with two revolute joints, $l_1 = ${l[0]}$, $l_2 = ${l[1]}$:</p>${tx(`x = \\begin{pmatrix} l_1\\cos\\theta_1 + l_2\\cos(\\theta_1 + \\theta_2)\\\\ l_1\\sin\\theta_1 + l_2\\sin(\\theta_1 + \\theta_2)\\end{pmatrix}`)}<p>Now $\\theta = (${th[0]}°, ${th[1]}°)$.</p>`,
      parts: [
        nmVal("Give the Jacobian's entries row by row: $J_{11}$; $J_{12}$; $J_{21}$; $J_{22}$.", rbLst([J[0][0], J[0][1], J[1][0], J[1][1]], 3), 3, `$J = \\begin{pmatrix} -l_1s_1 - l_2s_{12} & -l_2s_{12}\\\\ l_1c_1 + l_2c_{12} & l_2c_{12}\\end{pmatrix} = ${rbTexI(J)}$.`),
        nmVal(`The joints move with $\\dot\\theta = (${w.join(", ")})^\\top$ rad/s. Give the end-effector velocity $\\dot x$.`, rbLst(v, 3), 2, `$\\dot x = J\\dot\\theta = ${rbV(v)}$.`),
        nmVal("Compute $\\det J$.", String(rbR(l[0] * l[1] * Math.sin(rbRad(th[1])), 3)), 1, `$\\det J = l_1l_2\\sin\\theta_2 = ${rt(l[0] * l[1] * Math.sin(rbRad(th[1])))}$.`),
        nmMC("In which configurations is this arm singular?", ["$\\theta_2 = 0$ or $\\theta_2 = \\pi$", "$\\theta_1 = 0$", "$\\theta_2 = \\pi/2$", "Never"], 1, "Stretched or folded: both columns are parallel."),
        nmMC("What size is the Jacobian of an arm with $n$ joints for a full 3-D pose?", ["$6 \\times n$", "$n \\times 6$", "$n \\times n$", "$3 \\times n$"], 1, "Rows: task coordinates, columns: joints."),
      ],
    };
  },
});

rbTask({
  id: "manip", topic: "jac", name: "Manipulability measures", like: "E14_SS_2022/2",
  make() {
    let J;
    do { J = [rbIntV(2, -2, 2), rbIntV(2, -2, 2)]; } while (J[0][0] * J[1][1] - J[0][1] * J[1][0] === 0);
    const A = rbMul(J, rbT(J)), tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    const disc = Math.sqrt(tr * tr / 4 - det), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    return {
      intro: `<p>A robot with two joints has, in some configuration, the Jacobian</p>${tx(`J = ${rbTexI(J)}`)}`,
      parts: [
        nmVal("Compute the manipulability matrix $A = JJ^\\top$, row by row ($A_{11}$; $A_{12}$; $A_{21}$; $A_{22}$).", rbLst([A[0][0], A[0][1], A[1][0], A[1][1]]), 2, `$A = ${rbTexI(A)}$ — symmetric.`),
        nmVal("Give its eigenvalues, the larger first ($\\lambda_1$; $\\lambda_2$).", rbLst([l1, l2], 3), 2, `$\\lambda = \\frac{\\operatorname{tr}A}{2} \\pm \\sqrt{\\frac{(\\operatorname{tr}A)^2}{4} - \\det A} = ${rt(tr / 2)} \\pm ${rt(disc)}$.`),
        nmVal("Give the three measures $w_1 = \\sigma_{min}$; $w_2 = \\sigma_{min}/\\sigma_{max}$; $w_3 = \\sqrt{\\det A}$.", rbLst([Math.sqrt(l2), Math.sqrt(l2 / l1), Math.sqrt(det)], 3), 3, `$\\sigma_i = \\sqrt{\\lambda_i}$: $w_1 = ${rt(Math.sqrt(l2))}$, $w_2 = ${rt(Math.sqrt(l2 / l1))}$, $w_3 = ${rt(Math.sqrt(det))} = |\\det J|$.`),
        nmMC("What are such measures used for?", ["Comparing configurations and avoiding singularities", "Computing the DH parameters", "Collision checks", "Calibrating cameras"], 1, "Small values: close to a singularity."),
      ],
    };
  },
});

rbTask({
  id: "statics", topic: "jac", name: "Holding a force: joint torques", like: "E03_WS_2016-17/2",
  make() {
    const l = [rint(1, 2), rint(1, 2)], th = [nmPick([0, 30, 60, 90]), nmPick([30, 60, 90, -90, 120])];
    const J = rbJ2(th.map(rbRad), ...l), F = [rint(-3, 3), rint(-4, 0) || -2], tau = rbMv(rbT(J), F);
    return {
      intro: `<p>The 2-link arm ($l_1 = ${l[0]}$ m, $l_2 = ${l[1]}$ m, $\\theta = (${th[0]}°, ${th[1]}°)$) holds a force $F = (${F.join(", ")})^\\top$ N at its end effector, at rest and without friction.</p>${tx(`J = ${rbTexI(J)}`)}`,
      parts: [
        nmVal("Which joint torques $\\tau_1$; $\\tau_2$ (in N·m) resist it?", rbLst(tau, 3), 3, `$\\tau = J^\\top F = ${rbV(tau)}$.`),
        nmMC("Where does $\\tau = J^\\top F$ come from?", ["Virtual work: $\\tau^\\top\\dot\\theta = F^\\top\\dot x = F^\\top J\\dot\\theta$ for every $\\dot\\theta$", "From inverting $J$", "From Newton's second law", "From the DH convention"], 1, "The power at the joints equals the power at the end effector."),
        nmMC("The arm is stretched out ($\\theta_2 = 0$) and the force points along the arm. Which torques are needed?", ["None — the force goes through both joints", "Large torques in both joints", "Only at joint 1", "It cannot hold any force"], 1, "At a singularity the arm can resist forces in the blocked direction without torque."),
      ],
    };
  },
});

/* ================================================================ Workspace */

rbTask({
  id: "ws", topic: "ws", name: "Configuration space, workspace, reachability", like: "E20_SS_2025/2",
  make() {
    const n = rint(5, 8);
    return {
      intro: `<p>A robot arm with ${n} revolute joints sits on a holonomic mobile platform that drives in the plane.</p>`,
      parts: [
        nmVal("How many dimensions does the configuration space of arm + platform have?", String(n + 3), 1, `${n} joint angles plus $(x, y, \\varphi)$ of the platform.`),
        nmVal("How many DoF does an element of $SE(3)$ have; and a rigid body in the plane?", "6; 3", 1, "3 for position + 3 for orientation; in the plane $x$, $y$, angle."),
        nmMC("How is a reachability map built?", ["Offline: step through the joint angles, compute the TCP by forward kinematics and mark its cell in a 6-D grid", "Online with inverse kinematics for every grasp", "From the collision model", "By driving the real robot to every pose"], 1, "Then a lookup costs $O(1)$."),
        nmMC("What can a cell hold besides “reachable or not”?", ["The best manipulability reached in it", "The joint torques", "The DH parameters", "The camera image"], 1, "E.g. $\\max w_1$."),
        nmMC("Which geometric models are meant for fast collision checks?", ["Bounding boxes (block world) and simplified collision models", "Exact volume models", "Edge models", "Point clouds of the whole scene"], 1, "Precise volume models are for exact checks and animation."),
      ],
    };
  },
});

/* ================================================================ Inverse kinematics */

rbTask({
  id: "ik2", topic: "ik", name: "Inverse kinematics of the 2-link arm", like: "E02_SS_2016/7",
  make() {
    const l = [rint(1, 3), rint(1, 3)], t1 = nmPick([0, 30, 45, 60, 90, -30]), t2 = nmPick([30, 45, 60, 90, 120]);
    const [x, y] = rbF2([rbRad(t1), rbRad(t2)], ...l).map((v) => rbR(v, 3));
    const c2 = (x * x + y * y - l[0] ** 2 - l[1] ** 2) / (2 * l[0] * l[1]);
    const s = rbIK2(x, y, ...l);
    const up = s.sols.find((q) => q[1] > 0), dn = s.sols.find((q) => q[1] < 0);
    return {
      intro: `<p>A planar 2-link arm, $l_1 = ${l[0]}$, $l_2 = ${l[1]}$, should reach $x = ${rt(x)}$, $y = ${rt(y)}$. Angles in degrees; $\\theta_2$ is the joint angle measured from link 1.</p>`,
      parts: [
        nmVal("Compute $\\cos\\theta_2$.", String(rbR(c2, 3)), 1, `Law of cosines: $\\cos\\theta_2 = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2} = ${rt(c2)}$.`),
        nmVal("Give both solutions for $\\theta_2$ (positive; negative).", `${rbDeg1(up[1])}; ${rbDeg1(dn[1])}`, 1, `$\\theta_2 = \\pm\\arccos(${rt(c2)}) = \\pm ${rbDeg1(up[1])}°$: elbow up and elbow down.`),
        nmVal("Give $\\theta_1$ for the positive $\\theta_2$.", rbAngs(rbDeg1(up[0])), 2, `$\\theta_1 = \\operatorname{atan2}(y, x) - \\operatorname{atan2}(l_2\\sin\\theta_2, l_1 + l_2\\cos\\theta_2) = ${rbDeg1(up[0])}°$.`),
        nmVal("And $\\theta_1$ for the negative $\\theta_2$.", rbAngs(rbDeg1(dn[0])), 1, `The same formula with $-\\theta_2$: $${rbDeg1(dn[0])}°$.`),
        nmMC(`How many solutions are there for a target at distance $${l[0] + l[1]}$ from the base?`, ["Exactly one — the arm is stretched (boundary of the workspace)", "Two", "None", "Infinitely many"], 1, `${l[0] === l[1] ? "And infinitely many for the base itself, since $l_1 = l_2$." : "With $l_1 \\ne l_2$, targets closer than $|l_1 - l_2|$ cannot be reached."}`),
      ],
    };
  },
});

rbTask({
  id: "pinv", topic: "ik", name: "Pseudoinverse of a redundant robot", like: "E16_SS_2023/2",
  make() {
    let J;
    do { J = rbIntV(3, -3, 3); } while (J.filter(Boolean).length < 2);
    const s = J.reduce((a, b) => a + b * b, 0), xd = rint(-3, 3) || 2;
    const Jp = J.map((x) => nmQ(x, s)), th = J.map((x) => nmQ(x * xd, s));
    return {
      intro: `<p>A robot with three joints controls one task coordinate (e.g. the height of its hand). In the current configuration $J = (${J.join(",\\ ")}) \\in \\mathbb R^{1\\times 3}$.</p>`,
      parts: [
        nmMC("Why can't you use $J^{-1}$ here?", ["$J$ is not square: the robot is redundant ($n > m$)", "$J$ is singular", "$J$ is symmetric", "$\\det J < 0$"], 1, "Use the Moore–Penrose pseudoinverse."),
        nmVal("Compute $JJ^\\top$.", String(s), 1, `$${J.map((x) => (x < 0 ? `(${x})^2` : `${x}^2`)).join(" + ")} = ${s}$.`),
        nmVal("Compute $J^+ = J^\\top(JJ^\\top)^{-1}$ (fractions are fine).", rbLst(Jp), 2, `$J^+ = \\frac1{${s}}(${J.join(", ")})^\\top$.`),
        nmVal(`Which joint velocity $\\dot\\theta = J^+\\dot x$ realises $\\dot x = ${xd}$?`, rbLst(th), 1, `$\\dot\\theta = \\frac{${xd}}{${s}}(${J.join(", ")})^\\top$ — the smallest $\\|\\dot\\theta\\|$ among all solutions.`),
        nmMC("What goes wrong near a singularity, and what helps?", ["$JJ^\\top$ gets close to singular and the steps explode; damped least squares $J^\\top(JJ^\\top + \\lambda^2I)^{-1}$", "Nothing", "The pseudoinverse becomes the transpose; use Euler angles", "The robot becomes faster; lower the step size"], 1, "Dividing by a small singular value."),
      ],
    };
  },
});

rbTask({
  id: "gdstep", topic: "ik", name: "One step of numerical IK", like: "E16_SS_2023/2",
  make() {
    const th0d = nmPick([[0, 90], [90, 90], [0, -90], [90, -90], [180, 90], [0, 60]]), th0 = th0d.map(rbRad);
    const goal = nmPick([[0, 1], [1, 0], [1, 1], [0, 1.5], [-1, 1], [1.5, 0.5]]), gam = nmPick([0.1, 0.2, 0.5]);
    const f = rbF2(th0), e = [goal[0] - f[0], goal[1] - f[1]], err = e[0] ** 2 + e[1] ** 2;
    const J = rbJ2(th0), grad = rbMv(rbT(J), e).map((x) => -2 * x), th1 = th0.map((x, i) => x - gam * grad[i]);
    return {
      intro: `<p>A planar 2-link arm with $l_1 = l_2 = 1$ starts at $\\theta_0 = (${th0d[0]}°, ${th0d[1]}°)$ and should reach $x_{goal} = (${goal.join(", ")})^\\top$.
        Gradient descent on $e(\\theta) = \\|x_{goal} - f(\\theta)\\|^2$ with step length $\\gamma = ${gam}$. Work in radians.</p>`,
      parts: [
        nmVal("Compute $f(\\theta_0)$.", rbLst(f, 3), 1, `$f(\\theta_0) = ${rbV(f)}$.`),
        nmVal("Compute $e(\\theta_0)$.", String(rbR(err, 3)), 1, `$\\|${rbV(e)}\\|^2 = ${rt(err)}$.`),
        nmVal("Compute the gradient $\\nabla e(\\theta_0) = -2J^\\top(x_{goal} - f(\\theta_0))$.", rbLst(grad, 3), 2, `$J(\\theta_0) = ${rbTexI(J)}$, so $\\nabla e = ${rbV(grad)}$.`),
        nmVal("Give $\\theta_1 = \\theta_0 - \\gamma\\nabla e(\\theta_0)$ in radians.", rbLst(th1, 3), 1, `$${rbV(th0)} - ${gam}\\cdot${rbV(grad)} = ${rbV(th1)}$.`),
        nmMC("Which solution does gradient descent find?", ["It depends on the start: the nearest local minimum", "Always elbow up", "Always both", "The one with the smallest $\\|\\theta\\|$"], 1, "It only follows the slope of $e$."),
      ],
    };
  },
});

/* ================================================================ Dynamics */

rbTask({
  id: "pendulum", topic: "dyn", name: "A one-joint arm by Lagrange", like: "E18_SS_2024/2",
  make() {
    const rod = Math.random() < 0.5, m = nmPick([1, 2, 4]), l = nmPick([0.5, 1, 2]), g = 10, th = nmPick([30, 60, 90, 45]), w = rint(1, 3), a = rint(1, 4);
    const I = rod ? (m * l * l) / 3 : m * l * l, lc = rod ? l / 2 : l;
    return {
      intro: `<p>A ${rod ? `thin uniform rod (mass $m = ${m}$ kg, length $l = ${l}$ m, $I_A = \\frac13ml^2$ about the joint)` : `point mass $m = ${m}$ kg on a massless rod of length $l = ${l}$ m`} turns about a horizontal joint A.
        $\\theta$ is measured from the downward vertical; gravity $g = 10$ m/s²; the potential energy is zero at the height of A.</p>`,
      parts: [
        nmVal(`Kinetic energy for $\\dot\\theta = ${w}$ rad/s (in J).`, String(rbR(0.5 * I * w * w)), 1, `$T = \\frac12 ${rod ? "I_A" : "ml^2"}\\dot\\theta^2 = \\frac12\\cdot${rt(I)}\\cdot${w * w} = ${rt(0.5 * I * w * w)}$.`),
        nmVal(`Potential energy at $\\theta = ${th}°$ (in J).`, String(rbR(-m * g * lc * Math.cos(rbRad(th)), 3)), 1, `The centre of mass is at height $-${rod ? "\\frac l2" : "l"}\\cos\\theta$: $U = ${rt(-m * g * lc * Math.cos(rbRad(th)))}$.`),
        nmW("Write down $L(\\theta, \\dot\\theta)$ and derive the equation of motion with the joint torque $\\tau$.",
          `$L = T - U = \\frac12 ${rod ? "\\frac{ml^2}{3}" : "ml^2"}\\dot\\theta^2 + mg${rod ? "\\frac l2" : "l"}\\cos\\theta$. $\\frac{d}{dt}\\frac{\\partial L}{\\partial\\dot\\theta} - \\frac{\\partial L}{\\partial\\theta} = \\tau$ gives
           $${rod ? "\\frac{ml^2}{3}" : "ml^2"}\\ddot\\theta + mg${rod ? "\\frac l2" : "l"}\\sin\\theta = \\tau$.`,
          [[1, "$L = T - U$ with both energies"], [1, "both derivatives"], [1, "the equation of motion"]]),
        nmVal(`Which torque holds the arm still at $\\theta = ${th}°$?`, String(rbR(m * g * lc * Math.sin(rbRad(th)), 3)), 1, `$\\ddot\\theta = 0$: $\\tau = mg${rod ? "\\frac l2" : "l"}\\sin\\theta = ${rt(m * g * lc * Math.sin(rbRad(th)))}$ N·m.`),
        nmVal(`Which torque gives $\\ddot\\theta = ${a}$ rad/s² at $\\theta = 0$?`, String(rbR(I * a, 3)), 1, `$\\tau = ${rt(I)}\\cdot${a} = ${rt(I * a)}$ N·m (gravity has no lever arm there).`),
      ],
    };
  },
});

rbTask({
  id: "slider", topic: "dyn", name: "Revolute + prismatic joint", like: "E22_SS_2026/2",
  make() {
    const m = rint(1, 4), I = rint(1, 3), g = 10, th = nmPick([0, 30, 90, 60]), d = rint(1, 3), td = rint(-2, 2), dd = rint(-2, 2), tdd = rint(-2, 2), ddd = rint(-2, 2);
    const s = Math.sin(rbRad(th)), c = Math.cos(rbRad(th));
    const tau = (I + m * d * d) * tdd + 2 * m * d * dd * td + m * g * d * s, F = m * ddd - m * d * td * td - m * g * c;
    return {
      intro: `<p>A body (mass $m$, inertia $I$ about its centre E) sits at the end of a telescopic rod: joint angle $\\theta$, rod length $d$, $q = (\\theta, d)^\\top$, $x_E = d\\sin\\theta$, $y_E = -d\\cos\\theta$, gravity in $-y$. The rod is massless. The equation of motion is</p>
        ${tx(`\\begin{pmatrix} (I + md^2)\\ddot\\theta + 2md\\dot d\\dot\\theta + mgd\\sin\\theta\\\\ m\\ddot d - md\\dot\\theta^2 - mg\\cos\\theta\\end{pmatrix} = \\begin{pmatrix}\\tau\\\\ F\\end{pmatrix}`)}
        <p>Now $m = ${m}$ kg, $I = ${I}$ kg·m², $g = 10$ m/s², $\\theta = ${th}°$, $d = ${d}$ m, $\\dot\\theta = ${td}$, $\\dot d = ${dd}$, $\\ddot\\theta = ${tdd}$, $\\ddot d = ${ddd}$.</p>`,
      parts: [
        nmW("Derive $T$ and $U$ in terms of $q$ and $\\dot q$.", "$\\dot x_E = \\dot d\\sin\\theta + d\\dot\\theta\\cos\\theta$, $\\dot y_E = -\\dot d\\cos\\theta + d\\dot\\theta\\sin\\theta$, so $\\dot x_E^2 + \\dot y_E^2 = \\dot d^2 + d^2\\dot\\theta^2$. $T = \\frac12I\\dot\\theta^2 + \\frac12m(\\dot d^2 + d^2\\dot\\theta^2)$, $U = -mgd\\cos\\theta$.",
          [[1, "velocities of E by differentiating"], [1, "$T$ with both terms"], [1, "$U = -mgd\\cos\\theta$"]]),
        nmVal("Compute the motor torque $\\tau$.", String(rbR(tau, 3)), 2, `$(${I} + ${m}\\cdot${d * d})\\cdot${tdd} + 2\\cdot${m}\\cdot${d}\\cdot${dd}\\cdot${td} + ${m}\\cdot10\\cdot${d}\\cdot${rt(s)} = ${rt(tau)}$.`),
        nmVal("Compute the actuator force $F$.", String(rbR(F, 3)), 2, `$${m}\\cdot${ddd} - ${m}\\cdot${d}\\cdot${td * td} - ${m}\\cdot10\\cdot${rt(c)} = ${rt(F)}$.`),
        nmMC("Which term is the centrifugal term?", ["$-md\\dot\\theta^2$", "$2md\\dot d\\dot\\theta$", "$mgd\\sin\\theta$", "$m\\ddot d$"], 1, "$2md\\dot d\\dot\\theta$ is the Coriolis term."),
      ],
    };
  },
});

rbTask({
  id: "pushforces", topic: "dyn", name: "Forces on a rigid body in the plane", like: "E21_WS_2025-26/1",
  make() {
    const m = nmPick([2, 4, 5, 10]), I = nmPick([1, 2, 5]), grav = Math.random() < 0.5;
    const n = rint(2, 3), Fs = Array.from({ length: n }, () => [rint(-4, 4) * 5, rint(-2, 6) * 5]), rs = Array.from({ length: n }, () => [rint(-2, 2) / 2, rint(-2, 2) / 2]);
    const sum = Fs.reduce((a, f) => [a[0] + f[0], a[1] + f[1]], [0, grav ? -m * 10 : 0]);
    const tau = Fs.reduce((a, f, i) => a + rs[i][0] * f[1] - rs[i][1] * f[0], 0);
    return {
      intro: `<p>A rigid body of mass $m = ${m}$ kg and moment of inertia $I = ${I}$ kg·m² about its centre of mass G moves in the plane${grav ? " under gravity $g = -10\\,e_y$ m/s²" : " (no gravity: it lies on a table)"}.
        Forces act at points given relative to G, all in the base frame:</p>
        <ul>${Fs.map((f, i) => `<li>$F_${i + 1} = (${f.join(", ")})^\\top$ N at $r_${i + 1} = (${rs[i].join(", ")})^\\top$ m</li>`).join("")}</ul>`,
      parts: [
        nmVal("Compute the acceleration of G, $a_G$ (in m/s²).", rbLst(sum.map((x) => x / m), 3), 2, `$a_G = \\frac1m\\big(\\sum F_i${grav ? " + mg" : ""}\\big) = \\frac1{${m}}(${sum.join(", ")})^\\top$.`),
        nmVal("Compute the angular acceleration $\\dot\\omega$ about $z$ (counter-clockwise positive, in rad/s²).", String(rbR(tau / I, 3)), 2, `$\\tau = \\sum (r_{i,x}F_{i,y} - r_{i,y}F_{i,x}) = ${rt(tau)}$ N·m, $\\dot\\omega = \\tau / I = ${rt(tau / I)}$.`),
        nmMC("Why does gravity not appear in $\\dot\\omega$?", ["It acts at the centre of mass: no lever arm", "Because $g$ is small", "Because the body is rigid", "It does appear"], 1, "Torques are taken about G."),
      ],
    };
  },
});

rbTask({
  id: "dynconcepts", topic: "dyn", name: "The equation of motion", like: "E17_WS_2023-24/2",
  make() {
    return {
      intro: `${tx("\\tau = M(q)\\,\\ddot q + C(q, \\dot q)\\,\\dot q + g(q)")}`,
      parts: [
        nmMC("What is $M(q)$?", ["The mass (inertia) matrix — symmetric, positive definite, depends on the configuration", "The Jacobian", "The vector of gravity torques", "The joint torques"], 1, "It maps joint accelerations to torques."),
        nmMC("What does $C(q, \\dot q)\\dot q$ describe?", ["Centrifugal and Coriolis effects", "Gravity", "Friction only", "The motor torques"], 1, "Velocity-dependent terms."),
        nmMC("What are generalised coordinates?", ["Independent coordinates that fix the configuration — for a robot usually its joint variables $q$", "The Cartesian pose of the end effector", "The DH parameters", "The forces at the joints"], 1, "Their number equals the DoF."),
        nmMC("You want to simulate how the robot moves under given torques. Which problem is that?", ["Direct (forward) dynamics: $\\ddot q$ from $\\tau$", "Inverse dynamics: $\\tau$ from $\\ddot q$", "Inverse kinematics", "Forward kinematics"], 1, "Inverse dynamics is what a controller needs to follow a trajectory."),
        nmMC("An advantage of recursive Newton–Euler over Lagrange?", ["$O(n)$ effort, recursive and efficient for numerical computation", "It gives closed-form symbolic equations", "It needs no masses", "It ignores gravity"], 1, "Lagrange: energies, elegant closed form, but costly for many joints."),
      ],
    };
  },
});

/* ================================================================ Control */

rbTask({
  id: "control", topic: "ctrl", name: "A P controller on a first-order plant", like: "E14_SS_2022/3",
  make() {
    const K = nmPick([1, 2, 4]), T = nmPick([0.5, 1, 2]), Kp = rint(1, 4), L = Kp * K;
    return {
      intro: `<p>A motor (plant) has the transfer function $G(s) = \\frac{${K}}{${T}s + 1}$. It is controlled by a P controller $K_P = ${Kp}$ in a unity-feedback loop and gets a unit step as set point.</p>`,
      parts: [
        nmVal("Give the final value of the output $y(\\infty)$.", rbLst([nmQ(L, 1 + L)]), 1, `Closed loop $\\frac{K_PG}{1 + K_PG} = \\frac{${L}}{${T}s + ${1 + L}}$; at $s = 0$: $\\frac{${L}}{${1 + L}}$.`),
        nmVal("Give the remaining control error $e(\\infty)$.", rbLst([nmQ(1, 1 + L)]), 1, `$1 - \\frac{${L}}{${1 + L}} = \\frac1{${1 + L}}$: a P controller leaves an error on this plant.`),
        nmVal("Give the time constant of the closed loop.", String(rbR(T / (1 + L), 3)), 1, `$\\frac{${T}}{${1 + L}}s + 1$ in the denominator: $T_{cl} = ${rt(T / (1 + L))}$ s — faster than the plant.`),
        nmMC("Which part removes the remaining error?", ["An integral part (PI controller)", "A larger $K_P$ alone", "A derivative part", "A low-pass filter"], 1, "A larger $K_P$ only makes it smaller."),
        nmMC("A PI controller in the time and Laplace domain:", ["$u(t) = K_Pe(t) + K_I\\int_0^te(\\tau)d\\tau$, $\\;U(s) = (K_P + \\frac{K_I}{s})E(s)$", "$u(t) = K_Pe(t) + K_D\\dot e(t)$, $\\;U(s) = (K_P + K_Ds)E(s)$", "$u(t) = K_I\\int e$, $\\;U(s) = K_IsE(s)$", "$u(t) = K_Pe(t)$, $\\;U(s) = \\frac{K_P}{s}E(s)$"], 1, "Integration becomes $\\frac1s$."),
        nmMC("In the standard loop, what is the controlled variable?", ["The plant's output that is fed back and compared with the set point", "The controller's output", "The disturbance", "The set point"], 1, "The controller output is the manipulated variable."),
      ],
    };
  },
});

/* ================================================================ Motion planning */

rbTask({
  id: "rrt", topic: "plan", name: "Extending an RRT", like: "E22_SS_2026/3",
  make() {
    let nodes, qs, near, ds;
    do {
      nodes = [[2, 3], ...Array.from({ length: 3 }, () => [rint(0, 12), rint(0, 8)])];
      qs = [rint(0, 12), rint(0, 8)];
      ds = nodes.map((p) => rbDist(p, qs));
      near = ds.indexOf(Math.min(...ds));
    } while (new Set(ds.map((x) => x.toFixed(3))).size < 4 || Math.min(...ds) < 1.5);
    const d = nmPick([1, 2]), u = [(qs[0] - nodes[near][0]) / ds[near], (qs[1] - nodes[near][1]) / ds[near]];
    const qn = [nodes[near][0] + d * u[0], nodes[near][1] + d * u[1]];
    return {
      intro: `<p>An RRT for a point robot in the plane has the nodes ${nodes.map((p, i) => `$q_${i} = (${p.join(", ")})$`).join(", ")} (start $q_0$). No obstacles are in the way. The next sample is $q_s = (${qs.join(", ")})$, the step size $d = ${d}$.</p>`,
      parts: [
        nmVal("Which node is the nearest neighbour $q_{nn}$? Give its index.", [String(near), `q${near}`], 1, `Distances: ${ds.map((x, i) => `$q_${i}$: ${rt(x)}`).join(", ")}.`),
        nmVal("Give the new node $q_{new}$.", rbLst(qn, 3), 2, `$q_{new} = q_{nn} + d\\frac{q_s - q_{nn}}{\\|q_s - q_{nn}\\|} = ${rbV(qn)}$.`),
        nmMC("Is RRT complete?", ["Probabilistically complete: if a solution exists, the probability of finding it goes to 1", "Complete: it finds a solution in finite time or reports none", "Neither", "Optimal"], 1, "RRT* is asymptotically optimal."),
        nmMC("Why are narrow passages hard for RRT?", ["They occupy a tiny part of C, so samples rarely fall inside", "Collision checks fail there", "The step size is too large", "The tree cannot branch"], 1, "Remedies: bridge sampling, dynamic-domain RRT."),
        nmMC("Single- or multi-query?", ["RRT is single-query; PRM builds a roadmap for many queries", "Both are multi-query", "RRT is multi-query", "Neither"], 1, "PRM: learning phase, then query phase."),
      ],
    };
  },
});

rbTask({
  id: "rrtstar", topic: "plan", name: "Path costs and rewiring in RRT*", like: "E19_WS_2024-25/3",
  make() {
    const V = [[3, 4], [4, 3], [0, 2], [2, 0], [0, 3], [3, 0], [-3, 4], [4, -3]];
    let pts, par, cost;
    do {
      pts = [[0, 0]]; par = [-1]; cost = [0];
      for (let i = 1; i < 6; i++) {
        const j = rint(0, i - 1), v = pick(V), p = [pts[j][0] + v[0], pts[j][1] + v[1]];
        if (pts.some((q) => q[0] === p[0] && q[1] === p[1])) { i--; continue; }
        pts.push(p); par.push(j); cost.push(cost[j] + Math.hypot(...v));
      }
    } while (Math.max(...pts.map((p) => Math.abs(p[0]) + Math.abs(p[1]))) > 16);
    const names = "ABCDEF";
    let qn, near, r;
    do {
      qn = [rint(-2, 9), rint(-2, 9)];
      r = nmPick([3, 4]);
      near = pts.map((p, i) => i).filter((i) => rbDist(pts[i], qn) <= r && rbDist(pts[i], qn) > 0);
    } while (near.length < 2 || pts.some((p) => Math.abs(rbDist(p, qn) - r) < 0.05));
    const via = near.map((i) => cost[i] + rbDist(pts[i], qn)), best = near[via.indexOf(Math.min(...via))];
    return {
      intro: `<p>An RRT* tree in the plane, root A = (0, 0). Nodes and their parents: ${pts.map((p, i) => `${names[i]} = (${p.join(", ")})${i ? ` ← ${names[par[i]]}` : ""}`).join("; ")}. Edges are straight lines; no obstacles.</p>`,
      parts: [
        nmVal("Give the path costs from A to B; C; D; E; F.", rbLst(cost.slice(1), 3), 2, cost.slice(1).map((c, i) => `${names[i + 1]}: ${rt(c)}`).join(", ") + "."),
        nmVal(`A new node $q_{new} = (${qn.join(", ")})$ is added; the neighbourhood radius is $r = ${r}$. Which nodes are its neighbours? (letters)`, gkLetters(near.map((i) => names[i])), 1, `Distances to $q_{new}$: ${pts.map((p, i) => `${names[i]} ${rt(rbDist(p, qn))}`).join(", ")}.`),
        nmVal("Which neighbour becomes its parent?", names[best], 1, `Cost via each: ${near.map((i, k) => `${names[i]} ${rt(via[k])}`).join(", ")} — the cheapest.`),
        nmVal("And the path cost of $q_{new}$?", String(rbR(Math.min(...via), 3)), 1, `$${rt(Math.min(...via))}$.`),
        nmMC("What does the rewiring step then do?", ["For each neighbour, re-parent it to $q_{new}$ if its path through $q_{new}$ is cheaper", "Delete the neighbours", "Connect $q_{new}$ to all neighbours", "Restart the tree"], 1, "That is what makes RRT* asymptotically optimal."),
      ],
    };
  },
});

rbTask({
  id: "astar", topic: "plan", name: "A* on a graph", like: "E10_SS_2020/3",
  make() {
    const L = ["S", "A", "B", "C", "D", "G"];
    let P, E, order, path, cost;
    for (;;) {
      P = L.map(() => [rint(0, 6), rint(0, 4)]);
      P[0] = [0, rint(0, 4)]; P[5] = [6, rint(0, 4)];
      if (new Set(P.map((p) => p.join())).size < 6) continue;
      E = [];
      for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) { const d = rbDist(P[i], P[j]); if (d <= 3.7 && !(i === 0 && j === 5)) E.push([i, j, Math.ceil(d)]); }
      const h = P.map((p) => Math.floor(rbDist(p, P[5])));
      // A* graph search: lowest f, ties by lower h, then alphabetically.
      const g = Array(6).fill(Infinity), prev = Array(6).fill(-1), closed = new Set();
      g[0] = 0; order = [];
      const open = new Set([0]);
      while (open.size) {
        const u = [...open].sort((a, b) => g[a] + h[a] - (g[b] + h[b]) || h[a] - h[b] || L[a].localeCompare(L[b]))[0];
        open.delete(u); closed.add(u); order.push(u);
        if (u === 5) break;
        E.filter((e) => e[0] === u || e[1] === u).forEach(([a, b, c]) => {
          const v = a === u ? b : a;
          if (closed.has(v)) return;
          if (g[u] + c < g[v]) { g[v] = g[u] + c; prev[v] = u; open.add(v); }
        });
      }
      if (!closed.has(5) || order.length < 4) continue;
      path = [5]; while (path[0] !== 0) path.unshift(prev[path[0]]);
      cost = g[5];
      const fs = order.map((u) => g[u] + h[u]);
      if (new Set(fs).size < 2) continue;
      E.h = h;
      break;
    }
    return {
      intro: `<p>Find the cheapest path from S to G with A* (graph search: expanded nodes go on a closed list). Edges and costs: ${E.map(([a, b, c]) => `${L[a]}–${L[b]}: ${c}`).join(", ")}.
        Heuristic $h$: ${L.map((x, i) => `${x}: ${E.h[i]}`).join(", ")}. On ties in $f = g + h$, take the smaller $h$, then the earlier letter.</p>`,
      parts: [
        nmVal("In which order are the nodes expanded (until G is expanded)?", gkLetters(order.map((i) => L[i])), 2, `Expansion order ${order.map((i) => L[i]).join(", ")}.`),
        nmVal("Which path does A* return?", gkLetters(path.map((i) => L[i])), 1, `${path.map((i) => L[i]).join(" → ")}.`),
        nmVal("What does it cost?", String(cost), 1, `$g(G) = ${cost}$.`),
        nmMC("When is a heuristic admissible?", ["When it never overestimates the true remaining cost: $h(n) \\le h^*(n)$", "When it is never zero", "When it overestimates by at most 1", "When it is symmetric"], 1, "Then A* tree search is optimal; here $h$ is the rounded-down straight-line distance."),
        nmMC("Which heuristic turns A* into Dijkstra's algorithm?", ["$h \\equiv 0$", "The Euclidean distance", "The Manhattan distance", "$h = g$"], 1, "Then only $g$ orders the queue."),
      ],
    };
  },
});

rbTask({
  id: "potential", topic: "plan", name: "Potential field forces", like: "E20_SS_2025/3",
  make() {
    const p = [rint(0, 5), rint(0, 4)], pg = [p[0] + rint(1, 4), p[1] + rint(-2, 3)];
    const v = pick([[1, 0], [0, 1], [-1, 0], [0, -1], [2, 0], [0, -2], [3, 4], [-3, 4], [4, -3]]), dd = Math.hypot(...v), k = nmPick([1, 2]);
    const po = [p[0] - v[0], p[1] - v[1]], c = k * dd ** 3;
    const Fg = [pg[0] - p[0], pg[1] - p[1]], Fo = [k * v[0], k * v[1]], Fr = [Fg[0] + Fo[0], Fg[1] + Fo[1]];
    return {
      intro: `<p>A point robot at $p_s = (${p.join(", ")})$ is attracted by the goal $p_g = (${pg.join(", ")})$ and repelled by an obstacle at $p_o = (${po.join(", ")})$:</p>
        ${tx(`U_g(p) = \\tfrac12\\|p - p_g\\|^2,\\qquad U_o(p) = \\frac{${c}}{\\|p - p_o\\|},\\qquad F = -\\nabla U`)}
        <p class="small muted">Hint: $\\nabla U_g = p - p_g$, $\\nabla U_o = -${c}\\,\\frac{p - p_o}{\\|p - p_o\\|^3}$.</p>`,
      parts: [
        nmVal("Give the attractive force $F_g$ at $p_s$.", rbLst(Fg), 1, `$F_g = p_g - p_s = ${rbV(Fg)}$.`),
        nmVal("Give the repulsive force $F_o$ at $p_s$.", rbLst(Fo, 3), 2, `$\\|p_s - p_o\\| = ${rt(dd)}$: $F_o = ${c}\\frac{${rbV(v)}}{${rt(dd ** 3)}} = ${rbV(Fo)}$.`),
        nmVal("Give the resulting force.", rbLst(Fr, 3), 1, `$${rbV(Fr)}$${Fr[0] === 0 && Fr[1] === 0 ? " — zero: the robot is stuck in a local minimum" : ""}.`),
        nmMC("Which problem can the potential field method run into?", ["Local minima, where attraction and repulsion cancel; e.g. random walks or a navigation function help", "It needs a graph search", "It cannot handle a goal", "It only works in 3-D"], 1, "Also oscillations in narrow passages."),
        nmMC("Why a quadratic attractive potential instead of $\\|p - p_g\\|$?", ["Its force shrinks near the goal, so the robot slows down; the linear one has a constant force and is not differentiable at the goal", "It is cheaper to compute", "It avoids obstacles", "It has no minimum"], 1, "Without friction the robot still overshoots and oscillates."),
      ],
    };
  },
});

rbTask({
  id: "planconcepts", topic: "plan", name: "Motion planning: the terms", like: "E15_WS_2022-23/3",
  make() {
    const n = rint(5, 9);
    return {
      intro: `<p>A stationary robot arm with ${n} revolute joints must move from one configuration to another without hitting a shelf.</p>`,
      parts: [
        nmVal("How many dimensions does its configuration space have?", String(n), 1, "One per joint."),
        nmMC("Which class of planners suits this best?", ["Sampling-based planners (RRT, PRM): grids grow exponentially with the dimension", "A* on a fine grid of C", "Visibility graphs", "Exact cell decomposition"], 1, "Curse of dimensionality."),
        nmMC("What is a complete algorithm?", ["One that finds a solution in finite time if one exists, and otherwise reports that there is none", "One that always finds the optimal path", "One that finds a solution with probability 1 eventually", "One that needs no collision checks"], 1, "Probabilistically complete: the probability converges to 1."),
        nmMC("Joint limits and the duration of a motion are …", ["a constraint and a quality criterion", "both constraints", "both quality criteria", "a quality criterion and a constraint"], 1, "Constraints must hold; criteria are optimised."),
        nmMC("What is special about the edges of a Voronoi diagram?", ["Their points are equally far from the two nearest obstacles — maximum clearance", "They are the shortest paths", "They touch the obstacles", "They are random"], 1, "Paths along them keep as far away as possible."),
      ],
    };
  },
});

/* ================================================================ Grasping */

rbTask({
  id: "wrench", topic: "grasp", name: "Wrenches of a planar grasp", like: "E22_SS_2026/4",
  make() {
    let ps, fs, c, A;
    do {
      ps = [rbIntV(2, 0, 6), rbIntV(2, 0, 6)]; fs = [rbIntV(2, -2, 2), rbIntV(2, -2, 2)]; c = rbIntV(2, 0, 4);
      A = -fs[0][1] * fs[1][0] + fs[0][0] * fs[1][1];
    } while (fs.some((f) => !f[0] && !f[1]) || !A);
    const tau = (p, f, cc) => (p[0] - cc[0]) * f[1] - (p[1] - cc[1]) * f[0];
    const w = ps.map((p, i) => [...fs[i], tau(p, fs[i], c)]);
    const dx = rint(1, 3);
    return {
      intro: `<p>A planar grasp with rigid point contacts without friction. The wrenches $w = (f_x, f_y, \\tau)^\\top$ use $\\tau = (p - c)\\times f = (p_x - c_x)f_y - (p_y - c_y)f_x$ with a reference point $c$.
        Contact 1 at $p_1 = (${ps[0].join(", ")})$ with force $f_1 = (${fs[0].join(", ")})$, contact 2 at $p_2 = (${ps[1].join(", ")})$ with $f_2 = (${fs[1].join(", ")})$.</p>`,
      parts: [
        nmVal(`Compute $w_1$ for $c = (${c.join(", ")})$.`, rbLst(w[0]), 1, `$\\tau_1 = (${ps[0][0]} - ${c[0]})\\cdot${fs[0][1]} - (${ps[0][1]} - ${c[1]})\\cdot${fs[0][0]} = ${w[0][2]}$.`),
        nmVal("And $w_2$.", rbLst(w[1]), 1, `$\\tau_2 = ${w[1][2]}$.`),
        nmVal(`The reference point is moved by $\\Delta x = ${dx}$ along $+x$. Give the new torques $\\tau_1'$; $\\tau_2'$.`, rbLst([w[0][2] - dx * fs[0][1], w[1][2] - dx * fs[1][1]]), 2, `$\\tau' = \\tau - \\Delta x\\,f_y$; the forces stay the same.`),
        nmVal(`Now the other way round: someone gives you only $w_1$, $w_2$ and the contact points. Recover $c$ ($c_x$; $c_y$).`, rbLst(c), 2, "Each wrench gives one linear equation $\\tau_i = (p_{i,x} - c_x)f_{i,y} - (p_{i,y} - c_y)f_{i,x}$ — two equations, two unknowns."),
        nmMC("How many wrenches does a contact give?", ["Without friction 1 (the normal force), with friction 2 in the plane (the edges of the friction triangle)", "Always 3", "Always 1", "With friction infinitely many, so none can be listed"], 1, "So $m = n$ or $m = 2n$."),
      ],
    };
  },
});

rbTask({
  id: "friction", topic: "grasp", name: "Friction triangle", like: "E20_SS_2025/4",
  make() {
    const mu = nmPick([0.2, 0.25, 0.4, 0.5, 0.75, 1]), fn = rint(2, 6) * 2, dir = pick([[0, 1], [1, 0], [0, -1], [-1, 0]]);
    const t = [-dir[1], dir[0]], f = (s) => [dir[0] * fn + s * mu * fn * t[0], dir[1] * fn + s * mu * fn * t[1]];
    const fa = f(1), fb = f(-1), p = rbIntV(2, -3, 3), wa = [...fa, p[0] * fa[1] - p[1] * fa[0]];
    const mu2 = nmPick([0.3, 0.5, 0.6]), fn2 = nmPick([5, 10]), ft2 = rbR(mu2 * fn2);
    return {
      intro: `<p>A rigid point contact with friction (Coulomb, coefficient $\\mu$) in the plane. The normal force is $f_n$; the edges of the friction triangle are $f_a$ and $f_b$.</p>`,
      parts: [
        nmVal(`Let $f_n = (0, ${fn2})^\\top$ and $f_a = (${-ft2}, ${fn2})^\\top$. Compute $\\mu$.`, String(mu2), 1, `$\\mu = \\frac{\\|f_t\\|}{\\|f_n\\|} = \\frac{${ft2}}{${fn2}}$.`),
        nmVal(`For $\\mu = ${mu}$: the angle $\\alpha$ between the normal and an edge, in degrees.`, String(rbR(rbDeg(Math.atan(mu)), 2)), 1, `$\\tan\\alpha = \\mu$, $\\alpha = \\arctan ${mu} = ${rt(rbDeg(Math.atan(mu)))}°$.`),
        nmVal(`With $f_n = (${dir.map((x) => x * fn).join(", ")})^\\top$ and $\\mu = ${mu}$: give the two edges $f_a$; $f_b$ (4 numbers, $f_a$ turned counter-clockwise from $f_n$).`, rbLst([...fa, ...fb], 3), 2, `$f_{a,b} = f_n \\pm \\mu\\|f_n\\|\\,t$ with the unit tangent $t = (${t.join(", ")})$.`),
        nmVal(`The contact is at $p = (${p.join(", ")})$, reference point the origin. Give the wrench of $f_a$.`, rbLst(wa, 3), 1, `$\\tau = p_xf_y - p_yf_x = ${rt(wa[2])}$.`),
        nmMC("What does the convex hull of $f_a$ and $f_b$ mean physically?", ["All forces the contact can transmit without slipping (for this normal force)", "All possible contact points", "The grasp wrench space", "The forces that make the object slip"], 1, "A larger $\\mu$ opens the triangle."),
      ],
    };
  },
});

rbTask({
  id: "closure", topic: "grasp", name: "Form closure, force closure, quality", like: "E21_WS_2025-26/4",
  make() {
    const n = rint(2, 4);
    return {
      intro: `<p>A planar grasp with ${n} rigid point contacts.</p>`,
      parts: [
        nmVal(`With friction, how many wrenches does it generate, and what size is the grasp matrix (rows; columns)?`, `${2 * n}; 3; ${2 * n}`, 1, `$m = 2n = ${2 * n}$ wrenches in $\\mathbb R^3$: the grasp matrix is $3 \\times ${2 * n}$.`),
        nmVal("How many frictionless contacts does form closure need at least: in the plane; in space?", "4; 7", 1, "One more than the dimension of the wrench space (3 resp. 6)."),
        nmMC("Which is stricter?", ["Form closure: it holds against any external wrench without friction", "Force closure", "They are the same", "Neither is a criterion"], 1, "Every form-closure grasp is force-closure, not the other way round."),
        nmMC("When is a grasp force-closure (with the GWS as the convex hull of its wrenches)?", ["When the origin lies in the interior of the convex hull", "When the convex hull contains at least one wrench", "When all wrenches point inwards", "When the ε-metric is negative"], 1, "Then it can resist any small disturbance."),
        nmMC("What does the ε-metric measure?", ["The radius of the largest ball around the origin inside the GWS — the weakest direction", "The number of contacts", "The friction coefficient", "The object's mass"], 1, "It depends on the reference point and on the units of force vs torque."),
        nmMC("A generated wrench is $w = Gk$. Which conditions on $k$ give exactly the GWS (the convex hull)?", ["$k_i \\ge 0$ and $\\sum_i k_i = 1$", "$k_i \\ge 0$ only", "$\\sum_i k_i = 0$", "$k_i \\in \\{0, 1\\}$"], 1, "Without $\\sum k_i = 1$ it would be the cone."),
      ],
    };
  },
});

/* ================================================================ Robot vision */

rbTask({
  id: "camera", topic: "vision", name: "The extended camera model", like: "E22_SS_2026/5",
  make() {
    const fx = nmPick([100, 200, 250, 400, 500]), fy = nmPick([100, 200, 250, 400]), cx = rint(0, 10), cy = rint(0, 10);
    const z = nmPick([10, 20, 50, 100]), x = rint(-4, 4), y = rint(-4, 4);
    const u = cx + (fx * x) / z, v = cy + (fy * y) / z;
    const z2 = nmPick([20, 50, 100]), u2 = cx + rint(-10, 10) * 5, v2 = cy + rint(-10, 10) * 5;
    const f = nmPick([10, 20, 35]), L = nmPick([0.5, 1, 2]), Z = nmPick([2, 5, 10]);
    return {
      intro: `<p>A camera with $K = \\begin{pmatrix}${fx} & 0 & ${cx}\\\\ 0 & ${fy} & ${cy}\\\\ 0&0&1\\end{pmatrix}$ (extended pinhole model, positive image plane).</p>`,
      parts: [
        nmVal(`Project the point $(x, y, z) = (${x}, ${y}, ${z})$ (camera coordinates): give $u$; $v$.`, rbLst([u, v], 3), 2, `$u = c_x + f_x\\frac xz = ${rt(u)}$, $v = c_y + f_y\\frac yz = ${rt(v)}$.`),
        nmVal(`An image point $(u, v) = (${u2}, ${v2})$ has depth $z = ${z2}$. Give its camera coordinates $x$; $y$.`, rbLst([((u2 - cx) * z2) / fx, ((v2 - cy) * z2) / fy], 3), 2, `$x = \\frac{(u - c_x)z}{f_x}$, $y = \\frac{(v - c_y)z}{f_y}$.`),
        nmMC("What are $f_x, f_y, c_x, c_y$?", ["Intrinsic parameters: focal lengths in pixels and the principal point (where the optical axis meets the image)", "Extrinsic parameters: the camera's pose", "Distortion coefficients", "The image size"], 1, "Extrinsic: rotation and translation of the camera in the world."),
        nmVal(`Classic pinhole camera with $f = ${f}$ mm: an object of length $${L}$ m at distance $${Z}$ m, parallel to the image plane. How long is its image, in mm?`, String(rbR((f * L) / Z, 3)), 1, `$l' = f\\frac{l}{z} = ${rt((f * L) / Z)}$ mm.`),
      ],
    };
  },
});

const RB_KER = {
  prewittX: { name: "Prewitt-X", k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]] },
  prewittY: { name: "Prewitt-Y", k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]] },
  sobelX: { name: "Sobel-X", k: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]] },
  sobelY: { name: "Sobel-Y", k: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]] },
};
rbTask({
  id: "filter", topic: "vision", name: "Filtering an image by hand", like: "E20_SS_2025/5",
  make() {
    const img = Array.from({ length: 5 }, () => rbIntV(5, 0, 9)), kk = pick(Object.keys(RB_KER)), K = RB_KER[kk].k, conv = Math.random() < 0.5;
    const at = (i, j) => { let s = 0; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) s += K[a + 1][b + 1] * (conv ? img[i - a][j - b] : img[i + a][j + b]); return s; };
    const i1 = rint(1, 3), j1 = rint(1, 3), i2 = rint(1, 3), j2 = rint(1, 3);
    return {
      intro: `<p>Apply the ${RB_KER[kk].name} filter by <b>${conv ? "convolution" : "correlation"}</b> to the grey image $I$ (rows from the top, columns from the left, both counted from 1):</p>
        ${tx(`I = ${tmx(img)},\\qquad ${RB_KER[kk].name.replace("-", "_")} = ${tmx(K)}`)}`,
      parts: [
        nmVal(`Give the result at row ${i1 + 1}, column ${j1 + 1}.`, String(at(i1, j1)), 2, `${conv ? "Convolution flips the kernel by 180° before multiplying — for these antisymmetric kernels that flips the sign compared with correlation." : "Correlation: lay the kernel over the 3 × 3 neighbourhood and add up the products."} Result: ${at(i1, j1)}.`),
        nmVal(`And at row ${i2 + 1}, column ${j2 + 1}.`, String(at(i2, j2)), 1, `${at(i2, j2)}.`),
        nmMC("The filter is replaced by twice the kernel. What happens to the result?", ["It doubles — filtering is linear", "It stays the same", "It is squared", "The edges disappear"], 1, "Linear filters: scaling and superposition."),
        nmMC("Which filter suits salt-and-pepper noise best?", ["The median filter — it ignores single outliers", "A Gaussian filter", "A Sobel filter", "A Laplace filter"], 1, "Gaussian noise: Gaussian or mean filter (low-pass)."),
      ],
    };
  },
});

rbTask({
  id: "ransac", topic: "vision", name: "RANSAC for a line", like: "E11_WS_2020-21/5",
  make() {
    let P, t, it, cnt;
    for (;;) {
      P = Array.from({ length: 7 }, () => rbIntV(2, 0, 10));
      t = nmPick([1, 1.5, 2]);
      it = [[0, 1], [2, 3]].map(() => { const a = rint(0, 6); let b = rint(0, 6); while (b === a) b = rint(0, 6); return [a, b]; });
      let bad = false;
      cnt = it.map(([a, b]) => {
        const [x1, y1] = P[a], [x2, y2] = P[b], n = [y2 - y1, x1 - x2], len = Math.hypot(...n);
        if (!len) { bad = true; return 0; }
        return P.filter((p) => { const dist = Math.abs(n[0] * (p[0] - x1) + n[1] * (p[1] - y1)) / len; if (Math.abs(dist - t) < 0.05) bad = true; return dist <= t; }).length;
      });
      if (!bad && cnt[0] !== cnt[1]) break;
    }
    return {
      intro: `<p>Points: ${P.map((p, i) => `$p_${i + 1} = (${p.join(", ")})$`).join(", ")}. RANSAC fits a line through two random points and counts the inliers within distance $${t}$ (the two chosen points count too).</p>`,
      parts: [
        nmVal(`Iteration 1 picks $p_${it[0][0] + 1}$ and $p_${it[0][1] + 1}$, iteration 2 picks $p_${it[1][0] + 1}$ and $p_${it[1][1] + 1}$. How many inliers does each line have?`, `${cnt[0]}; ${cnt[1]}`, 3, "Distance of $p$ to the line through $a$, $b$: $\\frac{|n\\cdot(p - a)|}{\\|n\\|}$ with the normal $n = (b_y - a_y,\\ a_x - b_x)$."),
        nmVal("Which iteration's model is kept? (1 or 2)", String(cnt[0] > cnt[1] ? 1 : 2), 1, "The one with more inliers; then it is usually refit to all its inliers."),
        nmMC("In which order does RANSAC work?", ["Pick a minimal random sample → fit the model → count the inliers → repeat and keep the best", "Fit to all points → remove the worst → repeat", "Count the inliers → pick a sample → fit", "Sort the points → fit the first two"], 1, "The minimal sample for a line is 2 points."),
        nmMC("A strength and a weakness?", ["Robust to many outliers; random, so the number of iterations and the threshold must be chosen", "Exact; slow for few points", "Needs no threshold; only for lines", "Deterministic; not robust"], 1, "More outliers → more iterations needed."),
      ],
    };
  },
});

rbTask({
  id: "visconcepts", topic: "vision", name: "Robot vision: the terms", like: "E16_SS_2023/5",
  make() {
    const w = nmPick([640, 1280, 1920]), h = { 640: 480, 1280: 720, 1920: 1080 }[w], fps = nmPick([15, 30, 60]);
    const mb = (w * h * 3) / 1e6;
    return {
      intro: `<p>A robot's head camera delivers RGB images of ${w} × ${h} pixels, one byte per channel, at ${fps} images per second. (1 MB = 10⁶ bytes.)</p>`,
      parts: [
        nmVal("How many MB is one image?", String(rbR(mb, 3)), 1, `$${w}\\cdot${h}\\cdot3$ bytes $= ${rt(mb)}$ MB.`),
        nmMC(`Is USB 2.0 (480 Mbit/s) enough for the stream?`, mb * 8 * fps <= 480 ? [`Yes: ${rt(mb * 8 * fps)} Mbit/s`, `No: ${rt(mb * 8 * fps)} Mbit/s`, "Yes, because it is compressed anyway", "No, USB cannot carry images"] : [`No: it needs ${rt(mb * 8 * fps)} Mbit/s`, `Yes: ${rt(mb * 8 * fps)} Mbit/s`, "Yes, USB is always fast enough", "Only at night"], 1, "MB × 8 × images per second."),
        nmMC("Why segment colours in HSV rather than RGB?", ["Hue is separate from brightness, so a hue range stays the same under changing light", "HSV has more colours", "RGB cannot show red", "HSV images are smaller"], 1, "In RGB all three channels change with the light."),
        nmMC("Which are Canny's three criteria?", ["Good detection, good localisation, a single response per edge", "Speed, colour, size", "Low-pass, high-pass, band-pass", "Opening, closing, erosion"], 1, "Plus Gaussian smoothing, non-maximum suppression, double threshold and hysteresis."),
        nmMC("Position-based vs image-based visual servoing?", ["PBVS: error in 3-D Cartesian space after reconstructing the pose; IBVS: error directly between image features $s - s^*$", "Both use the same error", "PBVS uses only images, IBVS only 3-D", "IBVS needs a map of the room"], 1, "IBVS needs the image Jacobian (interaction matrix)."),
        nmMC("A binary mask has small noise pixels in the background. Which operation removes them?", ["Erosion (or opening)", "Dilation", "Closing", "A Sobel filter"], 1, "Holes inside the object: dilation or closing."),
      ],
    };
  },
});

/* ================================================================ Programming by demonstration */

const RB_PBD = [
  ["pouring juice into several cups", "where the spout is relative to the cup, how steep the bottle is held, the final fill level", "where exactly the cups stand, which hand pours, the colour of the bottle"],
  ["wiping a table", "the contact force, covering the whole dirty area, the wiping direction pattern", "the person's posture, where they started, the colour of the cloth"],
  ["stacking three cups", "the order of the cups, that each is centred on the one below", "the speed of the hand, which cup is picked first when all are equal, the table's position"],
  ["handing over a tool", "offering the handle, the height and distance of the hand-over, waiting until the person grasps", "the exact path through the air, the time of day, which arm"],
];
rbTask({
  id: "pbd", topic: "pbd", name: "Programming by demonstration", like: "E22_SS_2026/6",
  make() {
    const [task, rel, irr] = pick(RB_PBD);
    return {
      intro: `<p>A robot should learn ${task} from human demonstrations.</p>`,
      parts: [
        nmW(`“What to imitate”: name two properties of the demonstration that matter for ${task}, and two that do not.`, `Relevant: ${rel}. Irrelevant: ${irr}.`, [[1, "two relevant properties"], [1, "two irrelevant properties"]]),
        nmMC("Which are the four main questions of PbD?", ["Whom, what, when and how to imitate", "Where, why, which, who", "Sense, plan, act, learn", "Observe, segment, store, replay"], 1, "“How” includes the correspondence problem."),
        nmMC("What is the correspondence problem?", ["Mapping the human's body and motion onto the robot's different body (kinematics, dynamics)", "Matching image points between two cameras", "Assigning demonstrations to teachers", "Finding the start of a demonstration"], 1, "Human and robot are built differently."),
        nmMC("Why is PbD not a playback?", ["It generalises: from several demonstrations to new situations, not repeating one recorded trajectory", "Because it uses cameras", "Because the robot is faster", "It is a playback"], 1, "Playback = teach-in."),
        nmMC("Which is learned on a symbolic, which on a subsymbolic level?", ["Symbolic: the order of the steps; subsymbolic: the trajectories and forces", "Symbolic: the trajectories; subsymbolic: the order", "Both only symbolic", "Both only subsymbolic"], 1, "The symbolic model decides which subsymbolic skills run, in which order."),
        nmMC("Why segment demonstrations?", ["To split them into reusable actions (motion primitives) and find meaningful start and end points", "To compress the video", "To remove the human from the images", "To speed up the robot"], 1, "Criteria: velocity zero crossings, contact changes, object relations."),
      ],
    };
  },
});

/* ================================================================ Symbolic planning (STRIPS) */

// Blocks A, B, C; a state is a list of stacks (bottom first). move(X, Y, Z): X clear, on Y; Z clear or the table.
function rbBlocksKey(st) { return st.map((s) => s.join("")).filter(Boolean).sort().join("|"); }
function rbBlocksNext(st) {
  const out = [];
  st.forEach((s, i) => {
    if (!s.length) return;
    const x = s[s.length - 1], from = s.length > 1 ? s[s.length - 2] : "Table";
    if (s.length > 1) { const n = st.map((t) => [...t]); n[i].pop(); n.push([x]); out.push([`move(${x}, ${from}, Table)`, n.filter((t) => t.length)]); }
    st.forEach((t, j) => { if (j === i || !t.length) return; const n = st.map((u) => [...u]); n[i].pop(); n[j].push(x); out.push([`move(${x}, ${from}, ${t[t.length - 1]})`, n.filter((u) => u.length)]); });
  });
  return out;
}
function rbBlocksRandom() {
  const b = shuffle(["A", "B", "C"]), cut = rint(0, 3), cut2 = rint(cut, 3);
  return [b.slice(0, cut), b.slice(cut, cut2), b.slice(cut2)].filter((s) => s.length);
}
const rbPreds = (st) => st.flatMap((s) => s.map((x, i) => (i ? `on(${x}, ${s[i - 1]})` : `onTable(${x})`)).concat([`clear(${s[s.length - 1]})`])).sort().join(", ");

rbTask({
  id: "strips", topic: "task", name: "Planning in a blocks world", like: "E06_SS_2018/7",
  make() {
    let I, G, dist;
    do {
      I = rbBlocksRandom(); G = rbBlocksRandom();
      const seen = new Map([[rbBlocksKey(I), 0]]), q = [I];
      while (q.length) { const s = q.shift(); rbBlocksNext(s).forEach(([, n]) => { const k = rbBlocksKey(n); if (!seen.has(k)) { seen.set(k, seen.get(rbBlocksKey(s)) + 1); q.push(n); } }); }
      dist = seen.get(rbBlocksKey(G));
    } while (dist < 2);
    const moves = rbBlocksNext(I), [okName, okState] = pick(moves);
    const blocks = ["A", "B", "C"], tops = I.map((s) => s[s.length - 1]);
    const covered = blocks.filter((x) => !tops.includes(x));
    let bad = null;
    if (covered.length) {
      const x = covered[0], s = I.find((u) => u.includes(x)), k = s.indexOf(x);
      bad = `move(${x}, ${k ? s[k - 1] : "Table"}, Table)`;
    }
    const wrong = moves.filter(([n]) => n !== okName).map(([, s]) => rbPreds(s));
    return {
      intro: `<p>Blocks A, B, C. The only operator is</p>
        <p><code>move(X, Y, Z)</code> — pre: <code>clear(X), on(X, Y), clear(Z)</code> (the table is always clear); add: <code>on(X, Z), clear(Y)</code>; delete: <code>on(X, Y), clear(Z)</code>.</p>
        <p>Initial state: <code>${rbPreds(I)}</code>.<br>Goal: <code>${rbPreds(G)}</code>.</p>`,
      parts: [
        nmVal("How many actions does the shortest plan need?", String(dist), 2, `Breadth-first search over the states: ${dist} moves.`),
        ...(bad ? [nmMC(`Is <code>${bad}</code> applicable in the initial state?`, [`No: ${covered[0]} is not clear`, "Yes", `No: the table is not clear`, "Only after the goal is reached"], 1, "Precondition clear(X) fails.")] : []),
        nmMC(`Which state results from <code>${okName}</code> in the initial state?`, [rbPreds(okState), ...shuffle(wrong).slice(0, 2), rbPreds(I)].filter((x, i, a) => a.indexOf(x) === i), 1, "Add and delete lists applied to the initial state."),
        nmMC("Why does the initial state list no negated predicates?", ["Closed world assumption: what is not stated is false", "Because they are optional", "Because STRIPS cannot express negation at all", "Open world assumption"], 1, "Only true facts are listed."),
      ],
    };
  },
});
