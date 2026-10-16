/* ============================================================
 * Configurazione centrale — repo: criscard90/auguri
 * ============================================================
 * BASE_URL: base pubblica su GitHub Pages. NON usare la vecchia
 * repo "buoncompleanno2026": il link generato deve essere
 *   https://criscard90.github.io/auguri/#/view?id=...
 *
 * STORAGE: 'auto' prova Firebase (se configurato) -> localStorage.
 * Per attivare il cloud compila firebase.databaseURL (+ apiKey
 * se vuoi usare SDK) e cloudinary.cloudName + upload preset
 * unsigned. In alternativa imposta tutto dal pannello
 * "Impostazioni Cloud" nel builder (salvato in localStorage e
 * prioritario rispetto a questi placeholder).
 */
window.AUGURI_CONFIG = {
  BASE_URL: 'https://criscard90.github.io/auguri',
  STORAGE: 'auto',

  firebase: {
    databaseURL: '', // es. 'https://tuo-progetto-default-rtdb.europe-west1.firebasedatabase.app'
    apiKey: '',
    projectId: ''
  },

  cloudinary: {
    cloudName: '',      // es. 'mio-cloud'
    imagePreset: '',    // unsigned preset per immagini
    audioPreset: ''     // unsigned preset per audio (può coincidere con imagePreset)
  },

  limits: {
    maxPhotos: 10,
    maxPhotoMB: 5,
    maxAudioMB: 12,
    ttlDays: 30,
    maxLocalBytes: 4_500_000 // soglia prudenziale per link portabile / localStorage
  },

  themes: ['gold-night', 'pastel', 'neon']
};
