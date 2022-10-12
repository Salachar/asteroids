const GOM = require('core/game-object-manager');
const GIM = require('core/game-input-manager');
const GOB = require('core/game-object-base');
const CFG = require('../game-config');

const Segment = require('segment');

const Player = require('game/objects/player');
const Asteroid = require('game/objects/asteroid');

const Nebula = require('game/objects/background/nebula');
const Planet = require('game/objects/background/planet');
const Sun = require('game/objects/background/sun');
const Void = require('game/objects/background/void');

const {
  getRandom,
  getRandomInt,
  getPercentileRoll,
} = require('lib/random');

class World extends GOB {
    constructor (opts = {}) {
      super(opts);

      this.render = false;
      this.cross_boundary = false;

      this.width = GOM.canvas_container_width;
		  this.height = GOM.canvas_container_height;

      this.background_objects = [];
      this.current_theme = CFG.theme;

      this.player = null;

      this.generateWorld();

      return this;
    }

    handlePlayerDeath () {
      window.setTimeout(() => {
        this.player.shutdown();
        this.spawnPlayer({
          invincible_time: 3000,
        });
      }, 3000);
    }

    getBounds () {
      return [
        new Segment({
          id: 'top',
          p1: { x: 0, y: 0 },
          p2: { x: this.width, y: 0 },
        }),
        new Segment({
          id: 'right',
          p1: { x: this.width, y: 0 },
          p2: { x: this.width, y: this.height },
        }),
        new Segment({
          id: 'bottom',
          p1: { x: this.width, y: this.height },
          p2: { x: 0, y: this.height },
        }),
        new Segment({
          id: 'left',
          p1: { x: 0, y: this.height },
          p2: { x: 0, y: 0 },
        }),
      ];
    }

    generateWorld () {
      this.generateBackground();
      this.spawnPlayer();
      this.spawnAsteroids();
    }

    generateBackground () {
      let amount = 0;

      // Nebulas
      amount = 1;
      if (getPercentileRoll(50)) amount += 1;
      if (getPercentileRoll(10)) amount += 1;
      for (let i = 0; i < amount; ++i) {
        this.background_objects.push(
          new Nebula({ world: this })
        );
      }

      // Planets
      amount = 1;
      if (getPercentileRoll(20)) amount += 1;
      for (let i = 0; i < amount; ++i) {
        this.background_objects.push(
          new Planet({ world: this })
        );
      }

      this.background_objects.push(
        new Sun({ world: this })
      );
      this.background_objects.push(
        new Void({ world: this })
      );
    }

    spawnPlayer (params = {}) {
      // We want the player to spawn in the middle of the screen
      this.player = new Player({
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
      const asteroidCount = 2;
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
          spawn: {
            x: x,
            y: y,
          },
          radius: getRandomInt(60, 90),
          velocity: {
            x: 0,
            y: 0,
          },
          // velocity: {
          //   x: getRandom(-1, 1),
          //   y: getRandom(-1, 1),
          // },
        })
      }
    }

    hideBackgroundObjects () {
      this.background_objects.forEach((bkg_obj) => {
        bkg_obj.hide();
      });
    }

    showBackgroundObjects () {
      this.background_objects.forEach((bkg_obj) => {
        bkg_obj.show();
      });
    }

    update () {
      if (this.current_theme === CFG.theme) return;
      this.current_theme = CFG.theme;
      switch (CFG.theme) {
        case 'classic':
          this.hideBackgroundObjects();
          break;
        default: // "neon"
          this.showBackgroundObjects();
          break;
      }
    }
}

module.exports = World;
