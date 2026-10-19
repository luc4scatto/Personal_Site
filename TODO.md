# TODO

Punti aperti ordinati per rapporto tra effetto sul sito finale e lavoro richiesto. Aggiornato 2026-10-19 (quarto giro di critique).

## Critique, quarto giro (2026-10-19, 23/32)

Dettagli e spunte: https://claude.ai/artifact/NSxYmR8MCfeLwtaDYWDbUr. Chiusi dal terzo giro: pausa del grafico di Company Brain, banner cookie compatto, aree di tocco di Homelab, nav "Projects", pill piatte, ritmo delle sezioni, rail dei tool su Pipeline Projects, cavi di Vivatech, "What the pilot taught me", Monitoring nelle scelte di design, gergo spiegato, link CV, etichetta fissa del titolo in home, e gli oggetti 3D in famiglia (stessa colorazione della home via `src/objectStyle.js`, stessa luce, stesso riquadro e posto). Quattro progetti su desktop: provato e scartato, Luca preferisce la fila a tre che scorre.

- [x] **Oggetti 3D negli hero** - provati in tutte le varianti (ogni pagina, solo due, uniformati) e tolti il 19 ottobre: non funzionavano in alto. Hero e spazi tornati come prima; gotcha in `CLAUDE.md`. Pausa del grafico di Company Brain con icona sul bordo del grafico.
- [x] **Schema unico dei progetti** - etichetta "provenienza · tipo" uguale sull'hero di ogni pagina e sulla sua card in home (stessa chiave di `content.js`): "Work · Live installation" (Vivatech), "Work · Pipeline tools", "Work · AI assistant" (Company Brain), "Personal · Self-hosting" (Homelab). Card "next" e card in home con il solo nome ("Homelab"). Da confermare le parole con Luca.
- [x] **Aree di tocco** - footer, logo "LS" e controlli del mockup di Omniverse portati a 44px su touch con pseudo-elementi (misurato in emulazione).
- [ ] **Spunti dalla critique, non decisi** - Pipeline Projects potrebbe mostrare un tool per intero e gli altri quattro come card (oggi ~14 schermi su telefono); l'albero servizi di Homelab è ~5 schermi su telefono.
- [ ] **Ricontrollare su un telefono vero** - banner cookie ora 99px (prima ~140), aree di tocco di Homelab (close X e righe dei servizi) estese a 44px su touch, pill del grafico di Company Brain su due righe a 390px. Fatti e misurati in emulazione, non su un dispositivo.
- [ ] **Vivatech, resto del P2** - manca un primo piano del gesto o dell'interfaccia vicino a "How it works": serve una foto che non c'è. Da decidere: l'anteprima social (`og:image`, `vivatech-10.jpg`) mostra il pannello Louis Vuitton, e la copertina della pagina mostra i loghi Loro Piana e Moët Hennessy.
- [ ] **Card Homelab della home: foto intera** (descrizione della card aggiornata al cluster a 2 nodi + UNAS, prima diceva ancora TrueNAS e un solo mini PC) - ora è la foto frontale ritagliata (`object-position: 50% 70%`). Per vederla intera con un po' di sfondo serve una foto orizzontale (stesso punto di vista, un passo indietro) oppure una card verticale. Aspetta la scelta di Luca.

## Da decidere (restate dalla critique del 2026-10-11)

- [ ] **Frase dell'hero** - "Bringing ideas to life with 3D/2D" è la più generica del sito; il lavoro vero lo fa la riga del ruolo sotto. Per ora lasciata com'è (scelta di Luca, 2026-10-11). Proposte scartate: "From sketch to screen, I build the [3D/2D/AI] pipeline"; "Making 3D work for [eyewear/configurators/...]"; o frase invariata con sottotitolo più specifico.
- [ ] **Marquee al neon** - ripete il racconto delle skill ed è l'elemento più da catalogo della home. Tenerla o toglierla?
- [ ] **Player dei set: due tasti play** (il disco grande e quello piccolo nei controlli). Il piccolo fa da centro dei controlli, togliere il disco o il piccolo cambia il disegno del pannello.
- [ ] **Nuvola 3D dell'hero con WebGL lento o assente** - in una scheda in background la nuvola non si è disegnata ma l'invito "click on an object" restava. Non riprodotto con certezza; da guardare su un dispositivo vero.
- [ ] **Lettura con Tab dell'hero** - aggiunto il salto "Skip the 3D object list"; da provare con tastiera vera e con VoiceOver.

## Contenuto (quello che vede chi visita il sito)

- [ ] **4. Pipeline Projects: rileggere i testi e verificare la completezza dei mockup** - il punto più importante per il risultato: pagina pubblica sul lavoro vero, alcune frasi sono dedotte e non verificate (es. OpenPBR MaterialX "reads the same in any tool and renderer"). Riga `stack` e pill già sistemate. Controllare le parti forse mancanti (tab Color spec del widget Unreal, Datasmith/CAD import, material library). Costo: ~30-45 min insieme, le correzioni poi sono veloci.
- [ ] **5. Company Brain: risultato** - inserita la sezione "What the pilot showed" (prima di Design choices) dai documenti Use Case e Business Case di Luca, in forma generale: dati misurati del pilota (10 settimane, 7 utenti, 318 risposte, 566 interrogazioni, 82% con dati aziendali), tempi prima/dopo dichiarati come stime, rientro in circa tre mesi nel caso più prudente, nessun costo di licenza, estendibile ad altri reparti. Niente cifre in euro, nomi di sistemi o codici. Da rileggere con Luca prima del merge.
- [ ] **6. (in standby, Luca: non è ancora il momento) Merge di `preview/combined` su `main`** - unico modo per mettere online i commit. Dopo 4 e 5, così non vanno online testi non verificati. ~5 min più la verifica sul dev server.

## Rifiniture veloci (in blocco, prima del merge)

- [ ] **10. Misurare l'altezza minima della chat su desktop** (25rem) - solo verifica che non salti tra le scene. ~5 min.

## Rimandabili

- [ ] **11. Distanza player/cassetto su tablet (`is-overlay`)** - estetica, solo tablet. C'era una soluzione funzionante (mask-image del canvas più stretta) annullata prima del commit: prima decidere cosa si vuole. ~30-60 min. Dettagli in `CLAUDE.md`.
- [ ] **12. Logo del disco** - serve un PNG, va in `public/images/` e nel campo `label` di un set. ~5 min dopo averlo.

## Da scartare (proposta)

- [ ] **13. Linguette del cassetto su Firefox** - richiede ristrutturare `buildFolder()`/`riseSheet()` per una differenza estetica su un solo browser. Già valutato e rimandato: costo alto, guadagno basso.
- [ ] **14. Annunci della chat di Company Brain per screen reader** - scelta voluta: leggerebbe la digitazione lettera per lettera. Il demo è decorativo, il contenuto sta nel testo.

## Percorso consigliato

Prima la rilettura della sezione risultati di Company Brain (5), poi la rilettura di Pipeline Projects (4); in parallelo le decisioni su Vivatech (copertina e anteprima social) e sulla foto della card Homelab; infine 6 per andare online.
