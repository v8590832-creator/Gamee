import { CHALLENGES } from '../game/data/catalog';
import type { SaveData } from '../game/types';

interface ChallengesModalProps {
  saveData: SaveData;
  onClose: () => void;
}

export function ChallengesModal({ saveData, onClose }: ChallengesModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Road Challenges"
      className="fixed inset-0 z-50 bg-[#0a0d12]/84 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-modal-in">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f3efe6] tracking-wide">
              HIGHWAY CHALLENGES
            </h2>
            <p className="text-xs text-[#9ba5b4] mt-0.5">
              {saveData.completedChallenges.length} of {CHALLENGES.length} completed · Earn bonus Road Coins for mastery feats
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-display font-semibold tracking-wider text-white cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {CHALLENGES.map((ch) => {
            const done = saveData.completedChallenges.includes(ch.id);
            const prog = Math.min(ch.targetCount, saveData.challengeProgress[ch.id] ?? (done ? ch.targetCount : 0));
            const pct = Math.round((prog / ch.targetCount) * 100);

            return (
              <div
                key={ch.id}
                className={`p-4 rounded border ${
                  done
                    ? 'bg-[#58c477]/10 border-[#58c477]/50'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-[#f3f5f8]">
                    {ch.title}
                  </span>
                  <span
                    className={`text-[11px] font-mono-num font-semibold ${
                      done ? 'text-[#58c477]' : 'text-[#f5b832]'
                    }`}
                  >
                    {done ? 'COMPLETED' : `+${ch.rewardCoins} COINS`}
                  </span>
                </div>
                <p className="text-xs text-[#9ba5b4] mt-1">{ch.description}</p>
                <div className="mt-2.5 flex items-center gap-2.5">
                  <div className="flex-1 h-1.5 bg-white/10 rounded overflow-hidden">
                    <div
                      className={`h-full ${done ? 'bg-[#58c477]' : 'bg-[#e59a3c]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono-num text-[#cfd6e0]">
                    {prog}/{ch.targetCount}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
