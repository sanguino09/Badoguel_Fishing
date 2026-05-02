/* ============================================================
   GAME DATA – La Portiña, Talavera de la Reina
   ============================================================ */

export const TIMES = [
  { id: 'dawn',      label: 'Alba',       icon: '🌅', hour: 6  },
  { id: 'morning',   label: 'Mañana',     icon: '☀️', hour: 9  },
  { id: 'afternoon', label: 'Tarde',      icon: '🌤️', hour: 15 },
  { id: 'dusk',      label: 'Atardecer',  icon: '🌇', hour: 19 },
  { id: 'night',     label: 'Noche',      icon: '🌙', hour: 22 },
];

export const WEATHER_TYPES = [
  { id: 'sunny',  label: 'Soleado',  icon: '☀️',  actMod: -0.2, windStr: 0.3 },
  { id: 'cloudy', label: 'Nublado',  icon: '⛅', actMod: +0.2, windStr: 0.5 },
  { id: 'rainy',  label: 'Lluvioso', icon: '🌧️', actMod: +0.5, windStr: 0.7 },
  { id: 'windy',  label: 'Ventoso',  icon: '💨',  actMod: -0.1, windStr: 1.0 },
];

export const TECHNIQUES = [
  { id: 'fondo',    label: 'Fondo',    icon: '⚓', desc: 'Pesca en el fondo con plomo. Ideal para carpas y barbos.' },
  { id: 'flotador', label: 'Flotador', icon: '🔴', desc: 'A media agua. Versátil, para casi todo.' },
  { id: 'spinning', label: 'Spinning', icon: '🌀', desc: 'Señuelos artificiales. Solo depredadores.' },
];

export const BAITS = [
  { id: 'gusano',   name: 'Gusano',   icon: '🪱', desc: 'El clásico. Atrae a casi todos los peces.',       tech: ['fondo','flotador'] },
  { id: 'maiz',     name: 'Maíz',     icon: '🌽', desc: 'Favorito de carpas, barbos y bogas.',             tech: ['fondo','flotador'] },
  { id: 'boilies',  name: 'Boilies',  icon: '⚪', desc: 'Cebo pellet para carpas grandes. Muy selectivo.',  tech: ['fondo']           },
  { id: 'señuelo',  name: 'Señuelo',  icon: '🎣', desc: 'Señuelos artificiales para depredadores.',        tech: ['spinning']        },
  { id: 'masa',     name: 'Masa',     icon: '🍞', desc: 'Ideal para tenca, boga y barbo.',                 tech: ['fondo','flotador'] },
  { id: 'pez_vivo', name: 'Pez vivo', icon: '🐟', desc: 'El mejor cebo para lucio y siluro.',              tech: ['flotador','spinning'] },
  { id: 'tripa',    name: 'Tripa',    icon: '🩸', desc: 'Cebo de olor para pez gato y siluro nocturnos.',  tech: ['fondo']           },
];

