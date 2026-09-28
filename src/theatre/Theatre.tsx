"use client";

import { useRef } from "react";

import { ACT_CARDS } from "./content";
import { StageProvider } from "./engine";
import { ActCard } from "./parts/ActCard";
import { Chrome } from "./parts/Chrome";
import { Apron, Audience, FlyRope, HouseLights } from "./parts/House";
import {
  BareStage,
  Border,
  Crest,
  Floor,
  HouseCurtain,
  Legs,
  StageWash,
  Valance,
} from "./parts/Proscenium";
import { Coast, Personae } from "./scenes/ActOne";
import { Works } from "./scenes/ActThree";
import { Apprenticeship } from "./scenes/ActTwo";
import { CurtainCall, Telegram } from "./scenes/Finale";
import { Intermission, Rehearsal } from "./scenes/Interval";
import { Prologue } from "./scenes/Prologue";
import { CUES } from "./timeline";
import "./flat.css";

export default function Theatre({ fontClass }: { fontClass: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`th-root ${fontClass}`} ref={rootRef} data-ready="false">
      <StageProvider rootRef={rootRef}>
        {/* The scroll track: its height is the length of the performance. */}
        <div className="th-track" aria-hidden="true" />

        <div className="th-viewport">
          <div className="th-wall" aria-hidden="true" />

          <main className="th-pro">
            <div className="th-opening">
              <BareStage />
              <Floor />

              {/* scenery, upstage to downstage */}
              <Coast />
              <Apprenticeship />
              <Works />
              <Rehearsal />
              <Personae />
              <Telegram />

              <HouseCurtain />

              {/* things hung in front of the curtain line */}
              <Prologue />
              <ActCard cue={CUES.act1.card} {...ACT_CARDS.act1} />
              <ActCard cue={CUES.act2.card} {...ACT_CARDS.act2} />
              <ActCard cue={CUES.act3.card} {...ACT_CARDS.act3} />
              <Intermission />
              <ActCard cue={CUES.act4.card} {...ACT_CARDS.act4} />
              <ActCard cue={CUES.act5.card} {...ACT_CARDS.act5} />
              <CurtainCall />

              <StageWash />
              <Legs />
              <Border />
            </div>
            <div className="th-frame-gilt" aria-hidden="true" />
            <Valance />
            <Crest />
          </main>

          <Apron />
          <Audience />
          <HouseLights />
          <FlyRope />
          <Chrome />
        </div>
      </StageProvider>
    </div>
  );
}
