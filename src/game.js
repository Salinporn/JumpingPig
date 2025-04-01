import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.119/examples/jsm/loaders/OBJLoader.js";

// Scene setup and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
camera.position.z = 20;

// Audio
let audioListener;
let jumpSound;
let bgMusic;
let starSound;
let bgGameOver;
let clickSound;
let bgmVolume = 0.2;
let sfxVolume = 0.3;
let isMuted = false;
audioListener = new THREE.AudioListener();
camera.add(audioListener);

// Left side instructions
const infoDiv = document.createElement("div");
infoDiv.id = "info";
infoDiv.style.position = "absolute";
infoDiv.style.top = "10px";
infoDiv.style.width = "300px";
infoDiv.style.textAlign = "left";
infoDiv.style.color = "white";
infoDiv.style.fontFamily = "Arial, sans-serif";
infoDiv.style.pointerEvents = "none";
infoDiv.style.textShadow = "1px 1px 1px black";
infoDiv.style.padding = "50px";
const instructionsImg = document.createElement("img");
instructionsImg.id = "instructions";
instructionsImg.alt = "Instructions";
instructionsImg.width = 400;
infoDiv.appendChild(instructionsImg);
document.body.appendChild(infoDiv);

// Sound settings panel
const soundSettingsDiv = document.createElement("div");
soundSettingsDiv.id = "sound-settings";
soundSettingsDiv.style.marginTop = "20px";
soundSettingsDiv.style.padding = "10px";
soundSettingsDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
soundSettingsDiv.style.borderRadius = "8px";
soundSettingsDiv.style.color = "white";
soundSettingsDiv.style.fontFamily = "Arial, sans-serif";
soundSettingsDiv.style.width = "380px";
soundSettingsDiv.style.pointerEvents = "auto";

const settingsTitle = document.createElement("h3");
settingsTitle.textContent = "Sound Settings";
settingsTitle.style.margin = "0 0 10px 0";
settingsTitle.style.fontSize = "16px";
settingsTitle.style.fontWeight = "bold";
soundSettingsDiv.appendChild(settingsTitle);

// BGM volume control
const bgmContainer = document.createElement("div");
bgmContainer.style.display = "flex";
bgmContainer.style.alignItems = "center";
bgmContainer.style.marginBottom = "10px";

const bgmLabel = document.createElement("label");
bgmLabel.textContent = "BGM: ";
bgmLabel.style.flexBasis = "50px";
bgmLabel.style.fontSize = "14px";
bgmContainer.appendChild(bgmLabel);

const bgmSlider = document.createElement("input");
bgmSlider.type = "range";
bgmSlider.min = "0";
bgmSlider.max = "100";
bgmSlider.value = bgmVolume * 100;
bgmSlider.style.flex = "1";
bgmSlider.addEventListener("input", () => {
  if (!isMuted) {
    bgmVolume = bgmSlider.value / 100;
    if (bgMusic) bgMusic.setVolume(bgmVolume);
    if (bgGameOver) bgGameOver.setVolume(bgmVolume);
  } else {
    bgmSlider.value = bgmVolume * 100;
  }
  bgmSlider.blur();
});

bgmContainer.appendChild(bgmSlider);

soundSettingsDiv.appendChild(bgmContainer);

// SFX volume control
const sfxContainer = document.createElement("div");
sfxContainer.style.display = "flex";
sfxContainer.style.alignItems = "center";
sfxContainer.style.marginBottom = "10px";

const sfxLabel = document.createElement("label");
sfxLabel.textContent = "SFX: ";
sfxLabel.style.flexBasis = "50px";
sfxLabel.style.fontSize = "14px";
sfxContainer.appendChild(sfxLabel);

const sfxSlider = document.createElement("input");
sfxSlider.type = "range";
sfxSlider.min = "0";
sfxSlider.max = "100";
sfxSlider.value = sfxVolume * 100;
sfxSlider.style.flex = "1";
sfxSlider.addEventListener("input", () => {
  if (!isMuted) {
    sfxVolume = sfxSlider.value / 100;
    if (jumpSound) jumpSound.setVolume(sfxVolume-0.2);
    if (starSound) starSound.setVolume(sfxVolume);
    if (clickSound) clickSound.setVolume(sfxVolume);
  } else {
    sfxSlider.value = sfxVolume * 100;
  }
  sfxSlider.blur();
});
sfxContainer.appendChild(sfxSlider);

soundSettingsDiv.appendChild(sfxContainer);

