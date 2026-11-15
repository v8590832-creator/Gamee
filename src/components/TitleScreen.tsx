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
      {/* Asymmetric Left-Side Scrim preserving live 3D protagonist & roadworks vista on the right */}
      <div className="absolute inset-y-0 left-0 w-full md:w-[610px] bg-gradient-to-r from-[#0d1117]/95 via-[#0d1117]/82 to-transparent pointer-events-none" />

      <div className="relative z-10 flex-1 flex items-center px-6 md:px-14">
        <div className="relative w-full max-w-[448px] pointer-events-auto">
          <span
            aria-hidden="true"
            className="absolute -top-3.5 -left-3.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[#e59a3c]/60"
          />
          <span
            aria-hidden="true"
            className="absolute -bottom-3.5 -right-3.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[#58c477]/50"
          />

          {/* Title Emblem & Indian Highway Milestone Header */}
          <div className="flex items-center gap-3.5 sm:gap-4 mb-4">
            <svg viewBox="0 0 64 64" className="w-13 h-13 sm:w-15 sm:h-15 shrink-0" aria-hidden="true">
              <path
                d="M12 52 L12 24 C12 12 52 12 52 24 L52 52 Z"
                fill="#141922"
                stroke="#e59a3c"
                strokeWidth="2.2"
              />
              <path d="M12 26 H52" stroke="#e59a3c" strokeWidth="1.6" strokeOpacity="0.65" />
              <path d="M18 50 L27 28 M46 50 L37 28" stroke="#8a96a6" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="32" y1="30" x2="32" y2="49" stroke="#f5b832" strokeWidth="2.2" strokeDasharray="3.5 3.5" />
              <path
                d="M17 42 Q27 20 35 33 T48 23"
                fill="none"
                stroke="#58c477"
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <circle cx="32" cy="19" r="3.4" fill="#f5b832" />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-mono-num tracking-[0.14em] sm:tracking-[0.2em] text-[#58c477] uppercase mb-1">
                10 WORLDS · 50 STAGES · {saveData.coins} COINS · ★ {totalStars}/150
              </div>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider text-[#f3efe6] leading-none">
                BOUNCEBACK
              </h1>
              <div className="font-display text-xs sm:text-sm md:text-base font-semibold tracking-[0.14em] sm:tracking-[0.18em] text-[#f5b832] mt-1">
                THE GREAT ROAD ADVENTURE
              </div>
              <p className="mt-1 text-[10px] sm:text-[11px] tracking-[0.1em] sm:tracking-[0.16em] text-[#cfd6e0] font-medium">
                ONE MAN. COUNTLESS ROADS. UNLIMITED BOUNCES.
              </p>
            </div>
          </div>

          <div
            className="h-px w-full bg-gradient-to-r from-[#e59a3c]/55 via-white/15 to-transparent mb-4"
            aria-hidden="true"
          />

          {/* Main Menu Navigation */}
          <nav aria-label="Main Menu" className="flex flex-col gap-2">
            <button
              type="button"
              data-start="true"
              onClick={onPlay}
              className="w-full py-3 px-5 bg-[#e59a3c] hover:bg-[#eda951] active:translate-y-[1px] text-[#0e1116] font-display font-bold text-base tracking-wider text-left flex items-center justify-between rounded shadow-[inset_0_1px_0_rgba(255,244,224,0.45),0_4px_14px_rgba(0,0,0,0.35)] transition-all cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
                  <path d="M6 4l14 8-14 8V4z" />
                </svg>
                <span>PLAY</span>
              </span>
              <span className="text-xs font-mono-num opacity-85">START · ENTER</span>
            </button>

            {hasContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-2.5 px-5 hud-panel hover:border-[#e59a3c]/70 text-[#eef1f6] font-display font-semibold text-sm tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2.5">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#e59a3c]" strokeWidth="2.2" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  <span>CONTINUE</span>
                </span>
                <span className="text-xs font-mono-num text-[#e59a3c] uppercase">
                  {saveData.lastPlayedLevelId}
                </span>
              </button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onOpenWorlds}
                className="py-2.5 px-3.5 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between gap-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#e59a3c] shrink-0" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M15.5 8.5l-2.5 6-4.5 1 2.5-6 4.5-1z" />
                  </svg>
                  <span className="truncate">WORLD SELECT</span>
                </span>
                <span className="text-[11px] font-mono-num text-[#9ba5b4] shrink-0">50</span>
              </button>

              <button
                type="button"
                onClick={onOpenCustomization}
                className="py-2.5 px-3.5 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between gap-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#f5b832] shrink-0" strokeWidth="2" aria-hidden="true">
                    <path d="M16 3l4 3-2 4h-2v11H8V10H6L4 6l4-3a4 4 0 0 0 8 0z" />
                  </svg>
                  <span className="truncate">WARDROBE</span>
                </span>
                <span className="text-[11px] font-mono-num text-[#f5b832] shrink-0">{saveData.coins}c</span>
              </button>

              <button
                type="button"
                onClick={onOpenChallenges}
                className="py-2.5 px-3.5 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between gap-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#58c477] shrink-0" strokeWidth="2" aria-hidden="true">
                    <path d="M5 3v18M5 4h12l-2 4 2 4H5" />
                  </svg>
                  <span className="truncate">CHALLENGES</span>
                </span>
                <span className="text-[11px] font-mono-num text-[#9ba5b4] shrink-0">
                  {saveData.completedChallenges.length}/{CHALLENGES.length}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenAchievements}
                className="py-2.5 px-3.5 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center justify-between gap-2 rounded transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#48b8d0] shrink-0" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="9" r="6" />
                    <path d="M8.5 14.5L7 22l5-2.5L17 22l-1.5-7.5" />
                  </svg>
                  <span className="truncate">ACHIEVEMENTS</span>
                </span>
                <span className="text-[11px] font-mono-num text-[#9ba5b4] shrink-0">
                  {saveData.unlockedAchievements.length}/{ACHIEVEMENTS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenSettings}
                className="py-2.5 px-3.5 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center gap-2 rounded transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#9ba5b4] shrink-0" strokeWidth="2" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16M9 4v4M15 10v4M11 16v4" />
                </svg>
                <span>SETTINGS</span>
              </button>

              <button
                type="button"
                onClick={onOpenCredits}
                className="py-2.5 px-3.5 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-xs tracking-wider text-left flex items-center gap-2 rounded transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-[#9ba5b4] shrink-0" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>
                <span>CREDITS</span>
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
            <div className="mt-3 p-3 hud-panel rounded text-xs text-[#cfd6e0] flex items-center justify-between gap-3 animate-toast-in">
              <span>Progress saved in this browser&apos;s local storage. You may safely close this tab.</span>
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
      <div className="relative z-10 px-6 md:px-14 pb-4 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-[#9aa5b5] hud-text-shadow">
        <p className="hidden sm:block truncate">
          WASD Move · Space Jump / Double Jump · Shift Sprint · Ctrl Slide · Q Super Bounce · V Road Dash · F Highway Surge · E Interact · Mouse Orbit
        </p>
        <p className="sm:hidden">
          On-screen Touch Controls on Mobile · Keyboard &amp; Mouse on Desktop
        </p>
        <p className="text-[#7c8798] shrink-0">Fictional arcade parody adventure · No official affiliation</p>
      </div>
    </div>
  );
}
