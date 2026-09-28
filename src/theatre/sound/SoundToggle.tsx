"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useStage, useStageValue } from "../engine";
import type { ActMark } from "../timeline";
import { setSoundPref, soundPref } from "./bus";
import type { Director } from "./director";
import type { SoundProgram } from "./program";

type Ctor = typeof AudioContext;

/** Must run inside the click: browsers only let a gesture start audio. */
function unlockAudio(): AudioContext | null {
  const C: Ctor | undefined = window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
  if (!C) return null;
  const ctx = new C({ latencyHint: "interactive" });
  void ctx.resume();
  // iOS wants a sound to be started inside the gesture, even a silent one
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

/** The house sound: a little brass button beside the programme. */
export function SoundToggle({ acts, loadProgram }: { acts: ActMark[]; loadProgram?: () => Promise<SoundProgram> }) {
  const stage = useStage();
  const [on, setOn] = useState(false);
  const [invite, setInvite] = useState(false);
  const director = useRef<Director | null>(null);
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
      const [{ startDirector }, { programFromActs }] = await Promise.all([import("./director"), import("./program")]);
      const program = loadProgram ? await loadProgram() : programFromActs(acts);
      director.current = startDirector(ctx, stage, program);
      await director.current.setOn(true);
    })();
  }, [acts, loadProgram, stage]);

  // somebody who chose sound last time gets it back on their first touch
  useEffect(() => {
    const remembered = soundPref();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the preference lives in the browser
    setOn(remembered);
    setInvite(!hasPref());
    if (!remembered) return;
    const events = ["pointerdown", "keydown", "touchend"] as const;
    const go = (e: Event) => {
      if (button.current?.contains(e.target as Node)) return;
      events.forEach((n) => window.removeEventListener(n, go, true));
      start();
    };
    events.forEach((n) => window.addEventListener(n, go, true));
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

  // the usher's note bows out once the play is under way
  const underway = useStageValue((t) => t > 2.6, false);

  return (
    <>
      <button
        ref={button}
        type="button"
        className="th-sound"
        data-on={on}
        data-invite={invite}
        aria-pressed={on}
        aria-label="Music and sound"
        title={on ? "Mute the orchestra" : "Play the orchestra"}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {/* a loudspeaker, with its waves or a cross */}
          <path className="th-sound__horn" d="M3.5 10.2h3.2l6.8-5.4v14.4l-6.8-5.4H3.5z" />
          <g className="th-sound__waves">
            <path d="M16.2 9.2a4 4 0 0 1 0 5.6" />
            <path d="M18.6 6.9a7.3 7.3 0 0 1 0 10.2" />
          </g>
          <path className="th-sound__mute" d="M16.5 9.5l5 5m0-5l-5 5" />
        </svg>
      </button>
      {invite && !underway && (
        <aside className="th-usher" aria-label="A note from the usher">
          <p className="th-usher__kicker">A note from the usher</p>
          <p className="th-usher__text">This performance is best enjoyed with the sound on.</p>
          <p className="th-usher__actions">
            <button type="button" className="th-usher__yes" onClick={toggle}>
              Sound on <span aria-hidden="true">♪</span>
            </button>
            <button type="button" className="th-usher__no" onClick={declined}>
              Not tonight
            </button>
          </p>
        </aside>
      )}
    </>
  );
}
