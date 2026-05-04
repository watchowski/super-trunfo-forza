"use client";

import type { GameState } from "@/domain/game";

export function ResultView({ room, onRematch }: { room: GameState; onRematch: () => void }) {
  const winner = room.result?.winner === "draw" ? "Empate" : room[room.result?.winner ?? "host"]?.nickname;
  return (
    <section className="panel resultPanel">
      <p className="eyebrow">Resultado</p>
      <h1>{winner}</h1>
      <p>Motivo: {room.result?.reason}</p>
      <button className="primaryButton" type="button" onClick={onRematch}>
        Revanche
      </button>
    </section>
  );
}
