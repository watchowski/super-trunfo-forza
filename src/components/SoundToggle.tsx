"use client";

import { Volume2, VolumeX } from "lucide-react";

interface SoundToggleProps {
  muted: boolean;
  onToggle: () => void;
}

export function SoundToggle({ muted, onToggle }: SoundToggleProps) {
  const Icon = muted ? VolumeX : Volume2;
  return (
    <button className="iconButton" type="button" onClick={onToggle} aria-label={muted ? "Unmute" : "Mute"}>
      <Icon size={18} />
    </button>
  );
}
