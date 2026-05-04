import { HomeEntry } from "@/components/HomeEntry";
import { hasSupabaseConfig } from "@/lib/env";

export default function HomePage() {
  return (
    <main className="shell">
      <HomeEntry realtimeEnabled={hasSupabaseConfig()} />
    </main>
  );
}
