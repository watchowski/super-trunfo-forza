import { describe, expect, it } from "vitest";
import { presencePatchForViewer } from "@/lib/room-presence";

describe("room presence", () => {
  it("builds a host heartbeat patch without touching room state", () => {
    const patch = presencePatchForViewer("host", "2026-05-05T00:00:00.000Z");

    expect(patch).toEqual({
      host_last_seen_at: "2026-05-05T00:00:00.000Z"
    });
    expect("state_json" in patch).toBe(false);
  });

  it("builds a guest heartbeat patch without touching room state", () => {
    const patch = presencePatchForViewer("guest", "2026-05-05T00:00:00.000Z");

    expect(patch).toEqual({
      guest_last_seen_at: "2026-05-05T00:00:00.000Z"
    });
    expect("state_json" in patch).toBe(false);
  });
});
