// LEN chapter 1: the drawings you can play with, one function per sketch in the lecture notes.
// Each takes its section's element, finds its box (data-w) in it and runs it from there. The text
// around them is in len-basics.js; the helpers (L, lenWidget, arrowSVG …) in len.js.

const svgBox = (w, h, inner, cls = "") => `<svg class="lw-svg ${cls}" viewBox="0 0 ${w} ${h}" role="img">${inner}</svg>`;
const chargeSVG = (x, y, pos, r = 8) =>
  `<g class="chg ${pos ? "pos" : "neg"}"><circle cx="${x}" cy="${y}" r="${r}"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">${pos ? "+" : "−"}</text></g>`;
const r1 = (n) => Math.round(n * 10) / 10;
const N_VEC = '<span class="mvec"><i>n</i></span>';
// A vector's letter with its little arrow on top (the combining arrow ⃗ is missing from the fonts).
const vecSVG = (x, y, letter, cls = "", sub = "") =>
  `<g class="${cls ? "tc " + cls : ""}"><text x="${x}" y="${y}" text-anchor="middle" class="lbl vec-l ${cls ? "tc" : ""}">${letter}${sub ? `<tspan font-size="10" font-style="normal" dy="3">${sub}</tspan>` : ""}</text>` +
  `<text x="${x - (sub ? 4 : 0)}" y="${y - 12}" text-anchor="middle" class="vec-a ${cls ? "tc" : ""}">→</text></g>`;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

// The point in a drawing's own coordinates under the mouse or finger.
function svgPoint(svg, e) {
  const p = svg.createSVGPoint();
  p.x = e.clientX;
  p.y = e.clientY;
  return p.matrixTransform(svg.getScreenCTM().inverse());
}

// A plot: turns values into drawing coordinates.
function plotArea(x0, y0, w, h, xmin, xmax, ymin, ymax) {
  return {
    x0, y0, w, h, xmin, xmax, ymin, ymax,
    X: (x) => x0 + ((x - xmin) / (xmax - xmin)) * w,
    Y: (y) => y0 + h - ((y - ymin) / (ymax - ymin)) * h,
  };
}

// The axes of a plot, crossing at zero, with a few labelled ticks.
function axesSVG(p, xName, yName, xStep, yStep) {
  const ax = clamp(p.X(0), p.x0, p.x0 + p.w), ay = clamp(p.Y(0), p.y0, p.y0 + p.h);
  let ticks = "";
  for (let v = Math.ceil(p.xmin / xStep) * xStep; v <= p.xmax + 1e-9; v += xStep) {
    if (Math.abs(v) < 1e-9 || v >= p.xmax - 1e-9) continue;
    ticks += `<line class="tick" x1="${r1(p.X(v))}" y1="${ay - 3}" x2="${r1(p.X(v))}" y2="${ay + 3}"/><text class="tick-t" x="${r1(p.X(v))}" y="${ay + 16}" text-anchor="middle">${nf(v, 0)}</text>`;
  }
  for (let v = Math.ceil(p.ymin / yStep) * yStep; v <= p.ymax + 1e-9; v += yStep) {
    if (Math.abs(v) < 1e-9 || v >= p.ymax - 1e-9) continue;
    ticks += `<line class="tick" x1="${ax - 3}" y1="${r1(p.Y(v))}" x2="${ax + 3}" y2="${r1(p.Y(v))}"/><text class="tick-t" x="${ax - 7}" y="${r1(p.Y(v)) + 4}" text-anchor="end">${nf(v, 0)}</text>`;
  }
  return `<g class="axes">${arrowSVG(p.x0, ay, p.x0 + p.w + 12, ay, "ax", 1.5, 8)}${arrowSVG(ax, p.y0 + p.h, ax, p.y0 - 12, "ax", 1.5, 8)}
    ${ticks}<text class="ax-t" x="${p.x0 + p.w + 14}" y="${ay + 18}" text-anchor="end">${xName}</text>
    <text class="ax-t" x="${ax + 8}" y="${p.y0 - 4}">${yName}</text></g>`;
}

// The ideal sources' symbols (DIN): voltage source, a line through the circle along the wire;
// current source, a line across it.
function vSourceSVG(x1, y1, x2, y2, r = 15) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1);
  return `<line class="w" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="el" cx="${mx}" cy="${my}" r="${r}"/>` +
    `<line class="w" x1="${r1(mx - r * Math.cos(a))}" y1="${r1(my - r * Math.sin(a))}" x2="${r1(mx + r * Math.cos(a))}" y2="${r1(my + r * Math.sin(a))}"/>`;
}
function iSourceSVG(x1, y1, x2, y2, r = 15) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  return `<line class="w" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle class="el" cx="${mx}" cy="${my}" r="${r}"/>` +
    `<line class="w" x1="${r1(mx - r * Math.cos(a))}" y1="${r1(my - r * Math.sin(a))}" x2="${r1(mx + r * Math.cos(a))}" y2="${r1(my + r * Math.sin(a))}"/>`;
}

/* ================================================================ 1.1 Charge */

// An atom: take electrons away or add some, and see the charge.
function wAtom(root) {
  const box = $('[data-w="atom"]', root);
  const P = 3, MAX = 6;
  const st = { e: 3, rot: 0 };
  // The nucleus: three protons (1) and three neutrons (0).
  const nucleus = [[-7, -7, 1], [7, -7, 0], [0, 5, 1], [-12, 7, 0], [12, 6, 1], [0, -18, 0]];
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  // Where electron i of n is on the orbit; the whole ring turns with st.rot (degrees).
  const ePos = (i, n) => {
    const a = (i / Math.max(1, n)) * 2 * Math.PI - Math.PI / 2 + (st.rot * Math.PI) / 180;
    return [r1(150 + 85 * Math.cos(a)), r1(118 + 85 * Math.sin(a))];
  };
  const draw = lenWidget(() => {
    const es = Array.from({ length: st.e }, (_, i) => chargeSVG(...ePos(i, st.e), false)).join("");
    fig.innerHTML = svgBox(300, 240, `
      <circle class="orbit" cx="150" cy="118" r="85"/>
      <g class="e-orbit">${es}</g>
      ${nucleus.map(([x, y, p]) => (p ? chargeSVG(150 + x, 118 + y, true) : `<circle class="neutron" cx="${150 + x}" cy="${118 + y}" r="8"/>`)).join("")}
      ${svgT(150, 160, "Atomkern", "nucleus", 'text-anchor="middle" class="cap"')}
      ${svgT(150, 228, "Atomhülle", "electron shell", 'text-anchor="middle" class="cap"')}`);
    const Q = P - st.e;
    const q = Q === 0 ? "0" : `${Q > 0 ? "+" : "−"}${Math.abs(Q) === 1 ? "" : Math.abs(Q)}<i class="mv">e</i>`;
    read.innerHTML = `
      <div class="lw-count"><span>${L("Protonen", "Protons")}</span>${'<b class="q-pos">+</b>'.repeat(P)}</div>
      <div class="lw-count"><span>${L("Elektronen", "Electrons")}</span>${'<b class="q-neg">−</b>'.repeat(st.e) || "—"}</div>
      ${F(`<i class="mv">Q</i> = (${P} − ${st.e}) · <i class="mv">e</i> = ${q}`)}
      ${Q ? `<p class="small muted lw-c">≈ ${nf(Q * 1.602, 3)} · 10<sup>−19</sup> C</p>` : ""}
      <p class="lw-c"><span class="pill ${Q > 0 ? "pos" : Q < 0 ? "neg" : "good"}">${Q === 0 ? L("ladungsneutral", "neutral") : Q > 0 ? L("positiv geladen", "positively charged") : L("negativ geladen", "negatively charged")}</span></p>`;
    $('[data-a="minus"]', box).disabled = st.e === 0;
    $('[data-a="plus"]', box).disabled = st.e === MAX;
  });
  $('[data-a="minus"]', box).onclick = () => { st.e--; draw(); };
  $('[data-a="plus"]', box).onclick = () => { st.e++; draw(); };
  $('[data-a="reset"]', box).onclick = () => { st.e = P; draw(); };
  lenAnimate(fig, (dt) => {
    if (lenCalm()) return;
    // Move each electron along the orbit, keeping its "−" upright.
    const drawn = $$(".e-orbit .chg", fig);
    const was = drawn.map((g) => [+g.firstChild.getAttribute("cx"), +g.firstChild.getAttribute("cy")]);
    st.rot = (st.rot + dt * 25) % 360;
    drawn.forEach((g, i) => {
      const [x, y] = ePos(i, drawn.length);
      g.setAttribute("transform", `translate(${r1(x - was[i][0])} ${r1(y - was[i][1])})`);
    });
  });
}

// Two bodies in a closed box: moving electrons between them never changes the total.
function wConservation(root) {
  const box = $('[data-w="conserve"]', root);
  const P = 4;
  const st = { a: 4, b: 4, open: 0 };
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const body = (cx, label, e) => {
    const Q = P - e;
    const ps = [[-14, -14], [14, -14], [-14, 14], [14, 14]].map(([x, y]) => chargeSVG(cx + x, 95 + y, true, 7)).join("");
    const es = Array.from({ length: e }, (_, i) => {
      const a = (i / 10) * 2 * Math.PI - Math.PI / 2;
      return chargeSVG(r1(cx + 38 * Math.cos(a)), r1(95 + 38 * Math.sin(a)), false, 7);
    }).join("");
    return `<circle class="body ${Q > 0 ? "pos" : Q < 0 ? "neg" : ""}" cx="${cx}" cy="95" r="54"/>${ps}${es}
      <text x="${cx}" y="172" text-anchor="middle" class="lbl">${label}: Q = ${Q === 0 ? "0" : (Q > 0 ? "+" : "−") + Math.abs(Q) + "e"}</text>`;
  };
  const draw = lenWidget(() => {
    fig.innerHTML = svgBox(420, 185, `
      <rect class="system ${st.open ? "open" : ""}" x="8" y="8" width="404" height="170" rx="18"/>
      ${svgT(22, 28, st.open ? "offenes System" : "abgeschlossenes System", st.open ? "open system" : "closed (isolated) system", 'class="cap"')}
      ${body(120, "A", st.a)}${body(300, "B", st.b)}`);
    const qa = P - st.a, qb = P - st.b, tot = qa + qb;
    read.innerHTML = `
      ${F(`<i class="mv">Q</i><sub>A</sub> + <i class="mv">Q</i><sub>B</sub> = (${nfs(qa, 0)}<i class="mv">e</i>) + (${nfs(qb, 0)}<i class="mv">e</i>) = ${tot === 0 ? "0" : nfs(tot, 0) + '<i class="mv">e</i>'}`)}
      <p class="lw-c"><span class="pill ${tot === 0 ? "good" : "bad"}">${tot === 0
        ? L("Gesamtladung bleibt 0 — Ladungserhaltung ✓", "Total charge stays 0 — conservation ✓")
        : L("Gesamtladung hat sich geändert!", "The total charge has changed!")}</span></p>
      <p class="small muted">${st.open
        ? L("Im offenen System können Elektronen von außen dazukommen oder verschwinden — dann gilt die Ladungserhaltung nur für das größere, abgeschlossene System.",
          "In an open system electrons can come in from outside or leave — conservation then only holds for the bigger, closed system.")
        : L("Elektronen wandern nur von A nach B oder zurück. Was A verliert, bekommt B.", "Electrons only move from A to B or back. What A loses, B gains.")}</p>`;
    $('[data-a="ab"]', box).disabled = st.a === 0 || st.b === 10;
    $('[data-a="ba"]', box).disabled = st.b === 0 || st.a === 10;
    $('[data-a="in"]', box).disabled = !st.open || st.a === 10;
    $('[data-a="out"]', box).disabled = !st.open || st.a === 0;
  });
  lenWire(box, st, draw);
  $('[data-a="ab"]', box).onclick = () => { st.a--; st.b++; draw(); };
  $('[data-a="ba"]', box).onclick = () => { st.b--; st.a++; draw(); };
  $('[data-a="in"]', box).onclick = () => { st.a++; draw(); };
  $('[data-a="out"]', box).onclick = () => { st.a--; draw(); };
  $('[data-a="reset"]', box).onclick = () => { Object.assign(st, { a: 4, b: 4 }); draw(); };
}

