"use client";

import type { ComparableStat, Language, PlayerId } from "@/domain/cards";
import { COMPARABLE_STATS } from "@/domain/cards";
import type { GameState } from "@/domain/game";
import { statLabel } from "@/domain/i18n";
import { CardView } from "./CardView";
import { canViewerAdvanceRound, getCarryOverPileSize, getNextRoundController, getScoreboardEntries } from "./game-view-state";

interface GameViewProps {
  room: GameState;
  viewer: PlayerId;
  language: Language;
  isPending?: boolean;
  pendingLabel?: string | null;
  onChoose: (stat: ComparableStat) => void;
  onNextRound: () => void;
  onToggleEnd: (enabled: boolean) => void;
}

export function GameView({ room, viewer, language, isPending, pendingLabel, onChoose, onNextRound, onToggleEnd }: GameViewProps) {
  const ownCard =
    room.phase === "playing"
      ? room.decks[viewer][0]
      : viewer === "host"
        ? room.lastRound?.hostCard
        : room.lastRound?.guestCard;
  const opponent = viewer === "host" ? "guest" : "host";
  const revealedOpponentCard = opponent === "host" ? room.lastRound?.hostCard : room.lastRound?.guestCard;
  const opponentCard = room.phase === "revealed" ? revealedOpponentCard : undefined;
  const highlightedStat = room.phase === "revealed" ? room.lastRound?.attribute : undefined;
  const isActive = room.activePlayer === viewer && room.phase === "playing" && !isPending;
  const isPt = language === "pt-BR";
  const activeNickname = room[room.activePlayer]?.nickname ?? (room.activePlayer === "host" ? "Host" : "Guest");
  const winnerLabel =
    room.lastRound?.winner === "tie"
      ? isPt
        ? "Empate"
        : "Tie"
      : room.lastRound?.winner === "host"
        ? room.host?.nickname ?? "Host"
        : room.guest?.nickname ?? "Guest";
  const winnerAttributeLabel = room.lastRound ? statLabel(language, room.lastRound.attribute) : "";
  const ownEndRequested = Boolean(room[viewer]?.wantsToEnd);
  const scoreboardEntries = getScoreboardEntries(room, viewer);
  const canAdvanceRound = canViewerAdvanceRound(room, viewer, Boolean(isPending));
  const nextRoundController = getNextRoundController(room);
  const nextRoundControllerLabel = nextRoundController ? room[nextRoundController]?.nickname ?? (nextRoundController === "host" ? "Host" : "Guest") : "";
  const carryOverPileSize = getCarryOverPileSize(room);
  const turnMessage = isActive
    ? isPt
      ? "Sua vez de escolher"
      : "Your turn to choose"
    : isPt
      ? `Vez de ${activeNickname}`
      : `${activeNickname}'s turn`;

  return (
    <section className="matchLayout">
      <div className="cardColumn">
        <h2>{isPt ? "Sua carta" : "Your card"}</h2>
        <CardView card={ownCard} language={language} highlightedStat={highlightedStat} />
      </div>
      <div className="roundColumn">
        <div className="roundColumnSpacer" aria-hidden="true" />
        <div className="roundPanel">
          <p className="eyebrow">{isPt ? "Rodada" : "Round"}</p>
          <div className="scoreboard" aria-label={isPt ? "Placar de rodadas" : "Round scoreboard"}>
            {scoreboardEntries.map((entry) => (
              <div className={entry.isViewer ? "scoreTile scoreTileViewer" : "scoreTile"} key={entry.id}>
                <span>{entry.label}</span>
                <strong>{entry.wins}</strong>
              </div>
            ))}
          </div>
          <div className="turnBadge" data-active={isActive ? "true" : "false"}>
            {turnMessage}
          </div>
          {pendingLabel && (
            <div className="inlineLoading" role="status" aria-live="polite">
              <span className="loadingSpinner" aria-hidden="true" />
              <span>{pendingLabel}</span>
            </div>
          )}
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
              {room.lastRound && (
                <p className="roundSummary">
                  {room.lastRound.winner === "tie"
                    ? isPt
                      ? `${winnerAttributeLabel}: empate em ${room.lastRound.hostCard.stats[room.lastRound.attribute].toFixed(1)} x ${room.lastRound.guestCard.stats[room.lastRound.attribute].toFixed(1)}`
                      : `${winnerAttributeLabel}: tie at ${room.lastRound.hostCard.stats[room.lastRound.attribute].toFixed(1)} vs ${room.lastRound.guestCard.stats[room.lastRound.attribute].toFixed(1)}`
                    : isPt
                      ? `${winnerAttributeLabel} decidiu a rodada`
                      : `${winnerAttributeLabel} decided the round`}
                </p>
              )}
              <p>
                {room.lastRound?.winner === "tie"
                  ? `${isPt ? "Cartas em disputa" : "Cards in play"}: ${room.lastRound.pileSize}`
                  : `${isPt ? "Monte acumulado" : "Carry-over pile"}: ${carryOverPileSize}`}
              </p>
              {canAdvanceRound ? (
                <button className="primaryButton" type="button" onClick={onNextRound} disabled={isPending}>
                  {isPt ? "Proxima rodada" : "Next round"}
                </button>
              ) : (
                <p className="roundAdvanceHint">
                  {isPt ? `Aguardando ${nextRoundControllerLabel} continuar` : `Waiting for ${nextRoundControllerLabel} to continue`}
                </p>
              )}
            </>
          )}
          <div className="endRequestStatus">
            <span>{room.host?.nickname ?? "Host"}: {room.host?.wantsToEnd ? (isPt ? "quer encerrar" : "wants to end") : (isPt ? "continua" : "continue")}</span>
            <span>{room.guest?.nickname ?? "Guest"}: {room.guest?.wantsToEnd ? (isPt ? "quer encerrar" : "wants to end") : (isPt ? "continua" : "continue")}</span>
          </div>
          <button className="ghostButton" type="button" onClick={() => onToggleEnd(!ownEndRequested)} disabled={isPending}>
            {ownEndRequested
              ? isPt
                ? "Cancelar solicitacao"
                : "Cancel request"
              : isPt
                ? "Solicitar encerramento"
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
          highlightedStat={highlightedStat}
          revealLabel={isPt ? "Revela apos a escolha" : "Reveals after the pick"}
        />
      </div>
    </section>
  );
}
