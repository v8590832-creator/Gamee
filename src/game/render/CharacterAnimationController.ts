import * as THREE from 'three';
import type { CharacterAnimState } from '../types';
import type { CharacterRig } from './CharacterBuilder';
import { advanceStridePhase } from './sceneryProfile';

export class CharacterAnimationController {
  private animTime = 0;
  private stridePhase = 0;
  private prevFacingYaw = 0;
  private bankRoll = 0;
  private blinkTimer = 3.0;
  private oneShotState: CharacterAnimState | null = null;
  private oneShotTimer = 0;
  private spinAngle = 0;

  public triggerOneShot(state: CharacterAnimState, duration: number): void {
    this.oneShotState = state;
    this.oneShotTimer = duration;
    if (state === 'doubleJump') {
      this.spinAngle = 0;
    }
  }

  public update(
    rig: CharacterRig,
    dt: number,
    params: {
      horizSpeed: number;
      velY: number;
      grounded: boolean;
      isSprinting: boolean;
      isSliding: boolean;
      dashActive: boolean;
      specialActive: boolean;
      facingYaw: number;
      victory: boolean;
    }
  ): CharacterAnimState {
    this.animTime += dt;
    this.stridePhase = advanceStridePhase(
      this.stridePhase,
      params.horizSpeed,
      dt,
      params.grounded
    );

    if (this.oneShotTimer > 0) {
      this.oneShotTimer = Math.max(0, this.oneShotTimer - dt);
      if (this.oneShotTimer <= 0) {
        this.oneShotState = null;
        this.spinAngle = 0;
      }
    }

    // Determine active animation state
    let state: CharacterAnimState = 'idle';
    if (params.victory) {
      state = 'victory';
    } else if (this.oneShotState) {
      state = this.oneShotState;
    } else if (params.dashActive) {
      state = 'dash';
    } else if (params.isSliding) {
      state = 'slide';
    } else if (!params.grounded) {
      state = params.velY > 1.5 ? 'jump' : 'fall';
    } else if (params.horizSpeed > 13.5 && params.isSprinting) {
      state = 'sprint';
    } else if (params.horizSpeed > 5.0) {
      state = 'run';
    } else if (params.horizSpeed > 0.6) {
      state = 'walk';
    }

    // Face movement direction cleanly + lateral lean when carving corners
    let yawDelta = params.facingYaw - this.prevFacingYaw;
    while (yawDelta > Math.PI) yawDelta -= Math.PI * 2;
    while (yawDelta < -Math.PI) yawDelta += Math.PI * 2;
    this.prevFacingYaw = params.facingYaw;

    const targetBank =
      params.grounded && params.horizSpeed > 2.5
        ? Math.max(-0.24, Math.min(0.24, (-yawDelta / Math.max(dt, 0.008)) * 0.032))
        : 0;
    this.bankRoll += (targetBank - this.bankRoll) * (1 - Math.exp(-10 * dt));

    rig.rigBody.rotation.y = params.facingYaw;
    rig.rigBody.rotation.z = this.bankRoll;

    // Eye blinking every ~3.4 seconds
    this.blinkTimer -= dt;
    const isBlinking = this.blinkTimer < 0.12;
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 2.8 + Math.random() * 1.8;
    }
    rig.eyelidL.scale.y = isBlinking ? 3.2 : 1.0;
    rig.eyelidR.scale.y = isBlinking ? 3.2 : 1.0;

    // Target pose variables
    let hipY = 0;
    let hipRotX = 0;
    let hipRotY = 0;
    let torsoRotX = 0;
    let torsoRotY = 0;
    let headRotX = 0;
    let headRotY = 0;
    let armLX = 0;
    let armRX = 0;
    let armLZ = 0.12;
    let armRZ = -0.12;
    let foreLX = -0.25;
    let foreRX = -0.25;
    let legLX = 0;
    let legRX = 0;
    let shinLX = 0;
    let shinRX = 0;
    let bodySpinX = 0;

    const damp = 1 - Math.exp(-16 * dt);

