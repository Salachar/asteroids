const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const { style } = require('lib/dom');
const { getRandomInt } = require('lib/random');

class ShootingStars extends GOB {
	constructor (opts = {}) {
		super({
      ...opts,
      type: 'shooting_stars',
      renderType: 'css',
    });

    // Currently there can only be one at a time
    this.current_star = null;

    this.htmlElement = style({
      'position': 'relative',
      'width': '100%',
      'height': '100%',
      'transform': 'rotateZ(45deg)',
    });
    this.htmlElement.classList.add('shooting_stars');
    GOM.canvas_container_bkg.appendChild(this.htmlElement);

    this.startStarSpawner();

		return this;
	}

  startStarSpawner () {
    this.current_star = style({
      'position': 'absolute',
      'left': `${getRandomInt(0, 100)}%`,
      'top': `${getRandomInt(0, 100)}%`,
    });
    this.current_star.classList.add('shooting_star');
    this.htmlElement.appendChild(this.current_star);

    setTimeout(() => {
      this.htmlElement.innerHTML = '';
      this.current_star = null;
    }, 5000);

    setTimeout(() => {
      this.startStarSpawner();
    }, getRandomInt(10000, 15000));
  }
}

module.exports = ShootingStars;
