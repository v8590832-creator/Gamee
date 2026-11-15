import type { ControlBindings, Vec3 } from '../types';

export interface PlayerMoveInput {
  forward: number;
  right: number;
  jumpPressed: boolean;
  jumpHeld: boolean;
  sprintHeld: boolean;
  slidePressed: boolean;
  slideHeld: boolean;
  bouncePressed: boolean;
  dashPressed: boolean;
  specialPressed: boolean;
  interactPressed: boolean;
}

export interface TouchInputState {
  moveForward: number; // -1..1
  moveRight: number; // -1..1
  jump: boolean;
  sprint: boolean;
  slide: boolean;
  bounce: boolean;
  dash: boolean;
  special: boolean;
  interact: boolean;
}

export class PlayerController {
  public position: Vec3 = { x: 0, y: 1, z: 0 };
  public velocity: Vec3 = { x: 0, y: 0, z: 0 };
  public facingYaw = Math.PI; // Facing -Z away from camera
  public grounded = false;
  public health = 3;
  public readonly maxHealth = 3;
  public invulnTimer = 0;

  public coyoteTimer = 0;
  public jumpBufferTimer = 0;
  public doubleJumpAvailable = true;

  public slideTimer = 0;
  public isSliding = false;
  public isSprinting = false;

  public bounceCooldown = 0;
  public readonly maxBounceCooldown = 1.6;
  public superBounceTimer = 0;

  public dashCooldown = 0;
  public readonly maxDashCooldown = 1.35;
  public dashActiveTimer = 0;
  public dashCharge = 1.0;

  public specialCooldown = 0;
  public readonly maxSpecialCooldown = 6.0;
  public specialActiveTimer = 0;
  public specialEnergy = 1.0;

  public squashY = 1.0;
  public squashXZ = 1.0;

  private prevJumpHeld = false;
  private prevJumpKey = false;
  private prevSlideKey = false;
  private prevBounceKey = false;
  private prevDashKey = false;
  private prevSpecialKey = false;
  private prevInteractKey = false;

  public reset(spawn: Vec3, yaw = 0): void {
    this.position = { ...spawn };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.facingYaw = yaw + Math.PI;
    this.grounded = false;
    this.health = this.maxHealth;
    this.invulnTimer = 0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.doubleJumpAvailable = true;
    this.slideTimer = 0;
    this.isSliding = false;
    this.isSprinting = false;
    this.bounceCooldown = 0;
    this.superBounceTimer = 0;
    this.dashCooldown = 0;
    this.dashActiveTimer = 0;
    this.dashCharge = 1.0;
    this.specialCooldown = 0;
    this.specialActiveTimer = 0;
    this.specialEnergy = 1.0;
    this.squashY = 1.0;
    this.squashXZ = 1.0;
    this.prevJumpHeld = false;
    this.prevJumpKey = false;
    this.prevSlideKey = false;
    this.prevBounceKey = false;
    this.prevDashKey = false;
    this.prevSpecialKey = false;
    this.prevInteractKey = false;
  }

  public sampleInput(
    keysPressed: Set<string>,
    bindings: ControlBindings,
    touch?: TouchInputState
  ): PlayerMoveInput {
    const kbF =
      (keysPressed.has(bindings.moveForward) || keysPressed.has('ArrowUp') ? 1 : 0) -
      (keysPressed.has(bindings.moveBackward) || keysPressed.has('ArrowDown') ? 1 : 0);
    const kbR =
      (keysPressed.has(bindings.moveRight) || keysPressed.has('ArrowRight') ? 1 : 0) -
      (keysPressed.has(bindings.moveLeft) || keysPressed.has('ArrowLeft') ? 1 : 0);

    const f = Math.max(-1, Math.min(1, kbF + (touch?.moveForward ?? 0)));
    const r = Math.max(-1, Math.min(1, kbR + (touch?.moveRight ?? 0)));

    const jumpDown = keysPressed.has(bindings.jump) || Boolean(touch?.jump);
    const sprintDown =
      keysPressed.has(bindings.sprint) || keysPressed.has('ShiftRight') || Boolean(touch?.sprint);
    const slideDown =
      keysPressed.has(bindings.slide) ||
      keysPressed.has('ControlRight') ||
      keysPressed.has('KeyC') ||
      Boolean(touch?.slide);
    const bounceDown = keysPressed.has(bindings.bounce) || Boolean(touch?.bounce);
    const dashDown = keysPressed.has(bindings.dash) || Boolean(touch?.dash);
    const specialDown = keysPressed.has(bindings.special) || Boolean(touch?.special);
    const interactDown = keysPressed.has(bindings.interact) || Boolean(touch?.interact);

    const input: PlayerMoveInput = {
      forward: f,
      right: r,
      jumpPressed: jumpDown && !this.prevJumpKey,
      jumpHeld: jumpDown,
      sprintHeld: sprintDown,
      slidePressed: slideDown && !this.prevSlideKey,
      slideHeld: slideDown,
      bouncePressed: bounceDown && !this.prevBounceKey,
      dashPressed: dashDown && !this.prevDashKey,
      specialPressed: specialDown && !this.prevSpecialKey,
      interactPressed: interactDown && !this.prevInteractKey,
    };

    this.prevJumpKey = jumpDown;
    this.prevSlideKey = slideDown;
    this.prevBounceKey = bounceDown;
    this.prevDashKey = dashDown;
    this.prevSpecialKey = specialDown;
    this.prevInteractKey = interactDown;

    return input;
  }

