# Dos Pocket

Dos, in your pocket: a phone companion for [Dos Live](https://github.com/doncoding-ai/dos-live).
It started as the DEVember (notJust.dev) "BoomApp" and grew up.

It reads the same Trello boards as the desktop bar, so your PC doesn't need to be on.

- **Now:** the questions Dos is waiting on (**Do it / Hold / Skip**), the worlds that need you, and the latest pings.
- **Worlds:** all seven pills (Work, Finance, Land & Housing, Farm & Phoenix, Creative, Dons Tech, Boom). Tap one to see its cards.
- **Note:** the same as "Dos, note …". It adds a `📝` card at the top of the Dos board's **To do** list.

- **Four looks, dark or light**, the same as on the desktop. Pick one in Settings → Look:
  - **Liquid notch:** a notch at the top with Dos's eyes inside it. The eyes blink, and turn amber when a question is waiting.
  - **Terminal:** the `dos:~$` shell. Mono fonts, a blinking cursor, and keyboard-key buttons with `Y` / `H` / `N`.
  - **Presence orb:** Dos is a glowing orb ringed by your seven worlds. A world's dot lights up when it needs you.
  - **Bubble:** the orb floats over every tab and shows how many questions are waiting. Drag it or throw it and it settles on the nearest side. Tap it to jump to Now.

  The theme can be Dark, Light or Match phone. A change applies right away.

Answers are written exactly the way Dos Live writes them: the card is renamed `✅ DO IT — …` / `⏸ HOLD — …` / `✖ SKIP — …`, moved to **Dos answered**, and given a comment. Your scheduled tasks pick them up with no changes.

## Run it

Needs Node 20+ and the **Expo Go** app on your phone.

```bash
npm install
npm start
```

Scan the QR code with Expo Go (Android) or the Camera app (iPhone). Then tap **Connect Trello** and paste the same Power-Up key and token you use in Dos Live.

`npm run web` opens it in a browser too. On the web, the key and token are kept in memory only, so you enter them again each time.

## Privacy

- The key and token live in the phone's secure storage (Keychain / Keystore). They are only sent to `api.trello.com`.
- **Discreet Work** (on by default) shows Work as counts only, never card titles.
- The app renames, moves and comments on cards. It never deletes anything.

## Code

```
src/dos/core.ts     the Dos brain, ported from dos-live's dos-core crate (worlds, flags, pings, asks)
src/dos/trello.ts   the Trello calls
src/dos/store.tsx   config, polling every minute, answer + note actions
src/app/            screens (Expo Router)
src/ui/theme.tsx    the four looks × dark/light, colours and fonts from dos-live's island.css
src/ui/faces.tsx    the eyes, the orb, the orb ringed by worlds, the throwable bubble
```

```bash
npm test            # core logic tests
npm run typecheck
```
