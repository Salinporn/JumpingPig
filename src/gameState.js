import { GAME_CONSTANTS } from "./constants.js";

// Game State
export class GameState {
  constructor() {
    this.reset();
  }

  reset() {
    this.score = 0;
    this.elapsedTime = 0;
    this.gameOver = false;
    this.isGrounded = true;
    this.hasJumped = false;
    this.gamePaused = false;
    this.countdownActive = false;
    this.backgroundIsWhite = false;
    this.startTime = null;
    this.lastJumpTime = 0;
    this.lastBulletSpawnTime = 0;
    this.lastBackgroundChangeTime = 0;
    this.platformSpawnTimer = 0;
    this.currentPlatformSpeed = GAME_CONSTANTS.PLATFORM.SPEED.INITIAL;
    this.jumpForce = GAME_CONSTANTS.JUMP.NORMAL;
    this.dynamicJumpCooldown = GAME_CONSTANTS.JUMP.COOLDOWN.MAX;
    this.pausedElapsedTime = 0;
  }
}