/* ================================================================ 1.1 Current */

// A metal: fixed positive ions, free electrons. Switch the voltage on and they drift.
function wLattice(root) {
  const box = $('[data-w="lattice"]', root);
  const W = 460, H = 190;
  const st = { on: 0 };
  const ions = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) ions.push([55 + i * 70, 45 + j * 50]);
  const es = Array.from({ length: 14 }, () => ({ x: 30 + Math.random() * (W - 60), y: 25 + Math.random() * (H - 50), a: Math.random() * 6.3, t: 0 }));
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const draw = lenWidget(() => {
    fig.innerHTML = svgBox(W, H + 30, `
      <rect class="metal" x="10" y="12" width="${W - 20}" height="${H - 20}" rx="10"/>
      ${ions.map(([x, y]) => chargeSVG(x, y, true, 12)).join("")}
      <g class="es">${es.map((e) => chargeSVG(r1(e.x), r1(e.y), false, 6)).join("")}</g>
      ${st.on ? `<text x="${W - 22}" y="${H / 2 + 6}" class="pole q-pos tc" text-anchor="middle">+</text><text x="22" y="${H / 2 + 6}" class="pole q-neg tc" text-anchor="middle">−</text>
        ${arrowSVG(W / 2 + 60, H + 16, W / 2 - 60, H + 16, "i", 3)}<text x="${W / 2 + 70}" y="${H + 21}" class="lbl tc q-i">I</text>
        ${arrowSVG(W / 2 - 150, H + 16, W / 2 - 100, H + 16, "neg", 2)}<text x="${W / 2 - 210}" y="${H + 21}" class="lbl tc q-neg">e⁻</text>` : ""}`);
    read.innerHTML = st.on
      ? `<p>${L("Jetzt <b>driften</b> die Elektronen zusätzlich zum Pluspol: eine <b>gerichtete Bewegung</b> von Ladung — das ist ein Strom.",
          "Now the electrons also <b>drift</b> towards the plus pole: a <b>directed movement</b> of charge — that is a current.")}</p>
        <p class="small muted">${L("Der rote Strompfeil zeigt in die <b>technische Stromrichtung</b>: entgegen der Elektronen.", "The red current arrow points in the <b>conventional direction</b>: against the electrons.")}</p>`
      : `<p>${L("Die Elektronen zappeln wild durcheinander, aber im Mittel kommen sie nicht vom Fleck: <b>kein Strom</b>.",
          "The electrons jiggle around wildly, but on average they go nowhere: <b>no current</b>.")}</p>
        <p class="small muted">${L("Die positiven Atomrümpfe sitzen fest im Gitter, nur die freien Elektronen können sich bewegen.", "The positive ions sit fixed in the lattice; only the free electrons can move.")}</p>`;
  });
  lenWire(box, st, draw);
  lenAnimate(fig, (dt) => {
    if (lenCalm()) return;
    const dots = $$(".es .chg", fig);
    es.forEach((e, k) => {
      e.t -= dt;
      if (e.t <= 0) { e.a = Math.random() * 6.3; e.t = 0.15 + Math.random() * 0.35; }
      e.x += (Math.cos(e.a) * 70 + (st.on ? 55 : 0)) * dt;
      e.y += Math.sin(e.a) * 70 * dt;
      if (e.y < 22 || e.y > H - 20) { e.a = -e.a; e.y = clamp(e.y, 22, H - 20); }
      if (e.x > W - 18) e.x = 18;
      if (e.x < 18) e.x = W - 18;
      const g = dots[k];
      if (g) g.setAttribute("transform", `translate(${r1(e.x - +g.firstChild.getAttribute("cx"))} ${r1(e.y - +g.firstChild.getAttribute("cy"))})`);
    });
  });
}

// Charges through a cross-section A: the sign of I depends on the charge and on the direction of n.
function wTube(root) {
  const box = $('[data-w="tube"]', root);
  const st = { q: 1, v: 1, n: 1, count: 0 };
  const xs = Array.from({ length: 9 }, (_, i) => 40 + i * 52);
  let base = xs.slice(); // where the charges were drawn; the animation moves them from there
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const draw = lenWidget(() => {
    const I = st.q * st.v * st.n;
    const tech = st.q * st.v; // the way positive charge goes: +1 right, −1 left
    fig.innerHTML = svgBox(520, 190, `
      <path class="tube" d="M40,58 L480,58 M40,128 L480,128"/>
      <ellipse class="tube-end" cx="40" cy="93" rx="12" ry="35"/><ellipse class="tube-end" cx="480" cy="93" rx="12" ry="35"/>
      <g class="dots">${(base = xs.map(r1)).map((x, i) => chargeSVG(x, 80 + (i % 3) * 13, st.q > 0, 7)).join("")}</g>
      <ellipse class="section" cx="260" cy="93" rx="12" ry="35"/>
      <text x="276" y="148" class="lbl tc q-hl">A</text>
      ${arrowSVG(260, 32, 260 + st.n * 52, 32, "hl", 3)}${vecSVG(260 + st.n * 62, 37, "n", "q-hl")}
      ${arrowSVG(130 - st.v * 30, 165, 130 + st.v * 30, 165, st.q > 0 ? "pos" : "neg", 2.5)}${vecSVG(130 + st.v * 42, 170, "v")}
      ${arrowSVG(390 - tech * 32, 165, 390 + tech * 32, 165, "i", 3)}<text x="${390 + tech * 46}" y="170" class="lbl tc q-i" text-anchor="middle">I</text>`);
    const row = (q, same) => q === st.q && same === (st.v === st.n);
    const cell = (q, same, res) => `<tr class="${row(q, same) ? "on" : ""}"><td>Q ${q > 0 ? "&gt;" : "&lt;"} 0</td><td><span class="mvec"><i>v</i></span> ${same ? "↑↑" : "↑↓"} <span class="mvec"><i>n</i></span></td><td>${sI()} ${res > 0 ? "&gt;" : "&lt;"} 0</td></tr>`;
    read.innerHTML = `
      ${F(`${sI()} = ${frac("Δ<i class='mv'>Q</i>", "Δ<i class='mv'>t</i>")} → ${sI()} = ${frac("d<i class='mv'>Q</i>", "d<i class='mv'>t</i>")}`)}
      <p class="lw-c"><span class="pill ${I > 0 ? "good" : "bad"}">${sI()} ${I > 0 ? "&gt;" : "&lt;"} 0</span>
        <span class="small muted">${L(`Ladung durch A in Richtung ${N_VEC} gezählt:`, `charge counted through A along ${N_VEC}:`)} <b class="lw-cnt">${nfs(st.count, 0)}e</b></span></p>
      <table class="lw-table"><thead><tr><th>${L("Ladung", "Charge")}</th><th>${L("Bewegung", "Motion")}</th><th>${L("Strom", "Current")}</th></tr></thead>
        <tbody>${cell(1, true, 1)}${cell(-1, true, -1)}${cell(1, false, -1)}${cell(-1, false, 1)}</tbody></table>`;
  });
  lenWire(box, st, () => { st.count = 0; draw(); });
  $('[data-a="flip-n"]', box).onclick = () => { st.n = -st.n; st.count = 0; draw(); };
  lenAnimate(fig, (dt) => {
    if (lenCalm()) return;
    const dots = $$(".dots .chg", fig);
    let crossed = 0;
    xs.forEach((x, i) => {
      const nx = x + st.v * 60 * dt;
      if ((x < 260 && nx >= 260) || (x > 260 && nx <= 260)) crossed += st.q * st.v * st.n;
      xs[i] = nx > 470 ? 50 : nx < 50 ? 470 : nx;
      dots[i]?.setAttribute("transform", `translate(${r1(xs[i] - base[i])} 0)`);
    });
    if (crossed) {
      st.count += crossed;
      const c = $(".lw-cnt", read);
      if (c) c.textContent = nfs(st.count, 0) + "e";
    }
  });
}

/* ================================================================ 1.1 Potential */

