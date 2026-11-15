import type { ControlBindings, Vec3 } from '../types';

export interface PlayerMoveInput {
  forward: number; // -1..1
  right: number; // -1..1
  jumpPressed: boolean;
  jumpHeld: boolean;
  dashPressed: boolean;
  gravityPressed: boolean;
  timeSlowHeld: boolean;
  interactPressed: boolean;
}

export class PlayerController {
  public position: Vec3 = { x: 0, y: 1, z: 0 };
  public velocity: Vec3 = { x: 0, y: 0, z: 0 };
  public grounded = false;
  public coyoteTimer = 0;
  public jumpBufferTimer = 0;
  public dashCooldown = 0;
  public readonly maxDashCooldown = 1.35;
  public dashActiveTimer = 0;
  public dashCharge = 1.0; // 0..1 momentum charge
  public timeSlowEnergy = 1.0; // 0..1
  public squashY = 1.0;
  public squashXZ = 1.0;

  private prevJumpHeld = false;
  private prevJumpKey = false;
  private prevDashKey = false;
  private prevGravKey = false;
  private prevInteractKey = false;

  public reset(spawn: Vec3): void {
    this.position = { ...spawn };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.dashCooldown = 0;
    this.dashActiveTimer = 0;
    this.dashCharge = 1.0;
    this.timeSlowEnergy = 1.0;
    this.squashY = 1.0;
    this.squashXZ = 1.0;
    this.prevJumpHeld = false;
    this.prevJumpKey = false;
    this.prevDashKey = false;
    this.prevGravKey = false;
    this.prevInteractKey = false;
  }

  public sampleInput(keysPressed: Set<string>, bindings: ControlBindings): PlayerMoveInput {
    const f =
      (keysPressed.has(bindings.moveForward) || keysPressed.has('ArrowUp') ? 1 : 0) -
      (keysPressed.has(bindings.moveBackward) || keysPressed.has('ArrowDown') ? 1 : 0);
    const r =
      (keysPressed.has(bindings.moveRight) || keysPressed.has('ArrowRight') ? 1 : 0) -
      (keysPressed.has(bindings.moveLeft) || keysPressed.has('ArrowLeft') ? 1 : 0);

    const jumpDown = keysPressed.has(bindings.jump);
    const dashDown = keysPressed.has(bindings.dash) || keysPressed.has('ShiftRight');
    const gravDown = keysPressed.has(bindings.gravityShift);
    const interactDown = keysPressed.has(bindings.interact);
    const timeSlowDown = keysPressed.has(bindings.timeSlow);

    const input: PlayerMoveInput = {
      forward: f,
      right: r,
      jumpPressed: jumpDown && !this.prevJumpKey,
      jumpHeld: jumpDown,
      dashPressed: dashDown && !this.prevDashKey,
      gravityPressed: gravDown && !this.prevGravKey,
      interactPressed: interactDown && !this.prevInteractKey,
      timeSlowHeld: timeSlowDown,
    };

    this.prevJumpKey = jumpDown;
    this.prevDashKey = dashDown;
    this.prevGravKey = gravDown;
    this.prevInteractKey = interactDown;

    return input;
  }

  public applyMovementAndAbilities(
    dt: number,
    input: PlayerMoveInput,
    cameraYaw: number,
    upDir: Vec3,
    allowDash: boolean
  ): { jumped: boolean; dashed: boolean } {
    let jumped = false;
    let dashed = false;

    // 1. Update timers
    if (this.grounded) {
      this.coyoteTimer = 0.12;
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    }

    if (input.jumpPressed) {
      this.jumpBufferTimer = 0.13;
    } else {
      this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    }

    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }
    if (this.dashActiveTimer > 0) {
      this.dashActiveTimer = Math.max(0, this.dashActiveTimer - dt);
    }

    // Build momentum charge naturally + faster while moving fast
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.dashCharge = Math.min(1, this.dashCharge + dt * (0.45 + horizSpeed * 0.04));

    // 2. Camera-relative horizontal wish direction
    // Camera forward projected onto XZ plane: (-sin(yaw), 0, -cos(yaw))
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
    }

    const accel = this.grounded ? 42 : 23;
    const maxSpeed = this.dashActiveTimer > 0 ? 23 : 14.5;

    if (wishLen > 1e-4) {
      this.velocity.x += wishX * accel * dt;
      this.velocity.z += wishZ * accel * dt;

      // Soft cap horizontal speed without killing excess portal/dash momentum harshly
      const newHoriz = Math.hypot(this.velocity.x, this.velocity.z);
      if (newHoriz > maxSpeed && this.dashActiveTimer <= 0) {
        const damped = newHoriz + (maxSpeed - newHoriz) * (1 - Math.exp(-6 * dt));
        const ratio = damped / newHoriz;
        this.velocity.x *= ratio;
        this.velocity.z *= ratio;
      }
    } else {
      // Natural rolling friction on ground, gentle air drag
      const friction = this.grounded ? 5.2 : 0.65;
      const damp = Math.exp(-friction * dt);
      this.velocity.x *= damp;
      this.velocity.z *= damp;
    }

    // 3. Jump with Coyote Time + Input Buffering
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      const jumpImpulse = 11.4;
      // Clear opposing vertical velocity before applying jump along upDir
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
      this.squashY = 1.24;
      this.squashXZ = 0.84;
      jumped = true;
    }

    // Variable jump height cut on early release
    if (this.prevJumpHeld && !input.jumpHeld) {
      const vAlongUp =
        this.velocity.x * upDir.x + this.velocity.y * upDir.y + this.velocity.z * upDir.z;
      if (vAlongUp > 2.5) {
        this.velocity.x -= upDir.x * vAlongUp * 0.45;
        this.velocity.y -= upDir.y * vAlongUp * 0.45;
        this.velocity.z -= upDir.z * vAlongUp * 0.45;
      }
    }
    this.prevJumpHeld = input.jumpHeld;

    // 4. Momentum Dash
    if (allowDash && input.dashPressed && this.dashCooldown <= 0 && this.dashCharge >= 0.35) {
      const dirX = wishLen > 1e-4 ? wishX : fwdX;
      const dirZ = wishLen > 1e-4 ? wishZ : fwdZ;
      const dashSpeed = 19.5 + this.dashCharge * 4.5;
      this.velocity.x = dirX * dashSpeed;
      this.velocity.z = dirZ * dashSpeed;
      // Slight upward lift if falling so dashes feel heroic across chasms
      const vUp = this.velocity.y * upDir.y;
      if (vUp < 1.5) {
        this.velocity.y += upDir.y * 3.2;
      }
      this.dashCooldown = this.maxDashCooldown;
      this.dashActiveTimer = 0.24;
      this.dashCharge = Math.max(0, this.dashCharge - 0.65);
      this.squashY = 0.82;
      this.squashXZ = 1.22;
      dashed = true;
    }

    // 5. Exponentially damp squash & stretch back to 1.0
    const sqDamp = 1 - Math.exp(-14 * dt);
    this.squashY += (1.0 - this.squashY) * sqDamp;
    this.squashXZ += (1.0 - this.squashXZ) * sqDamp;

    return { jumped, dashed };
  }

  public triggerLandSquash(impactSpeed: number): void {
    const strength = Math.min(0.32, impactSpeed * 0.018);
    this.squashY = 1.0 - strength;
    this.squashXZ = 1.0 + strength * 0.7;
  }
}