function updateSoundUIState() {
  if (isMuted) {
    // Disabled state - gray out sliders and labels
    bgmSlider.style.opacity = "0.5";
    sfxSlider.style.opacity = "0.5";
    bgmLabel.style.opacity = "0.5";
    sfxLabel.style.opacity = "0.5";
    
    // Add disabled cursor for better UX
    bgmSlider.style.cursor = "not-allowed";
    sfxSlider.style.cursor = "not-allowed";
  } else {
    // Enabled state - full opacity
    bgmSlider.style.opacity = "1";
    sfxSlider.style.opacity = "1";
    bgmLabel.style.opacity = "1";
    sfxLabel.style.opacity = "1";
    
    // Restore normal cursor
    bgmSlider.style.cursor = "pointer";
    sfxSlider.style.cursor = "pointer";
  }
}

updateSoundUIState();

// Mute button
const muteContainer = document.createElement("div");
muteContainer.style.display = "flex";
muteContainer.style.justifyContent = "center";

const muteButton = document.createElement("button");
muteButton.textContent = "Mute";
muteButton.style.padding = "5px 15px";
muteButton.style.backgroundColor = "#ea3d8c";
muteButton.style.color = "white";
muteButton.style.border = "none";
muteButton.style.borderRadius = "4px";
muteButton.style.cursor = "pointer";
muteButton.style.fontSize = "14px";
muteButton.style.transition = "background-color 0.2s";

muteButton.addEventListener("mouseover", () => {
  muteButton.style.backgroundColor = "#f07ab3";
});

muteButton.addEventListener("mouseout", () => {
  muteButton.style.backgroundColor = isMuted ? "#555555" : "#ea3d8c";
});

muteButton.addEventListener("click", () => {
  isMuted = !isMuted;
  
  if (clickSound) clickSound.play();
  
  if (isMuted) {
    muteButton.textContent = "Unmute";
    muteButton.style.backgroundColor = "#555555";
    
    // Mute all sounds
    if (bgMusic && bgMusic.isPlaying) bgMusic.setVolume(0);
    if (bgGameOver && bgGameOver.isPlaying) bgGameOver.setVolume(0);
    if (jumpSound) jumpSound.setVolume(0);
    if (starSound) starSound.setVolume(0);
    if (clickSound) clickSound.setVolume(0);
  } else {
    muteButton.textContent = "Mute";
    muteButton.style.backgroundColor = "#ea3d8c";
    
    // Restore all volumes
    if (bgMusic && bgMusic.isPlaying) bgMusic.setVolume(bgmVolume);
    if (bgGameOver && bgGameOver.isPlaying) bgGameOver.setVolume(bgmVolume);
    if (jumpSound) jumpSound.setVolume(sfxVolume-0.2);
    if (starSound) starSound.setVolume(sfxVolume);
    if (clickSound) clickSound.setVolume(sfxVolume);
  }
  updateSoundUIState();
  muteButton.blur();
});

muteContainer.appendChild(muteButton);
soundSettingsDiv.appendChild(muteContainer);

infoDiv.appendChild(soundSettingsDiv);

function playClickSound() {
  if (clickSound && !isMuted) {
    clickSound.play();
  }
}

// Scene, Background and lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 5, 10);
scene.add(directionalLight);
scene.background = new THREE.Color(0x0f0525);
let backgroundIsWhite = false;
let lastBackgroundChangeTime = 0;

// Platform
const platformGeometry = new THREE.BoxGeometry(5, 0.5, 1);
const platformMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });

let platforms = [];
const initialPlatforms = [];
let currentPlatformSpeed = 0.05;
let platformSpawnTimer = 0;

