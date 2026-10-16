/* Storage adapter: Firebase (REST) -> localStorage, + link portabile.
 * Salva la config dello show (images, texts, musicUrl, title, params). */
(function () {
  'use strict';
  var PREFIX = 'auguri_cards.';
  var CLOUD_KEY = 'auguri_cloud_cfg';
  function base() { return window.AUGURI_CONFIG || {}; }
  function cfg() {
    var b = base();
    try {
      var ov = JSON.parse(localStorage.getItem(CLOUD_KEY) || '{}');
      return {
        BASE_URL: ov.BASE_URL || b.BASE_URL || location.origin,
        firebase: { databaseURL: ov.databaseURL || ((b.firebase || {}).databaseURL || '') },
        cloudinary: {
          cloudName: ov.cloudName || (((b.cloudinary || {}).cloudName) || ''),
          imagePreset: ov.imagePreset || (((b.cloudinary || {}).imagePreset) || ''),
          audioPreset: ov.audioPreset || (((b.cloudinary || {}).audioPreset) || '')
        },
        limits: b.limits || { maxSlides: 10, maxPhotoMB: 5, ttlDays: 30 }
      };
    } catch (e) {
      return { BASE_URL: b.BASE_URL || location.origin, firebase: {}, cloudinary: {}, limits: b.limits || {} };
    }
  }
  function saveCloudCfg(o) { localStorage.setItem(CLOUD_KEY, JSON.stringify(o || {})); }
  function loadCloudCfg() { try { return JSON.parse(localStorage.getItem(CLOUD_KEY) || '{}'); } catch (e) { return {}; } }
  var ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  function nanoid(n) {
    n = n || 12;
    var a = new Uint8Array(n), s = '';
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (var i = 0; i < n; i++) a[i] = Math.floor(Math.random() * 256);
    for (var j = 0; j < n; j++) s += ALPHA[a[j] % ALPHA.length];
    return s;
  }
  function delKey() { return nanoid(16) + nanoid(8); }
  function nowMs() { return Date.now(); }
  function expiryMs(days) { return nowMs() + (days || 30) * 864e5; }
  function isExpired(rec) { return !rec || !rec.expiresAt || rec.expiresAt < nowMs(); }
  function localSave(id, record) {
    try { localStorage.setItem(PREFIX + id, JSON.stringify(record)); return true; }
    catch (e) { return false; }
  }
  function localLoad(id) {
    try {
      var raw = localStorage.getItem(PREFIX + id);
      if (!raw) return null;
      var rec = JSON.parse(raw);
      if (isExpired(rec)) { localStorage.removeItem(PREFIX + id); return { expired: true }; }
      return rec;
    } catch (e) { return null; }
  }
  function localDelete(id) { try { localStorage.removeItem(PREFIX + id); } catch (e) {} }
  function fbBase() {
    var u = ((cfg().firebase || {}).databaseURL || '').replace(/\/$/, '');
    return u || '';
  }
  async function fbSave(id, record) {
    var bUrl = fbBase();
    if (!bUrl) throw new Error('firebase-non-configurato');
    var r = await fetch(bUrl + '/cards/' + encodeURIComponent(id) + '.json', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record)
    });
    if (!r.ok) throw new Error('firebase-save-failed:' + r.status);
    return true;
  }
  async function fbLoad(id) {
    var bUrl = fbBase();
    if (!bUrl) throw new Error('firebase-non-configurato');
    var r = await fetch(bUrl + '/cards/' + encodeURIComponent(id) + '.json');
    if (!r.ok) throw new Error('firebase-load-failed');
    var rec = await r.json();
    if (!rec) return null;
    if (isExpired(rec)) return { expired: true };
    return rec;
  }
  async function fbDelete(id) {
    var bUrl = fbBase();
    if (!bUrl) throw new Error('firebase-non-configurato');
    await fetch(bUrl + '/cards/' + encodeURIComponent(id) + '.json', { method: 'DELETE' });
  }
  function normalize(data) {
    var d = data || {};
    var images = (d.images || []).filter(Boolean).slice(0, 10);
    var texts = (d.texts || []).map(function (t) { return String(t == null ? '' : t); });
    while (texts.length < images.length) texts.push('');
    texts = texts.slice(0, Math.max(images.length, 1));
    return {
      theme: d.theme || 'originale',
      title: d.title || '', subtitle: d.subtitle || '', startLabel: d.startLabel || 'Inizia',
      images: images, texts: texts,
      musicUrl: d.musicUrl || '', musicName: d.musicName || '',
      musicStartTime: Number(d.musicStartTime || 0),
      slideDuration: Number(d.slideDuration || 10000),
      boostGapMin: Number(d.boostGapMin || 9000),
      boostGapMax: Number(d.boostGapMax || 18000),
      auguriBase: d.auguriBase || 'auguri/',
      auguri: (d.auguri || []).slice()
    };
  }
  async function save(data) {
    var c = cfg();
    var id = nanoid(12);
    var key = delKey();
    var clean = normalize(data);
    var record = { data: clean, createdAt: nowMs(), expiresAt: expiryMs((c.limits || {}).ttlDays || 30), deletionKey: key };
    var where = 'local';
    if (fbBase()) {
      try { await fbSave(id, record); where = 'cloud'; }
      catch (e) { localSave(id, record); where = 'local'; }
    } else if (!localSave(id, record)) {
      return { id: id, deletionKey: key, record: record, where: 'overflow' };
    }
    return { id: id, deletionKey: key, record: record, where: where };
  }
  async function load(id) {
    if (fbBase()) {
      try { var rec = await fbLoad(id); if (rec) return rec; } catch (e) {}
    }
    return localLoad(id);
  }
  async function remove(id, key) {
    var rec = await load(id);
    if (rec && rec.deletionKey && key && rec.deletionKey !== key) throw new Error('deletion-key-errata');
    if (fbBase()) { try { await fbDelete(id); } catch (e) {} }
    localDelete(id);
  }
  function encodePortable(data) {
    var json = JSON.stringify(normalize(data));
    return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodePortable(s) {
    s = (s || '').replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return normalize(JSON.parse(decodeURIComponent(escape(atob(s)))));
  }
  function baseUrl() { return (cfg().BASE_URL || location.origin).replace(/\/$/, ''); }
  function viewUrl(id) { return baseUrl() + '/#/view?id=' + id; }
  function portableUrl(data) { return baseUrl() + '/#/view?d=' + encodePortable(data); }
  async function uploadCloudinary(file, kind) {
    var c = cfg();
    if (!c.cloudinary.cloudName) throw new Error('cloudinary-non-configurato');
    var preset = kind === 'audio' ? (c.cloudinary.audioPreset || c.cloudinary.imagePreset) : c.cloudinary.imagePreset;
    if (!preset) throw new Error('preset-mancante');
    var fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);
    var r = await fetch('https://api.cloudinary.com/v1_1/' + c.cloudinary.cloudName + '/auto/upload', { method: 'POST', body: fd });
    if (!r.ok) throw new Error('upload-failed:' + r.status);
    var j = await r.json();
    return j.secure_url || j.url;
  }
  window.AuguriStore = {
    cfg: cfg, saveCloudCfg: saveCloudCfg, loadCloudCfg: loadCloudCfg,
    save: save, load: load, remove: remove, normalize: normalize,
    encodePortable: encodePortable, decodePortable: decodePortable,
    viewUrl: viewUrl, portableUrl: portableUrl, uploadCloudinary: uploadCloudinary,
    nanoid: nanoid, isExpired: isExpired,
    fbConfigured: function () { return !!fbBase(); }
  };
})();
