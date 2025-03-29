import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { OBJLoader } from "https://cdn.jsdelivr.net/npm/three@0.119/examples/jsm/loaders/OBJLoader.js";

// Scene setup
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

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 5, 10);
scene.add(directionalLight);

// Geometry and materials
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

const powerUpGeometry = new THREE.SphereGeometry(0.3);
const powerUpMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  emissive: 0x00ff00,
  emissiveIntensity: 0.5,
});
let powerUps = [];
const JUMP_FORCE_NORMAL = 0.4;
const JUMP_FORCE_SUPER = 0.6;
let jumpForce = JUMP_FORCE_NORMAL;
let superJumpTimeout = null;

// Tutorial flags
let hasSeenSuperJumpTutorial = false;
let hasSeenMovingPlatformTutorial = false;
let gamePaused = false;

// Piggy variables
let piggy = null;
let piggyHalfHeight = 0.5;
let piggyHalfWidth = 0.5;

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
    startGame();
  },
  undefined,
  (err) => console.error(err)
);

// Game variables
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

// Load highest score from localStorage if available
if (localStorage.getItem("highestScore")) {
  highestScore = parseInt(localStorage.getItem("highestScore"));
}
if (localStorage.getItem("highestTime")) {
  highestTime = parseFloat(localStorage.getItem("highestTime"));
}

// Camera position
camera.position.z = 20;

// Keyboard input
const keys = {};
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});
window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Function to create and show an instruction overlay
function showInstructionOverlay(type) {
  gamePaused = true;
  
  const overlay = document.createElement("div");
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
  
  let title, description, imageSrc;
  
  if (type === "superJump") {
    title = "Super Jump Power-Up!";
    description = "Collect the green orb to jump higher for 10 seconds!";
    imageSrc = "assets/images/superjump.png"; // You'll need to create this image
  } else if (type === "movingPlatform") {
    title = "Moving Platform!";
    description = "These platforms move side to side! Time your jumps carefully.";
    imageSrc = "assets/images/movingplatform.png"; // You'll need to create this image
  }
  
  // Title
  const titleElement = document.createElement("h2");
  titleElement.textContent = title;
  titleElement.style.fontSize = "28px";
  titleElement.style.marginBottom = "10px";
  titleElement.style.color = "#ea3d8c";
  overlay.appendChild(titleElement);
  
  // Image container (optional - if you have tutorial images)
  const imageContainer = document.createElement("div");
  imageContainer.style.margin = "15px 0";
  imageContainer.style.width = "300px";
  imageContainer.style.height = "200px";
  imageContainer.style.display = "flex";
  imageContainer.style.alignItems = "center";
  imageContainer.style.justifyContent = "center";
  
  // If you have actual images, uncomment this:
  // const image = document.createElement("img");
  // image.src = imageSrc;
  // image.alt = title;
  // image.style.maxWidth = "100%";
  // image.style.maxHeight = "100%";
  // imageContainer.appendChild(image);
  
  // If you don't have images, use a placeholder with text
  const placeholderText = document.createElement("div");
  if (type === "superJump") {
    placeholderText.innerHTML = `<div style="font-size: 48px; color: #00ff00;">●</div>`;
  } else {
    placeholderText.innerHTML = `<div style="width: 150px; height: 20px; background-color: #808080; position: relative;">
      <div style="position: absolute; top: -15px; font-size: 12px;">⟷</div>
    </div>`;
  }
  imageContainer.appendChild(placeholderText);
  overlay.appendChild(imageContainer);
  
  // Description
  const descriptionElement = document.createElement("p");
  descriptionElement.textContent = description;
  descriptionElement.style.fontSize = "18px";
  descriptionElement.style.margin = "15px 0";
  descriptionElement.style.maxWidth = "500px";
  overlay.appendChild(descriptionElement);
  
  // Continue button
  const continueButton = document.createElement("button");
  continueButton.textContent = "Continue";
  continueButton.style.marginTop = "20px";
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
    document.body.removeChild(overlay);
    gamePaused = false;
    requestAnimationFrame(animate);
  });
  
  overlay.appendChild(continueButton);
  document.body.appendChild(overlay);
}

