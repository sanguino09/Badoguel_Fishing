/* ============================================================
   UI MANAGER – screen transitions + collection/stats rendering
   ============================================================ */

import { FISH, TIMES, WEATHER_TYPES, BAITS, TECHNIQUES, ACHIEVEMENTS, getBaitById, getTimeById } from './data.js';
import { Collection } from './collection.js';

export const Screens = {
  current: 'loading',

  show(id) {
    const prev = document.querySelector('.screen.active');
    const next = document.getElementById(`screen-${id}`);
    if (!next) return;
    if (prev) prev.classList.remove('active');
    next.classList.add('active', 'slide-in');
    next.addEventListener('animationend', () => next.classList.remove('slide-in'), { once: true });
    this.current = id;
  },
};

// ---- Setup screen ----
export function buildSetupScreen(state, onChange) {
  _buildChips('time-selector', TIMES, state.timeId, v => { state.timeId = v; onChange(); });
  _buildChips('weather-selector', WEATHER_TYPES, state.weatherId, v => { state.weatherId = v; onChange(); });
  _buildChips('technique-selector', TECHNIQUES, state.techId, v => {
    state.techId = v;
    // filter baits to valid for technique
    _buildBaitGrid('bait-grid', state, onChange);
    onChange();
  });
  _buildBaitGrid('bait-grid', state, onChange);
  updateFishHints(state);
}

function _buildChips(containerId, items, selected, onSelect) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `chip${item.id === selected ? ' selected' : ''}`;
    btn.innerHTML = `<span>${item.icon || ''}</span>${item.label}`;
    btn.addEventListener('click', () => {
      el.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      btn.classList.add('selected');
      onSelect(item.id);
    });
    el.appendChild(btn);
  });
}