export const FISH = [
  {
    id: 'alburno',
    name: 'Alburno',
    scientificName: 'Alburnus alburnus',
    description: 'El pez más abundante del pantano. Vive en grandes cardúmenes cerca de la superficie, especialmente activo al amanecer.',
    rarity: 'comun', rarityLabel: 'Común',
    weightMin: 0.05, weightMax: 0.3, points: 5,
    bodyColor: '#b8d8f0', finColor: '#7aaccc', accentColor: '#d0e8ff',
    shape: 'slim',
    biteStyle: 'quick',
    bestTimes: ['dawn', 'morning', 'afternoon'],
    bestBaits: ['gusano', 'masa'],
    bestTech: ['flotador'],
    depth: 'surface',
    catchWeight: 4,
    escapeMs: 2500,
    fightMs: 4000,
    fightStr: 0.25,
    pullRate: 0.08,
  },
  {
    id: 'boga',
    name: 'Boga',
    scientificName: 'Pseudochondrostoma polylepis',
    description: 'Especie endémica ibérica. Pez de cuerpo esbelto con boca orientada hacia abajo. Habita en aguas medias y fondos pedregosos del pantano.',
    rarity: 'comun', rarityLabel: 'Común',
    weightMin: 0.1, weightMax: 0.8, points: 10,
    bodyColor: '#a0c88a', finColor: '#6a9a5a', accentColor: '#c0e0a0',
    shape: 'slim',
    biteStyle: 'steady',
    bestTimes: ['morning', 'dusk', 'afternoon'],
    bestBaits: ['gusano', 'maiz', 'masa'],
    bestTech: ['flotador', 'fondo'],
    depth: 'mid',
    catchWeight: 5,
    escapeMs: 3000,
    fightMs: 6000,
    fightStr: 0.35,
    pullRate: 0.06,
  },
  {
    id: 'barbo',
    name: 'Barbo',
    scientificName: 'Luciobarbus bocagei',
    description: 'Icónico pez ibérico con cuatro barbillas bajo la boca. Busca el fondo con insistencia y sorprende por su fuerza cuando pica.',
    rarity: 'comun', rarityLabel: 'Común',
    weightMin: 0.3, weightMax: 4, points: 20,
    bodyColor: '#c8a86e', finColor: '#a08040', accentColor: '#e0c880',
    shape: 'round',
    biteStyle: 'steady',
    bestTimes: ['morning', 'dusk', 'dawn'],
    bestBaits: ['gusano', 'masa', 'maiz'],
    bestTech: ['fondo', 'flotador'],
    depth: 'bottom',
    catchWeight: 6,
    escapeMs: 3500,
    fightMs: 10000,
    fightStr: 0.55,
    pullRate: 0.05,
  },
  {
    id: 'tenca',
    name: 'Tenca',
    scientificName: 'Tinca tinca',
    description: 'Conocida como "el médico de los peces". Cuerpo robusto de color oliváceo oscuro. Vive entre la vegetación acuática del pantano.',
    rarity: 'comun', rarityLabel: 'Común',
    weightMin: 0.3, weightMax: 3, points: 25,
    bodyColor: '#4a7a2a', finColor: '#2a5010', accentColor: '#6a9a4a',
    shape: 'round',
    biteStyle: 'gentle',
    bestTimes: ['dawn', 'dusk'],
    bestBaits: ['gusano', 'masa'],
    bestTech: ['fondo', 'flotador'],
    depth: 'bottom',
    catchWeight: 5,
    escapeMs: 3000,
    fightMs: 10000,
    fightStr: 0.5,
    pullRate: 0.04,
  },
  {
    id: 'pez_gato',
    name: 'Pez Gato',
    scientificName: 'Ameiurus melas',
    description: 'Introducido desde Norteamérica. Especie invasora muy adaptable. Activo principalmente de noche, detecta la comida con sus barbillas sensoriales.',
    rarity: 'comun', rarityLabel: 'Común',
    weightMin: 0.1, weightMax: 1.5, points: 15,
    bodyColor: '#3a3020', finColor: '#222010', accentColor: '#504030',
    shape: 'catfish',
    biteStyle: 'slow',
    bestTimes: ['night', 'dusk'],
    bestBaits: ['gusano', 'tripa'],
    bestTech: ['fondo'],
    depth: 'bottom',
    catchWeight: 4,
    escapeMs: 3000,
    fightMs: 8000,
    fightStr: 0.4,
    pullRate: 0.05,
  },
  {
    id: 'carpa',
    name: 'Carpa Común',
    scientificName: 'Cyprinus carpio',
    description: 'La reina del pantano. Puede alcanzar pesos espectaculares. Pez inteligente y desconfiado que inspecciona el cebo con cautela. La pelea es memorable.',
    rarity: 'poco_comun', rarityLabel: 'Poco común',
    weightMin: 2, weightMax: 20, points: 50,
    bodyColor: '#c89030', finColor: '#906010', accentColor: '#e0b050',
    shape: 'big',
    biteStyle: 'powerful',
    bestTimes: ['dawn', 'dusk', 'night'],
    bestBaits: ['boilies', 'maiz', 'masa'],
    bestTech: ['fondo'],
    depth: 'bottom',
    catchWeight: 8,
    escapeMs: 4000,
    fightMs: 20000,
    fightStr: 0.75,
    pullRate: 0.04,
  },
  {
    id: 'carpa_espejo',
    name: 'Carpa Espejo',
    scientificName: 'Cyprinus carpio var. specularis',
    description: 'Variedad de carpa con escamas grandes e irregulares que brillan como espejos. Muy codiciada por los carpistas. Especialmente esquiva y difícil de engañar.',
    rarity: 'rara', rarityLabel: 'Rara',
    weightMin: 3, weightMax: 25, points: 100,
    bodyColor: '#d8a040', finColor: '#a87020', accentColor: '#f0c060',
    shape: 'big',
    biteStyle: 'powerful',
    bestTimes: ['dawn', 'night'],
    bestBaits: ['boilies', 'maiz'],
    bestTech: ['fondo'],
    depth: 'bottom',
    catchWeight: 10,
    escapeMs: 3500,
    fightMs: 26000,
    fightStr: 0.85,
    pullRate: 0.04,
  },
  {
    id: 'black_bass',
    name: 'Black Bass',
    scientificName: 'Micropterus salmoides',
    description: 'Depredador de origen americano muy agresivo. Embosca a sus presas desde la vegetación. Sus picadas son fulminantes y la pelea muy activa con múltiples saltos.',
    rarity: 'poco_comun', rarityLabel: 'Poco común',
    weightMin: 0.3, weightMax: 5, points: 60,
    bodyColor: '#3a6a3a', finColor: '#1a4a1a', accentColor: '#5a8a5a',
    shape: 'bass',
    biteStyle: 'aggressive',
    bestTimes: ['morning', 'afternoon'],
    bestBaits: ['señuelo', 'pez_vivo'],
    bestTech: ['spinning', 'flotador'],
    depth: 'mid',
    catchWeight: 6,
    escapeMs: 3000,
    fightMs: 14000,
    fightStr: 0.7,
    pullRate: 0.06,
  },
  {
    id: 'trucha',
    name: 'Trucha Arcoíris',
    scientificName: 'Oncorhynchus mykiss',
    description: 'Repoblada periódicamente en el pantano. Reconocible por la vistosa banda rosada lateral. Pez ágil y acrobático que salta fuera del agua al ser enganchado.',
    rarity: 'poco_comun', rarityLabel: 'Poco común',
    weightMin: 0.3, weightMax: 4, points: 55,
    bodyColor: '#78a878', finColor: '#489048', accentColor: '#e880a0',
    shape: 'trout',
    biteStyle: 'aggressive',
    bestTimes: ['morning', 'dawn', 'afternoon'],
    bestBaits: ['señuelo', 'gusano'],
    bestTech: ['spinning', 'flotador'],
    depth: 'mid',
    catchWeight: 5,
    escapeMs: 3000,
    fightMs: 12000,
    fightStr: 0.65,
    pullRate: 0.07,
  },
  {
    id: 'lucio',
    name: 'Lucio',
    scientificName: 'Esox lucius',
    description: 'El tiburón de los ríos ibéricos. Depredador solitario y paciente que embosca a sus presas con velocidad fulminante. La pelea de un lucio grande es una experiencia brutal.',
    rarity: 'rara', rarityLabel: 'Rara',
    weightMin: 1, weightMax: 12, points: 150,
    bodyColor: '#4a7040', finColor: '#2a5020', accentColor: '#6a9060',
    shape: 'pike',
    biteStyle: 'explosive',
    bestTimes: ['morning', 'dusk'],
    bestBaits: ['señuelo', 'pez_vivo'],
    bestTech: ['spinning', 'flotador'],
    depth: 'mid',
    catchWeight: 8,
    escapeMs: 2500,
    fightMs: 22000,
    fightStr: 0.9,
    pullRate: 0.05,
  },
  {
    id: 'siluro',
    name: 'Siluro',
    scientificName: 'Silurus glanis',
    description: '⚡ LEGENDARIO ⚡ El monstruo del pantano. Especie invasora que puede superar 30 kg y 2 metros. Solo aparece de noche. La lucha es épica y agotadora.',
    rarity: 'legendario', rarityLabel: 'Legendario',
    weightMin: 5, weightMax: 40, points: 500,
    bodyColor: '#28283a', finColor: '#181828', accentColor: '#484858',
    shape: 'siluro',
    biteStyle: 'monster',
    bestTimes: ['night'],
    bestBaits: ['pez_vivo', 'tripa'],
    bestTech: ['fondo'],
    depth: 'bottom',
    catchWeight: 15,
    escapeMs: 2000,
    fightMs: 45000,
    fightStr: 1.0,
    pullRate: 0.04,
  },
];

