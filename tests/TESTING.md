# Testing Shield

## 1. Automated: two-phone SOS flow + security rules

Runs against the Firebase emulators (no real accounts, nothing touches production):

```bash
npm run test:emulators
```

`tests/sos-flow.test.mjs` signs in three separate users (person, helper, second helper) and checks:

| # | Case | Expected |
|---|------|----------|
| 1 | Person adds a trusted contact | Saved; other users can't read it |
| 2 | Read another user's profile | Denied |
| 3 | Person raises an SOS | Alert created with status `active` |
| 4 | Raise an SOS in someone else's name | Denied |
| 5 | Helper's dashboard query | Receives the SOS in real time |
| 6 | Person's live location update | Reaches the helper in real time |
| 7 | Helper edits an alert they haven't accepted | Denied |
| 8 | Two helpers press Accept at the same moment | Exactly one wins (transaction) |
| 9 | Person's screen after accept | Shows the helper's name in real time |
| 10 | Losing helper tries to accept / change stage | Denied |
| 11 | Helper updates stage + live position | Person sees both in real time |
| 12 | Chat | Person ↔ helper can talk; outsiders can't read; no spoofed sender; max 500 chars |
| 13 | Helper releases the alert | Another helper can accept it |
| 14 | Person marks themselves safe | Status `resolved`; gone from helpers' active list |
| 15 | Forgotten SOS (> 6 h, no activity) | Closed as expired; a new SOS can be raised |

## 2. Two app windows (web, emulators)

```bash
npm run emulators              # terminal 1
node tests/seed-emulator.mjs   # terminal 2: creates the two demo accounts
```

Then start the web app against the emulators (`EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true npx expo start --web --port 8082`,
or the `shield-web-emulators` launch config) and open it twice in **different origins** so each window has its own login:

- `http://localhost:8082` → `person@shield.test` / `shield-test-123`
- `http://127.0.0.1:8082` → `helper@shield.test` / `shield-test-123` → **Respond to alerts** → **On duty**

| Step | Person window | Helper window |
|------|---------------|---------------|
| 1 | Tap SOS → 5 s countdown → SOS Active | "Rina Person · URGENT · ~400 m away" appears |
| 2 | — | ACCEPT & RESPOND → Responding screen |
| 3 | "Help is on the way · Karim Helper" | — |
| 4 | Progress pill shows "On my way" | Tap "On my way" |
| 5 | Chat → "Please hurry" | Chat shows it; reply "I'm on my way" |
| 6 | Sees the reply | — |
| 7 | I'M SAFE, END SOS → Home | "This alert has ended · marked themselves safe" |
| 8 | Alert history: Resolved, "Helped by Karim Helper" | History lists the response |

Browsers have no GPS, so give each window a position from DevTools (Sensors → Location) or the alert shows "location
unavailable" (helpers still see it, by design).

## 3. On a real phone (Expo Go)

These need real hardware and can't be checked in a browser:

- [ ] **SMS to trusted contacts:** press SOS. After the countdown your SMS app opens with every trusted contact and the
      SOS text + Google Maps link already filled in. Tap **Send**. The SOS screen then shows "Text opened & sent to contacts".
- [ ] **Text my contacts again** on the SOS screen sends the newest location.
- [ ] **Automatic texts (Android APK, not Expo Go):** Contacts → Automatic SOS texts → Turn on → Allow. Press SOS: after
      the countdown no SMS app opens; the SOS screen shows "Texted your contacts automatically" and the contact's phone
      receives the text. Walk 300 m+ with the SOS open: after 5 min the contact gets a "📍 SHIELD update" text.
- [ ] **No signal / airplane mode with the APK:** the SOS screen reports the failure and falls back to the SMS app.
- [ ] **Live map:** Track Route shows dark street map, blue dot, "● Live GPS", and "Last update" counting every few seconds.
- [ ] **Helper on a second phone** (log in as a helper, go on duty) gets the SOS and both maps show each other moving.
- [ ] **Fall detection / Shake to SOS** (Home → Smart Protection) opens the 15 s / 5 s countdown.
- [ ] **Check-in timer** of 1 minute expires → "You missed your check-in" countdown → SOS.
- [ ] **Fake call** rings after the chosen delay.
