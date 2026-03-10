# Fingerprint Pass-and-Play UNO (Node.js)

A local pass-and-play UNO game you run in terminal with Node.js.

Each player creates a secret phrase. The game stores only a short hash fingerprint, and each turn requires entering the phrase before that player's cards are shown.

## Run

```bash
npm install
npm start
```

## Test

```bash
npm test
```

## Notes

- Supports 2-8 players.
- Uses standard UNO deck size (108 cards).
- Includes action cards: Skip, Reverse, +2, Wild, Wild +4.
