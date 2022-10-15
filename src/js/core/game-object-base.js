const GOM = require('./game-object-manager');
const CFG = require('../game/game-config');

const Segment = require('segment');
const Arc = require('lib/arc');
const {
  checkRadial,
  checkSegments,
  checkForwardCasts,
  checkBackwardCasts,
} = require('lib/collision');

const { uuid } = require('lib/uuid');
const { neonStroke, whiteStroke, redStroke } = require('draw');
const {
  sqr,
  rotateSegment,
  rotateArc,
  getMagnitude,
  getPointDistance,
} = require('math');

class GOB {
	constructor (opts = {}) {
    this.opts = opts;
    this.world = opts.world || null;
    // Generate a unique UUID for the object
		this.id = opts.id || uuid();
    this.cross_boundary = true;
    this.aesthetics_before = false;
        // Set the spawn/origin
		const spawn = opts.spawn || {};
    this.opacity = 1;
		this.x = opts.x || spawn.x || 0;
		this.y = opts.y || spawn.y || 0;
    this.resolved = false;
    this.previous_position = {
      x: null,
      y: null,
    };
    this.audioManager = null;
    this.spawner = opts.spawner || null;
    this.uniquePoints = {};
		this.collidable = false;
    this.render = true;
		this.configured = true;

    this.type = opts.type || "";
    this.renderType = opts.renderType || "canvas";
    this.htmlElement = null;
    if (this.renderType === 'css') {
      this.cross_boundary = false;
      this.render = false;
    }


    this.previous_collision_segments_info = null;

		this.__props = {};

		this.mouse_lock = {
			mClick: false,
			mDown: false,
			mUp: false,
			mLeave: false
		};

		this.__props.dimensions = {
			width: opts.width || 0,
			half_width: 0,
			height: opts.height || 0,
			half_height: 0
		};

		// x and y coords of the center of the object
		this.__props.center = {
			x: 0,
			y: 0
		}

    this.radius = 0;

		this.zOrder = opts.z || 0;

		this.remove = false;
		this.layer = opts.layer || GOM.front;
		this.context = (this.layer) ? this.layer.backBufferContext : null;

    this.straddling = false;

    this.segments = {};
    this.segmentsList = [];
    this.aesthetics = [];

    this.velocity = opts.velocity || {
      x: 0,
      y: 0,
    };

    this.rotationSpeed = 0;
    this.rotation = 0;
		this.theta = 0;

		GOM.addGameObject(this);

    return this;
	}

	set width (new_width) {
		this.__props.dimensions.width = new_width;
		this.__props.dimensions.half_width = new_width / 2;
    this.radius = getMagnitude({
      x: this.__props.dimensions.half_width,
      y: this.half_height,
    });
	}

	get width () {
		return this.__props.dimensions.width;
	}

	get half_width () {
		return this.__props.dimensions.half_width;
	}

	set height (new_height) {
		this.__props.dimensions.height = new_height;
		this.__props.dimensions.half_height = new_height / 2;
    this.radius = getMagnitude({
      x: this.half_width,
      y: this.__props.dimensions.half_height,
    });
	}

	get height () {
		return this.__props.dimensions.height;
	}

  get half_height () {
		return this.__props.dimensions.half_height;
	}

	set center (new_center) {
		this.__props.center = new_center;
    this.x = new_center.x - this.half_width;
    this.y = new_center.y - this.half_height;
	}

	get center () {
		return {
			x: this.x + this.__props.dimensions.half_width,
			y: this.y + this.__props.dimensions.half_height
		};
	}

  hide () {
    if (!this.htmlElement) return;
    this.htmlElement.style.visibility = 'hidden';
  }

  show () {
    if (!this.htmlElement) return;
    this.htmlElement.style.visibility = 'visible';
  }

  getCenter (opts = {}) {
    const { shift = {} } = opts;
    const mod_x = shift.x || 0;
    const mod_y = shift.y || 0;
    return {
      x: this.x + this.__props.dimensions.half_width + mod_x,
			y: this.y + this.__props.dimensions.half_height + mod_y,
    };
  }

  getBounds () {
    return {
      left: this.x - this.half_width,
      right: this.x + this.half_width,
      top: this.y - this.half_height,
      bottom: this.y + this.half_height,
    };
  }

