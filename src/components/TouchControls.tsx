import type { PointerEvent, MouseEvent } from "react";

/**
 * The game engine (MarioPortfolio.tsx) listens for real keyboard
 * events on `window`. Rather than plumb a separate touch-input path
 * through that code, these buttons just dispatch synthetic
 * KeyboardEvents with the same `key` values — the existing
 * onKeyDown/onKeyUp handlers pick them up with zero changes needed.
 */
const KEY_MAP = {
  left: "ArrowLeft",
  right: "ArrowRight",
  down: "ArrowDown",
  jump: " ",
} as const;

function dispatchKey(type: "keydown" | "keyup", key: string) {
  window.dispatchEvent(new KeyboardEvent(type, { key }));
}

export default function TouchControls() {
  const bind = (action: keyof typeof KEY_MAP) => {
    const key = KEY_MAP[action];
    return {
      onPointerDown: (e: PointerEvent) => {
        e.preventDefault();
        dispatchKey("keydown", key);
      },
      onPointerUp: (e: PointerEvent) => {
        e.preventDefault();
        dispatchKey("keyup", key);
      },
      onPointerLeave: () => dispatchKey("keyup", key),
      onContextMenu: (e: MouseEvent) => e.preventDefault(),
    };
  };

  const btnBase =
    "select-none touch-none flex items-center justify-center rounded-lg bg-white/20 active:bg-white/40 border-2 border-white/50 text-white text-xl backdrop-blur-sm";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-between items-end px-4 pb-6 pointer-events-none sm:hidden">
      <div className="grid grid-cols-3 grid-rows-2 gap-1 pointer-events-auto w-[168px]">
        <div />
        <div />
        <div />
        <button {...bind("left")} className={`${btnBase} w-14 h-14`} aria-label="Move left">
          ◀
        </button>
        <button {...bind("down")} className={`${btnBase} w-14 h-14`} aria-label="Enter pipe">
          ▼
        </button>
        <button {...bind("right")} className={`${btnBase} w-14 h-14`} aria-label="Move right">
          ▶
        </button>
      </div>
      <button {...bind("jump")} className={`${btnBase} rounded-full w-20 h-20 pointer-events-auto`} aria-label="Jump">
        ▲
      </button>
    </div>
  );
}
