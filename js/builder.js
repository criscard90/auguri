/* Builder: form, upload, anteprima live, generazione link. */
(function () {
  'use strict';
  var state = { theme: 'gold-night', confetti: 'default', photos: [], audioUrl: '', audioName: '', audioFile: null };
  function $(s, r) { return (r || document).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function lim() { return (window.AUGURI_CONFIG && window.AUGURI_CONFIG.limits) || { maxPhotos: 10, maxPhotoMB: 5 }; }
  function collect() {
    return {
      name: $('#f-name').value.trim(),
      date: $('#f-date').value,
      title: $('#f-title').value.trim() || 'Buon Compleanno!',
      message: $('#f-msg').value.trim(),
      theme: state.theme, confetti: state.confetti,
      photos: state.photos.slice(),
      audioUrl: state.audioUrl, audioName: state.audioName
    };
  }
  function refreshPreview() { window.AuguriViewer.renderInto($('#livePreview'), collect()); }
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
        res(c.toDataURL('image/jpeg', .82));
      };
      img.onerror = function () { res(dataUrl); };
      img.src = dataUrl;
    });
  }
  async function addFiles(files) {
    var L = lim();
    for (var i = 0; i < files.length; i++) {
      var f = files[i];
      if (!f.type || f.type.indexOf('image/') !== 0) continue;
      if (state.photos.length >= L.maxPhotos) { alert('Massimo ' + L.maxPhotos + ' foto.'); break; }
      if (f.size > L.maxPhotoMB * 1048576) { alert('"' + f.name + '" supera ' + L.maxPhotoMB + ' MB e sara ridotta/compressa se possibile.'); }
      var useCloud = window.AuguriStore.fbConfigured() || (window.AuguriStore.cfg().cloudinary.cloudName && window.AuguriStore.cfg().cloudinary.imagePreset);
      try {
        if (useCloud) {
          setStatus('Upload foto ' + (state.photos.length + 1) + ' su Cloudinary...');
          var url = await window.AuguriStore.uploadCloudinary(f, 'image');
          state.photos.push(url);
        } else {
          var du = await fileToDataURL(f);
          du = await shrinkImage(du, 1280);
          var j = 0;
          while (encodeURIComponent(JSON.stringify(state.photos.concat([du]))).length > 3800000 && j < 3) { j++; du = await shrinkImage(du, 1280 - j * 280); }
          state.photos.push(du);
        }
      } catch (e) { alert('Upload non riuscito, uso anteprima locale.'); try { state.photos.push(await shrinkImage(await fileToDataURL(f), 900)); } catch (e2) {} }
    }
    renderThumbs(); refreshPreview(); setStatus('');
  }
  function renderThumbs() {
    var box = $('#thumbs');
    box.innerHTML = '';
    state.photos.forEach(function (p, i) {
      var d = document.createElement('div');
      d.className = 'thumb';
      d.innerHTML = '<img alt="Foto ' + (i + 1) + '"/><button aria-label="Rimuovi">×</button>';
      d.querySelector('img').src = p;
      d.querySelector('button').onclick = function () { state.photos.splice(i, 1); renderThumbs(); refreshPreview(); };
      box.appendChild(d);
    });
    $('#photoCount').textContent = state.photos.length + ' / ' + lim().maxPhotos;
  }
  async function onAudio(file) {
    if (!file) return;
    state.audioName = file.name;
    state.audioFile = file;
    var hasCloud = window.AuguriStore.cfg().cloudinary.cloudName && (window.AuguriStore.cfg().cloudinary.audioPreset || window.AuguriStore.cfg().cloudinary.imagePreset);
    if (hasCloud) {
      try { setStatus('Upload audio su Cloudinary...'); state.audioUrl = await window.AuguriStore.uploadCloudinary(file, 'audio'); }
      catch (e) { state.audioUrl = ''; alert('Upload audio non riuscito: il biglietto sara senza audio su altri dispositivi.'); }
      setStatus('');
    } else if (file.size < 2500000) {
      state.audioUrl = await fileToDataURL(file);
    } else {
      state.audioUrl = '';
      alert('Audio troppo grande per il salvataggio locale. Configura Cloudinary per includerlo, oppure scegli un file < 2.5 MB.');
    }
    $('#audioName').textContent = state.audioName + (state.audioUrl ? '' : ' (non incorporato)');
    refreshPreview();
  }
  async function generate() {
    var data = collect();
    if (!data.name) { alert('Inserisci il nome del festeggiato.'); $('#f-name').focus(); return; }
    setStatus('Generazione biglietto...');
    $('#btnGen').disabled = true;
    try {
      var out = await window.AuguriStore.save(data);
      var box = $('#result');
      box.classList.remove('hidden');
      if (out.where === 'overflow') {
        var purl = window.AuguriStore.portableUrl(data);
        box.innerHTML = '<b>Spazio locale esaurito (foto pesanti).</b><br/>Usa il <b>link portabile</b> (dati dentro URL, senza backend):<br/><code>' + purl.slice(0, 120) + '...</code><br/><br/>' +
          '<div class="row"><a class="btn btn-dark" target="_blank" rel="noopener" href="' + purl + '">Apri biglietto</a>' +
          '<button class="btn btn-primary" id="copyP">Copia link</button></div>' +
          '<p class="hint">Suggerimento: configura Firebase + Cloudinary per foto HD e URL corti, oppure riduci il numero di foto.</p>';
        $('#copyP').onclick = function () { navigator.clipboard.writeText(purl); };
      } else {
        var url = window.AuguriStore.viewUrl(out.id);
        box.innerHTML = '<b>\u2728 Biglietto pronto!</b><br/><br/><code id="linkOut">' + url + '</code><br/><br/>' +
          '<div class="kv"><span>Conservato in:</span><b>' + (out.where === 'cloud' ? 'Cloud (Firebase)' : 'questo browser (locale)') + '</b>' +
          '<span>Deletion Key:</span><code>' + out.deletionKey + '</code></div>' +
          '<p class="hint">Conserva la Deletion Key: serve per eliminare il biglietto. Scade automaticamente dopo 30 giorni.</p>' +
          '<div class="row"><a class="btn btn-dark" target="_blank" rel="noopener" href="' + url + '">Apri biglietto</a>' +
          '<button class="btn btn-primary" id="copyL">Copia link</button>' +
          '<button class="btn btn-ghost" style="color:#111;border-color:#111" id="waShare">WhatsApp</button>' +
          '<button class="btn btn-danger" id="delNow">Elimina ora</button></div>';
        $('#copyL').onclick = function () { navigator.clipboard.writeText(url).then(function(){ setStatus('Link copiato!'); }); };
        $('#waShare').onclick = function () { location.href = 'https://wa.me/?text=' + encodeURIComponent('\uD83C\uDF82 ' + data.title + ' — ' + data.name + '! ' + url); };
        $('#delNow').onclick = async function () {
          if (!confirm('Eliminare subito questo biglietto?')) return;
          await window.AuguriStore.remove(out.id, out.deletionKey);
          setStatus('Biglietto eliminato.');
          box.classList.add('hidden');
        };
      }
      box.scrollIntoView({ behavior: 'smooth' });
    } catch (e) { alert('Errore generazione: ' + e.message); }
    $('#btnGen').disabled = false;
    setStatus('');
  }
  function demo() {
    $('#f-name').value = 'Sofia';
    $('#f-date').value = new Date().toISOString().slice(0, 10);
    $('#f-title').value = 'Buon Compleanno!';
    $('#f-msg').value = 'Cara Sofia,\nche questa giornata sia piena di sorrisi, musica e torta!\nTanti auguri! \uD83C\uDF82';
    state.photos = [svg('S', '#f5c451'), svg('O', '#ff8a3d'), svg('F', '#c4b5fd')];
    renderThumbs(); refreshPreview();
  }
  function svg(ch, color) {
    var s = "<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='600' height='600' fill='#141126'/><circle cx='300' cy='270' r='150' fill='" + color + "'/><text x='300' y='330' font-size='180' text-anchor='middle' fill='#141126' font-family='Arial' font-weight='bold'>" + ch + "</text></svg>";
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
        BASE_URL: $('#c-base').value.trim(), databaseURL: $('#c-db').value.trim(),
        cloudName: $('#c-cn').value.trim(), imagePreset: $('#c-ip').value.trim(), audioPreset: $('#c-ap').value.trim()
      });
      setStatus('Impostazioni cloud salvate.');
      setTimeout(setStatus, 2000, '');
    };
  }
  function init() {
    if (!$('#builderPage')) return;
    $all('.theme-pick button').forEach(function (b) {
      b.onclick = function () {
        $all('.theme-pick button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        state.theme = b.dataset.theme;
        refreshPreview();
      };
    });
    var cs = $('#f-confetti');
    if (cs) cs.onchange = function () { state.confetti = cs.value; refreshPreview(); };
    ['f-name', 'f-date', 'f-title', 'f-msg'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', refreshPreview);
    });
    var dz = $('#drop');
    var fi = $('#f-photos');
    dz.onclick = function () { fi.click(); };
    fi.onchange = function () { addFiles(fi.files); fi.value = ''; };
    ['dragover', 'dragenter'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('drag'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('drag'); }); });
    dz.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
    $('#f-audio').addEventListener('change', function (e) { onAudio(e.target.files[0]); });
    $('#btnGen').onclick = generate;
    $('#btnDemo').onclick = demo;
    $('#btnPreviewMode').onclick = function () {
      var ph = $('#livePreview');
      var shell = ph.closest('.phone');
      shell.classList.toggle('desktop');
      $('#btnPreviewMode').textContent = shell.classList.contains('desktop') ? 'Vista: Desktop' : 'Vista: Mobile';
    };
    cloudPanel();
    demo();
  }
  window.AuguriBuilder = { init: init, collect: collect };
})();