  createSegments = (points, close) => {
    const bodySegments = [];

    let config = {};
    // Not a point and not an arc
    if (typeof points[0].x !== 'number' && points[0].type !== 'arc') {
      config = points.shift();
      bodySegments.push(config);
    }

    if (points[0].type === 'arc') {
      if (points[0].id) this.uniquePoints[points[0].id] = points[0];
      bodySegments.push(points[0]);
      return bodySegments;
    }

    for (let i = 0; i < points.length - 1; ++i) {
      const p = points[i];
      const np = points[i + 1];

      if (p.id) this.uniquePoints[p.id] = p;
      if (np.id) this.uniquePoints[np.id] = np;

      bodySegments.push(new Segment({
        p1: p,
        p2: np,
      }));
    }

    if (config.close || close) {
      bodySegments.push(new Segment({
        p1: points[points.length - 1],
        p2: points[0],
      }));
    }

    return bodySegments;
  }

  checkCollision (this_segments_info) {
    if (!this.collidable) return;
    const length = GOM.collidable_objects.length;
    for (let i = 0; i < length; ++i) {
      const game_obj = GOM.collidable_objects[i];
      // Make sure objects ignore themselves
      if (this.id === game_obj.id) continue;
      // For now projectiles don't intersect with each other
      if (this.type === 'projectile' && game_obj.type === 'projectile') continue;
      if (this.type === 'asteroid' && game_obj.type === 'asteroid') continue;
      // The player's own projectiles doesn't collide with themself
      if (this.type === 'projectile' && game_obj.id === 'player' && this.spawner.id === 'player') continue;
      if (game_obj.type === 'projectile' && this.id === 'player' && game_obj.spawner.id === 'player') continue;
      // We have two objects that handle collision
      this.checkObjCollision(this_segments_info, game_obj);
    }
	}

  checkObjCollision (this_segments_info, game_obj) {
    let tli = null;
    let tlsi = null;
    // A quick radial check, we dont have to do all the crappy expensive
    // individual segment checks if the object is too far away, increase the distance
    // to make sure there is time for fast projectiles to be accounted for properly
    let radialCheck = checkRadial(this, game_obj, {
      distance_mod: 2,
    });

    if (radialCheck) {
      const other_segments_info = game_obj.getSegments({
        ignore_config: true,
      });

      const {
        segments: this_segments,
      } = this_segments_info;
      const {
        segments: other_segments,
      } = other_segments_info;

      const {
        list: this_list,
        nested: this_nested,
      } = this_segments;
      const {
        list: other_list,
        nested: other_nested,
      } = other_segments;

      const this_list_length = this_list.length;

      const otherCheck = (this_segment) => {
        let prev_this_segment = null;
        if (this.previous_collision_segments_info) {
          const { segments: p_segments } = this.previous_collision_segments_info;
          prev_this_segment = p_segments.list[tli];
          if (p_segments.nested) prev_this_segment = prev_this_segment[tlsi];
        };

        if (!prev_this_segment) return;

        const collision_data = {
          this_segment,
          prev_this_segment,
          other_list,
          other_nested,
        }

        let collision_info = checkForwardCasts(collision_data);
        if (!collision_info) collision_info = checkBackwardCasts(collision_data);

        if (collision_info) {
          const {
            other_segment,
          } = collision_info
          const collision_data = {
            this_segment,
            other_segment,
          };
          this.resolveCollision(collision_info, {
            ...collision_data,
            other_obj: game_obj,
          });
          game_obj.resolveCollision(collision_info, {
            ...collision_data,
            this_segment: other_segment,
            other_segment: this_segment,
            other_obj: this,
          });
        }
      };

      // Start by going through all of the segments for "this" current obj
      for (tli = 0; tli < this_list_length; ++tli) {
        const this_item = this_list[tli];
        if (this_nested) {
          for (tlsi = 0; tlsi < this_item.length; ++tlsi) {
            otherCheck(this_item[tlsi])
          }
        } else {
          otherCheck(this_item);
        }
      }
    }
  }

  // overwritten by object or something
  resolveCollision () {
    // console.log(this.type + ' no collision resolution');
  }

