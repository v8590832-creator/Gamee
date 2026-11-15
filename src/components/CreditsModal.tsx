interface CreditsModalProps {
  onClose: () => void;
}

export function CreditsModal({ onClose }: CreditsModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Credits"
      className="fixed inset-0 z-50 bg-[#0a0d12]/84 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-xl p-7 animate-modal-in">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="text-[11px] font-mono-num tracking-[0.2em] text-[#e59a3c] uppercase">
              PRODUCTION CREDITS
            </div>
            <h2 className="font-display text-2xl font-bold text-[#f3efe6] mt-0.5">
              BOUNCEBACK: THE GREAT ROAD ADVENTURE
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-xs font-display font-semibold tracking-wider text-white cursor-pointer"
          >
            CLOSE
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-[#cfd6e0]">
          <p className="font-display tracking-wider text-[#f5b832]">
            ONE MAN. COUNTLESS ROADS. UNLIMITED BOUNCES.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded bg-white/[0.04] border border-white/10">
              <div className="text-[#9ba5b4] uppercase tracking-wider text-[10px]">
                3D Engine &amp; Physics
              </div>
              <div className="text-[#f3f5f8] font-medium mt-1">
                WebGL Three.js Real-Time Arcade Engine &amp; 16-State Procedural Character Animator
              </div>
            </div>
            <div className="p-3 rounded bg-white/[0.04] border border-white/10">
              <div className="text-[#9ba5b4] uppercase tracking-wider text-[10px]">
                World Architecture
              </div>
              <div className="text-[#f3f5f8] font-medium mt-1">
                10 Indian Highway Worlds · 50 Handcrafted Stages · 5 Boss Encounters
              </div>
            </div>
            <div className="p-3 rounded bg-white/[0.04] border border-white/10">
              <div className="text-[#9ba5b4] uppercase tracking-wider text-[10px]">
                Audio Synthesis
              </div>
              <div className="text-[#f3f5f8] font-medium mt-1">
                Procedural Raga Bhupali Pentatonic Synth, Tabla Pulse, Traffic Horns &amp; Monsoon SFX
              </div>
            </div>
            <div className="p-3 rounded bg-white/[0.04] border border-white/10">
              <div className="text-[#9ba5b4] uppercase tracking-wider text-[10px]">
                Progression &amp; Save
              </div>
              <div className="text-[#f3f5f8] font-medium mt-1">
                20 Challenges · 10 Achievements · Full Character Wardrobe · Dual-Key Local Save
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded bg-white/[0.03] border border-white/10 text-xs text-[#9ba5b4] leading-relaxed">
            This game is an obviously fictional, lighthearted indie arcade adventure celebrating infrastructure, roadbuilding, and platforming physics. It carries no official government affiliation, endorsement, or real-world political statements.
          </div>
        </div>
      </div>
    </div>
  );
}
