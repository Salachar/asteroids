const { TWO_PI,
  rotatePointCounterClockwise,
} = require('./math');

const RandomHelpers = {
  getRandom: (min, max) => {
    return Math.random() * (max - min) + min;
  },

  getRandomInt: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  getRandomFromArray: (array) => {
    var length = array.length;
    var index = RandomHelpers.getRandomInt(0, length - 1);
    return array[index];
  },

  getRandomPercentage: () => {
    return RandomHelpers.getRandomInt(0,100);
  },

  getRandomAngle: () => {
    return RandomHelpers.getRandom(0, TWO_PI);
  },

  getRandomUnitVector: () => {
    return rotatePointCounterClockwise({
      x: 0,
      y: 1,
    }, RandomHelpers.getRandomAngle());
  },

  getPercentileRoll: (threshhold = 50) => {
    // Default is a 50/50 coin flip
    return (RandomHelpers.getRandomInt(1, 100) <= threshhold);
  },

  coinFlip: () => {
    return RandomHelpers.getPercentileRoll(50);
  },
}

module.exports = RandomHelpers;
