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
