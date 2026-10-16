/* Configurazione centrale — repo: criscard90/auguri
 * Clone configurabile di criscard90/buoncompleanno2026:
 * stesso motore slideshow (Ken Burns, foglie, cuoricini, auguri),
 * ma dati dinamici via builder -> link breve:
 *   https://criscard90.github.io/auguri/#/view?id=...
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
    cloudName: '',
    imagePreset: '', // unsigned preset per immagini
    audioPreset: ''  // unsigned preset per audio (puo' coincidere con imagePreset)
  },

  limits: {
    maxSlides: 10,
    maxPhotoMB: 5,
    maxAudioMB: 12,
    ttlDays: 30,
    maxLocalBytes: 4500000
  },

  // Default = fedele all'originale buoncompleanno2026
  defaults: {
    theme: 'originale',
    title: 'Tocca per iniziare',
    subtitle: 'Tocca i cuoricini per una sorpresa!',
    startLabel: 'Inizia',
    musicStartTime: 0,
    slideDuration: 10000,
    boostGapMin: 9000,
    boostGapMax: 18000,
    auguriBase: 'auguri/',
    auguri: [],
    musicUrl: '',
    images: [],
    texts: ['']
  }
};

