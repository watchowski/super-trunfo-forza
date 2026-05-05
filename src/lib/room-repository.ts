import { randomUUID } from "node:crypto";
import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { PlayerId } from "@/domain/cards";
import type { RoomMutationResponse, RoomSession, RoomSnapshot, ActionRequest } from "@/domain/room-api";
import type { GameState } from "@/domain/game";
import type { RoomAction } from "@/domain/room-actions";
import { applyRoomAction } from "@/domain/room-actions";
import { hasSupabaseConfig } from "@/lib/env";
import { loadCatalogCards } from "@/lib/catalog";
import { presencePatchForViewer } from "@/lib/room-presence";
import { createRoom, joinRoom } from "@/lib/room-store";
import { getServiceSupabaseClient } from "@/lib/supabase/server";

type RoomRow = {
  code: string;
  state_json: GameState;
  host_session_id: string;
  guest_session_id: string | null;
  host_last_seen_at: string;
  guest_last_seen_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
};

const ROOM_TTL_HOURS = 6;
const ABANDONMENT_MS = 2 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function addHours(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function generateCode() {
  return Math.floor(Math.random() * 10000).toString().padStart(4, "0");
}

function roomSnapshot(row: RoomRow, sessionId?: string): RoomSnapshot {
  return {
    room: row.state_json,
    viewer: getViewerForSession(row, sessionId),
    canJoin: row.state_json.phase === "lobby" && !row.state_json.guest,
    isRealtime: true
  };
}

function getViewerForSession(row: RoomRow, sessionId?: string): PlayerId | undefined {
  if (!sessionId) return undefined;
  if (row.host_session_id === sessionId) return "host";
  if (row.guest_session_id === sessionId) return "guest";
  return undefined;
}

function shouldAbandon(lastSeenAt: string | null | undefined) {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() >= ABANDONMENT_MS;
}

function applyAbandonment(row: RoomRow): RoomRow {
  if (row.state_json.phase === "finished") return row;
  const hostTimedOut = shouldAbandon(row.host_last_seen_at);
  const guestTimedOut = shouldAbandon(row.guest_last_seen_at);

  if (!hostTimedOut && !guestTimedOut) return row;
  if (hostTimedOut && guestTimedOut) return row;

  const winner: PlayerId = hostTimedOut ? "guest" : "host";
  const state = {
    ...row.state_json,
    phase: "finished",
    result: { winner, reason: "abandonment" as const },
    updatedAt: Date.now()
  } satisfies GameState;

  return {
    ...row,
    state_json: state,
    updated_at: nowIso(),
    expires_at: addHours(ROOM_TTL_HOURS)
  };
}

async function cleanupExpiredRooms() {
  const supabase = getServiceSupabaseClient();
  await supabase.from("rooms").delete().lt("expires_at", nowIso());
}

async function getRoomRow(code: string) {
  const supabase = getServiceSupabaseClient();
  const response = await supabase.from("rooms").select("*").eq("code", code).maybeSingle<RoomRow>();
  if (response.error) {
    throw response.error;
  }
  return response.data ?? null;
}

async function persistRow(row: RoomRow) {
  const supabase = getServiceSupabaseClient();
  const payload = {
    ...row,
    updated_at: nowIso(),
    expires_at: addHours(ROOM_TTL_HOURS)
  };
  const response = await supabase.from("rooms").upsert(payload).select("*").single<RoomRow>();
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

async function persistPresence(code: string, viewer: PlayerId) {
  const supabase = getServiceSupabaseClient();
  const timestamp = nowIso();
  const payload = {
    ...presencePatchForViewer(viewer, timestamp),
    updated_at: timestamp,
    expires_at: addHours(ROOM_TTL_HOURS)
  };
  const response = await supabase.from("rooms").update(payload).eq("code", code).select("*").single<RoomRow>();
  if (response.error) {
    throw response.error;
  }
  return response.data;
}

function actionFromRequest(request: ActionRequest, cards?: Awaited<ReturnType<typeof loadCatalogCards>>): RoomAction | null {
  switch (request.action) {
    case "set_deck_size":
      return { type: "set_deck_size", deckSize: request.deckSize };
    case "kick_guest":
      return { type: "kick_guest" };
    case "start_match":
      if (!cards) throw new Error("Catalog is required to start the match");
      return { type: "start_match", seed: `${Date.now()}:start`, cards };
    case "choose_stat":
      return { type: "choose_stat", stat: request.stat, seed: `${Date.now()}:round` };
    case "advance_round":
      return { type: "advance_round" };
    case "set_end_request":
      return { type: "set_end_request", enabled: request.enabled };
    case "rematch":
      if (!cards) throw new Error("Catalog is required to start the rematch");
      return { type: "rematch", seed: `${Date.now()}:rematch`, cards };
    case "heartbeat":
      return null;
    default:
      return null;
  }
}

function touchPresence(row: RoomRow, viewer: PlayerId) {
  const timestamp = nowIso();
  if (viewer === "host") {
    return {
      ...row,
      host_last_seen_at: timestamp,
      state_json: {
        ...row.state_json,
        host: row.state_json.host
          ? { ...row.state_json.host, disconnectedAt: undefined }
          : row.state_json.host
      }
    };
  }

  return {
    ...row,
    guest_last_seen_at: timestamp,
    state_json: {
      ...row.state_json,
      guest: row.state_json.guest
        ? { ...row.state_json.guest, disconnectedAt: undefined }
        : row.state_json.guest
    }
  };
}

export async function createRealtimeRoom(nickname: string): Promise<RoomMutationResponse> {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured");
  }

  await cleanupExpiredRooms();
  const cards = await loadCatalogCards();
  const hostSessionId = randomUUID();

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const state = createRoom({ hostNickname: nickname, existingCodes: new Set(), cards });
    const code = generateCode();
    const timestamp = nowIso();
    const row: RoomRow = {
      code,
      state_json: { ...state, code },
      host_session_id: hostSessionId,
      guest_session_id: null,
      host_last_seen_at: timestamp,
      guest_last_seen_at: null,
      expires_at: addHours(ROOM_TTL_HOURS),
      created_at: timestamp,
      updated_at: timestamp
    };

    try {
      const created = await persistRow(row);
      const session: RoomSession = {
        code: created.code,
        viewer: "host",
        sessionId: hostSessionId,
        nickname: created.state_json.host?.nickname ?? nickname
      };

      return { snapshot: roomSnapshot(created, hostSessionId), session };
    } catch (error) {
      const duplicate = typeof error === "object" && error !== null && "code" in error && error.code === "23505";
      if (!duplicate) throw error;
    }
  }

  throw new Error("Could not create a unique room code");
}

