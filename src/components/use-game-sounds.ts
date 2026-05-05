"use client";

import { useEffect, useRef } from "react";
import type { GameState } from "@/domain/game";
import type { SoundCue } from "./sound-effects";
import { deriveSoundCue } from "./sound-effects";

function playTone(context: AudioContext, options: { frequency: number; start: number; duration: number; gain: number; type?: OscillatorType }) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = options.type ?? "sine";
  oscillator.frequency.setValueAtTime(options.frequency, options.start);
  gainNode.gain.setValueAtTime(0.0001, options.start);
  gainNode.gain.linearRampToValueAtTime(options.gain, options.start + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, options.start + options.duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(options.start);
  oscillator.stop(options.start + options.duration + 0.02);
}

function playCue(context: AudioContext, cue: SoundCue) {
  const start = context.currentTime + 0.01;

  switch (cue) {
    case "match-start":
      playTone(context, { frequency: 392, start, duration: 0.12, gain: 0.04, type: "triangle" });
      playTone(context, { frequency: 523.25, start: start + 0.08, duration: 0.16, gain: 0.05, type: "triangle" });
      break;
    case "round-win":
      playTone(context, { frequency: 523.25, start, duration: 0.09, gain: 0.04, type: "triangle" });
      playTone(context, { frequency: 659.25, start: start + 0.07, duration: 0.14, gain: 0.05, type: "triangle" });
      break;
    case "round-tie":
      playTone(context, { frequency: 300, start, duration: 0.11, gain: 0.035, type: "sawtooth" });
      playTone(context, { frequency: 300, start: start + 0.12, duration: 0.11, gain: 0.03, type: "sawtooth" });
      break;
    case "next-round":
      playTone(context, { frequency: 440, start, duration: 0.08, gain: 0.03, type: "triangle" });
      break;
    case "match-end":
      playTone(context, { frequency: 349.23, start, duration: 0.12, gain: 0.04, type: "triangle" });
      playTone(context, { frequency: 440, start: start + 0.08, duration: 0.12, gain: 0.05, type: "triangle" });
      playTone(context, { frequency: 523.25, start: start + 0.16, duration: 0.18, gain: 0.06, type: "triangle" });
      break;
  }
}

export function useGameSounds(room: GameState | null, muted: boolean) {
  const previousRoomRef = useRef<GameState | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (muted) return;

    const unlockAudio = async () => {
      const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextCtor();
      }

      if (audioContextRef.current.state === "suspended") {
        try {
          await audioContextRef.current.resume();
        } catch {
          return;
        }
      }
    };

    const handlePointerDown = () => {
      void unlockAudio();
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [muted]);

  useEffect(() => {
    if (!room) return;

    const previousRoom = previousRoomRef.current;
    previousRoomRef.current = room;

    if (muted) return;

    const cue = deriveSoundCue(previousRoom, room);
    if (!cue || typeof window === "undefined") return;

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    const context = audioContextRef.current;
    const run = async () => {
      if (context.state === "suspended") {
        try {
          await context.resume();
        } catch {
          return;
        }
      }

      playCue(context, cue);
    };

    void run();
  }, [room, muted]);
}
