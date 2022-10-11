const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');
const CFG = require('../game-config');

const SanloStyles = require('../styles/sanlo');
const FuturamaStyles = require('../styles/futurama');
const ClassicStyles = require('../styles/classic');

const { color } = require('lib/color');

const { coinFlip, getRandom, getRandomInt, getPercentileRoll } = require('lib/random');
const { TWO_PI, PI, segmentMatch, clampRadians, rotatePointClockwise, rotatePointCounterClockwise, getMagnitude } = require('math');
const { checkRaySegmentIntersection } = require('lib/collision');
const AudioManager = require('audio-manager');

class Asteroid extends GOB {
	constructor (opts = {}) {
		super(opts);

    // Standard
    this.collidable = true;
		this.type = "asteroid";
    this.radius = opts.radius || 150;
    this.rotationSpeed = opts.rotationSpeed || (PI / 480);

    // Custom
    this.points = opts.points || null;
    this.translated_points = null;
    if (this.points && this.points.length) {
      this.calculateBaseProps();
    }

    this.audioManager = new AudioManager({
      thud: {
        src: require('sounds/thud3.mp3'),
        loop: false,
        volume: 0.3,
      },
    })

    this.generateSegments();
    return this;
	}

  calculateBaseProps () {
    // If points are passed in for the new asteroid (like when one is hit)
    // We need to recalculate the width, height, radius, x, and y to make sure
    // its properly represented by the passed in points

    // go through all the points,
    // The new points need to be described according to the asteroids "(0, 0)"

    let bounds = {
      t: null,
      r: null,
      b: null,
      l: null,
    };

    this.points.forEach((point) => {
      if (!bounds.t || point.y < bounds.t) bounds.t = point.y;
      if (!bounds.b || point.y > bounds.b) bounds.b = point.y;
      if (!bounds.r || point.x > bounds.r) bounds.r = point.x;
      if (!bounds.l || point.x < bounds.l) bounds.l = point.x;
    });

    this.x = bounds.l;
    this.y = bounds.t;

    this.width = bounds.r - bounds.l;
    this.height = bounds.b - bounds.t;
    this.center = {
      x: bounds.l + (this.width / 2),
      y: bounds.t + (this.height / 2),
    };

    this.radius = null;
    this.translated_points = [];
    this.points.forEach((point) => {
      const translated_point = {
        x: point.x - this.center.x,
        y: point.y - this.center.y,
      };

      const mag = getMagnitude(translated_point);
      if (!this.radius || this.radius < mag) this.radius = mag;

      this.translated_points.push({
        x: point.x - this.center.x,
        y: point.y - this.center.y,
      });
    });

    if (this.radius < (this.world.player.radius / 3)) {
      // TODO a particle effect or something for indicator
      this.shutdown();
    }
  }

  getSegmentStyle () {
    this.theme = CFG.theme;
    if (this.radius <= this.world.player.radius) {
      return {
        fill: color(255, 215, 0),
        close: true,
        color: color(255, 215, 0),
      };
    }
    switch (CFG.theme) {
      case 'classic':
        return ClassicStyles.getAsteroidStyle();
      case 'futurama':
        return FuturamaStyles.getAsteroidStyle();
      default: // "sanlo"
        return SanloStyles.getAsteroidStyle();
    }
  }

  generateSegments () {
    if (this.translated_points && this.translated_points.length) {
      this.segmentsList = this.createSegments([this.getSegmentStyle()].concat(this.translated_points));
    } else {
      this.segmentsList = this.generateRadialSegments();
    }

    // if (coinFlip()) {
    //   this.generateQuadAsteroid();
    // } else {
    //   this.segmentsList = this.generateRadialSegments();
    // }
  }

