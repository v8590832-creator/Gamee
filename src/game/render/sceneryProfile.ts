import type { WorldId, WorldTheme } from '../types';

type SceneryStyle = WorldTheme['sceneryStyle'];

export interface WorldSceneryProfile {
  hasCitySkyline: boolean;
  hasMountainRidges: boolean;
  hasRiverWater: boolean;
  hasTunnelVault: boolean;
  hasCablePylons: boolean;
  hasTollPlaza: boolean;
  hasCrossFlyovers: boolean;
  hasMegaCranes: boolean;
  hasChaiStalls: boolean;
  hasPalms: boolean;
  hasStreetlights: boolean;
  hasFestiveBunting: boolean;
  hasDustHaze: boolean;
}

export function getWorldSceneryProfile(
  worldId: WorldId,
  style: SceneryStyle
): WorldSceneryProfile {
  return {
    hasCitySkyline:
      style === 'city_site' ||
      style === 'flyover' ||
      style === 'pothole' ||
      style === 'ultimate' ||
      worldId === 1 ||
      worldId === 7,
    hasMountainRidges:
      style === 'mountain' ||
      style === 'monsoon' ||
      style === 'bridge' ||
      style === 'highway' ||
      style === 'ultimate',
    hasRiverWater: style === 'bridge' || style === 'monsoon',
    hasTunnelVault: style === 'tunnel',
    hasCablePylons: style === 'bridge' || style === 'ultimate',
    hasTollPlaza: style === 'highway',
    hasCrossFlyovers: style === 'flyover' || style === 'ultimate',
    hasMegaCranes: style === 'mega_site' || style === 'city_site' || style === 'bridge',
    hasChaiStalls:
      style === 'city_site' ||
      style === 'highway' ||
      style === 'pothole' ||
      style === 'flyover',
    hasPalms: style === 'monsoon' || style === 'bridge',
    hasStreetlights: style !== 'tunnel',
    hasFestiveBunting: style === 'ultimate' || style === 'city_site',
    hasDustHaze:
      style === 'city_site' ||
      style === 'pothole' ||
      style === 'mega_site' ||
      style === 'highway',
  };
}

/**
 * Computes distance-synchronized gait phase advance so character footsteps
 * match ground speed cleanly without skating on deceleration.
 */
export function advanceStridePhase(
  currentPhase: number,
  horizSpeed: number,
  dt: number,
  grounded: boolean
): number {
  if (!grounded || horizSpeed < 0.35) {
    return currentPhase;
  }
  const freqFactor = 0.72;
  return currentPhase + horizSpeed * dt * freqFactor;
}
