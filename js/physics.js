/* ============================================================
   FLOAT PHYSICS – parabolic cast + bobbing simulation
   ============================================================ */

export class FloatPhysics {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle'; // idle | flying | settled
    this.waterY = 300;
    this.gravity = 980;   // px/s²
    this.airResist = 0.4;
    this.biteIntensity = 0;
    this.reelProgress  = 0;
    this._settledY = 0;
    this._originX = 0;
  }

  reset(originX, originY, waterY) {
    this.waterY  = waterY;
    this._originX = originX;
    this.x = originX;
    this.y = originY;
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.biteIntensity = 0;
    this.reelProgress  = 0;
  }

  cast(power, originX, originY, waterY, canvasW) {
    this.waterY   = waterY;
    this._originX = originX;
    this.state = 'flying';

    // map power (0-1) to horizontal and vertical velocities
    const maxDist = (canvasW - originX) * 0.82;
    const dist    = maxDist * power;
    const flightT = 0.8 + power * 0.6; // ~0.8 – 1.4 s

    this.x  = originX;
    this.y  = originY;
    this.vx = dist / flightT;
    this.vy = -(waterY - originY + 0.5 * this.gravity * flightT * flightT) / flightT;
  }

  update(dt, gamePhase) {
    if (this.state === 'flying') {
      this._updateFlying(dt);
    } else if (this.state === 'settled') {
      this._updateSettled(dt, gamePhase);
    }
  }

  _updateFlying(dt) {
    this.vy += this.gravity * dt;
    this.vx *= (1 - this.airResist * dt);

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.y >= this.waterY) {
      this.y  = this.waterY - 4;
      this._settledY = this.y;
      this.state = 'settled';
      this.vx = 0;
      this.vy = 0;
    }
  }

  _updateSettled(dt, gamePhase) {
    const t = performance.now() * 0.001;

    let targetY = this._settledY;

    if (gamePhase === 'bite') {
      // erratic violent motion
      targetY = this._settledY
        + Math.sin(t * 18) * 9
        + Math.sin(t * 31 + 1.1) * 5
        + Math.sin(t * 7)  * 3;
    } else if (gamePhase === 'waiting') {
      // gentle natural bobbing
      targetY = this._settledY
        + Math.sin(t * 2.2) * 2.5
        + Math.sin(t * 3.7) * 1.2;
    } else if (gamePhase === 'reeling') {
      // being pulled toward shore
      targetY = this._settledY + Math.sin(t * 6) * 4;
      const pullX = this._originX + (this.x - this._originX) * 0.98;
      this.x = pullX;
    }

    this.y = targetY;
  }

  get position() {
    return { x: this.x, y: this.y };
  }

  isSettled() { return this.state === 'settled'; }
  isFlying()  { return this.state === 'flying';  }
}
