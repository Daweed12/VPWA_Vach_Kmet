# Refaktoring - Rozdelenie veľkých súborov

## Prehľad zmien

Tento dokument popisuje refaktoring, ktorý som vykonal na rozdelenie veľkých súborov do menších, lepšie organizovaných modulov.

---

## 1. Frontend - Quasar Project

### 1.1 IndexPage.vue (1210 riadkov → ~370 riadkov)

**Pôvodný problém:**
- IndexPage.vue obsahoval všetku logiku pre socket, správy, typing, infinite scroll, notifikácie atď.
- Ťažko sa udržiaval a rozširoval

**Riešenie - Vytvorené composables:**

#### `composables/useSocket.ts`
- **Účel:** Spravuje WebSocket pripojenie
- **Obsahuje:**
  - `initSocket()` - inicializácia socket pripojenia
  - `joinChannel()` - pripojenie do kanála
  - `leaveChannel()` - opustenie kanála
  - `disconnectSocket()` - odpojenie
- **Prečo:** Socket logika je teraz izolovaná a znovupoužiteľná

#### `composables/useMessages.ts`
- **Účel:** Spravuje správy a ich zobrazovanie
- **Obsahuje:**
  - `rawMessages` - surové správy z API
  - `uiMessages` - formátované správy pre UI
  - `loadMessagesForChannel()` - načítanie správ
  - `addMessageOptimistically()` - optimistické pridanie správy
  - `updateMessageAvatar()` - aktualizácia avatárov v správach
  - `getFullAvatarUrl()` - helper pre URL avatárov
- **Prečo:** Logika správ je oddelená od UI a znovupoužiteľná

#### `composables/useTyping.ts`
- **Účel:** Spravuje typing indikátory
- **Obsahuje:**
  - `typingUsers` - zoznam používateľov, ktorí píšu
  - `handleTypingUpdate()` - spracovanie typing eventu
  - `handleTypingStop()` - zastavenie typing indikátora
  - `clearTyping()` - vymazanie všetkých typing indikátorov
- **Prečo:** Typing logika je izolovaná a jednoduchšia na testovanie

#### `composables/useSocketEvents.ts`
- **Účel:** Centralizované spracovanie WebSocket eventov
- **Obsahuje:**
  - Listeners pre všetky WebSocket eventy (user:status:changed, user:avatar:changed, channel:deleted, atď.)
  - Dispatch window eventov pre komunikáciu medzi komponentmi
- **Prečo:** Všetky socket eventy sú na jednom mieste, ľahšie sa udržiavajú

#### `composables/useInfiniteScroll.ts`
- **Účel:** Spravuje infinite scroll pre správy
- **Obsahuje:**
  - `visibleCount` - počet viditeľných správ
  - `onLoad()` - handler pre načítanie ďalších správ
  - `resetPaging()` - reset paginácie
- **Prečo:** Infinite scroll logika je znovupoužiteľná pre iné zoznamy

**Vytvorené komponenty:**

#### `components/TypingIndicator.vue`
- **Účel:** Zobrazuje typing indikátory
- **Prečo:** UI pre typing je oddelený od logiky

#### `components/MessageList.vue`
- **Účel:** Zobrazuje zoznam správ
- **Obsahuje:**
  - Infinite scroll
  - Formátovanie správ
  - Parsovanie mentions
- **Prečo:** UI pre správy je oddelený od logiky

**Vytvorené utilities:**

#### `utils/mentionParser.ts`
- **Účel:** Parsuje @mentions v texte
- **Funkcia:** `parseMentions(text: string): Chunk[]`
- **Prečo:** Utility funkcia je znovupoužiteľná a testovateľná

---

### 1.2 MainLayout.vue (713 riadkov → ~400 riadkov)

**Pôvodný problém:**
- MainLayout.vue obsahoval logiku pre kanály, pozvánky, používateľa, event handlery atď.

**Riešenie - Vytvorené composables:**

#### `composables/useChannels.ts`
- **Účel:** Spravuje kanály
- **Obsahuje:**
  - `channels` - zoznam kanálov
  - `currentChannel` - aktuálny kanál
  - `filteredChannels` - filtrované kanály
  - `loadChannels()` - načítanie kanálov
  - `handleChannelClick()` - kliknutie na kanál
- **Prečo:** Logika kanálov je izolovaná a znovupoužiteľná

#### `composables/useInvites.ts`
- **Účel:** Spravuje pozvánky
- **Obsahuje:**
  - `invites` - zoznam pozvánok
  - `loadInvites()` - načítanie pozvánok
  - `handleAccept()` - prijatie pozvánky
  - `handleReject()` - odmietnutie pozvánky
