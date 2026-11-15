import type { RunSummary } from '../game/types';

interface PauseModalProps {
  levelName: string;
  worldName: string;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onOpenWorlds: () => void;
  onMainMenu: () => void;
}

export function PauseModal({
  levelName,
  worldName,
  onResume,
  onRestart,
  onOpenSettings,
  onOpenWorlds,
  onMainMenu,
}: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      className="fixed inset-0 z-30 bg-[#0a0d12]/78 flex items-center justify-center p-6"
    >
      <div className="relative hud-panel rounded-lg w-full max-w-sm p-7 animate-modal-in">
        <span
          aria-hidden="true"
          className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#e59a3c]/60"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-[#e59a3c]/60"
        />
        <div className="text-xs font-mono-num tracking-[0.18em] text-[#e59a3c] font-semibold uppercase">
          {worldName}
        </div>
        <h2 className="font-display text-3xl font-bold text-[#f3efe6] mt-1">PAUSED</h2>
        <p className="text-sm text-[#9ba5b4] mt-1">{levelName}</p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-5 bg-[#e59a3c] hover:bg-[#eda951] active:translate-y-[1px] text-[#0e1116] font-display font-bold tracking-wider rounded transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M6 4l14 8-14 8V4z" />
            </svg>
            <span>RESUME</span>
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3efe6] font-display font-semibold tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#e59a3c]" strokeWidth="2.2" aria-hidden="true">
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span>RESTART LEVEL</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3efe6] font-display font-semibold tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#9ba5b4]" strokeWidth="2" aria-hidden="true">
              <path d="M4 6h16M4 12h16M4 18h16M9 4v4M15 10v4M11 16v4" />
            </svg>
            <span>SETTINGS</span>
          </button>
          <button
            type="button"
            onClick={onOpenWorlds}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3efe6] font-display font-semibold tracking-wider rounded transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#58c477]" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M15.5 8.5l-2.5 6-4.5 1 2.5-6 4.5-1z" />
            </svg>
            <span>WORLD SELECTION</span>
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 px-5 border border-white/15 hover:border-white/35 text-[#b5becb] hover:text-white font-display font-semibold tracking-wider rounded transition-colors cursor-pointer"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}

interface VictoryModalProps {
  summary: RunSummary;
  onNextLevel: () => void;
  onReplay: () => void;
  onMainMenu: () => void;
}

export function VictoryModal({
  summary,
  onNextLevel,
  onReplay,
  onMainMenu,
}: VictoryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Level Complete"
      className="fixed inset-0 z-30 bg-[#0a0d12]/80 flex items-center justify-center p-6"
    >
      <div className="relative hud-panel rounded-lg w-full max-w-md p-7 animate-modal-in">
        <span
          aria-hidden="true"
          className="absolute top-2.5 left-2.5 w-2.5 h-2.5 border-t border-l border-[#e59a3c]/60"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-2.5 right-2.5 w-2.5 h-2.5 border-b border-r border-[#58c477]/60"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono-num tracking-[0.18em] text-[#e59a3c] font-semibold uppercase">
            {summary.worldName}
          </span>
          {summary.isNewBest && (
            <span className="text-xs font-display font-semibold text-[#58c477]">
              NEW RECORD
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <h2 className="font-display text-3xl font-bold text-[#f3efe6]">
            STAGE CLEARED
          </h2>
          <div className="text-2xl tracking-widest" aria-label={`${summary.stars} out of 3 stars`}>
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={s <= summary.stars ? 'text-[#f5b832]' : 'text-white/15'}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-[#9ba5b4] mt-0.5">{summary.levelName}</p>

        {/* Mastery Metrics */}
        <div className="mt-5 grid grid-cols-4 gap-3 border-y border-white/10 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9ba5b4]">Score</div>
            <div className="font-mono-num text-xl font-bold text-[#f3efe6] mt-0.5">
              {Math.round(summary.score)}
            </div>
            <div className="text-[10px] font-mono-num text-[#7f8a99]">
              Best {Math.round(summary.bestScore)}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9ba5b4]">Time</div>
            <div className="font-mono-num text-xl font-bold text-[#f3efe6] mt-0.5">
              {summary.time.toFixed(1)}s
            </div>
            <div className="text-[10px] font-mono-num text-[#7f8a99]">
              Par {summary.parTime}s
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9ba5b4]">Coins</div>
            <div className="font-mono-num text-xl font-bold text-[#f5b832] mt-0.5">
              +{summary.coinsEarned}
            </div>
            <div className="text-[10px] font-mono-num text-[#7f8a99]">Earned</div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#9ba5b4]">Items</div>
            <div className="font-mono-num text-xl font-bold text-[#e59a3c] mt-0.5">
              {summary.collectiblesFound}/{summary.collectiblesTotal}
            </div>
            <div className="text-[10px] font-mono-num text-[#7f8a99]">
              Falls {summary.fallsCount}
            </div>
          </div>
        </div>

        {summary.newlyUnlockedAchievements.length > 0 && (
          <div className="mt-4 p-3 bg-white/5 border border-[#48b8d0]/35 rounded">
            <div className="text-[11px] uppercase tracking-wider text-[#48b8d0] font-semibold">
              Achievements Unlocked
            </div>
            <ul className="mt-1 space-y-1 text-xs text-[#e6e9ef]">
              {summary.newlyUnlockedAchievements.map((a) => (
                <li key={a.id}>
                  {a.name} (+{a.rewardCoins} Coins) — {a.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.newlyCompletedChallenges.length > 0 && (
          <div className="mt-3 p-3 bg-white/5 border border-[#58c477]/35 rounded">
            <div className="text-[11px] uppercase tracking-wider text-[#58c477] font-semibold">
              Challenges Completed
            </div>
            <ul className="mt-1 space-y-1 text-xs text-[#e6e9ef]">
              {summary.newlyCompletedChallenges.map((c) => (
                <li key={c.id}>
                  {c.title} (+{c.rewardCoins} Coins)
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2.5">
          {summary.nextLevelId && (
            <button
              type="button"
              data-start="true"
              onClick={onNextLevel}
              className="w-full py-3.5 px-5 bg-[#e59a3c] hover:bg-[#eda951] active:translate-y-[1px] text-[#0e1116] font-display font-bold tracking-wider rounded transition-all cursor-pointer"
            >
              NEXT STAGE
            </button>
          )}
          <button
            type="button"
            data-start={summary.nextLevelId ? undefined : 'true'}
            onClick={onReplay}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3efe6] font-display font-semibold tracking-wider rounded transition-colors cursor-pointer"
          >
            REPLAY STAGE
          </button>
          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-2.5 px-5 border border-white/15 hover:border-white/35 text-[#b5becb] hover:text-white font-display font-semibold tracking-wider rounded transition-colors cursor-pointer"
          >
            MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
}