  checkWorldBounds () {
    let straddleList = '';
    const worldBounds = this.world.getBounds();
    for (let i = 0; i < worldBounds.length; ++i) {
      const worldSegment = worldBounds[i];
      const { distance } = getPointDistance(this.center, worldSegment);
      if (typeof distance === 'number' && distance <= this.radius) {
        straddleList += `-${worldSegment.id}-`;
      }
    }
    this.straddling = straddleList;
  }

	keyPress () {}

	keyDown () {}

	keyUp () {}

	mClick () {
		return this.mouse_lock.mClick;
	}

	mDown () {
		return this.mouse_lock.mDown;
	}

	mUp () {
		return this.mouse_lock.mUp;
	}

	mLeave () {}

	mouseOver () {
		return false;
	}

	shutdown () {
    // Ignore already shutdown things
    if (this.remove) return;
    if (this.audioManager) {
      this.audioManager.shutdown();
    }
		this.remove = true;
	}

  drawCenterPoint () {
    if (!CFG.draw_center_point) return;

    this.context.save();
      this.context.beginPath();
      this.context.rect((this.x + this.half_width) - 1, (this.y + this.half_height) - 1, 2, 2);
      this.context.fillStyle = '#FFFFFF';
      this.context.fill();
    this.context.restore();
  }

  drawBoundingCircle () {
    if (!CFG.draw_bounding_circle) return;

    const c = this.context;
    c.beginPath();
		c.arc(
      this.x + this.half_width,
      this.y + this.half_height,
      this.radius,
      0,
      2 * Math.PI
    );
    redStroke(c);
		c.closePath();
  }

  // Gets overriden by extended objects
  update () {}

  // Called by the game loop
  updateObj () {
    // Store the previous position, might as well so I don't
    // have to do additional math to get "before" positions
    // when I need it for collision checking. It's also
    // more correct because its before rotation as well
    this.previous_position.x = this.x;
    this.previous_position.y = this.y;

    // Update, for most things this will update
    // positions by velocity and update rotation
    this.update();
    // this.x and this.y are now updated
    // Start checking collision for the item, it starts
    // in the updated position, additional checks need the
    // before as well?
    const this_segments_info = this.getSegments({
      ignore_config: true,
    });
    this.checkCollision(this_segments_info);
    this.previous_collision_segments_info = this_segments_info;

    if (!this.cross_boundary) return;
    if (this.center.x < 0) {
      this.center = {
        x: this.world.width,
        y: this.center.y,
      };
      this.previous_collision_segments_info = null;
    }
    if (this.center.x > this.world.width) {
      this.center = {
        x: 0,
        y: this.center.y,
      };
      this.previous_collision_segments_info = null;
    }
    if (this.center.y < 0) {
      this.center = {
        x: this.center.x,
        y: this.world.height,
      };
      this.previous_collision_segments_info = null;
    }
    if (this.center.y > this.world.height) {
      this.center = {
        x: this.center.x,
        y: 0,
      };
      this.previous_collision_segments_info = null;
    }
    this.checkWorldBounds();
  }

  drawCrossBoundary () {
    if (!this.cross_boundary) return;

    const t = this.straddling.match(/top/);
    const r = this.straddling.match(/right/);
    const b = this.straddling.match(/bottom/);
    const l = this.straddling.match(/left/);

    if (t) {
      this.draw({ shift: { x: 0, y: this.world.height } });
    }
    if (r) {
      this.draw({ shift: { x: -this.world.width, y: 0 } });
    }
    if (b) {
      this.draw({ shift: { x: 0, y: -this.world.height } });
    }
    if (l) {
      this.draw({ shift: { x: this.world.width, y: 0 } });
    }
    if (t && r) {
      this.draw({ shift: { x: -this.world.width, y: this.world.height } });
    }
    if (r && b) {
      this.draw({ shift: { x: -this.world.width, y: -this.world.height } });
    }
    if (b && l) {
      this.draw({ shift: { x: this.world.width, y: -this.world.height } });
    }
    if (l && t) {
      this.draw({ shift: { x: this.world.width, y: this.world.height } });
    }
  }

  rotateObjSegment (segment, opts = {}) {
    const {
      shift = {},
      ignore_config = false,
    } = opts;

    if (!(segment instanceof Segment)) {
      if (segment.type === 'arc') {
        return rotateArc({
          shift,
          origin: this.getCenter(shift),
          theta: this.theta,
          arc: segment,
        });
      }

      if (ignore_config) return null;
      // Only other option is a config obj, return it unchanged
      return segment;
    }
    return rotateSegment({
      shift,
      origin: this.getCenter(shift),
      theta: this.theta,
      segment: segment,
    });
  }