  public applyMovementAndAbilities(
    dt: number,
    input: PlayerMoveInput,
    cameraYaw: number,
    upDir: Vec3,
    allowDash: boolean,
    onSlippery = false
  ): {
    jumped: boolean;
    doubleJumped: boolean;
    superBounced: boolean;
    slid: boolean;
    dashed: boolean;
    specialActivated: boolean;
  } {
    let jumped = false;
    let doubleJumped = false;
    let superBounced = false;
    let slid = false;
    let dashed = false;
    let specialActivated = false;

    if (this.invulnTimer > 0) this.invulnTimer = Math.max(0, this.invulnTimer - dt);
    if (this.bounceCooldown > 0) this.bounceCooldown = Math.max(0, this.bounceCooldown - dt);
    if (this.superBounceTimer > 0) this.superBounceTimer = Math.max(0, this.superBounceTimer - dt);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    if (this.dashActiveTimer > 0) this.dashActiveTimer = Math.max(0, this.dashActiveTimer - dt);
    if (this.specialCooldown > 0) this.specialCooldown = Math.max(0, this.specialCooldown - dt);

    if (this.specialActiveTimer > 0) {
      this.specialActiveTimer = Math.max(0, this.specialActiveTimer - dt);
      this.specialEnergy = Math.max(0, this.specialEnergy - dt * 0.35);
    } else {
      this.specialEnergy = Math.min(1, this.specialEnergy + dt * 0.14);
    }

    if (this.grounded) {
      this.coyoteTimer = 0.13;
      this.doubleJumpAvailable = true;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.14;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.dashCharge = Math.min(1, this.dashCharge + dt * (0.45 + horizSpeed * 0.04));

    // Camera-relative horizontal wish direction
    const fwdX = -Math.sin(cameraYaw);
    const fwdZ = -Math.cos(cameraYaw);
    const rightX = Math.cos(cameraYaw);
    const rightZ = -Math.sin(cameraYaw);

    let wishX = fwdX * input.forward + rightX * input.right;
    let wishZ = fwdZ * input.forward + rightZ * input.right;
    const wishLen = Math.hypot(wishX, wishZ);
    if (wishLen > 1e-4) {
      wishX /= wishLen;
      wishZ /= wishLen;
      // Smoothly turn character toward wish movement direction
      const targetYaw = Math.atan2(wishX, wishZ);
      let diff = targetYaw - this.facingYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.facingYaw += diff * (1 - Math.exp(-14 * dt));
    }

    // Slide [Ctrl]
    if (input.slidePressed && this.grounded && this.slideTimer <= 0) {
      this.slideTimer = 0.55;
      const dirX = wishLen > 1e-4 ? wishX : Math.sin(this.facingYaw);
      const dirZ = wishLen > 1e-4 ? wishZ : Math.cos(this.facingYaw);
      const burst = Math.max(horizSpeed, 15.5);
      this.velocity.x = dirX * burst;
      this.velocity.z = dirZ * burst;
      slid = true;
    }
    if (this.slideTimer > 0) {
      this.slideTimer = Math.max(0, this.slideTimer - dt);
    }
    this.isSliding = this.grounded && (this.slideTimer > 0 || input.slideHeld) && horizSpeed > 2.0;

    // Sprint [Shift]
    this.isSprinting = input.sprintHeld && wishLen > 1e-4 && !this.isSliding;

    const surgeBoost = this.specialActiveTimer > 0 ? 1.25 : 1.0;
    const baseMaxSpeed = (this.isSprinting ? 17.5 : 13.0) * surgeBoost;
    const maxSpeed = this.dashActiveTimer > 0 ? 24.0 : baseMaxSpeed;
    const accel = (this.grounded ? (onSlippery ? 20 : 44) : 25) * (this.isSprinting ? 1.25 : 1.0);

    if (wishLen > 1e-4 && this.slideTimer <= 0.15) {
      this.velocity.x += wishX * accel * dt;
      this.velocity.z += wishZ * accel * dt;

      const newHoriz = Math.hypot(this.velocity.x, this.velocity.z);
      if (newHoriz > maxSpeed && this.dashActiveTimer <= 0) {
        const damped = newHoriz + (maxSpeed - newHoriz) * (1 - Math.exp(-7 * dt));
        const ratio = damped / newHoriz;
        this.velocity.x *= ratio;
        this.velocity.z *= ratio;
      }
    } else if (!this.isSliding) {
      const friction = this.grounded ? (onSlippery ? 1.6 : 6.0) : 0.7;
      const damp = Math.exp(-friction * dt);
      this.velocity.x *= damp;
      this.velocity.z *= damp;
    }

    // Jump + Double Jump
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      const jumpImpulse = 11.8 * (this.specialActiveTimer > 0 ? 1.12 : 1.0);
      const vAlongUp =
        this.velocity.x * upDir.x + this.velocity.y * upDir.y + this.velocity.z * upDir.z;
      if (vAlongUp < 0) {
        this.velocity.x -= upDir.x * vAlongUp;
        this.velocity.y -= upDir.y * vAlongUp;
        this.velocity.z -= upDir.z * vAlongUp;
      }
      this.velocity.x += upDir.x * jumpImpulse;
      this.velocity.y += upDir.y * jumpImpulse;
      this.velocity.z += upDir.z * jumpImpulse;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.slideTimer = 0;
      this.squashY = 1.22;
      this.squashXZ = 0.86;
      jumped = true;
    } else if (input.jumpPressed && !this.grounded && this.doubleJumpAvailable) {
      this.doubleJumpAvailable = false;
      this.jumpBufferTimer = 0;
      const djImpulse = 11.2;
      this.velocity.x = this.velocity.x * (1 - Math.abs(upDir.x)) + upDir.x * djImpulse;
      this.velocity.y = this.velocity.y * (1 - Math.abs(upDir.y)) + upDir.y * djImpulse;
      this.velocity.z = this.velocity.z * (1 - Math.abs(upDir.z)) + upDir.z * djImpulse;
      this.squashY = 1.25;
      this.squashXZ = 0.84;
      doubleJumped = true;
    }

    // Variable jump height cut
    if (this.prevJumpHeld && !input.jumpHeld) {
      const vAlongUp =
        this.velocity.x * upDir.x + this.velocity.y * upDir.y + this.velocity.z * upDir.z;
      if (vAlongUp > 3.0 && this.superBounceTimer <= 0) {
        this.velocity.x -= upDir.x * vAlongUp * 0.4;
        this.velocity.y -= upDir.y * vAlongUp * 0.4;
        this.velocity.z -= upDir.z * vAlongUp * 0.4;
      }
    }
    this.prevJumpHeld = input.jumpHeld;

    // Super Bounce Ability [Q]
    if (input.bouncePressed && this.bounceCooldown <= 0) {
      const bounceUp = 17.5;
      const fwdDirX = wishLen > 1e-4 ? wishX : Math.sin(this.facingYaw);
      const fwdDirZ = wishLen > 1e-4 ? wishZ : Math.cos(this.facingYaw);
      this.velocity.x = fwdDirX * Math.max(horizSpeed, 11.5);
      this.velocity.y = upDir.y * bounceUp;
      this.velocity.z = fwdDirZ * Math.max(horizSpeed, 11.5);
      this.grounded = false;
      this.bounceCooldown = this.maxBounceCooldown;
      this.superBounceTimer = 0.45;
      this.squashY = 1.32;
      this.squashXZ = 0.78;
      superBounced = true;
    }

    // Road Dash [V]
    if (allowDash && input.dashPressed && this.dashCooldown <= 0 && this.dashCharge >= 0.3) {
      const dirX = wishLen > 1e-4 ? wishX : fwdX;
      const dirZ = wishLen > 1e-4 ? wishZ : fwdZ;
      const dashSpeed = 21.0 + this.dashCharge * 4.5;
      this.velocity.x = dirX * dashSpeed;
      this.velocity.z = dirZ * dashSpeed;
      if (this.velocity.y * upDir.y < 2.0) {
        this.velocity.y += upDir.y * 3.5;
      }
      this.dashCooldown = this.maxDashCooldown;
      this.dashActiveTimer = 0.25;
      this.dashCharge = Math.max(0, this.dashCharge - 0.6);
      this.squashY = 0.84;
      this.squashXZ = 1.2;
      dashed = true;
    }

    // Special Ability: Highway Surge [F]
    if (input.specialPressed && this.specialCooldown <= 0 && this.specialEnergy >= 0.4) {
      this.specialActiveTimer = 3.2;
      this.specialCooldown = this.maxSpecialCooldown;
      specialActivated = true;
    }

    const sqDamp = 1 - Math.exp(-14 * dt);
    this.squashY += (1.0 - this.squashY) * sqDamp;
    this.squashXZ += (1.0 - this.squashXZ) * sqDamp;

    return { jumped, doubleJumped, superBounced, slid, dashed, specialActivated };
  }

  public triggerLandSquash(impactSpeed: number): void {
    const strength = Math.min(0.32, impactSpeed * 0.018);
    this.squashY = 1.0 - strength;
    this.squashXZ = 1.0 + strength * 0.7;
  }
}
