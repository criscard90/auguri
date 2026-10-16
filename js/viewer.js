/* Lettore biglietto: render card, countdown, gallery, audio, coriandoli. */
(function () {
  'use strict';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function fmtDate(iso) {
    if (!iso) return '';
    try { var d = new Date(iso + 'T00:00:00'); return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
    catch (e) { return iso; }
  }
  function ticketHTML(d) {
    var photos = (d.photos || []).map(function (p, i) {
      return '<figure data-i="' + i + '"><img src="' + esc(p) + '" alt="Foto ' + (i + 1) + '" loading="lazy" /></figure>';
    }).join('');
    var audio = d.audioUrl
      ? '<div class="audio-pill"><button id="audioBtn" aria-label="Riproduci musica">\u25B6</button><span>\u266A ' + esc(d.audioName || 'Musica di sottofondo') + '</span><audio id="bgAudio" loop preload="auto" src="' + esc(d.audioUrl) + '"></audio></div>'
      : '';
    return '<div class="ticket theme-' + esc(d.theme || 'gold-night') + '">' +
      '<canvas class="confetti"></canvas><div class="bg-orbs"><span></span><span></span><span></span></div>' +
      '<div class="ticket-inner">' +
      '<span class="badge">\u2728 ' + esc(d.title || 'Buon Compleanno!') + ' \u2728</span>' +
      '<h1>Buon Compleanno<span class="name">' + esc(d.name || 'Festeggiato') + '!</span></h1>' +
      (d.date ? '<div class="date">\uD83C\uDF82 ' + esc(fmtDate(d.date)) + '</div>' : '') +
      '<div class="countdown" id="countdown"></div>' +
      '<div class="msg">' + esc(d.message || 'Tanti auguri!').replace(/\n/g, '<br/>') + '</div>' +
      audio +
      (photos ? '<div class="gallery" id="gallery">' + photos + '</div>' : '<p class="hint" style="color:#fff">\u2728 Che questa giornata sia speciale! \u2728</p>') +
      '<p class="hint" style="color:rgba(255,255,255,.75)">Fatto con \u2764\uFE0F tramite Auguri</p>' +
      '</div></div>';
  }
  function startCountdown(el, iso) {
    if (!el) return;
    function tick() {
      var now = new Date();
      var target;
      if (iso) { target = new Date(iso + 'T00:00:00'); target.setFullYear(now.getFullYear()); if (target < now) target.setFullYear(now.getFullYear() + 1); }
      else { target = new Date(now.getTime() + 864e5); }
      var diff = Math.max(0, target - now);
      var g = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, m = Math.floor(diff / 6e4) % 60, s = Math.floor(diff / 1e3) % 60;
      el.innerHTML =
        '<div class="cd"><b>' + g + '</b><span>giorni</span></div>' +
        '<div class="cd"><b>' + h + '</b><span>ore</span></div>' +
        '<div class="cd"><b>' + m + '</b><span>min</span></div>' +
        '<div class="cd"><b>' + s + '</b><span>sec</span></div>';
    }
    tick();
    return setInterval(tick, 1000);
  }
  function confetti(canvas, style) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H, parts = [];
    var COLORS = style === 'pastel' ? ['#ff9eb5', '#ffd6a5', '#caffbf', '#9bf6ff', '#ffffff']
      : style === 'neon' ? ['#ff2fb3', '#22e6ff', '#8b5cf6', '#ffffff', '#f5c451']
      : ['#f5c451', '#ffe9a8', '#ff8a3d', '#ffffff', '#c4b5fd'];
    function resize() { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; }
    resize();
    window.addEventListener('resize', resize);
    var N = style === 'minimal' ? 0 : 140;
    for (var i = 0; i < N; i++) parts.push({ x: Math.random(), y: Math.random() * -1, w: 5 + Math.random() * 7, h: 8 + Math.random() * 10, c: COLORS[i % COLORS.length], vy: .002 + Math.random() * .004, vx: (Math.random() - .5) * .002, r: Math.random() * Math.PI, vr: (Math.random() - .5) * .1 });
    var shapes = style === 'stars' ? 'rect' : 'rect';
    (function frame() {
      ctx.clearRect(0, 0, W, H);
      for (var k = 0; k < parts.length; k++) {
        var p = parts[k];
        p.y += p.vy; p.x += p.vx; p.r += p.vr;
        if (p.y > 1.05) { p.y = -0.05; p.x = Math.random(); }
        ctx.save(); ctx.translate(p.x * W, p.y * H); ctx.rotate(p.r); ctx.fillStyle = p.c;
        if (shapes === 'rect') ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); else { ctx.beginPath(); ctx.arc(0, 0, p.w / 2, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(frame);
    })();
  }
  function wireAudio(scope) {
    var btn = scope.querySelector('#audioBtn');
    var audio = scope.querySelector('#bgAudio');
    if (!btn || !audio) return;
    btn.addEventListener('click', function () {
      if (audio.paused) { audio.play().then(function () { btn.textContent = '\u23F8'; }).catch(function () {}); }
      else { audio.pause(); btn.textContent = '\u25B6'; }
    });
  }
  function wireLightbox(scope, photos) {
    var gal = scope.querySelector('#gallery');
    if (!gal) return;
    var lb = document.getElementById('lightbox');
    var img = lb.querySelector('img');
    var idx = 0;
    function show(i) { idx = (i + photos.length) % photos.length; img.src = photos[idx]; }
    gal.addEventListener('click', function (e) {
      var f = e.target.closest('figure');
      if (!f) return;
      show(+f.dataset.i);
      lb.classList.add('open');
    });
    lb.querySelector('.close').onclick = function () { lb.classList.remove('open'); };
    lb.querySelector('.prev').onclick = function (e) { e.stopPropagation(); show(idx - 1); };
    lb.querySelector('.next').onclick = function (e) { e.stopPropagation(); show(idx + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
  }
  function renderInto(mount, data) {
    try { if (mount._cdTimer) clearInterval(mount._cdTimer); } catch (e) {}
    mount.innerHTML = ticketHTML(data);
    mount._cdTimer = startCountdown(mount.querySelector('#countdown'), data.date);
    confetti(mount.querySelector('canvas.confetti'), data.confetti || 'default');
    wireAudio(mount);
    wireLightbox(mount, data.photos || []);
  }
  window.AuguriViewer = { renderInto: renderInto, ticketHTML: ticketHTML };
})();
