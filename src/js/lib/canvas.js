const { HALF_PI } = require('./math');

const CanvasHelpers = {
  // unused as there is no canvas rotation used, its
  // all literal rotation
  rotate: (obj) => {
    obj.context.translate(obj.x + obj.half_width, obj.y + obj.half_height);
    // obj.context.translate(obj.x, obj.y);
    obj.context.rotate(obj.theta);
  }
}

module.exports = CanvasHelpers;

// const {
//     rgba,
//     copyPoint
// } = require('./helpers');


// const Canvas = {
//     pixelData: function (context) {
//         const size_info = Canvas.size(context);
//         const pixel_data = context.getImageData(0, 0, size_info.width, size_info.height);

//         let pixels = pixel_data.data || [];
//         const pixels_length = pixels.length;
//         let transformed_pixel_data = [[]];

//         let row_index = 0;
//         for (let i = 0; i < pixels_length; ++i) {
//             let new_data = {
//                 r: pixels[i + 0],
//                 g: pixels[i + 1],
//                 b: pixels[i + 2],
//                 a: pixels[i + 3],
//                 blank: false
//             }
//             if (!new_data.r && !new_data.g && !new_data.b && !new_data.a) {
//                 new_data.blank = true;
//             }
//             i += 3;
//             transformed_pixel_data[row_index].push(new_data);
//             if ((((i + 1) / (pixel_data.width * 4)) % 1) === 0) {
//                 transformed_pixel_data.push([]);
//                 row_index += 1;
//             }
//         }
//         return transformed_pixel_data;
//     },

//     size: function (context) {
//         return {
//             width: context.canvas.width || context.canvas.clientWidth || 0,
//             height: context.canvas.height || context.canvas.clientHeight || 0
//         };
//     },

//     clear: function (context, opts = {}) {
//         let {
//             start,
//             end
//         } = opts;

//         if (!start) {
//             start = {
//                 x: 0,
//                 y: 0
//             };
//         }

//         if (!end) {
//             const size = Canvas.size(context);
//             end = {
//                 x: size.width,
//                 y: size.height,
//             }
//         }

//         context.clearRect(start.x, start.y, end.x, end.y);
//         // Clearing of the canvas will most likely be followed by an operation
//         // of sorts, so return Canvas for chaining, maybe do this for the others
//         // as well
//         return Canvas;
//     },

//     line: function (context, opts = {}) {
//         const {
//             points,
//             alpha,
//             lineCap,
//             fill,
//             cutout
//         } = opts;

//         const start_point = fastCopy(points[0]);
//         if (!start_point) return;

//         let strokes = opts.strokes || [];
//         if (opts.width && opts.color) {
//             strokes.push({
//                 width: opts.width,
//                 color: opts.color
//             });
//         }

//         context.save();
//             // Options are butt(default) | round | square
//             context.lineCap = lineCap || 'butt';
//             context.globalAlpha = alpha || 1;
//             context.beginPath();
//             context.moveTo(points[0].x, points[0].y);
//             for (let i = 1; i < points.length; ++i) {
//                 // Invalid points returns a bad copy
//                 if (!fastCopy(points[i])) return;
//                 context.lineTo(points[i].x, points[i].y);
//             }
//             // Not passing strokes will just create the lines and leave it open
//             // to whatever called this function, if more outside operations are desired
//             if (strokes.length) {
//                 strokes.forEach((stroke) => {
//                     Canvas.stroke(context, {
//                         width: stroke.width,
//                         color: stroke.color
//                     });
//                 });
//             }
//             if (cutout) {
//                 // "destination-out" : Draw existing content inside new content. This basically
//                 // cuts out the drawn shape from the canvas. This will let us see through the sections
//                 // we cut out of the shadow and shroud layers
//                 context.fillStyle = rgba(0, 0, 0, 1);
//                 context.globalCompositeOperation = "destination-out";
//                 context.fill();
//             }
//             if (fill) {
//                 context.fillStyle = fill.style || rgba(0, 0, 0, 1);
//                 context.globalCompositeOperation = fill.composite || "source-over";
//                 context.fill();
//             }
//         context.restore();
//     },

