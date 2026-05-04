"use client";

import { useState } from "react";
import type { Language } from "@/domain/cards";

export function RulesModal({ language }: { language: Language }) {
  const [open, setOpen] = useState(false);
  const isPt = language === "pt-BR";
  return (
    <>
      <button className="ghostButton" type="button" onClick={() => setOpen(true)}>
        {isPt ? "Como jogar" : "How to play"}
      </button>
      {open && (
        <div className="modalBackdrop" role="presentation" onClick={() => setOpen(false)}>
          <section className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <h2>{isPt ? "Como jogar" : "How to play"}</h2>
            <p>
              {isPt
                ? "Compare SP, HA, AC, LS ou BR. O maior valor vence a rodada. Empates acumulam cartas para a proxima rodada."
                : "Compare SP, HA, AC, LS, or BR. The higher value wins the round. Ties bank cards for the next round."}
            </p>
            <p>
              {isPt
                ? "Uma carta Super Trunfo vence cartas comuns automaticamente, mas contra outra Super Trunfo compara o atributo escolhido."
                : "A Super Trunfo beats common cards automatically, but against another Super Trunfo it compares the chosen attribute."}
            </p>
            <button className="primaryButton" type="button" onClick={() => setOpen(false)}>
              OK
            </button>
          </section>
        </div>
      )}
    </>
  );
}
