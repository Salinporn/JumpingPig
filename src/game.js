import * as THREE from "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js";
// import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three/examples/jsm/loaders/GLTFLoader.js";


class AngryCatsGame {
  constructor() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Game state management
    this.gameStage = "INITIAL_POSITION";
    this.objects = [];
    this.gravity = new THREE.Vector3(0, -9.8, 0);

    // Cat and launch parameters
    this.launchAngleHorizontal = 0;
    this.launchAngleVertical = 0;
    this.launchPower = 15;

    // Aiming line
    this.aimLine = null;

    // Setup game elements
    this.setupScene();
    this.setupEventListeners();

    // Add UI overlay
    this.addUIOverlay();

    // Start animation
    this.animate();
  }

  setupScene() {
    // Scene background
    this.scene.background = new THREE.Color(0x87ceeb);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    this.scene.add(ambientLight, directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8bc34a });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    this.scene.add(ground);

    // Cat
    const catGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const catMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.cat = new THREE.Mesh(catGeometry, catMaterial);
    this.cat.position.set(-10, 2, 0);
    this.scene.add(this.cat);

    // Blocks
    this.createBlockStructure();

    // Initial camera position
    this.positionCameraForInitialAim();
  }

  addUIOverlay() {
    this.uiOverlay = document.createElement("div");
    this.uiOverlay.style.position = "absolute";
    this.uiOverlay.style.top = "10px";
    this.uiOverlay.style.left = "10px";
    this.uiOverlay.style.color = "white";
    this.uiOverlay.style.background = "rgba(0,0,0,0.5)";
    this.uiOverlay.style.padding = "10px";
    this.uiOverlay.style.borderRadius = "5px";
    this.uiOverlay.textContent = "Adjust Horizontal Angle (Left/Right)";
    document.body.appendChild(this.uiOverlay);
  }

  updateUIOverlay() {
    if (!this.uiOverlay) return;
    switch (this.gameStage) {
      case "VERTICAL_AIM":
        this.uiOverlay.textContent = "Adjust Vertical Angle (Up/Down)";
        break;
      case "LAUNCHED":
        this.uiOverlay.textContent = "Cat Launched!";
        break;
    }
  }

  createBlockStructure() {
    const blockColors = [0xff5722, 0x795548, 0x9c27b0];

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
        const blockMaterial = new THREE.MeshStandardMaterial({
          color: blockColors[Math.floor(Math.random() * blockColors.length)],
        });
        const block = new THREE.Mesh(blockGeometry, blockMaterial);

        block.position.set(10 + j * 1.5, -1 + i * 1.5, 0);
        this.scene.add(block);
        this.objects.push(block);
      }
    }
  }

  calculateLaunchVector() {
    const horizontalRad = this.launchAngleHorizontal;
    const verticalRad = this.launchAngleVertical;

    const directionX = Math.cos(verticalRad) * Math.cos(horizontalRad);
    const directionY = Math.sin(verticalRad);
    const directionZ = Math.cos(verticalRad) * Math.sin(horizontalRad);

    return new THREE.Vector3(
      directionX * this.launchPower,
      directionY * this.launchPower,
      directionZ * this.launchPower
    );
  }

  createAimLine() {
    // Remove existing aim line if it exists
    if (this.aimLine) {
      this.scene.remove(this.aimLine);
    }

    // Calculate launch vector for visualization
    const launchVector = this.calculateLaunchVector();

    // Create a line geometry to show trajectory
    const points = [];
    const numPoints = 20;
    const gravity = this.gravity.y;

    for (let i = 0; i < numPoints; i++) {
      const t = i * 0.1;
      const x = this.cat.position.x + launchVector.x * t;
      const y = this.cat.position.y + launchVector.y * t + 0.5 * gravity * t * t;
      const z = this.cat.position.z + launchVector.z * t;
      points.push(new THREE.Vector3(x, y, z));
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });
    this.aimLine = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(this.aimLine);
  }

  positionCameraForInitialAim() {
    this.camera.position.set(
      this.cat.position.x - 5,
      this.cat.position.y + 3,
      this.cat.position.z
    );
    this.camera.lookAt(10, 2, 0);

    this.gameStage = "INITIAL_POSITION";
    this.updateUIOverlay();
  }

  positionCameraForVerticalAim() {
    this.camera.position.set(
      this.cat.position.x + 15,
      this.cat.position.y + 3,
      this.cat.position.z + 20
    );

    this.camera.lookAt(5, 2, -10);

    this.gameStage = "VERTICAL_AIM";
    this.updateUIOverlay();
  }

  setupEventListeners() {
    this.renderer.domElement.addEventListener(
      "click",
      this.handleClick.bind(this),
      false
    );
    window.addEventListener(
      "mousemove",
      this.handleMouseMove.bind(this),
      false
    );
    window.addEventListener("resize", this.onWindowResize.bind(this), false);
  }

  handleClick(event) {
    switch (this.gameStage) {
      case "INITIAL_POSITION":
        this.positionCameraForVerticalAim();
        break;
      case "VERTICAL_AIM":
        this.launchCat();
        break;
    }
  }

  handleMouseMove(event) {
    if (!this.gameStage) return;

    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    switch (this.gameStage) {
      case "INITIAL_POSITION":
        this.launchAngleHorizontal = (mouseX * Math.PI) / 4;
        this.createAimLine();
        break;
      case "VERTICAL_AIM":
        this.launchAngleVertical = (mouseY * Math.PI) / 4;
        this.createAimLine();
        break;
    }
  }

  launchCat() {
    // Use the combined launch vector
    this.cat.velocity = this.calculateLaunchVector();
    this.gameStage = "LAUNCHED";
    this.updateUIOverlay();

    // Remove aim line when cat is launched
    if (this.aimLine) {
      this.scene.remove(this.aimLine);
      this.aimLine = null;
    }
  }

  updatePhysics(deltaTime) {
    if (this.cat.velocity) {
      this.cat.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
      this.cat.position.add(
        this.cat.velocity.clone().multiplyScalar(deltaTime)
      );

      // Ground collision
      if (this.cat.position.y < -2) {
        this.cat.velocity.set(0, 0, 0);
      }

      // Block collision
      this.objects.forEach((block) => {
        const distance = this.cat.position.distanceTo(block.position);
        if (distance < 1) {
          this.scene.remove(block);
          this.objects = this.objects.filter((obj) => obj !== block);
        }
      });
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    const deltaTime = 0.016;
    this.updatePhysics(deltaTime);

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the game
const game = new AngryCatsGame();
