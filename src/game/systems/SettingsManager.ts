import { DEFAULT_BINDINGS, DEFAULT_SETTINGS } from '../data/catalog';
import type { ControlBindings, GameSettings } from '../types';

const SETTINGS_KEY = 'bounceback_settings_v1';

export class SettingsManager {
  private settings: GameSettings;

  constructor() {
    this.settings = this.load();
  }

  public getSettings(): GameSettings {
    return this.settings;
  }

  public load(): GameSettings {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return { ...DEFAULT_SETTINGS, bindings: { ...DEFAULT_BINDINGS } };
      }
      const raw = window.localStorage.getItem(SETTINGS_KEY);
      if (!raw) return { ...DEFAULT_SETTINGS, bindings: { ...DEFAULT_BINDINGS } };
      const parsed = JSON.parse(raw) as Partial<GameSettings>;
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        bindings: {
          ...DEFAULT_BINDINGS,
          ...(parsed.bindings ?? {}),
        },
      };
    } catch {
      return { ...DEFAULT_SETTINGS, bindings: { ...DEFAULT_BINDINGS } };
    }
  }

  public update(patch: Partial<GameSettings>): GameSettings {
    this.settings = {
      ...this.settings,
      ...patch,
      bindings: patch.bindings
        ? { ...this.settings.bindings, ...patch.bindings }
        : this.settings.bindings,
    };
    this.save();
    return this.settings;
  }

  public updateBinding(action: keyof ControlBindings, code: string): GameSettings {
    this.settings = {
      ...this.settings,
      bindings: {
        ...this.settings.bindings,
        [action]: code,
      },
    };
    this.save();
    return this.settings;
  }

  public resetBindings(): GameSettings {
    this.settings = {
      ...this.settings,
      bindings: { ...DEFAULT_BINDINGS },
    };
    this.save();
    return this.settings;
  }

  public save(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
      }
    } catch {
      // Ignore quota errors
    }
  }
}
