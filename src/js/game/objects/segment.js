const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');
const CFG = require('../game-config');

const Particles = require('../styles/particles');

const { color } = require('lib/color');

const { coinFlip, getRandom, getRandomInt, getPercentileRoll } = require('lib/random');
const { TWO_PI, PI, segmentMatch, clampRadians, rotatePointClockwise, rotatePointCounterClockwise, getMagnitude } = require('math');
const { checkRaySegmentIntersection } = require('lib/collision');

class Segment extends GOB {
	constructor (opts = {}) {
		super(opts);

    // Will commonly be spawned by an object being desegmented
    // and will come in with a segment and the config data
    // for how to draw it
    this.config = opts.config || null;
    this.segment = opts.segment || null;

    if (!this.segment) {
      console.error('YOU CANT CREATE A SEGMENT WITHOUT A SEGMENT!!!');
    }

		this.type = "segment";
    this.collidable = opts.collidable || false;
    this.rotationSpeed = opts.rotationSpeed || (PI / 480);

    this.speed = opts.speed || 1;
    this.direction = opts.direction || {
      x: 0,
      y: 0,
    };
    this.velocity = {
      x: opts.baseVelocity.x + (this.speed * this.direction.x),
      y: opts.baseVelocity.y + (this.speed * this.direction.y),
    };

		this.z = 1000000;
    this.length = 10;

    this.calculateBaseProps();
    this.generateSegments();

    window.setTimeout(() => {
      this.shutdown();
    }, 700)

		return this;
	}

  calculateBaseProps () {
    const p1 = this.segment.p1;
    const p2 = this.segment.p1;
		this.width = Math.abs(p2.x - p1.x);
		this.height = Math.abs(p2.y - p1.y);
    const trueX = p2.x < p1.x ? p2.x : p1.x;
    const trueY = p2.y < p1.y ? p2.y : p1.y;
    this.x = trueX;
    this.y = trueY;
  }

  generateSegments () {
    const p1 = this.segment.p1;
    const p2 = this.segment.p2;
    this.segmentsList = this.createSegments([
      this.config,
      { // START
        x: p1.x - this.center.x,
        y: p1.y - this.center.y,
      }, { // END
        x: p2.x - this.center.x,
        y: p2.y - this.center.y,
      }
    ]);
    if (!this.config) this.segmentsList.shift();
  }

	update () {
    this.theta += this.rotationSpeed;
    this.theta = clampRadians(this.theta);
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}

  resolveCollision (collision_point, collision_data) {

  }
}

module.exports = Segment;
