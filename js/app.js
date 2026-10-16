/* Router hash per GitHub Pages: #/ (builder), #/view, #/privacy */
(function () {
  'use strict';
  function qs() {
    var h = location.hash || '#/';
    var qIndex = h.indexOf('?');
    var path = qIndex === -1 ? h : h.slice(0, qIndex);
    var q = qIndex === -1 ? '' : h.slice(qIndex + 1);
    var params = {};
    q.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('=');
      var k = decodeURIComponent(i === -1 ? kv : kv.slice(0, i));
      var v = decodeURIComponent(i === -1 ? '' : kv.slice(i + 1));
      params[k] = v;
    });
    return { path: path.replace(/^#/, '') || '/', params: params };
  }
  function show(id) {
    ['builderPage', 'viewPage', 'privacyPage'].forEach(function (p) {
      document.getElementById(p).classList.toggle('hidden', p !== id);
    });
    window.scrollTo(0, 0);
  }
  function stateBox(html) {
    return '<div class="state"><div class="panel">' + html + '</div></div>';
  }
  async function routeView(params) {
    show('viewPage');
    var mount = document.getElementById('viewMount');
    if (params.d) {
      try {
        var data = window.AuguriStore.decodePortable(params.d);
        window.AuguriViewer.renderInto(mount, data);
        document.title = 'Buon Compleanno ' + (data.name || '') + '! — Auguri';
        return;
      } catch (e) { mount.innerHTML = stateBox('<h2>Link non valido</h2><p>Il biglietto incorporato non si apre.</p>'); return; }
    }
    var id = params.id;
    if (!id) { mount.innerHTML = stateBox('<h2>Nessun biglietto</h2><p><a href="#/">Crea il tuo biglietto</a></p>'); return; }
    mount.innerHTML = stateBox('<h2>\uD83C\uDF81 Caricamento sorpresa...</h2><p>Un attimo di pazienza.</p>');
    try {
      var rec = await window.AuguriStore.load(id);
      if (!rec) mount.innerHTML = stateBox('<h2>Biglietto non trovato \uD83D\uDE22</h2><p>Questo link non esiste su questo dispositivo (i biglietti locali vivono nel browser del creatore) oppure e stato eliminato.</p><p><a href="#/">Crea un nuovo biglietto</a></p>');
      else if (rec.expired) mount.innerHTML = stateBox('<h2>Biglietto scaduto \u23F3</h2><p>I biglietti si autodistruggono dopo 30 giorni per proteggere la tua privacy.</p>');
      else {
        window.AuguriViewer.renderInto(mount, rec.data);
        document.title = 'Buon Compleanno ' + (rec.data.name || '') + '! — Auguri';
      }
    } catch (e) { mount.innerHTML = stateBox('<h2>Errore</h2><p>' + String(e.message || e) + '</p>'); }
  }
  function route() {
    var q = qs();
    if (q.path.indexOf('/view') === 0) routeView(q.params);
    else if (q.path.indexOf('/privacy') === 0) show('privacyPage');
    else { show('builderPage'); document.title = 'Auguri — Crea il tuo biglietto'; }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('DOMContentLoaded', function () {
    if (window.AuguriBuilder) window.AuguriBuilder.init();
    route();
  });
})();
