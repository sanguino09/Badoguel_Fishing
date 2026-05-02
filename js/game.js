/* ============================================================
   GAME ENGINE – state machine + fight logic
   ============================================================ */

import { selectFish, rollWeight, ESCAPE_MESSAGES } from './data.js';
import { FloatPhysics } from './physics.js';
import { Audio } from './audio.js';

// phases: idle | casting | flying | waiting | bite | reeling | result
export class GameEngine {
  constructor(canvas, renderer) {
    this.canvas   = canvas;
    this.renderer = renderer;
    this.float    = new FloatPhysics();

    // config (set before starting)
    this.timeId   = 'morning';
    this.weather  = 'sunny';
    this.baitId   = 'gusano';
    this.techId   = 'flotador';

    // state
    this.phase       = 'idle';
    this.castPower   = 0;
    this._castHeld   = false;
    this._castTimer  = 0;
    this._waitTimer  = 0;
    this._biteTimer  = 0;
    this._reelPct    = 0;
    this._tension    = 0;
    this._reelTimer  = 0;
    this._lastTap    = 0;
    this._catchCount = 0;

    this._currentFish   = null;
    this._currentWeight = 0;
    this._lineOrigin    = { x: 0, y: 0 };

    this._raf     = null;
    this._lastTs  = 0;
    this.running  = false;

    // callbacks
    this.onBite    = null;
    this.onCaught  = null;
    this.onEscape  = null;
    this.onStatus  = null;
    this.onHUD     = null;

    this._resize();
  }

  configure(timeId, weather, baitId, techId) {
    this.timeId  = timeId;
    this.weather = weather;
    this.baitId  = baitId;
    this.techId  = techId;
  }

  start() {
    this._catchCount = 0;
    this.phase = 'idle';
    this.running = true;
    this._resize();
    this.float.reset(this._lineOrigin.x, this._lineOrigin.y, this.renderer.waterY);
    this._lastTs = performance.now();
    this._raf = requestAnimationFrame(ts => this._loop(ts));
    this._setStatus('Prepara el lanzamiento…');
  }

  stop() {
    this.running = false;
    if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
  }

  _resize() {
    const w = this.canvas.clientWidth  || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.resize(w, h);
    this._lineOrigin = { x: w * 0.22, y: h * 0.35 };
  }

  // ---- public controls ----
  holdCast() {
    if (this.phase !== 'idle') return;
    this.phase      = 'casting';
    this._castHeld  = true;
    this._castTimer = 0;
    this.castPower  = 0;
    this._setStatus('Mantén pulsado para cargar potencia…');
    this._updateBtn('cast');
    this._showCastOverlay(true);
  }

  releaseCast() {
    if (this.phase !== 'casting') return;
    this._castHeld = false;
    this._launchFloat();
  }

  tapAction() {
    if (this.phase === 'bite') {
      this._startReeling();
    } else if (this.phase === 'reeling') {
      this._tapReel();
    }
  }

  // ---- internal ----
  _loop(ts) {
    if (!this.running) return;
    const dt = Math.min((ts - this._lastTs) / 1000, 0.05);
    this._lastTs = ts;

    this._update(dt);
    this._render();

    this._raf = requestAnimationFrame(ts => this._loop(ts));
  }

  _update(dt) {
    this.renderer.update(dt, this.weather);
    this.float.update(dt, this.phase);

    switch (this.phase) {
      case 'casting':  this._updateCasting(dt);  break;
      case 'flying':   this._updateFlying(dt);   break;
      case 'waiting':  this._updateWaiting(dt);  break;
      case 'bite':     this._updateBite(dt);     break;
      case 'reeling':  this._updateReeling(dt);  break;
    }
  }

  _render() {
    const fp = this.float.position;
    this.renderer.render({
      timeId:    this.timeId,
      weather:   this.weather,
      phase:     this.phase,
      floatX:    fp.x,
      floatY:    fp.y,
      castPower: this.castPower,
      lineFrom:  this._lineOrigin,
      reelPct:   this._reelPct,
    });
  }

  // casting
  _updateCasting(dt) {
    if (this._castHeld) {
      this._castTimer += dt;
      this.castPower = Math.min(this._castTimer / 2.5, 1.0);
      this._updatePowerUI(this.castPower);
      if (this.castPower >= 1.0) {
        this._castHeld = false;
        this._launchFloat();
      }
    }
  }

  _launchFloat() {
    const w = this.canvas.clientWidth  || window.innerWidth;
    const { x, y } = this._lineOrigin;
    this.float.cast(this.castPower, x, y, this.renderer.waterY, w);
    this.phase = 'flying';
    this._showCastOverlay(false);
    Audio.lineCast();
    this._setStatus('Lanzando…');
    this._updateBtn('wait');
  }

  // flying
  _updateFlying(dt) {
    if (this.float.isSettled()) {
      this.phase = 'waiting';
      Audio.splash();
      this.renderer.addRipple(this.float.position.x, this.renderer.waterY);
      this._startWaiting();
    }
  }

  // waiting for bite
  _startWaiting() {
    // random wait time – affected by fish rarity and time/weather
    const base = 4000 + Math.random() * 8000;
    this._waitTimer = base;
    this._setStatus('Esperando picada…');
    this._updateBtn('waiting');
  }

  _updateWaiting(dt) {
    this._waitTimer -= dt * 1000;
    if (this._waitTimer <= 0) {
      this._triggerBite();
    }
  }

