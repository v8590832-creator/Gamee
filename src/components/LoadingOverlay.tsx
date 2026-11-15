interface LoadingOverlayProps {
  worldNumber: number;
  worldName: string;
  levelNumber: number;
  levelName: string;
  subtitle: string;
  accentColor: string;
}

export function LoadingOverlay({
  worldNumber,
  worldName,
  levelNumber,
  levelName,
  subtitle,
  accentColor,
}: LoadingOverlayProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-[#0d1117]/95 flex items-center justify-center p-6 pointer-events-auto"
    >
      <div className="relative hud-panel rounded-lg w-full max-w-md p-6 animate-modal-in">
        <span
          aria-hidden="true"
          className="absolute top-2 left-2 w-2.5 h-2.5 border-t border-l border-[#e59a3c]/60"
        />
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 w-2.5 h-2.5 border-t border-r border-[#e59a3c]/60"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b border-l border-[#e59a3c]/60"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b border-r border-[#e59a3c]/60"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: accentColor }}
              aria-hidden="true"
            />
            <span className="text-[11px] font-mono-num tracking-[0.2em] text-[#e59a3c] uppercase">
              NH-{String(worldNumber).padStart(2, '0')} · STAGE {worldNumber}-{levelNumber}
            </span>
          </div>
          <span className="text-[10px] font-mono-num tracking-widest text-[#58c477] uppercase">
            DISPATCHING
          </span>
        </div>

        <div className="mt-2 font-display text-2xl font-bold text-[#f3efe6] tracking-wide">
          {levelName}
        </div>
        <div className="text-xs text-[#9ba5b4] mt-0.5">
          {worldName} — {subtitle}
        </div>

        <div className="mt-5 h-1.5 w-full bg-white/10 rounded overflow-hidden">
          <div
            className="h-full animate-dispatch-bar"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
