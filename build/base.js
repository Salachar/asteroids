/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 403:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "src/sounds/explosion.mp3";

/***/ }),

/***/ 616:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "src/sounds/gold.mp3";

/***/ }),

/***/ 331:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "src/sounds/laser.mp3";

/***/ }),

/***/ 971:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "src/sounds/thrusters.mp3";

/***/ }),

/***/ 604:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "src/sounds/thud3.mp3";

/***/ }),

/***/ 443:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);

const { getMouseCoords } = __webpack_require__(862);

// var SPACE_BAR = 32;
// var LEFT_ARROW = 37;
// var UP_ARROW = 38;
// var RIGHT_ARROW = 39;
// var DOWN_ARROW = 40;

// var SPACE_BAR_DOWN = false;
// var LEFT_ARROW_DOWN = false;
// var UP_ARROW_DOWN = false;
// var RIGHT_ARROW_DOWN = false;
// var DOWN_ARROW_DOWN = false;

const KEY_CODES = {
  32: 'SPACE',
	37: 'LEFT',
	38: 'UP',
	39: 'RIGHT',
	40: 'DOWN',
	87: 'W',
	65: 'A',
	83: 'S',
	68: 'D',
};

class GIM {
	constructor () {
		this.mouse = {
			x: 0,
			y: 0,
			prev: {
				x: 0,
				y: 0
			}
		};

		this.keysDown = {};
		this.input_managers = [];

		this.setupKeyEvents();
		this.setupControlCanvasEvents();
	}

  isKeyDown (keys) {
		const keys_split = keys.split(' ');
		for (let i = 0; i < keys_split.length; ++i) {
			if (this.keysDown[keys_split[i]]) {
				return true;
			}
		}
		return false;
	}

	register (input_manager) {
		this.input_managers.push(input_manager);
	}

	setupKeyEvents () {
		document.addEventListener('keypress', (event) => {
      if (!KEY_CODES[event.keyCode]) return;
			const key = KEY_CODES[event.keyCode];
			this.fireEvent('keyPress', key);
		});

		document.addEventListener('keydown', (event) => {
      if (!KEY_CODES[event.keyCode]) return;
			const key = KEY_CODES[event.keyCode];
			this.keysDown[key] = true;
			GOM.eventOnObjects('keyDown', key);
		});

		document.addEventListener('keyup', (event) => {
			const key = KEY_CODES[event.keyCode];
			delete this.keysDown[key];
			GOM.eventOnObjects('keyUp', key);
		});
	}

	fireEvent (event, data) {
		let prev_locked_object = this.locked_object;
		// Check to see if there is a locked object, if there is, only fire the event on it
		if (this.locked_object) {
			this.locked_object = GOM.eventOnObject(event, data, this.locked_object);
			// Check to see if the object and event are still locked, if so, return
			if (this.locked_object) return;
		}
		// prev_locked_object will be passed over when the events are fired, this is
		// because if prev_locked_event was an object, the event would have been fired
		// on it above to see if it was still locked. We don't want double events.
		this.locked_object = GOM.eventOnObjects(event, data, prev_locked_object);
		// Don't fire the event on the input manager if an object is locked
		if (this.locked_object) return;

		this.input_managers.forEach((input_manager) => {
      if (!input_manager[event]) return;
			input_manager[event](data);
		});
	}

	setupControlCanvasEvents () {
		GOM.control.canvas.addEventListener('click', (event) => {
			this.fireEvent('mClick', this.mouse);
		});

		GOM.control.canvas.addEventListener('mousedown', (event) => {
			if (event.which !== 1) return;
			this.fireEvent('mDown', this.mouse);
		});

		GOM.control.canvas.addEventListener('mouseup', (event) => {
			this.fireEvent('mUp', this.mouse);
		});

		GOM.control.canvas.addEventListener('mouseleave', (event) => {
			this.fireEvent('mLeave', this.mouse);
		});

		GOM.control.canvas.addEventListener('mousemove', (event) => {
			const pos = getMouseCoords(event, GOM.control.canvas);
			if (this.mouse.prev.x !== this.mouse.x) {
				this.mouse.prev.x = this.mouse.x;
			}
			if (this.mouse.prev.y !== this.mouse.y) {
				this.mouse.prev.y = this.mouse.y;
			}
			this.mouse.x = pos.x;
			this.mouse.y = pos.y;
		});
	}
}

module.exports = new GIM();


/***/ }),

/***/ 406:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const CFG = __webpack_require__(78);

const Segment = __webpack_require__(824);
const Arc = __webpack_require__(464);
const {
  checkRadial,
  checkSegments,
  checkForwardCasts,
  checkBackwardCasts,
} = __webpack_require__(90);

const { uuid } = __webpack_require__(108);
const { neonStroke, whiteStroke, redStroke } = __webpack_require__(172);
const {
  sqr,
  rotateSegment,
  rotateArc,
  getMagnitude,
  getPointDistance,
} = __webpack_require__(488);

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
    GOM.collidable_objects.forEach((game_obj) => {
      // Make sure objects ignore themselves
      if (this.id === game_obj.id) return;
      // For now projectiles don't intersect with each other
      if (this.type === 'projectile' && game_obj.type === 'projectile') return;
      if (this.type === 'asteroid' && game_obj.type === 'asteroid') return;
      // The player's own projectiles doesn't collide with themself
      if (this.type === 'projectile' && game_obj.id === 'player' && this.spawner.id === 'player') return;
      if (game_obj.type === 'projectile' && this.id === 'player' && game_obj.spawner.id === 'player') return;
      // We have two objects that handle collision
      this.checkObjCollision(this_segments_info, game_obj);
    });
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
    worldBounds.forEach((worldSegment) => {
      const { distance } = getPointDistance(this.center, worldSegment);
      if (typeof distance === 'number' && distance <= this.radius) {
        straddleList += `-${worldSegment.id}-`;
      }
    });

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
      list.forEach((subList) => {
        this.drawSegmentList(this.context, subList);
      });
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

      segmentsList.forEach((segment) => {
        callback(segment, config);
      });
    }

    const degmentizeList = (segmentsInfo) => {
      const {
        nested = false,
        list = [],
      } = segmentsInfo;
      if (!nested) {
        createSegmentObjectsFromList(list);
      } else {
        list.forEach((subList) => {
          createSegmentObjectsFromList(subList);
        });
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
        segments.forEach((segment) => {
          c.lineTo(segment.p2.x, segment.p2.y);
        });
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


/***/ }),

/***/ 39:
/***/ ((module) => {

class GOM {
	constructor () {
		this.FPS_INTERVAL = 1000 / 60;
		this.last_frame = new Date().getTime();

		this.__props = {};
		this.__props.game_objects = [];
		this.__props.collidable_objects = [];
		this.__props.added_game_objects = [];

		this.world_size = {
			width: 0,
			height: 0,
		};

    this.then = Date.now();

		this.el_fps_counter = document.getElementById('fps_counter');
		this.el_num_objects_counter = document.getElementById('num_objects_counter');

    this.fps_counter = document.getElementById('fps_counter');
		this.canvas_container = document.getElementById('canvas_container');
    this.canvas_container_bkg = document.getElementById('canvas_container_bkg');

		this.startup();
	}

	set game_objects (new_game_objects) {
		this.__props.game_objects = new_game_objects;
	}

	get game_objects () {
		return this.__props.game_objects;
	}

	set collidable_objects (new_collidable_objects) {
		this.__props.collidable_objects = new_collidable_objects;
	}

	get collidable_objects () {
		return this.__props.collidable_objects;
	}

	set added_game_objects (new_added_game_objects) {
		this.__props.added_game_objects = new_added_game_objects;
	}

	get added_game_objects () {
		return this.__props.added_game_objects;
	}

	clearLayerObjects (layerObjects) {
		for (let i = 0; i < layerObjects.list.length; ++i) {
			if (layerObjects.list[x].shutdown) {
				layerObjects.list[x].shutdown();
			}
		}
		layerObjects.list = [];
	}

	clearLayer (layer) {
		layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
		layer.backBufferContext.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
	}

	drawLayer (layer) {
		layer.backBufferContext.clearRect(0, 0, layer.canvas.width, layer.canvas.height);

		let newObjList = [];
		for (let i = 0; i < layer.objects.list.length; ++i) {
			let obj = layer.objects.list[i];
			if (obj.remove) continue;
			newObjList.push(obj);
			obj.drawObj();
		}

		layer.objects.list = newObjList;
		layer.context.clearRect(0, 0, layer.canvas.width, layer.canvas.height);
		layer.context.drawImage(layer.backBuffer, 0, 0);
	}

	draw () {
		// The main game loop cares only about drawing the foreground every frame.
		// The middleground and background are for more persistent/heavy objects and is redrawn
		// through manual calls.

		// calculate the time since the last frame
		const this_frame = new Date().getTime();
		const dt = (this_frame - this.last_frame) / 1000;
		this.last_frame = this_frame;
		this.el_fps_counter.innerHTML = Math.ceil(1 / dt);

		this.addNewGameObjects();

		this.front.backBufferContext.clearRect(0, 0, this.front.canvas.width, this.front.canvas.height);

		let new_objects_list = [];
		let new_collidable_objects_list = [];
		for (let i = 0; i < this.game_objects.length; ++i) {
			let gameObj = this.game_objects[i];

			if (gameObj.update) {
				gameObj.updateObj();
			}

			if (gameObj.remove) {
				gameObj = null;
				continue;
			}

			new_objects_list.push(gameObj);
			if (gameObj.collidable) {
				new_collidable_objects_list.push(gameObj);
			}

			if (gameObj.layer && gameObj.layer.zIndex === 3) {
				gameObj.drawObj();
			}
		}

		this.game_objects = new_objects_list;
		this.collidable_objects = new_collidable_objects_list;

		this.front.context.clearRect(0, 0, this.front.canvas.width, this.front.canvas.height);
		this.front.context.drawImage(this.front.backBuffer, 0, 0);

		if (this.middle.update) {
			this.middle.draw();
			this.middle.update = false;
		}
		if (this.back.update) {
			this.back.draw();
			this.back.update = false;
		}

		this.el_num_objects_counter.innerHTML = this.game_objects.length;
	}

	addNewGameObjects () {
		if (this.added_game_objects.length !== 0) {
			for (let i = 0; i < this.added_game_objects.length; ++i) {
				this.game_objects.push(this.added_game_objects[i]);
				if (this.added_game_objects[i].collidable) {
					this.collidable_objects.push(this.added_game_objects[i]);
				}
			}
			this.added_game_objects = [];
			this.game_objects.sort((a,b) => {
				return a.zOrder - b.zOrder;
			});
		}
	}

	eventOnObjects (event, data, object_exclude) {
		let locked_object = null;
		for (let i = 0; i < this.game_objects.length; ++i) {
			if (object_exclude && object_exclude.id === this.game_objects[i].id) continue;
			locked_object = this.eventOnObject(event, data, this.game_objects[i]);
			if (locked_object) return locked_object;
		}
	}

	eventOnObject (event, data, object) {
		if (!object) return null;
		const lock = object[event](data);
		if (event.match(/mClick|mDown|mUp/) && lock) return object;
		return null;
	}

	setCanvasSize () {
		// Get the width and height for you canvas, taking into account any constant menus.
		const container = this.canvas_container;
		let canvasWidth = container.clientWidth;
		let canvasHeight = container.clientHeight;
    this.canvas_container_width = canvasWidth;
		this.canvas_container_height = canvasHeight;
		this.half_canvas_container_width = canvasWidth / 2;
		this.half_canvas_container_height = canvasHeight / 2;

		// Loop through the canvases and set the width and height
		['control', 'front', 'middle', 'back'].forEach((canvas_key) => {
			this[canvas_key].canvas.setAttribute('width', canvasWidth + 'px');
			this[canvas_key].canvas.setAttribute('height', canvasHeight + 'px');
			this[canvas_key].canvas.style.width  = canvasWidth + 'px';
			this[canvas_key].canvas.style.height = canvasHeight + 'px';
			this[canvas_key].backBuffer.setAttribute('width', canvasWidth + 'px');
			this[canvas_key].backBuffer.setAttribute('height', canvasHeight + 'px');
			this[canvas_key].backBuffer.style.width  = canvasWidth + 'px';
			this[canvas_key].backBuffer.style.height = canvasHeight + 'px';
		});
	}

	startup () {
		['control', 'front', 'middle', 'back'].forEach((canvas_key) => {
			this[canvas_key] = {
				canvas : document.getElementById(`${canvas_key}_canvas`),
				context : null,
				backBuffer : document.createElement('canvas'),
				backBufferContext : null,
				zIndex : 3,
				update: false,
				objects : {
					list : [],
					clear: () => {
						this.clearLayerObjects(this[canvas_key]);
					}
				},
				draw: () => {
					this.drawLayer(this[canvas_key]);
				},
				clear: () => {
					this.clearLayer(this[canvas_key]);
				}
			};
			this[canvas_key].context =  this[canvas_key].canvas.getContext('2d');
			this[canvas_key].backBufferContext =  this[canvas_key].backBuffer.getContext('2d');
		});

		this.setCanvasSize();
		this.gameLoop();
	}

	onCollidables (func, params) {
		const collidables = this.collidable_objects;
		for (let i = 0; i < collidables.length; ++i) {
			const obj = collidables[i];
			if (obj && obj[func]) {
				obj[func](params);
			}
		}
	}

	gameLoop () {
    window.requestAnimationFrame(() => {
			this.gameLoop();
		});

		const now = Date.now();
		const elapsed = now - this.then;
		// if enough time has elapsed, draw the next frame
		if (elapsed > this.FPS_INTERVAL) {
			// Get ready for next frame by setting then=now, but also adjust for your
			// specified fpsInterval not being a multiple of RAF's interval (16.7ms)
			this.then = now - (elapsed % this.FPS_INTERVAL);
			this.draw();
		}
	}

	resize () {
		this.setCanvasSize();
	}

	shutdownAll () {
		this.eventOnObjects('shutdown');
		this.game_objects = [];
		this.collidable_objects = [];
		this.added_game_objects = [];
		this.clearAllContexts();
	}

	addGameObject (game_object) {
		this.added_game_objects.push(game_object);
		if (game_object.layer) {
			game_object.layer.objects.list.push(game_object);
			game_object.layer.update = true;
		}
	}

	clearAllContexts () {
		this.front.clear();
		this.middle.clear();
		this.back.clear();
	}

  checkCollisions (opts = {}) {
		const { obj } = opts;
		const collidables = this.collidable_objects;

		for (let i = 0; i < collidables.length; ++i) {
			const col_obj = collidables[i];
			if (obj.id === col_obj.id) continue;
			const info = col_obj.checkCollision(obj);
			if (info) opts.onCollision(info, col_obj);
		}
	}
}

module.exports = new GOM();


/***/ }),

