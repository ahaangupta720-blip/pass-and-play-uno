const crypto = require("crypto");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const {
  COLORS,
  cardToString,
  initializeGame,
  isPlayable,
  playCard,
  drawOne,
} = require("./src/game");

function fingerprint(secret) {
  return crypto.createHash("sha256").update(secret).digest("hex").slice(0, 12);
}

function clearScreen() {
  output.write("\x1Bc");
}

async function askForPlayerSetup(rl, number) {
  const name = (await rl.question(`Player ${number} name: `)).trim() || `Player ${number}`;
  const secret = await rl.question(`Create fingerprint phrase for ${name}: `);
  const fp = fingerprint(secret);
  console.log(`Registered ${name} with fingerprint: ${fp}`);
  return { name, fingerprint: fp };
}

async function authenticateCurrentPlayer(rl, player) {
  const phrase = await rl.question(`${player.name}, enter your fingerprint phrase: `);
  const attempted = fingerprint(phrase);
  if (attempted !== player.fingerprint) {
    console.log("Fingerprint mismatch. Hand stays hidden.");
    return false;
  }
  return true;
}

async function chooseColor(rl) {
  while (true) {
    const answer = (await rl.question(`Choose a color (${COLORS.join("/")}): `)).trim();
    const match = COLORS.find((c) => c.toLowerCase() === answer.toLowerCase());
    if (match) return match;
    console.log("Invalid color.");
  }
}

function showState(game, player) {
  const top = game.discardPile[game.discardPile.length - 1];
  console.log(`Top card: ${cardToString(top)} | Active color: ${game.currentColor}`);
  console.log(`Draw pile remaining: ${game.drawPile.length}`);
  console.log("\nYour hand:");
  player.hand.forEach((card, i) => {
    const legal = isPlayable(card, top, game.currentColor) ? "(playable)" : "";
    console.log(`  [${i}] ${cardToString(card)} ${legal}`);
  });
}

async function gameLoop(rl, game) {
  while (!game.winner) {
    clearScreen();
    const player = game.players[game.currentPlayer];
    console.log(`Pass device to ${player.name}. Press Enter when ready.`);
    await rl.question("");
    clearScreen();

    const isAuthed = await authenticateCurrentPlayer(rl, player);
    if (!isAuthed) {
      await rl.question("Press Enter to continue to next prompt...");
      continue;
    }

    clearScreen();
    showState(game, player);

    const top = game.discardPile[game.discardPile.length - 1];
    const hasMove = player.hand.some((card) => isPlayable(card, top, game.currentColor));
    if (!hasMove) {
      console.log("No playable cards. Drawing one...");
      drawOne(game, game.currentPlayer);
      await rl.question("Press Enter to end your turn...");
      game.currentPlayer = (game.currentPlayer + game.direction + game.players.length) % game.players.length;
      continue;
    }

    while (true) {
      const action = (await rl.question("Play index or type D to draw: ")).trim();
      if (action.toUpperCase() === "D") {
        drawOne(game, game.currentPlayer);
        console.log("Drew one card; turn ends.");
        game.currentPlayer = (game.currentPlayer + game.direction + game.players.length) % game.players.length;
        break;
      }

      const index = Number(action);
      if (Number.isNaN(index)) {
        console.log("Please type a valid index or D.");
        continue;
      }

      try {
        const card = player.hand[index];
        let chosenColor;
        if (card && card.color === "Wild") {
          chosenColor = await chooseColor(rl);
        }
        playCard(game, game.currentPlayer, index, chosenColor);
        if (player.hand.length === 1) {
          console.log(`${player.name} says UNO!`);
        }
        break;
      } catch (error) {
        console.log(`Cannot play: ${error.message}`);
      }
    }

    if (!game.winner) {
      await rl.question("Press Enter to pass to next player...");
    }
  }
}

async function main() {
  const rl = readline.createInterface({ input, output });
  try {
    console.log("=== Fingerprint Pass-and-Play UNO (Node.js) ===");
    let count;
    while (true) {
      const answer = Number((await rl.question("How many players (2-8)? ")).trim());
      if (answer >= 2 && answer <= 8) {
        count = answer;
        break;
      }
      console.log("Please choose a value between 2 and 8.");
    }

    const players = [];
    for (let i = 1; i <= count; i++) {
      players.push(await askForPlayerSetup(rl, i));
    }

    const game = initializeGame(players);
    await gameLoop(rl, game);
    clearScreen();
    console.log(`🎉 ${game.winner} wins!`);
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});