// Animation loop with pause support
function animate() {
  if (gameOver || !piggy) return;
  
  if (!gamePaused) {
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

      // Update score - base on time plus bonus points for height
      const heightScore = Math.max(0, Math.floor(piggy.position.y)) * 2;
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
          newPlatform.speed = 0.01;
          newPlatform.initialX = newPlatform.position.x;
          newPlatform.movingRange = 10;
          
          // Check if it's the first time seeing a moving platform
          if (!hasSeenMovingPlatformTutorial && elapsedTime >= 10) {
            hasSeenMovingPlatformTutorial = true;
            setTimeout(() => {
              showInstructionOverlay("movingPlatform");
            }, 500); // Small delay to ensure platform is visible
          }
        }

        if (!newPlatform.isMoving && Math.random() < 0.03) {
          const powerUp = new THREE.Mesh(powerUpGeometry, powerUpMaterial);
          powerUp.position.set(
            newPlatform.position.x,
            newPlatform.position.y + 0.5,
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

    // Move platforms if they are moving
    if (elapsedTime >= 10) {
      platforms.forEach((platform) => {
        if (platform.isMoving) {
          const nextX =
            platform.position.x + platform.direction * platform.speed;

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

    // Power-up handling with tutorial integration
    for (let i = powerUps.length - 1; i >= 0; i--) {
      const powerUp = powerUps[i];
      powerUp.position.y -= currentPlatformSpeed;
      powerUp.rotation.x += 0.01;
      powerUp.rotation.y += 0.01;

      // Remove off-screen power-ups
      if (powerUp.position.y < -20) {
        scene.remove(powerUp);
        powerUps.splice(i, 1);
        continue;
      }

      // Check if this is the first super jump the player is about to collect
      const dx = piggy.position.x - powerUp.position.x;
      const dy = piggy.position.y - powerUp.position.y;
      const distanceSq = dx * dx + dy * dy;
      
      // If the player is getting close to their first power-up, show the tutorial
      const closeToFirstPowerUp = distanceSq < (piggyHalfWidth + 1.5) ** 2;
      if (!hasSeenSuperJumpTutorial && closeToFirstPowerUp) {
        hasSeenSuperJumpTutorial = true;
        showInstructionOverlay("superJump");
        break; // Break the loop to prevent further processing until the tutorial is closed
      }

      // Actual collision detection
      if (distanceSq < (piggyHalfWidth + 0.3) ** 2) {
        scene.remove(powerUp);
        powerUps.splice(i, 1);
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
    }

    // Game over check
    if (piggy.position.y < -window.innerHeight / 20) {
      gameOver = true;

      // Save high scores if current scores are higher
      if (elapsedTime > highestTime) {
        highestTime = elapsedTime;
        localStorage.setItem("highestTime", highestTime.toString());
      }

      if (score > highestScore) {
        highestScore = score;
        localStorage.setItem("highestScore", highestScore.toString());
      }

      // Game over overlay
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

      // Game over image
      const image = document.createElement("img");
      image.src = "assets/images/gameover.png";
      image.alt = "Game Over";
      image.style.width = "400px";
      image.style.marginBottom = "30px";
      overlay.appendChild(image);

      // Game over message container
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
            <span>Time Survived:</span> <span style="font-weight: bold;">${elapsedTime.toFixed(2)} s</span>
          </div>
          <hr style="border: 0; height: 1px; background: #ccc; margin: 10px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span>Highest Score:</span> <span style="font-weight: bold;">${highestScore}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>Best Time:</span> <span style="font-weight: bold;">${highestTime.toFixed(2)} s</span>
          </div>
        </div>
      `;

      overlay.appendChild(message);

      // Restart button
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
        document.body.removeChild(overlay);
        restartGame();
      });
      overlay.appendChild(restartButton);

      document.body.appendChild(overlay);
    }

    // Update HUD with separate elements
    document.getElementById("time").textContent = `Time: ${elapsedTime.toFixed(
      2
    )}`;
    document.getElementById("score").textContent = `Score: ${score}`;
    document.getElementById("best").textContent = `Best: ${highestScore}`;

    renderer.render(scene, camera);
  }
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
  
  // Reset tutorial flags
  hasSeenSuperJumpTutorial = false;
  hasSeenMovingPlatformTutorial = false;
  
  if (superJumpTimeout) {
    clearTimeout(superJumpTimeout);
    superJumpTimeout = null;
  }

  // Also, clear power-ups
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
  
  // Initialize tutorial flags
  hasSeenSuperJumpTutorial = false;
  hasSeenMovingPlatformTutorial = false;

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

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});