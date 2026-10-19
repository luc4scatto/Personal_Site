# TODO

Punti aperti ordinati per rapporto tra effetto sul sito finale e lavoro richiesto. Aggiornato 2026-10-19 (ottavo giro di critique, 24/32).

## Critique, ottavo giro (2026-10-19, 24/32)

Dopo i P1-P3 e i minori del settimo giro (titolo di Pipeline con l'arancio solo su "Projects", contorno tinto nel mockup di Omniverse, etichetta delle stime non più maiuscola, nota dei risultati più stretta). Il revisore dà 24/32: il punto perso è il recupero dagli errori (4 -> 3) perché non ha provato l'invio fallito, mentre le misure automatiche confermano il modulo come prima. Nella sostanza 25/32: le rifiniture sono finite, per salire servono cambi di struttura. Zero errori in console, CLS massimo 0,018, nessun overflow, tocchi a 44px.

- [ ] **P1 Risultato di ogni tool in cima** (`/impeccable distill`) - "What changed" è il quarto blocco; spostarlo sotto il titolo, più grande, e metterlo anche sulle card dell'indice di Pipeline. "The interesting part" chiusa su telefono come "What it does". Su Company Brain l'82% compare nell'hero e nei risultati (voluto: l'hero rimanda ai risultati).
- [ ] **P2 Navigazione dalle pagine progetto** (`/impeccable layout`) - CV nella nav di ogni pagina progetto; i quattro progetti elencati sopra il footer oltre a "Next project".
- [ ] **P2 Servizi di Homelab su desktop** (`/impeccable layout`) - circa 25 servizi in un albero stretto da 1.500px: da 1024px categorie su 3-4 colonne sotto Proxmox, albero solo su telefono.
- [ ] **P2 Nuvola 3D sotto il primo schermo su telefono** (`/impeccable adapt`) - hero più compatto o nuvola dietro il titolo a opacità bassa. Tocca l'hero della home: decide Luca.
- [ ] **P3 Spazi tra le sezioni irregolari** - mezza schermata vuota dopo "Featured on" su Vivatech, sotto i servizi di Homelab, tra le sezioni di Company Brain.
- [ ] **Minori** - testo del mockup di Omniverse a 10,9-11,5px (è l'unico mockup letto dagli screen reader); etichette dei nodi dei servizi di Homelab a 11,2px su telefono; contatore 1/4 anche sul carosello desktop; passi "Chat / Language model / Tools / Company systems" da numerare o collegare; hint dell'hero poco visibile.

## Critique, settimo giro (2026-10-19, 25/32)

Fatti prima del giro (suggerimenti del sesto): dato del pilota sotto il titolo di Company Brain ("82% of 318 answers needed live company data", link ai risultati); LXC, OpenPBR ed Editor Utility Widgets spiegati alla prima comparsa; "tap an object" su touch nell'hint della home; una riga "What changed" per ognuno dei cinque tool (qualitativa, ricavata da quello che il tool fa: da sostituire con un numero misurato quando c'è). Il voto resta 25/32: i punti chiesti sono chiusi, il nuovo revisore alza l'asticella. Archivio: `.impeccable/critique/` (giro del 2026-10-19 sera).

- [x] **P1 Titolo della home** - resta com'è (Luca, 19 ottobre, seconda conferma dopo l'11 ottobre). Non riproporlo.
- [x] **P2 Skill su telefono a 9,6px** - fatto: etichette e categorie a 12px, colonna delle categorie da 18 a 20px.
- [x] **P2 Pagine progetto lunghe su telefono** - fatto: su telefono e tablet stretto (sotto 700px) "What it does" è chiuso dietro "Show all N points" (Pipeline da 12.300 a 11.000px); galleria di Vivatech in una riga a scorrimento, foto alte 20rem (pagina da 8.700 a 5.800px). Chip fisso del tool attivo non fatto: c'è già "All five tools" in fondo a ogni capitolo.
- [x] **P2 Demo di Company Brain che si apre vuota** - fatto: la domanda c'è dal primo frame, si gioca solo la risposta (tolta la digitazione nel campo, cursore e relativo CSS).
- [x] **P2 Banner cookie** - fatto: Decline è una pill come Accept, in neutro.
- [x] **P3 Rail dei tool senza nomi** - fatto: il nome del tool appare per 1,8s quando si arriva al suo capitolo; su telefono la nav torna ad avere About (nascosto solo Skills).
- [ ] **Minori** - arancio del titolo diverso tra pagine (parola intera su Homelab e Pipeline, ultima parola su Vivatech e Company Brain); side-tab a 3px sulle sezioni arrotondate del mockup di Omniverse; nota dei risultati di Company Brain a ~93 caratteri per riga su desktop; "CV" largo 20px su touch da ricontrollare; scritta del video di Vivatech sotto i controlli nativi.

