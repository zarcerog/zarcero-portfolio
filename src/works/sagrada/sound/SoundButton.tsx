"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useStage, useStageValue } from "@/theatre/engine";
import { setSoundPref, soundPref } from "@/theatre/sound/bus";

import { useLang } from "../lang";
import { UI } from "../script.i18n";

import type { FilmDirector } from "./director";

type Ctor = typeof AudioContext;

/** Must run inside the click: browsers only let a gesture start audio. */
function unlockAudio(): AudioContext | null {
  const C: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!C) return null;
  const ctx = new C({ latencyHint: "interactive" });
  void ctx.resume();
  const src = ctx.createBufferSource();
  src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
  src.connect(ctx.destination);
  src.start();
  return ctx;
}

function hasPref() {
  try {
    return window.localStorage.getItem("zt-sound") !== null;
  } catch {
    return true;
  }
}

/**
 * The film's sound switch, in the letterbox; and, on the poster, a note in
 * red marker for anyone who hasn't chosen yet. The choice is shared with the
 * theatre (and the ticket booth).
 */
export function SoundButton() {
  const stage = useStage();
  const [on, setOn] = useState(false);
  const [invite, setInvite] = useState(false);
  const director = useRef<FilmDirector | null>(null);
  const starting = useRef<Promise<void> | null>(null);
  const button = useRef<HTMLButtonElement>(null);

  const start = useCallback(() => {
    if (director.current) {
      void director.current.setOn(true);
      return;
    }
    if (starting.current) return;
    const ctx = unlockAudio();
    if (!ctx) return;
    starting.current = (async () => {
      const { startFilmDirector } = await import("./director");
      director.current = startFilmDirector(ctx, stage);
      await director.current.setOn(true);
    })();
  }, [stage]);

  // somebody who chose sound before gets it back on their first touch
  useEffect(() => {
    const remembered = soundPref();
    setOn(remembered);
    setInvite(!hasPref());
    if (!remembered) return;
    const events = ["pointerdown", "keydown", "touchend", "wheel"] as const;
    const go = (e: Event) => {
      if (button.current?.contains(e.target as Node)) return;
      events.forEach((n) => window.removeEventListener(n, go, true));
      start();
    };
    events.forEach((n) => window.addEventListener(n, go, { capture: true, passive: true }));
    return () => events.forEach((n) => window.removeEventListener(n, go, true));
  }, [start]);

  useEffect(() => () => director.current?.dispose(), []);

  const toggle = () => {
    const next = !on;
    setOn(next);
    setInvite(false);
    setSoundPref(next);
    if (next) start();
    else void director.current?.setOn(false);
  };

  const declined = () => {
    setInvite(false);
    setSoundPref(false);
  };

  const underway = useStageValue((t) => t > 1.1, false);
  const ui = UI[useLang()].sound;

  return (
    <>
      <button ref={button} type="button" className="sf-sound" data-on={on} aria-pressed={on} onClick={toggle} title={on ? ui.titleOn : ui.titleOff}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path className="sf-sound__horn" d="M3.5 10.2h3.2l6.8-5.4v14.4l-6.8-5.4H3.5z" />
          <g className="sf-sound__waves">
            <path d="M16.2 9.2a4 4 0 0 1 0 5.6" />
            <path d="M18.6 6.9a7.3 7.3 0 0 1 0 10.2" />
          </g>
          <path className="sf-sound__mute" d="M16.5 9.5l5 5m0-5l-5 5" />
        </svg>
        <span>{on ? ui.on : ui.off}</span>
      </button>
      {invite && !underway && (
        <aside className="sf-invite" aria-label={ui.about}>
          <p className="sf-invite__text">{ui.invite}</p>
          <p className="sf-invite__actions">
            <button type="button" className="sf-invite__yes" onClick={toggle}>
              {ui.yes}
            </button>
            <button type="button" className="sf-invite__no" onClick={declined}>
              {ui.no}
            </button>
          </p>
        </aside>
      )}
    </>
  );
}
