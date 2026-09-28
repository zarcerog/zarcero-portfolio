// The sound plot for the 3D production: which variation the band plays in
// each act, every effect in the prompt book, and the beds under the scenes.
// Loaded only when somebody turns the sound on.

import { env, type SoundCue, type SoundProgram } from "@/theatre/sound/program";

import { Q, roomAt, roomCue, workCue } from "./cues";

const both = (at: number, name: SoundCue["name"]): SoundCue => ({ at, name, dir: "both" });
const fwd = (at: number, name: SoundCue["name"], opts?: SoundCue["opts"]): SoundCue => ({ at, name, dir: "fwd", opts });

const cues: SoundCue[] = [
  both(Q.prologue.curtainOpen[0], "curtain"),
  // Act I: the coast arrives, the train goes by, the coast leaves
  both(Q.act1.setIn[0], "sceneryIn"),
  fwd(Q.act1.train[0] + 0.2, "train"),
  both(Q.act1.setOut[0], "sceneryOut"),
  both(Q.act1.personae[0], "trap"),
  // Intermission
  both(Q.interval.curtainClose[0], "curtain"),
  fwd(Q.interval.menu[0], "chime"),
  fwd(Q.interval.audienceBack[0], "chime"),
  both(Q.interval.curtainOpen[0], "curtain"),
  // Act IV: the dressing room, its mirror lights clicking on
  both(Q.act4.setIn[0], "sceneryIn"),
  fwd(Q.act4.setIn[1], "bulbs"),
  both(Q.act4.setOut[0], "sceneryOut"),
  // Act V: the wing door, the blackout
  both(Q.act5.door[0], "creak"),
  fwd(Q.act5.blackout[0], "thunk"),
  fwd(Q.act5.blackout[2], "thunk"),
  // Curtain call: a drum roll and a cymbal for the bow, flowers from the
  // stalls (the same beats the roses are thrown on, in sets/Cast.tsx), and a
  // last cadence for "Fin"
  fwd(Q.finale.bow[0] - 0.35, "bravo"),
  fwd(Q.finale.bow[0] - 0.15, "whoosh", { pan: -0.4 }),
  fwd(Q.finale.bow[1], "whoosh", { pan: 0.4 }),
  fwd(Q.finale.fin[0], "fin"),
];

// Act II: each room trucks on and off, and has its own moment
const ROOM_SOUNDS = ["schoolBell", "horn", "kaching", "beep"] as const;
const ROOM_AT = [0.05, 0.3, 0.1, 0.4];
for (let i = 0; i < 4; i++) {
  const r = roomCue(i);
  cues.push(both(r.a, "sceneryIn"), both(r.c, "sceneryOut"), fwd(r.b + ROOM_AT[i], ROOM_SOUNDS[i]));
}

// Act III: each work has a signature: the studio's typewriter, Odonta's
// sparkle, Campus's game, Memento's shutter
const WORK_SOUNDS = ["typewriter", "sparkle", "blip", "shutter"] as const;
for (let i = 0; i < 4; i++) {
  const w = workCue(i);
  cues.push(both(w.a, "sceneryIn"), both(w.c, "sceneryOut"), fwd(w.b + 0.3, WORK_SOUNDS[i]));
}
cues.sort((a, b) => a.at - b.at);

const r1 = roomCue(1);
const r2 = roomCue(2);
const r3 = roomCue(3);
const { act1, act4, act5, finale } = Q;

export const PROGRAM: SoundProgram = {
  sectionAt(t) {
    if (t < Q.act1.card[0]) return { id: "prologue", room: 0 };
    if (t < Q.act2.card[0]) return { id: "act1", room: 0 };
    if (t < Q.act3.card[0]) return { id: "act2", room: roomAt(t) };
    if (t < Q.interval.curtainClose[0]) return { id: "act3", room: 0 };
    if (t < Q.act4.card[0]) return { id: "interval", room: 0 };
    if (t < Q.act5.card[0]) return { id: "act4", room: 0 };
    if (t < Q.act5.blackout[2]) return { id: "act5", room: 0 };
    // after "Fin", the music box from the prologue plays the house out
    if (t < finale.fin[0] + 0.3) return { id: "finale", room: 0 };
    return { id: "prologue", room: 0 };
  },
  musicLevel(t) {
    const dark = env(t, ...act5.blackout);
    // quieter down the corridor, so the footsteps carry
    const walk = env(t, act5.walk[0], act5.walk[0] + 0.4, act5.walk[1], act5.walk[1] + 0.3);
    // …and out of the way of the drum roll at the bow
    const bow = env(t, finale.bow[0] - 0.4, finale.bow[0] - 0.3, finale.bow[1], finale.bow[1] + 0.3);
    return (1 - dark) * (1 - 0.4 * walk) * (1 - 0.6 * bow);
  },
  cues,
  beds: [
    { name: "surf", level: (t) => env(t, act1.setIn[0], act1.setIn[1], act1.setOut[0], act1.setOut[1]) },
    { name: "projector", level: (t) => env(t, r1.b - 0.1, r1.b + 0.35, r1.c - 0.2, r1.c + 0.2) },
    { name: "coins", level: (t) => env(t, r2.b - 0.2, r2.b + 0.2, r2.c - 0.1, r2.c + 0.3) },
    { name: "clocks", level: (t) => env(t, r3.b - 0.2, r3.b + 0.2, r3.c - 0.1, r3.c + 0.3) },
    { name: "crackle", level: (t) => env(t, act4.setIn[0], act4.setIn[1], act4.setOut[0], act4.setOut[1]) },
  ],
  steps: [{ a: act5.walk[0], b: act5.walk[1], every: 0.16, verb: (t) => (t > act5.door[1] ? 0.6 : 0.25) }],
};
