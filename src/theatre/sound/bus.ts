// The call board: anything on the page can ask for a sound effect without
// loading the sound department. If the sound is off, nobody is listening.

import type { SfxName } from "./sfx";

export const SOUND_EVENT = "zt:sfx";
const KEY = "zt-sound";

export function cueSound(name: SfxName) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: name }));
}

/** The visitor's last choice (sound is off until they ask for it). */
export function soundPref(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    return false;
  }
}

export function setSoundPref(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // private windows may refuse; the choice just won't be remembered
  }
}
