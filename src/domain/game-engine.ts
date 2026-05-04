import type { Card, ComparableStat, PlayerId } from "./cards";
import type { GameState, MatchResult, Player, RoundResult } from "./game";

interface CreateInitialGameInput {
  code: string;
  hostNickname: string;
  guestNickname: string;
  cards: Card[];
  deckSize: number;
  seed: string;
}

function now() {
  return Date.now();
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: string) {
  let state = hashSeed(seed);
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

export function shuffleCards(cards: Card[], seed: string) {
  if (seed === "ordered") return [...cards];
  const random = seededRandom(seed);
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makePlayer(id: PlayerId, nickname: string): Player {
  return {
    id,
    nickname,
    language: "pt-BR",
    connectedAt: now(),
    wantsToEnd: false
  };
}

export function createInitialGame(input: CreateInitialGameInput): GameState {
  if (input.deckSize % 2 !== 0) throw new Error("Deck size must be even");
  if (input.deckSize > input.cards.length) throw new Error("Deck size exceeds available cards");
  const selected = shuffleCards(input.cards, input.seed).slice(0, input.deckSize);
  const random = seededRandom(`${input.seed}:active`);
  const activePlayer: PlayerId = random() >= 0.5 ? "host" : "guest";
  const timestamp = now();

  return {
    phase: "playing",
    code: input.code,
    host: makePlayer("host", input.hostNickname),
    guest: makePlayer("guest", input.guestNickname),
    activePlayer,
    decks: {
      host: selected.filter((_, index) => index % 2 === 0),
      guest: selected.filter((_, index) => index % 2 === 1)
    },
    tiePile: [],
    maxDeckSize: input.cards.length,
    selectedDeckSize: input.deckSize,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function compareCards(hostCard: Card, guestCard: Card, attribute: ComparableStat): RoundResult["winner"] {
  if (hostCard.isSuperTrunfo && !guestCard.isSuperTrunfo) return "host";
  if (!hostCard.isSuperTrunfo && guestCard.isSuperTrunfo) return "guest";
  const hostValue = hostCard.stats[attribute];
  const guestValue = guestCard.stats[attribute];
  if (hostValue === guestValue) return "tie";
  return hostValue > guestValue ? "host" : "guest";
}

function resultReason(hostCard: Card, guestCard: Card): RoundResult["reason"] {
  if (hostCard.isSuperTrunfo && guestCard.isSuperTrunfo) return "super-trunfo-attribute";
  if (hostCard.isSuperTrunfo || guestCard.isSuperTrunfo) return "super-trunfo";
  return "attribute";
}

export function resolveRound(game: GameState, attribute: ComparableStat, seed: string): GameState {
  if (game.phase !== "playing") throw new Error("Round can only resolve during playing phase");
  const hostCard = game.decks.host[0];
  const guestCard = game.decks.guest[0];
  if (!hostCard || !guestCard) throw new Error("Both players need a card");

  const hostDeck = game.decks.host.slice(1);
  const guestDeck = game.decks.guest.slice(1);
  const winner = compareCards(hostCard, guestCard, attribute);
  const currentPile = [...game.tiePile, hostCard, guestCard];
  const lastRound: RoundResult = {
    attribute,
    hostCard,
    guestCard,
    winner,
    reason: resultReason(hostCard, guestCard),
    pileSize: currentPile.length
  };

  if (winner === "tie") {
    return {
      ...game,
      phase: "revealed",
      decks: { host: hostDeck, guest: guestDeck },
      tiePile: currentPile,
      lastRound,
      updatedAt: now()
    };
  }

  const wonCards = shuffleCards(currentPile, seed);
  const decks = {
    host: winner === "host" ? [...hostDeck, ...wonCards] : hostDeck,
    guest: winner === "guest" ? [...guestDeck, ...wonCards] : guestDeck
  };

  const result = getCardsFinishResult(decks);
  return {
    ...game,
    phase: result ? "finished" : "revealed",
    activePlayer: winner,
    decks,
    tiePile: [],
    lastRound,
    result,
    updatedAt: now()
  };
}

function getCardsFinishResult(decks: GameState["decks"]): MatchResult | undefined {
  if (decks.host.length === 0) return { winner: "guest", reason: "cards" };
  if (decks.guest.length === 0) return { winner: "host", reason: "cards" };
  return undefined;
}

export function advanceAfterReveal(game: GameState): GameState {
  if (game.phase !== "revealed") throw new Error("Can only advance after reveal");
  const result = getCardsFinishResult(game.decks);
  return {
    ...game,
    phase: result ? "finished" : "playing",
    result,
    updatedAt: now()
  };
}

export function requestMutualEnd(game: GameState, playerId: PlayerId): GameState {
  const player = game[playerId];
  if (!player) throw new Error("Player is not in room");
  const updatedPlayer = { ...player, wantsToEnd: !player.wantsToEnd };
  const next = { ...game, [playerId]: updatedPlayer, updatedAt: now() } satisfies GameState;

  if (next.host?.wantsToEnd && next.guest?.wantsToEnd) {
    const hostCount = next.decks.host.length;
    const guestCount = next.decks.guest.length;
    const winner = hostCount === guestCount ? "draw" : hostCount > guestCount ? "host" : "guest";
    return {
      ...next,
      phase: "finished",
      result: { winner, reason: "mutual" }
    };
  }

  return next;
}
