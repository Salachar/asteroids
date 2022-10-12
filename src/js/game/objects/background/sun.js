const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const { style } = require('lib/dom');
const { getRandom } = require('lib/random');

class Sun extends GOB {
	constructor (opts = {}) {
		super({
      ...opts,
      type: 'sun',
      renderType: 'css',
    });

    this.htmlElement = style({
      'left': `${getRandom(0, 100)}%`,
      'top': `${getRandom(0, 100)}%`,
      'position':  'absolute',
      'width': '80px',
      'height': '80px',
      'transform': 'translateX(-50%) translateY(-50%) translateZ(0)',
      'border-radius': '50%',
      'background': 'rgb(241, 241, 136)',
      'box-shadow': '0 0 40px 20px rgb(241, 241, 136)',
    });
    this.htmlElement.classList.add('sun');

    GOM.canvas_container_bkg.appendChild(this.htmlElement);
		return this;
	}
}

module.exports = Sun;
