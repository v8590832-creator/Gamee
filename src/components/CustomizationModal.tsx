import { useState } from 'react';
import {
  FOOTWEAR_CATALOG,
  HEADWEAR_CATALOG,
  KURTA_CATALOG,
  TRAIL_CATALOG,
} from '../game/data/catalog';
import type { CharacterLoadout, CosmeticItemDef, SaveData } from '../game/types';

interface CustomizationModalProps {
  saveData: SaveData;
  onUnlockCosmetic: (itemId: string) => void;
  onEquipCosmetic: (category: keyof CharacterLoadout, itemId: string) => void;
  onClose: () => void;
}

const TABS: Array<{ key: keyof CharacterLoadout; label: string }> = [
  { key: 'kurta', label: 'KURTA ATTIRE' },
  { key: 'headwear', label: 'EYEWEAR & HEADGEAR' },
  { key: 'footwear', label: 'FOOTWEAR' },
  { key: 'trail', label: 'BOUNCE TRAIL' },
];

export function CustomizationModal({
  saveData,
  onUnlockCosmetic,
  onEquipCosmetic,
  onClose,
}: CustomizationModalProps) {
  const [tab, setTab] = useState<keyof CharacterLoadout>('kurta');

  const items: CosmeticItemDef[] =
    tab === 'kurta'
      ? Object.values(KURTA_CATALOG)
      : tab === 'headwear'
      ? Object.values(HEADWEAR_CATALOG)
      : tab === 'footwear'
      ? Object.values(FOOTWEAR_CATALOG)
      : Object.values(TRAIL_CATALOG);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Character Customization"
      className="fixed inset-0 z-50 bg-[#0a0d12]/84 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f3efe6] tracking-wide">
              CHARACTER WARDROBE
            </h2>
            <p className="text-xs text-[#9ba5b4] mt-0.5">
              Customize attire, eyewear, footwear, and kinetic bounce trails · Live 3D updates
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right font-mono-num text-xs">
              <div className="text-[#f5b832] font-bold">{saveData.coins} ROAD COINS</div>
              <div className="text-[#48b8d0]">{saveData.blueprintsCollected} BLUEPRINTS</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-display font-semibold tracking-wider text-white cursor-pointer"
            >
              DONE
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap gap-2 bg-white/[0.02]">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-3.5 py-1.5 rounded text-xs font-display font-semibold tracking-wider transition-colors cursor-pointer ${
                tab === t.key
                  ? 'bg-[#e59a3c] text-[#0e1116]'
                  : 'bg-white/5 text-[#b5becb] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Item Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {items.map((item) => {
            const unlocked = saveData.unlockedCosmetics.includes(item.id);
            const equipped = saveData.loadout[tab] === item.id;
            const hasBlueprints =
              !item.requiresBlueprints || saveData.blueprintsCollected >= item.requiresBlueprints;
            const hasCoins = saveData.coins >= item.costCoins;
            const canBuy = !unlocked && hasBlueprints && hasCoins;

            return (
              <div
                key={item.id}
                className={`p-4 rounded border flex items-center justify-between gap-4 ${
                  equipped
                    ? 'bg-[#e59a3c]/12 border-[#e59a3c]/70'
                    : 'bg-white/[0.04] border-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-11 h-11 rounded-md shrink-0 border-2 flex items-center justify-center"
                    style={{
                      backgroundColor: item.primaryColor,
                      borderColor: item.secondaryColor ?? '#d6dde8',
                    }}
                    aria-hidden="true"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: item.secondaryColor ?? '#ffffff' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-display text-base font-semibold text-[#f3f5f8]">
                      {item.name}
                    </div>
                    <div className="text-xs text-[#9ba5b4] mt-0.5">{item.description}</div>
                    {!unlocked && (
                      <div className="text-[11px] font-mono-num text-[#f5b832] mt-1">
                        Unlock: {item.unlockHint}
                      </div>
                    )}
                  </div>
                </div>

                {equipped ? (
                  <span className="px-3.5 py-2 rounded text-xs font-display font-bold tracking-wider bg-[#58c477]/20 text-[#58c477] shrink-0">
                    EQUIPPED
                  </span>
                ) : unlocked ? (
                  <button
                    type="button"
                    onClick={() => onEquipCosmetic(tab, item.id)}
                    className="px-4 py-2 rounded text-xs font-display font-bold tracking-wider bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] shrink-0 cursor-pointer"
                  >
                    EQUIP
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canBuy}
                    onClick={() => {
                      onUnlockCosmetic(item.id);
                      onEquipCosmetic(tab, item.id);
                    }}
                    className={`px-3.5 py-2 rounded text-xs font-display font-bold tracking-wider shrink-0 transition-colors ${
                      canBuy
                        ? 'bg-[#58c477] hover:bg-[#6bd48a] text-[#0e1116] cursor-pointer'
                        : 'bg-white/5 text-[#6b7785] cursor-not-allowed'
                    }`}
                  >
                    {canBuy ? `UNLOCK (${item.costCoins}c)` : 'LOCKED'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
