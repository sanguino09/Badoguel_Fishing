/* ============================================================
   RENDERER – Canvas scene for La Portiña pantano
   ============================================================ */

const SKY_PALETTES = {
  dawn:      { top: '#140a30', mid: '#9b3010', bot: '#f5820a', waterTint: 'rgba(200,100,30,0.25)' },
  morning:   { top: '#4a88d0', mid: '#87ceeb', bot: '#d8f0ff', waterTint: 'rgba(60,140,200,0.3)'  },
  afternoon: { top: '#1255a0', mid: '#2280d0', bot: '#60b0e8', waterTint: 'rgba(30,100,180,0.35)' },
  dusk:      { top: '#0a0418', mid: '#8a2000', bot: '#f06000', waterTint: 'rgba(180,60,10,0.3)'   },
  night:     { top: '#020610', mid: '#050f28', bot: '#0a1c3a', waterTint: 'rgba(5,15,40,0.6)'     },
};

const WATER_COLORS = {
  dawn:      ['#c05520', '#703010', '#401808'],
  morning:   ['#2a88c8', '#1a5888', '#103048'],
  afternoon: ['#1a72bc', '#104880', '#083060'],
  dusk:      ['#c04810', '#702808', '#401408'],
  night:     ['#040c22', '#030818', '#020510'],
};

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');
    this.t      = 0;
    this.clouds = [];
    this.stars  = [];
    this.rain   = [];
    this.ambFish = [];
    this.ripples  = [];

    this._initClouds();
    this._initStars();
    this._initAmbFish();
  }

  resize(w, h) {
    this.canvas.width  = w;
    this.canvas.height = h;
    this.w = w;
    this.h = h;
    this.waterY = h * 0.50;
  }

  _initClouds() {
    this.clouds = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * 1200,
      y: 20 + Math.random() * 120,
      r: 40 + Math.random() * 60,
      speed: 0.08 + Math.random() * 0.12,
      alpha: 0.5 + Math.random() * 0.4,
    }));
  }

  _initStars() {
    this.stars = Array.from({ length: 120 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.45,
      r: 0.5 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1.5,
    }));
  }

  _initAmbFish() {
    this.ambFish = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * 800,
      y: 0,
      speed: 0.3 + Math.random() * 0.4,
      dir: Math.random() > 0.5 ? 1 : -1,
      depth: 0.6 + Math.random() * 0.35,
      size: 8 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
    }));
  }

  addRipple(x, y) {
    this.ripples.push({ x, y, r: 2, maxR: 40, alpha: 0.8 });
  }

  update(dt, weather) {
    this.t += dt;

    // clouds
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.w + 150) c.x = -150;
    });

    // rain
    if (weather === 'rainy') {
      while (this.rain.length < 80) {
        this.rain.push({ x: Math.random() * (this.w || 400), y: -10, speed: 6 + Math.random() * 6, len: 10 + Math.random() * 14 });
      }
      this.rain.forEach(d => { d.y += d.speed; if (d.y > (this.waterY || 200)) { d.y = -10; d.x = Math.random() * (this.w || 400); } });
    } else {
      this.rain = [];
    }

    // ambient fish
    this.ambFish.forEach(f => {
      f.x += f.speed * f.dir;
      f.y = this.waterY * f.depth + Math.sin(this.t * 0.8 + f.phase) * 8;
      if (f.x > this.w + 40)  { f.x = -40; f.dir = 1; }
      if (f.x < -40)           { f.x = this.w + 40; f.dir = -1; }
    });

    // ripples
    this.ripples.forEach(r => { r.r += 0.8; r.alpha -= 0.025; });
    this.ripples = this.ripples.filter(r => r.alpha > 0);
  }

  render(gameState) {
    if (!this.w) return;
    const { ctx, w, h } = this;
    ctx.clearRect(0, 0, w, h);

    const timeId   = gameState?.timeId   || 'morning';
    const weather  = gameState?.weather  || 'sunny';
    const phase    = gameState?.phase    || 'idle';
    const floatX   = gameState?.floatX   ?? w * 0.62;
    const floatY   = gameState?.floatY   ?? this.waterY - 4;
    const castPow  = gameState?.castPower ?? 0;
    const lineFrom = gameState?.lineFrom  ?? { x: w * 0.22, y: h * 0.34 };
    const reelPct  = gameState?.reelPct  ?? 0;

    this._drawSky(timeId);
    if (timeId === 'night') this._drawStars();
    this._drawCelestial(timeId);
    this._drawClouds(timeId, weather);
    if (weather === 'rainy') this._drawRain();
    this._drawMountains(timeId);
    this._drawFarVegetation(timeId);
    this._drawNearTrees(timeId);
    this._drawWater(timeId, weather);
    this._drawRipples();
    this._drawNearShore(timeId);
    this._drawAmbFish(timeId);
    this._drawFishermanSetup(timeId, w, h);
    this._drawFishingLine(phase, lineFrom, floatX, floatY, reelPct, w);
    this._drawFloat(phase, floatX, floatY, timeId);

    if (phase === 'casting' && castPow > 0) this._drawCastPowerArc(lineFrom, castPow, w, h);
  }

  // ----------------------------------------------------------------
  _drawSky(timeId) {
    const { ctx, w, waterY } = this;
    const pal = SKY_PALETTES[timeId] || SKY_PALETTES.morning;
    const g = ctx.createLinearGradient(0, 0, 0, waterY);
    g.addColorStop(0,   pal.top);
    g.addColorStop(0.5, pal.mid);
    g.addColorStop(1,   pal.bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, waterY);
  }

  _drawStars() {
    const { ctx, w, h } = this;
    this.stars.forEach(s => {
      const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(this.t * s.speed + s.phase));
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  _drawCelestial(timeId) {
    const { ctx, w, waterY } = this;
    if (timeId === 'dawn' || timeId === 'morning' || timeId === 'afternoon') {
      // Sun
      const sx = timeId === 'morning' ? w * 0.78 : timeId === 'dawn' ? w * 0.82 : w * 0.65;
      const sy = timeId === 'morning' ? waterY * 0.18 : waterY * 0.12;
      const sr = timeId === 'afternoon' ? 26 : 20;
      // halo
      const halo = ctx.createRadialGradient(sx, sy, sr, sx, sy, sr * 3.5);
      halo.addColorStop(0, timeId === 'dawn' ? 'rgba(250,180,80,0.35)' : 'rgba(255,240,180,0.28)');
      halo.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(sx, sy, sr * 3.5, 0, Math.PI * 2); ctx.fill();
      // disk
      ctx.fillStyle = timeId === 'dawn' ? '#ffb040' : '#fff8d0';
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    } else if (timeId === 'dusk') {
      // Setting sun on horizon
      const sx = w * 0.75, sy = waterY * 0.82;
      const halo = ctx.createRadialGradient(sx, sy, 18, sx, sy, 80);
      halo.addColorStop(0, 'rgba(255,120,0,0.5)');
      halo.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(sx, sy, 80, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ff8820';
      ctx.beginPath(); ctx.arc(sx, sy, 22, 0, Math.PI * 2); ctx.fill();
    } else {
      // Moon + glow
      const mx = w * 0.75, my = waterY * 0.2;
      const glow = ctx.createRadialGradient(mx, my, 14, mx, my, 50);
      glow.addColorStop(0, 'rgba(200,220,255,0.3)');
      glow.addColorStop(1, 'rgba(100,140,200,0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(mx, my, 50, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d8e8ff';
      ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
      // crescent shadow
      ctx.fillStyle = SKY_PALETTES.night.mid;
      ctx.beginPath(); ctx.arc(mx - 5, my - 3, 11, 0, Math.PI * 2); ctx.fill();
    }
  }

  _drawClouds(timeId, weather) {
    const { ctx, w, waterY } = this;
    if (timeId === 'night' && weather !== 'cloudy' && weather !== 'rainy') return;

    const cloudAlpha = weather === 'cloudy' || weather === 'rainy' ? 0.75 : 0.35;
    const cloudColor = timeId === 'dawn' || timeId === 'dusk' ? '#d06030' : timeId === 'night' ? '#1a2a40' : '#ffffff';

    this.clouds.forEach(c => {
      const cx = ((c.x % (w + 300)) + (w + 300)) % (w + 300) - 150;
      ctx.save();
      ctx.globalAlpha = cloudAlpha * c.alpha;
      ctx.fillStyle = cloudColor;
      this._puffCloud(cx, c.y, c.r);
      ctx.restore();
    });
  }

  _puffCloud(x, y, r) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.arc(x,       y,       r,       0, Math.PI * 2);
    ctx.arc(x + r * 0.7, y - r * 0.3, r * 0.7, 0, Math.PI * 2);
    ctx.arc(x - r * 0.6, y - r * 0.2, r * 0.55, 0, Math.PI * 2);
    ctx.arc(x + r * 1.3, y,            r * 0.5,  0, Math.PI * 2);
    ctx.fill();
  }

  _drawRain() {
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = 'rgba(180,220,255,0.45)';
    ctx.lineWidth = 1;
    this.rain.forEach(d => {
      ctx.beginPath();
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - 3, d.y + d.len);
      ctx.stroke();
    });
    ctx.restore();
  }

  _drawMountains(timeId) {
    const { ctx, w, waterY } = this;
    const pal = SKY_PALETTES[timeId];

    // layer 1 – distant (pale)
    const c1 = timeId === 'night' ? 'rgba(8,18,40,0.9)' :
               timeId === 'dusk'  ? 'rgba(80,20,10,0.5)' :
               timeId === 'dawn'  ? 'rgba(90,40,20,0.4)' :
                                    'rgba(80,120,170,0.35)';
    this._mountainRange(ctx, w, waterY, 0.62, 0.52, c1);

    // layer 2 – closer hills
    const c2 = timeId === 'night' ? '#060e1c' :
               timeId === 'dusk'  ? '#3a1008' :
               timeId === 'dawn'  ? '#1a0808' :
                                    '#1a3040';
    this._mountainRange(ctx, w, waterY, 0.72, 0.62, c2);
  }

  _mountainRange(ctx, w, waterY, yFrac, peakFrac, color) {
    const baseY = waterY * yFrac;
    const seed  = [0, 0.12, 0.22, 0.35, 0.48, 0.60, 0.72, 0.84, 0.94, 1.0];
    const peaks = [0.0, -1.0, -0.5, -0.85, -0.3, -0.95, -0.45, -0.80, -0.2, 0.0];

    ctx.beginPath();
    ctx.moveTo(0, baseY);
    seed.forEach((s, i) => {
      const x = s * w;
      const y = baseY + peaks[i] * (waterY * (1 - peakFrac));
      ctx.lineTo(x, y);
    });
    ctx.lineTo(w, baseY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  _drawFarVegetation(timeId) {
    const { ctx, w, waterY } = this;
    const baseY = waterY * 0.82;
    const treeColor = timeId === 'night' ? '#040a14' : timeId === 'dusk' || timeId === 'dawn' ? '#1a1008' : '#1a3820';
    const pinePositions = [0.08, 0.14, 0.20, 0.28, 0.35, 0.42, 0.50, 0.58, 0.65, 0.70, 0.78, 0.86, 0.93];
    pinePositions.forEach((px, i) => {
      const x = px * w;
      const h = 22 + (i % 3) * 10;
      this._drawPineSmall(ctx, x, baseY, h, treeColor);
    });
  }

  _drawPineSmall(ctx, x, y, h, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - h * 0.35, y);
    ctx.lineTo(x + h * 0.35, y);
    ctx.closePath();
    ctx.fill();
    // second tier
    ctx.beginPath();
    ctx.moveTo(x, y - h * 0.65);
    ctx.lineTo(x - h * 0.5, y - h * 0.1);
    ctx.lineTo(x + h * 0.5, y - h * 0.1);
    ctx.closePath();
    ctx.fill();
  }

  _drawNearTrees(timeId) {
    const { ctx, w, waterY } = this;
    const y = waterY;
    const darkTrunk  = timeId === 'night' ? '#020508' : '#2a1808';
    const darkLeaves = timeId === 'night' ? '#040a10' : timeId === 'dusk' || timeId === 'dawn' ? '#1a1a08' : '#1a4020';

    const trees = [
      { x: 0.02, size: 55, type: 'pine' },
      { x: 0.06, size: 70, type: 'oak'  },
      { x: 0.11, size: 48, type: 'pine' },
      { x: 0.16, size: 62, type: 'oak'  },
      { x: 0.21, size: 44, type: 'pine' },
    ];
    trees.forEach(t => {
      if (t.type === 'pine') {
        this._drawPineLarge(ctx, t.x * w, y, t.size, darkLeaves, darkTrunk);
      } else {
        this._drawOak(ctx, t.x * w, y, t.size, darkLeaves, darkTrunk);
      }
    });
  }

  _drawPineLarge(ctx, x, y, size, leaves, trunk) {
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 4, y - size * 0.25, 8, size * 0.25);
    ctx.fillStyle = leaves;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x - size * 0.38, y - size * 0.2);
    ctx.lineTo(x + size * 0.38, y - size * 0.2);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y - size * 0.7);
    ctx.lineTo(x - size * 0.52, y - size * 0.05);
    ctx.lineTo(x + size * 0.52, y - size * 0.05);
    ctx.closePath(); ctx.fill();
  }

  _drawOak(ctx, x, y, size, leaves, trunk) {
    ctx.fillStyle = trunk;
    ctx.fillRect(x - 5, y - size * 0.4, 10, size * 0.4);
    ctx.fillStyle = leaves;
    ctx.beginPath();
    ctx.arc(x, y - size * 0.62, size * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - size * 0.28, y - size * 0.5, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + size * 0.28, y - size * 0.5, size * 0.32, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawWater(timeId, weather) {
    const { ctx, w, h, waterY, t } = this;
    const cols = WATER_COLORS[timeId] || WATER_COLORS.morning;

    // base fill
    const g = ctx.createLinearGradient(0, waterY, 0, h);
    g.addColorStop(0,   cols[0]);
    g.addColorStop(0.5, cols[1]);
    g.addColorStop(1,   cols[2]);
    ctx.fillStyle = g;
    ctx.fillRect(0, waterY, w, h - waterY);

    // shimmer highlights
    const amp = weather === 'windy' ? 5 : weather === 'rainy' ? 4 : 2.5;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = timeId === 'night' ? '#1a3a6a' : '#8fd8ff';
    ctx.lineWidth = 1.5;
    for (let row = 0; row < 5; row++) {
      const ry = waterY + 12 + row * 22;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = ry + Math.sin(x * 0.04 + t * 1.8 + row * 1.2) * amp
                     + Math.sin(x * 0.09 + t * 2.4 + row * 0.7) * amp * 0.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();

    // surface wave line
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.strokeStyle = timeId === 'night' ? '#1a3060' : '#a0d8ff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const y = waterY + Math.sin(x * 0.03 + t * 2.0) * 2 + Math.sin(x * 0.07 + t * 3.1) * 1.5;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    // reflection shimmer near sun/moon
    if (timeId !== 'night') {
      const rg = ctx.createLinearGradient(w * 0.5, waterY, w * 0.9, waterY + 60);
      rg.addColorStop(0, 'rgba(255,255,200,0)');
      rg.addColorStop(0.5, 'rgba(255,255,180,0.12)');
      rg.addColorStop(1, 'rgba(255,255,200,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, waterY, w, 60);
    }
  }

  _drawRipples() {
    const { ctx } = this;
    this.ripples.forEach(r => {
      ctx.save();
      ctx.globalAlpha = r.alpha * 0.6;
      ctx.strokeStyle = '#a0d8ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }

  _drawNearShore(timeId) {
    const { ctx, w, waterY, h } = this;
    const stoneColor = timeId === 'night' ? '#080e18' : '#2a3040';
    const mudColor   = timeId === 'night' ? '#060c14' : '#1a2430';

    // mud/gravel strip
    ctx.fillStyle = mudColor;
    ctx.beginPath();
    ctx.moveTo(0, waterY + 2);
    ctx.lineTo(w * 0.27, waterY - 8);
    ctx.lineTo(w * 0.27, waterY + 18);
    ctx.lineTo(0, waterY + 22);
    ctx.closePath();
    ctx.fill();

    // stones
    const stones = [
      { x: 0.04, s: 10 }, { x: 0.08, s: 7 }, { x: 0.14, s: 13 },
      { x: 0.18, s: 8  }, { x: 0.22, s: 11 },
    ];
    ctx.fillStyle = stoneColor;
    stones.forEach(s => {
      ctx.beginPath();
      ctx.ellipse(s.x * w, waterY + 6, s.s, s.s * 0.55, -0.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  _drawAmbFish(timeId) {
    const { ctx, waterY } = this;
    this.ambFish.forEach(f => {
      if (f.y < waterY + 5) return;
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.translate(f.x, f.y);
      if (f.dir < 0) ctx.scale(-1, 1);
      this._quickFishShape(ctx, f.size, '#6090c0');
      ctx.restore();
    });
  }

  _quickFishShape(ctx, size, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size, 0);
    ctx.lineTo(-size - size * 0.55, -size * 0.35);
    ctx.lineTo(-size - size * 0.55,  size * 0.35);
    ctx.closePath();
    ctx.fill();
  }

  // ---- Fisherman setup ----
  _drawFishermanSetup(timeId, w, h) {
    const { ctx, waterY } = this;
    const bx = w * 0.12;
    const by = waterY;
    const dark = timeId === 'night';

    // bivvy tent
    ctx.save();
    ctx.translate(bx - 55, by - 2);
    ctx.fillStyle = dark ? '#0c1820' : '#2a3848';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(70, 0);
    ctx.lineTo(70, -30);
    ctx.lineTo(35, -55);
    ctx.lineTo(0, -30);
    ctx.closePath();
    ctx.fill();
    // door opening
    ctx.fillStyle = dark ? '#060c14' : '#1a2030';
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(50, 0); ctx.lineTo(45, -28); ctx.lineTo(25, -28);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // chair
    ctx.fillStyle = dark ? '#0e1824' : '#3a4858';
    ctx.fillRect(bx - 26, by - 22, 28, 4);
    ctx.fillRect(bx - 24, by - 22, 4,  22);
    ctx.fillRect(bx - 6,  by - 22, 4,  22);

    // fisherman body sitting
    ctx.fillStyle = dark ? '#1a2a38' : '#2a4060';
    ctx.fillRect(bx - 20, by - 38, 16, 18);  // torso
    ctx.fillStyle = dark ? '#0a1020' : '#1a2840';
    ctx.fillRect(bx - 22, by - 18, 22, 8);   // legs
    // head
    ctx.fillStyle = dark ? '#c0a080' : '#d4b090';
    ctx.beginPath(); ctx.arc(bx - 12, by - 42, 9, 0, Math.PI * 2); ctx.fill();
    // hat
    ctx.fillStyle = dark ? '#0a1422' : '#1a2838';
    ctx.fillRect(bx - 20, by - 54, 20, 5);
    ctx.fillRect(bx - 17, by - 62, 14, 10);

    // rod rests + rods
    this._drawRods(ctx, bx, waterY, w, dark, this.t);

    // lantern at night
    if (dark) {
      const lx = bx + 10, ly = by - 30;
      const gl = ctx.createRadialGradient(lx, ly, 2, lx, ly, 60);
      gl.addColorStop(0, 'rgba(255,200,80,0.4)');
      gl.addColorStop(1, 'rgba(255,160,0,0)');
      ctx.fillStyle = gl;
      ctx.beginPath(); ctx.arc(lx, ly, 60, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcc40';
      ctx.beginPath(); ctx.arc(lx, ly, 5, 0, Math.PI * 2); ctx.fill();
    }
  }

  _drawRods(ctx, bx, waterY, w, dark, t) {
    const rodColor = dark ? '#304050' : '#506070';
    const lineColor = dark ? 'rgba(150,200,255,0.3)' : 'rgba(200,230,255,0.4)';

    const rods = [
      { ox: bx + 12, angle: -0.48 },
      { ox: bx + 26, angle: -0.44 },
    ];
    rods.forEach(r => {
      const len = 110;
      const ex = r.ox + Math.cos(r.angle) * len;
      const ey = waterY + Math.sin(r.angle) * len;
      ctx.strokeStyle = rodColor; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(r.ox, waterY - 10); ctx.lineTo(ex, ey); ctx.stroke();

      // alarm buzzer on rest
      ctx.fillStyle = dark ? '#202830' : '#3a4858';
      ctx.fillRect(r.ox - 4, waterY - 14, 8, 10);

      // fishing line to water
      ctx.strokeStyle = lineColor; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(ex, ey);
      ctx.quadraticCurveTo(ex + 30, waterY + 10, ex + 60 + r.ox * 0.1, waterY + 2);
      ctx.stroke();
    });
  }

  _drawFishingLine(phase, lineFrom, floatX, floatY, reelPct, w) {
    const { ctx, waterY } = this;
    if (phase === 'idle' || phase === 'casting') return;

    ctx.strokeStyle = 'rgba(200,230,255,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(lineFrom.x, lineFrom.y);
    // curve for catenary feel
    const cpx = (lineFrom.x + floatX) * 0.5;
    const cpy = Math.min(lineFrom.y, floatY) - 20;
    ctx.quadraticCurveTo(cpx, cpy, floatX, floatY);
    ctx.stroke();

    // sub-surface line (faint)
    if (phase === 'waiting' || phase === 'bite' || phase === 'reeling') {
      ctx.strokeStyle = 'rgba(120,180,255,0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(floatX, floatY);
      ctx.lineTo(floatX - 5, floatY + 60);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _drawFloat(phase, floatX, floatY, timeId) {
    const { ctx, t } = this;
    if (phase === 'idle' || phase === 'casting') return;

    const bob = phase === 'bite'
      ? Math.sin(t * 18) * 7
      : Math.sin(t * 2.2) * 2.5 + Math.sin(t * 3.7) * 1.2;

    const fy = floatY + bob;

    // shadow
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(floatX, fy + 3, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // float body (below water) – darker
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(floatX, fy + 5, 4, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = phase === 'bite' ? '#ff3030' : '#cc2020';
    ctx.fill();
    ctx.restore();

    // float top (above water) – white/red
    ctx.beginPath();
    ctx.ellipse(floatX, fy - 4, 4, 8, 0, 0, Math.PI);
    ctx.fillStyle = timeId === 'night' ? '#dd0000' : '#ff0000';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(floatX, fy - 4, 4, 8, Math.PI, 0, Math.PI);
    ctx.fillStyle = timeId === 'night' ? '#cccccc' : '#ffffff';
    ctx.fill();

    // antenna tip
    ctx.fillStyle = phase === 'bite' ? '#ffff00' : '#333333';
    ctx.beginPath();
    ctx.arc(floatX, fy - 12, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawCastPowerArc(lineFrom, castPow, w, h) {
    const { ctx, waterY } = this;
    // Ghost trajectory arc
    const targetX = lineFrom.x + (w * 0.5 - lineFrom.x) * castPow;
    const mid = { x: (lineFrom.x + targetX) / 2, y: waterY - 60 * castPow };
    ctx.save();
    ctx.strokeStyle = `rgba(100,220,120,${0.3 + castPow * 0.4})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lineFrom.x, lineFrom.y);
    ctx.quadraticCurveTo(mid.x, mid.y, targetX, waterY - 4);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  // ---- Fish drawing for catch/collection cards ----
  drawFishCard(canvas, fish, bg = '#0a1628') {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, bg);
    bgGrad.addColorStop(1, this._shadeColor(bg, -20));
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // water ambience
    const waterG = ctx.createLinearGradient(0, h * 0.45, 0, h);
    waterG.addColorStop(0, 'rgba(20,60,100,0.4)');
    waterG.addColorStop(1, 'rgba(10,30,60,0.8)');
    ctx.fillStyle = waterG;
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    // bubbles
    for (let i = 0; i < 8; i++) {
      ctx.save();
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#a0d0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(20 + Math.sin(i * 2.3) * 60 + w * 0.5, h * 0.55 + i * 8, 3 + i * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // draw fish centered
    ctx.save();
    ctx.translate(w / 2, h / 2 + 10);
    const scale = Math.min(w / 220, h / 130);
    ctx.scale(scale, scale);
    this._drawFishShape(ctx, fish);
    ctx.restore();

    // fish name
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, h - 36, w, 36);
    ctx.fillStyle = '#e8f4ff';
    ctx.font = `bold 14px 'Roboto Condensed', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(fish.name, w / 2, h - 14);
    ctx.fillStyle = '#8aa8cc';
    ctx.font = `italic 11px sans-serif`;
    ctx.fillText(fish.scientificName, w / 2, h - 2);
  }

  _drawFishShape(ctx, fish) {
    const { bodyColor, finColor, accentColor, shape } = fish;
    switch (shape) {
      case 'slim':    this._shapSlim(ctx, bodyColor, finColor, accentColor); break;
      case 'round':   this._shapeRound(ctx, bodyColor, finColor, accentColor); break;
      case 'big':     this._shapeBig(ctx, bodyColor, finColor, accentColor); break;
      case 'bass':    this._shapeBass(ctx, bodyColor, finColor, accentColor); break;
      case 'catfish': this._shapeCatfish(ctx, bodyColor, finColor, accentColor); break;
      case 'trout':   this._shapeTrout(ctx, bodyColor, finColor, accentColor, fish.id); break;
      case 'pike':    this._shapePike(ctx, bodyColor, finColor, accentColor); break;
      case 'siluro':  this._shapeSiluro(ctx, bodyColor, finColor, accentColor); break;
      default:        this._shapSlim(ctx, bodyColor, finColor, accentColor);
    }
  }

  _shapSlim(ctx, body, fin, accent) {
    // tail
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-62, 0); ctx.lineTo(-80, -18); ctx.lineTo(-80, 18); ctx.closePath(); ctx.fill();
    // body
    const g = ctx.createLinearGradient(-55, -14, -55, 14);
    g.addColorStop(0, accent); g.addColorStop(0.5, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 62, 14, 0, 0, Math.PI * 2); ctx.fill();
    // dorsal fin
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(20, -26); ctx.lineTo(40, -14); ctx.closePath(); ctx.fill();
    // eye
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(50, -3, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(51, -3, 3, 0, Math.PI * 2); ctx.fill();
    // mouth
    ctx.strokeStyle = fin; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(62, 1, 5, -Math.PI * 0.6, Math.PI * 0.6); ctx.stroke();
  }

  _shapeRound(ctx, body, fin, accent) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-52, 0); ctx.lineTo(-68, -16); ctx.lineTo(-68, 16); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-45, -22, 0, 22);
    g.addColorStop(0, accent); g.addColorStop(0.5, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 2, 55, 22, 0, 0, Math.PI * 2); ctx.fill();
    // pectoral fin
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(30, 28); ctx.lineTo(40, 8); ctx.closePath(); ctx.fill();
    // dorsal
    ctx.beginPath(); ctx.moveTo(-5, -22); ctx.lineTo(15, -36); ctx.lineTo(35, -22); ctx.closePath(); ctx.fill();
    // barbels (barbo has 4 whiskers)
    ctx.strokeStyle = fin; ctx.lineWidth = 1.5;
    [[-3, 4], [4, 3], [-3, -2], [4, -2]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(52 + dx, dy); ctx.lineTo(62 + dx, dy + 5); ctx.stroke();
    });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(44, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(45, -4, 3, 0, Math.PI * 2); ctx.fill();
  }

  _shapeBig(ctx, body, fin, accent) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-70, 0); ctx.lineTo(-90, -24); ctx.lineTo(-90, 24); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-65, -32, 0, 32);
    g.addColorStop(0, accent); g.addColorStop(0.4, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 2, 72, 32, 0, 0, Math.PI * 2); ctx.fill();
    // dorsal (long)
    ctx.fillStyle = fin;
    ctx.beginPath();
    ctx.moveTo(-20, -32); ctx.bezierCurveTo(-10, -52, 20, -52, 40, -32);
    ctx.lineTo(40, -32); ctx.lineTo(-20, -32); ctx.closePath(); ctx.fill();
    // pectoral
    ctx.beginPath(); ctx.moveTo(20, 14); ctx.lineTo(40, 38); ctx.lineTo(55, 14); ctx.closePath(); ctx.fill();
    // scales pattern
    ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    for (let i = -3; i < 4; i++) {
      ctx.beginPath(); ctx.arc(i * 20, 0, 14, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(55, -5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(56, -5, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = fin; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(70, 2, 6, -Math.PI * 0.7, Math.PI * 0.7); ctx.stroke();
    // barbels
    ctx.strokeStyle = fin; ctx.lineWidth = 1.5;
    [[0, 4], [6, 2]].forEach(([dx, dy]) => {
      ctx.beginPath(); ctx.moveTo(66 + dx, dy); ctx.lineTo(78 + dx, dy + 8); ctx.stroke();
    });
  }

  _shapeBass(ctx, body, fin, accent) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-58, 0); ctx.lineTo(-72, -20); ctx.lineTo(-72, 20); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-52, -24, 0, 24);
    g.addColorStop(0, accent); g.addColorStop(0.5, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 60, 24, 0, 0, Math.PI * 2); ctx.fill();
    // spiny dorsal
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-15, -24); ctx.lineTo(-5, -44); ctx.lineTo(5, -38); ctx.lineTo(15, -44);
    ctx.lineTo(25, -38); ctx.lineTo(35, -44); ctx.lineTo(42, -24); ctx.closePath(); ctx.fill();
    // lateral line markings
    ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#2a4a2a';
    for (let i = -2; i < 4; i++) {
      ctx.fillRect(i * 16 - 2, -6, 14, 12);
    }
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(46, -5, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(47, -5, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = fin; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(58, 0); ctx.lineTo(62, -6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(58, 0); ctx.lineTo(62, 6); ctx.stroke();
  }

  _shapeCatfish(ctx, body, fin, accent) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(-72, -12); ctx.lineTo(-72, 12); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-55, -16, 0, 16);
    g.addColorStop(0, accent); g.addColorStop(1, body);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-5, 0, 56, 16, -0.1, 0, Math.PI * 2); ctx.fill();
    // flat head
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(35, 2, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
    // adipose fin
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.ellipse(-30, -16, 10, 6, -0.4, 0, Math.PI * 2); ctx.fill();
    // whiskers
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5;
    [[0, -4], [4, -2], [-2, 4], [2, 6], [0, 0], [4, 2]].forEach(([dx, dy], i) => {
      ctx.beginPath(); ctx.moveTo(50 + dx, dy);
      ctx.quadraticCurveTo(58 + dx, dy, 68 + dx + (i % 2 === 0 ? -6 : 6), dy + (i < 3 ? -10 : 10));
      ctx.stroke();
    });
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(46, -4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(47, -4, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  _shapeTrout(ctx, body, fin, accent, id) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-62, 0); ctx.lineTo(-78, -18); ctx.lineTo(-78, 18); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-55, -16, 0, 16);
    g.addColorStop(0, '#c0d8b0'); g.addColorStop(0.4, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, 64, 18, 0, 0, Math.PI * 2); ctx.fill();
    // rainbow stripe
    ctx.save(); ctx.globalAlpha = 0.65;
    const rainbow = ctx.createLinearGradient(-40, -8, -40, 8);
    rainbow.addColorStop(0, accent); rainbow.addColorStop(0.5, '#ff80a0'); rainbow.addColorStop(1, accent);
    ctx.fillStyle = rainbow;
    ctx.fillRect(-40, -5, 80, 10);
    ctx.restore();
    // spots
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#1a2a18';
    [[-20,-7],[0,-9],[18,-6],[-30,2],[5,5],[25,-2],[-10,8]].forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.arc(sx, sy, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(5, -18); ctx.lineTo(25, -32); ctx.lineTo(40, -18); ctx.closePath(); ctx.fill();
    // adipose
    ctx.beginPath(); ctx.ellipse(-45, -14, 8, 5, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(52, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(53, -4, 3, 0, Math.PI * 2); ctx.fill();
  }

  _shapePike(ctx, body, fin, accent) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-85, 0); ctx.lineTo(-100, -14); ctx.lineTo(-100, 14); ctx.closePath(); ctx.fill();
    const g = ctx.createLinearGradient(-80, -14, 0, 14);
    g.addColorStop(0, accent); g.addColorStop(0.5, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-10, 0, 78, 14, 0, 0, Math.PI * 2); ctx.fill();
    // duck-bill snout
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(50, -8); ctx.lineTo(76, -5); ctx.lineTo(76, 5); ctx.lineTo(50, 8); ctx.closePath(); ctx.fill();
    // jaw line
    ctx.strokeStyle = fin; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(52, 3); ctx.lineTo(74, 4); ctx.stroke();
    // markings
    ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#c8d8a0';
    for (let i = -3; i < 3; i++) ctx.fillRect(i * 18 - 10, -8, 8, 16);
    ctx.restore();
    // dorsal fins at back
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-55, -14); ctx.lineTo(-40, -30); ctx.lineTo(-20, -14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-75, -12); ctx.lineTo(-65, -22); ctx.lineTo(-55, -12); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e0c0'; ctx.beginPath(); ctx.arc(60, -4, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(61, -4, 3, 0, Math.PI * 2); ctx.fill();
  }

  _shapeSiluro(ctx, body, fin, accent) {
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-100, 0); ctx.lineTo(-112, -10); ctx.lineTo(-112, 10); ctx.closePath(); ctx.fill();
    // very long body
    const g = ctx.createLinearGradient(-98, -22, 0, 22);
    g.addColorStop(0, accent); g.addColorStop(0.4, body); g.addColorStop(1, fin);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(80, 0);
    ctx.bezierCurveTo(60, -22, -60, -22, -98, 0);
    ctx.bezierCurveTo(-60, 22, 60, 22, 80, 0);
    ctx.closePath(); ctx.fill();
    // huge flat head
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.ellipse(65, 0, 24, 22, 0, 0, Math.PI * 2); ctx.fill();
    // tiny dorsal
    ctx.fillStyle = fin;
    ctx.beginPath(); ctx.moveTo(-10, -22); ctx.lineTo(10, -32); ctx.lineTo(30, -22); ctx.closePath(); ctx.fill();
    // very long anal fin
    ctx.beginPath();
    ctx.moveTo(-90, 14); ctx.lineTo(-20, 22); ctx.lineTo(20, 14);
    ctx.closePath(); ctx.fill();
    // long whiskers
    ctx.strokeStyle = accent; ctx.lineWidth = 2;
    [[0,6],[6,4]].forEach(([dx,dy]) => {
      ctx.beginPath(); ctx.moveTo(78+dx, dy);
      ctx.quadraticCurveTo(90+dx, dy, 104+dx, dy-14); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(78+dx, dy);
      ctx.quadraticCurveTo(90+dx, dy+4, 104+dx, dy+16); ctx.stroke();
    });
    // mottled pattern
    ctx.save(); ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#aaaacc';
    [[-40,-8],[-10,-12],[20,-6],[-60,4],[-25,10],[10,8]].forEach(([sx,sy]) => {
      ctx.beginPath(); ctx.ellipse(sx, sy, 14, 8, sx * 0.01, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
    ctx.fillStyle = '#c8c0d0'; ctx.beginPath(); ctx.arc(74, -6, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(75, -6, 5, 0, Math.PI * 2); ctx.fill();
  }

  _shadeColor(hex, amount) {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (n >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amount));
    const b = Math.max(0, Math.min(255, (n & 0xff) + amount));
    return `rgb(${r},${g},${b})`;
  }
}
