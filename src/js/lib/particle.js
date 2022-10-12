const GOM = require('core/game-object-manager');
const GOB = require('core/game-object-base');

const { TWO_PI } = require('lib/math');
const { getHEX } = require('lib/color');
const { neonStroke } = require('lib/draw');

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
