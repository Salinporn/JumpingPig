import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.119/examples/jsm/loaders/OBJLoader.js";
import { GAME_CONSTANTS } from "./constants.js";
import { GameState } from "./gameState.js";
import { AudioManager } from "./components/audio.js";
import { PlatformManager } from "./components/platform.js";
import { PiggyManager } from "./components/piggy.js";
import { TutorialManager } from "./components/tutorial.js";
import { BulletManager } from "./components/bullets.js";
import { PowerUpManager } from "./components/powerUps.js";

// Main Game Class
class PiggyJumpGame {
  constructor() {
    this.state = new GameState();
    this.highestTime = parseFloat(localStorage.getItem("highestTime")) || 0;
    this.timeDisplay = document.getElementById("time");
    this.bestTimeDisplay = document.getElementById("best");

    this.initScene();
    this.audioManager = new AudioManager(this.camera);
    this.tutorialManager = new TutorialManager(this.state, this.audioManager, this);
    this.initUI();
  }

  initScene() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(
      GAME_CONSTANTS.BACKGROUND.COLORS.NIGHT
    );

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 20;
    this.audioManager = new AudioManager(this.camera);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 5, 10);
    this.scene.add(directionalLight);

    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = new THREE.Vector3(0, GAME_CONSTANTS.GRAVITY, 0);

    this.initEventListeners();
    this.loadAssets();
  }

  initUI() {
    this.createInfoPanel();
    this.createSoundSettings();
  }

  createInfoPanel() {
    this.infoDiv = document.createElement("div");
    this.infoDiv.id = "info";
    Object.assign(this.infoDiv.style, {
      position: "absolute",
      top: "10px",
      width: "300px",
      textAlign: "left",
      color: "white",
      fontFamily: "Arial, sans-serif",
      pointerEvents: "none",
      textShadow: "1px 1px 1px black",
      padding: "50px",
    });

    this.instructionsImg = document.createElement("img");
    this.instructionsImg.id = "instructions";
    this.instructionsImg.alt = "Instructions";
    this.instructionsImg.width = 400;
    this.instructionsImg.src = "assets/images/instructions.png";
    this.infoDiv.appendChild(this.instructionsImg);

    document.body.appendChild(this.infoDiv);
  }

  createSoundSettings() {
    const soundSettingsDiv = document.createElement("div");
    Object.assign(soundSettingsDiv.style, {
      marginTop: "20px",
      padding: "10px",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      borderRadius: "8px",
      color: "white",
      fontFamily: "Arial, sans-serif",
      width: "380px",
      pointerEvents: "auto",
    });

    // Title
    const settingsTitle = document.createElement("h3");
    settingsTitle.textContent = "Sound Settings";
    Object.assign(settingsTitle.style, {
      margin: "0 0 10px 0",
      fontSize: "16px",
      fontWeight: "bold",
    });
    soundSettingsDiv.appendChild(settingsTitle);

    // Volume controls
    soundSettingsDiv.appendChild(
      this.createVolumeControl(
        "BGM",
        this.audioManager.audio.bgmVolume,
        (volume) => {
          if (!this.audioManager.audio.isMuted) {
            this.audioManager.audio.bgmVolume = volume;
            if (this.audioManager.audio.sounds.bgMusic)
              this.audioManager.audio.sounds.bgMusic.setVolume(volume);
            if (this.audioManager.audio.sounds.bgGameOver)
              this.audioManager.audio.sounds.bgGameOver.setVolume(volume);
          }
        }
      )
    );

    soundSettingsDiv.appendChild(
      this.createVolumeControl(
        "SFX",
        this.audioManager.audio.sfxVolume,
        (volume) => {
          if (!this.audioManager.audio.isMuted) {
            this.audioManager.audio.sfxVolume = volume;
            if (this.audioManager.audio.sounds.jump)
              this.audioManager.audio.sounds.jump.setVolume(
                volume + GAME_CONSTANTS.AUDIO.JUMP_VOLUME_OFFSET
              );
            if (this.audioManager.audio.sounds.star)
              this.audioManager.audio.sounds.star.setVolume(volume);
            if (this.audioManager.audio.sounds.click)
              this.audioManager.audio.sounds.click.setVolume(volume);
          }
        }
      )
    );

    // Mute button
    soundSettingsDiv.appendChild(this.createMuteButton());
    this.infoDiv.appendChild(soundSettingsDiv);
  }

  createVolumeControl(label, initialValue, onChange) {
    const container = document.createElement("div");
    Object.assign(container.style, {
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
    });

    const labelElement = document.createElement("label");
    labelElement.textContent = `${label}: `;
    Object.assign(labelElement.style, {
      flexBasis: "50px",
      fontSize: "14px",
    });
    container.appendChild(labelElement);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.value = initialValue * 100;
    slider.style.flex = "1";

    slider.addEventListener("input", () => {
      const volume = slider.value / 100;
      onChange(volume);
      slider.blur();
    });

    container.appendChild(slider);
    return container;
  }

  createMuteButton() {
    const muteContainer = document.createElement("div");
    muteContainer.style.display = "flex";
    muteContainer.style.justifyContent = "center";

    this.muteButton = document.createElement("button");
    this.muteButton.textContent = "Mute";
    Object.assign(this.muteButton.style, {
      padding: "5px 15px",
      backgroundColor: "#ea3d8c",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      transition: "background-color 0.2s",
    });

    this.muteButton.addEventListener("mouseover", () => {
      this.muteButton.style.backgroundColor = "#f07ab3";
    });

    this.muteButton.addEventListener("mouseout", () => {
      this.muteButton.style.backgroundColor = this.audioManager.audio.isMuted
        ? "#555555"
        : "#ea3d8c";
    });

    this.muteButton.addEventListener("click", () => {
      this.toggleMute();
      this.muteButton.blur();
    });

    muteContainer.appendChild(this.muteButton);
    return muteContainer;
  }

  toggleMute() {
    this.audioManager.audio.isMuted = !this.audioManager.audio.isMuted;
    this.audioManager.playSound("click");

    if (this.audioManager.audio.isMuted) {
      this.muteButton.textContent = "Unmute";
      this.muteButton.style.backgroundColor = "#555555";
    } else {
      this.muteButton.textContent = "Mute";
      this.muteButton.style.backgroundColor = "#ea3d8c";
    }

    // Update sounds
    const volume = this.audioManager.audio.isMuted ? 0 : 1;
    Object.keys(this.audioManager.audio.sounds).forEach((key) => {
      const sound = this.audioManager.audio.sounds[key];
      if (sound) {
        sound.setVolume(
          this.audioManager.audio.isMuted
            ? 0
            : key === "bgMusic" || key === "bgGameOver"
            ? this.audioManager.audio.bgmVolume
            : key === "jump"
            ? this.audioManager.audio.sfxVolume +
              GAME_CONSTANTS.AUDIO.JUMP_VOLUME_OFFSET
            : this.audioManager.audio.sfxVolume
        );
      }
    });
  }

  initEventListeners() {
    // Keyboard input
    this.keys = {};
    window.addEventListener("keydown", (e) => (this.keys[e.key] = true));
    window.addEventListener("keyup", (e) => (this.keys[e.key] = false));

    // Window resize
    window.addEventListener("resize", () => this.onWindowResize());
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  loadAssets() {
    const objLoader = new OBJLoader();

    // Load piggy model
    objLoader.load(
      "assets/models/piggy.obj",
      (object) => {
        this.piggy = object;
        let firstMesh = null;

        object.traverse((child) => {
          if (child.isMesh) {
            firstMesh = child;
            child.material = new THREE.MeshStandardMaterial({
              color: 0xf4a1c8,
              side: THREE.DoubleSide,
            });
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        if (firstMesh) {
          firstMesh.geometry.computeBoundingBox();
          const bb = firstMesh.geometry.boundingBox;
          this.piggyHalfHeight = (bb.max.y - bb.min.y) / 2;
          this.piggyHalfWidth = (bb.max.x - bb.min.x) / 2;
        }

        this.piggy.position.set(0, 0, 0);
        this.piggy.scale.set(
          GAME_CONSTANTS.PIGGY.SCALE,
          GAME_CONSTANTS.PIGGY.SCALE,
          GAME_CONSTANTS.PIGGY.SCALE
        );
        this.scene.add(this.piggy);
        this.piggyManager = new PiggyManager(
          this.piggy,
          this.state,
          this.keys,
          this.audioManager,
          this.velocity
        );
        // Load star model
        objLoader.load(
          "assets/models/Star.obj",
          (object) => {
            this.star = object;
            object.traverse((child) => {
              if (child.isMesh) {
                child.material = new THREE.MeshStandardMaterial({
                  color: 0xffff00,
                  emissive: 0xffff00,
                  emissiveIntensity: 0.5,
                  side: THREE.DoubleSide,
                });
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            this.star.scale.set(
              GAME_CONSTANTS.STAR.SCALE,
              GAME_CONSTANTS.STAR.SCALE,
              GAME_CONSTANTS.STAR.SCALE
            );

            // Load apple model
            objLoader.load(
              "assets/models/Apple.obj",
              (object) => {
                this.appleModel = object;
                object.traverse((child) => {
                  if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({
                      color: 0xff0000,
                      emissive: 0x550000,
                      emissiveIntensity: 0.2,
                      side: THREE.DoubleSide,
                    });
                    child.castShadow = true;
                    child.receiveShadow = true;
                  }
                });

                this.appleModel.scale.set(0.015, 0.015, 0.015);

                // Load shield model
                objLoader.load(
                  "assets/models/shield.obj",
                  (object) => {
                    this.shieldModel = object;
                    object.traverse((child) => {
                      if (child.isMesh) {
                        child.material = new THREE.MeshStandardMaterial({
                          color: 0x0099ff,
                          emissive: 0x0044aa,
                          emissiveIntensity: 0.5,
                          transparent: true,
                          opacity: 0.8,
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;
                      }
                    });
                    this.shieldModel.scale.set(
                      GAME_CONSTANTS.SHIELD.SCALE,
                      GAME_CONSTANTS.SHIELD.SCALE,
                      GAME_CONSTANTS.SHIELD.SCALE
                    );

                    // Create Bullets
                    this.bulletManager = new BulletManager(
                      this.state,
                      this.piggy,
                      this.piggyHalfWidth,
                      this.scene,
                      this.appleModel,
                      this.tutorialManager,
                      this.audioManager
                    );

                    // Create Power up items
                    this.powerUpManager = new PowerUpManager(
                      this.scene,
                      this.state,
                      this.piggy,
                      this.piggyHalfWidth,
                      this.star,
                      this.shieldModel,
                      this.tutorialManager,
                      this.audioManager
                    );

                    // Create initial platforms
                    this.platformManager = new PlatformManager(
                      this.scene,
                      this.state,
                      this.piggy,
                      this.piggyHalfHeight,
                      this.piggyHalfWidth,
                      this.velocity,
                      this.tutorialManager,
                      this.star,
                      this.shieldModel,
                      this.powerUpManager
                    );

                    this.startGame();
                  },
                  undefined,
                  (err) => console.error("Error loading shield model:", err)
                );
              },
              undefined,
              (err) => console.error("Error loading apple model:", err)
            );
          },
          undefined,
          (err) => console.error("Error loading star model:", err)
        );
      },
      undefined,
      (err) => console.error("Error loading piggy model:", err)
    );
  }

  startGame() {
    this.state.reset();
    this.piggy.position.set(0, -1.25, 0);
    this.velocity.set(0, 0, 0);
    this.scene.background = new THREE.Color(
      GAME_CONSTANTS.BACKGROUND.COLORS.NIGHT
    );
    this.instructionsImg.src = "assets/images/instructions.png";

    // Clear non-initial platforms
    this.platformManager.platforms.forEach((platform) => {
      if (!this.platformManager.initialPlatforms.includes(platform)) {
        this.scene.remove(platform);
      }
    });
    this.platformManager.platforms = [...this.platformManager.initialPlatforms];

    // Reset initial platforms positions
    this.platformManager.initialPlatforms.forEach((platform, index) => {
      platform.position.set(
        this.platformManager.initialPlatformPositions[index].x,
        this.platformManager.initialPlatformPositions[index].y,
        0
      );
    });

    this.animate();
  }

  animate() {
    if (
      this.state.gameOver ||
      !this.piggy ||
      this.state.gamePaused ||
      this.state.countdownActive
    ) {
      return;
    }

    requestAnimationFrame(() => this.animate());

    this.updatePhysics();
    this.updateGameState();
    this.platformManager.handlePlatforms();
    this.powerUpManager.handlePowerUps();
    this.bulletManager.handleBullets();
    this.piggyManager.handlePiggyMovement();
    this.checkGameOver();
    this.updateUI();
    this.piggyManager.updatePiggyColor();

    this.renderer.render(this.scene, this.camera);
  }

  updateUI() {
    this.timeDisplay.textContent = `Time: ${this.state.elapsedTime.toFixed(
      2
    )} s`;
    this.bestTimeDisplay.textContent = `Best: ${this.highestTime.toFixed(2)} s`;
  }

  updatePhysics() {
    this.velocity.add(this.gravity);
    this.piggy.position.add(this.velocity);

    // Bullet push forces
    for (let i = this.bulletManager.bulletPushForces.length - 1; i >= 0; i--) {
      const force = this.bulletManager.bulletPushForces[i];
      this.velocity.x += force.direction * force.magnitude;
      force.magnitude *= GAME_CONSTANTS.BULLET.PUSH_DECAY;
      force.duration--;

      if (force.duration <= 0 || force.magnitude < 0.001) {
        this.bulletManager.bulletPushForces.splice(i, 1);
      }
    }

    this.velocity.x = THREE.MathUtils.clamp(
      this.velocity.x,
      -GAME_CONSTANTS.BULLET.PUSH_MAX_SPEED * 1.5,
      GAME_CONSTANTS.BULLET.PUSH_MAX_SPEED * 1.5
    );
  }

  updateGameState() {
    // platform speed and jump cooldown
    this.state.currentPlatformSpeed = Math.min(
      GAME_CONSTANTS.PLATFORM.SPEED.INITIAL +
        this.state.elapsedTime * GAME_CONSTANTS.PLATFORM.SPEED.INCREASE_RATE,
      GAME_CONSTANTS.PLATFORM.SPEED.MAX
    );

    this.state.dynamicJumpCooldown = Math.max(
      GAME_CONSTANTS.JUMP.COOLDOWN.MAX -
        this.state.elapsedTime * GAME_CONSTANTS.JUMP.COOLDOWN.DECAY_RATE,
      GAME_CONSTANTS.JUMP.COOLDOWN.MIN
    );

    if (this.state.hasJumped && this.state.startTime !== null) {
      this.state.elapsedTime = (Date.now() - this.state.startTime) / 1000;
    }

    // Handle background color change
    if (
      this.state.elapsedTime - this.state.lastBackgroundChangeTime >
      GAME_CONSTANTS.BACKGROUND.CHANGE_INTERVAL
    ) {
      this.state.lastBackgroundChangeTime = this.state.elapsedTime;
      this.state.backgroundIsWhite = !this.state.backgroundIsWhite;

      const isDay = this.state.backgroundIsWhite;
      this.scene.background = new THREE.Color(
        isDay
          ? GAME_CONSTANTS.BACKGROUND.COLORS.DAY
          : GAME_CONSTANTS.BACKGROUND.COLORS.NIGHT
      );

      const textColor = isDay ? "black" : "white";
      const textShadow = isDay
        ? "1px 1px 1px rgba(255, 255, 255, 0.7)"
        : "1px 1px 1px rgba(0, 0, 0, 0.7)";

      this.infoDiv.style.color = textColor;
      this.infoDiv.style.textShadow = textShadow;
      this.timeDisplay.style.color = textColor;
      this.bestTimeDisplay.style.color = textColor;
      this.instructionsImg.src = isDay
        ? "assets/images/instructions2.png"
        : "assets/images/instructions.png";
    }
  }

  checkGameOver() {
    if (this.piggy.position.y < -window.innerHeight / 20) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state.gameOver = true;

    if (
      this.audioManager.audio.sounds.bgMusic &&
      this.audioManager.audio.sounds.bgMusic.isPlaying
    ) {
      this.audioManager.audio.sounds.bgMusic.stop();
    }

    if (
      this.audioManager.audio.sounds.bgGameOver &&
      !this.audioManager.audio.isMuted
    ) {
      this.audioManager.audio.sounds.bgGameOver.play();
    }

    // Update highest score
    if (this.state.elapsedTime > this.highestTime) {
      this.highestTime = this.state.elapsedTime;
      localStorage.setItem("highestTime", this.highestTime.toString());
    }

    // Show game over screen
    this.showGameOverScreen();
  }

  showGameOverScreen() {
    const overlay = document.createElement("div");
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "24px",
      zIndex: "1000",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
    });

    // Game over image
    const image = document.createElement("img");
    image.src = "assets/images/gameover.png";
    image.alt = "Game Over";
    Object.assign(image.style, {
      width: "400px",
      marginBottom: "30px",
    });
    overlay.appendChild(image);

    // Stats display
    const message = document.createElement("div");
    Object.assign(message.style, {
      textAlign: "left",
      width: "100%",
      maxWidth: "400px",
    });

    message.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 1.2rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Time Survived:</span> 
          <span style="font-weight: bold;">${this.state.elapsedTime.toFixed(
            2
          )} s</span>
        </div>
        <hr style="border: 0; height: 1px; background: #ccc; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span>Best Time:</span> 
          <span style="font-weight: bold;">${this.highestTime.toFixed(
            2
          )} s</span>
        </div>
      </div>
    `;

    overlay.appendChild(message);

    // Restart button
    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart";
    Object.assign(restartButton.style, {
      marginTop: "20px",
      padding: "12px 24px",
      fontSize: "1rem",
      cursor: "pointer",
      backgroundColor: "#ea3d8c",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      boxShadow: "0 5px 15px rgba(234, 61, 140, 0.3)",
      transition: "all 0.3s ease",
    });

    restartButton.addEventListener("mouseover", () => {
      restartButton.style.backgroundColor = "#f07ab3";
    });

    restartButton.addEventListener("mouseout", () => {
      restartButton.style.backgroundColor = "#ea3d8c";
    });

    restartButton.addEventListener("click", () => {
      this.audioManager.playSound("click");
      document.body.removeChild(overlay);

      if (
        this.audioManager.audio.sounds.bgGameOver &&
        this.audioManager.audio.sounds.bgGameOver.isPlaying
      ) {
        this.audioManager.audio.sounds.bgGameOver.stop();
      }

      this.restartGame();
    });

    overlay.appendChild(restartButton);
    document.body.appendChild(overlay);
  }

  restartGame() {
    this.state.gameOver = false;
    this.state.currentPlatformSpeed = GAME_CONSTANTS.PLATFORM.SPEED.INITIAL;
    this.piggy.position.set(0, -1.25, 0);
    this.velocity.set(0, 0, 0);
    this.state.startTime = null;
    this.state.hasJumped = false;
    this.state.isGrounded = true;
    this.state.lastJumpTime = 0;
    this.state.elapsedTime = 0;
    this.state.jumpForce = GAME_CONSTANTS.JUMP.NORMAL;
    this.state.backgroundIsWhite = false;
    this.state.isImmune = false;
    this.scene.background = new THREE.Color(
      GAME_CONSTANTS.BACKGROUND.COLORS.NIGHT
    );
    this.state.lastBackgroundChangeTime = 0;
    this.instructionsImg.src = "assets/images/instructions.png";
    this.timeDisplay.style.color = "white";
    this.bestTimeDisplay.style.color = "white";
    this.infoDiv.style.textShadow = "1px 1px 1px rgba(0, 0, 0, 0.7)";

    // Clear
    this.bulletManager.bullets.forEach((bullet) => this.scene.remove(bullet));
    this.bulletManager.bullets = [];
    this.bulletManager.bulletPushForces = [];

    this.powerUps.forEach((powerUp) => this.scene.remove(powerUp));
    this.powerUps = [];

    this.platformManager.platforms.forEach((platform) => {
      if (!this.platformManager.initialPlatforms.includes(platform)) {
        this.scene.remove(platform);
      }
    });
    this.platformManager.platforms = [...this.platformManager.initialPlatforms];

    // Reset initial platforms
    this.platformManager.initialPlatforms.forEach((platform, index) => {
      platform.isMoving = false;
      if (!this.scene.children.includes(platform)) {
        this.scene.add(platform);
      }
      platform.position.set(
        this.platformManager.initialPlatformPositions[index].x,
        this.platformManager.initialPlatformPositions[index].y,
        0
      );
    });

    if (
      this.audioManager.audio.sounds.bgMusic &&
      !this.audioManager.audio.sounds.bgMusic.isPlaying &&
      !this.audioManager.audio.isMuted
    ) {
      this.audioManager.audio.sounds.bgMusic.play();
    }

    // Clear super jump timeout
    if (this.superJumpTimeout) {
      clearTimeout(this.superJumpTimeout);
      this.superJumpTimeout = null;
    }

    // Reset Color
    this.piggy.traverse((child) => {
      if (child.isMesh) {
        child.material.color.setHex(0xf4a1c8);
      }
    });

    this.animate();
  }
}

window.addEventListener("load", () => {
  const game = new PiggyJumpGame();
});
