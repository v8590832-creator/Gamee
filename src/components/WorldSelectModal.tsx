import { getLevelsForWorld } from '../game/data/levels';
import { WORLD_LIST } from '../game/data/worlds';
import type { SaveData, WorldId } from '../game/types';

interface WorldSelectModalProps {
  saveData: SaveData;
  selectedWorld: WorldId;
  onSelectWorld: (id: WorldId) => void;
  onToggleShowcaseUnlock: (enabled: boolean) => void;
  onPlayLevel: (levelId: string) => void;
  onClose: () => void;
}

export function WorldSelectModal({
  saveData,
  selectedWorld,
  onSelectWorld,
  onToggleShowcaseUnlock,
  onPlayLevel,
  onClose,
}: WorldSelectModalProps) {
  const activeWorld = WORLD_LIST.find((w) => w.id === selectedWorld) ?? WORLD_LIST[0];
  const levels = getLevelsForWorld(activeWorld.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="World Selection"
      className="fixed inset-0 z-40 bg-[#0a0d12]/82 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f3f5f8] tracking-wide">
              WORLD SELECTION
            </h2>
            <p className="text-xs text-[#9ba5b4] mt-0.5">
              10 handcrafted environments · {saveData.unlockAllShowcase ? 'Showcase Access Active' : 'Progression Unlocks Active'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleShowcaseUnlock(!saveData.unlockAllShowcase)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                saveData.unlockAllShowcase
                  ? 'bg-[#e59a3c]/20 border-[#e59a3c] text-[#e59a3c]'
                  : 'bg-white/5 border-white/15 text-[#b5becb] hover:text-white'
              }`}
            >
              {saveData.unlockAllShowcase ? 'Showcase: All Unlocked' : 'Unlock All Worlds'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-white/8 hover:bg-white/16 text-xs font-display font-semibold tracking-wider text-white cursor-pointer"
            >
              CLOSE
            </button>
          </div>
        </div>

        {/* Body: Left World Index + Right World & Levels Detail */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-white/10 overflow-y-auto p-3 space-y-1">
            {WORLD_LIST.map((w) => {
              const wLevels = getLevelsForWorld(w.id);
              const anyUnlocked =
                saveData.unlockAllShowcase ||
                wLevels.some((l) => saveData.unlockedLevelIds.includes(l.id));
              const completedCount = wLevels.filter(
                (l) => saveData.levelProgress[l.id]?.completed
              ).length;
              const isSelected = w.id === selectedWorld;

              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => onSelectWorld(w.id)}
                  className={`w-full px-3.5 py-2.5 rounded text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#e59a3c]/16 border border-[#e59a3c]/60 text-[#f3f5f8]'
                      : 'hover:bg-white/6 border border-transparent text-[#b5becb]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-mono-num tracking-wider text-[#9ba5b4]">
                      WORLD {String(w.id).padStart(2, '0')}
                    </div>
                    <div className="font-display text-sm font-semibold truncate">{w.name}</div>
                  </div>
                  <div className="text-[11px] font-mono-num shrink-0 text-[#9ba5b4]">
                    {anyUnlocked ? `${completedCount}/${wLevels.length}` : 'LOCKED'}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-8 p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="w-3 h-3 rounded-sm shrink-0"
                  style={{ backgroundColor: activeWorld.accentColor }}
                  aria-hidden="true"
                />
                <span className="text-xs font-mono-num tracking-widest text-[#9ba5b4] uppercase">
                  World {String(activeWorld.id).padStart(2, '0')} · {activeWorld.subtitle}
                </span>
              </div>
              <h3 className="font-display text-3xl font-bold text-[#f3f5f8] mt-1">
                {activeWorld.name}
              </h3>
              <p className="text-sm text-[#b5becb] mt-2 max-w-2xl leading-relaxed">
                {activeWorld.description}
              </p>

              {/* Level List */}
              <div className="mt-6 space-y-2.5">
                {levels.map((lvl) => {
                  const unlocked =
                    saveData.unlockAllShowcase ||
                    saveData.unlockedLevelIds.includes(lvl.id);
                  const prog = saveData.levelProgress[lvl.id];

                  return (
                    <div
                      key={lvl.id}
                      className={`p-4 rounded border transition-colors flex items-center justify-between gap-4 ${
                        unlocked
                          ? 'bg-white/[0.04] border-white/10'
                          : 'bg-white/[0.015] border-white/5 opacity-55'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs text-[#9ba5b4]">
                          <span className="font-mono-num text-[#e59a3c]">
                            STAGE {lvl.worldId}-{lvl.levelNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{lvl.subtitle}</span>
                          {prog?.completed && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#58c477] font-medium">Cleared</span>
                            </>
                          )}
                        </div>
                        <div className="font-display text-lg font-semibold text-[#f3f5f8] mt-0.5">
                          {lvl.name}
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs font-mono-num text-[#8f9aa8]">
                          <span>Best Score: {prog ? prog.bestScore : '—'}</span>
                          <span>
                            Best Time: {prog?.bestTime != null ? `${prog.bestTime.toFixed(1)}s` : '—'}
                          </span>
                          <span>
                            Shards: {prog ? prog.collectedIds.length : 0}/{lvl.collectibles.length}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={!unlocked}
                        onClick={() => onPlayLevel(lvl.id)}
                        className={`px-5 py-2.5 rounded font-display font-bold text-xs tracking-wider shrink-0 transition-colors ${
                          unlocked
                            ? 'bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] cursor-pointer'
                            : 'bg-white/5 text-[#6b7785] cursor-not-allowed'
                        }`}
                      >
                        {unlocked ? 'LAUNCH' : 'LOCKED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
