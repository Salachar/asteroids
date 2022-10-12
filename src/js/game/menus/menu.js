const GOM = require('../../core/game-object-manager');
const CFG = require('../game-config');

class Menu {
  constructor () {
    this.setEvents();
  }

  setEvents () {
    document.getElementById('config_ship_sanlo').addEventListener('change', (e) => {
      CFG.ship = e.currentTarget.value;
    });

    document.getElementById('config_ship_futurama').addEventListener('change', (e) => {
      CFG.ship = e.currentTarget.value;
    });

    document.getElementById('config_ship_classic').addEventListener('change', (e) => {
      CFG.ship = e.currentTarget.value;
    });

    document.getElementById('draw_bounding_circle').addEventListener('change', (e) => {
      CFG.draw_bounding_circle = e.currentTarget.checked;
    });

    document.getElementById('draw_center_point').addEventListener('change', (e) => {
      CFG.draw_center_point = e.currentTarget.checked;
    });
  }
}

module.exports = new Menu();
