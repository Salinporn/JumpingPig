import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { GAME_CONSTANTS } from "../constants.js";

export class TutorialManager {
  constructor(state, audio, game) {
    this.state = state;
    this.AudioManager = audio;
    this.game = game;
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
          this.state.startTime =
            Date.now() - this.state.pausedElapsedTime * 1000;
          this.state.pausedElapsedTime = 0;
        }

        if (
          this.AudioManager.audio.sounds.bgMusic &&
          !this.AudioManager.audio.sounds.bgMusic.isPlaying &&
          !this.AudioManager.audio.isMuted
        ) {
          this.AudioManager.audio.sounds.bgMusic.play();
        }

        this.game.animate();
      }
    }, 1000);
  }
}