// A fixed charge Q1 and a probe charge you can drag: its potential, energy and the force on it.
function wPotential(root) {
  const box = $('[data-w="potential"]', root);
  const C = { x: 170, y: 110 };
  const st = { Q: 2, q: 1, px: 380, py: 80 };
  const K = 30 * 40; // φ = K·Q / r (r in drawing units) — numbers only for illustration
  const phi = (r) => (K * st.Q) / Math.max(r, 5);
  const field = $(".lw-fig .lw-field", box), graph = $(".lw-fig .lw-graph", box), read = $(".lw-read", box);
  const draw = lenWidget(() => {
    const sign = Math.sign(st.Q);
    const rings = [190, 140, 100, 70, 46, 28].map((r, i) =>
      `<circle class="ring ${sign > 0 ? "pos" : "neg"}" cx="${C.x}" cy="${C.y}" r="${r}" style="fill-opacity:${r1((0.02 + i * 0.008) * Math.abs(st.Q) * 100) / 100}"/>`).join("");
    const dx = st.px - C.x, dy = st.py - C.y, r = Math.hypot(dx, dy);
    const f = st.q * st.Q; // > 0: pushed away
    const len = clamp((Math.abs(f) * 9000) / (r * r), 10, 70);
    const ux = dx / r, uy = dy / r;
    const fx = st.px + Math.sign(f) * ux * (len + 12), fy = st.py + Math.sign(f) * uy * (len + 12);
    field.innerHTML = svgBox(520, 220, `
      <defs><clipPath id="lenPotClip"><rect x="0" y="0" width="520" height="220" rx="12"/></clipPath></defs>
      <rect class="field-bg" x="0" y="0" width="520" height="220" rx="12"/>
      <g clip-path="url(#lenPotClip)">${st.Q ? rings : ""}</g>
      ${st.Q ? chargeSVG(C.x, C.y, st.Q > 0, 16) : `<circle class="neutron" cx="${C.x}" cy="${C.y}" r="16"/>`}
      <text x="${C.x}" y="${C.y + 34}" text-anchor="middle" class="lbl">Q₁</text>
      ${svgT(C.x, C.y + 50, "fest", "fixed", 'text-anchor="middle" class="cap"')}
      ${f ? arrowSVG(st.px + Math.sign(f) * ux * 12, st.py + Math.sign(f) * uy * 12, fx, fy, "force", 2.5) : ""}
      ${f ? `${vecSVG(r1(fx + 10), r1(fy - 6), "F", "", "el")}` : ""}
      <g class="probe">${chargeSVG(r1(st.px), r1(st.py), st.q > 0, 11)}</g>
      ${svgT(r1(st.px), r1(st.py > 190 ? st.py - 18 : st.py + 27), "Probeladung q", "test charge q", 'text-anchor="middle" class="cap"')}
      ${svgT(508, 212, "weit weg (Erde): φ = 0 V", "far away (earth): φ = 0 V", 'text-anchor="end" class="cap"')}`, "drag");
    // φ along the line through Q1: a hill for a positive charge, a valley for a negative one.
    const p = plotArea(10, 18, 500, 110, 10, 510, -150, 150);
    let d = "";
    for (let x = 10; x <= 510; x += 3) {
      const y = clamp(phi(Math.abs(x - C.x)), -150, 150);
      d += `${d ? "L" : "M"}${x},${r1(p.Y(y))}`;
    }
    const py = clamp(phi(r), -150, 150);
    graph.innerHTML = svgBox(520, 150, `
      <line class="zero" x1="10" y1="${p.Y(0)}" x2="510" y2="${p.Y(0)}"/>
      <text x="14" y="${p.Y(0) - 6}" class="cap">φ = 0</text>
      <path class="curve q-phi" d="${d}"/>
      <line class="guide" x1="${r1(C.x + r)}" y1="${p.Y(0)}" x2="${r1(C.x + r)}" y2="${r1(p.Y(py))}"/>
      <circle class="pt q-phi" cx="${r1(C.x + r)}" cy="${r1(p.Y(py))}" r="5"/>
      <text x="${C.x}" y="146" text-anchor="middle" class="cap">Q₁</text>
      ${svgT(508, 146, "φ entlang der Linie durch Q₁", "φ along the line through Q₁", 'text-anchor="end" class="cap"')}`);
    const ph = phi(r), W = st.q * ph;
    read.innerHTML = `
      ${F(`${sP()} = ${frac("<i class='mv'>W</i>", "<i class='mv'>q</i>")} ${unit("[" + sP() + "] = 1 J/C = 1 V")}`)}
      <div class="lw-vals">
        <span>${sP()} ${L("an der Probeladung", "at the test charge")}</span><b class="q-phi">${nf(st.Q ? ph : 0, 0)} V</b>
        <span><i class="mv">W</i> = <i class="mv">q</i> · ${sP()}</span><b>${nf(st.Q ? W : 0, 0)} µJ</b>
        <span>${L("Kraft", "Force")}</span><b>${!f ? "—" : f > 0 ? L("abstoßend", "repelling") : L("anziehend", "attracting")}</b>
      </div>
      <p class="small muted">${L("Zieh die Probeladung herum (oder tipp irgendwo hin). Werte nur zur Veranschaulichung, mit q = ±1 µC.",
        "Drag the test charge around (or tap anywhere). Values only for illustration, with q = ±1 µC.")}</p>`;
    lenOut(box, "Q", st.Q === 0 ? "0" : nfs(st.Q, 0));
  });
  lenWire(box, st, draw);
  let dragging = false;
  const move = (e) => {
    const svg = $("svg", field);
    const pt = svgPoint(svg, e);
    let x = clamp(pt.x, 15, 505), y = clamp(pt.y, 15, 205);
    const dx = x - C.x, dy = y - C.y, r = Math.hypot(dx, dy);
    if (r < 32) { x = C.x + (dx / (r || 1)) * 32; y = C.y + (dy / (r || 1)) * 32; }
    st.px = x;
    st.py = y;
    draw();
  };
  field.addEventListener("pointerdown", (e) => { dragging = true; field.setPointerCapture(e.pointerId); move(e); });
  field.addEventListener("pointermove", (e) => dragging && move(e));
  field.addEventListener("pointerup", () => (dragging = false));
  field.addEventListener("pointercancel", () => (dragging = false));
}

/* ================================================================ 1.1 Voltage */

