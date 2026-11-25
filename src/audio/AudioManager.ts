import { Howl } from "howler";

/**
 * Central place for every sound effect the game plays. Swap the
 * empty `src` arrays for real files once you've exported audio into
 * `public/audio/` — see README.md for expected filenames. Missing
 * files fail silently (Howler just won't play anything), so the game
 * works fine with zero audio assets too.
 */
class AudioManagerClass {
  private sfx: Record<"jump" | "select", Howl> | null = null;

  init() {
    if (this.sfx) return;
    this.sfx = {
      jump: new Howl({ src: ["/audio/jump.ogg", "/audio/jump.mp3"], volume: 0.6 }),
      select: new Howl({ src: ["/audio/select.ogg", "/audio/select.mp3"], volume: 0.5 }),
    };
  }

  play(name: "jump" | "select") {
    this.sfx?.[name]?.play();
  }
}

export const AudioManager = new AudioManagerClass();
