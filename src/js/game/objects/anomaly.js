const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');
const CONFIG = require('../game-config');

const { sqr, getDistance } = require('lib/math');;
const { RGBA } = require('lib/color');

class Anomaly extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = 'well';

		this.z = 1;
		this.radius = opts.radius || 0;
		this.force = 100;
		this.forceDirection = 1;

		this.r = 255;
		this.g = 255;
		this.b = 255;

		return this;
	}

	update (dt) {
		for (var i = 0; i < GOM.game_objects.length; ++i) {
			var obj = GOM.game_objects[i];
      // TODO This needs to affect the player as well, pretty much anything except
      // other anomalies I think
			if (obj.type === "projectile" || obj.type === 'asteroid') {
				var xDis = this.x - obj.center.x;
				var yDis = this.y - obj.center.y;
				var dist = (xDis * xDis) + (yDis * yDis);
				if (dist < (this.radius * this.radius)) {
					if (dist < 2) {
						obj.shutdown();
					} else {
						dist = Math.sqrt(dist);
						var force = this.forceDirection * (((this.radius / dist) * (this.radius / dist)) / (this.radius * (this.force/10)));
						obj.velocity.x = (obj.velocity.x + ((xDis / dist) * force));
						obj.velocity.y = (obj.velocity.y + ((yDis / dist) * force));
					}
				}
			}
		}
	}

	drawObj () {
		var fill = null;
		// Draw the inner circle, the "clickable" part
		this.context.beginPath();
		this.context.arc(this.x, this.y, 10, 0, 2 * Math.PI);
		fill = RGBA(this.r, this.g, this.b, 0.5);
		this.context.fillStyle = fill;
		this.context.fill();
		// Draw the radius so the user can see the area of influence
		this.context.beginPath();
		this.context.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		fill = RGBA(this.r, this.g, this.b, 0.1);
		this.context.fillStyle = fill;
		this.context.fill();
	}
}

module.exports = Anomaly;
