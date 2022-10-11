const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');
const CFG = require('../game-config');

const SanloStyles = require('../styles/sanlo');
const FuturamaStyles = require('../styles/futurama');
const ClassicStyles = require('../styles/classic');

class Projectile extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "projectile";
    this.collidable = true;

    this.speed = 18;
    this.velocity = {
      x: opts.baseVelocity.x + (this.speed * opts.aim.x),
      y: opts.baseVelocity.y + (this.speed * opts.aim.y),
    };

		this.z = 1000000;

    this.aim = opts.aim || {
      x: 0,
      y: 0,
    };
    this.length = 10;
    const tip = {
      x: this.x + (opts.aim.x * this.length),
      y: this.y + (opts.aim.y * this.length),
    };

    this.tip = tip;
    this.og = {
      x: this.x,
      y: this.y,
    };
		this.width = Math.abs(tip.x - this.x);
		this.height = Math.abs(tip.y - this.y);

    this.projectile_diff = {
      x: this.tip.x - this.x,
      y: this.tip.y - this.y,
    };

    const trueX = tip.x < this.x ? tip.x : this.x;
    const trueY = tip.y < this.y ? tip.y : this.y;
    this.x = trueX;
    this.y = trueY;

    this.generateSegments();

    window.setTimeout(() => {
      this.shutdown();
    }, 700)

		return this;
	}

  generateSegments () {
    this.theme = CFG.theme;
    switch (this.theme) {
      case 'classic':
        ClassicStyles.generateProjectile(this);
        break;
      case 'futurama':
        FuturamaStyles.generateProjectile(this);
        break;
      default: // "sanlo"
        SanloStyles.generateProjectile(this);
        break;
    }
  }

	update () {
    if (CFG.theme !== this.theme) {
      this.generateSegments();
    }
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}

  resolveCollision (collision_point, collision_data) {
    if (this.resolved) return;

    // What the shots will eventually do
    // also spawn a particle effect
    this.shutdown();

    // Set the tip of the projectile to the collision
    // point and update the other stuffs accordingly
    const tip = collision_point;
    const tail = {
      x: tip.x - this.projectile_diff.x,
      y: tip.y - this.projectile_diff.y,
    };
    const trueX = tip.x < tail.x ? tip.x : tail.x;
    const trueY = tip.y < tail.y ? tip.y : tail.y;
    this.x = trueX;
    this.y = trueY;

    // Kill the speed for debugging purposes
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.resolved = true;
  }
}

module.exports = Projectile;
