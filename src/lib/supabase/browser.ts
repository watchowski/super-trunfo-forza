"use client";

import { createClient } from "@supabase/supabase-js";
import { getSupabasePublicKey } from "@/lib/env";

let cachedClient: ReturnType<typeof createClient> | null = null;

export function getBrowserSupabaseClient() {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = getSupabasePublicKey();
  if (!url || !publicKey) return null;
  cachedClient = createClient(url, publicKey);
  return cachedClient;
}
