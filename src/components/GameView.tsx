"use client";

import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import { COMPARABLE_STATS } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { statLabel } from "@/domain/i18n";
import { CardView } from "./CardView";

interface GameViewProps {
  room: GameState;
  viewer: PlayerId;
  language: Language;
  onChoose: (stat: ComparableStat) => void;
  onNextRound: () => void;
  onToggleEnd: () => void;
}

export function GameView({ room, viewer, language, onChoose, onNextRound, onToggleEnd }: GameViewProps) {
  const ownCard = room.decks[viewer][0];
  const opponent = viewer === "host" ? "guest" : "host";
  const revealedOpponentCard = opponent === "host" ? room.lastRound?.hostCard : room.lastRound?.guestCard;
  const opponentCard = room.phase === "revealed" ? revealedOpponentCard : undefined;
  const isActive = room.activePlayer === viewer && room.phase === "playing";

  return (
    <section className="matchLayout">
      <div className="cardColumn">
        <h2>Sua carta</h2>
        <CardView card={ownCard} language={language} />
      </div>
      <div className="roundPanel">
        <p className="eyebrow">Rodada</p>
        {room.phase === "playing" && (
          <>
            <h1>{isActive ? "Escolha um atributo" : "Aguardando escolha"}</h1>
            <div className="statButtons">
              {COMPARABLE_STATS.map((stat) => (
                <button className="statButton" type="button" key={stat} disabled={!isActive} onClick={() => onChoose(stat)}>
                  <strong>{stat.toUpperCase()}</strong>
                  <span>{statLabel(language, stat)}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {room.phase === "revealed" && (
          <>
            <h1>{room.lastRound?.winner === "tie" ? "Empate" : `${room.lastRound?.winner} venceu`}</h1>
            <p>Monte em disputa: {room.lastRound?.pileSize}</p>
            <button className="primaryButton" type="button" onClick={onNextRound}>
              Proxima rodada
            </button>
          </>
        )}
        <button className="ghostButton" type="button" onClick={onToggleEnd}>
          {room[viewer]?.wantsToEnd ? "Cancelar encerramento" : "Encerrar partida"}
        </button>
      </div>
      <div className="cardColumn opponentColumn">
        <h2>Carta oponente</h2>
        <CardView card={opponentCard} hidden={room.phase !== "revealed"} language={language} revealLabel="Revela apos a escolha" />
      </div>
    </section>
  );
}