//     stroke: function (context, opts = {}) {
//         const {
//             width,
//             color
//         } = opts;

//         context.strokeStyle = color;
//         context.lineWidth = width;
//         context.stroke();
//     },

//     rect: function (context, opts = {}) {
//         let {
//             start,
//             end,
//             color,
//             alpha,
//             point,
//             width,
//             height,
//             angle
//         } = opts;

//         // start and end give the top left and bottom right of the rect, but sometimes point and width
//         // are passed in, the point is the center and the width is the width of the square (this will
//         // only happen for squares), in which case we can determine top left and bottom right
//         // NOTE: "end" is width and height, not x and y
//         if (!start) {
//             start = {
//                 x: 0,
//                 y: 0
//             };
//             // if (point) {
//             //     start = {
//             //         x: point.x,
//             //         y: point.y
//             //     };
//             // }
//             if (point) {
//                 // Init the start point to the point passed in
//                 start.x = point.x;
//                 start.y = point.y;
//                 // If there is a width, offset so the point is in the center
//                 if (width) {
//                     start.x -= (width / 2);
//                     start.y -= (width / 2);
//                 }
//                 // If there is a height, change the y to be based off the height
//                 if (height) {
//                     start.y = point.y - (height / 2);
//                 }
//             }
//         }

//         if (!end) {
//             end = {
//                 x: context.canvas.width || context.canvas.clientWidth || 0,
//                 y: context.canvas.height || context.canvas.clientHeight || 0,
//             }
//             if (width) {
//                 end.x = width;
//                 end.y = width;
//             }
//             if (height) {
//                 end.y = height;
//             }
//         }

//         context.save();
//             if (typeof angle === 'number') {
//                 context.translate(point.x, point.y);
//                 context.rotate(angle);
//                 context.translate(-point.x, -point.y);
//             }
//             context.globalAlpha = alpha || 1;
//             context.beginPath();
//             context.rect(start.x, start.y, end.x, end.y);
//             context.fillStyle = color || '#000000';
//             context.fill();
//         context.restore();
//     },

//     arc: function (context, opts = {}) {

//     },

//     cone: function (context, opts = {}) {
//         const {
//             point,
//             length,
//             color,
//             alpha,
//             angle
//         } = opts;

//         const half_length = length / 2;

//         context.save();
//             if (typeof angle === 'number') {
//                 context.translate(point.x, point.y);
//                 context.rotate(angle);
//                 context.translate(-point.x, -point.y);
//             }
//             context.globalAlpha = alpha || 1;
//             context.beginPath();

//             // The origin point of the cone, now we need the two edge points
//             let point_1 = copyPoint(point);
//             // point 2 will be the top point
//             let point_2 = copyPoint(point_1);
//             point_2.x += length;
//             point_2.y -= half_length
//             // point 3 will be the bottom point
//             let point_3 = copyPoint(point_1);
//             point_3.x += length;
//             point_3.y += half_length;

//             Canvas.line(context, {
//                 points: [
//                     point_1,
//                     point_2,
//                     point_3,
//                     point_1
//                 ],
//                 // color: color,
//                 fill: {
//                     style: color
//                 },
//                 width: 5,
//                 alpha: alpha
//             });
//         context.restore();
//     },

//     circle: function (context, opts = {}) {
//         const {
//             point,
//             radius,
//             color,
//             alpha
//         } = opts;

//         context.save();
//             context.globalAlpha = alpha || 1;
//             context.beginPath();
//             context.arc(
//                 point.x,
//                 point.y,
//                 radius,
//                 0,          // start at angle 0
//                 Math.PI * 2 // go to angle 2PI, making a complete circle
//             );
//             context.fillStyle = color;
//             context.fill();
//             context.strokeStyle = color;
//             context.stroke();
//         context.restore();
//     }
// };

// module.exports = Canvas;