/***/ 78:
/***/ ((module) => {

class CONFIG {
  constructor () {
    this.ship = 'sanlo'; // 'classic'
    this.draw_bounding_circle = false;
    this.draw_center_point = false;
  }
}

module.exports = new CONFIG();


/***/ }),

/***/ 79:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GIM = __webpack_require__(443);
const CONFIG = __webpack_require__(78);

class GI {
  constructor () {
    this.projectile_timer = false;
    this.contextHover = false;
  }

  mClick () {}

  mUp (mouse) {}

  mDown (mouse) {}

  mLeave (mouse) {}

  spawnWell (mouse) {}

  spawnProjectile (mouse) {}
}

module.exports = new GI();


/***/ }),

/***/ 617:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const CFG = __webpack_require__(78);

class Menu {
  constructor () {
    this.setEvents();
  }

  setEvents () {
    document.getElementById('config_ship_sanlo').addEventListener('change', (e) => {
      CFG.ship = e.currentTarget.value;
    });

    document.getElementById('config_ship_futurama').addEventListener('change', (e) => {
      CFG.ship = e.currentTarget.value;
    });

    document.getElementById('config_ship_classic').addEventListener('change', (e) => {
      CFG.ship = e.currentTarget.value;
    });

    document.getElementById('draw_bounding_circle').addEventListener('change', (e) => {
      CFG.draw_bounding_circle = e.currentTarget.checked;
    });

    document.getElementById('draw_center_point').addEventListener('change', (e) => {
      CFG.draw_center_point = e.currentTarget.checked;
    });
  }
}

module.exports = new Menu();


/***/ }),

/***/ 712:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);
const CFG = __webpack_require__(78);

const Particles = __webpack_require__(349);

const { color } = __webpack_require__(293);

const { coinFlip, getRandom, getRandomInt, getPercentileRoll } = __webpack_require__(66);
const { TWO_PI, PI, segmentMatch, clampRadians, rotatePointClockwise, rotatePointCounterClockwise, getMagnitude } = __webpack_require__(488);
const { checkRaySegmentIntersection } = __webpack_require__(90);
const AudioManager = __webpack_require__(330);

const thudSound = __webpack_require__(604);

class Asteroid extends GOB {
	constructor (opts = {}) {
		super(opts);

    // Standard
    this.collidable = true;
		this.type = "asteroid";
    this.radius = opts.radius || 150;
    this.rotationSpeed = opts.rotationSpeed || (PI / 480);
    this.owner_size = opts.owner_size || 'big';
    // Custom
    this.points = opts.points || null;
    this.translated_points = null;
    if (this.points && this.points.length) {
      this.calculateBaseProps();
    }

    // this.audioManager = new AudioManager({
    //   thud: {
    //     src: thudSound,
    //     loop: false,
    //     volume: 0.3,
    //   },
    // })

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
      Particles.asteroidExplosionParticles({
        world: this.world,
        direction: 'circular',
        spawn: this.center,
        color: this.owner_size === 'small' ? {
          value: color(255, 255, 255),
          to: color(255, 215, 0),
        } :  {
          value: color(255, 255, 255),
          to: color(213, 72, 168),
        },
      });

      this.shutdown();
    }
  }

  getSegmentStyle () {
    if (this.radius <= this.world.player.radius) {
      return {
        fill: color(255, 215, 0),
        close: true,
        color: color(255, 215, 0),
      };
    }
    return {
      fill: true,
      close: true,
      color: color(213, 72, 168),
      highlight: color(247, 195, 205),
    };
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
              collision_point,
              projectile: other_obj,
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
    const {
      collision_point,
      projectile,
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

    this.world.audioManager.playOnce("thud", {
      no_ramp_up: true,
    });
    Particles.asteroidImpactParticles({
      world: this.world,
      direction: projectile.aim,
      spawn: collision_point,
      baseVelocity: this.velocity,
    });

    try {
      if (this.resolved) return;


      let supersegments = segments.concat(segments);
      let new_asteroid_one = [];
      let new_asteroid_two = [];

      let i = 0;
      let segment = supersegments[i];
      while (!segmentMatch(split_from.segment, segment)) {
        ++i; // ignore everything until we get to the first point
        if (i > supersegments.length) {
          // console.log('split not found');
          // debugger;
          return;
        }
        segment = supersegments[i];
      }
      // First match against the "from" segment
      new_asteroid_one.push(split_from.point);
      new_asteroid_one.push(segment.p2);

      ++i;
      if (i > supersegments.length) {
        // console.log('split not found');
        // debugger;
        return;
      }
      segment = supersegments[i];

      while (!segmentMatch(split_to.segment, segment)) {
        new_asteroid_one.push(segment.p2);
        ++i;
        if (i > supersegments.length) {
          // console.log('split not found');
          // debugger;
          return;
        }
        segment = supersegments[i];
      }

      // First match against the "from" segment
      new_asteroid_one.push(split_to.point);
      // First asteroid is done
      new_asteroid_two.push(split_to.point);
      new_asteroid_two.push(segment.p2);

      ++i;
      if (i > supersegments.length) {
        // console.log('split not found');
        // debugger;
        return;
      }
      segment = supersegments[i];

      while (!segmentMatch(split_from.segment, segment)) {
        new_asteroid_two.push(segment.p2);
        ++i;
        if (i > supersegments.length) {
          // console.log('split not found');
          // debugger;
          return;
        }
        segment = supersegments[i];
      }

      // First match against the "from" segment
      new_asteroid_two.push(split_from.point);

      this.resolved = true;

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
        owner_size: (this.radius > this.world.player.radius) ? 'big' : 'small',
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
        owner_size: (this.radius > this.world.player.radius) ? 'big' : 'small',
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


/***/ }),

/***/ 596:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const { style } = __webpack_require__(391);
const {
  getRandom,
  getRandomInt,
  coinFlip,
} = __webpack_require__(66);

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


/***/ }),

/***/ 541:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);
const CFG = __webpack_require__(78);

const { style } = __webpack_require__(391);
const { getRandom, getRandomInt } = __webpack_require__(66);

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


/***/ }),

/***/ 527:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const { style } = __webpack_require__(391);
const { getRandomInt } = __webpack_require__(66);

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


/***/ }),

/***/ 642:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const { style } = __webpack_require__(391);
const { getRandom } = __webpack_require__(66);

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


/***/ }),

/***/ 24:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const { style } = __webpack_require__(391);
const { getRandom } = __webpack_require__(66);

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


/***/ }),

/***/ 935:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GIM = __webpack_require__(443);
const GOB = __webpack_require__(406);
const CFG = __webpack_require__(78);
const Particles = __webpack_require__(349);

const SanloStyles = __webpack_require__(868);
const FuturamaStyles = __webpack_require__(897);
const ClassicStyles = __webpack_require__(194);

const AudioManager = __webpack_require__(330);
const Projectile = __webpack_require__(700);
const Segment = __webpack_require__(394);

// const thrusterSound = require('sounds/thrusters.mp3');
// const laserSound = require('sounds/laser.mp3');
// const explosionSound = require('sounds/explosion.mp3');
// const goldSound = require('sounds/gold.mp3');

const { PI, HALF_PI,
  clampRadians,
  getMagnitude,
  getUnitVector,
  rotatePointCounterClockwise,
 } = __webpack_require__(488);
 const { getRandomUnitVector } = __webpack_require__(66);

class Player extends GOB {
	constructor (opts = {}) {
		super(opts);

    this.id = "player";
    this.type = "ship";
    this.collidable = true;
    this.invincible = false;
    this.width = 40; // 2x3
    this.height = 40;
    this.rotationSpeed = PI / 72;
		this.theta = Math.PI / 2;
    this.invincible_time = opts.invincible_time || 0;
    this.dead = false;

    if (this.invincible_time) {
      this.collidable = false;
      this.invincible = true;
      // this.opacity = 0.5;
      window.setTimeout(() => {
        this.collidable = true;
        this.invincible = false;
        // this.opacity = 1;
      }, this.invincible_time)
    }

    // Custom
    this.max_speed = 6;
    this.thrust = {
      active: false,
      power: 0.085,
    };

    // this.audioManager = new AudioManager({
    //   thruster: {
    //     src: thrusterSound,
    //     loop: true,
    //     volume: 0.65,
    //   },
    //   laser: {
    //     src: laserSound,
    //     loop: false,
    //     volume: 0.03,
    //   },
    //   explosion: {
    //     src: explosionSound,
    //     loop: false,
    //     volume: 0.2,
    //   },
    //   gold: {
    //     src: goldSound,
    //     loop: false,
    //     volume: 0.2,
    //   },
    // })

    this.weaponFirable = true;
    this.weaponTimer = null;

    this.generateSegments();
    return this;
  }

