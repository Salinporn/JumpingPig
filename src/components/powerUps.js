import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { GAME_CONSTANTS } from "../constants.js";

export class PowerUpManager {
  constructor(scene, state, piggy, piggyHalfWidth, star, shieldModel, tutorialManager, audio) {
    this.scene = scene;
    this.state = state;
    this.piggy = piggy;
    this.piggyHalfWidth = piggyHalfWidth;
    this.star = star;
    this.shieldModel = shieldModel;
    this.tutorialManager = tutorialManager;
    this.AudioManager = audio;
    this.shieldTimeout = null;
    this.superJumpTimeout = null;
    this.powerUps = [];
  }

  spawnPowerUp(platform) {
    const powerUp = this.star.clone();
    powerUp.type = "star";
    powerUp.position.set(
      platform.position.x,
      platform.position.y + GAME_CONSTANTS.STAR.Y_OFFSET,
      0
    );
    this.scene.add(powerUp);
    this.powerUps.push(powerUp);
  }

  spawnShield(platform) {
    const shield = this.shieldModel.clone();
    shield.type = "shield";
    shield.position.set(
      platform.position.x,
      platform.position.y + GAME_CONSTANTS.SHIELD.Y_OFFSET,
      0
    );

    shield.rotation.x = -Math.PI / 2;

    this.scene.add(shield);
    this.powerUps.push(shield);
  }

  handlePowerUps() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.powerUps[i];
      powerUp.position.y -= this.state.currentPlatformSpeed;
      if (powerUp.type === "shield") {
        powerUp.rotation.z += 0.02;
      } else {
        powerUp.rotation.y += 0.02;
      }

      // Remove off-screen power-ups
      if (powerUp.position.y < -20) {
        this.scene.remove(powerUp);
        this.powerUps.splice(i, 1);
        continue;
      }

      // Check collision with piggy
      const dx = this.piggy.position.x - powerUp.position.x;
      const dy = this.piggy.position.y - powerUp.position.y;
      const distanceSq = dx * dx + dy * dy;

      // Super jump tutorial
      if (
        !localStorage.getItem("hasSeenSuperJumpTutorial") &&
        distanceSq < (this.piggyHalfWidth + 1.5) ** 2 &&
        powerUp.type === "star"
      ) {
        localStorage.setItem("hasSeenSuperJumpTutorial", "true");
        this.tutorialManager.showInstructionOverlay("superJump");
        break;
      }

      if (
        !localStorage.getItem("hasSeenBulletShieldTutorial") &&
        powerUp.type === "shield"
      ) {
        this.state.hasSeenBulletShieldTutorial = true;
        localStorage.setItem("hasSeenBulletShieldTutorial", "true");
        this.tutorialManager.showInstructionOverlay("shield");
        return;
      }

      // Collect power-up/shield
      if (distanceSq < (this.piggyHalfWidth + 0.5) ** 2) {
        if (powerUp.type === "star") {
          this.collectPowerUp(powerUp, i);
        } else if (powerUp.type === "shield") {
          this.collectShield(powerUp, i);
        }
      }
    }
  }

  collectShield(shield, index) {
    this.scene.remove(shield);
    this.powerUps.splice(index, 1);
    this.AudioManager.playSound("star");
    this.activateShield();
  }

  activateShield() {
    if (this.shieldTimeout) clearTimeout(this.shieldTimeout);
    this.state.isImmune = true;

    this.shieldTimeout = setTimeout(() => {
      this.state.isImmune = false;
    }, GAME_CONSTANTS.SHIELD.DURATION);
  }

  collectPowerUp(powerUp, index) {
    this.scene.remove(powerUp);
    this.powerUps.splice(index, 1);
    this.AudioManager.playSound("star");
    this.activateSuperJump();
  }

  activateSuperJump() {
    if (this.superJumpTimeout) clearTimeout(this.superJumpTimeout);
    this.state.jumpForce = GAME_CONSTANTS.JUMP.SUPER;
    this.superJumpTimeout = setTimeout(() => {
      this.state.jumpForce = GAME_CONSTANTS.JUMP.NORMAL;
    }, 10000);
  }
}
