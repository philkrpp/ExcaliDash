# Decisions

<!--
Datiert, append-only, neueste oben. Alte Einträge nie ändern oder löschen;
eine Revision ist ein neuer Eintrag mit "Ersetzt:".
Vor Analyse und Grilling lesen; widerspricht etwas einem Eintrag: nachfragen, ob er noch gilt.

## YYYY-MM-DD – Kurztitel
Entscheidung: …
Grund: …
Quelle: <Spec-/Plan-Pfad oder "Chat YYYY-MM-DD">
Ersetzt: YYYY-MM-DD – <Titel>   (nur bei Revision)
-->

## 2026-11-25 – Ohne Login kein Profile und Admin

Entscheidung: Ohne Login (`AUTH` aus, Einzelnutzer-Modus) zeigt das Account-Menü nur Settings; `/profile` und `/admin` leiten aufs Dashboard um. Mit Login bleibt alles wie bisher (Admin nur für Admins).
Grund: Beide Seiten hängen jeden Inhalt an `authEnabled` und zeigten ohne Login nur ihre Überschrift.
Quelle: Chat 2026-11-25

## 2026-11-25 – Dashboard-Auswahl beim Refresh: ganz oder gar nicht

Entscheidung: Ein Neuladen der Liste behält die Auswahl nur, wenn alle gewählten Zeichnungen noch in der Liste stehen; sonst wird sie wie früher komplett geleert (nicht einzeln gekürzt). Solange die Liste noch lädt (Platzhalter), bleibt sie unverändert.
Grund: Ein Refresh lädt nur die erste Seite (24); einzelnes Kürzen ließ eine Auswahl über mehrere Seiten still schrumpfen, und die nächste Sammelaktion traf weniger Zeichnungen als gewählt (Code-Review). Der „Select All“-Fix nach einer Suche bleibt erhalten.
Quelle: Review-Runde 1, `docs/superpowers/specs/2026-11-25-open-items-design.md`
Ersetzt: 2026-11-25 – Editor-Personenliste und Dashboard-Auswahl beim Refresh (nur der Satz zur Auswahl)

## 2026-11-25 – Editor-Personenliste und Dashboard-Auswahl beim Refresh

Entscheidung: „+N“ im Editor öffnet eine Liste aller Personen (Name, Folgen-Knopf). Auf Touch öffnet auch ein Tipp auf einen Avatar diese Liste statt sofort zu folgen; auf dem Desktop folgt ein Klick auf einen Avatar weiter direkt. Der Editortitel im Wide-Layout ist per Tastatur umbenennbar (Enter). Im Dashboard setzt ein Neuladen der Liste die Auswahl nicht mehr zurück; nur Zeichnungen, die nicht mehr in der Liste sind, fallen heraus.
Grund: Auf Touch gibt es keinen Tooltip, ein Tipp folgte bisher einer namenlosen Person; versteckte Peers waren nicht erreichbar. „Select All“ direkt nach dem Tippen ging durch die verzögerte Such-Antwort verloren.
Quelle: Chat 2026-11-25, `docs/superpowers/specs/2026-11-25-open-items-design.md`

## 2026-11-25 – Admin-Nutzerliste: Karten bis xl

Entscheidung: Die Nutzerliste im Admin zeigt Karten bis unter `xl` (1280 px), die Tabelle erst ab `xl` (Spec A1 sagte „unter `md`“). Eine Sprache mit derselben Basissprache wie die UI (z. B. `en-US`) erscheint als „English“ ohne Zusatzeintrag.
Grund: Auf dem iPad quer (1194 px, ~886 px Inhalt) brach die Tabelle die Aktions-Buttons um und stieß an den Kartenrand (Impeccable-Critique, Runde 1); „English (editor only)“ war für en-US falsch.
Quelle: Review-Runde 1, `docs/superpowers/specs/2026-11-25-pages-touch-pass-design.md`

## 2026-11-25 – Seiten-Review: alle 23 Punkte umsetzen

Entscheidung: Alle Vorschläge aus `.impeccable/mocks/pages-review.html` werden umgesetzt; die Mocks dort gelten als gewählte Varianten. Neue Texte auf Englisch (Sidebar zusätzlich zh-CN über `i18n.ts`). ST2: Zusatzeintrag mit Sprachnamen statt Locale-Code. D6: Collection-Chip bleibt Picker, auf Touch 44 px Trefferfläche. S2: Trash steht immer in der Library, bewusst abweichend vom Upstream-Verhalten der Compact-Sidebar.
Grund: Auf dem iPad waren Kernaktionen (Karten, Collections, Auswahl) nur per Rechtsklick/Hover erreichbar; dazu belegte Fehler (Menüs außerhalb des Viewports, 429 als Konfigurationsfehler).
Quelle: Chat 2026-11-25; `docs/superpowers/specs/2026-11-25-pages-touch-pass-design.md`

## 2026-11-25 – Editor ohne feste Kopfleiste: schwebende Inseln überall

Entscheidung: Die 64-px-Kopfleiste im Editor entfällt auf allen Geräten. Zurück + Titel und die Aktionen (Verlauf, Teilen, Export, Avatare, Status-Badges) schweben als Inseln in Excalidraws oberer Werkzeugzeile. Auto-Hide (Header-Toggle und Einstellung „Auto-hide editor header“) wird entfernt; das Backend akzeptiert das alte Preference-Feld weiter.
Grund: Auf dem iPad kosteten Kopfleiste plus Werkzeugleiste ~124 px Höhe, Auto-Hide war auf Touch abgeschaltet. Ein Layout für alle Geräte ist einfacher als zwei.
Quelle: Chat 2026-11-25; `docs/superpowers/specs/2026-11-25-editor-floating-chrome-design.md`

## 2026-11-24 – Freigabe-Links: 30 Tage Standard, Ablauf bleibt beim Rollenwechsel

Entscheidung: Der Teilen-Dialog wählt für neue Links „Disable in 30 days“ vor (Viewer und Editor). Wechsel zwischen Viewer und Editor behält das eingestellte Ablaufdatum, auch „Never auto-disable“; Editor-Links dürfen „Never“ haben.
Grund: Upstream wählte 1 Stunde vor; geteilte Links liefen unbemerkt ab, Fremde sahen „Drawing does not exist“. Beim Wechsel auf Editor wurde „Never“ zwangsweise auf 7 Tage gesetzt.
Quelle: Chat 2026-11-24; `frontend/src/components/share-modal/shareUtils.ts`, Test `frontend/tests/share-link-expiry.test.tsx`

## Ältere Entscheidungen

- Infrastruktur, Secrets, Betrieb: compleadly-proxmox `docs/whiteboard.md` und `DECISIONS.md`