  generateSegments () {
    this.ship = CFG.ship;
    switch (this.ship) {
      case 'classic':
        ClassicStyles.generateShip(this);
        break;
      case 'futurama':
        FuturamaStyles.generateShip(this);
        break;
      default: // "sanlo"
        SanloStyles.generateShip(this);
        break;
    }
  }

  getPlayerHeadingVector () {
    return {
      x: Math.cos(this.theta - HALF_PI),
      y: Math.sin(this.theta - HALF_PI),
    };
  }

  checkPlayerMovement () {
    if (GIM.isKeyDown('W UP')) {
      this.thrust.active = true;
    } else {
      this.thrust.active = false;
    }

    if (GIM.isKeyDown('A LEFT')) {
      this.rotation = -1 * this.rotationSpeed;
    }

    if (GIM.isKeyDown('D RIGHT')) {
      this.rotation = this.rotationSpeed;
    }

    if (!GIM.isKeyDown('A LEFT D RIGHT')) {
      this.rotation = 0;
    }
  }

	update () {
    if (this.dead) return;

    if (CFG.ship !== this.ship) {
      this.generateSegments();
    }

    const playerHeadingVector = this.getPlayerHeadingVector();

    this.theta += this.rotation;
    this.theta = clampRadians(this.theta);

    if (this.thrust.active) {
      this.world.audioManager.players.thruster.play();
      this.velocity.x += (playerHeadingVector.x * this.thrust.power);
      this.velocity.y += (playerHeadingVector.y * this.thrust.power);
    } else {
      this.world.audioManager.players.thruster.pause();
    }

    const velMag = getMagnitude(this.velocity);
    if (velMag > this.max_speed) {
      this.velocity.x *= (this.max_speed / velMag);
      this.velocity.y *= (this.max_speed / velMag);
    }
    this.x += this.velocity.x;
		this.y += this.velocity.y;

    // Particles after position update otherwise they will
    // emit from the previous location
    if (this.thrust.active) {
      this.thrustParticles(playerHeadingVector);
    }
  }

  keyDown (key) {
    if (this.dead) return;
    this.checkPlayerMovement();
    if (GIM.isKeyDown('SPACE')) {
      this.fireWeapon();
    }
  }

  keyUp (key) {
    if (this.dead) return;
    this.checkPlayerMovement();
  }

  fireWeapon () {
    if (!this.weaponFirable) return;

    const playerHeadingVector = this.getPlayerHeadingVector();
    this.world.audioManager.playOnce("laser");
    new Projectile({
      world: this.world,
      layer: GOM.front,
      spawner: this,
      // spawn: rotatePointCounterClockwise(
      //   this.uniquePoints.cannon,
      //   this.theta,
      //   this.getCenter(),
      // ),
      spawn: this.getCenter(),
      baseVelocity: this.velocity,
      aim: playerHeadingVector,
    });

    this.cannonParticles(playerHeadingVector);

    this.weaponFirable = false;
    window.setTimeout(() => {
      this.weaponFirable = true;
    }, 500);
  }

  cannonParticles (playerHeadingVector) {
    SanloStyles.cannonParticles(this, playerHeadingVector);
  }

  thrustParticles (playerHeadingVector) {
    switch (CFG.ship) {
      case 'classic':
        ClassicStyles.thrustParticles(this, playerHeadingVector);
        break;
      case 'futurama':
        FuturamaStyles.thrustParticles(this, playerHeadingVector);
        break;
      default: // "sanlo"
        SanloStyles.thrustParticles(this, playerHeadingVector);
        break;
    }
  }

  resolveCollision (collision_point, collision_data) {
    if (this.resolved) return;
    const { other_obj } = collision_data;
    if (other_obj.type === 'asteroid') {
      if (other_obj.radius <= this.radius) {
        // this.world.audioManager.pauseAll().playOnce("gold");
        this.world.audioManager.playOnce("gold");
        Particles.pickupGoldParticles({
          world: this.world,
          direction: getUnitVector({
            x: this.x - other_obj.x,
            y: this.y - other_obj.y,
          }),
          baseVelocity: this.velocity,
          spawn: other_obj.center,
        });
        other_obj.shutdown();
      } else {
        this.resolved = true;

        this.perSegment((segment, config) => {
          if (segment.type === 'arc') return;
          new Segment({
            world: this.world,
            baseVelocity: {
              x: this.velocity.x * 0.25,
              y: this.velocity.y * 0.25,
            },
            direction: getRandomUnitVector(),
            speed: 0.75,
            segment,
            config,
          });
        });

        this.world.handlePlayerDeath();
        // Pause all playing audio (mainly thrusters)
        // this.world.audioManager.pauseAll().playOnce("explosion");
        this.world.audioManager.playOnce("explosion");
        // Don't render the player anymore. If I go with the
        // segmented death, they will be new objects, not part
        // of the player
        this.render = false;
        this.collidable = false;
        // Custom property to the player
        this.dead = true;
      }
    }
  }

  drawCustom () {
    const c = this.context;
    if (this.invincible) {
      c.save();
        c.beginPath();
        c.arc(
          this.x + this.half_width,
          this.y + this.half_height,
          this.radius * 1.25,
          0,
          2 * Math.PI
        );
        // redStroke(c);
        c.closePath();
        c.globalAlpha = 0.25;
        c.fillStyle = '#FFFFFF';
        c.fill();
      c.restore();
    }
  }
}

module.exports = Player;


/***/ }),

/***/ 700:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);
const CFG = __webpack_require__(78);

const SanloStyles = __webpack_require__(868);
const FuturamaStyles = __webpack_require__(897);
const ClassicStyles = __webpack_require__(194);

class Projectile extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "projectile";
    this.collidable = true;

    this.speed = 18;
    this.velocity = {
      x: opts.baseVelocity.x + (this.speed * opts.aim.x),
      y: opts.baseVelocity.y + (this.speed * opts.aim.y),
    };

		this.z = 1000000;

    this.aim = opts.aim || {
      x: 0,
      y: 0,
    };
    this.length = 10;
    const tip = {
      x: this.x + (opts.aim.x * this.length),
      y: this.y + (opts.aim.y * this.length),
    };

    this.tip = tip;
    this.og = {
      x: this.x,
      y: this.y,
    };
		this.width = Math.abs(tip.x - this.x);
		this.height = Math.abs(tip.y - this.y);

    this.projectile_diff = {
      x: this.tip.x - this.x,
      y: this.tip.y - this.y,
    };

    const trueX = tip.x < this.x ? tip.x : this.x;
    const trueY = tip.y < this.y ? tip.y : this.y;
    this.x = trueX;
    this.y = trueY;

    this.generateSegments();

    window.setTimeout(() => {
      this.shutdown();
    }, 700)

		return this;
	}

  generateSegments () {
    this.theme = CFG.theme;
    switch (this.theme) {
      case 'classic':
        ClassicStyles.generateProjectile(this);
        break;
      case 'futurama':
        FuturamaStyles.generateProjectile(this);
        break;
      default: // "sanlo"
        SanloStyles.generateProjectile(this);
        break;
    }
  }

	update () {
    if (CFG.theme !== this.theme) {
      this.generateSegments();
    }
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}

  resolveCollision (collision_point, collision_data) {
    if (this.resolved) return;

    // What the shots will eventually do
    // also spawn a particle effect
    this.shutdown();

    // Set the tip of the projectile to the collision
    // point and update the other stuffs accordingly
    const tip = collision_point;
    const tail = {
      x: tip.x - this.projectile_diff.x,
      y: tip.y - this.projectile_diff.y,
    };
    const trueX = tip.x < tail.x ? tip.x : tail.x;
    const trueY = tip.y < tail.y ? tip.y : tail.y;
    this.x = trueX;
    this.y = trueY;

    // Kill the speed for debugging purposes
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.resolved = true;
  }
}

module.exports = Projectile;


/***/ }),

/***/ 394:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);
const CFG = __webpack_require__(78);

const Particles = __webpack_require__(349);

const { color } = __webpack_require__(293);

const { coinFlip, getRandom, getRandomInt, getPercentileRoll } = __webpack_require__(66);
const { TWO_PI, PI, segmentMatch, clampRadians, rotatePointClockwise, rotatePointCounterClockwise, getMagnitude } = __webpack_require__(488);
const { checkRaySegmentIntersection } = __webpack_require__(90);

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


/***/ }),

/***/ 505:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GIM = __webpack_require__(443);
const GOB = __webpack_require__(406);
const CFG = __webpack_require__(78);

const AudioManager = __webpack_require__(330);

const Segment = __webpack_require__(824);

const Player = __webpack_require__(935);
const Asteroid = __webpack_require__(712);

const Nebula = __webpack_require__(596);
const Planet = __webpack_require__(541);
const Sun = __webpack_require__(642);
const Void = __webpack_require__(24);
const ShootingStars = __webpack_require__(527);

const {
  getRandom,
  getRandomInt,
  getPercentileRoll,
} = __webpack_require__(66);

class World extends GOB {
    constructor (opts = {}) {
      super(opts);

      this.render = false;
      this.cross_boundary = false;

      this.width = GOM.canvas_container_width;
		  this.height = GOM.canvas_container_height;

      this.background_objects = [];

      this.player = null;

      this.audioManager = new AudioManager();

      this.generateWorld();

      return this;
    }

    handlePlayerDeath () {
      // console.log('player dead');
      if (this.player.dead) return;
      this.player.dead = true;
      window.setTimeout(() => {
        // console.log('player shutdown');
        this.player.shutdown();
        this.spawnPlayer({
          invincible_time: 3000,
        });
      }, 3000);
    }

    getBounds () {
      return [
        new Segment({
          id: 'top',
          p1: { x: 0, y: 0 },
          p2: { x: this.width, y: 0 },
        }),
        new Segment({
          id: 'right',
          p1: { x: this.width, y: 0 },
          p2: { x: this.width, y: this.height },
        }),
        new Segment({
          id: 'bottom',
          p1: { x: this.width, y: this.height },
          p2: { x: 0, y: this.height },
        }),
        new Segment({
          id: 'left',
          p1: { x: 0, y: this.height },
          p2: { x: 0, y: 0 },
        }),
      ];
    }

    generateWorld () {
      this.generateBackground();
      this.spawnPlayer();
      this.spawnAsteroids();
    }

    generateBackground () {
      let amount = 0;

      // Nebulas
      amount = 1;
      if (getPercentileRoll(50)) amount += 1;
      if (getPercentileRoll(10)) amount += 1;
      for (let i = 0; i < amount; ++i) {
        this.background_objects.push(
          new Nebula({ world: this })
        );
      }

      // Planets
      amount = 1;
      if (getPercentileRoll(20)) amount += 1;
      for (let i = 0; i < amount; ++i) {
        this.background_objects.push(
          new Planet({ world: this })
        );
      }

      this.background_objects.push(
        new Sun({ world: this })
      );
      this.background_objects.push(
        new Void({ world: this })
      );
      this.background_objects.push(
        new ShootingStars({ world: this })
      );
    }

    spawnPlayer (params = {}) {
      // We want the player to spawn in the middle of the screen
      this.player = new Player({
        ...params,
        world: this,
        layer: GOM.front,
        z: 10,
        spawn: {
          x: this.width / 3,
          y: this.height / 3,
        },
      });
    }

