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
