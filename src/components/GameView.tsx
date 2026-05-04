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
  const isPt = language === "pt-BR";
  const winnerLabel =
    room.lastRound?.winner === "tie"
      ? isPt
        ? "Empate"
        : "Tie"
      : room.lastRound?.winner === "host"
        ? room.host?.nickname ?? "Host"
        : room.guest?.nickname ?? "Guest";

  return (
    <section className="matchLayout">
      <div className="cardColumn">
        <h2>{isPt ? "Sua carta" : "Your card"}</h2>
        <CardView card={ownCard} language={language} />
      </div>
      <div className="roundColumn">
        <div className="roundColumnSpacer" aria-hidden="true" />
        <div className="roundPanel">
          <p className="eyebrow">{isPt ? "Rodada" : "Round"}</p>
          {room.phase === "playing" && (
            <>
              <h1>{isActive ? (isPt ? "Escolha um atributo" : "Choose an attribute") : isPt ? "Aguardando escolha" : "Waiting for a pick"}</h1>
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
              <h1>
                {room.lastRound?.winner === "tie"
                  ? isPt
                    ? "Empate"
                    : "Tie"
                  : isPt
                    ? `${winnerLabel} venceu`
                    : `${winnerLabel} wins`}
              </h1>
              <p>{isPt ? "Monte em disputa" : "Cards in play"}: {room.lastRound?.pileSize}</p>
              <button className="primaryButton" type="button" onClick={onNextRound}>
                {isPt ? "Proxima rodada" : "Next round"}
              </button>
            </>
          )}
          <button className="ghostButton" type="button" onClick={onToggleEnd}>
            {room[viewer]?.wantsToEnd
              ? isPt
                ? "Cancelar encerramento"
                : "Cancel end request"
              : isPt
                ? "Encerrar partida"
                : "End match"}
          </button>
        </div>
      </div>
      <div className="cardColumn opponentColumn">
        <h2>{isPt ? "Carta oponente" : "Opponent card"}</h2>
        <CardView
          card={opponentCard}
          hidden={room.phase !== "revealed"}
          language={language}
          revealLabel={isPt ? "Revela apos a escolha" : "Reveals after the pick"}
        />
      </div>
    </section>
  );
}