    spawnAsteroids (params = {}) {
      const asteroidCount = 5;
      const third_width = this.width / 3;
      const third_height = this.height / 3;
      const sectionList = [
        { x: 0, y: 0}, // TL
        { x: 1, y: 0}, // TM
        { x: 2, y: 0}, // TR
        { x: 0, y: 1}, // ML
        { x: 2, y: 1}, // MR
        { x: 0, y: 2}, // BL
        { x: 1, y: 2}, // BM
        { x: 2, y: 2}, // BR
      ];
      for (let i = 0; i < asteroidCount; ++i) {
        let spawnIndex = getRandomInt(0, sectionList.length - 1);
        let spawnMods = sectionList[spawnIndex];
        // Remove the index as a possibility
        sectionList.splice(spawnIndex, 1);

        const x = (third_width * spawnMods.x) + getRandomInt(1, third_width);
        const y = (third_height * spawnMods.y) + getRandomInt(1, third_height);

        const initialVelocity = 1.25;
        new Asteroid({
          ...params,
          world: this,
          spawn: {
            x: x,
            y: y,
          },
          radius: getRandomInt(70, 100),
          // velocity: {
          //   x: 0,
          //   y: 0,
          // },
          velocity: {
            x: getRandom(-initialVelocity, initialVelocity),
            y: getRandom(-initialVelocity, initialVelocity),
          },
        })
      }
    }

    hideBackgroundObjects () {
      this.background_objects.forEach((bkg_obj) => {
        bkg_obj.hide();
      });
    }

    showBackgroundObjects () {
      this.background_objects.forEach((bkg_obj) => {
        bkg_obj.show();
      });
    }

    update () {

    }
}

module.exports = World;


/***/ }),

/***/ 194:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ParticleSystem = __webpack_require__(489);
const { color } = __webpack_require__(293);
const { rotatePointCounterClockwise } = __webpack_require__(488);

const ClassicStyles = {
  generateShip: (game_obj) => {
    game_obj.q = 10;
    game_obj.width = game_obj.q * 4; // 2x3
    game_obj.height = game_obj.q * 6;

    game_obj.segmentsList = game_obj.createSegments([
      {
        fill: true,
        close: true
      },{ // TIP
        id: 'cannon',
        x: 0,
        y: -game_obj.half_height,
      }, { // RIGHTWING
        x: game_obj.half_width,
        y: game_obj.half_height,
      }, { // THRUSTER
        id: 'thruster',
        x: 0,
        y: game_obj.half_height * 0.66,
      }, { // LEFTWING
        x: -game_obj.half_width,
        y: game_obj.half_height,
      }
    ]);

    game_obj.aesthetics = [];
  },

  generateProjectile (game_obj) {
    game_obj.segmentsList = game_obj.createSegments([
      {
        color: color(255, 255, 255),
      },
      { // START
        x: game_obj.og.x - game_obj.center.x,
        y: game_obj.og.y - game_obj.center.y,
      }, { // END
        x: game_obj.tip.x - game_obj.center.x,
        y: game_obj.tip.y - game_obj.center.y,
      }
    ]);
  },

  thrustParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      amount: 1,
      color: {
        value: color(255, 255, 255),
      },
      particleLifetime: {
        value: 90,
        random: [0.6, 1.2],
      },
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.thruster,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: {
        value: 8,
        random: [0.5, 1.25],
      },
      aim: {
        x: unitVector.x * -1,
        y: unitVector.y * -1,
        random: [-0.2, 0.2],
      },
    });
  },
}

module.exports = ClassicStyles;


/***/ }),

/***/ 897:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ParticleSystem = __webpack_require__(489);
const { color } = __webpack_require__(293);
const { rotatePointCounterClockwise } = __webpack_require__(488);

const FuturamaStyles = {
  generateShip: (game_obj) => {
    game_obj.block_size = 10;
    const b = game_obj.block_size;
    // The Futurama ship standing on end has a 2x5 ratio
    game_obj.width = b * 4;
    game_obj.height = b * 10;
    // game_obj.aesthetics_before = true;

    game_obj.segmentsList = [

      // BOTTOM WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(63, 134, 116),
          highlight: color(153, 241, 218),
        },
        { x:    1 * b, y:  -1 * b }, // WING START
        { x:  1.9 * b, y:   0 * b }, // FIRST CURVE
        { x:    2 * b, y:   2 * b }, // WING TIP
        { x:  1.5 * b, y:   1 * b }, // INSIDE CURVE
        { x: 0.75 * b, y: 1.5 * b }, // BACK ATTACK POINT
        { x:  0.5 * b, y:   0 * b }, // WING CURVE APEX
      ]),
      // TOP WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(63, 134, 116),
          highlight: color(153, 241, 218),
        },
        { x:    -1 * b, y:   0 * b }, // TOP WING START
        { x: -0.55 * b, y: 1.8 * b }, // AFTER THRUSTER / TOP WING END
        { x:    -1 * b, y:   2 * b }, // INSIDE CURVE
        { x:    -2 * b, y:   4 * b }, // WING TIP
        { x: -1.85 * b, y:   1 * b }, // END CURVE
      ]),
      // THRUSTER
      game_obj.createSegments([
        {
          fill: true,
          color: color(124, 145, 155),
          highlight: color(210, 210, 210),
        },
        { x:   0.3 * b, y:    2 * b }, // BEGIN STEM
        { x:   0.3 * b, y:  2.2 * b }, // END STEM
        { x:  0.45 * b, y:  2.3 * b }, // THRUSTER BOTTOM START
        { x:   0.5 * b, y:    3 * b }, // THRUSTER BOTTOM END
        { x:     0 * b, y: 3.25 * b, id: 'thruster' }, // THRUSTER CENTER
        { x:  -0.5 * b, y:  3.5 * b }, // THRUSTER TOP START
        { x: -0.45 * b, y:  2.3 * b }, // THRUSTER TOP END
        { x:  -0.3 * b, y:  2.2 * b }, // BEGIN STEM
        { x:  -0.3 * b, y:    2 * b }, // END STEM
      ]),
      // BODY
      game_obj.createSegments([
        {
          fill: true,
          color: color(175, 213, 169),
          highlight: color(211, 249, 205),
        },
        { x:     0 * b, y:  -5 * b, id: 'cannon' }, // TIP
        { x:     0 * b, y:  -4 * b }, // NOSE UNDERSIDE (FLAT PART)
        { x:     1 * b, y:  -3 * b }, // THE CURVE
        { x:     1 * b, y:  -1 * b }, // WING START
        { x:   0.5 * b, y:   0 * b }, // WING CURVE APEX
        { x:  0.75 * b, y: 1.5 * b }, // WING END
        { x:   0.5 * b, y:   2 * b }, // BEFORE THRUSTER
        { x:  -0.5 * b, y:   2 * b }, // AFTER THRUSTER / TOP WING END
        { x:    -1 * b, y:   0 * b }, // TOP WING START
        { x:    -1 * b, y:  -3 * b }, // TOP END
        { x: -0.75 * b, y:  -4 * b }, // WINDOW CURVE
      ]),
    ];

    game_obj.aesthetics = [
      // STRIPE (red down center)
      game_obj.createSegments([
        {
          color: color(189, 24, 28),
          highlight: color(239, 153, 156),
          strokeWidth: 1,
        },
        { x: 0 * b, y: -5 * b }, // TIP
        { x: 0 * b, y:  2 * b }, // BUTT
      ]),
    ];
  },

  generateProjectile (game_obj) {
    game_obj.segmentsList = game_obj.createSegments([
      {
        color: color(255, 0, 0),
        highlight: color(255, 200, 200),
      },
      { // START
        x: game_obj.og.x - game_obj.center.x,
        y: game_obj.og.y - game_obj.center.y,
      }, { // END
        x: game_obj.tip.x - game_obj.center.x,
        y: game_obj.tip.y - game_obj.center.y,
      }
    ]);
  },

  thrustParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      neon: true,
      amount: 3,
      color: {
        value: color(255, 255, 255),
        to: color(49, 39, 242),
      },
      particleLifetime: {
        value: 60,
        random: [0.6, 1.2],
      },
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.thruster,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: {
        value: 6,
        random: [0.5, 1.25],
      },
      aim: {
        x: unitVector.x * -1,
        y: unitVector.y * -1,
        random: [-0.2, 0.2],
      },
    });
  },
}

module.exports = FuturamaStyles;


/***/ }),

/***/ 349:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ParticleSystem = __webpack_require__(489);
const { color } = __webpack_require__(293);
const { HALF_PI } = __webpack_require__(488);

const Particles = {
  asteroidImpactParticles (opts = {}) {
    const {
      world,
      direction,
      spawn,
      baseVelocity,
    } = opts;

    new ParticleSystem({
      world,
      neon: true,
      amount: 9,
      radius: 3,
      color: {
        value: color(255, 255, 255),
        to: color(213, 72, 168),
      },
      particleLifetime: {
        value: 200,
        random: [0.6, 1.2],
      },
      spawn,
      baseVelocity,
      speed: {
        value: 2,
        random: [0.5, 1.25],
      },
      aim: {
        x: direction.x * -1,
        y: direction.y * -1,
        random: [-0.2, 0.2],
      },
    });
  },

  asteroidExplosionParticles (opts = {}) {
    const {
      world,
      color,
      spawn,
    } = opts;

    new ParticleSystem({
      world,
      neon: true,
      amount: 20,
      radius: 8,
      color: color,
      particleLifetime: {
        value: 200,
        random: [0.6, 1.2],
      },
      spawn,
      baseVelocity: {
        x: 0,
        y: 0,
      },
      speed: {
        value: 1.75,
        random: [1, 1.25],
      },
      aim: {
        x: 1,
        y: 0,
        random: [-HALF_PI, HALF_PI],
      },
    });
  },

  pickupGoldParticles (opts = {}) {
    const {
      world,
      direction,
      spawn,
    } = opts;

    new ParticleSystem({
      world,
      neon: true,
      amount: 20,
      radius: 1,
      color: {
        value: color(255, 255, 255),
        to: color(255, 215, 0),
      },
      particleLifetime: 200,
      spawn,
      baseVelocity: {
        x: 0,
        y: 0,
      },
      speed: 1.5,
      aim: direction,
    });
  },
};

module.exports = Particles;


/***/ }),

/***/ 868:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const ParticleSystem = __webpack_require__(489);
const { color } = __webpack_require__(293);
const { rotatePointCounterClockwise } = __webpack_require__(488);

