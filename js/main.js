/* ============================================================
   MAIN – bootstrap, event wiring
   ============================================================ */

import { Renderer }     from './renderer.js';
import { GameEngine }   from './game.js';
import { Collection }   from './collection.js';
import { Audio }        from './audio.js';
import { TIMES, WEATHER_TYPES } from './data.js';
import {
  Screens, buildSetupScreen, updateFishHints,
  renderCollection, renderStats, showFishModal, hideFishModal,
  showCatchScreen, showEscapeScreen,
  updateGameHUD, updateStatusText, setCastButton,
  updateMenuPills, buildBaitModal,
} from './ui.js';

// ---- Global state ----
const setup = {
  timeId:    'morning',
  weatherId: 'sunny',
  baitId:    'gusano',
  techId:    'flotador',
};

let menuRenderer = null;
let gameEngine   = null;

// ---- Loading sequence ----
async function boot() {
  Collection.init();

  const bar = document.getElementById('loading-bar');
  const msg = document.getElementById('loading-msg');

  const steps = [
    ['Preparando el pantano…',   20],
    ['Cargando especies…',       40],
    ['Pintando el amanecer…',    60],
    ['Ajustando el flotador…',  80],
    ['¡Todo listo!',            100],
  ];

  for (const [text, pct] of steps) {
    msg.textContent   = text;
    bar.style.width   = `${pct}%`;
    await _sleep(300 + Math.random() * 200);
  }

  await _sleep(400);

  // init menu canvas renderer
  const menuCanvas = document.getElementById('menu-canvas');
  menuRenderer = new Renderer(menuCanvas);
  _resizeCanvas(menuCanvas);
  _startMenuLoop();

  // set default time based on actual hour
  const h = new Date().getHours();
  if      (h >= 5  && h < 8)  setup.timeId = 'dawn';
  else if (h >= 8  && h < 13) setup.timeId = 'morning';
  else if (h >= 13 && h < 18) setup.timeId = 'afternoon';
  else if (h >= 18 && h < 21) setup.timeId = 'dusk';
  else                          setup.timeId = 'night';

  // random weather
  const weathers = WEATHER_TYPES.map(w => w.id);
  setup.weatherId = weathers[Math.floor(Math.random() * weathers.length)];

  updateMenuPills(setup.timeId, setup.weatherId);
  Screens.show('menu');
}

// ---- Menu canvas loop ----
let _menuRafId = null;
function _startMenuLoop() {
  if (!menuRenderer) return;
  let lastTs = performance.now();
  function loop(ts) {
    const dt = Math.min((ts - lastTs) / 1000, 0.05);
    lastTs = ts;
    menuRenderer.update(dt, setup.weatherId);
    menuRenderer.render({ timeId: setup.timeId, weather: setup.weatherId, phase: 'idle' });
    _menuRafId = requestAnimationFrame(loop);
  }
  _menuRafId = requestAnimationFrame(loop);
}
function _stopMenuLoop() {
  if (_menuRafId) { cancelAnimationFrame(_menuRafId); _menuRafId = null; }
}

// ---- MENU ----
document.getElementById('btn-play').addEventListener('click', () => {
  Audio.menuIn();
  buildSetupScreen(setup, () => updateFishHints(setup));
  Screens.show('setup');
});

document.getElementById('btn-collection').addEventListener('click', () => {
  Audio.menuIn();
  renderCollection(menuRenderer);
  Screens.show('collection');
});

document.getElementById('btn-stats').addEventListener('click', () => {
  Audio.menuIn();
  renderStats();
  Screens.show('stats');
});

// ---- SETUP ----
document.getElementById('btn-setup-back').addEventListener('click', () => {
  Audio.buttonTap();
  Screens.show('menu');
});

document.getElementById('btn-start-fishing').addEventListener('click', () => {
  Audio.menuIn();
  _stopMenuLoop();
  _startGame();
});

// ---- GAME ----
function _startGame() {
  const canvas = document.getElementById('game-canvas');
  const renderer = new Renderer(canvas);

  gameEngine = new GameEngine(canvas, renderer);
  gameEngine.configure(setup.timeId, setup.weatherId, setup.baitId, setup.techId);

  gameEngine.onStatus = txt => updateStatusText(txt);
  gameEngine.onHUD = (type, data) => {
    if (type === 'btn') setCastButton(data);
    if (type === 'hud') updateGameHUD(data.timeId, data.weather, data.catches);
  };

  gameEngine.onCaught = (fish, weight, isNight, catchCount) => {
    const result = Collection.recordCatch(fish, weight, isNight);
    showCatchScreen(fish, weight, result.isNew, renderer);
    updateGameHUD(setup.timeId, setup.weatherId, catchCount);
    Screens.show('catch');
  };

  gameEngine.onEscape = (fish, message) => {
    showEscapeScreen(fish, message);
    Screens.show('escape');
  };

  updateGameHUD(setup.timeId, setup.weatherId, 0);
  Screens.show('game');
  gameEngine.start();
  _wireGameControls();
}

