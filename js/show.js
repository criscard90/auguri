/* Clone configurabile del motore di buoncompleanno2026 (stessa logica, dati da cfg). */
window.BCShow = (function () {
  'use strict';
  var Session = { timers: [], mounts: [] };
  function stop() {
    Session.timers.forEach(function (x) { try { if (x.t === 'i') clearInterval(x.h); else clearTimeout(x.h); } catch (e) {} });
    Session.timers = [];
    Session.mounts.forEach(function (m) { try { m.innerHTML = ''; } catch (e) {} });
    Session.mounts = [];
    try { document.body.classList.remove('bc-viewing'); } catch (e) {}
  }
  function esc(s) { return String(s == null ? '' : s); }
  function template(cfg) {
    var title = esc(cfg.title || 'Buon Compleanno');
    var sub = esc(cfg.subtitle || "Tocca i cuoricini per una sorpresa!");
    var btn = esc(cfg.startLabel || 'Inizia');
    var musicUrl = esc(cfg.musicUrl || '');
    return '<div id="background"></div>' +
      '<div id="particles"></div><div id="hearts"></div><div id="endFade"></div>' +
      '<audio id="music" loop>' + (musicUrl ? '<source src="' + musicUrl + '" type="audio/mpeg">' : '') + '</audio>' +
      '<div id="startScreen"><h1 style="color:#f5e9d4;font-weight:400;margin-bottom:0.5em;">' + title + '</h1>' +
      '<p style="color:#ff8796;font-size:0.95rem;margin-bottom:1.5em;">' + sub + '</p>' +
      '<button id="startButton">' + btn + '</button></div>' +
      '<div id="slides" class="slideshow"><div id="kenburns-layer"></div></div>' +
      '<div class="overlay"></div><div id="text" class="text"></div>';
  }
  function play(mount, cfg) {
    cfg = cfg || {};
    stop();
    mount.classList.add('bc-view');
    if (cfg.theme && cfg.theme !== 'originale') mount.setAttribute('data-theme', cfg.theme);
    else mount.removeAttribute('data-theme');
    mount.innerHTML = template(cfg);
    try { document.body.classList.add('bc-viewing'); } catch (e) {}
    Session.mounts.push(mount);

    
        const images = (cfg.images && cfg.images.length ? cfg.images : []).slice();
        const texts = (cfg.texts && cfg.texts.length ? cfg.texts : []).slice();
        if (!images.length || !texts.length) { mount.innerHTML = "<div style='color:#fff;padding:3rem;text-align:center;font-family:Georgia,serif'>Biglietto vuoto.</div>"; return null; }
        const slideEl = mount.querySelector("#slides");
        const kenBurnsLayer = mount.querySelector("#kenburns-layer");
        const textEl = mount.querySelector("#text");
        const music = mount.querySelector("#music");
        const startScreen = mount.querySelector("#startScreen");
        const startButton = mount.querySelector("#startButton");
    
        // Array delle classi di Ken Burns disponibili
        const kenBurnsClasses = ["kb-animation-1", "kb-animation-2", "kb-animation-3", "kb-animation-4", "kb-animation-5", "kb-animation-6"]; 
    
        let index = 0; // Indice immagine
        let textIndex = 0; // Indice testo
        let started = false;
    
        let slideCount = 0;
        const totalSlides = images.length;
        // Calcola quante immagini ci sono per ogni frase di testo
        const slidesPerText = Math.floor(images.length / texts.length);
    
    
        // ==========================================================
        // CONFIGURAZIONE PARTICELLE CORRETTA
        // ==========================================================
    
        let isBoosted = false; // Stato attuale del boost
        const boostDuration = 1500; // Durata del boost in ms (1.5 secondi)
    
        // ==========================================================
        // CONFIGURAZIONE (adatta questi valori alla TUA canzone)
        // ==========================================================
        // Secondo della traccia da cui far partire la musica (0 = dall'inizio).
        // Se la tua canzone ha un'intro da saltare, imposta qui il secondo di inizio.
        const musicStartTime = Number(cfg.musicStartTime || 0);

        // Durata di ogni slide in millisecondi (10000 = 10 secondi).
        const slideDuration = Number(cfg.slideDuration || 10000);

        // Boost casuali delle foglie: intervallo (in ms) tra uno "scoppio" e l'altro.
        // Il ritardo effettivo è un valore CASUALE tra boostGapMin e boostGapMax.
        const boostGapMin = Number(cfg.boostGapMin || 9000);
        const boostGapMax = Number(cfg.boostGapMax || 18000);
        // ==========================================================
    
    
        function showSlide() {
        
            // 1. RESET: Rimuovi le classi di animazione e forza il reset della trasformazione
            kenBurnsLayer.classList.remove(...kenBurnsClasses);
            kenBurnsLayer.style.transform = 'scale(1)'; 
            void kenBurnsLayer.offsetWidth; 
        
            // 2. Imposta la nuova immagine
            kenBurnsLayer.style.backgroundImage = 'url("' + images[index] + '")';
        
            // 3. Applica un'animazione Ken Burns casuale
            const randomClass = kenBurnsClasses[Math.floor(Math.random() * kenBurnsClasses.length)];
            kenBurnsLayer.classList.add(randomClass);
            try { kenBurnsLayer.style.animationDuration = (slideDuration / 1000) + "s"; } catch (e) {}
        
            // 4. Fade-in dello slideshow (la transizione CSS gestisce i 2s)
            slideEl.style.opacity = 1;
        }
    
        function showText() {
            if (textIndex < texts.length) {
                // Aggiorna il contenuto del testo
                textEl.innerHTML = texts[textIndex];
            
                // Fade-in del nuovo testo (la transizione CSS gestisce i 2s)
                textEl.style.opacity = 1; 
            }
        }
    
    
        function nextSlide() {
            // 1. FADE-OUT: Inizia la dissolvenza incrociata per SLIDE e TESTO
            slideEl.classList.add('transitioning'); 
            slideEl.style.opacity = 0; 
            textEl.style.opacity = 0;
        
            // 2. Aspetta il completamento del fade-out (2 secondi)
            setTimeout(() => {
            
                // 3. Incrementa gli indici
                slideCount++;
                index = (index + 1) % images.length;
            
                // 4. Logica di avanzamento del testo
                if (slideCount % slidesPerText === 0 && textIndex < texts.length - 1) {
                    textIndex++;
                }
            
                // 5. Carica la nuova slide e la nuova animazione
                showSlide(); 
                // 6. Aggiorna e mostra il nuovo testo
                showText();  
            
                // 7. Rimuove la classe dopo che la nuova slide è stata caricata
                slideEl.classList.remove('transitioning'); 
            
                // 8. Controllo di fine
                if (slideCount === totalSlides) {
                    clearInterval(slideInterval); // ferma il ciclo
                    fadeOutMusic();
                    mount.querySelector("#endFade").style.opacity = 1;
                    // Rimuovi i cuoricini rimasti
                    mount.querySelector("#hearts").innerHTML = "";
                }
            }, 2000); // 2000ms (2s) è il tempo di transizione opacità
        }
    
        let slideInterval = null;


        function goFullscreen() {
            const el = document.documentElement;
            const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
            if (!req) return; // Fullscreen non supportato (es. iOS): si prosegue normalmente
            try {
                const result = req.call(el, { navigationUI: "hide" });
                if (result && typeof result.catch === "function") result.catch(() => {});
            } catch (e) { /* ignora eventuali rifiuti del browser */ }
        }
    
        function startPresentation() {
            if (started) return;
            started = true;
        
            // Tutto schermo (deve essere chiamato durante il gesto del click)
            goFullscreen();
        
            music.currentTime = musicStartTime; 
            music.play().catch(()=>{});
            startScreen.style.opacity = 0;
            setTimeout(() => startScreen.style.display = "none", 1000);
        
            // La prima volta, carichiamo subito la slide 0 e il testo 0
            showSlide();
            showText();
        
            // Avviamo il ciclo dopo il primo intervallo completo
            slideInterval = setInterval(nextSlide, slideDuration); Session.timers.push({t: "i", h: slideInterval});
        
            // AVVIA LA GENERAZIONE DELLE PARTICELLE E LA SINCRONIZZAZIONE
            startParticleGeneration(); 
            scheduleBoosts();
            scheduleNextHeart(); // avvia i cuoricini casuali
        }
    
    
        startButton.addEventListener("click", startPresentation);
    
        // ==========================================================
        // FUNZIONI PARTICELLE E BOOST CORRETTE
        // ==========================================================
    
        function createParticle(boosted = false) {
            const particle = document.createElement("div");
            particle.classList.add("particle");
        
            // Direzione di rotazione casuale: le foglie avvolgono in entrambi i versi
            particle.style.setProperty("--spin", Math.random() < 0.5 ? 1 : -1);
        
            // Dimensione: 6-26px normale, 18-60px durante il boost
            const minSize = boosted ? 18 : 6;
            const maxSize = boosted ? 60 : 26;
            const size = minSize + Math.random() * (maxSize - minSize);
            particle.style.width = size + "px";
            particle.style.height = size + "px";
        
            // Posizione casuale
            particle.style.left = Math.random() * window.innerWidth + "px";
            particle.style.top = window.innerHeight + "px";
        
            // Colore casuale
            const colors = ["#f0b64c", "#e08a3c", "#c9502a", "#8c3a1a", "#a8551e", "#e6c04d"];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        
            // Durata: 2-6 secondi normale, 1-3 secondi potenziata (per maggiore velocità)
            const minDuration = boosted ? 1 : 2;
            const maxDuration = boosted ? 2 : 6;
            const duration = minDuration + Math.random() * (maxDuration - minDuration);
            particle.style.animationDuration = duration + "s";
        
            // Applica un ritardo di animazione per maggiore casualità (opzionale)
            particle.style.animationDelay = (Math.random() * 0.5) + "s";
        
            mount.querySelector("#particles").appendChild(particle);
        
            // Rimuovi dopo l’animazione
            setTimeout(() => particle.remove(), duration * 1000);
        }
    
    
        // Funzione per attivare e disattivare l'effetto boost
        function setBoost(state) {
            isBoosted = state;
        }
    
        // Boost CASUALI: ogni po' (intervallo casuale tra boostGapMin e boostGapMax)
        // si attiva per boostDuration uno "scoppio" di foglie, fino a fine carosello.
        function scheduleBoosts() {
            const gap = boostGapMin + Math.random() * (boostGapMax - boostGapMin);
            setTimeout(() => {
                // Ferma i boost quando il carosello è terminato
                if (!started || slideCount >= totalSlides) return;
                setBoost(true);
                setTimeout(() => setBoost(false), boostDuration);
                scheduleBoosts(); // pianifica il successivo boost casuale
            }, gap);
        }
    
        // Avvia la generazione continua delle particelle, ORA MODIFICATA
        function startParticleGeneration() {
             Session.timers.push({t: "i", h: setInterval(() => {
                if (started) {
                    let particleCount = 0; 
                
                    if (isBoosted) {
                        // Genera da 3 a 6 particelle durante il boost
                        particleCount = 3 + Math.floor(Math.random() * 4); 
                    } else {
                        // Modalità normale: 1 particella (con una probabilità del 90%)
                        if (Math.random() < 0.9) { 
                            particleCount = 1;
                        }
                    }
                
                    // Chiama la funzione createParticle in base al conteggio
                    for (let i = 0; i < particleCount; i++) {
                        createParticle(isBoosted);
                                            }
                }
            }, 300)}); 
        }
    
        // ===== CUORICINI INTERATTIVI (tocca per scoppiare!) =====
        let heartTimer = null;
    
        function scheduleNextHeart() {
            const gap = 6000 + Math.random() * 6000; // 6-12 secondi tra un cuore e l'altro
            heartTimer = setTimeout(spawnHeart, gap); Session.timers.push({t: "o", h: heartTimer});
        }
    
        function spawnHeart() {
            // Ferma i cuoricini quando il carosello è terminato
            if (!started || slideCount >= totalSlides) return;
        
            const heart = document.createElement("div");
            heart.classList.add("heart");
        
            // Dimensione grande e visibile: 60-120px
            const size = 60 + Math.random() * 60;
            heart.style.width = size + "px";
            heart.style.height = size + "px";
        
            // Posizione casuale (partono sotto lo schermo)
            heart.style.left = (Math.random() * Math.max(1, window.innerWidth - size)) + "px";
            heart.style.top = window.innerHeight + "px";
        
            // Durata del volo (risale lenta e ben visibile)
            const duration = 12 + Math.random() * 6; // 12-18 secondi
            heart.style.animationDuration = duration + "s";
        
            // Oscillazione casuale (pendolo a destra o a sinistra)
            heart.style.setProperty("--sway", Math.random() < 0.5 ? 1 : -1);
        
            // Tocca/clicca → scoppia
            heart.addEventListener("click", (e) => {
                e.stopPropagation();
                popHeart(heart);
            });
        
            mount.querySelector("#hearts").appendChild(heart);
        
            // Se non toccato, sparisce a fine volo
            setTimeout(() => { if (heart.parentNode) heart.remove(); }, duration * 1000);
        
            // Pianifica il prossimo cuoricino
            scheduleNextHeart();
        }
    
        function popHeart(heart) {
            const rect = heart.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const baseSize = rect.width;
        
            heart.remove(); // il cuore scoppia
        
            // Effetto a frammenti: piccoli cuori che volano in direzioni casuali
            for (let i = 0; i < 10; i++) {
                createHeartFragment(cx, cy, baseSize);
            }
        
            // Suono della sorpresa
            playAuguri();
        }
    
        function createHeartFragment(cx, cy, baseSize) {
            const frag = document.createElement("div");
            frag.classList.add("heart-fragment");
        
            const s = baseSize * (0.18 + Math.random() * 0.25);
            frag.style.width = s + "px";
            frag.style.height = s + "px";
            frag.style.left = (cx - s / 2) + "px";
            frag.style.top = (cy - s / 2) + "px";
        
            // Direzione e distanza casuali dell'esplosione
            const angle = Math.random() * Math.PI * 2;
            const dist = 70 + Math.random() * 130;
            frag.style.setProperty("--tx", (Math.cos(angle) * dist) + "px");
            frag.style.setProperty("--ty", (Math.sin(angle) * dist - 50) + "px"); // verso l'alto
        
            mount.querySelector("#hearts").appendChild(frag);
            setTimeout(() => { if (frag.parentNode) frag.remove(); }, 1200);
        }
    
        // ===== SUONI DEGLI AUGURI: shuffle senza ripetizioni dalla cartella auguri/ =====
        let AUGURI_FILES = [];   // elenco dei file mp3 (caricato all'avvio)
        let auguriQueue = [];    // coda shuffled, si rigenera quando finisce
        let lastPlayed = null;   // ultimo file suonato (evita ripetizioni immediate)
        const auguriCache = {};  // file -> oggetto Audio precaricato

        // Elenco di riserva (usato solo se non ci sono né directory listing né list.json)
        const AUGURI_INLINE = (cfg.auguri || []).slice();

        // Fisher-Yates shuffle (mescola in-place e ritorna l'array)
        function shuffleArray(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
            }
            return arr;
        }

        // Carica l'elenco dei file: prima auguri/list.json (fonte primaria), poi directory listing, infine inline
        async function loadAuguriList() {
            // 1) Manifest auguri/list.json (fonte primaria: su GitHub Pages e Live Preview non c'è directory listing)
            try {
                const r = await fetch((cfg.auguriBase || "auguri/") + "list.json");
                if (r.ok) {
                    const data = await r.json();
                    if (Array.isArray(data) && data.length) {
                        return data.filter(f => typeof f === "string" && f).map(f => f.split("/").pop());
                    }
                }
            } catch (e) { /* prosegue con la prossima sorgente */ }

            // 2) Directory listing (solo se list.json assente/vuoto; server tipo python -m http.server)
            try {
                const r = await fetch(cfg.auguriBase || "auguri/");
                if (r.ok) {
                    const html = await r.text();
                    const found = [...html.matchAll(/href="([^"?]+\.mp3)"/gi)]
                        .map(m => decodeURIComponent(m[1]).split("/").pop());
                    const files = [...new Set(found)];
                    if (files.length) return files;
                }
            } catch (e) { /* prosegue con la prossima sorgente */ }

            // 3) Fallback inline
            return AUGURI_INLINE;
        }

        // Prossimo file: coda shuffled; quando finisce, rimescola (senza ripetizioni nella sequenza)
        function nextAuguriFile() {
            if (auguriQueue.length === 0) {
                auguriQueue = shuffleArray(AUGURI_FILES.slice());
                // Evita che il primo suonato della nuova sequenza sia uguale all'ultimo appena suonato
                if (auguriQueue.length > 1 && auguriQueue[auguriQueue.length - 1] === lastPlayed) {
                    const last = auguriQueue[auguriQueue.length - 1];
                    auguriQueue[auguriQueue.length - 1] = auguriQueue[0];
                    auguriQueue[0] = last;
                }
            }
            const file = auguriQueue.pop();
            lastPlayed = file;
            return file;
        }

        // Precarica tutti gli audio (per riproduzione immediata allo scoppio)
        function preloadAuguri() {
            AUGURI_FILES.forEach(f => {
                const path = (cfg.auguriBase || "auguri/") + f;
                if (!auguriCache[path]) auguriCache[path] = new Audio(path);
            });
        }

        function playAuguri() {
            if (!AUGURI_FILES.length) return;
            const file = nextAuguriFile();
            if (!file) return;
            const path = "auguri/" + file;
            let a = auguriCache[path];
            if (!a) { a = new Audio(path); auguriCache[path] = a; }
            try { a.currentTime = 0; } catch (e) {}
            a.play().catch(() => {}); // ignora errori (file mancante, autoplay bloccato, ecc.)
        }

        // Carica l'elenco all'avvio pagina e precarica gli audio
        loadAuguriList().then(files => {
            AUGURI_FILES = files;
            preloadAuguri();
            console.log("Auguri disponibili:", AUGURI_FILES);
        });
    
        function fadeOutMusic(duration = 5000) {
            const steps = 30;
            const stepTime = duration / steps;
            let currentStep = 0;
        
            const fade = setInterval(() => {
                currentStep++;
                music.volume = Math.max(0, 1 - currentStep / steps);
                if (currentStep >= steps) {
                    clearInterval(fade);
                    music.pause();
                    music.currentTime = 0; // opzionale: resetta la traccia
                }
            }, stepTime);
        }
    
    try { if (music && cfg.musicUrl) { var srcEl = music.querySelector('source'); if (srcEl) music.load(); } } catch (e) {}
    return { stop: stop };
  }
  return { play: play, stop: stop };
})();