const SanloStyles = {
  generateShip: (game_obj) => {
    game_obj.q = 10;
    game_obj.width = game_obj.q * 4; // 2x3
    game_obj.height = game_obj.q * 6;

    const q = game_obj.q;
    const qq = q * 2;
    const qqq = q * 3;

    game_obj.segmentsList = [
      // RIGHT WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: q, y: 0 }, // TOP CONNECTOR
        { x: q * 1.5, y: q * 0.25 },
        { x: q * 1.75, y: q },
        { x: q * 1.75, y: qq * 0.8 },
        { x: q * 1.5, y: qqq * 0.9 },
        { x: q * 1.2, y: qq * 0.8 }, // END CONNECTOR
        { x: q * 0.9, y: qq * 0.65 }, // END CONNECTOR
        { x: q * 0.6, y: qq * 0.6 }, // END CONNECTOR
      ]),
      // LEFT WING
      game_obj.createSegments([
        {
          fill: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: -q, y: 0 }, // TOP CONNECTOR
        { x: -q * 1.5, y: q * 0.25 },
        { x: -q * 1.75, y: q },
        { x: -q * 1.75, y: qq * 0.8 },
        { x: -q * 1.5, y: qqq * 0.9 },
        { x: -q * 1.2, y: qq * 0.8 }, // END CONNECTOR
        { x: -q * 0.9, y: qq * 0.65 }, // END CONNECTOR
        { x: -q * 0.6, y: qq * 0.6 }, // END CONNECTOR
      ]),
      // THRUSTER
      game_obj.createSegments([
        {
          fill: true,
          close: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: q * 0.5, y: q * 1.8 }, // TOP RIGHT
        { x: q * 0.4, y: qq + (q * 0.1) }, // BOTTOM RIGHT
        { x: 0, y: qq + (q * 0.1), id: 'thruster' }, // BOTTOM RIGHT
        { x: -q * 0.4, y: qq + (q * 0.1) }, // BOTTOM LEFT
        { x: -q * 0.5, y: q * 1.8 }, // TOP LEFT
      ]),
      // SHIP BODY
      game_obj.createSegments([
        {
          fill: true,
          close: true,
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: 0, y: -qqq, id: 'cannon' }, // TIP
        { x: q * 0.7, y: -qq },
        { x: q, y: -q }, // BODY_TOP_RIGHT
        { x: q, y: 0 }, // BODY_BOTTOM_RIGHT
        { x: q * 0.5, y: q * 1.5 }, // END_RIGHT
        { x: -q * 0.5, y: q * 1.5 }, // END_LEFT
        { x: -q, y: 0 },  // BODY_BOTTOM_LEFT
        { x: -q, y: -q }, // BODY_TOP_LEFT
        { x: -q * 0.7, y: -qq },
      ]),
    ];

    game_obj.aesthetics = [
      // STRIPE (the lower down one)
      game_obj.createSegments([
        {
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: -q * 0.8, y: -q * 1.6 },
        { x: q * 0.8, y: -q * 1.6 },
      ]),
      // STRIPE (the higher up one)
      game_obj.createSegments([
        {
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        },
        { x: -q * 0.65, y: -qq },
        { x: q * 0.65, y: -qq },
      ]),
      game_obj.createSegments([
        {
          color: color(213, 72, 168),
          highlight: color(247, 195, 205),
        }, {
          id: 'porthole',
          type: 'arc',
          radius: q / 3,
          center: { x: 0, y: -q * 0.6 },
        }
      ]),
    ];
  },

  generateProjectile (game_obj) {
    game_obj.segmentsList = game_obj.createSegments([
      {
        color: color(213, 72, 168),
        highlight: color(247, 195, 205),
      },
      { // START
        x: game_obj.og.x - game_obj.center.x,
        y: game_obj.og.y - game_obj.center.y,
      }, { // END
        x: game_obj.tip.x - game_obj.center.x,
        y: game_obj.tip.y - game_obj.center.y,
      }
    ]);
  },

  cannonParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      radius: 3,
      color: {
        value: color(255, 255, 255),
        to: color(213, 72, 168),
      },
      particleLifetime: 60,
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.cannon,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: 4,
      aim: {
        x: unitVector.x,
        y: unitVector.y,
      },
    });
  },

  thrustParticles (game_obj, unitVector) {
    new ParticleSystem({
      world: game_obj.world,
      neon: true,
      amount: 3,
      radius: 6,
      color: {
        value: color(255, 255, 255),
        to: color(213, 72, 168),
      },
      particleLifetime: {
        value: 90,
        random: [0.6, 1.2],
      },
      spawn: rotatePointCounterClockwise(
        game_obj.uniquePoints.thruster,
        game_obj.theta,
        game_obj.getCenter(),
      ),
      baseVelocity: game_obj.velocity,
      speed: {
        value: 8,
        random: [0.5, 1.25],
      },
      aim: {
        x: unitVector.x * -1,
        y: unitVector.y * -1,
        random: [-0.2, 0.2],
      },
    });
  },
}

module.exports = SanloStyles;


/***/ }),

/***/ 464:
/***/ ((module) => {

class Arc {
  constructor (data = {}) {
    this.data = data;

    this.id = data.id;
    this.type = 'arc';

    const {
      shift = {},
      center,
    } = data;

    this.shift = {
      x: shift.x || 0,
      y: shift.y || 0,
    };

    this.shifted = false;
    if (this.shift.x || this.shift.y) {
      this.shifted = true;
    }

    this.__props = {
      center: center || {},
    };
  }

  set center (new_center) {
    this.__props.center = new_center;
  }

  get center () {
    return {
      x: this.__props.center.x + this.shift.x,
      y: this.__props.center.y + this.shift.y,
    };
  }
}

module.exports = Arc;


/***/ }),

/***/ 330:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const AudioPlayer = __webpack_require__(497);

const thrusterSound = __webpack_require__(971);
const laserSound = __webpack_require__(331);
const explosionSound = __webpack_require__(403);
const goldSound = __webpack_require__(616);
const thudSound = __webpack_require__(604);

const TRACKS = {
  thruster: {
    src: thrusterSound,
    loop: true,
    volume: 0.65,
  },
  laser: {
    src: laserSound,
    loop: false,
    volume: 0.03,
  },
  explosion: {
    src: explosionSound,
    loop: false,
    volume: 0.2,
  },
  gold: {
    src: goldSound,
    loop: false,
    volume: 0.2,
  },
  thud: {
    src: thudSound,
    loop: false,
    volume: 0.3,
  },
};

class AudioManager {
  constructor () {
    this.tracks = TRACKS;

    this.players = {};

    Object.keys(this.tracks).forEach((trackName) => {
      this.players[trackName] = new AudioPlayer(this.tracks[trackName]);
    });
  }

  playOnce (trackName) {
    const oneOff = new AudioPlayer(this.tracks[trackName]);
    oneOff.play();
    return this;
  }

  pauseAll () {
    Object.keys(this.players).forEach((player) => {
      this.players[player].pause();
    });
    return this;
  }

  shutdown () {
    Object.keys(this.players).forEach((player) => {
      this.players[player].shutdown();
    });
    return this;
  }
}

module.exports = AudioManager;


/***/ }),

/***/ 497:
/***/ ((module) => {

class AudioPlayer {
  constructor (track = {}) {
    this.player = new Audio();
    this.player.src = track.src;
    this.player.loop = track.loop || false;
    this.player.volume = 0;

    this.volume = track.volume;

    this.rampUpTimer = null;
    this.rampDownTimer = null;

    // In milliseconds, 5 and 0.02 will
    // take volume from 0 to 1 in 250 milliseconds
    this.volumeRampSpeed = 0.02;
    this.rampSpeed = 5;

    return this;
  }

  play () {
    if (!this.player.src) {
      // console.log('Trying to play a null sourced Audio element');
      return;
    }
    if (this.rampDownTimer) {
      // Clear any timers for stopping audio
      window.clearInterval(this.rampDownTimer);
      this.rampDownTimer = null;
    }
    // Stop if the player is already going
    if (!this.player.paused || this.rampUpTimer) return;
    // Start playing before ramping up the volume, this will make
    // the start quieter but also help eliminate starting pops
    this.player.play();
    this.rampUpTimer = window.setInterval(() => {
      // console.log('play timer for', this.player.src)
      if (this.player.volume + this.volumeRampSpeed >= this.volume) {
        this.player.volume = this.volume;
        window.clearInterval(this.rampUpTimer);
        this.rampUpTimer = null;
      } else {
        this.player.volume += this.volumeRampSpeed;
      }
    }, this.rampSpeed);
  }

  pause () {
    if (!this.player.src) {
      // console.log('Trying to pause a null sourced Audio element');
      return;
    }
    if (this.rampUpTimer) {
      // Clear any timers for starting audio
      window.clearInterval(this.rampUpTimer);
      this.rampUpTimer = null;
    }
    // Stop if the player is already paused
    if (this.player.paused || this.rampDownTimer) return;
    this.rampDownTimer = window.setInterval(() => {
      // console.log('pause timer for', this.player.src)
      if (this.player.volume - this.volumeRampSpeed <= 0) {
        this.player.volume = 0;
        this.player.pause();
        window.clearInterval(this.rampDownTimer);
        this.rampDownTimer = null;
      } else {
        this.player.volume -= this.volumeRampSpeed;
      }
    }, this.rampSpeed);
  }

  shutdown () {
    this.player.volume = 0;
    this.player.pause();
    this.player.volume = 0;
    // console.log('shutdown', this.player.src)
    window.clearInterval(this.rampUpTimer);
    this.rampUpTimer = null;
    window.clearInterval(this.rampDownTimer);
    this.rampDownTimer = null;
    this.player.src = null;
  }
}

module.exports = AudioPlayer;


/***/ }),

/***/ 90:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const {
  getIntersection,
  getPointDistance,
} = __webpack_require__(488);

// if (info.t1 >= 0 && info.t2 >= 0 && info.t2 <= 1) {

