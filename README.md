# Fingerprint Pass-and-Play UNO (Node.js + Browser)

A pass-and-play UNO game with fingerprint phrase locks.

You can run it as:
- Terminal CLI (`npm start`)
- Browser app (`index.html`)

Each player creates a secret phrase. The game stores only a short hash fingerprint, and each turn requires entering the phrase before that player's cards are shown.

## Run CLI

```bash
npm install
npm start
```

## Run Browser App

Open `index.html` directly in your browser.

Or serve the folder and open it in browser:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080/index.html`.


## Run Python CLI

```bash
python uno.py
```

## Test

```bash
npm test
```

## Notes

- Supports 2-8 players.
- Fingerprint phrase entry is hidden in CLI and password-field based in browser UI.
- Uses standard UNO deck size (108 cards).
- Includes action cards: Skip, Reverse, +2, Wild, Wild +4.
