const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');
const CONFIG = require('../game-config');

const { style } = require('lib/dom');
const { sqr, getDistance } = require('lib/math');;
const { RGBA } = require('lib/color');
const { getRandom } = require('lib/random');

class Anomaly extends GOB {
	constructor (opts = {}) {
    super({
      ...opts,
      type: 'anomaly',
      renderType: 'css',
    });

    this.x = getRandom(0, this.world.width);
    this.y = getRandom(0, this.world.height);
    this.width = 1000;
    this.height = 1000;

		this.z = 1;
		this.radius = 10000; // opts.radius || 0;
		this.force = 100;
		this.forceDirection = 1;

    // .blackhole {
    //   width: 10em;
    //   height: 10em;
    // }

    // .megna {
    //   width: 100%;
    //   height: 100%;
    //   border-radius: 100%;
    //   background: linear-gradient(#ff4500, #ff4500, #ff9900);
    //   box-shadow:
    //     0 0 60px 30px #fcbd3e,
    //     0 0 100px 60px #fd7a4d,
    //     0 0 140px 90px #ff0b6b;
    //   display: flex;
    //   justify-content: center;
    //   align-items: center;
    //   filter: blur(5px);
    // }

    // .black {
    //   width: 90%;
    //   height: 90%;
    //   border-radius: 50% 50% 50% 50%;
    //   background-color: black;
    //   transform: rotate(0deg);
    // }

    // 'left': `${getRandom(0, 100)}%`,
    // 'top': `${getRandom(0, 100)}%`,

    this.htmlElement = style({
      'left': `${this.x}px`,
      'top': `${this.y}px`,
      'position': 'absolute',
      'width': '120px',
      'height': '120px',
      'transform': 'translateX(-50%) translateY(-50%)',
    }, 'blackhole');

    this.subElementMegna = style({
      'width': '100%',
      'height': '100%',
      'border-radius': '100%',
      'background': 'linear-gradient(#ff4500, #ff4500, #ff9900)',
      'box-shadow': `
        0 0 60px 30px #fcbd3e,
        0 0 100px 60px #fd7a4d,
        0 0 140px 90px #ff0b6b`,
      'display': 'flex',
      'justify-content': 'center',
      'align-items': 'center',
      'filter': 'blur(5px)',
    }, 'megna');

    this.subElementBlack = style({
      'width': '90%',
      'height': '90%',
      'border-radius': '50% 50% 50% 50%',
      'background-color': 'black',
      'transform': 'rotate(0deg)',
    }, 'black');

    this.subElementMegna.appendChild(this.subElementBlack);
    this.htmlElement.appendChild(this.subElementMegna);
    GOM.canvas_container_bkg.appendChild(this.htmlElement);

		return this;
	}

	update () {
    // console.log('blackhold update');
		for (var i = 0; i < GOM.game_objects.length; ++i) {
			var obj = GOM.game_objects[i];
      // TODO This needs to affect the player as well, pretty much anything except
      // other anomalies I think
			if (obj.type === "projectile" || obj.type === 'asteroid' || obj.type === 'ship') {
        // console.log('butt')
				var xDis = this.x - obj.center.x;
				var yDis = this.y - obj.center.y;
				var dist = sqr(xDis) + sqr(yDis);
				if (dist < sqr(this.radius) && dist > sqr(120)) {
					if (dist < 2) {
            console.log('bad touch');
						// obj.shutdown();
					} else {
						dist = Math.sqrt(dist);
						var force = this.forceDirection * (((this.radius / dist) * (this.radius / dist)) / (this.radius * (this.force / 10)));
						obj.velocity.x = (obj.velocity.x + ((xDis / dist) * force));
						obj.velocity.y = (obj.velocity.y + ((yDis / dist) * force));
					}
				}
			}
		}
	}
}

module.exports = Anomaly;