// A smooth, wobbly closed outline, like the hand-drawn regions in the notes.
function blobPath(cx, cy, r, seed) {
  const n = 16, pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const rr = r * (1 + 0.07 * Math.sin(a * 3 + seed) + 0.05 * Math.sin(a * 5 + seed * 2));
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.82]);
  }
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m = mid(pts[n - 1], pts[0]);
  let d = `M${r1(m[0])},${r1(m[1])}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = mid(pts[i], pts[(i + 1) % n]);
    d += ` Q${r1(p[0])},${r1(p[1])} ${r1(q[0])},${r1(q[1])}`;
  }
  return d + "Z";
}

// Two regions joined by a conductor: a potential difference drives a current. Without a source
// the difference evens out and the current stops.
function wRegions(root) {
  const box = $('[data-w="regions"]', root);
  const st = { p1: 2, p2: 6, src: 1 };
  const dots = Array.from({ length: 6 }, (_, i) => 175 + i * 32);
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const eDots = (cx, phi, seed) => {
    const n = clamp(Math.round(5 - phi * 0.8), 0, 9);
    return Array.from({ length: n }, (_, i) => {
      const a = i * 2.4 + seed, rr = 18 + (i % 3) * 13;
      return `<text x="${r1(cx + rr * Math.cos(a))}" y="${r1(105 + rr * Math.sin(a) * 0.75)}" class="e-txt tc q-neg" text-anchor="middle">e⁻</text>`;
    }).join("");
  };
  const draw = lenWidget(() => {
    const U = st.p1 - st.p2;
    const dir = Math.sign(U); // +1: current from 1 to 2
    const tint = (phi) => `${phi > 0 ? "pos" : phi < 0 ? "neg" : ""}" style="fill-opacity:${r1(Math.min(0.32, Math.abs(phi) * 0.05))}`;
    fig.innerHTML = svgBox(520, 220, `
      <path class="region ${tint(st.p1)}" d="${blobPath(95, 100, 80, 1)}"/>
      <path class="region ${tint(st.p2)}" d="${blobPath(425, 100, 80, 4)}"/>
      ${eDots(95, st.p1, 0.5)}${eDots(425, st.p2, 2)}
      <text x="95" y="96" text-anchor="middle" class="big tc q-phi">φ₁</text><text x="95" y="116" text-anchor="middle" class="lbl tc q-phi">${nf(st.p1)} V</text>
      <text x="425" y="96" text-anchor="middle" class="big tc q-phi">φ₂</text><text x="425" y="116" text-anchor="middle" class="lbl tc q-phi">${nf(st.p2)} V</text>
      <path class="wire-hl" d="M168,93 L352,93 M168,111 L352,111"/>
      <g class="cdots">${dots.map((x) => `<circle class="edot" cx="${x}" cy="102" r="4"/>`).join("")}</g>
      ${svgT(260, 84, "elektrischer Leiter", "conductor", 'text-anchor="middle" class="cap tc q-hl"')}
      ${dir ? arrowSVG(260 - dir * 45, 56, 260 + dir * 45, 56, "i", 3) + `<text x="${260 + dir * 58}" y="61" class="lbl tc q-i" text-anchor="middle">I</text>` : ""}
      ${arrowSVG(110, 205, 410, 205, "u", 2.5)}<text x="260" y="198" class="lbl tc q-u" text-anchor="middle">U₁₂ = ${nfs(U)} V</text>
      ${svgT(95, 20, "Gebiet 1", "region 1", 'text-anchor="middle" class="cap"')}${svgT(425, 20, "Gebiet 2", "region 2", 'text-anchor="middle" class="cap"')}`);
    $$(".cdots circle", fig).forEach((c) => (c.style.opacity = dir ? 1 : 0.35));
    read.innerHTML = `
      ${F(`${sU("12")} = ${sP("1")} − ${sP("2")} = ${nf(st.p1)} V − ${nf(st.p2)} V = <b class="q-u">${nfs(U)} V</b>`)}
      <p>${!dir
        ? L("Gleiches Potential — <b>keine Spannung, kein Strom</b>.", "Same potential — <b>no voltage, no current</b>.")
        : L(`Die Elektronen wandern zum <b>höheren</b> Potential (Gebiet ${U > 0 ? 1 : 2}); der Strom <i>I</i> fließt technisch vom höheren zum niedrigeren.`,
          `The electrons move to the <b>higher</b> potential (region ${U > 0 ? 1 : 2}); the current <i>I</i> flows conventionally from higher to lower.`)}</p>
      <p class="small muted">${st.src
        ? L("Eine Quelle (ein <b>aktives Gebiet</b>) hält die beiden Potentiale fest — der Strom fließt weiter.", "A source (an <b>active region</b>) holds both potentials — the current keeps flowing.")
        : L("Ohne Quelle gleichen sich die Potentiale aus, bis kein Strom mehr fließt. Darum braucht ein Stromkreis ein aktives Gebiet.",
          "Without a source the potentials even out until no current flows any more. That's why a circuit needs an active region.")}</p>`;
    $('[data-k="p1"]', box).value = st.p1;
    $('[data-k="p2"]', box).value = st.p2;
    lenOut(box, "p1", nf(st.p1) + " V");
    lenOut(box, "p2", nf(st.p2) + " V");
  });
  lenWire(box, st, draw);
  let shift = 0;
  lenAnimate(fig, (dt) => {
    const U = st.p1 - st.p2;
    if (!st.src && Math.abs(U) > 0.001) {
      // Without a source the two potentials move towards each other.
      const step = U * Math.min(1, dt * 0.9) * 0.5;
      st.p1 = Math.abs(U) < 0.06 ? (st.p1 + st.p2) / 2 : st.p1 - step;
      st.p2 = Math.abs(U) < 0.06 ? st.p1 : st.p2 + step;
      draw();
    }
    if (lenCalm() || Math.abs(U) < 0.001) return;
    // Electrons go against the current: from 2 to 1 when U12 > 0.
    shift = (shift - Math.sign(U) * Math.min(90, 12 * Math.abs(U)) * dt + 32) % 32;
    $$(".cdots circle", fig).forEach((c, i) => c.setAttribute("cx", r1(175 + ((i * 32 + shift) % 192))));
  });
}

/* ================================================================ 1.2 Resistors */

const MATERIALS = [
  { id: "cu", de: "Kupfer", en: "copper", rho: 0.0178, color: "#c8753a" },
  { id: "al", de: "Aluminium", en: "aluminium", rho: 0.0282, color: "#a9b3bd" },
  { id: "fe", de: "Eisen", en: "iron", rho: 0.1, color: "#6f747b" },
  { id: "ko", de: "Konstantan", en: "constantan", rho: 0.49, color: "#bfa76a" },
];
// Three significant figures, for values from milliohms to kiloohms.
const sig = (x) => nf(x, x === 0 ? 0 : Math.max(0, 2 - Math.floor(Math.log10(Math.abs(x)))));

// A bar of material: longer is more resistance, thicker is less.
function wGeometry(root) {
  const box = $('[data-w="geometry"]', root);
  const st = { l: 20, A: 1.5, m: "cu" };
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const draw = lenWidget(() => {
    const mat = MATERIALS.find((m) => m.id === st.m);
    const s = 14 + Math.sqrt(st.A) * 14, len = 60 + st.l * 8, dx = s * 0.55, x0 = 20, y0 = 112 - s / 2;
    fig.innerHTML = svgBox(520, 190, `
      <g style="--mat:${mat.color}">
        <polygon class="bar top" points="${x0},${y0} ${x0 + len},${y0} ${r1(x0 + len + dx)},${r1(y0 - dx)} ${r1(x0 + dx)},${r1(y0 - dx)}"/>
        <rect class="bar front" x="${x0}" y="${r1(y0)}" width="${r1(len)}" height="${r1(s)}"/>
        <polygon class="bar end" points="${r1(x0 + len)},${r1(y0)} ${r1(x0 + len + dx)},${r1(y0 - dx)} ${r1(x0 + len + dx)},${r1(y0 - dx + s)} ${r1(x0 + len)},${r1(y0 + s)}"/>
      </g>
      ${arrowSVG(x0 + len / 2 - 8, y0 + s + 22, x0, y0 + s + 22, "hl", 2)}${arrowSVG(x0 + len / 2 + 8, y0 + s + 22, x0 + len, y0 + s + 22, "hl", 2)}
      <text x="${r1(x0 + len / 2)}" y="${r1(y0 + s + 27)}" text-anchor="middle" class="lbl tc q-hl"><tspan font-style="italic">l</tspan> = ${nf(st.l, 0)} m</text>
      <text x="${r1(x0 + len + dx)}" y="${r1(y0 - dx - 10)}" text-anchor="end" class="lbl tc q-hl"><tspan font-style="italic">A</tspan> = ${nf(st.A)} mm²</text>
      <text x="${x0 + 4}" y="${r1(y0 - dx - 10)}" class="cap">${lt(mat.de, mat.en)}</text>`);
    const R = (mat.rho * st.l) / st.A;
    read.innerHTML = `
      ${F(`<i class="mv">R</i> = <i class="mv">ρ</i> · ${frac("<i class='mv'>l</i>", "<i class='mv'>A</i>")} = ${nf(mat.rho, mat.rho < 0.1 ? 4 : 2)} ${frac("Ω·mm²", "m")} · ${frac(`${nf(st.l, 0)} m`, `${nf(st.A)} mm²`)}`, "small-f")}
      <div class="lw-vals">
        <span>${L("Widerstand", "Resistance")} <i class="mv">R</i></span><b>${sig(R)} Ω</b>
        <span>${L("Leitwert", "Conductance")} <i class="mv">G</i> = 1/<i class="mv">R</i></span><b>${sig(1 / R)} S</b>
        <span>${L("Leitfähigkeit", "Conductivity")} <i class="mv">κ</i> = 1/<i class="mv">ρ</i></span><b>${nf(1 / mat.rho, 1)} ${frac("m", "Ω·mm²")}</b>
      </div>
      <p class="small muted">${L("Doppelt so lang → doppelter Widerstand. Doppelt so dick → halber Widerstand.", "Twice as long → twice the resistance. Twice as thick → half the resistance.")}</p>`;
    lenOut(box, "l", nf(st.l, 0) + " m");
    lenOut(box, "A", nf(st.A) + " mm²");
  });
  lenWire(box, st, draw);
}

// The measurement from the notes: a voltmeter across the resistor, an ammeter in series. Each
// reading is plotted, and the points line up on a straight line through zero: Ohm's law.
function wOhm(root) {
  const box = $('[data-w="ohm"]', root);
  const st = { U: 4, R: 5 };
  let points = [];
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const meter = (x, y, t) => `<circle class="el" cx="${x}" cy="${y}" r="13"/><text x="${x}" y="${y + 5}" text-anchor="middle" class="lbl">${t}</text>`;
  const draw = lenWidget(() => {
    const I = st.U / st.R;
    const key = `${st.U}|${st.R}`;
    if (!points.some((p) => p.key === key)) points.push({ key, U: st.U, I, R: st.R });
    const p = plotArea(48, 20, 220, 170, 0, 10, 0, 5);
    const lineEnd = Math.min(10, 5 * st.R);
    fig.innerHTML = `<div class="lw-pair">${svgBox(270, 215, `
        <path class="w" d="M40,80 L80,80 M180,80 L230,80 L230,190 L40,190 L40,80"/>
        ${resistorSVG(80, 80, 180, 80, "R", "", 50, 18)}
        <path class="w" d="M80,80 L80,34 L117,34 M143,34 L180,34 L180,80"/>${meter(130, 34, "V")}
        <circle class="dot" cx="80" cy="80" r="3.5"/><circle class="dot" cx="180" cy="80" r="3.5"/>
        ${meter(230, 135, "A")}
        ${vSourceSVG(100, 190, 160, 190)}
        <text x="96" y="214" class="lbl">+</text><text x="158" y="214" class="lbl">−</text>
        ${arrowSVG(102, 172, 158, 172, "u", 2.2)}<text x="130" y="165" text-anchor="middle" class="lbl tc q-u">U</text>
        ${arrowSVG(40, 140, 40, 98, "i", 2.5)}<text x="26" y="124" class="lbl tc q-i">I</text>
        <text x="130" y="12" text-anchor="middle" class="read tc q-u">${nf(st.U)} V</text>
        <text x="212" y="139" text-anchor="end" class="read tc q-i">${nf(I, 2)} A</text>`)}
      ${svgBox(300, 215, `
        ${axesSVG(p, "U / V", "I / A", 2, 1)}
        <line class="curve q-i" x1="${p.X(0)}" y1="${p.Y(0)}" x2="${r1(p.X(lineEnd))}" y2="${r1(p.Y(lineEnd / st.R))}"/>
        ${points.map((q) => `<circle class="meas ${q.R === st.R ? "now" : ""}" cx="${r1(p.X(q.U))}" cy="${r1(p.Y(Math.min(5, q.I)))}" r="${q.R === st.R ? 4.5 : 3.5}"/>`).join("")}
        <circle class="pt q-i" cx="${r1(p.X(st.U))}" cy="${r1(p.Y(Math.min(5, I)))}" r="6"/>`)}</div>`;
    read.innerHTML = `
      ${F(`${sU()} = <i class="mv">R</i> · ${sI()} &nbsp;⇔&nbsp; ${sI()} = ${frac(sU(), "<i class='mv'>R</i>")} = ${frac(`${nf(st.U)} V`, `${nf(st.R, 0)} Ω`)} = <b class="q-i">${nf(I, 2)} A</b>`)}
      <p class="small muted">${L(`Steigung der Geraden = Leitwert <i>G</i> = 1/<i>R</i> = ${nf(1 / st.R, 2)} S. Kleiner Widerstand → steile Gerade.`,
        `Slope of the line = conductance <i>G</i> = 1/<i>R</i> = ${nf(1 / st.R, 2)} S. Small resistance → steep line.`)}</p>`;
    lenOut(box, "U", nf(st.U) + " V");
    lenOut(box, "R", nf(st.R, 0) + " Ω");
  });
  lenWire(box, st, draw);
  $('[data-a="clear"]', box).onclick = () => { points = []; draw(); };
}

/* ================================================================ 1.3 Two-terminal and n-terminal */

const ELEMENTS = [
  { id: "r", de: "Widerstand", en: "Resistor" },
  { id: "l", de: "Spule", en: "Inductor" },
  { id: "c", de: "Kondensator", en: "Capacitor" },
  { id: "d", de: "Diode", en: "Diode" },
  { id: "v", de: "Quelle", en: "Source" },
];
function elementSVG(id, cx, cy) {
  if (id === "r") return `<line class="w" x1="${cx - 60}" y1="${cy}" x2="${cx + 60}" y2="${cy}"/><rect class="el" x="${cx - 26}" y="${cy - 10}" width="52" height="20" rx="2"/>`;
  if (id === "l") return `<line class="w" x1="${cx - 60}" y1="${cy}" x2="${cx - 28}" y2="${cy}"/><line class="w" x1="${cx + 28}" y1="${cy}" x2="${cx + 60}" y2="${cy}"/>` +
    `<path class="w" d="M${cx - 28},${cy} a7,7 0 0,1 14,0 a7,7 0 0,1 14,0 a7,7 0 0,1 14,0 a7,7 0 0,1 14,0"/>`;
  if (id === "c") return `<line class="w" x1="${cx - 60}" y1="${cy}" x2="${cx - 6}" y2="${cy}"/><line class="w" x1="${cx + 6}" y1="${cy}" x2="${cx + 60}" y2="${cy}"/>` +
    `<line class="w thick" x1="${cx - 6}" y1="${cy - 16}" x2="${cx - 6}" y2="${cy + 16}"/><line class="w thick" x1="${cx + 6}" y1="${cy - 16}" x2="${cx + 6}" y2="${cy + 16}"/>`;
  if (id === "d") return `<line class="w" x1="${cx - 60}" y1="${cy}" x2="${cx + 60}" y2="${cy}"/><polygon class="el solid" points="${cx - 12},${cy - 13} ${cx - 12},${cy + 13} ${cx + 10},${cy}"/>` +
    `<line class="w thick" x1="${cx + 11}" y1="${cy - 13}" x2="${cx + 11}" y2="${cy + 13}"/>`;
  return vSourceSVG(cx - 60, cy, cx + 60, cy, 15);
}

function wTwoPole(root) {
  const box = $('[data-w="twopole"]', root);
  const st = { e: "r", n: 3 };
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const examples = { 2: ["Zweipol, z. B. ein Widerstand", "two-terminal, e.g. a resistor"], 3: ["Dreipol, z. B. ein Transistor", "three-terminal, e.g. a transistor"],
    4: ["Vierpol, z. B. ein Transformator", "four-terminal, e.g. a transformer"] };
  const draw = lenWidget(() => {
    const leads = Array.from({ length: st.n }, (_, i) => {
      const a = (i / st.n) * 2 * Math.PI + Math.PI;
      const x1 = 380 + 34 * Math.cos(a), y1 = 95 + 34 * Math.sin(a), x2 = 380 + 76 * Math.cos(a), y2 = 95 + 76 * Math.sin(a);
      return `<line class="w" x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}"/><circle class="term" cx="${r1(x2)}" cy="${r1(y2)}" r="5"/>` +
        `<text x="${r1(380 + 92 * Math.cos(a))}" y="${r1(99 + 92 * Math.sin(a))}" text-anchor="middle" class="cap">${i + 1}</text>`;
    }).join("");
    fig.innerHTML = svgBox(500, 200, `
      <text x="120" y="22" text-anchor="middle" class="lbl">${lt("Zweipol", "Two-terminal")}</text>
      <g transform="translate(0 0)">${elementSVG(st.e, 120, 95)}</g>
      <circle class="term" cx="54" cy="95" r="6"/><circle class="term" cx="186" cy="95" r="6"/>
      <text x="54" y="122" text-anchor="middle" class="cap">${lt("Klemme", "terminal")} 1</text><text x="186" y="122" text-anchor="middle" class="cap">${lt("Klemme", "terminal")} 2</text>
      <text x="120" y="160" text-anchor="middle" class="lbl">${lt(ELEMENTS.find((x) => x.id === st.e).de, ELEMENTS.find((x) => x.id === st.e).en)}</text>
      <line class="sep" x1="260" y1="20" x2="260" y2="180"/>
      <circle class="el" cx="380" cy="95" r="34"/><text x="380" y="100" text-anchor="middle" class="lbl">${st.n}-${lt("Pol", "pole")}</text>${leads}`);
    read.innerHTML = `<p>${L(`Ein ${st.n}-Pol hat <b>${st.n} Klemmen</b>`, `An ${st.n}-pole has <b>${st.n} terminals</b>`)}${examples[st.n] ? ` — ${Lp(examples[st.n])}` : L(" — z. B. ein integrierter Schaltkreis.", " — e.g. an integrated circuit.")}</p>`;
    lenOut(box, "n", st.n);
  });
  lenWire(box, st, draw);
}

