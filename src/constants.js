// Constants
export const GAME_CONSTANTS = {
  JUMP: {
    NORMAL: 0.4,
    SUPER: 0.6,
    COOLDOWN: {
      MIN: 300,
      MAX: 500,
      DECAY_RATE: 2.5,
    },
  },
  PLATFORM: {
    SPEED: {
      INITIAL: 0.05,
      MAX: 0.115,
      INCREASE_RATE: 0.0005,
    },
    SPAWN: {
      BASE_INTERVAL: 100,
      HEIGHT: 20,
      MOVING_CHANCE: 0.3,
      MOVING_RANGE: 6,
      MOVING_SPEED: 0.05,
    },
    SIZE: {
      WIDTH: 5,
      HEIGHT: 0.5,
      DEPTH: 1,
    },
  },
  BULLET: {
    SPAWN_INTERVAL: 2000,
    SPEED: 0.15,
    PUSH_FORCE: 0.4,
    PUSH_DECAY: 0.85,
    PUSH_MAX_SPEED: 0.3,
    PUSH_DURATION: 45,
    RADIUS: 0.3,
  },
  PIGGY: {
    SCALE: 1.5,
    MOVE_SPEED: 0.1,
  },
  STAR: {
    SCALE: 1.0,
    SPAWN_CHANCE: 0.03,
    Y_OFFSET: 1.0,
  },
  SHIELD: {
    SCALE: 0.3,
    SPAWN_CHANCE: 0.03,
    Y_OFFSET: 1.5,
    DURATION: 15000,
  },
  GRAVITY: -0.02,
  BACKGROUND: {
    CHANGE_INTERVAL: 60,
    COLORS: {
      DAY: 0x87ceeb,
      NIGHT: 0x0f0525,
    },
  },
  AUDIO: {
    BGM_VOLUME: 0.2,
    SFX_VOLUME: 0.3,
    JUMP_VOLUME_OFFSET: -0.2,
  },
};