const CollisionHelpers = {
  checkRadial: (this_obj, other_obj, opts = {}) => {
    const { distance_mod = 1 } = opts;
    const { distance } = getPointDistance(
      this_obj.getCenter(),
      other_obj.getCenter()
    );
    let radialCheck = ((this_obj.radius + other_obj.radius) * distance_mod);
    if (radialCheck < 150) radialCheck = 150;
    if (distance < radialCheck) {
      return true;
    }
    return false;
  },

  checkRaySegmentIntersection: (opts = {}) => {
    const { ray, segment } = opts;
    return CollisionHelpers.checkSegmentIntersection({
      seg_one: ray,
      seg_two: segment,
    }, {
      ray_to_segment: true,
    });
  },

  checkSegmentIntersection: (segments = {}, config = {}) => {
    const { seg_one, seg_two } = segments;
    const { ray_to_segment = false } = config;

    const from1 = seg_one.p1;
    const to1 = seg_one.p2;
    const from2 = seg_two.p1;
    const to2 = seg_two.p2;

    const dX = to1.x - from1.x;
    const dY = to1.y - from1.y;

    const determinant = dX * (to2.y - from2.y) - (to2.x - from2.x) * dY;
    if (determinant === 0) return null; // parallel lines

    const lambda = ((to2.y - from2.y) * (to2.x - from1.x) + (from2.x - to2.x) * (to2.y - from1.y)) / determinant;
    const gamma = ((from1.y - to1.y) * (to2.x - from1.x) + dX * (to2.y - from1.y)) / determinant;

    // check if there is an intersection
    if (ray_to_segment) {
      // if (info.t1 >= 0 && info.t2 >= 0 && info.t2 <= 1) {
      if (lambda <= 0 || !(0 <= gamma && gamma <= 1)) return null;
    } else { // segment to segment
      if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return null;
    }

    return {
      this_segment: seg_one,
      other_segment: seg_two,
      x: from1.x + lambda * dX,
      y: from1.y + lambda * dY,
      lambda,
      gamma,
    };
  },

  castForward: (data = {}) => {
    const {
      this_segment,
      prev_this_segment,
      other_list = [],
    } = data;

    const forward_p1 = {
      p1: prev_this_segment.p1,
      p2: this_segment.p1,
    };
    const forward_p2 = {
      p1: prev_this_segment.p2,
      p2: this_segment.p2,
    };
    let closest = {
      lambda: null,
    };
    for (let i = 0; i < other_list.length; ++i) {
      // Test the first cast
      collision_info = CollisionHelpers.checkSegmentIntersection({
        seg_one: forward_p1,
        seg_two: other_list[i],
      });
      if (collision_info) {
        if (!closest.lambda || collision_info.lambda < closest.lambda) {
          closest = collision_info;
        }
        return collision_info;
      }
      // Test the second one
      collision_info = CollisionHelpers.checkSegmentIntersection({
        seg_one: forward_p2,
        seg_two: other_list[i],
      });
      if (collision_info) {
        if (!closest.lambda || collision_info.lambda < closest.lambda) {
          closest = collision_info;
        }
        return collision_info;
      }
    }
    if (closest.lambda === null) return null;
    return closest;
  },

  checkForwardCasts: (data = {}) => {
    const {
      this_segment,
      prev_this_segment,
      other_list,
      other_nested,
    } = data;
    let collision_info = null;

    if (other_nested) {
      let segment_collision_info = null;
      for (let i = 0; i < other_list.length; ++i) {
        segment_collision_info = CollisionHelpers.castForward({
          this_segment,
          prev_this_segment,
          other_list: other_list[i],
        });
        if (segment_collision_info) {
          // We don't want to overwrite a positive with a negative
          // when there are multiple lists
          collision_info = segment_collision_info;
        }
      }
    } else {
      collision_info = CollisionHelpers.castForward({
        this_segment,
        prev_this_segment,
        other_list: other_list,
      });
    }

    return collision_info;
  },

  castBackward: (data = {}) => {
    const {
      this_segment,
      prev_this_segment,
      other_list = [],
    } = data;

    const forward_p1 = {
      p1: prev_this_segment.p1,
      p2: this_segment.p1,
    };
    const forward_p2 = {
      p1: prev_this_segment.p2,
      p2: this_segment.p2,
    };
    let closest = {
      lambda: null,
    };
    for (let i = 0; i < other_list.length; ++i) {
      const other_segment = other_list[i];
      // If there was nothing then we need to cast the other_segment back
      // by the same foward cast of this_segment. If this is too big, the forward
      // casts will not hit anything, other objects cast back will hit it though
      // giving us our collision point. It might be expensive but we'll fix that later
      const back_p1 = {
        p1: other_segment.p1,
        p2: {
          x: other_segment.p1.x - (forward_p1.p2.x - forward_p1.p1.x),
          y: other_segment.p1.y - (forward_p1.p2.y - forward_p1.p1.y),
        }
      };
      const back_p2 = {
        p1: other_segment.p2,
        p2: {
          x: other_segment.p2.x - (forward_p2.p2.x - forward_p2.p1.x),
          y: other_segment.p2.y - (forward_p2.p2.y - forward_p2.p1.y),
        }
      };

      // Test the first cast
      collision_info = CollisionHelpers.checkSegmentIntersection({
        seg_one: back_p1,
        seg_two: this_segment,
      });
      if (collision_info) {
        if (!closest.lambda || collision_info.lambda < closest.lambda) {
          closest = collision_info;
        }
        return collision_info;
      }
      // Test the second one
      collision_info = CollisionHelpers.checkSegmentIntersection({
        seg_one: back_p2,
        seg_two: this_segment,
      });
      if (collision_info) {
        if (!closest.lambda || collision_info.lambda < closest.lambda) {
          closest = collision_info;
        }
        return collision_info;
      }
    }
    if (closest.lambda === null) return null;
    return closest;
  },

  checkBackwardCasts: (data = {}) => {
    const {
      this_segment,
      prev_this_segment,
      other_list,
      other_nested,
    } = data;
    let collision_info = null;

    if (other_nested) {
      let segment_collision_info = null;
      for (let i = 0; i < other_list.length; ++i) {
        segment_collision_info = CollisionHelpers.castBackward({
          this_segment,
          prev_this_segment,
          other_list: other_list[i],
        });
        if (segment_collision_info) {
          // We don't want to overwrite a positive with a negative
          // when there are multiple lists
          collision_info = segment_collision_info;
        }
      }
    } else {
      collision_info = CollisionHelpers.castBackward({
        this_segment,
        prev_this_segment,
        other_list: other_list,
      });
    }

    return collision_info;
  },

  checkSegments: (data = {}) => {
    const {
      this_segment,
      prev_this_segment,
      other_list = [],
      other_nested = false,
    } = data;
    let collision_info = null;

    try {
      if (other_nested) {
        let segment_collision_info = null;
        for (let i = 0; i < other_list.length; ++i) {
          segment_collision_info = CollisionHelpers.castForward({
            this_segment,
            prev_this_segment,
            other_list: other_list[i],
          });
          if (segment_collision_info) {
            // We don't want to overwrite a positive with a negative
            // when there are multiple lists
            collision_info = segment_collision_info;
          }
        }
      } else {
        collision_info = CollisionHelpers.castForward({
          this_segment,
          prev_this_segment,
          other_list: other_list,
        });
      }
    } catch (e) {
      console.log(e);
    }

    return collision_info;
  },

  // checkSegments: (this_obj, this_segment, other_obj, other_segment, tli, tlsi) => {
  //   let collision_info = null;


  //   // this_segment has already been updated
  //   // We need to check the current position
  //   // ---
  //   // Update: This is bad, casting back needs to be done first. If the update took us
  //   // to the other side of the asteroid itll count that spot, and not cast back to find
  //   // the intersection on the proper side
  //   // collision_info = CollisionHelpers.checkSegmentIntersection({
  //   //   seg_one: this_segment,
  //   //   seg_two: other_segment,
  //   // });
  //   // if (collision_info) return collision_info;

  //   // If there was nothing, then we test the forward "casts"
  //   // that got us to the new current point against the other_segment

  //   if (this_obj.previous_collision_segments_info) {
  //     const { segments: p_segments } = this_obj.previous_collision_segments_info;
  //     let prev_this_segment = this_obj.previous_collision_segments_info.segments.list[tli];
  //     if (p_segments.nested) prev_this_segment = prev_this_segment[tlsi];
  //     if (prev_this_segment) {
  //       const forward_one = {
  //         p1: this_segment.p1,
  //         p2: prev_this_segment.p1,
  //       };
  //       const forward_two = {
  //         p1: this_segment.p2,
  //         p2: prev_this_segment.p2,
  //       };
  //       // Test the first cast
  //       collision_info = CollisionHelpers.checkSegmentIntersection({
  //         seg_one: forward_one,
  //         seg_two: other_segment,
  //       });
  //       if (collision_info) {
  //         return collision_info;
  //       }
  //       // Test the second one
  //       collision_info = CollisionHelpers.checkSegmentIntersection({
  //         seg_one: forward_two,
  //         seg_two: other_segment,
  //       });
  //       if (collision_info) {
  //         return collision_info;
  //       }


  //       // collision_info = CollisionHelpers.checkSegmentIntersection({
  //       //   seg_one: this_segment,
  //       //   seg_two: other_segment,
  //       // });
  //       // if (collision_info) return collision_info;


  //       // If there was nothing then we need to cast the other_segment back
  //       // by the same foward cast of this_segment. If this is too big, the forward
  //       // casts will not hit anything, other objects cast back will hit it though
  //       // giving us our collision point. It might be expensive but we'll fix that later
  //       const back_one = {
  //         p1: other_segment.p1,
  //         p2: {
  //           x: other_segment.p1.x - (forward_one.p2.x - forward_one.p1.x),
  //           y: other_segment.p1.y - (forward_one.p2.y - forward_one.p1.y),
  //         }
  //       };
  //       const back_two = {
  //         p1: other_segment.p2,
  //         p2: {
  //           x: other_segment.p2.x - (forward_two.p2.x - forward_two.p1.x),
  //           y: other_segment.p2.y - (forward_two.p2.y - forward_two.p1.y),
  //         }
  //       };
  //       // Test the first cast
  //       collision_info = CollisionHelpers.checkSegmentIntersection({
  //         seg_one: back_one,
  //         seg_two: this_segment,
  //       });
  //       if (collision_info) {
  //         return collision_info;
  //       }
  //       // Test the second one
  //       collision_info = CollisionHelpers.checkSegmentIntersection({
  //         seg_one: back_two,
  //         seg_two: this_segment,
  //       });
  //       if (collision_info) {
  //         return collision_info;
  //       }
  //     }
  //   } else {
  //     collision_info = CollisionHelpers.checkSegmentIntersection({
  //       seg_one: this_segment,
  //       seg_two: other_segment,
  //     });
  //     if (collision_info) return collision_info;
  //   }


  //   return null;
  // },

  // checkProjectileBoxCollision: (projectile, obj) => {
  //   obj.collision_points = [];
  //   const segments = obj.getBoxCollisionSegments();
  //   for (let i = 0; i < segments.length; ++i) {
  //       const seg = segments[i];
  //       const projectile_vector = {
  //           px : projectile.x,
  //           py : projectile.y,
  //           dx : projectile.aim_point.x - projectile.x,
  //           dy : projectile.aim_point.y - projectile.y,
  //       };
  //       const wall_segment = {
  //           px : seg.p1.x,
  //           py : seg.p1.y,
  //           dx : seg.p2.x - seg.p1.x,
  //           dy : seg.p2.y - seg.p1.y,
  //       };
  //       const info = getIntersection(projectile_vector, wall_segment);
  //       if (info && info.t1 >= 0 && info.t2 >= 0 && info.t2 <= 1) {
  //           obj.collision_points.push(info);
  //       }
  //   }
  //   // everything is currently on front
  //   // obj.layer.update = true;
  //   return (obj.collision_points.length) ? obj.collision_points : null;
  // },
};

module.exports = CollisionHelpers;

// checkSegmentIntersection: (segments = {}) => {
//   const { seg_one, seg_two } = segments;
//   // if (!seg_one)

//   // // Same slope no intercept?
//   // if ((seg_one.p2.x / seg_one.p2.y) == (seg_two.p2.x / seg_two.p2.y)) return null;
//   // // A lot of crazy horseshit I will decipher later
//   // // LAMBDA
//   // const t2 = (seg_one.p2.x * (seg_two.p1.y - seg_one.p1.y) + seg_one.p2.y * (seg_one.p1.x - seg_two.p1.x)) / (seg_two.p2.x * seg_one.p2.y - seg_two.p2.y * seg_one.p2.x);
//   // // GAMMA
//   // const t1 = (seg_one.p2.x != 0) ? (seg_two.p1.x + seg_two.p2.x * t2 - seg_one.p1.x) / seg_one.p2.x : (seg_two.p1.y + seg_two.p2.y * t2 - seg_one.p1.y) / seg_one.p2.y;
//   // // Because things (lines (infinite) can intersect, these test against segment bounds)
//   // if (!(0 <= t2 && t2 <= 1) || !(0 <= t1 && t1 <= 1)) return null;
//   // return {
//   //   x: seg_one.p1.x + (t1 * seg_one.p2.x),
//   //   y: seg_one.p1.y + (t1 * seg_one.p2.y),
//   //   t2: t2,
//   //   t1: t1,
//   // };

//   const from1 = seg_one.p1;
//   const to1 = seg_one.p2;
//   const from2 = seg_two.p1;
//   const to2 = seg_two.p2;

//   const dX = to1.x - from1.x;
//   const dY = to1.y - from1.y;

//   const determinant = dX * (to2.y - from2.y) - (to2.x - from2.x) * dY;
//   if (determinant === 0) return null; // parallel lines

//   const lambda = ((to2.y - from2.y) * (to2.x - from1.x) + (from2.x - to2.x) * (to2.y - from1.y)) / determinant;
//   const gamma = ((from1.y - to1.y) * (to2.x - from1.x) + dX * (to2.y - from1.y)) / determinant;

//   // check if there is an intersection
//   if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return null;

//   return {
//     x: from1.x + lambda * dX,
//     y: from1.y + lambda * dY,
//   };

