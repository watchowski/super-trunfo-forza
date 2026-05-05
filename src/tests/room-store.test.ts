import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, kickGuest, sanitizeNickname } from "@/lib/room-store";
import { sampleCards } from "@/data/sample-cards";

describe("room store", () => {
  it("sanitizes nicknames and rejects invalid lengths", () => {
    expect(sanitizeNickname(" Ana ")).toBe("Ana");
    expect(sanitizeNickname("<b>Ana</b>")).toBe("Ana");
    expect(() => sanitizeNickname("A")).toThrow("Nickname must be 2 to 16 characters");
  });

  it("creates a 4 digit room with host only", () => {
    const room = createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards });
    expect(room.code).toMatch(/^\d{4}$/);
    expect(room.host?.nickname).toBe("Ana");
    expect(room.guest).toBeUndefined();
    expect(room.phase).toBe("lobby");
    expect(room.roundWins).toEqual({ host: 0, guest: 0 });
  });

  it("joins first guest and rejects second guest", () => {
    const room = createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards });
    const joined = joinRoom(room, "Leo");
    expect(joined.guest?.nickname).toBe("Leo");
    expect(() => joinRoom(joined, "Mia")).toThrow("Room is full");
  });

  it("kicks guest before match starts", () => {
    const room = joinRoom(createRoom({ hostNickname: "Ana", existingCodes: new Set(), cards: sampleCards }), "Leo");
    expect(kickGuest(room).guest).toBeUndefined();
  });
});