function _wireGameControls() {
  const castBtn = document.getElementById('btn-cast');

  // pointer events for hold-to-cast
  castBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    if (gameEngine.phase === 'idle') {
      gameEngine.holdCast();
    } else if (gameEngine.phase === 'bite' || gameEngine.phase === 'reeling') {
      gameEngine.tapAction();
    }
  });

  castBtn.addEventListener('pointerup', e => {
    e.preventDefault();
    if (gameEngine.phase === 'casting') gameEngine.releaseCast();
  });

  castBtn.addEventListener('pointerleave', e => {
    if (gameEngine.phase === 'casting') gameEngine.releaseCast();
  });

  // rapid tap for reeling
  castBtn.addEventListener('click', () => {
    if (gameEngine.phase === 'reeling') gameEngine.tapAction();
  });

  document.getElementById('btn-ingame-menu').addEventListener('click', () => {
    Audio.buttonTap();
    gameEngine.stop();
    _stopMenuLoop();

    // restart menu canvas
    menuRenderer = new Renderer(document.getElementById('menu-canvas'));
    _resizeCanvas(document.getElementById('menu-canvas'));
    menuRenderer.resize(
      document.getElementById('menu-canvas').clientWidth,
      document.getElementById('menu-canvas').clientHeight
    );
    _startMenuLoop();
    Screens.show('menu');
  });

  document.getElementById('btn-change-bait').addEventListener('click', () => {
    Audio.buttonTap();
    buildBaitModal(setup, (bait) => {
      setup.baitId = bait.id;
      gameEngine.baitId = bait.id;
      document.getElementById('modal-bait').classList.add('hidden');
      Audio.buttonTap();
    });
    document.getElementById('modal-bait').classList.remove('hidden');
  });

  document.getElementById('modal-bait-backdrop').addEventListener('click', () => {
    document.getElementById('modal-bait').classList.add('hidden');
  });
  document.getElementById('modal-bait-close').addEventListener('click', () => {
    document.getElementById('modal-bait').classList.add('hidden');
  });
}

// ---- CATCH ----
document.getElementById('btn-keep-fishing').addEventListener('click', () => {
  Audio.buttonTap();
  Screens.show('game');
  gameEngine?.resumeFromResult();
});

document.getElementById('btn-to-collection').addEventListener('click', () => {
  Audio.buttonTap();
  gameEngine?.stop();
  renderCollection(menuRenderer || new Renderer(document.createElement('canvas')));
  Screens.show('collection');
});

// ---- ESCAPE ----
document.getElementById('btn-escape-retry').addEventListener('click', () => {
  Audio.buttonTap();
  Screens.show('game');
  gameEngine?.resumeFromResult();
});

// ---- COLLECTION ----
document.getElementById('btn-coll-back').addEventListener('click', () => {
  Audio.buttonTap();
  // return to wherever makes sense
  if (gameEngine?.running) {
    Screens.show('game');
  } else {
    _maybeRestartMenuLoop();
    Screens.show('menu');
  }
});

document.getElementById('modal-backdrop').addEventListener('click', () => hideFishModal());
document.getElementById('modal-close').addEventListener('click',    () => hideFishModal());

// ---- STATS ----
document.getElementById('btn-stats-back').addEventListener('click', () => {
  Audio.buttonTap();
  _maybeRestartMenuLoop();
  Screens.show('menu');
});

// ---- RESIZE ----
window.addEventListener('resize', () => {
  const menuCanvas = document.getElementById('menu-canvas');
  if (menuCanvas) _resizeCanvas(menuCanvas);
  if (menuRenderer) menuRenderer.resize(menuCanvas.clientWidth, menuCanvas.clientHeight);

  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas && gameEngine) {
    _resizeCanvas(gameCanvas);
    gameEngine.renderer.resize(gameCanvas.clientWidth, gameCanvas.clientHeight);
    gameEngine._lineOrigin = {
      x: gameCanvas.clientWidth  * 0.22,
      y: gameCanvas.clientHeight * 0.35,
    };
  }
});

// ---- Helpers ----
function _resizeCanvas(canvas) {
  canvas.width  = canvas.clientWidth  || window.innerWidth;
  canvas.height = canvas.clientHeight || window.innerHeight;
}

function _maybeRestartMenuLoop() {
  if (!_menuRafId) {
    if (!menuRenderer) {
      const mc = document.getElementById('menu-canvas');
      menuRenderer = new Renderer(mc);
      _resizeCanvas(mc);
    }
    _startMenuLoop();
  }
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---- Start ----
window.addEventListener('DOMContentLoaded', boot);
