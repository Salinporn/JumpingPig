import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { GAME_CONSTANTS } from "../constants.js";

export class PlatformManager {
  constructor(scene, state, piggy, piggyHalfHeight, piggyHalfWidth, velocity, tutorialManager, star, shieldModel, PowerUpManager) {
    this.initialPlatformPositions = [
      { x: 0, y: -2 },
      { x: -4, y: 2 },
      { x: 4, y: 2 },
      { x: 0, y: 6 },
      { x: -2, y: 10 },
      { x: 2, y: 10 },
      { x: -3, y: 14 },
      { x: 3, y: 14 },
      { x: -1, y: 19 },
      { x: 1, y: 19 },
    ];

    this.scene = scene;
    this.state = state;
    this.platforms = [];
    this.initialPlatforms = [];
    this.piggy = piggy;
    this.piggyHalfHeight = piggyHalfHeight;
    this.piggyHalfWidth = piggyHalfWidth;
    this.velocity = velocity;
    this.tutorialManager = tutorialManager;
    this.star = star;
    this.shieldModel = shieldModel;
    this.PowerUpManager = PowerUpManager;
    this.createInitialPlatforms();
  }

  createInitialPlatforms() {
    const platformGeometry = new THREE.BoxGeometry(
      GAME_CONSTANTS.PLATFORM.SIZE.WIDTH,
      GAME_CONSTANTS.PLATFORM.SIZE.HEIGHT,
      GAME_CONSTANTS.PLATFORM.SIZE.DEPTH
    );

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.3,
      roughness: 0.7,
      flatShading: false,
    });

    this.initialPlatformPositions.forEach((pos) => {
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(pos.x, pos.y, 0);
      platform.isMoving = false;
      this.scene.add(platform);
      this.platforms.push(platform);
      this.initialPlatforms.push(platform);
    });
  }

  handlePlatforms() {
    // Spawn new platforms
    if (this.state.hasJumped) {
      this.state.platformSpawnTimer++;

      const dynamicSpawnInterval =
        GAME_CONSTANTS.PLATFORM.SPAWN.BASE_INTERVAL *
        (GAME_CONSTANTS.PLATFORM.SPEED.INITIAL /
          this.state.currentPlatformSpeed);

      if (this.state.platformSpawnTimer > dynamicSpawnInterval) {
        this.state.platformSpawnTimer = 0;
        this.spawnPlatform();
      }
    }

    this.state.isGrounded = false;

    for (let i = this.platforms.length - 1; i >= 0; i--) {
      const platform = this.platforms[i];

      if (this.state.hasJumped) {
        platform.position.y -= this.state.currentPlatformSpeed;
      }

      // Check collision with piggy
      if (this.checkPlatformCollision(platform)) {
        if (this.velocity.y < 0) {
          this.piggy.position.y =
            platform.position.y +
            GAME_CONSTANTS.PLATFORM.SIZE.HEIGHT / 2 +
            this.piggyHalfHeight;
          this.velocity.y = 0;
          this.state.isGrounded = true;
        }
      }

      // Remove off-screen platforms
      if (platform.position.y < -20) {
        this.scene.remove(platform);
        this.platforms.splice(i, 1);
      }

      // Move platforms
      if (this.state.elapsedTime >= 10 && platform.isMoving) {
        this.movePlatformSideToSide(platform);
      }
    }
  }

  checkPlatformCollision(platform) {
    return (
      this.piggy.position.y - this.piggyHalfHeight <=
        platform.position.y + GAME_CONSTANTS.PLATFORM.SIZE.HEIGHT / 2 &&
      this.piggy.position.y + this.piggyHalfHeight >=
        platform.position.y - GAME_CONSTANTS.PLATFORM.SIZE.HEIGHT / 2 &&
      this.piggy.position.x + this.piggyHalfWidth >
        platform.position.x - GAME_CONSTANTS.PLATFORM.SIZE.WIDTH / 2 &&
      this.piggy.position.x - this.piggyHalfWidth <
        platform.position.x + GAME_CONSTANTS.PLATFORM.SIZE.WIDTH / 2
    );
  }

  movePlatformSideToSide(platform) {
    const nextX = platform.position.x + platform.direction * platform.speed;

    if (
      nextX > platform.initialX + platform.movingRange ||
      nextX < platform.initialX - platform.movingRange
    ) {
      platform.direction *= -1;
      platform.position.x += platform.direction * platform.speed;
    } else {
      platform.position.x = nextX;
    }
  }

  spawnPlatform() {
    const platformGeometry = new THREE.BoxGeometry(
      GAME_CONSTANTS.PLATFORM.SIZE.WIDTH,
      GAME_CONSTANTS.PLATFORM.SIZE.HEIGHT,
      GAME_CONSTANTS.PLATFORM.SIZE.DEPTH
    );

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x808080,
      metalness: 0.3,
      roughness: 0.7,
      flatShading: false,
    });

    const newPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
    newPlatform.position.y = GAME_CONSTANTS.PLATFORM.SPAWN.HEIGHT;
    newPlatform.position.x = (Math.random() - 0.5) * 8;
    newPlatform.isMoving = false;

    if (
      this.state.elapsedTime >= 10 &&
      Math.random() < GAME_CONSTANTS.PLATFORM.SPAWN.MOVING_CHANCE
    ) {
      newPlatform.isMoving = true;
      newPlatform.direction = Math.random() < 0.5 ? -1 : 1;
      newPlatform.speed = GAME_CONSTANTS.PLATFORM.SPAWN.MOVING_SPEED;
      newPlatform.initialX = newPlatform.position.x;
      newPlatform.movingRange = GAME_CONSTANTS.PLATFORM.SPAWN.MOVING_RANGE;

      // moving platform tutorial
      if (!localStorage.getItem("hasSeenMovingPlatformTutorial")) {
        localStorage.setItem("hasSeenMovingPlatformTutorial", "true");
        setTimeout(() => this.tutorialManager.showInstructionOverlay("movingPlatform"), 500);
      }
    }

    // Spawn power-up
    if (
      !newPlatform.isMoving &&
      Math.random() < GAME_CONSTANTS.STAR.SPAWN_CHANCE &&
      this.star
    ) {
      this.PowerUpManager.spawnPowerUp(newPlatform);
    }

    // Spawn shield
    if (
      !newPlatform.isMoving &&
      Math.random() < GAME_CONSTANTS.SHIELD.SPAWN_CHANCE &&
      this.shieldModel
    ) {
      this.PowerUpManager.spawnShield(newPlatform);
    }

    this.platforms.push(newPlatform);
    this.scene.add(newPlatform);
  }
}
