const GOM = require('core/game-object-manager');
const GIM = require('core/game-input-manager');
const GOB = require('core/game-object-base');
const CFG = require('../game-config');

const SanloStyles = require('../styles/sanlo');
const FuturamaStyles = require('../styles/futurama');
const ClassicStyles = require('../styles/classic');

const AudioManager = require('audio-manager');
const Projectile = require('./projectile');
const { PI, HALF_PI,
  clampRadians,
  getMagnitude,
  getUnitVector,
  rotatePointCounterClockwise,
 } = require('math');

class Player extends GOB {
	constructor (opts = {}) {
		super(opts);

    this.id = "player";
    this.type = "ship";
    this.collidable = true;
    this.invincible = false;
    this.width = 40; // 2x3
    this.height = 40;
    this.rotationSpeed = PI / 72;
		this.theta = Math.PI / 2;
    this.invincible_time = opts.invincible_time || 0;

    if (this.invincible_time) {
      this.collidable = false;
      this.invincible = true;
      // this.opacity = 0.5;
      window.setTimeout(() => {
        this.collidable = true;
        this.invincible = false;
        // this.opacity = 1;
      }, this.invincible_time)
    }

    // Custom
    this.max_speed = 6;
    this.thrust = {
      active: false,
      power: 0.085,
    };

    this.audioManager = new AudioManager({
      thruster: {
        src: require('sounds/thrusters.mp3'),
        loop: true,
        volume: 0.65,
      },
      laser: {
        src: require('sounds/laser.mp3'),
        loop: false,
        volume: 0.03,
      },
      explosion: {
        src: require('sounds/explosion.mp3'),
        loop: false,
        volume: 0.2,
      },
      gold: {
        src: require('sounds/gold.mp3'),
        loop: false,
        volume: 0.2,
      },
    })

    this.weaponFirable = true;
    this.weaponTimer = null;

    this.generateSegments();
    return this;
  }

  generateSegments () {
    this.ship = CFG.ship;
    switch (this.ship) {
      case 'classic':
        ClassicStyles.generateShip(this);
        break;
      case 'futurama':
        FuturamaStyles.generateShip(this);
        break;
      default: // "sanlo"
        SanloStyles.generateShip(this);
        break;
    }
  }

  getPlayerHeadingVector () {
    return {
      x: Math.cos(this.theta - HALF_PI),
      y: Math.sin(this.theta - HALF_PI),
    };
  }

  checkPlayerMovement () {
    if (GIM.isKeyDown('W UP')) {
      this.thrust.active = true;
    } else {
      this.thrust.active = false;
    }

    if (GIM.isKeyDown('A LEFT')) {
      this.rotation = -1 * this.rotationSpeed;
    }

    if (GIM.isKeyDown('D RIGHT')) {
      this.rotation = this.rotationSpeed;
    }

    if (!GIM.isKeyDown('A LEFT D RIGHT')) {
      this.rotation = 0;
    }
  }

	update () {
    if (this.dead) return;

    if (CFG.ship !== this.ship) {
      this.generateSegments();
    }

    const playerHeadingVector = this.getPlayerHeadingVector();

    this.theta += this.rotation;
    this.theta = clampRadians(this.theta);

    if (this.thrust.active) {
      this.audioManager.players.thruster.play();
      this.velocity.x += (playerHeadingVector.x * this.thrust.power);
      this.velocity.y += (playerHeadingVector.y * this.thrust.power);
    } else {
      this.audioManager.players.thruster.pause();
    }

    const velMag = getMagnitude(this.velocity);
    if (velMag > this.max_speed) {
      this.velocity.x *= (this.max_speed / velMag);
      this.velocity.y *= (this.max_speed / velMag);
    }
    this.x += this.velocity.x;
		this.y += this.velocity.y;

    // Particles after position update otherwise they will
    // emit from the previous location
    if (this.thrust.active) {
      this.thrustParticles(playerHeadingVector);
    }
  }

  keyDown (key) {
    if (this.dead) return;
    this.checkPlayerMovement();
    if (GIM.isKeyDown('SPACE')) {
      this.fireWeapon();
    }
  }

  keyUp (key) {
    if (this.dead) return;
    this.checkPlayerMovement();
  }

  fireWeapon () {
    if (!this.weaponFirable) return;

    const playerHeadingVector = this.getPlayerHeadingVector();
    this.audioManager.playOnce("laser");
    new Projectile({
      world: this.world,
      layer: GOM.front,
      spawner: this,
      // spawn: rotatePointCounterClockwise(
      //   this.uniquePoints.cannon,
      //   this.theta,
      //   this.getCenter(),
      // ),
      spawn: this.getCenter(),
      baseVelocity: this.velocity,
      aim: playerHeadingVector,
    });

    this.cannonParticles(playerHeadingVector);

    this.weaponFirable = false;
    window.setTimeout(() => {
      this.weaponFirable = true;
    }, 500);
  }

  cannonParticles (playerHeadingVector) {
    SanloStyles.cannonParticles(this, playerHeadingVector);
  }

  thrustParticles (playerHeadingVector) {
    switch (CFG.ship) {
      case 'classic':
        ClassicStyles.thrustParticles(this, playerHeadingVector);
        break;
      case 'futurama':
        FuturamaStyles.thrustParticles(this, playerHeadingVector);
        break;
      default: // "sanlo"
        SanloStyles.thrustParticles(this, playerHeadingVector);
        break;
    }
  }

  resolveCollision (collision_point, collision_data) {
    const { other_obj } = collision_data;
    if (other_obj.type === 'asteroid') {
      if (other_obj.radius <= this.radius) {
        this.audioManager.pauseAll().playOnce("gold");
        SanloStyles.pickupGoldParticles({
          world: this.world,
          direction: getUnitVector({
            x: this.x - other_obj.x,
            y: this.y - other_obj.y,
          }),
          baseVelocity: this.velocity,
          spawn: other_obj.center,
        });
        other_obj.shutdown();
      } else {
        this.world.handlePlayerDeath();
        // Pause all playing audio (mainly thrusters)
        this.audioManager.pauseAll().playOnce("explosion");
        // Don't render the player anymore. If I go with the
        // segmented death, they will be new objects, not part
        // of the player
        this.render = false;
        this.collidable = false;
        // Custom property to the player
        this.dead = true;
      }
    }
  }

  drawCustom () {
    const c = this.context;
    if (this.invincible) {
      c.save();
        c.beginPath();
        c.arc(
          this.x + this.half_width,
          this.y + this.half_height,
          this.radius * 1.25,
          0,
          2 * Math.PI
        );
        // redStroke(c);
        c.closePath();
        c.globalAlpha = 0.25;
        c.fillStyle = '#FFFFFF';
        c.fill();
      c.restore();
    }
  }
}

module.exports = Player;
