import { useEffect, useState } from 'react';
import type { ControlBindings, GameSettings, GraphicsQuality } from '../game/types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onUpdateBinding: (action: keyof ControlBindings, code: string) => void;
  onResetBindings: () => void;
  onPreviewFahh: () => void;
  onClose: () => void;
}

const BINDING_LABELS: Array<{ key: keyof ControlBindings; label: string }> = [
  { key: 'moveForward', label: 'Move Forward' },
  { key: 'moveBackward', label: 'Move Backward' },
  { key: 'moveLeft', label: 'Move Left' },
  { key: 'moveRight', label: 'Move Right' },
  { key: 'jump', label: 'Jump / Double Jump' },
  { key: 'sprint', label: 'Sprint' },
  { key: 'slide', label: 'Road Slide' },
  { key: 'bounce', label: 'Super Bounce' },
  { key: 'dash', label: 'Road Dash' },
  { key: 'special', label: 'Special: Highway Surge' },
  { key: 'interact', label: 'Interact' },
  { key: 'restart', label: 'Respawn Checkpoint' },
  { key: 'pause', label: 'Pause' },
];

export function SettingsModal({
  settings,
  onUpdateSettings,
  onUpdateBinding,
  onResetBindings,
  onPreviewFahh,
  onClose,
}: SettingsModalProps) {
  const [capturing, setCapturing] = useState<keyof ControlBindings | null>(null);

  useEffect(() => {
    if (!capturing) return;
    const handleKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onUpdateBinding(capturing, e.code);
      setCapturing(null);
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [capturing, onUpdateBinding]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        onUpdateSettings({ fullscreen: true });
      } else {
        await document.exitFullscreen?.();
        onUpdateSettings({ fullscreen: false });
      }
    } catch {
      onUpdateSettings({ fullscreen: !settings.fullscreen });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 bg-[#0a0d12]/84 flex items-center justify-center p-4 md:p-8"
    >
      <div className="hud-panel rounded-lg w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-[#f3f5f8] tracking-wide">
            SETTINGS
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] font-display font-bold text-xs tracking-wider cursor-pointer"
          >
            DONE
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-7">
          {/* Graphics */}
          <section>
            <h3 className="font-display text-sm font-semibold tracking-wider text-[#e59a3c] uppercase mb-4">
              Graphics &amp; Display
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <div className="text-xs text-[#b5becb] mb-2">Graphics Quality</div>
                <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded">
                  {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onUpdateSettings({ graphicsQuality: q })}
                      className={`py-1.5 text-xs font-display font-semibold uppercase rounded transition-colors cursor-pointer ${
                        settings.graphicsQuality === q
                          ? 'bg-[#e59a3c] text-[#0e1116]'
                          : 'text-[#b5becb] hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-[#b5becb] mb-2">Effects Quality</div>
                <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded">
                  {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onUpdateSettings({ effectsQuality: q })}
                      className={`py-1.5 text-xs font-display font-semibold uppercase rounded transition-colors cursor-pointer ${
                        settings.effectsQuality === q
                          ? 'bg-[#e59a3c] text-[#0e1116]'
                          : 'text-[#b5becb] hover:text-white'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="res-scale" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Resolution Scale</span>
                  <span className="font-mono-num text-white">
                    {Math.round(settings.resolutionScale * 100)}%
                  </span>
                </label>
                <input
                  id="res-scale"
                  type="range"
                  min={0.65}
                  max={1.0}
                  step={0.05}
                  value={settings.resolutionScale}
                  onChange={(e) => onUpdateSettings({ resolutionScale: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ shadowsEnabled: !settings.shadowsEnabled })}
                  className={`flex-1 py-2 px-3 rounded border text-xs font-display font-semibold tracking-wider cursor-pointer ${
                    settings.shadowsEnabled
                      ? 'bg-[#58c477]/15 border-[#58c477]/60 text-[#58c477]'
                      : 'bg-white/5 border-white/15 text-[#9ba5b4]'
                  }`}
                >
                  SHADOWS: {settings.shadowsEnabled ? 'ON' : 'OFF'}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ vsync: !settings.vsync })}
                  className={`flex-1 py-2 px-3 rounded border text-xs font-display font-semibold tracking-wider cursor-pointer ${
                    settings.vsync
                      ? 'bg-[#e59a3c]/15 border-[#e59a3c]/60 text-[#e59a3c]'
                      : 'bg-white/5 border-white/15 text-[#9ba5b4]'
                  }`}
                >
                  V-SYNC: {settings.vsync ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between md:col-span-2 pt-1">
                <div>
                  <div className="text-sm text-[#eef1f6] font-medium">Fullscreen Mode</div>
                  <div className="text-xs text-[#8f9aa8]">Expand viewport to native display</div>
                </div>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="px-4 py-2 rounded bg-white/8 hover:bg-white/16 text-xs font-display font-semibold tracking-wider text-white cursor-pointer"
                >
                  {document.fullscreenElement ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN'}
                </button>
              </div>
            </div>
          </section>

          {/* Audio */}
          <section className="border-t border-white/10 pt-6">
            <h3 className="font-display text-sm font-semibold tracking-wider text-[#e59a3c] uppercase mb-4">
              Audio Mix
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="vol-master" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Master Volume</span>
                  <span className="font-mono-num text-white">
                    {Math.round(settings.masterVolume * 100)}%
                  </span>
                </label>
                <input
                  id="vol-master"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.masterVolume}
                  onChange={(e) => onUpdateSettings({ masterVolume: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>

              <div>
                <label htmlFor="vol-music" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Music Volume</span>
                  <span className="font-mono-num text-white">
                    {Math.round(settings.musicVolume * 100)}%
                  </span>
                </label>
                <input
                  id="vol-music"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.musicVolume}
                  onChange={(e) => onUpdateSettings({ musicVolume: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>

              <div>
                <label htmlFor="vol-sfx" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Effects Volume</span>
                  <span className="font-mono-num text-white">
                    {Math.round(settings.sfxVolume * 100)}%
                  </span>
                </label>
                <input
                  id="vol-sfx"
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={settings.sfxVolume}
                  onChange={(e) => onUpdateSettings({ sfxVolume: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="px-3.5 py-2.5 rounded bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[#eef1f6]">All Audio Output</div>
                  <div className="text-[11px] text-[#8f9aa8]">Quick mute / unmute [M]</div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ muted: !settings.muted })}
                  className={`px-3.5 py-1.5 rounded border text-xs font-display font-semibold tracking-wider whitespace-nowrap shrink-0 cursor-pointer ${
                    settings.muted
                      ? 'bg-[#ef4444]/15 border-[#ef4444]/60 text-[#fca5a5]'
                      : 'bg-[#58c477]/15 border-[#58c477]/60 text-[#58c477]'
                  }`}
                >
                  {settings.muted ? 'MUTED' : 'UNMUTED'}
                </button>
              </div>

              <div className="px-3.5 py-2.5 rounded bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#eef1f6]">FAHH Sound Effect</div>
                  <div className="text-[11px] text-[#8f9aa8]">Comedic impact &amp; tumble reaction</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={settings.muted || !settings.fahhEnabled}
                    onClick={onPreviewFahh}
                    className={`px-3 py-1.5 rounded text-xs font-display font-semibold tracking-wider whitespace-nowrap transition-colors ${
                      settings.muted || !settings.fahhEnabled
                        ? 'bg-white/5 text-[#6f7a88] cursor-not-allowed'
                        : 'bg-white/12 hover:bg-white/22 text-white cursor-pointer'
                    }`}
                  >
                    TEST FAHH
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ fahhEnabled: !settings.fahhEnabled })}
                    className={`px-3.5 py-1.5 rounded border text-xs font-display font-semibold tracking-wider whitespace-nowrap cursor-pointer ${
                      settings.fahhEnabled
                        ? 'bg-[#e59a3c]/20 border-[#e59a3c] text-[#e59a3c]'
                        : 'bg-white/5 border-white/15 text-[#9ba5b4]'
                    }`}
                  >
                    {settings.fahhEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Camera & Gameplay */}
          <section className="border-t border-white/10 pt-6">
            <h3 className="font-display text-sm font-semibold tracking-wider text-[#e59a3c] uppercase mb-4">
              Camera &amp; Gameplay
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="sens-mouse" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Mouse Sensitivity</span>
                  <span className="font-mono-num text-white">
                    {settings.mouseSensitivity.toFixed(1)}x
                  </span>
                </label>
                <input
                  id="sens-mouse"
                  type="range"
                  min={0.2}
                  max={2.4}
                  step={0.1}
                  value={settings.mouseSensitivity}
                  onChange={(e) => onUpdateSettings({ mouseSensitivity: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>

              <div>
                <label htmlFor="cam-dist" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Camera Distance</span>
                  <span className="font-mono-num text-white">
                    {settings.cameraDistance.toFixed(1)}m
                  </span>
                </label>
                <input
                  id="cam-dist"
                  type="range"
                  min={6.0}
                  max={13.0}
                  step={0.5}
                  value={settings.cameraDistance}
                  onChange={(e) => onUpdateSettings({ cameraDistance: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>

              <div>
                <label htmlFor="cam-smooth" className="flex justify-between text-xs text-[#b5becb] mb-2">
                  <span>Camera Smoothing</span>
                  <span className="font-mono-num text-white">
                    {settings.cameraSmoothing.toFixed(1)}x
                  </span>
                </label>
                <input
                  id="cam-smooth"
                  type="range"
                  min={0.4}
                  max={2.0}
                  step={0.1}
                  value={settings.cameraSmoothing}
                  onChange={(e) => onUpdateSettings({ cameraSmoothing: Number(e.target.value) })}
                  className="w-full accent-[#e59a3c]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#b5becb]">Invert Camera Y-Axis</span>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ invertY: !settings.invertY })}
                  className={`px-4 py-2 rounded border text-xs font-display font-semibold tracking-wider cursor-pointer ${
                    settings.invertY
                      ? 'bg-[#e59a3c]/20 border-[#e59a3c] text-[#e59a3c]'
                      : 'bg-white/5 border-white/15 text-[#b5becb]'
                  }`}
                >
                  {settings.invertY ? 'INVERTED' : 'STANDARD'}
                </button>
              </div>

              <div className="md:col-span-2 flex items-center justify-between pt-2">
                <div>
                  <div className="text-xs text-[#b5becb]">Mobile Touch Controls</div>
                  <div className="text-[11px] text-[#8f9aa8]">On-screen joystick &amp; action buttons</div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded">
                  {(['auto', 'on', 'off'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onUpdateSettings({ touchControlsMode: mode })}
                      className={`px-3 py-1.5 text-xs font-display font-semibold uppercase rounded transition-colors cursor-pointer ${
                        settings.touchControlsMode === mode
                          ? 'bg-[#e59a3c] text-[#0e1116]'
                          : 'text-[#b5becb] hover:text-white'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Controls */}
          <section className="border-t border-white/10 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-sm font-semibold tracking-wider text-[#e59a3c] uppercase">
                Controls Configuration
              </h3>
              <button
                type="button"
                onClick={onResetBindings}
                className="text-xs text-[#9ba5b4] hover:text-white underline cursor-pointer"
              >
                Reset Defaults
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {BINDING_LABELS.map((item) => {
                const isListening = capturing === item.key;
                return (
                  <div
                    key={item.key}
                    className="px-3.5 py-2 rounded bg-white/[0.04] border border-white/10 flex items-center justify-between gap-2"
                  >
                    <span className="text-xs text-[#d7dee8]">{item.label}</span>
                    <button
                      type="button"
                      onClick={() => setCapturing(item.key)}
                      className={`px-3 py-1 rounded font-mono-num text-xs font-semibold transition-colors cursor-pointer ${
                        isListening
                          ? 'bg-[#e59a3c] text-[#0e1116]'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isListening ? 'PRESS KEY...' : settings.bindings[item.key]}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
