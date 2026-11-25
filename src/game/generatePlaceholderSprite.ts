export const SPRITE_FRAME_WIDTH = 32;
export const SPRITE_FRAME_HEIGHT = 40;
const MAX_FRAMES = 3;
const ROWS = 6; // idle, walk, jump, fall, pipeDown, pipeUp

/**
 * Draws an original platformer-hero silhouette (purple cap, orange
 * shirt, teal overalls — deliberately not Mario's red/blue palette)
 * onto an offscreen canvas, laid out in the same
 * row-per-animation / column-per-frame grid the game code expects.
 * Returns the canvas directly — it can be used anywhere an
 * HTMLImageElement would be, as the source for ctx.drawImage.
 */
export function generatePlaceholderSprite(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = SPRITE_FRAME_WIDTH * MAX_FRAMES;
  canvas.height = SPRITE_FRAME_HEIGHT * ROWS;
  const ctx = canvas.getContext("2d")!;

  const CAP = "#6b2fb3";
  const CAP_BRIM = "#4a1f80";
  const SHIRT = "#ff7a1a";
  const OVERALLS = "#146b73";
  const OVERALLS_DARK = "#0d4a50";
  const SKIN = "#ffcc99";
  const SHOES = "#3a2416";

  function frameOrigin(row: number, col: number) {
    return { x: col * SPRITE_FRAME_WIDTH, y: row * SPRITE_FRAME_HEIGHT };
  }

  /**
   * Draws one character pose. legSpread/legLift/armLift/crouch all
   * shift blocks around a shared base layout so every frame reads as
   * the same character in a different pose.
   */
  function drawPose(
    row: number,
    col: number,
    opts: { legSpread?: number; legLift?: number; armUp?: boolean; crouch?: boolean } = {}
  ) {
    const { legSpread = 0, legLift = 0, armUp = false, crouch = false } = opts;
    const { x: ox, y: oy } = frameOrigin(row, col);
    const bodyTop = crouch ? oy + 14 : oy + 8;

    // Cap
    ctx.fillStyle = CAP;
    ctx.fillRect(ox + 9, oy + 2, 14, 6);
    ctx.fillStyle = CAP_BRIM;
    ctx.fillRect(ox + 7, oy + 6, 18, 3);

    // Head
    ctx.fillStyle = SKIN;
    ctx.fillRect(ox + 10, oy + 8, 12, 9);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(ox + 17, oy + 11, 2, 2); // eye

    // Torso (shirt + overalls bib)
    ctx.fillStyle = SHIRT;
    ctx.fillRect(ox + 8, bodyTop + 9, 16, crouch ? 6 : 8);
    ctx.fillStyle = OVERALLS;
    ctx.fillRect(ox + 9, bodyTop + 13, 14, crouch ? 6 : 9);
    ctx.fillStyle = OVERALLS_DARK;
    ctx.fillRect(ox + 12, bodyTop + 14, 2, 2);
    ctx.fillRect(ox + 18, bodyTop + 14, 2, 2);

    // Arms
    ctx.fillStyle = SHIRT;
    const armY = armUp ? bodyTop + 4 : bodyTop + 11;
    ctx.fillRect(ox + 4, armY, 5, 9);
    ctx.fillRect(ox + 23, armY, 5, 9);

    // Legs (skip entirely while mid-crouch, matching a "tucked in" pipe pose)
    if (!crouch) {
      ctx.fillStyle = OVERALLS;
      ctx.fillRect(ox + 9 - legSpread, oy + 30 - legLift, 6, 6 + legLift);
      ctx.fillRect(ox + 17 + legSpread, oy + 30 - legLift, 6, 6 + legLift);
      ctx.fillStyle = SHOES;
      ctx.fillRect(ox + 8 - legSpread, oy + 35, 8, 4);
      ctx.fillRect(ox + 16 + legSpread, oy + 35, 8, 4);
    } else {
      ctx.fillStyle = SHOES;
      ctx.fillRect(ox + 9, oy + 33, 14, 5);
    }
  }

  // Row 0: idle
  drawPose(0, 0);

  // Row 1: walk (3 frames, alternating leg spread)
  drawPose(1, 0, { legSpread: 0 });
  drawPose(1, 1, { legSpread: 3 });
  drawPose(1, 2, { legSpread: -3 });

  // Row 2: jump
  drawPose(2, 0, { legLift: 4, armUp: true });

  // Row 3: fall
  drawPose(3, 0, { legSpread: 4, armUp: false });

  // Row 4: entering pipe (sinking — progressively more crouched)
  drawPose(4, 0, { crouch: false, legLift: 2 });
  drawPose(4, 1, { crouch: true });

  // Row 5: exiting pipe (rising — mirrors entering)
  drawPose(5, 0, { crouch: true });
  drawPose(5, 1, { crouch: false, legLift: 2, armUp: true });

  return canvas;
}
