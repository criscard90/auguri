# 🎂 Auguri — Piattaforma Web Serverless per Biglietti d'Auguri Dinamici

Web-based Card Builder a **costo zero**: crea, personalizza e condividi un biglietto d'auguri
multimediale (testo + galleria foto + musica) tramite un **link unico** destinato al festeggiato.

> Implementazione delle **Specifiche Tecniche v1.0 (Ottobre 2026)** contenute in
> `Specifiche_Tecniche_BuonCompleanno_Model.docx`, adattate a questa repository
> **`criscard90/auguri`**.

Link generato (forma corretta per questa repo):

```
https://criscard90.github.io/auguri/#/view?id=xK9pL2mN8qRs
```

## ✨ Funzionalità

- **Builder (Fase 1):** nome festeggiato, data evento, titolo festa, messaggio, upload drag-and-drop
  fino a **10 foto (max 5 MB cad.)**, audio di sottofondo (MP3/OGG/WAV), 3 temi
  (`Gold & Night`, `Pastel Birthday`, `Neon Party`) + stili coriandoli, anteprima live mobile/desktop.
- **Generazione link (Fase 2):** upload client-side, JSON di configurazione + ID univoco ad alta
  entropia (12 caratteri alfanumerici), salvataggio su storage, link finale + **Deletion Key**.
- **Fruizione (Fase 3):** lettore JS che estrae l'ID dall'URL, carica i dati e renderizza la pagina
  animata con audio interattivo (sblocco autoplay mobile), gallery + lightbox, countdown, coriandoli.
- **Privacy by Design:** `noindex, nofollow`, nessun login/cookie di profilazione, ID impredicibili,
  **TTL 30 giorni** (scadenza automatica), cancellazione manuale con Deletion Key.

## 🏗️ Architettura (Zero-Cost & Zero-Backend)

| Componente | Tecnologia | Ruolo |
|---|---|---|
| Hosting & CDN | GitHub Pages | Hosting statico di builder + lettore |
| Database NoSQL | Firebase Realtime DB *(opzionale)* | Salvataggio JSON associato a ID univoco |
| Media Storage | Cloudinary Unsigned Upload *(opzionale)* | Hosting immagini/audio |
| Frontend Engine | HTML5 + TailwindCSS + Vanilla JS | UI reattiva, client-side rendering, preview live |

### Modalità di storage (a cascata, senza configurazione funziona subito)

1. **Cloud (se configurato):** Firebase + Cloudinary → URL corti, foto HD, funziona tra dispositivi.
2. **Locale (default, zero-config):** `localStorage` del browser del creatore → funziona subito,
   ideale per demo/test sulla stessa macchina.
3. **Portabile (solo testo / foto leggere):** payload compresso `lz-string` dentro l'URL
   `#/view?d=...` → zero server, privacy 100%, funziona ovunque senza backend.

> Il trade-off è quello delle specifiche (§5): URL-compression per biglietti solo-testo,
> Hybrid Free Cloud per la migliore UX. L'app supporta **entrambi** e sceglie da sola.

## 🚀 Uso locale

Nessuna build richiesta — è una Static Web App pura.

```bash
# dalla root della repo
python3 -m http.server 8080
# apri http://localhost:8080/#/
```

Oppure apri direttamente `index.html` nel browser (consigliato via server per file:// + audio).

## ⚙️ Configurazione Cloud (opzionale, consigliata per produzione)

1. **Cloudinary:** crea un *Unsigned Upload Preset* (Settings → Upload → Upload presets),
   poi compila `js/config.js` oppure il pannello **Impostazioni Cloud** nel builder:
   - `cloudName`, `imagePreset` (immagini), `audioPreset` (video/audio — puoi riusare lo stesso preset con resource_type auto).
2. **Firebase Realtime DB:** crea un progetto, abilita Realtime Database in modalità locked,
   imposta le regole (vedi sotto) e compila `databaseURL`:

```json
{
  "rules": {
    "cards": {
      "$id": {
        ".read": true,
        ".write": "newData.exists() && !data.exists()",
        ".validate": "newData.hasChildren(['data','createdAt','expiresAt'])"
      }
    }
  }
}
```

> **TTL 30 giorni:** Firebase RTDB non ha TTL nativo. Pulisci i nodi scaduti con una
> Cloud Function schedulata / cron esterno che elimina i record con `expiresAt < now`,
> oppure usa Supabase (`expires_at` + pg_cron). Sul client la scadenza è comunque
> applicata in lettura (i biglietti scaduti non vengono renderizzati).

## 🗺️ Route (hash routing — compatibile GitHub Pages)

- `#/` → Builder + anteprima live
- `#/view?id=ABC...` → Lettore biglietto (da Firebase → localStorage → payload `d`)
- `#/view?d=...` → Lettore portabile (dati compressi nell'URL)
- `#/privacy` → Informativa privacy / GDPR

Il file `404.html` reindirizza a `index.html` preservando l'hash (fallback SPA su Pages).

## 🔐 Privacy / GDPR (§4 specifiche)

- Nessuna registrazione, email, login o cookie di profilazione.
- Card non indicizzate (`robots: noindex, nofollow`, meta + `robots.txt`).
- ID ad alta entropia, non enumerabili.
- Scadenza automatica a 30 giorni + cancellazione manuale con Deletion Key
  (pulsante *Elimina* nel pannello di successo del builder).

## 📁 Struttura

```
index.html          shell SPA + router outlet
404.html            fallback SPA per GitHub Pages
robots.txt          disallow totale (privacy)
.nojekyll           bypass Jekyll su Pages
css/style.css       temi, animazioni, gallery, builder
js/config.js        BASE_URL + chiavi Cloud (placeholder)
js/storage.js       adapter Local/Firebase/URL-compress + ID/key gen + TTL
js/builder.js       form, drag&drop, compressione immagini, anteprima, generazione
js/viewer.js        lettore card, countdown, gallery, audio, coriandoli
js/app.js           router hash + nav + pagina privacy
```

## ✅ Roadmap (da specifiche §6)

- [x] Fase 1 — Template dinamico (oggetto JS da parametri URL, niente più hardcoded)
- [x] Fase 2 — Builder GUI con anteprima live
- [x] Fase 3 — Integrazione Cloudinary & DB (con fallback zero-config)
- [ ] Fase 4 — Test responsive iOS/Android + autoplay audio + pubblicazione su Pages

Per pubblicare: *Settings → Pages → Deploy from branch → `main` / root*.
