import { hasSupabaseConfig } from "@/lib/env";
import { DemoRoomApp } from "./DemoRoomApp";
import { RealtimeRoomApp } from "./RealtimeRoomApp";

export function RoomApp({ code }: { code: string }) {
  return hasSupabaseConfig() ? <RealtimeRoomApp code={code} /> : <DemoRoomApp code={code} />;
}
