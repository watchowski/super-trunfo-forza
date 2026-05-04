import { NextResponse } from "next/server";
import type { JoinRoomRequest } from "@/domain/room-api";
import { joinRealtimeRoom } from "@/lib/room-repository";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as JoinRoomRequest;
    const result = await joinRealtimeRoom(payload.code, payload.nickname);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not join room" },
      { status: 400 }
    );
  }
}
