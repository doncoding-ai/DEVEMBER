# Dos Pocket

Dos, in your pocket: a phone companion for [Dos Live](https://github.com/doncoding-ai/dos-live).
It started as the DEVember (notJust.dev) "BoomApp" and grew up.

It reads the same Trello boards as the desktop bar, so your PC doesn't need to be on.

- **Now:** the questions Dos is waiting on (**Do it / Hold / Skip**), the worlds that need you, and the latest pings.
- **Worlds:** all seven pills (Work, Finance, Land & Housing, Farm & Phoenix, Creative, Dons Tech, Boom). Tap one to see its cards.
- **Note:** the same as "Dos, note …". It adds a `📝` card at the top of the Dos board's **To do** list.

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
```

```bash
npm test            # core logic tests
npm run typecheck
```