export async function joinRealtimeRoom(code: string, nickname: string): Promise<RoomMutationResponse> {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured");
  }

  await cleanupExpiredRooms();
  const row = await getRoomRow(code);
  if (!row) throw new Error("Room not found");
  const resolved = applyAbandonment(row);
  if (resolved.state_json.phase !== "lobby") throw new Error("Match already started");
  if (resolved.state_json.guest) throw new Error("Room is full");

  const guestSessionId = randomUUID();
  const joinedState = joinRoom(resolved.state_json, nickname);
  const updated = await persistRow({
    ...resolved,
    state_json: joinedState,
    guest_session_id: guestSessionId,
    guest_last_seen_at: nowIso()
  });

  return {
    snapshot: roomSnapshot(updated, guestSessionId),
    session: {
      code: updated.code,
      viewer: "guest",
      sessionId: guestSessionId,
      nickname: updated.state_json.guest?.nickname ?? nickname
    }
  };
}

export async function getRealtimeRoomSnapshot(code: string, sessionId?: string): Promise<RoomSnapshot> {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured");
  }

  const row = await getRoomRow(code);
  if (!row) throw new Error("Room not found");
  const resolved = applyAbandonment(row);
  const persisted = resolved === row ? row : await persistRow(resolved);
  return roomSnapshot(persisted, sessionId);
}

export async function applyRealtimeRoomAction(code: string, request: ActionRequest): Promise<RoomSnapshot> {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase is not configured");
  }

  const row = await getRoomRow(code);
  if (!row) throw new Error("Room not found");
  const resolved = applyAbandonment(row);
  const viewer = getViewerForSession(resolved, request.sessionId);
  if (!viewer) throw new Error("Session is not allowed in this room");

  if (request.action === "heartbeat") {
    const heartbeatRow = resolved === row ? row : await persistRow(resolved);
    const updated = await persistPresence(heartbeatRow.code, viewer);
    return roomSnapshot(updated, request.sessionId);
  }

  const touched = touchPresence(resolved, viewer);
  const cards =
    request.action === "start_match" || request.action === "rematch" ? await loadCatalogCards() : undefined;
  const domainAction = actionFromRequest(request, cards);
  const nextState = domainAction ? applyRoomAction(touched.state_json, viewer, domainAction) : touched.state_json;
  const updated = await persistRow({
    ...touched,
    state_json: nextState
  });

  return roomSnapshot(updated, request.sessionId);
}
