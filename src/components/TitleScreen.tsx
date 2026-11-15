import { ACHIEVEMENTS, CHALLENGES } from '../game/data/catalog';
import type { SaveData } from '../game/types';

interface TitleScreenProps {
  saveData: SaveData;
  hasContinue: boolean;
  quitNotice: boolean;
  onPlay: () => void;
  onContinue: () => void;
  onOpenWorlds: () => void;
  onOpenCustomization: () => void;
  onOpenChallenges: () => void;
  onOpenAchievements: () => void;
  onOpenSettings: () => void;
  onOpenCredits: () => void;
  onQuit: () => void;
  onDismissQuitNotice: () => void;
}

export function TitleScreen({
  saveData,
  hasContinue,
  quitNotice,
  onPlay,
  onContinue,
  onOpenWorlds,
  onOpenCustomization,
  onOpenChallenges,
  onOpenAchievements,
  onOpenSettings,
  onOpenCredits,
  onQuit,
  onDismissQuitNotice,
}: TitleScreenProps) {
  const totalStars = Object.values(saveData.levelProgress).reduce(
    (sum, p) => sum + (p.stars ?? 0),
    0
  );

  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Asymmetric Left-Side Scrim preserving live 3D Nitin Gadkari character & roadworks vista on the right */}
      <div className="absolute inset-y-0 left-0 w-full md:w-[600px] bg-gradient-to-r from-[#0d1117]/95 via-[#0d1117]/80 to-transparent pointer-events-none" />

      <div className="relative z-10 flex-1 flex items-center px-6 md:px-14">
        <div className="relative w-full max-w-[440px] pointer-events-auto">
          <span aria-hidden="true" className="absolute -top-3.5 -left-3.5 w-3 h-3 border-t-2 border-l-2 border-[#e59a3c]/55" />
          <span aria-hidden="true" className="absolute -bottom-3.5 -right-3.5 w-3 h-3 border-b-2 border-r-2 border-[#58c477]/45" />

          {/* Title Emblem & Highway Signpost Header */}
          <div className="flex items-center gap-4 mb-4">
            <svg viewBox="0 0 64 64" className="w-14 h-14 shrink-0" aria-hidden="true">
              <circle cx="32" cy="32" r="28" fill="#12161d" stroke="#e59a3c" strokeWidth="2.4" />
              <path d="M12 48 L26 16 M52 48 L38 16" stroke="#8a96a6" strokeWidth="3" strokeLinecap="round" />
              <line x1="32" y1="20" x2="32" y2="47" stroke="#f5b832" strokeWidth="2.5" strokeDasharray="4 4" />
              <path
                d="M14 38 Q26 12 36 28 T52 17"
                fill="none"
                stroke="#58c477"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle cx="32" cy="27" r="6" fill="#e59a3c" />
            </svg>
            <div>
              <div className="text-[10px] font-mono-num tracking-[0.2em] text-[#58c477] uppercase mb-1 whitespace-nowrap">
                10 WORLDS · 50 STAGES · {saveData.coins} COINS · ★ {totalStars}/150
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wider text-[#f3f5f8] leading-none">
                BOUNCEBACK
              </h1>
              <div className="font-display text-sm md:text-base font-semibold tracking-[0.18em] text-[#f5b832] mt-1">
                THE GREAT ROAD ADVENTURE
              </div>
              <p className="mt-1 text-[11px] tracking-[0.18em] text-[#cfd6e0] font-medium">
                ONE MAN. COUNTLESS ROADS. UNLIMITED BOUNCES.
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-[#e59a3c]/50 via-white/15 to-transparent mb-4" aria-hidden="true" />

          {/* Main Menu Navigation */}
          <nav aria-label="Main Menu" className="flex flex-col gap-2">
            <button
              type="button"
              data-start="true"
              onClick={onPlay}
              className="w-full py-3 px-5 bg-[#e59a3c] hover:bg-[#eda951] active:translate-y-[1px] text-[#0e1116] font-display font-bold text-base tracking-wider text-left flex items-center justify-between rounded shadow-[inset_0_1px_0_rgba(255,244,224,0.45)] transition-colors cursor-pointer"
            >
              <span>PLAY</span>
              <span className="text-xs font-mono-num opacity-85">START · ENTER</span>
            </button>

            {hasContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-2.5 px-5 hud-panel hover:border-[#e59a3c]/70 text-[#eef1f6] font-display font-semibold text-sm tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span>CONTINUE</span>
                <span className="text-xs font-mono-num text-[#e59a3c] uppercase">
                  {saveData.lastPlayedLevelId}
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenWorlds}
                className="py-2.5 px-4 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span>WORLD SELECT</span>
                <span className="text-[11px] font-mono-num text-[#9ba5b4]">50</span>
              </button>

              <button
                type="button"
                onClick={onOpenCustomization}
                className="py-2.5 px-4 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span>CUSTOMIZATION</span>
                <span className="text-[11px] font-mono-num text-[#f5b832]">{saveData.coins}c</span>
              </button>

              <button
                type="button"
                onClick={onOpenChallenges}
                className="py-2.5 px-4 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span>CHALLENGES</span>
                <span className="text-[11px] font-mono-num text-[#9ba5b4]">
                  {saveData.completedChallenges.length}/{CHALLENGES.length}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenAchievements}
                className="py-2.5 px-4 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span>ACHIEVEMENTS</span>
                <span className="text-[11px] font-mono-num text-[#9ba5b4]">
                  {saveData.unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="py-2.5 px-4 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left rounded transition-colors cursor-pointer"
              >
                SETTINGS
              </button>

              <button
                type="button"
                onClick={onOpenCredits}
                className="py-2.5 px-4 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left rounded transition-colors cursor-pointer"
              >
                CREDITS
              </button>
            </div>

            <button
              type="button"
              onClick={onQuit}
              className="w-full py-2 px-5 bg-transparent border border-white/12 hover:border-white/35 text-[#9ba5b4] hover:text-[#eef1f6] font-display font-medium text-xs tracking-wider text-left rounded transition-colors cursor-pointer"
            >
              QUIT
            </button>
          </nav>

          {quitNotice && (
            <div className="mt-3 p-3 hud-panel rounded text-xs text-[#cfd6e0] flex items-center justify-between gap-3">
              <span>Road progress saved locally. You may safely close this window.</span>
              <button
                type="button"
                onClick={onDismissQuitNotice}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded text-white font-medium shrink-0 cursor-pointer"
              >
                OK
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls Strip + Respectful Arcade Notice */}
      <div className="relative z-10 px-6 md:px-14 pb-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#9aa5b5] hud-text-shadow">
        <p className="truncate">
          WASD Move · Space Jump / Double Jump · Shift Sprint · Ctrl Slide · Q Super Bounce · V Road Dash · F Highway Surge · E Interact · Mouse Orbit
        </p>
        <p className="text-[#7c8798] shrink-0">Fictional arcade parody adventure · No official affiliation</p>
      </div>
    </div>
  );
}
