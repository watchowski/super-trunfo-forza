"use client";

import type { Language } from "@/domain/cards";
import type { GameState } from "@/domain/game";

export function ResultView({
  room,
  language,
  onRematch
}: {
  room: GameState;
  language: Language;
  onRematch: () => void;
}) {
  const isPt = language === "pt-BR";
  const winner =
    room.result?.winner === "draw"
      ? isPt
        ? "Empate"
        : "Draw"
      : room[room.result?.winner ?? "host"]?.nickname;

  const reasonMap = {
    cards: isPt ? "fim do baralho" : "deck exhausted",
    abandonment: isPt ? "abandono" : "abandonment",
    mutual: isPt ? "acordo mutuo" : "mutual agreement"
  } as const;

  return (
    <section className="panel resultPanel">
      <p className="eyebrow">{isPt ? "Resultado" : "Result"}</p>
      <h1>{winner}</h1>
      <p>
        {isPt ? "Motivo" : "Reason"}: {room.result ? reasonMap[room.result.reason] : "-"}
      </p>
      <button className="primaryButton" type="button" onClick={onRematch}>
        {isPt ? "Revanche" : "Rematch"}
      </button>
    </section>
  );
}
