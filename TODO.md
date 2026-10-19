# TODO

Punti aperti ordinati per rapporto tra effetto sul sito finale e lavoro richiesto. Aggiornato 2026-10-19 (decimo giro di critique, 25/32).

## Critique, decimo giro (2026-10-19, 25/32)

Dopo il giro, su richiesta di Luca: copertina del video di Vivatech di nuovo il primo fotogramma; stato di Pipeline "In use by the 3D team"; foto frontale di Homelab di nuovo accanto al retro (hero solo testo e riga di risultato); servizi di Homelab con etichetta N1/N2 per nodo e legenda, WireGuard tolto (non è un servizio a sé).

Dopo tutti i punti del nono giro. Voto stabile a 25/32 (quattro giri su cinque): tutto quello che si misura è pulito (CLS in produzione al massimo 0,008, zero errori, testo a 12px, tocchi a 44px), i revisori ora cambiano idea tra un giro e l'altro (il risultato sulle card, chiesto all'ottavo, al decimo è una ripetizione). Restano punti di contenuto.

- [x] **P1 Riga di risultato per Vivatech e Homelab** - fatto: Homelab "Over twenty services in daily use..."; Vivatech "Live for all four days of Vivatech, which drew more than 200,000 visitors. People stayed for the gestures: no buttons, just their hands." (200.000 è la cifra degli organizzatori per tutto l'evento, non per lo stand: un conteggio dello stand non esiste; 17-20 giugno, stand aperto tutti e quattro i giorni).
- [x] **P1 Pipeline ripete il risultato** - fatto (scelta di Luca: solo nei capitoli): le card dell'indice mostrano di nuovo solo il problema, tolti i campi `outcome` da `content.js`.
- [x] **P2 Vivatech la pagina meno costruita** - galleria lasciata intera (scelta di Luca: tutte le foto sono interessanti).
- [x] **P3 Rail di Pipeline** - fatto: numero 1-5 su ogni icona (contatore CSS).
- [x] **P3 Minori** - fatto: "All projects" su due colonne (niente più Homelab da solo); grassetti tolti dai nomi di prodotti e servizi nei testi di Pipeline e Homelab; "I usually reply within a few hours" in testo normale.

## Critique, nono giro (2026-10-19, 25/32)

Dopo tutti i punti dell'ottavo giro. Voto di nuovo 25/32: il revisore ha letto il codice del modulo e ridà 4 al recupero dagli errori. Zero errori in console, nessun testo visibile sotto 12px, tocchi a 44px. Il CLS sul dev server (fino a 0,075 su Pipeline desktop) viene dal CSS iniettato da Vite in sviluppo: sulla build di produzione è 0 sulle pagine progetto e 0,014 in home. Aggiunto comunque un fallback metrico per Space Grotesk (`base.css`) per lo scambio di font su reti lente.

- [x] **P1 Pipeline ripetitivo su telefono** - fatto: sotto 700px l'indice è un elenco di cinque link (icona e nome), ogni capitolo mostra il mockup subito dopo titolo, strumenti e "What changed" (`.pp-tool__text` in `display: contents` e `order`). Pagina da 10.700 a 10.000px.
- [x] **P2 Spazi vuoti su telefono** - fatto in home: margine sotto il cassetto delle skill da 3,5rem a 1rem. Lo spazio sotto la chat di Company Brain resta: è l'altezza uguale per tutte le scene che evita lo spostamento del layout.
- [x] **P2 Hero delle pagine progetto con la prova** - fatto (scelta di Luca): Company Brain con "82%" grande accanto alla frase; Vivatech apre con il video (16:9) e la foto dello stand scende al posto del video; Homelab con la foto frontale del rack accanto al titolo (`.page-hero--split`), la foto del retro resta accanto alla scheda tecnica a metà larghezza.
- [x] **P2 Banner cookie su telefono** - fatto: `body` con `padding-bottom` pari all'altezza del banner e `scroll-padding-bottom` uguale, così Send e lo stato del modulo escono da sotto; link della privacy a 44px su touch.
- [x] **P3 Incoerenze** - orari del player a 12px. Lasciati com'erano: "View project" (card in home) e "Next project" (in fondo ai progetti) dicono cose diverse; il pulsante pieno del modulo è l'azione principale della pagina, quello contornato dell'hero è un rimando.

## Critique, ottavo giro (2026-10-19, 24/32)

Dopo i P1-P3 e i minori del settimo giro (titolo di Pipeline con l'arancio solo su "Projects", contorno tinto nel mockup di Omniverse, etichetta delle stime non più maiuscola, nota dei risultati più stretta). Il revisore dà 24/32: il punto perso è il recupero dagli errori (4 -> 3) perché non ha provato l'invio fallito, mentre le misure automatiche confermano il modulo come prima. Nella sostanza 25/32: le rifiniture sono finite, per salire servono cambi di struttura. Zero errori in console, CLS massimo 0,018, nessun overflow, tocchi a 44px.

- [x] **P1 Risultato di ogni tool in cima** - fatto: "What changed" sotto il titolo di ogni tool, più grande; versione corta (`outcome` in `content.js`) sulle card dell'indice; "The interesting part" chiusa su telefono dietro "Read how it works". L'82% doppio su Company Brain è voluto (l'hero rimanda ai risultati).
- [x] **P2 Navigazione dalle pagine progetto** - fatto: CV nella nav delle quattro pagine progetto; "All projects" con i quattro link (quello corrente in arancio) sopra "Get in touch".
- [x] **P2 Servizi di Homelab su desktop** - fatto: da 1200px Proxmox in alto con la sua card accanto, tre tronchi su un bus (categorie divise in ordine e bilanciate per righe in `homelabDiagram.js`), la card di un servizio si apre nella sua colonna; albero da 1.420 a 740px. Sotto 1200px un tronco solo come prima. Sistemata anche la X della card su touch, che finiva in alto a sinistra.
- [x] **P2 Nuvola 3D sotto il primo schermo su telefono** - fatto (scelta di Luca: hero più compatto): sotto 700px meno spazio tra le righe, sottotitolo e testo più piccoli; la nuvola parte a ~520px invece di 660.
- [x] **P3 Spazi tra le sezioni irregolari** - fatto: Vivatech (`body.vt-page`) con padding finale delle sezioni a 0,55 di `--space`, salti da 150-200px a 110-160px come le altre pagine.
- [x] **Minori** - fatto: etichette del mockup di Omniverse a 12px (solo quello, gli altri sono decorativi); nome di Proxmox nel diagramma a 12px su telefono; contatore del carosello anche su desktop ("1-3 / 4"); passi di Company Brain numerati 01-04; hint dell'hero a piena opacità e un po' più grande.

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
