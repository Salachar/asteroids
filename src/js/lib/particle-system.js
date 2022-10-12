const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const Particle = require('./particle');

const { getRandom } = require('lib/random');
const { rotatePointCounterClockwise } = require('math');

const setNumberProperty = (property) => {
  if (typeof property === 'object') return property;
  return {
    value: property,
  };
};

const setColorProperty = (property) => {

};

class ParticleSystem extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "particles";
    this.cross_boundary = false;
    this.render = false;

    this.neon = opts.neon || true;
    this.radius = setNumberProperty(opts.radius || 10);
    this.speed = setNumberProperty(opts.speed || 0);
    this.particleLifetime = setNumberProperty(opts.particleLifetime || 200);
    this.spawnMethod = opts.spawnMethod || 'single';
    this.amount = opts.amount || 3;
    this.partcles = [];

    this.generateParticles(opts);

    if (this.spawnMethod === 'single') {
      this.shutdown();
    }

		return this;
	}

  generateParticles (opts) {
    for (let i = 0; i < this.amount; ++i) {
      let speedMod = this.speed.value;
      if (this.speed.random) {
        speedMod = getRandom(
          speedMod * this.speed.random[0],
          speedMod * this.speed.random[1]
        );
      }

      let velocity = {
        x: opts.baseVelocity.x + (speedMod * opts.aim.x),
        y: opts.baseVelocity.y + (speedMod * opts.aim.y),
      };
      if (opts.aim.random) {
        velocity = rotatePointCounterClockwise(
          velocity,
          getRandom(opts.aim.random[0], opts.aim.random[1])
        );
      }

      let lifetime = this.particleLifetime.value;
      if (this.particleLifetime.random) {
        lifetime = getRandom(
          lifetime * this.particleLifetime.random[0],
          lifetime * this.particleLifetime.random[1]
        );
      }

      this.partcles.push(new Particle({
        world: opts.world,
        radius: this.radius.value,
        neon: this.neon,
        color: opts.color,
        spawn: opts.spawn,
        velocity,
        lifetime,
      }));
    }
  }

	update () {}
}

module.exports = ParticleSystem;
