import type { ControlBindings, HudSnapshot } from '../game/types';

interface GameHudProps {
  hud: HudSnapshot;
  bindings: ControlBindings;
  muted: boolean;
  touchControlsActive?: boolean;
  onToggleMute: () => void;
  onRespawn: () => void;
  onPause: () => void;
}

function formatKeyLabel(code: string): string {
  if (code === 'Space') return 'SPACE';
  if (code === 'ShiftLeft' || code === 'ShiftRight') return 'SHIFT';
  if (code === 'ControlLeft' || code === 'ControlRight') return 'CTRL';
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
  touchControlsActive = false,
  onToggleMute,
  onRespawn,
  onPause,
}: GameHudProps) {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2.5 sm:p-4 md:p-6">
      {/* Subtle peripheral accent during Highway Surge */}
      {hud.specialActive && (
        <div
          className="fixed inset-0 pointer-events-none border-4 border-[#58c477]/45"
          aria-hidden="true"
        />
      )}

      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-start justify-between gap-2 md:gap-4">
        {/* Top-Left: World, Stage, Checkpoint & Health Hearts */}
        <div className="hud-panel border-l-2 border-l-[#e59a3c] rounded px-3 py-2 md:px-4 md:py-2.5 max-w-[230px] sm:max-w-xs">
          <div className="text-[10px] font-semibold tracking-[0.16em] text-[#e59a3c] uppercase truncate">
            {hud.worldName}
          </div>
          <div className="font-display text-sm sm:text-lg font-bold text-[#f3f5f8] leading-tight mt-0.5 truncate">
            {hud.levelName}
          </div>
          <div className="mt-1 flex items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-1" aria-label={`Health ${hud.health} of ${hud.maxHealth}`}>
              {Array.from({ length: hud.maxHealth }).map((_, idx) => (
                <svg
                  key={idx}
                  viewBox="0 0 24 24"
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${idx < hud.health ? 'text-[#ef4444]' : 'text-white/15'}`}
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  />
                </svg>
              ))}
            </div>
            <span className="text-[10px] sm:text-[11px] text-[#9ba5b4] truncate">
              CP: <span className="text-[#d7dee8] font-medium">{hud.checkpointLabel}</span>
            </span>
          </div>
        </div>

        {/* Center-Top: Boss Banner & Live Notifications */}
        <div className="order-4 md:order-none w-full md:w-auto flex flex-col items-center gap-1.5">
          {hud.bossName && (
            <div className="hud-panel border-[#ef4444]/60 rounded px-3 py-1 md:px-4 md:py-1.5 text-[11px] md:text-xs font-display font-bold tracking-wider text-[#fca5a5] uppercase">
              BOSS HAZARD: {hud.bossName}
            </div>
          )}
          {hud.checkpointNotice && (
            <div className="hud-panel rounded px-3 py-1 md:px-4 md:py-1.5 text-[11px] md:text-xs font-display font-semibold tracking-wider text-[#e59a3c] animate-toast-in">
              {hud.checkpointNotice}
            </div>
          )}
          {hud.achievementNotice && (
            <div className="hud-panel rounded px-3 py-1 md:px-4 md:py-1.5 text-[11px] md:text-xs font-display font-semibold tracking-wider text-[#eef4ff] border-[#48b8d0]/50 animate-toast-in">
              {hud.achievementNotice}
            </div>
          )}
        </div>

        {/* Top-Right: Utility Controls + Stats */}
        <div className="contents md:flex md:items-start md:gap-2.5">
          <div className="order-3 md:order-none w-full md:w-auto hud-panel rounded px-3 py-1.5 md:px-4 md:py-2 flex items-center justify-between md:justify-start gap-2.5 md:gap-4">
            <div>
              <div className="text-[9px] md:text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Score</div>
              <div
                data-testid="hud-score"
                className="font-mono-num text-sm md:text-lg font-bold text-[#f3f5f8] leading-tight"
              >
                {Math.round(hud.score)}
              </div>
            </div>

            <div className="h-6 md:h-7 w-px bg-white/10" aria-hidden="true" />

            <div>
              <div className="text-[9px] md:text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Coins</div>
              <div
                data-testid="hud-coins"
                className="font-mono-num text-sm md:text-lg font-bold text-[#f5b832] leading-tight"
              >
                +{hud.coinsRun}
              </div>
            </div>

            <div className="h-6 md:h-7 w-px bg-white/10" aria-hidden="true" />

            <div>
              <div className="text-[9px] md:text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">Items</div>
              <div
                data-testid="hud-shards"
                className="font-mono-num text-sm md:text-lg font-bold text-[#f3f5f8] leading-tight"
              >
                {hud.collectiblesFound}/{hud.collectiblesTotal}
              </div>
            </div>

            <div className="h-6 md:h-7 w-px bg-white/10" aria-hidden="true" />

            <div>
              <div className="text-[9px] md:text-[10px] tracking-[0.14em] text-[#9ba5b4] uppercase">
                {hud.timeChallengeRemaining !== null ? 'Limit' : 'Time'}
              </div>
              <div
                data-testid="hud-time"
                className={`font-mono-num text-sm md:text-lg font-bold leading-tight ${
                  hud.timeChallengeRemaining !== null && hud.timeChallengeRemaining < 10
                    ? 'text-[#ef4444]'
                    : 'text-[#f3f5f8]'
                }`}
              >
                {formatTime(
                  hud.timeChallengeRemaining !== null ? hud.timeChallengeRemaining : hud.elapsedTime
                )}
              </div>
            </div>
          </div>

          <div className="order-2 md:order-none flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={muted ? 'Unmute Audio' : 'Mute Audio'}
              title={muted ? 'Unmute Audio' : 'Mute Audio'}
              onClick={(e) => {
                e.currentTarget.blur();
                onToggleMute();
              }}
              className="w-9 h-9 md:w-10 md:h-10 hud-panel rounded flex items-center justify-center text-[#d7dee8] hover:text-white hover:border-[#e59a3c]/60 transition-colors cursor-pointer"
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
              className="w-9 h-9 md:w-10 md:h-10 hud-panel rounded flex items-center justify-center text-[#d7dee8] hover:text-white hover:border-[#e59a3c]/60 transition-colors cursor-pointer"
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
              className="w-9 h-9 md:w-10 md:h-10 hud-panel rounded flex items-center justify-center text-[#d7dee8] hover:text-white hover:border-[#e59a3c]/60 transition-colors cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom HUD Bar */}
      <div className="flex flex-col items-center gap-1.5 md:gap-2">
        {hud.interactPrompt && !touchControlsActive && (
          <div className="hud-panel rounded px-3.5 py-1.5 text-xs font-display font-semibold tracking-wider text-[#f3f5f8]">
            [{formatKeyLabel(bindings.interact)}] {hud.interactPrompt}
          </div>
        )}
        {!hud.interactPrompt && hud.levelHint && !touchControlsActive && (
          <div className="hidden sm:block hud-panel-subtle rounded px-3.5 py-1 text-xs text-[#cfd6e0]">
            {hud.levelHint}
          </div>
        )}

        <div className="hud-panel rounded w-full max-w-md md:w-auto md:max-w-none px-3 py-1.5 md:px-4 md:py-2 grid grid-cols-4 md:flex items-center gap-2.5 md:gap-4">
          {/* Speed + State */}
          <div className="pr-2 md:pr-3 border-r border-white/10 text-right md:min-w-[78px]">
            <div className="text-[9px] md:text-[10px] tracking-[0.12em] text-[#9ba5b4] uppercase">
              {hud.isSliding ? 'SLIDE' : hud.isSprinting ? 'SPRINT' : 'SPEED'}
            </div>
            <div className="font-mono-num text-xs md:text-sm font-bold text-[#f3f5f8] whitespace-nowrap">
              {Math.round(hud.speed * 3.6)} <span className="text-[9px] md:text-[10px] text-[#9ba5b4]">km/h</span>
            </div>
          </div>

          {/* Super Bounce [Q] */}
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0 md:min-w-[120px]">
            {!touchControlsActive && (
              <div className="hidden sm:block px-1.5 py-0.5 rounded bg-white/10 font-mono-num text-[11px] font-semibold text-[#f5b832]">
                {formatKeyLabel(bindings.bounce)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] md:text-[11px] font-medium text-[#e6e9ef] leading-none mb-1 truncate">
                Bounce
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-[#f5b832] transition-all duration-75"
                  style={{ width: `${Math.round((1 - hud.bounceCooldownRatio) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Road Dash [V] */}
          <div className={`flex items-center gap-1.5 md:gap-2 min-w-0 md:min-w-[120px] ${hud.canDash ? 'opacity-100' : 'opacity-40'}`}>
            {!touchControlsActive && (
              <div className="hidden sm:block px-1.5 py-0.5 rounded bg-white/10 font-mono-num text-[11px] font-semibold text-[#e59a3c]">
                {formatKeyLabel(bindings.dash)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] md:text-[11px] font-medium text-[#e6e9ef] leading-none mb-1 truncate">
                Dash
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

          {/* Special Highway Surge [F] */}
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0 md:min-w-[128px]">
            {!touchControlsActive && (
              <div className="hidden sm:block px-1.5 py-0.5 rounded bg-white/10 font-mono-num text-[11px] font-semibold text-[#58c477]">
                {formatKeyLabel(bindings.special)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[10px] md:text-[11px] font-medium text-[#e6e9ef] leading-none mb-1 truncate">
                {hud.specialActive ? 'Surge: ON' : 'Surge'}
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded overflow-hidden">
                <div
                  className="h-full bg-[#58c477] transition-all duration-75"
                  style={{ width: `${Math.round(hud.specialEnergy * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Sprint / Slide Quick Keys */}
          {!touchControlsActive && (
            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-white/10 text-[10px] font-mono-num text-[#9ba5b4]">
              <span>[{formatKeyLabel(bindings.sprint)}] Sprint</span>
              <span>[{formatKeyLabel(bindings.slide)}] Slide</span>
              {hud.gravityInverted && <span className="text-[#48b8d0] font-bold">INV-G</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
