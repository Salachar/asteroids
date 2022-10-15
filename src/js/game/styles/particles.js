const ParticleSystem = require('lib/particle-system');
const { color } = require('lib/color');
const { HALF_PI } = require('math');

const Particles = {
  asteroidImpactParticles (opts = {}) {
    const {
      world,
      direction,
      spawn,
      baseVelocity,
    } = opts;

    new ParticleSystem({
      world,
      neon: true,
      amount: 3,
      radius: 3,
      color: {
        value: color(255, 255, 255),
        to: color(213, 72, 168),
      },
      particleLifetime: {
        value: 200,
        random: [0.6, 1.2],
      },
      spawn,
      baseVelocity,
      speed: {
        value: 2,
        random: [0.5, 1.25],
      },
      aim: {
        x: direction.x * -1,
        y: direction.y * -1,
        random: [-0.2, 0.2],
      },
    });
  },

  asteroidExplosionParticles (opts = {}) {
    const {
      world,
      color,
      spawn,
    } = opts;

    new ParticleSystem({
      world,
      neon: true,
      amount: 5,
      radius: 8,
      color: color,
      particleLifetime: {
        value: 200,
        random: [0.6, 1.2],
      },
      spawn,
      baseVelocity: {
        x: 0,
        y: 0,
      },
      speed: {
        value: 1.75,
        random: [1, 1.25],
      },
      aim: {
        x: 1,
        y: 0,
        random: [-HALF_PI, HALF_PI],
      },
    });
  },

  pickupGoldParticles (opts = {}) {
    const {
      world,
      direction,
      spawn,
    } = opts;

    new ParticleSystem({
      world,
      neon: true,
      amount: 3,
      radius: 3,
      color: {
        value: color(255, 255, 255),
        to: color(255, 215, 0),
      },
      particleLifetime: 200,
      spawn,
      baseVelocity: {
        x: 0,
        y: 0,
      },
      speed: 1.5,
      aim: direction,
    });
  },
};

module.exports = Particles;