function _buildBaitGrid(containerId, state, onChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  const validBaits = BAITS.filter(b => b.tech.includes(state.techId));
  if (!validBaits.find(b => b.id === state.baitId)) {
    state.baitId = validBaits[0]?.id || BAITS[0].id;
  }
  validBaits.forEach(bait => {
    const card = document.createElement('div');
    card.className = `bait-card${bait.id === state.baitId ? ' selected' : ''}`;
    card.innerHTML = `<div class="bait-icon">${bait.icon}</div><div class="bait-name">${bait.name}</div><div class="bait-desc">${bait.desc}</div>`;
    card.addEventListener('click', () => {
      el.querySelectorAll('.bait-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.baitId = bait.id;
      onChange();
    });
    el.appendChild(card);
  });
}

export function updateFishHints(state) {
  const list = document.getElementById('hints-list');
  if (!list) return;
  list.innerHTML = '';

  // score fish probability
  const scored = FISH.map(f => {
    let score = 0;
    if (f.bestTimes.includes(state.timeId)) score += 3;
    if (f.bestBaits.includes(state.baitId)) score += 4;
    if (f.bestTech.includes(state.techId))  score += 2;
    if (f.id === 'siluro' && state.timeId !== 'night') score = 0;
    return { fish: f, score };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);

  if (scored.length === 0) {
    list.innerHTML = '<span style="color:var(--text-muted);font-size:13px;">Poco probable con este equipo</span>';
    return;
  }

  scored.forEach(({ fish }) => {
    const pill = document.createElement('span');
    pill.className = `hint-pill${fish.rarity === 'rara' ? ' hint-rare' : fish.rarity === 'legendario' ? ' hint-legendary' : ''}`;
    pill.textContent = fish.name;
    list.appendChild(pill);
  });
}

// ---- In-game bait modal ----
export function buildBaitModal(state, onChange) {
  const el = document.getElementById('modal-bait-grid');
  if (!el) return;
  el.innerHTML = '';
  const validBaits = BAITS.filter(b => b.tech.includes(state.techId));
  validBaits.forEach(bait => {
    const card = document.createElement('div');
    card.className = `bait-card${bait.id === state.baitId ? ' selected' : ''}`;
    card.innerHTML = `<div class="bait-icon">${bait.icon}</div><div class="bait-name">${bait.name}</div><div class="bait-desc">${bait.desc}</div>`;
    card.addEventListener('click', () => {
      state.baitId = bait.id;
      onChange(bait);
    });
    el.appendChild(card);
  });
}

// ---- Collection screen ----
export function renderCollection(renderer) {
  const summary = Collection.getSummary();

  document.getElementById('coll-count').textContent       = `${summary.speciesCount}/${FISH.length}`;
  document.getElementById('coll-prog-fill').style.width   = `${(summary.speciesCount / FISH.length) * 100}%`;
  document.getElementById('sum-catches').textContent      = summary.totalCatches;
  document.getElementById('sum-weight').textContent       = `${summary.totalWeight} kg`;
  document.getElementById('sum-points').textContent       = summary.totalPoints;

  const grid = document.getElementById('fish-grid');
  if (!grid) return;
  grid.innerHTML = '';

  FISH.forEach((fish, i) => {
    const caught = Collection.isCaught(fish.id);
    const card = document.createElement('div');
    card.className = `fish-card${caught ? '' : ' locked'}`;
    card.style.animationDelay = `${i * 0.04}s`;

    const cvs = document.createElement('canvas');
    cvs.width  = 160;
    cvs.height = 100;

    if (caught) {
      renderer.drawFishCard(cvs, fish, '#0a1628');
    } else {
      const ctx = cvs.getContext('2d');
      ctx.fillStyle = '#0a1628';
      ctx.fillRect(0, 0, 160, 100);
      ctx.fillStyle = '#1a2840';
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❓', 80, 60);
    }

    const body = document.createElement('div');
    body.className = 'fish-card-body';

    const nameEl = document.createElement('div');
    nameEl.className = 'fish-card-name';
    nameEl.textContent = caught ? fish.name : '???';

    const infoEl = document.createElement('div');
    infoEl.className = 'fish-card-info';

    if (caught) {
      const countEl = document.createElement('span');
      countEl.className = 'fish-card-count';
      countEl.textContent = `×${Collection.getCatchCount(fish.id)}`;

      const tag = document.createElement('span');
      tag.className = `rarity-tag rarity-${fish.rarity}`;
      tag.textContent = fish.rarityLabel;

      infoEl.appendChild(countEl);
      infoEl.appendChild(tag);
    } else {
      const hint = document.createElement('span');
      hint.className = 'fish-card-locked-text';
      const timeName = fish.bestTimes[0] ? (TIMES.find(t => t.id === fish.bestTimes[0])?.label || '?') : '?';
      hint.textContent = `${timeName} · ${fish.depth}`;
      infoEl.appendChild(hint);
    }

    body.appendChild(nameEl);
    body.appendChild(infoEl);
    card.appendChild(cvs);
    card.appendChild(body);

    if (caught) {
      card.addEventListener('click', () => showFishModal(fish, renderer));
    }
    grid.appendChild(card);
  });
}

// ---- Fish detail modal ----
export function showFishModal(fish, renderer) {
  const modal = document.getElementById('modal-fish');
  if (!modal) return;

  const cvs = document.getElementById('modal-canvas');
  renderer.drawFishCard(cvs, fish, '#061428');

  document.getElementById('modal-name').textContent        = fish.name;
  document.getElementById('modal-scientific').textContent  = fish.scientificName;
  document.getElementById('modal-desc').textContent        = fish.description;
  document.getElementById('modal-weight-range').textContent = `${fish.weightMin}–${fish.weightMax} kg`;
  document.getElementById('modal-pts').textContent         = fish.points;

  const rec = Collection.getRecord(fish.id);
  document.getElementById('modal-best').textContent    = rec ? `${rec} kg` : '— kg';
  document.getElementById('modal-total').textContent   = Collection.getCatchCount(fish.id);

  const bait = getBaitById(fish.bestBaits[0]);
  document.getElementById('modal-bait').textContent = bait ? `${bait.icon} ${bait.name}` : '—';

  const time = getTimeById(fish.bestTimes[0]);
  document.getElementById('modal-time').textContent = time ? `${time.icon} ${time.label}` : '—';

  const tag = document.getElementById('modal-rarity');
  tag.textContent = fish.rarityLabel;
  tag.className = `rarity-tag rarity-${fish.rarity}`;

  modal.classList.remove('hidden');
}

export function hideFishModal() {
  document.getElementById('modal-fish')?.classList.add('hidden');
}

// ---- Stats screen ----
export function renderStats() {
  const body = document.getElementById('stats-body');
  if (!body) return;
  body.innerHTML = '';

  const summary = Collection.getSummary();
  const top = Collection.getTopCatches();
  const achs = Collection.getAchievements();

  // General stats
  const general = _section('📊 Totales');
  _row(general, 'Capturas totales', summary.totalCatches);
  _row(general, 'Especies descubiertas', `${summary.speciesCount} / ${FISH.length}`);
  _row(general, 'Peso total pescado', `${summary.totalWeight} kg`);
  _row(general, 'Puntos acumulados', summary.totalPoints, 'gold');
  _row(general, 'Sesiones de pesca', Collection.data.sessions || 0);
  body.appendChild(general);

  // Top catches
  if (top.length > 0) {
    const topSec = _section('🏆 Mejores Capturas');
    top.forEach(({ fish, record, count }) => {
      _row(topSec, fish.name, `${record} kg (×${count})`);
    });
    body.appendChild(topSec);
  }

  // Achievements
  const achSec = _section('🎖️ Logros');
  const achGrid = document.createElement('div');
  achGrid.className = 'achievement-grid';
  achs.forEach(a => {
    const item = document.createElement('div');
    item.className = `achievement-item${a.unlocked ? '' : ' locked'}`;
    item.innerHTML = `
      <span class="achievement-icon">${a.icon}</span>
      <div class="achievement-text">
        <div class="achievement-title">${a.title}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>
      <span class="achievement-check">${a.unlocked ? '✅' : '🔒'}</span>
    `;
    achGrid.appendChild(item);
  });
  achSec.appendChild(achGrid);
  body.appendChild(achSec);
}

function _section(title) {
  const sec = document.createElement('div');
  sec.className = 'stats-section';
  const h = document.createElement('div');
  h.className = 'stats-section-title';
  h.textContent = title;
  sec.appendChild(h);
  return sec;
}

function _row(parent, label, value, cls = '') {
  const row = document.createElement('div');
  row.className = 'stats-row';
  row.innerHTML = `<span class="stats-row-label">${label}</span><span class="stats-row-value ${cls}">${value}</span>`;
  parent.appendChild(row);
}

// ---- Catch screen ----
export function showCatchScreen(fish, weight, isNew, renderer) {
  const cvs = document.getElementById('catch-canvas');
  renderer.drawFishCard(cvs, fish, '#061c0e');

  document.getElementById('catch-badge').textContent     = isNew ? '¡PRIMERA VEZ!' : '¡CAPTURA!';
  document.getElementById('new-species-badge').style.display = isNew ? 'inline' : 'none';
  document.getElementById('catch-name').textContent      = fish.name;
  document.getElementById('catch-scientific').textContent = fish.scientificName;
  document.getElementById('catch-desc').textContent      = fish.description;
  document.getElementById('catch-weight').textContent    = `${weight} kg`;
  document.getElementById('catch-points').textContent    = `+${fish.points}`;
  document.getElementById('catch-count-val').textContent = Collection.getCatchCount(fish.id);

  const rec = Collection.getRecord(fish.id);
  document.getElementById('catch-record').textContent = rec ? `${rec} kg` : '— kg';

  const tag = document.getElementById('catch-rarity');
  tag.textContent = fish.rarityLabel;
  tag.className = `rarity-tag rarity-${fish.rarity}`;
}

// ---- Escape screen ----
export function showEscapeScreen(fish, message) {
  document.getElementById('escape-msg').textContent       = message;
  document.getElementById('escape-fish-name').textContent = fish?.name || 'pez misterioso';
}

// ---- HUD update ----
export function updateGameHUD(timeId, weatherId, catchCount) {
  const time    = TIMES.find(t => t.id === timeId);
  const weather = WEATHER_TYPES.find(w => w.id === weatherId);

  const timeIcon = document.getElementById('hud-time-icon');
  const timeTxt  = document.getElementById('hud-time-text');
  const wIcon    = document.getElementById('hud-weather-icon');
  const cnt      = document.getElementById('hud-catch-count');

  if (timeIcon) timeIcon.textContent = time?.icon || '☀️';
  if (timeTxt)  timeTxt.textContent  = time?.label || '';
  if (wIcon)    wIcon.textContent    = weather?.icon || '☀️';
  if (cnt)      cnt.textContent      = catchCount || 0;
}

export function updateStatusText(txt) {
  const el = document.getElementById('status-text');
  if (el) el.textContent = txt;
}

export function setCastButton(mode) {
  const btn   = document.getElementById('btn-cast');
  const icon  = document.getElementById('cast-btn-icon');
  const label = document.getElementById('cast-btn-label');
  if (!btn) return;

  btn.classList.remove('reel-mode', 'bite-mode');

  switch (mode) {
    case 'cast':
      icon.textContent  = '🎣';
      label.textContent = 'LANZAR';
      break;
    case 'waiting':
      icon.textContent  = '⏳';
      label.textContent = 'ESPERANDO';
      break;
    case 'bite':
      icon.textContent  = '⚡';
      label.textContent = '¡COGE!';
      btn.classList.add('bite-mode');
      break;
    case 'reel':
      icon.textContent  = '🔄';
      label.textContent = '¡CARRETAR!';
      btn.classList.add('reel-mode');
      break;
    case 'wait':
      icon.textContent  = '✈️';
      label.textContent = 'EN VUELO';
      break;
    default:
      icon.textContent  = '🎣';
      label.textContent = 'LANZAR';
  }
}

// ---- Menu env pills ----
export function updateMenuPills(timeId, weatherId) {
  const time    = TIMES.find(t => t.id === timeId);
  const weather = WEATHER_TYPES.find(w => w.id === weatherId);
  const wp = document.getElementById('menu-weather-pill');
  const tp = document.getElementById('menu-time-pill');
  if (wp) wp.textContent = `${weather?.icon || '☀️'} ${weather?.label || 'Soleado'}`;
  if (tp) tp.textContent = `${time?.icon || '☀️'} ${time?.label || 'Mañana'}`;
}