- **Prečo:** Logika pozvánok je izolovaná

#### `composables/useUser.ts`
- **Účel:** Spravuje používateľské údaje
- **Obsahuje:**
  - `currentUser` - aktuálny používateľ
  - `currentUserName` - computed meno používateľa
  - `currentUserAvatar` - computed avatar používateľa
  - `currentUserStatus` - computed status používateľa
  - `loadUser()` - načítanie používateľa
- **Prečo:** Logika používateľa je znovupoužiteľná v rôznych komponentoch

---

## 2. Backend - AdonisJS Server

### 2.1 routes.ts (1198 riadkov → ~15 riadkov + moduly)

**Pôvodný problém:**
- routes.ts obsahoval všetky route handlery v jednom súbore
- Ťažko sa hľadali konkrétne endpointy
- Ťažko sa udržiaval

**Riešenie - Rozdelené do modulov:**

#### `start/routes/channels.ts` (~200 riadkov)
- **Obsahuje:**
  - `GET /channels/:id/members` - zoznam členov kanála
  - `GET /channels` - zoznam kanálov
  - `GET /channels/search` - vyhľadávanie kanálov
  - `POST /channels/:id/join` - pripojenie do kanála
  - `POST /channels` - vytvorenie kanála
  - `DELETE /channels/:id` - vymazanie kanála
  - `POST /channels/:id/leave` - opustenie kanála
- **Prečo:** Všetky endpointy súvisiace s kanálmi sú na jednom mieste

#### `start/routes/messages.ts` (~100 riadkov)
- **Obsahuje:**
  - `GET /channels/:id/messages` - načítanie správ
  - `POST /channels/:id/messages` - odoslanie správy
  - Logika pre mentions
- **Prečo:** Všetky endpointy súvisiace so správami sú na jednom mieste

#### `start/routes/users.ts` (~150 riadkov)
- **Obsahuje:**
  - `GET /users/search` - vyhľadávanie používateľov
  - `GET /users/:id` - získanie používateľa
  - `PUT /users/:id` - aktualizácia používateľa
  - `PUT /users/:id/photo` - zmena profilovej fotky
  - `GET /avatars/:filename` - získanie avatáru
- **Prečo:** Všetky endpointy súvisiace s používateľmi sú na jednom mieste

#### `start/routes/invites.ts` (~150 riadkov)
- **Obsahuje:**
  - `GET /invites` - zoznam pozvánok
  - `POST /invites/:id/accept` - prijatie pozvánky
  - `POST /invites/:id/reject` - odmietnutie pozvánky
  - `POST /channels/:id/invites` - vytvorenie pozvánky
- **Prečo:** Všetky endpointy súvisiace s pozvánkami sú na jednom mieste

#### `start/routes/auth.ts` (~100 riadkov)
- **Obsahuje:**
  - `POST /login` - prihlásenie
  - `POST /register` - registrácia
  - `POST /auth/change-password` - zmena hesla
- **Prečo:** Všetky endpointy súvisiace s autentifikáciou sú na jednom mieste

#### `start/routes/cmd.ts` (~200 riadkov)
- **Obsahuje:**
  - `POST /cmd/join` - príkaz /join
  - `POST /cmd/invite` - príkaz /invite
  - `POST /cmd/revoke` - príkaz /revoke
  - `POST /cmd/kick` - príkaz /kick
  - `POST /cmd/quit` - príkaz /quit
  - `POST /cmd/cancel` - príkaz /cancel
- **Prečo:** Všetky príkazové endpointy sú na jednom mieste

#### `start/routes.ts` (nový - ~15 riadkov)
- **Účel:** Hlavný súbor, ktorý importuje všetky route moduly
- **Prečo:** Centralizovaný vstupný bod pre všetky routes

---

## 3. Výhody refaktoringu

### 3.1 Lepšia organizácia
- **Pred:** Všetko v jednom súbore
- **Po:** Logicky rozdelené moduly
- **Výhoda:** Ľahšie nájsť konkrétnu funkcionalitu

### 3.2 Znovupoužiteľnosť
- **Pred:** Logika bola v komponentoch
- **Po:** Logika v composables, ktoré sa dajú znovu použiť
- **Výhoda:** Menej duplicitného kódu

### 3.3 Testovateľnosť
- **Pred:** Ťažko testovať veľké komponenty
- **Po:** Composables a utilities sa dajú testovať samostatne
- **Výhoda:** Jednoduchšie písať unit testy

