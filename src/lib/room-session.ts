"use client";

import type { RoomSession } from "@/domain/room-api";

function key(code: string) {
  return `super-trunfo-session-${code}`;
}

export function loadRoomSession(code: string): RoomSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key(code));
  return raw ? (JSON.parse(raw) as RoomSession) : null;
}

export function saveRoomSession(session: RoomSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key(session.code), JSON.stringify(session));
}

export function clearRoomSession(code: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key(code));
}
