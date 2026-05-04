"use client";

import { useMemo, useState } from "react";
import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { advanceAfterReveal, createInitialGame, requestMutualEnd, resolveRound } from "@/domain/game-engine";
import { sampleCards } from "@/data/sample-cards";
import { createRoom, joinRoom, kickGuest } from "@/lib/room-store";
import { GameView } from "./GameView";
import { LanguageSelect } from "./LanguageSelect";
import { LobbyView } from "./LobbyView";
import { ResultView } from "./ResultView";
import { RulesModal } from "./RulesModal";
import { SoundToggle } from "./SoundToggle";

export function DemoRoomApp({ code }: { code: string }) {
  const [viewer, setViewer] = useState<PlayerId>("host");
  const [language, setLanguage] = useState<Language>("pt-BR");
  const [muted, setMuted] = useState(false);
  const [room, setRoom] = useState<GameState>(() => {
    if (code === "new") return createRoom({ hostNickname: "Host", existingCodes: new Set(), cards: sampleCards });
    const demoRoom = createRoom({ hostNickname: "Host", existingCodes: new Set(), cards: sampleCards });
    return joinRoom({ ...demoRoom, code }, "Guest");
  });

  const displayCode = useMemo(() => (code === "new" ? room.code : code), [code, room.code]);

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

  function choose(stat: ComparableStat) {
    setRoom((current) => resolveRound(current, stat, `${displayCode}:${Date.now()}:round`));
  }

  function rematch() {
    startMatch();
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
          onStart={startMatch}
          onDeckSizeChange={(selectedDeckSize) => setRoom((current) => ({ ...current, selectedDeckSize }))}
          onKickGuest={() => setRoom((current) => kickGuest(current))}
        />
      )}
      {(room.phase === "playing" || room.phase === "revealed") && (
        <GameView
          room={room}
          viewer={viewer}
          language={language}
          onChoose={choose}
          onNextRound={() => setRoom((current) => advanceAfterReveal(current))}
          onToggleEnd={() => setRoom((current) => requestMutualEnd(current, viewer))}
        />
      )}
      {room.phase === "finished" && <ResultView room={room} language={language} onRematch={rematch} />}
    </main>
  );
}
