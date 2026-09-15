# CLAUDE.md

Guida per Claude Code su questo repo.

## Project

Portfolio personale di Luca Scattolin (contenuti in inglese), deploy su GitHub Pages. Stack: Vite + vanilla JS/CSS + GSAP + Three.js. Nessun framework - non introdurre React/Vue/ecc.

- Repo: https://github.com/luc4scatto/Personal_Site (pubblico)
- Live: https://luc4scatto.github.io/Personal_Site/
- Ogni push su `main` fa auto-deploy (GitHub Actions, Pages workflow)
- **Push policy: mai commit/push senza OK esplicito di Luca** - verifica sempre sul dev server prima

## Comandi

- `npm run dev` - dev server con HMR, http://localhost:5173/
- `npm run build` - build di produzione in `dist/`
- `npm run preview` - serve la build di produzione (verifica il base path di GitHub Pages)

## Pagine

Vite MPA, input in `vite.config.js`: `index.html` (home), `vivatech.html`, `homelab.html`, `privacy.html`, `404.html`.

## File chiave

- `src/main.js` - entry point, nav, GSAP init, import dinamici (hero3d, skillDrawer, homelabDiagram, homelabHardware)
- `src/animations.js` - animazioni GSAP + ScrollTrigger
- `src/hero3d.js` - scena Three.js dell'hero
- `src/skillDrawer.js` - sezione Skills come cassetto 3D (solo desktop, >701px)
- `src/setPlayer.js` - player DJ set (streaming da SoundCloud, non file ospitati sul sito)
- `src/content.js` - copy del sito
- `src/styles/base.css` - reset, custom properties (colori, spacing, typography)
- `src/styles/sections.css` - layout e stili per sezione
- `public/models/*.glb` - modelli 3D Draco-compressi

## Vincoli

- `vite.config.js` ha `base: '/'` (dominio custom in root, non subpath) - il dev server serve tutto su `http://localhost:5173/`, non `/Personal_Site/`
- Tutte le animazioni devono rispettare `prefers-reduced-motion`
- Mobile-first; verificare i layout a dimensioni reali (phone 390, tablet 744/820/1024, laptop 1366, desktop 1440) con Chrome DevTools
- Copy: niente em dash, solo trattino breve `-`

## Gotchas (cose già provate e fallite - non riprovare)

