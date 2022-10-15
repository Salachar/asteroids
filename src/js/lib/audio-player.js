class AudioPlayer {
  constructor (track = {}) {
    this.player = new Audio();
    this.player.loop = track.loop || false;
    this.player.volume = 0;
    this.player.src = track.src;


    this.volume = track.volume;

    this.rampUpTimer = null;
    this.rampDownTimer = null;

    // In milliseconds, 5 and 0.02 will
    // take volume from 0 to 1 in 250 milliseconds
    this.volumeRampSpeed = 0.02;
    this.rampSpeed = 5;

    return this;
  }

  play () {
    if (!this.player.src) return;
    if (this.rampDownTimer) {
      // Clear any timers for stopping audio
      window.clearInterval(this.rampDownTimer);
      this.rampDownTimer = null;
    }
    // Stop if the player is already going
    if (!this.player.paused || this.rampUpTimer) return;
    // Start playing before ramping up the volume, this will make
    // the start quieter but also help eliminate starting pops
    this.player.play();
    this.rampUpTimer = window.setInterval(() => {
      if (this.player.volume + this.volumeRampSpeed >= this.volume) {
        this.player.volume = this.volume;
        window.clearInterval(this.rampUpTimer);
        this.rampUpTimer = null;
      } else {
        this.player.volume += this.volumeRampSpeed;
      }
    }, this.rampSpeed);
  }

  pause () {
    if (!this.player.src) return;
    if (this.rampUpTimer) {
      // Clear any timers for starting audio
      window.clearInterval(this.rampUpTimer);
      this.rampUpTimer = null;
    }
    // Stop if the player is already paused
    if (this.player.paused || this.rampDownTimer) return;
    this.rampDownTimer = window.setInterval(() => {
      if (this.player.volume - this.volumeRampSpeed <= 0) {
        this.player.volume = 0;
        this.player.pause();
        window.clearInterval(this.rampDownTimer);
        this.rampDownTimer = null;
      } else {
        this.player.volume -= this.volumeRampSpeed;
      }
    }, this.rampSpeed);
  }

  shutdown () {
    this.player.volume = 0;
    this.player.pause();
    this.player.volume = 0;
    window.clearInterval(this.rampUpTimer);
    this.rampUpTimer = null;
    window.clearInterval(this.rampDownTimer);
    this.rampDownTimer = null;
    this.player.src = null;
  }
}

module.exports = AudioPlayer;
