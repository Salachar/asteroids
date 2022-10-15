const {
  getIntersection,
  getPointDistance,
} = require('lib/math');

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

    // // check if there is an intersection
    // if (ray_to_segment) {
    //   // if (info.t1 >= 0 && info.t2 >= 0 && info.t2 <= 1) {
    //   if (lambda <= 0 || !(0 <= gamma && gamma <= 1)) return null;
    // } else { // segment to segment
    //   if (!(0 <= lambda && lambda <= 1) || !(0 <= gamma && gamma <= 1)) return null;
    // }

    const boundCheck = (value) => {
      if (-0.01 <= value && value <= 1.01) return true;
      return false;
    };

    // check if there is an intersection
    if (ray_to_segment) {
      // if (info.t1 >= 0 && info.t2 >= 0 && info.t2 <= 1) {
      if (lambda <= 0 || !boundCheck(gamma)) return null;
    } else { // segment to segment
      if (!boundCheck(lambda) || !boundCheck(gamma)) return null;
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
