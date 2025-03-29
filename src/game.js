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
  scene.add(platform);
  platforms.push(platform);
  initialPlatforms.push(platform);
});

// Piggy variables
let piggy = null;
let piggyHalfHeight = 0.5;
let piggyHalfWidth = 0.5;

const objLoader = new OBJLoader();
objLoader.load(
  "asset/piggy.obj",
  (object) => {
    piggy = object;
    let firstMesh = null;

    object.traverse((child) => {
      if (child.isMesh) {
        firstMesh = child;
        child.material = new THREE.MeshStandardMaterial({
          color: 0xffc7fa,
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
let elapsedTime = 0;
let gameOver = false;
let startTime;
const piggyMoveSpeed = 0.1;
const jumpForce = 0.4;
let hasJumped = false;
let isGrounded = true;
let dynamicJumpCooldown = 500;
const MIN_JUMP_COOLDOWN = 300;
const MAX_PLATFORM_SPEED = 0.115;
let lastJumpTime = 0;
let highestTime = 0;

// Camera position
camera.position.z = 25;

// Keyboard input
const keys = {};
window.addEventListener("keydown", (event) => {
  keys[event.key] = true;
});
window.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

// Animation loop
function animate() {
  if (gameOver || !piggy) return;

  requestAnimationFrame(animate);

  velocity.add(gravity);
  piggy.position.add(velocity);

  // Update platform speed
  currentPlatformSpeed = Math.min(0.05 + score * 0.003, MAX_PLATFORM_SPEED);
  dynamicJumpCooldown = Math.max(500 - score * 15, MIN_JUMP_COOLDOWN);

  // Platform spawning
  if (hasJumped) {
    platformSpawnTimer++;
    const dynamicSpawnInterval = 100 * (0.05 / currentPlatformSpeed);
    if (platformSpawnTimer > dynamicSpawnInterval) {
      platformSpawnTimer = 0;
      const newPlatform = new THREE.Mesh(platformGeometry, platformMaterial);
      newPlatform.position.y = 20;
      newPlatform.position.x = (Math.random() - 0.5) * 8;
      platforms.push(newPlatform);
      scene.add(newPlatform);
    }
    elapsedTime = (Date.now() - startTime) / 1000;
    score = Math.floor(elapsedTime);
  }

  isGrounded = false;

  // Platform movement and collision
  for (let i = platforms.length - 1; i >= 0; i--) {
    if (hasJumped) {
      platforms[i].position.y -= currentPlatformSpeed;
    }

    // Collision detection
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

  // Piggy movement
  if (keys["a"] || keys["ArrowLeft"]) piggy.position.x -= piggyMoveSpeed;
  if (keys["d"] || keys["ArrowRight"]) piggy.position.x += piggyMoveSpeed;

  const currentTime = Date.now();
  if (
    (keys["w"] || keys["ArrowUp"] || keys[" "]) &&
    isGrounded &&
    currentTime - lastJumpTime >= dynamicJumpCooldown
  ) {
    velocity.y = jumpForce;
    isGrounded = false;
    hasJumped = true;
    lastJumpTime = currentTime;
  }

  // Game over check
  if (piggy.position.y < -window.innerHeight / 20) {
    gameOver = true;

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    overlay.style.color = "white";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.fontSize = "2rem";
    overlay.style.zIndex = "1000";

    const message = document.createElement("div");
    if (elapsedTime > highestTime) {
      highestTime = elapsedTime;
    }
    message.style.textAlign = "center";
    message.style.width = "100%";
    message.innerHTML = `Game Over!<br>Time Survived: ${elapsedTime.toFixed(
      2
    )} seconds<br>Highest Time: ${highestTime.toFixed(2)} seconds`;
    overlay.appendChild(message);

    const restartButton = document.createElement("button");
    restartButton.textContent = "Restart";
    restartButton.style.marginTop = "20px";
    restartButton.style.padding = "10px 20px";
    restartButton.style.fontSize = "1rem";
    restartButton.style.cursor = "pointer";
    restartButton.addEventListener("click", () => {
      document.body.removeChild(overlay);
      restartGame();
    });
    overlay.appendChild(restartButton);

    document.body.appendChild(overlay);
  }

  document.getElementById("time").textContent = `Time: ${elapsedTime.toFixed(
    2
  )}`;

  renderer.render(scene, camera);
}

// Restart game
function restartGame() {
  gameOver = false;
  score = 0;
  currentPlatformSpeed = 0.05;
  piggy.position.set(0, -1.25, 0);
  velocity.set(0, 0, 0);
  startTime = Date.now();
  hasJumped = false;
  isGrounded = true;
  lastJumpTime = 0;
  elapsedTime = 0;

  platforms.forEach((platform) => {
    if (!initialPlatforms.includes(platform)) {
      scene.remove(platform);
    }
  });
  platforms = [...initialPlatforms];

  initialPlatforms.forEach((platform, index) => {
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
  startTime = Date.now();
  hasJumped = false;
  isGrounded = true;
  lastJumpTime = 0;

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
