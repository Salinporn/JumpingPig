import * as THREE from 'three';

class AngryBirdsGame {
    constructor() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(this.renderer.domElement);

        // Game state management
        this.gameStage = 'INITIAL_POSITION';
        this.objects = [];
        this.gravity = new THREE.Vector3(0, -9.8, 0);

        // Bird and launch parameters
        this.launchAngleHorizontal = 0;
        this.launchAngleVertical = 0;
        this.launchPower = 0;

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
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue background

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(ambientLight, directionalLight);

        // Ground
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x8BC34A });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2;
        this.scene.add(ground);

        // Bird
        const birdGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const birdMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
        this.bird = new THREE.Mesh(birdGeometry, birdMaterial);
        this.bird.position.set(-10, 2, 0);
        this.scene.add(this.bird);

        // Blocks
        this.createBlockStructure();

        // Initial camera position
        this.positionCameraForInitialAim();
    }

    addUIOverlay() {
        this.uiOverlay = document.createElement('div');
        this.uiOverlay.style.position = 'absolute';
        this.uiOverlay.style.top = '10px';
        this.uiOverlay.style.left = '10px';
        this.uiOverlay.style.color = 'white';
        this.uiOverlay.style.background = 'rgba(0,0,0,0.5)';
        this.uiOverlay.style.padding = '10px';
        this.uiOverlay.style.borderRadius = '5px';
        document.body.appendChild(this.uiOverlay);
    }

    updateUIOverlay() {
        if (!this.uiOverlay) return;

        switch(this.gameStage) {
            case 'INITIAL_POSITION':
                this.uiOverlay.textContent = 'Adjust Horizontal Angle (Left/Right)';
                break;
            case 'VERTICAL_AIM':
                this.uiOverlay.textContent = 'Adjust Vertical Angle (Up/Down)';
                break;
            case 'LAUNCHED':
                this.uiOverlay.textContent = 'Bird Launched!';
                break;
        }
    }

    createBlockStructure() {
        const blockColors = [0xFF5722, 0x795548, 0x9C27B0];
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const blockGeometry = new THREE.BoxGeometry(1, 1, 1);
                const blockMaterial = new THREE.MeshStandardMaterial({ 
                    color: blockColors[Math.floor(Math.random() * blockColors.length)] 
                });
                const block = new THREE.Mesh(blockGeometry, blockMaterial);
                
                block.position.set(10 + j * 1.5, -1 + i * 1.5, 0);
                this.scene.add(block);
                this.objects.push(block);
            }
        }
    }

    createAimLine() {
        // Remove existing aim line if it exists
        if (this.aimLine) {
            this.scene.remove(this.aimLine);
        }

        // Calculate launch vector for visualization
        const power = 15;
        const launchVector = new THREE.Vector3(
            Math.cos(this.launchAngleHorizontal) * power,
            Math.sin(this.launchAngleVertical) * power,
            0
        );

        // Create a line geometry to show trajectory
        const points = [];
        const numPoints = 20;
        const gravity = -9.8;

        for (let i = 0; i < numPoints; i++) {
            const t = i * 0.1;
            const x = this.bird.position.x + launchVector.x * t;
            const y = this.bird.position.y + launchVector.y * t + 0.5 * gravity * t * t;
            points.push(new THREE.Vector3(x, y, this.bird.position.z));
        }

        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        this.aimLine = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(this.aimLine);
    }

    positionCameraForInitialAim() {
        // Move camera behind the bird, looking at blocks
        this.camera.position.set(this.bird.position.x - 5, this.bird.position.y + 3, this.bird.position.z);
        this.camera.lookAt(10, 2, 0); // Adjust to aim at blocks
    
        this.gameStage = 'INITIAL_POSITION';
        this.updateUIOverlay();
    }

    positionCameraForVerticalAim() {
        // Reduce Z-offset to bring the camera closer
        this.camera.position.set(this.bird.position.x + 15, this.bird.position.y + 3, this.bird.position.z + 20);
    
        // Keep the same focus on blocks
        this.camera.lookAt(5, 2, -10);
    
        this.gameStage = 'VERTICAL_AIM';
        this.updateUIOverlay();
    }

    setupEventListeners() {
        this.renderer.domElement.addEventListener('click', this.handleClick.bind(this), false);
        window.addEventListener('mousemove', this.handleMouseMove.bind(this), false);
        window.addEventListener('resize', this.onWindowResize.bind(this), false);
    }

    handleClick(event) {
        switch(this.gameStage) {
            case 'INITIAL_POSITION':
                this.positionCameraForVerticalAim();
                break;
            case 'VERTICAL_AIM':
                this.launchBird();
                break;
        }
    }

    handleMouseMove(event) {
        if (!this.gameStage) return;

        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        switch(this.gameStage) {
            case 'INITIAL_POSITION':
                // Horizontal angle adjustment
                this.launchAngleHorizontal = mouseX * Math.PI / 4;
                this.createAimLine();
                break;
            case 'VERTICAL_AIM':
                // Vertical angle adjustment
                this.launchAngleVertical = mouseY * Math.PI / 4;
                this.createAimLine();
                break;
        }
    }

    launchBird() {
        // Calculate launch vector based on angles and power
        const power = 15; // Base launch power
        const launchVector = new THREE.Vector3(
            Math.cos(this.launchAngleHorizontal) * power,
            Math.sin(this.launchAngleVertical) * power,
            0
        );

        this.bird.velocity = launchVector;
        this.gameStage = 'LAUNCHED';
        this.updateUIOverlay();

        // Remove aim line when bird is launched
        if (this.aimLine) {
            this.scene.remove(this.aimLine);
            this.aimLine = null;
        }
    }

    updatePhysics(deltaTime) {
        if (this.bird.velocity) {
            this.bird.velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
            this.bird.position.add(this.bird.velocity.clone().multiplyScalar(deltaTime));

            // Ground collision
            if (this.bird.position.y < -2) {
                this.bird.velocity.set(0, 0, 0);
            }

            // Block collision
            this.objects.forEach(block => {
                const distance = this.bird.position.distanceTo(block.position);
                if (distance < 1) {
                    this.scene.remove(block);
                    this.objects = this.objects.filter(obj => obj !== block);
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
const game = new AngryBirdsGame();