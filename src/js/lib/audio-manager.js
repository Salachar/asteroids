const AudioPlayer = require('audio-player');

class AudioManager {
  constructor (tracks = {}) {
    this.tracks = tracks;

    this.players = {};

    Object.keys(tracks).forEach((trackName) => {
      this.players[trackName] = new AudioPlayer(tracks[trackName]);
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
