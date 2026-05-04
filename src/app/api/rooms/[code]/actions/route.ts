import { NextResponse } from "next/server";
import type { ActionRequest } from "@/domain/room-api";
import { applyRealtimeRoomAction } from "@/lib/room-repository";

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await context.params;
    const payload = (await request.json()) as ActionRequest;
    const snapshot = await applyRealtimeRoomAction(code, payload);
    return NextResponse.json({ snapshot });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update room" },
      { status: 400 }
    );
  }
}
