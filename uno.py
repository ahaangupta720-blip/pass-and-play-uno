#!/usr/bin/env python3
"""Pass-and-Play UNO with fingerprint-locked hands (Python CLI)."""

from __future__ import annotations

import hashlib
import random
from dataclasses import dataclass, field
from getpass import getpass

COLORS = ["Red", "Yellow", "Green", "Blue"]
NUMBER_VALUES = [str(i) for i in range(10)]
ACTION_VALUES = ["Skip", "Reverse", "+2"]
WILD_VALUES = ["Wild", "Wild +4"]


@dataclass
class Card:
    color: str
    value: str

    def text(self) -> str:
        return self.value if self.color == "Wild" else f"{self.color} {self.value}"


@dataclass
class Player:
    name: str
    fingerprint: str
    hand: list[Card] = field(default_factory=list)


@dataclass
class Game:
    players: list[Player]
    draw_pile: list[Card]
    discard_pile: list[Card]
    current_player: int
    direction: int
    current_color: str
    winner: str | None


def clear_screen() -> None:
    print("\033c", end="")


def fingerprint(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()[:12]


def create_deck() -> list[Card]:
    deck: list[Card] = []
    for color in COLORS:
        for value in NUMBER_VALUES:
            deck.append(Card(color, value))
            if value != "0":
                deck.append(Card(color, value))
        for value in ACTION_VALUES:
            deck.append(Card(color, value))
            deck.append(Card(color, value))
    for _ in range(4):
        for value in WILD_VALUES:
            deck.append(Card("Wild", value))
    return deck


def is_playable(card: Card, top_card: Card, current_color: str) -> bool:
    return card.color == "Wild" or card.color == current_color or card.value == top_card.value


def next_player_index(current: int, direction: int, player_count: int) -> int:
    return (current + direction + player_count) % player_count


def draw_cards(game: Game, player_index: int, count: int) -> None:
    for _ in range(count):
        if not game.draw_pile:
            if len(game.discard_pile) <= 1:
                break
            top = game.discard_pile.pop()
            game.draw_pile = game.discard_pile[:]
            random.shuffle(game.draw_pile)
            game.discard_pile = [top]

        if game.draw_pile:
            game.players[player_index].hand.append(game.draw_pile.pop())


def initialize_game(players: list[Player]) -> Game:
    if not 2 <= len(players) <= 8:
        raise ValueError("UNO supports between 2 and 8 players.")

    deck = create_deck()
    random.shuffle(deck)

    game = Game(
        players=players,
        draw_pile=deck,
        discard_pile=[],
        current_player=0,
        direction=1,
        current_color="Red",
        winner=None,
    )

    for _ in range(7):
        for idx in range(len(game.players)):
            draw_cards(game, idx, 1)

    first = game.draw_pile.pop()
    while first.color == "Wild":
        game.draw_pile.insert(0, first)
        random.shuffle(game.draw_pile)
        first = game.draw_pile.pop()

    game.discard_pile.append(first)
    game.current_color = first.color
    return game


def apply_action_card(game: Game, card: Card) -> None:
    count = len(game.players)
    if card.value == "Reverse":
        game.direction *= -1
        if count == 2:
            game.current_player = next_player_index(game.current_player, game.direction, count)
    elif card.value == "Skip":
        game.current_player = next_player_index(game.current_player, game.direction, count)
    elif card.value == "+2":
        victim = next_player_index(game.current_player, game.direction, count)
        draw_cards(game, victim, 2)
        game.current_player = victim
    elif card.value == "Wild +4":
        victim = next_player_index(game.current_player, game.direction, count)
        draw_cards(game, victim, 4)
        game.current_player = victim


def choose_color() -> str:
    while True:
        answer = input(f"Choose a color ({'/'.join(COLORS)}): ").strip().lower()
        for c in COLORS:
            if c.lower() == answer:
                return c
        print("Invalid color.")


def show_state(game: Game, player: Player) -> None:
    top = game.discard_pile[-1]
    print(f"Top card: {top.text()} | Active color: {game.current_color}")
    print(f"Draw pile remaining: {len(game.draw_pile)}")
    print("\nYour hand:")
    for i, card in enumerate(player.hand):
        legal = "(playable)" if is_playable(card, top, game.current_color) else ""
        print(f"  [{i}] {card.text()} {legal}")


def authenticate_player(player: Player) -> bool:
    phrase = getpass(f"{player.name}, enter your fingerprint phrase: ")
    if fingerprint(phrase) != player.fingerprint:
        print("Fingerprint mismatch. Hand stays hidden.")
        return False
    return True


def game_loop(game: Game) -> None:
    while not game.winner:
        clear_screen()
        player = game.players[game.current_player]
        input(f"Pass device to {player.name}. Press Enter when ready.")

        if not authenticate_player(player):
            input("Press Enter to continue...")
            continue

        clear_screen()
        show_state(game, player)
        top = game.discard_pile[-1]

        has_move = any(is_playable(card, top, game.current_color) for card in player.hand)
        if not has_move:
            print("No playable cards. Drawing one...")
            draw_cards(game, game.current_player, 1)
            input("Press Enter to end your turn...")
            game.current_player = next_player_index(game.current_player, game.direction, len(game.players))
            continue

        while True:
            action = input("Play index or type D to draw: ").strip()
            if action.upper() == "D":
                draw_cards(game, game.current_player, 1)
                print("Drew one card; turn ends.")
                game.current_player = next_player_index(game.current_player, game.direction, len(game.players))
                break

            try:
                idx = int(action)
                card = player.hand[idx]
            except (ValueError, IndexError):
                print("Please enter a valid card index or D.")
                continue

            if not is_playable(card, top, game.current_color):
                print("Card cannot be played now.")
                continue

            player.hand.pop(idx)
            game.discard_pile.append(card)
            game.current_color = choose_color() if card.color == "Wild" else card.color
            apply_action_card(game, card)

            if len(player.hand) == 0:
                game.winner = player.name
                break

            if len(player.hand) == 1:
                print(f"{player.name} says UNO!")

            game.current_player = next_player_index(game.current_player, game.direction, len(game.players))
            break

        if not game.winner:
            input("Press Enter to pass to next player...")


def ask_player_setup(number: int) -> Player:
    clear_screen()
    name = input(f"Player {number} name: ").strip() or f"Player {number}"
    secret = getpass(f"Create fingerprint phrase for {name}: ")
    fp = fingerprint(secret)
    clear_screen()
    print(f"Registered {name} with fingerprint: {fp}")
    input("Press Enter to continue...")
    return Player(name=name, fingerprint=fp)


def main() -> None:
    clear_screen()
    print("=== Fingerprint Pass-and-Play UNO (Python) ===")

    while True:
        try:
            count = int(input("How many players (2-8)? ").strip())
            if 2 <= count <= 8:
                break
        except ValueError:
            pass
        print("Please choose a number between 2 and 8.")

    players = [ask_player_setup(i) for i in range(1, count + 1)]
    game = initialize_game(players)
    game_loop(game)
    clear_screen()
    print(f"🎉 {game.winner} wins!")


if __name__ == "__main__":
    main()