  getSegments (opts = {}) {
    // regular segments
    const multipleSegmentsLists = Array.isArray(this.segmentsList[0]);
    const multipleAetheticsLists = Array.isArray(this.aesthetics[0]);
    return {
      segments: {
        nested: multipleSegmentsLists,
        list: this.segmentsList.map((baseSegmentsItem) => {
          if (multipleSegmentsLists) {
            return baseSegmentsItem.map((segmentsItem) => {
              return this.rotateObjSegment(segmentsItem, opts);
            }).filter(element => {
              return element !== null;
            });
          }
          return this.rotateObjSegment(baseSegmentsItem, opts);
        }).filter(element => {
          return element !== null;
        }),
      },
      aesthetics: {
        nested: multipleAetheticsLists,
        list: this.aesthetics.map((baseSegmentsItem) => {
          if (multipleAetheticsLists) {
            return baseSegmentsItem.map((segmentsItem) => {
              return this.rotateObjSegment(segmentsItem, opts);
            }).filter(element => {
              return element !== null;
            });
          }
          return this.rotateObjSegment(baseSegmentsItem, opts);
        }).filter(element => {
          return element !== null;
        }),
      },
    };
  }

  // What a horrible fucking name
  drawOther (segmentsInfo) {
    const {
      nested = false,
      list = [],
    } = segmentsInfo;
    if (!nested) {
      this.drawSegmentList(this.context, list);
    } else {
      for (let i = 0; i < list.length; ++i) {
        this.drawSegmentList(this.context, list[i]);
      }
    }
  }

  drawCustom () {
    // Not reliant on segments or anything, also non-collidable
    // The base object will never do anything here, it's specifically
    // to be overwritten by individual game objects
  }

  perSegment (callback) {
    const {
      segments = {},
      aesthetics = {},
    } = this.getSegments();

    const createSegmentObjectsFromList = (segmentsList) => {
      if (!segmentsList.length) return;

      let config = {};
      if (!(segmentsList[0] instanceof Segment) && !(segmentsList[0] instanceof Arc)) {
        config = segmentsList.shift();
      }

      for (let i = 0; i < segmentsList.length; ++i) {
        callback(segmentsList[i], config);
      }
    }

    const degmentizeList = (segmentsInfo) => {
      const {
        nested = false,
        list = [],
      } = segmentsInfo;
      if (!nested) {
        createSegmentObjectsFromList(list);
      } else {
        for (let i = 0; i < list.length; ++i) {
          createSegmentObjectsFromList(list[i]);
        }
      }
    }

    degmentizeList(segments);
    degmentizeList(aesthetics);
  }

  draw (opts = {}) {
    const c = this.context;
    const { shift = {} } = opts;
    const {
      segments = {},
      aesthetics = {},
    } = this.getSegments({ shift });

    if (this.aesthetics_before) this.drawOther(aesthetics);
    this.drawOther(segments);
    if (!this.aesthetics_before) this.drawOther(aesthetics);
    this.drawCustom();
  }

  drawSegmentList (c, segments = []) {
    if (!segments.length) return;

    let config = {};
    if (!(segments[0] instanceof Segment) && !(segments[0] instanceof Arc)) {
      config = segments.shift();
    }

    if (segments[0] instanceof Arc) {
      c.save();
        c.beginPath();
        this.context.arc(
          segments[0].center.x,
          segments[0].center.y,
          segments[0].data.radius,
          0, 2 * Math.PI);
        c.closePath();
        neonStroke(c, config);
      c.restore();
      return;
    }

    c.save();
      c.beginPath();
        c.moveTo(segments[0].p1.x, segments[0].p1.y);
        for (let i = 0; i < segments.length; ++i) {
          const segment = segments[i];
          c.lineTo(segment.p2.x, segment.p2.y);
        }
      c.closePath();
      neonStroke(c, config);
    c.restore();
  }

  // Called by the game loop
	drawObj () {
    if (!this.render || this.renderType === 'css') return;
    this.draw();
    this.drawCrossBoundary();
    this.drawBoundingCircle();
    this.drawCenterPoint();
  }
}

module.exports = GOB;