//   // function intersection(from1: Point2D, to1: Point2D, from2: Point2D, to2: Point2D): Point2D {
//   //   const dX: number = to1.x - from1.x;
//   //   const dY: number = to1.y - from1.y;

//   //   const determinant: number = dX * (to2.y - from2.y) - (to2.x - from2.x) * dY;
//   //   if (determinant === 0) return undefined; // parallel lines

//   //   const lambda: number = ((to2.y - from2.y) * (to2.x - from1.x) + (from2.x - to2.x) * (to2.y - from1.y)) / determinant;
//   //   const gamma: number = ((from1.y - to1.y) * (to2.x - from1.x) + dX * (to2.y - from1.y)) / determinant;

//   //   // check if there is an intersection
//   //   if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return undefined;

//   //   return {
//   //     x: from1.x + lambda * dX,
//   //     y: from1.y + lambda * dY,
//   //   };
//   // }

//   // The old copy for reference (still in lib/math)
//   // if ((r.dx / r.dy) == (s.dx / s.dy)) return null;
//   // const t2 = (r.dx * (s.py - r.py) + r.dy * (r.px - s.px)) / (s.dx * r.dy - s.dy * r.dx);
//   // const t1 = (r.dx != 0) ? (s.px + s.dx * t2 - r.px) / r.dx : (s.py + s.dy * t2 - r.py) / r.dy;
//   // return {
//   //   x: r.px + (t1 * r.dx),
//   //   y: r.py + (t1 * r.dy),
//   //   t2: t2,
//   //   t1: t1,
//   // };
// },


/***/ }),

/***/ 293:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { getRandomInt } = __webpack_require__(66);

const ColorHelpers = {
  color: (r, g, b, a = 1) => {
    let colorObj = {r, g, b, a};
    colorObj.hex = ColorHelpers.RGBtoHEX(colorObj);
    return colorObj;
  },

  // getColorObj: (r, g, b, a = 1) => {
  //   let colorObj = {};

  //   if (typeof r === 'object') {
  //     g = r.g;
  //     b = r.b;
  //     r = r.r;
  //   }

  //   if (typeof r === 'string') {
  //     if (color.indexOf('#') !== -1) {
  //       // Get rgb obj from hex value
  //       colorObj = {
  //         ...colorObj,
  //         ...ColorHelpers.HEXtoRGB(color),
  //       };
  //     } else {
  //       // Get rgb obj from rgba value
  //       colorObj.rgb = color;
  //       return ''; // "rgba(,,,)" to {r, g, b}
  //     }
  //   }

  //   if (typeof color === 'object') {
  //     if (color.r && color.g && color.b) {
  //       // Basically just keep any color data since an rgb obj
  //       colorObj = { ...colorObj, ...color };
  //     }
  //   }

  //   if (!colorObj.hex) {
  //     colorObj.hex = ColorHelpers.RGBtoHEX(colorObj);
  //   }
  // },

	RGBA: (r, g, b, a = 1) => {
    return `rgba(${r},${g},${b},${a})`;
	},

  getRandomColor: () => {
    const r = getRandomInt(0, 255);
    const g = getRandomInt(0, 255);
    const b = getRandomInt(0, 255);
    return {
      r,
      g,
      b,
      rgb: ColorHelpers.RGBA(r,g,b),
      hex: ColorHelpers.RGBtoHEX(r, g, b),
    };
  },

  getRGB: (color) => {
    if (typeof color === 'string') {
      if (color.indexOf('#') !== -1) {
        return ColorHelpers.HEXtoRGB(color);
      } else {
        return ''; // "rgba(,,,)" to {r, g, b}
      }
    }
    if (typeof color === 'object') {
      if (color.r && color.g && color.b) {
        return color;
      }
      if (color.hex) {
        return ColorHelpers.HEXtoRGB(color.hex);
      }
    }
  },

  getHEX: (color) => {
    if (color.r || color.g || color.b) {
      return ColorHelpers.RGBtoHEX(color);
    }
    return color;
  },

  HEXtoRGB: (hex) => {
    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  },

  RGBtoHEX: (r, g, b) => {
    if (typeof r === 'object') {
      g = r.g;
      b = r.b;
      r = r.r;
    }
    r = Math.round(r);
    g = Math.round(g);
    b = Math.round(b);
    const value = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    return value;
  },
};
module.exports = ColorHelpers;


/***/ }),

/***/ 391:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { hypenToCamelCase } = __webpack_require__(521);

const DomHelpers = {
  style: (styles) => {
    const htmlElement = document.createElement('div');
    Object.keys(styles).forEach((styleKey) => {
      htmlElement.style[hypenToCamelCase(styleKey)] = styles[styleKey];
    });
    return htmlElement;
  },
}

module.exports = DomHelpers;


/***/ }),

/***/ 172:
/***/ ((module) => {

const COLORS = {
  'red': ''
}
const Draw = {
  whiteStroke: (context) => {
    context.lineCap = 'round';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.stroke();
  },

  redStroke: (context) => {
    context.lineCap = 'round';
    context.strokeStyle = '#ff0000';
    context.lineWidth = 1;
    context.stroke();
  },

  neonStroke: (context, config = {}) => {
    let {
      fill = false,
      color = { hex: '#FFFFFF' },
      highlight = null,
      strokeWidth = 2,
    } = config;

    if (fill) {
      context.save();
        context.globalAlpha = 0.75;
        context.fillStyle = fill.hex || '#221f26';
        context.fill();
      context.restore();
    }

    context.lineCap = 'round';
    context.shadowBlur = 20;
    context.shadowColor = color.hex;
    context.strokeStyle = color.hex;
    context.lineWidth = strokeWidth * 2;
    context.stroke();

    if (highlight) {
      context.lineCap = 'round';
      context.shadowBlur = 10;
      context.shadowColor = highlight.hex;
      context.strokeStyle = highlight.hex;
      context.lineWidth = strokeWidth;
      context.stroke();
    }
  }
};

module.exports = Draw;


/***/ }),

/***/ 488:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PI = Math.PI;
const TWO_PI = PI * 2;
const HALF_PI = PI / 2;

const Arc = __webpack_require__(464);
const Segment = __webpack_require__(824);

const sqr = (value) => {
  return value * value;
}

const pointMatch = (p1, p2, tolerance) => {
  tolerance = tolerance || 0;
  return (Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance);
};

const MathHelpers = {
  PI,
  TWO_PI,
  HALF_PI,

  sqr,
  pointMatch,

  segmentMatch: (s1, s2) => {
    if (!s1 || !s2) return;
    // p1 and p2 match
    if (pointMatch(s1.p1, s2.p1, 2) && pointMatch(s1.p2, s2.p2, 2)) return true;
    // opposites match (p1 = p2, p2 = p1)
    if (pointMatch(s1.p1, s2.p2, 2) && pointMatch(s1.p2, s2.p1, 2)) return true;
    return false;
  },

  clampRadians: (angle) => {
    if (angle > TWO_PI) return 0;
    if (angle < 0) return TWO_PI;
    return angle;
  },

  getDistance: (p1, p2, no_sqrt) => {
		let dist = sqr(p1.x - p2.x) + sqr(p1.y - p2.y);
		if (no_sqrt) return dist;
		return Math.sqrt(dist);
	},

  getUnitVector: (vector) => {
    const mag = MathHelpers.getMagnitude(vector);
    return {
      x: vector.x / mag,
      y: vector.y / mag,
    };
  },

  getUnitVectorSegment: (segment) => {
    let vector = {
      x: segment.p2.x - segment.p1.x,
      y: segment.p2.y - segment.p1.y,
    };
    let mag = Math.sqrt(sqr(vector.x) + sqr(vector.y));
    return {
      x: vector.x / mag,
      y: vector.y / mag,
    };
  },

  getIntersection: (r, s) => {
    if ((r.dx / r.dy) == (s.dx / s.dy)) return null;

    const t2 = (r.dx * (s.py - r.py) + r.dy * (r.px - s.px)) / (s.dx * r.dy - s.dy * r.dx);
    const t1 = (r.dx != 0) ? (s.px + s.dx * t2 - r.px) / r.dx : (s.py + s.dy * t2 - r.py) / r.dy;

    return {
      x: r.px + (t1 * r.dx),
      y: r.py + (t1 * r.dy),
      t2: t2,
      t1: t1,
    };
  },

  getPointDistance: (point, item, config = {}) => {
    // Item can be either a point or a segment/line
    if (!point || !item) return;
    const { no_square = false } = config;

    // TODO pass no_square data down to the other thing
    // Points will always be passed in with a base x and y value
    if (typeof item.x === 'number' && typeof item.y === 'number') {
      let distance = sqr(item.x - point.x) + sqr(item.y - point.y)
      if (!no_square) distance = Math.sqrt(distance);
      return {
        distance,
        x: item.x,
        y: item.y,
      }
    }

    // Segments will always have two points, p1 and p2
    // First check to see if the point is a match to p1 or p2
    let p1_match = pointMatch(point, item.p1, 1);
    let p2_match = pointMatch(point, item.p2, 1);
    if (p1_match || p2_match) {
      return {
        distance: null,
        x: null,
        y: null,
      };
    }

    // Otherwise return the regular distance
    return MathHelpers.distanceToLine(point, item);
  },

  pDistance: (point, item, opts = {}) => {
    if (!point || !item) return;
    if (item.segment) item = item.segment;

    // The "item" can be anything, segment, light, point
    // If it's a simple point, get the distance and return
    if (item.x && item.y && !item.p1) {
      return {
        distance: Math.sqrt(sqr(item.x - point.x) + sqr(item.y - point.y)),
        x: item.x,
        y: item.y,
      }
    }

    if (item.position) {
      return {
        distance: Math.sqrt(sqr(item.position.x - point.x) + sqr(item.position.y - point.y)),
        x: item.position.x,
        y: item.position.y,
      }
    }

    // Now we're looking at a segment with p1 and p2, check the endpoints first
    let p1_match = pointMatch(point, item.p1, 1);
    let p2_match = pointMatch(point, item.p2, 1);
    if (opts.line_only && (p1_match || p2_match)) {
      return {
        distance: null,
        x: null,
        y: null,
      };
    }

    return MathHelpers.distanceToLine(point, item);
  },

  distanceToLine: (point, item) => {
    const A = point.x - item.p1.x;
    const B = point.y - item.p1.y;
    const C = item.p2.x - item.p1.x;
    const D = item.p2.y - item.p1.y;

    const dot = (A * C) + (B * D);
    const len_sq = (C * C) + (D * D);
    const param = (len_sq !== 0) ? (dot / len_sq) : -1;

    let xx = 0;
    let yy = 0;
    if (param < 0) {
      xx = item.p1.x;
      yy = item.p1.y;
    } else if (param > 1) {
      xx = item.p2.x;
      yy = item.p2.y;
    } else {
      xx = item.p1.x + param * C;
      yy = item.p1.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return {
      distance: Math.sqrt(sqr(dx) + sqr(dy)),
      x: xx,
      y: yy
    }
  },

  getDotProduct: (v1, v2) => {
    return v1.x * v2.x + v1.y * v2.y;
  },

  getMagnitude: (v) => {
    return Math.sqrt(sqr(v.x) + sqr(v.y));
  },

  getAngleBetweenVectors: (v1, v2) => {
    const dot = MathHelpers.getDotProduct(v1, v2);
    const v1_mag = MathHelpers.getMagnitude(v1);
    const v2_mag = MathHelpers.getMagnitude(v2);
    const cos_angle = dot / (v1_mag * v2_mag);
    const angle = Math.acos(cos_angle);
    return angle;
  },

  getNormal: (segment, reference_point) => {
    reference_point = reference_point || Mouse;
    // the "open" normal will be on the side
    // of the reference point, the mouse in most cases
    if (!segment) return;
    if (segment.segment) segment = segment.segment;

    // Get a unit vector of that perpendicular
    let unit_vector = MathHelpers.getUnitVectorSegment(segment);

    let perp_unit_vector = {
      x: unit_vector.y,
      y: unit_vector.x * -1
    };

    // Get the middle of the origin segment
    let middle_point = MathHelpers.getSegmentMiddle(segment);

    // Add some distance to the unit normal (for show)
    let dist_mod = 20;
    let mod_vector = {
      x: perp_unit_vector.x * dist_mod,
      y: perp_unit_vector.y * dist_mod
    };

    let point_one = {
      x: middle_point.x + mod_vector.x,
      y: middle_point.y + mod_vector.y
    };

    let point_two = {
      x: middle_point.x - mod_vector.x,
      y: middle_point.y - mod_vector.y
    };

    let dist_one = MathHelpers.pDistance(reference_point, point_one);
    let dist_two = MathHelpers.pDistance(reference_point, point_two);

    if (dist_one.distance <= dist_two.distance) {
      return {
        open: point_one,
        closed: point_two
      };
    }
    return {
      open: point_two,
      closed: point_one
    };
  },

  getSlope: (p1, p2) => {
    return (p2.y - p1.y) / (p2.x - p1.x);
  },

  getPerpendicularUnitVector: (segment) => {
    let unit_vector = MathHelpers.getUnitVectorSegment(segment);
    let perp = {
      x: unit_vector.y,
      y: unit_vector.x * -1
    }
    return perp;
  },

  getSegmentMiddle: (segment) => {
    return {
      x: segment.p1.x + ((segment.p2.x - segment.p1.x) * 0.5),
      y: segment.p1.y + ((segment.p2.y - segment.p1.y) * 0.5),
    };
  },

  rotatePointCounterClockwise: (p, theta = 0, origin) => {
    // x' = x * cos(a) - y * sin(a)
    // y' = x * sin(a) + y * cos(a)
    if (!origin) origin = {x: 0, y: 0}
    const newX = origin.x + ((p.x * Math.cos(theta)) - (p.y * Math.sin(theta)));
    const newY = origin.y + ((p.x * Math.sin(theta)) + (p.y * Math.cos(theta)));
    return {
      x: newX,
      y: newY,
    };
  },

  rotatePointClockwise: (p, theta = 0, origin) => {
    // x' =  x * cos(a) + y * sin(a)
    // y' = -x * sin(a) + y * cos(a)
    if (!origin) origin = {x: 0, y: 0}
    const newX = origin.x + ((p.x * Math.cos(theta)) + (p.y * Math.sin(theta)));
    const newY = origin.y + ((-p.x * Math.sin(theta)) + (p.y * Math.cos(theta)));
    return {
      x: newX,
      y: newY,
    };
  },

  rotateArc: ({ shift = {}, arc, origin, theta }) => {
    return new Arc({
      shift,
      radius: arc.radius,
      center: MathHelpers.rotatePointCounterClockwise(arc.center, theta, origin),
    });
  },

  rotateSegment: ({ shift = {}, segment, origin, theta }) => {
    return new Segment({
      shift,
      p1: MathHelpers.rotatePointCounterClockwise(segment.p1, theta, origin),
      p2: MathHelpers.rotatePointCounterClockwise(segment.p2, theta, origin),
    });
  },
};

module.exports = MathHelpers;


/***/ }),