  generateQuadAsteroid () {
    const points_info = {
      base_point: {
        x: 0,
        y: this.radius * 0.25,
      },
      radius: this.radius * 0.25,
    };

    this.segmentsList = [
      this.generateRadialSegments({
        ...points_info,
        center: {
          x: 0,
          y: this.radius * 0.75,
        },
      }),
      this.generateRadialSegments({
        ...points_info,
        center: {
          x: this.radius * 0.75,
          y: 0,
        },
      }),
      this.generateRadialSegments({
        ...points_info,
        center: {
          x: 0,
          y: -this.radius * 0.75,
        },
      }),
      this.generateRadialSegments({
        ...points_info,
        center: {
          x: -this.radius * 0.75,
          y: 0,
        },
      }),
    ];
  }

  generateRadialSegments (opts = {}) {
    const {
      center = null,
      // The point that rotates around the center
      base_point = {
        x: 0,
        y: -this.radius,
      },
      radius = this.radius,
    } = opts;

    // Random amount of points
    const number_of_points = getRandomInt(10, 16);
    const angle_between = TWO_PI / number_of_points;
    const angle_mod = angle_between / 2;

    const points = [];
    for (let i = 0; i < number_of_points; ++i) {
      let point = JSON.parse(JSON.stringify(base_point));
      point.y = getRandom(radius * 0.5, radius);
      let angle_rand = getRandom(
        (i * angle_between) - angle_mod,
        (i * angle_between) + angle_mod,
      );
      points.push(rotatePointClockwise(
        point, angle_rand, center,
      ));
    }

    points.unshift(this.getSegmentStyle())
    return this.createSegments(points);
  }

	update () {
    if (CFG.theme !== this.theme) {
      this.generateSegments();
    }
		this.theta += this.rotationSpeed;
    this.theta = clampRadians(this.theta);
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}

  resolveCollision (collision_point, collision_data) {
    const {
      this_segment,
      other_segment,
      tli,
      tlsi,
      other_obj,
    } = collision_data;

    if (other_obj.id === 'player') {
      if (this.radius <= other_obj.radius) {
        this.shutdown();
      } else {
        this.world.handlePlayerDeath();
      }
      return;
    }

    if (other_obj.type === 'projectile') {
      const first_split_point = collision_point;
      const this_segments_info = this.getSegments({
        ignore_config: true,
      });
      const {
        segments: this_segments,
      } = this_segments_info;
      const {
        list: this_list,
        nested: this_nested,
      } = this_segments;

      for (let i = 0; i < this_list.length; ++i) {
        const this_item = this_list[i];
        if (this_nested) {
          for (let j = 0; j < this_item.length; ++j) {
            // Don't test the segment that was hit
            if (segmentMatch(this_segment, this_item[i])) continue;
            const second_split_point = checkRaySegmentIntersection({
              ray: {
                p1: first_split_point,
                p2: {
                  x: first_split_point.x + other_obj.aim.x,
                  y: first_split_point.y + other_obj.aim.y,
                },
              },
              segment: this_item[i],
            });
            if (second_split_point) {
              this.splitAsteroid({
                split_from: {
                  point: first_split_point,
                  segment: this_segment,
                },
                split_to: {
                  point: second_split_point,
                  segment: this_item[i],
                },
                segments: this_item,
                collision_data,
              });
            }
          }
        } else {
          // Don't test the segment that was hit
          if (segmentMatch(this_segment, this_item)) continue;

          const second_split_point = checkRaySegmentIntersection({
            ray: {
              p1: first_split_point,
              p2: {
                x: first_split_point.x + other_obj.aim.x,
                y: first_split_point.y + other_obj.aim.y,
              },
            },
            segment: this_item,
          });
          if (second_split_point) {
            this.splitAsteroid({
              split_from: {
                point: first_split_point,
                segment: this_segment,
              },
              split_to: {
                point: second_split_point,
                segment: this_item,
              },
              segments: this_segments.list,
              collision_data,
            });
          }
        }
      }
    }
  }

