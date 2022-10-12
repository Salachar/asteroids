const ParticleSystem = require('lib/particle-system');
const { color } = require('lib/color');
const { rotatePointCounterClockwise } = require('math');

const FuturamaStyles = {
  generateShip: (game_obj) => {
    game_obj.block_size = 10;
    const b = game_obj.block_size;
    // The Futurama ship standing on end has a 2x5 ratio
    game_obj.width = b * 4;
    game_obj.height = b * 10;
    // game_obj.aesthetics_before = true;

    game_obj.segmentsList = [

      // BOTTOM WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(63, 134, 116),
          highlight: color(153, 241, 218),
        },
        { x:    1 * b, y:  -1 * b }, // WING START
        { x:  1.9 * b, y:   0 * b }, // FIRST CURVE
        { x:    2 * b, y:   2 * b }, // WING TIP
        { x:  1.5 * b, y:   1 * b }, // INSIDE CURVE
        { x: 0.75 * b, y: 1.5 * b }, // BACK ATTACK POINT
        { x:  0.5 * b, y:   0 * b }, // WING CURVE APEX
      ]),
      // TOP WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(63, 134, 116),
          highlight: color(153, 241, 218),
        },
        { x:    -1 * b, y:   0 * b }, // TOP WING START
        { x: -0.55 * b, y: 1.8 * b }, // AFTER THRUSTER / TOP WING END
        { x:    -1 * b, y:   2 * b }, // INSIDE CURVE
        { x:    -2 * b, y:   4 * b }, // WING TIP
        { x: -1.85 * b, y:   1 * b }, // END CURVE
      ]),
      // THRUSTER
      game_obj.createSegments([
        {
          fill: true,
          color: color(124, 145, 155),
          highlight: color(210, 210, 210),
        },
        { x:   0.3 * b, y:    2 * b }, // BEGIN STEM
        { x:   0.3 * b, y:  2.2 * b }, // END STEM
        { x:  0.45 * b, y:  2.3 * b }, // THRUSTER BOTTOM START
        { x:   0.5 * b, y:    3 * b }, // THRUSTER BOTTOM END
        { x:     0 * b, y: 3.25 * b, id: 'thruster' }, // THRUSTER CENTER
        { x:  -0.5 * b, y:  3.5 * b }, // THRUSTER TOP START
        { x: -0.45 * b, y:  2.3 * b }, // THRUSTER TOP END
        { x:  -0.3 * b, y:  2.2 * b }, // BEGIN STEM
        { x:  -0.3 * b, y:    2 * b }, // END STEM
      ]),
      // BODY
      game_obj.createSegments([
        {
          fill: true,
          color: color(175, 213, 169),
          highlight: color(211, 249, 205),
        },
        { x:     0 * b, y:  -5 * b, id: 'cannon' }, // TIP
        { x:     0 * b, y:  -4 * b }, // NOSE UNDERSIDE (FLAT PART)
        { x:     1 * b, y:  -3 * b }, // THE CURVE
        { x:     1 * b, y:  -1 * b }, // WING START
        { x:   0.5 * b, y:   0 * b }, // WING CURVE APEX
        { x:  0.75 * b, y: 1.5 * b }, // WING END
        { x:   0.5 * b, y:   2 * b }, // BEFORE THRUSTER
        { x:  -0.5 * b, y:   2 * b }, // AFTER THRUSTER / TOP WING END
        { x:    -1 * b, y:   0 * b }, // TOP WING START
        { x:    -1 * b, y:  -3 * b }, // TOP END
        { x: -0.75 * b, y:  -4 * b }, // WINDOW CURVE
      ]),
    ];

    game_obj.aesthetics = [
      // STRIPE (red down center)
      game_obj.createSegments([
        {
          color: color(189, 24, 28),
          highlight: color(239, 153, 156),
          strokeWidth: 1,
        },
        { x: 0 * b, y: -5 * b }, // TIP
        { x: 0 * b, y:  2 * b }, // BUTT
      ]),
    ];
  },

  generateProjectile (game_obj) {
    game_obj.segmentsList = game_obj.createSegments([
      {
        color: color(255, 0, 0),
        highlight: color(255, 200, 200),
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

  thrustParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      neon: true,
      amount: 3,
      color: {
        value: color(255, 255, 255),
        to: color(49, 39, 242),
      },
      particleLifetime: {
        value: 60,
        random: [0.6, 1.2],
      },
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.thruster,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: {
        value: 6,
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

module.exports = FuturamaStyles;
