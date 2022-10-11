const GOM = require('./game-object-manager');

const { getMouseCoords } = require('lib/mouse');

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