    if (state === 'idle') {
      const b = Math.sin(this.animTime * 2.1);
      const sway = Math.sin(this.animTime * 1.15);
      hipY = b * 0.022;
      hipRotY = sway * 0.04;
      torsoRotY = -sway * 0.03;
      armLX = b * 0.05;
      armRX = -b * 0.05;
      headRotX = b * 0.035;
      headRotY = Math.sin(this.animTime * 0.7) * 0.12;
    } else if (state === 'walk' || state === 'run' || state === 'sprint') {
      const amp = state === 'sprint' ? 1.05 : state === 'run' ? 0.8 : 0.48;
      const c = Math.sin(this.stridePhase);
      const bob = Math.abs(Math.cos(this.stridePhase));
      hipY = bob * (state === 'sprint' ? 0.095 : state === 'run' ? 0.065 : 0.035);
      hipRotY = c * (state === 'sprint' ? 0.14 : 0.09);
      torsoRotX = state === 'sprint' ? 0.26 : state === 'run' ? 0.15 : 0.06;
      torsoRotY = -c * (state === 'sprint' ? 0.22 : 0.14);
      headRotY = c * 0.06;
      legLX = c * amp;
      legRX = -c * amp;
      shinLX = Math.max(0, -c) * 0.88 + 0.12;
      shinRX = Math.max(0, c) * 0.88 + 0.12;
      armLX = -c * amp * 0.92;
      armRX = c * amp * 0.92;
      foreLX = -0.68 - Math.max(0, c) * 0.3;
      foreRX = -0.68 - Math.max(0, -c) * 0.3;
    } else if (state === 'jump' || state === 'bounce' || state === 'special') {
      torsoRotX = -0.08;
      armLX = -2.2;
      armRX = -2.2;
      armLZ = 0.38;
      armRZ = -0.38;
      legLX = -0.45;
      legRX = 0.25;
      shinLX = 0.7;
      shinRX = 0.25;
    } else if (state === 'doubleJump') {
      this.spinAngle += dt * 15;
      bodySpinX = this.spinAngle;
      legLX = -0.8;
      legRX = -0.8;
      shinLX = 1.2;
      shinRX = 1.2;
      armLX = -1.2;
      armRX = -1.2;
    } else if (state === 'fall') {
      const flail = Math.sin(this.animTime * 14);
      armLX = -1.8 + flail * 0.35;
      armRX = -1.8 - flail * 0.35;
      armLZ = 0.65;
      armRZ = -0.65;
      legLX = -0.3 + flail * 0.18;
      legRX = 0.2 - flail * 0.18;
      shinLX = 0.4;
      shinRX = 0.4;
    } else if (state === 'slide') {
      hipY = -0.34;
      hipRotX = -0.85;
      torsoRotX = -0.2;
      headRotX = 0.7;
      legLX = -0.15;
      legRX = -0.1;
      shinLX = 0.15;
      shinRX = 0.8;
      armLX = 0.45;
      armRX = -0.5;
    } else if (state === 'dash') {
      torsoRotX = 0.55;
      headRotX = -0.35;
      armLX = 0.8;
      armRX = 0.8;
      legLX = 0.55;
      legRX = -0.35;
    } else if (state === 'land') {
      hipY = -0.16;
      torsoRotX = 0.2;
      legLX = -0.55;
      legRX = -0.55;
      shinLX = 0.9;
      shinRX = 0.9;
    } else if (state === 'damage') {
      torsoRotX = -0.35;
      armLX = -0.9;
      armRX = -0.9;
      armLZ = 0.55;
      armRZ = -0.55;
    } else if (state === 'pickup') {
      armRX = -2.3;
      hipY = 0.08;
    } else if (state === 'victory' || state === 'levelComplete') {
      const wave = Math.sin(this.animTime * 6.5);
      hipY = Math.abs(Math.sin(this.animTime * 4)) * 0.1;
      armLX = -2.6 + wave * 0.3;
      armRX = -2.6 - wave * 0.3;
      armLZ = 0.45;
      armRZ = -0.45;
    }

    // Smoothly apply pose transforms
    rig.hips.position.y += (hipY - rig.hips.position.y) * damp;
    rig.hips.rotation.x += (hipRotX + bodySpinX - rig.hips.rotation.x) * damp;
    rig.hips.rotation.y += (hipRotY - rig.hips.rotation.y) * damp;
    rig.torso.rotation.x += (torsoRotX - rig.torso.rotation.x) * damp;
    rig.torso.rotation.y += (torsoRotY - rig.torso.rotation.y) * damp;
    rig.head.rotation.x += (headRotX - rig.head.rotation.x) * damp;
    rig.head.rotation.y += (headRotY - rig.head.rotation.y) * damp;

    rig.armL.rotation.x += (armLX - rig.armL.rotation.x) * damp;
    rig.armR.rotation.x += (armRX - rig.armR.rotation.x) * damp;
    rig.armL.rotation.z += (armLZ - rig.armL.rotation.z) * damp;
    rig.armR.rotation.z += (armRZ - rig.armR.rotation.z) * damp;
    rig.forearmL.rotation.x += (foreLX - rig.forearmL.rotation.x) * damp;
    rig.forearmR.rotation.x += (foreRX - rig.forearmR.rotation.x) * damp;

    rig.legL.rotation.x += (legLX - rig.legL.rotation.x) * damp;
    rig.legR.rotation.x += (legRX - rig.legR.rotation.x) * damp;
    rig.shinL.rotation.x += (shinLX - rig.shinL.rotation.x) * damp;
    rig.shinR.rotation.x += (shinRX - rig.shinR.rotation.x) * damp;

    // Kurta cloth skirt subtle sway
    rig.kurtaSkirt.rotation.x =
      Math.sin(this.stridePhase) * Math.min(0.18, params.horizSpeed * 0.012);

    // Expressive Eyebrows & Smile
    const isSurprised = state === 'damage' || state === 'fall';
    const isFocused = state === 'sprint' || state === 'dash' || state === 'special';
    const isHappy = state === 'victory' || state === 'levelComplete' || state === 'pickup';

    const targetBrowY = isSurprised ? 0.326 : isHappy ? 0.316 : isFocused ? 0.298 : 0.308;
    const targetBrowTilt = isFocused ? -0.18 : isSurprised ? 0.16 : 0.08;
    rig.browL.position.y += (targetBrowY - rig.browL.position.y) * damp;
    rig.browR.position.y += (targetBrowY - rig.browR.position.y) * damp;
    rig.browL.rotation.z = Math.PI / 2 + targetBrowTilt;
    rig.browR.rotation.z = Math.PI / 2 - targetBrowTilt;

    rig.mouth.scale.x = isHappy ? 1.35 : isSurprised ? 0.65 : 1.0;
    rig.mouth.scale.y = isSurprised ? 1.7 : 1.0;

    // Special Highway Surge aura
    const auraMat = rig.surgeAura.material as THREE.MeshBasicMaterial;
    auraMat.opacity = params.specialActive ? 0.55 + Math.sin(this.animTime * 12) * 0.2 : 0;
    rig.surgeAura.rotation.z += dt * 4;

    return state;
  }
}
