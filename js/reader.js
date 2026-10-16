/* Reader: legge id/d dal link e avvia BCShow (stesso motore dell'originale). */
(function () {
  'use strict';
  function qs() {
    var h = location.hash || '#/';
    var qi = h.indexOf('?');
    var path = qi === -1 ? h : h.slice(0, qi);
    var q = qi === -1 ? '' : h.slice(qi + 1);
    var params = {};
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      params[decodeURIComponent(i === -1 ? kv : kv.slice(0, i))] = decodeURIComponent(i === -1 ? '' : kv.slice(i + 1));
    });
    return { path: path.replace(/^#/, '') || '/', params: params };
  }
  function show(id) {
    ['builderPage', 'viewPage', 'privacyPage'].forEach(function (p) {
      var el = document.getElementById(p);
      if (el) el.classList.toggle('hidden', p !== id);
    });
    window.scrollTo(0, 0);
  }
  function note(html) {
    return '<div class="note"><div class="panel">' + html + '</div></div>';
  }
  async function routeView(params) {
    show('viewPage');
    var mount = document.getElementById('viewMount');
    if (!mount) return;
    try { if (window.BCShow) window.BCShow.stop(); } catch (e) {}
    if (params.d) {
      try {
        var data = window.AuguriStore.decodePortable(params.d);
        window.BCShow.play(mount, data);
        document.title = 'Buon Compleanno! \u2014 Auguri';
        return;
      } catch (e) { mount.innerHTML = note('<h2>Link non valido</h2><p>Il biglietto incorporato non si apre.</p>'); return; }
    }
    var id = params.id;
    if (!id) { mount.innerHTML = note('<h2>Nessun biglietto</h2><p><a href="#/">Crea il tuo biglietto</a></p>'); return; }
    mount.innerHTML = note('<h2>Caricamento sorpresa...</h2><p>Un attimo di pazienza.</p>');
    try {
      var rec = await window.AuguriStore.load(id);
      if (!rec) mount.innerHTML = note('<h2>Biglietto non trovato</h2><p>Questo link non esiste su questo dispositivo (i biglietti locali vivono nel browser del creatore) oppure e stato eliminato.</p><p><a href="#/">Crea un nuovo biglietto</a></p>');
      else if (rec.expired) mount.innerHTML = note('<h2>Biglietto scaduto</h2><p>I biglietti si autodistruggono dopo 30 giorni per proteggere la tua privacy.</p>');
      else {
        window.BCShow.play(mount, rec.data);
        document.title = 'Buon Compleanno! \u2014 Auguri';
      }
    } catch (e) { mount.innerHTML = note('<h2>Errore</h2><p>' + String(e.message || e) + '</p>'); }
  }
  function route() {
    var q = qs();
    try { if (q.path.indexOf('/view') !== 0 && window.BCShow) window.BCShow.stop(); } catch (e) {}
    try { document.body.classList.toggle('bc-viewing', q.path.indexOf('/view') === 0); } catch (e) {}
    if (q.path.indexOf('/view') === 0) routeView(q.params);
    else if (q.path.indexOf('/privacy') === 0) show('privacyPage');
    else { show('builderPage'); document.title = 'Auguri \u2014 Crea il tuo biglietto'; }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', function () {
    if (window.AuguriBuilder) window.AuguriBuilder.init();
    route();
  });
})();
