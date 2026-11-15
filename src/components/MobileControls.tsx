import { useRef, useState } from 'react';

type TouchAction = 'jump' | 'sprint' | 'slide' | 'bounce' | 'dash' | 'special' | 'interact';

interface MobileControlsProps {
  hasInteractPrompt: boolean;
  canDash: boolean;
  onMove: (forward: number, right: number) => void;
  onAction: (action: TouchAction, pressed: boolean) => void;
  onOrbit: (deltaX: number, deltaY: number) => void;
}

export function MobileControls({
  hasInteractPrompt,
  canDash,
  onMove,
  onAction,
  onOrbit,
}: MobileControlsProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const stickTouchId = useRef<number | null>(null);
  const orbitTouchRef = useRef<{ id: number; x: number; y: number } | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });

  const updateStick = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.36;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }
    setKnobOffset({ x: dx, y: dy });
    onMove(-dy / maxR, dx / maxR);
  };

  const resetStick = () => {
    stickTouchId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const bindActionButton = (action: TouchAction) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAction(action, true);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAction(action, false);
    },
    onTouchCancel: (e: React.TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onAction(action, false);
    },
  });

  return (
    <div className="fixed inset-0 z-20 pointer-events-none select-none touch-none">
      {/* Right-half invisible touch-drag camera orbit surface */}
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-1/2 pointer-events-auto"
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (t && !orbitTouchRef.current) {
            orbitTouchRef.current = { id: t.identifier, x: t.clientX, y: t.clientY };
          }
        }}
        onTouchMove={(e) => {
          if (!orbitTouchRef.current) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === orbitTouchRef.current.id) {
              const dx = t.clientX - orbitTouchRef.current.x;
              const dy = t.clientY - orbitTouchRef.current.y;
              orbitTouchRef.current.x = t.clientX;
              orbitTouchRef.current.y = t.clientY;
              onOrbit(dx, dy);
            }
          }
        }}
        onTouchEnd={(e) => {
          const active = orbitTouchRef.current;
          if (!active) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === active.id) {
              orbitTouchRef.current = null;
            }
          }
        }}
        onTouchCancel={() => {
          orbitTouchRef.current = null;
        }}
      />

      {/* Left Virtual Movement Joystick */}
      <div
        ref={padRef}
        aria-label="Virtual Movement Joystick"
        className="absolute bottom-16 left-3.5 sm:bottom-20 sm:left-5 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-black/40 border-2 border-[#e59a3c]/50 flex items-center justify-center pointer-events-auto touch-none"
        onTouchStart={(e) => {
          e.preventDefault();
          const t = e.changedTouches[0];
          if (t) {
            stickTouchId.current = t.identifier;
            updateStick(t.clientX, t.clientY);
          }
        }}
        onTouchMove={(e) => {
          e.preventDefault();
          if (stickTouchId.current === null) return;
          for (let i = 0; i < e.changedTouches.length; i++) {
            const t = e.changedTouches[i];
            if (t.identifier === stickTouchId.current) {
              updateStick(t.clientX, t.clientY);
            }
          }
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          resetStick();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          resetStick();
        }}
      >
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#e59a3c]/85 border border-white/50 shadow-lg"
          style={{ transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)` }}
        />
      </div>

      {/* Right Action Cluster */}
      <div className="absolute bottom-16 right-3.5 sm:bottom-20 sm:right-5 flex flex-col items-end gap-2 sm:gap-2.5 pointer-events-auto">
        {hasInteractPrompt && (
          <button
            type="button"
            aria-label="Interact"
            {...bindActionButton('interact')}
            className="px-4 py-2 rounded bg-[#58c477] text-[#0e1116] font-display font-bold text-xs tracking-wider shadow"
          >
            INTERACT
          </button>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Slide"
            {...bindActionButton('slide')}
            className="w-12 h-12 rounded-full hud-panel text-[10px] font-display font-bold text-[#e6e9ef] active:bg-white/20"
          >
            SLIDE
          </button>
          <button
            type="button"
            aria-label="Sprint"
            {...bindActionButton('sprint')}
            className="w-12 h-12 rounded-full hud-panel text-[10px] font-display font-bold text-[#e6e9ef] active:bg-white/20"
          >
            SPRINT
          </button>
          <button
            type="button"
            aria-label="Highway Surge"
            {...bindActionButton('special')}
            className="w-12 h-12 rounded-full hud-panel border-[#58c477]/60 text-[10px] font-display font-bold text-[#58c477] active:bg-[#58c477]/20"
          >
            SURGE
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Road Dash"
            disabled={!canDash}
            {...bindActionButton('dash')}
            className={`w-13 h-13 rounded-full hud-panel text-[11px] font-display font-bold ${
              canDash ? 'border-[#e59a3c]/70 text-[#e59a3c]' : 'opacity-40 text-[#9ba5b4]'
            }`}
          >
            DASH
          </button>
          <button
            type="button"
            aria-label="Super Bounce"
            {...bindActionButton('bounce')}
            className="w-14 h-14 rounded-full hud-panel border-[#f5b832]/80 text-[11px] font-display font-bold text-[#f5b832] active:bg-[#f5b832]/20"
          >
            BOUNCE
          </button>
          <button
            type="button"
            aria-label="Jump"
            {...bindActionButton('jump')}
            className="w-16 h-16 rounded-full bg-[#e59a3c] text-[#0e1116] font-display font-bold text-xs tracking-wider shadow-lg active:scale-95"
          >
            JUMP
          </button>
        </div>
      </div>
    </div>
  );
}
