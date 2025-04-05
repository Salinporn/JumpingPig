import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.119/examples/jsm/loaders/OBJLoader.js";
import { GAME_CONSTANTS } from "./constants.js";
import { GameState } from "./gameState.js";
import { AudioManager } from "./audio.js";

// Main Game Class
class PiggyJumpGame {
  constructor() {
    this.state = new GameState();
    this.highestTime = parseFloat(localStorage.getItem("highestTime")) || 0;
    this.timeDisplay = document.getElementById("time");
    this.bestTimeDisplay = document.getElementById("best");
    this.rainbowHue = 0;

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

    this.initScene();
    this.AudioManager.initAudio();
    this.initUI();
    this.initEventListeners();
    this.loadAssets();
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
    this.AudioManager = new AudioManager(this.camera);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 5, 10);
    this.scene.add(directionalLight);

    // Game objects
    this.platforms = [];
    this.initialPlatforms = [];
    this.powerUps = [];
    this.bullets = [];
    this.bulletPushForces = [];

    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = new THREE.Vector3(0, GAME_CONSTANTS.GRAVITY, 0);

    // Create initial platforms
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
      flatShading: false
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
      this.createVolumeControl("BGM", this.AudioManager.audio.bgmVolume, (volume) => {
        if (!this.AudioManager.audio.isMuted) {
          this.AudioManager.audio.bgmVolume = volume;
          if (this.AudioManager.audio.sounds.bgMusic)
            this.AudioManager.audio.sounds.bgMusic.setVolume(volume);
          if (this.AudioManager.audio.sounds.bgGameOver)
            this.AudioManager.audio.sounds.bgGameOver.setVolume(volume);
        }
      })
    );

    soundSettingsDiv.appendChild(
      this.createVolumeControl("SFX", this.AudioManager.audio.sfxVolume, (volume) => {
        if (!this.AudioManager.audio.isMuted) {
          this.AudioManager.audio.sfxVolume = volume;
          if (this.AudioManager.audio.sounds.jump)
            this.AudioManager.audio.sounds.jump.setVolume(
              volume + GAME_CONSTANTS.AUDIO.JUMP_VOLUME_OFFSET
            );
          if (this.AudioManager.audio.sounds.star) this.AudioManager.audio.sounds.star.setVolume(volume);
          if (this.AudioManager.audio.sounds.click)
            this.AudioManager.audio.sounds.click.setVolume(volume);
        }
      })
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
      this.muteButton.style.backgroundColor = this.AudioManager.audio.isMuted
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
    this.AudioManager.audio.isMuted = !this.AudioManager.audio.isMuted;
    this.AudioManager.playSound("click");

    if (this.AudioManager.audio.isMuted) {
      this.muteButton.textContent = "Unmute";
      this.muteButton.style.backgroundColor = "#555555";
    } else {
      this.muteButton.textContent = "Mute";
      this.muteButton.style.backgroundColor = "#ea3d8c";
    }

    // Update sounds
    const volume = this.AudioManager.audio.isMuted ? 0 : 1;
    Object.keys(this.AudioManager.audio.sounds).forEach((key) => {
      const sound = this.AudioManager.audio.sounds[key];
      if (sound) {
        sound.setVolume(
          this.AudioManager.audio.isMuted
            ? 0
            : key === "bgMusic" || key === "bgGameOver"
            ? this.AudioManager.audio.bgmVolume
            : key === "jump"
            ? this.AudioManager.audio.sfxVolume + GAME_CONSTANTS.AUDIO.JUMP_VOLUME_OFFSET
            : this.AudioManager.audio.sfxVolume
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
          },
          undefined,
          (err) => console.error("Error loading star model:", err)
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
          },
          undefined,
          (err) => console.error("Error loading apple model:", err)
        );

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
          },
          undefined,
          (err) => console.error("Error loading shield model:", err)
        );

        this.startGame();
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
    this.platforms.forEach((platform) => {
      if (!this.initialPlatforms.includes(platform)) {
        this.scene.remove(platform);
      }
    });
    this.platforms = [...this.initialPlatforms];

    // Reset initial platforms positions
    this.initialPlatforms.forEach((platform, index) => {
      platform.position.set(
        this.initialPlatformPositions[index].x,
        this.initialPlatformPositions[index].y,
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
    this.handlePlatforms();
    this.handlePowerUps();
    this.handleBullets();
    this.handlePiggyMovement();
    this.checkGameOver();
    this.updateUI();
    this.updatePiggyColor();

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
    for (let i = this.bulletPushForces.length - 1; i >= 0; i--) {
      const force = this.bulletPushForces[i];
      this.velocity.x += force.direction * force.magnitude;
      force.magnitude *= GAME_CONSTANTS.BULLET.PUSH_DECAY;
      force.duration--;

      if (force.duration <= 0 || force.magnitude < 0.001) {
        this.bulletPushForces.splice(i, 1);
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
      flatShading: false
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
        setTimeout(() => this.showInstructionOverlay("movingPlatform"), 500);
      }
    }

    // Spawn power-up
    if (
      !newPlatform.isMoving &&
      Math.random() < GAME_CONSTANTS.STAR.SPAWN_CHANCE &&
      this.star
    ) {
      this.spawnPowerUp(newPlatform);
    }

    // Spawn shield
    if (
      !newPlatform.isMoving &&
      Math.random() < GAME_CONSTANTS.SHIELD.SPAWN_CHANCE &&
      this.shieldModel
    ) {
      this.spawnShield(newPlatform);
    }

    this.platforms.push(newPlatform);
    this.scene.add(newPlatform);
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
        this.showInstructionOverlay("superJump");
        break;
      }

      if (
        !localStorage.getItem("hasSeenBulletShieldTutorial") &&
        powerUp.type === "shield"
      ) {
        this.state.hasSeenBulletShieldTutorial = true;
        localStorage.setItem("hasSeenBulletShieldTutorial", "true");
        this.showInstructionOverlay("shield");
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

  handleBullets() {
    // Spawn new bullets
    if (
      this.state.elapsedTime >= 10 &&
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
      this.showInstructionOverlay("shield");
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

  checkGameOver() {
    if (this.piggy.position.y < -window.innerHeight / 20) {
      this.gameOver();
    }
  }

  gameOver() {
    this.state.gameOver = true;

    if (this.AudioManager.audio.sounds.bgMusic && this.AudioManager.audio.sounds.bgMusic.isPlaying) {
      this.AudioManager.audio.sounds.bgMusic.stop();
    }

    if (this.AudioManager.audio.sounds.bgGameOver && !this.AudioManager.audio.isMuted) {
      this.AudioManager.audio.sounds.bgGameOver.play();
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
      this.AudioManager.playSound("click");
      document.body.removeChild(overlay);

      if (
        this.AudioManager.audio.sounds.bgGameOver &&
        this.AudioManager.audio.sounds.bgGameOver.isPlaying
      ) {
        this.AudioManager.audio.sounds.bgGameOver.stop();
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
    this.bullets.forEach((bullet) => this.scene.remove(bullet));
    this.bullets = [];
    this.bulletPushForces = [];

    this.powerUps.forEach((powerUp) => this.scene.remove(powerUp));
    this.powerUps = [];

    this.platforms.forEach((platform) => {
      if (!this.initialPlatforms.includes(platform)) {
        this.scene.remove(platform);
      }
    });
    this.platforms = [...this.initialPlatforms];

    // Reset initial platforms
    this.initialPlatforms.forEach((platform, index) => {
      platform.isMoving = false;
      if (!this.scene.children.includes(platform)) {
        this.scene.add(platform);
      }
      platform.position.set(
        this.initialPlatformPositions[index].x,
        this.initialPlatformPositions[index].y,
        0
      );
    });

    if (
      this.AudioManager.audio.sounds.bgMusic &&
      !this.AudioManager.audio.sounds.bgMusic.isPlaying &&
      !this.AudioManager.audio.isMuted
    ) {
      this.AudioManager.audio.sounds.bgMusic.play();
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

  showInstructionOverlay(type) {
    this.state.gamePaused = true;

    if (this.state.startTime !== null) {
      this.state.pausedElapsedTime = this.state.elapsedTime;
      this.state.startTime = null;
    }
    let currentPage = 1;
    let totalPages = 2;

    const overlay = document.createElement("div");
    overlay.className = "tutorial-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "1000",
      fontFamily: "Arial, sans-serif",
      textAlign: "center",
    });

    let title, description;

    if (type === "shield") {
      const createPageContent = (pageNum) => {
        overlay.innerHTML = "";

        // Page 1: Bullet tutorial
        if (pageNum === 1) {
          title = "Dangerous Bullets!";
          description =
            "Apples will shoot from both sides! If hit, you'll be pushed in the opposite direction. Dodge them!";
        }
        // Page 2: Shield tutorial
        else {
          title = "Protective Shield!";
          description =
            "Collect blue shields to become temporarily immune! While shielded, bullets can't push you.";
        }

        const keyInstruction = document.createElement("p");
        keyInstruction.textContent = "Click Continue to resume";
        keyInstruction.style.fontSize = "14px";
        keyInstruction.style.color = "#cccccc";
        keyInstruction.style.marginTop = "20px";

        const titleElement = document.createElement("h2");
        titleElement.textContent = title;
        titleElement.style.fontSize = "28px";
        titleElement.style.marginBottom = "10px";
        titleElement.style.color = "#ea3d8c";

        const descriptionElement = document.createElement("p");
        descriptionElement.textContent = description;
        descriptionElement.style.fontSize = "18px";
        descriptionElement.style.margin = "15px 0";
        descriptionElement.style.maxWidth = "500px";

        const mediaContainer = document.createElement("div");
        if (pageNum === 1) {
          mediaContainer.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center;">
              <div style="font-size: 48px; color: #ff0000;">←</div>
              <div style="font-size: 48px;">🍎</div>
              <div style="font-size: 48px; color: #ff0000;">→</div>
            </div>
          `;
        } else {
          mediaContainer.innerHTML = `
            <div style="display: flex; gap: 20px; align-items: center;">
              <div style="font-size: 48px; color: #0099ff;">🛡</div>
              <div style="font-size: 48px;">→</div>
              <div style="font-size: 48px; color: #aad1e7;">🐷</div>
            </div>
          `;
        }

        // Page indicator
        const pageIndicator = document.createElement("div");
        pageIndicator.textContent = `${pageNum}/${totalPages}`;
        pageIndicator.style.position = "absolute";
        pageIndicator.style.top = "20px";
        pageIndicator.style.right = "20px";
        pageIndicator.style.fontSize = "20px";

        const continueButton = document.createElement("button");
        continueButton.textContent =
          pageNum === totalPages ? "Start Game" : "Next";
        continueButton.className = "tutorial-continue-button";
        continueButton.textContent = "Continue";
        continueButton.style.marginTop = "2px";
        continueButton.style.padding = "12px 24px";
        continueButton.style.fontSize = "1rem";
        continueButton.style.cursor = "pointer";
        continueButton.style.backgroundColor = "#ea3d8c";
        continueButton.style.color = "#fff";
        continueButton.style.border = "none";
        continueButton.style.borderRadius = "8px";
        continueButton.style.boxShadow = "0 5px 15px rgba(234, 61, 140, 0.3)";
        continueButton.style.transition = "all 0.3s ease";

        continueButton.addEventListener("mouseover", () => {
          continueButton.style.backgroundColor = "#f07ab3";
        });
  
        continueButton.addEventListener("mouseout", () => {
          continueButton.style.backgroundColor = "#ea3d8c";
        });


        continueButton.addEventListener("click", () => {
          if (pageNum < totalPages) {
            currentPage++;
            this.AudioManager.playSound("click");
            createPageContent(currentPage);
          } else {
            this.AudioManager.playSound("click");
            document.body.removeChild(overlay);
            this.startCountdown();
          }
        });

        overlay.appendChild(titleElement);
        overlay.appendChild(mediaContainer);
        overlay.appendChild(descriptionElement);
        overlay.appendChild(pageIndicator);
        if (pageNum === 2) {
          overlay.appendChild(keyInstruction);
        }
        overlay.appendChild(continueButton);
      };

      createPageContent(1);
    } else {
      if (type === "superJump") {
        title = "Super Jump Power-Up!";
        description = "Collect the yellow star to jump higher for 10 seconds!";
      } else if (type === "movingPlatform") {
        title = "Moving Platform!";
        description =
          "These platforms move side to side! Time your jumps carefully.";
      }

      const keyInstruction = document.createElement("p");
      keyInstruction.textContent = "Click Continue to resume";
      keyInstruction.style.fontSize = "14px";
      keyInstruction.style.color = "#cccccc";
      keyInstruction.style.marginTop = "20px";

      const titleElement = document.createElement("h2");
      titleElement.textContent = title;
      titleElement.style.fontSize = "28px";
      titleElement.style.marginBottom = "10px";
      titleElement.style.color = "#ea3d8c";
      overlay.appendChild(titleElement);

      const mediaContainer = document.createElement("div");
      mediaContainer.style.margin = "15px 0";
      mediaContainer.style.width = "300px";
      mediaContainer.style.height = "200px";
      mediaContainer.style.display = "flex";
      mediaContainer.style.alignItems = "center";
      mediaContainer.style.justifyContent = "center";

      if (type === "superJump") {
        const placeholderText = document.createElement("div");
        placeholderText.innerHTML = `<div style="font-size: 48px; color: #ffff00;">★</div>`;
        mediaContainer.appendChild(placeholderText);
      } else {
        const video = document.createElement("video");
        video.src = "assets/videos/moving_platform.mp4";
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.controls = false;
        video.style.maxWidth = "100%";
        video.style.maxHeight = "100%";
        video.addEventListener("click", function (e) {
          e.preventDefault();
          return false;
        });
        mediaContainer.appendChild(video);
      }

      overlay.appendChild(mediaContainer);

      const descriptionElement = document.createElement("p");
      descriptionElement.textContent = description;
      descriptionElement.style.fontSize = "18px";
      descriptionElement.style.margin = "15px 0";
      descriptionElement.style.maxWidth = "500px";
      overlay.appendChild(descriptionElement);
      overlay.appendChild(keyInstruction);

      const continueButton = document.createElement("button");
      continueButton.className = "tutorial-continue-button";
      continueButton.textContent = "Continue";
      continueButton.style.marginTop = "2px";
      continueButton.style.padding = "12px 24px";
      continueButton.style.fontSize = "1rem";
      continueButton.style.cursor = "pointer";
      continueButton.style.backgroundColor = "#ea3d8c";
      continueButton.style.color = "#fff";
      continueButton.style.border = "none";
      continueButton.style.borderRadius = "8px";
      continueButton.style.boxShadow = "0 5px 15px rgba(234, 61, 140, 0.3)";
      continueButton.style.transition = "all 0.3s ease";

      continueButton.addEventListener("mouseover", () => {
        continueButton.style.backgroundColor = "#f07ab3";
      });

      continueButton.addEventListener("mouseout", () => {
        continueButton.style.backgroundColor = "#ea3d8c";
      });

      continueButton.addEventListener("click", () => {
        this.AudioManager.playSound("click");
        document.body.removeChild(overlay);
        this.startCountdown();
      });

      overlay.appendChild(continueButton);
    }
    document.body.appendChild(overlay);
  }

  startCountdown() {
    this.state.countdownActive = true;
    this.state.countdownValue = 3;

    const countdownOverlay = document.createElement("div");
    Object.assign(countdownOverlay.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      backgroundColor: "rgba(0, 0, 0, 0.3)",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: "999",
      fontFamily: "Arial, sans-serif",
    });

    const countdownText = document.createElement("div");
    countdownText.textContent = this.state.countdownValue.toString();
    countdownText.style.fontSize = "120px";
    countdownText.style.fontWeight = "bold";
    countdownText.style.color = "#ea3d8c";
    countdownText.style.textShadow = "0 0 10px rgba(255, 255, 255, 0.5)";

    countdownOverlay.appendChild(countdownText);
    document.body.appendChild(countdownOverlay);

    const countdownInterval = setInterval(() => {
      this.state.countdownValue--;
      countdownText.textContent = this.state.countdownValue.toString();

      if (this.state.countdownValue <= 0) {
        clearInterval(countdownInterval);
        document.body.removeChild(countdownOverlay);
        this.state.countdownActive = false;
        this.state.gamePaused = false;

        if (this.state.pausedElapsedTime > 0) {
          this.state.startTime = Date.now() - this.state.pausedElapsedTime * 1000;
          this.state.pausedElapsedTime = 0;
        }

        if (
          this.AudioManager.audio.sounds.bgMusic &&
          !this.AudioManager.audio.sounds.bgMusic.isPlaying &&
          !this.AudioManager.audio.isMuted
        ) {
          this.AudioManager.audio.sounds.bgMusic.play();
        }

        this.animate();
      }
    }, 1000);
  }
}

window.addEventListener("load", () => {
  const game = new PiggyJumpGame();
});
