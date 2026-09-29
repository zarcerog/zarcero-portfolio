// The film's call board: the scene (fireworks) can ask for an effect without
// loading the sound department. If the sound is off, nobody is listening.

import type { FilmSfx, SfxOpts } from "./sfx";

export const FILM_SOUND_EVENT = "sf:sfx";

export function filmSound(name: FilmSfx, opts?: SfxOpts) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(FILM_SOUND_EVENT, { detail: { name, opts } }));
}
