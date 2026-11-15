import { useCallback, useEffect, useRef, useState } from 'react';
import { ChallengesModal } from './components/ChallengesModal';
import { CreditsModal } from './components/CreditsModal';
import { CustomizationModal } from './components/CustomizationModal';
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
  const [muted, setMuted] = useState(false);
  const [quitNotice, setQuitNotice] = useState(false);

  const syncSaveSnapshot = useCallback(() => {
    if (saveMgrRef.current) {
      setSaveData({ ...saveMgrRef.current.getData(), loadout: { ...saveMgrRef.current.getData().loadout } });
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

  // Title Screen Enter start + Mute (M)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (gameState === 'title' && activeModal === 'none') {
        if (e.code === 'Enter') {
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

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#0e1116]">
      <div
        ref={canvasMountRef}
        data-testid="game-canvas-container"
        className="absolute inset-0 w-full h-full"
      />

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
