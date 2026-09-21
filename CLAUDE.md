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
- **DJ player su iOS (play al primo tap e "next set")**: iOS rifiuta ogni play che non arriva dentro il tap, e il primo `play()` del widget deve prima risolvere lo stream (~250ms di rete) - log: PLAY e PAUSE da soli, silenzio; il secondo tap andava perché lo stream era già risolto. Fix: su `(pointer: coarse)` ogni engine fa un play "di riscaldamento" muto al READY (`startWarm`/`endWarm`). Per il next: **un iframe per set** (`engines`, 4), tutti creati e riscaldati al load della pagina, e il next è solo uno swap dentro il click (play del nuovo, pausa del vecchio). Già provati e **falliti**, non riprovarli: `widget.load()` sullo stesso iframe (documento nuovo, stream freddo, READY dopo ~700ms fuori gesture), `askPlay()` subito dopo `load()` dentro il click, e una coppia di iframe con lo spare ricaricato+riscaldato durante l'ascolto - iOS suona un solo media element per pagina, quindi il play muto dello spare metteva in pausa il set in ascolto. Regola: **mai un play (neanche muto) mentre un set suona**. Limite noto: l'avanzamento automatico a fine set non ha tap dietro, su iOS può fermarsi con la nota "Tap play". La playlist SoundCloud con `widget.skip(i)` non serve più.
- **Hero cloud drag** (`src/hero3d.js`): rotazione via quaternioni premoltiplicati, non euler (euler inverte l'asse Y oltre un certo tilt). Il tilt residuo si smorza da fermo (`settleRoll`), non si vincola durante il drag (vincolarlo crea un polo dove il drag laterale smette di funzionare). Lo sfocato di movimento è finto: riusa la pipeline di blur del focus, nessun buffer di velocità.
- **Pipeline modelli 3D**: `npx @gltf-transform/cli optimize <src>.glb public/models/<name>.glb --compress draco` (raw ~29MB → ~70-180KB). Se il mesh si spappola in un blob senza variazione di colore per parte, riaggiungi `--join false` (il join di default fonde le mesh che condividono materiale). FBX si converte prima con Blender headless (vedi script in `_originals/`).
- `.info-card` (card oggetto 3D hero, `sections.css`) ha ancora un `border-left` residuo mai rimosso - un giorno da allineare allo stile della skill card.
- **Budget GPU su tablet (iPad Pro 11", Chrome iOS = WebKit)**: la pagina tiene due contesti WebGL (hero3d + skillDrawer) sullo stesso budget, e a `devicePixelRatio` 2 non ci sta - animazioni a scatti su tutta la pagina, marquee che si inceppa o sparisce (layer composito da ~7000px sfrattato sotto pressione), prima riga dell'h1 sfocata (layer GSAP rasterizzato a scala ridotta e riscalato). Tre cose insieme, non una: `setPixelRatio(min(dpr, 1.5))` su `(pointer: coarse)` in **entrambi** i renderer (touch, non larghezza: un iPad Pro 11" in landscape è 1194px, desktop per qualsiasi media query); `hero3d.js` non tiene più un `setAnimationLoop` perpetuo ma lo spegne fuori schermo e a tab nascosta (un oggetto a fuoco lo tiene acceso: la sua card è `position: fixed` e la posiziona solo il loop; e va assorbito il buco temporale al rientro con `timer.setTimescale(0)`, o la nuvola salta in una posa diversa); `clearProps: 'transform'` dopo il reveal dell'h1, stessa cura già applicata all'h2. **Antialias resta acceso**: i modelli hanno spigoli duri e l'aliasing si vede più del calo di dpr.
- **`filter: blur()` per-cartella (`is-overlay`) era troppo caro su iPad**: attenuare le cartelle non aperte con `filter: blur(3px)` sono 21 pass di raster offscreen ricompositati in 3D a ogni frame di pump. Su iPad Chrome buttava giù il framerate di tutta la sezione. Ora la regola è dietro `@media (hover: hover) and (pointer: fine)` - stessa condizione degli hover, poco sopra. Il blur singolo sul canvas resta: è uno, non ventuno, e basta a far leggere la card come l'unica cosa a fuoco. Su touch il `.folder__sheet` ricade sulla transizione base (`transform` + `border-color`), che è quello che c'era prima della feature.
- **Card aperta compenetrata dalle cartelle davanti (`is-overlay`)**: in overlay `pickShift()` ritorna 0 di proposito, quindi la card non ha una colonna sua e finisce sopra le cartelle filed in testa al cassetto, che sporgono a sinistra oltre la faccia. `PICK_PULL = 2` è davanti al **centro** della faccia, non davanti a quelle. Misurato a 1194x834: centri di card e cartella 0 a 1.3 unità, somma delle semi-diagonali 6.33 - i due piani si intersecavano, e un layer CSS3D non ha profondità per pixel: il browser ordina elementi interi e può scegliere l'uno o l'altro. Chrome dava ragione alla card, WebKit su iPad alla cartella (Blender, slot 0), su tutte le card. Fix: `pickPull()` ritorna 8 in overlay - separazione 7.3 contro 6.33, nessun caso quasi-coplanare da ordinare. **È gratis a schermo**: `pickTarget()` ricava `pxPerUnit` dalla stessa profondità e compensa nella scala, quindi la card resta identica in pixel (verificato: 401x514 a x=183 prima e dopo). Riproducibile su Chrome desktop a 1194x834, non serve l'iPad.
- **Decorazioni dentro il sottoalbero CSS3D (bug Firefox)**: Firefox rasterizza i figli annidati di un elemento CSS3D alla scala locale (minuscola) dell'elemento e poi ingrandisce il risultato, quindi bordi, outline e ombre disegnati lì dentro rendono molto più spessi del dovuto. Misurato sul browser reale: un `outline: 2px` su `.folder` rende giusto, lo stesso 2px su un figlio annidato rende ~4x. Il bordo da 1px di `.folder__sheet` diventava una fascia spessa color brand attorno alla card aperta; Chrome e Safari disegnano alla scala finale e non lo mostrano. **Regola: niente bordi/outline/ombre sui figli, vanno sull'elemento che porta la `matrix3d` (`.folder`)** - vedi le regole `.folder.is-landed` in `sections.css`, legate a `.is-landed` e non a `.is-open` perché quest'ultima arriva al click, con il foglio ancora in salita, e incornicerebbe il vuoto. Ipotesi già provate sul browser dell'utente e **fallite**, non riprovarle: `translate3d` al posto di `translateY`, `will-change: transform`, togliere `mask-image` dal `.folder`, `border-radius: 0`, `overflow: visible` e `box-shadow: none` sul foglio. Non riproducibile con Playwright (Firefox stock e build Playwright, headless e headed, rendono correttamente) - serve il Firefox reale dell'utente.

## TODO

- **Peaks dei set mancanti**: `content.djSets` punta a `/peaks/round-trax-*.json` ma `public/peaks/` contiene solo `dev-set.json`. Tutti e 4 i fetch danno 404, `loadPeaks()` cachea `null` e la waveform è la riga piatta a `v = 0.22`. Serve girare `tools/peaks.js` sui file locali dei set e committare i JSON.
- **Logo del disco**: Luca deve fornire un PNG, va in `public/images/` e referenziato nel campo `label` di un set.
- **Linguette del cassetto su Firefox**: le cartelle ancora filed nel cassetto rendono la linguetta come una fascia spessa e satura, stesso bug di rasterizzazione del gotcha qui sopra (il bordo del foglio ingrassato). Sulla card aperta è risolto spostando il bordo su `.folder`; per le cartelle a riposo non si può, perché il `.folder` è alto tutta la card mentre se ne vede solo la linguetta - un bordo lì incornicerebbe il vuoto. Il fix vero è ristrutturare `buildFolder()`/`riseSheet()` in `skillDrawer.js` così che il box sia alto quanto la linguetta e cresca all'apertura (con la salita ricalcolata). Valutato e rimandato: intervento sul cuore della sezione per una differenza estetica su un solo browser.
- **Distanza player/cassetto su tablet (`is-overlay`)**: a riposo (nessuna card aperta) l'invito `.set-player__invite` e il pannello player sembrano troppo vicini al cassetto - provato a stringere il mask-image del canvas (`#skill-drawer.is-live .drawer__scene.is-overlay canvas`) per far sfumare il metallo prima, funzionava ma è stato annullato su richiesta di Luca prima del commit. Da riprendere: il vero problema è che `.set-player`'s width è cresciuto da 11rem a 17rem (per non far uscire lo slider volume) senza mai spostare la posizione (`right: 0.8%`), quindi il pannello ora parte al ~70% del box overlay, dentro alla zona dove il fade del canvas (62%→100%) è appena iniziato, non finito.

## In lavorazione

Sezione Skills (`src/skillDrawer.js`, `sections.css`), tablet/`is-overlay`: risolti leggibilità card, player che spariva, overflow interno player, nero pieno in fondo alla card, blur di cassetto+cartelle quando una card è aperta. Aperto: la distanza player/cassetto a riposo (vedi TODO sopra).

Resa su Firefox: risolta la cornice spessa attorno alla card aperta (bordo spostato su `.folder`, vedi gotcha) e verificato pixel a pixel che Chrome e Safari non cambino. Restano le linguette dentro il cassetto (vedi TODO).

Resa su iPad Pro 11" (Chrome iOS): risolti il framerate generale, il marquee che si inceppava, la prima riga dell'h1 sfocata e le cartelle che compenetravano la card aperta - vedi i tre gotcha sul budget GPU, sul blur per-cartella e su `pickPull()`. Risolti anche play al primo tap e "next set" del player (vedi gotcha DJ player su iOS).
