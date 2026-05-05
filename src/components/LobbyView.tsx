"use client";

import type { GameState } from "@/domain/game";
import type { Language, PlayerId } from "@/domain/cards";

interface LobbyViewProps {
  room: GameState;
  viewer: PlayerId;
  language: Language;
  isDemo?: boolean;
  isPending?: boolean;
  pendingLabel?: string | null;
  onStart: () => void;
  onDeckSizeChange: (size: number) => void;
  onKickGuest: () => void;
}

export function LobbyView({ room, viewer, language, isDemo, isPending, pendingLabel, onStart, onDeckSizeChange, onKickGuest }: LobbyViewProps) {
  const deckOptions = Array.from({ length: Math.floor(room.maxDeckSize / 2) }, (_, index) => (index + 1) * 2);
  const isPt = language === "pt-BR";
  const canControl = viewer === "host";

  return (
    <section className="panel">
      <div className="sectionHeader">
        <div>
          <p className="eyebrow">Lobby</p>
          <h1>Sala {room.code}</h1>
        </div>
      </div>
      <div className="playerGrid">
        <div className="playerSlot">
          <span>Host</span>
          <strong>{room.host?.nickname}</strong>
        </div>
        <div className="playerSlot">
          <span>Guest</span>
          <strong>{room.guest?.nickname ?? (isPt ? "Aguardando..." : "Waiting...")}</strong>
          {room.guest && canControl && (
            <button className="ghostButton" type="button" onClick={onKickGuest} disabled={isPending}>
              {isPt ? "Expulsar" : "Kick"}
            </button>
          )}
        </div>
      </div>
      <p className="inlineNotice">
        {isPt
          ? `Maximo disponivel: ${room.maxDeckSize} cartas${isDemo ? " nesta amostra" : ""}.`
          : `Maximum available: ${room.maxDeckSize} cards${isDemo ? " in this sample" : ""}.`}
      </p>
      <label className="field">
        <span>{isPt ? "Cartas na partida" : "Cards in match"}</span>
        <select value={room.selectedDeckSize} disabled={!canControl || isPending} onChange={(event) => onDeckSizeChange(Number(event.target.value))}>
          {deckOptions.map((size) => (
            <option key={size} value={size}>
              {size === room.maxDeckSize ? `${size} (${isPt ? "todas" : "all"})` : size}
            </option>
          ))}
        </select>
      </label>
      {pendingLabel && (
        <div className="inlineLoading" role="status" aria-live="polite">
          <span className="loadingSpinner" aria-hidden="true" />
          <span>{pendingLabel}</span>
        </div>
      )}
      <button className="primaryButton" type="button" disabled={!room.guest || !canControl || isPending} onClick={onStart}>
        {isPending ? (isPt ? "Aguarde..." : "Please wait...") : isPt ? "Iniciar partida" : "Start match"}
      </button>
    </section>
  );
}
