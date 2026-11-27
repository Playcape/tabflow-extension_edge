/* ================================================================
   TabFlow — Live scene: particles
   One canvas for everything that falls, floats or flashes: rain (with
   ripples on the lake), snow, autumn leaves, spring petals, summer
   fireflies, lightning and the odd shooting star. Batched drawing,
   ~30 fps cap, and a single still frame when motion is reduced.
   ================================================================ */

import { mix } from './sky.js';

const FRAME_MS = 1000 / 31;
const AREA = 1440 * 900;
const LEAF_COLOURS = ['#d9822b', '#c4542a', '#e3b23c', '#a8442a', '#b86b2c'];
const PETAL_COLOURS = ['#f8c6d8', '#f3b0c8', '#fde2ec'];
const rand = (a, b) => a + Math.random() * (b - a);

export class Particles {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.cfg = { rain: 0, snow: 0, leaves: 0, petals: 0, fireflies: 0, lightning: false, stars: 0, wind: .2, light: 1, lakeY: 0, lakeBottom: 0, motion: 'full' };
    this.pools = { rain: [], snow: [], leaves: [], petals: [], fireflies: [] };
    this.ripples = [];
    this.flash = 0;
    this.bolt = null;
    this.meteor = null;
    this.nextStrike = 0;
    this.nextMeteor = 0;
    this.running = false;
    this.last = 0;
    this.raf = 0;
    this.w = 0; this.h = 0;
    this.loop = this.loop.bind(this);
  }

  resize() {
    const dpr = Math.min(globalThis.devicePixelRatio || 1, 1.5);
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.w = w; this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const pool of Object.values(this.pools)) pool.length = 0;
    this.populate();
    if (!this.running) this.draw();
  }

  configure(cfg) {
    const before = this.cfg;
    this.cfg = { ...before, ...cfg };
    if (cfg.lightning && !before.lightning) this.nextStrike = performance.now() + rand(1500, 4000);
    this.populate();
    const animate = this.cfg.motion !== 'still' && this.busy();
    if (animate && !document.hidden) this.start();
    else { this.stop(); this.draw(); }
  }

  busy() {
    const c = this.cfg;
    return c.rain > 0 || c.snow > 0 || c.leaves > .02 || c.petals > .02 || c.fireflies > .02 || c.lightning || c.stars > .5 || this.ripples.length > 0;
  }

  /** Scale each pool to its target size for the current area and motion level. */
  populate() {
    if (!this.w) return;
    const c = this.cfg;
    const scale = (this.w * this.h) / AREA * (c.motion === 'calm' ? .5 : 1);
    const target = {
      rain: Math.round(260 * c.rain * scale),
      snow: Math.round(240 * c.snow * scale),
      leaves: Math.round(26 * c.leaves * scale),
      petals: Math.round(30 * c.petals * scale),
      fireflies: Math.round(26 * c.fireflies * scale),
    };
    for (const [type, n] of Object.entries(target)) {
      const pool = this.pools[type];
      while (pool.length > n) pool.pop();
      while (pool.length < n) pool.push(this.spawn(type, true));
    }
  }

  spawn(type, anywhere = false) {
    const { w, h } = this;
    const y = anywhere ? rand(-h * .1, h) : rand(-h * .15, -10);
    const x = rand(-w * .15, w * 1.1);
    switch (type) {
      case 'rain': return { x, y, len: rand(12, 24), v: rand(900, 1300), a: rand(.18, .42) };
      case 'snow': { const r = rand(.7, 2.7); return { x, y, r, v: 22 + r * 22, phase: rand(0, 6.3), a: rand(.55, .95) }; }
      case 'leaves': return { x, y, s: rand(.8, 1.4), v: rand(38, 80), rot: rand(0, 6.3), spin: rand(-2.4, 2.4), phase: rand(0, 6.3), colour: LEAF_COLOURS[(Math.random() * LEAF_COLOURS.length) | 0] };
      case 'petals': return { x, y, s: rand(.6, 1.1), v: rand(22, 46), rot: rand(0, 6.3), spin: rand(-3, 3), phase: rand(0, 6.3), colour: PETAL_COLOURS[(Math.random() * PETAL_COLOURS.length) | 0] };
      case 'fireflies': {
        const top = Math.max(this.cfg.lakeY - h * .22, h * .45);
        return { x: rand(0, w), y: rand(top, h * .98), vx: rand(-14, 14), vy: rand(-8, 8), phase: rand(0, 6.3), top };
      }
      default: return {};
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.flash = 0;
    this.bolt = null;
    this.meteor = null;
  }

  loop(now) {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    if (now - this.last < FRAME_MS) return;
    const dt = Math.min(.06, (now - this.last) / 1000);
    this.last = now;
    this.step(dt, now);
    this.draw();
  }

  step(dt, now) {
    const { w, h, cfg } = this;
    const gust = (cfg.wind * 2 - .25);
    for (const p of this.pools.rain) {
      p.y += p.v * dt; p.x += gust * 260 * dt;
      if (p.y > h) {
        if (cfg.lakeY && p.y < h + 40 && Math.random() < .06 && this.ripples.length < 40) {
          this.ripples.push({ x: p.x, y: rand(cfg.lakeY + 6, Math.max(cfg.lakeY + 12, cfg.lakeBottom || h * .97)), t: 0 });
        }
        Object.assign(p, this.spawn('rain'));
      }
    }
    for (const p of this.pools.snow) {
      p.phase += dt * 1.3;
      p.y += p.v * dt; p.x += (Math.sin(p.phase) * 18 + gust * 70) * dt;
      if (p.y > h + 4 || p.x > w + 40 || p.x < -60) Object.assign(p, this.spawn('snow'));
    }
    for (const type of ['leaves', 'petals']) {
      for (const p of this.pools[type]) {
        p.phase += dt * 1.6; p.rot += p.spin * dt;
        p.y += p.v * dt * (.75 + Math.sin(p.phase) * .25);
        p.x += (Math.cos(p.phase) * 34 + gust * 120) * dt;
        if (p.y > h + 12 || p.x > w + 60 || p.x < -80) Object.assign(p, this.spawn(type));
      }
    }
    for (const p of this.pools.fireflies) {
      p.phase += dt * 1.8;
      p.vx += rand(-20, 20) * dt; p.vy += rand(-14, 14) * dt;
      p.vx = Math.max(-18, Math.min(18, p.vx)); p.vy = Math.max(-10, Math.min(10, p.vy));
      p.x = (p.x + p.vx * dt + w) % w; p.y = Math.max(p.top, Math.min(h, p.y + p.vy * dt));
    }
    for (const r of this.ripples) r.t += dt;
    this.ripples = this.ripples.filter((r) => r.t < .8);

    if (cfg.lightning && cfg.motion === 'full') {
      if (now >= this.nextStrike) {
        this.flash = 1;
        this.bolt = this.makeBolt();
        this.nextStrike = now + rand(5000, 13000);
      }
      this.flash = Math.max(0, this.flash - dt * 4.5);
      if (this.flash < .45) this.bolt = null;
    }
    if (cfg.stars > .5 && cfg.motion === 'full') {
      if (!this.meteor && now >= this.nextMeteor) {
        if (this.nextMeteor) this.meteor = { x: rand(w * .1, w * .8), y: rand(h * .05, h * .3), t: 0, dx: rand(.8, 1) * (Math.random() < .5 ? -1 : 1) };
        this.nextMeteor = now + rand(18000, 45000);
      }
      if (this.meteor && (this.meteor.t += dt) > .9) this.meteor = null;
    }
  }

  makeBolt() {
    const pts = [];
    let x = rand(this.w * .15, this.w * .85), y = 0;
    const end = (this.cfg.lakeY || this.h * .7) - rand(20, 120);
    while (y < end) { pts.push([x, y]); x += rand(-38, 38); y += rand(20, 55); }
    pts.push([x, end]);
    return pts;
  }

  draw() {
    const { ctx, w, h, cfg } = this;
    if (!w) return;
    ctx.clearRect(0, 0, w, h);
    const light = cfg.light;

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(225,232,255,${(this.flash * .32).toFixed(3)})`;
      ctx.fillRect(0, 0, w, h);
    }
    if (this.bolt) {
      ctx.save();
      ctx.strokeStyle = `rgba(240,244,255,${Math.min(1, this.flash + .2).toFixed(3)})`;
      ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(190,205,255,.9)'; ctx.shadowBlur = 14;
      ctx.beginPath();
      this.bolt.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
      ctx.restore();
    }
    if (this.meteor) {
      const m = this.meteor, p = m.t / .9, len = 140;
      const x = m.x + m.dx * p * 420, y = m.y + p * 160;
      const g = ctx.createLinearGradient(x, y, x - m.dx * len, y - len * .38);
      g.addColorStop(0, `rgba(255,255,255,${(1 - p).toFixed(2)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - m.dx * len, y - len * .38); ctx.stroke();
    }

    if (this.pools.rain.length) {
      const c = Math.round(150 + light * 70);
      const gust = (cfg.wind * 2 - .25) * 260;
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(${c},${c + 12},${Math.min(255, c + 36)},.38)`;
      ctx.beginPath();
      for (const p of this.pools.rain) {
        const k = p.len / p.v;
        ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - gust * k, p.y - p.len);
      }
      ctx.stroke();
    }
    if (this.ripples.length) {
      ctx.lineWidth = 1;
      for (const r of this.ripples) {
        const k = r.t / .8;
        ctx.strokeStyle = `rgba(220,230,245,${((1 - k) * .35).toFixed(3)})`;
        ctx.beginPath(); ctx.ellipse(r.x, r.y, 2 + k * 14, 1 + k * 4, 0, 0, Math.PI * 2); ctx.stroke();
      }
    }
    if (this.pools.snow.length) {
      ctx.fillStyle = `rgba(255,255,255,${(.6 + light * .3).toFixed(2)})`;
      ctx.beginPath();
      for (const p of this.pools.snow) { ctx.moveTo(p.x + p.r, p.y); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); }
      ctx.fill();
    }
    for (const type of ['leaves', 'petals']) {
      for (const p of this.pools[type]) {
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, .55 + Math.abs(Math.sin(p.phase)) * .45);
        ctx.fillStyle = mix('#1a1622', p.colour, .25 + light * .75);
        ctx.beginPath();
        if (type === 'leaves') { ctx.moveTo(-6 * p.s, 0); ctx.quadraticCurveTo(0, -4.5 * p.s, 6 * p.s, 0); ctx.quadraticCurveTo(0, 4.5 * p.s, -6 * p.s, 0); }
        else ctx.ellipse(0, 0, 3.6 * p.s, 2.4 * p.s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    if (this.pools.fireflies.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const p of this.pools.fireflies) {
        const a = Math.max(0, Math.sin(p.phase)) ** 2;
        if (a < .02) continue;
        ctx.fillStyle = `rgba(214,255,120,${(a * .16).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `rgba(238,255,170,${(a * .9).toFixed(3)})`;
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  destroy() {
    this.stop();
    for (const pool of Object.values(this.pools)) pool.length = 0;
    this.ripples = [];
    if (this.w) this.ctx.clearRect(0, 0, this.w, this.h);
  }
}