- **Responsive non è una sola query**: 3 breakpoint (700px stack hero, 560px/700px skill tiles). `STACKED_HERO` in `hero3d.js` mirra a mano il breakpoint 700px/1024px-portrait per la distanza camera - se cambi la query CSS cambia anche lì. `DRAWER_MODE` in `main.js` decide a 701px, una volta sola al load, se caricare il drawer 3D o il wall piatto - resize dopo il load non cambia modalità, serve reload.
- **Skill drawer** (`src/skillDrawer.js`, solo >701px): i folder sono i veri `<li data-skill>` del DOM portati dentro `CSS3DObject` (serve testo reale/a11y, non billboard WebGL). Hit target è una striscia `::before` sopra il tab, non l'intera card (la card è 320px e sennò intercetta i tab dietro). Selezionare un folder sposta la card, mai la rotaia (spostare la rotaia spingeva gli altri folder fuori dal cassetto). Camera a 17° (tele) per non far sembrare cassetto e mobile due pezzi separati. Interno del cassetto: materiale nero piatto, non metallo scuro (altrimenti cattura l'ambiente e sembra un pavimento). Il cassetto parte chiuso e si apre solo su interazione reale (click/drag/focus) - un IntersectionObserver bruciava il gesto prima che l'utente guardasse.
- **Card del cassetto su tablet (`is-overlay`)**: la card è autorata 250x320 e renderizzata con una scala 3D uniforme, quindi **la sua dimensione di testo È la sua scala**. A 0.25 di larghezza frame (`PICK_W`) su un box da 670px il corpo testo da 12px rendeva a 8px: illeggibile. Sotto `OVERLAY_MAX_W = 980` px di **box misurato** (non media query: niente gemello CSS da tenere in sync, e una rotazione ridecide da sola in `resize()`) la card passa a `PICK_W_WIDE = 0.62` e il mobile non slitta più (`pickShift()` ritorna 0). Non si centra: resta ancorata in basso e si sposta a sinistra della fascia riservata al player (`PLAYER_RESERVE_PX`, gemella di `sections.css`'s `width: min(17rem, 40%)` sul `.set-player` overlay - cambiane uno, cambia l'altro), così card e player non si sovrappongono mai. Risultato 15.7px a 744, 16.2px a 1024. Dietro si attenua **sia il canvas che le cartelle non aperte**, ma con proprietà diverse: il canvas va a `opacity` (0.82) perché non è un target cliccabile, le cartelle invece solo a `filter: blur()`, mai `opacity`, perché `cull()` scrive `opacity` inline ogni frame sulle cartelle e toglie i `pointer-events` sotto 0.6 - abbassarla da CSS costerebbe all'indice i suoi bersagli di click. Le etichette di categoria si nascondono con `visibility` e non `opacity` per lo stesso motivo.
- **DJ player** (`src/setPlayer.js`): audio mai ospitato sul sito, streamma da un iframe SoundCloud nascosto via Widget API (no API key richiesta, a differenza della REST API a pagamento). L'oggetto "engine" ha la stessa forma di `<audio>` (currentTime/duration/play/pause) cosi il resto del codice (waveform, scrub, keyboard) non sa che sotto c'è un iframe. Waveform disegnata da peak committati (`tools/peaks.js`, RMS non picco assoluto - un mix masterizzato ha un picco quasi piatto), mai dall'audio live. Seek si conferma solo su `pointerup`, mai su `pointermove` (altrimenti flood di seek). Il pannello arriva con 5s di ritardo solo in entrata (il drawer che si apre è il momento da guardare, non deve competere).
- **Hero cloud drag** (`src/hero3d.js`): rotazione via quaternioni premoltiplicati, non euler (euler inverte l'asse Y oltre un certo tilt). Il tilt residuo si smorza da fermo (`settleRoll`), non si vincola durante il drag (vincolarlo crea un polo dove il drag laterale smette di funzionare). Lo sfocato di movimento è finto: riusa la pipeline di blur del focus, nessun buffer di velocità.
- **Pipeline modelli 3D**: `npx @gltf-transform/cli optimize <src>.glb public/models/<name>.glb --compress draco` (raw ~29MB → ~70-180KB). Se il mesh si spappola in un blob senza variazione di colore per parte, riaggiungi `--join false` (il join di default fonde le mesh che condividono materiale). FBX si converte prima con Blender headless (vedi script in `_originals/`).
- `.info-card` (card oggetto 3D hero, `sections.css`) ha ancora un `border-left` residuo mai rimosso - un giorno da allineare allo stile della skill card.

## TODO

- **DJ set reali**: player e engine SoundCloud pronti ma mai testati con un set vero (`content.djSets` ha `track` vuoto, quindi il modulo non monta in produzione). Serve: caricare i set su SoundCloud, girare `tools/peaks.js` sui file locali, incollare gli URL in `content.djSets`, poi verificare in browser reale autoplay/gesture, seek, evento `ERROR`.
- **Logo del disco**: Luca deve fornire un PNG, va in `public/images/` e referenziato nel campo `label` di un set.
- **Distanza player/cassetto su tablet (`is-overlay`)**: a riposo (nessuna card aperta) l'invito `.set-player__invite` e il pannello player sembrano troppo vicini al cassetto - provato a stringere il mask-image del canvas (`#skill-drawer.is-live .drawer__scene.is-overlay canvas`) per far sfumare il metallo prima, funzionava ma è stato annullato su richiesta di Luca prima del commit. Da riprendere: il vero problema è che `.set-player`'s width è cresciuto da 11rem a 17rem (per non far uscire lo slider volume) senza mai spostare la posizione (`right: 0.8%`), quindi il pannello ora parte al ~70% del box overlay, dentro alla zona dove il fade del canvas (62%→100%) è appena iniziato, non finito.

## In lavorazione

Sezione Skills (`src/skillDrawer.js`, `sections.css`), tablet/`is-overlay`: risolti leggibilità card, player che spariva, overflow interno player, nero pieno in fondo alla card, blur di cassetto+cartelle quando una card è aperta. Aperto: la distanza player/cassetto a riposo (vedi TODO sopra).
