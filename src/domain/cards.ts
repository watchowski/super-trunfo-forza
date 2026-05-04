export type ComparableStat = "sp" | "ha" | "ac" | "ls" | "br";
export type DisplayStat = ComparableStat | "pl";
export type PlayerId = "host" | "guest";
export type Language = "pt-BR" | "en";

export type PerformanceClass = "D" | "C" | "B" | "A" | "S1" | "S2" | "X";

export interface PowerLevel {
  class: PerformanceClass;
  pi: number;
  label: string;
}

export interface CarStats {
  sp: number;
  ha: number;
  ac: number;
  ls: number;
  br: number;
  pl: PowerLevel;
}

export interface SourceInfo {
  game: "FH1" | "FH2" | "FH3" | "FH4" | "FH5" | "FH6";
  carPageUrl: string;
  imageSourceUrl: string;
}

export interface Card {
  id: string;
  normalizedName: string;
  name: string;
  manufacturer: string;
  year: number;
  country?: string;
  imageUrl: string;
  stats: CarStats;
  source: SourceInfo;
  isSuperTrunfo: boolean;
}

export const COMPARABLE_STATS: ComparableStat[] = ["sp", "ha", "ac", "ls", "br"];
