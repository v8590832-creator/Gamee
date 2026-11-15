import type { RunSummary } from '../game/types';

interface PauseModalProps {
  levelName: string;
  worldName: string;
  onResume: () => void;
  onRestart: () => void;
  onOpenSettings: () => void;
  onMainMenu: () => void;
}

export function PauseModal({
  levelName,
  worldName,
  onResume,
  onRestart,
  onOpenSettings,
  onMainMenu,
}: PauseModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      className="fixed inset-0 z-30 bg-[#0a0d12]/72 flex items-center justify-center p-6"
    >
      <div className="hud-panel rounded-lg w-full max-w-sm p-7">
        <div className="text-xs tracking-[0.18em] text-[#e59a3c] font-semibold uppercase">
          {worldName}
        </div>
        <h2 className="font-display text-3xl font-bold text-[#f3f5f8] mt-1">PAUSED</h2>
        <p className="text-sm text-[#9ba5b4] mt-1">{levelName}</p>

        <div className="mt-6 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-5 bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] font-display font-bold tracking-wider rounded transition-colors cursor-pointer"
          >
            RESUME
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3f5f8] font-display font-semibold tracking-wider rounded transition-colors cursor-pointer"
          >
            RESTART LEVEL
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3f5f8] font-display font-semibold tracking-wider rounded transition-colors cursor-pointer"
          >
            SETTINGS
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
      className="fixed inset-0 z-30 bg-[#0a0d12]/78 flex items-center justify-center p-6"
    >
      <div className="hud-panel rounded-lg w-full max-w-md p-7">
        <div className="flex items-center justify-between">
          <span className="text-xs tracking-[0.18em] text-[#e59a3c] font-semibold uppercase">
            {summary.worldName}
          </span>
          {summary.isNewBest && (
            <span className="text-xs font-display font-semibold text-[#58c477]">
              NEW RECORD
            </span>
          )}
        </div>
        <h2 className="font-display text-3xl font-bold text-[#f3f5f8] mt-1">
          STAGE CLEARED
        </h2>
        <p className="text-sm text-[#9ba5b4] mt-0.5">{summary.levelName}</p>

        {/* Mastery Metrics */}
        <div className="mt-6 grid grid-cols-3 gap-3 border-y border-white/10 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#9ba5b4]">Score</div>
            <div className="font-mono-num text-2xl font-bold text-[#f3f5f8] mt-0.5">
              {Math.round(summary.score)}
            </div>
            <div className="text-[11px] font-mono-num text-[#7f8a99]">
              Best {Math.round(summary.bestScore)}
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#9ba5b4]">Time</div>
            <div className="font-mono-num text-2xl font-bold text-[#f3f5f8] mt-0.5">
              {summary.time.toFixed(1)}s
            </div>
            <div className="text-[11px] font-mono-num text-[#7f8a99]">
              Par {summary.parTime}s
            </div>
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-[#9ba5b4]">Shards</div>
            <div className="font-mono-num text-2xl font-bold text-[#e59a3c] mt-0.5">
              {summary.collectiblesFound}/{summary.collectiblesTotal}
            </div>
            <div className="text-[11px] font-mono-num text-[#7f8a99]">
              Falls {summary.fallsCount}
            </div>
          </div>
        </div>

        {summary.newlyUnlockedAchievements.length > 0 && (
          <div className="mt-4 p-3 bg-white/5 border border-[#48b8d0]/30 rounded">
            <div className="text-[11px] uppercase tracking-wider text-[#48b8d0] font-semibold">
              Unlocked
            </div>
            <ul className="mt-1 space-y-1 text-xs text-[#e6e9ef]">
              {summary.newlyUnlockedAchievements.map((a) => (
                <li key={a.id}>{a.name} — {a.description}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2.5">
          {summary.nextLevelId && (
            <button
              type="button"
              data-start="true"
              onClick={onNextLevel}
              className="w-full py-3.5 px-5 bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] font-display font-bold tracking-wider rounded transition-colors cursor-pointer"
            >
              NEXT STAGE
            </button>
          )}
          <button
            type="button"
            data-start={summary.nextLevelId ? undefined : 'true'}
            onClick={onReplay}
            className="w-full py-2.5 px-5 bg-white/8 hover:bg-white/14 text-[#f3f5f8] font-display font-semibold tracking-wider rounded transition-colors cursor-pointer"
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
