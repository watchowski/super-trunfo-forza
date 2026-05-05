import type { Card } from "@/domain/cards";
import type { GameState, Player } from "@/domain/game";

function now() {
  return Date.now();
}

export function sanitizeNickname(raw: string): string {
  const stripped = raw.replace(/<[^>]*>/g, "").trim().replace(/\s+/g, " ");
  if (stripped.length < 2 || stripped.length > 16) {
    throw new Error("Nickname must be 2 to 16 characters");
  }
  return stripped;
}

function makeCode(existingCodes: Set<string>) {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const code = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    if (!existingCodes.has(code)) return code;
  }
  throw new Error("Could not generate room code");
}

function makePlayer(id: "host" | "guest", nickname: string): Player {
  return {
    id,
    nickname: sanitizeNickname(nickname),
    language: "pt-BR",
    connectedAt: now(),
    wantsToEnd: false
  };
}

export function createRoom(input: { hostNickname: string; existingCodes: Set<string>; cards: Card[] }): GameState {
  const timestamp = now();
  return {
    phase: "lobby",
    code: makeCode(input.existingCodes),
    host: makePlayer("host", input.hostNickname),
    activePlayer: "host",
    roundWins: { host: 0, guest: 0 },
    decks: { host: [], guest: [] },
    tiePile: [],
    maxDeckSize: input.cards.length,
    selectedDeckSize: input.cards.length % 2 === 0 ? input.cards.length : input.cards.length - 1,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function joinRoom(room: GameState, nickname: string): GameState {
  if (room.guest) throw new Error("Room is full");
  if (room.phase !== "lobby") throw new Error("Match already started");
  return { ...room, guest: makePlayer("guest", nickname), updatedAt: now() };
}

export function kickGuest(room: GameState): GameState {
  if (room.phase !== "lobby") throw new Error("Guest can only be kicked before match starts");
  return { ...room, guest: undefined, updatedAt: now() };
}

export function saveRoom(room: GameState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`super-trunfo-room-${room.code}`, JSON.stringify(room));
}

export function loadRoom(code: string): GameState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(`super-trunfo-room-${code}`);
  return raw ? (JSON.parse(raw) as GameState) : null;
}
