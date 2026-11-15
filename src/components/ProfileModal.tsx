import { useState } from 'react';
import { ACHIEVEMENTS } from '../game/data/catalog';
import type { SaveData } from '../game/types';

interface ProfileModalProps {
  saveData: SaveData;
  onResetProgress: () => void;
  onClose: () => void;
}

export function ProfileModal({
  saveData,
  onResetProgress,
  onClose,
}: ProfileModalProps) {
  const [tab, setTab] = useState<'achievements' | 'leaderboard'>('achievements');
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Achievements and Leaderboard"
      className="fixed inset-0 z-50 bg-[#0a0d12]/84 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded">
            <button
              type="button"
              onClick={() => setTab('achievements')}
              className={`px-3.5 py-1.5 rounded text-xs font-display font-semibold tracking-wider transition-colors cursor-pointer ${
                tab === 'achievements'
                  ? 'bg-[#e59a3c] text-[#0e1116]'
                  : 'text-[#b5becb] hover:text-white'
              }`}
            >
              ACHIEVEMENTS ({saveData.unlockedAchievements.length}/{ACHIEVEMENTS.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('leaderboard')}
              className={`px-3.5 py-1.5 rounded text-xs font-display font-semibold tracking-wider transition-colors cursor-pointer ${
                tab === 'leaderboard'
                  ? 'bg-[#e59a3c] text-[#0e1116]'
                  : 'text-[#b5becb] hover:text-white'
              }`}
            >
              LEADERBOARD
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white/8 hover:bg-white/16 text-xs font-display font-semibold tracking-wider text-white cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = saveData.unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded border ${
                      unlocked
                        ? 'bg-white/[0.05] border-[#e59a3c]/50'
                        : 'bg-white/[0.02] border-white/10 opacity-65'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display text-sm font-bold text-[#f3f5f8]">
                        {ach.name}
                      </span>
                      <span
                        className={`text-[11px] font-mono-num font-semibold ${
                          unlocked ? 'text-[#58c477]' : 'text-[#8f9aa8]'
                        }`}
                      >
                        {unlocked ? 'UNLOCKED' : 'LOCKED'}
                      </span>
                    </div>
                    <p className="text-xs text-[#9ba5b4] mt-1">{ach.description}</p>
                    <p className="text-[11px] font-mono-num text-[#f5b832] mt-1.5">
                      Reward: +{ach.rewardCoins} Road Coins
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div>
              {saveData.leaderboard.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#9ba5b4]">
                  No completed stage runs recorded yet. Clear any stage to log your score, stars, and clear time.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#9ba5b4]">
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Stage</th>
                      <th className="py-2 pr-4 text-center">Stars</th>
                      <th className="py-2 pr-4 text-right">Score</th>
                      <th className="py-2 pr-4 text-right">Time</th>
                      <th className="py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {saveData.leaderboard.map((entry, idx) => (
                      <tr key={`${entry.levelId}-${entry.dateIso}-${idx}`}>
                        <td className="py-2.5 pr-4 font-mono-num text-[#9ba5b4]">{idx + 1}</td>
                        <td className="py-2.5 pr-4 font-medium text-[#f3f5f8]">
                          {entry.levelName}{' '}
                          <span className="text-xs font-mono-num text-[#8f9aa8] uppercase">
                            ({entry.levelId})
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 text-center text-xs text-[#f5b832]">
                          {'★'.repeat(entry.stars ?? 1)}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono-num font-semibold text-[#e59a3c]">
                          {entry.score}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-mono-num text-[#d7dee8]">
                          {entry.time.toFixed(2)}s
                        </td>
                        <td className="py-2.5 text-right font-mono-num text-xs text-[#8f9aa8]">
                          {entry.dateIso.slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Career Telemetry Footer + Safe Reset */}
        <div className="px-6 py-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#9ba5b4]">
          <div className="font-mono-num">
            Coins: {saveData.coins} · Blueprints: {saveData.blueprintsCollected} · Helmets:{' '}
            {saveData.helmetsCollected} · Signs: {saveData.signsCollected} · Bounces:{' '}
            {saveData.totalBounces} · Bosses: {saveData.bossesCleared}
          </div>
          <div>
            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="text-[#9ba5b4] hover:text-[#e06d53] cursor-pointer"
              >
                Reset Save Data
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[#e06d53]">Confirm reset?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 bg-[#e06d53] text-white rounded font-semibold cursor-pointer"
                >
                  Yes, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 bg-white/10 text-white rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
