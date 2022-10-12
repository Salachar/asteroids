const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const { style } = require('lib/dom');
const {
  getRandom,
  getRandomInt,
  coinFlip,
} = require('lib/random');

class Nebula extends GOB {
	constructor (opts = {}) {
		super({
      ...opts,
      type: 'nebula',
      renderType: 'css',
    });

    const radius = getRandomInt(500, 900);
    this.htmlElement = style({
      'left': `${coinFlip() ? getRandom(0, 10) : getRandom(90, 100)}%`,
      'top': `${coinFlip() ? getRandom(0, 10) : getRandom(90, 100)}%`,
      'position': 'absolute',
      'width': `${radius}px`, // 800px
      'height': `${radius}px`, // 800px
      'filter': `blur(${getRandomInt(140, 180)}px)`, // 143px
      'transform': 'translateX(-50%) translateY(-50%) translateZ(0)',
      'border-radius': '50%',
    });
    this.htmlElement.classList.add('nebula');

    if (coinFlip()) {
      // 291.19deg,
      // rgba(191, 107, 255, 0.5) 10.65%,
      // rgba(255, 92, 121, 0.5) 89.36%)
      const r = { one: 191, two: 245 };
      const g = { one: 107, two: 92  };
      const b = { one: 245, two: 121 };
      this.htmlElement.style.background = `
        linear-gradient(
          291.19deg,
          rgba(
            ${getRandomInt(r.one - 30, r.one + 10)},
            ${getRandomInt(g.one - 30, g.one + 10)},
            ${getRandomInt(b.one - 30, b.one + 10)},
            ${getRandom(0.1, 0.5)}) 10.65%,
          rgba(
            ${getRandomInt(r.two - 30, r.two + 10)},
            ${getRandomInt(g.two - 30, g.two + 10)},
            ${getRandomInt(b.two - 30, b.two + 10)},
            ${getRandom(0.1, 0.5)}) 89.36%)
        `;
    } else {
      // 291.19deg,
      // rgba(45, 249, 176, 0.5) 10.65%,
      // rgba(191, 107, 255, 0.5) 89.36%)
      const r = { one:  45, two: 191 };
      const g = { one: 245, two: 107 };
      const b = { one: 176, two: 245 };
      this.htmlElement.style.background = `
        linear-gradient(
          291.19deg,
          rgba(
            ${getRandomInt(r.one - 30, r.one + 10)},
            ${getRandomInt(g.one - 30, g.one + 10)},
            ${getRandomInt(b.one - 30, b.one + 10)},
            ${getRandom(0.1, 0.5)}) 10.65%,
          rgba(
            ${getRandomInt(r.two - 30, r.two + 10)},
            ${getRandomInt(g.two - 30, g.two + 10)},
            ${getRandomInt(b.two - 30, b.two + 10)},
            ${getRandom(0.1, 0.5)}) 89.36%)
        `;
    }

    GOM.canvas_container_bkg.appendChild(this.htmlElement);
		return this;
	}
}

module.exports = Nebula;
