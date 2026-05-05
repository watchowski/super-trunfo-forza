import type { PlayerId } from "@/domain/cards";

export function presencePatchForViewer(viewer: PlayerId, timestamp: string) {
  if (viewer === "host") {
    return {
      host_last_seen_at: timestamp
    };
  }

  return {
    guest_last_seen_at: timestamp
  };
}
