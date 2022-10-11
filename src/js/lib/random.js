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

  getPercentileRoll: (threshhold = 50) => {
    // Default is a 50/50 coin flip
    return (RandomHelpers.getRandomInt(1, 100) <= threshhold);
  },

  coinFlip: () => {
    return RandomHelpers.getPercentileRoll(50);
  },
}

module.exports = RandomHelpers;
