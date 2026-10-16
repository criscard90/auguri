/* Builder: replica configurabile di buoncompleanno2026.
 * Slide = foto + frase (come images[]/texts[] originali), musica, titolo,
 * parametri (slideDuration ecc.), anteprima live = stesso motore BCShow. */
(function () {
  'use strict';
  var slides = []; // {img:'', text:''}
  var musicUrl = '', musicName = '';
  function $(s, r) { return (r || document).querySelector(s); }
  function lim() { return ((window.AUGURI_CONFIG || {}).limits) || { maxSlides: 10, maxPhotoMB: 5 }; }
  function dfl() { return ((window.AUGURI_CONFIG || {}).defaults) || {}; }
  function collect() {
    return window.AuguriStore.normalize({
      theme: $('#f-theme').value,
      title: $('#f-title').value,
      subtitle: $('#f-sub').value,
      startLabel: $('#f-btn').value,
      images: slides.map(function (s) { return s.img; }).filter(Boolean),
      texts: slides.map(function (s) { return s.text; }),
      musicUrl: musicUrl, musicName: musicName,
      musicStartTime: +$('#f-mstart').value || 0,
      slideDuration: (+$('#f-dur').value || 10) * 1000,
      boostGapMin: (+$('#f-gapmin').value || 9) * 1000,
      boostGapMax: (+$('#f-gapmax').value || 18) * 1000,
      auguriBase: 'auguri/',
      auguri: []
    });
  }
  function previewMount() {
    var ov = $('#previewOverlay');
    if (!ov) {
      ov = document.createElement('div');
      ov.id = 'previewOverlay';
      ov.innerHTML = '<button class="btn btn-ghost close-prev" id="closePrev">Chiudi anteprima</button><div id="livePreview"></div>';
      document.body.appendChild(ov);
      ov.querySelector('#closePrev').onclick = function () { try { window.BCShow.stop(); } catch (e) {} ov.classList.add('hidden'); };
    }
    return ov;
  }
  function preview() {
    var ov = previewMount();
    ov.classList.remove('hidden');
    window.BCShow.play(ov.querySelector('#livePreview'), collect());
  }
  function previewStop() {
    var ov = $('#previewOverlay');
    if (ov) ov.classList.add('hidden');
    try { window.BCShow.stop(); } catch (e) {}
  }
  var previewT = null;
  function previewSoon() { /* anteprima solo su click: lo show e fullscreen */ }
  function setStatus(t) { var el = $('#genStatus'); if (el) el.textContent = t || ''; }
  function fileToDataURL(f) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(r.result); };
      r.onerror = rej;
      r.readAsDataURL(f);
    });
  }
  function shrinkImage(dataUrl, maxSide) {
    maxSide = maxSide || 1280;
    return new Promise(function (res) {
      var img = new Image();
      img.onload = function () {
        var w = img.width, h = img.height;
        var sc = Math.min(1, maxSide / Math.max(w, h));
        if (sc >= 1) return res(dataUrl);
        var c = document.createElement('canvas');
        c.width = Math.round(w * sc); c.height = Math.round(h * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function () { res(dataUrl); };
      img.src = dataUrl;
    });
  }
  function useCloud() {
    try {
      var c = window.AuguriStore.cfg();
      return !!(c.cloudinary.cloudName && c.cloudinary.imagePreset);
    } catch (e) { return false; }
  }
  async function addSlideFiles(files) {
    var L = lim();
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!f.type || f.type.indexOf('image/') !== 0) continue;
      if (slides.length >= (L.maxSlides || 10)) { alert('Massimo ' + (L.maxSlides || 10) + ' slide (come originale).'); break; }
      if (f.size > (L.maxPhotoMB || 5) * 1048576) { alert('"' + f.name + '" supera ' + (L.maxPhotoMB || 5) + ' MB: verra compressa.'); }
      try {
        setStatus('Foto ' + (slides.length + 1) + '...');
        var url;
        if (useCloud()) url = await window.AuguriStore.uploadCloudinary(f, 'image');
        else url = await shrinkImage(await fileToDataURL(f), 1280);
        slides.push({ img: url, text: '' });
      } catch (e) {
        try { slides.push({ img: await shrinkImage(await fileToDataURL(f), 900), text: '' }); }
        catch (e2) {}
      }
    }
    setStatus('');
    renderSlides(); previewSoon();
  }
  function renderSlides() {
    var box = $('#slideList');
    box.innerHTML = '';
    $('#slideCount').textContent = slides.length + ' / ' + (lim().maxSlides || 10);
    slides.forEach(function (s, i) {
      var row = document.createElement('div');
      row.className = 'slide-row';
      var th = s.img ? '<img src="' + s.img.replace(/"/g, '&quot;') + '" alt="Slide ' + (i + 1) + '"/>' : '<span class="nophoto">' + (i + 1) + '</span>';
      row.innerHTML = '<div class="slide-thumb">' + th + '</div>' +
        '<div class="slide-body"><b>Slide ' + (i + 1) + '</b>' +
        '<textarea placeholder="Frase mostrata su questa foto (come texts[] originale)...">' + '</textarea>' +
        '<div class="slide-ops"></div></div>';
      var ta = row.querySelector('textarea');
      ta.value = s.text || '';
      ta.addEventListener('input', function () { s.text = ta.value; previewSoon(); });
      var ops = row.querySelector('.slide-ops');
      function mk(label, fn, dis) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'btn btn-mini'; b.textContent = label;
        if (dis) b.disabled = true;
        b.onclick = fn;
        ops.appendChild(b);
      }
      mk('↑', function () { if (i > 0) { var t = slides[i-1]; slides[i-1] = slides[i]; slides[i] = t; renderSlides(); previewSoon(); } }, i === 0);
      mk('↓', function () { if (i < slides.length - 1) { var t = slides[i+1]; slides[i+1] = slides[i]; slides[i] = t; renderSlides(); previewSoon(); } }, i === slides.length - 1);
      mk('✕', function () { slides.splice(i, 1); renderSlides(); previewSoon(); });
      box.appendChild(row);
    });
  }
  async function onMusic(file) {
    if (!file) return;
    if (file.size > (lim().maxAudioMB || 12) * 1048576) { alert('Audio troppo grande (max ' + (lim().maxAudioMB || 12) + ' MB).'); return; }
    musicName = file.name;
    $('#audioName').textContent = musicName;
    try {
      if (useCloud()) { setStatus('Upload musica...'); musicUrl = await window.AuguriStore.uploadCloudinary(file, 'audio'); }
      else musicUrl = await fileToDataURL(file);
    } catch (e) {
      try { musicUrl = await fileToDataURL(file); } catch (e2) {}
    }
    setStatus(''); previewSoon();
  }
  async function generate() {
    var c = collect();
    if (!c.images.length) { alert('Aggiungi almeno 1 foto (originale: 10).'); return; }
    $('#btnGen').disabled = true;
    setStatus('Generazione link...');
    try {
      var saved = await window.AuguriStore.save(c);
      var url = window.AuguriStore.viewUrl(saved.id);
      var box = $('#result');
      box.classList.remove('hidden');
      box.innerHTML = '<b>Biglietto pronto! (clone di buoncompleanno2026)</b><br/>' +
        'Link da inviare: <code>' + url + '</code><br/>' +
        '<button class="btn btn-primary" id="btnCopy">Copia link</button> ' +
        '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + url + '">Apri</a><br/>' +
        '<small>Salvato in: <b>' + saved.where + '</b> · scade tra 30 giorni · Deletion key: <code>' + saved.deletionKey + '</code></small><br/>' +
        '<small>Link portabile (solo testo/foto leggere, nessun server): <code id="portUrl"></code> <button class="btn btn-mini" id="btnPort">Copia</button></small><br/>' +
        '<small>Elimina ora: <input id="delKey" placeholder="incolla deletion key"/> <button class="btn btn-danger btn-mini" id="btnDel">Elimina</button></small>';
      $('#btnCopy').onclick = function () { try { navigator.clipboard.writeText(url); setStatus('Link copiato!'); } catch (e) { prompt('Copia il link:', url); } };
      try { $('#portUrl').textContent = window.AuguriStore.portableUrl(c).slice(0, 120) + '...'; } catch (e) {}
      $('#btnPort').onclick = function () { try { navigator.clipboard.writeText(window.AuguriStore.portableUrl(c)); setStatus('Link portabile copiato!'); } catch (e) { alert('Foto troppo pesanti per il link portabile: usa il link breve.'); } };
      $('#btnDel').onclick = async function () {
        try { await window.AuguriStore.remove(saved.id, $('#delKey').value.trim()); setStatus('Biglietto eliminato.'); box.classList.add('hidden'); }
        catch (e) { alert('Eliminazione fallita: ' + e.message); }
      };
      box.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { alert('Errore generazione: ' + e.message); }
    $('#btnGen').disabled = false;
    setStatus('');
  }
  function demo() {
    var D = dfl();
    $('#f-title').value = 'Tocca per iniziare';
    $('#f-sub').value = D.subtitle || 'Tocca i cuoricini per una sorpresa!';
    $('#f-btn').value = 'Inizia';
    $('#f-theme').value = 'originale';
    slides = [
      { img: svg('1'), text: 'Dicono che la memoria giochi brutti scherzi...' },
      { img: svg('2'), text: 'Buon compleanno amore mio!' }
    ];
    musicUrl = ''; musicName = '';
    $('#audioName').textContent = '';
    renderSlides(); previewSoon();
  }
  function svg(ch) {
    var s = "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'><rect width='800' height='600' fill='#401604'/><text x='400' y='340' font-size='200' text-anchor='middle' fill='#e8891c' font-family='Georgia'>" + ch + '</text></svg>';
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(s);
  }
  function cloudPanel() {
    var cur = window.AuguriStore.loadCloudCfg();
    $('#c-base').value = cur.BASE_URL || window.AUGURI_CONFIG.BASE_URL;
    $('#c-db').value = cur.databaseURL || '';
    $('#c-cn').value = cur.cloudName || '';
    $('#c-ip').value = cur.imagePreset || '';
    $('#c-ap').value = cur.audioPreset || '';
    $('#cloudSave').onclick = function () {
      window.AuguriStore.saveCloudCfg({
        BASE_URL: $('#f-base') ? $('#f-base').value.trim() : $('#c-base').value.trim(),
        databaseURL: $('#c-db').value.trim(),
        cloudName: $('#c-cn').value.trim(), imagePreset: $('#c-ip').value.trim(), audioPreset: $('#c-ap').value.trim()
      });
      setStatus('Impostazioni cloud salvate.');
      setTimeout(function () { setStatus(''); }, 2000);
    };
  }
  function init() {
    if (!$('#builderPage')) return;
    renderSlides();
    ['f-title', 'f-sub', 'f-btn', 'f-theme', 'f-mstart', 'f-dur', 'f-gapmin', 'f-gapmax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', previewSoon);
      if (el) el.addEventListener('change', previewSoon);
    });
    var dz = $('#drop'), fi = $('#f-photos');
    dz.onclick = function () { fi.click(); };
    fi.onchange = function () { addSlideFiles(fi.files); fi.value = ''; };
    ['dragover', 'dragenter'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); }); });
    dz.addEventListener('drop', function (e) { addSlideFiles(e.dataTransfer.files); });
    $('#f-audio').addEventListener('change', function (e) { onMusic(e.target.files[0]); });
    $('#btnGen').onclick = generate;
    if ($('#btnPreview')) $('#btnPreview').onclick = preview;
    $('#btnDemo').onclick = demo;
    cloudPanel();
    demo();
  }
  window.AuguriBuilder = { init: init, collect: collect };
})();
