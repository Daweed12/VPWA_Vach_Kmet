# inTouch

Ľahká tímová „chat & channels“ aplikácia s príkazovým riadkom, menovaniami (`@nickname`), verejnými/súkromnými kanálmi a jednoduchou správou členov.

> Aktuálny build beží lokálne na `http://localhost:9000`.

---

## Obsah

- [Funkcie (MVP)](#funkcie-mvp)
- [Screenshoty](#screenshoty)
- [Príkazový riadok](#príkazový-riadok)
- [Presence, Privacy & Typing](#presence-privacy--typing)
- [Profil a účet](#profil-a-účet)
- [Databáza (ERD)](#databáza-erd)

---

## Funkcie (MVP)

- **Kanály**: Public / Private, zoznam v sidebare + rýchle akcie (join/leave/kick).
- **Chat**: posielanie správ, mentions (`@nickname`), indikácia „Online“.
- **Command bar**: príkazy priamo z chatu alebo cez dostupné tlačidlá.
- **Nastavenia profilu**: meno, prezývka, email, fotka.
- **Notifikácie & súkromie**: len @mentions, DND, typing indikátor, zdieľaný náhľad správy.
- **Kick/Ban** logika na úrovni kanála (viď nižšie).

---

## Screenshoty

Tie sú uložené v priečinku docs

---

## Ako spustiť aplikáciu

### 1) Inštalácia závislostí (FE/BE podľa projektu)

npm install

### **_alebo: pnpm install / yarn_**

### 2) Vývojový server

npm run dev -> typicky na http://localhost:9000

### 3) Build

npm run build

# Databáza (ERD)

_screenshot sa nachadza v /docs/databaza.png_

---

# Príkazový riadok

Používateľ môže písať príkazy v ľubovoľnom kanáli (do inputu chatu) alebo použiť tlačidlá v UI.  
Zoznam príkazov je aj v **Settings → Command quick help**.

| Príkaz                        | Popis                                                   | Príklad                      |
| ----------------------------- | ------------------------------------------------------- | ---------------------------- |
| `/join channelName [private]` | Pridať sa / vytvoriť kanál. `private` vytvorí súkromný. | `/join vpwa-projekt private` |
| `/invite nickName`            | Pozvať používateľa do aktuálneho kanála.                | `/invite @erenY22`           |
| `/revoke nickName`            | Odobrať prístup (súkromný kanál).                       | `/revoke @john`              |
| `/kick nickName`              | Vyhodiť člena z kanála (viď Ban).                       | `/kick @max`                 |
| `/quit`                       | Odísť z aktuálneho kanála.                              | `/quit`                      |
| `/cancel`                     | Zrušiť prebiehajúcu akciu.                              | `/cancel`                    |
| `/list`                       | Zoznam členov kanála.                                   | `/list`                      |
| `/change_channel_visibility`  | Prepne **Public ↔ Private**.                           | `/change_channel_visibility` |
| `@nickname`                   | Oslovenie konkrétneho používateľa.                      | `@Jane`                      |
