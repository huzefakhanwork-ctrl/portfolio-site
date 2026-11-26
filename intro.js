/* Huzefa Khan · pill intro.
   1. "Sharing my story" video plays full screen (intro.mp4).
   2. It ends on black; the black breaks into pixels that fly together into an original
      silhouette holding a red and a blue pill (same blocky pixel language as the video's ending).
   3. Red pill -> the 3D city (APP.startWorld). Blue pill -> the simple version (APP.takeBlue).
   Plain ES5 on purpose (old iPhones). If anything here fails, the site starts normally. */
(function () {
  "use strict";
  var html = document.documentElement;
  // Shared links to a city (#origin, #reel-city ...) skip the intro and go straight in.
  var hash = location.hash.replace("#", "");
  if (hash && hash !== "intro") { window.PILL = { active: false }; return; }

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = false; try { seen = localStorage.getItem("hk-pill-seen") === "1"; } catch (e) {}
  if (hash === "intro") seen = false;

  var INK = "#0d0d0d", PAPER_IN = "#e7e4de", PAPER_OUT = "#c9c5bd";
  var RED = "#e3342b", BLUE = "#2f7fe6";

  /* ---------------------------------------------------------------- DOM */
  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap";
  document.head.appendChild(font);

  var css = document.createElement("style");
  css.textContent = [
    "html.pill-on,html.pill-on body{overflow:hidden}",
    "#pill{position:fixed;inset:0;z-index:10000;background:#000;color:#1b1917;font-family:Figtree,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}",
    "#pill.scene{background:radial-gradient(120% 90% at 50% 40%," + PAPER_IN + " 0%," + PAPER_OUT + " 100%)}",
    "#pill.gone{display:none}",
    "#pill video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}",
    // Landscape screens: fill the whole screen (trims a little top/bottom or sides).
    // Portrait phones keep the full frame so the captions are never cut off.
    "@media (min-aspect-ratio:4/3){#pill video{object-fit:cover}}",
    "#pill canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
    "#pill .p-ui{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s ease}",
    "#pill .p-ui.on{opacity:1}",
    "#pill .p-ui.on .p-choice,#pill .p-ui.on .p-dot,#pill .p-ui.on .p-again{pointer-events:auto}",
    "#pill .p-head{position:absolute;left:0;right:0;top:max(28px,6vh);text-align:center;padding:0 16px}",
    "#pill .p-kick{font:500 11px/1.4 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#4a4540}",
    "#pill .p-title{font:italic 400 clamp(40px,7vw,84px)/1 'Instrument Serif',Georgia,serif;color:#d2602f;margin:6px 0 4px;letter-spacing:-.01em}",
    "#pill .p-sub{font-size:15px;color:#4a4540;margin:0}",
    "#pill .p-dot{position:absolute;width:76px;height:76px;margin:-38px 0 0 -38px;border:0;border-radius:50%;background:transparent;cursor:pointer;padding:0}",
    "#pill .p-dot::before{content:'';position:absolute;inset:14px;border-radius:50%;box-shadow:0 0 0 2px var(--c);opacity:.0;animation:pPulse 2.2s ease-out infinite}",
    "#pill .p-dot::after{content:'';position:absolute;inset:22px;border-radius:50%;background:var(--c);filter:blur(16px);opacity:.45;animation:pGlow 2.2s ease-in-out infinite}",
    "#pill .p-dot:hover::after,#pill .p-dot:focus-visible::after{opacity:.8}",
    "#pill .p-dot:focus-visible{outline:2px solid var(--c);outline-offset:2px}",
    "@keyframes pPulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.6);opacity:0}}",
    "@keyframes pGlow{50%{opacity:.75}}",
    "#pill .p-choice{position:absolute;display:flex;flex-direction:column;gap:2px;border:0;background:rgba(251,247,240,.92);border-radius:16px;padding:12px 16px;cursor:pointer;text-align:left;box-shadow:0 2px 0 rgba(160,150,135,.6),0 10px 30px rgba(0,0,0,.12);transition:transform .2s ease;max-width:240px;font:inherit;color:inherit}",
    "#pill .p-choice:hover,#pill .p-choice:focus-visible{transform:translateY(-2px)}",
    "#pill .p-choice b{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800}",
    "#pill .p-choice b i{width:22px;height:11px;border-radius:6px;background:var(--c);box-shadow:inset 0 2px 0 rgba(255,255,255,.45)}",
    "#pill .p-choice span{font-size:14px;color:#5f564c}",
    "#pill .p-choice.r{text-align:right}#pill .p-choice.r b{justify-content:flex-end}",
    "#pill.narrow .p-choice{position:absolute;bottom:max(18px,env(safe-area-inset-bottom,0px));width:calc(50% - 22px);max-width:none;top:auto!important;left:auto;right:auto}",
    "#pill.narrow .p-choice.l{left:16px}#pill.narrow .p-choice.r{right:16px}",
    "#pill .p-again{position:absolute;right:max(8px,env(safe-area-inset-right,0px));top:max(10px,env(safe-area-inset-top,0px));border:0;background:none;font:500 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#4a4540;cursor:pointer;padding:8px}",
    "#pill .p-btn{position:absolute;border:0;border-radius:999px;padding:10px 16px;font:600 14px Figtree,system-ui,sans-serif;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}",
    "#pill .p-btn:hover{background:rgba(255,255,255,.24)}",
    "#pill .p-skip{right:max(16px,env(safe-area-inset-right,0px));top:max(16px,env(safe-area-inset-top,0px))}",
    "#pill .p-snd{left:50%;bottom:max(22px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#fbf7f0;color:#1b1917;font-size:15px;padding:12px 20px}",
    "#pill .p-play{left:50%;top:50%;transform:translate(-50%,-50%);background:#fbf7f0;color:#1b1917;font-size:17px;padding:16px 26px}",
    "#pill [hidden]{display:none!important}",
    "@media (prefers-reduced-motion:reduce){#pill .p-dot::before,#pill .p-dot::after{animation:none}}"
  ].join("\n");
  document.head.appendChild(css);

  var root = document.createElement("div");
  root.id = "pill";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-label", "Intro: choose how to see Huzefa's portfolio");
  root.innerHTML =
    '<video id="pVid" playsinline webkit-playsinline preload="auto" poster="img/intro-poster.jpg"><source src="intro.mp4" type="video/mp4"></video>' +
    '<canvas id="pCv" aria-hidden="true"></canvas>' +
    '<div class="p-ui" id="pUi">' +
      '<div class="p-head"><div class="p-kick">Huzefa Khan · Creative strategist</div><h1 class="p-title">Choose your version.</h1><p class="p-sub">Take a pill.</p></div>' +
      '<button class="p-dot" id="pDotR" type="button" style="--c:' + RED + '" aria-label="Red pill: walk through my 3D world"></button>' +
      '<button class="p-dot" id="pDotB" type="button" style="--c:' + BLUE + '" aria-label="Blue pill: the quick, simple version"></button>' +
      '<button class="p-choice l" id="pChR" type="button" style="--c:' + RED + '"><b><i></i>Red pill</b><span>Walk through my 3D world</span></button>' +
      '<button class="p-choice r" id="pChB" type="button" style="--c:' + BLUE + '"><b>Blue pill<i></i></b><span>The quick, simple version</span></button>' +
      '<button class="p-again" id="pAgain" type="button">↺ Watch the video</button>' +
    '</div>' +
    '<button class="p-btn p-skip" id="pSkip" type="button">Skip intro →</button>' +
    '<button class="p-btn p-snd" id="pSnd" type="button" hidden>🔊 Tap for sound</button>' +
    '<button class="p-btn p-play" id="pPlay" type="button" hidden>▶ Play my story</button>';
  document.body.appendChild(root);
  html.classList.add("pill-on");

  function $(id) { return document.getElementById(id); }
  var vid = $("pVid"), cv = $("pCv"), ctx = cv.getContext("2d"), ui = $("pUi");
  var skipBtn = $("pSkip"), sndBtn = $("pSnd"), playBtn = $("pPlay");

  window.PILL = { active: true };

  /* ------------------------------------------------------------ canvas */
  var W = 0, H = 0, dpr = 1;
  function size() {
    W = innerWidth; H = innerHeight; dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  var raf = window.requestAnimationFrame || function (f) { return setTimeout(function () { f(Date.now()); }, 16); };
  function now() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function ease(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function step24(t) { return Math.floor(t * 24) / 24; } // the video runs at 24 fps: keep the steps

  /* ------------------------------------------------------ the figure */
  // img/pills-figure.png: the pill image with its checkerboard background removed (725 x 622).
  // The pixels fly together into it, then it sharpens into the full image.
  var IW = 725, IH = 622, PILL_R = [135, 528], PILL_B = [591, 530];
  var fig = new Image(), figReady = false, figWait = [];
  fig.onload = function () { figReady = true; figWait.splice(0).forEach(function (f) { f(); }); };
  fig.onerror = function () { figReady = true; fig = null; figWait.splice(0).forEach(function (f) { f(); }); };
  fig.src = "img/pills-figure.png";
  function whenFig(f) { if (figReady) f(); else figWait.push(f); }

  /* ------------------------------------------------------------ layout */
  var L = null; // { s, fx, fy, B, cells:[{x,y,col}], narrow }
  function layout() {
    // Wide: figure rises from the bottom edge, labels sit beside the hands.
    // Narrow (phones, or not enough room beside the hands): labels become a bottom row.
    var s = Math.min(0.92 * W / IW, (H - 190) / IH), fx = (W - IW * s) / 2, fy = H - IH * s;
    var narrow = W < 720 || fx < 250;
    if (narrow) {
      var top = 165, bot = 120;
      s = Math.min(0.98 * W / IW, (H - top - bot) / IH);
      fx = (W - IW * s) / 2; fy = top + (H - top - bot - IH * s) / 2;
    }
    fx = Math.round(fx); fy = Math.round(fy);
    var B = Math.max(3, Math.round(IH * s / 105));
    var cols = Math.ceil(IW * s / B), rows = Math.ceil(IH * s / B), cells = [];
    if (fig) {
      var oc = document.createElement("canvas"); oc.width = cols; oc.height = rows;
      var o = oc.getContext("2d"); o.drawImage(fig, 0, 0, IW * s / B, IH * s / B); // 1 offscreen px = 1 B x B cell
      var d = o.getImageData(0, 0, cols, rows).data;
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var k = (r * cols + c) * 4; if (d[k + 3] < 110) continue;
        var R = d[k], G = d[k + 1], Bl = d[k + 2], sat = Math.max(R, G, Bl) - Math.min(R, G, Bl), col;
        if (sat > 45) col = "rgb(" + R + "," + G + "," + Bl + ")"; // the pills keep their colour
        else { var lv = Math.round((R + G + Bl) / 3 / 255 * 15) * 17; col = "rgb(" + lv + "," + lv + "," + lv + ")"; } // 16 greys, so frames draw fast
        cells.push({ x: fx + c * B, y: fy + r * B, col: col });
      }
    }
    L = { s: s, fx: fx, fy: fy, B: B, cells: cells, narrow: narrow };
    root.classList.toggle("narrow", narrow);
    placeUI();
  }
  function pt(p) { return [L.fx + p[0] * L.s, L.fy + p[1] * L.s]; }
  function placeUI() {
    var r = pt(PILL_R), b = pt(PILL_B);
    var dr = $("pDotR"), db = $("pDotB"), cr = $("pChR"), cb = $("pChB");
    dr.style.left = r[0] + "px"; dr.style.top = r[1] + "px";
    db.style.left = b[0] + "px"; db.style.top = b[1] + "px";
    if (!L.narrow) {
      cr.style.top = cb.style.top = (r[1] - 34) + "px";
      cr.style.right = (W - L.fx + 12) + "px"; cr.style.left = "auto";
      cb.style.left = (L.fx + IW * L.s + 12) + "px"; cb.style.right = "auto";
    } else { cr.style.top = cb.style.top = ""; cr.style.left = cr.style.right = ""; cb.style.left = cb.style.right = ""; }
  }

  /* --------------------------------------------------- drawing helpers */
  function drawCells(list, B) { // group by colour: one fill per colour
    var groups = {}, k, c;
    for (k = 0; k < list.length; k++) { c = list[k]; (groups[c[2]] || (groups[c[2]] = [])).push(c); }
    for (var col in groups) { ctx.fillStyle = col; ctx.beginPath(); var g = groups[col]; for (k = 0; k < g.length; k++) ctx.rect(g[k][0], g[k][1], B + .5, B + .5); ctx.fill(); }
  }
  function drawStill(a) { // a = how sharp (0 = pixels, 1 = the full image)
    ctx.clearRect(0, 0, W, H);
    if (a === undefined) a = 1;
    if (a < 1 || !fig) drawCells(L.cells.map(function (c) { return [c.x, c.y, c.col]; }), L.B);
    if (fig && a > 0) { ctx.globalAlpha = a; ctx.drawImage(fig, L.fx, L.fy, IW * L.s, IH * L.s); ctx.globalAlpha = 1; }
  }
  var idleOn = false;
  function idle() {}

  // Black screen -> pixels fly together into the figure.
  function form(done) { whenFig(function () { formNow(done); }); }
  function formNow(done) {
    root.classList.add("scene"); vid.style.visibility = "hidden";
    layout();
    var B = L.B, cols = Math.ceil(W / B) + 1, rows = Math.ceil(H / B) + 1;
    var ox = ((L.fx % B) + B) % B - B, oy = ((L.fy % B) + B) % B - B;
    var n = cols * rows, idx = new Array(n), i;
    for (i = 0; i < n; i++) idx[i] = i;
    var T = L.cells, nt = T.length;
    for (i = 0; i < nt && i < n; i++) { var j = i + Math.floor(Math.random() * (n - i)), t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    var cx = W / 2, cy = H / 2, maxD = Math.sqrt(cx * cx + cy * cy), C = Math.max(B, Math.round(W / 90));
    var movers = [], rest = [];
    for (i = 0; i < n; i++) {
      var col = idx[i] % cols, row = (idx[i] / cols) | 0, x = ox + col * B, y = oy + row * B;
      var qx = Math.floor(x / C) * C + C / 2, qy = Math.floor(y / C) * C + C / 2;
      var d = Math.sqrt((qx - cx) * (qx - cx) + (qy - cy) * (qy - cy)) / maxD;
      if (i < nt) {
        var tg = T[i], a = (Math.random() - .5) * 2;
        movers.push({ x0: x, y0: y, x1: tg.x, y1: tg.y, col: tg.col, st: .15 + d * .45 + Math.random() * .35, du: .85 + Math.random() * .5, arc: a * Math.min(160, W * .12) });
      } else rest.push({ x: x, y: y, v: .2 + d * .8 + Math.random() * .18 });
    }
    // every remaining screen pixel: put the right size ahead so the hole looks chunky like the video
    var t0 = now(), END = 0;
    movers.forEach(function (m) { END = Math.max(END, m.st + m.du); });
    if (reduce) { drawStill(); done(); return; }
    function frame() {
      var t = (now() - t0) / 1000, ts = step24(t);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = INK; ctx.beginPath();
      for (var k = 0; k < rest.length; k++) { var r = rest[k]; if (ts < r.v) ctx.rect(r.x, r.y, B + .5, B + .5); }
      var colored = [];
      for (k = 0; k < movers.length; k++) {
        var m = movers[k], p = Math.max(0, Math.min(1, (t - m.st) / m.du)), e = ease(p);
        var nx = m.x1 - m.x0, ny = m.y1 - m.y0, len = Math.sqrt(nx * nx + ny * ny) || 1;
        var off = Math.sin(Math.PI * e) * m.arc;
        var x = m.x0 + nx * e - ny / len * off, y = m.y0 + ny * e + nx / len * off;
        if (p >= 1) { x = m.x1; y = m.y1; }
        if (p > .55) colored.push([x, y, m.col]); else ctx.rect(x, y, B + .5, B + .5);
      }
      ctx.fill();
      drawCells(colored, B);
      if (t < END + .05) raf(frame); else sharpen();
    }
    function sharpen() { // pixels -> the full image, in 24 fps steps like the video
      var s0 = now();
      (function f() {
        var a = Math.min(1, step24((now() - s0) / 1000) / .7);
        drawStill(a);
        if (a < 1) raf(f); else done();
      })();
    }
    raf(frame);
  }

  // Pixel circle closes in from a point (same move as the end of the video), then cb(), then
  // the black dissolves away pixel by pixel.
  function closeIn(px, py, mid, after) {
    var C = Math.max(10, Math.round(W / 90)), cols = Math.ceil(W / C), rows = Math.ceil(H / C), cells = [], maxD = 0, i;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var x = c * C, y = r * C, d = Math.sqrt(Math.pow(x + C / 2 - px, 2) + Math.pow(y + C / 2 - py, 2));
      cells.push({ x: x, y: y, d: d, o: Math.random() }); if (d > maxD) maxD = d;
    }
    cells.forEach(function (c) { c.v = (c.d / maxD) * .75 + c.o * .12; });
    var t0 = now(), DUR = reduce ? 0 : .9, phase = 0;
    function frame() {
      var t = step24((now() - t0) / 1000);
      if (phase === 0) {
        ctx.fillStyle = "#000"; ctx.beginPath();
        for (i = 0; i < cells.length; i++) if (t >= cells[i].v * (DUR / .87)) ctx.rect(cells[i].x, cells[i].y, C + .5, C + .5);
        ctx.fill();
        if (t >= DUR) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); phase = 1; mid(); t0 = now(); }
        raf(frame); return;
      }
      // dissolve
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#000"; ctx.beginPath();
      var left = 0;
      for (i = 0; i < cells.length; i++) if (t < cells[i].o * .7 + .05) { ctx.rect(cells[i].x, cells[i].y, C + .5, C + .5); left++; }
      ctx.fill();
      if (left && !reduce) raf(frame); else { ctx.clearRect(0, 0, W, H); after && after(); }
    }
    raf(frame);
  }

  /* ---------------------------------------------------------- the flow */
  var stage = "video";
  function toScene() {
    if (stage !== "video") return; stage = "forming";
    try { localStorage.setItem("hk-pill-seen", "1"); } catch (e) {}
    try { vid.pause(); } catch (e) {}
    skipBtn.hidden = sndBtn.hidden = playBtn.hidden = true;
    form(function () {
      stage = "choose"; ui.classList.add("on"); idleOn = true; idle();
      if (innerWidth !== W || innerHeight !== H) { size(); layout(); drawStill(); } // resized while forming
      setTimeout(function () { try { $("pDotR").focus({ preventScroll: true }); } catch (e) {} }, 50);
    });
  }
  function skip() { // close in from the centre like the video's ending, then form
    if (stage !== "video") return;
    skipBtn.hidden = sndBtn.hidden = playBtn.hidden = true;
    try { vid.pause(); } catch (e) {}
    var C = Math.max(10, Math.round(W / 90)), cols = Math.ceil(W / C), rows = Math.ceil(H / C), cx = W / 2, cy = H / 2, maxD = Math.sqrt(cx * cx + cy * cy), t0 = now();
    if (reduce) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H); toScene(); return; }
    (function f() {
      var t = step24((now() - t0) / 1000), done = t >= .6;
      ctx.fillStyle = "#000"; ctx.beginPath();
      for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
        var d = Math.sqrt(Math.pow(c * C + C / 2 - cx, 2) + Math.pow(r * C + C / 2 - cy, 2)) / maxD;
        if (done || t >= d * .55 + ((c * 7 + r * 13) % 5) * .01) ctx.rect(c * C, r * C, C + .5, C + .5);
      }
      ctx.fill();
      if (done) { ctx.fillRect(0, 0, W, H); setTimeout(toScene, 120); } else raf(f);
    })();
  }
  function choose(which, from) {
    if (stage !== "choose") return; stage = "leaving"; idleOn = false;
    var p = pt(which === "red" ? PILL_R : PILL_B);
    var fx = from && from.clientX ? from.clientX : p[0], fy = from && from.clientY ? from.clientY : p[1];
    ui.classList.remove("on");
    closeIn(fx, fy, function () {
      root.classList.remove("scene"); root.style.background = "transparent";
      try { vid.removeAttribute("src"); vid.innerHTML = ""; vid.load(); } catch (e) {}
      vid.style.display = "none";
      html.classList.remove("pill-on"); window.PILL.active = false;
      var A = window.APP;
      if (A) { if (which === "red") A.startWorld(); else A.takeBlue(); }
    }, function () { root.classList.add("gone"); root.parentNode && root.parentNode.removeChild(root); });
  }
  window.PILL.choose = choose;

  $("pDotR").onclick = function (e) { choose("red", e); };
  $("pChR").onclick = function (e) { choose("red", e); };
  $("pDotB").onclick = function (e) { choose("blue", e); };
  $("pChB").onclick = function (e) { choose("blue", e); };
  $("pAgain").onclick = function () {
    if (stage !== "choose") return; idleOn = false; ui.classList.remove("on");
    ctx.clearRect(0, 0, W, H); root.classList.remove("scene"); vid.style.visibility = "";
    stage = "video"; skipBtn.hidden = false; vid.currentTime = 0; vid.muted = false; startVideo();
  };
  skipBtn.onclick = skip;
  vid.addEventListener("ended", toScene);
  vid.addEventListener("error", function () { if (stage === "video") skip(); });
  addEventListener("keydown", function (e) {
    if (!window.PILL.active) return;
    if (e.key === "Escape" && stage === "video") { e.stopPropagation(); skip(); }
  }, true);
  addEventListener("resize", function () {
    size();
    if (stage === "choose") { layout(); drawStill(); }
  });

  // Warm the cache for the 3D city while the video plays, so the red pill opens fast.
  var warmed = false;
  function warm() {
    if (warmed) return; warmed = true;
    try { if (window.fetch) { fetch("world.bundle.js"); setTimeout(function () { fetch("models.json"); }, 1500); } } catch (e) {}
  }
  vid.addEventListener("timeupdate", function () { if (vid.currentTime > 4) warm(); });

  function startVideo() {
    // Try with sound first; browsers usually only allow muted autoplay, so fall back to that
    // and offer a big "Tap for sound" button.
    var p;
    try { vid.muted = false; p = vid.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(function () { sndBtn.hidden = true; }, function () {
        vid.muted = true;
        var q = vid.play();
        if (q && q.then) q.then(function () { sndBtn.hidden = false; }, function () { playBtn.hidden = false; });
      });
    }
  }
  sndBtn.onclick = function () { vid.muted = false; sndBtn.hidden = true; if (vid.currentTime > 8 && vid.currentTime < 30) {} vid.play(); };
  playBtn.onclick = function () { playBtn.hidden = true; vid.muted = false; vid.play().catch(function () {}); };

  if (seen || reduce) {
    // Been here before: straight to the pills (the video is one tap away).
    vid.preload = "none"; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    setTimeout(function () { stage = "video"; toScene(); warm(); }, 250);
  } else {
    startVideo();
  }
})();