// A linear two-terminal: U = R·I + U0, a straight line. Its special cases are a resistor and an
// ideal voltage source.
function wLinear(root) {
  const box = $('[data-w="linear"]', root);
  const st = { R: 2, U0: 3, I: 1 };
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const draw = lenWidget(() => {
    const p = plotArea(40, 18, 270, 210, -3, 3, -12, 12);
    const U = (i) => st.R * i + st.U0;
    const lo = clamp(U(-3), -12, 12), hi = clamp(U(3), -12, 12);
    const iAt = (u) => (st.R ? (u - st.U0) / st.R : 0);
    const x1 = st.R ? clamp(iAt(lo), -3, 3) : -3, x2 = st.R ? clamp(iAt(hi), -3, 3) : 3;
    const zeroI = st.R ? -st.U0 / st.R : null;
    fig.innerHTML = svgBox(330, 250, `
      ${axesSVG(p, "I / A", "U / V", 1, 4)}
      <line class="curve q-u" x1="${r1(p.X(x1))}" y1="${r1(p.Y(U(x1)))}" x2="${r1(p.X(x2))}" y2="${r1(p.Y(U(x2)))}"/>
      ${Math.abs(st.U0) <= 12 ? `<circle class="pt hollow" cx="${p.X(0)}" cy="${r1(p.Y(st.U0))}" r="5"/><text x="${p.X(0) + 9}" y="${r1(p.Y(st.U0)) - 8}" class="lbl tc q-u">U₀</text>` : ""}
      ${zeroI !== null && Math.abs(zeroI) <= 3 && st.U0 ? `<circle class="pt hollow" cx="${r1(p.X(zeroI))}" cy="${p.Y(0)}" r="5"/>` : ""}
      ${Math.abs(U(st.I)) <= 12 ? `<line class="guide" x1="${r1(p.X(st.I))}" y1="${p.Y(0)}" x2="${r1(p.X(st.I))}" y2="${r1(p.Y(U(st.I)))}"/>
        <line class="guide" x1="${p.X(0)}" y1="${r1(p.Y(U(st.I)))}" x2="${r1(p.X(st.I))}" y2="${r1(p.Y(U(st.I)))}"/>
        <circle class="pt q-u" cx="${r1(p.X(st.I))}" cy="${r1(p.Y(U(st.I)))}" r="6"/>` : ""}`);
    const kind = st.R === 0 && st.U0 === 0 ? ["Kurzschluss: <i>U</i> ist immer 0.", "Short circuit: <i>U</i> is always 0.", ""]
      : st.R === 0 ? ["<b>Ideale Spannungsquelle</b>: <i>U</i> hängt nicht von <i>I</i> ab — eine waagerechte Gerade (→ 1.7).", "<b>Ideal voltage source</b>: <i>U</i> doesn't depend on <i>I</i> — a flat line (→ 1.7).", "u"]
      : st.U0 === 0 ? ["<b>Ohmscher Widerstand</b>: eine Gerade durch den Ursprung.", "<b>Resistor</b>: a straight line through the origin.", "good"]
      : ["Allgemeiner <b>linearer Zweipol</b>: eine Gerade, die nicht durch den Ursprung geht.", "General <b>linear two-terminal</b>: a straight line that misses the origin.", ""];
    read.innerHTML = `
      ${F(`${sU()} = <i class="mv">R</i> · ${sI()} + ${sU("0")}`)}
      ${F(`${sU()} = ${nf(st.R)} Ω · ${nf(st.I)} A ${st.U0 < 0 ? "−" : "+"} ${nf(Math.abs(st.U0), 0)} V = <b class="q-u">${nf(U(st.I))} V</b>`, "small-f")}
      ${st.R ? F(`${sI()} = <i class="mv">G</i> · ${sU()} + ${sI("0")} &nbsp;${L("mit", "with")}&nbsp; <i class="mv">G</i> = ${nf(1 / st.R, 2)} S, ${sI("0")} = −${frac(sU("0"), "<i class='mv'>R</i>")} = ${nf(st.U0 ? -st.U0 / st.R : 0, 2)} A`, "small-f") : ""}
      <p>${L(kind[0], kind[1])}</p>`;
    lenOut(box, "R", nf(st.R) + " Ω");
    lenOut(box, "U0", nf(st.U0, 0) + " V");
    lenOut(box, "I", nf(st.I) + " A");
  });
  lenWire(box, st, draw);
}

/* ================================================================ 1.4 Networks */

// The example network: points, the pieces between them, and which branch each piece is in.
const NET = {
  pts: { A: [70, 40], B: [280, 40], C: [490, 40], M: [490, 150], D: [70, 260], E: [280, 260], F: [490, 260] },
  parts: [
    { id: "s1", a: "A", b: "B", kind: "r", label: "R₁", z: 1 },
    { id: "s2", a: "B", b: "C", kind: "r", label: "R₂", z: 3 },
    { id: "s3", a: "A", b: "D", kind: "v", label: "U₀", z: 1 },
    { id: "s4", a: "B", b: "E", kind: "r", label: "R₃", z: 2 },
    { id: "s5", a: "C", b: "M", kind: "r", label: "R₄", z: 3 },
    { id: "s6", a: "M", b: "F", kind: "r", label: "R₅", z: 3 },
    { id: "s7", a: "D", b: "E", kind: "r", label: "R₆", z: 1 },
    { id: "s8", a: "E", b: "F", kind: "wire", label: "", z: 0 },
  ],
  branches: {
    1: { path: "BADE", de: "Zweig 1: R₁, U₀ und R₆ — drei Zweipole hintereinander zwischen K₁ und K₂.", en: "Branch 1: R₁, U₀ and R₆ — three two-terminals in a row between K₁ and K₂." },
    2: { path: "BE", de: "Zweig 2: nur R₃, direkt von K₁ nach K₂.", en: "Branch 2: just R₃, straight from K₁ to K₂." },
    3: { path: "BCMF", de: "Zweig 3: R₂, R₄ und R₅ zwischen K₁ und K₂. Die Ecken C und der Punkt zwischen R₄ und R₅ sind keine Knoten — darum gehört alles zu einem Zweig.",
      en: "Branch 3: R₂, R₄ and R₅ between K₁ and K₂. Corner C and the point between R₄ and R₅ aren't nodes — so it's all one branch." },
  },
  meshes: {
    1: { path: "BADEB", z: "1 + 2", de: "Masche 1: Zweig 1 und Zweig 2 — der linke Ring.", en: "Mesh 1: branch 1 and branch 2 — the left ring." },
    2: { path: "BCMFEB", z: "2 + 3", de: "Masche 2: Zweig 2 und Zweig 3 — der rechte Ring.", en: "Mesh 2: branch 2 and branch 3 — the right ring." },
    3: { path: "ABCMFEDA", z: "1 + 3", de: "Masche 3: Zweig 1 und Zweig 3 — einmal ganz außen herum.", en: "Mesh 3: branch 1 and branch 3 — all the way round the outside." },
  },
  points: {
    A: ["Ecke A: nur 2 Klemmen (R₁ und U₀) → <b>kein Knoten</b>.", "Corner A: only 2 terminals (R₁ and U₀) → <b>not a node</b>.", 0],
    B: ["B: R₁, R₂ und R₃ treffen sich — <b>3 Klemmen → Knoten K₁</b>.", "B: R₁, R₂ and R₃ meet — <b>3 terminals → node K₁</b>.", 1],
    C: ["Ecke C: nur R₂ und R₄ → <b>kein Knoten</b>.", "Corner C: only R₂ and R₄ → <b>not a node</b>.", 0],
    M: ["Zwischen R₄ und R₅: nur 2 Klemmen → <b>kein Knoten</b>. R₄ und R₅ liegen einfach hintereinander.", "Between R₄ and R₅: only 2 terminals → <b>not a node</b>. R₄ and R₅ just sit one after the other.", 0],
    D: ["Ecke D: nur U₀ und R₆ → <b>kein Knoten</b>.", "Corner D: only U₀ and R₆ → <b>not a node</b>.", 0],
    E: ["E: R₃, R₆ und der Draht nach F → <b>Knoten</b>. Weil E und F nur durch einen Draht <i>ohne Bauteil</i> verbunden sind, sind sie zusammen <b>ein</b> Knoten K₂ (mit R₃, R₆ und R₅).",
      "E: R₃, R₆ and the wire to F → <b>node</b>. Since E and F are joined only by a wire <i>with no element</i>, together they are <b>one</b> node K₂ (with R₃, R₆ and R₅).", 2],
    F: ["F: hier enden R₅ und der Draht nach E. Über den blanken Draht hängt F an E — <b>E und F sind derselbe Knoten K₂</b>.",
      "F: R₅ and the wire to E end here. Through the bare wire F belongs to E — <b>E and F are the same node K₂</b>.", 2],
  },
};

