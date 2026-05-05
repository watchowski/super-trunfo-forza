"use client";

import { useMemo, useState } from "react";
import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { advanceAfterReveal, createInitialGame, resolveRound, setMutualEndRequest } from "@/domain/game-engine";
import { sampleCards } from "@/data/sample-cards";
import { createRoom, joinRoom, kickGuest } from "@/lib/room-store";
import { GameView } from "./GameView";
import { LanguageSelect } from "./LanguageSelect";
import { LobbyView } from "./LobbyView";
import { ResultView } from "./ResultView";
import { RulesModal } from "./RulesModal";
import { SoundToggle } from "./SoundToggle";
import { useGameSounds } from "./use-game-sounds";

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function DemoRoomApp({ code }: { code: string }) {
  const [viewer, setViewer] = useState<PlayerId>("host");
  const [language, setLanguage] = useState<Language>("pt-BR");
  const [muted, setMuted] = useState(false);
  const [pendingActionLabel, setPendingActionLabel] = useState<string | null>(null);
  const [room, setRoom] = useState<GameState>(() => {
    if (code === "new") return createRoom({ hostNickname: "Host", existingCodes: new Set(), cards: sampleCards });
    const demoRoom = createRoom({ hostNickname: "Host", existingCodes: new Set(), cards: sampleCards });
    return joinRoom({ ...demoRoom, code }, "Guest");
  });

  const displayCode = useMemo(() => (code === "new" ? room.code : code), [code, room.code]);
  useGameSounds(room, muted);

  async function runAction(label: string, action: () => void) {
    setPendingActionLabel(label);
    await wait(250);
    action();
    setPendingActionLabel(null);
  }

  function startMatch() {
    if (!room.host || !room.guest) return;
    setRoom(
      createInitialGame({
        code: displayCode,
        hostNickname: room.host.nickname,
        guestNickname: room.guest.nickname,
        cards: sampleCards,
        deckSize: room.selectedDeckSize,
        seed: `${displayCode}:${Date.now()}`
      })
    );
  }

  async function choose(stat: ComparableStat) {
    await runAction(language === "pt-BR" ? "Revelando cartas..." : "Revealing cards...", () => {
      setRoom((current) => resolveRound(current, stat, `${displayCode}:${Date.now()}:round`));
    });
  }

  async function rematch() {
    await runAction(language === "pt-BR" ? "Preparando revanche..." : "Preparing rematch...", () => {
      startMatch();
    });
  }

  return (
    <main className="shell">
      <header className="topbar">
        <strong>Super Trunfo Forza</strong>
        <div className="topbarActions">
          <span className="demoBadge">Modo demo local</span>
          <button className="ghostButton" type="button" onClick={() => setViewer(viewer === "host" ? "guest" : "host")}>
            Ver como {viewer === "host" ? "Guest" : "Host"}
          </button>
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
          isDemo
          isPending={Boolean(pendingActionLabel)}
          pendingLabel={pendingActionLabel}
          onStart={() => {
            void runAction(language === "pt-BR" ? "Iniciando partida..." : "Starting match...", () => {
              startMatch();
            });
          }}
          onDeckSizeChange={(selectedDeckSize) => setRoom((current) => ({ ...current, selectedDeckSize }))}
          onKickGuest={() => setRoom((current) => kickGuest(current))}
        />
      )}
      {(room.phase === "playing" || room.phase === "revealed") && (
        <GameView
          room={room}
          viewer={viewer}
          language={language}
          isPending={Boolean(pendingActionLabel)}
          pendingLabel={pendingActionLabel}
          onChoose={choose}
          onNextRound={() => {
            void runAction(language === "pt-BR" ? "Preparando proxima rodada..." : "Preparing next round...", () => {
              setRoom((current) => advanceAfterReveal(current));
            });
          }}
          onToggleEnd={(enabled: boolean) => setRoom((current) => setMutualEndRequest(current, viewer, enabled))}
        />
      )}
      {room.phase === "finished" && <ResultView room={room} viewer={viewer} language={language} isPending={Boolean(pendingActionLabel)} pendingLabel={pendingActionLabel} onRematch={rematch} />}
    </main>
  );
}
