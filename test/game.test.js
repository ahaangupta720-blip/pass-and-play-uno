const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createDeck,
  initializeGame,
  isPlayable,
  playCard,
} = require('../src/game');

test('deck has correct UNO size', () => {
  const deck = createDeck();
  assert.equal(deck.length, 108);
});

test('initialization deals 7 cards to each player', () => {
  const game = initializeGame([{ name: 'A' }, { name: 'B' }], () => 0.42);
  assert.equal(game.players[0].hand.length, 7);
  assert.equal(game.players[1].hand.length, 7);
  assert.equal(game.discardPile.length, 1);
});

test('isPlayable checks color or value or wild', () => {
  const top = { color: 'Red', value: '5' };
  assert.equal(isPlayable({ color: 'Red', value: '1' }, top, 'Red'), true);
  assert.equal(isPlayable({ color: 'Blue', value: '5' }, top, 'Red'), true);
  assert.equal(isPlayable({ color: 'Wild', value: 'Wild' }, top, 'Red'), true);
  assert.equal(isPlayable({ color: 'Blue', value: '7' }, top, 'Red'), false);
});

test('playing final card wins game', () => {
  const game = initializeGame([{ name: 'A' }, { name: 'B' }], () => 0.1);
  game.players[0].hand = [{ color: game.currentColor, value: '9' }];
  playCard(game, 0, 0);
  assert.equal(game.winner, 'A');
});
