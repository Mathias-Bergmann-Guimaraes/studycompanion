// Robotics I, chapter 3: Inverse Kinematics — why f⁻¹ need not exist (not injective, not
// surjective), the four cases of the planar 2-DoF arm, closed-form solutions (geometric with the law
// of cosines, algebraic by comparing coefficients), and numerical ones: gradient descent on
// e(θ) = ‖x_goal − f(θ)‖², the pseudoinverse, damped least squares and the SVD behind it.
// The arm has l₁ = l₂ = 1 as on the slides, so the target (0, 1.2) and the step lengths match theirs.

/* ---------------------------------------------------------------- Shared: the 2-DoF arm, l₁ = l₂ = 1 */

// Both closed-form solutions for a target (x, y), or why there are none / infinitely many.
function rbIK2(x, y, l1 = 1, l2 = 1) {
  const r2 = x * x + y * y, r = Math.sqrt(r2);
  if (r < 1e-6 && Math.abs(l1 - l2) < 1e-9) return { kind: "inf", sols: [] };
  const c2 = (r2 - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (c2 > 1 + 1e-9 || c2 < -1 - 1e-9) return { kind: "none", sols: [], c2 };
  const t2 = Math.acos(Math.max(-1, Math.min(1, c2)));
  const sol = (s) => { const b = s * t2; return [rbWrap(Math.atan2(y, x) - Math.atan2(l2 * Math.sin(b), l1 + l2 * Math.cos(b))), b]; };
  const one = Math.abs(Math.abs(c2) - 1) < 1e-3;
  return { kind: one ? "one" : "two", sols: one ? [sol(1)] : [sol(1), sol(-1)], c2 };
}

/* ---------------------------------------------------------------- 3.1 Four cases */

function rbWIK2(root) {
  const { w, fig, read } = ppW(root, "ik2");
  const st = { x: 0, y: 1.41 };
  const draw = () => {
    lenOut(w, "x", rbN(st.x, 2)); lenOut(w, "y", rbN(st.y, 2));
    const res = rbIK2(st.x, st.y);
    const P = rbFrame(300, 290, [-2.3, 2.3], [-2.1, 2.4], { l: 16, r: 10, t: 10, b: 16 });
    const sc = P.X(1) - P.X(0);
    let arms = "";
    if (res.kind === "inf") arms = [0, 1, 2, 3, 4, 5].map((k) => rbArmSVG(P, rbPlanar([(k * Math.PI) / 3, Math.PI], [1, 1]), { ghost: k > 0, labels: false })).join("");
    else arms = res.sols.map((s, i) => rbArmSVG(P, rbPlanar(s, [1, 1]), { ghost: i > 0, labels: i === 0 })).join("");
    if (res.kind === "none") {
      const a = Math.atan2(st.y, st.x);
      arms = rbArmSVG(P, rbPlanar([a, 0], [1, 1]), { cls: "rb-strain" });
    }
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 290" role="img" aria-label="Inverse kinematics of the 2-DoF arm">
      ${P.axes({ xt: [-2, -1, 1, 2], yt: [-1, 1, 2] })}
      <circle cx="${P.X(0)}" cy="${P.Y(0)}" r="${2 * sc}" class="rb-ws"/>
      ${arms}
      <circle cx="${P.X(st.x)}" cy="${P.Y(st.y)}" r="9" class="rb-goal-ring"/><circle cx="${P.X(st.x)}" cy="${P.Y(st.y)}" r="3" class="rb-goal"/>
    </svg>`;
    const deg = (s) => `(${rbN(s[0], 3)}, ${rbN(s[1], 3)}) rad = (${rbN(rbDeg(s[0]), 1)}°, ${rbN(rbDeg(s[1]), 1)}°)`;
    const label = { two: "Two solutions (normal case)", one: "Exactly one solution (boundary of the workspace)", none: "No solution (outside the workspace)", inf: "Infinitely many solutions (target in the base)" }[res.kind];
    read.innerHTML = `<p><b>${label}</b></p>
      ${res.sols.length ? rbVals(res.sols.map((s, i) => [i ? "other elbow" : "elbow (θ₂ > 0)", deg(s)])) : ""}
      <p class="small">${res.kind === "none" ? `$\\|x\\| = ${rt(Math.hypot(st.x, st.y), 2)} > l_1 + l_2 = 2$: $f$ is not <b>surjective</b>. The error $\\|x - f(\\theta)\\|$ is smallest with the arm stretched towards the target.`
        : res.kind === "inf" ? "$\\theta_2 = \\pi$ folds link 2 back onto link 1; $\\theta_1$ is arbitrary."
        : res.kind === "two" ? "Two configurations, one target: $f$ is not <b>injective</b> — which one should $f^{-1}$ return?" : "The arm is stretched: both solutions coincide."}
        The slides' target $(0, \\sqrt2)$ gives $(\\frac\\pi4, \\frac\\pi2)$ and $(\\frac{3\\pi}4, -\\frac\\pi2)$.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.2 Geometric method */

function rbWGeo(root) {
  const { w, fig, read } = ppW(root, "geo");
  const st = { x: 1.2, y: 1, l1: 1.2, l2: 0.9, el: 1 };
  const draw = () => {
    ["x", "y", "l1", "l2"].forEach((k) => lenOut(w, k, rbN(st[k], 2)));
    const { x, y, l1, l2 } = st, r = Math.hypot(x, y);
    const P = rbFrame(300, 270, [-0.6, 2.4], [-0.5, 2.3], { l: 16, r: 10, t: 10, b: 16 });
    const cpsi = (x * x + y * y + l1 * l1 - l2 * l2) / (2 * l1 * r), c2 = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2);
    const ok = Math.abs(cpsi) <= 1 && Math.abs(c2) <= 1 && r > 1e-6;
    const beta = Math.atan2(y, x);
    let body = "", rd;
    if (ok) {
      const psi = Math.acos(cpsi), t1 = beta - st.el * psi, t2 = st.el * Math.acos(c2);
      const pts = rbPlanar([t1, t2], [l1, l2]);
      const arc = (rad, a0, a1, cls) => `<path d="M${P.X(rad * Math.cos(a0))},${P.Y(rad * Math.sin(a0))} A ${rad * (P.X(1) - P.X(0))} ${rad * (P.X(1) - P.X(0))} 0 0 ${a1 > a0 ? 0 : 1} ${P.X(rad * Math.cos(a1))},${P.Y(rad * Math.sin(a1))}" class="${cls}"/>`;
      body = `<line x1="${P.X(0)}" y1="${P.Y(0)}" x2="${P.X(x)}" y2="${P.Y(y)}" class="guide"/>
        ${arc(0.45, 0, beta, "rb-arc")}${arc(0.7, beta, t1, "rb-arc2")}
        <text x="${P.X(0.55 * Math.cos(beta / 2))}" y="${P.Y(0.55 * Math.sin(beta / 2)) + 4}" class="rb-jl">β</text>
        <text x="${P.X(0.82 * Math.cos((beta + t1) / 2))}" y="${P.Y(0.82 * Math.sin((beta + t1) / 2)) + 4}" class="rb-jl rb-err-t">ψ</text>
        ${rbArmSVG(P, pts)}`;
      rd = `<div class="nm-tex">$$\\cos\\psi = \\frac{x^2 + y^2 + l_1^2 - l_2^2}{2l_1\\sqrt{x^2 + y^2}} = ${rt(cpsi)},\\quad \\psi = ${rt(psi)}$$</div>
        <div class="nm-tex">$$\\beta = \\operatorname{atan2}(y, x) = ${rt(beta)},\\qquad \\theta_1 = \\beta ${st.el > 0 ? "-" : "+"} \\psi = ${rt(t1)}$$</div>
        <div class="nm-tex">$$\\cos\\theta_2 = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2} = ${rt(c2)},\\quad \\theta_2 = ${st.el > 0 ? "" : "-"}\\arccos(\\cdot) = ${rt(t2)}$$</div>`;
    } else rd = `<p class="small"><b class="rb-err-t">No triangle:</b> the target is ${r > l1 + l2 ? "farther than $l_1 + l_2$" : "closer than $|l_1 - l_2|$"} — out of reach.</p>`;
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 270" role="img" aria-label="Geometric solution">
      ${P.axes({ xt: [1, 2], yt: [1, 2], xl: "x", yl: "y" })}${body}
      <circle cx="${P.X(x)}" cy="${P.Y(y)}" r="9" class="rb-goal-ring"/><circle cx="${P.X(x)}" cy="${P.Y(y)}" r="3" class="rb-goal"/>
    </svg>`;
    read.innerHTML = rd;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- 3.4–3.6 Numerical methods */

const RB_TARGETS = { a: [0, 1.2], b: [1.4, 0.6], c: [0, 2.1] };
const RB_TH = [-1, 7]; // θ₁ and θ₂ range of the error map, as on the slides (about −π/4 … 2π + π/4)
const rbHeat = {};
// The error map e(θ) = ‖x_goal − f(θ)‖² as an image, white (0) to dark red (≥ 1.4) like the slides.
function rbHeatURL(goal) {
  const key = goal.join(",");
  if (rbHeat[key]) return rbHeat[key];
  const N = 140, c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d"), img = g.createImageData(N, N);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const t1 = RB_TH[0] + ((i + 0.5) / N) * (RB_TH[1] - RB_TH[0]), t2 = RB_TH[1] - ((j + 0.5) / N) * (RB_TH[1] - RB_TH[0]);
    const [x, y] = rbF2([t1, t2]), e = (goal[0] - x) ** 2 + (goal[1] - y) ** 2;
    const s = Math.min(1, e / 1.4) ** 0.6;
    const k = (j * N + i) * 4;
    img.data[k] = 255 - s * (255 - 150); img.data[k + 1] = 248 - s * (248 - 20); img.data[k + 2] = 240 - s * (240 - 20); img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return (rbHeat[key] = c.toDataURL());
}
// One step of a method from θ towards goal, or null if J Jᵀ (+ λ²I) cannot be inverted.
function rbIKStep(th, goal, method, gamma, lam) {
  const [x, y] = rbF2(th), e = [goal[0] - x, goal[1] - y], J = rbJ2(th);
  if (method === "gd") return [th[0] + gamma * 2 * (J[0][0] * e[0] + J[1][0] * e[1]), th[1] + gamma * 2 * (J[0][1] * e[0] + J[1][1] * e[1])];
  const l2 = method === "dls" ? lam * lam : 0;
  const A = rbMul(J, rbT(J)); A[0][0] += l2; A[1][1] += l2;
  const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
  if (Math.abs(det) < 1e-10) return null;
  const z = [(A[1][1] * e[0] - A[0][1] * e[1]) / det, (-A[1][0] * e[0] + A[0][0] * e[1]) / det];
  return [th[0] + gamma * (J[0][0] * z[0] + J[1][0] * z[1]), th[1] + gamma * (J[0][1] * z[0] + J[1][1] * z[1])];
}
const RB_METHODS = { gd: "gradient descent", pinv: "pseudoinverse", dls: "damped least squares" };
const RB_PRESET = { gd: { gamma: 0.2, lam: 0.5 }, pinv: { gamma: 0.2, lam: 0.5 }, dls: { gamma: 0.5, lam: 0.5 } };

function rbWNum(root, method) {
  const { w, fig, read, on } = ppW(root, "num");
  const st = { m: method, t: "a", gamma: RB_PRESET[method].gamma, lam: RB_PRESET[method].lam, path: [[Math.PI, Math.PI / 2]], stuck: false };
  const err = (th) => { const [x, y] = rbF2(th), g = RB_TARGETS[st.t]; return (g[0] - x) ** 2 + (g[1] - y) ** 2; };
  const reset = (th0 = st.path[0]) => { st.path = [th0]; st.stuck = false; };
  const step = (n) => {
    for (let k = 0; k < n && !st.stuck; k++) {
      const th = st.path.at(-1);
      if (err(th) < 1e-6) break;
      const nx = rbIKStep(th, RB_TARGETS[st.t], st.m, st.gamma, st.lam);
      if (!nx || !nx.every(isFinite) || Math.abs(nx[0]) > 60 || Math.abs(nx[1]) > 60) { st.stuck = true; break; }
      st.path.push(nx);
    }
    draw();
  };
  const draw = () => {
    lenOut(w, "gamma", rbN(st.gamma, 2)); lenOut(w, "lam", rbN(st.lam, 2));
    $$(".rb-lam", w).forEach((e) => (e.hidden = st.m !== "dls"));
    const goal = RB_TARGETS[st.t], th = st.path.at(-1), k = st.path.length - 1;
    const H = rbFrame(270, 270, RB_TH, RB_TH, { l: 26, r: 6, t: 6, b: 22 });
    const A = rbFrame(170, 170, [-2.2, 2.2], [-2.2, 2.2], { l: 6, r: 6, t: 6, b: 6 });
    const pi = Math.PI, ticks = [[0, "0"], [pi, "π"], [2 * pi, "2π"]];
    fig.innerHTML = `<div class="gk-two rb-num"><svg class="lw-svg rb-heat" viewBox="0 0 270 270" role="img" aria-label="Error map over θ₁ and θ₂">
        <defs><clipPath id="rbClip${method}"><rect x="${H.X(RB_TH[0])}" y="${H.Y(RB_TH[1])}" width="${H.X(RB_TH[1]) - H.X(RB_TH[0])}" height="${H.Y(RB_TH[0]) - H.Y(RB_TH[1])}"/></clipPath></defs>
        <image href="${rbHeatURL(goal)}" x="${H.X(RB_TH[0])}" y="${H.Y(RB_TH[1])}" width="${H.X(RB_TH[1]) - H.X(RB_TH[0])}" height="${H.Y(RB_TH[0]) - H.Y(RB_TH[1])}" preserveAspectRatio="none"/>
        ${ticks.map(([v, t]) => `<line x1="${H.X(v)}" y1="${H.Y(RB_TH[1])}" x2="${H.X(v)}" y2="${H.Y(RB_TH[0])}" class="rb-heat-g"/><line x1="${H.X(RB_TH[0])}" y1="${H.Y(v)}" x2="${H.X(RB_TH[1])}" y2="${H.Y(v)}" class="rb-heat-g"/>
          <text x="${H.X(v)}" y="266" text-anchor="middle" class="tick-t">${t}</text><text x="22" y="${H.Y(v) + 4}" text-anchor="end" class="tick-t">${t}</text>`).join("")}
        <g clip-path="url(#rbClip${method})">
          <path d="${st.path.map(([a, b], i) => `${i ? "L" : "M"}${H.X(a)},${H.Y(b)}`).join("")}" class="rb-path"/>
          ${st.path.map(([a, b], i) => `<circle cx="${H.X(a)}" cy="${H.Y(b)}" r="${i === 0 || i === k ? 4.5 : 2.6}" class="rb-pathpt ${i === 0 ? "start" : ""}"/>`).join("")}
        </g>
        <text x="268" y="${H.Y(RB_TH[0]) - 4}" text-anchor="end" class="ax-t">θ₁</text><text x="30" y="16" class="ax-t">θ₂</text>
      </svg><svg class="lw-svg" viewBox="0 0 170 170" role="img" aria-label="The arm">
        <circle cx="${A.X(0)}" cy="${A.Y(0)}" r="${2 * (A.X(1) - A.X(0))}" class="rb-ws"/>
        ${rbArmSVG(A, rbPlanar(st.path[0], [1, 1]), { ghost: true })}${rbArmSVG(A, rbPlanar(th, [1, 1]), { labels: false })}
        <circle cx="${A.X(goal[0])}" cy="${A.Y(goal[1])}" r="7" class="rb-goal-ring"/><circle cx="${A.X(goal[0])}" cy="${A.Y(goal[1])}" r="2.5" class="rb-goal"/>
      </svg></div>`;
    $("svg.rb-heat", fig).onclick = (e) => {
      const svg = e.currentTarget, p = svg.createSVGPoint();
      p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(svg.getScreenCTM().inverse());
      const t1 = RB_TH[0] + ((q.x - H.X(RB_TH[0])) / (H.X(RB_TH[1]) - H.X(RB_TH[0]))) * (RB_TH[1] - RB_TH[0]);
      const t2 = RB_TH[0] + ((H.Y(RB_TH[0]) - q.y) / (H.Y(RB_TH[0]) - H.Y(RB_TH[1]))) * (RB_TH[1] - RB_TH[0]);
      reset([t1, t2]); draw();
    };
    const e = err(th);
    const upd = { gd: "\\theta_{k+1} = \\theta_k + \\gamma\\cdot 2J^\\top(x_{goal} - f(\\theta_k))", pinv: "\\theta_{k+1} = \\theta_k + \\gamma\\,J^+(x_{goal} - f(\\theta_k))", dls: "\\theta_{k+1} = \\theta_k + \\gamma\\,J^\\top(JJ^\\top + \\lambda^2I)^{-1}(x_{goal} - f(\\theta_k))" }[st.m];
    read.innerHTML = `<div class="nm-tex">$$${upd}$$</div>
      ${rbVals([["iteration k", k], ["θₖ", `(${rbN(th[0])}, ${rbN(th[1])})`], ["e(θₖ) = ‖x_goal − f(θₖ)‖²", rbN(e, 5)], ["det J = sin θ₂", rbN(Math.sin(th[1]))]])}
      <p class="small">${st.stuck ? `<b class="rb-err-t">Stopped:</b> $JJ^\\top$ is not invertible here, or the step exploded — a singularity ($\\theta_2 = 0, \\pi$). ${st.m === "pinv" ? "Try damped least squares." : ""}`
        : e < 1e-6 ? "Converged." : "Click the map to choose a start $\\theta_0$; light = small error. The two light valleys are the two solutions (elbow up / down), repeated every $2\\pi$."}</p>`;
  };
  on("step", () => step(1));
  on("run", () => step(20));
  on("reset", () => { reset(); draw(); });
  on("sing", () => { reset([0.5, 0]); draw(); });
  $$("[data-seg]", w).forEach((seg) => $$("button", seg).forEach((b) => b.addEventListener("click", () => { reset(); draw(); })));
  lenWire(w, st, draw);
  $$("input[data-k]", w).forEach((inp) => inp.addEventListener("input", () => { reset(); draw(); }));
  draw();
}
const rbNumCtl = (method) => `${pseg("m", Object.entries(RB_METHODS), method)}
  ${pseg("t", [["a", "target (0, 1.2)"], ["b", "(1.4, 0.6)"], ["c", "(0, 2.1) out of reach"]], "a")}
  ${pslider("gamma", "step γ", 0.05, 1, 0.05, RB_PRESET[method].gamma)}
  <div class="rb-lam" ${method === "dls" ? "" : "hidden"}>${pslider("lam", "damping λ", 0.05, 1.5, 0.05, RB_PRESET[method].lam)}</div>
  <div class="lw-btns">${pbtn("step", "1 step", "primary")}${pbtn("run", "20 steps")}${pbtn("reset", "back to θ₀")}${pbtn("sing", "start at θ₂ = 0")}</div>`;

/* ---------------------------------------------------------------- 3.6 1/σ against σ/(σ² + λ²) */

function rbWSvd(root) {
  const { w, fig, read } = ppW(root, "svd");
  const st = { lam: 0.3 };
  const draw = () => {
    lenOut(w, "lam", rbN(st.lam, 2));
    const P = rbFrame(300, 220, [0, 2], [0, 5], { l: 26, r: 10, t: 10, b: 24 });
    const curve = (f) => { let d = ""; for (let i = 1; i <= 200; i++) { const s = (2 * i) / 200, v = f(s); if (v <= 5) d += `${d ? "L" : "M"}${P.X(s)},${P.Y(v)}`; } return d; };
    fig.innerHTML = `<svg class="lw-svg" viewBox="0 0 300 220" role="img" aria-label="Gain for each singular value">
      ${P.axes({ xt: [0.5, 1, 1.5, 2], yt: [1, 2, 3, 4, 5], xl: "σᵢ" })}
      <path d="${curve((s) => 1 / s)}" class="curve rb-c-pinv"/><path d="${curve((s) => s / (s * s + st.lam * st.lam))}" class="curve rb-c-dls"/>
      <text x="${P.X(0.24)}" y="${P.Y(4.6)}" class="tick-t rb-c-pinv-t">1/σ (pseudoinverse)</text>
      <text x="${P.X(st.lam) + 6}" y="${P.Y(1 / (2 * st.lam)) - 6}" class="tick-t rb-c-dls-t">σ/(σ² + λ²)</text>
    </svg>`;
    read.innerHTML = `<p class="small">How much each direction $u_i$ is amplified. The pseudoinverse divides by $\\sigma_i$ — unbounded as $\\sigma_i \\to 0$. Damped least squares peaks at $\\sigma = \\lambda$ with $\\frac1{2\\lambda} = ${rt(1 / (2 * st.lam), 2)}$
      and goes to 0 at a singularity; for $\\sigma_i \\gg \\lambda$ both agree.</p>`;
  };
  lenWire(w, st, draw);
  draw();
}

/* ---------------------------------------------------------------- Chapter */

ROB_CHAPTERS.push({
  n: 3, title: "Inverse Kinematics",
  headline: "How do I move my hand to the target? — <span class=\"accent\">inverse kinematics</span>",
  intro: "Given a target pose, find the joint angles: $\\theta = f^{-1}(x)$. Often there are several answers, sometimes none. Closed-form methods solve small arms exactly; numerical methods walk towards the target with the Jacobian — and must take care near singularities.",
  sections: [
    {
      id: "3.1", title: "The inverse kinematics problem", short: "The problem", about: "$f$ is neither injective nor surjective; the four cases of the 2-DoF arm",
      html: () => `
        ${ppGist([
          "Forward kinematics $x = f(\\theta)$, $f: C \\to X$. Inverse kinematics wants $\\theta = f^{-1}(x)$ — but $f^{-1}$ only exists if $f$ is <b>bijective</b>, and in general it is not.",
          "<b>Not injective</b> — $f(\\theta_a) = f(\\theta_b)$ with $\\theta_a \\ne \\theta_b$: elbow up and elbow down reach the same point. <b>Not surjective</b> — some $x$ have no $\\theta$ at all: outside the workspace (partly remedied by restricting $X$ to the workspace).",
          "Planar 2-DoF arm with $l_1 = l_2$: <b>two</b> solutions (normal case), <b>one</b> (boundary of the workspace), <b>none</b> (outside), <b>infinitely many</b> (target in the base: $\\theta_2 = \\pi$, $\\theta_1$ arbitrary).",
          "In general: solve ${}^{0}T_n(\\theta) = T_{goal}$ for $\\theta$ — a <b>non-linear</b> problem.",
        ])}
        ${pw("ik2", `${pslider("x", "target x", -2.2, 2.2, 0.01, 0)}${pslider("y", "target y", -2, 2.3, 0.01, 1.41)}<p class="small muted">$l_1 = l_2 = 1$. Try $(0, 2)$, $(0, 2.1)$ and $(0, 0)$.</p>`, { wide: true })}
        <div class="card">
          <h3>In general</h3>
          ${ppFacts([
            ["Unique", "exactly one solution"],
            ["Finitely many", "e.g. elbow up and elbow down"],
            ["Infinitely many", "a whole set of configurations: self-motion in the <b>null space</b> (redundant robots, or special targets)"],
            ["None", "outside the workspace"],
          ])}
          <p class="small">A 3-DoF planar arm reaching only a point has $n = 3 > m = 2$: for most targets a whole curve of solutions.</p>
        </div>
        ${ppTraps([
          "Injective: <b>at most</b> one $\\theta$ per $x$. Surjective: <b>at least</b> one. Elbow up/down breaks injectivity, an unreachable target surjectivity.",
          "A target on the boundary has one solution, not none.",
        ])}`,
      setup: (root) => rbWIK2(root),
      check: [
        { q: "Elbow up and elbow down reach the same point. Which property does $f$ lack?", opts: ["Injectivity", "Surjectivity", "Continuity", "Linearity"], why: "Two different $\\theta$ map to the same $x$." },
        { q: "A target outside the workspace shows that $f$ is not …", opts: ["surjective", "injective", "differentiable", "linear"], why: "No $\\theta$ reaches it." },
        { q: "2-DoF arm, $l_1 = l_2 = 1$, target $(0, 0)$: how many solutions?", opts: ["Infinitely many ($\\theta_2 = \\pi$, any $\\theta_1$)", "None", "One", "Two"], why: "Link 2 is folded back onto link 1." },
        { q: "2-DoF arm, $l_1 = l_2 = 1$, target $(0, 2)$: how many solutions?", opts: ["One — the boundary of the workspace", "Two", "None", "Infinitely many"], why: "Fully stretched: $\\theta = (\\pi/2, 0)$." },
        { q: "Target $(0, \\sqrt2)$, $l_1 = l_2 = 1$. Which is a solution?", opts: ["$(\\pi/4, \\pi/2)$", "$(\\pi/2, \\pi/4)$", "$(\\pi/4, -\\pi/4)$", "$(0, \\pi/2)$"], why: "The other one is $(3\\pi/4, -\\pi/2)$." },
      ],
    },
    {
      id: "3.2", title: "Closed form: the geometric method", short: "Geometric", about: "Law of cosines, atan2, elbow up and down; the half-angle substitution",
      html: () => `
        ${ppGist([
          "Find $\\theta$ from the target by <b>geometry</b> — trigonometry and the laws of sines and cosines; the kinematic model is not used directly.",
          "Law of cosines in the triangle base–elbow–target gives the elbow: $\\cos\\theta_2 = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2}$.",
          "Then the shoulder: $\\theta_1 = \\beta \\mp \\psi$ with $\\beta = \\operatorname{atan2}(y, x)$ and $\\cos\\psi = \\frac{x^2 + y^2 + l_1^2 - l_2^2}{2l_1\\sqrt{x^2 + y^2}}$; the sign picks the elbow.",
        ])}
        ${pw("geo", `${pslider("x", "target x", -0.4, 2.3, 0.05, 1.2)}${pslider("y", "target y", -0.4, 2.2, 0.05, 1)}${pslider("l1", "l₁", 0.4, 1.5, 0.05, 1.2)}${pslider("l2", "l₂", 0.4, 1.5, 0.05, 0.9)}
          ${pseg("el", [[1, "θ₂ > 0"], [-1, "θ₂ < 0 (mirrored elbow)"]], 1)}`, { wide: true })}
        <div class="card">
          <h3>On the slides</h3>
          <p class="small">The first drawing marks $\\theta_2$ as the <b>inner</b> angle at the elbow; the law of cosines then reads $x^2 + y^2 = l_1^2 + l_2^2 - 2l_1l_2\\cos(\\theta_2)$, so
            $\\cos\\theta_2 = -\\frac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2}$. The joint angle measured from link 1 is $\\pi$ minus that inner angle — and its cosine has the other sign, as above.
            For $\\beta$, $\\tan\\beta = y/x$: $\\beta = \\arctan(y/x)$ for $x > 0$ and $\\arctan(y/x) + \\pi$ for $x < 0$ — which is what $\\operatorname{atan2}(y, x)$ does.</p>
          <h3>Polynomialisation</h3>
          <p class="small">Equations in $\\cos\\theta$ and $\\sin\\theta$ (transcendental) are hard. Substitute $u = \\tan\\frac\\theta2$:</p>
          ${tx(`\\cos\\theta = \\frac{1 - u^2}{1 + u^2},\\qquad \\sin\\theta = \\frac{2u}{1 + u^2}`)}
          <p class="small">— and you are left with a polynomial equation in $u$.</p>
        </div>
        ${ppTraps([
          "Use $\\operatorname{atan2}(y, x)$, not $\\arctan(y/x)$: the latter loses the quadrant.",
          "$\\arccos$ gives one value in $[0, \\pi]$; the second solution is its negative (the mirrored elbow).",
          "Check which angle a drawing calls $\\theta_2$: the joint angle or the inner angle of the triangle.",
        ])}`,
      setup: (root) => rbWGeo(root),
      check: [
        { q: "Which law gives the elbow angle of the 2-link arm?", opts: ["The law of cosines in the triangle base–elbow–target", "The law of sines alone", "Pythagoras in the triangle base–target–x axis", "The chain rule"], why: "$x^2 + y^2 = l_1^2 + l_2^2 + 2l_1l_2\\cos\\theta_2$ for the joint angle." },
        { q: "Why are there two solutions for $\\theta_2$?", opts: ["$\\cos\\theta_2 = \\cos(-\\theta_2)$: elbow up and elbow down", "Because $\\tan$ has period $\\pi$", "Because of gimbal lock", "There is only one"], why: "$\\arccos$ returns one of them; the other is its negative." },
        { q: "Why use $\\operatorname{atan2}(y, x)$ for $\\beta$?", opts: ["It returns the right quadrant", "It is faster", "It avoids singularities", "It gives degrees instead of radians"], why: "$\\arctan(y/x)$ cannot tell $(x, y)$ from $(-x, -y)$." },
        { q: "What does $u = \\tan(\\theta/2)$ do?", opts: ["Turns equations in $\\sin\\theta$, $\\cos\\theta$ into polynomials in $u$", "Linearises the forward kinematics", "Computes the Jacobian", "Avoids singularities"], why: "$\\cos\\theta = \\frac{1-u^2}{1+u^2}$, $\\sin\\theta = \\frac{2u}{1+u^2}$." },
      ],
    },
    {
      id: "3.3", title: "Closed form: the algebraic method", short: "Algebraic", about: "Compare coefficients of $T_{goal}$ and ${}^{0}T_n(\\theta)$; peel off one joint at a time",
      html: () => `
        ${ppGist([
          "Set the target pose equal to the kinematic model, $T_{goal} = {}^{0}T_n(\\theta)$, and <b>compare coefficients</b>: $t_{ij} = a_{ij}(\\theta)$.",
          "16 equations; 4 are trivial ($0 = 0$, $1 = 1$): <b>12 non-trivial, only 6 independent</b>.",
          "Often not all angles fall out at once. Multiply by inverses to move one joint after another to the left: ${}^{0}T_1^{-1}T_{goal} = {}^{1}T_2\\cdots{}^{5}T_6$, look for an equation with one unknown, solve, substitute, repeat.",
        ])}
        <div class="card">
          <h3>Example: the planar arm with orientation</h3>
          ${tx(`\\begin{pmatrix}\\cos\\varphi & -\\sin\\varphi & 0 & x\\\\ \\sin\\varphi & \\cos\\varphi & 0 & y\\\\ 0&0&1&0\\\\0&0&0&1\\end{pmatrix} = \\begin{pmatrix}c_{12} & -s_{12} & 0 & l_1c_1 + l_2c_{12}\\\\ s_{12} & c_{12} & 0 & l_1s_1 + l_2s_{12}\\\\ 0&0&1&0\\\\0&0&0&1\\end{pmatrix}`)}
          <p class="small">(1) $\\cos\\varphi = c_{12}$, (2) $\\sin\\varphi = s_{12}$, (3) $x = l_1c_1 + l_2c_{12}$, (4) $y = l_1s_1 + l_2s_{12}$. Square (3) and (4) and add, with $c_1^2 + s_1^2 = 1$ and $c_1c_{12} + s_1s_{12} = c_2$:</p>
          ${tx(`x^2 + y^2 = l_1^2 + l_2^2 + 2l_1l_2c_2 \\quad\\Longrightarrow\\quad c_2 = \\frac{x^2 + y^2 - l_1^2 - l_2^2}{2l_1l_2}`)}
          <p class="small">Two solutions, $\\cos\\theta_2 = \\cos(-\\theta_2)$: elbow up and elbow down. For $\\theta_1$, expand $c_{12} = c_1c_2 - s_1s_2$:
            $x = c_1(l_1 + l_2c_2) - s_1l_2s_2$, $y = s_1(l_1 + l_2c_2) + c_1l_2s_2$ — linear in $c_1$, $s_1$, but awkward by hand: templates for typical equations, or symbolic maths (Matlab, Maple, Mathematica).</p>
          <h3>The procedure for six joints</h3>
          ${tx(`\\begin{aligned} {}^{0}T_1^{-1}\\,T_{goal} &= {}^{1}T_2\\,{}^{2}T_3\\,{}^{3}T_4\\,{}^{4}T_5\\,{}^{5}T_6\\\\ {}^{1}T_2^{-1}\\,{}^{0}T_1^{-1}\\,T_{goal} &= {}^{2}T_3\\,{}^{3}T_4\\,{}^{4}T_5\\,{}^{5}T_6\\\\ &\\ \\ \\vdots\\\\ T_{goal}\\,{}^{5}T_6^{-1} &= {}^{0}T_1\\,{}^{1}T_2\\,{}^{2}T_3\\,{}^{3}T_4\\,{}^{4}T_5\\end{aligned}`)}
          <p class="small">1. Invert $\{}^{0}T_1(\\theta_1)$ symbolically ($\\theta_1$ stays unknown) and multiply. 2. Find an equation with one unknown and solve it. 3. Substitute and look for the next.
            4. If nothing more falls out, invert the next matrix. 5. Repeat until all angles are known. Each matrix equation gives 12 non-trivial equations; the inverses can also be peeled from the right.</p>
        </div>
        ${ppTraps([
          "12 non-trivial equations, but only 6 are independent — don't expect 12 unknowns to be solvable.",
          "Inverting ${}^{0}T_1$ symbolically uses $T^{-1} = \\begin{pmatrix}R^\\top & -R^\\top t\\\\0&1\\end{pmatrix}$, not a general matrix inverse.",
        ])}`,
      check: [
        { q: "How many non-trivial, independent equations does $T_{goal} = {}^{0}T_n(\\theta)$ give in 3-D?", opts: ["12 non-trivial, 6 independent", "16 independent", "12 independent", "6 non-trivial"], why: "4 entries are trivially $0 = 0$ or $1 = 1$; rotation has 3 DoF, translation 3." },
        { q: "What is the first step of the algebraic procedure?", opts: ["Invert ${}^{0}T_1(\\theta_1)$ symbolically and multiply both sides by it", "Compute the Jacobian", "Guess $\\theta_1$", "Invert the whole ${}^{0}T_6$ numerically"], why: "Then look for an equation with only one unknown." },
        { q: "Planar arm: squaring and adding $x$ and $y$ gives …", opts: ["$x^2 + y^2 = l_1^2 + l_2^2 + 2l_1l_2\\cos\\theta_2$", "$x^2 + y^2 = (l_1 + l_2)^2$", "$x + y = l_1 + l_2$", "$x^2 - y^2 = l_1^2 - l_2^2$"], why: "Using $c_1c_{12} + s_1s_{12} = \\cos\\theta_2$." },
        { q: "What does the method compare?", opts: ["The entries (coefficients) of the target matrix and the model matrix", "The determinants", "The Jacobians", "Eigenvalues"], why: "$t_{ij} = a_{ij}(\\theta)$." },
      ],
    },
    {
      id: "3.4", title: "Numerical: gradient descent", short: "Gradient descent", about: "Minimise $e(\\theta) = \\|x_{goal} - f(\\theta)\\|^2$ with $\\nabla e = -2J^\\top(x_{goal} - f)$",
      html: () => `
        ${ppGist([
          "Turn IK into optimisation: minimise the error $e(\\theta) = \\|x_{goal} - f(\\theta)\\|^2$; a solution has $e(\\theta) = 0$.",
          "Chain rule: $\\nabla e(\\theta) = -2J^\\top(\\theta)\\,(x_{goal} - f(\\theta))$ — the Jacobian again.",
          "Start at $\\theta_0$, step length $\\gamma > 0$; while $e(\\theta_k)$ is above a threshold: $\\theta_{k+1} = \\theta_k - \\gamma\\nabla e(\\theta_k)$.",
          "Which solution you end up in depends on $\\theta_0$; outside the workspace it ends at the smallest error, not at the target.",
        ])}
        ${pw("num", rbNumCtl("gd"), { wide: true })}
        <div class="card">
          <h3>Deriving the gradient</h3>
          ${tx(`\\frac{\\partial e}{\\partial\\theta} = \\frac{\\partial}{\\partial\\theta}(x_{goal} - f)^\\top(x_{goal} - f) = -2(x_{goal} - f(\\theta))^\\top J(\\theta) \\in \\mathbb R^{1\\times n}`)}
          <p class="small">That is a row vector; the gradient is its transpose, $\\nabla e = -2J^\\top(x_{goal} - f(\\theta))$ (using $(AB)^\\top = B^\\top A^\\top$).
            The slides: target $(0, 1.2)$, $\\gamma = 0.2$, start $\\theta_0 = (\\pi, \\frac\\pi2)$ — after 11 steps $\\theta_{11} \\approx (0.608, 1.904)$; the exact solution is $(0.644, 1.855)$.</p>
          <h3>Why the Jacobian works at all</h3>
          <p class="small">Around the current $\\theta_t$, the Jacobian gives the tangents of the motion: $\\Delta x \\approx J(\\theta_t)\\,\\Delta\\theta$. This is a <b>linear approximation</b>,
            valid for small $\\Delta\\theta$, with an approximation error $\\varepsilon$ — so numerical methods take small steps and iterate.</p>
        </div>
        ${ppTraps([
          "The minus sign: $\\nabla e = -2J^\\top(x_{goal} - f)$, so the step $-\\gamma\\nabla e$ goes <b>towards</b> the target.",
          "Gradient descent only finds a local minimum — the start decides which solution.",
        ])}`,
      setup: (root) => rbWNum(root, "gd"),
      check: [
        { q: "What does gradient descent minimise for IK?", opts: ["$e(\\theta) = \\|x_{goal} - f(\\theta)\\|^2$", "$\\|\\theta\\|^2$", "$\\det J$", "$\\|J\\|$"], why: "A solution of the IK problem has $e = 0$." },
        { q: "What is $\\nabla e(\\theta)$?", opts: ["$-2J^\\top(\\theta)(x_{goal} - f(\\theta))$", "$2J(\\theta)(x_{goal} - f(\\theta))$", "$J^{-1}(x_{goal} - f(\\theta))$", "$-2(x_{goal} - f(\\theta))$"], why: "Chain rule through $f$." },
        { q: "Which solution does gradient descent find?", opts: ["It depends on the start $\\theta_0$", "Always elbow up", "Always the one with the smallest $\\|\\theta\\|$", "Both at once"], why: "Click different starts in the map." },
        { q: "The target is out of reach. What does gradient descent do?", opts: ["It ends where the error is smallest — the arm stretched towards the target", "It finds a solution anyway", "It diverges immediately", "It returns $\\theta = 0$"], why: "$e > 0$ everywhere; the minimum is the closest reachable point." },
      ],
    },
    {
      id: "3.5", title: "Numerical: the pseudoinverse", short: "Pseudoinverse", about: "$\\Delta\\theta = J^{-1}\\Delta x$, $J^+ = J^\\top(JJ^\\top)^{-1}$, the iteration, trouble at singularities",
      html: () => `
        ${ppGist([
          "Linearise: $\\Delta x \\approx J(\\theta)\\,\\Delta\\theta$ (difference quotient instead of differential quotient), and invert: $\\Delta\\theta = J^{-1}\\Delta x$ — if $J$ is square (non-redundant, $m = n$) and has full rank.",
          "Otherwise the <b>Moore–Penrose pseudoinverse</b>: $J^+ = J^\\top(JJ^\\top)^{-1}$ (full row rank, usually given for $J$ — except at singularities).",
          "Iterate: compute $x_k = f(\\theta_k)$, the error $\\Delta x = x_{goal} - x_k$, $\\Delta\\theta = J^+\\Delta x$, $\\theta_{k+1} = \\theta_k + \\Delta\\theta$ (or a fraction $\\gamma$ of it) until $\\Delta x$ is small.",
          "Near singularities the pseudoinverse is <b>unstable</b>: huge steps.",
        ])}
        ${pw("num", rbNumCtl("pinv"), { wide: true })}
        <div class="card">
          <h3>Least squares</h3>
          ${tx(`Ax = b \\;\\Rightarrow\\; A^\\top Ax = A^\\top b \\;\\Rightarrow\\; x = (A^\\top A)^{-1}A^\\top b`)}
          <p class="small">This $x$ minimises $\\|Ax - b\\|^2$ (tall $A$, more equations than unknowns). For a <b>wide</b> $J$ (redundant robot, $n > m$) infinitely many $\\Delta\\theta$ solve $J\\Delta\\theta = \\Delta x$;
            $J^+ = J^\\top(JJ^\\top)^{-1}$ picks the one with the <b>smallest norm</b> $\\|\\Delta\\theta\\|^2$. Properties: $JJ^+J = J$, $J^+JJ^+ = J^+$, $(\\lambda J)^+ = \\lambda^{-1}J^+$ for $\\lambda \\ne 0$.</p>
          <h3>The 2-link arm</h3>
          ${tx(`J^{-1} = \\frac{1}{l_1l_2\\sin\\theta_2}\\begin{pmatrix} l_2c_{12} & l_2s_{12}\\\\ -l_1c_1 - l_2c_{12} & -l_1s_1 - l_2s_{12}\\end{pmatrix}`)}
          <p class="small">For $\\theta_2 = 0$ or $\\pi$, $J$ is singular: no inverse. Press “start at θ₂ = 0” in the drawing. The slides: $\\gamma = 0.2$ from $(\\pi, \\frac\\pi2)$ gives $\\theta_7 \\approx (0.641, 1.857)$.</p>
        </div>
        ${ppTraps([
          "$J^+ = J^\\top(JJ^\\top)^{-1}$ needs full <b>row</b> rank; $(J^\\top J)^{-1}J^\\top$ is the version for full column rank.",
          "The linearisation only holds for small steps — iterate.",
        ])}`,
      setup: (root) => rbWNum(root, "pinv"),
      check: [
        { q: "What is the Moore–Penrose pseudoinverse for full row rank?", opts: ["$J^+ = J^\\top(JJ^\\top)^{-1}$", "$J^+ = (JJ^\\top)^{-1}J$", "$J^+ = J^\\top J$", "$J^+ = J^{-\\top}$"], why: "Then $JJ^+ = I$." },
        { q: "For a redundant robot, which solution does $J^+$ return?", opts: ["The one with the smallest $\\|\\Delta\\theta\\|$", "The one with the largest manipulability", "A random one", "None"], why: "Norm-minimal among all $\\Delta\\theta$ with $J\\Delta\\theta = \\Delta x$." },
        { q: "When can $J$ be inverted directly?", opts: ["When it is square ($m = n$) and has full rank", "Always", "When it is wide", "When $\\det J = 0$"], why: "Non-redundant robot, away from singularities." },
        { q: "What is the problem of the pseudoinverse near singularities?", opts: ["It becomes unstable: very large joint steps", "It becomes the identity", "It converges too slowly", "It gets stuck in a local minimum"], why: "$(JJ^\\top)^{-1}$ blows up as $\\det(JJ^\\top) \\to 0$." },
        { q: "2-link arm: $\\det J = $ …", opts: ["$l_1l_2\\sin\\theta_2$", "$l_1l_2\\cos\\theta_2$", "$l_1 + l_2$", "$\\sin(\\theta_1 + \\theta_2)$"], why: "Zero at $\\theta_2 = 0, \\pi$." },
      ],
    },
    {
      id: "3.6", title: "Damped least squares and the SVD", short: "Damped LSQ", about: "Regularise with $\\lambda^2\\|\\Delta\\theta\\|^2$; why it stays stable; summary",
      html: () => `
        ${ppGist([
          "Instead of $\\min\\|J\\Delta\\theta - \\Delta x\\|^2$ minimise $\\|J\\Delta\\theta - \\Delta x\\|^2 + \\lambda^2\\|\\Delta\\theta\\|^2$ with a damping constant $\\lambda > 0$ (also Levenberg–Marquardt).",
          "Normal equations $(J^\\top J + \\lambda^2I)\\Delta\\theta = J^\\top\\Delta x$, and $\\Delta\\theta = (J^\\top J + \\lambda^2I)^{-1}J^\\top\\Delta x = J^\\top(JJ^\\top + \\lambda^2I)^{-1}\\Delta x$ — the second needs only an $m \\times m$ inverse.",
          "$\\lambda$ large enough for stability near singularities, small enough for fast convergence.",
          "Why: with the SVD $J = U\\Sigma V^\\top$, the pseudoinverse multiplies by $\\frac1{\\sigma_i}$, damped least squares by $\\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}$ — which stays bounded as $\\sigma_i \\to 0$.",
        ])}
        ${pw("num", rbNumCtl("dls"), { wide: true })}
        <div class="card">
          <h3>Stability, with the singular value decomposition</h3>
          <p class="small">Every $J \\in \\mathbb R^{m\\times n}$ has an SVD $J = U\\Sigma V^\\top$: $U$, $V$ orthogonal, $\\Sigma$ diagonal with the singular values $\\sigma_1 \\ge \\sigma_2 \\ge \\dots \\ge 0$
            (square roots of the eigenvalues of $JJ^\\top$). With $u_i$, $v_i$ the columns of $U$, $V$ and $r = \\operatorname{rank} J$:</p>
          ${tx(`J = \\sum_{i=1}^{r}\\sigma_i u_iv_i^\\top,\\qquad J^+ = \\sum_{i=1}^{r}\\frac1{\\sigma_i}\\,v_iu_i^\\top,\\qquad J^\\top(JJ^\\top + \\lambda^2I)^{-1} = \\sum_{i=1}^{r}\\frac{\\sigma_i}{\\sigma_i^2 + \\lambda^2}\\,v_iu_i^\\top`)}
          <p class="small">(Because $JJ^\\top + \\lambda^2I = U(\\Sigma\\Sigma^\\top + \\lambda^2I)U^\\top$ and the middle matrix is diagonal with entries $\\sigma_i^2 + \\lambda^2 > 0$.)</p>
        </div>
        ${pw("svd", pslider("lam", "damping λ", 0.05, 1, 0.05, 0.3))}
        <div class="card">
          <h3>Summary of inverse kinematics</h3>
          ${ppFacts([
            ["Forward", "$f: C \\to X$, $x = f(\\theta)$."],
            ["Inverse", "$g: X \\to C$, $\\theta = g(x)$ with $f(g(x)) = x$ — unique, finitely many, infinitely many (null space, self-motion) or none."],
            ["Velocities", "$\\dot x = J\\dot\\theta$: the joint velocity space maps to the end-effector velocity space; the <b>range</b> of $J$ is what the end effector can do."],
            ["Null space", "$N(J) = \\{\\dot\\theta : J\\dot\\theta = 0\\}$: joint motions that leave the end effector still (self-motion)."],
            ["Singularity space", "the end-effector velocities $J$ cannot produce in a singular configuration."],
          ])}
        </div>
        ${ppTraps([
          "The damping is $\\lambda^2$ inside the inverse: $(JJ^\\top + \\lambda^2I)^{-1}$.",
          "For $\\sigma_i \\gg \\lambda$ damped least squares behaves like the pseudoinverse; for $\\sigma_i \\to 0$ it is still well-defined.",
          "Too large a $\\lambda$: stable but slow.",
        ])}`,
      setup: (root) => { rbWNum(root, "dls"); rbWSvd(root); },
      check: [
        { q: "What does damped least squares minimise?", opts: ["$\\|J\\Delta\\theta - \\Delta x\\|^2 + \\lambda^2\\|\\Delta\\theta\\|^2$", "$\\|J\\Delta\\theta - \\Delta x\\|^2$ only", "$\\lambda^2\\|\\Delta x\\|^2$", "$\\|\\Delta\\theta\\|^2$ only"], why: "Regularisation keeps the joint step small." },
        { q: "What is the damped least squares step?", opts: ["$\\Delta\\theta = J^\\top(JJ^\\top + \\lambda^2I)^{-1}\\Delta x$", "$\\Delta\\theta = (JJ^\\top + \\lambda^2I)^{-1}J\\Delta x$", "$\\Delta\\theta = J^\\top(JJ^\\top)^{-1}\\Delta x + \\lambda$", "$\\Delta\\theta = \\lambda J^\\top\\Delta x$"], why: "Equivalent to $(J^\\top J + \\lambda^2I)^{-1}J^\\top\\Delta x$." },
        { q: "In the SVD view, the pseudoinverse scales direction $i$ by …", opts: ["$1/\\sigma_i$", "$\\sigma_i$", "$\\sigma_i/(\\sigma_i^2 + \\lambda^2)$", "$\\sigma_i^2$"], why: "Damped least squares: $\\sigma_i/(\\sigma_i^2 + \\lambda^2)$." },
        { q: "What happens to the damped factor $\\sigma/(\\sigma^2 + \\lambda^2)$ as $\\sigma \\to 0$?", opts: ["It goes to 0 — stable", "It goes to ∞", "It goes to $1/\\lambda$", "It stays 1"], why: "Its largest value is $1/(2\\lambda)$ at $\\sigma = \\lambda$." },
        { q: "What is the null space of $J$?", opts: ["Joint velocities that do not move the end effector", "The unreachable poses", "The singular configurations", "The joint limits"], why: "$J\\dot\\theta = 0$: self-motion, e.g. of a redundant arm." },
      ],
    },
  ],
});
