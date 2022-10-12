const AudioPlayer = require('audio-player');

const thrusterSound = require('sounds/thrusters.mp3');
const laserSound = require('sounds/laser.mp3');
const explosionSound = require('sounds/explosion.mp3');
const goldSound = require('sounds/gold.mp3');
const thudSound = require('sounds/thud3.mp3');

const TRACKS = {
  thruster: {
    src: thrusterSound,
    loop: true,
    volume: 0.65,
  },
  laser: {
    src: laserSound,
    loop: false,
    volume: 0.03,
  },
  explosion: {
    src: explosionSound,
    loop: false,
    volume: 0.2,
  },
  gold: {
    src: goldSound,
    loop: false,
    volume: 0.2,
  },
  thud: {
    src: thudSound,
    loop: false,
    volume: 0.3,
  },
};

class AudioManager {
  constructor () {
    this.tracks = TRACKS;

    this.players = {};

    Object.keys(this.tracks).forEach((trackName) => {
      this.players[trackName] = new AudioPlayer(this.tracks[trackName]);
    });
  }

  playOnce (trackName) {
    const oneOff = new AudioPlayer(this.tracks[trackName]);
    oneOff.play();
    return this;
  }

  pauseAll () {
    Object.keys(this.players).forEach((player) => {
      this.players[player].pause();
    });
    return this;
  }

  shutdown () {
    Object.keys(this.players).forEach((player) => {
      this.players[player].shutdown();
    });
    return this;
  }
}

module.exports = AudioManager;