export const ESCAPE_MESSAGES = [
  '¡Dios mío, eso era enorme!',
  'El anzuelo se abrió en el último momento…',
  '¡Se cortó el sedal!',
  'Demasiada tensión, el nudo cedió',
  '¡Casi! La próxima vez…',
  'El pez era demasiado listo para el cebo',
  '¡Menudo salto dio para liberarse!',
  'El hilo se enredó en la vegetación',
  'Se escapó justo antes de la red',
];

export const ACHIEVEMENTS = [
  { id: 'first_catch',    title: 'Primera Captura',      icon: '🐟', desc: 'Captura tu primer pez',
    check: s => s.totalCatches >= 1 },
  { id: 'ten_catches',    title: 'Pescador',             icon: '🎣', desc: 'Captura 10 peces',
    check: s => s.totalCatches >= 10 },
  { id: 'collector_5',    title: 'Coleccionista',        icon: '📖', desc: 'Descubre 5 especies',
    check: s => s.speciesCount >= 5 },
  { id: 'collector_all',  title: 'Experto Local',        icon: '🏆', desc: 'Descubre las 11 especies',
    check: s => s.speciesCount >= 11 },
  { id: 'big_carp',       title: 'Carpista',             icon: '🥇', desc: 'Pesca una carpa de más de 10 kg',
    check: s => (s.records['carpa'] || 0) >= 10 },
  { id: 'mirror_carp',    title: 'La Joya del Pantano',  icon: '💎', desc: 'Captura una carpa espejo',
    check: s => (s.catches['carpa_espejo'] || 0) >= 1 },
  { id: 'predator',       title: 'Depredador',           icon: '🦈', desc: 'Captura un lucio',
    check: s => (s.catches['lucio'] || 0) >= 1 },
  { id: 'siluro_catch',   title: 'Leyenda del Pantano',  icon: '⚡', desc: 'Captura un siluro',
    check: s => (s.catches['siluro'] || 0) >= 1 },
  { id: 'night_fisher',   title: 'Pescador Nocturno',    icon: '🌙', desc: 'Captura 3 peces de noche',
    check: s => (s.nightCatches || 0) >= 3 },
  { id: 'points_100',     title: 'Centenario',           icon: '💯', desc: 'Acumula 100 puntos',
    check: s => s.totalPoints >= 100 },
  { id: 'points_1000',    title: 'Leyenda',              icon: '🌟', desc: 'Acumula 1000 puntos',
    check: s => s.totalPoints >= 1000 },
];

