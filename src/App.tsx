import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { PauseModal, VictoryModal } from './components/PauseVictoryModals';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { WorldSelectModal } from './components/WorldSelectModal';
import { getLevelById } from './game/data/levels';
import { WORLD_THEMES } from './game/data/worlds';
import { GameEngine } from './game/render/GameEngine';
import { AudioManager } from './game/systems/AudioManager';
import { SaveManager } from './game/systems/SaveManager';
import { SettingsManager } from './game/systems/SettingsManager';
import type {
  ControlBindings,
  GameSettings,
  GameState,
  HudSnapshot,
  OrbSkinId,
  RunSummary,
  SaveData,
  WorldId,
} from './game/types';

type ActiveModal = 'none' | 'worlds' | 'settings' | 'profile';

function createInitialHud(levelId: string): HudSnapshot {
  const lvl = getLevelById(levelId);
  const theme = WORLD_THEMES[lvl.worldId];
  return {
    levelId: lvl.id,
    levelName: lvl.name,
    worldName: theme.name,
    score: 1000,
    collectiblesFound: 0,
    collectiblesTotal: lvl.collectibles.length,
    elapsedTime: 0,
    speed: 0,
    dashCooldownRatio: 0,
    dashCharge: 1,
    gravityInverted: false,
    gravityCooldownRatio: 0,
    timeSlowActive: false,
    timeSlowEnergy: 1,
    checkpointLabel: 'Launch Deck',
    checkpointNotice: null,
    achievementNotice: null,
    interactPrompt: null,
    levelHint: lvl.hint ?? null,
    fallsCount: 0,
    canGravityShift: lvl.allowGravityShift,
    canTimeControl: lvl.allowTimeControl,
    canDash: lvl.allowDash,
  };
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const saveMgrRef = useRef<SaveManager | null>(null);
  const settingsMgrRef = useRef<SettingsManager | null>(null);
  const audioMgrRef = useRef<AudioManager | null>(null);

  if (!saveMgrRef.current) saveMgrRef.current = new SaveManager();
  if (!settingsMgrRef.current) settingsMgrRef.current = new SettingsManager();
  if (!audioMgrRef.current) {
    audioMgrRef.current = new AudioManager(settingsMgrRef.current.getSettings());
  }

  const [gameState, setGameState] = useState<GameState>('title');
  const [saveData, setSaveData] = useState<SaveData>(() => ({
    ...saveMgrRef.current!.getData(),
  }));
  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...settingsMgrRef.current!.getSettings(),
  }));
  const [hud, setHud] = useState<HudSnapshot>(() =>
    createInitialHud(saveMgrRef.current!.getData().lastPlayedLevelId)
  );
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [selectedWorld, setSelectedWorld] = useState<WorldId>(1);
  const [muted, setMuted] = useState(false);
  const [quitNotice, setQuitNotice] = useState(false);

  const syncSaveSnapshot = useCallback(() => {
    if (saveMgrRef.current) {
      setSaveData({ ...saveMgrRef.current.getData() });
    }
  }, []);

  const callbacksRef = useRef({
    onHudUpdate: (nextHud: HudSnapshot) => {
      setHud(nextHud);
    },
    onStateChange: (nextState: GameState) => {
      setGameState(nextState);
    },
    onLevelComplete: (summary: RunSummary) => {
      setRunSummary(summary);
      syncSaveSnapshot();
    },
  });

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl || !saveMgrRef.current || !audioMgrRef.current || !settingsMgrRef.current) {
      return;
    }

    const engine = new GameEngine(
      mountEl,
      saveMgrRef.current,
      audioMgrRef.current,
      settingsMgrRef.current.getSettings(),
      callbacksRef.current
    );
    engineRef.current = engine;

    // Support ?autostart=1 to jump directly into active gameplay
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      engine.loadLevel('w1-l1', true);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
      audioMgrRef.current?.dispose();
    };
  }, []);

  const handlePlay = useCallback(() => {
    audioMgrRef.current?.playUiClick();
    setActiveModal('none');
    setQuitNotice(false);
    setRunSummary(null);
    saveMgrRef.current?.setLastPlayedLevel('w1-l1');
    syncSaveSnapshot();
    engineRef.current?.loadLevel('w1-l1', true);
  }, [syncSaveSnapshot]);

  const handleContinue = useCallback(() => {
    audioMgrRef.current?.playUiClick();
    setActiveModal('none');
    setQuitNotice(false);
    setRunSummary(null);
    const lvlId = saveMgrRef.current?.getData().lastPlayedLevelId ?? 'w1-l1';
    engineRef.current?.loadLevel(lvlId, true);
  }, []);

  const handleLaunchLevel = useCallback(
    (levelId: string) => {
      audioMgrRef.current?.playUiClick();
      setActiveModal('none');
      setRunSummary(null);
      saveMgrRef.current?.setLastPlayedLevel(levelId);
      syncSaveSnapshot();
      engineRef.current?.loadLevel(levelId, true);
    },
    [syncSaveSnapshot]
  );

  // Title Screen Enter / Space start handshake + Quick Mute (M)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState === 'title' && activeModal === 'none') {
        if (e.code === 'Enter' || e.code === 'Space') {
          e.preventDefault();
          handlePlay();
          return;
        }
      }
      if (e.code === 'KeyM' && activeModal === 'none') {
        const nextMuted = !audioMgrRef.current?.isMuted();
        audioMgrRef.current?.setMuted(nextMuted);
        setMuted(nextMuted);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, activeModal, handlePlay]);

  const handleToggleMute = () => {
    const nextMuted = !audioMgrRef.current?.isMuted();
    audioMgrRef.current?.setMuted(nextMuted);
    setMuted(nextMuted);
  };

  const handleUpdateSettings = (patch: Partial<GameSettings>) => {
    if (!settingsMgrRef.current) return;
    const next = settingsMgrRef.current.update(patch);
    setSettings({ ...next });
    engineRef.current?.updateSettings(next);
  };

  const handleUpdateBinding = (action: keyof ControlBindings, code: string) => {
    if (!settingsMgrRef.current) return;
    const next = settingsMgrRef.current.updateBinding(action, code);
    setSettings({ ...next });
    engineRef.current?.updateSettings(next);
  };

  const handleResetBindings = () => {
    if (!settingsMgrRef.current) return;
    const next = settingsMgrRef.current.resetBindings();
    setSettings({ ...next });
    engineRef.current?.updateSettings(next);
  };

  const handleEquipSkin = (skinId: OrbSkinId) => {
    audioMgrRef.current?.playUiClick();
    if (saveMgrRef.current?.equipSkin(skinId)) {
      engineRef.current?.setSkin(skinId);
      syncSaveSnapshot();
    }
  };

  const handleToggleShowcaseUnlock = (enabled: boolean) => {
    audioMgrRef.current?.playUiClick();
    saveMgrRef.current?.toggleUnlockAllShowcase(enabled);
    syncSaveSnapshot();
  };

  const handleResetProgress = () => {
    audioMgrRef.current?.playUiClick();
    saveMgrRef.current?.resetProgress();
    engineRef.current?.setSkin('copper');
    syncSaveSnapshot();
  };

  const hasContinue = saveMgrRef.current?.hasContinueProgress() ?? false;
  const currentLvl = engineRef.current?.getCurrentLevel() ?? getLevelById(hud.levelId);
  const currentTheme = WORLD_THEMES[currentLvl.worldId];

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0e1116]">
      {/* Dedicated Isolated WebGL Mount Container */}
      <div
        ref={canvasMountRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {/* Title Screen */}
      {gameState === 'title' && activeModal === 'none' && (
        <TitleScreen
          saveData={saveData}
          hasContinue={hasContinue}
          quitNotice={quitNotice}
          onPlay={handlePlay}
          onContinue={handleContinue}
          onOpenWorlds={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('worlds');
          }}
          onOpenSettings={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('settings');
          }}
          onOpenProfile={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('profile');
          }}
          onQuit={() => {
            audioMgrRef.current?.playUiClick();
            saveMgrRef.current?.save();
            setQuitNotice(true);
          }}
          onDismissQuitNotice={() => setQuitNotice(false)}
        />
      )}

      {/* Active Gameplay HUD */}
      {gameState === 'playing' && (
        <GameHud
          hud={hud}
          bindings={settings.bindings}
          muted={muted}
          onToggleMute={handleToggleMute}
          onRespawn={() => engineRef.current?.loadLevel(hud.levelId, true)}
          onPause={() => engineRef.current?.setGameState('paused')}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'paused' && activeModal === 'none' && (
        <PauseModal
          levelName={currentLvl.name}
          worldName={currentTheme.name}
          onResume={() => {
            audioMgrRef.current?.playUiClick();
            engineRef.current?.setGameState('playing');
          }}
          onRestart={() => {
            audioMgrRef.current?.playUiClick();
            engineRef.current?.restartLevel();
          }}
          onOpenSettings={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('settings');
          }}
          onMainMenu={() => {
            audioMgrRef.current?.playUiClick();
            engineRef.current?.setGameState('title');
          }}
        />
      )}

      {/* Stage Clear / Victory Modal */}
      {gameState === 'gameover' && runSummary && activeModal === 'none' && (
        <VictoryModal
          summary={runSummary}
          onNextLevel={() => {
            if (runSummary.nextLevelId) {
              handleLaunchLevel(runSummary.nextLevelId);
            }
          }}
          onReplay={() => {
            audioMgrRef.current?.playUiClick();
            setRunSummary(null);
            engineRef.current?.restartLevel();
          }}
          onMainMenu={() => {
            audioMgrRef.current?.playUiClick();
            setRunSummary(null);
            engineRef.current?.setGameState('title');
          }}
        />
      )}

      {/* Sub-Modals */}
      {activeModal === 'worlds' && (
        <WorldSelectModal
          saveData={saveData}
          selectedWorld={selectedWorld}
          onSelectWorld={(id) => {
            audioMgrRef.current?.playUiClick();
            setSelectedWorld(id);
          }}
          onToggleShowcaseUnlock={handleToggleShowcaseUnlock}
          onPlayLevel={handleLaunchLevel}
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'settings' && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onUpdateBinding={handleUpdateBinding}
          onResetBindings={handleResetBindings}
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'profile' && (
        <ProfileModal
          saveData={saveData}
          onEquipSkin={handleEquipSkin}
          onResetProgress={handleResetProgress}
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}
    </main>
  );
}
