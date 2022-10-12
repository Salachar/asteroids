const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const { style } = require('lib/dom');
const { getRandom } = require('lib/random');

class Void extends GOB {
	constructor (opts = {}) {
		super({
      ...opts,
      type: 'void',
      renderType: 'css',
    });

    this.htmlElement = style({
      'left': `${getRandom(0, 100)}%`,
      'top': `${getRandom(0, 100)}%`,
      'opacity': '0.65',
      'position': 'absolute',
      'width': '40px',
      'height': '40px',
      'border-radius': '50%',
      'background-color': '#fff',
      'box-shadow': `
        0 0 60px 30px #fff,
        0 0 100px 60px #f0f,
        0 0 140px 90px #0ff
      `,
    })
    this.htmlElement.classList.add('void');

    GOM.canvas_container_bkg.appendChild(this.htmlElement);
		return this;
	}
}

module.exports = Void;
