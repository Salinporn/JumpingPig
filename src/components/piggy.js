import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { GAME_CONSTANTS } from "../constants.js";

export class PiggyManager {
  constructor(piggy, state, keys, audio, velocity) {
    this.piggy = piggy;
    this.keys = keys;
    this.state = state;
    this.AudioManager = audio;
    this.velocity = velocity;
    this.rainbowHue = 0;
  }

  handlePiggyMovement() {
    // Horizontal movement
    if (this.keys["a"] || this.keys["ArrowLeft"]) {
      this.piggy.position.x -= GAME_CONSTANTS.PIGGY.MOVE_SPEED;
    }
    if (this.keys["d"] || this.keys["ArrowRight"]) {
      this.piggy.position.x += GAME_CONSTANTS.PIGGY.MOVE_SPEED;
    }

    // Jumping
    const currentTime = Date.now();
    if (
      (this.keys["w"] || this.keys["ArrowUp"] || this.keys[" "]) &&
      this.state.isGrounded &&
      currentTime - this.state.lastJumpTime >= this.state.dynamicJumpCooldown
    ) {
      this.jump(currentTime);
    }
  }

  jump(currentTime) {
    if (this.state.startTime === null) {
      this.state.startTime = currentTime;
    }

    this.velocity.y = this.state.jumpForce;
    this.state.isGrounded = false;
    this.state.hasJumped = true;
    this.state.lastJumpTime = currentTime;
    this.AudioManager.playSound("jump");
  }

  updatePiggyColor() {
    if (
      this.state.isImmune &&
      this.state.jumpForce === GAME_CONSTANTS.JUMP.SUPER
    ) {
      // Rainbow color for both shield and power up
      this.rainbowHue = (this.rainbowHue + 2) % 360;
      const rainbowColor = new THREE.Color().setHSL(
        this.rainbowHue / 360,
        1,
        0.5
      );
      this.piggy.traverse((child) => {
        if (child.isMesh) {
          child.material.color.copy(rainbowColor);
        }
      });
    } else if (this.state.isImmune) {
      // Blue for shield
      this.piggy.traverse((child) => {
        if (child.isMesh) {
          child.material.color.setHex(0xaad1e7);
        }
      });
    } else if (this.state.jumpForce === GAME_CONSTANTS.JUMP.SUPER) {
      // Yellow for super jump
      this.piggy.traverse((child) => {
        if (child.isMesh) {
          child.material.color.setHex(0xffff9f);
        }
      });
    } else {
      // Default color
      this.piggy.traverse((child) => {
        if (child.isMesh) {
          child.material.color.setHex(0xf4a1c8);
        }
      });
    }
  }
}
