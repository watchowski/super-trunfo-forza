import type { RoomSnapshot } from "@/domain/room-api";

export function preferNewerSnapshot(current: RoomSnapshot | null, incoming: RoomSnapshot): RoomSnapshot {
  if (!current) return incoming;
  return incoming.room.updatedAt >= current.room.updatedAt ? incoming : current;
}
