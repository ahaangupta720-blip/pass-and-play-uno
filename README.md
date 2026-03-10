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


## Card Image Assets (Browser)

Place your card PNG files in:

```
assets/cards/
```

Naming convention used by the browser app:
- Number cards: `red-4.png`, `blue-0.png`, etc.
- Action cards: `red-skip.png`, `yellow-reverse.png`, `green-two.png` (`+2` maps to `two`)
- Wild cards: `wild-wild.png`, `wild-four.png` (`Wild +4` maps to `four`)

All color names are lowercase in filenames.


### Auto-extract from a card sheet image

If you have a full card-sheet image like the one in chat, you can auto-slice it into all required files:

```bash
python -m pip install pillow
python scripts/extract_cards.py path/to/your-sheet.png
```

Then optionally zip for download/share:

```bash
python -m zipfile -c cards.zip assets/cards/*.png
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
