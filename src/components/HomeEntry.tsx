"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RoomMutationResponse } from "@/domain/room-api";
import { saveRoomSession } from "@/lib/room-session";

interface HomeEntryProps {
  realtimeEnabled: boolean;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Unexpected request failure");
  }
  return payload;
}

export function HomeEntry({ realtimeEnabled }: HomeEntryProps) {
  const router = useRouter();
  const [hostNickname, setHostNickname] = useState("");
  const [guestNickname, setGuestNickname] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [pendingCreate, setPendingCreate] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!realtimeEnabled) {
      router.push("/room/1234");
      return;
    }

    setPendingCreate(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: hostNickname })
      });
      const payload = await readJson<RoomMutationResponse>(response);
      if (payload.session) {
        saveRoomSession(payload.session);
      }
      router.push(`/room/${payload.snapshot.room.code}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel criar a sala.");
    } finally {
      setPendingCreate(false);
    }
  }

  async function handleJoin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!realtimeEnabled) {
      router.push(`/room/${joinCode || "1234"}`);
      return;
    }

    setPendingJoin(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode, nickname: guestNickname })
      });
      const payload = await readJson<RoomMutationResponse>(response);
      if (payload.session) {
        saveRoomSession(payload.session);
      }
      router.push(`/room/${payload.snapshot.room.code}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel entrar na sala.");
    } finally {
      setPendingJoin(false);
    }
  }

  return (
    <section className="homeGrid">
      <div className="heroCopy">
        <p className="eyebrow">Super Trunfo Forza Horizon</p>
        <h1>Crie uma sala, compartilhe o codigo e jogue online carta por carta.</h1>
        <p className="heroDescription">
          Cartas de carros inspiradas em Forza Horizon, regra classica de atributo maior vence e cartas Super Trunfo especiais para os carros de capa.
        </p>
        {!realtimeEnabled && (
          <p className="inlineNotice">
            Sem variaveis do Supabase, o app cai no modo demo local para desenvolvimento. O fluxo online verdadeiro entra assim que o ambiente for configurado.
          </p>
        )}
        {error && <p className="errorText">{error}</p>}
      </div>

      <div className="entryPanels">
        <form className="panel entryPanel" onSubmit={handleCreate}>
          <p className="eyebrow">Host</p>
          <h2>Criar sala</h2>
          <label className="field">
            <span>Apelido</span>
            <input
              required
              minLength={2}
              maxLength={16}
              value={hostNickname}
              onChange={(event) => setHostNickname(event.target.value)}
              placeholder="Seu apelido"
            />
          </label>
          <button className="primaryButton" type="submit" disabled={pendingCreate}>
            {pendingCreate ? "Criando..." : realtimeEnabled ? "Criar sala" : "Abrir demo"}
          </button>
        </form>

        <form className="panel entryPanel" onSubmit={handleJoin}>
          <p className="eyebrow">Convidado</p>
          <h2>Entrar em sala</h2>
          <label className="field">
            <span>Codigo</span>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{4}"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
            />
          </label>
          <label className="field">
            <span>Apelido</span>
            <input
              required
              minLength={2}
              maxLength={16}
              value={guestNickname}
              onChange={(event) => setGuestNickname(event.target.value)}
              placeholder="Seu apelido"
            />
          </label>
          <button className="ghostButton" type="submit" disabled={pendingJoin}>
            {pendingJoin ? "Entrando..." : realtimeEnabled ? "Entrar" : "Abrir sala demo"}
          </button>
        </form>
      </div>
    </section>
  );
}
