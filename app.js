window.__v = window.__v || {}; window.__v.app = "R6"; // رقم الإصدار (لا تغيّره)
// مولّد رمز QR (مستوى تصحيح M، إصدارات 1-10) - يعمل داخل المتصفح بدون أي مكتبة خارجية
window.makeQR = (function () {
  const EXP = [], LOG = [];
  for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
  const gmul = (a, b) => (a && b) ? EXP[(LOG[a] + LOG[b]) % 255] : 0;
  function divisor(deg) {
    const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
    for (let i = 0; i < deg; i++) {
      for (let j = 0; j < r.length; j++) { r[j] = gmul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; }
      root = gmul(root, 2);
    }
    return r;
  }
  function remainder(data, div) {
    const r = new Array(div.length).fill(0);
    for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gmul(c, f); }); }
    return r;
  }
  // مستوى M: [عدد الكتل, بيانات الكتلة] + عدد رموز التصحيح لكل كتلة
  const TB = {
    1: [[[1, 16]], 10], 2: [[[1, 28]], 16], 3: [[[1, 44]], 26], 4: [[[2, 32]], 18], 5: [[[2, 43]], 24],
    6: [[[4, 27]], 16], 7: [[[4, 31]], 18], 8: [[[2, 38], [2, 39]], 22], 9: [[[3, 36], [2, 37]], 22], 10: [[[4, 43], [1, 44]], 26]
  };
  const bitAt = (x, i) => ((x >>> i) & 1) !== 0;
  return function (text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 0, dataCap = 0;
    for (let v = 1; v <= 10; v++) {
      const cap = TB[v][0].reduce((s, b) => s + b[0] * b[1], 0);
      if (4 + (v < 10 ? 8 : 16) + 8 * bytes.length <= cap * 8) { ver = v; dataCap = cap; break; }
    }
    if (!ver) throw new Error("النص طويل جداً لرمز QR");
    const bits = [];
    const put = (val, n) => { for (let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, dataCap * 8 - bits.length));
    while (bits.length % 8) bits.push(0);
    const data = [];
    for (let i = 0; i < bits.length; i += 8) { let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    for (let p = 0xEC; data.length < dataCap; p ^= 0xEC ^ 0x11) data.push(p);
    // الكتل + التصحيح + التداخل
    const [groups, ecLen] = TB[ver], div = divisor(ecLen), blocks = [];
    let off = 0;
    groups.forEach(([n, len]) => { for (let i = 0; i < n; i++) { const d = data.slice(off, off + len); off += len; blocks.push([d, remainder(d, div)]); } });
    const all = [], maxLen = Math.max(...blocks.map(b => b[0].length));
    for (let i = 0; i < maxLen; i++) blocks.forEach(b => { if (i < b[0].length) all.push(b[0][i]); });
    for (let i = 0; i < ecLen; i++) blocks.forEach(b => all.push(b[1][i]));
    // المصفوفة
    const size = 17 + 4 * ver, M = [], F = [];
    for (let y = 0; y < size; y++) { M.push(new Array(size).fill(false)); F.push(new Array(size).fill(false)); }
    const setF = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
    for (let i = 0; i < size; i++) { setF(6, i, i % 2 === 0); setF(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.max(Math.abs(dx), Math.abs(dy)), x = cx + dx, y = cy + dy;
      if (x >= 0 && x < size && y >= 0 && y < size) setF(x, y, d !== 2 && d !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    const pos = [];
    if (ver > 1) { const na = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (na * 2 - 2)) * 2; pos.push(6); for (let p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p); }
    pos.forEach((px, i) => pos.forEach((py, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === pos.length - 1) || (i === pos.length - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) setF(px + dx, py + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
    const drawFormat = (mask) => {
      const d = (0 << 3) | mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const b = ((d << 10) | r) ^ 0x5412;
      for (let i = 0; i <= 5; i++) setF(8, i, bitAt(b, i)); setF(8, 7, bitAt(b, 6)); setF(8, 8, bitAt(b, 7)); setF(7, 8, bitAt(b, 8));
      for (let i = 9; i < 15; i++) setF(14 - i, 8, bitAt(b, i));
      for (let i = 0; i < 8; i++) setF(size - 1 - i, 8, bitAt(b, i));
      for (let i = 8; i < 15; i++) setF(8, size - 15 + i, bitAt(b, i));
      setF(8, size - 8, true);
    };
    drawFormat(0);
    if (ver >= 7) { let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25); const b = (ver << 12) | r;
      for (let i = 0; i < 18; i++) { const a = size - 11 + (i % 3), c = Math.floor(i / 3); setF(a, c, bitAt(b, i)); setF(c, a, bitAt(b, i)); } }
    const rem = (ver >= 2 && ver <= 6) ? 7 : 0;
    const stream = []; all.forEach(c => { for (let i = 7; i >= 0; i--) stream.push((c >>> i) & 1); }); for (let i = 0; i < rem; i++) stream.push(0);
    let k = 0;
    for (let right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
        if (!F[y][x] && k < stream.length) { M[y][x] = stream[k++] === 1; } } }
    const inv = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const withMask = (m) => { const R = M.map(r => r.slice()); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!F[y][x] && inv[m](x, y)) R[y][x] = !R[y][x]; return R; };
    const penalty = (R) => { let p = 0;
      for (let t = 0; t < 2; t++) for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { const c = t ? R[b][a] : R[a][b], pv = t ? R[b - 1][a] : R[a][b - 1]; if (c === pv) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) { const c = R[y][x]; if (c === R[y][x + 1] && c === R[y + 1][x] && c === R[y + 1][x + 1]) p += 3; }
      let dark = 0; R.forEach(r => r.forEach(v => { if (v) dark++; })); p += Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10; return p; };
    let best = 0, bestP = Infinity, bestR = null;
    for (let m = 0; m < 8; m++) { const R = withMask(m), pn = penalty(R); if (pn < bestP) { bestP = pn; best = m; bestR = R; } }
    // أعد رسم بتّات الصيغة بالقناع المختار
    const saveM = M; for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) M[y][x] = bestR[y][x];
    drawFormat(best);
    return { size, modules: M };
  };
})();

