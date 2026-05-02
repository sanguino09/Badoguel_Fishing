/* ============================================================
   COLLECTION – localStorage persistence + stats
   ============================================================ */

import { FISH, ACHIEVEMENTS } from './data.js';

const KEY = 'portina_v2';

const DEFAULT = {
  catches:      {},   // { fishId: count }
  records:      {},   // { fishId: bestWeight }
  totalWeight:  {},   // { fishId: cumulative kg }
  totalCatches: 0,
  totalPoints:  0,
  speciesCount: 0,
  nightCatches: 0,
  achievements: [],   // [ achievementId ]
  sessions:     0,
  lastPlayed:   null,
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT };
  }
}

function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

export const Collection = {
  data: null,

  init() {
    this.data = load();
    this.data.sessions = (this.data.sessions || 0) + 1;
    this.data.lastPlayed = Date.now();
    save(this.data);
  },

  recordCatch(fish, weight, isNight) {
    const d = this.data;
    const id = fish.id;

    // first catch of this species?
    const isNew = !(d.catches[id] > 0);

    d.catches[id]      = (d.catches[id] || 0) + 1;
    d.totalWeight[id]  = +(((d.totalWeight[id] || 0) + weight).toFixed(3));
    d.totalCatches     = (d.totalCatches || 0) + 1;
    d.totalPoints      = (d.totalPoints  || 0) + fish.points;
    if (isNight) d.nightCatches = (d.nightCatches || 0) + 1;

    if (!d.records[id] || weight > d.records[id]) {
      d.records[id] = weight;
    }

    // recount species
    d.speciesCount = Object.keys(d.catches).filter(k => d.catches[k] > 0).length;

    // check achievements
    const newAchievements = [];
    for (const ach of ACHIEVEMENTS) {
      if (!d.achievements.includes(ach.id) && ach.check(d)) {
        d.achievements.push(ach.id);
        newAchievements.push(ach);
      }
    }

    save(d);
    return { isNew, newAchievements };
  },

  getCatchCount(fishId)  { return this.data.catches[fishId]     || 0; },
  getRecord(fishId)      { return this.data.records[fishId]     || 0; },
  getTotalWeight(fishId) { return this.data.totalWeight[fishId] || 0; },
  isCaught(fishId)       { return (this.data.catches[fishId] || 0) > 0; },

  getSummary() {
    const d = this.data;
    const totalW = Object.values(d.totalWeight).reduce((a, b) => a + b, 0);
    return {
      speciesCount: d.speciesCount || 0,
      totalCatches: d.totalCatches || 0,
      totalWeight:  +totalW.toFixed(1),
      totalPoints:  d.totalPoints  || 0,
    };
  },

  getTopCatches() {
    const d = this.data;
    return FISH
      .filter(f => d.catches[f.id] > 0)
      .sort((a, b) => (d.records[b.id] || 0) - (d.records[a.id] || 0))
      .slice(0, 5)
      .map(f => ({ fish: f, record: d.records[f.id], count: d.catches[f.id] }));
  },

  getAchievements() {
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: this.data.achievements.includes(a.id) }));
  },

  resetAll() {
    this.data = { ...DEFAULT };
    save(this.data);
  },
};