// Initial platforms
const initialPlatformPositions = [
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

initialPlatformPositions.forEach((pos) => {
  const platform = new THREE.Mesh(platformGeometry, platformMaterial);
  platform.position.set(pos.x, pos.y, 0);
  platform.isMoving = false;
  scene.add(platform);
  platforms.push(platform);
  initialPlatforms.push(platform);
});

// Tutorial
let hasSeenSuperJumpTutorial =
  localStorage.getItem("hasSeenSuperJumpTutorial") === "true";
let hasSeenMovingPlatformTutorial =
  localStorage.getItem("hasSeenMovingPlatformTutorial") === "true";
let gamePaused = false;

// Power-up
let star = null;
let powerUps = [];
const JUMP_FORCE_NORMAL = 0.4;
const JUMP_FORCE_SUPER = 0.6;
let jumpForce = JUMP_FORCE_NORMAL;
let superJumpTimeout = null;

// Piggy
let piggy = null;
let piggyHalfHeight = 0.5;
let piggyHalfWidth = 0.5;

let maxPiggyY = 0;

// Load audio files
const soundLoader = new THREE.AudioLoader();
soundLoader.load("assets/audios/jump.mp3", (buffer) => {
  jumpSound = new THREE.Audio(audioListener);
  jumpSound.setBuffer(buffer);
  jumpSound.setVolume(sfxVolume-0.2);
});

soundLoader.load("assets/audios/bgMusic.wav", (buffer) => {
  bgMusic = new THREE.Audio(audioListener);
  bgMusic.setBuffer(buffer);
  bgMusic.setVolume(bgmVolume);
  bgMusic.setLoop(true);
  if (!isMuted) {
    bgMusic.play();
  }
});

soundLoader.load("assets/audios/star.wav", (buffer) => {
  starSound = new THREE.Audio(audioListener);
  starSound.setBuffer(buffer);
  starSound.setVolume(sfxVolume);
});

soundLoader.load("assets/audios/bgGameOver.mp3", (buffer) => {
  bgGameOver = new THREE.Audio(audioListener);
  bgGameOver.setBuffer(buffer);
  bgGameOver.setVolume(bgmVolume);
  bgGameOver.setLoop(true);
});

soundLoader.load("assets/audios/click.wav", (buffer) => {
  clickSound = new THREE.Audio(audioListener);
  clickSound.setBuffer(buffer);
  clickSound.setVolume(sfxVolume);
});

// Load Objects-Models
const objLoader = new OBJLoader();
objLoader.load(
  "assets/models/piggy.obj",
  (object) => {
    piggy = object;
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
      piggyHalfHeight = (bb.max.y - bb.min.y) / 2;
      piggyHalfWidth = (bb.max.x - bb.min.x) / 2;
    }

    piggy.position.set(0, 0, 0);
    piggy.scale.set(1.5, 1.5, 1.5);
    scene.add(piggy);

    objLoader.load(
      "assets/models/Star.obj",
      (object) => {
        star = object;

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

        star.scale.set(1.0, 1.0, 1.0);

        startGame();
      },
      undefined,
      (err) => console.error("Error loading arrow model:", err)
    );
  },
  undefined,
  (err) => console.error("Error loading piggy model:", err)
);

// Other Game variables
let velocity = new THREE.Vector3(0, 0, 0);
const gravity = new THREE.Vector3(0, -0.02, 0);
let score = 0;
let highestScore = 0;
let elapsedTime = 0;
let gameOver = false;
let startTime = null;
const piggyMoveSpeed = 0.1;
let hasJumped = false;
let isGrounded = true;
let dynamicJumpCooldown = 500;
const MIN_JUMP_COOLDOWN = 300;
const MAX_PLATFORM_SPEED = 0.115;
let lastJumpTime = 0;
let highestTime = 0;
let countdownActive = false;
let countdownValue = 3;

// Load highest score
if (localStorage.getItem("highestScore")) {
  highestScore = parseInt(localStorage.getItem("highestScore"));
}
if (localStorage.getItem("highestTime")) {
  highestTime = parseFloat(localStorage.getItem("highestTime"));
}

// Keyboard input
const keys = {};
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});
window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Countdown after tutorial
function startCountdown() {
  countdownActive = true;
  countdownValue = 3;

  const countdownOverlay = document.createElement("div");
  countdownOverlay.style.position = "fixed";
  countdownOverlay.style.top = "0";
  countdownOverlay.style.left = "0";
  countdownOverlay.style.width = "100%";
  countdownOverlay.style.height = "100%";
  countdownOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
  countdownOverlay.style.color = "#fff";
  countdownOverlay.style.display = "flex";
  countdownOverlay.style.justifyContent = "center";
  countdownOverlay.style.alignItems = "center";
  countdownOverlay.style.zIndex = "999";
  countdownOverlay.style.fontFamily = "Arial, sans-serif";

  const countdownText = document.createElement("div");
  countdownText.textContent = countdownValue.toString();
  countdownText.style.fontSize = "120px";
  countdownText.style.fontWeight = "bold";
  countdownText.style.color = "#ea3d8c";
  countdownText.style.textShadow = "0 0 10px rgba(255, 255, 255, 0.5)";

  countdownOverlay.appendChild(countdownText);
  document.body.appendChild(countdownOverlay);

  const countdownInterval = setInterval(() => {
    countdownValue--;
    countdownText.textContent = countdownValue.toString();

    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      document.body.removeChild(countdownOverlay);
      countdownActive = false;
      gamePaused = false;

      if (bgMusic && !bgMusic.isPlaying && !isMuted) {
        bgMusic.play();
      }
      
      requestAnimationFrame(animate);
    }
  }, 1000);
}