  splitAsteroid (data = {}) {
    this.audioManager.playOnce("thud", {
      no_ramp_up: true,
    });

    const {
      split_from = {},
      split_to = {},
      //
      segments = [],
      collision_data = {},
    } = data;

    const {
      other_obj,
    } = collision_data;

    if (segmentMatch(split_from.segment, split_to.segment)) return;

    try {
      if (this.resolved) return;
      this.resolved = true;

      let supersegments = segments.concat(segments);
      let new_asteroid_one = [];
      let new_asteroid_two = [];

      let i = 0;
      let segment = supersegments[i];
      while (!segmentMatch(split_from.segment, segment)) {
        ++i; // ignore everything until we get to the first point
        segment = supersegments[i];
      }
      // First match against the "from" segment
      new_asteroid_one.push(split_from.point);
      new_asteroid_one.push(segment.p2);

      ++i;
      segment = supersegments[i];

      while (!segmentMatch(split_to.segment, segment)) {
        new_asteroid_one.push(segment.p2);
        ++i;
        segment = supersegments[i];
      }

      // First match against the "from" segment
      new_asteroid_one.push(split_to.point);
      // First asteroid is done
      new_asteroid_two.push(split_to.point);
      new_asteroid_two.push(segment.p2);

      ++i;
      segment = supersegments[i];

      while (!segmentMatch(split_from.segment, segment)) {
        new_asteroid_two.push(segment.p2);
        ++i;
        segment = supersegments[i];
      }

      // First match against the "from" segment
      new_asteroid_two.push(split_from.point);

      const left_aim = rotatePointCounterClockwise(other_obj.aim, 0.5);
      const mod = 0.25;
      new Asteroid({
        world: this.world,
        points: new_asteroid_one,
        spawn: {
          x: this.x,
          y: this.y,
        },
        velocity: {
          x: this.velocity.x + (left_aim.x * mod),
          y: this.velocity.y + (left_aim.y * mod),
        },
        rotationSpeed: (PI / 480),
      })

      const right_aim = rotatePointClockwise(other_obj.aim, 0.5);
      new Asteroid({
        world: this.world,
        points: new_asteroid_two,
        spawn: {
          x: this.x,
          y: this.y,
        },
        velocity: {
          x: this.velocity.x + (right_aim.x * mod),
          y: this.velocity.y + (right_aim.y * mod),
        },
        rotationSpeed: -(PI / 480),
      });

      this.shutdown();
    } catch (e) {
      // Keep the asteroid alive if there was an issue
    }
  }
}

module.exports = Asteroid;

/*

This generate some cool "sharper" and pointier asteroids
but in general they were all just a tad off.

generateQuadrantSegments () {
  const third = this.width / 3;
  this.segmentsList = this.createSegments([
    this.getSegmentStyle(),
    { // TL
      x: getRandomInt(third * 0, third * 1) - this.half_width,
      y: getRandomInt(third * 0, third * 1) - this.half_height,
    }, { // TM
      x: getRandomInt(third * 1, third * 2) - this.half_width,
      y: getRandomInt(third * 0, third * 1) - this.half_height,
    }, { // TR
      x: getRandomInt(third * 2, third * 3) - this.half_width,
      y: getRandomInt(third * 0, third * 1) - this.half_height,
    }, { // MR
      x: getRandomInt(third * 2, third * 3) - this.half_width,
      y: getRandomInt(third * 1, third * 2) - this.half_height,
    }, { // BR
      x: getRandomInt(third * 2, third * 3) - this.half_width,
      y: getRandomInt(third * 2, third * 3) - this.half_height,
    }, { // BM
      x: getRandomInt(third * 1, third * 2) - this.half_width,
      y: getRandomInt(third * 2, third * 3) - this.half_height,
    }, { // BL
      x: getRandomInt(third * 0, third * 1) - this.half_width,
      y: getRandomInt(third * 2, third * 3) - this.half_height,
    }, { // ML
      x: getRandomInt(third * 0, third * 1) - this.half_width,
      y: getRandomInt(third * 1, third * 2) - this.half_height,
    },
  ]);
}

*/
