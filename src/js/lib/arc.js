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
