import clsx from "clsx";
import type { Card, ComparableStat, Language } from "@/domain/cards";
import { COMPARABLE_STATS } from "@/domain/cards";
import { statLabel } from "@/domain/i18n";

interface CardViewProps {
  card?: Card;
  hidden?: boolean;
  language: Language;
  revealLabel?: string;
  highlightedStat?: ComparableStat;
}

export function CardView({ card, hidden, language, revealLabel, highlightedStat }: CardViewProps) {
  if (hidden || !card) {
    return (
      <article className="gameCard cardBack">
        <div className="cardBackMark">ST</div>
        <p>{revealLabel ?? "Hidden card"}</p>
      </article>
    );
  }

  return (
    <article className={clsx("gameCard", `tier-${card.stats.pl.class.toLowerCase()}`, card.isSuperTrunfo && "superTrunfo")}>
      <div className="cardTopline">
        <span>{card.stats.pl.label}</span>
        {card.isSuperTrunfo && <strong>SUPER TRUNFO</strong>}
      </div>
      <div className="cardImageWrap">
        <img src={card.imageUrl} alt={card.name} className="cardImage" />
      </div>
      <div className="cardIdentity">
        <h2>{card.name}</h2>
        <p>
          {card.manufacturer} - {card.year}
        </p>
      </div>
      <dl className="statGrid">
        {COMPARABLE_STATS.map((stat) => (
          <div className={clsx("statRow", highlightedStat === stat && "statRowHighlight")} key={stat} title={statLabel(language, stat)}>
            <dt>{stat.toUpperCase()}</dt>
            <dd>{card.stats[stat].toFixed(1)}</dd>
          </div>
        ))}
        <div className="statRow mutedStat" title={statLabel(language, "pl")}>
          <dt>PL</dt>
          <dd>{card.stats.pl.label}</dd>
        </div>
      </dl>
    </article>
  );
}
