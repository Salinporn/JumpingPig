import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.119/build/three.module.js";
import { GAME_CONSTANTS } from "../constants.js";

export class AudioManager {
  constructor(camera) {
    this.camera = camera;
    this.audioListener = new THREE.AudioListener();
    this.audio = null;
    this.camera.add(this.audioListener);

    this.audio = {
      bgmVolume: GAME_CONSTANTS.AUDIO.BGM_VOLUME,
      sfxVolume: GAME_CONSTANTS.AUDIO.SFX_VOLUME,
      isMuted: false,
      sounds: {},
    };
  
    this.loadAudioFiles();
  }

  loadAudioFiles() {
    const soundLoader = new THREE.AudioLoader();
    const audioFiles = [
      {
        name: "jump",
        path: "assets/audios/jump.mp3",
        volume: this.audio.sfxVolume + GAME_CONSTANTS.AUDIO.JUMP_VOLUME_OFFSET,
      },
      {
        name: "bgMusic",
        path: "assets/audios/bgMusic.wav",
        volume: this.audio.bgmVolume,
        loop: true,
      },
      {
        name: "star",
        path: "assets/audios/star.wav",
        volume: this.audio.sfxVolume,
      },
      {
        name: "bgGameOver",
        path: "assets/audios/bgGameOver.mp3",
        volume: this.audio.bgmVolume,
        loop: true,
      },
      {
        name: "click",
        path: "assets/audios/click.wav",
        volume: this.audio.sfxVolume,
      },
      {
        name: "bulletHit",
        path: "assets/audios/pig_scream.mp3",
        volume: this.audio.sfxVolume,
      },
    ];

    audioFiles.forEach((file) => {
      soundLoader.load(file.path, (buffer) => {
        const sound = new THREE.Audio(this.audioListener);
        sound.setBuffer(buffer);
        sound.setVolume(file.volume);
        if (file.loop) sound.setLoop(true);
        this.audio.sounds[file.name] = sound;

        if (file.name === "bgMusic" && !this.audio.isMuted) {
          sound.play();
        }
      });
    });
  }

  playSound(name) {
    if (this.audio.sounds[name] && !this.audio.isMuted) {
      this.audio.sounds[name].play();
    }
  }
}
