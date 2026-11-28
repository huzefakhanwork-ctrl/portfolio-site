/* Huzefa Khan · pill intro.
   1. "Sharing my story" video plays full screen (intro.mp4).
   2. It ends on black; the black opens up pixel by pixel (same stepped pixel move as the end of
      the video) onto the pill clip (pills-clip.mp4), which plays once with sound and stops on its last frame.
   3. Blue pill -> the 3D world, the right brain (APP.startWorld). Red pill -> left/, the left brain (case studies).
   Plain ES5 on purpose (old iPhones). If anything here fails, the site starts normally. */
(function () {
  "use strict";
  var html = document.documentElement;
  // Every full load (including a reload) starts with the intro video. Two in-site shortcuts:
  //   ?pills=1   -> straight to the pill choice ("Back to the pills" buttons)
  //   ?pill=blue -> straight into the 3D world ("Take the blue pill" on the left-brain page)
  // They are removed from the address bar at once, so a reload plays the intro again.
  var q = location.search, toPills = /[?&]pills=1(&|$)/.test(q), toBlue = /[?&]pill=blue(&|$)/.test(q);
  if (q) { try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} }
  if (toBlue) { window.PILL = { active: false }; return; }

  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var seen = toPills;

  var RED = "#e3342b", BLUE = "#2f7fe6", SCENE_BG = "#141414";
  // Where the pills sit in the clip (fraction of frame width/height; they barely move).
  var PILL_R = [0.30, 0.81], PILL_B = [0.713, 0.81], CLIP = 16 / 9;

  /* ---------------------------------------------------------------- DOM */
  var font = document.createElement("link");
  font.rel = "stylesheet";
  font.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap";
  document.head.appendChild(font);

  var css = document.createElement("style");
  css.textContent = [
    "html.pill-on,html.pill-on body{overflow:hidden}",
    "#pill{position:fixed;inset:0;z-index:10000;background:#000;color:#f3eee6;font-family:Figtree,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}",
    "#pill.scene{background:" + SCENE_BG + "}",
    "#pill.gone{display:none}",
    "#pVid{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;background:#000}",
    // Landscape screens: the story video fills the screen. Portrait phones keep the full frame.
    "@media (min-aspect-ratio:4/3){#pVid{object-fit:cover}}",
    "#pill{overflow:hidden}",
    "#pClip{position:absolute;object-fit:cover;visibility:hidden;background:" + SCENE_BG + "}",
    "#pClip.fade{-webkit-mask-image:linear-gradient(to right,transparent,#000 9%,#000 91%,transparent);mask-image:linear-gradient(to right,transparent,#000 9%,#000 91%,transparent)}",
    "#pill canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}",
    "#pill .p-ui{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .6s ease}",
    "#pill .p-ui.on{opacity:1}",
    "#pill .p-ui.on .p-choice,#pill .p-ui.on .p-dot,#pill .p-ui.on .p-again{pointer-events:auto}",
    "#pill .p-head{position:absolute;text-align:left}",
    "#pill.narrow .p-head{left:0;right:0;text-align:center;padding:0 16px}",
    "#pill .p-kick{font:500 11px/1.4 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.18em;text-transform:uppercase;color:#b9b2a7}",
    "#pill .p-title{font:italic 400 clamp(38px,5.4vw,80px)/1 'Instrument Serif',Georgia,serif;color:#e8763f;margin:6px 0 6px;letter-spacing:-.01em}",
    "#pill .p-sub{font-size:15px;color:#d9d2c7;margin:0}",
    "#pill .p-dot{position:absolute;border:0;border-radius:50%;background:transparent;cursor:pointer;padding:0;transform:translate(-50%,-50%)}",
    "#pill .p-dot::before{content:'';position:absolute;inset:18%;border-radius:50%;box-shadow:0 0 0 2px var(--c);opacity:0;animation:pPulse 2.2s ease-out infinite}",
    "#pill .p-dot::after{content:'';position:absolute;inset:28%;border-radius:50%;background:var(--c);filter:blur(18px);opacity:.4;animation:pGlow 2.2s ease-in-out infinite}",
    "#pill .p-dot:hover::after,#pill .p-dot:focus-visible::after{opacity:.85}",
    "#pill .p-dot:focus-visible{outline:2px solid var(--c);outline-offset:2px}",
    "@keyframes pPulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.5);opacity:0}}",
    "@keyframes pGlow{50%{opacity:.7}}",
    "#pill .p-choice{position:absolute;display:flex;flex-direction:column;gap:2px;border:0;background:rgba(251,247,240,.94);border-radius:16px;padding:12px 16px;cursor:pointer;text-align:left;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:transform .2s ease;width:230px;font:inherit;color:#1b1917;transform:translateX(-50%)}",
    "#pill .p-choice:hover,#pill .p-choice:focus-visible{transform:translateX(-50%) translateY(-2px)}",
    "#pill .p-choice b{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:800}",
    "#pill .p-choice b i{width:22px;height:11px;border-radius:6px;background:var(--c);box-shadow:inset 0 2px 0 rgba(255,255,255,.45)}",
    "#pill .p-choice span{font-size:14px;color:#5f564c}",
    "#pill.narrow .p-choice{bottom:max(18px,env(safe-area-inset-bottom,0px));width:calc(50% - 22px);top:auto!important;transform:none}",
    "#pill.narrow .p-choice:hover{transform:translateY(-2px)}",
    "#pill.narrow .p-choice.l{left:16px!important}#pill.narrow .p-choice.r{left:auto!important;right:16px}",
    "#pill .p-again{position:absolute;right:max(8px,env(safe-area-inset-right,0px));top:max(10px,env(safe-area-inset-top,0px));border:0;background:none;font:500 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;color:#b9b2a7;cursor:pointer;padding:8px}",
    "#pill .p-btn{position:absolute;border:0;border-radius:999px;padding:10px 16px;font:600 14px Figtree,system-ui,sans-serif;cursor:pointer;background:rgba(255,255,255,.14);color:#fff;-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}",
    "#pill .p-btn:hover{background:rgba(255,255,255,.24)}",
    "#pill .p-skip{right:max(16px,env(safe-area-inset-right,0px));top:max(16px,env(safe-area-inset-top,0px))}",
    "#pill .p-snd{left:50%;bottom:max(22px,env(safe-area-inset-bottom,0px));transform:translateX(-50%);background:#fbf7f0;color:#1b1917;font-size:15px;padding:12px 20px}",
    "#pill.scene .p-snd{top:max(14px,env(safe-area-inset-top,0px));bottom:auto;z-index:2}",
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
    '<video id="pClip" playsinline webkit-playsinline preload="auto" poster="img/pills-frame.jpg"><source src="pills-clip.mp4" type="video/mp4"></video>' +
    '<canvas id="pCv" aria-hidden="true"></canvas>' +
    '<div class="p-ui" id="pUi">' +
      '<div class="p-head" id="pHead"><div class="p-kick">Huzefa Khan · Creative strategist</div><h1 class="p-title">Choose your version.</h1><p class="p-sub">Take a pill.</p></div>' +
      '<button class="p-dot" id="pDotR" type="button" style="--c:' + RED + '" aria-label="Red pill: the left brain, my work as case studies and data"></button>' +
      '<button class="p-dot" id="pDotB" type="button" style="--c:' + BLUE + '" aria-label="Blue pill: walk through my 3D world"></button>' +
      '<button class="p-choice l" id="pChR" type="button" style="--c:' + RED + '"><b><i></i>Red pill</b><span>Left brain: case studies &amp; data</span></button>' +
      '<button class="p-choice r" id="pChB" type="button" style="--c:' + BLUE + '"><b><i></i>Blue pill</b><span>Right brain: walk my 3D world</span></button>' +
      '<button class="p-again" id="pAgain" type="button">↺ Watch the video</button>' +
    '</div>' +
    '<button class="p-btn p-skip" id="pSkip" type="button">Skip intro →</button>' +
    '<button class="p-btn p-snd" id="pSnd" type="button" hidden>🔊 Tap for sound</button>' +
    '<button class="p-btn p-play" id="pPlay" type="button" hidden>▶ Play my story</button>';
  document.body.appendChild(root);
  html.classList.add("pill-on");

  function $(id) { return document.getElementById(id); }
  var vid = $("pVid"), clip = $("pClip"), cv = $("pCv"), ctx = cv.getContext("2d"), ui = $("pUi");
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
  function step24(t) { return Math.floor(t * 24) / 24; } // the video runs at 24 fps: keep the steps

  /* ------------------------------------------------------------ layout */
  // Where the pill clip sits on screen. Never crops the top (the head) or the hands.
  var L = null; // { x, y, w, h, narrow }
  function layout() {
    var narrow = W / H < 1.2, x, y, w, h;
    if (!narrow) {
      // Fill the whole screen. If that crops top/bottom, keep the pills and hands in view
      // (the frame shown runs down to ~92% of the clip's height) and trim from the top instead.
      w = Math.max(W, H * CLIP); h = w / CLIP; x = (W - w) / 2;
      var v = H / h, top = Math.max(0, Math.min(1 - v, 0.92 - v));
      y = -top * h;
    } else {
      var top = 160, bot = 120;
      w = W / 0.62; h = w / CLIP;                       // show the middle 62%: both hands stay in
      if (h > H - top - bot) { h = H - top - bot; w = h * CLIP; }
      x = (W - w) / 2; y = top + (H - top - bot - h) / 2;
    }
    L = { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), narrow: narrow };
    clip.style.left = L.x + "px"; clip.style.top = L.y + "px"; clip.style.width = L.w + "px"; clip.style.height = L.h + "px";
    clip.classList.toggle("fade", narrow);
    root.classList.toggle("narrow", narrow);
    placeUI();
  }
  function pt(p) { return [L.x + p[0] * L.w, L.y + p[1] * L.h]; }
  function placeUI() {
    var r = pt(PILL_R), b = pt(PILL_B), d = Math.max(64, Math.round(L.w * 0.085));
    var dr = $("pDotR"), db = $("pDotB"), cr = $("pChR"), cb = $("pChB"), hd = $("pHead");
    [dr, db].forEach(function (el, i) { var p = i ? b : r; el.style.left = p[0] + "px"; el.style.top = p[1] + "px"; el.style.width = el.style.height = d + "px"; });
    if (!L.narrow) {
      // labels sit outside each hand (left of the red one, right of the blue one) when there's room,
      // otherwise just under the pill
      var handL = L.x + L.w * 0.18, handR = L.x + L.w * 0.84, room = 250;
      if (handL >= room && W - handR >= room) {
        cr.style.top = cb.style.top = (r[1] - 36) + "px";
        cr.style.left = (handL - 125) + "px"; cb.style.left = (handR + 125) + "px";
      } else {
        var ty = Math.min(H - 84, r[1] + d / 2 + 4);
        cr.style.top = cb.style.top = ty + "px";
        cr.style.left = Math.max(131, r[0]) + "px"; cb.style.left = Math.min(W - 131, b[0]) + "px";
      }
      cb.style.right = "auto";
      // headline in the empty space left of the head
      hd.style.left = Math.max(20, L.x + L.w * 0.04) + "px"; hd.style.top = Math.max(24, L.y + L.h * 0.07) + "px";
      hd.style.maxWidth = Math.max(280, L.w * 0.3) + "px"; hd.style.right = "auto";
    } else {
      cr.style.top = cb.style.top = ""; cr.style.left = cb.style.left = ""; cb.style.right = "";
      hd.style.left = hd.style.right = hd.style.maxWidth = ""; hd.style.top = "max(44px,7vh)";
    }
  }

  /* ------------------------------------------------- pixel transitions */
  // Black screen opens up from the centre in stepped square pixels (the end of the story video,
  // played backwards), revealing the pill clip underneath.
  function openUp(done) {
    var C = Math.max(10, Math.round(W / 90)), cols = Math.ceil(W / C), rows = Math.ceil(H / C);
    var cx = W / 2, cy = H / 2, maxD = Math.sqrt(cx * cx + cy * cy), cells = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var d = Math.sqrt(Math.pow(c * C + C / 2 - cx, 2) + Math.pow(r * C + C / 2 - cy, 2)) / maxD;
      cells.push({ x: c * C, y: r * C, v: d * 1.05 + Math.random() * .16 });
    }
    var t0 = now(), DUR = 1.25;
    if (reduce) { ctx.clearRect(0, 0, W, H); done(); return; }
    (function f() {
      var t = step24((now() - t0) / 1000);
      ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#000"; ctx.beginPath();
      for (var i = 0; i < cells.length; i++) if (t < cells[i].v * DUR / 1.21) ctx.rect(cells[i].x, cells[i].y, C + .5, C + .5);
      ctx.fill();
      if (t < DUR) raf(f); else { ctx.clearRect(0, 0, W, H); done(); }
    })();
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
    if (stage !== "video") return; stage = "opening";
    try { vid.pause(); } catch (e) {}
    skipBtn.hidden = sndBtn.hidden = playBtn.hidden = true;
    // cover the screen in black, put the pill clip underneath, then open up onto it
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    root.classList.add("scene"); vid.style.visibility = "hidden";
    layout(); playClip();
    openUp(function () {
      stage = "choose"; ui.classList.add("on");
      setTimeout(function () { try { $("pDotB").focus({ preventScroll: true }); } catch (e) {} }, 50);
    });
  }
  // The pill clip plays once with its dialogue, then stays paused on its last frame
  // (him facing the screen, a pill in each hand). No loop.
  function playClip() {
    clip.style.visibility = "visible";
    try { clip.currentTime = 0; } catch (e) {}
    var p; try { clip.muted = false; p = clip.play(); } catch (e) { p = null; }
    if (p && p.then) p.then(function () { sndBtn.hidden = true; }, function () {
      // the browser wants a tap before sound: play muted and offer "Tap for sound"
      clip.muted = true; var q = clip.play(); if (q && q.catch) q.catch(function () {});
      sndBtn.hidden = false;
    });
  }
  clip.addEventListener("ended", function () {
    // stay on the last frame
    sndBtn.hidden = true;
    try { clip.pause(); } catch (e) {}
  });
  function skip() { // close in from the centre like the video's ending, then open onto the pills
    if (stage !== "video") return;
    skipBtn.hidden = sndBtn.hidden = playBtn.hidden = true;
    try { vid.pause(); } catch (e) {}
    var C = Math.max(10, Math.round(W / 90)), cols = Math.ceil(W / C), rows = Math.ceil(H / C), cx = W / 2, cy = H / 2, maxD = Math.sqrt(cx * cx + cy * cy), t0 = now();
    if (reduce) { toScene(); return; }
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
  function redPill(from) { // the left brain: a separate case-study page
    if (stage !== "choose") return; stage = "leaving";
    var p = pt(PILL_R);
    var fx = from && from.clientX ? from.clientX : p[0], fy = from && from.clientY ? from.clientY : p[1];
    ui.classList.remove("on"); sndBtn.hidden = true;
    try { clip.pause(); } catch (e) {}
    closeIn(fx, fy, function () { location.href = "left/"; }, function () {});
  }
  function bluePill(from) {
    if (stage !== "choose") return; stage = "leaving";
    var p = pt(PILL_B);
    var fx = from && from.clientX ? from.clientX : p[0], fy = from && from.clientY ? from.clientY : p[1];
    ui.classList.remove("on");
    closeIn(fx, fy, function () {
      root.classList.remove("scene"); root.style.background = "transparent";
      sndBtn.hidden = true;
      [vid, clip].forEach(function (v) { try { v.pause(); v.removeAttribute("src"); v.innerHTML = ""; v.load(); } catch (e) {} v.style.display = "none"; });
      html.classList.remove("pill-on"); window.PILL.active = false;
      if (window.APP) window.APP.startWorld();
    }, function () { root.classList.add("gone"); root.parentNode && root.parentNode.removeChild(root); });
  }
  window.PILL.blue = bluePill;

  $("pDotR").onclick = function (e) { redPill(e); };
  $("pChR").onclick = function (e) { redPill(e); };
  $("pDotB").onclick = function (e) { bluePill(e); };
  $("pChB").onclick = function (e) { bluePill(e); };
  $("pAgain").onclick = function () {
    if (stage !== "choose") return; ui.classList.remove("on");
    try { clip.pause(); } catch (e) {}
    clip.style.visibility = "hidden"; ctx.clearRect(0, 0, W, H); root.classList.remove("scene"); vid.style.visibility = "";
    stage = "video"; skipBtn.hidden = false; vid.currentTime = 0; vid.muted = false; startVideo();
  };
  skipBtn.onclick = skip;
  vid.addEventListener("ended", toScene);
  vid.addEventListener("error", function () { if (stage === "video") skip(); });
  addEventListener("keydown", function (e) {
    if (!window.PILL.active) return;
    if (e.key === "Escape" && stage === "video") { e.stopPropagation(); skip(); }
  }, true);
  addEventListener("resize", function () { size(); if (stage === "choose" || stage === "opening") layout(); });

  // Warm the cache for the 3D world while the video plays, so the blue pill opens fast.
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
  sndBtn.onclick = function () {
    sndBtn.hidden = true;
    if (stage === "video") { vid.muted = false; vid.play(); }
    else { clip.muted = false; try { clip.currentTime = 0; } catch (e) {} clip.play(); } // restart the dialogue with sound
  };
  playBtn.onclick = function () { playBtn.hidden = true; vid.muted = false; vid.play().catch(function () {}); };

  if (seen || reduce) {
    // Been here before: straight to the pills (the video is one tap away).
    vid.preload = "none"; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
    setTimeout(function () { stage = "video"; toScene(); warm(); }, 250);
  } else {
    startVideo();
  }
})();