// Instruction overlay
function showInstructionOverlay(type) {
  gamePaused = true;

  const overlay = document.createElement("div");
  overlay.className = "tutorial-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.color = "#fff";
  overlay.style.display = "flex";
  overlay.style.flexDirection = "column";
  overlay.style.justifyContent = "center";
  overlay.style.alignItems = "center";
  overlay.style.zIndex = "1000";
  overlay.style.fontFamily = "Arial, sans-serif";
  overlay.style.textAlign = "center";

  let title, description;

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
    if (clickSound && !isMuted) {
      clickSound.play();
    }
    document.body.removeChild(overlay);
    startCountdown();
  });

  overlay.appendChild(continueButton);
  document.body.appendChild(overlay);
}

function animate() {
  if (gameOver || !piggy || gamePaused || countdownActive) return;

  requestAnimationFrame(animate);

  velocity.add(gravity);
  piggy.position.add(velocity);

  // Update platform speed
  currentPlatformSpeed = Math.min(0.05 + score * 0.003, MAX_PLATFORM_SPEED);
  dynamicJumpCooldown = Math.max(500 - score * 15, MIN_JUMP_COOLDOWN);

  // Platform spawning
  if (hasJumped) {
    platformSpawnTimer++;
    elapsedTime = startTime !== null ? (Date.now() - startTime) / 1000 : 0;

    // Update score
    maxPiggyY = Math.max(maxPiggyY, piggy.position.y);
    const heightScore = Math.max(0, Math.floor(maxPiggyY)) * 2;
    score = Math.floor(elapsedTime) + heightScore;

    const dynamicSpawnInterval = 100 * (0.05 / currentPlatformSpeed);
    if (platformSpawnTimer > dynamicSpawnInterval) {
      platformSpawnTimer = 0;
      const newPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
      newPlatform.position.y = 20;
      newPlatform.position.x = (Math.random() - 0.5) * 8;
      newPlatform.isMoving = false;

      if (elapsedTime >= 10 && Math.random() < 0.3) {
        newPlatform.isMoving = true;
        newPlatform.direction = Math.random() < 0.5 ? -1 : 1;
        newPlatform.speed = 0.05;
        newPlatform.initialX = newPlatform.position.x;
        newPlatform.movingRange = 6;

        // Moving Platform Tutorial
        if (!hasSeenMovingPlatformTutorial && elapsedTime >= 10) {
          hasSeenMovingPlatformTutorial = true;
          localStorage.setItem("hasSeenMovingPlatformTutorial", "true");
          setTimeout(() => {
            showInstructionOverlay("movingPlatform");
          }, 500);
        }
      }

      if (!newPlatform.isMoving && Math.random() < 0.03 && star) {
        const powerUp = star.clone();
        powerUp.position.set(
          newPlatform.position.x,
          newPlatform.position.y + 1.0,
          0
        );
        scene.add(powerUp);
        powerUps.push(powerUp);
      }

      platforms.push(newPlatform);
      scene.add(newPlatform);
    }
  }

  isGrounded = false;

  // Platform movement and collision
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (hasJumped) {
      platforms[i].position.y -= currentPlatformSpeed;
    }

    const platformHalfHeight = platformGeometry.parameters.height / 2;
    const platformHalfWidth = platformGeometry.parameters.width / 2;

    if (
      piggy.position.y - piggyHalfHeight <=
        platforms[i].position.y + platformHalfHeight &&
      piggy.position.y + piggyHalfHeight >=
        platforms[i].position.y - platformHalfHeight &&
      piggy.position.x + piggyHalfWidth >
        platforms[i].position.x - platformHalfWidth &&
      piggy.position.x - piggyHalfWidth <
        platforms[i].position.x + platformHalfWidth
    ) {
      if (velocity.y < 0) {
        piggy.position.y =
          platforms[i].position.y + platformHalfHeight + piggyHalfHeight;
        velocity.y = 0;
        isGrounded = true;
      }
    }

    // Remove off-screen platforms
    if (platforms[i].position.y < -20) {
      scene.remove(platforms[i]);
      platforms.splice(i, 1);
    }
  }

  if (elapsedTime >= 10) {
    platforms.forEach((platform) => {
      if (platform.isMoving) {
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
    });
  }

  // Power-up
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    powerUp.position.y -= currentPlatformSpeed;

    powerUp.rotation.y += 0.02;

    if (powerUp.position.y < -20) {
      scene.remove(powerUp);
      powerUps.splice(i, 1);
      continue;
    }

    // Power Up Tutorial
    const dx = piggy.position.x - powerUp.position.x;
    const dy = piggy.position.y - powerUp.position.y;
    const distanceSq = dx * dx + dy * dy;

    const closeToFirstPowerUp = distanceSq < (piggyHalfWidth + 1.5) ** 2;
    if (!hasSeenSuperJumpTutorial && closeToFirstPowerUp) {
      hasSeenSuperJumpTutorial = true;
      localStorage.setItem("hasSeenSuperJumpTutorial", "true");
      showInstructionOverlay("superJump");
      break;
    }

    // Actual collision detection
    if (distanceSq < (piggyHalfWidth + 0.5) ** 2) {
      scene.remove(powerUp);
      powerUps.splice(i, 1);

      if (starSound && !isMuted) {
        starSound.play();
      }
      
      activateSuperJump();
    }
  }

  // Piggy movement
  if (keys["a"] || keys["ArrowLeft"]) piggy.position.x -= piggyMoveSpeed;
  if (keys["d"] || keys["ArrowRight"]) piggy.position.x += piggyMoveSpeed;

  const currentTime = Date.now();
  if (
    (keys["w"] || keys["ArrowUp"] || keys[" "]) &&
    isGrounded &&
    currentTime - lastJumpTime >= dynamicJumpCooldown
  ) {
    if (startTime === null) {
      startTime = currentTime;
    }
    velocity.y = jumpForce;
    isGrounded = false;
    hasJumped = true;
    lastJumpTime = currentTime;

    if (jumpSound && !isMuted) {
      jumpSound.play();
    }
  }

  // dynamic background color change
  if (elapsedTime - lastBackgroundChangeTime > 60) {
    lastBackgroundChangeTime = elapsedTime;
    backgroundIsWhite = !backgroundIsWhite;

    if (backgroundIsWhite) {
      scene.background = new THREE.Color(0x87ceeb); // Sky blue for day
      infoDiv.style.color = "black";
      infoDiv.style.textShadow = "1px 1px 1px rgba(255, 255, 255, 0.7)";
      document.getElementById("time").style.color = "black";
      document.getElementById("score").style.color = "black";
      document.getElementById("best").style.color = "black";
      instructionsImg.src = "../assets/images/instructions2.png";
    } else {
      scene.background = new THREE.Color(0x0f0525); // Dark blue for night
      infoDiv.style.color = "white";
      infoDiv.style.textShadow = "1px 1px 1px rgba(0, 0, 0, 0.7)";
      document.getElementById("time").style.color = "white";
      document.getElementById("score").style.color = "white";
      document.getElementById("best").style.color = "white";
      instructionsImg.src = "../assets/images/instructions.png";
    }
  }

  // Game over check
  if (piggy.position.y < -window.innerHeight / 20) {
    gameOver = true;
    
    if (bgMusic && bgMusic.isPlaying) {
      bgMusic.stop();
    }
    
    if (bgGameOver && !isMuted) {
      bgGameOver.play();
    }

    // Highest score handling
    if (elapsedTime > highestTime) {
      highestTime = elapsedTime;
      localStorage.setItem("highestTime", highestTime.toString());
    }

    if (score > highestScore) {
      highestScore = score;
      localStorage.setItem("highestScore", highestScore.toString());
    }

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
    overlay.style.color = "#fff";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.fontSize = "24px";
    overlay.style.zIndex = "1000";
    overlay.style.fontFamily = "Arial, sans-serif";
    overlay.style.textAlign = "center";

    const image = document.createElement("img");
    image.src = "assets/images/gameover.png";
    image.alt = "Game Over";
    image.style.width = "400px";
    image.style.marginBottom = "30px";
    overlay.appendChild(image);

    const message = document.createElement("div");
    message.style.textAlign = "left";
    message.style.width = "100%";
    message.style.maxWidth = "400px";
    message.innerHTML = `

      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 1.2rem;">
        <div style="display: flex; justify-content: space-between;">
          <span>Score:</span> <span style="font-weight: bold;">${score}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Time Survived:</span> <span style="font-weight: bold;">${elapsedTime.toFixed(
            2
          )} s</span>
        </div>
        <hr style="border: 0; height: 1px; background: #ccc; margin: 10px 0;">
        <div style="display: flex; justify-content: space-between;">
          <span>Highest Score:</span> <span style="font-weight: bold;">${highestScore}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span>Best Time:</span> <span style="font-weight: bold;">${highestTime.toFixed(
            2
          )} s</span>
        </div>
      </div>
    `;

    overlay.appendChild(message);

    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart";
    restartButton.style.marginTop = "20px";
    restartButton.style.padding = "12px 24px";
    restartButton.style.fontSize = "1rem";
    restartButton.style.cursor = "pointer";
    restartButton.style.backgroundColor = "#ea3d8c";
    restartButton.style.color = "#fff";
    restartButton.style.border = "none";
    restartButton.style.borderRadius = "8px";
    restartButton.style.boxShadow = "0 5px 15px rgba(234, 61, 140, 0.3)";
    restartButton.style.transition = "all 0.3s ease";
    restartButton.addEventListener("mouseover", () => {
      restartButton.style.backgroundColor = "#f07ab3";
    });
    restartButton.addEventListener("mouseout", () => {
      restartButton.style.backgroundColor = "#ea3d8c";
    });
    restartButton.addEventListener("click", () => {
      if (clickSound && !isMuted) {
        clickSound.play();
      }

      document.body.removeChild(overlay);

      if (bgGameOver && bgGameOver.isPlaying) {
        bgGameOver.stop();
      }

      restartGame();
    });
    overlay.appendChild(restartButton);

    document.body.appendChild(overlay);
  }

  document.getElementById("time").textContent = `Time: ${elapsedTime.toFixed(
    2
  )}`;
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("best").textContent = `Best: ${highestScore}`;

  renderer.render(scene, camera);
}