### 3.4 Udržiavateľnosť
- **Pred:** Zmeny v jednom súbore mohli ovplyvniť viacero funkcií
- **Po:** Zmeny sú izolované v menších moduloch
- **Výhoda:** Menej riziko nechcených zmien

### 3.5 Čitateľnosť
- **Pred:** Veľké súbory s veľa zodpovednosťami
- **Po:** Menšie súbory s jasnou zodpovednosťou
- **Výhoda:** Ľahšie pochopiť kód

### 3.6 Škálovateľnosť
- **Pred:** Pridávanie nových funkcií znamenalo rozširovanie veľkých súborov
- **Po:** Nové funkcie sa pridávajú do existujúcich modulov alebo sa vytvárajú nové
- **Výhoda:** Jednoduchšie pridávať nové funkcie

---

## 4. Štruktúra projektu po refaktoringu

### Frontend
```
quasar-project/src/
├── composables/
│   ├── useSocket.ts          # WebSocket pripojenie
│   ├── useMessages.ts        # Správy
│   ├── useTyping.ts          # Typing indikátory
│   ├── useSocketEvents.ts    # Socket eventy
│   ├── useInfiniteScroll.ts  # Infinite scroll
│   ├── useChannels.ts        # Kanály
│   ├── useInvites.ts         # Pozvánky
│   └── useUser.ts            # Používateľ
├── components/
│   ├── TypingIndicator.vue  # UI pre typing
│   ├── MessageList.vue       # UI pre správy
│   └── ... (ostatné komponenty)
├── utils/
│   └── mentionParser.ts      # Parsovanie mentions
├── pages/
│   └── IndexPage.vue         # Hlavná stránka (refaktorovaná)
└── layouts/
    └── MainLayout.vue        # Hlavný layout (refaktorovaný)
```

### Backend
```
intouch-server/start/
├── routes.ts                 # Hlavný súbor (importuje moduly)
└── routes/
    ├── channels.ts           # Channel endpointy
    ├── messages.ts           # Message endpointy
    ├── users.ts              # User endpointy
    ├── invites.ts            # Invite endpointy
    ├── auth.ts               # Auth endpointy
    └── cmd.ts                # Command endpointy
```

---

## 5. Ako používať novú štruktúru

### Frontend - Pridanie novej funkcionality

**Príklad: Pridanie nového socket eventu**

1. Otvorte `composables/useSocketEvents.ts`
2. Pridajte nový listener do `useSocketEvents` funkcie
3. Pridajte callback do `callbacks` objektu
4. Použite v komponente cez `useSocketEvents`

**Príklad: Pridanie nového composable**

1. Vytvorte nový súbor v `composables/`
2. Exportujte funkciu s prefixom `use` (napr. `useNotifications`)
3. Importujte a použite v komponente

### Backend - Pridanie nového endpointu

**Príklad: Pridanie nového channel endpointu**

1. Otvorte `start/routes/channels.ts`
2. Pridajte nový route handler
3. Súbor sa automaticky načíta cez `routes.ts`

**Príklad: Pridanie novej skupiny endpointov**

1. Vytvorte nový súbor v `start/routes/` (napr. `notifications.ts`)
2. Pridajte route handlery
3. Importujte v `start/routes.ts`

---

## 6. Migrácia existujúceho kódu

Všetky existujúce funkcie zostali zachované, len boli presunuté do nových modulov. Žiadne breaking changes neboli urobené.

---

## 7. Ďalšie vylepšenia (voliteľné)

### Možné budúce vylepšenia:
1. **Services layer** - presunúť business logiku z routes do services
2. **Validators** - pridať validáciu requestov
3. **Middleware** - pridať middleware pre autentifikáciu, autorizáciu
4. **Error handling** - centralizované error handling
5. **TypeScript strict mode** - pridať striktnejšie typy
6. **Unit testy** - pridať testy pre composables a utilities

---

## 8. Záver

Refaktoring výrazne zlepšil organizáciu kódu, čitateľnosť a udržiavateľnosť. Kód je teraz:
- **Lepšie organizovaný** - logicky rozdelený do modulov
- **Znovupoužiteľný** - composables sa dajú použiť v rôznych komponentoch
- **Testovateľný** - menšie moduly sa dajú testovať samostatne
- **Škálovateľný** - ľahšie pridávať nové funkcie

Všetky existujúce funkcie fungujú rovnako ako predtým, len je kód lepšie organizovaný.

