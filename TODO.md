# TODO

Punti aperti ordinati per rapporto tra effetto sul sito finale e lavoro richiesto. Aggiornato 2026-10-19.

## Critique, terzo giro (2026-10-19, 23/32)

Dettagli e spunte: https://claude.ai/artifact/NSxYmR8MCfeLwtaDYWDbUr. Fatti il 19 ottobre dopo la critique: pausa sul grafico di Company Brain, banner cookie compatto su telefono, "Projects" nella nav delle sottopagine e pill di Pipeline Projects piatte, aree di tocco di Homelab, pill del grafico a capo su telefono. Falsi allarmi: il contrasto del testo (misurato su tutte le pagine: passa ovunque), le aree di tocco di nav e footer (già estese con pseudo-elementi), il finale delle sottopagine (c'è già il progetto successivo e il contatto). Dal giro precedente sono fatti: titolo di Vivatech senza trattino, diagramma Homelab scorrevole con etichette a 12px, spazio sotto il mobile chiuso, skill su telefono. Quattro progetti su desktop: provato e scartato, Luca preferisce la fila a tre che scorre.

- [ ] **[P1] Sottopagine: la voce** - quasi chiusa. Fatto: un oggetto 3D trascinabile nell'hero di ogni progetto (occhiali su Vivatech, portatile su Pipeline Projects, server su Homelab, chip su Company Brain; `src/heroObject.js`, il portatile è costruito con scatole nei colori del sito perché non c'è un modello), cavi del flusso di Vivatech con un impulso, rail laterale dei tool su Pipeline Projects (da 1280px), titolo "What the pilot taught me" al posto di "Looking back" e sottotitolo "What I learned" nascosto (resta per gli screen reader). Da decidere: gli altri titoli proposti (Vivatech "What a visitor does", "What took the most care"; Company Brain "Four rules I kept", "Where it stops"; Pipeline "What I built") non sono applicati.
- [ ] **Ricontrollare su un telefono vero** - banner cookie ora 99px (prima ~140), aree di tocco di Homelab (close X e righe dei servizi) estese a 44px su touch, pill del grafico di Company Brain su due righe a 390px. Fatti e misurati in emulazione, non su un dispositivo.
- [ ] **Vivatech, resto del P2** - manca un primo piano del gesto o dell'interfaccia vicino a "How it works": serve una foto che non c'è. Da decidere: l'anteprima social (`og:image`, `vivatech-10.jpg`) mostra il pannello Louis Vuitton, e la copertina della pagina mostra i loghi Loro Piana e Moët Hennessy.
- [ ] **Card Homelab della home: foto intera** - ora è la foto frontale ritagliata (`object-position: 50% 70%`). Per vederla intera con un po' di sfondo serve una foto orizzontale (stesso punto di vista, un passo indietro) oppure una card verticale. Aspetta la scelta di Luca.
- [ ] **Minori, fatti il 19 ottobre** - gergo spiegato (CHOPs, OSC, PIM, DAM), `aria-label` fisso sul titolo della home con la parola che cambia, link "CV" nella nav della home, "Monitoring" diventato la quinta riga delle scelte di Company Brain, legenda Homelab a 0.95rem, width/height sulla copertina di Vivatech, la frecce di "How it works" ora sono cavi visibili. Falsi allarmi: i titoli a x=172 (era l'inizio dell'animazione, a riposo sono allineati), il reduced-motion di Homelab (c'è già, righe 584-586), la transizione su `margin-bottom` del cassetto (voluta, documentata in `CLAUDE.md`), il testo a 10.9px nel mockup di Omniverse (miniatura fedele dell'interfaccia vera), il video da 6.8MB (ha già `preload="metadata"`), il testo sfumato dell'invito (è la firma "hint-shine", usata in tre punti).
- [ ] **Pulizia** - `.cb-monitor` in `sections.css` (righe 6084 e dintorni) è CSS morto dopo lo spostamento di Monitoring nella lista.
- [ ] **Da ricontrollare in DevTools a 390px** - il taglio a destra su Company Brain e l'indentazione dell'albero servizi di Homelab, visti in un Chrome headless con larghezza minima: potrebbero essere artefatti.

## Da decidere (restate dalla critique del 2026-10-11)

- [ ] **Frase dell'hero** - "Bringing ideas to life with 3D/2D" è la più generica del sito; il lavoro vero lo fa la riga del ruolo sotto. Per ora lasciata com'è (scelta di Luca, 2026-10-11). Proposte scartate: "From sketch to screen, I build the [3D/2D/AI] pipeline"; "Making 3D work for [eyewear/configurators/...]"; o frase invariata con sottotitolo più specifico.
- [ ] **Marquee al neon** - ripete il racconto delle skill ed è l'elemento più da catalogo della home. Tenerla o toglierla?
- [ ] **Player dei set: due tasti play** (il disco grande e quello piccolo nei controlli). Il piccolo fa da centro dei controlli, togliere il disco o il piccolo cambia il disegno del pannello.
- [ ] **Nuvola 3D dell'hero con WebGL lento o assente** - in una scheda in background la nuvola non si è disegnata ma l'invito "click on an object" restava. Non riprodotto con certezza; da guardare su un dispositivo vero.
- [ ] **Lettura con Tab dell'hero** - aggiunto il salto "Skip the 3D object list"; da provare con tastiera vera e con VoiceOver.

## Contenuto (quello che vede chi visita il sito)

- [ ] **4. Pipeline Projects: rileggere i testi e verificare la completezza dei mockup** - il punto più importante per il risultato: pagina pubblica sul lavoro vero, alcune frasi sono dedotte e non verificate (es. OpenPBR MaterialX "reads the same in any tool and renderer"). Riga `stack` e pill già sistemate. Controllare le parti forse mancanti (tab Color spec del widget Unreal, Datasmith/CAD import, material library). Costo: ~30-45 min insieme, le correzioni poi sono veloci.
- [ ] **5. Company Brain: un risultato vero** - la debolezza principale emersa dalla critique: la pagina spiega come funziona ma non cosa ha prodotto. **In attesa**: il progetto è in fase di test (la pagina dice già "Pilot, few users"), Luca non ha ancora dati certi e li comunicherà. Non inventare numeri. Serve un dato (tempo risparmiato, numero di utenti, domande al giorno...). ~10 min per inserirlo.
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

Prima il P1 delle sottopagine (direzione da scegliere), poi i minori della critique con il punto 10; poi 4 e 5 insieme (il 5 aspetta i dati); infine 6 per andare online.