function activateSuperJump() {
  if (superJumpTimeout) clearTimeout(superJumpTimeout);
  jumpForce = JUMP_FORCE_SUPER;
  superJumpTimeout = setTimeout(() => {
    jumpForce = JUMP_FORCE_NORMAL;
  }, 10000);
}

// Restart game
function restartGame() {
  gameOver = false;
  score = 0;
  currentPlatformSpeed = 0.05;
  piggy.position.set(0, -1.25, 0);
  velocity.set(0, 0, 0);
  startTime = null;
  hasJumped = false;
  isGrounded = true;
  lastJumpTime = 0;
  elapsedTime = 0;
  jumpForce = JUMP_FORCE_NORMAL;
  maxPiggyY = 0;
  backgroundIsWhite = false;
  scene.background = new THREE.Color(0x0f0525);
  lastBackgroundChangeTime = 0;
  instructionsImg.src = "../assets/images/instructions.png";

  if (bgMusic && !bgMusic.isPlaying && !isMuted) {
    bgMusic.play();
  }

  if (superJumpTimeout) {
    clearTimeout(superJumpTimeout);
    superJumpTimeout = null;
  }

  powerUps.forEach((powerUp) => scene.remove(powerUp));
  powerUps = [];

  platforms.forEach((platform) => {
    if (!initialPlatforms.includes(platform)) {
      scene.remove(platform);
    }
  });
  platforms = [...initialPlatforms];

  initialPlatforms.forEach((platform, index) => {
    platform.isMoving = false;
    if (!scene.children.includes(platform)) {
      scene.add(platform);
    }
    platform.position.set(
      initialPlatformPositions[index].x,
      initialPlatformPositions[index].y,
      0
    );
  });

  animate();
}

// Start game
function startGame() {
  gameOver = false;
  score = 0;
  currentPlatformSpeed = 0.05;
  piggy.position.set(0, -1.25, 0);
  velocity.set(0, 0, 0);
  startTime = null;
  hasJumped = false;
  isGrounded = true;
  lastJumpTime = 0;
  maxPiggyY = 0;
  lastBackgroundChangeTime = 0;
  scene.background = new THREE.Color(0x0f0525);
  instructionsImg.src = "../assets/images/instructions.png";
  
  if (bgMusic && !bgMusic.isPlaying) {
    bgMusic.play();
  }

  // Clear non-initial platforms
  platforms.forEach((platform) => {
    if (!initialPlatforms.includes(platform)) {
      scene.remove(platform);
    }
  });
  platforms = [...initialPlatforms];

  // Reset initial platforms positions
  initialPlatformPositions.forEach((pos, index) => {
    initialPlatforms[index].position.set(pos.x, pos.y, 0);
  });

  animate();
}