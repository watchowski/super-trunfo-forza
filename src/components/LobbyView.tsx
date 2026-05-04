"use client";

import type { GameState } from "@/domain/game";

interface LobbyViewProps {
  room: GameState;
  onStart: () => void;
  onDeckSizeChange: (size: number) => void;
  onKickGuest: () => void;
}

export function LobbyView({ room, onStart, onDeckSizeChange, onKickGuest }: LobbyViewProps) {
  const deckOptions = Array.from({ length: Math.floor(room.maxDeckSize / 2) }, (_, index) => (index + 1) * 2);
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
          <strong>{room.guest?.nickname ?? "Aguardando..."}</strong>
          {room.guest && (
            <button className="ghostButton" type="button" onClick={onKickGuest}>
              Expulsar
            </button>
          )}
        </div>
      </div>
      <label className="field">
        <span>Cartas na partida</span>
        <select value={room.selectedDeckSize} onChange={(event) => onDeckSizeChange(Number(event.target.value))}>
          {deckOptions.map((size) => (
            <option key={size} value={size}>
              {size === room.maxDeckSize ? `${size} (todas)` : size}
            </option>
          ))}
        </select>
      </label>
      <button className="primaryButton" type="button" disabled={!room.guest} onClick={onStart}>
        Iniciar partida
      </button>
    </section>
  );
}
