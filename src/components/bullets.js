import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { GAME_CONSTANTS } from "../constants.js";

export class BulletManager {
    constructor(state, piggy, piggyHalfWidth, scene, appleModel, tutorialManager, audio) {
        this.state = state;
        this.piggy = piggy;
        this.piggyHalfWidth = piggyHalfWidth;
        this.scene = scene;
        this.appleModel = appleModel;
        this.tutorialManager = tutorialManager;
        this.AudioManager = audio;
        this.bullets = [];
        this.bulletPushForces = [];
    }

      handleBullets() {
        // Spawn new bullets
        if (
          this.state.elapsedTime >= 30 &&
          Date.now() - this.state.lastBulletSpawnTime >
            GAME_CONSTANTS.BULLET.SPAWN_INTERVAL
        ) {
          this.spawnBullet();
          this.state.lastBulletSpawnTime = Date.now();
        }
    
        for (let i = this.bullets.length - 1; i >= 0; i--) {
          const bullet = this.bullets[i];
          bullet.position.x += bullet.direction.x * GAME_CONSTANTS.BULLET.SPEED;
          bullet.rotation.y += 0.1;
    
          // Check collision with piggy
          const dx = this.piggy.position.x - bullet.position.x;
          const dy = this.piggy.position.y - bullet.position.y;
          const distanceSq = dx * dx + dy * dy;
    
          if (distanceSq < (this.piggyHalfWidth + 0.5) ** 2) {
            this.handleBulletCollision(bullet, i);
          }
    
          // Remove off-screen bullets
          if (Math.abs(bullet.position.x) > 25) {
            this.scene.remove(bullet);
            this.bullets.splice(i, 1);
          }
        }
      }

      spawnBullet() {
        if (!this.appleModel) return;
    
        // Tutorial
        if (!localStorage.getItem("hasSeenBulletShieldTutorial")) {
          localStorage.setItem("hasSeenBulletShieldTutorial", "true");
          this.tutorialManager.showInstructionOverlay("shield");
        }
    
        const apple = this.appleModel.clone();
    
        const side = Math.random() < 0.5 ? 0 : 1;
        const yPos = Math.random() * 15 - 5;
    
        if (side === 0) {
          // Left side
          apple.position.set(-12, yPos, 0);
          apple.direction = new THREE.Vector3(1, 0, 0);
        } else {
          // Right side
          apple.position.set(12, yPos, 0);
          apple.direction = new THREE.Vector3(-1, 0, 0);
        }
    
        this.scene.add(apple);
        this.bullets.push(apple);
      }

      handleBulletCollision(bullet, index) {
        if (this.state.isImmune) {
          this.scene.remove(bullet);
          this.bullets.splice(index, 1);
          return;
        }
        const pushDirection = bullet.direction.x > 0 ? 1 : -1;
    
        this.bulletPushForces.push({
          direction: pushDirection,
          magnitude: GAME_CONSTANTS.BULLET.PUSH_FORCE * 1.5,
          duration: GAME_CONSTANTS.BULLET.PUSH_DURATION,
        });
    
        this.AudioManager.playSound("bulletHit");
        this.scene.remove(bullet);
        this.bullets.splice(index, 1);
      }
}