(function () {
  // تنبيه واضح إذا لم يُحمَّل products.js (غير مرفوع أو في مجلد آخر)
  if (!window.SHOP_CONFIG || !window.PRODUCTS) {
    document.body.innerHTML = '<div style="padding:40px 20px;text-align:center;font-family:sans-serif;color:#b91c1c;direction:rtl">' +
      '<h2>تعذّر تحميل ملف products.js</h2>' +
      (window.__jsErr ? '<p style="direction:ltr;font-size:15px;margin:14px 0">' + window.__jsErr + '</p><p>غالباً نسيت فاصلة <b>,</b> أو علامة اقتباس <b>"</b> أثناء التعديل. افتح الملف عند السطر المذكور وراجعه.</p>'
                         : '<p>تأكد أنه مرفوع بجانب index.html في نفس المجلد.</p>') + '</div>';
    return;
  }
  const CFG = window.SHOP_CONFIG;
  const PRODUCTS = window.PRODUCTS;
  // يقبل السعر بأي شكل: 99.9 أو 5800000 أو "5,800,000" أو "11.900.000" أو بالأرقام العربية "٩٩٫٩"
  const toNum = v => {
    let s = String(v).replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/٫/g, ".").replace(/[٬,،\s]/g, "");
    if (/^\d{1,3}(\.\d{3}){2,}$/.test(s)) s = s.replace(/\./g, "");   // 11.900.000 => 11900000 (نقطتان فأكثر = فواصل آلاف)
    const n = parseFloat(s); return isNaN(n) ? 0 : n;
  };
  PRODUCTS.forEach(p => { p.price = toNum(p.price); });

  const $ = id => document.getElementById(id);
  // يعرض السعر حتى منزلتين عشريتين: 99.9 يظهر 99.9 و 5800000 يظهر 5,800,000
  const fmt = n => (Math.round(n * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 }) + " " + CFG.currency;

  // ---------- رسم الأثاث ----------
  function shade(hex, amt) { // amt > 0 أغمق ، amt < 0 أفتح
    const n = parseInt(hex.slice(1), 16);
    let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 255 : 0, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  // رسومات الأثاث (SVG) بألوان الخشب
  function furnSvg(type, c, u) {
    const W = "#9b6b3f", WD = "#6b4226", WL = "#c9a27a", WLL = "#dcb88f";
    const dk = shade(c, .22), lt = shade(c, -.3);
    const sh = '<ellipse cx="120" cy="186" rx="98" ry="8" fill="#3b2412" opacity=".16"/>';
    const R = (x, y, w, h, r, f, extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${f}" ${extra || ""}/>`;
    const P = (d, f, extra) => `<path d="${d}" fill="${f}" ${extra || ""}/>`;
    let g = "";
    if (type === "sofa") {
      g = sh + P("M44 160h12l-2 24h-8z", WD) + P("M184 160h12l-2 24h-8z", WD) +
        R(28, 44, 184, 84, 28, dk) + R(44, 56, 74, 60, 18, c) + R(122, 56, 74, 60, 18, c) +
        R(44, 56, 74, 20, 14, lt, 'opacity=".4"') + R(122, 56, 74, 20, 14, lt, 'opacity=".4"') +
        R(26, 112, 188, 52, 18, c) + R(42, 108, 76, 40, 13, lt, 'opacity=".5"') + R(122, 108, 76, 40, 13, lt, 'opacity=".5"') +
        R(12, 82, 42, 84, 19, dk) + R(186, 82, 42, 84, 19, dk) + R(14, 82, 38, 22, 11, c, 'opacity=".55"') + R(188, 82, 38, 22, 11, c, 'opacity=".55"') +
        R(54, 60, 34, 36, 10, "#e3c9a0", 'transform="rotate(-12 71 78)"') + R(150, 66, 32, 34, 10, "#c9826a", 'transform="rotate(10 166 83)"');
    } else if (type === "armchair") {
      g = sh + P("M62 154l-8 30h11l7-30z", WD) + P("M178 154l8 30h-11l-7-30z", WD) +
        R(64, 26, 112, 108, 38, dk) + R(78, 40, 84, 84, 26, c) + R(78, 40, 84, 26, 18, lt, 'opacity=".4"') +
        R(38, 84, 44, 80, 20, dk) + R(158, 84, 44, 80, 20, dk) + R(40, 84, 40, 22, 11, c, 'opacity=".55"') + R(160, 84, 40, 22, 11, c, 'opacity=".55"') +
        R(58, 110, 124, 48, 18, c) + R(64, 108, 112, 18, 9, lt, 'opacity=".5"') + R(48, 150, 144, 16, 8, dk) +
        R(100, 56, 36, 36, 11, "#e3c9a0", 'transform="rotate(-8 118 74)"');
    } else if (type === "coffee") {
      g = sh + R(56, 100, 8, 56, 2, WD) + R(176, 100, 8, 56, 2, WD) + P("M42 102h14l-5 80h-9z", W) + P("M184 102h14l-1 80h-9z", W) +
        R(60, 146, 120, 9, 3, W) + R(32, 84, 176, 20, 9, WL) + R(32, 84, 176, 9, 9, WLL) + R(32, 98, 176, 6, 3, W, 'opacity=".6"') +
        R(48, 76, 52, 8, 2, WD) + R(54, 68, 42, 8, 2, "#c9826a") + R(58, 61, 34, 7, 2, "#d8b58a") +
        P("M150 84l4-24h22l4 24z", "#c9826a") + '<ellipse cx="165" cy="48" rx="8" ry="20" fill="#7a9e7e" transform="rotate(-24 165 62)"/><ellipse cx="165" cy="46" rx="8" ry="22" fill="#8fb39a" transform="rotate(18 165 62)"/><ellipse cx="165" cy="44" rx="6" ry="20" fill="#6e9374"/>';
    } else if (type === "bed") {
      g = sh + R(24, 164, 12, 20, 3, WD) + R(204, 164, 12, 20, 3, WD) +
        R(26, 22, 188, 104, 16, W) + R(40, 34, 160, 78, 9, "#b0804f") + R(40, 34, 160, 18, 9, WLL, 'opacity=".4"') +
        R(20, 118, 200, 48, 12, WD) + R(30, 98, 180, 40, 13, "#f3ece1") +
        R(40, 80, 76, 34, 13, "#fbf7ef", 'stroke="#e6dac8" stroke-width="2"') + R(124, 80, 76, 34, 13, "#fbf7ef", 'stroke="#e6dac8" stroke-width="2"') +
        R(30, 112, 180, 38, 13, c) + R(30, 108, 180, 14, 7, lt, 'opacity=".6"') + R(20, 148, 200, 22, 8, W);
    } else if (type === "wardrobe") {
      g = sh + R(66, 172, 10, 12, 2, WD) + R(164, 172, 10, 12, 2, WD) +
        R(50, 12, 140, 14, 5, WD) + R(58, 24, 124, 150, 6, W) +
        R(66, 34, 52, 132, 4, "#b0804f", 'stroke="#6b4226" stroke-opacity=".35"') + R(122, 34, 52, 132, 4, "#b0804f", 'stroke="#6b4226" stroke-opacity=".35"') +
        R(74, 44, 36, 52, 3, "none", 'stroke="#6b4226" stroke-opacity=".4" stroke-width="2"') + R(74, 104, 36, 54, 3, "none", 'stroke="#6b4226" stroke-opacity=".4" stroke-width="2"') +
        R(130, 44, 36, 52, 3, "none", 'stroke="#6b4226" stroke-opacity=".4" stroke-width="2"') + R(130, 104, 36, 54, 3, "none", 'stroke="#6b4226" stroke-opacity=".4" stroke-width="2"') +
        R(108, 92, 5, 26, 2.5, "#e6cfa8") + R(127, 92, 5, 26, 2.5, "#e6cfa8") + R(54, 166, 132, 8, 3, WD);
    } else if (type === "night") {
      g = sh + P("M72 166h9l-2 20h-7z", WD) + P("M159 166h9l-2 20h-7z", WD) +
        R(66, 92, 108, 76, 7, W) + R(58, 84, 124, 13, 6, WL) + R(58, 84, 124, 6, 6, WLL) +
        R(76, 104, 88, 26, 4, "#b0804f", 'stroke="#6b4226" stroke-opacity=".35"') + R(76, 134, 88, 26, 4, "#b0804f", 'stroke="#6b4226" stroke-opacity=".35"') +
        '<circle cx="120" cy="117" r="4.5" fill="#e6cfa8"/><circle cx="120" cy="147" r="4.5" fill="#e6cfa8"/>' +
        R(118, 56, 5, 30, 2, WD) + '<ellipse cx="120" cy="86" rx="16" ry="4" fill="#6b4226"/>' + P("M96 28h48l14 32H82z", c) + P("M96 28h48l3 7H93z", lt, 'opacity=".6"') +
        '<ellipse cx="120" cy="64" rx="38" ry="5" fill="#fbe9b8" opacity=".55"/>';
    } else if (type === "dining") {
      g = sh + R(62, 92, 8, 66, 2, WD) + R(170, 92, 8, 66, 2, WD) + P("M34 94h14l-3 86h-9z", W) + P("M192 94h14l-2 86h-9z", W) +
        R(40, 90, 160, 12, 3, W) + R(22, 74, 196, 18, 8, WL) + R(22, 74, 196, 8, 8, WLL) +
        R(106, 52, 28, 24, 9, c) + R(106, 52, 28, 8, 6, lt, 'opacity=".55"') +
        '<path d="M120 52v-22M120 50l-14-18M120 50l14-18" stroke="#6e9374" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="120" cy="26" r="7" fill="#d8826a"/><circle cx="105" cy="30" r="6" fill="#e6b86a"/><circle cx="135" cy="30" r="6" fill="#e6b86a"/>';
    } else if (type === "chair") {
      g = sh + R(80, 112, 9, 70, 2, WD) + R(151, 112, 9, 70, 2, WD) + P("M70 128h12l-4 56h-9z", W) + P("M158 128h12l3 56h-9z", W) +
        R(76, 14, 88, 14, 6, W) + R(86, 26, 10, 82, 3, W) + R(115, 26, 10, 82, 3, W) + R(144, 26, 10, 82, 3, W) + R(76, 20, 88, 6, 3, WLL, 'opacity=".5"') +
        R(66, 118, 108, 12, 5, WD) + R(64, 100, 112, 22, 9, c) + R(64, 100, 112, 8, 6, lt, 'opacity=".5"');
    } else if (type === "shelf") {
      const bk = ["#c9826a", "#7a9e7e", "#d8b58a", c, "#6b4226", "#e3c9a0"];
      let books = ""; const row = (y, h, xs) => { let x = 72; xs.forEach((w, i) => { books += R(x, y - h, w, h, 2, bk[(i + y) % 6]); x += w + 3; }); };
      row(60, 34, [12, 10, 14, 11, 12, 10, 14]); row(100, 30, [14, 12, 10, 13, 11]); 
      g = sh + R(52, 8, 136, 176, 6, W) + R(62, 18, 116, 156, 3, "#ead9c0") +
        R(60, 60, 120, 6, 2, WD) + R(60, 100, 120, 6, 2, WD) + R(60, 140, 120, 6, 2, WD) + books +
        P("M140 100l4-26h20l4 26z", "#c9826a") + '<ellipse cx="154" cy="62" rx="6" ry="16" fill="#7a9e7e" transform="rotate(-20 154 74)"/><ellipse cx="154" cy="60" rx="6" ry="17" fill="#8fb39a" transform="rotate(20 154 74)"/>' +
        R(78, 112, 30, 28, 4, "none", 'stroke="#6b4226" stroke-width="2.5"') + '<circle cx="93" cy="126" r="7" fill="#d8b58a"/>' +
        R(120, 118, 50, 22, 3, c) + R(124, 112, 42, 8, 2, "#e3c9a0");
    }
    return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 200'>${g}</svg>`;
  }
  const furnUri = (t, c) => `url("data:image/svg+xml;utf8,${encodeURIComponent(furnSvg(t, c, "x"))}")`;
  function setArt(el, p) {
    if (p.image) { el.classList.add("photo"); el.style.backgroundImage = `url("${p.image}")`; }
    else {
      el.classList.add("gen");
      el.style.backgroundImage = `${furnUri(p.type || "sofa", p.color)}, radial-gradient(circle at 50% 45%, ${p.color}70, ${p.color}18 72%)`;
    }
  }

  // ---------- البانر ----------
  function renderHero() {
    const hero = $("hero");
    const slides = window.HERO_SLIDES || [];
    hero.innerHTML = "";
    slides.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "slide" + (i === 0 ? " active" : "") + (s.image ? " photo" : "");
      d.style.color = "#fff";
      d.style.backgroundImage = s.image
        ? `url("${s.image}")`
        : `linear-gradient(135deg, ${(s.colors || ["#ec4899", "#8b5cf6"]).join(",")})`;
      d.innerHTML = `<div class="txt"><h1>${s.title || ""}</h1><p>${s.subtitle || ""}</p><button class="cta">تسوّق الآن</button></div>` +
        (s.image ? "" : (s.heroImage
          ? `<div class="art img" style="width:auto;max-width:none"><img src="${s.heroImage}" alt="" style="width:150px;height:150px;max-width:none;object-fit:cover;display:block;border-radius:22px;border:3px solid rgba(255,255,255,.92);transform:rotate(-4deg)"></div>`
          : `<div class="art" style="width:44%;max-width:190px">${furnSvg(s.heroType || "sofa", s.heroColor || "#9db4a4", "h" + i).replace("<svg ", "<svg style='transform:rotate(-3deg)' ")}</div>`));
      d.style.color = "#fff";
      d.querySelector(".txt").style.maxWidth = "54%";
      d.querySelector(".cta").onclick = () => $("menu").scrollIntoView({ behavior: "smooth" });
      hero.appendChild(d);
    });
    if (slides.length > 1) {
      const dots = document.createElement("div");
      dots.className = "dots";
      slides.forEach((_, i) => { const x = document.createElement("i"); if (!i) x.className = "on"; dots.appendChild(x); });
      hero.appendChild(dots);
      let cur = 0;
      setInterval(() => {
        const els = hero.querySelectorAll(".slide"), ds = dots.children;
        els[cur].classList.remove("active"); ds[cur].classList.remove("on");
        cur = (cur + 1) % els.length;
        els[cur].classList.add("active"); ds[cur].classList.add("on");
      }, window.HERO_INTERVAL || 4000);
    }
  }

  // ---------- السلة ----------
  let cart = [];
  try { cart = JSON.parse(localStorage.getItem("cart") || "[]"); } catch (e) { cart = []; }
  const save = () => { try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (e) {} };

  function toast(msg) {
    const t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1500);
  }
  function addToCart(id) {
    const found = cart.find(i => i.id === id);
    if (found) found.qty++; else cart.push({ id, qty: 1 });
    save(); renderCart();
    const b = $("cartBtn"); b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    toast("تمت الإضافة إلى السلة ✓");
  }
  function changeQty(id, d) {
    const it = cart.find(i => i.id === id); if (!it) return;
    it.qty += d;
    if (it.qty <= 0) cart = cart.filter(i => i.id !== id);
    save(); renderCart();
  }
  function renderCart() {
    const box = $("cartItems");
    let total = 0, count = 0;
    box.innerHTML = "";
    if (!cart.length) box.innerHTML = '<div class="cart-empty">🛒<br>السلة فارغة</div>';
    cart.forEach(it => {
      const p = PRODUCTS.find(x => x.id === it.id); if (!p) return;
      total += p.price * it.qty; count += it.qty;
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `<div class="thumb"></div>
        <div class="meta"><b>${p.name}</b><span>${fmt(p.price)}</span></div>
        <div class="qty"><button data-d="1">+</button><span>${it.qty}</span><button data-d="-1">−</button></div>`;
      setArt(row.querySelector(".thumb"), p);
      row.querySelectorAll("button").forEach(b => b.onclick = () => changeQty(p.id, +b.dataset.d));
      box.appendChild(row);
    });
    $("cartTotal").textContent = fmt(total);
    $("cartCount").textContent = count; $("cartCount").dataset.n = count;
    $("waBtn").disabled = !cart.length;
  }
  const openCart = () => { $("drawer").classList.add("show"); $("overlay").classList.add("show"); };
  const closeCart = () => { $("drawer").classList.remove("show"); $("overlay").classList.remove("show"); };

  // ---------- الشراء عبر واتس اب ----------
  function checkout() {
    if (!cart.length) return;
    let total = 0;
    const lines = cart.map(it => {
      const p = PRODUCTS.find(x => x.id === it.id);
      total += p.price * it.qty;
      return `• ${p.name} × ${it.qty} = ${fmt(p.price * it.qty)}`;
    });
    const msg = "مرحباً، أريد طلب:\n" + lines.join("\n") + "\nالمجموع: " + fmt(total);
    if (window.FirebaseAdapter) {
      window.FirebaseAdapter.saveOrder({
        items: cart.map(it => { const p = PRODUCTS.find(x => x.id === it.id); return { id: p.id, name: p.name, price: p.price, qty: it.qty }; }),
        total
      });
    }
    const url = "https://wa.me/" + CFG.whatsapp + "?text=" + encodeURIComponent(msg);
    // يفتح واتس اب في نافذة/تبويب جديد (يعمل أيضاً داخل المعاينة)، وإن مُنع يفتح في نفس الصفحة
    const w = window.open(url, "_blank");
    if (!w) window.location.href = url;
  }

  // ---------- المنتجات والتصنيفات ----------
  let activeCat = "الكل";
  function renderChips() {
    const cats = ["الكل"].concat([...new Set(PRODUCTS.map(p => p.category).filter(Boolean))]);
    const box = $("chips"); box.innerHTML = "";
    if (cats.length < 3) { box.style.display = "none"; return; }
    cats.forEach(c => {
      const b = document.createElement("button");
      b.className = "chip" + (c === activeCat ? " on" : ""); b.textContent = c;
      b.onclick = () => { activeCat = c; renderChips(); renderProducts(); };
      box.appendChild(b);
    });
  }
  function renderProducts() {
    const grid = $("products");
    const q = $("search").value.trim();
    const list = PRODUCTS.filter(p => (activeCat === "الكل" || p.category === activeCat) && p.name.includes(q));
    grid.innerHTML = "";
    if (!list.length) { grid.innerHTML = '<div class="empty">لا توجد نتائج</div>'; return; }
    list.forEach(p => {
      const c = document.createElement("div");
      c.className = "card";
      c.innerHTML = `<div class="img"></div>
        <div class="info"><div class="name">${p.name}</div><div class="price">${fmt(p.price)}</div><button class="buy">شراء</button></div>`;
      setArt(c.querySelector(".img"), p);
      c.querySelector(".buy").onclick = () => addToCart(p.id);
      grid.appendChild(c);
    });
  }

  // ---------- تشغيل ----------
  $("logoText").textContent = CFG.storeName;
  // صورة الشعار العرضية (Mini touch): تحل مكان الأيقونة والاسم
  if (CFG.logoImage) $("logo").innerHTML = `<img class="logo-img" src="${CFG.logoImage}" alt="${CFG.storeName}">`;
  document.title = CFG.storeName;
  $("cartBtn").onclick = openCart;
  $("closeCart").onclick = closeCart;
  $("overlay").onclick = closeCart;
  $("waBtn").onclick = checkout;
  $("clearBtn").onclick = () => { cart = []; save(); renderCart(); };
  $("search").oninput = renderProducts;

  // ---------- رمز QR ----------
  // رمز QR: صورة جاهزة (qrImage) أو يُولَّد من الرابط (qrUrl)، وإذا تُركا فارغين يُولَّد من عنوان الموقع نفسه تلقائياً
  function qrSrc() {
    if (CFG.qrImage) return CFG.qrImage;
    const text = CFG.qrUrl || (/^https?:/.test(location.protocol) ? location.href.split(/[?#]/)[0] : "");
    if (!text) return "";
    try {
      const q = window.makeQR(text), z = 4, s = q.size + 2 * z; let path = "";
      q.modules.forEach((row, y) => row.forEach((v, x) => { if (v) path += `M${x + z},${y + z}h1v1h-1z`; }));
      return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${s} ${s}' shape-rendering='crispEdges'><rect width='${s}' height='${s}' fill='#fff'/><path d='${path}' fill='#000'/></svg>`);
    } catch (e) { return ""; }
  }
  $("qrImg").src = qrSrc();
  $("qrSupportLabel").textContent = CFG.supportLabel || "";
  $("qrPhone").textContent = CFG.supportPhone || "";
  const openQr = () => { $("qrModal").classList.add("show"); $("qrOverlay").classList.add("show"); };
  const closeQr = () => { $("qrModal").classList.remove("show"); $("qrOverlay").classList.remove("show"); };
  $("qrBtn").onclick = openQr; $("qrClose").onclick = closeQr; $("qrOverlay").onclick = closeQr;

  renderHero(); renderChips(); renderProducts(); renderCart();
})();

// تحقق: هل index.html من نفس الإصدار؟ (إذا كان قديماً يظهر شريط برتقالي باسم الملف)
window.addEventListener("load", function () {
  if (window.__v && window.__v.index === "R6") return;
  var w = document.createElement("div");
  w.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:98;background:#c2410c;color:#fff;padding:12px 14px;font:14px/1.6 sans-serif;direction:rtl;text-align:center";
  w.textContent = "ملف index.html قديم أو لم يُرفع. ارفع نسخته الجديدة من الحزمة (اضغط هنا للإغلاق)";
  w.onclick = function () { w.remove(); }; document.body.appendChild(w);
});
