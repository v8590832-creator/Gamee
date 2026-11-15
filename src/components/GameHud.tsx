import type { ControlBindings, HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  bindings: ControlBindings;
  muted: boolean;
  onToggleMute: () => void;
  onRespawn: () => void;
  onPause: () => void;
}

function formatKeyLabel(code: string): string {
  if (code === 'Space') return 'SPACE';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
  if (code === 'Escape') return 'ESC';
  return code.replace('Key', '').replace('Digit', '');
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const tenths = Math.floor((sec * 10) % 10);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${tenths}`;
}

export function GameHud({
  hud,
  bindings,
  muted,
  onToggleMute,
  onRespawn,
  onPause,
}: GameHudProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 md:p-6">
      {/* Subtle peripheral tint during Time Slow or Inverted Gravity */}
      {hud.timeSlowActive && (
        <div
          className="fixed inset-0 pointer-events-none border-4 border-[#48b8d0]/40"
          aria-hidden="true"
        />
      )}

      {/* Top Perimeter Clusters */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Level & Active Checkpoint */}
        <div className="hud-panel border-l-2 border-l-[#e59a3c] rounded px-4 py-2.5 max-w-xs">
          <div className="text-[11px] font-semibold tracking-[0.16em] text-[#e59a3c] uppercase">
            {hud.worldName}
          </div>
          <div className="font-display text-lg font-bold text-[#f3f5f8] leading-tight mt-0.5">
            {hud.levelName}
          </div>
          <div className="text-xs text-[#9ba5b4] mt-0.5 flex items-center gap-1.5">
            <span>Checkpoint:</span>
            <span className="text-[#d7dee8] font-medium truncate">{hud.checkpointLabel}</span>
          </div>
        </div>

        {/* Center-Top Notifications (Checkpoint / Achievement) */}
        <div className="flex flex-col items-center gap-2">
          {hud.checkpointNotice && (
            <div className="hud-panel rounded px-4 py-1.5 text-xs font-display font-semibold tracking-wider text-[#e59a3c] animate-toast-in">
              {hud.checkpointNotice}
            </div>
          )}
          {hud.achievementNotice && (
            <div className="hud-panel rounded px-4 py-1.5 text-xs font-display font-semibold tracking-wider text-[#eef4ff] border-[#48b8d0]/50 animate-toast-in">
              {hud.achievementNotice}
            </div>
          )}
        </div>

        {/* Top-Right: Score, Shards, Timer & Utility Controls */}
        <div className="flex items-start gap-2.5">
          <div className="hud-panel rounded px-4 py-2 flex items-center gap-5">
            <div>
              <div className="text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Score</div>
              <div
                data-testid="hud-score"
                className="font-mono-num text-xl font-bold text-[#f3f5f8] leading-tight"
              >
                {Math.round(hud.score)}
              </div>
            </div>

            <div className="h-7 w-px bg-white/10" aria-hidden="true" />

            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
                <polygon
                  points="12,2 20,12 12,22 4,12"
                  fill="#e59a3c"
                  stroke="#141820"
                  strokeWidth="1.5"
                />
                <polygon points="12,5 16,12 12,15 8,12" fill="#fde3b4" opacity="0.7" />
              </svg>
              <div>
                <div className="text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Shards</div>
                <div
                  data-testid="hud-shards"
                  className="font-mono-num text-lg font-bold text-[#f3f5f8] leading-tight"
                >
                  {hud.collectiblesFound}/{hud.collectiblesTotal}
                </div>
              </div>
            </div>

            <div className="h-7 w-px bg-white/10" aria-hidden="true" />

            <div>
              <div className="text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Time</div>
              <div
                data-testid="hud-time"
                className="font-mono-num text-lg font-bold text-[#f3f5f8] leading-tight"
              >
                {formatTime(hud.elapsedTime)}
              </div>
            </div>
          </div>

          {/* Utility Icon Buttons */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-10 h-10 hud-panel rounded flex items-center justify-center text-[#d7dee8] hover:text-white hover:border-[#e59a3c]/60 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                {muted ? (
                  <path d="M22 9l-6 6M16 9l6 6" />
                ) : (
                  <path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
                )}
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Respawn at Checkpoint [R]"
              title="Respawn at Checkpoint [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                onRespawn();
              }}
              className="w-10 h-10 hud-panel rounded flex items-center justify-center text-[#d7dee8] hover:text-white hover:border-[#e59a3c]/60 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game [Esc]"
              title="Pause Game [Esc]"
              onClick={(e) => {
                e.currentTarget.blur();
                onPause();
              }}
              className="w-10 h-10 hud-panel rounded flex items-center justify-center text-[#d7dee8] hover:text-white hover:border-[#e59a3c]/60 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Perimeter: Contextual Interact Prompt + Opening Stage Hint + Compact Ability Cooldown Bar */}
      <div className="flex flex-col items-center gap-2">
        {hud.interactPrompt && (
          <div className="hud-panel rounded px-4 py-1.5 text-xs font-display font-semibold tracking-wider text-[#f3f5f8]">
            [{formatKeyLabel(bindings.interact)}] {hud.interactPrompt}
          </div>
        )}
        {!hud.interactPrompt && hud.levelHint && (
          <div className="hud-panel-subtle rounded px-3.5 py-1 text-xs text-[#cfd6e0]">
            {hud.levelHint}
          </div>
        )}

        <div className="hud-panel rounded px-4 py-2 flex items-center gap-4">
          {/* Speed Readout */}
          <div className="pr-2 border-r border-white/10 text-right min-w-[68px]">
            <div className="text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Speed</div>
            <div className="font-mono-num text-sm font-bold text-[#f3f5f8]">
              {Math.round(hud.speed * 3.6)} <span className="text-[10px] text-[#9ba5b4]">km/h</span>
            </div>
          </div>

          {/* Dash Ability */}
          <div className="flex items-center gap-2 min-w-[125px]">
            <div className="px-1.5 py-0.5 rounded bg-white/10 font-mono-num text-[11px] font-semibold text-[#e59a3c]">
              {formatKeyLabel(bindings.dash)}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-[#e6e9ef] leading-none mb-1">
                Bounce Dash
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-[#e59a3c] transition-all duration-75"
                  style={{
                    width: `${Math.round(
                      (hud.dashCooldownRatio > 0 ? 1 - hud.dashCooldownRatio : hud.dashCharge) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Gravity Shift Ability */}
          <div
            className={`flex items-center gap-2 min-w-[125px] ${
              hud.canGravityShift ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div className="px-1.5 py-0.5 rounded bg-white/10 font-mono-num text-[11px] font-semibold text-[#48b8d0]">
              {formatKeyLabel(bindings.gravityShift)}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-[#e6e9ef] leading-none mb-1">
                {hud.gravityInverted ? 'Gravity: INV' : 'Gravity Shift'}
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-[#48b8d0] transition-all duration-75"
                  style={{
                    width: `${Math.round((1 - hud.gravityCooldownRatio) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Time Control Ability */}
          <div
            className={`flex items-center gap-2 min-w-[125px] ${
              hud.canTimeControl ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <div className="px-1.5 py-0.5 rounded bg-white/10 font-mono-num text-[11px] font-semibold text-[#d9d9e3]">
              {formatKeyLabel(bindings.timeSlow)}
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-medium text-[#e6e9ef] leading-none mb-1">
                {hud.timeSlowActive ? 'Time: SLOW' : 'Time Control'}
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-[#d9d9e3] transition-all duration-75"
                  style={{ width: `${Math.round(hud.timeSlowEnergy * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