export function getFishById(id) {
  return FISH.find(f => f.id === id);
}

export function getBaitById(id) {
  return BAITS.find(b => b.id === id);
}

export function getTimeById(id) {
  return TIMES.find(t => t.id === id);
}

export function getWeatherById(id) {
  return WEATHER_TYPES.find(w => w.id === id);
}

export function selectFish(timeId, weatherId, baitId, techId) {
  const weather = getWeatherById(weatherId);
  const candidates = [];

  for (const fish of FISH) {
    let weight = 1;

    // time bonus
    if (fish.bestTimes.includes(timeId)) weight *= 3;

    // bait bonus
    if (fish.bestBaits.includes(baitId)) weight *= 4;
    else if (baitId === 'señuelo' && !['bass','pike'].includes(fish.shape)) weight *= 0.1;

    // technique filter
    if (fish.bestTech.includes(techId)) weight *= 2;
    else weight *= 0.3;

    // rarity inverse weight
    const rarityW = { comun: 10, poco_comun: 4, rara: 1.5, legendario: 0.3 };
    weight *= (rarityW[fish.rarity] || 5);

    // weather modifier
    weight *= (1 + weather.actMod);

    // night-only fish
    if (fish.id === 'siluro' && timeId !== 'night') weight *= 0.02;
    if (fish.id === 'pez_gato' && timeId !== 'night' && timeId !== 'dusk') weight *= 0.3;

    if (weight > 0) candidates.push({ fish, weight });
  }

  const total = candidates.reduce((s, c) => s + c.weight, 0);
  let r = Math.random() * total;
  for (const c of candidates) {
    r -= c.weight;
    if (r <= 0) return c.fish;
  }
  return candidates[candidates.length - 1].fish;
}

export function rollWeight(fish) {
  const span = fish.weightMax - fish.weightMin;
  // bell-ish distribution skewed toward lower end
  const r = Math.pow(Math.random(), 1.6);
  return +(fish.weightMin + span * r).toFixed(2);
}