  // bite
  _triggerBite() {
    this._currentFish   = selectFish(this.timeId, this.weather, this.baitId, this.techId);
    this._currentWeight = rollWeight(this._currentFish);
    this.phase = 'bite';
    this._biteTimer = this._currentFish.escapeMs;
    this._showBiteAlert(true);
    Audio.bite();
    this._setStatus('¡PICA! ¡Coge ahora!');
    this._updateBtn('bite');

    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
  }

  _updateBite(dt) {
    this._biteTimer -= dt * 1000;
    if (this._biteTimer <= 0) {
      this._fishEscaped('Te lo pensaste demasiado…');
    }
  }

  // reeling minigame
  _startReeling() {
    this.phase      = 'reeling';
    this._reelPct   = 0;
    this._tension   = 0;
    this._reelTimer = this._currentFish.fightMs;
    this._lastTap   = performance.now();
    this._showBiteAlert(false);
    this._showReelOverlay(true);
    this._setStatus('¡Carretar!');
    this._updateBtn('reel');
  }

  _tapReel() {
    const now = performance.now();
    const gap = now - this._lastTap;
    this._lastTap = now;

    // diminishing returns for too-fast tapping
    const tapVal = gap < 80 ? 0.5 : gap < 150 ? 1.0 : 0.8;
    const gain   = tapVal * (0.05 + (1 - this._currentFish.fightStr) * 0.06);

    this._reelPct = Math.min(1.0, this._reelPct + gain);
    Audio.reel();
    this._updateReelUI();

    if (this._reelPct >= 1.0) {
      this._fishCaught();
    }
  }

  _updateReeling(dt) {
    // fish pulls back over time
    const pullBack = this._currentFish.pullRate * dt * this._currentFish.fightStr;
    this._reelPct  = Math.max(0, this._reelPct - pullBack);

    // tension builds if not tapping
    const now = performance.now();
    const idle = (now - this._lastTap) / 1000;
    if (idle > 0.6) {
      this._tension = Math.min(1.0, this._tension + dt * 0.4);
    } else {
      this._tension = Math.max(0, this._tension - dt * 0.8);
    }

    this._reelTimer -= dt * 1000;

    this._updateReelUI();

    if (this._tension >= 1.0) {
      this._fishEscaped('¡El sedal se cortó por la tensión!');
    } else if (this._reelTimer <= 0) {
      this._fishEscaped('Se te acabó el tiempo...');
    }
  }

  _fishCaught() {
    this._catchCount++;
    this.phase = 'result';
    this._showReelOverlay(false);
    const isNight = this.timeId === 'night';
    Audio[this._currentFish.rarity === 'legendario' ? 'catchLegendary'
         : this._currentFish.rarity === 'rara'      ? 'catchBig'
         :                                             'catchSmall']();
    if (navigator.vibrate) navigator.vibrate([60, 30, 60, 30, 120]);
    if (this.onCaught) this.onCaught(this._currentFish, this._currentWeight, isNight, this._catchCount);
  }

  _fishEscaped(msg) {
    this.phase = 'result';
    this._showBiteAlert(false);
    this._showReelOverlay(false);
    Audio.escape();
    if (navigator.vibrate) navigator.vibrate([200]);
    const msgs = [msg, ...ESCAPE_MESSAGES];
    const chosen = msgs[Math.floor(Math.random() * Math.min(msgs.length, 3))];
    if (this.onEscape) this.onEscape(this._currentFish, chosen);
  }

  resumeFromResult() {
    this.phase = 'idle';
    this.float.reset(this._lineOrigin.x, this._lineOrigin.y, this.renderer.waterY);
    this._setStatus('Prepara el lanzamiento…');
    this._updateBtn('cast');
    this._updateHUD();
  }

  // ---- UI helpers called back to main ----
  _setStatus(txt)  { if (this.onStatus) this.onStatus(txt); }
  _updateBtn(mode) { if (this.onHUD) this.onHUD('btn', mode); }
  _updateHUD()     { if (this.onHUD) this.onHUD('hud', { timeId: this.timeId, weather: this.weather, catches: this._catchCount }); }

  _showCastOverlay(show) {
    const el = document.getElementById('cast-overlay');
    if (!el) return;
    el.classList.toggle('show', show);
  }

  _showBiteAlert(show) {
    const el = document.getElementById('bite-alert');
    if (!el) return;
    el.classList.toggle('show', show);
  }

  _showReelOverlay(show) {
    const el = document.getElementById('reel-overlay');
    if (!el) return;
    el.classList.toggle('show', show);
    if (show) {
      document.getElementById('reel-name').textContent   = this._currentFish.name;
      document.getElementById('reel-weight').textContent = `~${this._currentWeight.toFixed(1)} kg`;
    }
  }

  _updatePowerUI(pow) {
    const fill = document.getElementById('power-fill');
    const pct  = document.getElementById('power-pct');
    if (fill) fill.style.width = `${pow * 100}%`;
    if (pct)  pct.textContent  = `${Math.round(pow * 100)}%`;
  }

  _updateReelUI() {
    const reelFill   = document.getElementById('reel-fill');
    const resistBar  = document.getElementById('reel-resist');
    const tensionFill = document.getElementById('tension-fill');
    if (reelFill)  reelFill.style.width   = `${this._reelPct * 100}%`;
    if (resistBar) resistBar.style.width  = `${this._currentFish.fightStr * 35}%`;
    if (tensionFill) {
      tensionFill.style.width = `${this._tension * 100}%`;
      tensionFill.classList.toggle('danger', this._tension > 0.8);
    }
  }
}
