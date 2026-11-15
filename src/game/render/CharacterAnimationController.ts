import * as THREE from 'three';
import type { CharacterAnimState } from '../types';
import type { CharacterRig } from './CharacterBuilder';

export class CharacterAnimationController {
  private animTime = 0;
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

    // Face movement direction cleanly
    rig.rigBody.rotation.y = params.facingYaw;

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
    let torsoRotX = 0;
    let headRotX = 0;
    let armLX = 0, armRX = 0, armLZ = 0.12, armRZ = -0.12;
    let foreLX = -0.25, foreRX = -0.25;
    let legLX = 0, legRX = 0;
    let shinLX = 0, shinRX = 0;
    let bodySpinX = 0;

    const damp = 1 - Math.exp(-16 * dt);

    if (state === 'idle') {
      const b = Math.sin(this.animTime * 2.2);
      hipY = b * 0.02;
      armLX = b * 0.06;
      armRX = -b * 0.06;
      headRotX = b * 0.03;
    } else if (state === 'walk' || state === 'run' || state === 'sprint') {
      const freq = state === 'sprint' ? 14.5 : state === 'run' ? 10.5 : 6.8;
      const amp = state === 'sprint' ? 1.05 : state === 'run' ? 0.78 : 0.45;
      const c = Math.sin(this.animTime * freq);
      const bob = Math.abs(Math.cos(this.animTime * freq));
      hipY = bob * (state === 'sprint' ? 0.09 : 0.055);
      torsoRotX = state === 'sprint' ? 0.24 : state === 'run' ? 0.14 : 0.06;
      legLX = c * amp;
      legRX = -c * amp;
      shinLX = Math.max(0, -c) * 0.85 + 0.1;
      shinRX = Math.max(0, c) * 0.85 + 0.1;
      armLX = -c * amp * 0.9;
      armRX = c * amp * 0.9;
      foreLX = -0.65;
      foreRX = -0.65;
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
    rig.hips.rotation.x += ((hipRotX + bodySpinX) - rig.hips.rotation.x) * damp;
    rig.torso.rotation.x += (torsoRotX - rig.torso.rotation.x) * damp;
    rig.head.rotation.x += (headRotX - rig.head.rotation.x) * damp;

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
    rig.kurtaSkirt.rotation.x = Math.sin(this.animTime * 6) * Math.min(0.18, params.horizSpeed * 0.012);

    // Facial expression mouth shape
    rig.mouth.scale.x = state === 'victory' || state === 'pickup' ? 1.35 : state === 'damage' || state === 'fall' ? 0.65 : 1.0;
    rig.mouth.scale.y = state === 'damage' || state === 'fall' ? 1.8 : 1.0;

    // Special Highway Surge aura
    const auraMat = rig.surgeAura.material as THREE.MeshBasicMaterial;
    auraMat.opacity = params.specialActive ? 0.55 + Math.sin(this.animTime * 12) * 0.2 : 0;
    rig.surgeAura.rotation.z += dt * 4;

    return state;
  }
}
