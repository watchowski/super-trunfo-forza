"use client";

import { useEffect, useState } from "react";
import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import type { ActionRequest, RoomMutationResponse, RoomSession, RoomSnapshot } from "@/domain/room-api";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { clearRoomSession, loadRoomSession, saveRoomSession } from "@/lib/room-session";
import { GameView } from "./GameView";
import { LanguageSelect } from "./LanguageSelect";
import { LobbyView } from "./LobbyView";
import { ResultView } from "./ResultView";
import { RulesModal } from "./RulesModal";
import { SoundToggle } from "./SoundToggle";
import { useGameSounds } from "./use-game-sounds";
import { preferNewerSnapshot } from "./realtime-room-state";

interface RealtimeRoomAppProps {
  code: string;
}

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "Unexpected request failure");
  }
  return payload;
}

export function RealtimeRoomApp({ code }: RealtimeRoomAppProps) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [language, setLanguage] = useState<Language>("pt-BR");
  const [muted, setMuted] = useState(false);
  const [pendingJoin, setPendingJoin] = useState(false);
  const [pendingActionLabel, setPendingActionLabel] = useState<string | null>(null);
  const [joinNickname, setJoinNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<RoomSession | null>(() => loadRoomSession(code));
  const viewer = snapshot?.viewer ?? session?.viewer;
  useGameSounds(snapshot?.room ?? null, muted);

  useEffect(() => {
    let cancelled = false;

    async function fetchSnapshot() {
      try {
        const response = await fetch(`/api/rooms/${code}${session ? `?sessionId=${encodeURIComponent(session.sessionId)}` : ""}`);
        const payload = await readJson<RoomSnapshot>(response);
        if (!cancelled) {
          setSnapshot((current) => preferNewerSnapshot(current, payload));
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError instanceof Error ? requestError.message : "Nao foi possivel carregar a sala.");
        }
      }
    }

    void fetchSnapshot();
    return () => {
      cancelled = true;
    };
  }, [code, session]);

  useEffect(() => {
    const client = getBrowserSupabaseClient();
    if (!client) return;

    const channel = client
      .channel(`room-${code}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `code=eq.${code}` },
        () => {
          const currentSession = loadRoomSession(code);
          void fetch(`/api/rooms/${code}${currentSession ? `?sessionId=${encodeURIComponent(currentSession.sessionId)}` : ""}`)
            .then((response) => readJson<RoomSnapshot>(response))
            .then((payload) => setSnapshot((current) => preferNewerSnapshot(current, payload)))
            .catch(() => undefined);
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [code]);

  useEffect(() => {
    if (!session) return;
    const interval = window.setInterval(() => {
      void mutate({ sessionId: session.sessionId, action: "heartbeat" }, { silent: true });
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [session]);

  async function mutate(request: ActionRequest, options?: { pendingLabel?: string; silent?: boolean }) {
    if (!options?.silent) {
      setError(null);
      setPendingActionLabel(options?.pendingLabel ?? null);
    }

    try {
      const response = await fetch(`/api/rooms/${code}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request)
      });
      const payload = await readJson<RoomMutationResponse>(response);
      if (payload.session) {
        saveRoomSession(payload.session);
        setSession(payload.session);
      }
      setSnapshot((current) => preferNewerSnapshot(current, payload.snapshot));
      return payload.snapshot;
    } finally {
      if (!options?.silent) {
        setPendingActionLabel(null);
      }
    }
  }

  async function joinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPendingJoin(true);
    setError(null);
    try {
      const response = await fetch("/api/rooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, nickname: joinNickname })
      });
      const payload = await readJson<RoomMutationResponse>(response);
      if (payload.session) {
        saveRoomSession(payload.session);
        setSession(payload.session);
      }
      setSnapshot((current) => preferNewerSnapshot(current, payload.snapshot));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel entrar na sala.");
    } finally {
      setPendingJoin(false);
    }
  }

  if (!snapshot) {
    return (
      <main className="shell">
        <section className="panel loadingPanel">
          <p className="eyebrow">Sala {code}</p>
          <h1>Carregando sala...</h1>
          {error && <p className="errorText">{error}</p>}
        </section>
      </main>
    );
  }

  if (!viewer) {
    return (
      <main className="shell">
        <header className="topbar">
          <strong>Super Trunfo Forza</strong>
          <div className="topbarActions">
            <LanguageSelect value={language} onChange={setLanguage} />
            <RulesModal language={language} />
            <SoundToggle muted={muted} onToggle={() => setMuted((value) => !value)} />
          </div>
        </header>
        <section className="panel guestGate">
          <p className="eyebrow">Sala {snapshot.room.code}</p>
          <h1>{snapshot.canJoin ? "Entrar na partida" : "Sala cheia"}</h1>
          {snapshot.canJoin ? (
            <form className="guestJoinForm" onSubmit={joinRoom}>
              <label className="field">
                <span>Apelido</span>
                <input
                  required
                  minLength={2}
                  maxLength={16}
                  value={joinNickname}
                  onChange={(event) => setJoinNickname(event.target.value)}
                  placeholder="Seu apelido"
                />
              </label>
              <button className="primaryButton" type="submit" disabled={pendingJoin}>
                {pendingJoin ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <p className="heroDescription">Essa sala ja tem dois jogadores ou a partida ja comecou.</p>
          )}
          {error && <p className="errorText">{error}</p>}
        </section>
      </main>
    );
  }

  const room = snapshot.room;

  return (
    <main className="shell">
      <header className="topbar">
        <strong>Super Trunfo Forza</strong>
        <div className="topbarActions">
          <span className="roomCodeBadge">Sala {room.code}</span>
          <LanguageSelect value={language} onChange={setLanguage} />
          <RulesModal language={language} />
          <SoundToggle muted={muted} onToggle={() => setMuted((value) => !value)} />
        </div>
      </header>
      {room.phase === "lobby" && (
        <LobbyView
          room={room}
          viewer={viewer}
          language={language}
          isPending={Boolean(pendingActionLabel)}
          pendingLabel={pendingActionLabel}
          onStart={() =>
            mutate(
              { sessionId: session!.sessionId, action: "start_match" },
              { pendingLabel: language === "pt-BR" ? "Iniciando partida..." : "Starting match..." }
            ).catch((requestError) => setError(requestError.message))
          }
          onDeckSizeChange={(deckSize) =>
            mutate(
              { sessionId: session!.sessionId, action: "set_deck_size", deckSize },
              { pendingLabel: language === "pt-BR" ? "Atualizando baralho..." : "Updating deck..." }
            ).catch((requestError) => setError(requestError.message))
          }
          onKickGuest={() =>
            mutate(
              { sessionId: session!.sessionId, action: "kick_guest" },
              { pendingLabel: language === "pt-BR" ? "Atualizando sala..." : "Updating room..." }
            ).catch((requestError) => setError(requestError.message))
          }
        />
      )}
      {(room.phase === "playing" || room.phase === "revealed") && (
        <GameView
          room={room}
          viewer={viewer}
          language={language}
          isPending={Boolean(pendingActionLabel)}
          pendingLabel={pendingActionLabel}
          onChoose={(stat: ComparableStat) =>
            mutate(
              { sessionId: session!.sessionId, action: "choose_stat", stat },
              { pendingLabel: language === "pt-BR" ? "Revelando cartas..." : "Revealing cards..." }
            ).catch((requestError) => setError(requestError.message))
          }
          onNextRound={() =>
            mutate(
              { sessionId: session!.sessionId, action: "advance_round" },
              { pendingLabel: language === "pt-BR" ? "Preparando proxima rodada..." : "Preparing next round..." }
            ).catch((requestError) => setError(requestError.message))
          }
          onToggleEnd={(enabled: boolean) =>
            mutate(
              { sessionId: session!.sessionId, action: "set_end_request", enabled },
              { pendingLabel: language === "pt-BR" ? "Atualizando solicitacao..." : "Updating request..." }
            ).catch((requestError) => setError(requestError.message))
          }
        />
      )}
      {room.phase === "finished" && (
        <ResultView
          room={room}
          viewer={viewer}
          language={language}
          isPending={Boolean(pendingActionLabel)}
          pendingLabel={pendingActionLabel}
          onRematch={() =>
            mutate(
              { sessionId: session!.sessionId, action: "rematch" },
              { pendingLabel: language === "pt-BR" ? "Preparando revanche..." : "Preparing rematch..." }
            ).catch((requestError) => setError(requestError.message))
          }
        />
      )}
      {error && <p className="errorText floatingError">{error}</p>}
      <button
        className="secondaryLinkButton"
        type="button"
        onClick={() => {
          clearRoomSession(code);
          setSession(null);
          window.location.reload();
        }}
      >
        Sair da sala
      </button>
    </main>
  );
}
