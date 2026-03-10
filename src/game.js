const COLORS = ["Red", "Yellow", "Green", "Blue"];
const NUMBER_VALUES = Array.from({ length: 10 }, (_, i) => String(i));
const ACTION_VALUES = ["Skip", "Reverse", "+2"];
const WILD_VALUES = ["Wild", "Wild +4"];

function createDeck() {
  const deck = [];
  for (const color of COLORS) {
    for (const value of NUMBER_VALUES) {
      deck.push({ color, value });
      if (value !== "0") deck.push({ color, value });
    }
    for (const value of ACTION_VALUES) {
      deck.push({ color, value }, { color, value });
    }
  }
  for (let i = 0; i < 4; i++) {
    for (const value of WILD_VALUES) {
      deck.push({ color: "Wild", value });
    }
  }
  return deck;
}

function shuffle(cards, rng = Math.random) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cardToString(card) {
  return card.color === "Wild" ? card.value : `${card.color} ${card.value}`;
}

function isPlayable(card, topCard, currentColor) {
  if (card.color === "Wild") return true;
  return card.color === currentColor || card.value === topCard.value;
}

function nextPlayerIndex(current, direction, playerCount) {
  return (current + direction + playerCount) % playerCount;
}

function drawCards(game, playerIndex, count) {
  for (let i = 0; i < count; i++) {
    if (game.drawPile.length === 0) {
      if (game.discardPile.length <= 1) {
        break;
      }
      const topCard = game.discardPile.pop();
      game.drawPile = shuffle(game.discardPile);
      game.discardPile = [topCard];
    }
    const card = game.drawPile.pop();
    if (card) game.players[playerIndex].hand.push(card);
  }
}

function initializeGame(players, rng = Math.random) {
  if (players.length < 2 || players.length > 8) {
    throw new Error("UNO supports between 2 and 8 players.");
  }

  const game = {
    players: players.map((p) => ({ ...p, hand: [] })),
    drawPile: shuffle(createDeck(), rng),
    discardPile: [],
    currentPlayer: 0,
    direction: 1,
    currentColor: null,
    winner: null,
  };

  for (let i = 0; i < 7; i++) {
    for (let p = 0; p < game.players.length; p++) drawCards(game, p, 1);
  }

  let firstCard = game.drawPile.pop();
  while (firstCard && firstCard.color === "Wild") {
    game.drawPile.unshift(firstCard);
    game.drawPile = shuffle(game.drawPile, rng);
    firstCard = game.drawPile.pop();
  }

  if (!firstCard) throw new Error("Could not start game: no valid first card.");

  game.discardPile.push(firstCard);
  game.currentColor = firstCard.color;
  return game;
}

function applyActionCard(game, card) {
  const playerCount = game.players.length;
  switch (card.value) {
    case "Reverse":
      game.direction *= -1;
      if (playerCount === 2) {
        game.currentPlayer = nextPlayerIndex(game.currentPlayer, game.direction, playerCount);
      }
      break;
    case "Skip":
      game.currentPlayer = nextPlayerIndex(game.currentPlayer, game.direction, playerCount);
      break;
    case "+2": {
      const victim = nextPlayerIndex(game.currentPlayer, game.direction, playerCount);
      drawCards(game, victim, 2);
      game.currentPlayer = victim;
      break;
    }
    case "Wild +4": {
      const victim = nextPlayerIndex(game.currentPlayer, game.direction, playerCount);
      drawCards(game, victim, 4);
      game.currentPlayer = victim;
      break;
    }
    default:
      break;
  }
}

function playCard(game, playerIndex, handIndex, chosenColor) {
  if (playerIndex !== game.currentPlayer) {
    throw new Error("Not your turn.");
  }

  const player = game.players[playerIndex];
  const card = player.hand[handIndex];
  if (!card) throw new Error("Invalid card index.");

  const topCard = game.discardPile[game.discardPile.length - 1];
  if (!isPlayable(card, topCard, game.currentColor)) {
    throw new Error("Card cannot be played now.");
  }

  player.hand.splice(handIndex, 1);
  game.discardPile.push(card);

  if (card.color === "Wild") {
    if (!COLORS.includes(chosenColor)) {
      throw new Error("Wild card requires a chosen color.");
    }
    game.currentColor = chosenColor;
  } else {
    game.currentColor = card.color;
  }

  applyActionCard(game, card);

  if (player.hand.length === 0) {
    game.winner = player.name;
    return;
  }

  game.currentPlayer = nextPlayerIndex(game.currentPlayer, game.direction, game.players.length);
}

function drawOne(game, playerIndex) {
  if (playerIndex !== game.currentPlayer) {
    throw new Error("Not your turn.");
  }
  drawCards(game, playerIndex, 1);
}

module.exports = {
  COLORS,
  createDeck,
  shuffle,
  cardToString,
  isPlayable,
  initializeGame,
  playCard,
  drawOne,
};
