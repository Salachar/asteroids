const GOM = require('../core/game-object-manager');
const GIM = require('../core/game-input-manager');
const CONFIG = require('./game-config');

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