## Critique, quinto giro (2026-10-19, 23/32)

Dettagli e spunte: https://claude.ai/artifact/NSxYmR8MCfeLwtaDYWDbUr. Archivio: `.impeccable/critique/2026-10-19T14-46-06Z__index-html.md`. Fatti il 19 ottobre:

- [x] **Chat di Company Brain che saltava** - ogni scena prende l'altezza della più alta, contando anche i puntini di "sta scrivendo" (`evenOut()` in `companyBrainDemo.js`, ricalcolato al resize e a font caricati); barra su una riga, domanda digitata su una riga con i puntini di sospensione. CLS a 390 da 0,189 a 0; a 1440 resta a volte ~0,06 nei primi 100ms di caricamento, intermittente (font), 0,001 nella build di produzione.
- [x] **Titolo delle pagine progetto lento** - sulle pagine senza le righe mascherate della home l'ingresso parte a 0,05s invece di 0,45s (`animations.js`): titolo di Company Brain visibile al 78% a 0,5s invece di 0.
- [x] **Risultati di Company Brain** - "Pilot results": prima la riga "Measured" (10 settimane, 7 persone, 318 risposte, 566 interrogazioni) e l'82% in una frase; sotto "Team estimates" come prima/dopo barrato (scheda prodotto, report di collezione, componente standard); il rientro in tre mesi in una frase; "Built to spread" in chiusura. Niente più eco con "What the pilot taught me".
- [x] **Ruolo, periodo e stato in ogni hero** - `.project-facts` (era `.cb-meta`; il nome `.project-meta` esisteva già su privacy e 404). Vivatech: "Built the real-time experience / 2026, for Vivatech Paris / Shown live at the event"; Homelab: "Designed, built and run it / Ongoing / In daily use"; Pipeline Projects: "Designed and built them / Team: 3D R&D, Thélios / In use by the team". Vivatech ha una riga di risultato sopra "Featured on".
- [x] **Nav del telefono** - sotto i 560px la home mostra solo Projects, Contact e CV.
- [x] **Aree di tocco** - logo, link della nav e del footer larghi almeno 44px su touch; link di "Featured on" estesi; righe dei servizi di Homelab a 44px pieni.
- [x] **Minori** - poster del video di Vivatech: un fotogramma del video a 7s (designer alla postazione CAD) al posto del cielo; "Contact" nel footer della home; "read-only" nella chat di Company Brain con una spiegazione al passaggio del mouse.
- [x] **Ruolo, periodo e stato confermati** - Pipeline Projects: "2023 - today" (Luca, 19 ottobre).
- [x] **Video di Vivatech** - va bene così (scelta di Luca, 19 ottobre): non toccarlo.
- [ ] **Lasciati com'erano** - skill "Second Brain" e "Agentic Workflow" (nomi scelti da Luca); su telefono le card domanda della demo di Company Brain mostrano la descrizione solo per quella attiva (voluto).

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

## Rimandabili

- [ ] **11. Distanza player/cassetto su tablet (`is-overlay`)** - estetica, solo tablet. C'era una soluzione funzionante (mask-image del canvas più stretta) annullata prima del commit: prima decidere cosa si vuole. ~30-60 min. Dettagli in `CLAUDE.md`.
- [ ] **12. Logo del disco** - serve un PNG, va in `public/images/` e nel campo `label` di un set. ~5 min dopo averlo.

## Da scartare (proposta)

- [ ] **13. Linguette del cassetto su Firefox** - richiede ristrutturare `buildFolder()`/`riseSheet()` per una differenza estetica su un solo browser. Già valutato e rimandato: costo alto, guadagno basso.
- [ ] **14. Annunci della chat di Company Brain per screen reader** - scelta voluta: leggerebbe la digitazione lettera per lettera. Il demo è decorativo, il contenuto sta nel testo.

## Percorso consigliato

Prima la rilettura di Pipeline Projects (4) e dei risultati di Company Brain (5), infine 6 per andare online.
