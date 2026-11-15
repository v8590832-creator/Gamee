import type { SaveData } from '../game/types';

interface TitleScreenProps {
  saveData: SaveData;
  hasContinue: boolean;
  quitNotice: boolean;
  onPlay: () => void;
  onContinue: () => void;
  onOpenWorlds: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
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
  onOpenSettings,
  onOpenProfile,
  onQuit,
  onDismissQuitNotice,
}: TitleScreenProps) {
  return (
    <div className="fixed inset-0 z-20 pointer-events-none flex flex-col justify-between">
      {/* Asymmetric Left-Third Architectural Scrim preserving live 3D World 01 vista on the right */}
      <div className="absolute inset-y-0 left-0 w-full md:w-[560px] bg-gradient-to-r from-[#0d1117]/95 via-[#0d1117]/78 to-transparent pointer-events-none" />

      <div className="relative z-10 flex-1 flex items-center px-8 md:px-16">
        <div className="relative w-full max-w-[392px] pointer-events-auto">
          {/* Architectural drafting corner registration ticks */}
          <span aria-hidden="true" className="absolute -top-4 -left-4 w-3 h-3 border-t-2 border-l-2 border-[#e59a3c]/50" />
          <span aria-hidden="true" className="absolute -bottom-4 -right-4 w-3 h-3 border-b-2 border-r-2 border-[#e59a3c]/35" />

          {/* Bespoke SVG Title Emblem */}
          <div className="flex items-center gap-4 mb-5">
            <svg
              viewBox="0 0 64 64"
              className="w-15 h-15 shrink-0"
              aria-hidden="true"
            >
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="#12161d"
                stroke="#e59a3c"
                strokeWidth="2.2"
              />
              <circle
                cx="32"
                cy="32"
                r="24"
                fill="none"
                stroke="#434d5b"
                strokeWidth="1"
              />
              <path
                d="M11 40 Q23 14 35 30 T53 18"
                fill="none"
                stroke="#e59a3c"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle cx="32" cy="30" r="8.2" fill="#e59a3c" />
              <circle cx="30" cy="28" r="3" fill="#fff0d4" opacity="0.7" />
              <circle
                cx="32"
                cy="30"
                r="14"
                fill="none"
                stroke="#e6e9ef"
                strokeWidth="1.4"
                strokeDasharray="4 4"
                className="animate-slow-orbit"
              />
            </svg>
            <div>
              <div className="text-[10px] font-mono-num tracking-[0.26em] text-[#9ba5b4] uppercase mb-1">
                KINETIC FOUNDRY · EDITION IV
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold tracking-wider text-[#f3f5f8] leading-none">
                BOUNCEBACK
              </h1>
              <p className="mt-1.5 text-xs tracking-[0.22em] text-[#e59a3c] font-semibold">
                FALL · ADAPT · BOUNCE BACK
              </p>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-[#e59a3c]/45 via-white/15 to-transparent mb-6" aria-hidden="true" />

          {/* Primary Menu Action Stack */}
          <nav aria-label="Main Menu" className="flex flex-col gap-2.5">
            <button
              type="button"
              data-start="true"
              onClick={onPlay}
              className="w-full py-3.5 px-6 bg-[#e59a3c] hover:bg-[#eda951] active:translate-y-[1px] text-[#0e1116] font-display font-bold text-base tracking-wider text-left flex items-center justify-between rounded shadow-[inset_0_1px_0_rgba(255,244,224,0.45)] transition-colors cursor-pointer"
            >
              <span>PLAY</span>
              <span className="text-xs font-mono-num opacity-80">ENTER</span>
            </button>

            {hasContinue && (
              <button
                type="button"
                onClick={onContinue}
                className="w-full py-3 px-6 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-sm tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
              >
                <span>CONTINUE</span>
                <span className="text-xs font-mono-num text-[#9ba5b4] uppercase">
                  {saveData.lastPlayedLevelId}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenWorlds}
              className="w-full py-3 px-6 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-sm tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
            >
              <span>WORLD SELECTION</span>
              <span className="text-xs font-mono-num text-[#9ba5b4]">10 WORLDS</span>
            </button>

            <button
              type="button"
              onClick={onOpenProfile}
              className="w-full py-3 px-6 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-sm tracking-wider text-left flex items-center justify-between rounded transition-colors cursor-pointer"
            >
              <span>ACHIEVEMENTS &amp; SKINS</span>
              <span className="text-xs font-mono-num text-[#9ba5b4]">
                {saveData.unlockedAchievements.length}/10
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="w-full py-3 px-6 hud-panel hover:border-[#e59a3c]/60 text-[#eef1f6] font-display font-semibold text-sm tracking-wider text-left rounded transition-colors cursor-pointer"
            >
              SETTINGS
            </button>

            <button
              type="button"
              onClick={onQuit}
              className="w-full py-2.5 px-6 bg-transparent border border-white/10 hover:border-white/30 text-[#9ba5b4] hover:text-[#eef1f6] font-display font-medium text-sm tracking-wider text-left rounded transition-colors cursor-pointer"
            >
              QUIT
            </button>
          </nav>

          {quitNotice && (
            <div className="mt-4 p-3.5 hud-panel rounded text-xs text-[#cfd6e0] flex items-center justify-between gap-3">
              <span>Progress saved locally. You may safely close this tab.</span>
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

      {/* Flat single-line bottom control hint */}
      <div className="relative z-10 px-8 md:px-16 pb-5 flex items-center justify-between text-xs text-[#9aa5b5] hud-text-shadow">
        <p className="truncate">
          WASD Move · Space Jump · Shift Bounce Dash · Q Gravity Shift · T Time Control · E Interact · Mouse Orbit · Esc Pause
        </p>
      </div>
    </div>
  );
}
