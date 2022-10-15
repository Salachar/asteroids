const ParticleSystem = require('lib/particle-system');
const { color } = require('lib/color');
const { rotatePointCounterClockwise } = require('math');

const SanloStyles = {
  generateShip: (game_obj) => {
    game_obj.q = 10;
    game_obj.width = game_obj.q * 4; // 2x3
    game_obj.height = game_obj.q * 6;

    const q = game_obj.q;
    const qq = q * 2;
    const qqq = q * 3;

    game_obj.segmentsList = [
      // RIGHT WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: q, y: 0 }, // TOP CONNECTOR
        { x: q * 1.5, y: q * 0.25 },
        { x: q * 1.75, y: q },
        { x: q * 1.75, y: qq * 0.8 },
        { x: q * 1.5, y: qqq * 0.9 },
        { x: q * 1.2, y: qq * 0.8 }, // END CONNECTOR
        { x: q * 0.9, y: qq * 0.65 }, // END CONNECTOR
        { x: q * 0.6, y: qq * 0.6 }, // END CONNECTOR
      ]),
      // LEFT WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: -q, y: 0 }, // TOP CONNECTOR
        { x: -q * 1.5, y: q * 0.25 },
        { x: -q * 1.75, y: q },
        { x: -q * 1.75, y: qq * 0.8 },
        { x: -q * 1.5, y: qqq * 0.9 },
        { x: -q * 1.2, y: qq * 0.8 }, // END CONNECTOR
        { x: -q * 0.9, y: qq * 0.65 }, // END CONNECTOR
        { x: -q * 0.6, y: qq * 0.6 }, // END CONNECTOR
      ]),
      // THRUSTER
      game_obj.createSegments([
        {
          fill: true,
          close: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: q * 0.5, y: q * 1.8 }, // TOP RIGHT
        { x: q * 0.4, y: qq + (q * 0.1) }, // BOTTOM RIGHT
        { x: 0, y: qq + (q * 0.1), id: 'thruster' }, // BOTTOM RIGHT
        { x: -q * 0.4, y: qq + (q * 0.1) }, // BOTTOM LEFT
        { x: -q * 0.5, y: q * 1.8 }, // TOP LEFT
      ]),
      // SHIP BODY
      game_obj.createSegments([
        {
          fill: true,
          close: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: 0, y: -qqq, id: 'cannon' }, // TIP
        { x: q * 0.7, y: -qq },
        { x: q, y: -q }, // BODY_TOP_RIGHT
        { x: q, y: 0 }, // BODY_BOTTOM_RIGHT
        { x: q * 0.5, y: q * 1.5 }, // END_RIGHT
        { x: -q * 0.5, y: q * 1.5 }, // END_LEFT
        { x: -q, y: 0 },  // BODY_BOTTOM_LEFT
        { x: -q, y: -q }, // BODY_TOP_LEFT
        { x: -q * 0.7, y: -qq },
      ]),
    ];

    game_obj.aesthetics = [
      // STRIPE (the lower down one)
      game_obj.createSegments([
        {
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: -q * 0.8, y: -q * 1.6 },
        { x: q * 0.8, y: -q * 1.6 },
      ]),
      // STRIPE (the higher up one)
      game_obj.createSegments([
        {
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: -q * 0.65, y: -qq },
        { x: q * 0.65, y: -qq },
      ]),
      game_obj.createSegments([
        {
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        }, {
          id: 'porthole',
          type: 'arc',
          radius: q / 3,
          center: { x: 0, y: -q * 0.6 },
        }
      ]),
    ];
  },

  generateProjectile (game_obj) {
    game_obj.segmentsList = game_obj.createSegments([
      {
        color: color(213, 72, 168),
        highlight: color(247, 195, 205),
      },
      { // START
        x: game_obj.og.x - game_obj.center.x,
        y: game_obj.og.y - game_obj.center.y,
      }, { // END
        x: game_obj.tip.x - game_obj.center.x,
        y: game_obj.tip.y - game_obj.center.y,
      }
    ]);
  },

  cannonParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      amount: 1,
      radius: 3,
      color: {
        value: color(255, 255, 255),
        to: color(213, 72, 168),
      },
      particleLifetime: 60,
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.cannon,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: 4,
      aim: {
        x: unitVector.x,
        y: unitVector.y,
      },
    });
  },

  thrustParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      neon: true,
      amount: 1,
      radius: 6,
      color: {
        value: color(255, 255, 255),
        to: color(213, 72, 168),
      },
      particleLifetime: {
        value: 90,
        random: [0.6, 1.2],
      },
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.thruster,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: {
        value: 8,
        random: [0.5, 1.25],
      },
      aim: {
        x: unitVector.x * -1,
        y: unitVector.y * -1,
        random: [-0.2, 0.2],
      },
    });
  },
}

module.exports = SanloStyles;
