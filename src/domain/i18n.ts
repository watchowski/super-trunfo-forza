import type { ComparableStat, DisplayStat, Language } from "./cards";

type TranslationKey =
  | "createRoom"
  | "joinRoom"
  | "nickname"
  | "startMatch"
  | "roomFull"
  | "howToPlay"
  | "nextRound"
  | "requestEnd"
  | "cancelEnd"
  | "rematch"
  | "winner"
  | "draw"
  | `stat.${DisplayStat}`;

const dictionary: Record<Language, Record<TranslationKey, string>> = {
  "pt-BR": {
    createRoom: "Criar sala",
    joinRoom: "Entrar",
    nickname: "Apelido",
    startMatch: "Iniciar partida",
    roomFull: "Sala cheia",
    howToPlay: "Como jogar",
    nextRound: "Proxima rodada",
    requestEnd: "Encerrar partida",
    cancelEnd: "Cancelar encerramento",
    rematch: "Revanche",
    winner: "Vencedor",
    draw: "Empate",
    "stat.sp": "Velocidade",
    "stat.ha": "Controle",
    "stat.ac": "Aceleracao",
    "stat.ls": "Largada",
    "stat.br": "Frenagem",
    "stat.pl": "Classe/PI"
  },
  en: {
    createRoom: "Create room",
    joinRoom: "Join",
    nickname: "Nickname",
    startMatch: "Start match",
    roomFull: "Room full",
    howToPlay: "How to play",
    nextRound: "Next round",
    requestEnd: "End match",
    cancelEnd: "Cancel end request",
    rematch: "Rematch",
    winner: "Winner",
    draw: "Draw",
    "stat.sp": "Speed",
    "stat.ha": "Handling",
    "stat.ac": "Acceleration",
    "stat.ls": "Launch",
    "stat.br": "Braking",
    "stat.pl": "Class/PI"
  }
};

export function t(language: Language, key: TranslationKey) {
  return dictionary[language][key];
}

export function statLabel(language: Language, stat: ComparableStat | "pl") {
  return t(language, `stat.${stat}`);
}
