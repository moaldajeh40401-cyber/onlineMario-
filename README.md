# Mohammad Aldajeh — Portfolio Platformer

A Mario-inspired portfolio site: React + TypeScript + Tailwind + Vite, Phaser 3
for the game, Framer Motion for the overlay cards, Howler.js for audio.

## Flow

1. **Start screen** — black title-card screen with your name + role, "PRESS START"
2. Player spawns and walks right
3. Crossing an invisible trigger opens an **About Me** message box
4. **3 pipes** — stand on top of one and press **Down** to warp into a blue
   underground room for that project (Seig, Hustler, ride-hailing app), shown
   as an NES-style message box. Stand on the return pipe in that room and
   press Down again to warp back to the overworld, right past the pipe you came from.
5. **Castle** at the end opens a message box with your contact info
   (WhatsApp, phone, LinkedIn, Instagram)

All content — name, bio, project descriptions, contact links — lives in one file:
`src/content/portfolio.ts`. Edit that file to change any text without touching game code.

## Controls

- **Laptop/desktop:** Arrow keys or WASD to move, Up / W / Space to jump,
  Down / S to enter/exit a pipe while standing on top of it
- **Phone:** on-screen D-pad (left/right/down) + jump button, shown
  automatically on small screens (`src/components/TouchControls.tsx`)

## Getting started

```bash
npm install
npm run dev
```

```bash
npm run build     # production build to dist/
npm run preview   # preview the production build
```

## Editing content

Open `src/content/portfolio.ts`:

```ts
export const PROFILE = { name: "...", title: "..." };
export const ABOUT_TEXT = "...";
export const PROJECTS = [{ name: "...", description: "..." }, ...];
export const CONTACT = { phone, whatsapp, whatsappLink, linkedin, instagram, instagramLink };
```

Add/remove a project by adding/removing an entry in `PROJECTS` — `GameScene.ts`
automatically spaces out one pipe per project, no other code needs to change.

## Swapping in real assets

### Pixel art (LibreSprite / Aseprite)

All art (player, blocks, pipes, castle, clouds) is currently drawn on a
`<canvas>` at runtime in `src/game/scenes/PreloadScene.ts` — the game needs
zero external image files to run. To use real art:

1. Export sprite sheets/images from LibreSprite or Aseprite as PNG.
2. Drop them in `public/sprites/`.
3. Replace the relevant `generate*Texture()` call in `PreloadScene.ts` with
   `this.load.spritesheet(...)` / `this.load.image(...)`.
4. If you change the player's frame layout, update `createAnimations()` in
   `src/game/entities/Player.ts` to match.

### Levels (Tiled)

1. Design the level in [Tiled](https://www.mapeditor.org/), export as JSON
   to `public/maps/level1.json`.
2. In `PreloadScene.ts`: `this.load.tilemapTiledJSON("level1", "/maps/level1.json")`.
3. Replace `GameScene.buildLevel()` with a `this.make.tilemap(...)` call and
   build layers from it. Keep the trigger-zone logic in `setupTriggers()` as-is
   — just update the x-coordinates to match your new layout.

### Audio (Howler.js)

`src/audio/AudioManager.ts` expects these (OGG + MP3 for browser compatibility):

```
public/audio/theme.ogg    public/audio/theme.mp3     background music
public/audio/jump.ogg     public/audio/jump.mp3      jump sound
public/audio/select.ogg   public/audio/select.mp3    played on entering a pipe/castle
```

## Project structure

```
src/
  main.tsx, App.tsx           React entry + composes canvas/overlay/touch controls
  index.css                   Tailwind + pixel-art canvas rendering
  content/portfolio.ts         All your text/links — edit this to update content
  components/
    PhaserGame.tsx              Mounts/destroys the Phaser.Game instance
    PortfolioUI.tsx              Start screen + NES-style message box (about/project/contact)
    TouchControls.tsx            On-screen D-pad + jump button (mobile only)
  game/
    EventBus.ts                  React <-> Phaser event bridge
    InputState.ts                 Shared touch-input state read by Player + scenes
    config/gameConfig.ts          Phaser.Game config, scene list
    scenes/
      BootScene.ts
      PreloadScene.ts             Generates placeholder textures / loads real assets
      GameScene.ts                 Overworld: level layout, about/castle triggers, pipe warp
      UndergroundScene.ts          Blue brick room per project + return pipe
    entities/
      Player.ts                    Movement, jump, keyboard + touch input, lockable
  audio/
    AudioManager.ts                Howler.js wrapper
public/
  audio/                          Drop real SFX/music here
  maps/                           Drop Tiled JSON exports here
```

## Version control

```bash
git init
git add .
git commit -m "Portfolio platformer: start screen, about, 3 project pipes, castle contact"
git remote add origin <your-github-repo-url>
git push -u origin main
```
