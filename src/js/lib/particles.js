const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const Particle = require('./particle');

const { getRandom } = require('lib/random');
const { rotatePointCounterClockwise } = require('math');

class Particles extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "particles";
    this.cross_boundary = false;
    this.render = false;

    this.spawnMethod = opts.spawnMethod || 'single';
    this.speed = opts.speed || 0;
    this.amount = opts.amount || 2;
    this.particleLifetime = opts.particleLifetime;

    // this.lifetime = opts.lifetime;
    // this.delay = null;
    // this.delay_between_particles = null;
    // this.shape = opts.shape || 'circle',
    // this.deviation = opts.deviation || '10',

    this.partcles = [];
    for (let i = 0; i < this.amount; ++i) {

      let speedMod = opts.speed.value;
      if (opts.speed.random) {
        speedMod = getRandom(
          speedMod * opts.speed.random[0],
          speedMod * opts.speed.random[1]
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

      let lifetime = opts.particleLifetime.value;
      if (opts.particleLifetime.random) {
        lifetime = getRandom(
          lifetime * opts.particleLifetime.random[0],
          lifetime * opts.particleLifetime.random[1]
        );
      }

      this.partcles.push(new Particle({
        world: opts.world,
        neon: opts.neon,
        color: opts.color,
        spawn: opts.spawn,
        velocity,
        lifetime,
      }));
    }

    if (this.spawnMethod === 'single') {
      this.shutdown();
    }

		return this;
	}

	update () {}
}

module.exports = Particles;