function wNetwork(root) {
  const box = $('[data-w="network"]', root);
  const st = { mode: "k", pick: null, z: null, m: 1, all: false };
  const fig = $(".lw-fig", box), read = $(".lw-read", box), side = $(".lw-net-pick", box);
  const P = NET.pts;
  const poly = (path) => [...path].map((k) => P[k].join(",")).join(" ");
  const draw = lenWidget(() => {
    let hl = "";
    if (st.mode === "z" && st.z) hl = `<polyline class="hl" points="${poly(NET.branches[st.z].path)}"/>`;
    if (st.mode === "m") hl = `<polyline class="hl" points="${poly(NET.meshes[st.m].path)}"/><polyline class="ants" points="${poly(NET.meshes[st.m].path)}"/>`;
    const showK1 = st.mode === "k" && (st.all || (st.pick && NET.points[st.pick][2] === 1));
    const showK2 = st.mode === "k" && (st.all || (st.pick && NET.points[st.pick][2] === 2));
    if (showK2) hl += `<polyline class="hl node" points="${P.E.join(",")} ${P.F.join(",")}"/>`;
    const parts = NET.parts.map((s) => {
      const [x1, y1] = P[s.a], [x2, y2] = P[s.b];
      const cls = `part ${st.mode === "z" ? "click" : ""} ${st.mode === "z" && st.z === s.z ? "on" : ""}`;
      const lab = s.kind === "r" ? resistorSVG(x1, y1, x2, y2, s.label, "", 48, 18) : s.kind === "v" ? vSourceSVG(x1, y1, x2, y2, 16) + `<text x="${x1 + 24}" y="${(y1 + y2) / 2 + 5}" class="lbl">${s.label}</text>` : `<line class="w" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
      return `<g class="${cls}" data-z="${s.z}"><line class="hit" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>${lab}</g>`;
    }).join("");
    const pts = Object.entries(P).map(([k, [x, y]]) => {
      const isNode = NET.points[k][2];
      const on = st.mode === "k" && (st.pick === k || (st.all && isNode));
      return st.mode === "k"
        ? `<g class="pt-k click ${on ? "on" : ""} ${(showK1 && isNode === 1) || (showK2 && isNode === 2) ? "node" : ""}" data-p="${k}"><circle cx="${x}" cy="${y}" r="16" class="hit-c"/><circle cx="${x}" cy="${y}" r="7"/></g>`
        : (isNode ? `<circle class="dot" cx="${x}" cy="${y}" r="5"/>` : "");
    }).join("");
    const labels = Object.entries(P).map(([k, [x, y]]) => `<text x="${x + (x > 400 ? 14 : -14)}" y="${y + (y < 100 ? -10 : 22)}" text-anchor="middle" class="cap">${k}</text>`).join("");
    const kLabels = (showK1 ? `<text x="${P.B[0]}" y="${P.B[1] - 16}" text-anchor="middle" class="lbl tc q-hl">K₁</text>` : "") +
      (showK2 ? `<text x="${(P.E[0] + P.F[0]) / 2}" y="${P.E[1] + 24}" text-anchor="middle" class="lbl tc q-hl">K₂</text>` : "");
    fig.innerHTML = svgBox(560, 300, `${hl}${parts}${pts}${st.mode === "k" ? labels : ""}${kLabels}`, "net");
    // What's picked, and the counts.
    let info = "";
    if (st.mode === "k") info = st.pick ? L(NET.points[st.pick][0], NET.points[st.pick][1])
      : st.all ? L("Nur B und E/F sind Knoten: <b>2 Knoten</b>. Alle anderen Punkte verbinden nur 2 Klemmen.", "Only B and E/F are nodes: <b>2 nodes</b>. All other points join only 2 terminals.")
      : L("Tippe auf einen Punkt: ist er ein Knoten?", "Tap a point: is it a node?");
    if (st.mode === "z") info = st.z ? L(NET.branches[st.z].de, NET.branches[st.z].en) : L("Tippe auf ein Bauteil, um seinen Zweig zu sehen.", "Tap an element to see its branch.");
    if (st.mode === "m") info = L(NET.meshes[st.m].de, NET.meshes[st.m].en);
    read.innerHTML = `<p class="lw-info">${info}</p>
      <div class="lw-tally">
        <span class="${st.mode === "k" ? "on" : ""}"><b>2</b> ${L("Knoten", "nodes")}</span>
        <span class="${st.mode === "z" ? "on" : ""}"><b>3</b> ${L("Zweige", "branches")}</span>
        <span class="${st.mode === "m" ? "on" : ""}"><b>3</b> ${L("Maschen", "meshes")}</span>
      </div>`;
    side.innerHTML = st.mode === "k"
      ? `<button class="btn" type="button" data-a="all">${st.all ? L("Knoten ausblenden", "Hide the nodes") : L("Alle Knoten zeigen", "Show all nodes")}</button>`
      : st.mode === "z"
        ? `<div class="seg lw-seg">${[1, 2, 3].map((z) => `<button type="button" data-z="${z}" class="${st.z === z ? "active" : ""}">${L("Zweig", "Branch")} ${z}</button>`).join("")}</div>`
        : `<div class="seg lw-seg">${[1, 2, 3].map((m) => `<button type="button" data-m="${m}" class="${st.m === m ? "active" : ""}">${L("Masche", "Mesh")} ${m}</button>`).join("")}</div>`;
    $$("[data-p]", fig).forEach((g) => (g.onclick = () => { st.pick = st.pick === g.dataset.p ? null : g.dataset.p; st.all = false; draw(); }));
    if (st.mode === "z") $$(".part[data-z]", fig).forEach((g) => g.dataset.z !== "0" && (g.onclick = () => { st.z = +g.dataset.z; draw(); }));
    $$("[data-z]", side).forEach((b) => (b.onclick = () => { st.z = +b.dataset.z; draw(); }));
    $$("[data-m]", side).forEach((b) => (b.onclick = () => { st.m = +b.dataset.m; draw(); }));
    const all = $('[data-a="all"]', side);
    if (all) all.onclick = () => { st.all = !st.all; st.pick = null; draw(); };
  });
  lenWire(box, st, draw);
}

/* ================================================================ 1.5 Reference arrows */

// A resistor between two potentials. Flip the arrows: the current doesn't change, only its sign.
function wArrows(root) {
  const box = $('[data-w="arrows"]', root);
  const st = { p1: 6, p2: 2, ia: 1, ua: 1 };
  const R = 2;
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const dots = Array.from({ length: 10 }, (_, i) => 40 + i * 46);
  const draw = lenWidget(() => {
    const Ireal = (st.p1 - st.p2) / R; // > 0: left to right
    const I = Ireal * st.ia;
    const U = (st.p1 - st.p2) * st.ua;
    fig.innerHTML = svgBox(520, 200, `
      <line class="w" x1="30" y1="80" x2="490" y2="80"/>
      <g class="cdots">${dots.map((x) => `<circle class="pdot" cx="${x}" cy="80" r="4"/>`).join("")}</g>
      <rect class="el" x="215" y="68" width="90" height="24" rx="2"/><text x="260" y="58" text-anchor="middle" class="lbl">R = 2 Ω</text>
      <circle class="dot" cx="180" cy="80" r="4.5"/><circle class="dot" cx="340" cy="80" r="4.5"/>
      <text x="180" y="108" text-anchor="middle" class="lbl tc q-phi">φ₁ = ${nf(st.p1, 0)} V</text>
      <text x="340" y="108" text-anchor="middle" class="lbl tc q-phi">φ₂ = ${nf(st.p2, 0)} V</text>
      <g class="click flip" data-a="flip-i">
        <rect class="hit-r" x="40" y="30" width="110" height="40"/>
        ${arrowSVG(95 - st.ia * 40, 52, 95 + st.ia * 40, 52, "i", 3.5, 12)}
        <text x="95" y="40" text-anchor="middle" class="lbl tc q-i">I = ${nfs(I)} A</text></g>
      <g class="click flip" data-a="flip-u">
        <rect class="hit-r" x="170" y="120" width="180" height="60"/>
        ${arrowSVG(260 - st.ua * 75, 140, 260 + st.ua * 75, 140, "u", 3.5, 12)}
        <text x="260" y="168" text-anchor="middle" class="lbl tc q-u">U = ${nfs(U)} V</text></g>
      ${svgT(510, 195, "Pfeile antippen zum Umdrehen", "tap the arrows to flip them", 'text-anchor="end" class="cap"')}`);
    $$(".cdots circle", fig).forEach((c) => (c.style.opacity = Ireal ? 1 : 0.35));
    const real = Ireal === 0 ? L("Gleiche Potentiale: <b>es fließt kein Strom</b>.", "Equal potentials: <b>no current flows</b>.")
      : L(`Tatsächlich fließen <b>${nf(Math.abs(Ireal))} A nach ${Ireal > 0 ? "rechts" : "links"}</b> — vom höheren zum niedrigeren Potential.`,
        `Really, <b>${nf(Math.abs(Ireal))} A flow to the ${Ireal > 0 ? "right" : "left"}</b> — from higher to lower potential.`);
    const along = Math.sign(I) > 0;
    read.innerHTML = `
      <p>${real}</p>
      
        <p class="lw-line q-i-row">${L(`Strompfeil nach ${st.ia > 0 ? "rechts" : "links"} → <b>I = ${nfs(I)} A</b>`, `Current arrow to the ${st.ia > 0 ? "right" : "left"} → <b>I = ${nfs(I)} A</b>`)}${I ? (along
          ? L(" (Strom fließt in Pfeilrichtung)", " (current flows along the arrow)") : L(" (Strom fließt gegen den Pfeil)", " (current flows against the arrow)")) : ""}</p>
        <p class="lw-line q-u-row">${st.ua > 0
          ? `${L("Spannungspfeil von φ₁ nach φ₂", "Voltage arrow from φ₁ to φ₂")} → <b>U = φ₁ − φ₂ = ${nf(st.p1, 0)} V − ${nf(st.p2, 0)} V = ${nfs(U)} V</b>`
          : `${L("Spannungspfeil von φ₂ nach φ₁", "Voltage arrow from φ₂ to φ₁")} → <b>U = φ₂ − φ₁ = ${nf(st.p2, 0)} V − ${nf(st.p1, 0)} V = ${nfs(U)} V</b>`}</p>
      
      <p class="small muted">${L("Der Pfeil legt nur fest, in welche Richtung gezählt wird. Die Physik bleibt dieselbe — nur das Vorzeichen ändert sich.",
        "The arrow only fixes which way we count. The physics stays the same — only the sign changes.")}</p>`;
    lenOut(box, "p1", nf(st.p1, 0) + " V");
    lenOut(box, "p2", nf(st.p2, 0) + " V");
    $$("[data-a^='flip']", fig).forEach((g) => (g.onclick = () => { st[g.dataset.a === "flip-i" ? "ia" : "ua"] *= -1; draw(); }));
  });
  lenWire(box, st, draw);
  $('[data-a="fi"]', box).onclick = () => { st.ia *= -1; draw(); };
  $('[data-a="fu"]', box).onclick = () => { st.ua *= -1; draw(); };
  let shift = 0;
  lenAnimate(fig, (dt) => {
    const I = (st.p1 - st.p2) / R;
    if (lenCalm() || !I) return;
    shift = (shift + I * 14 * dt + 46) % 46;
    $$(".cdots circle", fig).forEach((c, i) => c.setAttribute("cx", r1(30 + ((i * 46 + shift) % 460))));
  });
}

// Current and voltage arrows on a two-terminal: same way → VZS, opposite → EZS. With a quiz.
function wSystems(root) {
  const box = $('[data-w="systems"]', root);
  const st = { look: "part", into: 1, down: 1, quiz: false, answered: null, right: 0, asked: 0 };
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const vzs = () => st.into === st.down;
  const draw = lenWidget(() => {
    let inner;
    if (st.look === "part") {
      inner = `<line class="w" x1="150" y1="20" x2="150" y2="200"/><circle class="dot" cx="150" cy="20" r="4.5"/><circle class="dot" cx="150" cy="200" r="4.5"/>
        <rect class="el" x="137" y="72" width="26" height="76" rx="2"/>
        <g class="click" data-a="i"><rect class="hit-r" x="120" y="22" width="60" height="48"/>${arrowSVG(150, st.into ? 28 : 64, 150, st.into ? 64 : 28, "i", 3.5, 12)}
          <text x="168" y="52" class="lbl tc q-i">I</text></g>
        <g class="click" data-a="u"><rect class="hit-r" x="182" y="70" width="50" height="80"/>${arrowSVG(200, st.down ? 76 : 144, 200, st.down ? 144 : 76, "u", 3.5, 12)}
          <text x="214" y="116" class="lbl tc q-u">U</text></g>`;
    } else {
      inner = `<rect class="el" x="40" y="40" width="110" height="140" rx="4"/>
        <path class="w" d="M150,70 L240,70 M150,150 L240,150"/><circle class="term" cx="240" cy="70" r="5"/><circle class="term" cx="240" cy="150" r="5"/>
        <g class="click" data-a="i"><rect class="hit-r" x="160" y="44" width="70" height="40"/>${arrowSVG(st.into ? 222 : 170, 70, st.into ? 170 : 222, 70, "i", 3.5, 12)}
          <text x="196" y="60" text-anchor="middle" class="lbl tc q-i">I</text></g>
        <g class="click" data-a="u"><rect class="hit-r" x="244" y="76" width="50" height="68"/>${arrowSVG(258, st.down ? 80 : 140, 258, st.down ? 140 : 80, "u", 3.5, 12)}
          <text x="272" y="116" class="lbl tc q-u">U</text></g>`;
    }
    fig.innerHTML = svgBox(310, 220, inner);
    $$("[data-a]", fig).forEach((g) => (g.onclick = () => {
      if (st.quiz && st.answered === null) return;
      g.dataset.a === "i" ? (st.into ^= 1) : (st.down ^= 1);
      draw();
    }));
    const verdict = vzs()
      ? `<span class="pill good">${L("gleichgerichtet → Verbraucher-Zählpfeilsystem (VZS)", "same direction → passive / load convention (VZS)")}</span>`
      : `<span class="pill warn">${L("entgegengerichtet → Erzeuger-Zählpfeilsystem (EZS)", "opposite directions → active / generator convention (EZS)")}</span>`;
    if (!st.quiz) {
      read.innerHTML = `<p class="lw-c">${verdict}</p>
        <p class="small muted">${st.look === "part"
          ? L("Zeigt der Strompfeil <b>durch das Bauteil</b> in dieselbe Richtung wie der Spannungspfeil?", "Does the current arrow point <b>through the element</b> the same way as the voltage arrow?")
          : L("Fließt der Strom an der Klemme <b>hinein</b>, an der der Spannungspfeil <b>beginnt</b>? Dann sind sie gleichgerichtet.",
            "Does the current flow <b>in</b> at the terminal where the voltage arrow <b>starts</b>? Then they point the same way.")}</p>`;
    } else {
      const ans = st.answered;
      read.innerHTML = `<p><b>${L("Welches Zählpfeilsystem ist das?", "Which convention is this?")}</b></p>
        <div class="lw-row"><button class="btn ${ans !== null && vzs() ? "ok" : ""} ${ans === "vzs" && !vzs() ? "no" : ""}" data-q="vzs" ${ans !== null ? "disabled" : ""}>VZS</button>
          <button class="btn ${ans !== null && !vzs() ? "ok" : ""} ${ans === "ezs" && vzs() ? "no" : ""}" data-q="ezs" ${ans !== null ? "disabled" : ""}>EZS</button>
          <span class="small muted">${st.right} / ${st.asked} ${L("richtig", "right")}</span></div>
        ${ans !== null ? `<p class="lw-c">${verdict}</p><button class="btn primary" data-q="next">${L("Nächste →", "Next →")}</button>` : ""}`;
      $$("[data-q]", read).forEach((b) => (b.onclick = () => {
        if (b.dataset.q === "next") return newTask();
        st.answered = b.dataset.q;
        st.asked++;
        if ((b.dataset.q === "vzs") === vzs()) st.right++;
        draw();
      }));
    }
    $('[data-a="quiz"]', box).innerHTML = st.quiz ? L("Quiz beenden", "Stop the quiz") : L("Teste dich", "Test yourself");
  });
  const newTask = () => {
    st.look = Math.random() < 0.5 ? "part" : "box";
    st.into = Math.random() < 0.5 ? 1 : 0;
    st.down = Math.random() < 0.5 ? 1 : 0;
    st.answered = null;
    lenSetSeg($('[data-seg="look"]', box), st.look);
    draw();
  };
  lenWire(box, st, draw);
  $('[data-a="quiz"]', box).onclick = () => {
    st.quiz = !st.quiz;
    if (st.quiz) { st.right = 0; st.asked = 0; newTask(); } else draw();
  };
}

/* ================================================================ 1.6 Kirchhoff */

// A node with five branches. Set four currents; the fifth either balances them, or you set it
// yourself and see whether the node balances.
function wNode(root) {
  const box = $('[data-w="node"]', root);
  const st = { auto: 1, cur: [{ m: 3, in: 1 }, { m: 2, in: 1 }, { m: 1, in: 0 }, { m: 1.5, in: 0 }, { m: 2.5, in: 0 }] };
  const ANG = [-150, -60, 0, 70, 150].map((d) => (d * Math.PI) / 180);
  const C = [180, 150];
  const fig = $(".lw-fig", box), read = $(".lw-read", box), ctrl = $(".lw-node-ctrl", box);
  const balance = () => {
    if (!st.auto) return;
    const net = st.cur.slice(0, 4).reduce((s, c) => s + (c.in ? c.m : -c.m), 0);
    st.cur[4] = { m: Math.abs(net), in: net < 0 ? 1 : 0 };
  };
  const draw = lenWidget(() => {
    balance();
    const sumIn = st.cur.reduce((s, c) => s + (c.in ? c.m : 0), 0), sumOut = st.cur.reduce((s, c) => s + (c.in ? 0 : c.m), 0);
    const ok = Math.abs(sumIn - sumOut) < 1e-9;
    const branches = st.cur.map((c, k) => {
      const a = ANG[k], ex = C[0] + 140 * Math.cos(a), ey = C[1] + 140 * Math.sin(a);
      const near = 38, far = 100;
      const [ax1, ay1, ax2, ay2] = c.in
        ? [C[0] + far * Math.cos(a), C[1] + far * Math.sin(a), C[0] + near * Math.cos(a), C[1] + near * Math.sin(a)]
        : [C[0] + near * Math.cos(a), C[1] + near * Math.sin(a), C[0] + far * Math.cos(a), C[1] + far * Math.sin(a)];
      const lx = C[0] + 122 * Math.cos(a) + (Math.sin(a) * 18), ly = C[1] + 122 * Math.sin(a) - (Math.cos(a) * 18) + 4;
      return `<line class="w" x1="${C[0]}" y1="${C[1]}" x2="${r1(ex)}" y2="${r1(ey)}"/>
        <g class="click ${k === 4 && st.auto ? "auto" : ""}" data-k="${k}"><circle class="hit-c" cx="${r1((ax1 + ax2) / 2)}" cy="${r1((ay1 + ay2) / 2)}" r="30"/>
        ${c.m ? arrowSVG(ax1, ay1, ax2, ay2, "i", 1.5 + c.m * 1.3, 10 + c.m * 2) : ""}</g>
        <text x="${r1(lx)}" y="${r1(ly)}" text-anchor="middle" class="lbl tc q-i">I${"₁₂₃₄₅"[k]} = ${nf(c.m)} A</text>`;
    }).join("");
    fig.innerHTML = svgBox(360, 300, `${branches}<circle class="node-dot ${ok ? "" : "bad"}" cx="${C[0]}" cy="${C[1]}" r="${ok ? 9 : 13}"/>`);
    $$("[data-k]", fig).forEach((g) => (g.onclick = () => {
      const k = +g.dataset.k;
      if (k === 4 && st.auto) return;
      st.cur[k].in ^= 1;
      draw();
    }));
    const terms = st.cur.map((c, k) => `${c.in ? "+" : "−"} ${sI(k + 1)}`).join(" ");
    const nums = st.cur.map((c) => `${c.in ? "+" : "−"} ${nf(c.m)}`).join(" ");
    const max = Math.max(sumIn, sumOut, 1);
    read.innerHTML = `
      ${F(`${terms.replace(/^\+ /, "")} = 0`, "small-f")}
      ${F(`${nums.replace(/^\+ /, "")} = ${nf(sumIn - sumOut)} ${ok ? "✓" : "✗"}`, "small-f")}
      <div class="lw-bal">
        <span>${L("hinein", "in")}</span><span class="lw-bar"><span style="width:${(sumIn / max) * 100}%"></span></span><b>${nf(sumIn)} A</b>
        <span>${L("heraus", "out")}</span><span class="lw-bar out"><span style="width:${(sumOut / max) * 100}%"></span></span><b>${nf(sumOut)} A</b>
      </div>
      <p class="lw-c"><span class="pill ${ok ? "good" : "bad"}">${ok ? L("Was hineinfließt, fließt auch heraus ✓", "What flows in flows out ✓")
        : sumIn > sumOut ? L("Mehr hinein als heraus — Ladung würde sich im Knoten stauen!", "More in than out — charge would pile up in the node!")
        : L("Mehr heraus als hinein — die Ladung käme aus dem Nichts!", "More out than in — the charge would come from nowhere!")}</span></p>`;
    ctrl.innerHTML = st.cur.map((c, k) => `
      <div class="lw-irow ${k === 4 && st.auto ? "auto" : ""}">
        <b class="q-i">I<sub>${k + 1}</sub></b>
        <button class="icon-btn" type="button" data-d="${k}" data-s="-1" ${k === 4 && st.auto ? "disabled" : ""} aria-label="${lt("weniger", "less")}">−</button>
        <span class="lw-ival">${nf(c.m)} A</span>
        <button class="icon-btn" type="button" data-d="${k}" data-s="1" ${k === 4 && st.auto ? "disabled" : ""} aria-label="${lt("mehr", "more")}">+</button>
        <button class="btn small-btn" type="button" data-t="${k}" ${k === 4 && st.auto ? "disabled" : ""}>${c.in ? L("→ hinein", "→ in") : L("← heraus", "← out")}</button>
      </div>`).join("");
    $$("[data-d]", ctrl).forEach((b) => (b.onclick = () => {
      const c = st.cur[+b.dataset.d];
      c.m = clamp(c.m + 0.5 * +b.dataset.s, 0, 5);
      draw();
    }));
    $$("[data-t]", ctrl).forEach((b) => (b.onclick = () => { st.cur[+b.dataset.t].in ^= 1; draw(); }));
  });
  lenWire(box, st, draw);
}

// The mesh from the notes: walk round it node by node and add up the voltages, with the potential
// going up through the source and down through the resistors, back to where it started.
function wMesh(root) {
  const box = $('[data-w="mesh"]', root);
  const st = { U0: 9, R1: 2, R2: 3, R3: 4, cw: 1, step: 4 };
  // Each branch's arrow: from → to. They start as in the notes: U14, U12, U23, U34.
  const arrows = { s: [1, 4], r1: [1, 2], r2: [2, 3], r3: [3, 4] };
  const N = { 1: [70, 50], 2: [290, 50], 3: [290, 210], 4: [70, 210] };
  const fig = $(".lw-fig .lw-circ", box), prof = $(".lw-fig .lw-prof", box), read = $(".lw-read", box);
  const branchOf = (a, b) => (([a, b].sort().join("") === "14") ? "s" : ({ "12": "r1", "23": "r2", "34": "r3" })[[a, b].sort().join("")]);
  const draw = lenWidget(() => {
    const I = st.U0 / (st.R1 + st.R2 + st.R3);
    const phi = { 4: 0, 1: st.U0 };
    phi[2] = phi[1] - I * st.R1;
    phi[3] = phi[2] - I * st.R2;
    const val = (k) => phi[arrows[k][0]] - phi[arrows[k][1]];
    const walk = st.cw ? [1, 2, 3, 4, 1] : [1, 4, 3, 2, 1];
    const steps = walk.slice(0, -1).map((a, i) => {
      const b = walk[i + 1], k = branchOf(a, b);
      const along = arrows[k][0] === a;
      return { a, b, k, along, name: `U<sub>${arrows[k].join("")}</sub>`, v: val(k) };
    });
    const shown = steps.slice(0, st.step);
    // The circuit.
    const hl = st.step < 4 ? `<line class="hl" x1="${N[steps[st.step].a][0]}" y1="${N[steps[st.step].a][1]}" x2="${N[steps[st.step].b][0]}" y2="${N[steps[st.step].b][1]}"/>` : "";
    const at = N[walk[st.step]];
    const ua = (k, off) => {
      // An arrow beside the branch from node arrows[k][0] to arrows[k][1].
      const [f, t] = arrows[k];
      const A = N[f], B = N[t];
      const horiz = A[1] === B[1];
      const dx = horiz ? 0 : off, dy = horiz ? off : 0;
      const sx = A[0] + dx + (horiz ? Math.sign(B[0] - A[0]) * 50 : 0), sy = A[1] + dy + (horiz ? 0 : Math.sign(B[1] - A[1]) * 50);
      const ex = B[0] + dx - (horiz ? Math.sign(B[0] - A[0]) * 50 : 0), ey = B[1] + dy - (horiz ? 0 : Math.sign(B[1] - A[1]) * 50);
      const lx = (sx + ex) / 2 + (horiz ? 0 : off > 0 ? 12 : -12), ly = (sy + ey) / 2 + (horiz ? (off > 0 ? 18 : -8) : 4);
      return `<g class="click" data-flip="${k}"><rect class="hit-r" x="${Math.min(sx, ex) - 14}" y="${Math.min(sy, ey) - 14}" width="${Math.abs(ex - sx) + 28}" height="${Math.abs(ey - sy) + 28}"/>
        ${arrowSVG(sx, sy, ex, ey, "u", 2.5)}<text x="${lx}" y="${ly}" text-anchor="${horiz ? "middle" : off > 0 ? "start" : "end"}" class="lbl tc q-u">U<tspan font-size="10" dy="4">${f}${t}</tspan></text></g>`;
    };
    fig.innerHTML = svgBox(360, 260, `
      ${hl}
      ${vSourceSVG(70, 50, 70, 210, 16)}<text x="86" y="112" class="lbl">+</text><text x="86" y="160" class="lbl">−</text>
      ${resistorSVG(70, 50, 290, 50, "", "", 56, 18)}<text x="180" y="78" text-anchor="middle" class="lbl">R₁</text>
      ${resistorSVG(290, 50, 290, 210, "", "", 56, 18)}<text x="270" y="134" text-anchor="end" class="lbl">R₂</text>
      ${resistorSVG(290, 210, 70, 210, "", "", 56, 18)}<text x="180" y="196" text-anchor="middle" class="lbl">R₃</text>
      ${Object.entries(N).map(([n, [x, y]]) => `<circle class="dot" cx="${x}" cy="${y}" r="5"/><text x="${x + (x < 200 ? -14 : 14)}" y="${y + (y < 100 ? -8 : 20)}" text-anchor="middle" class="lbl">${n}</text>`).join("")}
      ${ua("s", -30)}${ua("r1", -22)}${ua("r2", 30)}${ua("r3", 24)}
      <path class="loop" d="${st.cw ? "M150,105 A40,40 0 1,1 150,155" : "M210,105 A40,40 0 1,0 210,155"}"/>
      ${st.cw ? arrowSVG(158, 158, 148, 154, "hl", 3, 10) : arrowSVG(202, 158, 212, 154, "hl", 3, 10)}
      <circle class="walker" cx="${at[0]}" cy="${at[1]}" r="9"/>`);
    $$("[data-flip]", fig).forEach((g) => (g.onclick = () => { arrows[g.dataset.flip].reverse(); draw(); }));
    // The potential along the walk.
    const p = plotArea(46, 28, 290, 110, 0, 4, Math.min(0, ...Object.values(phi)) - 1, Math.max(...Object.values(phi)) + 1);
    const pts = walk.map((n, i) => [p.X(i), p.Y(phi[n])]);
    prof.innerHTML = svgBox(360, 170, `
      <line class="zero" x1="${p.x0}" y1="${r1(p.Y(0))}" x2="${p.x0 + p.w}" y2="${r1(p.Y(0))}"/>
      <text x="${p.x0 - 6}" y="${r1(p.Y(0)) + 4}" text-anchor="end" class="cap">0 V</text>
      ${pts.slice(0, -1).map(([x, y], i) => `<line class="step-l ${i < st.step ? "on" : ""}" x1="${r1(x)}" y1="${r1(y)}" x2="${r1(pts[i + 1][0])}" y2="${r1(pts[i + 1][1])}"/>`).join("")}
      ${pts.map(([x, y], i) => `<circle class="pt q-phi ${i <= st.step ? "" : "dim"}" cx="${r1(x)}" cy="${r1(y)}" r="5"/>
        <text x="${r1(x)}" y="${p.y0 + p.h + 26}" text-anchor="middle" class="cap">${walk[i]}</text>
        ${i <= st.step && i < 4 ? `<text x="${r1(x) + 8}" y="${r1(y) - 8}" class="cap tc q-phi">${nf(phi[walk[i]])}</text>` : ""}`).join("")}
      ${svgT(p.x0 + p.w, 10, "Potential φ entlang des Umlaufs", "potential φ along the walk", 'text-anchor="end" class="cap"')}`);
    const sum = shown.reduce((s, x) => s + (x.along ? x.v : -x.v), 0);
    read.innerHTML = `
      ${F(shown.length ? shown.map((x, i) => `${x.along ? (i ? "+ " : "") : "− "}<i class="mv q-u">${x.name}</i>`).join(" ") + (st.step === 4 ? " = 0" : " …") : "…", "small-f")}
      ${F(shown.length ? shown.map((x, i) => `${x.along ? (i ? "+ " : "") : "− "}(${nfs(x.v)})`).join(" ") + ` = ${nf(sum)}${st.step === 4 ? " ✓" : ""}` : "", "small-f")}
      <p class="small muted">${st.step < 4
        ? L(`Nächster Schritt: von Knoten ${steps[st.step].a} nach ${steps[st.step].b}. Zeigt der Pfeil ${"U" + arrows[steps[st.step].k].join("")} in Laufrichtung, kommt er mit <b>+</b> in die Summe, sonst mit <b>−</b>.`,
          `Next step: from node ${steps[st.step].a} to ${steps[st.step].b}. If the arrow ${"U" + arrows[steps[st.step].k].join("")} points along the walk it goes in with <b>+</b>, otherwise with <b>−</b>.`)
        : L("Einmal ringsherum: zurück beim gleichen Potential, also ist die Summe 0. Tipp auf einen Spannungspfeil, um ihn umzudrehen — die Gleichung stimmt trotzdem.",
          "Once round: back at the same potential, so the sum is 0. Tap a voltage arrow to flip it — the equation still holds.")}</p>`;
    $('[data-a="step"]', box).disabled = st.step >= 4;
    lenOut(box, "U0", nf(st.U0, 0) + " V");
    ["R1", "R2", "R3"].forEach((k) => lenOut(box, k, nf(st[k], 0) + " Ω"));
  });
  lenWire(box, st, () => { draw(); });
  $$('[data-seg="cw"] button', box).forEach((b) => b.addEventListener("click", () => { st.step = 0; draw(); }));
  $('[data-a="step"]', box).onclick = () => { st.step = Math.min(4, st.step + 1); draw(); };
  $('[data-a="all"]', box).onclick = () => { st.step = 4; draw(); };
  $('[data-a="restart"]', box).onclick = () => { st.step = 0; draw(); };
}

/* ================================================================ 1.7 Sources */

// An ideal source with a load you can change: what the source holds stays put, the other adapts.
function wSources(root) {
  const box = $('[data-w="sources"]', root);
  const st = { kind: "u", R: 5, U0: 10, I0: 2 };
  const fig = $(".lw-fig", box), read = $(".lw-read", box);
  const draw = lenWidget(() => {
    const isU = st.kind === "u";
    const U = isU ? st.U0 : st.I0 * st.R, I = isU ? st.U0 / st.R : st.I0;
    const circuit = svgBox(260, 220, `
      <path class="w" d="M60,40 L200,40 M60,180 L200,180"/>
      ${isU ? vSourceSVG(60, 40, 60, 180, 18) : iSourceSVG(60, 40, 60, 180, 18)}
      ${resistorSVG(200, 40, 200, 180, "R", "", 56, 20)}
      ${isU ? arrowSVG(28, 85, 28, 135, "u", 2.5) + `<text x="20" y="114" text-anchor="end" class="lbl tc q-u">U₀</text>`
        : arrowSVG(60, 78, 60, 52, "i", 3) + `<text x="74" y="66" class="lbl tc q-i">I₀</text>`}
      ${arrowSVG(110, 40, 150, 40, "i", 3)}<text x="130" y="30" text-anchor="middle" class="lbl tc q-i">I = ${nf(I, 2)} A</text>
      ${arrowSVG(238, 80, 238, 140, "u", 2.5)}<text x="236" y="160" text-anchor="end" class="lbl tc q-u">U</text>
      <text x="130" y="208" text-anchor="middle" class="lbl tc q-u">U = ${nf(U, 1)} V</text>`);
    // Source line (flat) and the load's line through zero; they cross at the operating point.
    const p = isU ? plotArea(44, 20, 230, 160, 0, 20, 0, 15) : plotArea(44, 20, 230, 160, 0, 40, 0, 5);
    const yv = isU ? st.U0 : st.I0;
    const xOp = isU ? I : U;
    const loadEnd = isU ? Math.min(20, 15 / st.R) : Math.min(40, 5 * st.R);
    const graph = svgBox(300, 220, `
      ${axesSVG(p, isU ? "I / A" : "U / V", isU ? "U / V" : "I / A", isU ? 5 : 10, isU ? 5 : 1)}
      <line class="curve ${isU ? "q-u" : "q-i"}" x1="${p.X(0)}" y1="${r1(p.Y(yv))}" x2="${p.X(p.xmax)}" y2="${r1(p.Y(yv))}"/>
      <text x="${p.X(p.xmax) - 2}" y="${r1(p.Y(yv)) - 8}" text-anchor="end" class="lbl tc ${isU ? "q-u" : "q-i"}">${isU ? "U₀" : "I₀"}</text>
      <line class="load" x1="${p.X(0)}" y1="${p.Y(0)}" x2="${r1(p.X(loadEnd))}" y2="${r1(p.Y(isU ? loadEnd * st.R : loadEnd / st.R))}"/>
      ${xOp <= p.xmax ? `<circle class="pt q-phi" cx="${r1(p.X(xOp))}" cy="${r1(p.Y(yv))}" r="6"/>` : ""}
      ${svgT(p.X(p.xmax) - 2, 212, "gestrichelt: der Widerstand R", "dashed: the resistor R", 'text-anchor="end" class="cap"')}`);
    fig.innerHTML = `<div class="lw-pair">${circuit}${graph}</div>`;
    const edge = isU ? st.R <= 0.5 : st.R >= 20;
    read.innerHTML = isU ? `
      <div class="lw-vals"><span>${L("Klemmenspannung", "Terminal voltage")}</span><b class="q-u">U = U₀ = ${nf(st.U0, 0)} V · ${L("bleibt", "fixed")}</b>
        <span>${L("Strom", "Current")}</span><b class="q-i">I = U₀ / R = ${nf(I, 2)} A · ${L("passt sich an", "adapts")}</b></div>
      ${edge ? `<p class="note">${L("Kurzschluss (R → 0): Der Strom würde unendlich groß. Eine ideale Spannungsquelle darf man nicht kurzschließen.",
        "Short circuit (R → 0): the current would grow without limit. Never short-circuit an ideal voltage source.")}</p>` : ""}`
      : `
      <div class="lw-vals"><span>${L("Klemmenstrom", "Terminal current")}</span><b class="q-i">I = I₀ = ${nf(st.I0)} A · ${L("bleibt", "fixed")}</b>
        <span>${L("Spannung", "Voltage")}</span><b class="q-u">U = I₀ · R = ${nf(U, 1)} V · ${L("passt sich an", "adapts")}</b></div>
      ${edge ? `<p class="note">${L("Leerlauf (R → ∞): Die Spannung würde unendlich groß. Eine ideale Stromquelle darf man nicht offen lassen.",
        "Open circuit (R → ∞): the voltage would grow without limit. Never leave an ideal current source open.")}</p>` : ""}`;
    $(".lw-u0", box).hidden = !isU;
    $(".lw-i0", box).hidden = isU;
    lenOut(box, "R", nf(st.R) + " Ω");
    lenOut(box, "U0", nf(st.U0, 0) + " V");
    lenOut(box, "I0", nf(st.I0) + " A");
  });
  lenWire(box, st, draw);
}
