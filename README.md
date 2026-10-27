# Shield: Personal Safety for Everyone

Shield is the React Native (Expo SDK 57) version of **SheShield**, rebuilt for everyone. **Any gender can be a
User, a Helper, or Both.** People raise an SOS, trusted contacts get a text with their location, and verified
helpers nearby can accept the alert, chat, and respond in real time.

## Features

| Area | What it does |
| --- | --- |
| **SOS** | Cancellable countdown, then creates an alert for nearby helpers and texts trusted contacts from the phone's SIM (works without data). In Shield's Android build the texts go out **automatically** (no tap), with follow-up location texts as you move; in Expo Go/iOS the SMS app opens ready to send. Live location keeps updating until "I'm safe". Per-channel delivery report: it never just says "sent". Forgotten alerts expire after 6 h. |
| **Helpers** | Go on/off duty, choose a response radius, see nearby alerts in real time (with vibration), accept (race-safe transaction), update stage (On my way → Arrived → Assisting), directions, call, chat, resolve or release. History and stats. |
| **Verification** | Helpers upload ID front and back plus a live selfie. Only verified helpers can accept alerts. |
| **Both-role accounts** | "Ask for help / Respond to alerts" switch swaps between the user and helper apps. Users can upgrade to Both from their profile. |
| **Trusted contacts** | Up to 10, with per-country phone validation, relationship tags, call and message. |
| **Timed check-in** | Runs app-wide. When it expires: "Are you OK?" with a 15 s countdown, then SOS. |
| **Smart protection** | Fall detection and shake-to-SOS (accelerometer, while the app is open). |
| **Tools** | Track route (live map, distance, share), share location, fake incoming call, danger-zone heat map (from past alerts, by time of day), alert history. |
| **AI companion** | Safety guidance from Claude (`claude-opus-5-5`, via the Messages API over HTTPS), with built-in offline answers when there's no key or no internet. |
| **Profile** | Emergency info (blood group, medical notes) shared with your helper, privacy & permissions, Bangladesh hotlines (999, 109, 1098…). |

## Run it

```bash
npm install
cp .env.example .env.local      # then fill in values (see below)
npx expo start                  # scan the QR code with Expo Go (Android/iOS)
```

Everything works in **Expo Go** (maps, SMS, location, camera, sensors). `npm run web` runs it in a browser;
maps, SMS and sensors fall back gracefully there.

### Android build (automatic SOS texts)

Expo Go can only open the SMS app; sending a text without a tap needs Shield's own native code
([`modules/direct-sms`](modules/direct-sms), Android `SmsManager`). Build an installable APK:

```bash
# Local (needs Android Studio's SDK + JDK 17+). APK: android/app/build/outputs/apk/release/app-release.apk
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease

# Or in the cloud with EAS (put CLAUDE_API_KEY in EAS env vars first: eas env:create)
npx eas-cli build --platform android --profile preview
```

Install the APK on the phone, open **Contacts → Automatic SOS texts → Turn on** and allow SMS. iPhones never allow
silent SMS, so iOS keeps the tap-to-send composer.

### One-time Firebase setup

The app uses the existing `she111` Firebase project (Auth + Firestore). No server to run.

1. **Firebase console → Authentication → Sign-in method → enable Email/Password.**
2. **Firestore → Rules → paste [`firestore.rules`](firestore.rules) → Publish.**
3. To approve a helper (when `EXPO_PUBLIC_DEMO_AUTO_VERIFY=false`): Firestore → `users/{uid}` → set
   `isHelperVerified: true` and `verificationStatus: "approved"`. ID photos are in `verifications/{uid}`.

### Environment (`.env.local`, git-ignored)

| Variable | Purpose |
| --- | --- |
| `CLAUDE_API_KEY` | AI companion (Claude API). Passed to the app by `app.config.js`. Empty means built-in offline guidance. |
| `EXPO_PUBLIC_EMERGENCY_NUMBER` | Number for the "Call 999" buttons. |
| `EXPO_PUBLIC_DEMO_AUTO_VERIFY` | `true` approves helper verification instantly (presentation mode). |
| `EXPO_PUBLIC_USE_FIREBASE_EMULATORS` | `true` uses the local emulators instead of the live project. |

### Local emulators (optional, needs Java)

```bash
npm run emulators                                   # Auth :9099, Firestore :8080, UI :4000
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true npx expo start
```

## Presentation demo (two phones)

1. Phone A: sign up as **Rahim, male, "Both"**. Add a trusted contact.
2. Phone B: sign up as **Nadia, female, "Helper"**. Profile → Helper verification → submit photos
   (instant in demo mode). Go **On duty**.
3. Phone A: tap **SOS**. After the 5 s countdown the alert goes live and contacts are texted (automatically in the
   Android build; in Expo Go the SMS app opens, tap Send).
4. Phone B buzzes. **Accept & respond**, mark **On my way**, send a chat message.
5. Phone A shows **"Help is on the way"** with Nadia's name, stage and live position. Tap **I'm safe**.
6. Also show: timed check-in (1 min), fall/shake detection, fake call, danger zones, AI companion, mode switch.

## Architecture

Feature-first and deliberately simple. It's the RN equivalent of the Flutter app's clean architecture, without
the boilerplate.

```
src/
  app/                 expo-router routes only (thin re-exports)
    _layout.tsx        providers + ALL access rules (Stack.Protected guards)
    (user)/            user tabs: home, contacts, ai, profile
    (helper)/          helper tabs: dashboard, history, helper-ai, helper-profile
  features/<feature>/
    api.ts             data layer: Firestore reads/writes + realtime hooks
    *Screen.tsx        presentation
    *Provider.tsx      app-wide state where needed (auth, check-in, protection)
  components/ui/       design system (Screen, Header, Button, Card, TextField, Toast, PhoneField)
  components/map/      SafetyMap (Leaflet + OpenStreetMap in a WebView / iframe on web; no API key)
  lib/                 firebase, location, countries, format, dialogs, storage, config
  types/models.ts      domain models shared by every layer (mirror Firestore docs)
  theme/colors.ts      midnight palette (kept in sync with tailwind.config.js)
```

- **State:** React Context for session/mode/check-in/protection; Firestore `onSnapshot` hooks for data (realtime,
  offline cache). No Redux.
- **Routing:** guards in one place. Signed-out, user-mode, helper-mode and shared screens are separate
  `Stack.Protected` groups, and the root redirects a signed-in person to the right home.
- **Styling:** NativeWind (Tailwind) with the midnight theme.

### Data model (Firestore)

```
users/{uid}                      profile, role, helper status/location, emergency info
users/{uid}/contacts/{id}        trusted contacts
alerts/{id}                      SOS: requester, reason, live location, status, accepted helper, stage
alerts/{id}/messages/{id}        requester ↔ helper chat
verifications/{uid}              helper ID photos (compressed) + review status
```

SOS invariants carried over from SheShield: a missing GPS fix never blocks an SOS, contacts are texted from
the SIM before any network wait, only one SOS is open at a time, and accepting is a transaction so two helpers
can't both take the same alert.

## Known limitations

- Push notifications to helpers whose app is closed need FCM and a development build (not Expo Go). Helpers
  currently get alerts in real time while the app is open.
- Fall/shake detection and check-in run while the app is in the foreground.
- `EXPO_PUBLIC_*` keys are bundled into the app. For production, move AI calls and helper approval to a backend
  or Cloud Functions, and set `isDemo()` in `firestore.rules` to `false`.
