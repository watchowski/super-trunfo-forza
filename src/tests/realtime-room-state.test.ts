import { describe, expect, it } from "vitest";
import type { RoomSnapshot } from "@/domain/room-api";
import { preferNewerSnapshot } from "@/components/realtime-room-state";

function snapshot(updatedAt: number, phase: "lobby" | "playing" | "revealed" | "finished"): RoomSnapshot {
  return {
    room: {
      code: "1234",
      phase,
      host: { id: "host", nickname: "Ana", language: "pt-BR", connectedAt: 1, wantsToEnd: false },
      guest: { id: "guest", nickname: "Leo", language: "pt-BR", connectedAt: 1, wantsToEnd: false },
      activePlayer: "host",
      roundWins: { host: 0, guest: 0 },
      decks: { host: [], guest: [] },
      tiePile: [],
      maxDeckSize: 10,
      selectedDeckSize: 10,
      createdAt: 1,
      updatedAt
    },
    viewer: "host",
    canJoin: false,
    isRealtime: true
  };
}

describe("realtime room state", () => {
  it("keeps the current snapshot when an older one arrives later", () => {
    const current = snapshot(200, "playing");
    const stale = snapshot(100, "revealed");

    expect(preferNewerSnapshot(current, stale)).toBe(current);
  });

  it("accepts a newer snapshot", () => {
    const current = snapshot(100, "revealed");
    const incoming = snapshot(200, "playing");

    expect(preferNewerSnapshot(current, incoming)).toBe(incoming);
  });

  it("uses the incoming snapshot when there is no current state yet", () => {
    const incoming = snapshot(100, "lobby");

    expect(preferNewerSnapshot(null, incoming)).toBe(incoming);
  });
});
