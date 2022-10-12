const { getRandomInt } = require('lib/random');

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
