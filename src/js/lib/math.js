const PI = Math.PI;
const TWO_PI = PI * 2;
const HALF_PI = PI / 2;

const Arc = require('lib/arc');
const Segment = require('segment');

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
    if (pointMatch(s1.p1, s2.p1, 0.5) && pointMatch(s1.p2, s2.p2, 0.5)) return true;
    // opposites match (p1 = p2, p2 = p1)
    if (pointMatch(s1.p1, s2.p2, 0.5) && pointMatch(s1.p2, s2.p1, 0.5)) return true;
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
