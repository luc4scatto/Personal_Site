# TODO

Punti aperti ordinati per rapporto tra effetto sul sito finale e lavoro richiesto. Aggiornato 2026-10-11.

## Da decidere (restate dalla critique del 2026-10-11)

Risultati completi: https://claude.ai/artifact/NSxYmR8MCfeLwtaDYWDbUr. Il resto della critique è stato sistemato.

- [ ] **Frase dell'hero** - "Bringing ideas to life with 3D/2D" è la più generica del sito; il lavoro vero lo fa la riga del ruolo sotto. Per ora lasciata com'è (scelta di Luca, 2026-10-11). Proposte scartate: "From sketch to screen, I build the [3D/2D/AI] pipeline"; "Making 3D work for [eyewear/configurators/...]"; o frase invariata con sottotitolo più specifico.
- [ ] **Marquee al neon** - ripete il racconto delle skill ed è l'elemento più da catalogo della home. Tenerla o toglierla?
- [ ] **Player dei set: due tasti play** (il disco grande e quello piccolo nei controlli). Il piccolo fa da centro dei controlli, togliere il disco o il piccolo cambia il disegno del pannello.
- [ ] **Nuvola 3D dell'hero con WebGL lento o assente** - in una scheda in background la nuvola non si è disegnata ma l'invito "click on an object" restava. Non riprodotto con certezza; da guardare su un dispositivo vero.
- [ ] **Lettura con Tab dell'hero** - aggiunto il salto "Skip the 3D object list"; da provare con tastiera vera e con VoiceOver.

## Contenuto (quello che vede chi visita il sito)

- [ ] **4. Pipeline Projects: rileggere i testi e verificare la completezza dei mockup** - il punto più importante per il risultato: pagina pubblica sul lavoro vero, alcune frasi sono dedotte e non verificate (es. OpenPBR MaterialX "reads the same in any tool and renderer"). Riga `stack` e pill già sistemate. Controllare le parti forse mancanti (tab Color spec del widget Unreal, Datasmith/CAD import, material library). Costo: ~30-45 min insieme, le correzioni poi sono veloci.
- [ ] **5. Company Brain: un risultato vero** - la debolezza principale emersa dalla critique: la pagina spiega come funziona ma non cosa ha prodotto. **In attesa**: il progetto è in fase di test (la pagina dice già "Pilot, few users"), Luca non ha ancora dati certi e li comunicherà. Non inventare numeri. Serve un dato (tempo risparmiato, numero di utenti, domande al giorno...). ~10 min per inserirlo.
- [ ] **6. (in standby, Luca: non è ancora il momento) Merge di `preview/combined` su `main`** - unico modo per mettere online i 10 commit. Dopo 4 e 5, così non vanno online testi non verificati. ~5 min più la verifica sul dev server.

## Rifiniture veloci (in blocco, prima del merge)

- [ ] **8. Bottone Replay di Company Brain più grande su touch** - da 32 a 44px. ~5 min, accessibilità.
- [ ] **9. Pausa sul canvas della hero di Company Brain** - parte da solo e dura ~10s; le linee guida chiedono un controllo di pausa oltre i 5s. ~15 min.
- [ ] **10. Misurare l'altezza minima della chat su desktop** (25rem) - solo verifica che non salti tra le scene. ~5 min.

## Rimandabili

- [ ] **11. Distanza player/cassetto su tablet (`is-overlay`)** - estetica, solo tablet. C'era una soluzione funzionante (mask-image del canvas più stretta) annullata prima del commit: prima decidere cosa si vuole. ~30-60 min. Dettagli in `CLAUDE.md`.
- [ ] **12. Logo del disco** - serve un PNG, va in `public/images/` e nel campo `label` di un set. ~5 min dopo averlo.

## Da scartare (proposta)

- [ ] **13. Linguette del cassetto su Firefox** - richiede ristrutturare `buildFolder()`/`riseSheet()` per una differenza estetica su un solo browser. Già valutato e rimandato: costo alto, guadagno basso.
- [ ] **14. Annunci della chat di Company Brain per screen reader** - scelta voluta: leggerebbe la digitazione lettera per lettera. Il demo è decorativo, il contenuto sta nel testo.

## Percorso consigliato

Prima i punti della critique (15-20) in ordine; poi 4 e 5 insieme (il 5 aspetta i dati); poi 8, 9, 10 in blocco; infine 6 per andare online.