/***/ 862:
/***/ ((module) => {

const MouseHelpers = {
	getMouseCoords: function (event, canvas) {
		var totalOffsetX = 0;
		var totalOffsetY = 0;
		var canvasX = 0;
		var canvasY = 0;
		var currentElement = canvas;

		totalOffsetX += currentElement.offsetLeft;
		totalOffsetY += currentElement.offsetTop;

		while(currentElement = currentElement.offsetParent){
			totalOffsetX += currentElement.offsetLeft;
			totalOffsetY += currentElement.offsetTop;
		}

		canvasX = event.pageX - totalOffsetX;
		canvasY = event.pageY - totalOffsetY;

		return {
			x : canvasX,
			y : canvasY
		};
	},
};

module.exports = MouseHelpers;


/***/ }),

/***/ 489:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const Particle = __webpack_require__(322);

const { getRandom } = __webpack_require__(66);
const { rotatePointCounterClockwise } = __webpack_require__(488);

const setNumberProperty = (property) => {
  if (typeof property === 'object') return property;
  return {
    value: property,
  };
};

const setColorProperty = (property) => {

};

class ParticleSystem extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "particles";
    this.cross_boundary = false;
    this.render = false;

    this.neon = opts.neon || true;
    this.radius = setNumberProperty(opts.radius || 10);
    this.speed = setNumberProperty(opts.speed || 0);
    this.particleLifetime = setNumberProperty(opts.particleLifetime || 200);
    this.spawnMethod = opts.spawnMethod || 'single';
    this.amount = opts.amount || 3;
    this.partcles = [];

    this.generateParticles(opts);

    if (this.spawnMethod === 'single') {
      this.shutdown();
    }

		return this;
	}

  generateParticles (opts) {
    for (let i = 0; i < this.amount; ++i) {
      let speedMod = this.speed.value;
      if (this.speed.random) {
        speedMod = getRandom(
          speedMod * this.speed.random[0],
          speedMod * this.speed.random[1]
        );
      }

      let velocity = {
        x: opts.baseVelocity.x + (speedMod * opts.aim.x),
        y: opts.baseVelocity.y + (speedMod * opts.aim.y),
      };
      if (opts.aim.random) {
        velocity = rotatePointCounterClockwise(
          velocity,
          getRandom(opts.aim.random[0], opts.aim.random[1])
        );
      }

      let lifetime = this.particleLifetime.value;
      if (this.particleLifetime.random) {
        lifetime = getRandom(
          lifetime * this.particleLifetime.random[0],
          lifetime * this.particleLifetime.random[1]
        );
      }

      this.partcles.push(new Particle({
        world: opts.world,
        radius: this.radius.value,
        neon: this.neon,
        color: opts.color,
        spawn: opts.spawn,
        velocity,
        lifetime,
      }));
    }
  }

	update () {}
}

module.exports = ParticleSystem;


/***/ }),

/***/ 322:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const { TWO_PI } = __webpack_require__(488);
const { getHEX } = __webpack_require__(293);
const { neonStroke } = __webpack_require__(172);

class Particle extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "particle";
    this.radius = opts.radius;
    // this.cross_boundary = false;
    this.current_lifetime = 0;
    this.lifetime = opts.lifetime;
    this.lifetime_steps = this.lifetime / GOM.FPS_INTERVAL;

    this.neon = opts.neon || false;
    this.color = opts.color || {
      value: {
        r: 255,
        g: 255,
        b: 255,
        a: 1,
        hex: '#ffffff',
        rgb: 'rgb(255, 255, 255)',
      },
      to: null,
    };

    this.current_color = JSON.parse(JSON.stringify(this.color.value));
    if (this.color.to) {
      this.color_steps = {
        r: (this.color.to.r - this.current_color.r) / this.lifetime_steps,
        g: (this.color.to.g - this.current_color.g) / this.lifetime_steps,
        b: (this.color.to.b - this.current_color.b) / this.lifetime_steps,
      }
    }
  }

  draw () {
    this.context.save();
      this.context.beginPath();
      this.context.arc(
        this.x,
        this.y,
        this.radius,
        0,
        TWO_PI,
      );

      this.context.fillStyle = getHEX(this.current_color);
      this.context.fill();
      if (this.neon) neonStroke(this.context, {
        color: { hex: getHEX(this.current_color) },
        highlight: { hex: getHEX(this.current_color) },
      });
    this.context.restore();
  }

  update () {
    this.x += this.velocity.x;
    this.y += this.velocity.y;
    if (this.color.to) {
      this.current_color.r += this.color_steps.r;
      this.current_color.g += this.color_steps.g;
      this.current_color.b += this.color_steps.b;
    }
    this.current_lifetime += GOM.FPS_INTERVAL;
    if (this.current_lifetime > this.lifetime) {
      this.shutdown();
    }
  }
}

module.exports = Particle;


/***/ }),

/***/ 66:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { TWO_PI,
  rotatePointCounterClockwise,
} = __webpack_require__(488);

const RandomHelpers = {
  getRandom: (min, max) => {
    return Math.random() * (max - min) + min;
  },

  getRandomInt: (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  getRandomFromArray: (array) => {
    var length = array.length;
    var index = RandomHelpers.getRandomInt(0, length - 1);
    return array[index];
  },

  getRandomPercentage: () => {
    return RandomHelpers.getRandomInt(0,100);
  },

  getRandomAngle: () => {
    return RandomHelpers.getRandom(0, TWO_PI);
  },

  getRandomUnitVector: () => {
    return rotatePointCounterClockwise({
      x: 0,
      y: 1,
    }, RandomHelpers.getRandomAngle());
  },

  getPercentileRoll: (threshhold = 50) => {
    // Default is a 50/50 coin flip
    return (RandomHelpers.getRandomInt(1, 100) <= threshhold);
  },

  coinFlip: () => {
    return RandomHelpers.getPercentileRoll(50);
  },
}

module.exports = RandomHelpers;


/***/ }),

/***/ 824:
/***/ ((module) => {

class Segment {
  constructor (data = {}) {
    this.data = data;

    this.id = data.id;
    this.type = 'segment';

    const {
      shift = {},
      p1,
      p2,
    } = data;

    this.shift = {
      x: shift.x || 0,
      y: shift.y || 0,
    };

    this.shifted = false;
    if (this.shift.x || this.shift.y) {
      this.shifted = true;
    }

    this.__props = {
      p1: p1 || {},
      p2: p2 || {},
    };
  }

  set p1 (new_p1) {
    this.__props.p1 = new_p1;
  }

  get p1 () {
    return {
      x: this.__props.p1.x + this.shift.x,
      y: this.__props.p1.y + this.shift.y,
    };
  }

  set p2 (new_p2) {
    this.__props.p2 = new_p2;
  }

  get p2 () {
    return {
      x: this.__props.p2.x + this.shift.x,
      y: this.__props.p2.y + this.shift.y,
    };
  }
}

module.exports = Segment;


/***/ }),

/***/ 521:
/***/ ((module) => {

const StringHelpers = {
  hypenToCamelCase: (string) => {
    return string.replace(/-([a-z])/gi, (s, group1) => {
      return group1.toUpperCase();
    });
  },
}

module.exports = StringHelpers;


/***/ }),

/***/ 108:
/***/ ((module) => {

const UUIDHelpers = {
  uuid: function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },
}

module.exports = UUIDHelpers;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const GOM = __webpack_require__(39);
const GIM = __webpack_require__(443);

const Menu = __webpack_require__(617);

const GI = __webpack_require__(79);
const CONFIG = __webpack_require__(78);

const World = __webpack_require__(505);

const APP = {};
window.APP = APP;

class Game {
	constructor () {
		this.world = null;

		this.initialize();
		this.start();
	}

  initialize () {
		GOM.shutdownAll();
		GOM.clearAllContexts();
		GIM.register(GI);
	}

  start () {
		this.world = new World();
	}
}

window.onload = () => {
  // APP is only used for debugging purposes
  // Nothing in the game utilizes it
  APP.Game = new Game();
	APP.GOM = GOM;
  APP.GIM = GIM;
}

window.onresize = () => {
	GOM.resize();
}

})();

/******/ })()
;