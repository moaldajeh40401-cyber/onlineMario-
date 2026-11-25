import { useEffect, useRef } from "react";
import { generatePlaceholderSprite, SPRITE_FRAME_WIDTH, SPRITE_FRAME_HEIGHT } from "./generatePlaceholderSprite";
import { wrapText } from "./wrapText";
import { AudioManager } from "../audio/AudioManager";
import { PROFILE, ABOUT_TEXT, PROJECTS, CONTACT } from "../content/portfolio";
import "./marioPortfolio.css";

type World = "overworld" | "underground";
type PipeState = "none" | "entering" | "exiting";
type AnimationName = "idle" | "walk" | "jump" | "fall" | "pipeDown" | "pipeUp";

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  grounded: boolean;
  facing: 1 | -1;
  animation: AnimationName;
  animationFrame: number;
  animationTimer: number;
  pipeState: PipeState;
  pipeProgress: number;
  pipeStartY: number;
  pipeTargetY: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Pipe {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InfoPoint {
  x: number;
  y: number;
  title: string;
  body: string;
}

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

const GRAVITY = 0.62;
const MAX_SPEED = 6.5;
const ACCELERATION = 0.8;
const FRICTION = 0.78;
const JUMP_FORCE = -13;

const SPRITE_SCALE = 2.5;
const WORLD_WIDTH = 4900;

const animationData: Record<AnimationName, { row: number; frames: number; speed: number }> = {
  idle: { row: 0, frames: 1, speed: 120 },
  walk: { row: 1, frames: 3, speed: 90 },
  jump: { row: 2, frames: 1, speed: 100 },
  fall: { row: 3, frames: 1, speed: 100 },
  pipeDown: { row: 4, frames: 2, speed: 100 },
  pipeUp: { row: 5, frames: 2, speed: 100 },
};

export default function MarioPortfolio() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    ctx.imageSmoothingEnabled = false;

    // Original placeholder sprite — see generatePlaceholderSprite.ts.
    // Swap this for a real spritesheet by loading an <img> instead and
    // waiting for its onload before starting the loop.
    const sprite = generatePlaceholderSprite();
    AudioManager.init();

    const keys = new Set<string>();
    let world: World = "overworld";
    let cameraX = 0;
    let lastTime = performance.now();
    let animationId = 0;

    const player: PlayerState = {
      x: 180,
      y: 400,
      vx: 0,
      vy: 0,
      width: SPRITE_FRAME_WIDTH * SPRITE_SCALE,
      height: SPRITE_FRAME_HEIGHT * SPRITE_SCALE,
      grounded: false,
      facing: 1,
      animation: "idle",
      animationFrame: 0,
      animationTimer: 0,
      pipeState: "none",
      pipeProgress: 0,
      pipeStartY: 0,
      pipeTargetY: 0,
    };

    // -----------------------------------------------------------
    // World layout
    // -----------------------------------------------------------

    const overworldPlatforms: Platform[] = [
      { x: 0, y: 640, width: WORLD_WIDTH + 100, height: 80 },
      { x: 160, y: 500, width: 220, height: 25 },
      { x: 510, y: 420, width: 190, height: 25 },
      { x: 1550, y: 460, width: 200, height: 25 },
      { x: 1900, y: 400, width: 200, height: 25 },
      { x: 2300, y: 480, width: 220, height: 25 },
      { x: 3050, y: 420, width: 220, height: 25 },
      { x: 3450, y: 480, width: 250, height: 25 },
    ];

    const undergroundPlatforms: Platform[] = [
      { x: 0, y: 640, width: 2400, height: 80 },
      { x: 160, y: 500, width: 240, height: 25 },
      { x: 700, y: 470, width: 260, height: 25 },
      { x: 1200, y: 400, width: 260, height: 25 },
      { x: 1700, y: 470, width: 260, height: 25 },
    ];

    // One pipe down (in the overworld) into one blue underground world
    // holding all three projects, and one pipe back up.
    const overworldPipe: Pipe = { x: 1200, y: 515, width: 96, height: 125 };
    const undergroundExitPipe: Pipe = { x: 2050, y: 515, width: 96, height: 125 };

    const overworldPoints: InfoPoint[] = [
      { x: 500, y: 320, title: "ABOUT ME", body: ABOUT_TEXT },
      {
        x: 3150,
        y: 300,
        title: "CONTACT",
        body: `WhatsApp: ${CONTACT.whatsapp}\nPhone: ${CONTACT.phone}\nLinkedIn: ${CONTACT.linkedin.replace(
          "https://www.",
          ""
        )}\nInstagram: @${CONTACT.instagram}`,
      },
    ];

    const undergroundPoints: InfoPoint[] = PROJECTS.map((project, i) => ({
      x: 500 + i * 550,
      y: 300,
      title: project.name.toUpperCase(),
      body: project.description,
    }));

    // -----------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------

    function clamp(value: number, minimum: number, maximum: number) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function easeInOutCubic(t: number) {
      if (t < 0.5) return 4 * t * t * t;
      return 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function rectangleCollision(
      a: { x: number; y: number; width: number; height: number },
      b: { x: number; y: number; width: number; height: number }
    ) {
      return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    // -----------------------------------------------------------
    // Background
    // -----------------------------------------------------------

    function drawOverworldBackground() {
      const gradient = ctx!.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, "#52c7ff");
      gradient.addColorStop(1, "#d4f5ff");
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      drawCloud(120, 125, 1);
      drawCloud(650, 100, 0.8);
      drawCloud(1080, 160, 1.2);
      drawCloud(1550, 110, 0.9);
      drawCloud(2040, 150, 1);
      drawCloud(2900, 130, 1.1);

      drawMountains();
    }

    function drawCloud(x: number, y: number, scale: number) {
      const screenX = x - cameraX * 0.5;
      ctx!.fillStyle = "#fff";
      ctx!.beginPath();
      ctx!.arc(screenX, y, 30 * scale, 0, Math.PI * 2);
      ctx!.arc(screenX + 35 * scale, y - 15 * scale, 38 * scale, 0, Math.PI * 2);
      ctx!.arc(screenX + 75 * scale, y, 28 * scale, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.fillRect(screenX - 25 * scale, y, 125 * scale, 25 * scale);
    }

    function drawMountains() {
      ctx!.fillStyle = "#77bf5a";
      [
        [100, 430, 320, 220],
        [500, 450, 450, 270],
        [1050, 430, 380, 235],
        [1500, 440, 500, 270],
        [2150, 430, 400, 230],
        [2900, 440, 450, 250],
        [3400, 430, 380, 220],
      ].forEach(([x, groundY, width, height]) => drawMountain(x - cameraX * 0.65, groundY, width, height));
    }

    function drawMountain(x: number, groundY: number, width: number, height: number) {
      if (x + width < -50 || x > GAME_WIDTH + 50) return;
      ctx!.beginPath();
      ctx!.moveTo(x, groundY);
      ctx!.lineTo(x + width / 2, groundY - height);
      ctx!.lineTo(x + width, groundY);
      ctx!.closePath();
      ctx!.fill();
    }

    function drawUndergroundBackground() {
      const gradient = ctx!.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      gradient.addColorStop(0, "#06164f");
      gradient.addColorStop(0.5, "#082b73");
      gradient.addColorStop(1, "#020b2d");
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      for (let y = 0; y < GAME_HEIGHT; y += 32) {
        for (let x = 0; x < GAME_WIDTH; x += 32) {
          ctx!.strokeStyle = "rgba(65,180,255,0.07)";
          ctx!.strokeRect(x, y, 32, 32);
        }
      }

      for (let i = 0; i < 30; i++) {
        const x = (i * 217) % (GAME_WIDTH * 2);
        const y = 100 + ((i * 73) % 420);
        ctx!.fillStyle = "rgba(63,182,255,0.15)";
        ctx!.fillRect(x, y, 15, 15);
      }
    }

    // -----------------------------------------------------------
    // Ground / blocks / castle
    // -----------------------------------------------------------

    function drawPlatforms() {
      const platforms = world === "overworld" ? overworldPlatforms : undergroundPlatforms;
      for (const platform of platforms) {
        const screenX = platform.x - cameraX;
        if (screenX + platform.width < 0 || screenX > GAME_WIDTH) continue;

        if (platform.y >= GAME_HEIGHT - 100) {
          drawGround(screenX, platform.y, platform.width, platform.height);
        } else {
          drawBlockPlatform(screenX, platform.y, platform.width, platform.height);
        }
      }
    }

    function drawGround(x: number, y: number, width: number, height: number) {
      ctx!.fillStyle = world === "underground" ? "#183c71" : "#8d542f";
      ctx!.fillRect(x, y, width, height);

      for (let bx = x; bx < x + width; bx += 32) {
        for (let by = y; by < y + height; by += 32) {
          ctx!.strokeStyle = world === "underground" ? "rgba(91,185,255,0.15)" : "rgba(70,35,15,0.3)";
          ctx!.strokeRect(bx, by, 32, 32);
        }
      }
    }

    function drawBlockPlatform(x: number, y: number, width: number, height: number) {
      ctx!.fillStyle = world === "overworld" ? "#d99a38" : "#246baa";
      ctx!.fillRect(x, y, width, height);
      ctx!.fillStyle = world === "overworld" ? "#ffd16a" : "#5acbff";
      ctx!.fillRect(x + 2, y + 2, width - 4, 5);

      for (let bx = x + 4; bx < x + width; bx += 32) {
        ctx!.strokeStyle = world === "overworld" ? "#9b6524" : "#124f86";
        ctx!.strokeRect(bx, y, 30, height);
      }
    }

    function drawCastle(worldX: number, groundY: number) {
      const x = worldX - cameraX;
      const w = 260;
      const h = 200;
      if (x + w < 0 || x > GAME_WIDTH) return;

      const baseY = groundY - h;

      ctx!.fillStyle = "#a8a8a8";
      ctx!.fillRect(x, baseY + 40, w, h - 40);
      ctx!.strokeStyle = "#5a5a5a";
      ctx!.lineWidth = 3;
      ctx!.strokeRect(x, baseY + 40, w, h - 40);

      // Crenellations
      ctx!.fillStyle = "#a8a8a8";
      for (let cx = 0; cx < w; cx += 30) {
        ctx!.fillRect(x + cx, baseY, 16, 44);
      }

      // Side towers
      ctx!.fillRect(x - 20, baseY + 20, 40, h - 20);
      ctx!.fillRect(x + w - 20, baseY + 20, 40, h - 20);

      // Doorway
      ctx!.fillStyle = "#1a1a1a";
      ctx!.beginPath();
      ctx!.moveTo(x + w / 2 - 30, baseY + h);
      ctx!.lineTo(x + w / 2 - 30, baseY + h - 70);
      ctx!.quadraticCurveTo(x + w / 2, baseY + h - 105, x + w / 2 + 30, baseY + h - 70);
      ctx!.lineTo(x + w / 2 + 30, baseY + h);
      ctx!.closePath();
      ctx!.fill();

      // Windows
      ctx!.fillRect(x + 24, baseY + 80, 16, 22);
      ctx!.fillRect(x + w - 40, baseY + 80, 16, 22);
      ctx!.fillRect(x + w / 2 - 8, baseY + 60, 16, 16);
    }

    // -----------------------------------------------------------
    // Pipes
    // -----------------------------------------------------------

    function drawPipe(pipe: Pipe) {
      const x = pipe.x - cameraX;
      if (x + pipe.width < 0 || x > GAME_WIDTH) return;

      ctx!.fillStyle = "#139947";
      ctx!.fillRect(x + 12, pipe.y + 22, pipe.width - 24, pipe.height - 22);
      ctx!.fillStyle = "#08733b";
      ctx!.fillRect(x + 12, pipe.y + 22, 14, pipe.height - 22);
      ctx!.fillStyle = "#48d76e";
      ctx!.fillRect(x + 31, pipe.y + 24, 11, pipe.height - 26);
      ctx!.fillStyle = "#16b653";
      ctx!.fillRect(x - 4, pipe.y, pipe.width + 8, 27);
      ctx!.fillStyle = "#086f39";
      ctx!.fillRect(x - 4, pipe.y, pipe.width + 8, 5);
      ctx!.fillStyle = "#48db70";
      ctx!.fillRect(x + 7, pipe.y + 6, pipe.width - 14, 6);
    }

    // -----------------------------------------------------------
    // Info plaques (about / projects / contact)
    // -----------------------------------------------------------

    function drawInfoPoints() {
      const points = world === "overworld" ? overworldPoints : undergroundPoints;

      for (const point of points) {
        const x = point.x - cameraX;
        if (x < -400 || x > GAME_WIDTH + 400) continue;

        const width = 320;
        ctx!.font = "12px monospace";
        const bodyLines = wrapText(ctx!, point.body, width - 36);
        const height = 56 + bodyLines.length * 16;

        ctx!.fillStyle = "rgba(0,0,0,0.5)";
        ctx!.fillRect(x + 7, point.y + 7, width, height);

        ctx!.fillStyle = "#061b45";
        ctx!.fillRect(x, point.y, width, height);

        ctx!.strokeStyle = "#3fcaff";
        ctx!.lineWidth = 3;
        ctx!.strokeRect(x + 3, point.y + 3, width - 6, height - 6);

        ctx!.fillStyle = "#52d8ff";
        ctx!.fillRect(x + 7, point.y + 7, width - 14, 5);

        ctx!.fillStyle = "#ffffff";
        ctx!.font = "bold 18px monospace";
        ctx!.fillText(point.title, x + 18, point.y + 38);

        ctx!.fillStyle = "#bfe9ff";
        ctx!.font = "12px monospace";
        bodyLines.forEach((line, i) => {
          ctx!.fillText(line, x + 18, point.y + 62 + i * 16);
        });
      }
    }

    // -----------------------------------------------------------
    // HUD
    // -----------------------------------------------------------

    function drawHeart(x: number, y: number, size = 1) {
      const s = size;
      ctx!.fillStyle = "#ff3045";
      ctx!.fillRect(x + 4 * s, y, 6 * s, 5 * s);
      ctx!.fillRect(x + 13 * s, y, 6 * s, 5 * s);
      ctx!.fillRect(x, y + 5 * s, 23 * s, 8 * s);
      ctx!.fillRect(x + 4 * s, y + 13 * s, 15 * s, 5 * s);
      ctx!.fillRect(x + 8 * s, y + 18 * s, 7 * s, 4 * s);
    }

    function drawHUD() {
      ctx!.fillStyle = "rgba(0,0,0,0.62)";
      ctx!.fillRect(0, 0, GAME_WIDTH, 68);

      ctx!.fillStyle = "#ffffff";
      ctx!.font = "bold 15px monospace";
      ctx!.fillText(PROFILE.name.split(" ")[0].toUpperCase(), 25, 23);

      drawHeart(25, 36, 1.05);
      drawHeart(56, 36, 1.05);
      drawHeart(87, 36, 1.05);

      ctx!.fillStyle = "#ffffff";
      ctx!.font = "bold 16px monospace";
      const worldText = world === "overworld" ? "STAGE 1-1" : "STAGE B-1";
      ctx!.fillText(worldText, GAME_WIDTH / 2 - 60, 25);

      ctx!.fillStyle = "#6dddff";
      ctx!.font = "bold 13px monospace";
      ctx!.fillText(PROFILE.title.toUpperCase(), GAME_WIDTH - 300, 23);

      ctx!.fillStyle = "#ffffff";
      ctx!.font = "11px monospace";
      ctx!.fillText("← → MOVE     SPACE JUMP     ↓ PIPE", GAME_WIDTH / 2 - 155, 49);
    }

    // -----------------------------------------------------------
    // Character sprite
    // -----------------------------------------------------------

    function drawCharacter() {
      const screenX = player.x - cameraX;
      const screenY = player.y;
      const animation = animationData[player.animation];
      const frame = player.animationFrame % animation.frames;
      const sourceX = frame * SPRITE_FRAME_WIDTH;
      const sourceY = animation.row * SPRITE_FRAME_HEIGHT;

      ctx!.save();
      ctx!.imageSmoothingEnabled = false;

      if (player.facing === -1) {
        ctx!.translate(screenX + player.width, screenY);
        ctx!.scale(-1, 1);
        ctx!.drawImage(
          sprite,
          sourceX,
          sourceY,
          SPRITE_FRAME_WIDTH,
          SPRITE_FRAME_HEIGHT,
          0,
          0,
          player.width,
          player.height
        );
      } else {
        ctx!.drawImage(
          sprite,
          sourceX,
          sourceY,
          SPRITE_FRAME_WIDTH,
          SPRITE_FRAME_HEIGHT,
          screenX,
          screenY,
          player.width,
          player.height
        );
      }

      ctx!.restore();
    }

    // -----------------------------------------------------------
    // Animation state
    // -----------------------------------------------------------

    function updateAnimation(delta: number) {
      let animation: AnimationName = "idle";

      if (player.pipeState === "entering") animation = "pipeDown";
      else if (player.pipeState === "exiting") animation = "pipeUp";
      else if (!player.grounded) animation = player.vy < 0 ? "jump" : "fall";
      else if (Math.abs(player.vx) > 0.25) animation = "walk";

      if (animation !== player.animation) {
        player.animation = animation;
        player.animationFrame = 0;
        player.animationTimer = 0;
      }

      player.animationTimer += delta;
      const data = animationData[player.animation];
      if (player.animationTimer >= data.speed) {
        player.animationTimer = 0;
        player.animationFrame = (player.animationFrame + 1) % data.frames;
      }
    }

    // -----------------------------------------------------------
    // Physics
    // -----------------------------------------------------------

    function updatePlayer() {
      if (player.pipeState !== "none") {
        updatePipeTransition();
        return;
      }

      let direction = 0;
      if (keys.has("ArrowLeft") || keys.has("a")) direction -= 1;
      if (keys.has("ArrowRight") || keys.has("d")) direction += 1;

      if (direction !== 0) {
        player.vx += direction * ACCELERATION;
        player.vx = clamp(player.vx, -MAX_SPEED, MAX_SPEED);
        player.facing = direction === 1 ? 1 : -1;
      } else {
        player.vx *= FRICTION;
        if (Math.abs(player.vx) < 0.05) player.vx = 0;
      }

      if ((keys.has(" ") || keys.has("ArrowUp") || keys.has("w")) && player.grounded) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        AudioManager.play("jump");
        keys.delete(" ");
      }

      player.vy += GRAVITY;
      player.x += player.vx;
      player.y += player.vy;

      const platforms = world === "overworld" ? overworldPlatforms : undergroundPlatforms;
      player.grounded = false;

      for (const platform of platforms) {
        const wasAbove = player.y + player.height - player.vy <= platform.y;
        const currentlyOverlapping = player.x + player.width > platform.x && player.x < platform.x + platform.width;
        const falling = player.vy >= 0;

        if (currentlyOverlapping && falling && wasAbove && player.y + player.height >= platform.y) {
          player.y = platform.y - player.height;
          player.vy = 0;
          player.grounded = true;
        }
      }

      const worldWidth = world === "overworld" ? WORLD_WIDTH : 2400;
      player.x = clamp(player.x, 0, worldWidth);

      if (player.y > GAME_HEIGHT + 200) {
        player.x = world === "overworld" ? 180 : 200;
        player.y = 350;
        player.vx = 0;
        player.vy = 0;
      }

      handlePipeEntry();

      const targetCamera = player.x - GAME_WIDTH * 0.38;
      cameraX += (targetCamera - cameraX) * 0.09;
      cameraX = clamp(cameraX, 0, worldWidth - GAME_WIDTH);
    }

    function handlePipeEntry() {
      if (player.pipeState !== "none") return;
      if (!keys.has("ArrowDown") && !keys.has("s")) return;

      const pipe = world === "overworld" ? overworldPipe : undergroundExitPipe;
      const pipeTop = { x: pipe.x - 6, y: pipe.y, width: pipe.width + 12, height: 45 };

      if (rectangleCollision(player, pipeTop)) {
        keys.delete("ArrowDown");
        keys.delete("s");
        AudioManager.play("select");

        player.pipeState = "entering";
        player.pipeProgress = 0;
        player.vx = 0;
        player.vy = 0;
        player.pipeStartY = player.y;
        player.pipeTargetY = player.y + 90;
      }
    }

    function updatePipeTransition() {
      player.pipeProgress += 0.028;
      const progress = clamp(player.pipeProgress, 0, 1);
      const eased = easeInOutCubic(progress);
      player.y = player.pipeStartY + (player.pipeTargetY - player.pipeStartY) * eased;

      if (player.pipeProgress >= 1) {
        if (world === "overworld") {
          world = "underground";
          player.x = undergroundExitPipe.x + undergroundExitPipe.width / 2 - player.width / 2;
          player.pipeState = "exiting";
          player.pipeProgress = 0;
          player.pipeStartY = undergroundExitPipe.y + 90;
          player.pipeTargetY = undergroundExitPipe.y - player.height + 10;
          player.y = player.pipeStartY;
          cameraX = clamp(player.x - GAME_WIDTH * 0.38, 0, 2400 - GAME_WIDTH);
        } else {
          world = "overworld";
          player.x = overworldPipe.x + overworldPipe.width / 2 - player.width / 2;
          player.pipeState = "exiting";
          player.pipeProgress = 0;
          player.pipeStartY = overworldPipe.y + 90;
          player.pipeTargetY = overworldPipe.y - player.height + 10;
          player.y = player.pipeStartY;
          cameraX = clamp(player.x - GAME_WIDTH * 0.38, 0, WORLD_WIDTH - GAME_WIDTH);
        }
      }
    }

    // -----------------------------------------------------------
    // Render + loop
    // -----------------------------------------------------------

    function draw() {
      ctx!.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      if (world === "overworld") drawOverworldBackground();
      else drawUndergroundBackground();

      drawPlatforms();

      if (world === "overworld") {
        drawPipe(overworldPipe);
        drawCastle(3150, 640);
      } else {
        drawPipe(undergroundExitPipe);
      }

      drawInfoPoints();
      drawCharacter();
      drawHUD();
    }

    function loop(time: number) {
      const delta = Math.min(time - lastTime, 50);
      lastTime = time;

      updatePlayer();
      updateAnimation(delta);
      draw();

      animationId = requestAnimationFrame(loop);
    }

    // -----------------------------------------------------------
    // Input
    // -----------------------------------------------------------

    function onKeyDown(event: KeyboardEvent) {
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key)) {
        event.preventDefault();
      }
      keys.add(event.key);
    }

    function onKeyUp(event: KeyboardEvent) {
      keys.delete(event.key);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return (
    <main className="mario-portfolio">
      <canvas ref={canvasRef} className="mario-canvas" />
      <div className="portfolio-overlay">
        <div className="instructions">
          <span>← →</span>
          <span>Move</span>
          <span>SPACE</span>
          <span>Jump</span>
          <span>↓</span>
          <span>Enter Pipe</span>
        </div>
      </div>
    </main>
  );
}
