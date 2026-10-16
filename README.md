# Auguri — clone configurabile di `buoncompleanno2026` 🎂

Stesso show dell'originale (`criscard90/buoncompleanno2026`): slideshow
fullscreen con **Ken Burns**, dissolvenze con blur, **foglie** con boost
casuali, **cuoricini che scoppiano** con suoni dalla cartella `auguri/`,
musica in loop e `Tocca per iniziare` (sblocco autoplay + fullscreen).

La differenza: **niente piu' hardcoded**. Dal builder configuri tutto e
ottieni un link breve da inviare al festeggiato:

```
https://criscard90.github.io/auguri/#/view?id=xK9pL2mN8qRs
```

## Cosa si configura (mappatura 1:1 con l'originale)

| Originale (`index.html`) | Builder `auguri` |
|---|---|
| `images[]` (`foto1.jpg`...`foto10.jpg`) | Upload drag&drop fino a 10 foto (slide = foto + frase) |
| `texts[]` (10 frasi) | 1 textarea per slide, con riordino ↑↓ |
| `musica.mp3` | Upload audio (MP3/OGG/WAV) |
| `auguri/*.mp3` + `list.json` | Cartella `auguri/` + `list.json` (stessa logica shuffle) |
| `musicStartTime`, `slideDuration`, `boostGapMin/Max` | Pannello “Parametri show” |
| Titolo `Tocca per iniziare` | Campi titolo / sottotitolo / bottone |
| Sfondo arancio/nero | Tema `originale` (default fedele) + varianti gold/pastel/neon |

## Uso

```bash
python3 -m http.server 8080
# apri http://localhost:8080/#/
```

1. Carica foto + frasi, musica, titolo.
2. Premi **Anteprima show** (lo show e' fullscreen come l'originale).
3. Premi **Genera Biglietto** → copia il link `.../auguri/#/view?id=...`.

## Storage (dalle specifiche §5)

- **Cloud (se configurato):** Firebase RTDB + Cloudinary → URL corti, foto HD.
- **Locale (default):** `localStorage` del creatore → zero-config.
- **Portabile:** `#/view?d=...` dati nell'URL, nessun server.

TTL 30 giorni + Deletion Key (§4 privacy). Card `noindex,nofollow`.

## Struttura

```
index.html        builder + reader (hash routing per Pages)
404.html          fallback SPA
css/show.css      CSS originale isolato sotto .bc-view (+ temi opzionali)
css/builder.css   solo chrome del builder
js/show.js        motore originale parametrizzato (images/texts/musicUrl/... da cfg)
js/builder.js     form slide, upload, anteprima, generazione link
js/reader.js      #/view?id= / ?d= → BCShow.play
js/storage.js     Firebase → localStorage + portabile, TTL, deletion key
js/config.js      BASE_URL auguri + default fedeli all'originale
auguri/list.json  elenco MP3 dei cuoricini (+ tuoi file)
```

## Pubblicazione

Settings → Pages → Deploy from branch → `main` / `/ (root)` → Save.

Live: **https://criscard90.github.io/auguri/#/**
