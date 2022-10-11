/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 971:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "src/sounds/thrusters.mp3";

/***/ }),

/***/ 443:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);

const Helpers = __webpack_require__(386);
const getMouseCoords = Helpers.getMouseCoords;

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

const {
  checkBoxCollision,
  checkProjectileBoxCollision
} = __webpack_require__(90);

const Segment = __webpack_require__(824);
const Helpers = __webpack_require__(386);
const uuid = Helpers.uuid;
const { neonStroke, redStroke } = __webpack_require__(172);
const { PI, HALF_PI,
  clampRadians,
  rotateSegment,
  getMagnitude,
  getPointDistance,
} = __webpack_require__(488);

class GOB {
	constructor (opts = {}) {
    this.opts = opts;
    this.world = opts.world || null;
    // Generate a unique UUID for the object
		this.id = uuid();

    // Set the spawn/origin
		const spawn = opts.spawn || {};
		this.x = opts.x || spawn.x || 0;
		this.y = opts.y || spawn.y || 0;

		this.collidable = false;

    this.in_viewport = true;
		this.configured = true;

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
		this.layer = opts.layer || null;
		this.context = (this.layer) ? this.layer.backBufferContext : null;

    this.straddling = false;

    this.segments = {};
    this.segmentsList = [];

    this.velocity = {
      x: 0,
      y: 0,
    };

    this.rotationSpeed = 0;
    this.rotation = 0;
		this.theta = 0;

		GOM.addGameObject(this);
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
    if (typeof points[0].x !== 'number') {
      config = points.shift();
      bodySegments.push(config);
    }

    for (let i = 0; i < points.length - 1; ++i) {
      bodySegments.push(new Segment({
        p1: points[i],
        p2: points[i + 1],
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

  getBoxCollisionSegments () {
    const { top, right, bottom, left } = this.getBounds();
    const segments = [
      { // TOP
        p1: { x: left, y: top },
        p2: { x: right, y: top },
      },
      { // RIGHT
        p1: { x: right, y: top },
        p2: { x: right, y: bottom },
      },
      { // BOTTOM
        p1: { x: left, y: bottom },
        p2: { x: right, y: bottom },
      },
      { // LEFT
        p1: { x: left, y: top },
        p2: { x: left, y: bottom },
      },
    ];
    return segments;
  }

  checkCollision (other_obj) {
    return false;

    // 	if (!other_obj || !this.collidable || !this.configured) return false;
    // 	if (this.collision_type === 'box') {
    // 		if (other_obj.type === 'player') {
    // 			return checkBoxCollision(obj, this);
    // 		}
    // 		if (other_obj.type === 'projectile' && this.projectile_collision) {
    // 			return checkProjectileBoxCollision(obj, this);
    // 		}
    // 	}
    // 	return false;



    // All collision follows the same pattern

    // Radial check
    // Even though everything is made of segments, there is still a center to
    // every object and we can do quick radial distance checks

    // Box check
    // The "box" the encapsulates each object will be

    // Small fast objects make this weird, I want them to collide, but two


    // What if an update takes two objects past the radial/box check because
    // they are moving
	}

  // checkWorldBounds () {
  //   const worldBounds = this.world.getBounds();
  //   const { list = [] } = worldBounds;
  //   const closest = {
  //     distance: null,
  //     segment: null,
  //   };
  //   list.forEach((worldSegment) => {
  //     const distanceInfo = getPointDistance(this.center, worldSegment);
  //     const { distance } = distanceInfo;
  //     if (typeof distance === 'number' && distance <= this.radius) {
  //       // Collision with wall, check current info
  //       if (typeof closest.distance !== 'number' || distance < closest.distance) {
  //         closest.distance = distance;
  //         closest.segment = worldSegment;
  //       }
  //     }
  //   });
  //   this.straddling = closest.segment;
  // }

  checkWorldBounds () {
    const worldBounds = this.world.getBounds();
    const { list = [] } = worldBounds;

    let straddleList = '';
    list.forEach((worldSegment) => {
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
		this.remove = true;
	}

  drawCenterPoint () {
    this.context.save();
      this.context.beginPath();
      this.context.rect((this.x + this.half_width) - 1, (this.y + this.half_height) - 1, 2, 2);
      this.context.fillStyle = '#FFFFFF';
      this.context.fill();
    this.context.restore();
  }

  drawBoundingCircle () {
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
    this.update();
    if (this.center.x < 0) {
      this.center = {
        x: this.world.width,
        y: this.center.y,
      };
    }
    if (this.center.x > this.world.width) {
      this.center = {
        x: 0,
        y: this.center.y,
      };
    }
    if (this.center.y < 0) {
      this.center = {
        x: this.center.x,
        y: this.world.height,
      };
    }
    if (this.center.y > this.world.height) {
      this.center = {
        x: this.center.x,
        y: 0,
      };
    }
    this.checkWorldBounds();
  }

  drawCrossBoundary () {
    const t = this.straddling.match(/top/);
    const r = this.straddling.match(/right/);
    const b = this.straddling.match(/bottom/);
    const l = this.straddling.match(/left/);

    if (t) {
      this.draw({
        shift: { x: 0, y: this.world.height },
      });
    }
    if (r) {
      this.draw({
        shift: { x: -this.world.width, y: 0 },
      });
    }
    if (b) {
      this.draw({
        shift: { x: 0, y: -this.world.height },
      });
    }
    if (l) {
      this.draw({
        shift: { x: this.world.width, y: 0 },
      });
    }
    if (t && r) {
      this.draw({
        shift: { x: -this.world.width, y: this.world.height },
      });
    }
    if (r && b) {
      this.draw({
        shift: { x: -this.world.width, y: -this.world.height },
      });
    }
    if (b && l) {
      this.draw({
        shift: { x: this.world.width, y: -this.world.height },
      });
    }
    if (l && t) {
      this.draw({
        shift: { x: this.world.width, y: this.world.height },
      });
    }
  }

  getSegments (opts = {}) {
    const { shift = {} } = opts;

    const multipleLists = Array.isArray(this.segmentsList[0]);
    return {
      multipleLists,
      segments: this.segmentsList.map((segmentListMaybe) => {
        if (multipleLists) {
          return segmentListMaybe.map((definitelySegment) => {
            if (!(definitelySegment instanceof Segment)) {
              return definitelySegment;
            }
            return rotateSegment({
              shift,
              origin: this.getCenter(shift),
              theta: this.theta,
              segment: definitelySegment,
              baseObj: this,
            });
          });
        }

        if (!(segmentListMaybe instanceof Segment)) {
          return segmentListMaybe;
        }
        return rotateSegment({
          shift,
          origin: this.getCenter(shift),
          theta: this.theta,
          segment: segmentListMaybe,
          baseObj: this,
        });
      }),
    };
  }

  // Gets overriden by extended objects
  draw (opts = {}) {
    const c = this.context;
    const { shift = {} } = opts;
    const {
      multipleLists = false,
      segments = [],
    } = this.getSegments({ shift });

    if (!multipleLists) {
      this.drawSegmentList(c, segments);
    } else {
      segments.forEach((subSegments) => {
        this.drawSegmentList(c, subSegments);
      });
    }
  }

  drawSegmentList (c, segments = []) {
    let config = {};
    if (!(segments[0] instanceof Segment)) {
      config = segments.shift();
    }
    c.save();
      c.beginPath();
        c.moveTo(segments[0].p1.x, segments[0].p1.y);
        segments.forEach((segment) => {
          c.lineTo(segment.p2.x, segment.p2.y);
        });
      c.closePath();
      neonStroke(c, config.fill);
    c.restore();
  }

  // Called by the game loop
	drawObj () {
    this.draw();
    this.drawCrossBoundary();
    // this.drawBoundingCircle();
    // this.drawCenterPoint();
  }
}

module.exports = GOB;


/***/ }),

/***/ 39:
/***/ ((module) => {

class GOM {
	constructor () {
		// 120 = 8
		// 60 = 16
		// 30 = 32
		this.MILLISECONDS_BETWEEN_FRAMES = 100; // (1 / 60) * 1000
		this.FPS_INTERVAL = 1000 / 60;

		this.GAME_LOOP = 0;
		this.last_frame = new Date().getTime();

		this.__props = {};

		this.__props.game_objects = [];
		this.__props.collidable_objects = [];
		this.__props.added_game_objects = [];

    this.viewport = null;
		this.viewport_buffer = 100; // cell size * 2

		this.world_size = {
			width: 0,
			height: 0,
		};

    this.then = Date.now();

		this.el_fps_counter = document.getElementById('fps_counter');
		this.el_num_objects_counter = document.getElementById('num_objects_counter');

    this.fps_counter = document.getElementById('fps_counter');
		this.canvas_container = document.getElementById('canvas_container');

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

      // gameObj.in_viewport = this.isInViewport(gameObj);

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

  // isInViewport (obj) {
	// 	if (!obj || !this.viewport) return true;
	// 	if (obj.x > this.viewport.right ||
	// 		obj.x < this.viewport.left ||
	// 		obj.y < this.viewport.top ||
	// 		obj.y > this.viewport.bottom) {
	// 		return false;
	// 	}
	// 	return true;
	// }

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
		const container = document.getElementById('canvas_container');
		let canvasWidth = container.clientWidth;
		let canvasHeight = container.clientHeight;

    this.canvas_container_width = this.canvas_container.clientWidth;
		this.canvas_container_height = this.canvas_container.clientHeight;
		this.half_canvas_container_width = this.canvas_container_width / 2;
		this.half_canvas_container_height = this.canvas_container_height / 2;

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
		// this.startLoop();
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
		// window.requestAnimationFrame(() => {
		// 	this.gameLoop();
		// });
		// this.draw();

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

	startLoop () {
		// setInterval will call the function for our game loop
		this.GAME_LOOP = setInterval(() => {
			this.draw();
		}, this.MILLISECONDS_BETWEEN_FRAMES);
	}

	pauseLoop () {
		clearInterval(this.GAME_LOOP);
		this.GAME_LOOP = null;
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
        this.__props = {
            place_projectile: true,
            place_well: false,
            place_planet: false,
            confine_projectiles: false,
        };
    }

    set show_fps (new_val) {
        this.__props.show_fps = new_val;
    }

    get show_fps () {
        return this.__props.show_fps;
    }

    set place_projectile (new_val) {
        this.__props.place_projectile = new_val;
    }

    get place_projectile () {
        return this.__props.place_projectile;
    }

    set place_well (new_val) {
        this.__props.place_well = new_val;
    }

    get place_well () {
        return this.__props.place_well;
    }

    set place_planet (new_val) {
        this.__props.place_planet = new_val;
    }

    get place_planet () {
        return this.__props.place_planet;
    }

    set confine_projectiles (new_val) {
        this.__props.confine_projectiles = new_val;
    }

    get confine_projectiles () {
        return this.__props.confine_projectiles;
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
const CONFIG = __webpack_require__(78);

class Menu {
    constructor () {
        this.setEvents();
    }

    setEvents () {
        document.getElementById('projectile-object').addEventListener('change', (event) => {
            CONFIG.place_projectile = true;
            CONFIG.place_well = false;
            CONFIG.place_planet = false;
        });
        document.getElementById('well-object').addEventListener('change', (event) => {
            CONFIG.place_projectile = false;
            CONFIG.place_well = true;
            CONFIG.place_planet = false;
        });
        document.getElementById('planet-object').addEventListener('change', (event) => {
            CONFIG.place_projectile = false;
            CONFIG.place_well = false;
            CONFIG.place_planet = true;
        });

        document.getElementById('confine_projectiles').addEventListener('change', (event) => {
            CONFIG.confine_projectiles = event.currentTarget.checked;
        });

        document.getElementById('reset-button').addEventListener('click', () => {
            GOM.shutdownAll();
        });
    }
}

module.exports = new Menu();


/***/ }),

/***/ 712:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);

const { getRandomInt } = __webpack_require__(386);
const { PI, clampRadians } = __webpack_require__(488);

class Asteroid extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "asteroid";

    this.velocity = opts.velocity;

    this.width = 150;
    this.height = 150;

    this.third = this.width / 3;

    this.rotationSpeed = PI / 500;
    this.rotation = 0;
		this.theta = 0;

    this.generateSegments();
	}

  generateSegments () {
    const third = this.third;
    this.segmentsList = this.createSegments([
      { // Configuration
        fill: true,
        close: true,
      },
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

	update () {
		this.theta += this.rotationSpeed;
    this.theta = clampRadians(this.theta);
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
}

module.exports = Asteroid;


/***/ }),

/***/ 935:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GIM = __webpack_require__(443);
const GOB = __webpack_require__(406);

const Projectile = __webpack_require__(700);
const { PI, HALF_PI, clampRadians } = __webpack_require__(488);

class Player extends GOB {
	constructor (opts = {}) {
		super(opts);

    this.type = "player";
    this.collidable = true;

    // Ship is 2x3
    // this.q = 64;
    this.q = 12;
    this.width = this.q * 4;
    this.height = this.q * 6;

    this.rotationSpeed = PI / 48;
    this.rotation = 0;
		this.theta = Math.PI / 2;

    this.max_speed = 4;
    this.thrust = {
      active: false,
      power: 0.075,
    };

    this.generateSegments();

    this.thrustAudio = new Audio();
    this.thrustAudio.src = __webpack_require__(971);

    return this;
  }

  getUnitVector () {
    const unitVector = {
      x: Math.cos(this.theta - HALF_PI),
      y: Math.sin(this.theta - HALF_PI),
    };
    return unitVector;
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
    this.theta += this.rotation;
    this.theta = clampRadians(this.theta);

    if (this.thrust.active) {
      this.thrustAudio.play();

      const unitVector = this.getUnitVector();
      this.velocity.x += (unitVector.x * this.thrust.power);
      this.velocity.y += (unitVector.y * this.thrust.power);
      // Need to do legit clamping
      // if (this.velocity.x > this.max_speed) this.velocity.x = this.max_speed;
      // if (this.velocity.y > this.max_speed) this.velocity.y = this.max_speed;
    } else {
      this.thrustAudio.pause();
    }

    this.x = this.x + this.velocity.x;
		this.y = this.y + this.velocity.y;
  }

  keyDown (key) {
    this.checkPlayerMovement();
    if (GIM.isKeyDown('SPACE')) {
      this.fireWeapon();
    }
  }

  keyUp (key) {
    this.checkPlayerMovement();
  }

  fireWeapon () {
    const unitVector = this.getUnitVector();

    new Projectile({
      world: this.world,
      layer: GOM.front,
      spawn: {
        x: this.x + this.half_width,
        y: this.y + this.half_height,
      },
      baseVelocity: this.velocity,
      aim: unitVector,
    });
  }

  generateSegments () {
    const q = this.q;
    const qq = q * 2;
    const qqq = q * 3;
    this.segmentsList = [
      // RIGHT WING
      this.createSegments([
        { fill: true },
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
      this.createSegments([
        { fill: true },
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
      this.createSegments([
        { fill: true, close: true },
        { x: q * 0.5, y: q * 1.8 }, // TOP RIGHT
        { x: q * 0.4, y: qq + (q * 0.1)  }, // BOTTOM RIGHT
        { x: -q * 0.4, y: qq + (q * 0.1)  }, // BOTTOM LEFt
        { x: -q * 0.5, y: q * 1.8 }, // TOP LEFT
      ]),
      // SHIP BODY
      this.createSegments([
        { fill: true, close: true },
        { x: 0, y: -qqq }, // TIP
        { x: q * 0.7, y: -qq },
        { x: q, y: -q }, // BODY_TOP_RIGHT
        { x: q, y: 0 }, // BODY_BOTTOM_RIGHT
        { x: q * 0.5, y: q * 1.5 }, // END_RIGHT
        { x: -q * 0.5, y: q * 1.5 }, // END_LEFT
        { x: -q, y: 0 },  // BODY_BOTTOM_LEFT
        { x: -q, y: -q }, // BODY_TOP_LEFT
        { x: -q * 0.7, y: -qq },
      ]),
      // STRIPE (the lower down one)
      this.createSegments([
        { x: -q * 0.8, y: -q * 1.6 },
        { x: q * 0.8, y: -q * 1.6 },
      ]),
      // STRIPE (the higher up one)
      this.createSegments([
        { x: -q * 0.65, y: -qq },
        { x: q * 0.65, y: -qq },
      ]),
    ];
  }

  // generateSegments () {
  //   this.segmentsList = this.createSegments([
  //     { // TIP
  //       x: 0,
  //       y: -this.half_height,
  //     }, { // RIGHTWING
  //       x: this.half_width,
  //       y: this.half_height,
  //     }, { // THRUSTER
  //       x: 0,
  //       y: this.half_height * 0.66,
  //     }, { // LEFTWING
  //       x: -this.half_width,
  //       y: this.half_height,
  //     }
  //   ], true);
  // }
}

module.exports = Player;


/***/ }),

/***/ 700:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GOB = __webpack_require__(406);
const CONFIG = __webpack_require__(78);

const Segment = __webpack_require__(824);

class Projectile extends GOB {
	constructor (opts = {}) {
		super(opts);

		this.type = "projectile";

    this.speed = 18;
    this.velocity = {
      x: opts.baseVelocity.x + (this.speed * opts.aim.x),
      y: opts.baseVelocity.y + (this.speed * opts.aim.y),
    };

		this.z = 1000000;

    this.length = 30;
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

    const trueX = tip.x < this.x ? tip.x : this.x;
    const trueY = tip.y < this.y ? tip.y : this.y;
    this.x = trueX;
    this.y = trueY;

    this.generateSegments();

    window.setTimeout(() => {
      this.shutdown();
    }, 600)

		return this;
	}

  generateSegments () {
    this.segmentsList = this.createSegments([
      { // START
        x: this.og.x - this.center.x,
        y: this.og.y - this.center.y,
      }, { // END
        x: this.tip.x - this.center.x,
        y: this.tip.y - this.center.y,
      }
    ]);
  }

	update () {
		this.x += this.velocity.x;
		this.y += this.velocity.y;
	}
}

module.exports = Projectile;


/***/ }),

/***/ 777:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const GOM = __webpack_require__(39);
const GIM = __webpack_require__(443);
const GOB = __webpack_require__(406);

const Segment = __webpack_require__(824);

const Player = __webpack_require__(935);
const Asteroid = __webpack_require__(712);

const { getRandom, getRandomInt } = __webpack_require__(386);

class World {
    constructor () {
      this.container = document.getElementById('canvas_container');
      this.width = this.container.clientWidth;
		  this.height = this.container.clientHeight;

      this.generateWorld();
    }

    getBounds () {
      const top = new Segment({
        id: 'top',
        p1: {
          x: 0,
          y: 0,
        },
        p2: {
          x: this.width,
          y: 0,
        }
      });

      const right = new Segment({
        id: 'right',
        p1: {
          x: this.width,
          y: 0,
        },
        p2: {
          x: this.width,
          y: this.height,
        }
      });

      const bottom = new Segment({
        id: 'bottom',
        p1: {
          x: this.width,
          y: this.height,
        },
        p2: {
          x: 0,
          y: this.height,
        }
      });

      const left = new Segment({
        id: 'left',
        p1: {
          x: 0,
          y: this.height,
        },
        p2: {
          x: 0,
          y: 0,
        }
      });

      return {
        top,
        right,
        bottom,
        left,
        list: [top, right, bottom, left],
      };
    }

    generateWorld () {
      this.spawnPlayer();
      this.spawnAsteroids();
    }

    spawnPlayer (params = {}) {
      // We want the player to spawn in the middle of the screen
      new Player({
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
      const asteroidCount = 4;
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

        new Asteroid({
          ...params,
          world: this,
          layer: GOM.front,
          z: 10,
          spawn: {
            x: x,
            y: y,
          },
          velocity: {
            x: getRandom(-1, 1),
            y: getRandom(-1, 1),
          },
        })
      }
    }
}

module.exports = World;


/***/ }),

/***/ 90:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const { getIntersection } = __webpack_require__(488);

function checkBoxCollision (obj1, obj2) {
    // TODO: change to flag concerning checks outside
    // of viewport. Maybe I want to shoot an off screen enemy
    if (!obj1.in_viewport || !obj2.in_viewport) return;

    // obj1 is the moving object, if its velocity is 0
    // we don't need to check anything
    if (obj1.velocity.y === 0 && obj1.velocity.x === 0) return;

    // TODO: 100px is a gross apromixation of distance where things are guaranteed
    // to not collide at the moment, but it should be less magic
    if (Math.abs(obj1.x - obj2.x) > 100 || Math.abs(obj1.y - obj2.y) > 100) return;

    let obj1_current_bounds = {
      left: obj1.x - obj1.half_width,
      right: obj1.x + obj1.half_width,
      top: obj1.y - obj1.half_height,
      bottom: obj1.y + obj1.half_height,
    }

    let obj1_next_bounds = {
      left: obj1.x + obj1.velocity.x - obj1.half_width,
      right: obj1.x + obj1.velocity.x + obj1.half_width,
      top: obj1.y + obj1.velocity.y - obj1.half_height,
      bottom: obj1.y + obj1.velocity.y + obj1.half_height,
    };

    let obj2_current_bounds = obj2.getBounds();

    // This will tell us how much to offset the moving objects step
    // so that's it not put into the object, but put right next to it
    let modified_vel = {
      x: 0,
      y: 0,
    };

    // Moving Right
    if (obj1.velocity.x > 0 && (obj1_current_bounds.right <= obj2_current_bounds.left && obj1_next_bounds.right > obj2_current_bounds.left)) {
        if (verticalCollision()) {
            modified_vel.x = -Math.abs(obj1_next_bounds.right - obj2_current_bounds.left);
        }
    }

    // Moving Left
    if (obj1.velocity.x < 0 && (obj1_current_bounds.left >= obj2_current_bounds.right && obj1_next_bounds.left < obj2_current_bounds.right)) {
        if (verticalCollision()) {
            modified_vel.x = Math.abs(obj1_next_bounds.left - obj2_current_bounds.right);
        }
    }

    // Moving  Down
    if (obj1.velocity.y > 0 && (obj1_current_bounds.bottom <= obj2_current_bounds.top && obj1_next_bounds.bottom > obj2_current_bounds.top)) {
        if (horizontalCollision()) {
            modified_vel.y = -Math.abs(obj1_next_bounds.bottom - obj2_current_bounds.top);
        }
    }

    // Moving Up
    if (obj1.velocity.y < 0 && (obj1_current_bounds.top >= obj2_current_bounds.bottom && obj1_next_bounds.top < obj2_current_bounds.bottom)) {
        if (horizontalCollision()) {
            modified_vel.y = Math.abs(obj1_next_bounds.top - obj2_current_bounds.bottom);
        }
    }

    function horizontalCollision () {
        if (obj1_next_bounds.left > obj2_current_bounds.left && obj1_next_bounds.left < obj2_current_bounds.right ||
            obj1_next_bounds.right > obj2_current_bounds.left && obj1_next_bounds.right < obj2_current_bounds.right) {
            return true;
        }
        return false;
    }

    function verticalCollision () {
        if (obj1_next_bounds.top > obj2_current_bounds.top && obj1_next_bounds.top < obj2_current_bounds.bottom ||
            obj1_next_bounds.bottom > obj2_current_bounds.top && obj1_next_bounds.bottom < obj2_current_bounds.bottom) {
            return true;
        }
        return false;
    }

    if (!modified_vel.x && !modified_vel.y) return null;
    return modified_vel;
}

function checkProjectileBoxCollision (projectile, obj) {
    obj.collision_points = [];
    const segments = obj.getBoxCollisionSegments();
    for (let i = 0; i < segments.length; ++i) {
        const seg = segments[i];
        const projectile_vector = {
            px : projectile.x,
            py : projectile.y,
            dx : projectile.aim_point.x - projectile.x,
            dy : projectile.aim_point.y - projectile.y,
        };
        const wall_segment = {
            px : seg.p1.x,
            py : seg.p1.y,
            dx : seg.p2.x - seg.p1.x,
            dy : seg.p2.y - seg.p1.y,
        };
        const info = getIntersection(projectile_vector, wall_segment);
        if (info && info.t1 >= 0 && info.t2 >= 0 && info.t2 <= 1) {
            obj.collision_points.push(info);
        }
    }
    // everything is currently on front
    // obj.layer.update = true;
    return (obj.collision_points.length) ? obj.collision_points : null;
}

module.exports = {
    checkBoxCollision,
    checkProjectileBoxCollision,
};


/***/ }),

/***/ 172:
/***/ ((module) => {

const Draw = {
  whiteStroke: (context) => {
    context.lineCap = 'round';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 1;
    context.stroke();
  },

  redStroke: (context) => {
    context.lineCap = 'round';
    context.strokeStyle = '#ff0000';
    context.lineWidth = 1;
    context.stroke();
  },

  neonStroke: (context, fill = false) => {
    if (fill) {
      context.save();
        context.globalAlpha = 0.75;
        context.fillStyle = '#221f26';
        context.fill();
      context.restore();
    }

    context.lineCap = 'round';
    context.shadowBlur = 20;
    // context.shadowColor = '#ff5c79';
    // context.strokeStyle = '#ff5c79';
    // context.shadowColor = '#d197f4';
    // context.strokeStyle = '#d197f4';
    context.shadowColor = '#d548a8';
    context.strokeStyle = '#d548a8';
    context.lineWidth = 4;
    context.stroke();

    context.lineCap = 'round';
    context.shadowBlur = 10;
    context.shadowColor = '#f7c3cd';
    context.strokeStyle = '#f7c3cd';
    context.lineWidth = 2;
    context.stroke();
  }
};

module.exports = Draw;


/***/ }),

/***/ 386:
/***/ ((module) => {

const Helpers = {
	uuid: function () {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},

  pointMatch: function (p1, p2, tolerance) {
    tolerance = tolerance || 0;
    return (Math.abs(p1.x - p2.x) <= tolerance && Math.abs(p1.y - p2.y) <= tolerance);
  },

	rgba: function (r,g,b,a) {
		var a = (a) ? a : 1;
		return "rgba(" + r + "," + g + "," + b + "," + a + ")"
	},

	sqr: function (value) {
		return value * value;
	},

	getDistance: function (p1, p2, no_sqrt) {
		let dist = Helpers.sqr(p1.x - p2.x) + Helpers.sqr(p1.y - p2.y);
		if (no_sqrt) return dist;
		return Math.sqrt(dist);
	},

	getRandom: function (min, max){
		return Math.random() * (max - min) + min;
	},

	getRandomInt: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	returnRandom: function (numbers) {
		var length = numbers.length;
		var index = getRandomInt(0, length-1);
		return numbers[index];
	},

	percentage: function (percent) {
		return (getRandomInt(1,100) >= percent);
	},

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

    createElement: function (type, classes, opts) {
        opts = opts || {};
        let node = document.createElement(type);
        let classes_split = classes.split(' ');
        for (let i = 0; i < classes_split.length; ++i) {
            node.classList.add(classes_split[i]);
        }
        if (opts.attributes) {
            for (let attr in opts.attributes) {
                if (opts.attributes[attr]) {
                    node.setAttribute(attr, opts.attributes[attr]);
                }
            }
        }
        if (opts.dataset) {
            for (let data in opts.dataset) {
                if (opts.dataset[data]) {
                    node.dataset[data] = opts.dataset[data];
                }
            }
        }
        if (opts.events) {
            for (let event in opts.events) {
                node.addEventListener(event, opts.events[event]);
            }
        }
        if (opts.html) {
            node.innerHTML = opts.html;
        }
        if (opts.addTo) {
            opts.addTo.appendChild(node);
        }
        return node;
    }
};
module.exports = Helpers;


/***/ }),

/***/ 488:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const PI = Math.PI;
const TWO_PI = PI * 2;
const HALF_PI = PI / 2;

const Helpers = __webpack_require__(386);
const Segment = __webpack_require__(824);

const MathHelpers = {
  PI,
  TWO_PI,
  HALF_PI,

  clampRadians: (angle) => {
    if (angle > TWO_PI) return 0;
    if (angle < 0) return TWO_PI;
    return angle;
  },

  getUnitVector: function (segment) {
    let vector = {
        x: segment.p2.x - segment.p1.x,
        y: segment.p2.y - segment.p1.y
    };
    let mag = Math.sqrt(Helpers.sqr(vector.x) + Helpers.sqr(vector.y));
    return {
        x: vector.x / mag,
        y: vector.y / mag
    };
  },

  getIntersection (r, s) {
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

  getPointDistance: (point, item) => {
    // Item can be either a point or a segment/line
    if (!point || !item) return;

    // Points will always be passed in with a base x and y value
    if (typeof item.x === 'number' && typeof item.y === 'number') {
      return {
        distance: Math.sqrt(Helpers.sqr(item.x - point.x) + Helpers.sqr(item.y - point.y)),
        x: item.x,
        y: item.y,
      }
    }

    // Segments will always have two points, p1 and p2
    // First check to see if the point is a match to p1 or p2
    let p1_match = Helpers.pointMatch(point, item.p1, 1);
    let p2_match = Helpers.pointMatch(point, item.p2, 1);
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
        distance: Math.sqrt(Helpers.sqr(item.x - point.x) + Helpers.sqr(item.y - point.y)),
        x: item.x,
        y: item.y,
      }
    }

    if (item.position) {
      return {
        distance: Math.sqrt(Helpers.sqr(item.position.x - point.x) + Helpers.sqr(item.position.y - point.y)),
        x: item.position.x,
        y: item.position.y,
      }
    }

    // Now we're looking at a segment with p1 and p2, check the endpoints first
    let p1_match = Helpers.pointMatch(point, item.p1, 1);
    let p2_match = Helpers.pointMatch(point, item.p2, 1);
    if (opts.line_only && (p1_match || p2_match)) {
      return {
        distance: null,
        x: null,
        y: null,
      };
    }

    return MathHelpers.distanceToLine(point, item);
  },

  distanceToLine: function (point, item) {
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
      distance: Math.sqrt(Helpers.sqr(dx) + Helpers.sqr(dy)),
      x: xx,
      y: yy
    }
  },

  getDotProduct: function (v1, v2) {
      return v1.x * v2.x + v1.y * v2.y;
  },

  getMagnitude: function (v) {
      return Math.sqrt(Helpers.sqr(v.x) + Helpers.sqr(v.y));
  },

  getAngleBetweenVectors: function (v1, v2) {
      const dot = MathHelpers.getDotProduct(v1, v2);
      const v1_mag = MathHelpers.getMagnitude(v1);
      const v2_mag = MathHelpers.getMagnitude(v2);
      const cos_angle = dot / (v1_mag * v2_mag);
      const angle = Math.acos(cos_angle);
      return angle;
  },

  getNormal: function (segment, reference_point) {
      reference_point = reference_point || Mouse;
      // the "open" normal will be on the side
      // of the reference point, the mouse in most cases
      if (!segment) return;
      if (segment.segment) segment = segment.segment;

      // Get a unit vector of that perpendicular
      let unit_vector = MathHelpers.getUnitVector(segment);

      let perp_unit_vector = {
          x: unit_vector.y,
          y: unit_vector.x * -1
      };

      // Get the middle of the origin segment
      let middle_point = Helpers.getSegmentMiddle(segment);

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

  getSlope: function (p1, p2) {
      return (p2.y - p1.y) / (p2.x - p1.x);
  },

  getPerpendicularUnitVector: function (segment) {
      let unit_vector = MathHelpers.getUnitVector(segment);
      let perp = {
          x: unit_vector.y,
          y: unit_vector.x * -1
      }
      return perp;
  },

  getSegmentMiddle: function (segment) {
      return {
          x: segment.p1.x + ((segment.p2.x - segment.p1.x) * 0.5),
          y: segment.p1.y + ((segment.p2.y - segment.p1.y) * 0.5)
      };
  },

  rotateSegment: ({ shift = {}, segment, origin, theta, baseObj }) => {
    const { p1, p2 } = segment;

    // This didn't work, hence direction not being used. I think it's
    // more for a math sense and not "player rotation" sense, since I believe
    // rendering and all calculations are counterclockwise in the end
    // const clockwiseRotation = (p) => {
    //   // x' =  x * cos(a) + y * sin(a)
    //   // y' = -x * sin(a) + y * cos(a)
    //   return {
    //     x:  (p.x * Math.cos(a)) + (p.y * Math.sin(a)),
    //     y: (-p.x * Math.sin(a)) + (p.y * Math.cos(a)),
    //   }
    // };

    const counterClockwiseRotation = (p) => {
      // if (theta === 0) return p

      // x' = x * cos(a) - y * sin(a)
      // y' = x * sin(a) + y * cos(a)
      const newX = origin.x + ((p.x * Math.cos(theta)) - (p.y * Math.sin(theta)));
      const newY = origin.y + ((p.x * Math.sin(theta)) + (p.y * Math.cos(theta)));

      return {
        x: newX,
        y: newY,
      }
    };

    if (baseObj.type === 'projectile') {
      // debugger;
    }

    const rotatedSegment = new Segment({
      shift,
      p1: counterClockwiseRotation(p1),
      p2: counterClockwiseRotation(p2),
    });

    if (baseObj.type === 'projectile') {
      // console.log(rotatedSegment);
    }

    return rotatedSegment
  },
};

module.exports = MathHelpers;


/***/ }),

/***/ 824:
/***/ ((module) => {

class Segment {
  constructor (data = {}) {
    this.data = data;

    this.id = data.id;

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

const World = __webpack_require__(777);

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