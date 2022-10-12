const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');
const CFG = require('../../game-config');

const { style } = require('lib/dom');
const { getRandom, getRandomInt } = require('lib/random');

class Planet extends GOB {
	constructor (opts = {}) {
		super({
      ...opts,
      type: 'planet',
      renderType: 'css',
    });

    const radius = getRandom(200, 400);
    const colors = {
      one: {
        r: getRandomInt(150, 255),
        g: 0,
        b: getRandomInt(150, 255),
      },
      two: {
        r: 0,
        g: getRandomInt(150, 255),
        b: getRandomInt(150, 255),
      },
    };
    this.htmlElement = style({
      'position': 'absolute',
      'width': `${radius}px`,
      'height': `${radius}px`,
      'border-radius': '50%',
      'left': `${getRandom(0, 100)}%`,
      'top': `${getRandom(0, 100)}%`,
      'box-shadow': `
        inset 0 0 50px #fff,
        inset 20px 0 80px rgb(
          ${colors.one.r},
          ${colors.one.g},
          ${colors.one.b}
        ),
        inset -20px 0 80px rgb(
          ${colors.two.r},
          ${colors.two.g},
          ${colors.two.b}
        ),
        inset 20px 0 300px rgb(
          ${colors.one.r},
          ${colors.one.g},
          ${colors.one.b}
        ),
        inset -20px 0 300px rgb(
          ${colors.two.r},
          ${colors.two.g},
          ${colors.two.b}
        ),
        0 0 50px #fff,
        -10px 0 80px rgb(
          ${colors.one.r},
          ${colors.one.g},
          ${colors.one.b}
        ),
        10px 0 80px rgb(
          ${colors.two.r},
          ${colors.two.g},
          ${colors.two.b}
        )
      `,
    });
    this.htmlElement.classList.add('planet');

    GOM.canvas_container_bkg.appendChild(this.htmlElement);
		return this;
	}
}

module.exports = Planet;

/*
NOTES

  this.htmlElement.style.boxShadow = `
    inset 0 0 50px #fff,
    inset 20px 0 80px #f0f,
    inset -20px 0 80px #0ff,
    inset 20px 0 300px #f0f,
    inset -20px 0 300px #0ff,
    0 0 50px #fff,
    -10px 0 80px #f0f,
    10px 0 80px #0ff
  `;

*/
