import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengesModal } from './components/ChallengesModal';
import { CreditsModal } from './components/CreditsModal';
import { CustomizationModal } from './components/CustomizationModal';
import { GameHud } from './components/GameHud';
import { MobileControls } from './components/MobileControls';
import { PauseModal, VictoryModal } from './components/PauseVictoryModals';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { TitleScreen } from './components/TitleScreen';
import { WorldSelectModal } from './components/WorldSelectModal';
import { getLevelById } from './game/data/levels';
import { WORLD_THEMES } from './game/data/worlds';
import { detectWebGLSupport, GameEngine } from './game/render/GameEngine';
import { AudioManager } from './game/systems/AudioManager';
import { SaveManager } from './game/systems/SaveManager';
import { SettingsManager } from './game/systems/SettingsManager';
import type {
  CharacterLoadout,
  ControlBindings,
  GameSettings,
  GameState,
  HudSnapshot,
  RunSummary,
  SaveData,
  WorldId,
} from './game/types';

type ActiveModal =
  | 'none'
  | 'worlds'
  | 'customization'
  | 'challenges'
  | 'achievements'
  | 'settings'
  | 'credits';

function createInitialHud(levelId: string, totalCoins: number): HudSnapshot {
  const lvl = getLevelById(levelId);
  const theme = WORLD_THEMES[lvl.worldId];
  return {
    levelId: lvl.id,
    levelName: lvl.name,
    worldName: theme.name,
    score: 1000,
    coinsRun: 0,
    totalCoins,
    collectiblesFound: 0,
    collectiblesTotal: lvl.collectibles.length,
    health: 3,
    maxHealth: 3,
    elapsedTime: 0,
    timeChallengeRemaining: lvl.timeChallengeSec ?? null,
    speed: 0,
    isSprinting: false,
    isSliding: false,
    bounceCooldownRatio: 0,
    dashCooldownRatio: 0,
    dashCharge: 1,
    specialCooldownRatio: 0,
    specialActive: false,
    specialEnergy: 1,
    gravityInverted: false,
    checkpointLabel: 'Start Gate',
    checkpointNotice: null,
    achievementNotice: null,
    bossName: lvl.boss?.name ?? null,
    interactPrompt: null,
    levelHint: lvl.hint ?? null,
    fallsCount: 0,
    canDash: lvl.allowDash,
  };
}

function detectTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0
  );
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
    createInitialHud(
      saveMgrRef.current!.getData().lastPlayedLevelId,
      saveMgrRef.current!.getData().coins
    )
  );
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>('none');
  const [selectedWorld, setSelectedWorld] = useState<WorldId>(1);
  const [quitNotice, setQuitNotice] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);
  const [contextLost, setContextLost] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(
    () => saveMgrRef.current?.lastError ?? null
  );
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(() => detectTouchCapable());

  const syncSaveSnapshot = useCallback(() => {
    if (saveMgrRef.current) {
      setSaveData({
        ...saveMgrRef.current.getData(),
        loadout: { ...saveMgrRef.current.getData().loadout },
      });
      setStorageWarning(saveMgrRef.current.lastError);
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
    onContextStatusChange: (lost: boolean) => {
      setContextLost(lost);
    },
  });

  useEffect(() => {
    const onFirstTouch = () => {
      setIsTouchDevice(true);
      audioMgrRef.current?.unlock();
    };
    const onFirstPointer = () => {
      audioMgrRef.current?.unlock();
    };
    window.addEventListener('touchstart', onFirstTouch, { passive: true, once: true });
    window.addEventListener('pointerdown', onFirstPointer, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', onFirstTouch);
      window.removeEventListener('pointerdown', onFirstPointer);
    };
  }, []);

  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl || !saveMgrRef.current || !audioMgrRef.current || !settingsMgrRef.current) {
      return;
    }

    const support = detectWebGLSupport();
    if (!support.supported) {
      setWebglError(
        support.reason ?? 'WebGL graphics acceleration is required to play BOUNCEBACK.'
      );
      return;
    }

    let engine: GameEngine;
    try {
      engine = new GameEngine(
        mountEl,
        saveMgrRef.current,
        audioMgrRef.current,
        settingsMgrRef.current.getSettings(),
        callbacksRef.current
      );
      engineRef.current = engine;

      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        engine.loadLevel('w1-l1', true);
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Failed to initialize 3D WebGL renderer.';
      setWebglError(msg);
      return;
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

  const handleToggleMute = useCallback(() => {
    if (!settingsMgrRef.current) return;
    const next = settingsMgrRef.current.update({ muted: !settingsMgrRef.current.getSettings().muted });
    setSettings({ ...next });
    engineRef.current?.updateSettings(next);
  }, []);

  // Title Screen Enter start + Mute (M)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState === 'title' && activeModal === 'none' && !webglError) {
        if (e.code === 'Enter') {
          e.preventDefault();
          handlePlay();
          return;
        }
      }
      if (e.code === 'KeyM' && activeModal === 'none') {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState, activeModal, webglError, handlePlay, handleToggleMute]);

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

  const handleUnlockCosmetic = (itemId: string) => {
    audioMgrRef.current?.playUiClick();
    saveMgrRef.current?.unlockCosmetic(itemId);
    syncSaveSnapshot();
  };

  const handleEquipCosmetic = (category: keyof CharacterLoadout, itemId: string) => {
    audioMgrRef.current?.playUiClick();
    if (saveMgrRef.current?.equipCosmetic(category, itemId)) {
      engineRef.current?.setLoadout(saveMgrRef.current.getData().loadout);
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
    if (saveMgrRef.current) {
      engineRef.current?.setLoadout(saveMgrRef.current.getData().loadout);
    }
    syncSaveSnapshot();
  };

  const hasContinue = saveMgrRef.current?.hasContinueProgress() ?? false;
  const currentLvl = engineRef.current?.getCurrentLevel() ?? getLevelById(hud.levelId);
  const currentTheme = WORLD_THEMES[currentLvl.worldId];
  const showTouchControls =
    gameState === 'playing' &&
    activeModal === 'none' &&
    !contextLost &&
    (settings.touchControlsMode === 'on' ||
      (settings.touchControlsMode === 'auto' && isTouchDevice));

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0e1116]">
      <div
        ref={canvasMountRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

      {webglError && (
        <div
          role="alert"
          className="fixed inset-0 z-50 bg-[#0e1116] flex items-center justify-center p-6"
        >
          <div className="hud-panel rounded-lg max-w-md w-full p-7">
            <div className="text-xs font-mono-num tracking-[0.2em] text-[#ef4444] uppercase">
              WEBGL GRAPHICS UNAVAILABLE
            </div>
            <h1 className="font-display text-2xl font-bold text-[#f3f5f8] mt-1">
              3D RENDERER COULD NOT START
            </h1>
            <p className="text-sm text-[#cfd6e0] mt-2 leading-relaxed">{webglError}</p>
            <p className="text-xs text-[#9ba5b4] mt-3 leading-relaxed">
              Enable hardware acceleration in your browser settings or open BOUNCEBACK in an up-to-date Chrome, Edge, Firefox, or Safari browser.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 w-full py-2.5 px-4 bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] font-display font-bold text-xs tracking-wider rounded cursor-pointer"
            >
              RETRY INITIALIZATION
            </button>
          </div>
        </div>
      )}

      {contextLost && !webglError && (
        <div
          role="status"
          className="fixed inset-0 z-40 bg-[#0a0d12]/85 flex items-center justify-center p-6"
        >
          <div className="hud-panel rounded-lg max-w-sm w-full p-6 text-center">
            <div className="text-xs font-mono-num tracking-widest text-[#e59a3c] uppercase">
              GRAPHICS CONTEXT INTERRUPTED
            </div>
            <p className="text-sm text-[#e6e9ef] mt-2">
              Restoring 3D WebGL highway scene...
            </p>
          </div>
        </div>
      )}

      {storageWarning && !webglError && (
        <div
          role="status"
          className="fixed top-3 left-1/2 -translate-x-1/2 z-40 hud-panel border-[#e59a3c]/60 rounded px-4 py-2 text-xs text-[#f5b832] flex items-center gap-3"
        >
          <span>{storageWarning}</span>
          <button
            type="button"
            onClick={() => setStorageWarning(null)}
            className="text-white/80 hover:text-white underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {!webglError && gameState === 'title' && activeModal === 'none' && (
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
          onOpenCustomization={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('customization');
          }}
          onOpenChallenges={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('challenges');
          }}
          onOpenAchievements={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('achievements');
          }}
          onOpenSettings={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('settings');
          }}
          onOpenCredits={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('credits');
          }}
          onQuit={() => {
            audioMgrRef.current?.playUiClick();
            saveMgrRef.current?.save();
            setQuitNotice(true);
          }}
          onDismissQuitNotice={() => setQuitNotice(false)}
        />
      )}

      {!webglError && gameState === 'playing' && (
        <GameHud
          hud={hud}
          bindings={settings.bindings}
          muted={settings.muted}
          touchControlsActive={showTouchControls}
          onToggleMute={handleToggleMute}
          onRespawn={() => engineRef.current?.loadLevel(hud.levelId, true)}
          onPause={() => engineRef.current?.setGameState('paused')}
        />
      )}

      {showTouchControls && (
        <MobileControls
          hasInteractPrompt={Boolean(hud.interactPrompt)}
          canDash={hud.canDash}
          onMove={(f, r) => engineRef.current?.setTouchMove(f, r)}
          onAction={(action, pressed) => engineRef.current?.setTouchAction(action, pressed)}
          onOrbit={(dx, dy) => engineRef.current?.orbitCamera(dx, dy)}
        />
      )}

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
          onOpenWorlds={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('worlds');
          }}
          onMainMenu={() => {
            audioMgrRef.current?.playUiClick();
            engineRef.current?.setGameState('title');
          }}
        />
      )}

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

      {activeModal === 'customization' && (
        <CustomizationModal
          saveData={saveData}
          onUnlockCosmetic={handleUnlockCosmetic}
          onEquipCosmetic={handleEquipCosmetic}
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'challenges' && (
        <ChallengesModal
          saveData={saveData}
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'achievements' && (
        <ProfileModal
          saveData={saveData}
          onResetProgress={handleResetProgress}
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
          onPreviewFahh={() => {
            audioMgrRef.current?.previewFahh();
          }}
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}

      {activeModal === 'credits' && (
        <CreditsModal
          onClose={() => {
            audioMgrRef.current?.playUiClick();
            setActiveModal('none');
          }}
        />
      )}
    </main>
  );
}
