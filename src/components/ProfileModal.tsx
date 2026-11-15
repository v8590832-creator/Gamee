import { useState } from 'react';
import { ACHIEVEMENTS, ORB_SKINS } from '../game/data/catalog';
import type { OrbSkinId, SaveData } from '../game/types';

interface ProfileModalProps {
  saveData: SaveData;
  onEquipSkin: (skinId: OrbSkinId) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export function ProfileModal({
  saveData,
  onEquipSkin,
  onResetProgress,
  onClose,
}: ProfileModalProps) {
  const [tab, setTab] = useState<'skins' | 'achievements' | 'leaderboard'>('skins');
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Achievements, Orb Skins and Leaderboard"
      className="fixed inset-0 z-50 bg-[#0a0d12]/84 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded">
            <button
              type="button"
              onClick={() => setTab('skins')}
              className={`px-3.5 py-1.5 rounded text-xs font-display font-semibold tracking-wider transition-colors cursor-pointer ${
                tab === 'skins' ? 'bg-[#e59a3c] text-[#0e1116]' : 'text-[#b5becb] hover:text-white'
              }`}
            >
              ORB SKINS ({saveData.unlockedSkins.length}/5)
            </button>
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
          {tab === 'skins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {Object.values(ORB_SKINS).map((skin) => {
                const unlocked = saveData.unlockedSkins.includes(skin.id);
                const equipped = saveData.equippedSkin === skin.id;
                return (
                  <div
                    key={skin.id}
                    className={`p-4 rounded border flex items-center justify-between gap-4 ${
                      equipped
                        ? 'bg-[#e59a3c]/12 border-[#e59a3c]/70'
                        : 'bg-white/[0.04] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Dual-tone skin swatch */}
                      <div
                        className="w-11 h-11 rounded-full shrink-0 border-2 flex items-center justify-center"
                        style={{
                          backgroundColor: skin.shellColor,
                          borderColor: skin.ringColor,
                        }}
                      >
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: skin.coreColor }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="font-display text-base font-semibold text-[#f3f5f8]">
                          {skin.name}
                        </div>
                        <div className="text-xs text-[#9ba5b4] mt-0.5">{skin.description}</div>
                        {!unlocked && (
                          <div className="text-[11px] text-[#e59a3c] mt-1">
                            Unlock: {skin.unlockRequirement}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={!unlocked || equipped}
                      onClick={() => onEquipSkin(skin.id)}
                      className={`px-3.5 py-2 rounded text-xs font-display font-bold tracking-wider shrink-0 transition-colors ${
                        equipped
                          ? 'bg-[#58c477]/20 text-[#58c477] cursor-default'
                          : unlocked
                          ? 'bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] cursor-pointer'
                          : 'bg-white/5 text-[#6b7785] cursor-not-allowed'
                      }`}
                    >
                      {equipped ? 'EQUIPPED' : unlocked ? 'EQUIP' : 'LOCKED'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((ach) => {
                const unlocked = saveData.unlockedAchievements.includes(ach.id);
                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded border ${
                      unlocked
                        ? 'bg-white/[0.05] border-[#e59a3c]/45'
                        : 'bg-white/[0.02] border-white/10 opacity-60'
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
                    {ach.rewardSkin && (
                      <p className="text-[11px] text-[#e59a3c] mt-1">
                        Reward: {ORB_SKINS[ach.rewardSkin].name} Skin
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div>
              {saveData.leaderboard.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#9ba5b4]">
                  No completed stage runs recorded yet. Complete any stage to record your score and clear time.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#9ba5b4]">
                      <th className="py-2 pr-4">#</th>
                      <th className="py-2 pr-4">Stage</th>
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

        {/* Footer stats + safe reset */}
        <div className="px-6 py-3 border-t border-white/10 flex items-center justify-between text-xs text-[#9ba5b4]">
          <div className="font-mono-num">
            Bounces: {saveData.totalBounces} · Portal Transits: {saveData.totalPortalJumps}
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
