import { NextResponse } from "next/server";
import { getRealtimeRoomSnapshot } from "@/lib/room-repository";

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId") ?? undefined;
    const snapshot = await getRealtimeRoomSnapshot(code, sessionId);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load room" },
      { status: 404 }
    );
  }
}
