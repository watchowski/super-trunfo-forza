"use client";

import type { Language } from "@/domain/cards";

interface LanguageSelectProps {
  value: Language;
  onChange: (language: Language) => void;
}

export function LanguageSelect({ value, onChange }: LanguageSelectProps) {
  const label = value === "pt-BR" ? "Idioma" : "Language";
  return (
    <label className="languageSelect">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as Language)}>
        <option value="pt-BR">PT-BR</option>
        <option value="en">English</option>
      </select>
    </label>
  );
}
