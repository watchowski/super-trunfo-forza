import { NextResponse } from "next/server";
import type { CreateRoomRequest } from "@/domain/room-api";
import { createRealtimeRoom } from "@/lib/room-repository";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateRoomRequest;
    const result = await createRealtimeRoom(payload.nickname);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create room" },
      { status: 400 }
    );
  }
}
