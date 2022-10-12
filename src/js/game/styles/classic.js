const ParticleSystem = require('lib/particle-system');
const { color } = require('lib/color');
const { rotatePointCounterClockwise } = require('math');

const ClassicStyles = {
  generateShip: (game_obj) => {
    game_obj.q = 10;
    game_obj.width = game_obj.q * 4; // 2x3
    game_obj.height = game_obj.q * 6;

    game_obj.segmentsList = game_obj.createSegments([
      {
        fill: true,
        close: true
      },{ // TIP
        id: 'cannon',
        x: 0,
        y: -game_obj.half_height,
      }, { // RIGHTWING
        x: game_obj.half_width,
        y: game_obj.half_height,
      }, { // THRUSTER
        id: 'thruster',
        x: 0,
        y: game_obj.half_height * 0.66,
      }, { // LEFTWING
        x: -game_obj.half_width,
        y: game_obj.half_height,
      }
    ]);

    game_obj.aesthetics = [];
  },

  generateProjectile (game_obj) {
    game_obj.segmentsList = game_obj.createSegments([
      {
        color: color(255, 255, 255),
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
      amount: 1,
      color: {
        value: color(255, 255, 255),
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

module.exports = ClassicStyles;
